// stores/useEnhancedEditorStore.ts - Gelişmiş Editor Store
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api, ProductPhoto } from '@/services/api';
import { ToastService } from '@/components/Toast/ToastService';

interface EditorHistory {
  id: string;
  settings: EditorSettings;
  timestamp: number;
  description: string;
}

interface EnhancedEditorSettings {
  // Katman bazlı ayarlar
  product_exposure: number;
  product_brightness: number;
  product_contrast: number;
  product_saturation: number;
  product_warmth: number;
  product_highlights: number;
  product_shadows: number;
  product_clarity: number;
  product_vignette: number;
  
  background_exposure: number;
  background_brightness: number;
  background_contrast: number;
  background_saturation: number;
  background_warmth: number;
  background_highlights: number;
  background_shadows: number;
  background_clarity: number;
  background_vignette: number;
  background_blur: number;
  
  // Pozisyon ayarları
  photoX: number;
  photoY: number;
  photoScale: number;
  photoRotation: number;
  
  // Diğer ayarlar
  backgroundId: string;
  appliedFilter?: string;
  lastModified: number;
}

interface EditorState {
  activePhoto: ProductPhoto | null;
  settings: EnhancedEditorSettings;
  history: EditorHistory[];
  currentHistoryIndex: number;
  hasUnsavedChanges: boolean;
  autoSaveEnabled: boolean;
  lastAutoSave: number;
  isProcessing: boolean;
  previewQuality: 'low' | 'medium' | 'high';
}

interface EditorActions {
  // Temel işlemler
  setActivePhoto: (photo: ProductPhoto) => void;
  updateSettings: (newSettings: Partial<EnhancedEditorSettings>) => void;
  saveChanges: () => Promise<void>;
  
  // History yönetimi
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  addToHistory: (description: string) => void;
  clearHistory: () => void;
  
  // Auto-save
  enableAutoSave: (enabled: boolean) => void;
  performAutoSave: () => Promise<void>;
  
  // Preset yönetimi
  saveAsPreset: (name: string) => Promise<void>;
  loadPreset: (presetId: string) => Promise<void>;
  
  // Performance
  setPreviewQuality: (quality: 'low' | 'medium' | 'high') => void;
  
  // Utility
  resetToDefaults: () => void;
  exportSettings: () => string;
  importSettings: (settingsJson: string) => void;
}

const defaultSettings: EnhancedEditorSettings = {
  product_exposure: 0,
  product_brightness: 0,
  product_contrast: 0,
  product_saturation: 0,
  product_warmth: 0,
  product_highlights: 0,
  product_shadows: 0,
  product_clarity: 0,
  product_vignette: 0,
  
  background_exposure: 0,
  background_brightness: 0,
  background_contrast: 0,
  background_saturation: 0,
  background_warmth: 0,
  background_highlights: 0,
  background_shadows: 0,
  background_clarity: 0,
  background_vignette: 0,
  background_blur: 0,
  
  photoX: 0.5,
  photoY: 0.5,
  photoScale: 1.0,
  photoRotation: 0,
  
  backgroundId: 'bg1',
  lastModified: Date.now(),
};

