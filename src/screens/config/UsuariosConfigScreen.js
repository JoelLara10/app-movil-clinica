import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Modal, Pressable, RefreshControl, ScrollView, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import ConfigHeader from './ConfigHeader';
import { configStyles as styles } from './ConfigStyles';
import { getConfigSection, saveConfigSection } from './configCache';
import CacheService from '../../services/cacheService';
import configurationService from '../../services/configurationService';
import { useLanguage } from '../../context/LanguageContext';
import DatePickerField from '../../components/DatePickerField';

const ITEMS_PER_PAGE = 5;
const ROLE_OPTIONS = [
  { value: 'admin', key: 'roleAdmin' },
  { value: 'administrativo', key: 'roleAdministrative' },
  { value: 'medico', key: 'roleMedical' },
  { value: 'enfermero', key: 'roleNurse' },
  { value: 'estudios', key: 'roleStudies' },
];
const canonicalRole = (role) => role === 'enfermeria' ? 'enfermero' : role;
const roleLabel = (role, t) => {
  const option = ROLE_OPTIONS.find((item) => item.value === canonicalRole(role));
  return option ? t('config.' + option.key) : role || '-';
};
const emptyForm = { curp: '', nombre: '', papell: '', sapell: '', fecnac: '', telefono: '', matricula: '', cedula: '', cargo: '', email: '', preguntaSeguridad: '', username: '', password: '', role: 'medico' };
const getTotalPages = (data) => Math.max(1, Math.ceil(data.length / ITEMS_PER_PAGE));
const getPagedData = (data, page) => data.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

