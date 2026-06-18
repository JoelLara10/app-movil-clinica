// src/navigation/MainNavigator.js
import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createStackNavigator } from '@react-navigation/stack';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { usePatient } from '../context/PatientContext';
import DashboardScreen from '../screens/dashboard/DashboardScreen';

// Importar screens
import AdminScreen from '../screens/admin/AdminScreen';
import MedicoScreen from '../screens/medico/MedicoScreen';
import EstudiosScreen from '../screens/estudios/EstudiosScreen';
import ConfigScreen from '../screens/config/ConfigScreen';
import PatientDetailScreen from '../screens/medico/PatientDetailScreen';

//Screens Estudios
import SubirResultadoScreen from '../screens/estudios/SubirResultadoScreen';
import VerResultadoLabScreen from '../screens/estudios/VerResultadoLabScreen';
import VerResultadoGabScreen from '../screens/estudios/VerResultadoGabScreen';
import EditarResultadoLabScreen from '../screens/estudios/EditarResultadoLabScreen';
import EditarResultadoGabScreen from '../screens/estudios/EditarResultadoGabScreen';

// Screens médicas
import HistoriaClinicaScreen from '../screens/medico/HistoriaClinicaScreen';
import VitalSignsScreen from '../screens/medico/VitalSignsScreen';
import MedicalNoteScreen from '../screens/medico/MedicalNoteScreen';
import DiagnosisScreen from '../screens/medico/DiagnosisScreen';
import PrescriptionScreen from '../screens/medico/PrescriptionScreen';
import LabExamsScreen from '../screens/medico/LabExamsScreen';
import ImagingExamsScreen from '../screens/medico/ImagingExamsScreen';
import PrintDocsScreen from '../screens/medico/PrintDocsScreen';
import StudyResultsScreen from '../screens/medico/StudyResultsScreen';

const Drawer = createDrawerNavigator();
const Stack = createStackNavigator();

// Componente de Sidebar personalizado
const CustomSidebar = ({ navigation, navigation: drawerNavigation }) => {
  const { user, logout } = useAuth();
  const { selectedPatient } = usePatient();

  const handleLogout = () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro de que deseas salir?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Salir', onPress: () => logout() }
      ]
    );
  };

  const handleNavigation = (screen, params = {}, subScreen) => {
    if (subScreen) {
      navigation.navigate('MainStack', {
        screen,
        params: { screen: subScreen, params },
      });
    } else {
      navigation.navigate('MainStack', { screen, params });
    }
    drawerNavigation.closeDrawer?.();
  };

  const isPatientSelected = selectedPatient?.id_atencion && selectedPatient?.Id_exp;
  const role = user?.role;
  const menuSections = [];

  const principalItems = [
    {
      name: 'Dashboard',
      icon: 'home-outline',
      screen: 'Dashboard',
      requiresPatient: false,
      params: {},
    },
  ];

  if (role === 'medico' || role === 'admin') {
    principalItems.push({
      name: 'Panel Médico',
      icon: 'speedometer-outline',
      screen: 'Medico',
      subScreen: 'MedicoList',
      params: {},
      requiresPatient: false,
    });
  }

  if (principalItems.length) {
    menuSections.push({ title: 'PRINCIPAL', items: principalItems });
  }

  if (role === 'medico' || role === 'admin') {
    menuSections.push({
      title: 'HISTORIA CLÍNICA',
      items: [
        {
          name: 'Historia Clínica',
          icon: 'document-text-outline',
          screen: 'Medico',
          subScreen: 'HistoriaClinica',
          params: selectedPatient || {},
          requiresPatient: true,
        },
      ],
    });

    menuSections.push({
      title: 'NOTAS MÉDICAS',
      items: [
        {
          name: 'Signos Vitales',
          icon: 'heart-outline',
          screen: 'Medico',
          subScreen: 'VitalSigns',
          params: { id_atencion: selectedPatient?.id_atencion },
          requiresPatient: true,
        },
        {
          name: 'Nota Médica (SOAP)',
          icon: 'document-text-outline',
          screen: 'Medico',
          subScreen: 'MedicalNote',
          params: { id_atencion: selectedPatient?.id_atencion },
          requiresPatient: true,
        },
        {
          name: 'Diagnóstico',
          icon: 'clipboard-outline',
          screen: 'Medico',
          subScreen: 'Diagnosis',
          params: { id_atencion: selectedPatient?.id_atencion },
          requiresPatient: true,
        },
        {
          name: 'Receta',
          icon: 'medkit-outline',
          screen: 'Medico',
          subScreen: 'Prescription',
          params: { id_atencion: selectedPatient?.id_atencion },
          requiresPatient: true,
        },
        {
          name: 'Exámenes de Laboratorio',
          icon: 'flask-outline',
          screen: 'Medico',
          subScreen: 'LabExams',
          params: { id_atencion: selectedPatient?.id_atencion },
          requiresPatient: true,
        },
        {
          name: 'Exámenes de Gabinete',
          icon: 'scan-outline',
          screen: 'Medico',
          subScreen: 'ImagingExams',
          params: { id_atencion: selectedPatient?.id_atencion },
          requiresPatient: true,
        },
      ],
    });

    menuSections.push({
      title: 'DOCUMENTOS',
      items: [
        {
          name: 'Imprimir Documentos',
          icon: 'print-outline',
          screen: 'Medico',
          subScreen: 'PrintDocs',
          params: { id_atencion: selectedPatient?.id_atencion },
          requiresPatient: true,
        },
        {
          name: 'Resultados de Estudios',
          icon: 'document-text-outline',
          screen: 'Medico',
          subScreen: 'StudyResults',
          params: { id_atencion: selectedPatient?.id_atencion },
          requiresPatient: true,
        },
      ],
    });
  }

  const roleItems = [];

  if (role === 'admin' || role === 'administrativo') {
    roleItems.push({
      name: 'Administración',
      icon: 'settings-outline',
      screen: 'Admin',
      requiresPatient: false,
      params: {},
    });
  }

  if (role === 'estudios' || role === 'admin') {
    roleItems.push({
      name: 'Estudios',
      icon: 'flask-outline',
      screen: 'Estudios',
      requiresPatient: false,
      params: {},
    });
  }

  if (role === 'admin') {
    roleItems.push({
      name: 'Configuración',
      icon: 'options-outline',
      screen: 'Config',
      requiresPatient: false,
      params: {},
    });
  }

  if (roleItems.length) {
    menuSections.push({ title: 'MÓDULOS', items: roleItems });
  }
  

  return (
    <View style={styles.sidebarContainer}>
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.sidebarHeader}>
        <View style={styles.brandContainer}>
          <Text style={styles.brandTitle}>INEO</Text>
          <Text style={styles.brandVersion}>v2.0</Text>
        </View>
        <View style={styles.userInfo}>
          <View style={styles.userAvatar}>
            <Ionicons name="person-circle-outline" size={44} color="#fff" />
          </View>
          <View style={styles.userTextContainer}>
            <Text style={styles.userName}>Dr. {user?.username}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>MÉDICO</Text>
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
                  style={[styles.menuItem, !isEnabled && styles.menuItemDisabled]}
                  onPress={() => {
                      if (isEnabled) {
                        handleNavigation(item.screen, item.params, item.subScreen);
                      } else {
                        Alert.alert('Información', 'Seleccione un paciente primero');
                      }
                    }}
                >
                  <Ionicons 
                    name={item.icon} 
                    size={20} 
                    color={!isEnabled ? '#a0aec0' : '#718096'} 
                    style={styles.menuIcon} 
                  />
                  <Text style={[styles.menuText, !isEnabled && styles.menuTextDisabled]}>
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

