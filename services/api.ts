// kodlar/services/api.ts
import axios from 'axios';
import { config } from '@/config/config';
import AsyncStorage from '@react-native-async-storage/async-storage';

// --- TİP TANIMLARI ---
export interface EditorSettings {
  backgroundId: string;
  shadow: number;
  lighting: number;
  brightness?: number;
  contrast?: number;
  saturation?: number;
  hue?: number;
  sepia?: number;
}

export interface Project {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  status?: 'processing' | 'completed' | 'failed';
  thumbnailUrl?: string; 
  originalImageUrl?: string; 
  editorSettings?: EditorSettings;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  subscriptionPlan: 'free' | 'pro';
}

export interface Background {
  id: string;
  name: string;
  thumbnailUrl: string;
  fullUrl: string;
}

export interface TokenResponse {
  user: User;
  access_token: string;
  token_type: string;
}

// --- API İSTEMCİSİ ---
const apiClient = axios.create({
  baseURL: config.api.baseUrl,
  timeout: 35000,
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
        console.warn('API hatası: Yetkilendirme başarısız (401). Oturum sonlandırılıyor.');
        await AsyncStorage.removeItem('user');
      }
      const errorMessage = error.response.data.detail || 'Bir sunucu hatası oluştu.';
      throw new Error(errorMessage);
    }
    throw new Error('Bir ağ hatası oluştu veya sunucuya ulaşılamıyor.');
  }
);

// --- API FONKSİYONLARI ---
export const api = {
  // DÜZELTME: Login fonksiyonu artık sunucunun beklediği gibi JSON gönderiyor.
  login: async (email: string, password: string): Promise<TokenResponse> => {
    const response = await apiClient.post<TokenResponse>('/auth/login', {
      email: email,
      password: password,
    });
    return response.data;
  },

  register: async (name: string, email: string, password: string): Promise<TokenResponse> => {
    const response = await apiClient.post<TokenResponse>('/auth/register', { name, email, password });
    return response.data;
  },

  logout: async (): Promise<void> => {
    console.log("Client tarafında çıkış işlemi başlatıldı.");
  },

  updateProfile: async (userData: Partial<User>): Promise<User> => {
    const response = await apiClient.put<User>('/auth/profile', userData);
    return response.data;
  },

  fetchProjects: async (): Promise<Project[]> => {
    const response = await apiClient.get<Project[]>('/projects');
    return response.data;
  },

  fetchProjectById: async (projectId: string): Promise<Project> => {
    const response = await apiClient.get<Project>(`/projects/${projectId}`);
    return response.data;
  },

  createProject: async (imageUri: string, name: string): Promise<Project> => {
    const formData = new FormData();
    const uriParts = imageUri.split('/');
    const fileName = uriParts.pop() || 'photo.jpg';
    let fileType = 'image/jpeg';
    if (fileName.endsWith('.png')) {
        fileType = 'image/png';
    }
    formData.append('file', { uri: imageUri, name: fileName, type: fileType } as any);
    formData.append('name', name);
    const response = await apiClient.post<Project>('/projects/upload-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
  
  deleteProject: async (projectId: string): Promise<void> => {
    await apiClient.delete(`/projects/${projectId}`);
  },

  saveProject: async (projectId: string, settings: EditorSettings): Promise<void> => {
    await apiClient.put(`/projects/${projectId}/settings`, settings);
  },

  fetchBackgrounds: async (): Promise<Background[]> => {
    const response = await apiClient.get<Background[]>('/backgrounds');
    return response.data;
  },
};