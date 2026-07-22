// src/screens/enfermeria/PatientDetailScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { usePatient } from '../../context/PatientContext';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../services/api';
import CacheService from '../../services/cacheService';
import moment from 'moment';
import 'moment/locale/es';

const CACHE_KEY_PREFIX = 'enfermeria_patient_detail_';
const CACHE_TTL = 2 * 60 * 1000; // 2 minutos

const PatientDetailScreen = ({ navigation, route }) => {
  const { id_atencion, Id_exp } = route.params;
  const { setSelectedPatient } = usePatient();
  const { t, lang } = useLanguage();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    moment.locale(lang === 'es' ? 'es' : 'en-gb');
  }, [lang]);

  useEffect(() => {
    loadPatientData();
    setSelectedPatient({ id_atencion, Id_exp });
  }, []);

  const loadPatientData = async () => {
    try {
      const cacheKey = `${CACHE_KEY_PREFIX}${id_atencion}_${Id_exp}`;
      
      const cachedData = await CacheService.get(cacheKey);
      if (cachedData) {
        console.log('📦 Datos del paciente (enfermería) desde caché');
        setPatient(cachedData);
        setLoading(false);
        return;
      }

      console.log('🌐 Cargando paciente (enfermería) desde API...');
      const response = await api.get(`/paciente/${id_atencion}/${Id_exp}`);
      
      await CacheService.set(cacheKey, response.data, CACHE_TTL);
      
      setPatient(response.data);
    } catch (error) {
      console.error('Error loading patient:', error);
      Alert.alert(t('common.error'), t('common.couldNotLoad'));
    } finally {
      setLoading(false);
    }
  };

  const calculateAge = (fecnac) => {
    if (!fecnac) return 'N/A';
    const birthDate = new Date(fecnac);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // ============================================================
  //  NAVEGACIÓN A FORMULARIOS DE ENFERMERÍA
  // ============================================================
  const navigateToVitalSigns = () => {
    navigation.navigate('EnfermeriaVitalSigns', { id_atencion, Id_exp });
  };

  const navigateToNote = () => {
    navigation.navigate('EnfermeriaNote', { id_atencion, Id_exp });
  };

  const navigateToMedications = () => {
    navigation.navigate('EnfermeriaMedications', { id_atencion, Id_exp });
  };

  const navigateToAssessment = () => {
    navigation.navigate('EnfermeriaAssessment', { id_atencion, Id_exp });
  };

  const navigateToFluidBalance = () => {
    navigation.navigate('EnfermeriaFluidBalance', { id_atencion, Id_exp });
  };

  const navigateToCare = () => {
    navigation.navigate('EnfermeriaCare', { id_atencion, Id_exp });
  };

  // ============================================================
  //  MÓDULOS DE ENFERMERÍA CON ACCIONES DIRECTAS
  // ============================================================
  const modules = [
    { 
      title: t('enfermeria.vitalSigns'), 
      icon: 'heart-outline', 
      color: '#e53e3e',
      bgColor: '#fff5f5',
      onPress: navigateToVitalSigns
    },
    { 
      title: t('enfermeria.nursingNote'), 
      icon: 'document-text-outline', 
      color: '#4299e1',
      bgColor: '#ebf8ff',
      onPress: navigateToNote
    },
    { 
      title: t('enfermeria.medications'), 
      icon: 'medkit-outline', 
      color: '#48bb78',
      bgColor: '#f0fff4',
      onPress: navigateToMedications
    },
    {
      title: t('enfermeria.assessmentTitle'),
      icon: 'clipboard-outline',
      color: '#805ad5',
      bgColor: '#faf5ff',
      onPress: navigateToAssessment
    },
    {
      title: t('enfermeria.fluidBalance'),
      icon: 'water-outline',
      color: '#0284c7',
      bgColor: '#f0f9ff',
      onPress: navigateToFluidBalance
    },
    {
      title: t('enfermeria.nursingCare'),
      icon: 'shield-checkmark-outline',
      color: '#dd6b20',
      bgColor: '#fffaf0',
      onPress: navigateToCare
    },
  ];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={styles.loadingText}>{t('enfermeria.loadingPatient')}</Text>
      </View>
    );
  }

  const pacienteData = patient?.paciente || {};
  const familiarData = patient?.familiar || {};
  const medicosData = patient?.medicos || [];
  const camaData = patient?.cama || { num_cama: t('common.notAssigned'), tipo: '' };

  return (
    <ScrollView style={styles.container}>
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          <Ionicons name="person-outline" size={20} color="#fff" /> {t('enfermeria.patientDetail')}
        </Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <View style={styles.mainCard}>
        <View style={styles.patientHeader}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={40} color="#fff" />
          </View>
          <View style={styles.patientInfo}>
            <Text style={styles.patientName}>
              {pacienteData.papell || ''} {pacienteData.sapell || ''} {pacienteData.nom_pac || t('common.patient')}
            </Text>
            <View style={styles.expBadge}>
              <Text style={styles.expBadgeText}>Expediente: {pacienteData.Id_exp || Id_exp}</Text>
            </View>
          </View>
        </View>

        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>{t('enfermeria.age')}</Text>
            <Text style={styles.infoValue}>{calculateAge(pacienteData.fecnac)} {t('enfermeria.years')}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>{t('enfermeria.admissionDate')}</Text>
            <Text style={styles.infoValue}>
              {pacienteData.fecha ? moment(pacienteData.fecha).format('DD/MM/YYYY') : 'N/A'}
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>{t('enfermeria.bed')}</Text>
            <Text style={styles.infoValue}>{camaData.num_cama} - {camaData.tipo || 'N/A'}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>{t('enfermeria.diagnosis')}</Text>
            <Text style={styles.infoValue}>{pacienteData.motivo_atn || t('enfermeria.pending')}</Text>
          </View>
        </View>

        {pacienteData.alergias && (
          <View style={styles.alergiasContainer}>
            <Text style={styles.alergiasLabel}>
              <Ionicons name="alert-circle-outline" size={14} color="#e53e3e" /> {t('enfermeria.allergies')}:
            </Text>
            <Text style={styles.alergiasText}>{pacienteData.alergias}</Text>
          </View>
        )}

        {medicosData.length > 0 && (
          <View style={styles.medicosContainer}>
            <Text style={styles.medicosLabel}>
              <Ionicons name="medkit-outline" size={14} color="#667eea" /> {t('common.treatingDoctors')}:
            </Text>
            {medicosData.map((med, idx) => (
              <Text key={idx} style={styles.medicosText}>• {med.doctor || med.doctor}</Text>
            ))}
          </View>
        )}

        {familiarData && familiarData.nombre && (
          <View style={styles.familiarContainer}>
            <Text style={styles.familiarLabel}>
              <Ionicons name="people-outline" size={14} color="#48bb78" /> {t('common.responsibleFamily')}:
            </Text>
            <Text style={styles.familiarText}>
              {familiarData.nombre} ({familiarData.parentesco || t('common.notSpecified')}) - Tel: {familiarData.telefono || 'N/A'}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.modulesContainer}>
        <Text style={styles.modulesTitle}>
          <Ionicons name="flash-outline" size={18} color="#667eea" /> {t('enfermeria.moduleTitle')}
        </Text>
        <View style={styles.modulesGrid}>
          {modules.map((mod, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.moduleCard, { backgroundColor: mod.bgColor }]}
              onPress={mod.onPress}
            >
              <View style={[styles.moduleIcon, { backgroundColor: mod.color + '20' }]}>
                <Ionicons name={mod.icon} size={24} color={mod.color} />
              </View>
              <Text style={[styles.moduleTitle, { color: mod.color }]}>{mod.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7fafc' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f7fafc' },
  loadingText: { marginTop: 12, fontSize: 14, color: '#718096' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  mainCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  patientHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  patientInfo: { flex: 1 },
  patientName: { fontSize: 18, fontWeight: 'bold', color: '#2d3748', marginBottom: 6 },
  expBadge: {
    backgroundColor: '#667eea20',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  expBadgeText: { fontSize: 12, color: '#667eea', fontWeight: '600' },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 },
  infoItem: { width: '50%', paddingVertical: 12, paddingRight: 10 },
  infoLabel: { fontSize: 11, color: '#a0aec0', marginBottom: 4 },
  infoValue: { fontSize: 14, fontWeight: '600', color: '#2d3748' },
  alergiasContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#fff5f5',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  alergiasLabel: { fontSize: 12, fontWeight: '600', color: '#e53e3e', marginRight: 8 },
  alergiasText: { fontSize: 12, color: '#4a5568', flex: 1 },
  medicosContainer: {
    backgroundColor: '#ebf8ff',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  medicosLabel: { fontSize: 12, fontWeight: '600', color: '#4299e1', marginBottom: 6 },
  medicosText: { fontSize: 12, color: '#4a5568', marginLeft: 12, marginBottom: 2 },
  familiarContainer: {
    backgroundColor: '#f0fff4',
    padding: 12,
    borderRadius: 12,
  },
  familiarLabel: { fontSize: 12, fontWeight: '600', color: '#48bb78', marginBottom: 4 },
  familiarText: { fontSize: 12, color: '#4a5568' },
  modulesContainer: { padding: 16, marginBottom: 20 },
  modulesTitle: { fontSize: 16, fontWeight: '600', color: '#2d3748', marginBottom: 16 },
  modulesGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  moduleCard: {
    width: '31%',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  moduleIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  moduleTitle: { fontSize: 11, fontWeight: '600', textAlign: 'center' },
});

export default PatientDetailScreen;
