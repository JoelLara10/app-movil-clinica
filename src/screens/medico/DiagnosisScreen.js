// src/screens/medico/DiagnosisScreen.js
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
import moment from 'moment';
import 'moment/locale/es';

moment.locale('es');

const DiagnosisScreen = ({ navigation, route }) => {
  const { id_atencion, Id_exp } = route.params;
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [currentDiagnosis, setCurrentDiagnosis] = useState(null);
  const [history, setHistory] = useState([]);
  const [formData, setFormData] = useState({
    diagnostico_principal: '',
    diagnosticos_secundarios: '',
    observaciones: '',
  });

  // Cargar diagnóstico actual e historial
  useEffect(() => {
    loadCurrentDiagnosis();
    loadDiagnosisHistory();
  }, []);

  const loadCurrentDiagnosis = async () => {
    try {
      setLoadingData(true);
      const response = await api.get(`/appointments/${id_atencion}/diagnosis`);
      if (response.data && Object.keys(response.data).length > 0) {
        setCurrentDiagnosis(response.data);
        setFormData({
          diagnostico_principal: response.data.diagnostico_principal || '',
          diagnosticos_secundarios: response.data.diagnosticos_secundarios || '',
          observaciones: response.data.observaciones || '',
        });
      }
    } catch (error) {
      console.error('Error loading current diagnosis:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const loadDiagnosisHistory = async () => {
    try {
      setLoadingHistory(true);
      const response = await api.get(`/appointments/${id_atencion}/diagnosis/history`);
      setHistory(response.data || []);
    } catch (error) {
      console.error('Error loading diagnosis history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = async () => {
    if (!formData.diagnostico_principal.trim()) {
      Alert.alert('Advertencia', 'El diagnóstico principal es requerido');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post(`/appointments/${id_atencion}/diagnosis`, formData);
      if (response.data) {
        Alert.alert('Éxito', 'Diagnóstico guardado correctamente');
        // Recargar diagnóstico actual e historial
        await loadCurrentDiagnosis();
        await loadDiagnosisHistory();
      }
    } catch (error) {
      console.error('Error saving diagnosis:', error);
      Alert.alert('Error', error.response?.data?.error || 'No se pudo guardar el diagnóstico');
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
            <Ionicons name="medkit-outline" size={12} color="#718096" /> Dr. {item.medico_nombre || 'No especificado'}
          </Text>
        </View>
      </View>
      
      <View style={styles.historyContent}>
        <Text style={styles.historyPrincipalLabel}>Diagnóstico principal:</Text>
        <Text style={styles.historyPrincipalValue}>{item.diagnostico_principal}</Text>
        
        {item.diagnosticos_secundarios && (
          <>
            <Text style={styles.historySecondaryLabel}>Diagnósticos secundarios:</Text>
            <Text style={styles.historySecondaryValue}>{item.diagnosticos_secundarios}</Text>
          </>
        )}
        
        {item.observaciones && (
          <>
            <Text style={styles.historyObservacionesLabel}>Observaciones:</Text>
            <Text style={styles.historyObservacionesValue}>{item.observaciones}</Text>
          </>
        )}
      </View>
    </View>
  );

  if (loadingData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={styles.loadingText}>Cargando diagnóstico...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          <Ionicons name="clipboard-outline" size={20} color="#fff" /> Diagnóstico Médico
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
                <Ionicons name="card-outline" size={12} /> Exp: {Id_exp || 'N/A'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Estado del diagnóstico actual */}
      {currentDiagnosis && (
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Ionicons name="checkmark-circle" size={20} color="#48bb78" />
            <Text style={styles.statusTitle}>Diagnóstico Actual</Text>
          </View>
          <Text style={styles.statusDate}>
            Última actualización: {moment(currentDiagnosis.fecha_registro).format('DD/MM/YYYY HH:mm')}
          </Text>
        </View>
      )}

      {/* Tarjeta principal - Formulario */}
      <View style={styles.mainCard}>
        <LinearGradient 
          colors={['#667eea', '#764ba2']} 
          style={styles.cardHeader}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <View style={styles.cardHeaderContent}>
            <Ionicons name={currentDiagnosis ? "create-outline" : "add-circle-outline"} size={22} color="#fff" />
            <Text style={styles.cardHeaderTitle}>
              {currentDiagnosis ? 'Editar Diagnóstico' : 'Nuevo Diagnóstico'}
            </Text>
          </View>
        </LinearGradient>

        <View style={styles.cardBody}>
          {/* Diagnóstico principal */}
          <View style={styles.diagnosticoSection}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionBadge}>
                <Text style={styles.badgeText}>1</Text>
              </View>
              <Text style={styles.sectionTitle}>Diagnóstico principal *</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Ej: Diabetes mellitus tipo 2"
              placeholderTextColor="#a0aec0"
              value={formData.diagnostico_principal}
              onChangeText={(text) => handleChange('diagnostico_principal', text)}
            />
          </View>

          {/* Diagnósticos secundarios */}
          <View style={styles.diagnosticoSection}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionBadge}>
                <Text style={styles.badgeText}>2</Text>
              </View>
              <Text style={styles.sectionTitle}>Diagnósticos secundarios</Text>
            </View>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Diagnósticos adicionales (uno por línea o separados por comas)"
              placeholderTextColor="#a0aec0"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              value={formData.diagnosticos_secundarios}
              onChangeText={(text) => handleChange('diagnosticos_secundarios', text)}
            />
          </View>

          {/* Observaciones */}
          <View style={styles.diagnosticoSection}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionBadge}>
                <Text style={styles.badgeText}>3</Text>
              </View>
              <Text style={styles.sectionTitle}>Observaciones</Text>
            </View>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Notas adicionales, consideraciones clínicas, etc."
              placeholderTextColor="#a0aec0"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              value={formData.observaciones}
              onChangeText={(text) => handleChange('observaciones', text)}
            />
          </View>
        </View>

        <View style={styles.cardFooter}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="close-outline" size={18} color="#718096" />
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>

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
                <Text style={styles.saveButtonText}>
                  {currentDiagnosis ? 'Actualizar Diagnóstico' : 'Guardar Diagnóstico'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Historial de Diagnósticos */}
      <View style={styles.historyCard}>
        <TouchableOpacity 
          style={styles.historyHeaderGradient}
          onPress={() => setShowHistory(!showHistory)}
          activeOpacity={0.8}
        >
          <LinearGradient 
            colors={['#667eea', '#764ba2']} 
            style={styles.historyHeaderInner}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <View style={styles.historyHeaderContent}>
              <Ionicons name="time-outline" size={20} color="#fff" />
              <Text style={styles.historyTitle}>Historial de Diagnósticos</Text>
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
              <ActivityIndicator style={styles.historyLoader} size="large" color="#667eea" />
            ) : history.length === 0 ? (
              <View style={styles.emptyHistory}>
                <Ionicons name="document-text-outline" size={48} color="#cbd5e0" />
                <Text style={styles.emptyHistoryText}>No hay diagnósticos previos</Text>
              </View>
            ) : (
              <FlatList
                data={history}
                renderItem={renderHistoryItem}
                keyExtractor={(item, index) => item.id_diagnostico?.toString() || index.toString()}
                scrollEnabled={false}
              />
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
  },
  patientMetaItem: {
    fontSize: 12,
    color: '#718096',
  },
  statusCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 12,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#48bb78',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2d3748',
    marginLeft: 6,
  },
  statusDate: {
    fontSize: 11,
    color: '#a0aec0',
    marginTop: 4,
    marginLeft: 26,
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
  diagnosticoSection: {
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
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2d3748',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: '#2d3748',
    backgroundColor: '#fff',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    backgroundColor: '#f7fafc',
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#718096',
    marginLeft: 8,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: '#48bb78',
  },
  saveButtonText: {
    fontSize: 14,
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
    backgroundColor: '#667eea',
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
  historyPrincipalLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#667eea',
    marginTop: 4,
  },
  historyPrincipalValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2d3748',
    marginBottom: 8,
  },
  historySecondaryLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#ed8936',
    marginTop: 4,
  },
  historySecondaryValue: {
    fontSize: 13,
    color: '#4a5568',
    marginBottom: 8,
  },
  historyObservacionesLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#718096',
    marginTop: 4,
  },
  historyObservacionesValue: {
    fontSize: 13,
    color: '#4a5568',
  },
});

export default DiagnosisScreen;