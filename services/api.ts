import axios from 'axios';
import { config } from '@/config/config';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Bu servis, basitleştirilmiş backend API'si ile olan tüm iletişimi yönetir.
 * Sorumlulukları:
 * 1. Kullanıcı kimlik doğrulama (login, register, profile update).
 * 2. Birden fazla fotoğrafın arka planını temizlemek için API'ye gönderme.
 *
 * NOT: Bu servis artık ürün veya fotoğraf verisi (metadata) yönetimi yapmaz.
 * Bu işlemlerin tamamı `useProductStore` içinde yerel olarak gerçekleştirilir.
 */

// --- API'den Gelen Yanıtlar İçin Tipler ---

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  subscriptionPlan: 'free' | 'pro';
}

export interface TokenResponse {
  user: User;
  access_token: string;
  token_type: string;
}

/** Toplu arka plan temizleme işleminin yanıt formatı. */
export interface BatchBackgroundRemovalResponse {
  success: { [filename: string]: string }; // Anahtar: dosya adı, Değer: base64 encoded image
  errors: { [filename: string]: string }; // Anahtar: dosya adı, Değer: hata mesajı
}


// --- Axios Instance ve Interceptor'lar ---

const apiClient = axios.create({
  baseURL: config.api.baseUrl,
  // Toplu resim işleme uzun sürebileceği için timeout'u 60 saniyeye çıkarıyoruz.
  timeout: 60000, 
});

// Her isteğe otomatik olarak Authorization token'ı ekleyen interceptor
apiClient.interceptors.request.use(
  async (config) => {
    const userJson = await AsyncStorage.getItem('user');
    if (userJson) {
      const storedData = JSON.parse(userJson);
      if (storedData.access_token) {
        config.headers.Authorization = `Bearer ${storedData.access_token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Hata yanıtlarını merkezi olarak yöneten interceptor
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (axios.isAxiosError(error) && error.response) {
      // Yetkilendirme hatası (401) durumunda kullanıcı verisini temizle
      if (error.response.status === 401) {
        console.warn('API Authorization Error (401). Clearing local user data.');
        await AsyncStorage.removeItem('user');
        // İdeal olarak burada kullanıcıyı login ekranına yönlendirecek bir event tetiklenir.
      }
      const errorMessage = error.response.data.detail 
        || error.response.data.message 
        || 'Bir sunucu hatası oluştu.';
      throw new Error(errorMessage);
    }
    throw new Error('Bir ağ hatası oluştu veya sunucuya ulaşılamıyor.');
  }
);


// --- DIŞA AKTARILAN API FONKSİYONLARI ---

export const api = {
  /** Kullanıcı girişi yapar. */
  login: async (email: string, password: string): Promise<TokenResponse> => {
    const response = await apiClient.post<TokenResponse>('/auth/login', { email, password });
    return response.data;
  },

  /** Yeni kullanıcı kaydı oluşturur. */
  register: async (name: string, email: string, password: string): Promise<TokenResponse> => {
    const response = await apiClient.post<TokenResponse>('/auth/register', { name, email, password });
    return response.data;
  },

  /** Çıkış işlemi client tarafında yönetildiği için bu fonksiyon bir placeholder'dır. */
  logout: async (): Promise<void> => {
    console.log("Logout triggered. Clearing local data is handled by useAuthStore.");
  },

  /** Kullanıcı profil bilgilerini günceller. */
  updateProfile: async (userData: Partial<User>): Promise<User> => {
    const response = await apiClient.put<User>('/auth/profile', userData);
    return response.data;
  },

  /**
   * Birden fazla fotoğrafın arka planını temizlemek için API'ye gönderir.
   * @param photos Her bir elemanı dosya adı ve yerel URI içeren bir dizi.
   * @returns Başarılı ve hatalı işlemleri içeren bir nesne.
   */
  removeMultipleBackgrounds: async (
    photos: { filename: string, uri: string }[]
  ): Promise<BatchBackgroundRemovalResponse> => {
    const formData = new FormData();
    photos.forEach(photo => {
      const fileType = photo.filename.endsWith('.png') ? 'image/png' : 'image/jpeg';
      formData.append('files', {
        uri: photo.uri,
        name: photo.filename,
        type: fileType,
      } as any);
    });

    const response = await apiClient.post('/image/remove-background/batch/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    
    return response.data;
  },
};