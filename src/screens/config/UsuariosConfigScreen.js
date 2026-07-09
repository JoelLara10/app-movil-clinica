import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import ConfigHeader from './ConfigHeader';
import { configStyles as styles } from './ConfigStyles';
import { addConfigItem, deleteConfigItem, getConfigSection, updateConfigItem } from './configCache';

const ITEMS_PER_PAGE = 5;
const emptyForm = { curp: '', nombre: '', papell: '', sapell: '', fecnac: '', telefono: '', matricula: '', cedula: '', cargo: '', email: '', preguntaSeguridad: '', username: '', password: '', role: 'medico' };
const getTotalPages = (data) => Math.max(1, Math.ceil(data.length / ITEMS_PER_PAGE));
const getPagedData = (data, page) => data.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

export default function UsuariosConfigScreen({ navigation }) {
  const [usuarios, setUsuarios] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [page, setPage] = useState(1);

  const load = useCallback(async () => setUsuarios(await getConfigSection('usuarios')), []);
  useEffect(() => { load(); }, [load]);

  const paged = useMemo(() => getPagedData(usuarios, page), [usuarios, page]);
  const totalPages = getTotalPages(usuarios);

  const save = async () => {
    if (!form.nombre || !form.username || !form.password || !form.role) {
      Alert.alert('Faltan datos', 'Captura nombre, usuario, contraseña y rol.');
      return;
    }
    const item = { ...form, id: `U-${Date.now()}`, activo: true };
    setUsuarios(await addConfigItem('usuarios', item));
    setForm(emptyForm);
    setPage(1);
    Alert.alert('Guardado', 'Usuario guardado en caché.');
  };

  const remove = (id) => Alert.alert('Eliminar usuario', '¿Deseas eliminar este usuario?', [
    { text: 'Cancelar', style: 'cancel' },
    { text: 'Eliminar', style: 'destructive', onPress: async () => setUsuarios(await deleteConfigItem('usuarios', id)) },
  ]);

  return (
    <ScrollView style={styles.container}>
      <ConfigHeader title="Usuarios del Sistema" navigation={navigation} />
      <View style={styles.content}>
        <Text style={styles.sectionTitle}>👥 Registrar Nuevo Usuario</Text>
        <View style={styles.card}>
          <View style={styles.sectionBox}>
            <Text style={styles.subTitle}>Datos Personales</Text>
            <Text style={styles.label}>CURP</Text>
            <TextInput style={styles.input} value={form.curp} onChangeText={(v) => setForm({ ...form, curp: v.toUpperCase() })} placeholder="Ingrese CURP" />
            <Text style={styles.label}>Nombre(s)</Text>
            <TextInput style={styles.input} value={form.nombre} onChangeText={(v) => setForm({ ...form, nombre: v })} placeholder="Ingrese nombre(s)" />
            <Text style={styles.label}>Primer Apellido</Text>
            <TextInput style={styles.input} value={form.papell} onChangeText={(v) => setForm({ ...form, papell: v })} placeholder="Ingrese primer apellido" />
            <Text style={styles.label}>Segundo Apellido</Text>
            <TextInput style={styles.input} value={form.sapell} onChangeText={(v) => setForm({ ...form, sapell: v })} placeholder="Ingrese segundo apellido" />
            <Text style={styles.label}>Fecha de nacimiento</Text>
            <TextInput style={styles.input} value={form.fecnac} onChangeText={(v) => setForm({ ...form, fecnac: v })} placeholder="AAAA-MM-DD" />
            <Text style={styles.label}>Teléfono</Text>
            <TextInput style={styles.input} value={form.telefono} onChangeText={(v) => setForm({ ...form, telefono: v })} placeholder="Ingrese teléfono" keyboardType="phone-pad" />
            <Text style={styles.label}>Matrícula</Text>
            <TextInput style={styles.input} value={form.matricula} onChangeText={(v) => setForm({ ...form, matricula: v })} placeholder="Matrícula opcional" />
            <Text style={styles.label}>Cédula Profesional</Text>
            <TextInput style={styles.input} value={form.cedula} onChangeText={(v) => setForm({ ...form, cedula: v })} placeholder="Cédula opcional" />
          </View>

          <View style={styles.sectionBox}>
            <Text style={styles.subTitle}>Datos del Sistema</Text>
            <Text style={styles.label}>Cargo</Text>
            <TextInput style={styles.input} value={form.cargo} onChangeText={(v) => setForm({ ...form, cargo: v })} placeholder="Ej. Médico General" />
            <Text style={styles.label}>Correo</Text>
            <TextInput style={styles.input} value={form.email} onChangeText={(v) => setForm({ ...form, email: v })} placeholder="correo@ejemplo.com" autoCapitalize="none" keyboardType="email-address" />
            <Text style={styles.label}>Pregunta de seguridad</Text>
            <TextInput style={styles.input} value={form.preguntaSeguridad} onChangeText={(v) => setForm({ ...form, preguntaSeguridad: v })} placeholder="Ej. ¿Nombre de tu primera mascota?" />
            <Text style={styles.label}>Usuario</Text>
            <TextInput style={styles.input} value={form.username} onChangeText={(v) => setForm({ ...form, username: v })} placeholder="Usuario" autoCapitalize="none" />
            <Text style={styles.label}>Contraseña</Text>
            <TextInput style={styles.input} value={form.password} onChangeText={(v) => setForm({ ...form, password: v })} placeholder="Contraseña" secureTextEntry />
            <Text style={styles.label}>Rol</Text>
            <TextInput style={styles.input} value={form.role} onChangeText={(v) => setForm({ ...form, role: v })} placeholder="admin, medico, enfermero, estudios" autoCapitalize="none" />
          </View>

          <View style={styles.actionBar}>
            <TouchableOpacity style={styles.secondaryButton} onPress={() => setForm(emptyForm)}><Text style={styles.secondaryText}>Cancelar</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.primaryButton, { paddingHorizontal: 22 }]} onPress={save}><Text style={styles.primaryText}>💾 Guardar Usuario</Text></TouchableOpacity>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Usuarios registrados</Text>
        {usuarios.length === 0 && <Text style={styles.emptyText}>No hay usuarios registrados.</Text>}
        {paged.map((u) => (
          <View key={u.id} style={styles.card}>
            <View style={styles.between}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{u.nombre || 'Sin nombre'} {u.papell || ''}</Text>
                <Text style={styles.cardSubtitle}>Usuario: {u.username || u.usuario} · Rol: {u.role || u.rol}</Text>
                {!!u.email && <Text style={styles.cardSubtitle}>Correo: {u.email}</Text>}
                {!!u.telefono && <Text style={styles.cardSubtitle}>Teléfono: {u.telefono}</Text>}
              </View>
              <Switch value={!!u.activo} onValueChange={async (activo) => setUsuarios(await updateConfigItem('usuarios', u.id, { activo }))} />
            </View>
            <View style={[styles.between, { marginTop: 12 }]}> 
              <View style={styles.badge}><Text style={styles.badgeText}>{u.activo ? 'ACTIVO' : 'INACTIVO'}</Text></View>
              <TouchableOpacity style={styles.dangerButton} onPress={() => remove(u.id)}><Text style={styles.dangerText}>Eliminar</Text></TouchableOpacity>
            </View>
          </View>
        ))}

        {usuarios.length > ITEMS_PER_PAGE && (
          <View style={styles.pagination}>
            <TouchableOpacity style={styles.secondaryButton} disabled={page === 1} onPress={() => setPage(page - 1)}><Text style={styles.secondaryText}>‹</Text></TouchableOpacity>
            <Text style={styles.pageText}>{page} / {totalPages}</Text>
            <TouchableOpacity style={styles.secondaryButton} disabled={page === totalPages} onPress={() => setPage(page + 1)}><Text style={styles.secondaryText}>›</Text></TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
