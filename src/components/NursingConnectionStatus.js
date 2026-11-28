import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../context/LanguageContext';

export default function NursingConnectionStatus({ status, message }) {
  const { t } = useLanguage();
  if (!['remote', 'cache', 'error'].includes(status)) return null;
  const remote = status === 'remote';
  const label = remote ? t('enfermeria.remoteDataLoaded') : status === 'cache'
    ? t('enfermeria.cachedDataWarning') : message || t('enfermeria.remoteConnectionError');
  return <View style={[styles.card, styles[status]]} accessibilityLiveRegion="polite">
    <Ionicons name={remote ? 'cloud-done-outline' : 'cloud-offline-outline'} size={18}
      color={remote ? '#276749' : '#9c4221'} />
    <Text accessibilityRole={remote ? 'text' : 'alert'} style={styles.label}>{label}</Text>
  </View>;
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 16, marginTop: 12, paddingHorizontal: 14,
    paddingVertical: 10, borderRadius: 10, borderWidth: 1,
  },
  remote: { backgroundColor: '#f0fff4', borderColor: '#9ae6b4' },
  cache: { backgroundColor: '#fffaf0', borderColor: '#fbd38d' },
  error: { backgroundColor: '#fff5f5', borderColor: '#feb2b2' },
  label: { flex: 1, fontSize: 12, color: '#2d3748' },
});
