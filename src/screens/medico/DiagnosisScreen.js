// src/screens/medico/DiagnosisScreen.js
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

const DiagnosisScreen = ({ navigation, route }) => {
  const { id_atencion, Id_exp } = route.params;
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    diagnostico_principal: '',
    diagnosticos_secundarios: '',
    observaciones: '',
  });

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
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error saving diagnosis:', error);
      Alert.alert('Error', 'No se pudo guardar el diagnóstico');
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

      {/* Tarjeta principal */}
      <View style={styles.mainCard}>
        <LinearGradient 
          colors={['#667eea', '#764ba2']} 
          style={styles.cardHeader}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <View style={styles.cardHeaderContent}>
            <Ionicons name="clipboard-outline" size={22} color="#fff" />
            <Text style={styles.cardHeaderTitle}>Registro de Diagnóstico</Text>
          </View>
        </LinearGradient>

        <View style={styles.cardBody}>
          {/* Diagnóstico principal */}
          <View style={styles.diagnosticoSection}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionBadge}>
                <Text style={styles.badgeText}>1</Text>
              </View>
              <Text style={styles.sectionTitle}>Diagnóstico principal</Text>
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

        {/* Botones */}
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
                <Text style={styles.saveButtonText}>Guardar Diagnóstico</Text>
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
});

export default DiagnosisScreen;