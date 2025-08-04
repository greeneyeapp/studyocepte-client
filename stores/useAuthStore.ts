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
  handleUnauthorized: () => void;
}

const USER_STORAGE_KEY = 'user';

export const useAuthStore = create<AuthState & AuthActions>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  handleUnauthorized: () => {
    AsyncStorage.removeItem(USER_STORAGE_KEY);
    set({ user: null, isAuthenticated: false, isLoading: false, error: 'Oturumunuz sonlandırıldı. Lütfen tekrar giriş yapın.' });
  },

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const { user, access_token } = await api.login(email, password);
      const userDataToStore = { ...user, access_token };
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userDataToStore));
      set({ user: userDataToStore, isAuthenticated: true, isLoading: false });
    } catch (error: any) {
      set({ error: error.message || 'Giriş başarısız.', isLoading: false });
      throw error;
    }
  },

  register: async (name: string, email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const { user, access_token } = await api.register(name, email, password);
      const userDataToStore = { ...user, access_token };
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userDataToStore));
      set({ user: userDataToStore, isAuthenticated: true, isLoading: false });
    } catch (error: any) {
      set({ error: error.message || 'Kayıt başarısız.', isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await api.logout();
      get().handleUnauthorized();
    } catch (error: any) {
      console.error('Logout error:', error);
      get().handleUnauthorized(); // Hata olsa bile çıkış yap
    } finally {
      set({ isLoading: false });
    }
  },

  checkAuthStatus: async () => {
    set({ isLoading: true });
    try {
      const userJson = await AsyncStorage.getItem(USER_STORAGE_KEY);
      if (userJson) {
        const userData = JSON.parse(userJson);
        set({ user: userData, isAuthenticated: true });
      } else {
        set({ user: null, isAuthenticated: false });
      }
    } catch (error: any) {
      console.error('Auth check failed:', error);
      get().handleUnauthorized();
    } finally {
        set({ isLoading: false });
    }
  },

  clearError: () => {
    set({ error: null });
  },

  // updateProfile fonksiyonu tamamen kaldırıldı.
}));