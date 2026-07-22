// src/screens/medico/HistoriaClinicaScreen.js
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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import CacheService from '../../services/cacheService';
import { useLanguage } from '../../context/LanguageContext';

const CACHE_KEY_PREFIX = 'historia_clinica_';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

const HistoriaClinicaScreen = ({ navigation, route }) => {
  const { id_atencion, Id_exp } = route.params;
  const { t, lang } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
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

  // Cargar datos existentes al iniciar
  useEffect(() => {
    loadExistingData();
  }, []);

  const loadExistingData = async () => {
    try {
      setLoadingData(true);
      const cacheKey = `${CACHE_KEY_PREFIX}${id_atencion}_${Id_exp}`;

      // 1. Intentar obtener de caché primero
      const cachedData = await CacheService.get(cacheKey);
      if (cachedData) {
        console.log('📦 Historia clínica cargada desde caché');
        setFormData({
          motivo_consulta: cachedData.motivo_consulta || '',
          sintomatologia: cachedData.sintomatologia || [],
          sintomatologia_otros: cachedData.sintomatologia_otros || '',
          heredo: cachedData.heredo || [],
          heredo_otros: cachedData.heredo_otros || '',
          nopat: cachedData.nopat || [],
          nopat_otros: cachedData.nopat_otros || '',
          pat_enfermedades: cachedData.pat_enfermedades || '',
          pat_medicamentos: cachedData.pat_medicamentos || '',
          pat_alergias: cachedData.pat_alergias || '',
          pat_oculares: cachedData.pat_oculares || '',
          pat_cirugias: cachedData.pat_cirugias || '',
        });
        setLoadingData(false);
        return;
      }

      // 2. Si no hay caché, cargar desde API
      console.log('🌐 Cargando historia clínica desde API...');
      const response = await api.get(`/historia-clinica/${id_atencion}/${Id_exp}`);
      
      if (response.data && Object.keys(response.data).length > 0) {
        const data = response.data;
        const parsedData = {
          motivo_consulta: data.motivo_consulta || '',
          sintomatologia: data.sintomatologia ? data.sintomatologia.split(',') : [],
          sintomatologia_otros: data.sintomatologia_otros || '',
          heredo: data.heredo ? data.heredo.split(',') : [],
          heredo_otros: data.heredo_otros || '',
          nopat: data.nopat ? data.nopat.split(',') : [],
          nopat_otros: data.nopat_otros || '',
          pat_enfermedades: data.pat_enfermedades || '',
          pat_medicamentos: data.pat_medicamentos || '',
          pat_alergias: data.pat_alergias || '',
          pat_oculares: data.pat_oculares || '',
          pat_cirugias: data.pat_cirugias || '',
        };

        // Guardar en caché
        await CacheService.set(cacheKey, parsedData, CACHE_TTL);
        setFormData(parsedData);
      }
    } catch (error) {
      console.error('Error loading historia clinica:', error);
      
      // 3. Si falla la API, intentar cargar desde caché aunque esté expirada
      const cacheKey = `${CACHE_KEY_PREFIX}${id_atencion}_${Id_exp}`;
      const cachedData = await CacheService.get(cacheKey);
      if (cachedData) {
        console.log('📦 Historia clínica cargada desde caché (fallback)');
        setFormData({
          motivo_consulta: cachedData.motivo_consulta || '',
          sintomatologia: cachedData.sintomatologia || [],
          sintomatologia_otros: cachedData.sintomatologia_otros || '',
          heredo: cachedData.heredo || [],
          heredo_otros: cachedData.heredo_otros || '',
          nopat: cachedData.nopat || [],
          nopat_otros: cachedData.nopat_otros || '',
          pat_enfermedades: cachedData.pat_enfermedades || '',
          pat_medicamentos: cachedData.pat_medicamentos || '',
          pat_alergias: cachedData.pat_alergias || '',
          pat_oculares: cachedData.pat_oculares || '',
          pat_cirugias: cachedData.pat_cirugias || '',
        });
        Alert.alert(t('common.noConnection'), t('common.showingCachedData'));
      }
    } finally {
      setLoadingData(false);
    }
  };

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
      Alert.alert(t('common.warning'), t('common.requiredReason'));
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
        // Actualizar caché después de guardar
        const cacheKey = `${CACHE_KEY_PREFIX}${id_atencion}_${Id_exp}`;
        await CacheService.set(cacheKey, formData, CACHE_TTL);
        
        Alert.alert(t('common.success'), 'Historia clínica guardada correctamente');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error saving historia clinica:', error);
      Alert.alert(t('common.error'), error.response?.data?.error || t('common.couldNotSaveData'));
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

  if (loadingData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={styles.loadingText}>{t('medico.loadingClinicalHistory')}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          <Ionicons name="document-text-outline" size={20} color="#fff" /> {t('medico.clinicalHistory')}
        </Text>
        <TouchableOpacity
          onPress={loadExistingData}
          style={styles.backButton}
          disabled={loadingData}
        >
          <Ionicons name="refresh-outline" size={22} color="#fff" />
        </TouchableOpacity>
      </LinearGradient>

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
              {t('medico.patient')}: {Id_exp}
            </Text>
          </View>
        </LinearGradient>

        <View style={styles.cardBody}>
          {/* Motivo de consulta */}
          <View style={styles.section}>
            <View style={styles.sectionTitle}>
              <Ionicons name="help-circle-outline" size={20} color="#667eea" />
              <Text style={styles.sectionTitleText}>{t('medico.reasonForConsultation')}</Text>
            </View>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder={t('medico.reasonPlaceholder')}
              placeholderTextColor="#a0aec0"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              value={formData.motivo_consulta}
              onChangeText={(text) => handleChange('motivo_consulta', text)}
            />
          </View>

          {/* Sintomatología Ocular */}
          {renderCheckboxGroup(t('medico.ocularSymptoms'), sintomasOptions, 'sintomatologia', 'eye-outline')}

          {/* Antecedentes Heredofamiliares */}
          {renderCheckboxGroup(t('medico.hereditaryHistory'), heredoOptions, 'heredo', 'people-outline')}

          {/* Antecedentes Personales No Patológicos */}
          {renderCheckboxGroup(t('medico.personalNonPathological'), nopatOptions, 'nopat', 'person-outline')}

          {/* Antecedentes Patológicos */}
          <View style={styles.section}>
            <View style={styles.sectionTitle}>
              <Ionicons name="medkit-outline" size={20} color="#667eea" />
              <Text style={styles.sectionTitleText}>{t('medico.pathologicalHistory')}</Text>
            </View>
            
            <TextInput
              style={styles.input}
              placeholder={t('medico.diseases')}
              placeholderTextColor="#a0aec0"
              value={formData.pat_enfermedades}
              onChangeText={(text) => handleChange('pat_enfermedades', text)}
            />
            
            <TextInput
              style={styles.input}
              placeholder={t('medico.medications')}
              placeholderTextColor="#a0aec0"
              value={formData.pat_medicamentos}
              onChangeText={(text) => handleChange('pat_medicamentos', text)}
            />
            
            <TextInput
              style={styles.input}
              placeholder={t('medico.allergiesLabel')}
              placeholderTextColor="#a0aec0"
              value={formData.pat_alergias}
              onChangeText={(text) => handleChange('pat_alergias', text)}
            />
            
            <TextInput
              style={styles.input}
              placeholder={t('medico.ocularHistory')}
              placeholderTextColor="#a0aec0"
              value={formData.pat_oculares}
              onChangeText={(text) => handleChange('pat_oculares', text)}
            />
            
            <TextInput
              style={styles.input}
              placeholder={t('medico.previousSurgeries')}
              placeholderTextColor="#a0aec0"
              value={formData.pat_cirugias}
              onChangeText={(text) => handleChange('pat_cirugias', text)}
            />
          </View>
        </View>

        <View style={styles.cardFooter}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="close-outline" size={18} color="#718096" />
            <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
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
                <Text style={styles.saveButtonText}>{t('medico.saveClinicalHistory')}</Text>
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
