// stores/useEditorStore.ts - Düzeltilmiş ve Son Hali
import { create } from 'zustand';
import { api, ProductPhoto, Background, EditorSettings } from '@/services/api';
import { ToastService } from '@/components/Toast/ToastService';

// Bu arayüz, store içinde kullanılacak olan, tüm alanları zorunlu olan versiyondur.
interface EnhancedEditorSettings extends EditorSettings {
  product_exposure: number;
  product_brightness: number;
  product_contrast: number;
  product_saturation: number;
  product_vibrance: number;
  product_warmth: number;
  product_clarity: number;
  product_vignette: number;
  product_highlights: number;
  product_shadows: number;
  
  background_exposure: number;
  background_brightness: number;
  background_contrast: number;
  background_saturation: number;
  background_vibrance: number;
  background_warmth: number;
  background_clarity: number;
  background_vignette: number;
  background_highlights: number;
  background_shadows: number;
  background_blur: number;
  
  photoX: number;
  photoY: number;
  photoScale: number;
  photoRotation: number;
  
  backgroundId: string;
}

interface EditorState {
  activePhoto: ProductPhoto | null;
  backgrounds: Background[];
  settings: EnhancedEditorSettings;
  originalPhotoPosition: { x: number; y: number; scale: number; rotation: number };
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  hasUnsavedChanges: boolean;
}

interface EditorActions {
  setActivePhoto: (photo: ProductPhoto) => void;
  setActivePhotoById: (photoId: string) => Promise<void>;
  fetchBackgrounds: () => Promise<void>;
  updateSettings: (newSettings: Partial<EnhancedEditorSettings>) => void;
  saveChanges: () => Promise<void>;
  resetSettings: () => void;
  resetToDefaults: () => void;
  clearError: () => void;
  clearStore: () => void;
  centerPhoto: () => void;
  resetPhotoPosition: () => void;
  applyPresetFilter: (presetName: string) => void;
}

const defaultSettings: EnhancedEditorSettings = {
  backgroundId: 'bg1',
  photoX: 0.5,
  photoY: 0.5, 
  photoScale: 1.0,
  photoRotation: 0,
  product_exposure: 0,
  product_brightness: 0,
  product_contrast: 0,
  product_saturation: 0,
  product_vibrance: 0,
  product_warmth: 0,
  product_clarity: 0,
  product_vignette: 0,
  product_highlights: 0,
  product_shadows: 0,
  background_exposure: 0,
  background_brightness: 0,
  background_contrast: 0,
  background_saturation: 0,
  background_vibrance: 0,
  background_warmth: 0,
  background_clarity: 0,
  background_vignette: 0,
  background_highlights: 0,
  background_shadows: 0,
  background_blur: 0,
  shadow: 0.5,
  lighting: 0.7,
};

const presetFilters = {
  original: {},
  vivid: { product_saturation: 30, product_vibrance: 20, product_warmth: 10, product_contrast: 15, product_clarity: 10, product_exposure: 5, product_highlights: -5, product_shadows: 5 },
  dramatic: { product_contrast: 40, product_highlights: -20, product_shadows: 20, product_clarity: 25, product_vignette: 15, product_saturation: 10, product_exposure: -5, product_warmth: 5 },
  mono: { product_saturation: -100, product_contrast: 20, product_clarity: 15, product_vignette: 10, product_highlights: -10, product_shadows: 10, product_exposure: 5 },
  vintage: { product_warmth: 40, product_contrast: -10, product_vignette: 30, product_saturation: -20, product_shadows: 15, product_exposure: -10, product_highlights: -15, product_clarity: -5 },
  cool: { product_warmth: -30, product_saturation: 10, product_highlights: 10, product_contrast: 5, product_clarity: 5, product_vibrance: 15 },
  warm: { product_warmth: 25, product_exposure: 5, product_shadows: -10, product_saturation: 15, product_vibrance: 10, product_contrast: 5 },
  fade: { product_highlights: -30, product_shadows: 20, product_contrast: -20, product_saturation: -15, product_exposure: 10, product_warmth: 5, product_clarity: -10, product_vignette: 5 },
  cinema: { product_contrast: 30, product_shadows: 25, product_highlights: -15, product_warmth: 5, product_vignette: 20, product_saturation: -5, product_clarity: 15, product_exposure: -5 },
  bright: { product_exposure: 20, product_highlights: 15, product_shadows: -10, product_vibrance: 15, product_contrast: 10, product_clarity: 10, product_saturation: 5, product_warmth: 5 },
} as const;

