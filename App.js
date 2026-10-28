// App.js
import React, { useEffect, useRef } from 'react';
import { AppState, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useLanguage } from './src/context/LanguageContext';
import { registerMonitoringPush } from './src/services/monitoringNotifications';
import { clearMonitoringCache } from './src/services/monitoringCache';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { PatientProvider } from './src/context/PatientContext';
import { LanguageProvider } from './src/context/LanguageContext';
import AuthNavigator from './src/navigation/AuthNavigator';
import MainNavigator from './src/navigation/MainNavigator';
import { usePreventScreenCapture } from 'expo-screen-capture';

const navigationRef = createNavigationContainerRef();
function AppContent() {
  usePreventScreenCapture('ineo-clinical-data');
  const { isAuthenticated, loading, user } = useAuth();
  const { lang } = useLanguage();
  const pendingResponse = useRef(null);
  const clinical = ['admin', 'medico', 'enfermero', 'enfermeria'].includes(user?.role);
  const openNotification = () => {
    const response = pendingResponse.current;
    if (!response || !isAuthenticated || !clinical || !navigationRef.isReady()) return;
    const data = response.notification.request.content.data;
    pendingResponse.current = null;
    if (data?.kind !== 'monitoring' || data.recipientUserId !== user?.id || !Number.isSafeInteger(data.patientId) || data.patientId <= 0) return;
    navigationRef.navigate('MainStack', { screen: 'MonitoreoDetalle', params: { patientId: data.patientId } });
    if (Platform.OS !== 'web') Notifications.clearLastNotificationResponseAsync().catch(() => {});
  };
  useEffect(() => {
    if (Platform.OS === 'web') return;
    let active = true;
    const sync = () => { if (isAuthenticated && clinical) registerMonitoringPush(lang).catch(() => {}); };
    sync();
    Notifications.getLastNotificationResponseAsync().then(response => { if (active && response) { pendingResponse.current = response; openNotification(); } }).catch(() => {});
    const tapped = Notifications.addNotificationResponseReceivedListener(response => { pendingResponse.current = response; openNotification(); });
    const received = Notifications.addNotificationReceivedListener(() => clearMonitoringCache());
    const state = AppState.addEventListener('change', value => { if (value === 'active') sync(); });
    const token = Notifications.addPushTokenListener(() => sync());
    return () => { active = false; tapped.remove(); received.remove(); state.remove(); token.remove(); };
  }, [isAuthenticated, user?.id, clinical, lang]);

  if (loading) {
    return null;
  }

  return (
    <NavigationContainer ref={navigationRef} onReady={openNotification}>
      {isAuthenticated ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <AuthProvider>
          <PatientProvider>
            <AppContent />
          </PatientProvider>
        </AuthProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}
