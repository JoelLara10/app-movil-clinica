import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ConfigHeader from './ConfigHeader';
import { colors, configStyles as styles } from './ConfigStyles';
import { getConfigSection, saveConfigSection } from './configCache';
import { useLanguage } from '../../context/LanguageContext';

export default function GeneralSettingsScreen({ navigation }) {
  const { t } = useLanguage();
  const [form, setForm] = useState({
    nombreClinica: '',
    telefono: '',
    direccion: '',
    moneda: 'MXN',
    tema: 'Morado',
    apiHost: '192.168.1.4',
    apiPort: '5001',
    apiPath: '/api/v1',
  });

  useEffect(() => {
    getConfigSection('general').then((data) => setForm((old) => ({ ...old, ...data })));
  }, []);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const save = async () => {
    await saveConfigSection('general', form);
    Alert.alert(t('config.configSaved'), t('config.configSavedMsg'));
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 28 }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <ConfigHeader title={t('config.generalTitle')} navigation={navigation} />

      <View style={styles.content}>
        <View style={styles.card}>
          <View style={styles.sectionHeadingRow}>
            <View style={styles.sectionIcon}>
              <Ionicons name="business-outline" size={22} color={colors.primary} />
            </View>
            <View style={styles.sectionHeadingText}>
              <Text style={styles.cardTitle}>{t('config.clinicData')}</Text>
              <Text style={styles.cardSubtitle}>{t('config.clinicDataDesc')}</Text>
            </View>
          </View>

          <Text style={styles.label}>{t('config.clinicName')}</Text>
          <TextInput
            style={styles.input}
            value={form.nombreClinica}
            onChangeText={(value) => updateField('nombreClinica', value)}
          />

          <Text style={styles.label}>{t('config.clinicPhone')}</Text>
          <TextInput
            style={styles.input}
            value={form.telefono}
            onChangeText={(value) => updateField('telefono', value)}
            keyboardType="phone-pad"
          />

          <Text style={styles.label}>{t('config.clinicAddress')}</Text>
          <TextInput
            style={styles.input}
            value={form.direccion}
            onChangeText={(value) => updateField('direccion', value)}
          />

          <Text style={styles.label}>{t('config.clinicCurrency')}</Text>
          <TextInput
            style={styles.input}
            value={form.moneda}
            onChangeText={(value) => updateField('moneda', value.toUpperCase())}
            autoCapitalize="characters"
          />

          <Text style={styles.label}>{t('config.clinicTheme')}</Text>
          <TextInput
            style={styles.input}
            value={form.tema}
            onChangeText={(value) => updateField('tema', value)}
          />
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeadingRow}>
            <View style={styles.sectionIcon}>
              <Ionicons name="cloud-outline" size={22} color={colors.primary} />
            </View>
            <View style={styles.sectionHeadingText}>
              <Text style={styles.cardTitle}>{t('config.apiConnection')}</Text>
            </View>
          </View>

          <Text style={styles.label}>{t('config.apiHost')}</Text>
          <TextInput
            style={styles.input}
            value={form.apiHost}
            onChangeText={(value) => updateField('apiHost', value)}
            placeholder="api.ejemplo.com"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.label}>{t('config.apiPort')}</Text>
          <TextInput
            style={styles.input}
            value={form.apiPort}
            onChangeText={(value) => updateField('apiPort', value)}
            placeholder="443"
            keyboardType="number-pad"
          />

          <Text style={styles.label}>{t('config.apiPath')}</Text>
          <TextInput
            style={styles.input}
            value={form.apiPath}
            onChangeText={(value) => updateField('apiPath', value)}
            placeholder="/api/v1"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={save}
          accessibilityRole="button"
          accessibilityLabel={t('config.saveConfig')}
        >
          <Ionicons name="save-outline" size={20} color="#fff" />
          <Text style={[styles.primaryText, { marginLeft: 8 }]}>{t('config.saveConfig')}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
