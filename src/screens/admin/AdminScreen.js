import React from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const AdminScreen = ({ navigation }) => {
  const menuItems = [
    { title: 'Gestion de Pacientes', icon: 'people-outline', screen: 'Pacientes', color: '#667eea' },
    { title: 'Nuevo Paciente', icon: 'person-add-outline', screen: 'NuevoPaciente', color: '#48bb78' },
    { title: 'Cuenta Paciente', icon: 'receipt-outline', screen: 'PacienteDetail', color: '#ed8936' },
    { title: 'Censo de Pacientes', icon: 'stats-chart-outline', screen: 'Censo', color: '#38b2ac' },
    { title: 'Corte de Caja', icon: 'cash-outline', screen: 'CorteCaja', color: '#ecc94b' },
    { title: 'Camas', icon: 'bed-outline', screen: 'Camas', color: '#9f7aea' },
  ];

  const handleOpen = (item) => {
    if (item.pending) {
      Alert.alert('Proximamente', `Modulo ${item.title}`);
      return;
    }
    navigation.navigate(item.screen);
  };

  return (
    <ScrollView
      style={styles.container}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.contentContainer}
    >
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Administrativo</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Modulos Administrativos</Text>
        <View style={styles.grid}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.title}
              style={styles.card}
              onPress={() => handleOpen(item)}
            >
              <View style={[styles.iconContainer, { backgroundColor: `${item.color}20` }]}>
                <Ionicons name={item.icon} size={32} color={item.color} />
              </View>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardHint}>{item.pending ? 'Pendiente' : 'Abrir modulo'}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7fafc' },
  contentContainer: { paddingBottom: 28 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  content: { padding: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#2d3748', marginBottom: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    boxShadow: '0 2px 8px rgba(45, 55, 72, 0.10)',
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: { fontSize: 14, fontWeight: '600', color: '#2d3748', textAlign: 'center' },
  cardHint: { fontSize: 11, color: '#718096', marginTop: 6, textAlign: 'center' },
});

export default AdminScreen;
