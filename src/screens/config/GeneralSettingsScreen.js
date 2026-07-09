import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import ConfigHeader from './ConfigHeader';
import { configStyles as styles } from './ConfigStyles';
import { getConfigSection, saveConfigSection } from './configCache';

export default function GeneralSettingsScreen({ navigation }) {
  const [form, setForm] = useState({ nombreClinica: '', telefono: '', direccion: '', moneda: 'MXN', tema: 'Morado', apiHost: '192.168.1.4', apiPort: '5001', apiPath: '/api/v1' });

  useEffect(() => { getConfigSection('general').then((data) => setForm((old) => ({ ...old, ...data }))); }, []);

  const save = async () => {
    await saveConfigSection('general', form);
    Alert.alert('Guardado', 'La configuración general se guardó en caché.');
  };

  return (
    <ScrollView style={styles.container}>
      <ConfigHeader title="Configuración General" navigation={navigation} />
      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🏥 Datos de la clínica</Text>
          <Text style={styles.cardSubtitle}>Todo se guarda localmente en el caché del dispositivo con AsyncStorage.</Text>
        </View>

        <Text style={styles.label}>Nombre de la clínica</Text>
        <TextInput style={styles.input} value={form.nombreClinica} onChangeText={(v) => setForm({ ...form, nombreClinica: v })} />
        <Text style={styles.label}>Teléfono</Text>
        <TextInput style={styles.input} value={form.telefono} onChangeText={(v) => setForm({ ...form, telefono: v })} keyboardType="phone-pad" />
        <Text style={styles.label}>Dirección</Text>
        <TextInput style={styles.input} value={form.direccion} onChangeText={(v) => setForm({ ...form, direccion: v })} />
        <Text style={styles.label}>Moneda</Text>
        <TextInput style={styles.input} value={form.moneda} onChangeText={(v) => setForm({ ...form, moneda: v.toUpperCase() })} autoCapitalize="characters" />
        <Text style={styles.label}>Tema visual</Text>
        <TextInput style={styles.input} value={form.tema} onChangeText={(v) => setForm({ ...form, tema: v })} />

        <Text style={styles.sectionTitle}>Conexión API</Text>
        <Text style={styles.label}>IP del servidor</Text>
        <TextInput style={styles.input} value={form.apiHost} onChangeText={(v) => setForm({ ...form, apiHost: v })} placeholder="192.168.1.4" />
        <Text style={styles.label}>Puerto</Text>
        <TextInput style={styles.input} value={form.apiPort} onChangeText={(v) => setForm({ ...form, apiPort: v })} placeholder="5001" keyboardType="number-pad" />
        <Text style={styles.label}>Ruta base</Text>
        <TextInput style={styles.input} value={form.apiPath} onChangeText={(v) => setForm({ ...form, apiPath: v })} placeholder="/api/v1" />

        <TouchableOpacity style={styles.primaryButton} onPress={save}><Text style={styles.primaryText}>Guardar configuración</Text></TouchableOpacity>
      </View>
    </ScrollView>
  );
}
