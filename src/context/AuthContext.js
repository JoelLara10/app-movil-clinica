import React, { createContext, useState, useContext, useEffect } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

const AuthContext = createContext({});
export const useAuth = () => useContext(AuthContext);

const isValidUser = (user) => (
  user
  && typeof user === 'object'
  && typeof user.id === 'string'
  && typeof user.username === 'string'
  && typeof user.role === 'string'
);

const isValidAuthResponse = (data) => (
  data
  && typeof data.token === 'string'
  && data.token.length > 0
  && data.token.length <= 4096
  && isValidUser(data.user)
);

// Helpers para storage cross-platform
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

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadStoredData();
  }, []);

  const loadStoredData = async () => {
    try {
      const storedUser = await storage.getItem('@ineo_user');
      const storedToken = await storage.getItem('@ineo_token');

      if (!storedUser || !storedToken) {
        return;
      }

      const parsedUser = JSON.parse(storedUser);

      // SEGURIDAD (Joel): los datos locales pueden quedar vencidos o ser
      // alterados. Primero se valida su estructura antes de utilizarlos.
      if (!isValidUser(parsedUser)) {
        throw new Error('Invalid stored session');
      }

      api.defaults.headers.Authorization = `Bearer ${storedToken}`;

      // SEGURIDAD (Joel): la sesión guardada se confirma con /auth/me.
      // Solo después de que la API valide el JWT y el estado de la cuenta
      // se permite que la aplicación muestre módulos autenticados.
      const response = await api.get('/auth/me');

      if (!isValidUser(response.data)) {
        throw new Error('Invalid session response');
      }

      await storage.setItem('@ineo_user', JSON.stringify(response.data));
      setUser(response.data);
    } catch (_error) {
      // SEGURIDAD (Joel): cualquier sesión inválida se elimina por completo
      // y no se muestran tokens ni detalles internos en los registros.
      await storage.removeItem('@ineo_token');
      await storage.removeItem('@ineo_user');
      delete api.defaults.headers.Authorization;
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    setError(null);

    try {
      const response = await api.post('/auth/login', { username, password });

      if (!isValidAuthResponse(response.data)) {
        const invalidResponseError = new Error('Invalid authentication response');
        invalidResponseError.code = 'INVALID_AUTH_RESPONSE';
        throw invalidResponseError;
      }

      const { token, user: userData } = response.data;

      await storage.setItem('@ineo_token', token);
      await storage.setItem('@ineo_user', JSON.stringify(userData));

      api.defaults.headers.Authorization = `Bearer ${token}`;
      setUser(userData);

      return { success: true };
    } catch (err) {
      const reason = err.response?.status === 401
        ? 'invalid_credentials'
        : (!err.response && err.request ? 'connection' : 'unexpected');

      const message = reason === 'connection'
        ? 'Error de conexión'
        : 'No fue posible iniciar sesión';

      setError(message);
      return { success: false, reason };
    }
  };

  const logout = async () => {
    await storage.removeItem('@ineo_token');
    await storage.removeItem('@ineo_user');
    setUser(null);
    delete api.defaults.headers.Authorization;
  };

  const updateUser = async (userData) => {
    setUser(userData);
    await storage.setItem('@ineo_user', JSON.stringify(userData));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        logout,
        updateUser,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};