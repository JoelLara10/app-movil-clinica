// src/components/Sidebar.js
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { usePatient } from "../context/PatientContext";

const Sidebar = ({ navigation, closeDrawer }) => {
  const { user, logout } = useAuth();
  const { selectedPatient } = usePatient();

  const id_atencion = selectedPatient?.id_atencion;
  const pacienteId = selectedPatient?.Id_exp;

  // Navegación que soporta pantallas anidadas (screen + subScreen)
  const navigateFlexible = (screen, params = {}, subScreen) => {
    if (subScreen) {
      navigation.navigate(screen, { screen: subScreen, params });
    } else {
      navigation.navigate(screen, params);
    }
    navigation.closeDrawer?.();
  };

  const handleNavigation = (screen, requiresPatient = true, params = {}, subScreen) => {
    if (requiresPatient && !id_atencion) {
      Alert.alert("Información", "Seleccione un paciente primero");
      return;
    }

    navigateFlexible(screen, params, subScreen);
  };

  const handleLogout = () => {
    Alert.alert("Cerrar sesión", "¿Estás seguro de que deseas salir?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Salir", onPress: () => logout() },
    ]);
  };

  const menuSections = [];

  // Mostrar Panel Médico sólo si el usuario tiene rol 'medico'
  if (user?.role === 'medico') {
    menuSections.push({
      section: 'PRINCIPAL',
      items: [
        {
          name: 'Panel Médico',
          icon: 'speedometer-outline',
          screen: 'Medico',
          subScreen: 'MedicoList',
          isMainScreen: true,
          requiresPatient: false,
          params: {},
        },
      ],
    });
  }

  // Secciones comunes (Historia, Notas, Documentos)
  const restSections = [
    {
      section: 'HISTORIA CLÍNICA',
      items: [
        {
          name: 'Historia Clínica',
          icon: 'document-text-outline',
          screen: 'HistoriaClinica',
          requiresPatient: true,
          params: { id_atencion, Id_exp: pacienteId },
        },
      ],
    },
    {
      section: 'NOTAS MÉDICAS',
      items: [
        {
          name: 'Signos Vitales',
          icon: 'heart-outline',
          screen: 'VitalSigns',
          requiresPatient: true,
          params: { id_atencion },
        },
        {
          name: 'Nota Médica (SOAP)',
          icon: 'document-text-outline',
          screen: 'MedicalNote',
          requiresPatient: true,
          params: { id_atencion },
        },
        {
          name: 'Diagnóstico',
          icon: 'clipboard-outline',
          screen: 'Diagnosis',
          requiresPatient: true,
          params: { id_atencion },
        },
        {
          name: 'Receta',
          icon: 'medkit-outline',
          screen: 'Prescription',
          requiresPatient: true,
          params: { id_atencion },
        },
        {
          name: 'Exámenes de Laboratorio',
          icon: 'flask-outline',
          screen: 'LabExams',
          requiresPatient: true,
          params: { id_atencion, Id_exp: pacienteId },
        },
        {
          name: 'Exámenes de Gabinete',
          icon: 'scan-outline',
          screen: 'ImagingExams',
          requiresPatient: true,
          params: { id_atencion, Id_exp: pacienteId },
        },
      ],
    },
    {
      section: 'DOCUMENTOS',
      items: [
        {
          name: 'Imprimir Documentos',
          icon: 'print-outline',
          screen: 'PrintDocs',
          requiresPatient: true,
          params: { id_atencion },
        },
        {
          name: 'Resultados de Estudios',
          icon: 'document-text-outline',
          screen: 'StudyResults',
          requiresPatient: true,
          params: { id_atencion },
        },
      ],
    },
  ];

  menuSections.push(...restSections);

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#667eea", "#764ba2"]} style={styles.header}>
        <View style={styles.brandContainer}>
          <Text style={styles.brandTitle}>INEO</Text>
          <Text style={styles.brandVersion}>v2.0</Text>
        </View>
        <View style={styles.userInfo}>
          <View style={styles.userAvatar}>
            <Ionicons name="person-circle-outline" size={44} color="#fff" />
          </View>
          <View style={styles.userTextContainer}>
            <Text style={styles.userName}>
              Dr. {user?.username || "Usuario"}
            </Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>MÉDICO</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* Mostrar paciente seleccionado */}
      {id_atencion && (
        <View style={styles.selectedPatientContainer}>
          <Ionicons name="person-circle-outline" size={20} color="#48bb78" />
          <Text style={styles.selectedPatientText}>
            Paciente seleccionado: {pacienteId || "ID"}
          </Text>
        </View>
      )}

      <ScrollView
        style={styles.menuContainer}
        showsVerticalScrollIndicator={false}
      >
        {menuSections.map((section, sectionIdx) => (
          <View key={sectionIdx} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.section}</Text>
            {section.items.map((item, itemIdx) => {
              const isDisabled = item.requiresPatient && !id_atencion;
              return (
                <TouchableOpacity
                  key={itemIdx}
                  style={[
                    styles.menuItem,
                    isDisabled && styles.menuItemDisabled,
                  ]}
                  onPress={() => {
                    if (item.isMainScreen) {
                      // Para pantallas principales (soporta subScreen)
                      navigateFlexible(item.screen, item.params, item.subScreen);
                    } else {
                      // Para pantallas dentro del stack anidado
                      handleNavigation(
                        item.screen,
                        item.requiresPatient,
                        item.params,
                        item.subScreen,
                      );
                    }
                  }}
                  disabled={isDisabled}
                >
                  <Ionicons
                    name={item.icon}
                    size={20}
                    color={isDisabled ? "#a0aec0" : "#718096"}
                    style={styles.menuIcon}
                  />
                  <Text
                    style={[
                      styles.menuText,
                      isDisabled && styles.menuTextDisabled,
                    ]}
                  >
                    {item.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </ScrollView>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color="#e53e3e" />
        <Text style={styles.logoutText}>Cerrar sesión</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a202c",
  },
  header: {
    paddingTop: 50,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  brandContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  brandVersion: {
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  userTextContainer: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 4,
  },
  roleBadge: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  roleText: {
    fontSize: 10,
    color: "#fff",
    fontWeight: "bold",
  },
  selectedPatientContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2d3748",
    marginHorizontal: 16,
    marginTop: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
  },
  selectedPatientText: {
    fontSize: 12,
    color: "#48bb78",
    marginLeft: 8,
    fontWeight: "500",
  },
  menuContainer: {
    flex: 1,
    paddingTop: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "600",
    color: "#a0aec0",
    textTransform: "uppercase",
    letterSpacing: 1,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginHorizontal: 8,
    borderRadius: 10,
  },
  menuItemDisabled: {
    opacity: 0.5,
  },
  menuIcon: {
    marginRight: 12,
    width: 24,
  },
  menuText: {
    fontSize: 14,
    color: "#e2e8f0",
    fontWeight: "500",
  },
  menuTextDisabled: {
    color: "#a0aec0",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginHorizontal: 8,
    marginBottom: 20,
    borderRadius: 10,
    borderTopWidth: 1,
    borderTopColor: "#2d3748",
  },
  logoutText: {
    fontSize: 14,
    color: "#e53e3e",
    fontWeight: "500",
    marginLeft: 12,
  },
});

export default Sidebar;
