// src/screens/medico/PrintDocsScreen.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import api from "../../services/api";
import CacheService from "../../services/cacheService";
import { usePatient } from "../../context/PatientContext";
import { useLanguage } from "../../context/LanguageContext";

const DOCS_CACHE_TTL = 2 * 60 * 1000;

const PrintDocsScreen = ({ navigation, route }) => {
  const { id_atencion, Id_exp } = route.params;
  const { selectedPatient } = usePatient();
  const { t, lang } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [patientInfo, setPatientInfo] = useState(null);

  const pacienteId = Id_exp || selectedPatient?.Id_exp;

  useEffect(() => {
    loadPatientInfo();
  }, []);

  const getWithCache = async (cacheKey, endpoint, forceRefresh = false) => {
    if (!forceRefresh) {
      const cached = await CacheService.get(cacheKey);
      if (cached) return cached;
    }

    const response = await api.get(endpoint);
    const data = response?.data;
    await CacheService.set(cacheKey, data, DOCS_CACHE_TTL);
    return data;
  };

  const loadPatientInfo = async () => {
    try {
      setLoading(true);
      const cacheKey = `patient_info_${id_atencion}_${pacienteId}`;
      const data = await getWithCache(
        cacheKey,
        `/paciente/${id_atencion}/${pacienteId}`
      );
      if (data) {
        setPatientInfo(data.paciente);
      }
    } catch (error) {
      console.error("Error loading patient info:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = async (documentType) => {
    try {
      const token = await AsyncStorage.getItem("@ineo_token");
      if (!token) {
        Alert.alert(t('common.sessionExpired'), t('common.sessionExpired'));
        return;
      }

      const baseUrl = api.defaults.baseURL;
      const queryParams = new URLSearchParams({
        token,
        id_atencion: String(id_atencion),
        _ts: String(Date.now()),
      }).toString();
      let url = "";

      switch (documentType) {
        case "vital-signs": {
          const data = await getWithCache(
            `print_vitals_${id_atencion}`,
            `/appointments/${id_atencion}/vital-signs`
          );
          if (data?.length > 0) {
            url = `${baseUrl}/pdf/vital-signs/${data[0].id_signos}?${queryParams}`;
          } else {
            Alert.alert(t('common.attention'), t('medico.vitalSigns'));
            return;
          }
          break;
        }
        case "medical-note": {
          const data = await getWithCache(
            `print_notes_${id_atencion}`,
            `/appointments/${id_atencion}/medical-notes`
          );
          if (data?.length > 0) {
            url = `${baseUrl}/pdf/medical-note/${data[0].id_nota}?${queryParams}`;
          } else {
            Alert.alert(t('common.attention'), t('medico.noPreviousNotes') || t('common.noPreviousNotes'));
            return;
          }
          break;
        }
        case "diagnosis": {
          const data = await getWithCache(
            `print_diagnosis_${id_atencion}`,
            `/appointments/${id_atencion}/diagnosis`
          );
          if (data?.id_diagnostico) {
            url = `${baseUrl}/pdf/diagnosis/${data.id_diagnostico}?${queryParams}`;
          } else {
            Alert.alert(t('common.attention'), t('common.noResultsYet'));
            return;
          }
          break;
        }
        case "prescription": {
          const data = await getWithCache(
            `print_prescriptions_${id_atencion}`,
            `/appointments/${id_atencion}/prescriptions`
          );
          if (data?.length > 0) {
            url = `${baseUrl}/pdf/prescription/${data[0].id_receta}?${queryParams}`;
          } else {
            Alert.alert(t('common.attention'), t('common.noPreviousPrescriptions'));
            return;
          }
          break;
        }
        case "lab-exams": {
          const data = await getWithCache(
            `print_lab_${id_atencion}`,
            `/exams/requested/${id_atencion}?type=LABORATORIO`,
            true
          );
          if (data?.length > 0) {
            url = `${baseUrl}/pdf/lab/${data[0].id_examen}?${queryParams}`;
          } else {
            Alert.alert(t('common.attention'), t('common.noExamsAvailable'));
            return;
          }
          break;
        }
        case "imaging-exams": {
          const data = await getWithCache(
            `print_imaging_${id_atencion}`,
            `/exams/requested/${id_atencion}?type=GABINETE`
          );
          if (data?.length > 0) {
            url = `${baseUrl}/pdf/imaging/${data[0].id_examen}?${queryParams}`;
          } else {
            Alert.alert(t('common.attention'), t('common.noImagingExamsError'));
            return;
          }
          break;
        }
        default:
          return;
      }

      console.log("📄 URL del PDF:", url);
      await Linking.openURL(url);
    } catch (error) {
      console.error(error);
      Alert.alert(t('common.error'), t('common.couldNotGenerate'));
    }
  };

  const printItems = [
    {
      id: "vital-signs",
      title: t('medico.printItems.vitalSigns'),
      icon: "heart-outline",
      description: t('medico.printItems.vitalSignsDesc'),
      color: "#f56565",
      bgColor: "#fff5f5",
      gradient: ["#f56565", "#ed8936"],
    },
    {
      id: "medical-note",
      title: t('medico.printItems.medicalNote'),
      icon: "document-text-outline",
      description: t('medico.printItems.medicalNoteDesc'),
      color: "#4299e1",
      bgColor: "#ebf8ff",
      gradient: ["#4299e1", "#3182ce"],
    },
    {
      id: "diagnosis",
      title: t('medico.printItems.diagnosis'),
      icon: "medkit-outline",
      description: t('medico.printItems.diagnosisDesc'),
      color: "#9f7aea",
      bgColor: "#faf5ff",
      gradient: ["#9f7aea", "#805ad5"],
    },
    {
      id: "prescription",
      title: t('medico.printItems.prescription'),
      icon: "medkit-outline",
      description: t('medico.printItems.prescriptionDesc'),
      color: "#48bb78",
      bgColor: "#f0fff4",
      gradient: ["#48bb78", "#38a169"],
    },
    {
      id: "lab-exams",
      title: t('medico.printItems.labExams'),
      icon: "flask-outline",
      description: t('medico.printItems.labExamsDesc'),
      color: "#ed8936",
      bgColor: "#fffaf0",
      gradient: ["#ed8936", "#dd6b20"],
    },
    {
      id: "imaging-exams",
      title: t('medico.printItems.imagingExams'),
      icon: "scan-outline",
      description: t('medico.printItems.imagingExamsDesc'),
      color: "#667eea",
      bgColor: "#ebf8ff",
      gradient: ["#667eea", "#764ba2"],
    },
  ];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={styles.loadingText}>{t('medico.loadingInfoDots')}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <LinearGradient colors={["#667eea", "#764ba2"]} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          <Ionicons name="print-outline" size={20} color="#fff" /> {t('medico.printDocs')}
        </Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <View style={styles.patientInfoCard}>
        <View style={styles.patientInfoContent}>
          <View style={styles.patientAvatar}>
            <Ionicons name="person" size={30} color="#fff" />
          </View>
          <View style={styles.patientDetails}>
            <Text style={styles.patientName}>
              {patientInfo?.papell || ""} {patientInfo?.nom_pac || t('medico.patient')}
            </Text>
            <Text style={styles.patientMeta}>
              <Ionicons name="card-outline" size={12} /> Expediente: {pacienteId || "N/A"} |
              <Ionicons name="calendar-outline" size={12} /> {t('common.date')}: {id_atencion}
            </Text>
          </View>
          <View style={styles.badge}>
            <Ionicons name="document-text-outline" size={14} color="#667eea" />
            <Text style={styles.badgeText}>{t('common.medicalDocuments')}</Text>
          </View>
        </View>
      </View>

      <View style={styles.mainCard}>
        <LinearGradient
          colors={["#667eea", "#764ba2"]}
          style={styles.cardHeader}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <View style={styles.cardHeaderContent}>
            <Ionicons name="document-text-outline" size={22} color="#fff" />
            <Text style={styles.cardHeaderTitle}>{t('medico.selectDocumentToPrint')}</Text>
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
                  <Text style={[styles.printActionText, { color: item.color }]}>{t('medico.printDocs')}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.infoNote}>
            <Ionicons name="information-circle-outline" size={18} color="#1e40af" />
            <Text style={styles.infoNoteText}>
              {t('common.pdfReady')}
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f7fafc" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f7fafc" },
  loadingText: { marginTop: 12, fontSize: 14, color: "#718096" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#fff" },
  patientInfoCard: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  patientInfoContent: { padding: 16 },
  patientAvatar: {
    width: 45,
    height: 45,
    borderRadius: 12,
    backgroundColor: "#667eea",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  patientDetails: { marginBottom: 12 },
  patientName: { fontSize: 16, fontWeight: "bold", color: "#2d3748", marginBottom: 4 },
  patientMeta: { fontSize: 12, color: "#718096" },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#667eea20",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  badgeText: { fontSize: 12, color: "#667eea", marginLeft: 6, fontWeight: "500" },
  mainCard: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 30,
    borderRadius: 25,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  cardHeader: { paddingVertical: 16, paddingHorizontal: 20 },
  cardHeaderContent: { flexDirection: "row", alignItems: "center" },
  cardHeaderTitle: { fontSize: 16, fontWeight: "600", color: "#fff", marginLeft: 8 },
  cardBody: { padding: 20 },
  printGrid: { gap: 12 },
  printCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#f8fafc",
  },
  printIcon: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  printContent: { flex: 1 },
  printTitle: { fontSize: 15, fontWeight: "600", color: "#2d3748", marginBottom: 4 },
  printDescription: { fontSize: 11, color: "#718096" },
  printAction: {
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: "#fff",
    minWidth: 70,
  },
  printActionText: { fontSize: 11, fontWeight: "500", marginTop: 2 },
  infoNote: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#dbeafe",
    padding: 12,
    borderRadius: 12,
    marginTop: 20,
  },
  infoNoteText: { fontSize: 12, color: "#1e40af", marginLeft: 8, flex: 1 },
});

export default PrintDocsScreen;