export const useEditorStore = create<EditorState & EditorActions>((set, get) => ({
  activePhoto: null,
  backgrounds: [],
  settings: { ...defaultSettings },
  originalPhotoPosition: { x: 0.5, y: 0.5, scale: 1.0, rotation: 0 },
  isLoading: false,
  isSaving: false,
  error: null,
  hasUnsavedChanges: false,

  setActivePhoto: (photo: ProductPhoto) => {
    // HATA DÜZELTİLDİ: `existingSettings`'in tipi `Partial<EditorSettings>` olarak belirtildi
    // ve `photo.editorSettings` null ise boş obje atandı.
    const existingSettings: Partial<EditorSettings> = photo.editorSettings || {};

    const loadedSettings: EnhancedEditorSettings = {
      ...defaultSettings,
      ...existingSettings,
      // HATA DÜZELTİLDİ: `existingSettings`'de bu alanlar olmayabilir.
      // Bu yüzden `defaultSettings`'den veya mantıksal bir varsayılandan yola çıkıyoruz.
      photoX: existingSettings.photoX ?? defaultSettings.photoX,
      photoY: existingSettings.photoY ?? defaultSettings.photoY,
      photoScale: existingSettings.photoScale ?? defaultSettings.photoScale,
      photoRotation: existingSettings.photoRotation ?? defaultSettings.photoRotation,
    };

    set({
      activePhoto: { 
        ...photo, 
        originalImageUrl: photo.originalImageUrl,
      }, 
      settings: loadedSettings,
      originalPhotoPosition: {
        x: loadedSettings.photoX,
        y: loadedSettings.photoY,
        scale: loadedSettings.photoScale,
        rotation: loadedSettings.photoRotation,
      },
      hasUnsavedChanges: false,
    });
  },

  setActivePhotoById: async (photoId: string) => {
    set({ isLoading: true, error: null });
    try {
      const photo = await api.fetchPhotoById(photoId);
      get().setActivePhoto(photo);
      set({ isLoading: false });
    } catch (error: any) {
      set({ error: error.message || 'Fotoğraf yüklenemedi.', isLoading: false });
      ToastService.show({ type: 'error', text1: 'Hata', text2: error.message || 'Fotoğraf yüklenemedi.' });
      throw error;
    }
  },

  fetchBackgrounds: async () => {
    const currentBackgrounds = get().backgrounds;
    if (currentBackgrounds.length > 0) return;
    set({ isLoading: true });
    try {
      const backgrounds = await api.fetchBackgrounds();
      set({ backgrounds, isLoading: false });
    } catch (error: any) {
      set({ error: error.message || 'Arka planlar yüklenemedi.', isLoading: false });
      ToastService.show({ type: 'error', text1: 'Hata', text2: error.message || 'Arka planlar yüklenemedi.' });
    }
  },

  updateSettings: (newSettings: Partial<EnhancedEditorSettings>) => {
    // Bu fonksiyondaki mantık zaten güvenli, değişiklik gerekmiyor.
    set(state => ({ 
      settings: { ...state.settings, ...newSettings },
      hasUnsavedChanges: true,
    }));
  },

  saveChanges: async () => {
    const { activePhoto, settings } = get();
    if (!activePhoto) throw new Error('Aktif fotoğraf bulunamadı.');

    set({ isSaving: true, error: null });
    try {
      // API'ye gönderirken `EnhancedEditorSettings` `EditorSettings` ile uyumlu olduğu için
      // doğrudan gönderebiliriz.
      await api.savePhotoSettings(activePhoto.id, settings);
      set({ isSaving: false, hasUnsavedChanges: false });
    } catch (error: any) {
      set({ error: error.message, isSaving: false });
      throw error;
    }
  },

  resetSettings: () => {
    const { originalPhotoPosition } = get();
    const resetSettings: EnhancedEditorSettings = {
      ...defaultSettings,
      photoX: originalPhotoPosition.x,
      photoY: originalPhotoPosition.y,
      photoScale: originalPhotoPosition.scale,
      photoRotation: originalPhotoPosition.rotation,
    };
    set({ settings: resetSettings, hasUnsavedChanges: true });
  },

  resetToDefaults: () => {
    set({ settings: { ...defaultSettings }, hasUnsavedChanges: true });
    ToastService.show({ type: 'success', text1: 'Sıfırlandı', text2: 'Tüm ayarlar varsayılan değerlere döndürüldü.' });
  },

  centerPhoto: () => {
    get().updateSettings({ photoX: 0.5, photoY: 0.5, photoScale: 1.0, photoRotation: 0 });
    ToastService.show({ type: 'success', text1: 'Hizalandı', text2: 'Fotoğraf merkeze hizalandı.' });
  },

  resetPhotoPosition: () => {
    const { originalPhotoPosition } = get();
    get().updateSettings({
      photoX: originalPhotoPosition.x,
      photoY: originalPhotoPosition.y,
      photoScale: originalPhotoPosition.scale,
      photoRotation: originalPhotoPosition.rotation,
    });
  },

  applyPresetFilter: (presetName: string) => {
    const preset = presetFilters[presetName as keyof typeof presetFilters];
    if (preset) {
      get().updateSettings(preset);
    } else {
      console.warn(`Bilinmeyen preset filtre: ${presetName}`);
    }
  },

  clearError: () => set({ error: null }),
  
  clearStore: () => {
    set({ 
      activePhoto: null, 
      settings: { ...defaultSettings },
      hasUnsavedChanges: false,
      error: null,
      backgrounds: [],
    });
  },
}));