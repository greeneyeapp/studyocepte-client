// kodlar/stores/useAuthStore.ts

import { create } from 'zustand';
import { api, User } from '@/services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthState {
  user: (User & { access_token?: string }) | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
  clearError: () => void;
  updateProfile: (userData: Partial<User>) => Promise<void>;
  handleUnauthorized: () => void; // YENİ EKLENDİ
}

const USER_STORAGE_KEY = 'user';

export const useAuthStore = create<AuthState & AuthActions>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  // YENİ FONKSİYON: Sadece state ve storage'ı temizler
  handleUnauthorized: () => {
    AsyncStorage.removeItem(USER_STORAGE_KEY);
    set({ user: null, isAuthenticated: false, isLoading: false, error: 'Oturumunuz sonlandırıldı. Lütfen tekrar giriş yapın.' });
  },

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const userData = await api.login(email, password);
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
      set({ user: userData, isAuthenticated: true, isLoading: false });
    } catch (error: any) {
      set({ 
        error: error.message || 'Giriş başarısız. Lütfen bilgilerinizi kontrol edin.',
        isLoading: false 
      });
      throw error;
    }
  },

  register: async (name: string, email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const userData = await api.register(name, email, password);
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
      set({ user: userData, isAuthenticated: true, isLoading: false });
    } catch (error: any) {
      set({ 
        error: error.message || 'Kayıt başarısız. Lütfen bilgilerinizi kontrol edin.',
        isLoading: false 
      });
      throw error;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await api.logout(); // Backend'de özel bir işlem yapmasa da API katmanını çağırıyoruz
      get().handleUnauthorized(); // State temizleme işlemini çağır
    } catch (error: any) {
      console.error('Çıkış sırasında hata oluştu:', error);
      // Hata durumunda bile state'i temizle
      get().handleUnauthorized();
      set({ 
        error: error.message || 'Çıkış yapılamadı.',
        isLoading: false 
      });
    }
  },

  checkAuthStatus: async () => {
    set({ isLoading: true });
    try {
      const userJson = await AsyncStorage.getItem(USER_STORAGE_KEY);
      if (userJson) {
        const userData = JSON.parse(userJson);
        set({ user: userData, isAuthenticated: true, isLoading: false });
      } else {
        set({ user: null, isAuthenticated: false, isLoading: false });
      }
    } catch (error: any) {
      console.error('Kimlik doğrulama durumu kontrol edilirken hata oluştu:', error);
      get().handleUnauthorized();
    }
  },

  clearError: () => {
    set({ error: null });
  },

  updateProfile: async (userData: Partial<User>) => {
    set({ isLoading: true, error: null });
    try {
      const updatedUser = await api.updateProfile(userData);
      const currentUserData = get().user;
      if (currentUserData) {
        const mergedUserData = { ...currentUserData, ...updatedUser };
        await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(mergedUserData));
        set({ user: mergedUserData, isLoading: false });
      } else {
        set({ user: updatedUser, isLoading: false });
      }
    } catch (error: any) {
      set({ 
        error: error.message || 'Profil güncelleme başarısız.',
        isLoading: false 
      });
      throw error;
    }
  },
}));