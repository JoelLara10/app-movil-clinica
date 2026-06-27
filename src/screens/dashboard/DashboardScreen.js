import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  useWindowDimensions,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import api from "../../services/api";
import moment from "moment";
import "moment/locale/es";

moment.locale("es");

const DashboardScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const { width: screenWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const [stats, setStats] = useState({
    active_patients: { total: 0 },
    bed_occupancy: { occupied: 0 },
  });
  const [pendingStudies, setPendingStudies] = useState({ total: 0 });
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const statsRes = await api
        .get("/analytics/dashboard")
        .catch(() => ({ data: {} }));
      setStats(statsRes.data);

      const studiesRes = await api
        .get("/exams/counts")
        .catch(() => ({ data: { total: 0 } }));
      setPendingStudies(studiesRes.data);
    } catch (error) {
      console.error("Error loading dashboard:", error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const getMenuOptions = () => {
    const role = user?.role?.toLowerCase();
    const options = [];

    if (role === "admin" || role === "administrativo") {
      options.push(
        {
          name: "Administrativo",
          icon: "business-outline",
          screen: "Admin",
          color: "#667eea",
          description: "Gestión de pacientes y cuentas",
        },
        {
          name: "Enfermería",
          icon: "medkit-outline",
          screen: "Enfermeria",
          color: "#f56565",
          description: "Atención y cuidados de enfermería",
        },
        {
          name: "Médico",
          icon: "pulse-outline",
          screen: "Medico",
          color: "#48bb78",
          description: "Atención médica y recetas",
        },
        {
          name: "Estudios",
          icon: "flask-outline",
          screen: "Estudios",
          color: "#ed8936",
          description: "Gestión de exámenes",
          badge: pendingStudies.total,
        },
        {
          name: "Configuración",
          icon: "settings-outline",
          screen: "Config",
          color: "#718096",
          description: "Configuración del sistema",
        },
      );
    } else if (role === "admin" || role === "enfermero") {
      options.push({
        name: "Enfermería",
        icon: "medkit-outline",
        screen: "Enfermeria",
        color: "#9f7aea",
        description: "Atención de enfermería y signos vitales",
      });
    } else if (role === "medico") {
      options.push(
        {
          name: "Médico",
          icon: "pulse-outline",
          screen: "Medico",
          color: "#48bb78",
          description: "Atención médica",
        },
        {
          name: "Estudios",
          icon: "flask-outline",
          screen: "Estudios",
          color: "#ed8936",
          description: "Resultados",
          badge: pendingStudies.total,
        },
      );
    } else if (role === "estudios") {
      options.push({
        name: "Estudios",
        icon: "flask-outline",
        screen: "Estudios",
        color: "#ed8936",
        description: "Gestión de exámenes",
        badge: pendingStudies.total,
      });
    }

    return options;
  };

  const isLargeScreen = screenWidth > 700;
  const menuOptions = getMenuOptions(); // ← Importante: llamar la función

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      showsVerticalScrollIndicator={true}
      scrollEnabled={true}
      keyboardShouldPersistTaps="handled"
    >
      <LinearGradient colors={["#667eea", "#764ba2"]} style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>
              ¡Hola, {user?.username || "Usuario"}!
            </Text>
            <Text style={styles.date}>
              {moment().format("dddd, D [de] MMMM [de] YYYY")}
            </Text>
          </View>
          <TouchableOpacity onPress={logout} style={styles.logoutButton}>
            <Ionicons name="log-out-outline" size={26} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Stats Cards */}
      <View
        style={[
          styles.statsContainer,
          isLargeScreen && styles.statsContainerLarge,
        ]}
      >
        <View style={styles.statCard}>
          <Ionicons name="people-outline" size={32} color="#667eea" />
          <Text style={styles.statNumber}>
            {stats.active_patients?.total || 0}
          </Text>
          <Text style={styles.statLabel}>Pacientes Activos</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name="bed-outline" size={32} color="#48bb78" />
          <Text style={styles.statNumber}>
            {stats.bed_occupancy?.occupied || 0}
          </Text>
          <Text style={styles.statLabel}>Camas Ocupadas</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name="flask-outline" size={32} color="#ed8936" />
          <Text style={styles.statNumber}>{pendingStudies.total || 0}</Text>
          <Text style={styles.statLabel}>Estudios Pendientes</Text>
        </View>
      </View>

      <View style={styles.menuContainer}>
        <Text style={styles.menuTitle}>Módulos del Sistema</Text>
        <View style={[styles.menuGrid, isLargeScreen && styles.menuGridLarge]}>
          {menuOptions.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.menuCard, isLargeScreen && styles.menuCardLarge]}
              onPress={() => navigation.navigate(option.screen)}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.menuIcon,
                  { backgroundColor: `${option.color}20` },
                ]}
              >
                <Ionicons name={option.icon} size={36} color={option.color} />
              </View>
              <Text style={styles.menuName}>{option.name}</Text>
              <Text style={styles.menuDescription}>{option.description}</Text>
              {option.badge > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{option.badge}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Espacio extra para scroll en web */}
      <View style={{ height: Platform.OS === "web" ? 260 : 200 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: "#f7fafc",
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: Platform.OS === "web" ? 260 : 120,
    justifyContent: "flex-start",
  },
  header: {
    paddingTop: 50,
    paddingBottom: 40,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  greeting: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#fff",
  },
  date: {
    fontSize: 15,
    color: "rgba(255,255,255,0.85)",
    marginTop: 4,
  },
  logoutButton: { padding: 8 },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginTop: -35,
  },
  statsContainerLarge: { paddingHorizontal: 40 },
  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 18,
    marginHorizontal: 6,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
  },
  statNumber: {
    fontSize: 26,
    fontWeight: "700",
    color: "#2d3748",
    marginTop: 10,
  },
  statLabel: {
    fontSize: 13,
    color: "#718096",
    marginTop: 6,
    textAlign: "center",
  },
  menuContainer: {
    padding: 20,
  },
  menuTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#2d3748",
    marginBottom: 20,
  },
  menuGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  menuGridLarge: {
    justifyContent: "flex-start",
  },
  menuCard: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 20,
    marginBottom: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    position: "relative",
  },
  menuCardLarge: {
    width: "31%",
    marginRight: "2.3%",
  },
  menuIcon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },
  menuName: {
    fontSize: 17,
    fontWeight: "600",
    color: "#2d3748",
    marginBottom: 6,
    textAlign: "center",
  },
  menuDescription: {
    fontSize: 13,
    color: "#718096",
    textAlign: "center",
    lineHeight: 18,
  },
  badge: {
    position: "absolute",
    top: -10,
    right: -10,
    backgroundColor: "#e53e3e",
    borderRadius: 12,
    minWidth: 26,
    height: 26,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 7,
    borderWidth: 2,
    borderColor: "#fff",
  },
  badgeText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "bold",
  },
});

export default DashboardScreen;
