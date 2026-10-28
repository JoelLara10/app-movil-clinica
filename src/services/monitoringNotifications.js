import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import api from './api';
import { getToken } from './secureStorage';

const TOKEN_KEY = 'oftalcore_push_token';
const OPT_IN = 'oftalcore_push_opt_in';
export const pushAvailable = () => Platform.OS !== 'web' && Device.isDevice && !!Constants.expoConfig?.extra?.pushConfigured;
if (Platform.OS !== 'web') Notifications.setNotificationHandler({ handleNotification: async () => ({
  shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false,
}) });

export async function registerMonitoringPush(language = 'es', requestPermission = false) {
  if (!pushAvailable()) return 'pushUnavailable';
  const session = await getToken();
  if (!session) return 'pushDisabled';
  if (!requestPermission && await SecureStore.getItemAsync(OPT_IN) !== 'true') return 'pushDisabled';
  if (Platform.OS === 'android') await Notifications.setNotificationChannelAsync('monitoring', {
    name: 'OftalCore', importance: Notifications.AndroidImportance.HIGH, sound: 'default',
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PRIVATE,
  });
  let permission = await Notifications.getPermissionsAsync();
  if (!permission.granted && requestPermission) permission = await Notifications.requestPermissionsAsync();
  if (!permission.granted) {
    await unregisterMonitoringPush();
    return 'pushDenied';
  }
  const projectId = Constants.expoConfig?.extra?.eas?.projectId || Constants.easConfig?.projectId;
  if (!projectId) return 'pushUnavailable';
  const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  if (await getToken() !== session) return 'pushDisabled';
  await api.put('/monitoring/push-devices', { token, language, platform: Platform.OS }, { pushSessionToken: session, timeout: 10000 });
  if (await getToken() !== session) return 'pushDisabled';
  await SecureStore.setItemAsync(TOKEN_KEY, token);
  await SecureStore.setItemAsync(OPT_IN, 'true');
  return 'pushEnabled';
}
export async function unregisterMonitoringPush() {
  if (Platform.OS === 'web') return;
  const token = await SecureStore.getItemAsync(TOKEN_KEY);
  const session = await getToken();
  if (token && session) await api.delete('/monitoring/push-devices', { data: { token }, pushSessionToken: session, timeout: 5000 });
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.setItemAsync(OPT_IN, 'false');
}
