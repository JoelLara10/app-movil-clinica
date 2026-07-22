// src/screens/medico/ImagingExamsScreen.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  FlatList,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import api from "../../services/api";
import CacheService from "../../services/cacheService";
import Pagination from "../../components/Pagination";
import { useLanguage } from "../../context/LanguageContext";
import moment from "moment";
import "moment/locale/es";

const CACHE_KEY_CATALOG = "imaging_exams_catalog";
const CACHE_KEY_HISTORY = "imaging_exams_history_";
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos para catálogo
const CACHE_TTL_HISTORY = 2 * 60 * 1000; // 2 minutos para historial
const HISTORY_ITEMS_PER_PAGE = 5;

const ImagingExamsScreen = ({ navigation, route }) => {
  const { id_atencion, Id_exp } = route.params;
  const { t, lang } = useLanguage();
  moment.locale(lang === 'es' ? 'es' : 'en-gb');
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [exams, setExams] = useState([]);
  const [selectedExams, setSelectedExams] = useState([]);
  const [observations, setObservations] = useState("");
  const [requestedExams, setRequestedExams] = useState([]);
  const [currentHistoryPage, setCurrentHistoryPage] = useState(1);

  useEffect(() => {
    setSelectedExams([]);
    setObservations("");
    loadExams();
    loadRequestedExams();

    return () => {
      setSelectedExams([]);
      setObservations("");
    };
  }, [id_atencion]);

  const loadExams = async (forceRefresh = false) => {
    try {
      // Intentar obtener de caché primero (si no es forceRefresh)
      if (!forceRefresh) {
        const cachedData = await CacheService.get(CACHE_KEY_CATALOG);
        if (cachedData) {
          console.log("📦 Catálogo de exámenes de gabinete cargado desde caché");
          setExams(cachedData);
          return;
        }
      }

      console.log("🌐 Cargando exámenes de gabinete desde API...");
      const response = await api.get("/exams/catalog?type=GABINETE");
      console.log("Exámenes recibidos:", response.data);

      if (response.data && Array.isArray(response.data)) {
        // Guardar en caché
        await CacheService.set(CACHE_KEY_CATALOG, response.data, CACHE_TTL);
        setExams(response.data);
      } else {
        console.error("Formato de respuesta inválido:", response.data);
        setExams([]);
      }
    } catch (error) {
      console.error("Error loading exams:", error);
      
      // Si falla la API, intentar cargar desde caché
      const cachedData = await CacheService.get(CACHE_KEY_CATALOG);
      if (cachedData) {
        setExams(cachedData);
        Alert.alert(t('common.noConnection'), t('common.showingCachedData'));
      } else {
        Alert.alert(
          t('common.error'),
          t('common.couldNotLoadExams') +
            (error.response?.data?.error || error.message),
        );
        setExams([]);
      }
    }
  };

  const loadRequestedExams = async (forceRefresh = false) => {
    try {
      setLoadingHistory(true);
      const cacheKey = `${CACHE_KEY_HISTORY}${id_atencion}`;

      // Intentar obtener de caché primero (si no es forceRefresh)
      if (!forceRefresh) {
        const cachedData = await CacheService.get(cacheKey);
        if (cachedData) {
          console.log("📦 Historial de exámenes de gabinete cargado desde caché");
          setRequestedExams(cachedData);
          setLoadingHistory(false);
          return;
        }
      }

      console.log("🌐 Cargando solicitudes previas desde API...");
      const response = await api.get(
        `/exams/requested/${id_atencion}?type=GABINETE`,
      );
      console.log("Solicitudes recibidas:", response.data);
      
      const historyData = response.data || [];
      // Guardar en caché
      await CacheService.set(cacheKey, historyData, CACHE_TTL_HISTORY);
      setRequestedExams(historyData);
      if (forceRefresh) setCurrentHistoryPage(1);
    } catch (error) {
      console.error("Error loading requested exams:", error);
      // Intentar cargar desde caché en caso de error
      const cacheKey = `${CACHE_KEY_HISTORY}${id_atencion}`;
      const cachedData = await CacheService.get(cacheKey);
      if (cachedData) {
        console.log("📦 Historial cargado desde caché (fallback)");
        setRequestedExams(cachedData);
      }
    } finally {
      setLoadingHistory(false);
    }
  };

  const toggleExam = (examId) => {
    console.log("Toggle exam:", examId, "Actual selección:", selectedExams);
    if (selectedExams.includes(examId)) {
      setSelectedExams(selectedExams.filter((id) => id !== examId));
    } else {
      setSelectedExams([...selectedExams, examId]);
    }
  };

  const handleSubmit = async () => {
    if (selectedExams.length === 0) {
      Alert.alert(t('common.warning'), t('common.selectAtLeastOne'));
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("/exams/request", {
        id_atencion: parseInt(id_atencion),
        exams: selectedExams.map((id) => parseInt(id)),
        observations: observations || "",
        type: "GABINETE",
      });

      if (response.data) {
        Alert.alert(t('common.success'), t('medico.imagingExams'));
        setSelectedExams([]);
        setObservations("");
        await loadRequestedExams(true);
        // Mantener abierto el historial si ya estaba abierto
        if (showHistory) {
          setShowHistory(true);
        }
      }
    } catch (error) {
      console.error("Error saving exams:", error);
      Alert.alert(
        t('common.error'),
        error.response?.data?.error || t('common.couldNotSaveExams'),
      );
    } finally {
      setLoading(false);
    }
  };

  // Calcular páginas para el historial
  const totalHistoryPages = Math.ceil(requestedExams.length / HISTORY_ITEMS_PER_PAGE);
  const paginatedHistory = requestedExams.slice(
    (currentHistoryPage - 1) * HISTORY_ITEMS_PER_PAGE,
    currentHistoryPage * HISTORY_ITEMS_PER_PAGE
  );

  // Ajustar página actual si es mayor que el total
  useEffect(() => {
    const validTotalPages = Math.max(1, totalHistoryPages);
    if (currentHistoryPage > validTotalPages) {
      setCurrentHistoryPage(validTotalPages);
    }
  }, [currentHistoryPage, totalHistoryPages]);

  const renderHistoryItem = ({ item }) => {
    // Asegurar que examenes sea un array
    const examenesList = Array.isArray(item.examenes) ? item.examenes : [];

    return (
      <View style={styles.historyItem}>
        <View style={styles.historyHeader}>
          <View style={styles.historyBadge}>
            <Text style={styles.historyBadgeText}>
              {moment(item.fecha_solicitud || item.fecha).format("DD/MM")}
            </Text>
          </View>
          <View style={styles.historyInfo}>
            <Text style={styles.historyDate}>
              {moment(item.fecha_solicitud || item.fecha).format(
                lang === 'es' ? 'dddd, D [de] MMMM [de] YYYY [a las] HH:mm' : 'dddd, D MMMM YYYY HH:mm',
              )}
            </Text>
            <Text style={styles.historyDoctor}>
              <Ionicons name="medkit-outline" size={12} color="#718096" /> Dr.{" "}
              {item.medico || t('common.notSpecified')}
            </Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor:
                  item.estado === "REALIZADO" ? "#48bb78" : "#ed8936",
              },
            ]}
          >
            <Text style={styles.statusText}>
              {item.estado === "REALIZADO" ? t('common.completed') : t('common.pending')}
            </Text>
          </View>
        </View>

        <View style={styles.historyContent}>
          <Text style={styles.historyExamsLabel}>{t('medico.examsRequested')}:</Text>
          {examenesList.length > 0 ? (
            examenesList.map((exam, idx) => (
              <View key={idx} style={styles.historyExam}>
                <Ionicons name="scan-outline" size={12} color="#ed8936" />
                <Text style={styles.historyExamName}>{exam}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.historyEmptyExams}>
              {t('common.noExamsFound')}
            </Text>
          )}
          {item.observaciones && (
            <>
              <Text style={styles.historyObsLabel}>{t('common.observations')}:</Text>
              <Text style={styles.historyObsText}>{item.observaciones}</Text>
            </>
          )}
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <LinearGradient colors={["#ed8936", "#dd6b20"]} style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          <Ionicons name="scan-outline" size={20} color="#fff" /> {t('medico.imagingExams')}
        </Text>
        <TouchableOpacity
          onPress={() => {
            loadExams(true);
            loadRequestedExams(true);
          }}
          style={styles.backButton}
          disabled={loadingHistory}
        >
          <Ionicons name="refresh-outline" size={22} color="#fff" />
        </TouchableOpacity>
      </LinearGradient>

      {/* Información del paciente */}
      <View style={styles.patientInfoCard}>
        <View style={styles.patientInfoContent}>
          <View style={styles.patientAvatar}>
            <Ionicons name="person-circle" size={50} color="#fff" />
          </View>
          <View style={styles.patientDetails}>
            <Text style={styles.patientName}>{t('medico.patient')}</Text>
            <View style={styles.patientMeta}>
              <Text style={styles.patientMetaItem}>
                <Ionicons name="card-outline" size={12} color="#ed8936" />
                <Text style={styles.patientMetaText}>Exp: {Id_exp || "N/A"}</Text>
              </Text>
              <Text style={styles.patientMetaItem}>
                <Ionicons name="calendar-outline" size={12} color="#ed8936" />
                <Text style={styles.patientMetaText}>Atención: {id_atencion}</Text>
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Tarjeta principal - Nueva solicitud */}
      <View style={styles.mainCard}>
        <LinearGradient
          colors={["#ed8936", "#dd6b20"]}
          style={styles.cardHeader}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <View style={styles.cardHeaderContent}>
            <Ionicons name="add-circle-outline" size={22} color="#fff" />
            <Text style={styles.cardHeaderTitle}>
              {t('medico.newExamRequest')}
            </Text>
          </View>
        </LinearGradient>

        <View style={styles.cardBody}>
          {/* Lista de exámenes */}
          <View style={styles.examsSection}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionBadge}>
                <Ionicons name="scan-outline" size={16} color="#fff" />
              </View>
              <Text style={styles.sectionTitle}>{t('common.availableExams')}</Text>
              <View style={styles.sectionCount}>
                <Text style={styles.sectionCountText}>
                  {exams.length} exámenes
                </Text>
              </View>
            </View>

            <View style={styles.examsGrid}>
              {exams.length === 0 ? (
                <View style={styles.emptyExams}>
                  <Ionicons
                    name="alert-circle-outline"
                    size={40}
                    color="#a0aec0"
                  />
                  <Text style={styles.emptyExamsText}>
                    {t('common.noExamsAvailable')}
                  </Text>
                </View>
              ) : (
                exams.map((exam) => (
                  <TouchableOpacity
                    key={exam.id_catalogo}
                    style={[
                      styles.examItem,
                      selectedExams.includes(exam.id_catalogo) &&
                        styles.examItemSelected,
                    ]}
                    onPress={() => toggleExam(exam.id_catalogo)}
                  >
                    <View style={styles.examIcon}>
                      <Ionicons
                        name="scan-outline"
                        size={20}
                        color={
                          selectedExams.includes(exam.id_catalogo)
                            ? "#ed8936"
                            : "#a0aec0"
                        }
                      />
                    </View>
                    <Text
                      style={[
                        styles.examName,
                        selectedExams.includes(exam.id_catalogo) &&
                          styles.examNameSelected,
                      ]}
                    >
                      {exam.nombre}
                    </Text>
                    <View
                      style={[
                        styles.examCheck,
                        selectedExams.includes(exam.id_catalogo) &&
                          styles.examCheckSelected,
                      ]}
                    >
                      {selectedExams.includes(exam.id_catalogo) && (
                        <Ionicons name="checkmark" size={12} color="#fff" />
                      )}
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </View>
          </View>

          {/* Observaciones */}
          <View style={styles.observacionesSection}>
            <View style={styles.sectionHeader}>
              <View
                style={[styles.sectionBadge, { backgroundColor: "#ed8936" }]}
              >
                <Ionicons name="create-outline" size={16} color="#fff" />
              </View>
              <Text style={styles.sectionTitle}>{t('common.observations')}</Text>
            </View>
            <TextInput
              style={styles.observacionesTextArea}
              placeholder={t('medico.observationsPlaceholder')}
              placeholderTextColor="#a0aec0"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              value={observations}
              onChangeText={setObservations}
            />
            <Text style={styles.helperText}>
              <Ionicons name="information-circle-outline" size={12} /> {t('medico.imagingHelper')}
            </Text>
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
                <Text style={styles.saveButtonText}>{t('medico.requestExams')}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Historial de Solicitudes */}
      <View style={styles.historyCard}>
        <TouchableOpacity
          style={styles.historyHeaderGradient}
          onPress={() => setShowHistory(!showHistory)}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={["#ed8936", "#dd6b20"]}
            style={styles.historyHeaderInner}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <View style={styles.historyHeaderContent}>
              <Ionicons name="time-outline" size={20} color="#fff" />
              <Text style={styles.historyTitle}>{t('medico.imagingResultsHistory')}</Text>
              {requestedExams.length > 0 && (
                <View style={styles.historyCount}>
                  <Text style={styles.historyCountText}>
                    {requestedExams.length} {t('common.requests')}
                  </Text>
                </View>
              )}
              <Ionicons
                name={
                  showHistory ? "chevron-up-outline" : "chevron-down-outline"
                }
                size={20}
                color="#fff"
              />
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {showHistory && (
          <View style={styles.historyBody}>
            {loadingHistory ? (
              <ActivityIndicator
                style={styles.historyLoader}
                size="large"
                color="#ed8936"
              />
            ) : requestedExams.length === 0 ? (
              <View style={styles.emptyHistory}>
                <Ionicons
                  name="document-text-outline"
                  size={48}
                  color="#cbd5e0"
                />
                <Text style={styles.emptyHistoryText}>
                  {t('common.noPreviousRequests')}
                </Text>
              </View>
            ) : (
              <>
                <FlatList
                  data={paginatedHistory}
                  renderItem={renderHistoryItem}
                  keyExtractor={(item, index) =>
                    item.id_examen?.toString() || `imaging_${index}`
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
                    totalItems={requestedExams.length}
                  />
                </View>
              </>
            )}
          </View>
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
    borderLeftColor: "#ed8936",
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
    backgroundColor: "#ed8936",
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
    flexWrap: "wrap",
  },
  patientMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  patientMetaText: {
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
  examsSection: {
    backgroundColor: "#f7fafc",
    borderRadius: 15,
    padding: 16,
    marginBottom: 20,
  },
  observacionesSection: {
    backgroundColor: "#f7fafc",
    borderRadius: 15,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  sectionBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#ed8936",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  sectionTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: "#2d3748",
  },
  sectionCount: {
    backgroundColor: "#fff",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  sectionCountText: {
    fontSize: 11,
    color: "#718096",
  },
  examsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  examItem: {
    flexDirection: "row",
    alignItems: "center",
    width: "48%",
    margin: "1%",
    padding: 12,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  examItemSelected: {
    borderColor: "#ed8936",
    backgroundColor: "#fffaf0",
  },
  examIcon: {
    marginRight: 10,
  },
  examName: {
    flex: 1,
    fontSize: 13,
    color: "#2d3748",
  },
  examNameSelected: {
    color: "#ed8936",
    fontWeight: "500",
  },
  examCheck: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    justifyContent: "center",
    alignItems: "center",
  },
  examCheckSelected: {
    backgroundColor: "#ed8936",
    borderColor: "#ed8936",
  },
  emptyExams: {
    width: "100%",
    alignItems: "center",
    padding: 30,
  },
  emptyExamsText: {
    marginTop: 10,
    fontSize: 14,
    color: "#a0aec0",
  },
  observacionesTextArea: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: "#2d3748",
    backgroundColor: "#fff",
    minHeight: 100,
    textAlignVertical: "top",
    marginBottom: 8,
  },
  helperText: {
    fontSize: 11,
    color: "#a0aec0",
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
    overflow: "hidden",
  },
  historyHeaderInner: {
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
    marginRight: 8,
  },
  historyCountText: {
    fontSize: 11,
    color: "#fff",
    fontWeight: "500",
  },
  historyBody: {
    padding: 16,
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
    backgroundColor: "#f7fafc",
    borderRadius: 15,
    marginBottom: 16,
    overflow: "hidden",
  },
  historyHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#edf2f7",
  },
  historyBadge: {
    width: 45,
    height: 45,
    borderRadius: 12,
    backgroundColor: "#ed8936",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  historyBadgeText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#fff",
  },
  historyInfo: {
    flex: 1,
  },
  historyDate: {
    fontSize: 12,
    fontWeight: "500",
    color: "#2d3748",
  },
  historyDoctor: {
    fontSize: 11,
    color: "#718096",
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#fff",
  },
  historyContent: {
    padding: 12,
  },
  historyExamsLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4a5568",
    marginBottom: 6,
  },
  historyExam: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
    marginLeft: 8,
  },
  historyExamName: {
    fontSize: 12,
    color: "#2d3748",
    marginLeft: 6,
  },
  historyObsLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#ed8936",
    marginTop: 8,
    marginBottom: 4,
  },
  historyObsText: {
    fontSize: 12,
    color: "#718096",
    marginLeft: 8,
  },
  historyEmptyExams: {
    fontSize: 12,
    color: "#a0aec0",
    fontStyle: "italic",
    marginLeft: 8,
    marginBottom: 4,
  },
  historyPagination: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
});

export default ImagingExamsScreen;