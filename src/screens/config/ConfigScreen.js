import React from 'react';
import { ScrollView, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { configStyles as styles } from './ConfigStyles';
import { useLanguage } from '../../context/LanguageContext';

export default function ConfigScreen({ navigation }) {
  const { t } = useLanguage();
  const { width } = useWindowDimensions();
  const isTablet = width >= 760;

  const cards = [
    { titleKey: 'bedsManagement', descKey: 'bedsManagementDesc', badgeKey: 'badgeAdmin', icon: 'bed-outline', color: '#3182ce', screen: 'CamasConfig' },
    { titleKey: 'staffManagement', descKey: 'staffManagementDesc', badgeKey: 'badgeAdmin', icon: 'people-outline', color: '#38a169', screen: 'UsuariosConfig' },
    { titleKey: 'diagnostics', descKey: 'diagnosticsDesc', badgeKey: 'badgeMedico', icon: 'pulse-outline', color: '#ed8936', screen: 'DiagnosticosConfig' },
    { titleKey: 'services', descKey: 'servicesDesc', badgeKey: 'badgeCatalog', icon: 'medical-outline', color: '#f56565', screen: 'ServiciosConfig' },
    { titleKey: 'backups', descKey: 'backupsDesc', badgeKey: 'badgeAdmin', icon: 'shield-checkmark-outline', color: '#805ad5', screen: 'BackupConfig' },
    { titleKey: 'automation', descKey: 'automationDesc', badgeKey: 'badgeAdmin', icon: 'timer-outline', color: '#38b2ac', screen: 'AutomationConfig' },
    { titleKey: 'profile', descKey: 'profileDesc', badgeKey: 'badgeProfile', icon: 'person-outline', color: '#667eea', screen: 'ProfileConfig' },
  ];

  const cardWidth = isTablet ? '31.3%' : '48%';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 24 }}
      showsVerticalScrollIndicator={false}
    >
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.hero}>
        <Text style={styles.heroTitle}>{t('config.systemConfig')}</Text>
        <Text style={styles.heroSubtitle}>{t('config.systemConfigDesc')}</Text>
      </LinearGradient>

      <View style={styles.mainGrid}>
        {cards.map((item) => (
          <TouchableOpacity
            key={item.screen}
            activeOpacity={0.82}
            accessibilityRole="button"
            accessibilityLabel={t(`config.${item.titleKey}`)}
            style={[styles.menuCard, { width: cardWidth }]}
            onPress={() => navigation.navigate(item.screen)}
          >
            <View style={[styles.rolePill, { backgroundColor: item.color }]}>
              <Text style={styles.rolePillText}>{t(`config.${item.badgeKey}`)}</Text>
            </View>
            <View style={[styles.iconCircle, { backgroundColor: `${item.color}18` }]}>
              <Ionicons name={item.icon} size={30} color={item.color} />
            </View>
            <Text style={styles.menuTitle}>{t(`config.${item.titleKey}`)}</Text>
            <Text style={styles.menuDesc} numberOfLines={3}>
              {t(`config.${item.descKey}`)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}
