// src/screens/medico/MedicoScreen.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import moment from "moment";
import "moment/locale/es";

moment.locale("es");

const MedicoScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [consulta, setConsulta] = useState([]);
  const [urgencias, setUrgencias] = useState([]);
  const [hospitalizados, setHospitalizados] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const response = await api.get("/medico");

      console.log("Datos recibidos:", response.data);

      setConsulta(response.data.beds_consulta || []);
      setUrgencias(response.data.beds_preparacion || []);
      setHospitalizados(response.data.beds_recuperacion || []);
    } catch (error) {
      console.error("Error:", error);
      Alert.alert("Error", "No se pudieron cargar los pacientes");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getPatientName = (item) => {
    if (item.nom_pac && item.papell) {
      return `${item.papell} ${item.nom_pac}`;
    }
    if (item.nom_pac) return item.nom_pac;
    return "Paciente";
  };

  const renderPatientCard = (item, index, area, areaColor) => {
    const isOccupied = item.estatus === "OCUPADA" && item.tiene_atencion;

    return (
      <TouchableOpacity
        key={item.id_atencion || item.id_cama || index}
        style={styles.bedCard}
        onPress={() => {
          if (isOccupied && item.id_atencion && item.Id_exp) {
            navigation.navigate("PatientDetail", {
              id_atencion: item.id_atencion,
              Id_exp: item.Id_exp
            });
          } else {
            Alert.alert("Información", "Cama disponible");
          }
        }}
      >
        <View style={[styles.bedIcon, { backgroundColor: areaColor + "20" }]}>
          <Ionicons
            name={isOccupied ? "person-outline" : "bed-outline"}
            size={32}
            color={areaColor}
          />
        </View>
        <Text style={styles.bedNumber}>{item.num_cama}</Text>
        {isOccupied ? (
          <>
            <Text style={styles.patientName}>{getPatientName(item)}</Text>
            <View style={[styles.statusBadge, { backgroundColor: areaColor }]}>
              <Text style={styles.statusText}>OCUPADO</Text>
            </View>
          </>
        ) : (
          <>
            <Text style={styles.patientName}>—</Text>
            <View style={[styles.statusBadge, { backgroundColor: "#a0aec0" }]}>
              <Text style={styles.statusText}>DISPONIBLE</Text>
            </View>
          </>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={styles.loadingText}>Cargando pacientes...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <LinearGradient colors={["#667eea", "#764ba2"]} style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          <Ionicons name="medkit-outline" size={20} color="#fff" /> Módulo
          Médico
        </Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <View style={styles.welcomeCard}>
        <View>
          <Text style={styles.welcomeTitle}>¡Hola, Dr. {user?.username}!</Text>
          <Text style={styles.welcomeSubtitle}>
            {moment().format("dddd, D [de] MMMM [de] YYYY")}
          </Text>
        </View>
        <View style={styles.statsPill}>
          <Text style={styles.statsPillText}>
            Total: {consulta.length + urgencias.length + hospitalizados.length}
          </Text>
        </View>
      </View>

      {/* CONSULTA EXTERNA */}
      <View style={styles.sectionContainer}>
        <View style={[styles.sectionTitle, styles.titleConsulta]}>
          <View style={styles.sectionTitleLeft}>
            <Ionicons name="people-outline" size={22} color="#4299e1" />
            <Text style={styles.sectionTitleText}>PACIENTES EN CONSULTA</Text>
          </View>
          <View style={styles.badgeCount}>
            <Text style={styles.badgeCountText}>{consulta.length}</Text>
          </View>
        </View>
        <View style={styles.patientGrid}>
          {consulta.length > 0 ? (
            consulta.map((item, idx) =>
              renderPatientCard(item, idx, "Consulta", "#4299e1"),
            )
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🏥</Text>
              <Text style={styles.emptyText}>No hay pacientes en consulta</Text>
            </View>
          )}
        </View>
      </View>

      {/* URGENCIAS */}
      <View style={styles.sectionContainer}>
        <View style={[styles.sectionTitle, styles.titleUrgencias]}>
          <View style={styles.sectionTitleLeft}>
            <Ionicons name="alert-circle-outline" size={22} color="#f56565" />
            <Text style={styles.sectionTitleText}>PACIENTES EN URGENCIAS</Text>
          </View>
          <View style={[styles.badgeCount, styles.badgeUrgencias]}>
            <Text style={styles.badgeCountText}>{urgencias.length}</Text>
          </View>
        </View>
        <View style={styles.patientGrid}>
          {urgencias.length > 0 ? (
            urgencias.map((item, idx) =>
              renderPatientCard(item, idx, "Urgencias", "#f56565"),
            )
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🚨</Text>
              <Text style={styles.emptyText}>
                No hay pacientes en urgencias
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* HOSPITALIZADOS */}
      <View style={styles.sectionContainer}>
        <View style={[styles.sectionTitle, styles.titleHospitalizado]}>
          <View style={styles.sectionTitleLeft}>
            <Ionicons name="bed-outline" size={22} color="#48bb78" />
            <Text style={styles.sectionTitleText}>
              PACIENTES HOSPITALIZADOS
            </Text>
          </View>
          <View style={[styles.badgeCount, styles.badgeHospitalizado]}>
            <Text style={styles.badgeCountText}>{hospitalizados.length}</Text>
          </View>
        </View>
        <View style={styles.patientGrid}>
          {hospitalizados.length > 0 ? (
            hospitalizados.map((item, idx) =>
              renderPatientCard(item, idx, "Hospitalizado", "#48bb78"),
            )
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🛏️</Text>
              <Text style={styles.emptyText}>
                No hay pacientes hospitalizados
              </Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          <Ionicons
            name="shield-checkmark-outline"
            size={12}
            color="rgba(0,0,0,0.4)"
          />{" "}
          INEO v2.0 - Sistema de Gestión Hospitalaria
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f7fafc" },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f7fafc",
  },
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
  welcomeCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  welcomeTitle: { fontSize: 16, fontWeight: "bold", color: "#2d3748" },
  welcomeSubtitle: { fontSize: 12, color: "#718096", marginTop: 4 },
  statsPill: {
    backgroundColor: "#667eea20",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statsPillText: { fontSize: 12, fontWeight: "600", color: "#667eea" },
  sectionContainer: { marginTop: 20, paddingHorizontal: 16 },
  sectionTitle: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionTitleLeft: { flexDirection: "row", alignItems: "center" },
  sectionTitleText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2d3748",
    marginLeft: 8,
  },
  titleConsulta: { borderLeftWidth: 4, borderLeftColor: "#4299e1" },
  titleUrgencias: { borderLeftWidth: 4, borderLeftColor: "#f56565" },
  titleHospitalizado: { borderLeftWidth: 4, borderLeftColor: "#48bb78" },
  badgeCount: {
    backgroundColor: "#4299e1",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeUrgencias: { backgroundColor: "#f56565" },
  badgeHospitalizado: { backgroundColor: "#48bb78" },
  badgeCountText: { fontSize: 12, fontWeight: "bold", color: "#fff" },
  patientGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  bedCard: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  bedIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  bedNumber: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#2d3748",
    marginBottom: 4,
  },
  patientName: {
    fontSize: 12,
    color: "#718096",
    textAlign: "center",
    marginBottom: 8,
  },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 10, fontWeight: "bold", color: "#fff" },
  emptyState: {
    width: "100%",
    alignItems: "center",
    paddingVertical: 40,
    backgroundColor: "#fff",
    borderRadius: 16,
  },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 14, color: "#a0aec0" },
  footer: { marginTop: 30, marginBottom: 20, alignItems: "center" },
  footerText: { fontSize: 11, color: "rgba(0,0,0,0.4)" },
});

export default MedicoScreen;
