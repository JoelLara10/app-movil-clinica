// src/screens/enfermeria/EnfermeriaNoteScreen.js
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
import moment from 'moment';

const CACHE_KEY_PREFIX = 'enfermeria_notes_';
const CACHE_TTL = 2 * 60 * 1000; // 2 minutos

const EnfermeriaNoteScreen = ({ navigation, route }) => {
  const { id_atencion, Id_exp } = route.params;
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState([]);
  const [formData, setFormData] = useState({
    nota_enfermeria: '',
  });

  // Cargar historial de notas
  useEffect(() => {
    loadNursingNotesHistory();
  }, []);

  const loadNursingNotesHistory = async (forceRefresh = false) => {
    try {
      setLoadingHistory(true);
      const cacheKey = `${CACHE_KEY_PREFIX}${id_atencion}`;

      // Intentar obtener de caché primero (si no es forceRefresh)
      if (!forceRefresh) {
        const cachedData = await CacheService.get(cacheKey);
        if (cachedData) {
          console.log('📦 Notas de enfermería cargadas desde caché');
          setHistory(cachedData);
          setLoadingHistory(false);
          return;
        }
      }

      // Si no hay caché o es forceRefresh, cargar desde API
      console.log('🌐 Cargando notas de enfermería desde API...');
      const response = await api.get(`/appointments/${id_atencion}/nursing-notes`);
      
      // Guardar en caché
      await CacheService.set(cacheKey, response.data, CACHE_TTL);
      
      setHistory(response.data || []);
    } catch (error) {
      console.error('Error loading nursing notes history:', error);
      
      // Si falla la API, intentar cargar desde caché
      const cacheKey = `${CACHE_KEY_PREFIX}${id_atencion}`;
      const cachedData = await CacheService.get(cacheKey);
      if (cachedData) {
        console.log('📦 Notas de enfermería cargadas desde caché (fallback)');
        setHistory(cachedData);
      }
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.nota_enfermeria.trim()) {
      Alert.alert('Advertencia', 'La nota de enfermería es requerida');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post(`/appointments/${id_atencion}/nursing-notes`, formData);
      if (response.data) {
        Alert.alert('Éxito', 'Nota de enfermería guardada correctamente');
        // Limpiar formulario
        setFormData({ nota_enfermeria: '' });
        // Recargar historial con forceRefresh
        await loadNursingNotesHistory(true);
      }
    } catch (error) {
      console.error('Error saving nursing note:', error);
      Alert.alert('Error', error.response?.data?.error || 'No se pudo guardar la nota de enfermería');
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
        <Text style={styles.historyNoteLabel}>Nota:</Text>
        <Text style={styles.historyNoteText}>{item.nota || 'Sin contenido'}</Text>
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
          <Ionicons name="document-text-outline" size={20} color="#fff" /> Nota de Enfermería
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
            <Text style={styles.patientName}>Paciente</Text>
            <View style={styles.patientMeta}>
              <Text style={styles.patientMetaItem}>
                <Ionicons name="card-outline" size={12} color="#4299e1" />
                <Text style={styles.patientMetaText}>Exp: {Id_exp || 'N/A'}</Text>
              </Text>
              <Text style={styles.patientMetaItem}>
                <Ionicons name="calendar-outline" size={12} color="#4299e1" />
                <Text style={styles.patientMetaText}>Atención: {id_atencion}</Text>
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Tarjeta principal - Nueva nota */}
      <View style={styles.mainCard}>
        <LinearGradient 
          colors={['#4299e1', '#3182ce']} 
          style={styles.cardHeader}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <View style={styles.cardHeaderContent}>
            <Ionicons name="add-circle-outline" size={22} color="#fff" />
            <Text style={styles.cardHeaderTitle}>Nueva Nota de Enfermería</Text>
          </View>
        </LinearGradient>

        <View style={styles.cardBody}>
          <View style={styles.soapSection}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionBadge, styles.badgeN]}>
                <Text style={styles.badgeText}>N</Text>
              </View>
              <Text style={styles.sectionTitle}>Nota de Enfermería</Text>
            </View>
            <TextInput
              style={styles.textArea}
              placeholder="Observaciones del paciente, cuidados realizados, evolución..."
              placeholderTextColor="#a0aec0"
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              value={formData.nota_enfermeria}
              onChangeText={(text) => setFormData({ ...formData, nota_enfermeria: text })}
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
              <Text style={styles.saveButtonText}>Guardar Nota</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Historial de Notas de Enfermería */}
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
              <Text style={styles.historyTitle}>Historial de Notas</Text>
              <View style={styles.historyCount}>
                <Text style={styles.historyCountText}>{history.length} notas</Text>
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
              <ActivityIndicator style={styles.historyLoader} size="large" color="#4299e1" />
            ) : history.length === 0 ? (
              <View style={styles.emptyHistory}>
                <Ionicons name="document-text-outline" size={48} color="#cbd5e0" />
                <Text style={styles.emptyHistoryText}>No hay notas previas</Text>
              </View>
            ) : (
              <FlatList
                data={history}
                renderItem={renderHistoryItem}
                keyExtractor={(item, index) => {
                  if (item.id_nota) {
                    return `note_${item.id_nota}`;
                  }
                  return `note_fallback_${index}_${item.fecha_registro || 'unknown'}`;
                }}
                scrollEnabled={false}
                initialNumToRender={5}
                maxToRenderPerBatch={5}
              />
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
    borderLeftColor: '#4299e1',
  },
  patientInfoContent: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  patientAvatar: { width: 60, height: 60, borderRadius: 15, backgroundColor: '#4299e1', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
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
  soapSection: { marginBottom: 24, padding: 16, backgroundColor: '#f7fafc', borderRadius: 15 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  sectionBadge: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  badgeN: { backgroundColor: '#4299e1' },
  badgeText: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#2d3748' },
  textArea: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: '#2d3748',
    backgroundColor: '#fff',
    minHeight: 150,
    textAlignVertical: 'top',
  },
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
    backgroundColor: '#4299e1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  historyBadgeText: { fontSize: 14, fontWeight: 'bold', color: '#fff' },
  historyInfo: { flex: 1 },
  historyDate: { fontSize: 12, fontWeight: '500', color: '#2d3748' },
  historyDoctor: { fontSize: 11, color: '#718096', marginTop: 2 },
  historyContent: { padding: 12 },
  historyNoteLabel: { fontSize: 12, fontWeight: '600', color: '#4299e1', marginBottom: 4 },
  historyNoteText: { fontSize: 13, color: '#2d3748', lineHeight: 20 },
});

export default EnfermeriaNoteScreen;