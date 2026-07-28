import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, RefreshControl, ScrollView, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import ConfigHeader from './ConfigHeader';
import { configStyles as styles } from './ConfigStyles';
import { addConfigItem, deleteConfigItem, getConfigSection, saveConfigSection, updateConfigItem } from './configCache';
import CacheService from '../../services/cacheService';
import configurationService from '../../services/configurationService';
import { useLanguage } from '../../context/LanguageContext';

const ITEMS_PER_PAGE = 5;
const emptyForm = { curp: '', nombre: '', papell: '', sapell: '', fecnac: '', telefono: '', matricula: '', cedula: '', cargo: '', email: '', preguntaSeguridad: '', username: '', password: '', role: 'medico' };
const getTotalPages = (data) => Math.max(1, Math.ceil(data.length / ITEMS_PER_PAGE));
const getPagedData = (data, page) => data.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

export default function UsuariosConfigScreen({ navigation }) {
  const { t } = useLanguage();
  const [usuarios, setUsuarios] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [page, setPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (forceRefresh = false) => {
    if (!forceRefresh) { setUsuarios(await getConfigSection('usuarios')); return; }
    try {
      const data = await configurationService.users?.list?.();
      if (Array.isArray(data)) { await saveConfigSection('usuarios', data); setUsuarios(data); }
      else setUsuarios(await getConfigSection('usuarios'));
    } catch { setUsuarios(await getConfigSection('usuarios')); }
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
    if (!form.nombre || !form.username || !form.password || !form.role) {
      Alert.alert(t('config.userMissingData'), t('config.userMissingDataMsg'));
      return;
    }
    const item = { ...form, id: `U-${Date.now()}`, activo: true };
    setUsuarios(await addConfigItem('usuarios', item));
    setForm(emptyForm);
    setPage(1);
    Alert.alert(t('config.userSavedTitle'), t('config.userSaved'));
  };

  const remove = (id) => Alert.alert(t('config.deleteUserTitle'), t('config.deleteUserMsg'), [
    { text: t('config.cancel'), style: 'cancel' },
    { text: t('config.delete'), style: 'destructive', onPress: async () => setUsuarios(await deleteConfigItem('usuarios', id)) },
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
            <Text style={styles.label}>{t('config.birthDate')}</Text>
            <TextInput style={styles.input} value={form.fecnac} onChangeText={(v) => setForm({ ...form, fecnac: v })} placeholder={t('config.birthDatePlaceholder')} />
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
            <TextInput style={styles.input} value={form.role} onChangeText={(v) => setForm({ ...form, role: v })} placeholder={t('config.rolePlaceholder')} autoCapitalize="none" />
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
                <Text style={styles.cardSubtitle}>{t('config.username')}: {u.username || u.usuario} · {t('config.role')}: {u.role || u.rol}</Text>
                {!!u.email && <Text style={styles.cardSubtitle}>{t('config.email')}: {u.email}</Text>}
                {!!u.telefono && <Text style={styles.cardSubtitle}>{t('config.phone')}: {u.telefono}</Text>}
              </View>
              <Switch value={!!u.activo} onValueChange={async (activo) => setUsuarios(await updateConfigItem('usuarios', u.id, { activo }))} />
            </View>
            <View style={[styles.between, { marginTop: 12 }]}>
              <View style={styles.badge}><Text style={styles.badgeText}>{u.activo ? t('config.active') : t('config.inactive')}</Text></View>
              <TouchableOpacity style={styles.dangerButton} onPress={() => remove(u.id)}><Text style={styles.dangerText}>{t('config.delete')}</Text></TouchableOpacity>
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
