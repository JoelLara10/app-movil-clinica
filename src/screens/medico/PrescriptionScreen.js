// src/screens/medico/PrescriptionScreen.js
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

const PrescriptionScreen = ({ navigation, route }) => {
  const { id_atencion, Id_exp } = route.params;
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [prescriptions, setPrescriptions] = useState([]);
  const [medications, setMedications] = useState([
    { id: 0, medicamento: '', dosis: '', frecuencia: '', duracion: '', indicaciones: '' }
  ]);

  // Cargar historial de recetas
  useEffect(() => {
    loadPrescriptionsHistory();
  }, []);

  const loadPrescriptionsHistory = async () => {
    try {
      setLoadingHistory(true);
      const response = await api.get(`/appointments/${id_atencion}/prescriptions`);
      setPrescriptions(response.data);
    } catch (error) {
      console.error('Error loading prescriptions history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const addMedication = () => {
    const newId = medications.length;
    setMedications([
      ...medications,
      { id: newId, medicamento: '', dosis: '', frecuencia: '', duracion: '', indicaciones: '' }
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
    // Validar que al menos un medicamento tenga nombre
    const hasValidMed = medications.some(med => med.medicamento.trim() !== '');
    if (!hasValidMed) {
      Alert.alert('Advertencia', 'Debe agregar al menos un medicamento');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post(`/appointments/${id_atencion}/prescriptions`, {
        medicamentos: medications.filter(med => med.medicamento.trim() !== '')
      });
      if (response.data) {
        Alert.alert('Éxito', 'Receta médica guardada correctamente');
        // Limpiar formulario
        setMedications([
          { id: 0, medicamento: '', dosis: '', frecuencia: '', duracion: '', indicaciones: '' }
        ]);
        // Recargar historial
        loadPrescriptionsHistory();
      }
    } catch (error) {
      console.error('Error saving prescription:', error);
      Alert.alert('Error', error.response?.data?.error || 'No se pudo guardar la receta');
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
        {item.medicamentos && item.medicamentos.map((med, idx) => (
          <View key={idx} style={styles.historyMedication}>
            <View style={styles.historyMedHeader}>
              <Ionicons name="medkit-outline" size={14} color="#48bb78" />
              <Text style={styles.historyMedName}>{med.medicamento}</Text>
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
              {med.duracion && (
                <View style={styles.historyMedDetail}>
                  <Ionicons name="calendar-outline" size={10} color="#a0aec0" />
                  <Text style={styles.historyMedDetailText}>Duración: {med.duracion}</Text>
                </View>
              )}
              {med.indicaciones && (
                <View style={styles.historyMedDetail}>
                  <Ionicons name="document-text-outline" size={10} color="#a0aec0" />
                  <Text style={styles.historyMedDetailText}>Indicaciones: {med.indicaciones}</Text>
                </View>
              )}
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#48bb78', '#38a169']} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          <Ionicons name="medkit-outline" size={20} color="#fff" /> Receta Médica
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

      {/* Tarjeta principal - Nueva receta */}
      <View style={styles.mainCard}>
        <LinearGradient 
          colors={['#48bb78', '#38a169']} 
          style={styles.cardHeader}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <View style={styles.cardHeaderContent}>
            <Ionicons name="add-circle-outline" size={22} color="#fff" />
            <Text style={styles.cardHeaderTitle}>Nueva Receta Médica</Text>
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
                  <TouchableOpacity 
                    onPress={() => removeMedication(med.id)}
                    style={styles.deleteButton}
                  >
                    <Ionicons name="trash-outline" size={18} color="#e53e3e" />
                    <Text style={styles.deleteButtonText}>Eliminar</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.medicationBody}>
                {/* Medicamento */}
                <View style={styles.fieldGroup}>
                  <View style={styles.fieldLabel}>
                    <Ionicons name="eyedrop-outline" size={16} color="#48bb78" />
                    <Text style={styles.fieldLabelText}>Medicamento *</Text>
                  </View>
                  <TextInput
                    style={styles.fieldInput}
                    placeholder="Nombre del medicamento"
                    placeholderTextColor="#a0aec0"
                    value={med.medicamento}
                    onChangeText={(text) => updateMedication(med.id, 'medicamento', text)}
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
                      <Ionicons name="calendar-outline" size={16} color="#48bb78" />
                      <Text style={styles.fieldLabelText}>Duración</Text>
                    </View>
                    <TextInput
                      style={styles.fieldInput}
                      placeholder="Ej: 7 días"
                      placeholderTextColor="#a0aec0"
                      value={med.duracion}
                      onChangeText={(text) => updateMedication(med.id, 'duracion', text)}
                    />
                  </View>

                  <View style={[styles.fieldGroup, styles.halfField]}>
                    <View style={styles.fieldLabel}>
                      <Ionicons name="document-text-outline" size={16} color="#48bb78" />
                      <Text style={styles.fieldLabelText}>Indicaciones</Text>
                    </View>
                    <TextInput
                      style={styles.fieldInput}
                      placeholder="Instrucciones adicionales"
                      placeholderTextColor="#a0aec0"
                      value={med.indicaciones}
                      onChangeText={(text) => updateMedication(med.id, 'indicaciones', text)}
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
                <Text style={styles.saveButtonText}>Guardar Receta</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Historial de Recetas */}
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
              <Text style={styles.historyTitle}>Historial de Recetas</Text>
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
            ) : prescriptions.length === 0 ? (
              <View style={styles.emptyHistory}>
                <Ionicons name="document-text-outline" size={48} color="#cbd5e0" />
                <Text style={styles.emptyHistoryText}>No hay recetas previas</Text>
              </View>
            ) : (
              <FlatList
                data={prescriptions}
                renderItem={renderHistoryItem}
                keyExtractor={(item, index) => item.id_receta?.toString() || index.toString()}
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
    borderLeftColor: '#48bb78',
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
    backgroundColor: '#48bb78',
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
  medicationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2d3748',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: 12,
    color: '#e53e3e',
    marginLeft: 4,
  },
  medicationBody: {
    padding: 16,
  },
  fieldGroup: {
    marginBottom: 12,
  },
  halfField: {
    flex: 1,
    marginHorizontal: 4,
  },
  row: {
    flexDirection: 'row',
    marginHorizontal: -4,
  },
  fieldLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  fieldLabelText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4a5568',
    marginLeft: 6,
  },
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
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#48bb78',
    marginLeft: 8,
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
    paddingVertical: 12,
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
    backgroundColor: '#48bb78',
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
  historyMedication: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  historyMedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  historyMedName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2d3748',
    marginLeft: 6,
  },
  historyMedDetails: {
    marginLeft: 20,
  },
  historyMedDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  historyMedDetailText: {
    fontSize: 11,
    color: '#718096',
    marginLeft: 4,
  },
});

export default PrescriptionScreen;