import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, RefreshControl, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import ConfigHeader from './ConfigHeader';
import { configStyles as styles } from './ConfigStyles';
import configurationService from '../../services/configurationService';
import CacheService from '../../services/cacheService';
import { useLanguage } from '../../context/LanguageContext';

const CACHE_KEY = 'config_camas';
const CACHE_TTL = 5 * 60 * 1000;
const ITEMS_PER_PAGE = 8;

const emptyForm = { numero: '', area: 'Hospitalizado', tipo_habitacion: 'General', piso: '', seccion: '', ocupada: 0 };

const getTotalPages = (data) => Math.max(1, Math.ceil(data.length / ITEMS_PER_PAGE));
const getPagedData = (data, page) => data.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

export default function CamasConfigScreen({ navigation }) {
  const { t } = useLanguage();
  const [camas, setCamas] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState('');
  const [page, setPage] = useState(1);

  const Choice = ({ value, label, current, onPress }) => (
    <TouchableOpacity style={[styles.optionChip, current === value && styles.optionChipActive]} onPress={() => onPress(value)}>
      <Text style={[styles.optionText, current === value && styles.optionTextActive]}>{label}</Text>
    </TouchableOpacity>
  );

  const load = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    try {
      if (!forceRefresh) {
        const cached = await CacheService.get(CACHE_KEY);
        if (cached) { setCamas(cached); setLoading(false); return; }
      }
      const data = await configurationService.beds.list();
      const list = Array.isArray(data) ? data : [];
      await CacheService.set(CACHE_KEY, list, CACHE_TTL);
      setCamas(list);
    } catch (error) {
      const cached = await CacheService.get(CACHE_KEY);
      if (cached) { setCamas(cached); setMessage(t('config.noConnection')); }
      else setMessage(error.response?.data?.error || t('config.bedLoadError'));
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true); setPage(1);
    await load(true);
    setRefreshing(false);
  }, [load]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? camas.filter((c) => [c.numero, c.area, c.tipo_habitacion, c.piso, c.seccion].join(' ').toLowerCase().includes(q)) : camas;
  }, [camas, search]);

  const paged = useMemo(() => getPagedData(visible, page), [visible, page]);
  const totalPages = getTotalPages(visible);

  const reset = () => { setForm(emptyForm); setEditingId(null); };

  const save = async () => {
    if (!form.numero.trim() || !form.area) return Alert.alert(t('config.bedMissingData'), t('config.bedMissingDataMsg'));
    if (camas.some((c) => String(c.numero).toLowerCase() === form.numero.trim().toLowerCase() && c.id_cama !== editingId))
      return Alert.alert(t('config.bedDuplicate'), t('config.bedDuplicateMsg'));
    setLoading(true);
    try {
      const payload = { ...form, numero: form.numero.trim(), ocupada: Number(form.ocupada) };
      if (editingId === null) await configurationService.beds.create(payload);
      else await configurationService.beds.update(editingId, payload);
      setMessage(editingId === null ? t('config.bedSaved') : t('config.bedUpdated'));
      reset(); await load(true);
    } catch (error) { setMessage(error.response?.data?.error || t('config.bedSaveError')); }
    finally { setLoading(false); }
  };

  const edit = (cama) => {
    setEditingId(cama.id_cama);
    setForm({ ...emptyForm, ...cama, numero: String(cama.numero || ''), ocupada: Number(cama.ocupada) });
  };

  const remove = (cama) => {
    if (cama.ocupada) return Alert.alert(t('config.bedDeleteOccupied'), t('config.bedDeleteOccupiedMsg'));
    Alert.alert(t('config.bedDeleteTitle'), `${t('config.bedDeleteMsg')} ${cama.numero}?`, [
      { text: t('config.cancel'), style: 'cancel' },
      { text: t('config.delete'), style: 'destructive', onPress: async () => {
        try { await configurationService.beds.remove(cama.id_cama); setMessage(t('config.bedDeleted')); await load(true); }
        catch (error) { setMessage(error.response?.data?.error || t('config.bedDeleteError')); }
      }},
    ]);
  };

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <ConfigHeader title={t('config.bedsTitle')} navigation={navigation} onRefresh={onRefresh} />
      <View style={styles.content}>
        <Text style={styles.sectionTitle}>{editingId === null ? t('config.registerBed') : t('config.editBed')}</Text>
        <View style={styles.card}>
          <Text style={styles.label}>{t('config.bedNumber')}</Text>
          <TextInput style={styles.input} value={form.numero} onChangeText={(numero) => setForm({ ...form, numero })} placeholder={t('config.bedNumberPlaceholder')} />
          <Text style={styles.label}>{t('config.bedArea')}</Text>
          <View style={styles.wrapRow}>{['Hospitalizado', 'Urgencias'].map((v) => <Choice key={v} value={v} label={v} current={form.area} onPress={(area) => setForm({ ...form, area })} />)}</View>
          <Text style={styles.label}>{t('config.bedRoomType')}</Text>
          <View style={styles.wrapRow}>{['General', 'Observación', 'Terapia intensiva', 'Recuperación', 'Consulta'].map((v) => <Choice key={v} value={v} label={v} current={form.tipo_habitacion} onPress={(tipo_habitacion) => setForm({ ...form, tipo_habitacion })} />)}</View>
          <Text style={styles.label}>{t('config.bedFloor')}</Text>
          <TextInput style={styles.input} value={String(form.piso || '')} onChangeText={(piso) => setForm({ ...form, piso })} />
          <Text style={styles.label}>{t('config.bedSection')}</Text>
          <TextInput style={styles.input} value={form.seccion || ''} onChangeText={(seccion) => setForm({ ...form, seccion })} />
          <Text style={styles.label}>{t('config.bedStatus')}</Text>
          <View style={styles.wrapRow}>
            <Choice value={0} label={t('config.bedFree')} current={form.ocupada} onPress={(ocupada) => setForm({ ...form, ocupada })} />
            <Choice value={1} label={t('config.bedOccupied')} current={form.ocupada} onPress={(ocupada) => setForm({ ...form, ocupada })} />
          </View>
          <View style={styles.actionBar}>
            <TouchableOpacity style={styles.secondaryButton} onPress={reset}><Text style={styles.secondaryText}>{t('config.cancel')}</Text></TouchableOpacity>
            <TouchableOpacity style={styles.primaryButton} onPress={save}><Text style={styles.primaryText}>{editingId === null ? t('config.save') : t('config.update')}</Text></TouchableOpacity>
          </View>
        </View>

        {!!message && <View style={styles.messageBox}><Text style={styles.messageText}>{message}</Text></View>}

        <TextInput style={styles.searchInput} value={search} onChangeText={(v) => { setSearch(v); setPage(1); }} placeholder={t('config.bedSearchPlaceholder')} />
        <Text style={styles.sectionTitle}>{t('config.bedRegistered')} ({visible.length})</Text>

        {paged.map((cama) => (
          <View key={cama.id_cama} style={styles.card}>
            <View style={styles.between}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>Cama {cama.numero}</Text>
                <Text style={styles.cardSubtitle}>{cama.area} · {cama.tipo_habitacion || 'General'} · {t('config.bedFloor')} {cama.piso || 'N/A'} · {t('config.bedSection')} {cama.seccion || 'N/A'}</Text>
              </View>
              <View style={styles.badge}><Text style={styles.badgeText}>{cama.ocupada ? t('config.bedOccupied').toUpperCase() : t('config.bedFree').toUpperCase()}</Text></View>
            </View>
            <View style={styles.actionBar}>
              <TouchableOpacity style={styles.secondaryButton} onPress={() => edit(cama)}><Text style={styles.secondaryText}>{t('config.edit')}</Text></TouchableOpacity>
              <TouchableOpacity style={styles.dangerButton} onPress={() => remove(cama)}><Text style={styles.dangerText}>{t('config.delete')}</Text></TouchableOpacity>
            </View>
          </View>
        ))}

        {!loading && !visible.length && <Text style={styles.emptyText}>{t('config.noBedsRegistered')}</Text>}

        {totalPages > 1 && (
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
