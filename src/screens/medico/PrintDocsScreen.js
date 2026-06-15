// src/screens/medico/PrintDocsScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { usePatient } from '../../context/PatientContext';

const PrintDocsScreen = ({ navigation, route }) => {
  const { id_atencion, Id_exp } = route.params;
  const { selectedPatient } = usePatient();
  const [loading, setLoading] = useState(false);
  const [patientInfo, setPatientInfo] = useState(null);

  // Usar Id_exp de params o del contexto
  const pacienteId = Id_exp || selectedPatient?.Id_exp;

  useEffect(() => {
    loadPatientInfo();
  }, []);

  const loadPatientInfo = async () => {
    try {
      setLoading(true);
      // Obtener información del paciente
      const response = await api.get(`/paciente/${id_atencion}/${pacienteId}`);
      if (response.data) {
        setPatientInfo(response.data.paciente);
      }
    } catch (error) {
      console.error('Error loading patient info:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = async (documentType) => {
    // Construir URL del PDF
    const baseUrl = api.defaults.baseURL;
    let url = '';
    
    switch (documentType) {
      case 'vital-signs':
        // Primero obtener el último registro de signos vitales
        try {
          const response = await api.get(`/appointments/${id_atencion}/vital-signs`);
          if (response.data && response.data.length > 0) {
            const lastSign = response.data[0];
            url = `${baseUrl.replace('/api/v1', '')}/pdf/vital-signs/${lastSign.id_signos}`;
          } else {
            Alert.alert('Información', 'No hay registros de signos vitales para imprimir');
            return;
          }
        } catch (error) {
          Alert.alert('Error', 'No se pudieron obtener los signos vitales');
          return;
        }
        break;
      case 'medical-note':
        try {
          const response = await api.get(`/appointments/${id_atencion}/medical-notes`);
          if (response.data && response.data.length > 0) {
            const lastNote = response.data[0];
            url = `${baseUrl.replace('/api/v1', '')}/pdf/medical-note/${lastNote.id_nota}`;
          } else {
            Alert.alert('Información', 'No hay notas médicas para imprimir');
            return;
          }
        } catch (error) {
          Alert.alert('Error', 'No se pudieron obtener las notas médicas');
          return;
        }
        break;
      case 'diagnosis':
        try {
          const response = await api.get(`/appointments/${id_atencion}/diagnosis`);
          if (response.data && response.data.id_diagnostico) {
            url = `${baseUrl.replace('/api/v1', '')}/pdf/diagnosis/${response.data.id_diagnostico}`;
          } else {
            Alert.alert('Información', 'No hay diagnóstico registrado para imprimir');
            return;
          }
        } catch (error) {
          Alert.alert('Error', 'No se pudo obtener el diagnóstico');
          return;
        }
        break;
      case 'prescription':
        try {
          const response = await api.get(`/appointments/${id_atencion}/prescriptions`);
          if (response.data && response.data.length > 0) {
            const lastPrescription = response.data[0];
            url = `${baseUrl.replace('/api/v1', '')}/pdf/prescription/${lastPrescription.id_receta}`;
          } else {
            Alert.alert('Información', 'No hay recetas para imprimir');
            return;
          }
        } catch (error) {
          Alert.alert('Error', 'No se pudieron obtener las recetas');
          return;
        }
        break;
      case 'lab-exams':
        try {
          const response = await api.get(`/exams/requested/${id_atencion}?type=LABORATORIO`);
          if (response.data && response.data.length > 0) {
            const lastExam = response.data[0];
            url = `${baseUrl.replace('/api/v1', '')}/pdf/lab/${lastExam.id_examen}`;
          } else {
            Alert.alert('Información', 'No hay exámenes de laboratorio para imprimir');
            return;
          }
        } catch (error) {
          Alert.alert('Error', 'No se pudieron obtener los exámenes de laboratorio');
          return;
        }
        break;
      case 'imaging-exams':
        try {
          const response = await api.get(`/exams/requested/${id_atencion}?type=GABINETE`);
          if (response.data && response.data.length > 0) {
            const lastExam = response.data[0];
            url = `${baseUrl.replace('/api/v1', '')}/pdf/imaging/${lastExam.id_examen}`;
          } else {
            Alert.alert('Información', 'No hay exámenes de gabinete para imprimir');
            return;
          }
        } catch (error) {
          Alert.alert('Error', 'No se pudieron obtener los exámenes de gabinete');
          return;
        }
        break;
      default:
        return;
    }
    
    // Abrir URL en el navegador para imprimir
    Linking.openURL(url).catch(err => {
      console.error('Error opening URL:', err);
      Alert.alert('Error', 'No se pudo abrir el documento');
    });
  };

  const printItems = [
    {
      id: 'vital-signs',
      title: 'Signos Vitales',
      icon: 'heart-outline',
      description: 'Presión arterial, frecuencia cardíaca, temperatura',
      color: '#f56565',
      bgColor: '#fff5f5',
      gradient: ['#f56565', '#ed8936']
    },
    {
      id: 'medical-note',
      title: 'Nota Médica (SOAP)',
      icon: 'document-text-outline',
      description: 'Subjetivo, Objetivo, Evaluación, Plan',
      color: '#4299e1',
      bgColor: '#ebf8ff',
      gradient: ['#4299e1', '#3182ce']
    },
    {
      id: 'diagnosis',
      title: 'Diagnóstico',
      icon: 'medkit-outline',
      description: 'CIE-10 y descripción del diagnóstico',
      color: '#9f7aea',
      bgColor: '#faf5ff',
      gradient: ['#9f7aea', '#805ad5']
    },
    {
      id: 'prescription',
      title: 'Receta Médica',
      icon: 'medkit-outline',
      description: 'Medicamentos, dosis y frecuencia',
      color: '#48bb78',
      bgColor: '#f0fff4',
      gradient: ['#48bb78', '#38a169']
    },
    {
      id: 'lab-exams',
      title: 'Exámenes de Laboratorio',
      icon: 'flask-outline',
      description: 'Análisis clínicos y resultados',
      color: '#ed8936',
      bgColor: '#fffaf0',
      gradient: ['#ed8936', '#dd6b20']
    },
    {
      id: 'imaging-exams',
      title: 'Exámenes de Gabinete',
      icon: 'scan-outline',
      description: 'Rayos X, ultrasonidos, tomografías',
      color: '#667eea',
      bgColor: '#ebf8ff',
      gradient: ['#667eea', '#764ba2']
    },
  ];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={styles.loadingText}>Cargando información...</Text>
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
          <Ionicons name="print-outline" size={20} color="#fff" /> Imprimir Documentos
        </Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      {/* Información del paciente */}
      <View style={styles.patientInfoCard}>
        <View style={styles.patientInfoContent}>
          <View style={styles.patientAvatar}>
            <Ionicons name="person" size={30} color="#fff" />
          </View>
          <View style={styles.patientDetails}>
            <Text style={styles.patientName}>
              {patientInfo?.papell || ''} {patientInfo?.nom_pac || 'Paciente'}
            </Text>
            <Text style={styles.patientMeta}>
              <Ionicons name="card-outline" size={12} /> Expediente: {pacienteId || 'N/A'} | 
              <Ionicons name="calendar-outline" size={12} /> Atención: {id_atencion}
            </Text>
          </View>
          <View style={styles.badge}>
            <Ionicons name="document-text-outline" size={14} color="#667eea" />
            <Text style={styles.badgeText}>Documentos médicos</Text>
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
            <Ionicons name="document-text-outline" size={22} color="#fff" />
            <Text style={styles.cardHeaderTitle}>Selecciona el documento a imprimir</Text>
          </View>
        </LinearGradient>

        <View style={styles.cardBody}>
          <View style={styles.printGrid}>
            {printItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.printCard, { backgroundColor: item.bgColor }]}
                onPress={() => handlePrint(item.id)}
              >
                <LinearGradient
                  colors={item.gradient}
                  style={styles.printIcon}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Ionicons name={item.icon} size={24} color="#fff" />
                </LinearGradient>
                <View style={styles.printContent}>
                  <Text style={styles.printTitle}>{item.title}</Text>
                  <Text style={styles.printDescription}>{item.description}</Text>
                </View>
                <View style={styles.printAction}>
                  <Ionicons name="print-outline" size={20} color={item.color} />
                  <Text style={[styles.printActionText, { color: item.color }]}>Imprimir</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Nota informativa */}
          <View style={styles.infoNote}>
            <Ionicons name="information-circle-outline" size={18} color="#1e40af" />
            <Text style={styles.infoNoteText}>
              Los documentos se abrirán en el navegador en formato PDF listo para imprimir.
            </Text>
          </View>
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
  },
  patientInfoContent: {
    padding: 16,
  },
  patientAvatar: {
    width: 45,
    height: 45,
    borderRadius: 12,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  patientDetails: {
    marginBottom: 12,
  },
  patientName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 4,
  },
  patientMeta: {
    fontSize: 12,
    color: '#718096',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#667eea20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 12,
    color: '#667eea',
    marginLeft: 6,
    fontWeight: '500',
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
  printGrid: {
    gap: 12,
  },
  printCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  printIcon: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  printContent: {
    flex: 1,
  },
  printTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 4,
  },
  printDescription: {
    fontSize: 11,
    color: '#718096',
  },
  printAction: {
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#fff',
    minWidth: 70,
  },
  printActionText: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  infoNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dbeafe',
    padding: 12,
    borderRadius: 12,
    marginTop: 20,
  },
  infoNoteText: {
    fontSize: 12,
    color: '#1e40af',
    marginLeft: 8,
    flex: 1,
  },
});

export default PrintDocsScreen;