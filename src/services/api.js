import axios from "axios";
import Constants from "expo-constants";
import { clearStoredSession, getToken } from "./secureStorage";

// Base URL por plataforma
export const API_URL = Constants.expoConfig?.extra?.API_URL;

if (!API_URL) {
  throw new Error("API_URL no está configurada");
}

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// 🔐 Interceptor: agregar token
api.interceptors.request.use(
  async (config) => {
    const token = await getToken();
    if (config.pushSessionToken && token !== config.pushSessionToken) {
      throw Object.assign(new Error('session_changed'), { code: 'ERR_SESSION_CHANGED' });
    }
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// 🚨 Interceptor: token inválido
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await clearStoredSession();
    }
    return Promise.reject(error);
  },
);

export default api;
