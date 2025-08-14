import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import en from './locales/en.json';
import tr from './locales/tr.json';
import es from './locales/es.json';

const LANGUAGE_STORAGE_KEY = 'user_language';

const resources = {
  en: { translation: en },
  tr: { translation: tr },
  es: { translation: es },
};

// Dil yükleme fonksiyonu
const loadLanguage = async () => {
  try {
    const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    return savedLanguage || 'en';
  } catch (error) {
    return 'en';
  }
};

// i18n'i initialize et
const initializeI18n = async () => {
  const savedLanguage = await loadLanguage();
  
  i18n
    .use(initReactI18next)
    .init({
      resources,
      lng: savedLanguage,
      fallbackLng: 'en',
      interpolation: {
        escapeValue: false,
      },
    });
};

// Initialize et
initializeI18n();

export default i18n;