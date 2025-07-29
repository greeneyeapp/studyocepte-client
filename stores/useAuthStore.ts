import { create } from 'zustand';
import { api, User } from '@/services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthState {
  user: (User & { access_token?: string }) | null; // JWT'yi saklamak için access_token eklendi
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>; // Register eklendi
  logout: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
  clearError: () => void;
  updateProfile: (userData: Partial<User>) => Promise<void>;
}

const USER_STORAGE_KEY = 'user'; // AsyncStorage anahtarı

export const useAuthStore = create<AuthState & AuthActions>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const userData = await api.login(email, password);
      // Backend'den dönen access_token'ı ve diğer kullanıcı bilgilerini kaydet
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
      set({ user: userData, isAuthenticated: true, isLoading: false });
    } catch (error: any) {
      set({ 
        error: error.message || 'Giriş başarısız. Lütfen bilgilerinizi kontrol edin.',
        isLoading: false 
      });
      throw error; // UI'da yakalanabilmesi için hatayı yeniden fırlat
    }
  },

  register: async (name: string, email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const userData = await api.register(name, email, password);
      // Backend'den dönen access_token'ı ve diğer kullanıcı bilgilerini kaydet
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
      set({ user: userData, isAuthenticated: true, isLoading: false });
    } catch (error: any) {
      set({ 
        error: error.message || 'Kayıt başarısız. Lütfen bilgilerinizi kontrol edin.',
        isLoading: false 
      });
      throw error; // UI'da yakalanabilmesi için hatayı yeniden fırlat
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await api.logout(); // Backend'de özel bir işlem yapmasa da API katmanını çağırıyoruz
      await AsyncStorage.removeItem(USER_STORAGE_KEY);
      set({ user: null, isAuthenticated: false, isLoading: false, error: null });
    } catch (error: any) {
      console.error('Çıkış sırasında hata oluştu:', error);
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
        // Token'ın geçerliliğini basitçe kontrol et (daha gelişmiş kontrol backend'de olabilir)
        // Eğer token'ın süresi geçmişse, burada bir refresh token mekanizması tetiklenebilir
        // Şimdilik, sadece user objesi varsa kimlik doğrulanmış sayıyoruz.
        set({ user: userData, isAuthenticated: true, isLoading: false });
      } else {
        set({ user: null, isAuthenticated: false, isLoading: false });
      }
    } catch (error: any) {
      console.error('Kimlik doğrulama durumu kontrol edilirken hata oluştu:', error);
      // Hata durumunda kullanıcıyı sistemden at
      await AsyncStorage.removeItem(USER_STORAGE_KEY);
      set({ user: null, isAuthenticated: false, isLoading: false, error: 'Kimlik doğrulama kontrolü başarısız.' });
    }
  },

  clearError: () => {
    set({ error: null });
  },

  updateProfile: async (userData: Partial<User>) => {
    set({ isLoading: true, error: null });
    try {
      // Mevcut token'ı alıp güncelleme isteğine eklemek için api.ts'deki interceptor yeterli
      const updatedUser = await api.updateProfile(userData);
      // Güncellenmiş kullanıcı verilerini ve mevcut token'ı birleştirerek tekrar kaydet
      const currentUserData = get().user;
      if (currentUserData) {
        const mergedUserData = { ...currentUserData, ...updatedUser };
        await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(mergedUserData));
        set({ user: mergedUserData, isLoading: false });
      } else {
        set({ user: updatedUser, isLoading: false }); // Kullanıcı objesi null ise, sadece güncellenmiş user'ı kaydet
      }
    } catch (error: any) {
      set({ 
        error: error.message || 'Profil güncelleme başarısız.',
        isLoading: false 
      });
      throw error; // UI'da yakalanabilmesi için hatayı yeniden fırlat
    }
  },
}));