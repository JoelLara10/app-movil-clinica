// src/screens/medico/MedicoScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { usePatient } from '../../context/PatientContext';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../services/api';
import CacheService from '../../services/cacheService';
import moment from 'moment';
import 'moment/locale/es';

const CACHE_KEY_CONSULTA = 'medico_consulta';
const CACHE_KEY_URGENCIAS = 'medico_urgencias';
const CACHE_KEY_HOSPITALIZADOS = 'medico_hospitalizados';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

const ITEMS_PER_PAGE = 6; // Por área

const MedicoScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { selectPatient } = usePatient();
  const { t, lang } = useLanguage();
  const [consulta, setConsulta] = useState([]);
  const [urgencias, setUrgencias] = useState([]);
  const [hospitalizados, setHospitalizados] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pageConsulta, setPageConsulta] = useState(1);
  const [pageUrgencias, setPageUrgencias] = useState(1);
  const [pageHospitalizados, setPageHospitalizados] = useState(1);

  useEffect(() => {
    moment.locale(lang === 'es' ? 'es' : 'en-gb');
  }, [lang]);

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async (forceRefresh = false) => {
    try {
      setLoading(true);

      // Intentar obtener de caché (si no es forceRefresh)
      if (!forceRefresh) {
        const [cachedConsulta, cachedUrgencias, cachedHospitalizados] = await Promise.all([
          CacheService.get(CACHE_KEY_CONSULTA),
          CacheService.get(CACHE_KEY_URGENCIAS),
          CacheService.get(CACHE_KEY_HOSPITALIZADOS)
        ]);

        if (cachedConsulta && cachedUrgencias && cachedHospitalizados) {
          console.log('📦 Datos médicos cargados desde caché');
          setConsulta(cachedConsulta);
          setUrgencias(cachedUrgencias);
          setHospitalizados(cachedHospitalizados);
          setLoading(false);
          return;
        }
      }

      // Cargar desde API
      console.log('🌐 Cargando médicos desde API...');
      const response = await api.get('/medico');
      
      const consultaData = response.data.beds_consulta || [];
      const urgenciasData = response.data.beds_preparacion || [];
      const hospitalizadosData = response.data.beds_recuperacion || [];

      // Guardar en caché por separado
      await Promise.all([
        CacheService.set(CACHE_KEY_CONSULTA, consultaData, CACHE_TTL),
        CacheService.set(CACHE_KEY_URGENCIAS, urgenciasData, CACHE_TTL),
        CacheService.set(CACHE_KEY_HOSPITALIZADOS, hospitalizadosData, CACHE_TTL)
      ]);

      setConsulta(consultaData);
      setUrgencias(urgenciasData);
      setHospitalizados(hospitalizadosData);

      console.log(`✅ Médicos cargados: Consulta ${consultaData.length}, Urgencias ${urgenciasData.length}, Hospitalizados ${hospitalizadosData.length}`);

    } catch (error) {
      console.error('Error loading patients:', error);

      // Intentar cargar desde caché aunque esté expirada
      const [cachedConsulta, cachedUrgencias, cachedHospitalizados] = await Promise.all([
        CacheService.get(CACHE_KEY_CONSULTA),
        CacheService.get(CACHE_KEY_URGENCIAS),
        CacheService.get(CACHE_KEY_HOSPITALIZADOS)
      ]);

      if (cachedConsulta && cachedUrgencias && cachedHospitalizados) {
        setConsulta(cachedConsulta);
        setUrgencias(cachedUrgencias);
        setHospitalizados(cachedHospitalizados);
        Alert.alert(t('common.noConnection'), t('common.showingCachedData'));
      } else {
        Alert.alert(t('common.error'), t('common.couldNotLoad'));
      }
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setPageConsulta(1);
    setPageUrgencias(1);
    setPageHospitalizados(1);
    await loadPatients(true);
    setRefreshing(false);
  }, []);

  const getPagedData = (data, page) => {
    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return data.slice(startIndex, endIndex);
  };

  const getTotalPages = (data) => {
    return Math.ceil(data.length / ITEMS_PER_PAGE);
  };

  const getPatientName = (item) => {
    if (item.nom_pac && item.papell) {
      return `${item.papell} ${item.nom_pac}`;
    }
    if (item.nom_pac) return item.nom_pac;
    return t('common.patient');
  };

  const renderPatientCard = (item, index, area, areaColor) => {
    const isOccupied = item.estatus === 'OCUPADA' && item.tiene_atencion;
    const displayName = isOccupied ? getPatientName(item) : '—';
    
    return (
      <TouchableOpacity
        key={item.id_atencion || item.id_cama || index}
        style={[styles.bedCard, isOccupied && styles.bedCardOccupied]}
        onPress={() => {
          if (isOccupied && item.id_atencion && item.Id_exp) {
            selectPatient({
              id_atencion: item.id_atencion,
              Id_exp: item.Id_exp,
            });
            navigation.navigate('PatientDetail', { 
              id_atencion: item.id_atencion,
              Id_exp: item.Id_exp
            });
          } else {
            Alert.alert(t('medico.bedAvailable'), t('medico.bedAvailable'));
          }
        }}
      >
        <View style={[styles.bedIcon, { backgroundColor: isOccupied ? areaColor + '20' : '#e2e8f020' }]}>
          <Ionicons 
            name={isOccupied ? "person-outline" : "bed-outline"} 
            size={28} 
            color={isOccupied ? areaColor : '#a0aec0'} 
          />
        </View>
        <Text style={styles.bedNumber}>{item.num_cama}</Text>
        <Text style={styles.patientName} numberOfLines={1}>{displayName}</Text>
        <View style={[styles.statusBadge, { backgroundColor: isOccupied ? areaColor : '#a0aec0' }]}>
          <Text style={styles.statusText}>{isOccupied ? t('medico.occupied') : t('medico.available')}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderSection = (title, data, page, setPage, icon, color, emptyEmoji) => {
    const pagedData = getPagedData(data, page);
    const totalPages = getTotalPages(data);
    const total = data.length;

    return (
      <View style={styles.sectionContainer}>
        <View style={[styles.sectionTitle, { borderLeftColor: color }]}>
          <View style={styles.sectionTitleLeft}>
            <Ionicons name={icon} size={22} color={color} />
            <Text style={styles.sectionTitleText}>{title}</Text>
          </View>
          <View style={[styles.badgeCount, { backgroundColor: color }]}>
            <Text style={styles.badgeCountText}>{total}</Text>
          </View>
        </View>

        <View style={styles.patientGrid}>
          {pagedData.length > 0 ? (
            pagedData.map((item, idx) => renderPatientCard(item, idx, title, color))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>{emptyEmoji}</Text>
              <Text style={styles.emptyText}>No hay pacientes en {title.toLowerCase()}</Text>
            </View>
          )}
        </View>

        {totalPages > 1 && (
          <View style={styles.paginationContainer}>
            <TouchableOpacity
              style={[styles.pageArrow, page === 1 && styles.pageArrowDisabled]}
              onPress={() => page > 1 && setPage(page - 1)}
              disabled={page === 1}
            >
              <Ionicons name="chevron-back" size={20} color={page === 1 ? '#cbd5e0' : color} />
            </TouchableOpacity>
            
            <Text style={styles.pageInfo}>
              {page} / {totalPages}
            </Text>
            
            <TouchableOpacity
              style={[styles.pageArrow, page === totalPages && styles.pageArrowDisabled]}
              onPress={() => page < totalPages && setPage(page + 1)}
              disabled={page === totalPages}
            >
              <Ionicons name="chevron-forward" size={20} color={page === totalPages ? '#cbd5e0' : color} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={styles.loadingText}>{t('medico.loadingPatients')}</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          <Ionicons name="medkit-outline" size={20} color="#fff" /> {t('medico.moduleTitle')}
        </Text>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
          <Ionicons name="refresh-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </LinearGradient>

      {/* Bienvenida */}
      <View style={styles.welcomeCard}>
        <View>
          <Text style={styles.welcomeTitle}>¡Hola, Dr. {user?.username}!</Text>
          <Text style={styles.welcomeSubtitle}>
            {moment().format(lang === 'es' ? 'dddd, D [de] MMMM [de] YYYY' : 'dddd, D MMMM YYYY')}
          </Text>
        </View>
        <View style={styles.statsPill}>
          <Text style={styles.statsPillText}>
            Total: {consulta.length + urgencias.length + hospitalizados.length}
          </Text>
        </View>
      </View>

      {/* CONSULTA EXTERNA */}
      {renderSection(
        t('medico.outPatient'),
        consulta,
        pageConsulta,
        setPageConsulta,
        'people-outline',
        '#4299e1',
        '🏥'
      )}

      {/* URGENCIAS */}
      {renderSection(
        t('medico.emergencies'),
        urgencias,
        pageUrgencias,
        setPageUrgencias,
        'alert-circle-outline',
        '#f56565',
        '🚨'
      )}

      {/* HOSPITALIZADOS */}
      {renderSection(
        t('medico.hospitalized'),
        hospitalizados,
        pageHospitalizados,
        setPageHospitalizados,
        'bed-outline',
        '#48bb78',
        '🛏️'
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          <Ionicons name="shield-checkmark-outline" size={12} color="rgba(0,0,0,0.4)" />
          {' '}INEO v2.0 - Sistema de Gestión Hospitalaria
        </Text>
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
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  backButton: { padding: 8 },
  refreshButton: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  welcomeCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  welcomeTitle: { fontSize: 16, fontWeight: 'bold', color: '#2d3748' },
  welcomeSubtitle: { fontSize: 12, color: '#718096', marginTop: 4 },
  statsPill: {
    backgroundColor: '#667eea20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statsPillText: { fontSize: 12, fontWeight: '600', color: '#667eea' },
  sectionContainer: { marginTop: 20, paddingHorizontal: 16 },
  sectionTitle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionTitleLeft: { flexDirection: 'row', alignItems: 'center' },
  sectionTitleText: { fontSize: 14, fontWeight: '600', color: '#2d3748', marginLeft: 8 },
  badgeCount: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeCountText: { fontSize: 12, fontWeight: 'bold', color: '#fff' },
  patientGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  bedCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  bedCardOccupied: { borderWidth: 1, borderColor: '#667eea30' },
  bedIcon: { width: 55, height: 55, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  bedNumber: { fontSize: 14, fontWeight: 'bold', color: '#2d3748', marginBottom: 4 },
  patientName: { fontSize: 12, color: '#718096', textAlign: 'center', marginBottom: 8, maxWidth: '100%' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 10, fontWeight: 'bold', color: '#fff' },
  emptyState: { width: '100%', alignItems: 'center', paddingVertical: 30, backgroundColor: '#fff', borderRadius: 16 },
  emptyEmoji: { fontSize: 40, marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#a0aec0' },
  paginationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 4,
  },
  pageArrow: {
    padding: 8,
    borderRadius: 8,
  },
  pageArrowDisabled: {
    opacity: 0.5,
  },
  pageInfo: {
    fontSize: 14,
    color: '#4a5568',
    marginHorizontal: 16,
    fontWeight: '500',
  },
  footer: { marginTop: 30, marginBottom: 20, alignItems: 'center' },
  footerText: { fontSize: 11, color: 'rgba(0,0,0,0.4)' },
});

export default MedicoScreen;
