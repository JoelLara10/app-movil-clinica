import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import ConfigHeader from './ConfigHeader';
import { configStyles as styles } from './ConfigStyles';
import { createBackup, getConfigCacheInfo, getConfigSection, resetConfigData } from './configCache';

export default function BackupConfigScreen({ navigation }) {
  const [respaldos, setRespaldos] = useState([]);
  const [info, setInfo] = useState(null);

  const load = async () => {
    setRespaldos(await getConfigSection('respaldos'));
    setInfo(await getConfigCacheInfo());
  };

  useEffect(() => { load(); }, []);

  const makeBackup = async () => {
    setRespaldos(await createBackup());
    setInfo(await getConfigCacheInfo());
    Alert.alert('Respaldo creado', 'Se registró un respaldo local de configuración.');
  };

  const reset = () => Alert.alert('Restaurar configuración', 'Esto regresará los datos de ejemplo. ¿Continuar?', [
    { text: 'Cancelar', style: 'cancel' },
    { text: 'Restaurar', style: 'destructive', onPress: async () => { const data = await resetConfigData(); setRespaldos(data.respaldos); setInfo(await getConfigCacheInfo()); } },
  ]);

  return (
    <ScrollView style={styles.container}>
      <ConfigHeader title="Copias de Seguridad" navigation={navigation} />
      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>💾 Respaldos locales</Text>
          <Text style={styles.cardSubtitle}>Crea registros de respaldo para la configuración del módulo.</Text>
          {info && <Text style={[styles.cardSubtitle, { marginTop: 8 }]}>Último cambio: {new Date(info.updatedAt).toLocaleString()} · Tamaño: {info.size} bytes</Text>}
          <TouchableOpacity style={styles.primaryButton} onPress={makeBackup}><Text style={styles.primaryText}>Crear respaldo</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.dangerButton, { alignItems: 'center', marginTop: 10 }]} onPress={reset}><Text style={styles.dangerText}>Restaurar datos de ejemplo</Text></TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Historial</Text>
        {respaldos.length === 0 && <Text style={styles.emptyText}>No hay respaldos registrados.</Text>}
        {respaldos.map((b) => (
          <View key={b.id} style={styles.card}>
            <Text style={styles.cardTitle}>{b.nombre}</Text>
            <Text style={styles.cardSubtitle}>Tipo: {b.tipo} · Fecha: {new Date(b.fecha).toLocaleString()}</Text>
            <Text style={styles.cardSubtitle}>Elementos respaldados: {b.elementos || 0}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