// Stack para el módulo de estudios
function EstudiosStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="EstudiosList" component={EstudiosScreen} />
      <Stack.Screen name="SubirResultado" component={SubirResultadoScreen} />
      <Stack.Screen name="VerResultadoLab" component={VerResultadoLabScreen} />
      <Stack.Screen name="VerResultadoGab" component={VerResultadoGabScreen} />
      <Stack.Screen name="EditarResultadoLab" component={EditarResultadoLabScreen} />
      <Stack.Screen name="EditarResultadoGab" component={EditarResultadoGabScreen} />
    </Stack.Navigator>
  );
}

// Stack principal
function MainStack() {
  const { user } = useAuth();
  const role = user?.role;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Dashboard" component={DashboardScreen} />
      
      {(role === 'admin' || role === 'administrativo') && (
        <Stack.Screen name="Admin" component={AdminScreen} />
      )}
      
      {(role === 'admin' || role === 'medico') && (
        <Stack.Screen name="Medico" component={MedicoStack} />
      )}
      
      {(role === 'admin' || role === 'medico' || role === 'estudios') && (
        <Stack.Screen name="Estudios" component={EstudiosStack} />
      )}
      
      {(role === 'admin') && (
        <Stack.Screen name="Config" component={ConfigScreen} />
      )}
    </Stack.Navigator>
  );
}

// Navegador principal
export default function MainNavigator() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomSidebar {...props} />}
      screenOptions={{
        headerShown: false,
        drawerType: 'front',
        drawerStyle: {
          width: 280,
          backgroundColor: 'transparent',
        },
      }}
    >
      <Drawer.Screen name="MainStack" component={MainStack} />
    </Drawer.Navigator>
  );
}

const styles = StyleSheet.create({
  sidebarContainer: {
    flex: 1,
    backgroundColor: '#1a202c',
  },
  sidebarHeader: {
    paddingTop: 50,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  brandContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  brandVersion: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userTextContainer: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  roleBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  roleText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: 'bold',
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
    fontWeight: '600',
    color: '#a0aec0',
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
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
    color: '#e2e8f0',
    fontWeight: '500',
  },
  menuTextDisabled: {
    color: '#a0aec0',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginHorizontal: 8,
    marginBottom: 20,
    borderRadius: 10,
    borderTopWidth: 1,
    borderTopColor: '#2d3748',
  },
  logoutText: {
    fontSize: 14,
    color: '#e53e3e',
    fontWeight: '500',
    marginLeft: 12,
  },
});