export default function UsuariosConfigScreen({ navigation }) {
  const { t } = useLanguage();
  const [usuarios, setUsuarios] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [page, setPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const [rolePickerVisible, setRolePickerVisible] = useState(false);

  const load = useCallback(async () => {
    try {
      const response = await configurationService.users.list();
      const payload = response?.data || response;
      const data = Array.isArray(payload) ? payload : payload?.data || [];
      const canonicalUsers = data.map((user) => ({ ...user, role: canonicalRole(user.role || user.rol) }));
      await saveConfigSection('usuarios', canonicalUsers);
      setUsuarios(canonicalUsers);
    } catch {
      setUsuarios(await getConfigSection('usuarios'));
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true); setPage(1);
    await load(true);
    setRefreshing(false);
  }, [load]);

  const paged = useMemo(() => getPagedData(usuarios, page), [usuarios, page]);
  const totalPages = getTotalPages(usuarios);

  const save = async () => {
    const username = form.username.trim();
    const nombre = form.nombre.trim();
    if (!nombre || !username || !form.password || !form.role) {
      Alert.alert(t('config.userMissingData'), t('config.userMissingDataMsg'));
      return;
    }
    try {
      const response = await configurationService.users.create({ ...form, nombre, username, role: canonicalRole(form.role) });
      const created = { ...(response?.user || response || {}) };
      delete created.password;
      const nextUsers = [{ ...created, role: canonicalRole(created.role || form.role) }, ...usuarios.filter((user) => user.username !== username)];
      await saveConfigSection('usuarios', nextUsers);
      setUsuarios(nextUsers);
      setForm(emptyForm);
      setPage(1);
      Alert.alert(t('config.userSavedTitle'), t('config.userSaved'));
    } catch (error) {
      Alert.alert(t('config.error'), error.response?.data?.error || t('config.userSaveError'));
    }
  };

  const toggleUser = async (user, activo) => {
    const id = user.id || user._id;
    if (!id) return Alert.alert(t('config.error'), t('config.userIdNotFound'));
    try { await configurationService.users.update(id, { activo }); await load(); }
    catch (error) { Alert.alert(t('config.error'), error.response?.data?.error || t('config.userUpdateError')); }
  };

  const remove = (user) => Alert.alert(t('config.deleteUserTitle'), t('config.deleteUserMsg'), [
    { text: t('config.cancel'), style: 'cancel' },
    { text: t('config.delete'), style: 'destructive', onPress: async () => {
      const id = user.id || user._id;
      if (!id) return Alert.alert(t('config.error'), t('config.userIdNotFound'));
      try { await configurationService.users.remove(id); await load(); }
      catch (error) { Alert.alert(t('config.error'), error.response?.data?.error || t('config.userDeleteError')); }
    } },
  ]);

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <ConfigHeader title={t('config.usersTitle')} navigation={navigation} onRefresh={onRefresh} />
      <View style={styles.content}>
        <Text style={styles.sectionTitle}>👥 {t('config.registerUser')}</Text>
        <View style={styles.card}>
          <View style={styles.sectionBox}>
            <Text style={styles.subTitle}>{t('config.personalData')}</Text>
            <Text style={styles.label}>{t('config.curp')}</Text>
            <TextInput style={styles.input} value={form.curp} onChangeText={(v) => setForm({ ...form, curp: v.toUpperCase() })} placeholder={t('config.curpPlaceholder')} />
            <Text style={styles.label}>{t('config.firstName')}</Text>
            <TextInput style={styles.input} value={form.nombre} onChangeText={(v) => setForm({ ...form, nombre: v })} placeholder={t('config.firstNamePlaceholder')} />
            <Text style={styles.label}>{t('config.firstLastName')}</Text>
            <TextInput style={styles.input} value={form.papell} onChangeText={(v) => setForm({ ...form, papell: v })} placeholder={t('config.firstLastNamePlaceholder')} />
            <Text style={styles.label}>{t('config.secondLastName')}</Text>
            <TextInput style={styles.input} value={form.sapell} onChangeText={(v) => setForm({ ...form, sapell: v })} placeholder={t('config.secondLastNamePlaceholder')} />
            <DatePickerField label={t('config.birthDate')} value={form.fecnac} onChange={(fecnac) => setForm((current) => ({ ...current, fecnac }))} placeholder={t('config.birthDatePlaceholder')} />
            <Text style={styles.label}>{t('config.phone')}</Text>
            <TextInput style={styles.input} value={form.telefono} onChangeText={(v) => setForm({ ...form, telefono: v })} placeholder={t('config.phonePlaceholder')} keyboardType="phone-pad" />
            <Text style={styles.label}>{t('config.matricula')}</Text>
            <TextInput style={styles.input} value={form.matricula} onChangeText={(v) => setForm({ ...form, matricula: v })} placeholder={t('config.matriculaPlaceholder')} />
            <Text style={styles.label}>{t('config.cedula')}</Text>
            <TextInput style={styles.input} value={form.cedula} onChangeText={(v) => setForm({ ...form, cedula: v })} placeholder={t('config.cedulaPlaceholder')} />
          </View>

          <View style={styles.sectionBox}>
            <Text style={styles.subTitle}>{t('config.systemData')}</Text>
            <Text style={styles.label}>{t('config.cargo')}</Text>
            <TextInput style={styles.input} value={form.cargo} onChangeText={(v) => setForm({ ...form, cargo: v })} placeholder={t('config.cargoPlaceholder')} />
            <Text style={styles.label}>{t('config.email')}</Text>
            <TextInput style={styles.input} value={form.email} onChangeText={(v) => setForm({ ...form, email: v })} placeholder={t('config.emailPlaceholder')} autoCapitalize="none" keyboardType="email-address" />
            <Text style={styles.label}>{t('config.securityQuestion')}</Text>
            <TextInput style={styles.input} value={form.preguntaSeguridad} onChangeText={(v) => setForm({ ...form, preguntaSeguridad: v })} placeholder={t('config.securityQuestionPlaceholder')} />
            <Text style={styles.label}>{t('config.username')}</Text>
            <TextInput style={styles.input} value={form.username} onChangeText={(v) => setForm({ ...form, username: v })} placeholder={t('config.usernamePlaceholder')} autoCapitalize="none" />
            <Text style={styles.label}>{t('config.password')}</Text>
            <TextInput style={styles.input} value={form.password} onChangeText={(v) => setForm({ ...form, password: v })} placeholder={t('config.passwordPlaceholder')} secureTextEntry />
            <Text style={styles.label}>{t('config.role')}</Text>
            <TouchableOpacity accessibilityRole="button" accessibilityLabel={t('config.role')} style={styles.input} onPress={() => setRolePickerVisible(true)}><Text>{roleLabel(form.role, t)}</Text></TouchableOpacity>
          </View>

          <View style={styles.actionBar}>
            <TouchableOpacity style={styles.secondaryButton} onPress={() => setForm(emptyForm)}><Text style={styles.secondaryText}>{t('config.cancel')}</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.primaryButton, { paddingHorizontal: 22 }]} onPress={save}><Text style={styles.primaryText}>💾 {t('config.saveUser')}</Text></TouchableOpacity>
          </View>
        </View>

        <Text style={styles.sectionTitle}>{t('config.usersRegistered')}</Text>
        {usuarios.length === 0 && <Text style={styles.emptyText}>{t('config.noUsersRegistered')}</Text>}
        {paged.map((u) => (
          <View key={u.id} style={styles.card}>
            <View style={styles.between}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{u.nombre || '-'} {u.papell || ''}</Text>
                <Text style={styles.cardSubtitle}>{t('config.username')}: {u.username || u.usuario} · {t('config.role')}: {roleLabel(u.role || u.rol, t)}</Text>
                {!!u.email && <Text style={styles.cardSubtitle}>{t('config.email')}: {u.email}</Text>}
                {!!u.telefono && <Text style={styles.cardSubtitle}>{t('config.phone')}: {u.telefono}</Text>}
              </View>
              <Switch value={!!u.activo} onValueChange={(activo) => toggleUser(u, activo)} />
            </View>
            <View style={[styles.between, { marginTop: 12 }]}>
              <View style={styles.badge}><Text style={styles.badgeText}>{u.activo ? t('config.active') : t('config.inactive')}</Text></View>
              <TouchableOpacity style={styles.dangerButton} onPress={() => remove(u)}><Text style={styles.dangerText}>{t('config.delete')}</Text></TouchableOpacity>
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
      <Modal transparent animationType="fade" visible={rolePickerVisible} onRequestClose={() => setRolePickerVisible(false)}>
        <Pressable style={{ flex: 1, justifyContent: 'center', padding: 24, backgroundColor: 'rgba(15, 23, 42, 0.45)' }} onPress={() => setRolePickerVisible(false)}>
          <Pressable style={{ backgroundColor: '#fff', borderRadius: 16, padding: 18 }} onPress={(event) => event.stopPropagation()}>
            <Text style={[styles.subTitle, { marginBottom: 10 }]}>{t('config.selectRole')}</Text>
            {ROLE_OPTIONS.map((option) => (
              <TouchableOpacity key={option.value} accessibilityRole="button" style={[styles.input, { justifyContent: 'center', marginBottom: 8 }]} onPress={() => {
                setForm((current) => ({ ...current, role: option.value }));
                setRolePickerVisible(false);
              }}>
                <Text>{t('config.' + option.key)}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity onPress={() => setRolePickerVisible(false)} style={{ padding: 10, alignItems: 'center' }}>
              <Text>{t('config.cancel')}</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}
