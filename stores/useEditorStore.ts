// stores/useEditorStore.ts - Enhanced Version with Apple Photos Features
import { create } from 'zustand';
import { api, ProductPhoto, Background, EditorSettings } from '@/services/api';
import { ToastService } from '@/components/Toast/ToastService';

interface EnhancedEditorSettings extends EditorSettings {
  // Ürün katmanı ayarları
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
  
  // Arka plan katmanı ayarları
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
  
  // Mevcut ayarlar...
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
  
  // New positioning methods
  centerPhoto: () => void;
  resetPhotoPosition: () => void;
  
  // Preset filters - YENİ EKLENEN FONKSİYON
  applyPresetFilter: (presetName: string) => void;
}

const defaultSettings: EnhancedEditorSettings = {
  // Background
  backgroundId: 'bg1',
  
  // Photo positioning
  photoX: 0.5,
  photoY: 0.5, 
  photoScale: 1.0,
  photoRotation: 0,
  
  // Ürün katmanı varsayılanları
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
  
  // Arka plan katmanı varsayılanları
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
  
  // Legacy ayarlar
  shadow: 0.5,
  lighting: 0.7,
};

// Preset filter configurations - Apple Photos tarzı
const presetFilters = {
  original: {
    exposure: 0, highlights: 0, shadows: 0, brightness: 0, contrast: 0, 
    saturation: 0, vibrance: 0, warmth: 0, tint: 0, clarity: 0, noise: 0, vignette: 0
  },
  vivid: {
    saturation: 30, vibrance: 20, warmth: 10, contrast: 15, clarity: 10,
    exposure: 5, highlights: -5, shadows: 5
  },
  dramatic: {
    contrast: 40, highlights: -20, shadows: 20, clarity: 25, vignette: 15,
    saturation: 10, exposure: -5, warmth: 5
  },
  mono: {
    saturation: -100, contrast: 20, clarity: 15, vignette: 10,
    highlights: -10, shadows: 10, exposure: 5
  },
  vintage: {
    warmth: 40, contrast: -10, vignette: 30, saturation: -20, shadows: 15,
    exposure: -10, highlights: -15, clarity: -5, tint: 10
  },
  cool: {
    warmth: -30, tint: -20, saturation: 10, highlights: 10,
    contrast: 5, clarity: 5, vibrance: 15
  },
  warm: {
    warmth: 25, tint: 10, exposure: 5, shadows: -10,
    saturation: 15, vibrance: 10, contrast: 5
  },
  fade: {
    highlights: -30, shadows: 20, contrast: -20, saturation: -15,
    exposure: 10, warmth: 5, clarity: -10, vignette: 5
  },
  cinema: {
    contrast: 30, shadows: 25, highlights: -15, warmth: 5, vignette: 20,
    saturation: -5, clarity: 15, exposure: -5
  },
  bright: {
    exposure: 20, highlights: 15, shadows: -10, vibrance: 15,
    contrast: 10, clarity: 10, saturation: 5, warmth: 5
  },
};

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
    const existingSettings = photo.editorSettings || {};
    const loadedSettings: EnhancedEditorSettings = {
      ...defaultSettings,
      ...existingSettings,
      photoX: existingSettings.photoX ?? 0.5,
      photoY: existingSettings.photoY ?? 0.5,
      photoScale: existingSettings.photoScale ?? 1.0,
      photoRotation: existingSettings.photoRotation ?? 0,
      exposure: existingSettings.exposure ?? 0,
      highlights: existingSettings.highlights ?? 0,
      shadows: existingSettings.shadows ?? 0,
      brightness: existingSettings.brightness ?? 0,
      contrast: existingSettings.contrast ?? 0,
      saturation: existingSettings.saturation ?? 0,
      vibrance: (existingSettings as any).vibrance ?? 0, 
      warmth: existingSettings.warmth ?? 0,
      tint: (existingSettings as any).tint ?? 0, 
      clarity: (existingSettings as any).clarity ?? 0, 
      noise: (existingSettings as any).noise ?? 0, 
      vignette: existingSettings.vignette ?? 0,
      cropAspectRatio: (existingSettings as any).cropAspectRatio ?? 'original',
      cropX: (existingSettings as any).cropX ?? 0,
      cropY: (existingSettings as any).cropY ?? 0,
      cropWidth: (existingSettings as any).cropWidth ?? 1,
      cropHeight: (existingSettings as any).cropHeight ?? 1,
      effectTarget: (existingSettings as any).effectTarget ?? 'photo',
      backgroundId: existingSettings.backgroundId ?? 'bg1',
    };

    set({
      activePhoto: { 
        ...photo, 
        originalImageUrl: photo.processedImageUrl,
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
      console.log("Fetched photo data:", photo); 
      get().setActivePhoto(photo);
      set({ isLoading: false });
    } catch (error: any) {
      set({ 
        error: error.message || 'Fotoğraf yüklenemedi.',
        isLoading: false 
      });
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
      set({ 
        error: error.message || 'Arka planlar yüklenemedi.',
        isLoading: false 
      });
      ToastService.show({ type: 'error', text1: 'Hata', text2: error.message || 'Arka planlar yüklenemedi.' });
    }
  },

  updateSettings: (newSettings: Partial<EnhancedEditorSettings>) => {
    const safeSettings: Partial<EnhancedEditorSettings> = {};
    
    Object.entries(newSettings).forEach(([key, value]) => {
      if (typeof value === 'number') {
        if (isFinite(value) && !isNaN(value)) {
          if (['photoX', 'photoY', 'cropX', 'cropY', 'cropWidth', 'cropHeight'].includes(key)) {
            safeSettings[key as keyof EnhancedEditorSettings] = Math.max(0, Math.min(1, value));
          } else if (key === 'photoScale') {
            safeSettings[key as keyof EnhancedEditorSettings] = Math.max(0.1, Math.min(5.0, value));
          } else if (key === 'photoRotation') {
            safeSettings[key as keyof EnhancedEditorSettings] = Math.max(-180, Math.min(180, value));
          } else if (['exposure', 'highlights', 'shadows', 'brightness', 'contrast', 'saturation', 'vibrance', 'warmth', 'tint', 'clarity', 'noise', 'vignette'].includes(key)) {
            safeSettings[key as keyof EnhancedEditorSettings] = Math.max(-100, Math.min(100, value));
          } else {
            safeSettings[key as keyof EnhancedEditorSettings] = value;
          }
        }
      } else if (typeof value === 'string') {
        safeSettings[key as keyof EnhancedEditorSettings] = value;
      }
    });
    
    set(state => ({ 
      settings: { ...state.settings, ...safeSettings },
      hasUnsavedChanges: true,
    }));
  },

saveChanges: async () => {
  const { activePhoto, settings } = get();
  if (!activePhoto) throw new Error('Aktif fotoğraf bulunamadı.');

  set({ isSaving: true, error: null });
  try {
    const apiSettings: EditorSettings = {
      backgroundId: settings.backgroundId,
      photoX: settings.photoX,
      photoY: settings.photoY,
      photoScale: settings.photoScale,
      photoRotation: settings.photoRotation,
      
      // Katmanlı ayarları API formatına çevir
      product_exposure: settings.product_exposure,
      product_brightness: settings.product_brightness,
      product_contrast: settings.product_contrast,
      product_saturation: settings.product_saturation,
      product_warmth: settings.product_warmth,
      product_vignette: settings.product_vignette,
      
      background_exposure: settings.background_exposure,
      background_brightness: settings.background_brightness,
      background_contrast: settings.background_contrast,
      background_saturation: settings.background_saturation,
      background_warmth: settings.background_warmth,
      background_vignette: settings.background_vignette,
      
      // Legacy
      shadow: settings.product_shadows / 100,
      lighting: settings.product_brightness / 100,
    };
    
    await api.savePhotoSettings(activePhoto.id, apiSettings);
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
    set({ 
      settings: resetSettings,
      hasUnsavedChanges: true,
    });
  },

  resetToDefaults: () => {
    set({ 
      settings: { ...defaultSettings },
      hasUnsavedChanges: true,
    });
    ToastService.show({ 
      type: 'success', 
      text1: 'Sıfırlandı', 
      text2: 'Tüm ayarlar varsayılan değerlere döndürüldü.' 
    });
  },

  centerPhoto: () => {
    get().updateSettings({
      photoX: 0.5,
      photoY: 0.5,
      photoScale: 1.0,
      photoRotation: 0,
    });
    ToastService.show({ 
      type: 'success', 
      text1: 'Hizalandı', 
      text2: 'Fotoğraf merkeze hizalandı.' 
    });
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

  // YENİ EKLENEN FONKSİYON: Apple Photos tarzı preset filtreler - Toast'sız
  applyPresetFilter: (presetName: string) => {
    const preset = presetFilters[presetName as keyof typeof presetFilters];
    if (preset) {
      get().updateSettings({ ...preset });
      // Toast mesajını kaldırdık - sadece sessizce uygula
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