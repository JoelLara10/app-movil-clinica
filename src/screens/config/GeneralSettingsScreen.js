import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import ConfigHeader from './ConfigHeader';
import { configStyles as styles } from './ConfigStyles';
import { getConfigSection, saveConfigSection } from './configCache';
import { useLanguage } from '../../context/LanguageContext';

export default function GeneralSettingsScreen({ navigation }) {
  const { t } = useLanguage();
  const [form, setForm] = useState({ nombreClinica: '', telefono: '', direccion: '', moneda: 'MXN', tema: 'Morado', apiHost: '192.168.1.4', apiPort: '5001', apiPath: '/api/v1' });

  useEffect(() => { getConfigSection('general').then((data) => setForm((old) => ({ ...old, ...data }))); }, []);

  const save = async () => {
    await saveConfigSection('general', form);
    Alert.alert(t('config.configSaved'), t('config.configSavedMsg'));
  };

  return (
    <ScrollView style={styles.container}>
      <ConfigHeader title={t('config.generalTitle')} navigation={navigation} />
      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🏥 {t('config.clinicData')}</Text>
          <Text style={styles.cardSubtitle}>{t('config.clinicDataDesc')}</Text>
        </View>

        <Text style={styles.label}>{t('config.clinicName')}</Text>
        <TextInput style={styles.input} value={form.nombreClinica} onChangeText={(v) => setForm({ ...form, nombreClinica: v })} />
        <Text style={styles.label}>{t('config.clinicPhone')}</Text>
        <TextInput style={styles.input} value={form.telefono} onChangeText={(v) => setForm({ ...form, telefono: v })} keyboardType="phone-pad" />
        <Text style={styles.label}>{t('config.clinicAddress')}</Text>
        <TextInput style={styles.input} value={form.direccion} onChangeText={(v) => setForm({ ...form, direccion: v })} />
        <Text style={styles.label}>{t('config.clinicCurrency')}</Text>
        <TextInput style={styles.input} value={form.moneda} onChangeText={(v) => setForm({ ...form, moneda: v.toUpperCase() })} autoCapitalize="characters" />
        <Text style={styles.label}>{t('config.clinicTheme')}</Text>
        <TextInput style={styles.input} value={form.tema} onChangeText={(v) => setForm({ ...form, tema: v })} />

        <Text style={styles.sectionTitle}>{t('config.apiConnection')}</Text>
        <Text style={styles.label}>{t('config.apiHost')}</Text>
        <TextInput style={styles.input} value={form.apiHost} onChangeText={(v) => setForm({ ...form, apiHost: v })} placeholder="192.168.1.4" />
        <Text style={styles.label}>{t('config.apiPort')}</Text>
        <TextInput style={styles.input} value={form.apiPort} onChangeText={(v) => setForm({ ...form, apiPort: v })} placeholder="5001" keyboardType="number-pad" />
        <Text style={styles.label}>{t('config.apiPath')}</Text>
        <TextInput style={styles.input} value={form.apiPath} onChangeText={(v) => setForm({ ...form, apiPath: v })} placeholder="/api/v1" />

        <TouchableOpacity style={styles.primaryButton} onPress={save}>
          <Text style={styles.primaryText}>{t('config.saveConfig')}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
