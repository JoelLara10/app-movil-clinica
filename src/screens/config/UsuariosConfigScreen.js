import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import ConfigHeader from './ConfigHeader';
import { configStyles as styles } from './ConfigStyles';
import { addConfigItem, deleteConfigItem, getConfigSection, updateConfigItem } from '../../services/configService';

export default function UsuariosConfigScreen({ navigation }) {
  const [usuarios, setUsuarios] = useState([]);
  const [form, setForm] = useState({ nombre: '', usuario: '', rol: 'medico' });

  const load = async () => setUsuarios(await getConfigSection('usuarios'));
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.nombre || !form.usuario) return Alert.alert('Faltan datos', 'Escribe nombre y usuario.');
    const item = { id: `U-${Date.now()}`, ...form, activo: true };
    setUsuarios(await addConfigItem('usuarios', item));
    setForm({ nombre: '', usuario: '', rol: 'medico' });
  };

  const remove = (id) => Alert.alert('Eliminar usuario', '¿Deseas eliminar este usuario?', [
    { text: 'Cancelar', style: 'cancel' },
    { text: 'Eliminar', style: 'destructive', onPress: async () => setUsuarios(await deleteConfigItem('usuarios', id)) },
  ]);

  return (
    <ScrollView style={styles.container}>
      <ConfigHeader title="Usuarios del Sistema" navigation={navigation} />
      <View style={styles.content}>
        <Text style={styles.sectionTitle}>👥 Registrar usuario</Text>
        <View style={styles.card}>
          <Text style={styles.label}>Nombre completo</Text>
          <TextInput style={styles.input} value={form.nombre} onChangeText={(v) => setForm({ ...form, nombre: v })} placeholder="Ej. Dra. Ana López" />
          <Text style={styles.label}>Usuario</Text>
          <TextInput style={styles.input} value={form.usuario} onChangeText={(v) => setForm({ ...form, usuario: v })} placeholder="Ej. ana.lopez" autoCapitalize="none" />
          <Text style={styles.label}>Rol</Text>
          <TextInput style={styles.input} value={form.rol} onChangeText={(v) => setForm({ ...form, rol: v })} placeholder="admin, medico, estudios, administrativo" autoCapitalize="none" />
          <TouchableOpacity style={styles.primaryButton} onPress={save}><Text style={styles.primaryText}>Guardar usuario</Text></TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Usuarios registrados</Text>
        {usuarios.map((u) => (
          <View key={u.id} style={styles.card}>
            <View style={styles.between}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{u.nombre}</Text>
                <Text style={styles.cardSubtitle}>Usuario: {u.usuario} · Rol: {u.rol}</Text>
              </View>
              <Switch value={!!u.activo} onValueChange={async (activo) => setUsuarios(await updateConfigItem('usuarios', u.id, { activo }))} />
            </View>
            <View style={[styles.between, { marginTop: 12 }]}>
              <View style={styles.badge}><Text style={styles.badgeText}>{u.activo ? 'ACTIVO' : 'INACTIVO'}</Text></View>
              <TouchableOpacity style={styles.dangerButton} onPress={() => remove(u.id)}><Text style={styles.dangerText}>Eliminar</Text></TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
