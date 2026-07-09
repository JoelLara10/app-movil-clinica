import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import ConfigHeader from './ConfigHeader';
import { configStyles as styles } from './ConfigStyles';
import { addConfigItem, deleteConfigItem, getConfigSection, updateConfigItem } from './configCache';

export default function CamasConfigScreen({ navigation }) {
  const [camas, setCamas] = useState([]);
  const [form, setForm] = useState({ numero: '', area: '', tipo: 'General' });

  useEffect(() => { getConfigSection('camas').then(setCamas); }, []);

  const save = async () => {
    if (!form.numero || !form.area) return Alert.alert('Faltan datos', 'Captura número de cama y área.');
    const item = { id: `C-${Date.now()}`, numero: form.numero, nombre: `Cama ${form.numero}`, area: form.area, tipo: form.tipo, estado: 'Disponible' };
    setCamas(await addConfigItem('camas', item));
    setForm({ numero: '', area: '', tipo: 'General' });
    Alert.alert('Guardado', 'Cama guardada en caché.');
  };

  const toggleEstado = async (cama) => {
    const estado = cama.estado === 'Disponible' ? 'Mantenimiento' : 'Disponible';
    setCamas(await updateConfigItem('camas', cama.id, { estado }));
  };

  const remove = (id) => Alert.alert('Eliminar cama', '¿Deseas eliminar esta cama?', [
    { text: 'Cancelar', style: 'cancel' },
    { text: 'Eliminar', style: 'destructive', onPress: async () => setCamas(await deleteConfigItem('camas', id)) },
  ]);

  return (
    <ScrollView style={styles.container}>
      <ConfigHeader title="Gestión de Camas" navigation={navigation} />
      <View style={styles.content}>
        <Text style={styles.sectionTitle}>🛏️ Alta de cama</Text>
        <View style={styles.card}>
          <Text style={styles.label}>Número de cama</Text>
          <TextInput style={styles.input} value={form.numero} onChangeText={(v) => setForm({ ...form, numero: v })} placeholder="Ej. 203" keyboardType="number-pad" />
          <Text style={styles.label}>Área</Text>
          <TextInput style={styles.input} value={form.area} onChangeText={(v) => setForm({ ...form, area: v })} placeholder="Ej. Urgencias" />
          <Text style={styles.label}>Tipo</Text>
          <TextInput style={styles.input} value={form.tipo} onChangeText={(v) => setForm({ ...form, tipo: v })} placeholder="General, Observación, UCI" />
          <TouchableOpacity style={styles.primaryButton} onPress={save}><Text style={styles.primaryText}>Guardar cama</Text></TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Camas registradas</Text>
        {camas.length === 0 && <Text style={styles.emptyText}>No hay camas registradas.</Text>}
        {camas.map((cama) => (
          <View key={cama.id} style={styles.card}>
            <View style={styles.between}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{cama.nombre || `Cama ${cama.numero || '--'}`}</Text>
                <Text style={styles.cardSubtitle}>{cama.area} · {cama.tipo}</Text>
              </View>
              <View style={styles.badge}><Text style={styles.badgeText}>{cama.estado}</Text></View>
            </View>
            <View style={[styles.between, { marginTop: 12 }]}> 
              <TouchableOpacity style={styles.secondaryButton} onPress={() => toggleEstado(cama)}><Text style={styles.secondaryText}>Cambiar estado</Text></TouchableOpacity>
              <TouchableOpacity style={styles.dangerButton} onPress={() => remove(cama.id)}><Text style={styles.dangerText}>Eliminar</Text></TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
