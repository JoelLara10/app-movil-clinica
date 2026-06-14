// src/screens/medico/ImagingExamsScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';

const ImagingExamsScreen = ({ navigation, route }) => {
  const { id_atencion, Id_exp } = route.params;
  const [loading, setLoading] = useState(false);
  const [exams, setExams] = useState([]);
  const [selectedExams, setSelectedExams] = useState([]);
  const [observations, setObservations] = useState('');

  useEffect(() => {
    loadExams();
  }, []);

  const loadExams = async () => {
    try {
      const response = await api.get('/exams/catalog?type=GABINETE');
      setExams(response.data);
    } catch (error) {
      console.error('Error loading exams:', error);
      Alert.alert('Error', 'No se pudieron cargar los exámenes de gabinete');
    }
  };

  const toggleExam = (examId) => {
    if (selectedExams.includes(examId)) {
      setSelectedExams(selectedExams.filter(id => id !== examId));
    } else {
      setSelectedExams([...selectedExams, examId]);
    }
  };

  const handleSubmit = async () => {
    if (selectedExams.length === 0) {
      Alert.alert('Advertencia', 'Seleccione al menos un examen');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/exams/request', {
        id_atencion,
        exams: selectedExams,
        observations: observations,
        type: 'GABINETE'
      });
      if (response.data) {
        Alert.alert('Éxito', 'Exámenes de gabinete solicitados correctamente');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error saving exams:', error);
      Alert.alert('Error', 'No se pudieron guardar los exámenes');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#ed8936', '#dd6b20']} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          <Ionicons name="scan-outline" size={20} color="#fff" /> Exámenes de Gabinete
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
          colors={['#ed8936', '#dd6b20']} 
          style={styles.cardHeader}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <View style={styles.cardHeaderContent}>
            <Ionicons name="scan-outline" size={22} color="#fff" />
            <Text style={styles.cardHeaderTitle}>Selección de Exámenes de Gabinete</Text>
          </View>
        </LinearGradient>

        <View style={styles.cardBody}>
          {/* Lista de exámenes */}
          <View style={styles.examsSection}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionBadge}>
                <Ionicons name="scan-outline" size={16} color="#fff" />
              </View>
              <Text style={styles.sectionTitle}>Exámenes Disponibles</Text>
              <View style={styles.sectionCount}>
                <Text style={styles.sectionCountText}>{exams.length} exámenes</Text>
              </View>
            </View>

            <View style={styles.examsGrid}>
              {exams.map((exam) => (
                <TouchableOpacity
                  key={exam.id_catalogo}
                  style={[
                    styles.examItem,
                    selectedExams.includes(exam.id_catalogo) && styles.examItemSelected
                  ]}
                  onPress={() => toggleExam(exam.id_catalogo)}
                >
                  <View style={styles.examIcon}>
                    <Ionicons 
                      name="scan-outline" 
                      size={20} 
                      color={selectedExams.includes(exam.id_catalogo) ? "#ed8936" : "#a0aec0"} 
                    />
                  </View>
                  <Text style={[
                    styles.examName,
                    selectedExams.includes(exam.id_catalogo) && styles.examNameSelected
                  ]}>
                    {exam.nombre}
                  </Text>
                  <View style={[
                    styles.examCheck,
                    selectedExams.includes(exam.id_catalogo) && styles.examCheckSelected
                  ]}>
                    {selectedExams.includes(exam.id_catalogo) && (
                      <Ionicons name="checkmark" size={12} color="#fff" />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Observaciones */}
          <View style={styles.observacionesSection}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionBadge, { backgroundColor: '#ed8936' }]}>
                <Ionicons name="create-outline" size={16} color="#fff" />
              </View>
              <Text style={styles.sectionTitle}>Observaciones</Text>
            </View>
            <TextInput
              style={styles.observacionesTextArea}
              placeholder="Escriba aquí cualquier observación adicional para los exámenes solicitados..."
              placeholderTextColor="#a0aec0"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              value={observations}
              onChangeText={setObservations}
            />
            <Text style={styles.helperText}>
              <Ionicons name="information-circle-outline" size={12} /> Puede agregar notas específicas para el área de gabinete
            </Text>
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
                <Text style={styles.saveButtonText}>Guardar Exámenes</Text>
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
    borderLeftColor: '#ed8936',
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
    backgroundColor: '#ed8936',
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
  examsSection: {
    backgroundColor: '#f7fafc',
    borderRadius: 15,
    padding: 16,
    marginBottom: 20,
  },
  observacionesSection: {
    backgroundColor: '#f7fafc',
    borderRadius: 15,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  sectionBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#ed8936',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sectionTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#2d3748',
  },
  sectionCount: {
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sectionCountText: {
    fontSize: 11,
    color: '#718096',
  },
  examsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  examItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
    margin: '1%',
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  examItemSelected: {
    borderColor: '#ed8936',
    backgroundColor: '#fffaf0',
  },
  examIcon: {
    marginRight: 10,
  },
  examName: {
    flex: 1,
    fontSize: 13,
    color: '#2d3748',
  },
  examNameSelected: {
    color: '#ed8936',
    fontWeight: '500',
  },
  examCheck: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  examCheckSelected: {
    backgroundColor: '#ed8936',
    borderColor: '#ed8936',
  },
  observacionesTextArea: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: '#2d3748',
    backgroundColor: '#fff',
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 8,
  },
  helperText: {
    fontSize: 11,
    color: '#a0aec0',
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

export default ImagingExamsScreen;