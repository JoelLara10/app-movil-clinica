import React, { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import ConfigHeader from './ConfigHeader';
import { configStyles as styles } from './ConfigStyles';
import { useAuth } from '../../context/AuthContext';
import { getConfigCacheInfo } from './configCache';

export default function ProfileConfigScreen({ navigation }) {
  const { user } = useAuth();
  const [info, setInfo] = useState(null);

  useEffect(() => { getConfigCacheInfo().then(setInfo); }, []);

  return (
    <ScrollView style={styles.container}>
      <ConfigHeader title="Mi Perfil" navigation={navigation} />
      <View style={styles.content}>
        <View style={[styles.card, { alignItems: 'center', paddingVertical: 28 }]}> 
          <View style={{ width: 86, height: 86, borderRadius: 43, backgroundColor: '#667eea', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
            <Text style={{ color: '#fff', fontSize: 36, fontWeight: '900' }}>{user?.username?.charAt(0)?.toUpperCase() || 'U'}</Text>
          </View>
          <Text style={styles.cardTitle}>{user?.username || 'Usuario'}</Text>
          <View style={[styles.badge, { marginTop: 8 }]}><Text style={styles.badgeText}>{user?.role?.toUpperCase() || 'SIN ROL'}</Text></View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Información de sesión</Text>
          <Text style={styles.cardSubtitle}>Usuario: {user?.username || 'No disponible'}</Text>
          <Text style={styles.cardSubtitle}>Rol: {user?.role || 'No disponible'}</Text>
          {info && <Text style={styles.cardSubtitle}>Último cambio de caché: {new Date(info.updatedAt).toLocaleString()}</Text>}
        </View>
      </View>
    </ScrollView>
  );
}
