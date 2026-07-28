import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { languages } from '../i18n';

const LanguageContext = createContext({});
export const useLanguage = () => useContext(LanguageContext);

const storage = {
  async getItem(key) {
    if (Platform.OS === 'web') return localStorage.getItem(key);
    return AsyncStorage.getItem(key);
  },
  async setItem(key, value) {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
      return;
    }
    return AsyncStorage.setItem(key, value);
  },
};

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState('es');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const stored = await storage.getItem('@ineo_language');
        if (stored && languages[stored]) {
          setLang(stored);
        }
      } catch (_) {}
      setReady(true);
    })();
  }, []);

  const setLanguage = async (newLang) => {
    if (!languages[newLang]) return;
    setLang(newLang);
    try {
      await storage.setItem('@ineo_language', newLang);
    } catch (_) {}
  };

  const t = useCallback((key, params = {}) => {
    const keys = key.split('.');
    let value = languages[lang];
    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k];
      } else {
        return key;
      }
    }
    if (typeof value !== 'string') return value || key;

    return Object.entries(params).reduce(
      (text, [name, replacement]) =>
        text.replaceAll(`{{${name}}}`, String(replacement)),
      value
    );
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLanguage, t, ready }}>
      {children}
    </LanguageContext.Provider>
  );
};
