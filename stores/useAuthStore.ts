// stores/useAuthStore.ts - Loading states kaldırıldı, sadece data ve error yönetiliyor
import { create } from 'zustand';
import { api, User, TokenResponse, apiUtils } from '@/services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '@/i18n';

const LANGUAGE_STORAGE_KEY = 'user_language';

interface AuthState {
  user: (User & { access_token?: string }) | null;
  isAuthenticated: boolean;
  error: string | null;
  currentLanguage: string;
  isOnline: boolean;
}

interface AuthActions {
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
  guestLogin: () => Promise<boolean>;
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
      // Önce kaydedilen dili yükle
      const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (savedLanguage && savedLanguage !== i18n.language) {
        await i18n.changeLanguage(savedLanguage);
        set({ currentLanguage: savedLanguage });
      }

      const userJson = await AsyncStorage.getItem('user');
      if (userJson) {
        const userData = JSON.parse(userJson);
        set({ user: userData, isAuthenticated: true });
        
        try {
          await get().refreshProfile();
        } catch (error) {
          console.warn(i18n.t('auth.profileRefreshFailedLog'), error); // Çeviri anahtarı kullanıldı
        }
      } else {
        set({ user: null, isAuthenticated: false });
      }
    } catch (error) {
      console.error(i18n.t('auth.authStatusCheckFailedLog'), error); // Çeviri anahtarı kullanıldı
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
    } catch (e: any) {
      const errorMessage = apiUtils.extractErrorMessage(e);
      set({ error: errorMessage });
      
      if (errorMessage.includes(i18n.t('api.error.networkKeyword1')) || errorMessage.includes(i18n.t('api.error.networkKeyword2'))) { // Çeviri anahtarı kullanıldı
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
    } catch (e: any) {
      const errorMessage = apiUtils.extractErrorMessage(e);
      set({ error: errorMessage });
      
      if (errorMessage.includes(i18n.t('api.error.networkKeyword1')) || errorMessage.includes(i18n.t('api.error.networkKeyword2'))) { // Çeviri anahtarı kullanıldı
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
    } catch (e: any) {
      const errorMessage = apiUtils.extractErrorMessage(e);
      set({ error: errorMessage });
      
      if (errorMessage.includes(i18n.t('api.error.networkKeyword1')) || errorMessage.includes(i18n.t('api.error.networkKeyword2'))) { // Çeviri anahtarı kullanıldı
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
    } catch (e: any) {
      const errorMessage = apiUtils.extractErrorMessage(e);
      set({ error: errorMessage });
      
      if (errorMessage.includes(i18n.t('api.error.networkKeyword1')) || errorMessage.includes(i18n.t('api.error.networkKeyword2'))) { // Çeviri anahtarı kullanıldı
        set({ isOnline: false });
      }
      
      return false;
    }
  },

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
    } catch (e: any) {
      console.warn(i18n.t('auth.profileRefreshFailedLog'), apiUtils.extractErrorMessage(e)); // Çeviri anahtarı kullanıldı
      
      if (apiUtils.extractErrorMessage(e).includes(i18n.t('api.error.networkKeyword1'))) { // Çeviri anahtarı kullanıldı
        set({ isOnline: false });
      }
    }
  },

  changeLanguage: async (lang: string) => {
    try {
      // i18n dil değişikliği
      await i18n.changeLanguage(lang);
      
      // AsyncStorage'a kaydet
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
      
      // Store'u güncelle
      set({ currentLanguage: lang });
      
      if (get().isAuthenticated) {
        await get().refreshProfile();
      }
    } catch (error) {
      console.error(i18n.t('auth.languageChangeFailedLog'), error); // Çeviri anahtarı kullanıldı
      set({ currentLanguage: lang });
    }
  },

  checkNetworkStatus: async () => {
    try {
      const isOnline = await apiUtils.checkNetworkConnection();
      set({ isOnline });
      
      if (!isOnline && get().error === null) {
        set({ error: i18n.t('api.error.noInternet') }); // Çeviri anahtarı kullanıldı
      } else if (isOnline && get().error?.includes(i18n.t('api.error.internetKeyword'))) { // Çeviri anahtarı kullanıldı
        set({ error: null });
      }
    } catch (error) {
      set({ isOnline: false });
    }
  },
}));