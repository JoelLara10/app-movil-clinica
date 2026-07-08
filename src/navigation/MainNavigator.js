// src/navigation/MainNavigator.js
import React from "react";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { createStackNavigator } from "@react-navigation/stack";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { usePatient } from "../context/PatientContext";

import DashboardScreen from "../screens/dashboard/DashboardScreen";

// Importar screens
import AdminScreen from "../screens/admin/AdminScreen";
import CamasScreen from "../screens/admin/CamasScreen";
import MedicoScreen from "../screens/medico/MedicoScreen";
import EstudiosScreen from "../screens/estudios/EstudiosScreen";
import ConfigScreen from "../screens/config/ConfigScreen";
import PatientDetailScreen from "../screens/medico/PatientDetailScreen";
import CensoScreen from "../screens/administrativo/CensoScreen";
import CorteCajaScreen from "../screens/administrativo/CorteCajaScreen";
import NuevoPacienteScreen from "../screens/administrativo/NuevoPacienteScreen";
import PacienteDetailScreen from "../screens/administrativo/PacienteDetailScreen";
import PacientesScreen from "../screens/administrativo/PacientesScreen";

//Screens Estudios
import SubirResultadoScreen from "../screens/estudios/SubirResultadoScreen";
import VerResultadoLabScreen from "../screens/estudios/VerResultadoLabScreen";
import VerResultadoGabScreen from "../screens/estudios/VerResultadoGabScreen";
import EditarResultadoLabScreen from "../screens/estudios/EditarResultadoLabScreen";
import EditarResultadoGabScreen from "../screens/estudios/EditarResultadoGabScreen";

// Screens médicas
import HistoriaClinicaScreen from "../screens/medico/HistoriaClinicaScreen";
import VitalSignsScreen from "../screens/medico/VitalSignsScreen";
import MedicalNoteScreen from "../screens/medico/MedicalNoteScreen";
import DiagnosisScreen from "../screens/medico/DiagnosisScreen";
import PrescriptionScreen from "../screens/medico/PrescriptionScreen";
import LabExamsScreen from "../screens/medico/LabExamsScreen";
import ImagingExamsScreen from "../screens/medico/ImagingExamsScreen";
import PrintDocsScreen from "../screens/medico/PrintDocsScreen";
import StudyResultsScreen from "../screens/medico/StudyResultsScreen";

//Screens Config
import GeneralSettingsScreen from "../screens/config/GeneralSettingsScreen";
import UsuariosConfigScreen from "../screens/config/UsuariosConfigScreen";
import CamasConfigScreen from "../screens/config/CamasConfigScreen";
import ServiciosConfigScreen from "../screens/config/ServiciosConfigScreen";
import AutomationConfigScreen from "../screens/config/AutomationConfigScreen";
import BackupConfigScreen from "../screens/config/BackupConfigScreen";
import ProfileConfigScreen from "../screens/config/ProfileConfigScreen";

// Screens enfermeria
import EnfermeriaScreen from "../screens/enfermeria/EnfermeriaScreen";
import EnfermeriaPatientDetail from "../screens/enfermeria/PatientDetailScreen";
import EnfermeriaVitalSigns from "../screens/enfermeria/EnfermeriaVitalSignsScreen";
import EnfermeriaNote from "../screens/enfermeria/EnfermeriaNoteScreen";
import EnfermeriaMedications from "../screens/enfermeria/EnfermeriaMedicationsScreen";
import EnfermeriaAssessment from "../screens/enfermeria/EnfermeriaAssessmentScreen";
import EnfermeriaFluidBalance from "../screens/enfermeria/EnfermeriaFluidBalanceScreen";
import EnfermeriaCare from "../screens/enfermeria/EnfermeriaCareScreen";

const Drawer = createDrawerNavigator();
const Stack = createStackNavigator();

const getActiveRoutePath = (state, path = []) => {
  if (!state?.routes?.length) return path;
  const route = state.routes[state.index ?? 0];
  const nextPath = [...path, route.name];
  if (route.state) return getActiveRoutePath(route.state, nextPath);
  return nextPath;
};

