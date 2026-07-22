// src/screens/medico/StudyResultsScreen.js
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
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import CacheService from '../../services/cacheService';
import Pagination from '../../components/Pagination';
import { useLanguage } from '../../context/LanguageContext';
import moment from 'moment';
import 'moment/locale/es';

const CACHE_KEY_PATIENT = 'study_results_patient_';
const CACHE_KEY_LAB = 'study_results_lab_';
const CACHE_KEY_GAB = 'study_results_gab_';
const CACHE_TTL = 2 * 60 * 1000; // 2 minutos
const RESULTS_PER_PAGE = 5;

const StudyResultsScreen = ({ navigation, route }) => {
  const { id_atencion, Id_exp } = route.params;
  const { t, lang } = useLanguage();
  moment.locale(lang === 'es' ? 'es' : 'en-gb');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [paciente, setPaciente] = useState(null);
  const [laboratorio, setLaboratorio] = useState([]);
  const [gabinete, setGabinete] = useState([]);
  const [selectedExam, setSelectedExam] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  
  // Estados de paginación
  const [labCurrentPage, setLabCurrentPage] = useState(1);
  const [gabCurrentPage, setGabCurrentPage] = useState(1);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async (forceRefresh = false) => {
    try {
      setLoading(true);
      
      const cacheKeyPatient = `${CACHE_KEY_PATIENT}${id_atencion}`;
      const cacheKeyLab = `${CACHE_KEY_LAB}${id_atencion}`;
      const cacheKeyGab = `${CACHE_KEY_GAB}${id_atencion}`;

      // Cargar información del paciente
      if (!forceRefresh) {
        const cachedPatient = await CacheService.get(cacheKeyPatient);
        if (cachedPatient) {
          setPaciente(cachedPatient);
        } else {
          const pacienteRes = await api.get(`/paciente/${id_atencion}/${Id_exp}`);
          setPaciente(pacienteRes.data.paciente);
          await CacheService.set(cacheKeyPatient, pacienteRes.data.paciente, CACHE_TTL);
        }
      } else {
        const pacienteRes = await api.get(`/paciente/${id_atencion}/${Id_exp}`);
        setPaciente(pacienteRes.data.paciente);
        await CacheService.set(cacheKeyPatient, pacienteRes.data.paciente, CACHE_TTL);
      }

      // Cargar resultados de laboratorio
      if (!forceRefresh) {
        const cachedLab = await CacheService.get(cacheKeyLab);
        if (cachedLab) {
          setLaboratorio(cachedLab);
        } else {
          const labRes = await api.get(`/exams/patient/${id_atencion}?type=LABORATORIO`);
          setLaboratorio(labRes.data);
          await CacheService.set(cacheKeyLab, labRes.data, CACHE_TTL);
        }
      } else {
        const labRes = await api.get(`/exams/patient/${id_atencion}?type=LABORATORIO`);
        setLaboratorio(labRes.data);
        await CacheService.set(cacheKeyLab, labRes.data, CACHE_TTL);
      }

      // Cargar resultados de gabinete
      if (!forceRefresh) {
        const cachedGab = await CacheService.get(cacheKeyGab);
        if (cachedGab) {
          setGabinete(cachedGab);
        } else {
          const gabRes = await api.get(`/exams/patient/${id_atencion}?type=GABINETE`);
          setGabinete(gabRes.data);
          await CacheService.set(cacheKeyGab, gabRes.data, CACHE_TTL);
        }
      } else {
        const gabRes = await api.get(`/exams/patient/${id_atencion}?type=GABINETE`);
        setGabinete(gabRes.data);
        await CacheService.set(cacheKeyGab, gabRes.data, CACHE_TTL);
      }
      
    } catch (error) {
      console.error('Error loading data:', error);
      
      // Intentar cargar desde caché en caso de error
      const cacheKeyPatient = `${CACHE_KEY_PATIENT}${id_atencion}`;
      const cacheKeyLab = `${CACHE_KEY_LAB}${id_atencion}`;
      const cacheKeyGab = `${CACHE_KEY_GAB}${id_atencion}`;
      
      const [cachedPatient, cachedLab, cachedGab] = await Promise.all([
        CacheService.get(cacheKeyPatient),
        CacheService.get(cacheKeyLab),
        CacheService.get(cacheKeyGab)
      ]);
      
      if (cachedPatient) setPaciente(cachedPatient);
      if (cachedLab) setLaboratorio(cachedLab);
      if (cachedGab) setGabinete(cachedGab);
      
      if (!cachedPatient && !cachedLab && !cachedGab) {
        Alert.alert(t('common.error'), t('common.couldNotLoadResults'));
      }
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData(true);
    // Resetear páginas al refrescar
    setLabCurrentPage(1);
    setGabCurrentPage(1);
    setRefreshing(false);
  };

  const handleViewResult = (exam) => {
    setSelectedExam(exam);
    setModalVisible(true);
  };

  // Calcular páginas para laboratorio
  const labTotalPages = Math.ceil(laboratorio.length / RESULTS_PER_PAGE);
  const paginatedLaboratorio = laboratorio.slice(
    (labCurrentPage - 1) * RESULTS_PER_PAGE,
    labCurrentPage * RESULTS_PER_PAGE
  );

  // Calcular páginas para gabinete
  const gabTotalPages = Math.ceil(gabinete.length / RESULTS_PER_PAGE);
  const paginatedGabinete = gabinete.slice(
    (gabCurrentPage - 1) * RESULTS_PER_PAGE,
    gabCurrentPage * RESULTS_PER_PAGE
  );

  // Ajustar páginas si es necesario
  useEffect(() => {
    const validLabPages = Math.max(1, labTotalPages);
    if (labCurrentPage > validLabPages) {
      setLabCurrentPage(validLabPages);
    }
  }, [labCurrentPage, labTotalPages]);

  useEffect(() => {
    const validGabPages = Math.max(1, gabTotalPages);
    if (gabCurrentPage > validGabPages) {
      setGabCurrentPage(validGabPages);
    }
  }, [gabCurrentPage, gabTotalPages]);

  const renderResultsTable = (results, type, currentPage, setCurrentPage, totalPages) => {
    const isLab = type === 'LABORATORIO';
    const headerColor = isLab ? '#48bb78' : '#ed8936';
    const iconName = isLab ? 'flask-outline' : 'scan-outline';
    
    if (results.length === 0) {
      return (
        <View style={styles.emptyState}>
          <View style={[styles.emptyStateIcon, { backgroundColor: headerColor }]}>
            <Ionicons name={iconName} size={40} color="#fff" />
          </View>
          <Text style={styles.emptyStateTitle}>
            {isLab ? t('medico.labResults') : t('medico.imagingResults')}
          </Text>
          <Text style={styles.emptyStateText}>
            {t('common.noResultsYet')}
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.tableContainer}>
        <View style={styles.tableHeader}>
          <Text style={[styles.headerCell, styles.dateHeader]}>{t('common.date')}</Text>
          <Text style={[styles.headerCell, styles.examsHeader]}>{t('common.exams')}</Text>
          <Text style={[styles.headerCell, styles.doctorHeader]}>{t('common.doctor')}</Text>
          <Text style={[styles.headerCell, styles.observationsHeader]}>{t('common.observations')}</Text>
          <Text style={[styles.headerCell, styles.actionHeader]}>Ver</Text>
        </View>
        
        <ScrollView>
          {results.map((item, index) => (
            <View key={item.id_examen || index} style={styles.tableRow}>
              {/* Fecha */}
              <View style={[styles.rowCell, styles.dateCell]}>
                <View style={styles.dateBadge}>
                  <Text style={styles.dateDay}>
                    {moment(item.fecha).format('DD/MM/YYYY')}
                  </Text>
                  <Text style={styles.dateTime}>
                    {moment(item.fecha).format('HH:mm')}
                  </Text>
                </View>
              </View>
              
              {/* Estudios */}
              <View style={[styles.rowCell, styles.examsCell]}>
                <View style={styles.estudiosContainer}>
                  {item.detalles && item.detalles.map((estudio, idx) => (
                    <View key={idx} style={styles.estudioItem}>
                      <Text style={styles.estudioName}>{estudio.nombre}</Text>
                      {estudio.estado === 'REALIZADO' && (
                        <Ionicons name="checkmark-circle" size={14} color="#48bb78" />
                      )}
                    </View>
                  ))}
                </View>
              </View>
              
              {/* Médico */}
              <View style={[styles.rowCell, styles.doctorCell]}>
                <View style={styles.medicoInfo}>
                  <Ionicons name="medkit-outline" size={14} color={headerColor} />
                  <Text style={styles.medicoName}>{item.medico || t('common.notSpecified')}</Text>
                </View>
              </View>
              
              {/* Observaciones */}
              <View style={[styles.rowCell, styles.observationsCell]}>
                <Text style={styles.observationsText} numberOfLines={2}>
                  {item.observaciones || '—'}
                </Text>
              </View>
              
              {/* Botón Ver */}
              <TouchableOpacity
                style={[styles.viewButton, { backgroundColor: headerColor }]}
                onPress={() => handleViewResult(item)}
              >
                <Ionicons name="eye-outline" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
        
        {/* Paginación */}
        {totalPages > 1 && (
          <View style={styles.paginationContainer}>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              itemsPerPage={RESULTS_PER_PAGE}
              totalItems={results.length}
            />
          </View>
        )}
      </View>
    );
  };

  const renderModal = () => {
    if (!selectedExam) return null;
    
    const isLab = selectedExam.tipo === 'LABORATORIO';
    const headerColor = isLab ? '#48bb78' : '#ed8936';
    
    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <LinearGradient
              colors={[headerColor, headerColor + 'cc']}
              style={styles.modalHeader}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.modalTitle}>
                {t('medico.studyDetail')}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close-outline" size={28} color="#fff" />
              </TouchableOpacity>
            </LinearGradient>
            
            <ScrollView style={styles.modalBody}>
              <View style={styles.modalInfoRow}>
                <Text style={styles.modalLabel}>{t('medico.dateLabel')}:</Text>
                <Text style={styles.modalValue}>
                  {moment(selectedExam.fecha).format('DD/MM/YYYY HH:mm')}
                </Text>
              </View>
              
              <View style={styles.modalInfoRow}>
                <Text style={styles.modalLabel}>{t('medico.medicalRequester')}:</Text>
                <Text style={styles.modalValue}>{selectedExam.medico || t('common.notSpecified')}</Text>
              </View>
              
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>{t('medico.studiesPerformed')}:</Text>
                {selectedExam.detalles && selectedExam.detalles.map((estudio, idx) => (
                  <View key={idx} style={styles.modalEstudio}>
                    <Ionicons name="document-text-outline" size={16} color={headerColor} />
                    <Text style={styles.modalEstudioName}>{estudio.nombre}</Text>
                    <View style={[
                      styles.modalEstado,
                      { backgroundColor: estudio.estado === 'REALIZADO' ? '#48bb78' : '#ed8936' }
                    ]}>
                      <Text style={styles.modalEstadoText}>
                        {estudio.estado === 'REALIZADO' ? t('common.completed') : t('common.pending')}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
              
              {selectedExam.observaciones && (
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>{t('common.observations')}:</Text>
                  <Text style={styles.modalObservaciones}>{selectedExam.observaciones}</Text>
                </View>
              )}
              
              {selectedExam.detalles && selectedExam.detalles.some(d => d.resultado) && (
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>{t('common.resultsLabel')}:</Text>
                  {selectedExam.detalles.map((estudio, idx) => (
                    estudio.resultado && (
                      <View key={idx} style={styles.modalResultado}>
                        <Text style={styles.modalResultadoTitle}>{estudio.nombre}:</Text>
                        <Text style={styles.modalResultadoText}>{estudio.resultado}</Text>
                      </View>
                    )
                  ))}
                </View>
              )}
              
              {selectedExam.detalles && selectedExam.detalles.some(d => d.archivo_resultado) && (
                <TouchableOpacity
                  style={styles.downloadButton}
                  onPress={() => {
                    Alert.alert(t('common.attention'), t('common.downloadComingSoon'));
                  }}
                >
                  <Ionicons name="download-outline" size={20} color="#fff" />
                  <Text style={styles.downloadButtonText}>{t('common.downloadAttachment')}</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={styles.loadingText}>{t('medico.loadingResults')}</Text>
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
          <Ionicons name="document-text-outline" size={20} color="#fff" /> {t('medico.studyResults')}
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
              {paciente?.nom_pac || ''} {paciente?.papell || ''} {paciente?.sapell || ''}
            </Text>
            <View style={styles.patientMeta}>
              <Text style={styles.patientMetaItem}>
                <Ionicons name="card-outline" size={12} /> Exp: {paciente?.Id_exp || Id_exp}
              </Text>
              <Text style={styles.patientMetaItem}>
                <Ionicons name="location-outline" size={12} /> Área: {paciente?.area || 'N/A'}
              </Text>
              <Text style={styles.patientMetaItem}>
                <Ionicons name="calendar-outline" size={12} /> Ingreso: {paciente?.fecha ? moment(paciente.fecha).format('DD/MM/YYYY HH:mm') : 'N/A'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Resultados de Laboratorio */}
      <View style={styles.mainCard}>
        <LinearGradient
          colors={['#48bb78', '#38a169']}
          style={styles.cardHeader}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <View style={styles.cardHeaderContent}>
            <Ionicons name="flask-outline" size={20} color="#fff" />
              <Text style={styles.cardHeaderTitle}>{t('medico.labResults')}</Text>
            <View style={[styles.badge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              <Text style={styles.badgeText}>{laboratorio.length} {t('common.resultsLabel')}</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.cardBody}>
          {renderResultsTable(
            paginatedLaboratorio, 
            'LABORATORIO', 
            labCurrentPage, 
            setLabCurrentPage, 
            labTotalPages
          )}
        </View>
      </View>

      {/* Resultados de Gabinete */}
      <View style={styles.mainCard}>
        <LinearGradient
          colors={['#ed8936', '#dd6b20']}
          style={styles.cardHeader}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <View style={styles.cardHeaderContent}>
            <Ionicons name="scan-outline" size={20} color="#fff" />
            <Text style={styles.cardHeaderTitle}>{t('medico.imagingResults')}</Text>
            <View style={[styles.badge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              <Text style={styles.badgeText}>{gabinete.length} {t('common.resultsLabel')}</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.cardBody}>
          {renderResultsTable(
            paginatedGabinete, 
            'GABINETE', 
            gabCurrentPage, 
            setGabCurrentPage, 
            gabTotalPages
          )}
        </View>
      </View>

      {/* Modal de detalles */}
      {renderModal()}
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
    backgroundColor: '#4299e1',
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
  dateHeader: { width: 80 },
  examsHeader: { flex: 2 },
  doctorHeader: { width: 100 },
  observationsHeader: { flex: 1.5 },
  actionHeader: { width: 45, textAlign: 'center' },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    alignItems: 'center',
  },
  rowCell: {
    fontSize: 12,
    color: '#2d3748',
  },
  dateCell: { width: 80 },
  examsCell: { flex: 2 },
  doctorCell: { width: 100 },
  observationsCell: { flex: 1.5 },
  dateBadge: {
    alignItems: 'center',
  },
  dateDay: {
    fontWeight: '600',
    fontSize: 12,
  },
  dateTime: {
    fontSize: 10,
    color: '#a0aec0',
  },
  estudiosContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  estudioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f4f8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  estudioName: {
    fontSize: 11,
    color: '#2d3748',
  },
  medicoInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  medicoName: {
    fontSize: 12,
    color: '#4a5568',
  },
  observationsText: {
    fontSize: 11,
    color: '#718096',
    fontStyle: 'italic',
  },
  viewButton: {
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
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 13,
    color: '#718096',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: '90%',
    maxHeight: '80%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  modalBody: {
    padding: 16,
  },
  modalInfoRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  modalLabel: {
    width: 120,
    fontSize: 13,
    fontWeight: '600',
    color: '#4a5568',
  },
  modalValue: {
    flex: 1,
    fontSize: 13,
    color: '#2d3748',
  },
  modalSection: {
    marginTop: 16,
  },
  modalSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 8,
  },
  modalEstudio: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  modalEstudioName: {
    flex: 1,
    fontSize: 13,
    color: '#2d3748',
  },
  modalEstado: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  modalEstadoText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  modalObservaciones: {
    fontSize: 13,
    color: '#718096',
    lineHeight: 18,
  },
  modalResultado: {
    marginBottom: 12,
  },
  modalResultadoTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#667eea',
    marginBottom: 4,
  },
  modalResultadoText: {
    fontSize: 13,
    color: '#2d3748',
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4299e1',
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 16,
    gap: 8,
  },
  downloadButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  paginationContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    backgroundColor: '#f7fafc',
  },
});

export default StudyResultsScreen;