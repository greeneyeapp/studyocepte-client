// services/api.ts - Dil desteği ile güncellenmiş API servisleri
import axios from 'axios';
import { config } from '@/config/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '@/i18n';

// DEĞİŞİKLİK: 'id' alanı 'uid' olarak güncellendi.
export interface User {
  uid: string;
  name: string;
  email: string;
  avatar?: string;
  subscriptionPlan: 'free' | 'pro';
  isGuest?: boolean;
}

export interface TokenResponse {
  user: User;
  access_token: string;
  token_type: string;
}

export interface BatchBackgroundRemovalResponse {
  success: { [filename: string]: string };
  errors: { [filename: string]: string };
}

// YENİ: API Error Response interface
export interface APIErrorResponse {
  success: false;
  error: {
    message: string;
    code: string;
    language: string;
    timestamp: string;
    error_id: string;
  };
}

// YENİ: API Success Response interface  
export interface APISuccessResponse<T = any> {
  success: true;
  message: string;
  language: string;
  timestamp: string;
  data?: T;
}

const apiClient = axios.create({
  baseURL: config.api.baseUrl,
  timeout: 60000, 
});

// YENİ: Dil parametresi ekleme interceptor'u
apiClient.interceptors.request.use(
  async (config) => {
    // Auth token ekle
    const userJson = await AsyncStorage.getItem('user');
    if (userJson) {
      const storedData = JSON.parse(userJson);
      if (storedData.access_token) {
        config.headers.Authorization = `Bearer ${storedData.access_token}`;
      }
    }

    // Dil parametresi ekle
    const currentLang = i18n.language || 'tr';
    if (!config.params) {
      config.params = {};
    }
    config.params.lang = currentLang;

    return config;
  },
  (error) => Promise.reject(error)
);

// GÜNCELLEME: Gelişmiş error handling
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (axios.isAxiosError(error) && error.response) {
      if (error.response.status === 401) {
        await AsyncStorage.removeItem('user');
      }
      
      // API'den dönen hata formatını kontrol et
      const errorData = error.response.data as APIErrorResponse;
      if (errorData && !errorData.success && errorData.error) {
        // Structured API error
        throw new Error(errorData.error.message);
      } else {
        // Fallback error message
        const errorMessage = error.response.data?.detail || i18n.t('common.serverError'); // Lokalize edildi
        throw new Error(errorMessage);
      }
    }
    throw new Error(i18n.t('common.networkError')); // Lokalize edildi
  }
);