// Componente de Sidebar personalizado
const CustomSidebar = ({ navigation, navigation: drawerNavigation }) => {
  const { user, logout } = useAuth();
  const { selectedPatient } = usePatient();
  const activeRoutePath = getActiveRoutePath(navigation.getState?.());

  const handleLogout = () => {
    Alert.alert("Cerrar sesión", "¿Estás seguro de que deseas salir?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Salir", onPress: () => logout() },
    ]);
  };

  const handleNavigation = (screen, params = {}, subScreen) => {
    if (subScreen) {
      navigation.navigate("MainStack", {
        screen,
        params: { screen: subScreen, params },
      });
    } else {
      navigation.navigate("MainStack", { screen, params });
    }
    drawerNavigation.closeDrawer?.();
  };

  const isPatientSelected =
    !!selectedPatient?.id_atencion &&
    !!(selectedPatient?.Id_exp || selectedPatient?.id_exp);
  const role = user?.role;
  const isEnfermeriaRole = role === "enfermero" || role === "enfermeria";
  const isMedicoRole = role === "medico";
  const isAdminRole = role === "admin";
  const hasRouteInPath = (name) => activeRoutePath.includes(name);
  const currentModule = hasRouteInPath("Enfermeria")
    ? "enfermeria"
    : hasRouteInPath("Medico")
      ? "medico"
      : hasRouteInPath("Estudios")
        ? "estudios"
        : "general";
  const menuSections = [];

  const principalItems = [
    {
      name: "Dashboard",
      icon: "home-outline",
      screen: "Dashboard",
      requiresPatient: false,
      params: {},
    },
  ];

  if (isMedicoRole || (isAdminRole && currentModule === "medico")) {
    principalItems.push({
      name: "Panel Médico",
      icon: "speedometer-outline",
      screen: "Medico",
      subScreen: "MedicoList",
      params: {},
      requiresPatient: false,
    });
  }

  if (isEnfermeriaRole || (isAdminRole && currentModule === "enfermeria")) {
    principalItems.push({
      name: "Panel Enfermería",
      icon: "medkit-outline",
      screen: "Enfermeria",
      subScreen: "EnfermeriaList",
      params: {},
      requiresPatient: false,
    });
  }

  if (role === "estudios" || (isAdminRole && currentModule === "estudios")) {
    principalItems.push({
      name: "Panel Estudios",
      icon: "flask-outline",
      screen: "Estudios",
      subScreen: "EstudiosList",
      params: {},
      requiresPatient: false,
    });
  }

  if (principalItems.length) {
    menuSections.push({ title: "PRINCIPAL", items: principalItems });
  }

  if (isMedicoRole || (isAdminRole && currentModule === "medico")) {
    // Base params para todas las pantallas médicas
    const baseParams = {
      id_atencion: selectedPatient?.id_atencion,
      Id_exp: selectedPatient?.Id_exp || selectedPatient?.id_exp,
    };

    menuSections.push({
      title: "HISTORIA CLÍNICA",
      items: [
        {
          name: "Historia Clínica",
          icon: "document-text-outline",
          screen: "Medico",
          subScreen: "HistoriaClinica",
          params: baseParams,
          requiresPatient: true,
        },
      ],
    });

    menuSections.push({
      title: "NOTAS MÉDICAS",
      items: [
        {
          name: "Signos Vitales",
          icon: "heart-outline",
          screen: "Medico",
          subScreen: "VitalSigns",
          params: baseParams,
          requiresPatient: true,
        },
        {
          name: "Nota Médica (SOAP)",
          icon: "document-text-outline",
          screen: "Medico",
          subScreen: "MedicalNote",
          params: baseParams,
          requiresPatient: true,
        },
        {
          name: "Diagnóstico",
          icon: "clipboard-outline",
          screen: "Medico",
          subScreen: "Diagnosis",
          params: baseParams,
          requiresPatient: true,
        },
        {
          name: "Receta",
          icon: "medkit-outline",
          screen: "Medico",
          subScreen: "Prescription",
          params: baseParams,
          requiresPatient: true,
        },
        {
          name: "Exámenes de Laboratorio",
          icon: "flask-outline",
          screen: "Medico",
          subScreen: "LabExams",
          params: baseParams,
          requiresPatient: true,
        },
        {
          name: "Exámenes de Gabinete",
          icon: "scan-outline",
          screen: "Medico",
          subScreen: "ImagingExams",
          params: baseParams,
          requiresPatient: true,
        },
      ],
    });

    menuSections.push({
      title: "DOCUMENTOS",
      items: [
        {
          name: "Imprimir Documentos",
          icon: "print-outline",
          screen: "Medico",
          subScreen: "PrintDocs",
          params: baseParams,
          requiresPatient: true,
        },
        {
          name: "Resultados de Estudios",
          icon: "document-text-outline",
          screen: "Medico",
          subScreen: "StudyResults",
          params: baseParams,
          requiresPatient: true,
        },
      ],
    });
  }

  if (isEnfermeriaRole || (isAdminRole && currentModule === "enfermeria")) {
    const enfermeriaParams = {
      id_atencion: selectedPatient?.id_atencion,
      Id_exp: selectedPatient?.Id_exp || selectedPatient?.id_exp,
    };

    menuSections.push({
      title: "NOTAS DE ENFERMERÍA",
      items: [
        {
          name: "Signos Vitales",
          icon: "heart-outline",
          screen: "Enfermeria",
          subScreen: "EnfermeriaVitalSigns",
          params: enfermeriaParams,
          requiresPatient: true,
        },
        {
          name: "Nota de Enfermería",
          icon: "document-text-outline",
          screen: "Enfermeria",
          subScreen: "EnfermeriaNote",
          params: enfermeriaParams,
          requiresPatient: true,
        },
        {
          name: "Administración Medicamentos",
          icon: "medkit-outline",
          screen: "Enfermeria",
          subScreen: "EnfermeriaMedications",
          params: enfermeriaParams,
          requiresPatient: true,
        },
        {
          name: "Valoración de Enfermería",
          icon: "clipboard-outline",
          screen: "Enfermeria",
          subScreen: "EnfermeriaAssessment",
          params: enfermeriaParams,
          requiresPatient: true,
        },
        {
          name: "Balance Hídrico",
          icon: "water-outline",
          screen: "Enfermeria",
          subScreen: "EnfermeriaFluidBalance",
          params: enfermeriaParams,
          requiresPatient: true,
        },
        {
          name: "Cuidados de Enfermería",
          icon: "shield-checkmark-outline",
          screen: "Enfermeria",
          subScreen: "EnfermeriaCare",
          params: enfermeriaParams,
          requiresPatient: true,
        },
      ],
    });
  }

  if (
    role === "estudios" ||
    currentModule === "estudios" ||
    (isAdminRole && currentModule === "estudios")
  ) {
    menuSections.push({
      title: "ESTUDIOS",
      items: [
        {
          name: "Solicitudes Lab",
          icon: "flask-outline",
          screen: "Estudios",
          subScreen: "EstudiosList",
          params: { initialSection: "solicitudes_lab" },
          requiresPatient: false,
        },
        {
          name: "Solicitudes Gabinete",
          icon: "scan-outline",
          screen: "Estudios",
          subScreen: "EstudiosList",
          params: { initialSection: "solicitudes_gab" },
          requiresPatient: false,
        },
        {
          name: "Resultados Lab",
          icon: "document-text-outline",
          screen: "Estudios",
          subScreen: "EstudiosList",
          params: { initialSection: "resultados_lab" },
          requiresPatient: false,
        },
        {
          name: "Resultados Gabinete",
          icon: "folder-open-outline",
          screen: "Estudios",
          subScreen: "EstudiosList",
          params: { initialSection: "resultados_gab" },
          requiresPatient: false,
        },
      ],
    });
  }

  const roleItems = [];

  if (role === "admin" || role === "administrativo") {
    roleItems.push({
      name: "Administración",
      icon: "settings-outline",
      screen: "Admin",
      requiresPatient: false,
      params: {},
    });
  }

  if (role === "estudios" || role === "admin") {
    roleItems.push({
      name: "Estudios",
      icon: "flask-outline",
      screen: "Estudios",
      requiresPatient: false,
      params: {},
    });
  }

  if (isAdminRole || isEnfermeriaRole) {
    roleItems.push({
      name: "Enfermería",
      icon: "medkit-outline",
      screen: "Enfermeria",
      subScreen: "EnfermeriaList",
      requiresPatient: false,
      params: {},
    });
  }

  if (isAdminRole || isMedicoRole) {
    roleItems.push({
      name: "Médico",
      icon: "pulse-outline",
      screen: "Medico",
      subScreen: "MedicoList",
      requiresPatient: false,
      params: {},
    });
  }

  if (role === "admin") {
    roleItems.push({
      name: "Configuración",
      icon: "options-outline",
      screen: "Config",
      requiresPatient: false,
      params: {},
    });
  }

  if (roleItems.length) {
    menuSections.push({ title: "MÓDULOS", items: roleItems });
  }

  const roleLabels = {
    admin: "ADMIN",
    administrativo: "ADMINISTRATIVO",
    medico: "MÉDICO",
    enfermero: "ENFERMERÍA",
    enfermeria: "ENFERMERÍA",
    estudios: "ESTUDIOS",
  };
  const roleLabel = roleLabels[role] || "USUARIO";
  const userPrefix = isEnfermeriaRole ? "Enf." : "Dr.";

  return (
    <View style={styles.sidebarContainer}>
      <LinearGradient
        colors={["#667eea", "#764ba2"]}
        style={styles.sidebarHeader}
      >
        <View style={styles.brandContainer}>
          <Text style={styles.brandTitle}>INEO</Text>
          <Text style={styles.brandVersion}>v2.0</Text>
        </View>
        <View style={styles.userInfo}>
          <View style={styles.userAvatar}>
            <Ionicons name="person-circle-outline" size={44} color="#fff" />
          </View>
          <View style={styles.userTextContainer}>
            <Text style={styles.userName}>{userPrefix} {user?.username}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>{roleLabel}</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.menuContainer}>
        {menuSections.map((section, sectionIdx) => (
          <View key={sectionIdx} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.items.map((item, itemIdx) => {
              const isEnabled = !item.requiresPatient || isPatientSelected;
              return (
                <TouchableOpacity
                  key={itemIdx}
                  style={[
                    styles.menuItem,
                    !isEnabled && styles.menuItemDisabled,
                  ]}
                  onPress={() => {
                    if (isEnabled) {
                      handleNavigation(
                        item.screen,
                        item.params,
                        item.subScreen,
                      );
                    } else {
                      Alert.alert(
                        "Información",
                        "Seleccione un paciente primero",
                      );
                    }
                  }}
                >
                  <Ionicons
                    name={item.icon}
                    size={20}
                    color={!isEnabled ? "#a0aec0" : "#718096"}
                    style={styles.menuIcon}
                  />
                  <Text
                    style={[
                      styles.menuText,
                      !isEnabled && styles.menuTextDisabled,
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

// Stack para el módulo médico
function MedicoStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MedicoList" component={MedicoScreen} />
      <Stack.Screen name="PatientDetail" component={PatientDetailScreen} />
      <Stack.Screen name="HistoriaClinica" component={HistoriaClinicaScreen} />
      <Stack.Screen name="VitalSigns" component={VitalSignsScreen} />
      <Stack.Screen name="MedicalNote" component={MedicalNoteScreen} />
      <Stack.Screen name="Diagnosis" component={DiagnosisScreen} />
      <Stack.Screen name="Prescription" component={PrescriptionScreen} />
      <Stack.Screen name="LabExams" component={LabExamsScreen} />
      <Stack.Screen name="ImagingExams" component={ImagingExamsScreen} />
      <Stack.Screen name="PrintDocs" component={PrintDocsScreen} />
      <Stack.Screen name="StudyResults" component={StudyResultsScreen} />
    </Stack.Navigator>
  );
}

// ... (El resto del código se mantiene igual)
function EnfermeriaStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="EnfermeriaList" component={EnfermeriaScreen} />
      <Stack.Screen
        name="EnfermeriaPatientDetail"
        component={EnfermeriaPatientDetail}
      />
      <Stack.Screen
        name="EnfermeriaVitalSigns"
        component={EnfermeriaVitalSigns}
      />
      <Stack.Screen name="EnfermeriaNote" component={EnfermeriaNote} />
      <Stack.Screen
        name="EnfermeriaMedications"
        component={EnfermeriaMedications}
      />
      <Stack.Screen
        name="EnfermeriaAssessment"
        component={EnfermeriaAssessment}
      />
      <Stack.Screen
        name="EnfermeriaFluidBalance"
        component={EnfermeriaFluidBalance}
      />
      <Stack.Screen
        name="EnfermeriaCare"
        component={EnfermeriaCare}
      />
    </Stack.Navigator>
  );
}

function EstudiosStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="EstudiosList" component={EstudiosScreen} />
      <Stack.Screen name="SubirResultado" component={SubirResultadoScreen} />
      <Stack.Screen name="VerResultadoLab" component={VerResultadoLabScreen} />
      <Stack.Screen name="VerResultadoGab" component={VerResultadoGabScreen} />
      <Stack.Screen
        name="EditarResultadoLab"
        component={EditarResultadoLabScreen}
      />
      <Stack.Screen
        name="EditarResultadoGab"
        component={EditarResultadoGabScreen}
      />
    </Stack.Navigator>
  );
}

function MainStack() {
  const { user } = useAuth();
  const role = user?.role;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Dashboard" component={DashboardScreen} />

      {(role === "admin" || role === "administrativo") && (
        <Stack.Screen name="Admin" component={AdminScreen} />
      )}
      {(role === "admin" || role === "administrativo") && (
        <Stack.Screen name="Pacientes" component={PacientesScreen} />
      )}
      {(role === "admin" || role === "administrativo") && (
        <Stack.Screen name="PacienteDetail" component={PacienteDetailScreen} />
      )}
      {(role === "admin" || role === "administrativo") && (
        <Stack.Screen name="NuevoPaciente" component={NuevoPacienteScreen} />
      )}
      {(role === "admin" || role === "administrativo") && (
        <Stack.Screen name="Censo" component={CensoScreen} />
      )}
      {(role === "admin" || role === "administrativo") && (
        <Stack.Screen name="CorteCaja" component={CorteCajaScreen} />
      )}
      {(role === "admin" || role === "administrativo") && (
        <Stack.Screen name="Camas" component={CamasScreen} />
      )}

      {(role === "admin" || role === "enfermero" || role === "enfermeria") && (
        <Stack.Screen name="Enfermeria" component={EnfermeriaStack} />
      )}

      {(role === "admin" || role === "medico") && (
        <Stack.Screen name="Medico" component={MedicoStack} />
      )}

      {(role === "admin" || role === "medico" || role === "estudios") && (
        <Stack.Screen name="Estudios" component={EstudiosStack} />
      )}

      {role === "admin" && (
        <>
          <Stack.Screen name="Config" component={ConfigScreen} />
          <Stack.Screen
            name="GeneralSettings"
            component={GeneralSettingsScreen}
          />
          <Stack.Screen
            name="UsuariosConfig"
            component={UsuariosConfigScreen}
          />
          <Stack.Screen name="CamasConfig" component={CamasConfigScreen} />
          <Stack.Screen
            name="ServiciosConfig"
            component={ServiciosConfigScreen}
          />
          <Stack.Screen
            name="AutomationConfig"
            component={AutomationConfigScreen}
          />
          <Stack.Screen name="BackupConfig" component={BackupConfigScreen} />
          <Stack.Screen name="ProfileConfig" component={ProfileConfigScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function MainNavigator() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomSidebar {...props} />}
      screenOptions={{
        headerShown: false,
        drawerType: "front",
        drawerStyle: { width: 280, backgroundColor: "transparent" },
      }}
    >
      <Drawer.Screen name="MainStack" component={MainStack} />
    </Drawer.Navigator>
  );
}

const styles = StyleSheet.create({
  // ... (tus estilos se mantienen igual)
  sidebarContainer: { flex: 1, backgroundColor: "#1a202c" },
  sidebarHeader: {
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
  brandTitle: { fontSize: 24, fontWeight: "bold", color: "#fff" },
  brandVersion: { fontSize: 12, color: "rgba(255,255,255,0.7)" },
  userInfo: { flexDirection: "row", alignItems: "center" },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  userTextContainer: { flex: 1 },
  userName: { fontSize: 16, fontWeight: "600", color: "#fff", marginBottom: 4 },
  roleBadge: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  roleText: { fontSize: 10, color: "#fff", fontWeight: "bold" },
  menuContainer: { flex: 1, paddingTop: 16 },
  section: { marginBottom: 20 },
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
  menuItemDisabled: { opacity: 0.5 },
  menuIcon: { marginRight: 12, width: 24 },
  menuText: { fontSize: 14, color: "#e2e8f0", fontWeight: "500" },
  menuTextDisabled: { color: "#a0aec0" },
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
