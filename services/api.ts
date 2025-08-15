// services/api.ts - Dil desteği ile güncellenmiş API servisleri
import axios from 'axios';
import { config } from '@/config/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '@/i18n'; // i18n import edildi

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

apiClient.interceptors.request.use(
  async (config) => {
    const userJson = await AsyncStorage.getItem('user');
    if (userJson) {
      const storedData = JSON.parse(userJson);
      if (storedData.access_token) {
        config.headers.Authorization = `Bearer ${storedData.access_token}`;
      }
    }

    const currentLang = i18n.language || 'tr';
    if (!config.params) {
      config.params = {};
    }
    config.params.lang = currentLang;

    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (axios.isAxiosError(error) && error.response) {
      if (error.response.status === 401) {
        await AsyncStorage.removeItem('user');
        // İsteğe bağlı: AuthStore'daki isAuthenticated durumunu da sıfırla
        // Bu, RootLayout'taki yönlendirmeyi tetikleyecektir.
        // useAuthStore.getState().logout(); // Eğer bu API response interceptor'da Zustan store'a erişim güvenliyse
      }
      
      const errorData = error.response.data as APIErrorResponse;
      if (errorData && !errorData.success && errorData.error) {
        throw new Error(errorData.error.message);
      } else {
        const errorMessage = error.response.data?.detail || i18n.t('api.error.server');
        throw new Error(errorMessage);
      }
    }
    // Genel ağ hatası veya sunucuya ulaşılamıyor
    throw new Error(i18n.t('api.error.network'));
  }
);

const makeAPICall = async <T>(
  apiCall: () => Promise<T>,
  options?: { lang?: string }
): Promise<T> => {
  try {
    return await apiCall();
  } catch (error: any) {
    console.error('API Call Error:', {
      message: error.message,
      lang: options?.lang || i18n.language,
      timestamp: new Date().toISOString(),
      stack: error.stack, // Hata stack'ini de logla
    });
    throw error;
  }
};

export const api = {
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
    // API tarafında bir logout endpoint'i varsa buraya eklenmeli
    // Örneğin: await apiClient.post('/auth/logout');
  },

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
          type: 'image/jpeg', // Multiple background removal for JPEG
        } as any);
      });

      const response = await apiClient.post<APISuccessResponse<BatchBackgroundRemovalResponse>>(
        '/image/remove-background/batch/', 
        formData, 
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          params: { lang: lang || i18n.language },
          timeout: 120000, // Artırılmış timeout
        }
      );

      if (response.data.success && response.data.data) {
        return response.data.data;
      } else {
        throw new Error(i18n.t('api.error.unexpectedResponse'));
      }
    }, { lang });
  },

  removeSingleBackground: async (
    photo: { filename: string, uri: string },
    lang?: string
  ): Promise<string> => {
    return makeAPICall(async () => {
      const formData = new FormData();
      formData.append('file', {
        uri: photo.uri,
        name: photo.filename,
        type: 'image/jpeg', // Single background removal for JPEG
      } as any);

      const response = await apiClient.post<APISuccessResponse<{ processed_image: string }>>(
        '/image/remove-background/single/',
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          params: { lang: lang || i18n.language },
          timeout: 60000,
        }
      );

      if (response.data.success && response.data.data?.processed_image) {
        return response.data.data.processed_image;
      } else {
        throw new Error(i18n.t('api.error.unexpectedResponse'));
      }
    }, { lang });
  },

  getProfile: async (lang?: string): Promise<User> => {
    return makeAPICall(async () => {
      const response = await apiClient.get<User>('/auth/profile', {
        params: { lang: lang || i18n.language }
      });
      return response.data;
    }, { lang });
  },

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

  healthCheck: async (lang?: string): Promise<any> => {
    return makeAPICall(async () => {
      const response = await apiClient.get('/health', {
        params: { lang: lang || i18n.language }
      });
      return response.data;
    }, { lang });
  },

  imageHealthCheck: async (lang?: string): Promise<any> => {
    return makeAPICall(async () => {
      const response = await apiClient.get('/image/health', {
        params: { lang: lang || i18n.language }
      });
      return response.data;
    }, { lang });
  },
};

export const apiUtils = {
  getCurrentLanguage: (): string => {
    return i18n.language || 'tr';
  },

  changeLanguage: async (newLang: string): Promise<void> => {
    await i18n.changeLanguage(newLang);
  },

  extractErrorMessage: (error: any): string => {
    if (error?.response?.data?.error?.message) {
      return error.response.data.error.message;
    }
    if (error?.message) {
      // Check for common network error messages
      if (error.message.includes('Network Error')) {
        return i18n.t('api.error.network');
      }
      if (error.message.includes('timeout')) {
        return i18n.t('api.error.network'); // Timeout da bir ağ hatası olarak kabul edilebilir
      }
      if (error.message.includes('ECONNABORTED')) { // Axios timeout hatası
        return i18n.t('api.error.network');
      }
      return error.message;
    }
    return i18n.t('api.error.unknown');
  },

  checkNetworkConnection: async (): Promise<boolean> => {
    try {
      // Daha güvenilir bir health check endpoint'i kullanılabilir
      const response = await apiClient.get('/health', { timeout: 5000 });
      return response.status === 200;
    } catch {
      return false;
    }
  },
};

export const isAPIError = (response: any): response is APIErrorResponse => {
  return response && !response.success && response.error;
};

export const isAPISuccess = (response: any): response is APISuccessResponse => {
  return response && response.success === true;
};