// YENİ: Dil parametresi ile API çağrı helper'ı
const makeAPICall = async <T>(
  apiCall: () => Promise<T>,
  options?: { lang?: string }
): Promise<T> => {
  try {
    return await apiCall();
  } catch (error: any) {
    // Hata mesajını logla ve yeniden fırlat
    console.error('API Call Error:', {
      message: error.message,
      lang: options?.lang || i18n.language,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
};

export const api = {
  // GÜNCELLEME: Dil parametresi desteği eklendi
  login: async (email: string, password: string, lang?: string): Promise<TokenResponse> => {
    return makeAPICall(async () => {
      const response = await apiClient.post<TokenResponse>('/auth/login', 
        { email, password },
        { params: { lang: lang || i18n.language } }
      );
      return response.data;
    }, { lang });
  },

  register: async (name: string, email: string, password: string, lang?: string): Promise<TokenResponse> => {
    return makeAPICall(async () => {
      const response = await apiClient.post<TokenResponse>('/auth/register', 
        { name, email, password },
        { params: { lang: lang || i18n.language } }
      );
      return response.data;
    }, { lang });
  },

  createGuestUser: async (lang?: string): Promise<TokenResponse> => {
    return makeAPICall(async () => {
      const response = await apiClient.post<TokenResponse>('/auth/guest',
        {},
        { params: { lang: lang || i18n.language } }
      );
      return response.data;
    }, { lang });
  },

  loginAsGuest: async (guestId: string, lang?: string): Promise<TokenResponse> => {
    return makeAPICall(async () => {
      const response = await apiClient.post<TokenResponse>('/auth/guest/login', 
        { guest_id: guestId },
        { params: { lang: lang || i18n.language } }
      );
      return response.data;
    }, { lang });
  },

  logout: async (): Promise<void> => {
    // Local logout - API'de logout endpoint'i yok
  },

  // GÜNCELLEME: Dil desteği ve gelişmiş error handling
  removeMultipleBackgrounds: async (
    photos: { filename: string, uri: string }[],
    lang?: string
  ): Promise<BatchBackgroundRemovalResponse> => {
    return makeAPICall(async () => {
      const formData = new FormData();
      
      photos.forEach(photo => {
        formData.append('files', {
          uri: photo.uri, 
          name: photo.filename,
          type: photo.filename.endsWith('.png') ? 'image/png' : 'image/jpeg',
        } as any);
      });

      const response = await apiClient.post<APISuccessResponse<BatchBackgroundRemovalResponse>>(
        '/image/remove-background/batch/', 
        formData, 
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          params: { lang: lang || i18n.language },
          timeout: 120000, // 2 dakika timeout (toplu işlem için)
        }
      );

      // API v2 response format'ına göre data'yı çıkar
      if (response.data.success && response.data.data) {
        return response.data.data;
      } else {
        throw new Error(i18n.t('common.unknownError')); // Lokalize edildi
      }
    }, { lang });
  },

  // YENİ: Tek dosya background removal
  removeSingleBackground: async (
    photo: { filename: string, uri: string },
    lang?: string
  ): Promise<string> => {
    return makeAPICall(async () => {
      const formData = new FormData();
      formData.append('file', {
        uri: photo.uri,
        name: photo.filename,
        type: photo.filename.endsWith('.png') ? 'image/png' : 'image/jpeg',
      } as any);

      const response = await apiClient.post<APISuccessResponse<{ processed_image: string }>>(
        '/image/remove-background/single/',
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          params: { lang: lang || i18n.language },
          timeout: 60000, // 1 dakika timeout
        }
      );

      if (response.data.success && response.data.data?.processed_image) {
        return response.data.data.processed_image;
      } else {
        throw new Error(i18n.t('common.unknownError')); // Lokalize edildi
      }
    }, { lang });
  },

  // YENİ: Profil bilgilerini getir
  getProfile: async (lang?: string): Promise<User> => {
    return makeAPICall(async () => {
      const response = await apiClient.get<User>('/auth/profile', {
        params: { lang: lang || i18n.language }
      });
      return response.data;
    }, { lang });
  },

  // YENİ: Profil güncelle
  updateProfile: async (
    updates: { name?: string },
    lang?: string
  ): Promise<User> => {
    return makeAPICall(async () => {
      const response = await apiClient.put<User>('/auth/profile', updates, {
        params: { lang: lang || i18n.language }
      });
      return response.data;
    }, { lang });
  },

  // YENİ: Health check
  healthCheck: async (lang?: string): Promise<any> => {
    return makeAPICall(async () => {
      const response = await apiClient.get('/health', {
        params: { lang: lang || i18n.language }
      });
      return response.data;
    }, { lang });
  },

  // YENİ: Image processing health check
  imageHealthCheck: async (lang?: string): Promise<any> => {
    return makeAPICall(async () => {
      const response = await apiClient.get('/image/health', {
        params: { lang: lang || i18n.language }
      });
      return response.data;
    }, { lang });
  },
};

// YENİ: API utility functions
export const apiUtils = {
  /**
   * Mevcut dili döndürür
   */
  getCurrentLanguage: (): string => {
    return i18n.language || 'tr';
  },

  /**
   * Dil değiştirme utility'si
   */
  changeLanguage: async (newLang: string): Promise<void> => {
    await i18n.changeLanguage(newLang);
  },

  /**
   * API error'dan kullanıcı dostu mesaj çıkarır
   */
  extractErrorMessage: (error: any): string => {
    if (error?.response?.data?.error?.message) {
      return error.response.data.error.message;
    }
    if (error?.message && typeof error.message === 'string') { // type guard eklendi
      if (error.message.includes('Network Error')) {
        return i18n.t('common.networkError');
      }
      if (error.message.includes('timeout')) {
        return i18n.t('common.networkError');
      }
      return error.message;
    }
    return i18n.t('common.unknownError'); // Lokalize edildi
  },

  /**
   * Network durumu kontrolü
   */
  checkNetworkConnection: async (): Promise<boolean> => {
    try {
      const response = await apiClient.get('/health', { timeout: 5000 });
      return response.status === 200;
    } catch {
      return false;
    }
  },
};

// YENİ: Type guards
export const isAPIError = (response: any): response is APIErrorResponse => {
  return response && !response.success && response.error;
};

export const isAPISuccess = (response: any): response is APISuccessResponse => {
  return response && response.success === true;
};