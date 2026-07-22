// src/screens/medico/MedicalNoteScreen.js
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
import { useLanguage } from '../../context/LanguageContext';
import moment from 'moment';

const CACHE_KEY_PREFIX = 'medical_notes_';
const CACHE_TTL = 2 * 60 * 1000; // 2 minutos
const HISTORY_ITEMS_PER_PAGE = 5;

const MedicalNoteScreen = ({ navigation, route }) => {
  const { id_atencion, Id_exp } = route.params;
  const { t, lang } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [currentHistoryPage, setCurrentHistoryPage] = useState(1);
  const [formData, setFormData] = useState({
    subjetivo: '',
    objetivo: '',
    analisis: '',
    plan: '',
  });

  // Cargar historial de notas médicas
  useEffect(() => {
    loadMedicalNotesHistory();
  }, []);

  const loadMedicalNotesHistory = async (forceRefresh = false) => {
    try {
      setLoadingHistory(true);
      const cacheKey = `${CACHE_KEY_PREFIX}${id_atencion}`;

      // Intentar obtener de caché primero (si no es forceRefresh)
      if (!forceRefresh) {
        const cachedData = await CacheService.get(cacheKey);
        if (cachedData) {
          console.log('📦 Notas médicas cargadas desde caché');
          setHistory(cachedData);
          setLoadingHistory(false);
          return;
        }
      }

      // Si no hay caché o es forceRefresh, cargar desde API
      console.log('🌐 Cargando notas médicas desde API...');
      const response = await api.get(`/appointments/${id_atencion}/medical-notes`);
      
      // Guardar en caché
      await CacheService.set(cacheKey, response.data, CACHE_TTL);
      
      setHistory(response.data);
      if (forceRefresh) setCurrentHistoryPage(1);
    } catch (error) {
      console.error('Error loading medical notes history:', error);
      
      // Si falla la API, intentar cargar desde caché aunque esté expirada
      const cacheKey = `${CACHE_KEY_PREFIX}${id_atencion}`;
      const cachedData = await CacheService.get(cacheKey);
      if (cachedData) {
        console.log('📦 Notas médicas cargadas desde caché (fallback)');
        setHistory(cachedData);
      }
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = async () => {
    // Validar campos requeridos
    if (!formData.subjetivo.trim()) {
      Alert.alert(t('common.warning'), t('common.requiredField'));
      return;
    }

    setLoading(true);
    try {
      const response = await api.post(`/appointments/${id_atencion}/medical-notes`, formData);
      if (response.data) {
        Alert.alert(t('common.success'), 'Nota médica guardada correctamente');
        // Limpiar formulario
        setFormData({
          subjetivo: '',
          objetivo: '',
          analisis: '',
          plan: '',
        });
        // Recargar historial con forceRefresh
        await loadMedicalNotesHistory(true);
        // Mantener abierto el historial si ya estaba abierto
        if (showHistory) {
          setShowHistory(true);
        }
      }
    } catch (error) {
      console.error('Error saving medical note:', error);
      Alert.alert(t('common.error'), error.response?.data?.error || t('common.couldNotSaveData'));
    } finally {
      setLoading(false);
    }
  };

  // Calcular páginas para el historial
  const totalHistoryPages = Math.ceil(history.length / HISTORY_ITEMS_PER_PAGE);
  const paginatedHistory = history.slice(
    (currentHistoryPage - 1) * HISTORY_ITEMS_PER_PAGE,
    currentHistoryPage * HISTORY_ITEMS_PER_PAGE
  );

  // Ajustar página actual si es mayor que el total
  useEffect(() => {
    const validTotalPages = Math.max(1, totalHistoryPages);
    if (currentHistoryPage > validTotalPages) {
      setCurrentHistoryPage(validTotalPages);
    }
  }, [currentHistoryPage, totalHistoryPages]);

  const renderHistoryItem = ({ item }) => (
    <View style={styles.historyItem}>
      <View style={styles.historyHeader}>
        <View style={styles.historyBadge}>
          <Text style={styles.historyBadgeText}>
            {moment(item.fecha_registro).format('DD/MM')}
          </Text>
        </View>
        <View style={styles.historyInfo}>
          <Text style={styles.historyDate}>
            {moment(item.fecha_registro).format(lang === 'es' ? 'dddd, D [de] MMMM [de] YYYY [a las] HH:mm' : 'dddd, D MMMM YYYY [at] HH:mm')}
          </Text>
          <Text style={styles.historyDoctor}>
            <Ionicons name="medkit-outline" size={12} color="#718096" /> Dr. {item.id_medico || t('medico.notSpecified')}
          </Text>
        </View>
      </View>
      
      <View style={styles.historyContent}>
        <View style={styles.historyField}>
          <View style={[styles.historyFieldBadge, { backgroundColor: '#4299e1' }]}>
            <Text style={styles.historyFieldBadgeText}>S</Text>
          </View>
          <Text style={styles.historyFieldLabel}>{t('medico.subjective')}</Text>
        </View>
        <Text style={styles.historyFieldValue}>{item.subjetivo || t('medico.notSpecified')}</Text>
        
        {item.objetivo && (
          <>
            <View style={styles.historyField}>
              <View style={[styles.historyFieldBadge, { backgroundColor: '#48bb78' }]}>
                <Text style={styles.historyFieldBadgeText}>O</Text>
              </View>
              <Text style={styles.historyFieldLabel}>{t('medico.objective')}</Text>
            </View>
            <Text style={styles.historyFieldValue}>{item.objetivo}</Text>
          </>
        )}
        
        {item.analisis && (
          <>
            <View style={styles.historyField}>
              <View style={[styles.historyFieldBadge, { backgroundColor: '#ed8936' }]}>
                <Text style={styles.historyFieldBadgeText}>A</Text>
              </View>
              <Text style={styles.historyFieldLabel}>{t('medico.analysis')}</Text>
            </View>
            <Text style={styles.historyFieldValue}>{item.analisis}</Text>
          </>
        )}
        
        {item.plan && (
          <>
            <View style={styles.historyField}>
              <View style={[styles.historyFieldBadge, { backgroundColor: '#9f7aea' }]}>
                <Text style={styles.historyFieldBadgeText}>P</Text>
              </View>
              <Text style={styles.historyFieldLabel}>{t('medico.plan')}</Text>
            </View>
            <Text style={styles.historyFieldValue}>{item.plan}</Text>
          </>
        )}
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          <Ionicons name="document-text-outline" size={20} color="#fff" /> {t('medico.medicalNote')}
        </Text>
        <TouchableOpacity
          onPress={() => loadMedicalNotesHistory(true)}
          style={styles.backButton}
          disabled={loadingHistory}
        >
          <Ionicons name="refresh-outline" size={22} color="#fff" />
        </TouchableOpacity>
      </LinearGradient>

      {/* Información del paciente */}
      <View style={styles.patientInfoCard}>
        <View style={styles.patientInfoContent}>
          <View style={[styles.patientAvatar, { backgroundColor: '#4299e1' }]}>
            <Ionicons name="person-circle" size={50} color="#fff" />
          </View>
          <View style={styles.patientDetails}>
            <Text style={styles.patientName}>{t('medico.patient')}</Text>
            <View style={styles.patientMeta}>
              <Text style={styles.patientMetaItem}>
                <Ionicons name="card-outline" size={12} /> Exp: {Id_exp || 'N/A'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Tarjeta principal - Nuevo registro */}
      <View style={styles.mainCard}>
        <LinearGradient 
          colors={['#4299e1', '#3182ce']} 
          style={styles.cardHeader}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <View style={styles.cardHeaderContent}>
            <Ionicons name="add-circle-outline" size={22} color="#fff" />
            <Text style={styles.cardHeaderTitle}>{t('medico.newMedicalNote')}</Text>
          </View>
        </LinearGradient>

        <View style={styles.cardBody}>
          {/* Subjetivo - S */}
          <View style={styles.soapSection}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionBadge, styles.badgeS]}>
                <Text style={styles.badgeText}>S</Text>
              </View>
              <Text style={styles.sectionTitle}>{t('medico.subjective')}</Text>
            </View>
            <TextInput
              style={styles.textArea}
              placeholder={t('medico.subjectivePlaceholder')}
              placeholderTextColor="#a0aec0"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              value={formData.subjetivo}
              onChangeText={(text) => handleChange('subjetivo', text)}
            />
          </View>

          {/* Objetivo - O */}
          <View style={styles.soapSection}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionBadge, styles.badgeO]}>
                <Text style={styles.badgeText}>O</Text>
              </View>
              <Text style={styles.sectionTitle}>{t('medico.objective')}</Text>
            </View>
            <TextInput
              style={styles.textArea}
              placeholder={t('medico.objectivePlaceholder')}
              placeholderTextColor="#a0aec0"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              value={formData.objetivo}
              onChangeText={(text) => handleChange('objetivo', text)}
            />
          </View>

          {/* Análisis - A */}
          <View style={styles.soapSection}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionBadge, styles.badgeA]}>
                <Text style={styles.badgeText}>A</Text>
              </View>
              <Text style={styles.sectionTitle}>{t('medico.analysis')}</Text>
            </View>
            <TextInput
              style={styles.textArea}
              placeholder={t('medico.analysisPlaceholder')}
              placeholderTextColor="#a0aec0"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              value={formData.analisis}
              onChangeText={(text) => handleChange('analisis', text)}
            />
          </View>

          {/* Plan - P */}
          <View style={styles.soapSection}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionBadge, styles.badgeP]}>
                <Text style={styles.badgeText}>P</Text>
              </View>
              <Text style={styles.sectionTitle}>{t('medico.plan')}</Text>
            </View>
            <TextInput
              style={styles.textArea}
              placeholder={t('medico.planPlaceholder')}
              placeholderTextColor="#a0aec0"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              value={formData.plan}
              onChangeText={(text) => handleChange('plan', text)}
            />
          </View>
        </View>

        <View style={styles.cardFooter}>
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
                <Text style={styles.saveButtonText}>{t('medico.saveNote')}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Historial de Notas Médicas */}
      <View style={styles.historyCard}>
        <TouchableOpacity 
          style={styles.historyHeaderGradient}
          onPress={() => setShowHistory(!showHistory)}
          activeOpacity={0.8}
        >
          <LinearGradient 
            colors={['#4299e1', '#3182ce']} 
            style={styles.historyHeaderInner}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <View style={styles.historyHeaderContent}>
              <Ionicons name="time-outline" size={20} color="#fff" />
              <Text style={styles.historyTitle}>{t('medico.medicalNotesHistory')}</Text>
              {history.length > 0 && (
                <View style={styles.historyCount}>
                  <Text style={styles.historyCountText}>{history.length} {t('common.records')}</Text>
                </View>
              )}
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
              <ActivityIndicator style={styles.historyLoader} size="large" color="#4299e1" />
            ) : history.length === 0 ? (
              <View style={styles.emptyHistory}>
                <Ionicons name="document-text-outline" size={48} color="#cbd5e0" />
                <Text style={styles.emptyHistoryText}>{t('common.noPreviousNotes')}</Text>
              </View>
            ) : (
              <>
                <FlatList
                  data={paginatedHistory}
                  renderItem={renderHistoryItem}
                  keyExtractor={(item, index) => item.id_nota?.toString() || `note-${index}`}
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
    borderLeftColor: '#4299e1',
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
  },
  patientMetaItem: {
    fontSize: 12,
    color: '#718096',
  },
  mainCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
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
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
  cardBody: {
    padding: 20,
  },
  soapSection: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#f7fafc',
    borderRadius: 15,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  badgeS: {
    backgroundColor: '#4299e1',
  },
  badgeO: {
    backgroundColor: '#48bb78',
  },
  badgeA: {
    backgroundColor: '#ed8936',
  },
  badgeP: {
    backgroundColor: '#9f7aea',
  },
  badgeText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3748',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: '#2d3748',
    backgroundColor: '#fff',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  cardFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    backgroundColor: '#f7fafc',
    alignItems: 'center',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 12,
    backgroundColor: '#48bb78',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
  disabledButton: {
    opacity: 0.7,
  },
  historyCard: {
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
  historyHeaderGradient: {
    overflow: 'hidden',
  },
  historyHeaderInner: {
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  historyHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
  historyCount: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginRight: 8,
  },
  historyCountText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '500',
  },
  historyBody: {
    padding: 16,
  },
  historyLoader: {
    padding: 40,
  },
  emptyHistory: {
    alignItems: 'center',
    padding: 40,
  },
  emptyHistoryText: {
    fontSize: 14,
    color: '#a0aec0',
    marginTop: 12,
  },
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
    backgroundColor: '#4299e1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  historyBadgeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  historyInfo: {
    flex: 1,
  },
  historyDate: {
    fontSize: 12,
    fontWeight: '500',
    color: '#2d3748',
  },
  historyDoctor: {
    fontSize: 11,
    color: '#718096',
    marginTop: 2,
  },
  historyContent: {
    padding: 12,
  },
  historyField: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
  historyFieldBadge: {
    width: 22,
    height: 22,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  historyFieldBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  historyFieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4a5568',
  },
  historyFieldValue: {
    fontSize: 13,
    color: '#2d3748',
    marginLeft: 30,
    marginBottom: 8,
  },
  historyPagination: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
});

export default MedicalNoteScreen;
