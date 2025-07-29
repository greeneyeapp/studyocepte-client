// stores/useEditorStore.ts - Enhanced Version
import { create } from 'zustand';
import { api, ProductPhoto, Background, EditorSettings } from '@/services/api';

// Enhanced settings interface matching the editor
interface EnhancedEditorSettings extends EditorSettings {
  // Photo positioning
  photoX: number;
  photoY: number;
  photoScale: number;
  photoRotation: number;
  
  // Enhanced adjustment settings (-100 to +100 range)
  exposure: number;
  highlights: number;
  shadows: number;
  brightness: number;
  contrast: number;
  saturation: number;
  vibrance: number;
  warmth: number;
  tint: number;
  clarity: number;
  noise: number;
  vignette: number;
  
  // Crop settings
  cropAspectRatio: string;
  cropX: number;
  cropY: number;
  cropWidth: number;
  cropHeight: number;
  
  // Effect target
  effectTarget: 'photo' | 'background' | 'both';
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
  
  // Preset filters
  applyPresetFilter: (presetName: string) => void;
}

const defaultSettings: EnhancedEditorSettings = {
  // Background
  backgroundId: 'bg1',
  
  // Photo positioning (0-1 range for relative positioning)
  photoX: 0.5, // Center horizontally
  photoY: 0.5, // Center vertically
  photoScale: 1.0,
  photoRotation: 0,
  
  // Legacy settings for API compatibility
  shadow: 0.5,
  lighting: 0.7,
  
  // Enhanced adjustment settings (-100 to +100)
  exposure: 0,
  highlights: 0,
  shadows: 0,
  brightness: 0,
  contrast: 0,
  saturation: 0,
  vibrance: 0,
  warmth: 0,
  tint: 0,
  clarity: 0,
  noise: 0,
  vignette: 0,
  
  // Crop settings
  cropAspectRatio: 'original',
  cropX: 0,
  cropY: 0,
  cropWidth: 1,
  cropHeight: 1,
  
  // Effect target
  effectTarget: 'photo',
};

// Preset filter configurations
const presetFilters = {
  original: {
    exposure: 0, highlights: 0, shadows: 0, brightness: 0, contrast: 0, 
    saturation: 0, vibrance: 0, warmth: 0, tint: 0, clarity: 0, noise: 0, vignette: 0
  },
  vivid: {
    saturation: 30, vibrance: 20, warmth: 10, contrast: 15, clarity: 10
  },
  dramatic: {
    contrast: 40, highlights: -20, shadows: 20, clarity: 25, vignette: 15
  },
  mono: {
    saturation: -100, contrast: 20, clarity: 15, vignette: 10
  },
  vintage: {
    warmth: 40, contrast: -10, vignette: 30, saturation: -20, shadows: 15
  },
  cool: {
    warmth: -30, tint: -20, saturation: 10, highlights: 10
  },
  warm: {
    warmth: 25, tint: 10, exposure: 5, shadows: -10
  },
  fade: {
    highlights: -30, shadows: 20, contrast: -20, saturation: -15
  },
  cinema: {
    contrast: 30, shadows: 25, highlights: -15, warmth: 5, vignette: 20
  },
  bright: {
    exposure: 20, highlights: 15, shadows: -10, vibrance: 15
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
    // Load existing settings if available, otherwise use defaults
    const existingSettings = photo.editorSettings || {};
    const loadedSettings: EnhancedEditorSettings = {
      ...defaultSettings,
      ...existingSettings,
      // Ensure enhanced settings exist
      photoX: existingSettings.photoX ?? 0.5,
      photoY: existingSettings.photoY ?? 0.5,
      photoScale: existingSettings.photoScale ?? 1.0,
      photoRotation: existingSettings.photoRotation ?? 0,
      effectTarget: (existingSettings as any).effectTarget ?? 'photo',
    };

    set({
      activePhoto: { ...photo },
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
      set({ 
        error: error.message || 'Fotoğraf yüklenemedi.',
        isLoading: false 
      });
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
    }
  },

  updateSettings: (newSettings: Partial<EnhancedEditorSettings>) => {
    // Validate and sanitize numeric values
    const safeSettings: Partial<EnhancedEditorSettings> = {};
    
    Object.entries(newSettings).forEach(([key, value]) => {
      if (typeof value === 'number') {
        // Ensure value is finite and not NaN
        if (isFinite(value) && !isNaN(value)) {
          // Apply appropriate ranges for different setting types
          if (['photoX', 'photoY', 'cropX', 'cropY', 'cropWidth', 'cropHeight'].includes(key)) {
            // Position and crop values: 0-1
            safeSettings[key as keyof EnhancedEditorSettings] = Math.max(0, Math.min(1, value));
          } else if (key === 'photoScale') {
            // Scale: 0.1-3.0
            safeSettings[key as keyof EnhancedEditorSettings] = Math.max(0.1, Math.min(3.0, value));
          } else if (key === 'photoRotation') {
            // Rotation: -180 to 180
            safeSettings[key as keyof EnhancedEditorSettings] = Math.max(-180, Math.min(180, value));
          } else if (['exposure', 'highlights', 'shadows', 'brightness', 'contrast', 'saturation', 'vibrance', 'warmth', 'tint', 'clarity', 'noise', 'vignette'].includes(key)) {
            // Adjustment values: -100 to 100
            safeSettings[key as keyof EnhancedEditorSettings] = Math.max(-100, Math.min(100, value));
          } else {
            // Other numeric values
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
    if (!activePhoto) {
      const error = 'Kaydedilecek aktif fotoğraf bulunamadı.';
      set({ error });
      throw new Error(error);
    }

    set({ isSaving: true, error: null });
    try {
      // Convert enhanced settings to API format
      const apiSettings: EditorSettings = {
        backgroundId: settings.backgroundId,
        shadow: settings.shadows / 100,
        lighting: settings.brightness / 100,
        brightness: 1 + (settings.exposure / 100),
        contrast: 1 + (settings.contrast / 100),
        saturation: 1 + (settings.saturation / 100),
        hue: settings.warmth / 100,
        sepia: Math.max(0, settings.warmth / 100),
        // Include enhanced settings for future use
        ...settings,
      };
      
      const updatedPhoto = await api.applyFiltersToPhoto(activePhoto.id, apiSettings);
      
      set(state => ({
        activePhoto: updatedPhoto,
        isSaving: false,
        hasUnsavedChanges: false,
      }));
    } catch (error: any) {
      const errorMessage = error.message || 'Değişiklikler kaydedilemedi.';
      set({ error: errorMessage, isSaving: false });
      throw new Error(errorMessage);
    }
  },

  resetSettings: () => {
    const { originalPhotoPosition } = get();
    const resetSettings = {
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
  },

  centerPhoto: () => {
    get().updateSettings({
      photoX: 0.5,
      photoY: 0.5,
      photoScale: 1.0,
      photoRotation: 0,
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

  applyPresetFilter: (presetName: string) => {
    const preset = presetFilters[presetName as keyof typeof presetFilters];
    if (preset) {
      get().updateSettings(preset);
    }
  },

  clearError: () => set({ error: null }),
  
  clearStore: () => {
    set({ 
      activePhoto: null, 
      settings: { ...defaultSettings },
      hasUnsavedChanges: false,
      error: null,
    });
  },
}));