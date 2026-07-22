// src/screens/enfermeria/EnfermeriaCareScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import CacheService from '../../services/cacheService';
import Pagination from '../../components/Pagination';
import moment from 'moment';
import { useLanguage } from '../../context/LanguageContext';

const CACHE_KEY_PREFIX = 'enfermeria_care_';
const CACHE_TTL = 2 * 60 * 1000; // 2 minutos
const CARE_STATES = ['EN_PROCESO', 'PENDIENTE', 'COMPLETADO'];
const HISTORY_ITEMS_PER_PAGE = 5;

const EnfermeriaCareScreen = ({ navigation, route }) => {
  const { t, lang } = useLanguage();
  const { id_atencion, Id_exp } = route.params;
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState([]);
  const [currentHistoryPage, setCurrentHistoryPage] = useState(1);
  const [formData, setFormData] = useState({
    diagnostico_enfermeria: '',
    objetivos: '',
    intervenciones: '',
    evaluacion: '',
    estado: 'EN_PROCESO',
    observaciones: '',
  });

  // Cargar historial de cuidados
  useEffect(() => {
    loadCareHistory();
  }, []);

  const loadCareHistory = async (forceRefresh = false) => {
    try {
      setLoadingHistory(true);
      const cacheKey = `${CACHE_KEY_PREFIX}${id_atencion}`;

      if (!forceRefresh) {
        const cachedData = await CacheService.get(cacheKey);
        if (cachedData) {
          console.log('📦 Historial de cuidados cargado desde caché');
          setHistory(cachedData);
          setLoadingHistory(false);
          return;
        }
      }

      console.log('🌐 Cargando historial de cuidados desde API...');
      const response = await api.get(`/appointments/${id_atencion}/nursing-care`);
      
      await CacheService.set(cacheKey, response.data, CACHE_TTL);
      setHistory(response.data || []);
      if (forceRefresh) setCurrentHistoryPage(1);
    } catch (error) {
      console.error('Error loading care history:', error);
      
      const cacheKey = `${CACHE_KEY_PREFIX}${id_atencion}`;
      const cachedData = await CacheService.get(cacheKey);
      if (cachedData) {
        console.log('📦 Historial de cuidados cargado desde caché (fallback)');
        setHistory(cachedData);
      }
    } finally {
      setLoadingHistory(false);
    }
  };

  const getEstadoColor = (estado) => {
    if (estado === 'COMPLETADO') return '#48bb78';
    if (estado === 'EN_PROCESO') return '#4299e1';
    if (estado === 'PENDIENTE') return '#ed8936';
    return '#718096';
  };

  const getEstadoEmoji = (estado) => {
    if (estado === 'COMPLETADO') return '✅';
    if (estado === 'EN_PROCESO') return '🔄';
    if (estado === 'PENDIENTE') return '⏳';
    return '📌';
  };

  const handleSubmit = async () => {
    const hasData = Object.values(formData).some(value => value.trim() !== '');
    if (!hasData) {
      Alert.alert(t('common.warning'), t('enfermeria.newCare'));
      return;
    }

    setLoading(true);
    try {
      const response = await api.post(`/appointments/${id_atencion}/nursing-care`, formData);
      if (response.data) {
        Alert.alert(t('common.success'), t('enfermeria.nursingCare'));
        setFormData({
          diagnostico_enfermeria: '',
          objetivos: '',
          intervenciones: '',
          evaluacion: '',
          estado: 'EN_PROCESO',
          observaciones: '',
        });
        await loadCareHistory(true);
      }
    } catch (error) {
      console.error('Error saving nursing care:', error);
      Alert.alert(t('common.error'), error.response?.data?.error || t('enfermeria.couldNotLoad'));
    } finally {
      setLoading(false);
    }
  };

  const renderHistoryItem = ({ item }) => {
    const estado = item.estado || 'EN_PROCESO';
    const estadoColor = getEstadoColor(estado);
    const estadoEmoji = getEstadoEmoji(estado);

    return (
      <View style={styles.historyItem}>
        <View style={styles.historyHeader}>
          <View style={styles.historyBadge}>
            <Text style={styles.historyBadgeText}>
              {moment(item.fecha_registro).format('DD/MM')}
            </Text>
          </View>
          <View style={styles.historyInfo}>
            <Text style={styles.historyDate}>
              {moment(item.fecha_registro).format('dddd, D [de] MMMM [de] YYYY [a las] HH:mm')}
            </Text>
            <Text style={styles.historyDoctor}>
              <Ionicons name="medkit-outline" size={12} color="#718096" /> Enf. {item.enfermero_nombre || t('common.notSpecified')}
            </Text>
          </View>
          <View style={[styles.estadoBadge, { backgroundColor: estadoColor + '20' }]}>
            <Text style={[styles.estadoBadgeText, { color: estadoColor }]}>
              {estadoEmoji} {estado}
            </Text>
          </View>
        </View>
        
        <View style={styles.historyContent}>
          {item.diagnostico_enfermeria && (
            <View style={styles.historyField}>
              <Ionicons name="clipboard-outline" size={14} color="#667eea" />
              <Text style={styles.historyFieldLabel}>{t('enfermeria.careType')}:</Text>
              <Text style={styles.historyFieldValue}>{item.diagnostico_enfermeria}</Text>
            </View>
          )}
          {item.objetivos && (
            <View style={styles.historyField}>
              <Ionicons name="flag-outline" size={14} color="#48bb78" />
              <Text style={styles.historyFieldLabel}>{t('enfermeria.description')}:</Text>
              <Text style={styles.historyFieldValue}>{item.objetivos}</Text>
            </View>
          )}
          {item.intervenciones && (
            <View style={styles.historyField}>
              <Ionicons name="hand-left-outline" size={14} color="#4299e1" />
              <Text style={styles.historyFieldLabel}>{t('enfermeria.interventions')}:</Text>
              <Text style={styles.historyFieldValue}>{item.intervenciones}</Text>
            </View>
          )}
          {item.evaluacion && (
            <View style={styles.historyField}>
              <Ionicons name="analytics-outline" size={14} color="#ed8936" />
              <Text style={styles.historyFieldLabel}>{t('enfermeria.evaluation')}:</Text>
              <Text style={styles.historyFieldValue}>{item.evaluacion}</Text>
            </View>
          )}
          {item.observaciones && (
            <View style={styles.historyField}>
              <Ionicons name="document-text-outline" size={14} color="#718096" />
              <Text style={styles.historyFieldLabel}>{t('common.observations')}:</Text>
              <Text style={styles.historyFieldValue}>{item.observaciones}</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const totalHistoryPages = Math.ceil(history.length / HISTORY_ITEMS_PER_PAGE);
  const paginatedHistory = history.slice(
    (currentHistoryPage - 1) * HISTORY_ITEMS_PER_PAGE,
    currentHistoryPage * HISTORY_ITEMS_PER_PAGE,
  );

  useEffect(() => {
    const validTotalPages = Math.max(1, totalHistoryPages);
    if (currentHistoryPage > validTotalPages) {
      setCurrentHistoryPage(validTotalPages);
    }
  }, [currentHistoryPage, totalHistoryPages]);

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#48bb78', '#38a169']} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          <Ionicons name="medkit-outline" size={20} color="#fff" /> {t('enfermeria.nursingCare')}
        </Text>
        <TouchableOpacity
          onPress={() => loadCareHistory(true)}
          style={styles.backButton}
          disabled={loading || loadingHistory}
        >
          <Ionicons name="refresh-outline" size={22} color="#fff" />
        </TouchableOpacity>
      </LinearGradient>

      {/* Información del paciente */}
      <View style={styles.patientInfoCard}>
        <View style={styles.patientInfoContent}>
          <View style={styles.patientAvatar}>
            <Ionicons name="person-circle" size={50} color="#fff" />
          </View>
          <View style={styles.patientDetails}>
            <Text style={styles.patientName}>{t('enfermeria.patient')}</Text>
            <View style={styles.patientMeta}>
              <Text style={styles.patientMetaItem}>
                <Ionicons name="card-outline" size={12} color="#48bb78" />
                <Text style={styles.patientMetaText}>Exp: {Id_exp || 'N/A'}</Text>
              </Text>
              <Text style={styles.patientMetaItem}>
                <Ionicons name="calendar-outline" size={12} color="#48bb78" />
                <Text style={styles.patientMetaText}>Atención: {id_atencion}</Text>
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Tarjeta principal - Nuevo cuidado */}
      <View style={styles.mainCard}>
        <LinearGradient 
          colors={['#48bb78', '#38a169']} 
          style={styles.cardHeader}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <View style={styles.cardHeaderContent}>
            <Ionicons name="add-circle-outline" size={22} color="#fff" />
            <Text style={styles.cardHeaderTitle}>{t('enfermeria.newCare')}</Text>
          </View>
        </LinearGradient>

        <View style={styles.cardBody}>
          {/* Diagnóstico de enfermería */}
          <View style={styles.fieldGroup}>
            <View style={styles.fieldLabel}>
              <Ionicons name="clipboard-outline" size={16} color="#48bb78" />
              <Text style={styles.fieldLabelText}>{t('enfermeria.careType')}</Text>
            </View>
            <TextInput
              style={[styles.fieldInput, styles.textArea]}
              placeholder={t('enfermeria.descriptionPlaceholder')}
              placeholderTextColor="#a0aec0"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              value={formData.diagnostico_enfermeria}
              onChangeText={(text) => setFormData({ ...formData, diagnostico_enfermeria: text })}
            />
          </View>

          {/* Objetivos */}
          <View style={styles.fieldGroup}>
            <View style={styles.fieldLabel}>
              <Ionicons name="flag-outline" size={16} color="#48bb78" />
              <Text style={styles.fieldLabelText}>{t('enfermeria.description')}</Text>
            </View>
            <TextInput
              style={[styles.fieldInput, styles.textArea]}
              placeholder={t('enfermeria.descriptionPlaceholder')}
              placeholderTextColor="#a0aec0"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              value={formData.objetivos}
              onChangeText={(text) => setFormData({ ...formData, objetivos: text })}
            />
          </View>

          {/* Intervenciones */}
          <View style={styles.fieldGroup}>
            <View style={styles.fieldLabel}>
              <Ionicons name="hand-left-outline" size={16} color="#48bb78" />
              <Text style={styles.fieldLabelText}>{t('enfermeria.description')}</Text>
            </View>
            <TextInput
              style={[styles.fieldInput, styles.textArea]}
              placeholder={t('enfermeria.descriptionPlaceholder')}
              placeholderTextColor="#a0aec0"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              value={formData.intervenciones}
              onChangeText={(text) => setFormData({ ...formData, intervenciones: text })}
            />
          </View>

          {/* Evaluación */}
          <View style={styles.fieldGroup}>
            <View style={styles.fieldLabel}>
              <Ionicons name="analytics-outline" size={16} color="#48bb78" />
              <Text style={styles.fieldLabelText}>{t('enfermeria.description')}</Text>
            </View>
            <TextInput
              style={[styles.fieldInput, styles.textArea]}
              placeholder={t('enfermeria.descriptionPlaceholder')}
              placeholderTextColor="#a0aec0"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              value={formData.evaluacion}
              onChangeText={(text) => setFormData({ ...formData, evaluacion: text })}
            />
          </View>

          {/* Estado */}
          <View style={styles.fieldGroup}>
            <View style={styles.fieldLabel}>
              <Ionicons name="radio-button-on-outline" size={16} color="#48bb78" />
              <Text style={styles.fieldLabelText}>{t('common.status')}</Text>
            </View>
            <View style={styles.estadoButtons}>
              {CARE_STATES.map((estado) => (
                <TouchableOpacity
                  key={estado}
                  style={[
                    styles.estadoButton,
                    formData.estado === estado && { backgroundColor: getEstadoColor(estado) + '20' },
                    formData.estado === estado && { borderColor: getEstadoColor(estado) },
                  ]}
                  onPress={() => setFormData({ ...formData, estado: estado })}
                >
                  <Text style={[
                    styles.estadoButtonText,
                    formData.estado === estado && { color: getEstadoColor(estado), fontWeight: '700' },
                  ]}>
                    {getEstadoEmoji(estado)} {estado}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Observaciones */}
          <View style={styles.fieldGroup}>
            <View style={styles.fieldLabel}>
              <Ionicons name="document-text-outline" size={16} color="#718096" />
              <Text style={styles.fieldLabelText}>{t('common.observations')}</Text>
            </View>
            <TextInput
              style={[styles.fieldInput, styles.textArea]}
              placeholder={t('enfermeria.observations')}
              placeholderTextColor="#a0aec0"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              value={formData.observaciones}
              onChangeText={(text) => setFormData({ ...formData, observaciones: text })}
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.saveButton, loading && styles.disabledButton]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Ionicons name="save-outline" size={18} color="#fff" />
              <Text style={styles.saveButtonText}>{t('enfermeria.saveCare')}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Historial de Cuidados */}
      <View style={styles.historyCard}>
        <TouchableOpacity 
          style={styles.historyHeaderGradient}
          onPress={() => setShowHistory(!showHistory)}
          activeOpacity={0.8}
        >
          <LinearGradient 
            colors={['#48bb78', '#38a169']} 
            style={styles.historyHeaderInner}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <View style={styles.historyHeaderContent}>
              <Ionicons name="time-outline" size={20} color="#fff" />
              <Text style={styles.historyTitle}>{t('enfermeria.careHistory')}</Text>
              <View style={styles.historyCount}>
                <Text style={styles.historyCountText}>{history.length} {t('common.records')}</Text>
              </View>
              <Ionicons 
                name={showHistory ? "chevron-up-outline" : "chevron-down-outline"} 
                size={20} 
                color="#fff" 
              />
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {showHistory && (
          <View style={styles.historyBody}>
            {loadingHistory ? (
              <ActivityIndicator style={styles.historyLoader} size="large" color="#48bb78" />
            ) : history.length === 0 ? (
              <View style={styles.emptyHistory}>
                <Ionicons name="document-text-outline" size={48} color="#cbd5e0" />
                <Text style={styles.emptyHistoryText}>{t('enfermeria.noCareYet')}</Text>
              </View>
            ) : (
              <>
                <FlatList
                  data={paginatedHistory}
                  renderItem={renderHistoryItem}
                  keyExtractor={(item, index) => {
                    if (item.id_cuidado) {
                      return `care_${item.id_cuidado}`;
                    }
                    return `care_fallback_${index}_${item.fecha_registro || 'unknown'}`;
                  }}
                  scrollEnabled={false}
                  initialNumToRender={HISTORY_ITEMS_PER_PAGE}
                  maxToRenderPerBatch={HISTORY_ITEMS_PER_PAGE}
                />
                <View style={styles.historyPagination}>
                  <Pagination
                    currentPage={currentHistoryPage}
                    totalPages={totalHistoryPages}
                    onPageChange={setCurrentHistoryPage}
                    itemsPerPage={HISTORY_ITEMS_PER_PAGE}
                    totalItems={history.length}
                  />
                </View>
              </>
            )}
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7fafc' },
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
    borderLeftColor: '#48bb78',
  },
  patientInfoContent: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  patientAvatar: { width: 60, height: 60, borderRadius: 15, backgroundColor: '#48bb78', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  patientDetails: { flex: 1 },
  patientName: { fontSize: 16, fontWeight: 'bold', color: '#2d3748', marginBottom: 4 },
  patientMeta: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  patientMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  patientMetaText: { fontSize: 12, color: '#718096' },
  mainCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
    borderRadius: 25,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  cardHeader: { paddingVertical: 16, paddingHorizontal: 20 },
  cardHeaderContent: { flexDirection: 'row', alignItems: 'center' },
  cardHeaderTitle: { fontSize: 16, fontWeight: '600', color: '#fff', marginLeft: 8 },
  cardBody: { padding: 20 },
  fieldGroup: { marginBottom: 16 },
  fieldLabel: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  fieldLabelText: { fontSize: 13, fontWeight: '600', color: '#4a5568', marginLeft: 6 },
  fieldInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#2d3748',
    backgroundColor: '#fff',
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  estadoButtons: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  estadoButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
  },
  estadoButtonText: { fontSize: 12, color: '#4a5568' },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    backgroundColor: '#48bb78',
  },
  saveButtonText: { fontSize: 16, fontWeight: '600', color: '#fff', marginLeft: 8 },
  disabledButton: { opacity: 0.7 },
  historyCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 0,
    marginBottom: 30,
    borderRadius: 25,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  historyHeaderGradient: { overflow: 'hidden' },
  historyHeaderInner: { paddingVertical: 16, paddingHorizontal: 20 },
  historyHeaderContent: { flexDirection: 'row', alignItems: 'center' },
  historyTitle: { flex: 1, fontSize: 16, fontWeight: '600', color: '#fff', marginLeft: 8 },
  historyCount: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginRight: 8,
  },
  historyCountText: { fontSize: 11, color: '#fff', fontWeight: '500' },
  historyBody: { padding: 16 },
  historyLoader: { padding: 40 },
  emptyHistory: { alignItems: 'center', padding: 40 },
  emptyHistoryText: { fontSize: 14, color: '#a0aec0', marginTop: 12 },
  historyItem: {
    backgroundColor: '#f7fafc',
    borderRadius: 15,
    marginBottom: 16,
    overflow: 'hidden',
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#edf2f7',
  },
  historyBadge: {
    width: 45,
    height: 45,
    borderRadius: 12,
    backgroundColor: '#48bb78',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  historyBadgeText: { fontSize: 14, fontWeight: 'bold', color: '#fff' },
  historyInfo: { flex: 1 },
  historyDate: { fontSize: 12, fontWeight: '500', color: '#2d3748' },
  historyDoctor: { fontSize: 11, color: '#718096', marginTop: 2 },
  estadoBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginLeft: 8 },
  estadoBadgeText: { fontSize: 10, fontWeight: '700' },
  historyContent: { padding: 12 },
  historyField: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 4, flexWrap: 'wrap' },
  historyFieldLabel: { fontSize: 12, fontWeight: '600', color: '#4a5568', marginLeft: 6, marginRight: 4 },
  historyFieldValue: { fontSize: 12, color: '#2d3748', flex: 1 },
  historyPagination: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
});

export default EnfermeriaCareScreen;
