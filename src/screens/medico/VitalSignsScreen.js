// src/screens/medico/VitalSignsScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';

const VitalSignsScreen = ({ navigation, route }) => {
  const { id_atencion } = route.params;
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    ta: '',
    fc: '',
    fr: '',
    temp: '',
    spo2: '',
    peso: '',
    talla: '',
  });

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = async () => {
    // Validar que al menos un campo tenga datos
    const hasData = Object.values(formData).some(value => value !== '');
    if (!hasData) {
      Alert.alert('Advertencia', 'Ingrese al menos un signo vital');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post(`/appointments/${id_atencion}/vital-signs`, formData);
      if (response.data) {
        Alert.alert('Éxito', 'Signos vitales guardados correctamente');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error saving vital signs:', error);
      Alert.alert('Error', 'No se pudieron guardar los signos vitales');
    } finally {
      setLoading(false);
    }
  };

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
                <Ionicons name="card-outline" size={12} /> Exp: {route.params.Id_exp || 'N/A'}
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
            <Ionicons name="heartbeat-outline" size={22} color="#fff" />
            <Text style={styles.cardHeaderTitle}>Registro de Signos Vitales</Text>
          </View>
        </LinearGradient>

        <View style={styles.cardBody}>
          {/* Sección: Parámetros Clínicos */}
          <View style={styles.section}>
            <View style={styles.sectionTitle}>
              <Ionicons name="analytics-outline" size={22} color="#f56565" />
              <Text style={styles.sectionTitleText}>Parámetros Clínicos</Text>
            </View>

            <View style={styles.formGrid}>
              {/* Presión arterial */}
              <View style={styles.formGroup}>
                <View style={styles.formLabel}>
                  <Ionicons name="heartbeat-outline" size={16} color="#f56565" />
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

              {/* Frecuencia cardíaca */}
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

              {/* Frecuencia respiratoria */}
              <View style={styles.formGroup}>
                <View style={styles.formLabel}>
                  <Ionicons name="lungs-outline" size={16} color="#f56565" />
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

              {/* Temperatura */}
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

              {/* SpO₂ */}
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

              {/* Peso */}
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

              {/* Talla */}
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
        </View>

        {/* Botones */}
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
  // Tarjeta de información del paciente
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
  // Tarjeta principal
  mainCard: {
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
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: '#f56565',
  },
  sectionTitleText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#f56565',
    marginLeft: 8,
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
});

export default VitalSignsScreen;