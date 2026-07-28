import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { configStyles as styles } from './ConfigStyles';
import { useLanguage } from '../../context/LanguageContext';

export default function ConfigScreen({ navigation }) {
  const { t } = useLanguage();

  const cards = [
    { titleKey: 'bedsManagement', descKey: 'bedsManagementDesc', badgeKey: 'badgeAdmin', emoji: '🏥', color: '#3182ce', screen: 'CamasConfig' },
    { titleKey: 'staffManagement', descKey: 'staffManagementDesc', badgeKey: 'badgeAdmin', emoji: '👥', color: '#38a169', screen: 'UsuariosConfig' },
    { titleKey: 'diagnostics', descKey: 'diagnosticsDesc', badgeKey: 'badgeMedico', emoji: '〽️', color: '#ed8936', screen: 'DiagnosticosConfig' },
    { titleKey: 'services', descKey: 'servicesDesc', badgeKey: 'badgeCatalog', emoji: '+', color: '#f56565', screen: 'ServiciosConfig' },
    { titleKey: 'backups', descKey: 'backupsDesc', badgeKey: 'badgeAdmin', emoji: '🛡️', color: '#805ad5', screen: 'BackupConfig' },
    { titleKey: 'automation', descKey: 'automationDesc', badgeKey: 'badgeAdmin', emoji: '⏱️', color: '#38b2ac', screen: 'AutomationConfig' },
  ];

  return (
    <LinearGradient colors={['#667eea', '#764ba2']} style={styles.gradientPage}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>{t('config.systemConfig')}</Text>
          <Text style={styles.heroSubtitle}>{t('config.systemConfigDesc')}</Text>
        </View>

        <View style={styles.mainGrid}>
          {cards.map((item) => (
            <TouchableOpacity key={item.screen} activeOpacity={0.88} style={styles.menuCard} onPress={() => navigation.navigate(item.screen)}>
              <View style={[styles.rolePill, { backgroundColor: item.color }]}>
                <Text style={styles.rolePillText}>{t(`config.${item.badgeKey}`)}</Text>
              </View>
              <View style={[styles.iconCircle, { backgroundColor: item.color }]}>
                <Text style={styles.iconText}>{item.emoji}</Text>
              </View>
              <Text style={styles.menuTitle}>{t(`config.${item.titleKey}`)}</Text>
              <Text style={styles.menuDesc}>{t(`config.${item.descKey}`)}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </LinearGradient>
  );
}
