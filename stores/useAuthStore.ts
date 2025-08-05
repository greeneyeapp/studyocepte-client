import { create } from 'zustand';
import { api, User, TokenResponse } from '@/services/api';
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
  guestLogin: () => Promise<void>;
  clearError: () => void;
  handleUnauthorized: () => void;
}

const USER_STORAGE_KEY = 'user';
const GUEST_USER_STORAGE_KEY = 'guest_user';

export const useAuthStore = create<AuthState & AuthActions>((set, get) => ({
  user: null, isAuthenticated: false, isLoading: false, error: null,

  handleUnauthorized: () => {
    AsyncStorage.removeItem(USER_STORAGE_KEY);
    set({ user: null, isAuthenticated: false, isLoading: false, error: 'Oturumunuz sonlandırıldı.' });
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const { user, access_token } = await api.login(email, password);
      const userDataToStore = { ...user, access_token };
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userDataToStore));
      await AsyncStorage.removeItem(GUEST_USER_STORAGE_KEY);
      set({ user: userDataToStore, isAuthenticated: true, isLoading: false });
    } catch (error: any) {
      set({ error: error.message || 'Giriş başarısız.', isLoading: false });
      throw error;
    }
  },

  register: async (name, email, password) => {
    set({ isLoading: true, error: null });
    try {
      const { user, access_token } = await api.register(name, email, password);
      const userDataToStore = { ...user, access_token };
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userDataToStore));
      await AsyncStorage.removeItem(GUEST_USER_STORAGE_KEY);
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
      await AsyncStorage.removeItem(USER_STORAGE_KEY);
      set({ user: null, isAuthenticated: false, error: null });
    } catch (error: any) {
      await AsyncStorage.removeItem(USER_STORAGE_KEY);
      set({ user: null, isAuthenticated: false, error: null });
    } finally {
      set({ isLoading: false });
    }
  },

  checkAuthStatus: async () => {
    set({ isLoading: true });
    try {
      const userJson = await AsyncStorage.getItem(USER_STORAGE_KEY);
      if (userJson) set({ user: JSON.parse(userJson), isAuthenticated: true });
      else set({ user: null, isAuthenticated: false });
    } catch (error: any) {
      get().handleUnauthorized();
    } finally {
      set({ isLoading: false });
    }
  },
  
  guestLogin: async () => {
    set({ isLoading: true, error: null });
    try {
      const storedGuestJson = await AsyncStorage.getItem(GUEST_USER_STORAGE_KEY);
      let tokenResponse: TokenResponse;

      if (storedGuestJson) {
        const storedGuest = JSON.parse(storedGuestJson);
        // DEĞİŞİKLİK: Artık `storedGuest.uid` kullanılıyor.
        tokenResponse = await api.loginAsGuest(storedGuest.uid);
      } else {
        tokenResponse = await api.createGuestUser();
      }
      
      const { user, access_token } = tokenResponse;
      const userDataToStore = { ...user, access_token };
      
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userDataToStore));
      await AsyncStorage.setItem(GUEST_USER_STORAGE_KEY, JSON.stringify(user));
      
      set({ user: userDataToStore, isAuthenticated: true, isLoading: false });
    } catch (error: any) {
      set({ error: error.message || 'Misafir girişi başarısız.', isLoading: false });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));