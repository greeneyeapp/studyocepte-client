import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import tr from './locales/tr.json';
import es from './locales/es.json'; // es.json import edildi

const resources = {
  en: { translation: en },
  tr: { translation: tr },
  es: { translation: es }, // es kaynakları eklendi
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en', // Varsayılan dil artık 'en' olarak ayarlandı, gereksinimlere göre değiştirilebilir
    fallbackLng: 'en', // Yedek dil 'en' olarak ayarlandı
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;