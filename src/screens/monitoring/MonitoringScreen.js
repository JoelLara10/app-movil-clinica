import { registerMonitoringPush, unregisterMonitoringPush } from '../../services/monitoringNotifications';
import { useAuth } from '../../context/AuthContext';
import { getMonitoringCache, loadMonitoringCache, monitoringCacheKey } from '../../services/monitoringCache';
import React, { useEffect, useState, useRef } from 'react';
import { AppState, View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { monitoringService, readingState, readingTime, readingValue, alertTitle } from '../../services/monitoringService';
import { useLanguage } from '../../context/LanguageContext';
export default function MonitoringScreen({ navigation, route }) {
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const patientId = route.params?.patientId;
  const insets = useSafeAreaInsets();
  const goBack = () => patientId ? (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Monitoreo')) : navigation.navigate('Dashboard');
  const focused = useIsFocused();
  const [page, setPage] = useState(1);
  const [historyPage, setHistoryPage] = useState(1);
  const [alertsPage, setAlertsPage] = useState(1);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const historyBefore = useRef(null);
  const [snapshot, setSnapshot] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [fromCache, setFromCache] = useState(false);
  const owner = user?.id || user?.username || 'session';
  const key = monitoringCacheKey(owner, patientId, page, historyPage, alertsPage, query, historyPage > 1 ? historyBefore.current : null);
  const data = snapshot?.key === key ? snapshot.data : null;
  useEffect(() => {
    setHistoryPage(1); setAlertsPage(1); historyBefore.current = null;
  }, [patientId]);
  useEffect(() => {
    const timer = setTimeout(() => { setQuery(search.trim()); setPage(1); }, 300);
    return () => clearTimeout(timer);
  }, [search]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(null);
  const [revision, setRevision] = useState(0);
  const [pushStatus, setPushStatus] = useState(null);
  const [pushBusy, setPushBusy] = useState(false);
  async function togglePush() {
    setPushBusy(true);
    try { if (pushStatus === 'pushEnabled') { await unregisterMonitoringPush(); setPushStatus('pushDisabled'); }
      else setPushStatus(await registerMonitoringPush(lang, true)); }
    catch { setPushStatus('pushError'); } finally { setPushBusy(false); }
  }
  useEffect(() => {
    if (!focused) return;
    let active = true, pending = false;
    const cached = getMonitoringCache(key);
    setSnapshot(cached ? { ...cached, key } : null); setFromCache(!!cached); setError('');
    const load = async () => {
      if (AppState.currentState !== 'active' || pending) return;
      pending = true;
      if (active) setRefreshing(true);
      try {
        const next = await loadMonitoringCache(key, () => patientId
          ? monitoringService.patient(patientId, historyPage, alertsPage, historyPage > 1 ? historyBefore.current : undefined)
          : monitoringService.patients(page, query));
        if (active) {
          setSnapshot({ ...next, key }); setFromCache(false); setError('');
          if (patientId && historyPage === 1) historyBefore.current = next.data?.history_pagination?.as_of || null;
        }
      }
      catch (error) { if (active && error.code !== 'ERR_SESSION_CHANGED') setError('patientMonitoring.loadError'); }
      finally { pending = false; if (active) setRefreshing(false); }
    };
    load(); const timer = setInterval(load, 10000);
    const subscription = AppState.addEventListener('change', state => { if (state === 'active') load(); });
    return () => { active = false; clearInterval(timer); subscription.remove(); };
  }, [patientId, focused, revision, key]);
  async function acknowledge(id) {
    setBusy(id);
    try { await monitoringService.acknowledge(id); setRevision(value => value + 1); }
    catch { setError('patientMonitoring.ackError'); }
    finally { setBusy(null); }
  }
  const patients = patientId ? (data ? [data] : []) : (Array.isArray(data) ? data : data?.data) || [];
  return <View style={styles.container}>
    <LinearGradient colors={['#667eea', '#764ba2']} style={[styles.header, { paddingTop: Math.max(insets.top, 16) + 12 }]}>
      <View style={styles.headerRow}>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel={patientId ? t('patientMonitoring.backPatients') : t('patientMonitoring.backHome')} style={styles.backButton} onPress={goBack}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
        <Text style={styles.title}>{t('patientMonitoring.title')}</Text>
        <View style={styles.headerIcon}><Ionicons name="pulse-outline" size={25} color="#fff" /></View>
      </View>
      <Text style={styles.subtitle}>{patientId ? t('patientMonitoring.patientSubtitle') : t('patientMonitoring.listSubtitle')}</Text>
    </LinearGradient>
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.text}>{t('patientMonitoring.description')}</Text>
      <View style={styles.card}><Text style={styles.text}>{t('patientMonitoring.pushInfo')}</Text>
        {pushStatus && <Text accessibilityLiveRegion="polite" style={styles.note}>{t(`patientMonitoring.${pushStatus}`)}</Text>}
        <TouchableOpacity accessibilityRole="button" disabled={pushBusy} style={[styles.button, pushBusy && styles.disabled]} onPress={togglePush}><Text style={styles.buttonText}>{t(pushStatus === 'pushEnabled' ? 'patientMonitoring.pushDisable' : 'patientMonitoring.pushEnable')}</Text></TouchableOpacity>
      </View>
      {!patientId && <TextInput accessibilityLabel={t('patientMonitoring.search')} placeholder={t('patientMonitoring.search')} value={search} onChangeText={setSearch} style={styles.search} />}
      {(refreshing || snapshot) && <Text accessibilityLiveRegion="polite" style={styles.note}>{refreshing ? t('patientMonitoring.refreshing') : fromCache ? t('patientMonitoring.cached') : t('patientMonitoring.updated', { time: readingTime(snapshot?.savedAt, lang, t) })}</Text>}
      {!patientId && <MonitoringPager meta={data?.pagination} onChange={setPage} disabled={refreshing} t={t} label={t('patientMonitoring.patientsPages')} />}
      <TouchableOpacity accessibilityRole="button" style={styles.button} onPress={() => setRevision(v => v + 1)}><Text style={styles.buttonText}>{t('patientMonitoring.refresh')}</Text></TouchableOpacity>
      {!!error && <Text accessibilityRole="alert" style={styles.error}>{t(error)}</Text>}
      {!data && !error && <ActivityIndicator accessibilityLabel={t('patientMonitoring.loading')} color="#667eea" />}
      {data && !patients.length && <Text style={styles.text}>{t('patientMonitoring.empty')}</Text>}
      {patients.map(patient => <View style={styles.card} key={patient.patient_id}>
        <View style={styles.patientHeading}><View style={styles.patientIcon}><Ionicons name="person-outline" size={22} color="#764ba2" /></View><Text style={styles.name}>{patient.name}</Text></View><Text style={styles.status}>{readingState(patient, t)}</Text>
        <Text style={styles.text}>{t('patientMonitoring.device')}: {patient.device?.device_id || t('patientMonitoring.unassigned')}</Text>
        <Text style={styles.text}>{t('patientMonitoring.lastReading')}: {readingTime(patient.latest?.timestamp, lang, t)}</Text>
        <View style={styles.readings}>{[[t('patientMonitoring.pulse'),patient.latest?.heart_rate,t('patientMonitoring.pulseUnit'),'heart-outline'],[t('patientMonitoring.oxygen'),patient.latest?.spo2,'%','water-outline'],[t('patientMonitoring.movement'),patient.latest?.movement == null ? null : patient.latest.movement ? t('patientMonitoring.detected') : t('patientMonitoring.resting'),'','walk-outline'],[t('patientMonitoring.sensorTemperature'),patient.latest?.temperature,'°C','thermometer-outline']].map(([label,value,unit,icon]) => <View style={styles.reading} key={label}><Ionicons name={icon} size={21} color="#764ba2" /><Text style={styles.text}>{label}</Text><Text style={styles.value}>{readingValue(value,unit,t)}</Text></View>)}</View>
        <Text style={styles.note}>{t('patientMonitoring.sensorNote')}</Text>
        {!patientId ? <><Text style={styles.text}>{t('patientMonitoring.pendingCount', { count: patient.pending_alert_count ?? (patient.alerts || []).filter(a => !a.acknowledged).length })}</Text><TouchableOpacity accessibilityRole="button" style={styles.button} onPress={() => navigation.navigate('MonitoreoDetalle',{patientId:patient.patient_id})}><Text style={styles.buttonText}>{t('patientMonitoring.viewDetails')}</Text></TouchableOpacity></> : <>
          <Text style={styles.name}>{t('patientMonitoring.alerts')}</Text><MonitoringPager meta={patient.alerts_pagination} onChange={setAlertsPage} disabled={refreshing} t={t} label={t('patientMonitoring.alerts')} />{!(patient.alerts || []).length && <Text style={styles.text}>{t('patientMonitoring.noAlerts')}</Text>}
          {(patient.alerts || []).map(alert => <View style={[styles.alert, alert.acknowledged && styles.alertAcknowledged]} key={alert.id}><Text style={styles.alertTitle}>{alertTitle(alert, t)}</Text><Text style={styles.text}>{readingTime(alert.timestamp, lang, t)}</Text><Text style={styles.text}>{alert.acknowledged ? t('patientMonitoring.acknowledged') : t('patientMonitoring.pendingReview')}</Text>{!alert.acknowledged && <TouchableOpacity accessibilityRole="button" disabled={busy !== null} style={[styles.button,busy !== null && styles.disabled]} onPress={() => acknowledge(alert.id)}><Text style={styles.buttonText}>{busy === alert.id ? t('patientMonitoring.saving') : t('patientMonitoring.acknowledge')}</Text></TouchableOpacity>}</View>)}
          <Text style={styles.name}>{t('patientMonitoring.history')}</Text><MonitoringPager meta={patient.history_pagination} onChange={setHistoryPage} disabled={refreshing} t={t} label={t('patientMonitoring.history')} />{!(patient.history || []).length && <Text style={styles.text}>{t('patientMonitoring.noHistory')}</Text>}
          {(patient.history || []).map((reading,index) => <View style={styles.history} key={reading.id || index}><Text style={styles.text}>{readingTime(reading.timestamp, lang, t)}</Text><Text style={styles.text}>{t('patientMonitoring.pulse')}: {readingValue(reading.heart_rate,t('patientMonitoring.pulseUnit'),t)} · {t('patientMonitoring.oxygen')}: {readingValue(reading.spo2,'%',t)}</Text></View>)}
        </>}
      </View>)}
    </ScrollView>
  </View>;
}
function MonitoringPager({ meta, onChange, disabled, t, label }) {
  if (!meta || meta.total_pages <= 1) return null;
  return <View style={styles.pager} accessibilityLabel={label}>
    <TouchableOpacity accessibilityRole="button" accessibilityLabel={`${label}: ${t('patientMonitoring.previous')}`} disabled={disabled || meta.page <= 1} style={[styles.pageButton, (disabled || meta.page <= 1) && styles.disabled]} onPress={() => onChange(meta.page - 1)}><Text style={styles.buttonText}>{t('patientMonitoring.previous')}</Text></TouchableOpacity>
    <Text style={styles.text}>{t('patientMonitoring.page', { page: meta.page, pages: meta.total_pages, total: meta.total })}</Text>
    <TouchableOpacity accessibilityRole="button" accessibilityLabel={`${label}: ${t('patientMonitoring.next')}`} disabled={disabled || meta.page >= meta.total_pages} style={[styles.pageButton, (disabled || meta.page >= meta.total_pages) && styles.disabled]} onPress={() => onChange(meta.page + 1)}><Text style={styles.buttonText}>{t('patientMonitoring.next')}</Text></TouchableOpacity>
  </View>;
}
const styles = StyleSheet.create({
  pager:{flexDirection:'row',flexWrap:'wrap',gap:8,alignItems:'center',justifyContent:'space-between',marginVertical:12},
  pageButton:{backgroundColor:'#6953a5',minHeight:44,padding:12,borderRadius:10,justifyContent:'center'},
  search:{borderWidth:1,borderColor:'#d7c9eb',backgroundColor:'#fff',borderRadius:12,padding:14,color:'#493765',marginVertical:12},
  container:{flex:1,backgroundColor:'#f3f1fa'},
  header:{paddingBottom:24,paddingHorizontal:18,borderBottomLeftRadius:28,borderBottomRightRadius:28},
  headerRow:{flexDirection:'row',alignItems:'center',gap:10},
  backButton:{width:44,height:44,borderRadius:22,backgroundColor:'rgba(255,255,255,0.18)',alignItems:'center',justifyContent:'center'},
  headerIcon:{width:36,alignItems:'center'},
  title:{color:'#fff',fontSize:20,fontWeight:'800',flex:1,lineHeight:26},
  subtitle:{color:'#f0edff',fontSize:14,lineHeight:20,marginTop:12,marginLeft:4},
  content:{padding:16,paddingBottom:40,width:'100%',maxWidth:1000,alignSelf:'center'},
  text:{color:'#4a5568',fontSize:14,lineHeight:21,marginVertical:4},
  patientHeading:{flexDirection:'row',alignItems:'center',gap:10,marginBottom:12},
  patientIcon:{width:42,height:42,borderRadius:14,backgroundColor:'#ece8fa',alignItems:'center',justifyContent:'center'},
  name:{fontSize:19,fontWeight:'800',color:'#493765',marginVertical:12,flexShrink:1},
  card:{backgroundColor:'#fff',borderRadius:20,padding:18,marginVertical:10,borderWidth:1,borderColor:'#e2dcf1',borderTopWidth:4,borderTopColor:'#8b72bc'},
  status:{color:'#51416e',backgroundColor:'#eee9fa',paddingVertical:8,paddingHorizontal:12,borderRadius:8,alignSelf:'flex-start',marginBottom:10,fontSize:13,fontWeight:'600'},
  readings:{flexDirection:'row',flexWrap:'wrap',gap:10,marginTop:16},
  reading:{flexGrow:1,flexBasis:'45%',padding:12,borderRadius:12,backgroundColor:'#f4f1fb',borderWidth:1,borderColor:'#e8e1f4',minWidth:105},
  value:{fontSize:21,fontWeight:'800',color:'#543b7a',marginTop:4,flexShrink:1},
  note:{fontSize:12,lineHeight:18,color:'#5e5770',marginVertical:14},
  button:{backgroundColor:'#6953a5',minHeight:46,padding:14,borderRadius:12,alignItems:'center',justifyContent:'center',marginVertical:12},
  buttonText:{color:'#fff',fontWeight:'700',fontSize:14,textAlign:'center'},
  error:{backgroundColor:'#fff5f5',color:'#9b2c2c',padding:16,borderRadius:12,marginVertical:12,lineHeight:21},
  alert:{backgroundColor:'#fff5f5',borderLeftWidth:4,borderLeftColor:'#e53e3e',borderRadius:10,padding:14,marginVertical:8},
  alertAcknowledged:{backgroundColor:'#f4f1fb',borderLeftColor:'#8b72bc'},
  alertTitle:{fontWeight:'700',fontSize:16,color:'#87313b'},
  history:{borderBottomWidth:1,borderBottomColor:'#e8e1f4',paddingVertical:12},
  disabled:{opacity:.6},
});
