import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, RefreshControl, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import ConfigHeader from './ConfigHeader';
import { configStyles as styles } from './ConfigStyles';
import configurationService from '../../services/configurationService';
import CacheService from '../../services/cacheService';
import { useLanguage } from '../../context/LanguageContext';

const CACHE_KEY = 'config_servicios';
const CACHE_TTL = 5 * 60 * 1000;
const ITEMS_PER_PAGE = 8;

const emptyForm = { serv_cve: '', serv_desc: '', serv_costo: '', serv_umed: 'SERVICIO', tipo: '1', proveedor: '1', grupo: 'SERVICIOS HOSPITALARIOS', codigo_sat: '', c_cveuni: '', iva: '16', serv_activo: 'SI' };

const getTotalPages = (data) => Math.max(1, Math.ceil(data.length / ITEMS_PER_PAGE));
const getPagedData = (data, page) => data.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

const Choice = ({ value, label, current, onPress }) => (
  <TouchableOpacity style={[styles.optionChip, current === value && styles.optionChipActive]} onPress={() => onPress(value)}>
    <Text style={[styles.optionText, current === value && styles.optionTextActive]}>{label}</Text>
  </TouchableOpacity>
);

export default function ServiciosConfigScreen({ navigation }) {
  const { t } = useLanguage();
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState('');
  const [page, setPage] = useState(1);

  const tipos = useMemo(() => ({
    1: t('config.serviceTypeConsulta'),
    2: t('config.serviceTypeProcedimiento'),
    3: t('config.serviceTypeLaboratorio'),
    4: t('config.serviceTypeGabinete'),
    5: t('config.serviceTypeHospitalizacion'),
  }), [t]);

  const fieldDefs = useMemo(() => [
    ['serv_cve', t('config.serviceKey'), t('config.serviceKeyPlaceholder')],
    ['serv_desc', t('config.serviceDesc'), t('config.serviceDescPlaceholder')],
    ['serv_costo', t('config.servicePrice'), t('config.servicePricePlaceholder')],
    ['codigo_sat', t('config.serviceSatCode'), t('config.serviceSatCodePlaceholder')],
    ['c_cveuni', t('config.serviceUnitKey'), t('config.serviceUnitKeyPlaceholder')],
    ['iva', t('config.serviceIva'), t('config.serviceIvaPlaceholder')],
  ], [t]);

  const load = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    try {
      if (!forceRefresh) {
        const cached = await CacheService.get(CACHE_KEY);
        if (cached) { setItems(cached); setLoading(false); return; }
      }
      const data = await configurationService.services.list();
      const list = Array.isArray(data) ? data : [];
      await CacheService.set(CACHE_KEY, list, CACHE_TTL);
      setItems(list);
    } catch (error) {
      const cached = await CacheService.get(CACHE_KEY);
      if (cached) { setItems(cached); setMessage(t('config.noConnection')); }
      else setMessage(error.response?.data?.error || t('config.serviceLoadError'));
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
    return q ? items.filter((s) => [s.serv_cve, s.serv_desc, tipos[s.tipo], s.grupo].join(' ').toLowerCase().includes(q)) : items;
  }, [items, search, tipos]);

  const paged = useMemo(() => getPagedData(visible, page), [visible, page]);
  const totalPages = getTotalPages(visible);

  const reset = () => { setForm(emptyForm); setEditId(null); };

  const save = async () => {
    if (!form.serv_cve.trim() || !form.serv_desc.trim() || form.serv_costo === '')
      return Alert.alert(t('config.serviceMissingData'), t('config.serviceMissingDataMsg'));
    try {
      const payload = { ...form, serv_cve: form.serv_cve.trim().toUpperCase(), serv_desc: form.serv_desc.trim() };
      if (editId === null) await configurationService.services.create(payload);
      else await configurationService.services.update(editId, payload);
      setMessage(editId === null ? t('config.serviceSaved') : t('config.serviceUpdated'));
      reset(); await load(true);
    } catch (error) { setMessage(error.response?.data?.error || t('config.serviceSaveError')); }
  };

  const remove = (item) => Alert.alert(t('config.serviceDeleteTitle'), `${t('config.serviceDeleteMsg')} ${item.serv_cve}?`, [
    { text: t('config.cancel'), style: 'cancel' },
    { text: t('config.delete'), style: 'destructive', onPress: async () => {
      try { await configurationService.services.remove(item.id_serv); setMessage(t('config.serviceDeleted')); await load(true); }
      catch (error) { setMessage(error.response?.data?.error || t('config.serviceDeleteError')); }
    }},
  ]);

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <ConfigHeader title={t('config.servicesTitle')} navigation={navigation} onRefresh={onRefresh} />
      <View style={styles.content}>
        <Text style={styles.sectionTitle}>{editId === null ? t('config.registerService') : t('config.editService')}</Text>
        <View style={styles.card}>
          {fieldDefs.map(([key, label, placeholder]) => (
            <React.Fragment key={key}>
              <Text style={styles.label}>{label}</Text>
              <TextInput
                style={styles.input}
                value={String(form[key] ?? '')}
                placeholder={placeholder}
                keyboardType={key === 'serv_costo' || key === 'iva' ? 'decimal-pad' : 'default'}
                onChangeText={(value) => setForm({ ...form, [key]: key === 'serv_cve' || key === 'c_cveuni' ? value.toUpperCase() : value })}
              />
            </React.Fragment>
          ))}
          <Text style={styles.label}>{t('config.serviceUnit')}</Text>
          <View style={styles.wrapRow}>{['CONSULTA', 'EQUIPO', 'ESTUDIO', 'HORA', 'SERVICIO'].map((v) => <Choice key={v} value={v} label={v} current={form.serv_umed} onPress={(serv_umed) => setForm({ ...form, serv_umed })} />)}</View>
          <Text style={styles.label}>{t('config.serviceType')}</Text>
          <View style={styles.wrapRow}>{Object.entries(tipos).map(([v, label]) => <Choice key={v} value={v} label={label} current={String(form.tipo)} onPress={(tipo) => setForm({ ...form, tipo })} />)}</View>
          <Text style={styles.label}>{t('config.serviceState')}</Text>
          <View style={styles.wrapRow}>
            <Choice value="SI" label={t('config.serviceActive')} current={form.serv_activo} onPress={(serv_activo) => setForm({ ...form, serv_activo })} />
            <Choice value="NO" label={t('config.serviceInactive')} current={form.serv_activo} onPress={(serv_activo) => setForm({ ...form, serv_activo })} />
          </View>
          <View style={styles.actionBar}>
            <TouchableOpacity style={styles.secondaryButton} onPress={reset}><Text style={styles.secondaryText}>{t('config.cancel')}</Text></TouchableOpacity>
            <TouchableOpacity style={styles.primaryButton} onPress={save}><Text style={styles.primaryText}>{editId === null ? t('config.save') : t('config.update')}</Text></TouchableOpacity>
          </View>
        </View>

        {!!message && <View style={styles.messageBox}><Text style={styles.messageText}>{message}</Text></View>}

        <TextInput style={styles.searchInput} value={search} onChangeText={(v) => { setSearch(v); setPage(1); }} placeholder={t('config.serviceSearchPlaceholder')} />
        <Text style={styles.sectionTitle}>{t('config.servicesRegistered')} ({visible.length})</Text>

        {paged.map((item) => (
          <View key={item.id_serv} style={styles.card}>
            <View style={styles.between}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{item.serv_cve} · {item.serv_desc}</Text>
                <Text style={styles.cardSubtitle}>{tipos[item.tipo] || '-'} · {item.serv_umed} · ${Number(item.serv_costo || 0).toFixed(2)}</Text>
              </View>
              <View style={styles.badge}><Text style={styles.badgeText}>{item.serv_activo === 'SI' ? t('config.serviceActive').toUpperCase() : t('config.serviceInactive').toUpperCase()}</Text></View>
            </View>
            <View style={styles.actionBar}>
              <TouchableOpacity style={styles.secondaryButton} onPress={() => { setEditId(item.id_serv); setForm({ ...emptyForm, ...item, iva: String(Number(item.iva || 0) <= 1 ? Number(item.iva || 0) * 100 : item.iva) }); }}>
                <Text style={styles.secondaryText}>{t('config.edit')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.dangerButton} onPress={() => remove(item)}>
                <Text style={styles.dangerText}>{t('config.delete')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {!loading && !visible.length && <Text style={styles.emptyText}>{t('config.noServicesRegistered')}</Text>}

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
