import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Base URL por plataforma
const API_URL =
  Platform.OS === 'web'
    ? 'http://localhost:5001/api/v1'
    : Constants.expoConfig?.extra?.API_URL ||
<<<<<<< HEAD
      'http://192.168.1.6:5001/api/v1';
=======
      'http://192.168.100.4:5001/api/v1';
>>>>>>> fbb3f20f960c02aaead36523a571ca0972995f50

// Storage compatible web + mobile
const storage = {
  async getItem(key) {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    }
    return AsyncStorage.getItem(key);
  },
  async setItem(key, value) {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
      return;
    }
    return AsyncStorage.setItem(key, value);
  },
  async removeItem(key) {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
      return;
    }
    return AsyncStorage.removeItem(key);
  },
};

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 🔐 Interceptor: agregar token
api.interceptors.request.use(
  async (config) => {
    const token = await storage.getItem('@ineo_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 🚨 Interceptor: token inválido
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await storage.removeItem('@ineo_token');
      await storage.removeItem('@ineo_user');
    }
    return Promise.reject(error);
  }
);

export default api;