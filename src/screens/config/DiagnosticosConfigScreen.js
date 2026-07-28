import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, RefreshControl, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import ConfigHeader from './ConfigHeader';
import { configStyles as styles } from './ConfigStyles';
import configurationService from '../../services/configurationService';
import { useLanguage } from '../../context/LanguageContext';

const emptyForm = { id_cie10: '', diag: '' };

export default function DiagnosticosConfigScreen({ navigation }) {
  const { t } = useLanguage();
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try { const data = await configurationService.diagnostics.list(); setItems(Array.isArray(data) ? data : []); }
    catch (error) { setMessage(error.response?.data?.error || t('config.diagnosisLoadError')); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? items.filter((d) => `${d.id_cie10} ${d.diag}`.toLowerCase().includes(q)) : items;
  }, [items, search]);

  const reset = () => { setForm(emptyForm); setEditId(null); };

  const save = async () => {
    if (!form.id_cie10.trim() || !form.diag.trim()) return Alert.alert(t('config.diagnosisMissingData'), t('config.diagnosisMissingDataMsg'));
    try {
      const payload = { id_cie10: form.id_cie10.trim().toUpperCase(), diag: form.diag.trim() };
      if (editId === null) await configurationService.diagnostics.create(payload);
      else await configurationService.diagnostics.update(editId, payload);
      setMessage(editId === null ? t('config.diagnosisSaved') : t('config.diagnosisUpdated'));
      reset(); await load();
    } catch (error) { setMessage(error.response?.data?.error || t('config.diagnosisSaveError')); }
  };

  const remove = (item) => Alert.alert(t('config.diagnosisDeleteTitle'), `${t('config.diagnosisDeleteMsg')} ${item.id_cie10}?`, [
    { text: t('config.cancel'), style: 'cancel' },
    { text: t('config.delete'), style: 'destructive', onPress: async () => {
      try { await configurationService.diagnostics.remove(item.id_diag); setMessage(t('config.diagnosisDeleted')); await load(); }
      catch (error) { setMessage(error.response?.data?.error || t('config.diagnosisDeleteError')); }
    }},
  ]);

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}>
      <ConfigHeader title={t('config.diagnosticsTitle')} navigation={navigation} onRefresh={load} />
      <View style={styles.content}>
        <Text style={styles.sectionTitle}>{editId === null ? t('config.registerDiagnosis') : t('config.editDiagnosis')}</Text>
        <View style={styles.card}>
          <Text style={styles.label}>{t('config.cie10Key')}</Text>
          <TextInput style={styles.input} value={form.id_cie10} autoCapitalize="characters" onChangeText={(id_cie10) => setForm({ ...form, id_cie10: id_cie10.toUpperCase() })} placeholder={t('config.cie10Placeholder')} />
          <Text style={styles.label}>{t('config.diagnosisLabel')}</Text>
          <TextInput style={[styles.input, styles.inputMultiline]} multiline value={form.diag} onChangeText={(diag) => setForm({ ...form, diag })} />
          <View style={styles.actionBar}>
            <TouchableOpacity style={styles.secondaryButton} onPress={reset}><Text style={styles.secondaryText}>{t('config.cancel')}</Text></TouchableOpacity>
            <TouchableOpacity style={styles.primaryButton} onPress={save}><Text style={styles.primaryText}>{editId === null ? t('config.save') : t('config.update')}</Text></TouchableOpacity>
          </View>
        </View>

        {!!message && <View style={styles.messageBox}><Text style={styles.messageText}>{message}</Text></View>}

        <TextInput style={styles.searchInput} value={search} onChangeText={setSearch} placeholder={t('config.diagnosisSearchPlaceholder')} />
        <Text style={styles.sectionTitle}>{t('config.diagnosisRegistered')} ({visible.length})</Text>

        {visible.map((item) => (
          <View key={item.id_diag} style={styles.card}>
            <Text style={styles.cardTitle}>{item.id_cie10}</Text>
            <Text style={styles.cardSubtitle}>{item.diag}</Text>
            <View style={styles.actionBar}>
              <TouchableOpacity style={styles.secondaryButton} onPress={() => { setEditId(item.id_diag); setForm({ id_cie10: item.id_cie10 || '', diag: item.diag || '' }); }}>
                <Text style={styles.secondaryText}>{t('config.edit')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.dangerButton} onPress={() => remove(item)}>
                <Text style={styles.dangerText}>{t('config.delete')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {!loading && !visible.length && <Text style={styles.emptyText}>{t('config.noDiagnosticsRegistered')}</Text>}
      </View>
    </ScrollView>
  );
}
