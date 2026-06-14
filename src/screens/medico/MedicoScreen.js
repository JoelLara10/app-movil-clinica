import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import moment from 'moment';

const MedicoScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    try {
      const response = await api.get('/medical/appointments');
      setAppointments(response.data);
    } catch (error) {
      console.error('Error loading appointments:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAppointments();
    setRefreshing(false);
  };

  const getAreaEmoji = (area) => {
    if (area === 'Urgencias') return '🚨';
    if (area === 'Hospitalizado') return '🛏️';
    if (area === 'Ambulatorio') return '🚶';
    return '🏥';
  };

  const getAreaColor = (area) => {
    if (area === 'Urgencias') return '#f56565';
    if (area === 'Hospitalizado') return '#ed8936';
    return '#48bb78';
  };

  const renderAppointmentCard = (item, index) => (
    <TouchableOpacity
      key={index}
      style={styles.card}
      onPress={() => navigation.navigate('PatientDetail', { 
        id_atencion: item.id_atencion,
        Id_exp: item.Id_exp 
      })}
    >
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {item.paciente?.nombre?.charAt(0) || 'P'}
          </Text>
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.patientName}>{item.paciente?.nombre || 'Paciente'}</Text>
          <Text style={styles.patientDetail}>📋 Expediente: {item.Id_exp}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getAreaColor(item.area) }]}>
          <Text style={styles.statusText}>{getAreaEmoji(item.area)} {item.area}</Text>
        </View>
      </View>
      
      <View style={styles.cardBody}>
        <View style={styles.infoRow}>
          <Text style={styles.infoIcon}>📅</Text>
          <Text style={styles.infoText}>
            Ingreso: {moment(item.fecha_ing).format('DD/MM/YYYY HH:mm')}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoIcon}>🛏️</Text>
          <Text style={styles.infoText}>Cama: {item.num_cama || 'Sin asignar'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoIcon}>❤️</Text>
          <Text style={styles.infoText}>Motivo: {item.motivo || 'No especificado'}</Text>
        </View>
      </View>
      
      <View style={styles.cardFooter}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation.navigate('VitalSigns', { id_atencion: item.id_atencion })}
        >
          <Text style={styles.actionEmoji}>❤️</Text>
          <Text style={styles.actionText}>Signos</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation.navigate('MedicalNote', { id_atencion: item.id_atencion })}
        >
          <Text style={styles.actionEmoji}>📝</Text>
          <Text style={styles.actionText}>Nota</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation.navigate('Diagnosis', { id_atencion: item.id_atencion })}
        >
          <Text style={styles.actionEmoji}>🔬</Text>
          <Text style={styles.actionText}>Diagnóstico</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation.navigate('Prescription', { id_atencion: item.id_atencion })}
        >
          <Text style={styles.actionEmoji}>💊</Text>
          <Text style={styles.actionText}>Receta</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation.navigate('Exams', { id_atencion: item.id_atencion })}
        >
          <Text style={styles.actionEmoji}>🔬</Text>
          <Text style={styles.actionText}>Estudios</Text>
        </TouchableOpacity>
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
        <Text style={styles.headerTitle}>👨‍⚕️ Módulo Médico</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>👥</Text>
            <Text style={styles.statNumber}>{appointments.length}</Text>
            <Text style={styles.statLabel}>Pacientes Activos</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>🏥</Text>
            <Text style={styles.statNumber}>
              {appointments.filter(a => a.area === 'Urgencias').length}
            </Text>
            <Text style={styles.statLabel}>Urgencias</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>🛏️</Text>
            <Text style={styles.statNumber}>
              {appointments.filter(a => a.area === 'Hospitalizado').length}
            </Text>
            <Text style={styles.statLabel}>Hospitalizados</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>📋 Pacientes Asignados</Text>
        
        {appointments.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>😴</Text>
            <Text style={styles.emptyText}>No hay pacientes asignados</Text>
            <Text style={styles.emptySubtext}>Esperando asignación de pacientes</Text>
          </View>
        ) : (
          appointments.map((item, index) => renderAppointmentCard(item, index))
        )}
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
  content: {
    padding: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statEmoji: {
    fontSize: 28,
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2d3748',
  },
  statLabel: {
    fontSize: 12,
    color: '#718096',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
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
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
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
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
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
  infoText: {
    fontSize: 13,
    color: '#4a5568',
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 12,
  },
  actionButton: {
    alignItems: 'center',
  },
  actionEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  actionText: {
    fontSize: 11,
    color: '#667eea',
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

export default MedicoScreen;