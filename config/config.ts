// config/config.ts

/**
 * Uygulamanın yapılandırma ayarlarını içerir.
 * API adresleri gibi değişkenler burada merkezi olarak yönetilir.
 */

// Geliştirme ortamı için yerel API'nizin IP adresini buraya yazın.
// ÖNEMLİ: 'localhost' KULLANMAYIN. Mobil cihazınızın, bilgisayarınızla
// aynı ağda olduğunu varsayarak bilgisayarınızın yerel IP adresini kullanın.
const DEVELOPMENT_API_URL = 'http://192.168.1.10:8000';

// Üretim ortamı için sunucunuzun alan adını buraya yazacaksınız.
const PRODUCTION_API_URL = 'https://api.studyocepte.com'; // Örnek

// Uygulamanın o anki geliştirme durumuna göre doğru URL'i seç.
// __DEV__ React Native tarafından otomatik olarak sağlanan bir değişkendir.
const API_URL = __DEV__ ? DEVELOPMENT_API_URL : PRODUCTION_API_URL;

export const config = {
  api: {
    baseUrl: API_URL,
  },
};
