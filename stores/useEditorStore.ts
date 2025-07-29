// kodlar/stores/useEditorStore.ts
import { create } from 'zustand';
import { api, ProductPhoto, Background, EditorSettings } from '@/services/api';

interface EditorState {
  activePhoto: ProductPhoto | null;
  backgrounds: Background[];
  settings: EditorSettings;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
}

interface EditorActions {
  setActivePhoto: (photo: ProductPhoto) => void;
  setActivePhotoById: (photoId: string) => Promise<void>;
  fetchBackgrounds: () => Promise<void>;
  updateSettings: (newSettings: Partial<EditorSettings>) => void;
  saveChanges: () => Promise<void>;
  resetSettings: () => void;
  clearError: () => void;
  clearStore: () => void;
}

const defaultSettings: EditorSettings = {
  backgroundId: 'bg1',
  shadow: 0.5,
  lighting: 0.7,
  brightness: 1.0,
  contrast: 1.0,
  saturation: 1.0,
  hue: 0.0,
  sepia: 0.0,
};

export const useEditorStore = create<EditorState & EditorActions>((set, get) => ({
  activePhoto: null,
  backgrounds: [],
  settings: defaultSettings,
  isLoading: false,
  isSaving: false,
  error: null,

  setActivePhoto: (photo: ProductPhoto) => {
    const loadedSettings = { ...defaultSettings, ...photo.editorSettings };
    set({
      activePhoto: { ...photo },
      settings: loadedSettings,
    });
  },

  setActivePhotoById: async (photoId: string) => {
    set({ isLoading: true, error: null });
    try {
      const photo = await api.fetchPhotoById(photoId);
      const loadedSettings = { ...defaultSettings, ...photo.editorSettings };
      set({
        activePhoto: photo,
        settings: loadedSettings,
        isLoading: false,
      });
    } catch (error: any) {
      set({ 
        error: error.message || 'Fotoğraf yüklenemedi.',
        isLoading: false 
      });
    }
  },

  fetchBackgrounds: async () => {
    if (get().backgrounds.length > 0) return;
    set({ isLoading: true });
    try {
      const backgrounds = await api.fetchBackgrounds();
      set({ backgrounds });
    } catch (error: any) {
      set({ error: error.message || 'Arka planlar yüklenemedi.' });
    } finally {
      set({ isLoading: false });
    }
  },

  updateSettings: (newSettings: Partial<EditorSettings>) => {
    // DÜZELTME: NaN değerleri filtrele
    const safeSettings: Partial<EditorSettings> = {};
    
    Object.entries(newSettings).forEach(([key, value]) => {
      if (typeof value === 'number' && !isNaN(value) && isFinite(value)) {
        safeSettings[key as keyof EditorSettings] = value;
      } else if (typeof value === 'string') {
        safeSettings[key as keyof EditorSettings] = value;
      }
    });
    
    set(state => ({ settings: { ...state.settings, ...safeSettings } }));
  },

  saveChanges: async () => {
    const { activePhoto, settings } = get();
    if (!activePhoto) {
      const error = 'Kaydedilecek aktif fotoğraf bulunamadı.';
      set({ error });
      throw new Error(error);
    }

    set({ isSaving: true, error: null });
    try {
      // Apply filters and get updated photo
      const updatedPhoto = await api.applyFiltersToPhoto(activePhoto.id, settings);
      
      set(state => ({
        activePhoto: updatedPhoto,
        isSaving: false
      }));
    } catch (error: any) {
      const errorMessage = error.message || 'Değişiklikler kaydedilemedi.';
      set({ error: errorMessage, isSaving: false });
      throw new Error(errorMessage);
    }
  },

  resetSettings: () => set({ settings: defaultSettings }),

  clearError: () => set({ error: null }),
  
  clearStore: () => {
    set({ activePhoto: null, settings: defaultSettings });
  },
}));