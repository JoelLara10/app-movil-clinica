import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import ConfigHeader from './ConfigHeader';
import { configStyles as styles } from './ConfigStyles';
import { addConfigItem, deleteConfigItem, getConfigSection } from '../../services/configService';

export default function ServiciosConfigScreen({ navigation }) {
  const [servicios, setServicios] = useState([]);
  const [form, setForm] = useState({ clave: '', descripcion: '', costo: '', unidad: 'Servicio', tipo: 'Consulta' });
  useEffect(() => { getConfigSection('servicios').then(setServicios); }, []);

  const save = async () => {
    if (!form.clave || !form.descripcion || !form.costo) return Alert.alert('Faltan datos', 'Captura clave, descripción y costo.');
    setServicios(await addConfigItem('servicios', { id: `S-${Date.now()}`, ...form }));
    setForm({ clave: '', descripcion: '', costo: '', unidad: 'Servicio', tipo: 'Consulta' });
  };

  return (
    <ScrollView style={styles.container}>
      <ConfigHeader title="Catálogo de Servicios" navigation={navigation} />
      <View style={styles.content}>
        <Text style={styles.sectionTitle}>📋 Registrar servicio</Text>
        <View style={styles.card}>
          <Text style={styles.label}>Clave</Text>
          <TextInput style={styles.input} value={form.clave} onChangeText={(v) => setForm({ ...form, clave: v })} placeholder="Ej. CONS-GEN" autoCapitalize="characters" />
          <Text style={styles.label}>Descripción</Text>
          <TextInput style={styles.input} value={form.descripcion} onChangeText={(v) => setForm({ ...form, descripcion: v })} placeholder="Ej. Consulta general" />
          <Text style={styles.label}>Costo principal</Text>
          <TextInput style={styles.input} value={form.costo} onChangeText={(v) => setForm({ ...form, costo: v })} keyboardType="decimal-pad" placeholder="Ej. 500" />
          <Text style={styles.label}>Unidad de medida</Text>
          <TextInput style={styles.input} value={form.unidad} onChangeText={(v) => setForm({ ...form, unidad: v })} placeholder="Servicio, estudio, pieza" />
          <Text style={styles.label}>Tipo de servicio</Text>
          <TextInput style={styles.input} value={form.tipo} onChangeText={(v) => setForm({ ...form, tipo: v })} placeholder="Consulta, laboratorio, gabinete" />
          <TouchableOpacity style={styles.primaryButton} onPress={save}><Text style={styles.primaryText}>Guardar servicio</Text></TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Servicios registrados</Text>
        {servicios.map((s) => (
          <View key={s.id} style={styles.card}>
            <View style={styles.between}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{s.descripcion}</Text>
                <Text style={styles.cardSubtitle}>Clave: {s.clave} · Tipo: {s.tipo} · Unidad: {s.unidad}</Text>
              </View>
              <View style={styles.badge}><Text style={styles.badgeText}>${s.costo}</Text></View>
            </View>
            <TouchableOpacity style={[styles.dangerButton, { alignSelf: 'flex-end', marginTop: 12 }]} onPress={async () => setServicios(await deleteConfigItem('servicios', s.id))}>
              <Text style={styles.dangerText}>Eliminar</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
