import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { configStyles as styles } from './ConfigStyles';

export default function ConfigScreen({ navigation }) {
  const cards = [
    { title: 'Gestión de Camas', desc: 'Administra la disponibilidad y asignación de camas hospitalarias', badge: 'ADMINISTRADOR', emoji: '🏥', color: '#3182ce', screen: 'CamasConfig' },
    { title: 'Gestión de Personal', desc: 'Administra usuarios, roles y permisos del sistema', badge: 'ADMINISTRADOR', emoji: '👥', color: '#38a169', screen: 'UsuariosConfig' },
    { title: 'Diagnósticos', desc: 'Catálogo de diagnósticos y códigos CIE-10', badge: 'MÉDICO', emoji: '〽️', color: '#ed8936', screen: 'DiagnosticosConfig' },
    { title: 'Servicios', desc: 'Catálogo de servicios y procedimientos médicos', badge: 'CATÁLOGO', emoji: '+', color: '#f56565', screen: 'ServiciosConfig' },
    { title: 'Copias de Seguridad', desc: 'Respaldo y restauración de la base de datos', badge: 'ADMINISTRADOR', emoji: '🛡️', color: '#805ad5', screen: 'BackupConfig' },
    { title: 'Rendimiento', desc: 'Monitoreo de CPU, RAM, disco y actividad del sistema', badge: 'MONITOREO', emoji: '📈', color: '#38b2ac', screen: 'AutomationConfig' },
  ];

  return (
    <LinearGradient colors={['#667eea', '#764ba2']} style={styles.gradientPage}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Configuración del Sistema</Text>
          <Text style={styles.heroSubtitle}>Administra módulos, catálogos, usuarios, respaldos y parámetros del sistema INEO.</Text>
        </View>

        <View style={styles.mainGrid}>
          {cards.map((item) => (
            <TouchableOpacity key={item.title} activeOpacity={0.88} style={styles.menuCard} onPress={() => navigation.navigate(item.screen)}>
              <View style={[styles.rolePill, { backgroundColor: item.color }]}><Text style={styles.rolePillText}>{item.badge}</Text></View>
              <View style={[styles.iconCircle, { backgroundColor: item.color }]}><Text style={styles.iconText}>{item.emoji}</Text></View>
              <Text style={styles.menuTitle}>{item.title}</Text>
              <Text style={styles.menuDesc}>{item.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </LinearGradient>
  );
}
