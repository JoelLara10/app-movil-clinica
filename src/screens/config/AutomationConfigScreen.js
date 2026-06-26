import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import ConfigHeader from './ConfigHeader';
import { configStyles as styles } from './ConfigStyles';
import { getConfigSection, saveConfigSection } from '../../services/configService';

export default function AutomationConfigScreen({ navigation }) {
  const [form, setForm] = useState({ respaldosAutomaticos: true, horaRespaldo: '22:00', limpiarTemporales: true, diasRetencion: '30' });
  useEffect(() => { getConfigSection('automatizacion').then(setForm); }, []);

  const save = async () => {
    await saveConfigSection('automatizacion', form);
    Alert.alert('Guardado', 'La automatización fue configurada.');
  };

  return (
    <ScrollView style={styles.container}>
      <ConfigHeader title="Automatización" navigation={navigation} />
      <View style={styles.content}>
        <View style={styles.card}>
          <View style={styles.between}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Respaldos automáticos</Text>
              <Text style={styles.cardSubtitle}>Permite programar respaldos diarios del sistema.</Text>
            </View>
            <Switch value={form.respaldosAutomaticos} onValueChange={(v) => setForm({ ...form, respaldosAutomaticos: v })} />
          </View>
        </View>

        <Text style={styles.label}>Hora de respaldo</Text>
        <TextInput style={styles.input} value={form.horaRespaldo} onChangeText={(v) => setForm({ ...form, horaRespaldo: v })} placeholder="22:00" />

        <View style={styles.card}>
          <View style={styles.between}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Limpieza de archivos temporales</Text>
              <Text style={styles.cardSubtitle}>Ayuda a mantener la aplicación ordenada.</Text>
            </View>
            <Switch value={form.limpiarTemporales} onValueChange={(v) => setForm({ ...form, limpiarTemporales: v })} />
          </View>
        </View>

        <Text style={styles.label}>Días de retención</Text>
        <TextInput style={styles.input} value={form.diasRetencion} onChangeText={(v) => setForm({ ...form, diasRetencion: v })} keyboardType="number-pad" />
        <TouchableOpacity style={styles.primaryButton} onPress={save}><Text style={styles.primaryText}>Guardar automatización</Text></TouchableOpacity>
      </View>
    </ScrollView>
  );
}
