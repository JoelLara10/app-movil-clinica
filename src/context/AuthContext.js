import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadStoredData();
  }, []);

  const loadStoredData = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('@ineo_user');
      const storedToken = await AsyncStorage.getItem('@ineo_token');

      if (storedUser && storedToken) {
        setUser(JSON.parse(storedUser));
        api.defaults.headers.Authorization = `Bearer ${storedToken}`;
      }
    } catch (error) {
      console.error('Error loading stored data:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    setError(null);
    try {
      const response = await api.post('/auth/login', { username, password });
      const { token, user: userData } = response.data;

      await AsyncStorage.setItem('@ineo_token', token);
      await AsyncStorage.setItem('@ineo_user', JSON.stringify(userData));

      api.defaults.headers.Authorization = `Bearer ${token}`;
      setUser(userData);

      return { success: true };
    } catch (error) {
      const message = error.response?.data?.error || 'Error de conexión';
      setError(message);
      return { success: false, error: message };
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem('@ineo_token');
    await AsyncStorage.removeItem('@ineo_user');
    setUser(null);
    delete api.defaults.headers.Authorization;
  };

  const updateUser = (userData) => {
    setUser(userData);
    AsyncStorage.setItem('@ineo_user', JSON.stringify(userData));
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