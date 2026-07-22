// src/screens/enfermeria/EnfermeriaVitalSignsScreen.js
import React, { useState, useEffect } from "react";
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
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useLanguage } from "../../context/LanguageContext";
import api from "../../services/api";
import CacheService from "../../services/cacheService";
import Pagination from "../../components/Pagination";
import moment from "moment";

const CACHE_KEY_PREFIX = "enfermeria_vital_signs_";
const CACHE_TTL = 2 * 60 * 1000; // 2 minutos
const HISTORY_ITEMS_PER_PAGE = 5;

const EnfermeriaVitalSignsScreen = ({ navigation, route }) => {
  const { id_atencion, Id_exp } = route.params || {};
  const { t, lang } = useLanguage();

  // ==================== DEBUG ====================
  useEffect(() => {
    console.log("🔍 EnfermeriaVitalSignsScreen - Params recibidos:", {
      id_atencion,
      Id_exp,
      fullParams: route.params,
    });
  }, [id_atencion, Id_exp]);
  // ===============================================

  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [history, setHistory] = useState([]);
  const [currentHistoryPage, setCurrentHistoryPage] = useState(1);
  const [formData, setFormData] = useState({
    ta: "",
    fc: "",
    fr: "",
    temp: "",
    spo2: "",
    peso: "",
    talla: "",
  });

  // Cargar historial
  useEffect(() => {
    loadVitalSignsHistory();
  }, []);

  const loadVitalSignsHistory = async (forceRefresh = false) => {
    try {
      setLoadingHistory(true);
      const cacheKey = `${CACHE_KEY_PREFIX}${id_atencion}`;

      if (!forceRefresh) {
        const cachedData = await CacheService.get(cacheKey);
        if (cachedData) {
          console.log('📦 Signos vitales (enfermería) cargados desde caché');
          setHistory(cachedData);
          if (forceRefresh) setCurrentHistoryPage(1);
          setLoadingHistory(false);
          return;
        }
      }

      console.log('🌐 Cargando signos vitales (enfermería) desde API...');
      const response = await api.get(`/appointments/${id_atencion}/vital-signs`);
      await CacheService.set(cacheKey, response.data, CACHE_TTL);
      setHistory(response.data || []);
      if (forceRefresh) setCurrentHistoryPage(1);
    } catch (error) {
      console.error("Error loading vital signs history:", error);
      const cachedData = await CacheService.get(`${CACHE_KEY_PREFIX}${id_atencion}`);
      if (cachedData) {
        console.log('📦 Signos vitales (enfermería) cargados desde caché (fallback)');
        setHistory(cachedData);
      }
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const parseNumericValue = (value) => {
    if (!value || value === "") return null;
    const parsed = parseFloat(value);
    return isNaN(parsed) ? null : parsed;
  };

  const handleSubmit = async () => {
    const hasData = Object.values(formData).some((value) => value !== "");
    if (!hasData) {
      Alert.alert(t('common.warning'), t('common.enterAtLeastOneVital'));
      return;
    }

    const dataToSend = {
      ta: formData.ta || "",
      fc: parseNumericValue(formData.fc),
      fr: parseNumericValue(formData.fr),
      temp: parseNumericValue(formData.temp),
      spo2: parseNumericValue(formData.spo2),
      peso: parseNumericValue(formData.peso),
      talla: parseNumericValue(formData.talla),
    };

    Object.keys(dataToSend).forEach((key) => {
      if (dataToSend[key] === null) delete dataToSend[key];
    });

    console.log('📤 Enviando signos vitales (enfermería):', dataToSend);

    setLoading(true);
    try {
      const response = await api.post(`/appointments/${id_atencion}/vital-signs`, dataToSend);
      if (response.data) {
        Alert.alert(t('common.success'), t('enfermeria.saveVitals'));
        setFormData({ ta: "", fc: "", fr: "", temp: "", spo2: "", peso: "", talla: "" });
        await loadVitalSignsHistory(true);
      }
    } catch (error) {
      console.error("Error saving vital signs:", error);
      Alert.alert(t('common.error'), error.response?.data?.error || t('common.couldNotSaveData'));
    } finally {
      setLoading(false);
    }
  };

  const renderHistoryItem = ({ item }) => (
    <View style={styles.historyItem}>
      <View style={styles.historyHeader}>
        <Ionicons name="calendar-outline" size={14} color="#718096" />
        <Text style={styles.historyDate}>
          {moment(item.fecha_registro).format("DD/MM/YYYY HH:mm")}
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
            <Text style={styles.historyLabel}>{t('enfermeria.weight')}</Text>
            <Text style={styles.historyValue}>{item.peso}kg</Text>
          </View>
        )}
        {item.talla !== undefined && item.talla !== null && (
          <View style={styles.historyField}>
            <Text style={styles.historyLabel}>{t('enfermeria.height')}</Text>
            <Text style={styles.historyValue}>{item.talla}m</Text>
          </View>
        )}
      </View>
    </View>
  );

  const totalHistoryPages = Math.ceil(history.length / HISTORY_ITEMS_PER_PAGE);
  const paginatedHistory = history.slice(
    (currentHistoryPage - 1) * HISTORY_ITEMS_PER_PAGE,
    currentHistoryPage * HISTORY_ITEMS_PER_PAGE,
  );

  useEffect(() => {
    const validTotalPages = Math.max(1, totalHistoryPages);
    if (currentHistoryPage > validTotalPages) {
      setCurrentHistoryPage(validTotalPages);
    }
  }, [currentHistoryPage, totalHistoryPages]);

  if (loadingHistory && history.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={styles.loadingText}>{t('enfermeria.loadingVitalsList')}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <LinearGradient colors={["#667eea", "#764ba2"]} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          <Ionicons name="heart-outline" size={20} color="#fff" /> {t('enfermeria.vitalSigns')}
        </Text>
        <TouchableOpacity
          onPress={() => loadVitalSignsHistory(true)}
          style={styles.backButton}
          disabled={loading || loadingHistory}
        >
          <Ionicons name="refresh-outline" size={22} color="#fff" />
        </TouchableOpacity>
      </LinearGradient>

      {/* Información del paciente - SOLO EXP */}
      <View style={styles.patientInfoCard}>
        <View style={styles.patientInfoContent}>
          <View style={styles.patientAvatar}>
            <Ionicons name="person-circle" size={50} color="#fff" />
          </View>
          <View style={styles.patientDetails}>
            <Text style={styles.patientName}>{t('enfermeria.patient')}</Text>
            <View style={styles.patientMeta}>
              <Text style={styles.patientMetaItem}>
                <Ionicons name="card-outline" size={12} /> Exp: {Id_exp || "N/A"}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Formulario principal */}
      <View style={styles.mainCard}>
        <LinearGradient
          colors={["#f56565", "#ed8936"]}
          style={styles.cardHeader}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <View style={styles.cardHeaderContent}>
            <Ionicons name="heart-outline" size={22} color="#fff" />
            <Text style={styles.cardHeaderTitle}>
              {t('enfermeria.newVitalRecord')}
            </Text>
          </View>
        </LinearGradient>

        <View style={styles.cardBody}>
          <View style={styles.formGrid}>
            {/* Presión arterial - STRING */}
            <View style={styles.formGroup}>
              <View style={styles.formLabel}>
                <Ionicons name="heart-outline" size={16} color="#f56565" />
                <Text style={styles.formLabelText}>{t('enfermeria.bloodPressure')}</Text>
              </View>
              <TextInput
                style={styles.formInput}
                placeholder="120/80"
                placeholderTextColor="#a0aec0"
                value={formData.ta}
                onChangeText={(text) => handleChange("ta", text)}
              />
            </View>

            {/* Frecuencia cardíaca - NUMBER */}
            <View style={styles.formGroup}>
              <View style={styles.formLabel}>
                <Ionicons name="heart-outline" size={16} color="#f56565" />
                <Text style={styles.formLabelText}>
                  {t('enfermeria.heartRate')}
                </Text>
              </View>
              <TextInput
                style={styles.formInput}
                placeholder="lpm"
                placeholderTextColor="#a0aec0"
                keyboardType="numeric"
                value={formData.fc}
                onChangeText={(text) => handleChange("fc", text)}
              />
            </View>

            {/* Frecuencia respiratoria - NUMBER */}
            <View style={styles.formGroup}>
              <View style={styles.formLabel}>
                <Ionicons name="pulse-outline" size={16} color="#f56565" />
                <Text style={styles.formLabelText}>
                  {t('enfermeria.respiratoryRate')}
                </Text>
              </View>
              <TextInput
                style={styles.formInput}
                placeholder="rpm"
                placeholderTextColor="#a0aec0"
                keyboardType="numeric"
                value={formData.fr}
                onChangeText={(text) => handleChange("fr", text)}
              />
            </View>

            {/* Temperatura - NUMBER (Double) */}
            <View style={styles.formGroup}>
              <View style={styles.formLabel}>
                <Ionicons
                  name="thermometer-outline"
                  size={16}
                  color="#f56565"
                />
                <Text style={styles.formLabelText}>{t('enfermeria.temperature')} (°C)</Text>
              </View>
              <TextInput
                style={styles.formInput}
                placeholder="36.5"
                placeholderTextColor="#a0aec0"
                keyboardType="numeric"
                value={formData.temp}
                onChangeText={(text) => handleChange("temp", text)}
              />
            </View>

            {/* SpO₂ - NUMBER */}
            <View style={styles.formGroup}>
              <View style={styles.formLabel}>
                <Ionicons name="water-outline" size={16} color="#f56565" />
                <Text style={styles.formLabelText}>{t('enfermeria.oxygenSaturation')} (%)</Text>
              </View>
              <TextInput
                style={styles.formInput}
                placeholder="98"
                placeholderTextColor="#a0aec0"
                keyboardType="numeric"
                value={formData.spo2}
                onChangeText={(text) => handleChange("spo2", text)}
              />
            </View>

            {/* Peso - NUMBER (Double) */}
            <View style={styles.formGroup}>
              <View style={styles.formLabel}>
                <Ionicons name="scale-outline" size={16} color="#f56565" />
                <Text style={styles.formLabelText}>{t('enfermeria.weight')} (kg)</Text>
              </View>
              <TextInput
                style={styles.formInput}
                placeholder="70"
                placeholderTextColor="#a0aec0"
                keyboardType="numeric"
                value={formData.peso}
                onChangeText={(text) => handleChange("peso", text)}
              />
            </View>

            {/* Talla - NUMBER (Double) */}
            <View style={styles.formGroup}>
              <View style={styles.formLabel}>
                <Ionicons name="resize-outline" size={16} color="#f56565" />
                <Text style={styles.formLabelText}>{t('enfermeria.height')} (m)</Text>
              </View>
              <TextInput
                style={styles.formInput}
                placeholder="1.70"
                placeholderTextColor="#a0aec0"
                keyboardType="numeric"
                value={formData.talla}
                onChangeText={(text) => handleChange("talla", text)}
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
                <Text style={styles.saveButtonText}>
                  {t('enfermeria.saveVitals')}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Historial de Signos Vitales */}
      <View style={styles.historyCard}>
        <LinearGradient
          colors={["#f56565", "#f56565"]}
          style={styles.historyHeaderGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <View style={styles.historyHeaderContent}>
            <Ionicons name="time-outline" size={20} color="#fff" />
            <Text style={styles.historyTitle}>{t('enfermeria.vitalsHistory')}</Text>
            {history.length > 0 && (
              <View style={styles.historyCount}>
                <Text style={styles.historyCountText}>
                  {history.length} {t('common.records')}
                </Text>
              </View>
            )}
          </View>
        </LinearGradient>

        {loadingHistory ? (
          <ActivityIndicator
            style={styles.historyLoader}
            size="large"
            color="#4299e1"
          />
        ) : history.length === 0 ? (
          <View style={styles.emptyHistory}>
            <Ionicons name="document-text-outline" size={48} color="#cbd5e0" />
            <Text style={styles.emptyHistoryText}>
              {t('enfermeria.noVitalsYet')}
            </Text>
          </View>
        ) : (
          <>
            <FlatList
              data={paginatedHistory}
              renderItem={renderHistoryItem}
              keyExtractor={(item, index) =>
                item.id_signos?.toString() || index.toString()
              }
              scrollEnabled={false}
              initialNumToRender={HISTORY_ITEMS_PER_PAGE}
              maxToRenderPerBatch={HISTORY_ITEMS_PER_PAGE}
            />
            <View style={styles.historyPagination}>
              <Pagination
                currentPage={currentHistoryPage}
                totalPages={totalHistoryPages}
                onPageChange={setCurrentHistoryPage}
                itemsPerPage={HISTORY_ITEMS_PER_PAGE}
                totalItems={history.length}
              />
            </View>
          </>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f7fafc",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f7fafc",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#718096",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
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
    borderLeftWidth: 5,
    borderLeftColor: "#f56565",
  },
  patientInfoContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  patientAvatar: {
    width: 60,
    height: 60,
    borderRadius: 15,
    backgroundColor: "#f56565",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  patientDetails: {
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2d3748",
    marginBottom: 4,
  },
  patientMeta: {
    flexDirection: "row",
    gap: 12,
  },
  patientMetaItem: {
    fontSize: 12,
    color: "#718096",
  },
  mainCard: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 25,
    overflow: "hidden",
    shadowColor: "#000",
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
    flexDirection: "row",
    alignItems: "center",
  },
  cardHeaderTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginLeft: 8,
  },
  cardBody: {
    padding: 20,
  },
  formGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  formGroup: {
    width: "48%",
    marginBottom: 16,
  },
  formLabel: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  formLabelText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#2d3748",
    marginLeft: 6,
  },
  formInput: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: "#2d3748",
    backgroundColor: "#fff",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    backgroundColor: "#f7fafc",
  },
  cancelButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#fff",
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#718096",
    marginLeft: 8,
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: "#48bb78",
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
    marginLeft: 8,
  },
  disabledButton: {
    opacity: 0.7,
  },
  historyCard: {
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
  historyHeaderGradient: {
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  historyHeaderContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  historyTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginLeft: 8,
  },
  historyCount: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  historyCountText: {
    fontSize: 11,
    color: "#fff",
    fontWeight: "500",
  },
  historyLoader: {
    padding: 40,
  },
  emptyHistory: {
    alignItems: "center",
    padding: 40,
  },
  emptyHistoryText: {
    fontSize: 14,
    color: "#a0aec0",
    marginTop: 12,
  },
  historyItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  historyHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  historyDate: {
    fontSize: 12,
    color: "#718096",
    marginLeft: 6,
  },
  historyGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  historyField: {
    width: "33%",
    marginBottom: 8,
  },
  historyLabel: {
    fontSize: 10,
    color: "#a0aec0",
  },
  historyValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2d3748",
  },
  historyPagination: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
});

export default EnfermeriaVitalSignsScreen;
