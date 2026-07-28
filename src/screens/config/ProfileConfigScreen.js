import React, { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import ConfigHeader from './ConfigHeader';
import { configStyles as styles } from './ConfigStyles';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { getConfigCacheInfo } from './configCache';

export default function ProfileConfigScreen({ navigation }) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [info, setInfo] = useState(null);

  useEffect(() => { getConfigCacheInfo().then(setInfo); }, []);

  return (
    <ScrollView style={styles.container}>
      <ConfigHeader title={t('config.profileTitle')} navigation={navigation} />
      <View style={styles.content}>
        <View style={[styles.card, { alignItems: 'center', paddingVertical: 28 }]}>
          <View style={{ width: 86, height: 86, borderRadius: 43, backgroundColor: '#667eea', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
            <Text style={{ color: '#fff', fontSize: 36, fontWeight: '900' }}>{user?.username?.charAt(0)?.toUpperCase() || 'U'}</Text>
          </View>
          <Text style={styles.cardTitle}>{user?.username || t('config.sessionNotAvailable')}</Text>
          <View style={[styles.badge, { marginTop: 8 }]}>
            <Text style={styles.badgeText}>{user?.role?.toUpperCase() || '-'}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('config.sessionInfo')}</Text>
          <Text style={styles.cardSubtitle}>{t('config.sessionUser')}: {user?.username || t('config.sessionNotAvailable')}</Text>
          <Text style={styles.cardSubtitle}>{t('config.sessionRole')}: {user?.role || t('config.sessionNotAvailable')}</Text>
          {info && <Text style={styles.cardSubtitle}>{t('config.sessionCacheUpdate')}: {new Date(info.updatedAt).toLocaleString()}</Text>}
        </View>
      </View>
    </ScrollView>
  );
}
