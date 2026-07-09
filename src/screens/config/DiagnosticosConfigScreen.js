import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import ConfigHeader from './ConfigHeader';
import { configStyles as styles } from './ConfigStyles';
import { addConfigItem, deleteConfigItem, getConfigSection, updateConfigItem } from './configCache';

export default function DiagnosticosConfigScreen({ navigation }) {
  const [diagnosticos, setDiagnosticos] = useState([]);
  const [form, setForm] = useState({ codigo: '', nombre: '', descripcion: '', categoria: 'Oftalmología' });

  useEffect(() => { getConfigSection('diagnosticos').then(setDiagnosticos); }, []);

  const save = async () => {
    if (!form.codigo || !form.nombre) return Alert.alert('Faltan datos', 'Captura código y diagnóstico.');
    setDiagnosticos(await addConfigItem('diagnosticos', { id: `D-${Date.now()}`, ...form, activo: true }));
    setForm({ codigo: '', nombre: '', descripcion: '', categoria: 'Oftalmología' });
    Alert.alert('Guardado', 'Diagnóstico guardado en caché.');
  };

  const remove = (id) => Alert.alert('Eliminar diagnóstico', '¿Deseas eliminar este diagnóstico?', [
    { text: 'Cancelar', style: 'cancel' },
    { text: 'Eliminar', style: 'destructive', onPress: async () => setDiagnosticos(await deleteConfigItem('diagnosticos', id)) },
  ]);

  return (
    <ScrollView style={styles.container}>
      <ConfigHeader title="Diagnósticos" navigation={navigation} />
      <View style={styles.content}>
        <Text style={styles.sectionTitle}>〽️ Registrar diagnóstico</Text>
        <View style={styles.card}>
          <Text style={styles.label}>Código CIE-10</Text>
          <TextInput style={styles.input} value={form.codigo} onChangeText={(v) => setForm({ ...form, codigo: v.toUpperCase() })} placeholder="Ej. H40" autoCapitalize="characters" />
          <Text style={styles.label}>Diagnóstico</Text>
          <TextInput style={styles.input} value={form.nombre} onChangeText={(v) => setForm({ ...form, nombre: v })} placeholder="Ej. Glaucoma" />
          <Text style={styles.label}>Categoría</Text>
          <TextInput style={styles.input} value={form.categoria} onChangeText={(v) => setForm({ ...form, categoria: v })} placeholder="Ej. Oftalmología" />
          <Text style={styles.label}>Descripción</Text>
          <TextInput style={[styles.input, styles.inputMultiline]} value={form.descripcion} onChangeText={(v) => setForm({ ...form, descripcion: v })} placeholder="Descripción del diagnóstico" multiline />
          <TouchableOpacity style={styles.primaryButton} onPress={save}><Text style={styles.primaryText}>Guardar diagnóstico</Text></TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Diagnósticos registrados</Text>
        {diagnosticos.length === 0 && <Text style={styles.emptyText}>No hay diagnósticos registrados.</Text>}
        {diagnosticos.map((d) => (
          <View key={d.id} style={styles.card}>
            <View style={styles.between}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{d.codigo} · {d.nombre}</Text>
                <Text style={styles.cardSubtitle}>{d.categoria}</Text>
                {!!d.descripcion && <Text style={styles.cardSubtitle}>{d.descripcion}</Text>}
              </View>
              <Switch value={!!d.activo} onValueChange={async (activo) => setDiagnosticos(await updateConfigItem('diagnosticos', d.id, { activo }))} />
            </View>
            <View style={[styles.between, { marginTop: 12 }]}> 
              <View style={styles.badge}><Text style={styles.badgeText}>{d.activo ? 'ACTIVO' : 'INACTIVO'}</Text></View>
              <TouchableOpacity style={styles.dangerButton} onPress={() => remove(d.id)}><Text style={styles.dangerText}>Eliminar</Text></TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
