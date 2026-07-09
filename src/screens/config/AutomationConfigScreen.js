import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import ConfigHeader from './ConfigHeader';
import { configStyles as styles } from './ConfigStyles';
import { clearConfigCache, getConfigSection, saveConfigSection } from './configCache';

export default function AutomationConfigScreen({ navigation }) {
  const [form, setForm] = useState({ respaldosAutomaticos: true, horaRespaldo: '22:00', limpiarTemporales: true, diasRetencion: '30', sincronizacionWifi: true, notificaciones: true });

  useEffect(() => { getConfigSection('automatizacion').then((data) => setForm((old) => ({ ...old, ...data }))); }, []);

  const save = async () => {
    await saveConfigSection('automatizacion', form);
    Alert.alert('Guardado', 'La automatización fue configurada en caché.');
  };

  const clear = () => Alert.alert('Limpiar caché', 'Se borrará el caché local del módulo. ¿Continuar?', [
    { text: 'Cancelar', style: 'cancel' },
    { text: 'Limpiar', style: 'destructive', onPress: async () => { await clearConfigCache(); Alert.alert('Listo', 'Caché limpiado.'); } },
  ]);

  return (
    <ScrollView style={styles.container}>
      <ConfigHeader title="Rendimiento y Automatización" navigation={navigation} />
      <View style={styles.content}>
        <View style={styles.card}><Text style={styles.cardTitle}>📈 Rendimiento</Text><Text style={styles.cardSubtitle}>Monitoreo local, limpieza y tareas automáticas del módulo.</Text></View>

        {[
          ['respaldosAutomaticos', 'Respaldos automáticos', 'Permite programar respaldos diarios del sistema.'],
          ['limpiarTemporales', 'Limpieza de archivos temporales', 'Ayuda a mantener ordenado el almacenamiento local.'],
          ['sincronizacionWifi', 'Sincronizar solo con WiFi', 'Evita consumir datos móviles durante sincronización.'],
          ['notificaciones', 'Notificaciones del sistema', 'Activa alertas de tareas y respaldos.'],
        ].map(([key, title, subtitle]) => (
          <View style={styles.card} key={key}>
            <View style={styles.between}>
              <View style={{ flex: 1 }}><Text style={styles.cardTitle}>{title}</Text><Text style={styles.cardSubtitle}>{subtitle}</Text></View>
              <Switch value={!!form[key]} onValueChange={(v) => setForm({ ...form, [key]: v })} />
            </View>
          </View>
        ))}

        <Text style={styles.label}>Hora de respaldo</Text>
        <TextInput style={styles.input} value={form.horaRespaldo} onChangeText={(v) => setForm({ ...form, horaRespaldo: v })} placeholder="22:00" />
        <Text style={styles.label}>Días de retención</Text>
        <TextInput style={styles.input} value={form.diasRetencion} onChangeText={(v) => setForm({ ...form, diasRetencion: v })} keyboardType="number-pad" />

        <TouchableOpacity style={styles.primaryButton} onPress={save}><Text style={styles.primaryText}>Guardar automatización</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.dangerButton, { alignItems: 'center', marginTop: 12 }]} onPress={clear}><Text style={styles.dangerText}>Limpiar caché local</Text></TouchableOpacity>
      </View>
    </ScrollView>
  );
}
