// src/screens/medico/VitalSignsListScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import moment from 'moment';
import 'moment/locale/es';

const VitalSignsListScreen = ({ navigation, route }) => {
  const { id_atencion, Id_exp } = route.params;
  const { t, lang } = useLanguage();
  moment.locale(lang === 'es' ? 'es' : 'en-gb');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [signos, setSignos] = useState([]);
  const [paciente, setPaciente] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Cargar información del paciente
      const pacienteRes = await api.get(`/paciente/${id_atencion}/${Id_exp}`);
      setPaciente(pacienteRes.data.paciente);
      
      // Cargar signos vitales
      const signosRes = await api.get(`/appointments/${id_atencion}/vital-signs`);
      setSignos(signosRes.data);
      
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert(t('common.error'), t('common.couldNotLoadResults'));
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleGeneratePDF = async (id_signos) => {
    try {
      const token = await AsyncStorage.getItem('@ineo_token');
      if (!token) {
        Alert.alert(t('common.sessionExpired'), t('common.sessionExpired'));
        return;
      }

      const baseUrl = api.defaults.baseURL;
      const pdfUrl = `${baseUrl}/pdf/vital-signs/${id_signos}?token=${encodeURIComponent(token)}&id_atencion=${id_atencion}`;

      Linking.openURL(pdfUrl).catch((err) => {
        console.error('Error opening PDF:', err);
        Alert.alert(t('common.error'), t('common.couldNotOpenPdf'));
      });
    } catch (error) {
      console.error('Error generating PDF URL:', error);
      Alert.alert(t('common.error'), t('common.couldNotGenerate'));
    }
  };

  const renderSignosTable = () => {
    if (signos.length === 0) {
      return (
        <View style={styles.emptyState}>
          <View style={styles.emptyStateIcon}>
            <Ionicons name="heart-outline" size={50} color="#fff" />
          </View>
          <Text style={styles.emptyStateTitle}>{t('common.noVitalsRegistered')}</Text>
          <Text style={styles.emptyStateText}>
            {t('common.noVitalsYet')}
          </Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => navigation.navigate('VitalSigns', { id_atencion, Id_exp })}
          >
            <Ionicons name="add-circle-outline" size={20} color="#fff" />
            <Text style={styles.emptyButtonText}>{t('common.registerFirstVitals')}</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.tableContainer}>
        <View style={styles.tableHeader}>
          <Text style={[styles.headerCell, styles.dateCell]}>Fecha</Text>
          <Text style={[styles.headerCell, styles.valueCell]}>TA</Text>
          <Text style={[styles.headerCell, styles.valueCell]}>FC</Text>
          <Text style={[styles.headerCell, styles.valueCell]}>FR</Text>
          <Text style={[styles.headerCell, styles.valueCell]}>Temp</Text>
          <Text style={[styles.headerCell, styles.valueCell]}>SpO₂</Text>
          <Text style={[styles.headerCell, styles.valueCell]}>Peso</Text>
          <Text style={[styles.headerCell, styles.valueCell]}>Talla</Text>
          <Text style={[styles.headerCell, styles.actionCell]}>PDF</Text>
        </View>
        
        <ScrollView>
          {signos.map((item, index) => (
            <View key={item.id_signos || index} style={styles.tableRow}>
              <View style={[styles.rowCell, styles.dateCell]}>
                <Text style={styles.dateDay}>
                  {moment(item.fecha_registro).format('DD/MM/YYYY')}
                </Text>
                <Text style={styles.dateTime}>
                  {moment(item.fecha_registro).format('HH:mm')}
                </Text>
              </View>
              <Text style={[styles.rowCell, styles.valueCell, styles.valueText]}>
                {item.ta || '—'}
              </Text>
              <Text style={[styles.rowCell, styles.valueCell, styles.valueText]}>
                {item.fc || '—'}
              </Text>
              <Text style={[styles.rowCell, styles.valueCell, styles.valueText]}>
                {item.fr || '—'}
              </Text>
              <Text style={[styles.rowCell, styles.valueCell, styles.valueText]}>
                {item.temp || '—'}
              </Text>
              <Text style={[styles.rowCell, styles.valueCell, styles.valueText]}>
                {item.spo2 || '—'}
              </Text>
              <Text style={[styles.rowCell, styles.valueCell, styles.valueText]}>
                {item.peso || '—'}
              </Text>
              <Text style={[styles.rowCell, styles.valueCell, styles.valueText]}>
                {item.talla || '—'}
              </Text>
              <TouchableOpacity
                style={styles.pdfButton}
                onPress={() => handleGeneratePDF(item.id_signos)}
              >
                <Ionicons name="document-text-outline" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={styles.loadingText}>{t('medico.loadingVitals')}</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          <Ionicons name="heart-outline" size={20} color="#fff" /> {t('medico.vitalSigns')}
        </Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      {/* Información del paciente */}
      <View style={styles.patientInfoCard}>
        <View style={styles.patientInfoContent}>
          <View style={styles.patientAvatar}>
            <Ionicons name="person-circle" size={50} color="#fff" />
          </View>
          <View style={styles.patientDetails}>
            <Text style={styles.patientName}>
              {paciente?.papell || ''} {paciente?.nom_pac || t('medico.patient')}
            </Text>
            <View style={styles.patientMeta}>
              <Text style={styles.patientMetaItem}>
                <Ionicons name="card-outline" size={12} /> Exp: {Id_exp || 'N/A'}
              </Text>
              <Text style={styles.patientMetaItem}>
                <Ionicons name="calendar-outline" size={12} /> Atención: {id_atencion}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Botón nuevo registro */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.newButton}
          onPress={() => navigation.navigate('VitalSigns', { id_atencion, Id_exp })}
        >
          <Ionicons name="add-circle-outline" size={20} color="#fff" />
          <Text style={styles.newButtonText}>{t('common.newRecord')}</Text>
        </TouchableOpacity>
      </View>

      {/* Tarjeta principal con historial */}
      <View style={styles.mainCard}>
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.cardHeader}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <View style={styles.cardHeaderContent}>
            <Ionicons name="time-outline" size={20} color="#fff" />
            <Text style={styles.cardHeaderTitle}>{t('medico.vitalsHistory')}</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{signos.length} {t('common.records')}</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.cardBody}>
          {renderSignosTable()}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f7fafc',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#718096',
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
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  patientInfoCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderLeftWidth: 5,
    borderLeftColor: '#667eea',
  },
  patientInfoContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  patientAvatar: {
    width: 60,
    height: 60,
    borderRadius: 15,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  patientDetails: {
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 4,
  },
  patientMeta: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  patientMetaItem: {
    fontSize: 12,
    color: '#718096',
  },
  buttonContainer: {
    paddingHorizontal: 16,
    marginTop: 16,
    alignItems: 'flex-end',
  },
  newButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#48bb78',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    shadowColor: '#48bb78',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  newButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  mainCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 30,
    borderRadius: 25,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  cardHeader: {
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  cardHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardHeaderTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  cardBody: {
    padding: 16,
  },
  tableContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f7fafc',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerCell: {
    fontWeight: '600',
    color: '#4a5568',
    fontSize: 11,
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    alignItems: 'center',
  },
  rowCell: {
    fontSize: 13,
    color: '#2d3748',
  },
  dateCell: {
    width: 80,
  },
  valueCell: {
    width: 45,
    textAlign: 'center',
  },
  actionCell: {
    width: 45,
    textAlign: 'center',
  },
  dateDay: {
    fontWeight: '600',
    fontSize: 12,
  },
  dateTime: {
    fontSize: 10,
    color: '#a0aec0',
  },
  valueText: {
    fontWeight: '500',
    color: '#667eea',
  },
  pdfButton: {
    backgroundColor: '#f56565',
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#718096',
    textAlign: 'center',
    marginBottom: 20,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#667eea',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default VitalSignsListScreen;