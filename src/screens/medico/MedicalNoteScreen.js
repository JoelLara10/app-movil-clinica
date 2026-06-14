// src/screens/medico/MedicalNoteScreen.js
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

const MedicalNoteScreen = ({ navigation, route }) => {
  const { id_atencion } = route.params;
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    subjetivo: '',
    objetivo: '',
    analisis: '',
    plan: '',
  });

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = async () => {
    // Validar campos requeridos
    if (!formData.subjetivo.trim()) {
      Alert.alert('Advertencia', 'El campo Subjetivo es requerido');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post(`/appointments/${id_atencion}/medical-notes`, formData);
      if (response.data) {
        Alert.alert('Éxito', 'Nota médica guardada correctamente');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error saving medical note:', error);
      Alert.alert('Error', 'No se pudo guardar la nota médica');
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
          <Ionicons name="document-text-outline" size={20} color="#fff" /> Nota Médica SOAP
        </Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      {/* Información del paciente - Versión simplificada */}
      <View style={styles.patientInfoCard}>
        <View style={styles.patientInfoContent}>
          <View style={[styles.patientAvatar, { backgroundColor: '#4299e1' }]}>
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

      {/* Tarjeta principal */}
      <View style={styles.mainCard}>
        <LinearGradient 
          colors={['#4299e1', '#3182ce']} 
          style={styles.cardHeader}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <View style={styles.cardHeaderContent}>
            <Ionicons name="document-text-outline" size={22} color="#fff" />
            <Text style={styles.cardHeaderTitle}>Nota Médica SOAP</Text>
          </View>
        </LinearGradient>

        <View style={styles.cardBody}>
          {/* Subjetivo - S */}
          <View style={styles.soapSection}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionBadge, styles.badgeS]}>
                <Text style={styles.badgeText}>S</Text>
              </View>
              <Text style={styles.sectionTitle}>Subjetivo</Text>
            </View>
            <TextInput
              style={styles.textArea}
              placeholder="Describa los síntomas y percepciones del paciente..."
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
              <Text style={styles.sectionTitle}>Objetivo</Text>
            </View>
            <TextInput
              style={styles.textArea}
              placeholder="Describa los hallazgos físicos y resultados de exploración..."
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
              <Text style={styles.sectionTitle}>Análisis</Text>
            </View>
            <TextInput
              style={styles.textArea}
              placeholder="Diagnóstico diferencial y análisis de la información..."
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
              <Text style={styles.sectionTitle}>Plan</Text>
            </View>
            <TextInput
              style={styles.textArea}
              placeholder="Tratamiento, estudios, referencias y seguimiento..."
              placeholderTextColor="#a0aec0"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              value={formData.plan}
              onChangeText={(text) => handleChange('plan', text)}
            />
          </View>
        </View>

        {/* Botón guardar */}
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
                <Text style={styles.saveButtonText}>Guardar Nota</Text>
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
  // Secciones SOAP
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
});

export default MedicalNoteScreen;