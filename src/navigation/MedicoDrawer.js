import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import Sidebar from '../components/Sidebar';

// Stack médico
import MedicoStack from './MedicoStack';

const Drawer = createDrawerNavigator();

export default function MedicoDrawer() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <Sidebar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Drawer.Screen
        name="MedicoStack"
        component={MedicoStack}
      />
    </Drawer.Navigator>
  );
}