export const useEnhancedEditorStore = create<EditorState & EditorActions>()(
  persist(
    (set, get) => ({
      // State
      activePhoto: null,
      settings: { ...defaultSettings },
      history: [],
      currentHistoryIndex: -1,
      hasUnsavedChanges: false,
      autoSaveEnabled: true,
      lastAutoSave: 0,
      isProcessing: false,
      previewQuality: 'medium',

      // Actions
      setActivePhoto: (photo: ProductPhoto) => {
        const existingSettings = photo.editorSettings || {};
        const loadedSettings: EnhancedEditorSettings = {
          ...defaultSettings,
          ...existingSettings,
          lastModified: Date.now(),
        };

        set({
          activePhoto: photo,
          settings: loadedSettings,
          hasUnsavedChanges: false,
          history: [{
            id: 'initial',
            settings: loadedSettings,
            timestamp: Date.now(),
            description: 'Fotoğraf yüklendi'
          }],
          currentHistoryIndex: 0,
        });
      },

      updateSettings: (newSettings: Partial<EnhancedEditorSettings>) => {
        const currentSettings = get().settings;
        const updatedSettings = {
          ...currentSettings,
          ...newSettings,
          lastModified: Date.now(),
        };

        set({
          settings: updatedSettings,
          hasUnsavedChanges: true,
        });

        // Auto-save kontrol
        const state = get();
        if (state.autoSaveEnabled && Date.now() - state.lastAutoSave > 30000) { // 30 saniye
          state.performAutoSave();
        }
      },

      saveChanges: async () => {
        const { activePhoto, settings } = get();
        if (!activePhoto) throw new Error('Aktif fotoğraf bulunamadı.');

        set({ isProcessing: true });
        
        try {
          await api.savePhotoSettings(activePhoto.id, settings as any);
          set({ 
            hasUnsavedChanges: false,
            lastAutoSave: Date.now(),
            isProcessing: false 
          });
          
          ToastService.show({
            type: 'success',
            text1: 'Kaydedildi',
            text2: 'Değişiklikler başarıyla kaydedildi'
          });
        } catch (error) {
          set({ isProcessing: false });
          throw error;
        }
      },

      // History yönetimi
      addToHistory: (description: string) => {
        const { settings, history, currentHistoryIndex } = get();
        
        const newHistoryEntry: EditorHistory = {
          id: Date.now().toString(),
          settings: { ...settings },
          timestamp: Date.now(),
          description,
        };

        // Mevcut index'ten sonrasını sil (yeni branch oluştur)
        const newHistory = history.slice(0, currentHistoryIndex + 1);
        newHistory.push(newHistoryEntry);

        // History boyutunu sınırla (max 50)
        if (newHistory.length > 50) {
          newHistory.shift();
        }

        set({
          history: newHistory,
          currentHistoryIndex: newHistory.length - 1,
        });
      },

      undo: () => {
        const { history, currentHistoryIndex } = get();
        if (currentHistoryIndex > 0) {
          const newIndex = currentHistoryIndex - 1;
          const previousSettings = history[newIndex].settings;
          
          set({
            settings: { ...previousSettings },
            currentHistoryIndex: newIndex,
            hasUnsavedChanges: true,
          });
        }
      },

      redo: () => {
        const { history, currentHistoryIndex } = get();
        if (currentHistoryIndex < history.length - 1) {
          const newIndex = currentHistoryIndex + 1;
          const nextSettings = history[newIndex].settings;
          
          set({
            settings: { ...nextSettings },
            currentHistoryIndex: newIndex,
            hasUnsavedChanges: true,
          });
        }
      },

      canUndo: () => {
        const { currentHistoryIndex } = get();
        return currentHistoryIndex > 0;
      },

      canRedo: () => {
        const { history, currentHistoryIndex } = get();
        return currentHistoryIndex < history.length - 1;
      },

      clearHistory: () => {
        const { settings } = get();
        set({
          history: [{
            id: 'reset',
            settings: { ...settings },
            timestamp: Date.now(),
            description: 'History temizlendi'
          }],
          currentHistoryIndex: 0,
        });
      },

      // Auto-save
      enableAutoSave: (enabled: boolean) => {
        set({ autoSaveEnabled: enabled });
      },

      performAutoSave: async () => {
        const { hasUnsavedChanges, activePhoto, settings } = get();
        
        if (!hasUnsavedChanges || !activePhoto) return;

        try {
          await api.savePhotoSettings(activePhoto.id, settings as any);
          set({ 
            hasUnsavedChanges: false,
            lastAutoSave: Date.now() 
          });
        } catch (error) {
          console.warn('Auto-save başarısız:', error);
        }
      },

      // Presets
      saveAsPreset: async (name: string) => {
        const { settings } = get();
        // Bu API endpoint'ini oluşturmanız gerekecek
        // await api.savePreset(name, settings);
        ToastService.show({
          type: 'success',
          text1: 'Preset Kaydedildi',
          text2: `"${name}" adıyla kaydedildi`
        });
      },

      loadPreset: async (presetId: string) => {
        // const presetSettings = await api.loadPreset(presetId);
        // get().updateSettings(presetSettings);
        get().addToHistory(`Preset yüklendi: ${presetId}`);
      },

      // Performance
      setPreviewQuality: (quality: 'low' | 'medium' | 'high') => {
        set({ previewQuality: quality });
      },

      // Utility
      resetToDefaults: () => {
        set({ 
          settings: { ...defaultSettings, lastModified: Date.now() },
          hasUnsavedChanges: true 
        });
        get().addToHistory('Varsayılan ayarlara döndürüldü');
      },

      exportSettings: () => {
        const { settings } = get();
        return JSON.stringify(settings, null, 2);
      },

      importSettings: (settingsJson: string) => {
        try {
          const importedSettings = JSON.parse(settingsJson);
          set({ 
            settings: { 
              ...defaultSettings, 
              ...importedSettings,
              lastModified: Date.now()
            },
            hasUnsavedChanges: true 
          });
          get().addToHistory('Ayarlar içe aktarıldı');
          
          ToastService.show({
            type: 'success',
            text1: 'İçe Aktarıldı',
            text2: 'Ayarlar başarıyla yüklendi'
          });
        } catch (error) {
          ToastService.show({
            type: 'error',
            text1: 'Hata',
            text2: 'Geçersiz ayar dosyası'
          });
        }
      },
    }),
    {
      name: 'enhanced-editor-storage',
      partialize: (state) => ({
        autoSaveEnabled: state.autoSaveEnabled,
        previewQuality: state.previewQuality,
        // Sadece önemli ayarları persist et
      }),
    }
  )
);