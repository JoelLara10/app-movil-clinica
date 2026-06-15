// src/screens/medico/VitalSignsScreen.js
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

const VitalSignsScreen = ({ navigation, route }) => {
  const { id_atencion, Id_exp } = route.params;
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [history, setHistory] = useState([]);
  const [formData, setFormData] = useState({
    ta: '',
    fc: '',
    fr: '',
    temp: '',
    spo2: '',
    peso: '',
    talla: '',
  });

  // Cargar historial de signos vitales
  useEffect(() => {
    loadVitalSignsHistory();
  }, []);

  const loadVitalSignsHistory = async () => {
    try {
      setLoadingHistory(true);
      const response = await api.get(`/appointments/${id_atencion}/vital-signs`);
      setHistory(response.data);
    } catch (error) {
      console.error('Error loading vital signs history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  // Función para convertir valores numéricos
  const parseNumericValue = (value) => {
    if (!value || value === '') return null;
    const parsed = parseFloat(value);
    return isNaN(parsed) ? null : parsed;
  };

  const handleSubmit = async () => {
    // Validar que al menos un campo tenga datos
    const hasData = Object.values(formData).some(value => value !== '');
    if (!hasData) {
      Alert.alert('Advertencia', 'Ingrese al menos un signo vital');
      return;
    }

    // Preparar datos con tipos correctos
    const dataToSend = {
      ta: formData.ta || '',  // TA es string (formato "120/80")
      fc: parseNumericValue(formData.fc),
      fr: parseNumericValue(formData.fr),
      temp: parseNumericValue(formData.temp),
      spo2: parseNumericValue(formData.spo2),
      peso: parseNumericValue(formData.peso),
      talla: parseNumericValue(formData.talla),
    };

    // Remover campos nulos
    Object.keys(dataToSend).forEach(key => {
      if (dataToSend[key] === null) {
        delete dataToSend[key];
      }
    });

    console.log('Enviando datos:', dataToSend);

    setLoading(true);
    try {
      const response = await api.post(`/appointments/${id_atencion}/vital-signs`, dataToSend);
      if (response.data) {
        Alert.alert('Éxito', 'Signos vitales guardados correctamente');
        // Limpiar formulario
        setFormData({
          ta: '',
          fc: '',
          fr: '',
          temp: '',
          spo2: '',
          peso: '',
          talla: '',
        });
        // Recargar historial
        loadVitalSignsHistory();
      }
    } catch (error) {
      console.error('Error saving vital signs:', error);
      Alert.alert('Error', error.response?.data?.error || 'No se pudieron guardar los signos vitales');
    } finally {
      setLoading(false);
    }
  };

  const renderHistoryItem = ({ item }) => (
    <View style={styles.historyItem}>
      <View style={styles.historyHeader}>
        <Ionicons name="calendar-outline" size={14} color="#718096" />
        <Text style={styles.historyDate}>
          {moment(item.fecha_registro).format('DD/MM/YYYY HH:mm')}
        </Text>
      </View>
      <View style={styles.historyGrid}>
        {item.ta && (
          <View style={styles.historyField}>
            <Text style={styles.historyLabel}>TA</Text>
            <Text style={styles.historyValue}>{item.ta}</Text>
          </View>
        )}
        {item.fc !== undefined && item.fc !== null && (
          <View style={styles.historyField}>
            <Text style={styles.historyLabel}>FC</Text>
            <Text style={styles.historyValue}>{item.fc}</Text>
          </View>
        )}
        {item.fr !== undefined && item.fr !== null && (
          <View style={styles.historyField}>
            <Text style={styles.historyLabel}>FR</Text>
            <Text style={styles.historyValue}>{item.fr}</Text>
          </View>
        )}
        {item.temp !== undefined && item.temp !== null && (
          <View style={styles.historyField}>
            <Text style={styles.historyLabel}>Temp</Text>
            <Text style={styles.historyValue}>{item.temp}°C</Text>
          </View>
        )}
        {item.spo2 !== undefined && item.spo2 !== null && (
          <View style={styles.historyField}>
            <Text style={styles.historyLabel}>SpO₂</Text>
            <Text style={styles.historyValue}>{item.spo2}%</Text>
          </View>
        )}
        {item.peso !== undefined && item.peso !== null && (
          <View style={styles.historyField}>
            <Text style={styles.historyLabel}>Peso</Text>
            <Text style={styles.historyValue}>{item.peso}kg</Text>
          </View>
        )}
        {item.talla !== undefined && item.talla !== null && (
          <View style={styles.historyField}>
            <Text style={styles.historyLabel}>Talla</Text>
            <Text style={styles.historyValue}>{item.talla}m</Text>
          </View>
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
          <Ionicons name="heart-outline" size={20} color="#fff" /> Signos Vitales
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

      {/* Formulario principal */}
      <View style={styles.mainCard}>
        <LinearGradient 
          colors={['#f56565', '#ed8936']} 
          style={styles.cardHeader}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <View style={styles.cardHeaderContent}>
            <Ionicons name="heart-outline" size={22} color="#fff" />
            <Text style={styles.cardHeaderTitle}>Nuevo Registro de Signos Vitales</Text>
          </View>
        </LinearGradient>

        <View style={styles.cardBody}>
          <View style={styles.formGrid}>
            {/* Presión arterial - STRING */}
            <View style={styles.formGroup}>
              <View style={styles.formLabel}>
                <Ionicons name="heart-outline" size={16} color="#f56565" />
                <Text style={styles.formLabelText}>Presión arterial (TA)</Text>
              </View>
              <TextInput
                style={styles.formInput}
                placeholder="120/80"
                placeholderTextColor="#a0aec0"
                value={formData.ta}
                onChangeText={(text) => handleChange('ta', text)}
              />
            </View>

            {/* Frecuencia cardíaca - NUMBER */}
            <View style={styles.formGroup}>
              <View style={styles.formLabel}>
                <Ionicons name="heart-outline" size={16} color="#f56565" />
                <Text style={styles.formLabelText}>Frecuencia cardíaca (FC)</Text>
              </View>
              <TextInput
                style={styles.formInput}
                placeholder="lpm"
                placeholderTextColor="#a0aec0"
                keyboardType="numeric"
                value={formData.fc}
                onChangeText={(text) => handleChange('fc', text)}
              />
            </View>

            {/* Frecuencia respiratoria - NUMBER */}
            <View style={styles.formGroup}>
              <View style={styles.formLabel}>
                <Ionicons name="pulse-outline" size={16} color="#f56565" />
                <Text style={styles.formLabelText}>Frecuencia respiratoria (FR)</Text>
              </View>
              <TextInput
                style={styles.formInput}
                placeholder="rpm"
                placeholderTextColor="#a0aec0"
                keyboardType="numeric"
                value={formData.fr}
                onChangeText={(text) => handleChange('fr', text)}
              />
            </View>

            {/* Temperatura - NUMBER (Double) */}
            <View style={styles.formGroup}>
              <View style={styles.formLabel}>
                <Ionicons name="thermometer-outline" size={16} color="#f56565" />
                <Text style={styles.formLabelText}>Temperatura (°C)</Text>
              </View>
              <TextInput
                style={styles.formInput}
                placeholder="36.5"
                placeholderTextColor="#a0aec0"
                keyboardType="numeric"
                value={formData.temp}
                onChangeText={(text) => handleChange('temp', text)}
              />
            </View>

            {/* SpO₂ - NUMBER */}
            <View style={styles.formGroup}>
              <View style={styles.formLabel}>
                <Ionicons name="water-outline" size={16} color="#f56565" />
                <Text style={styles.formLabelText}>SpO₂ (%)</Text>
              </View>
              <TextInput
                style={styles.formInput}
                placeholder="98"
                placeholderTextColor="#a0aec0"
                keyboardType="numeric"
                value={formData.spo2}
                onChangeText={(text) => handleChange('spo2', text)}
              />
            </View>

            {/* Peso - NUMBER (Double) */}
            <View style={styles.formGroup}>
              <View style={styles.formLabel}>
                <Ionicons name="scale-outline" size={16} color="#f56565" />
                <Text style={styles.formLabelText}>Peso (kg)</Text>
              </View>
              <TextInput
                style={styles.formInput}
                placeholder="70"
                placeholderTextColor="#a0aec0"
                keyboardType="numeric"
                value={formData.peso}
                onChangeText={(text) => handleChange('peso', text)}
              />
            </View>

            {/* Talla - NUMBER (Double) */}
            <View style={styles.formGroup}>
              <View style={styles.formLabel}>
                <Ionicons name="resize-outline" size={16} color="#f56565" />
                <Text style={styles.formLabelText}>Talla (m)</Text>
              </View>
              <TextInput
                style={styles.formInput}
                placeholder="1.70"
                placeholderTextColor="#a0aec0"
                keyboardType="numeric"
                value={formData.talla}
                onChangeText={(text) => handleChange('talla', text)}
              />
            </View>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back-outline" size={18} color="#718096" />
            <Text style={styles.cancelButtonText}>Regresar</Text>
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
                <Text style={styles.saveButtonText}>Guardar signos vitales</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Historial de Signos Vitales */}
      <View style={styles.historyCard}>
        <LinearGradient 
          colors={['#4299e1', '#3182ce']} 
          style={styles.historyHeaderGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <View style={styles.historyHeaderContent}>
            <Ionicons name="time-outline" size={20} color="#fff" />
            <Text style={styles.historyTitle}>Historial de Signos Vitales</Text>
          </View>
        </LinearGradient>

        {loadingHistory ? (
          <ActivityIndicator style={styles.historyLoader} size="large" color="#4299e1" />
        ) : history.length === 0 ? (
          <View style={styles.emptyHistory}>
            <Ionicons name="document-text-outline" size={48} color="#cbd5e0" />
            <Text style={styles.emptyHistoryText}>No hay registros previos</Text>
          </View>
        ) : (
          <FlatList
            data={history}
            renderItem={renderHistoryItem}
            keyExtractor={(item, index) => item.id_signos?.toString() || index.toString()}
            scrollEnabled={false}
          />
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
    borderLeftColor: '#f56565',
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
    backgroundColor: '#f56565',
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
  formGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  formGroup: {
    width: '48%',
    marginBottom: 16,
  },
  formLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  formLabelText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2d3748',
    marginLeft: 6,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: '#2d3748',
    backgroundColor: '#fff',
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
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  historyHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
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
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  historyDate: {
    fontSize: 12,
    color: '#718096',
    marginLeft: 6,
  },
  historyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  historyField: {
    width: '33%',
    marginBottom: 8,
  },
  historyLabel: {
    fontSize: 10,
    color: '#a0aec0',
  },
  historyValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2d3748',
  },
});

export default VitalSignsScreen;