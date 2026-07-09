// src/screens/enfermeria/EnfermeriaMedicationsScreen.js
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

const CACHE_KEY_PREFIX = 'enfermeria_medications_';
const CACHE_TTL = 2 * 60 * 1000; // 2 minutos
const HISTORY_ITEMS_PER_PAGE = 5;

const EnfermeriaMedicationsScreen = ({ navigation, route }) => {
  const { id_atencion, Id_exp } = route.params;
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState([]);
  const [currentHistoryPage, setCurrentHistoryPage] = useState(1);
  const [medications, setMedications] = useState([
    { id: 0, nombre: '', dosis: '', frecuencia: '', via: '', fecha_aplicacion: '' }
  ]);

  // Cargar historial de medicamentos
  useEffect(() => {
    loadMedicationsHistory();
  }, []);

  const loadMedicationsHistory = async (forceRefresh = false) => {
    try {
      setLoadingHistory(true);
      const cacheKey = `${CACHE_KEY_PREFIX}${id_atencion}`;

      // Intentar obtener de caché primero (si no es forceRefresh)
      if (!forceRefresh) {
        const cachedData = await CacheService.get(cacheKey);
        if (cachedData) {
          console.log('📦 Historial de medicamentos cargado desde caché');
          setHistory(cachedData);
          setLoadingHistory(false);
          return;
        }
      }

      // Si no hay caché o es forceRefresh, cargar desde API
      console.log('🌐 Cargando historial de medicamentos desde API...');
      const response = await api.get(`/appointments/${id_atencion}/medications`);
      
      // Guardar en caché
      await CacheService.set(cacheKey, response.data, CACHE_TTL);
      
      setHistory(response.data || []);
      if (forceRefresh) setCurrentHistoryPage(1);
    } catch (error) {
      console.error('Error loading medications history:', error);
      
      // Si falla la API, intentar cargar desde caché
      const cacheKey = `${CACHE_KEY_PREFIX}${id_atencion}`;
      const cachedData = await CacheService.get(cacheKey);
      if (cachedData) {
        console.log('📦 Historial de medicamentos cargado desde caché (fallback)');
        setHistory(cachedData);
      }
    } finally {
      setLoadingHistory(false);
    }
  };

  const addMedication = () => {
    const newId = medications.length;
    setMedications([
      ...medications,
      { id: newId, nombre: '', dosis: '', frecuencia: '', via: '', fecha_aplicacion: '' }
    ]);
  };

  const removeMedication = (id) => {
    if (medications.length === 1) {
      Alert.alert('Advertencia', 'Debe tener al menos un medicamento');
      return;
    }
    setMedications(medications.filter(med => med.id !== id));
  };

  const updateMedication = (id, field, value) => {
    setMedications(medications.map(med =>
      med.id === id ? { ...med, [field]: value } : med
    ));
  };

  const handleSubmit = async () => {
    const hasValidMed = medications.some(med => med.nombre.trim() !== '');
    if (!hasValidMed) {
      Alert.alert('Advertencia', 'Debe agregar al menos un medicamento');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post(`/appointments/${id_atencion}/medications`, {
        medicamentos: medications.filter(med => med.nombre.trim() !== '')
      });
      if (response.data) {
        Alert.alert('Éxito', 'Administración de medicamentos registrada');
        // Limpiar formulario
        setMedications([
          { id: 0, nombre: '', dosis: '', frecuencia: '', via: '', fecha_aplicacion: '' }
        ]);
        // Recargar historial con forceRefresh
        await loadMedicationsHistory(true);
      }
    } catch (error) {
      console.error('Error saving medications:', error);
      Alert.alert('Error', error.response?.data?.error || 'No se pudo guardar la administración');
    } finally {
      setLoading(false);
    }
  };

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
            {moment(item.fecha_registro).format('dddd, D [de] MMMM [de] YYYY [a las] HH:mm')}
          </Text>
          <Text style={styles.historyDoctor}>
            <Ionicons name="medkit-outline" size={12} color="#718096" /> Enf. {item.enfermero_nombre || 'No especificado'}
          </Text>
        </View>
      </View>
      
      <View style={styles.historyContent}>
        {item.medicamentos && item.medicamentos.map((med, idx) => (
          <View key={idx} style={styles.historyMedication}>
            <View style={styles.historyMedHeader}>
              <Ionicons name="medkit-outline" size={14} color="#48bb78" />
              <Text style={styles.historyMedName}>{med.nombre}</Text>
            </View>
            <View style={styles.historyMedDetails}>
              {med.dosis && (
                <View style={styles.historyMedDetail}>
                  <Ionicons name="scale-outline" size={10} color="#a0aec0" />
                  <Text style={styles.historyMedDetailText}>Dosis: {med.dosis}</Text>
                </View>
              )}
              {med.frecuencia && (
                <View style={styles.historyMedDetail}>
                  <Ionicons name="time-outline" size={10} color="#a0aec0" />
                  <Text style={styles.historyMedDetailText}>Frecuencia: {med.frecuencia}</Text>
                </View>
              )}
              {med.via && (
                <View style={styles.historyMedDetail}>
                  <Ionicons name="medical-outline" size={10} color="#a0aec0" />
                  <Text style={styles.historyMedDetailText}>Vía: {med.via}</Text>
                </View>
              )}
              {med.fecha_aplicacion && (
                <View style={styles.historyMedDetail}>
                  <Ionicons name="calendar-outline" size={10} color="#a0aec0" />
                  <Text style={styles.historyMedDetailText}>Fecha: {med.fecha_aplicacion}</Text>
                </View>
              )}
            </View>
          </View>
        ))}
      </View>
    </View>
  );

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
          <Ionicons name="medkit-outline" size={20} color="#fff" /> Administración de Medicamentos
        </Text>
        <TouchableOpacity
          onPress={() => loadMedicationsHistory(true)}
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
            <Text style={styles.patientName}>Paciente</Text>
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

      {/* Tarjeta principal - Nueva administración */}
      <View style={styles.mainCard}>
        <LinearGradient 
          colors={['#48bb78', '#38a169']} 
          style={styles.cardHeader}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <View style={styles.cardHeaderContent}>
            <Ionicons name="add-circle-outline" size={22} color="#fff" />
            <Text style={styles.cardHeaderTitle}>Registrar Administración</Text>
          </View>
        </LinearGradient>

        <View style={styles.cardBody}>
          {medications.map((med, index) => (
            <View key={med.id} style={styles.medicationCard}>
              <View style={styles.medicationHeader}>
                <Text style={styles.medicationTitle}>
                  <Ionicons name="medkit-outline" size={16} /> Medicamento #{index + 1}
                </Text>
                {medications.length > 1 && (
                  <TouchableOpacity onPress={() => removeMedication(med.id)} style={styles.deleteButton}>
                    <Ionicons name="trash-outline" size={18} color="#e53e3e" />
                    <Text style={styles.deleteButtonText}>Eliminar</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.medicationBody}>
                <View style={styles.fieldGroup}>
                  <View style={styles.fieldLabel}>
                    <Ionicons name="medkit-outline" size={16} color="#48bb78" />
                    <Text style={styles.fieldLabelText}>Medicamento *</Text>
                  </View>
                  <TextInput
                    style={styles.fieldInput}
                    placeholder="Nombre del medicamento"
                    placeholderTextColor="#a0aec0"
                    value={med.nombre}
                    onChangeText={(text) => updateMedication(med.id, 'nombre', text)}
                  />
                </View>

                <View style={styles.row}>
                  <View style={[styles.fieldGroup, styles.halfField]}>
                    <View style={styles.fieldLabel}>
                      <Ionicons name="scale-outline" size={16} color="#48bb78" />
                      <Text style={styles.fieldLabelText}>Dosis</Text>
                    </View>
                    <TextInput
                      style={styles.fieldInput}
                      placeholder="Ej: 500mg"
                      placeholderTextColor="#a0aec0"
                      value={med.dosis}
                      onChangeText={(text) => updateMedication(med.id, 'dosis', text)}
                    />
                  </View>

                  <View style={[styles.fieldGroup, styles.halfField]}>
                    <View style={styles.fieldLabel}>
                      <Ionicons name="time-outline" size={16} color="#48bb78" />
                      <Text style={styles.fieldLabelText}>Frecuencia</Text>
                    </View>
                    <TextInput
                      style={styles.fieldInput}
                      placeholder="Ej: Cada 8 horas"
                      placeholderTextColor="#a0aec0"
                      value={med.frecuencia}
                      onChangeText={(text) => updateMedication(med.id, 'frecuencia', text)}
                    />
                  </View>
                </View>

                <View style={styles.row}>
                  <View style={[styles.fieldGroup, styles.halfField]}>
                    <View style={styles.fieldLabel}>
                      <Ionicons name="medical-outline" size={16} color="#48bb78" />
                      <Text style={styles.fieldLabelText}>Vía</Text>
                    </View>
                    <TextInput
                      style={styles.fieldInput}
                      placeholder="Oral, IV, IM"
                      placeholderTextColor="#a0aec0"
                      value={med.via}
                      onChangeText={(text) => updateMedication(med.id, 'via', text)}
                    />
                  </View>

                  <View style={[styles.fieldGroup, styles.halfField]}>
                    <View style={styles.fieldLabel}>
                      <Ionicons name="calendar-outline" size={16} color="#48bb78" />
                      <Text style={styles.fieldLabelText}>Fecha aplicación</Text>
                    </View>
                    <TextInput
                      style={styles.fieldInput}
                      placeholder="DD/MM/YYYY"
                      placeholderTextColor="#a0aec0"
                      value={med.fecha_aplicacion}
                      onChangeText={(text) => updateMedication(med.id, 'fecha_aplicacion', text)}
                    />
                  </View>
                </View>
              </View>
            </View>
          ))}

          <TouchableOpacity style={styles.addButton} onPress={addMedication}>
            <Ionicons name="add-outline" size={20} color="#48bb78" />
            <Text style={styles.addButtonText}>Agregar otro Medicamento</Text>
          </TouchableOpacity>
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
              <Text style={styles.saveButtonText}>Registrar Administración</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Historial de Administraciones */}
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
              <Text style={styles.historyTitle}>Historial de Administraciones</Text>
              <View style={styles.historyCount}>
                <Text style={styles.historyCountText}>{history.length} registros</Text>
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
                <Text style={styles.emptyHistoryText}>No hay administraciones previas</Text>
              </View>
            ) : (
              <>
                <FlatList
                  data={paginatedHistory}
                  renderItem={renderHistoryItem}
                  keyExtractor={(item, index) => {
                    if (item.id_registro) {
                      return `med_${item.id_registro}`;
                    }
                    return `med_fallback_${index}_${item.fecha_registro || 'unknown'}`;
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
  medicationCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 15,
    marginBottom: 20,
    overflow: 'hidden',
  },
  medicationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f7fafc',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  medicationTitle: { fontSize: 14, fontWeight: '600', color: '#2d3748' },
  deleteButton: { flexDirection: 'row', alignItems: 'center' },
  deleteButtonText: { fontSize: 12, color: '#e53e3e', marginLeft: 4 },
  medicationBody: { padding: 16 },
  fieldGroup: { marginBottom: 12 },
  halfField: { flex: 1, marginHorizontal: 4 },
  row: { flexDirection: 'row', marginHorizontal: -4 },
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
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: '#48bb78',
    borderRadius: 12,
    borderStyle: 'dashed',
    marginTop: 8,
  },
  addButtonText: { fontSize: 14, fontWeight: '600', color: '#48bb78', marginLeft: 8 },
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
  historyContent: { padding: 12 },
  historyMedication: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  historyMedHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  historyMedName: { fontSize: 13, fontWeight: '600', color: '#2d3748', marginLeft: 6 },
  historyMedDetails: { marginLeft: 20 },
  historyMedDetail: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  historyMedDetailText: { fontSize: 11, color: '#718096', marginLeft: 4 },
  historyPagination: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
});

export default EnfermeriaMedicationsScreen;