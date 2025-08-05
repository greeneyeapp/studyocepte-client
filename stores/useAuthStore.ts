// client/stores/useAuthStore.ts - TAM VE NİHAİ KOD
import { create } from 'zustand';
import { api, User, TokenResponse } from '@/services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthState {
  user: (User & { access_token?: string }) | null;
  isAuthenticated: boolean;
  isLoading: boolean; // Sadece butonların kendi spinner'ı için
  error: string | null;
}

interface AuthActions {
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
  guestLogin: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState & AuthActions>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false, // Başlangıçta false
  error: null,

  checkAuthStatus: async () => {
    const userJson = await AsyncStorage.getItem('user');
    if (userJson) {
      set({ user: JSON.parse(userJson), isAuthenticated: true });
    } else {
      set({ user: null, isAuthenticated: false });
    }
  },

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const { user, access_token } = await api.login(email, password);
      await AsyncStorage.setItem('user', JSON.stringify({ ...user, access_token }));
      set({ user, isAuthenticated: true, error: null });
      return true;
    } catch (e: any) {
      set({ error: e.message });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  register: async (name, email, password) => {
    set({ isLoading: true });
    try {
      const { user, access_token } = await api.register(name, email, password);
      await AsyncStorage.setItem('user', JSON.stringify({ ...user, access_token }));
      set({ user, isAuthenticated: true, error: null });
      return true;
    } catch (e: any) {
      set({ error: e.message });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  guestLogin: async () => {
    set({ isLoading: true });
    try {
      const storedGuestJson = await AsyncStorage.getItem('guest_user');
      let tokenResponse: TokenResponse;
      if (storedGuestJson) {
        const storedGuest = JSON.parse(storedGuestJson);
        tokenResponse = await api.loginAsGuest(storedGuest.uid);
      } else {
        tokenResponse = await api.createGuestUser();
      }
      const { user, access_token } = tokenResponse;
      await AsyncStorage.setItem('user', JSON.stringify({ ...user, access_token }));
      await AsyncStorage.setItem('guest_user', JSON.stringify(user));
      set({ user, isAuthenticated: true, error: null });
      return true;
    } catch (e: any) {
      set({ error: e.message });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    // Çıkış yaparken animasyonu _layout yönetecek, burada sadece state'i temizle.
    await AsyncStorage.removeItem('user');
    set({ user: null, isAuthenticated: false });
  },
}));