import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import ConfigHeader from './ConfigHeader';
import { configStyles as styles } from './ConfigStyles';
import { getConfigSection, saveConfigSection } from '../../services/configService';

export default function GeneralSettingsScreen({ navigation }) {
  const [form, setForm] = useState({ nombreClinica: '', telefono: '', direccion: '', moneda: 'MXN', tema: 'Morado' });
  useEffect(() => { getConfigSection('general').then(setForm); }, []);

  const save = async () => {
    await saveConfigSection('general', form);
    Alert.alert('Guardado', 'La configuración general fue actualizada.');
  };

  return (
    <ScrollView style={styles.container}>
      <ConfigHeader title="Configuración General" navigation={navigation} />
      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🏥 Datos de la clínica</Text>
          <Text style={styles.cardSubtitle}>Información base que se usará en el sistema móvil.</Text>
        </View>
        <Text style={styles.label}>Nombre de la clínica</Text>
        <TextInput style={styles.input} value={form.nombreClinica} onChangeText={(v) => setForm({ ...form, nombreClinica: v })} />
        <Text style={styles.label}>Teléfono</Text>
        <TextInput style={styles.input} value={form.telefono} onChangeText={(v) => setForm({ ...form, telefono: v })} keyboardType="phone-pad" />
        <Text style={styles.label}>Dirección</Text>
        <TextInput style={styles.input} value={form.direccion} onChangeText={(v) => setForm({ ...form, direccion: v })} />
        <Text style={styles.label}>Moneda</Text>
        <TextInput style={styles.input} value={form.moneda} onChangeText={(v) => setForm({ ...form, moneda: v })} autoCapitalize="characters" />
        <Text style={styles.label}>Tema visual</Text>
        <TextInput style={styles.input} value={form.tema} onChangeText={(v) => setForm({ ...form, tema: v })} />
        <TouchableOpacity style={styles.primaryButton} onPress={save}><Text style={styles.primaryText}>Guardar configuración</Text></TouchableOpacity>
      </View>
    </ScrollView>
  );
}
