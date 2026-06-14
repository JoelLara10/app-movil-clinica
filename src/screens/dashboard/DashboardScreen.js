// src/screens/dashboard/DashboardScreen.js - Versión corregida

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import moment from 'moment';
import 'moment/locale/es';

moment.locale('es');

const DashboardScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState({
    active_patients: { total: 0, by_area: {} },
    bed_occupancy: { total: 0, occupied: 0, available: 0, percentage: 0 },
    pending_exams: 0,
    today_attentions: 0
  });
  const [pendingStudies, setPendingStudies] = useState({ laboratorio: 0, gabinete: 0, total: 0 });
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Intentar cargar dashboard stats
      try {
        const statsRes = await api.get('/analytics/dashboard');
        setStats(statsRes.data);
      } catch (error) {
        console.log('Dashboard stats endpoint not available yet');
        // Usar datos por defecto
      }
      
      // Intentar cargar estudios counts
      try {
        const studiesRes = await api.get('/studies/counts');
        setPendingStudies(studiesRes.data);
      } catch (error) {
        console.log('Studies counts endpoint not available yet');
        // Usar datos por defecto
      }
      
    } catch (error) {
      console.error('Error loading dashboard:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const getMenuOptions = () => {
    const role = user?.role;
    const options = [];

    if (role === 'admin' || role === 'administrativo') {
      options.push(
        { name: 'Administrativo', icon: 'business-outline', screen: 'Admin', color: '#667eea', description: 'Gestión de pacientes y cuentas' },
        { name: 'Médico', icon: 'medkit-outline', screen: 'Medico', color: '#48bb78', description: 'Atención médica y recetas' },
        { name: 'Estudios', icon: 'flask-outline', screen: 'Estudios', color: '#ed8936', description: 'Gestión de exámenes', badge: pendingStudies.total },
        { name: 'Configuración', icon: 'settings-outline', screen: 'Config', color: '#718096', description: 'Configuración del sistema' }
      );
    } else if (role === 'medico') {
      options.push(
        { name: 'Médico', icon: 'medkit-outline', screen: 'Medico', color: '#48bb78', description: 'Atención médica' },
        { name: 'Estudios', icon: 'flask-outline', screen: 'Estudios', color: '#ed8936', description: 'Resultados de estudios', badge: pendingStudies.total }
      );
    } else if (role === 'estudios') {
      options.push(
        { name: 'Estudios', icon: 'flask-outline', screen: 'Estudios', color: '#ed8936', description: 'Gestión de exámenes', badge: pendingStudies.total }
      );
    }

    return options;
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>¡Hola, {user?.username}!</Text>
            <Text style={styles.date}>{moment().format('dddd, D [de] MMMM [de] YYYY')}</Text>
          </View>
          <TouchableOpacity onPress={logout} style={styles.logoutButton}>
            <Ionicons name="log-out-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Ionicons name="people-outline" size={32} color="#667eea" />
          <Text style={styles.statNumber}>{stats.active_patients?.total || 0}</Text>
          <Text style={styles.statLabel}>Pacientes Activos</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="bed-outline" size={32} color="#48bb78" />
          <Text style={styles.statNumber}>{stats.bed_occupancy?.occupied || 0}</Text>
          <Text style={styles.statLabel}>Camas Ocupadas</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="flask-outline" size={32} color="#ed8936" />
          <Text style={styles.statNumber}>{pendingStudies.total || 0}</Text>
          <Text style={styles.statLabel}>Estudios Pendientes</Text>
        </View>
      </View>

      <View style={styles.menuContainer}>
        <Text style={styles.menuTitle}>Módulos del Sistema</Text>
        <View style={styles.menuGrid}>
          {getMenuOptions().map((option, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuCard}
              onPress={() => navigation.navigate(option.screen)}
            >
              <View style={[styles.menuIcon, { backgroundColor: option.color + '20' }]}>
                <Ionicons name={option.icon} size={32} color={option.color} />
              </View>
              <Text style={styles.menuName}>{option.name}</Text>
              <Text style={styles.menuDescription}>{option.description}</Text>
              {option.badge > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{option.badge}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );
};

const loadDashboardData = async () => {
  try {
    // CAMBIA /analytics/dashboard a /dashboard
    const statsRes = await api.get('/dashboard');
    setStats(statsRes.data);
    
    // CAMBIA /studies/counts a /counts
    const studiesRes = await api.get('/counts');
    setPendingStudies(studiesRes.data);
    
  } catch (error) {
    console.error('Error loading dashboard:', error);
  }
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7fafc' },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  date: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  logoutButton: { padding: 8 },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: -30,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: { fontSize: 24, fontWeight: 'bold', color: '#2d3748', marginTop: 8 },
  statLabel: { fontSize: 12, color: '#718096', marginTop: 4 },
  menuContainer: { padding: 20 },
  menuTitle: { fontSize: 18, fontWeight: '600', color: '#2d3748', marginBottom: 16 },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  menuCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  menuIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  menuName: { fontSize: 16, fontWeight: '600', color: '#2d3748', marginBottom: 4 },
  menuDescription: { fontSize: 12, color: '#718096', textAlign: 'center' },
  badge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#e53e3e',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
});

export default DashboardScreen;