import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import ConfigHeader from './ConfigHeader';
import { configStyles as styles } from './ConfigStyles';
import configurationService from '../../services/configurationService';
import { useLanguage } from '../../context/LanguageContext';

const defaults = { activo: false, tipo: 'completa', formato: 'json', intervalo: 1440, colecciones: [], max_backups: 4 };

const Choice = ({ value, label, current, onPress }) => (
  <TouchableOpacity style={[styles.optionChip, current === value && styles.optionChipActive]} onPress={() => onPress(value)}>
    <Text style={[styles.optionText, current === value && styles.optionTextActive]}>{label}</Text>
  </TouchableOpacity>
);

export default function AutomationConfigScreen({ navigation }) {
  const { t } = useLanguage();
  const [form, setForm] = useState(defaults);
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [config, names] = await Promise.all([configurationService.automation.get(), configurationService.backups.collections()]);
      setCollections(names);
      setForm({ ...defaults, ...config, colecciones: config.colecciones?.length ? config.colecciones : names });
    } catch (error) { setMessage(error.response?.data?.error || t('config.automationLoadError')); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const toggle = (name) => setForm((old) => ({
    ...old,
    colecciones: old.colecciones.includes(name) ? old.colecciones.filter((item) => item !== name) : [...old.colecciones, name],
  }));

  const save = async () => {
    setLoading(true);
    try {
      const result = await configurationService.automation.update({ ...form, intervalo: Number(form.intervalo), max_backups: Number(form.max_backups) });
      setForm(result); setMessage(t('config.automationSaved'));
    } catch (error) { setMessage(error.response?.data?.error || t('config.automationSaveError')); }
    finally { setLoading(false); }
  };

  return (
    <ScrollView style={styles.container}>
      <ConfigHeader title={t('config.automationTitle')} navigation={navigation} />
      <View style={styles.content}>
        <View style={styles.card}>
          <View style={styles.between}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{t('config.automationAutoBackups')}</Text>
              <Text style={styles.cardSubtitle}>{t('config.automationAutoBackupsDesc')}</Text>
            </View>
            <Switch value={form.activo} onValueChange={(activo) => setForm({ ...form, activo })} />
          </View>
        </View>

        <Text style={styles.label}>{t('config.backupType')}</Text>
        <View style={styles.wrapRow}>
          <Choice value="completa" label={t('config.backupFull')} current={form.tipo} onPress={(tipo) => setForm({ ...form, tipo })} />
          <Choice value="incremental" label={t('config.backupIncremental')} current={form.tipo} onPress={(tipo) => setForm({ ...form, tipo })} />
          <Choice value="diferencial" label={t('config.backupDifferential')} current={form.tipo} onPress={(tipo) => setForm({ ...form, tipo })} />
        </View>

        <Text style={styles.label}>{t('config.backupFormat')}</Text>
        <View style={styles.wrapRow}>
          {[['json', 'JSON'], ['csv', 'CSV'], ['xlsx', 'Excel'], ['pdf', 'PDF']].map(([v, l]) => (
            <Choice key={v} value={v} label={l} current={form.formato} onPress={(formato) => setForm({ ...form, formato })} />
          ))}
        </View>

        <Text style={styles.label}>{t('config.automationInterval')}</Text>
        <TextInput style={styles.input} keyboardType="number-pad" value={String(form.intervalo)} onChangeText={(intervalo) => setForm({ ...form, intervalo })} />

        <Text style={styles.label}>{t('config.automationMaxBackups')}</Text>
        <TextInput style={styles.input} keyboardType="number-pad" value={String(form.max_backups)} onChangeText={(max_backups) => setForm({ ...form, max_backups })} />

        <View style={styles.between}>
          <Text style={styles.sectionTitle}>{t('config.backupCollections')} ({form.colecciones.length}/{collections.length})</Text>
          <TouchableOpacity style={styles.secondaryButton} onPress={() => setForm({ ...form, colecciones: form.colecciones.length === collections.length ? [] : collections })}>
            <Text style={styles.secondaryText}>{form.colecciones.length === collections.length ? t('config.backupNone') : t('config.backupAll')}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.wrapRow}>
          {collections.map((name) => (
            <Choice key={name} value={name} label={name} current={form.colecciones.includes(name) ? name : ''} onPress={() => toggle(name)} />
          ))}
        </View>

        <TouchableOpacity disabled={loading} style={[styles.primaryButton, loading && styles.disabled]} onPress={save}>
          <Text style={styles.primaryText}>{loading ? t('config.automationSaving') : t('config.automationSave')}</Text>
        </TouchableOpacity>

        {!!message && <View style={styles.messageBox}><Text style={styles.messageText}>{message}</Text></View>}
      </View>
    </ScrollView>
  );
}
