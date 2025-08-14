// stores/useAuthStore.ts - Loading states kaldırıldı, sadece data ve error yönetiliyor
import { create } from 'zustand';
import { api, User, TokenResponse, apiUtils } from '@/services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '@/i18n';

interface AuthState {
  user: (User & { access_token?: string }) | null;
  isAuthenticated: boolean;
  error: string | null;
  // Dil ve network durumu
  currentLanguage: string;
  isOnline: boolean;
}

interface AuthActions {
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
  guestLogin: () => Promise<boolean>;
  // Profil ve dil işlemleri
  updateProfile: (updates: { name?: string }) => Promise<boolean>;
  refreshProfile: () => Promise<void>;
  changeLanguage: (lang: string) => Promise<void>;
  checkNetworkStatus: () => Promise<void>;
}

export const useAuthStore = create<AuthState & AuthActions>((set, get) => ({
  user: null,
  isAuthenticated: false,
  error: null,
  currentLanguage: i18n.language || 'tr',
  isOnline: true,

  checkAuthStatus: async () => {
    try {
      const userJson = await AsyncStorage.getItem('user');
      if (userJson) {
        const userData = JSON.parse(userJson);
        set({ user: userData, isAuthenticated: true });
        
        // Background'da profil bilgilerini refresh et
        try {
          await get().refreshProfile();
        } catch (error) {
          // Profil refresh hatası kritik değil, sadece logla
          console.warn('Profile refresh failed:', error);
        }
      } else {
        set({ user: null, isAuthenticated: false });
      }
    } catch (error) {
      console.error('Auth status check failed:', error);
      set({ user: null, isAuthenticated: false });
    }
  },

  login: async (email: string, password: string) => {
    set({ error: null });
    try {
      const currentLang = get().currentLanguage;
      const { user, access_token } = await api.login(email, password, currentLang);
      
      const userWithToken = { ...user, access_token };
      await AsyncStorage.setItem('user', JSON.stringify(userWithToken));
      
      set({ 
        user: userWithToken, 
        isAuthenticated: true, 
        error: null,
        isOnline: true 
      });
      
      return true;
    } catch (e: any) { // error type any eklendi
      const errorMessage = apiUtils.extractErrorMessage(e);
      set({ error: errorMessage });
      
      // Network hatasını kontrol et
      if (errorMessage.includes(i18n.t('common.networkError')) || errorMessage.includes('network')) { // Lokalize edildi
        set({ isOnline: false });
      }
      
      return false;
    }
  },

  register: async (name: string, email: string, password: string) => {
    set({ error: null });
    try {
      const currentLang = get().currentLanguage;
      const { user, access_token } = await api.register(name, email, password, currentLang);
      
      const userWithToken = { ...user, access_token };
      await AsyncStorage.setItem('user', JSON.stringify(userWithToken));
      
      set({ 
        user: userWithToken, 
        isAuthenticated: true, 
        error: null,
        isOnline: true 
      });
      
      return true;
    } catch (e: any) { // error type any eklendi
      const errorMessage = apiUtils.extractErrorMessage(e);
      set({ error: errorMessage });
      
      if (errorMessage.includes(i18n.t('common.networkError')) || errorMessage.includes('network')) { // Lokalize edildi
        set({ isOnline: false });
      }
      
      return false;
    }
  },

  guestLogin: async () => {
    set({ error: null });
    try {
      const currentLang = get().currentLanguage;
      const storedGuestJson = await AsyncStorage.getItem('guest_user');
      let tokenResponse: TokenResponse;
      
      if (storedGuestJson) {
        const storedGuest = JSON.parse(storedGuestJson);
        tokenResponse = await api.loginAsGuest(storedGuest.uid, currentLang);
      } else {
        tokenResponse = await api.createGuestUser(currentLang);
      }
      
      const { user, access_token } = tokenResponse;
      const userWithToken = { ...user, access_token };
      
      await AsyncStorage.setItem('user', JSON.stringify(userWithToken));
      await AsyncStorage.setItem('guest_user', JSON.stringify(user));
      
      set({ 
        user: userWithToken, 
        isAuthenticated: true, 
        error: null,
        isOnline: true 
      });
      
      return true;
    } catch (e: any) { // error type any eklendi
      const errorMessage = apiUtils.extractErrorMessage(e);
      set({ error: errorMessage });
      
      if (errorMessage.includes(i18n.t('common.networkError')) || errorMessage.includes('network')) { // Lokalize edildi
        set({ isOnline: false });
      }
      
      return false;
    }
  },

  logout: async () => {
    await AsyncStorage.removeItem('user');
    set({ 
      user: null, 
      isAuthenticated: false, 
      error: null 
    });
  },

  // Profil güncelleme
  updateProfile: async (updates: { name?: string }) => {
    const currentUser = get().user;
    if (!currentUser) return false;

    set({ error: null });
    try {
      const currentLang = get().currentLanguage;
      const updatedUser = await api.updateProfile(updates, currentLang);
      
      const userWithToken = { 
        ...updatedUser, 
        access_token: currentUser.access_token 
      };
      
      await AsyncStorage.setItem('user', JSON.stringify(userWithToken));
      set({ 
        user: userWithToken, 
        error: null,
        isOnline: true 
      });
      
      return true;
    } catch (e: any) { // error type any eklendi
      const errorMessage = apiUtils.extractErrorMessage(e);
      set({ error: errorMessage });
      
      if (errorMessage.includes(i18n.t('common.networkError')) || errorMessage.includes('network')) { // Lokalize edildi
        set({ isOnline: false });
      }
      
      return false;
    }
  },

  // Profil bilgilerini yenile
  refreshProfile: async () => {
    const currentUser = get().user;
    if (!currentUser || !get().isAuthenticated) return;

    try {
      const currentLang = get().currentLanguage;
      const refreshedUser = await api.getProfile(currentLang);
      
      const userWithToken = { 
        ...refreshedUser, 
        access_token: currentUser.access_token 
      };
      
      await AsyncStorage.setItem('user', JSON.stringify(userWithToken));
      set({ 
        user: userWithToken,
        isOnline: true 
      });
    } catch (e: any) { // error type any eklendi
      // Profil refresh hatası kritik değil
      console.warn('Profile refresh failed:', apiUtils.extractErrorMessage(e));
      
      if (apiUtils.extractErrorMessage(e).includes(i18n.t('common.networkError'))) { // Lokalize edildi
        set({ isOnline: false });
      }
    }
  },

  // Dil değiştirme
  changeLanguage: async (lang: string) => {
    try {
      await apiUtils.changeLanguage(lang);
      set({ currentLanguage: lang });
      
      // Dil değişikliğinden sonra kullanıcı varsa profili refresh et
      if (get().isAuthenticated) {
        await get().refreshProfile();
      }
    } catch (error) {
      console.error('Language change failed:', error);
      // Dil değişikliği hatası kritik değil, local olarak set et
      set({ currentLanguage: lang });
    }
  },

  // Network durumu kontrolü
  checkNetworkStatus: async () => {
    try {
      const isOnline = await apiUtils.checkNetworkConnection();
      set({ isOnline });
      
      // Online olduktan sonra profili refresh et
      if (isOnline && get().isAuthenticated) {
        await get().refreshProfile();
      }
    } catch (error) {
      set({ isOnline: false });
    }
  },
}));