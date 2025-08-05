import axios from 'axios';
import { config } from '@/config/config';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
      }
      const errorMessage = error.response.data.detail || 'Bir sunucu hatası oluştu.';
      throw new Error(errorMessage);
    }
    throw new Error('Bir ağ hatası oluştu veya sunucuya ulaşılamıyor.');
  }
);

export const api = {
  login: async (email: string, password: string): Promise<TokenResponse> => {
    const response = await apiClient.post<TokenResponse>('/auth/login', { email, password });
    return response.data;
  },
  register: async (name: string, email: string, password: string): Promise<TokenResponse> => {
    const response = await apiClient.post<TokenResponse>('/auth/register', { name, email, password });
    return response.data;
  },
  createGuestUser: async (): Promise<TokenResponse> => {
    const response = await apiClient.post<TokenResponse>('/auth/guest');
    return response.data;
  },
  loginAsGuest: async (guestId: string): Promise<TokenResponse> => {
    const response = await apiClient.post<TokenResponse>('/auth/guest/login', { guest_id: guestId });
    return response.data;
  },
  logout: async (): Promise<void> => {},
  removeMultipleBackgrounds: async (photos: { filename: string, uri: string }[]): Promise<BatchBackgroundRemovalResponse> => {
    const formData = new FormData();
    photos.forEach(photo => {
      formData.append('files', {
        uri: photo.uri, name: photo.filename,
        type: photo.filename.endsWith('.png') ? 'image/png' : 'image/jpeg',
      } as any);
    });
    const response = await apiClient.post('/image/remove-background/batch/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};