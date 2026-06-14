import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const EstudiosScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('pendientes');
  const [pendingExams, setPendingExams] = useState([]);
  const [completedExams, setCompletedExams] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [counts, setCounts] = useState({ laboratorio: 0, gabinete: 0, total: 0 });

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      if (activeTab === 'pendientes') {
        const response = await api.get('/studies/pending');
        setPendingExams(response.data);
      } else {
        const response = await api.get('/studies/completed');
        setCompletedExams(response.data);
      }
      
      const countsResponse = await api.get('/studies/counts');
      setCounts(countsResponse.data);
    } catch (error) {
      console.error('Error loading studies:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleUpload = (id_examen) => {
    Alert.alert(
      'Subir Resultados',
      '¿Qué tipo de estudio deseas subir?',
      [
        { text: 'Laboratorio 🧪', onPress: () => navigation.navigate('SubirResultadoLab', { id_examen }) },
        { text: 'Gabinete 📊', onPress: () => navigation.navigate('SubirResultadoGab', { id_examen }) },
        { text: 'Cancelar', style: 'cancel' },
      ]
    );
  };

  const handleView = (id_examen) => {
    Alert.alert(
      'Ver Resultados',
      '¿Qué tipo de estudio deseas ver?',
      [
        { text: 'Laboratorio 🧪', onPress: () => navigation.navigate('VerResultadoLab', { id_examen }) },
        { text: 'Gabinete 📊', onPress: () => navigation.navigate('VerResultadoGab', { id_examen }) },
        { text: 'Cancelar', style: 'cancel' },
      ]
    );
  };

  const renderPendingItem = (item, index) => (
    <TouchableOpacity key={index} style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.paciente?.charAt(0) || 'P'}</Text>
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.patientName}>{item.paciente}</Text>
          <Text style={styles.patientDetail}>👨‍⚕️ Médico: {item.medico || 'No asignado'}</Text>
        </View>
      </View>
      
      <View style={styles.cardBody}>
        <View style={styles.infoRow}>
          <Text style={styles.infoIcon}>🔬</Text>
          <Text style={styles.examsList}>Estudios: {item.estudios}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoIcon}>📅</Text>
          <Text style={styles.dateText}>Solicitado: {new Date(item.fecha).toLocaleDateString()}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoIcon}>🛏️</Text>
          <Text style={styles.dateText}>Habitación: {item.habitacion || 'N/A'}</Text>
        </View>
      </View>
      
      <TouchableOpacity 
        style={styles.uploadButton}
        onPress={() => handleUpload(item.id_examen)}
      >
        <Text style={styles.uploadEmoji}>📤</Text>
        <Text style={styles.uploadText}>Subir Resultados</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderCompletedItem = (item, index) => (
    <TouchableOpacity 
      key={index}
      style={styles.card}
      onPress={() => handleView(item.id_examen)}
    >
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.paciente?.charAt(0) || 'P'}</Text>
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.patientName}>{item.paciente}</Text>
          <Text style={styles.patientDetail}>👨‍⚕️ Médico: {item.medico || 'No asignado'}</Text>
        </View>
        <View style={styles.completedBadge}>
          <Text style={styles.completedEmoji}>✅</Text>
        </View>
      </View>
      
      <View style={styles.cardBody}>
        <View style={styles.infoRow}>
          <Text style={styles.infoIcon}>🔬</Text>
          <Text style={styles.examsList}>Estudios: {item.estudios}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoIcon}>📅</Text>
          <Text style={styles.dateText}>
            Realizado: {item.fecha_realizado ? new Date(item.fecha_realizado).toLocaleDateString() : 'Fecha no disponible'}
          </Text>
        </View>
      </View>
      
      <View style={styles.viewButton}>
        <Text style={styles.viewEmoji}>👁️</Text>
        <Text style={styles.viewText}>Ver Resultados</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🔬 Módulo de Estudios</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statEmoji}>🧪</Text>
          <Text style={styles.statNumber}>{counts.laboratorio}</Text>
          <Text style={styles.statLabel}>Laboratorio</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statEmoji}>📊</Text>
          <Text style={styles.statNumber}>{counts.gabinete}</Text>
          <Text style={styles.statLabel}>Gabinete</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statEmoji}>⚠️</Text>
          <Text style={styles.statNumber}>{counts.total}</Text>
          <Text style={styles.statLabel}>Total Pendientes</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'pendientes' && styles.activeTab]}
          onPress={() => setActiveTab('pendientes')}
        >
          <Text style={[styles.tabText, activeTab === 'pendientes' && styles.activeTabText]}>
            ⏳ Pendientes ({pendingExams.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'realizados' && styles.activeTab]}
          onPress={() => setActiveTab('realizados')}
        >
          <Text style={[styles.tabText, activeTab === 'realizados' && styles.activeTabText]}>
            ✅ Realizados ({completedExams.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {activeTab === 'pendientes' && pendingExams.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🎉</Text>
            <Text style={styles.emptyText}>No hay estudios pendientes</Text>
            <Text style={styles.emptySubtext}>Todos los estudios están completados</Text>
          </View>
        )}
        
        {activeTab === 'realizados' && completedExams.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📭</Text>
            <Text style={styles.emptyText}>No hay estudios realizados</Text>
            <Text style={styles.emptySubtext}>Aún no se han completado estudios</Text>
          </View>
        )}
        
        {activeTab === 'pendientes' && pendingExams.map((item, index) => renderPendingItem(item, index))}
        {activeTab === 'realizados' && completedExams.map((item, index) => renderCompletedItem(item, index))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  backButton: {
    padding: 8,
  },
  backText: {
    fontSize: 24,
    color: '#fff',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statEmoji: {
    fontSize: 28,
    marginBottom: 4,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2d3748',
  },
  statLabel: {
    fontSize: 12,
    color: '#718096',
    marginTop: 2,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#667eea',
  },
  tabText: {
    fontSize: 14,
    color: '#718096',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#fff',
  },
  content: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 45,
    height: 45,
    borderRadius: 22,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cardInfo: {
    flex: 1,
    marginLeft: 12,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3748',
  },
  patientDetail: {
    fontSize: 12,
    color: '#718096',
    marginTop: 2,
  },
  completedBadge: {
    padding: 4,
  },
  completedEmoji: {
    fontSize: 20,
  },
  cardBody: {
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 12,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  infoIcon: {
    fontSize: 14,
    marginRight: 8,
    width: 30,
  },
  examsList: {
    fontSize: 13,
    color: '#4a5568',
    flex: 1,
  },
  dateText: {
    fontSize: 12,
    color: '#a0aec0',
    flex: 1,
  },
  uploadButton: {
    backgroundColor: '#667eea',
    borderRadius: 8,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadEmoji: {
    fontSize: 18,
    marginRight: 8,
    color: '#fff',
  },
  uploadText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  viewButton: {
    backgroundColor: '#48bb78',
    borderRadius: 8,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewEmoji: {
    fontSize: 18,
    marginRight: 8,
    color: '#fff',
  },
  viewText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#a0aec0',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 12,
    color: '#cbd5e0',
    marginTop: 4,
  },
});

export default EstudiosScreen;