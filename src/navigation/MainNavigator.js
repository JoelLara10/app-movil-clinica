// src/navigation/MainNavigator.js
import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createStackNavigator } from '@react-navigation/stack';
import { View, Text } from 'react-native';
import { useAuth } from '../context/AuthContext';
import DashboardScreen from '../screens/dashboard/DashboardScreen';

// Importar screens
import AdminScreen from '../screens/admin/AdminScreen';
import MedicoScreen from '../screens/medico/MedicoScreen';
import EstudiosScreen from '../screens/estudios/EstudiosScreen';
import ConfigScreen from '../screens/config/ConfigScreen';

const Drawer = createDrawerNavigator();
const Stack = createStackNavigator();

// Componente de icono personalizado para el drawer (usando emojis)
const DrawerIcon = ({ emoji }) => {
  return (
    <View style={{ width: 24, alignItems: 'center', marginRight: 8 }}>
      <Text style={{ fontSize: 18 }}>{emoji}</Text>
    </View>
  );
};

// Stack principal que contiene todas las pantallas
function MainStack() {
  const { user } = useAuth();
  const role = user?.role;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Dashboard" component={DashboardScreen} />
      
      {/* Pantallas según el rol */}
      {(role === 'admin' || role === 'administrativo') && (
        <Stack.Screen name="Admin" component={AdminScreen} />
      )}
      
      {(role === 'admin' || role === 'medico') && (
        <Stack.Screen name="Medico" component={MedicoScreen} />
      )}
      
      {(role === 'admin' || role === 'medico' || role === 'estudios') && (
        <Stack.Screen name="Estudios" component={EstudiosScreen} />
      )}
      
      {(role === 'admin') && (
        <Stack.Screen name="Config" component={ConfigScreen} />
      )}
    </Stack.Navigator>
  );
}

// Navegador principal con drawer (menú lateral)
export default function MainNavigator() {
  const { user } = useAuth();
  
  return (
    <Drawer.Navigator
      screenOptions={{
        headerShown: false,
        drawerActiveTintColor: '#667eea',
        drawerInactiveTintColor: '#718096',
        drawerStyle: {
          backgroundColor: '#fff',
          width: 280,
        },
        drawerLabelStyle: {
          fontSize: 14,
          fontWeight: '500',
        },
        drawerItemStyle: {
          borderRadius: 8,
          marginHorizontal: 8,
          marginVertical: 4,
        },
      }}
    >
      <Drawer.Screen 
        name="Home" 
        component={MainStack}
        options={{
          drawerLabel: ({ color }) => (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontSize: 18, marginRight: 12 }}>🏠</Text>
              <Text style={{ color: color, fontSize: 14, fontWeight: '500' }}>Inicio</Text>
            </View>
          ),
          title: 'Inicio',
        }}
      />
    </Drawer.Navigator>
  );
}