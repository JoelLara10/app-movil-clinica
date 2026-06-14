// src/screens/medico/HistoriaClinicaScreen.js
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

const HistoriaClinicaScreen = ({ navigation, route }) => {
  const { id_atencion, Id_exp } = route.params;
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    motivo_consulta: '',
    sintomatologia: [],
    sintomatologia_otros: '',
    heredo: [],
    heredo_otros: '',
    nopat: [],
    nopat_otros: '',
    pat_enfermedades: '',
    pat_medicamentos: '',
    pat_alergias: '',
    pat_oculares: '',
    pat_cirugias: '',
  });

  // Opciones para checkboxes
  const sintomasOptions = ['Dolor', 'Ojo rojo', 'Lagrimeo', 'Visión borrosa', 'Fotofobia', 'Prurito', 'Cuerpo extraño'];
  const heredoOptions = ['Diabetes', 'Hipertensión', 'Cáncer', 'Glaucoma', 'Catarata'];
  const nopatOptions = ['Tabaquismo', 'Alcohol', 'Sedentarismo', 'Vacunación COVID'];

  const toggleCheckbox = (field, value) => {
    const current = [...formData[field]];
    if (current.includes(value)) {
      setFormData({ ...formData, [field]: current.filter(item => item !== value) });
    } else {
      setFormData({ ...formData, [field]: [...current, value] });
    }
  };

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = async () => {
    if (!formData.motivo_consulta.trim()) {
      Alert.alert('Advertencia', 'El motivo de consulta es requerido');
      return;
    }

    setLoading(true);
    try {
      // Convertir arrays a strings separados por comas para enviar
      const dataToSend = {
        ...formData,
        sintomatologia: formData.sintomatologia.join(','),
        heredo: formData.heredo.join(','),
        nopat: formData.nopat.join(','),
      };
      
      const response = await api.post(`/historia-clinica/${id_atencion}/${Id_exp}`, dataToSend);
      if (response.data) {
        Alert.alert('Éxito', 'Historia clínica guardada correctamente');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error saving historia clinica:', error);
      Alert.alert('Error', 'No se pudo guardar la historia clínica');
    } finally {
      setLoading(false);
    }
  };

  const renderCheckboxGroup = (title, options, field, icon) => (
    <View style={styles.section}>
      <View style={styles.sectionTitle}>
        <Ionicons name={icon} size={20} color="#667eea" />
        <Text style={styles.sectionTitleText}>{title}</Text>
      </View>
      <View style={styles.checkboxGroup}>
        {options.map((opt, idx) => (
          <TouchableOpacity
            key={idx}
            style={[
              styles.checkboxItem,
              formData[field].includes(opt) && styles.checkboxItemSelected
            ]}
            onPress={() => toggleCheckbox(field, opt)}
          >
            <Ionicons 
              name={formData[field].includes(opt) ? "checkmark-circle" : "ellipse-outline"} 
              size={18} 
              color={formData[field].includes(opt) ? "#667eea" : "#a0aec0"} 
            />
            <Text style={[styles.checkboxLabel, formData[field].includes(opt) && styles.checkboxLabelSelected]}>
              {opt}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <TextInput
        style={styles.input}
        placeholder={`Otros ${title.toLowerCase()}...`}
        placeholderTextColor="#a0aec0"
        value={formData[`${field}_otros`]}
        onChangeText={(text) => handleChange(`${field}_otros`, text)}
      />
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
          <Ionicons name="document-text-outline" size={20} color="#fff" /> Historia Clínica
        </Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      {/* Tarjeta principal */}
      <View style={styles.mainCard}>
        <LinearGradient 
          colors={['#667eea', '#764ba2']} 
          style={styles.cardHeader}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <View style={styles.cardHeaderContent}>
            <Ionicons name="person-circle-outline" size={22} color="#fff" />
            <Text style={styles.cardHeaderTitle}>
              Paciente: {Id_exp}
            </Text>
          </View>
        </LinearGradient>

        <View style={styles.cardBody}>
          {/* Motivo de consulta */}
          <View style={styles.section}>
            <View style={styles.sectionTitle}>
              <Ionicons name="help-circle-outline" size={20} color="#667eea" />
              <Text style={styles.sectionTitleText}>Motivo de consulta</Text>
            </View>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describa el motivo de la consulta..."
              placeholderTextColor="#a0aec0"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              value={formData.motivo_consulta}
              onChangeText={(text) => handleChange('motivo_consulta', text)}
            />
          </View>

          {/* Sintomatología Ocular */}
          {renderCheckboxGroup('Sintomatología Ocular', sintomasOptions, 'sintomatologia', 'eye-outline')}

          {/* Antecedentes Heredofamiliares */}
          {renderCheckboxGroup('Antecedentes Heredofamiliares', heredoOptions, 'heredo', 'people-outline')}

          {/* Antecedentes Personales No Patológicos */}
          {renderCheckboxGroup('Antecedentes Personales No Patológicos', nopatOptions, 'nopat', 'person-outline')}

          {/* Antecedentes Patológicos */}
          <View style={styles.section}>
            <View style={styles.sectionTitle}>
              <Ionicons name="medkit-outline" size={20} color="#667eea" />
              <Text style={styles.sectionTitleText}>Antecedentes Patológicos</Text>
            </View>
            
            <TextInput
              style={styles.input}
              placeholder="Enfermedades"
              placeholderTextColor="#a0aec0"
              value={formData.pat_enfermedades}
              onChangeText={(text) => handleChange('pat_enfermedades', text)}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Medicamentos"
              placeholderTextColor="#a0aec0"
              value={formData.pat_medicamentos}
              onChangeText={(text) => handleChange('pat_medicamentos', text)}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Alergias"
              placeholderTextColor="#a0aec0"
              value={formData.pat_alergias}
              onChangeText={(text) => handleChange('pat_alergias', text)}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Antecedentes oculares"
              placeholderTextColor="#a0aec0"
              value={formData.pat_oculares}
              onChangeText={(text) => handleChange('pat_oculares', text)}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Cirugías previas"
              placeholderTextColor="#a0aec0"
              value={formData.pat_cirugias}
              onChangeText={(text) => handleChange('pat_cirugias', text)}
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
                <Text style={styles.saveButtonText}>Guardar Historia Clínica</Text>
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
    marginBottom: 24,
  },
  sectionTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#667eea',
  },
  sectionTitleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#667eea',
    marginLeft: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#2d3748',
    backgroundColor: '#fff',
    marginBottom: 12,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  checkboxGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  checkboxItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  checkboxItemSelected: {
    backgroundColor: '#667eea20',
    borderColor: '#667eea',
  },
  checkboxLabel: {
    fontSize: 13,
    color: '#4a5568',
    marginLeft: 6,
  },
  checkboxLabelSelected: {
    color: '#667eea',
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
    paddingHorizontal: 20,
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
    paddingHorizontal: 20,
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

export default HistoriaClinicaScreen;