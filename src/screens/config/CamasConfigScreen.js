import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import ConfigHeader from './ConfigHeader';
import { configStyles as styles } from './ConfigStyles';
import { addConfigItem, deleteConfigItem, getConfigSection, updateConfigItem } from '../../services/configService';

export default function CamasConfigScreen({ navigation }) {
  const [camas, setCamas] = useState([]);
  const [form, setForm] = useState({ nombre: '', area: '', tipo: 'General' });
  useEffect(() => { getConfigSection('camas').then(setCamas); }, []);

  const save = async () => {
    if (!form.nombre || !form.area) return Alert.alert('Faltan datos', 'Captura cama y área.');
    setCamas(await addConfigItem('camas', { id: `C-${Date.now()}`, ...form, estado: 'Disponible' }));
    setForm({ nombre: '', area: '', tipo: 'General' });
  };

  const toggleEstado = async (cama) => {
    const estado = cama.estado === 'Disponible' ? 'Mantenimiento' : 'Disponible';
    setCamas(await updateConfigItem('camas', cama.id, { estado }));
  };

  return (
    <ScrollView style={styles.container}>
      <ConfigHeader title="Configuración de Camas" navigation={navigation} />
      <View style={styles.content}>
        <Text style={styles.sectionTitle}>🛏️ Alta de cama</Text>
        <View style={styles.card}>
          <Text style={styles.label}>Nombre / número de cama</Text>
          <TextInput style={styles.input} value={form.nombre} onChangeText={(v) => setForm({ ...form, nombre: v })} placeholder="Ej. Cama 203" />
          <Text style={styles.label}>Área</Text>
          <TextInput style={styles.input} value={form.area} onChangeText={(v) => setForm({ ...form, area: v })} placeholder="Ej. Urgencias" />
          <Text style={styles.label}>Tipo</Text>
          <TextInput style={styles.input} value={form.tipo} onChangeText={(v) => setForm({ ...form, tipo: v })} placeholder="General, Observación, UCI" />
          <TouchableOpacity style={styles.primaryButton} onPress={save}><Text style={styles.primaryText}>Guardar cama</Text></TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Camas registradas</Text>
        {camas.map((cama) => (
          <View key={cama.id} style={styles.card}>
            <View style={styles.between}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{cama.nombre}</Text>
                <Text style={styles.cardSubtitle}>{cama.area} · {cama.tipo}</Text>
              </View>
              <View style={styles.badge}><Text style={styles.badgeText}>{cama.estado}</Text></View>
            </View>
            <View style={[styles.between, { marginTop: 12 }]}>
              <TouchableOpacity style={styles.smallButton} onPress={() => toggleEstado(cama)}><Text style={styles.smallText}>Cambiar estado</Text></TouchableOpacity>
              <TouchableOpacity style={styles.dangerButton} onPress={async () => setCamas(await deleteConfigItem('camas', cama.id))}><Text style={styles.dangerText}>Eliminar</Text></TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
