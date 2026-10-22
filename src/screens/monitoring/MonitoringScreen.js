import React, { useEffect, useState } from 'react';
import { AppState, View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { monitoringService, readingState, readingTime, readingValue, alertTitle } from '../../services/monitoringService';
export default function MonitoringScreen({ navigation, route }) {
  const patientId = route.params?.patientId;
  const focused = useIsFocused();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(null);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    if (!focused) return;
    let active = true, pending = false;
    setData(null); setError('');
    const load = async () => {
      if (AppState.currentState !== 'active' || pending) return;
      pending = true;
      try { const next = await (patientId ? monitoringService.patient(patientId) : monitoringService.patients()); if (active) { setData(next); setError(''); } }
      catch { if (active) setError('No se pudo actualizar el monitoreo. Las lecturas mostradas pueden estar desactualizadas.'); }
      finally { pending = false; }
    };
    load(); const timer = setInterval(load, 10000);
    const subscription = AppState.addEventListener('change', state => { if (state === 'active') load(); });
    return () => { active = false; clearInterval(timer); subscription.remove(); };
  }, [patientId, focused, revision]);
  async function acknowledge(id) {
    setBusy(id);
    try { await monitoringService.acknowledge(id); setRevision(value => value + 1); }
    catch { setError('No se pudo reconocer la alerta. Intenta nuevamente.'); }
    finally { setBusy(null); }
  }
  const patients = patientId ? (data ? [data] : []) : data || [];
  return <View style={styles.container}>
    <View style={styles.header}><TouchableOpacity accessibilityLabel={patientId ? 'Volver a pacientes' : 'Abrir menú'} onPress={() => patientId ? navigation.goBack() : navigation.getParent()?.openDrawer()}><Ionicons name={patientId ? 'arrow-back' : 'menu'} size={26} color="#fff" /></TouchableOpacity><Text style={styles.title}>Monitoreo de pacientes</Text></View>
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.text}>Lecturas del ESP32 y alertas. Se actualizan cada 10 segundos mientras esta pantalla está abierta.</Text>
      <TouchableOpacity accessibilityRole="button" style={styles.button} onPress={() => setRevision(v => v + 1)}><Text style={styles.buttonText}>Actualizar</Text></TouchableOpacity>
      {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
      {!data && !error && <ActivityIndicator accessibilityLabel="Cargando monitoreo" color="#667eea" />}
      {data && !patients.length && <Text style={styles.text}>No hay pacientes disponibles para monitoreo.</Text>}
      {patients.map(patient => <View style={styles.card} key={patient.patient_id}>
        <Text style={styles.name}>{patient.name}</Text><Text style={styles.status}>{readingState(patient)}</Text>
        <Text style={styles.text}>Dispositivo: {patient.device?.device_id || 'Sin asignar'}</Text>
        <Text style={styles.text}>Última lectura: {readingTime(patient.latest?.timestamp)}</Text>
        <View style={styles.readings}>{[['Pulso',patient.latest?.heart_rate,'lpm'],['SpO₂',patient.latest?.spo2,'%'],['Movimiento',patient.latest?.movement == null ? null : patient.latest.movement ? 'Detectado' : 'En reposo',''],['Temperatura del sensor',patient.latest?.temperature,'°C']].map(([label,value,unit]) => <View style={styles.reading} key={label}><Text style={styles.text}>{label}</Text><Text style={styles.value}>{readingValue(value,unit)}</Text></View>)}</View>
        <Text style={styles.note}>La temperatura del sensor no corresponde a la temperatura corporal.</Text>
        {!patientId ? <><Text style={styles.text}>{(patient.alerts || []).filter(a => !a.acknowledged).length} alertas pendientes</Text><TouchableOpacity accessibilityRole="button" style={styles.button} onPress={() => navigation.navigate('MonitoreoDetalle',{patientId:patient.patient_id})}><Text style={styles.buttonText}>Ver lecturas y alertas</Text></TouchableOpacity></> : <>
          <Text style={styles.name}>Alertas</Text>{!(patient.alerts || []).length && <Text style={styles.text}>Sin alertas registradas.</Text>}
          {(patient.alerts || []).map(alert => <View style={styles.alert} key={alert.id}><Text style={styles.alertTitle}>{alertTitle(alert)}</Text><Text style={styles.text}>{readingTime(alert.timestamp)}</Text><Text style={styles.text}>{alert.acknowledged ? 'Reconocida' : 'Pendiente de revisión'}</Text>{!alert.acknowledged && <TouchableOpacity accessibilityRole="button" disabled={busy !== null} style={[styles.button,busy !== null && styles.disabled]} onPress={() => acknowledge(alert.id)}><Text style={styles.buttonText}>{busy === alert.id ? 'Guardando…' : 'Reconocer alerta'}</Text></TouchableOpacity>}</View>)}
          <Text style={styles.name}>Historial reciente</Text>{!(patient.history || []).length && <Text style={styles.text}>Sin mediciones registradas.</Text>}
          {(patient.history || []).map((reading,index) => <View style={styles.history} key={reading.id || index}><Text style={styles.text}>{readingTime(reading.timestamp)}</Text><Text style={styles.text}>Pulso: {readingValue(reading.heart_rate,'lpm')} · SpO₂: {readingValue(reading.spo2,'%')}</Text></View>)}
        </>}
      </View>)}
    </ScrollView>
  </View>;
}
const styles = StyleSheet.create({container:{flex:1,backgroundColor:'#f7fafc'},header:{backgroundColor:'#667eea',paddingTop:54,paddingBottom:20,paddingHorizontal:20,flexDirection:'row',alignItems:'center',gap:12},title:{color:'#fff',fontSize:20,fontWeight:'700',flex:1},content:{padding:20,paddingBottom:40},text:{color:'#4a5568',fontSize:14,lineHeight:21,marginVertical:4},name:{fontSize:20,fontWeight:'700',color:'#2d3748',marginVertical:12},card:{backgroundColor:'#fff',borderRadius:12,padding:20,marginVertical:10,borderWidth:1,borderColor:'#e2e8f0'},status:{color:'#2d3748',backgroundColor:'#edf2f7',padding:8,borderRadius:6,alignSelf:'flex-start',marginBottom:10},readings:{flexDirection:'row',flexWrap:'wrap',marginTop:12},reading:{width:'50%',paddingVertical:10,paddingRight:8},value:{fontSize:22,fontWeight:'700',color:'#2d3748'},note:{fontSize:12,color:'#4a5568',marginVertical:12},button:{backgroundColor:'#667eea',padding:14,borderRadius:8,alignItems:'center',marginVertical:12},buttonText:{color:'#fff',fontWeight:'600',fontSize:14},error:{backgroundColor:'#fff5f5',color:'#9b2c2c',padding:16,marginVertical:12},alert:{backgroundColor:'#fff5f5',borderLeftWidth:4,borderLeftColor:'#e53e3e',padding:14,marginVertical:8},alertTitle:{fontWeight:'700',fontSize:16,color:'#9b2c2c'},history:{borderBottomWidth:1,borderBottomColor:'#e2e8f0',paddingVertical:10},disabled:{opacity:.6}});
