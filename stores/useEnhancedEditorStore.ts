import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ToastService } from '@/components/Toast/ToastService';
import { ALL_FILTERS } from '@/features/editor/config/filters';
import { ADJUST_FEATURES, BACKGROUND_FEATURES } from '@/features/editor/config/features';
import { TargetType } from '@/features/editor/config/tools';
import { useProductStore, ProductPhoto } from './useProductStore';

/**
 * Editörde kullanılabilecek tüm ayarları içeren kapsamlı arayüz.
 * Bu ayarlar, hem ürün hem de arka plan için ayrı ayrı tutulur.
 */
export interface EditorSettings {
  // Genel Ayarlar
  backgroundId: string;

  // Fotoğrafın Pozisyon, Boyut ve Dönme Ayarları
  photoX?: number;
  photoY?: number;
  photoScale?: number;
  photoRotation?: number;

  // Ürün Ayarları
  product_exposure?: number;
  product_brightness?: number;
  product_highlights?: number;
  product_shadows?: number;
  product_contrast?: number;
  product_saturation?: number;
  product_vibrance?: number;
  product_warmth?: number;
  product_clarity?: number;

  // Arka Plan Ayarları
  background_exposure?: number;
  background_brightness?: number;
  background_contrast?: number;
  background_saturation?: number;
  background_warmth?: number;
  background_vignette?: number;
  background_blur?: number;

  // Kırpma Ayarları
  cropAspectRatio?: string;
  cropX?: number;
  cropY?: number;
  cropWidth?: number;
  cropHeight?: number;
  visualCrop?: {
    aspectRatio: string;
    x: number;
    y: number;
    width: number;
    height: number;
    isApplied: boolean;
  };
}

interface UserPreset extends EditorSettings { id: string; name: string; }
interface EditorHistoryEntry { settings: EditorSettings; timestamp: number; }

interface EditorState {
  activePhoto: ProductPhoto | null;
  settings: EditorSettings;
  history: EditorHistoryEntry[];
  currentHistoryIndex: number;
  activeFilterKey: string;
  hasUnsavedChanges: boolean;
  isSaving: boolean;
  userPresets: UserPreset[];
}

interface EditorActions {
  setActivePhoto: (photo: ProductPhoto) => void;
  updateSettings: (newSettings: Partial<EditorSettings>) => void;
  setActiveFilterKey: (key: string) => void;
  saveChanges: () => Promise<void>;
  undo: () => void;
  redo: () => void;
  addSnapshotToHistory: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  applyFilter: (filterKey: string, target: TargetType) => void;
  resetCropAndRotation: () => void;
  applyCrop: () => void;
  clearStore: () => void;
}

const defaultSettings: EditorSettings = {
  backgroundId: 'bg1',
  photoX: 0.5, photoY: 0.5, photoScale: 1.0, photoRotation: 0,
  product_exposure: 0, product_brightness: 0, product_contrast: 0, product_saturation: 0,
  product_vibrance: 0, product_warmth: 0, product_clarity: 0, product_highlights: 0, product_shadows: 0,
  background_exposure: 0, background_brightness: 0, background_contrast: 0, background_saturation: 0,
  background_warmth: 0, background_vignette: 0, background_blur: 0,
  cropAspectRatio: 'original', cropX: 0, cropY: 0, cropWidth: 1, cropHeight: 1, visualCrop: undefined,
};

export const useEnhancedEditorStore = create<EditorState & EditorActions>()(
  persist(
    (set, get) => ({
      activePhoto: null,
      settings: { ...defaultSettings },
      history: [],
      currentHistoryIndex: -1,
      activeFilterKey: 'original',
      hasUnsavedChanges: false,
      isSaving: false,
      userPresets: [],

      setActivePhoto: (photo: ProductPhoto) => {
        const loadedSettings: EditorSettings = { ...defaultSettings, ...(photo.editorSettings || {}) };
        const initialEntry = { settings: loadedSettings, timestamp: Date.now() };
        set({
          activePhoto: photo,
          settings: loadedSettings,
          hasUnsavedChanges: false,
          history: [initialEntry],
          currentHistoryIndex: 0,
          activeFilterKey: 'original'
        });
      },

      updateSettings: (newSettings: Partial<EditorSettings>) => {
        set(state => ({
          settings: { ...state.settings, ...newSettings },
          hasUnsavedChanges: true,
          activeFilterKey: 'custom'
        }));
      },

      applyFilter: (filterKey: string, target: TargetType) => {
        const filterPreset = ALL_FILTERS.find(f => f.key === filterKey);
        if (!filterPreset) return;

        const currentSettings = { ...get().settings };

        const featuresToReset = target === 'all'
          ? [...ADJUST_FEATURES, ...BACKGROUND_FEATURES]
          : target === 'product' ? ADJUST_FEATURES : BACKGROUND_FEATURES;

        featuresToReset.forEach(feature => {
            if (target === 'all') {
                (currentSettings as any)[`product_${feature.key}`] = 0;
                (currentSettings as any)[`background_${feature.key}`] = 0;
            } else {
                 (currentSettings as any)[`${target}_${feature.key}`] = 0;
            }
        });

        for (const [key, value] of Object.entries(filterPreset.settings)) {
          if (target === 'all' || key.startsWith(target)) {
            (currentSettings as any)[key] = value;
          }
        }
        
        set({ settings: currentSettings, activeFilterKey: filterKey, hasUnsavedChanges: true });
        get().addSnapshotToHistory();
      },

      saveChanges: async () => {
        const { activePhoto, settings, isSaving } = get();
        if (!activePhoto || isSaving) return;
        set({ isSaving: true });
        try {
          useProductStore.getState().updatePhotoSettings(activePhoto.productId, activePhoto.id, settings);
          set({ isSaving: false, hasUnsavedChanges: false });
          ToastService.show({ type: 'success', text1: 'Kaydedildi', text2: 'Değişiklikler yerel olarak kaydedildi.' });
        } catch (error: any) {
          set({ isSaving: false });
          ToastService.show({ type: 'error', text1: 'Hata', text2: 'Değişiklikler kaydedilemedi.' });
        }
      },

      addSnapshotToHistory: () => {
        const { settings, history, currentHistoryIndex } = get();
        const currentSnapshot = history[currentHistoryIndex]?.settings;
        if (currentSnapshot && JSON.stringify(currentSnapshot) === JSON.stringify(settings)) return;
        
        const newHistory = history.slice(0, currentHistoryIndex + 1);
        newHistory.push({ settings: { ...settings }, timestamp: Date.now() });
        set({ history: newHistory, currentHistoryIndex: newHistory.length - 1 });
      },

      undo: () => {
        const { history, currentHistoryIndex } = get();
        if (currentHistoryIndex > 0) {
          const newIndex = currentHistoryIndex - 1;
          set({ settings: { ...history[newIndex].settings }, currentHistoryIndex: newIndex, hasUnsavedChanges: true });
        }
      },

      redo: () => {
        const { history, currentHistoryIndex } = get();
        if (currentHistoryIndex < history.length - 1) {
          const newIndex = currentHistoryIndex + 1;
          set({ settings: { ...history[newIndex].settings }, currentHistoryIndex: newIndex, hasUnsavedChanges: true });
        }
      },

      canUndo: () => get().currentHistoryIndex > 0,
      canRedo: () => get().currentHistoryIndex < get().history.length - 1,

      resetCropAndRotation: () => {
        get().updateSettings({
          cropAspectRatio: 'original', photoRotation: 0,
          cropX: 0, cropY: 0, cropWidth: 1, cropHeight: 1,
          visualCrop: undefined,
        });
        get().addSnapshotToHistory();
      },

      applyCrop: () => {
        const { settings } = get();
        const visualCrop = {
          aspectRatio: settings.cropAspectRatio || 'original',
          x: settings.cropX || 0, y: settings.cropY || 0,
          width: settings.cropWidth || 1, height: settings.cropHeight || 1,
          isApplied: true,
        };
        get().updateSettings({ visualCrop });
        get().addSnapshotToHistory();
        ToastService.show({ type: 'success', text1: 'Kırpma Uygulandı' });
      },
      
      clearStore: () => set({
        activePhoto: null, settings: { ...defaultSettings }, history: [],
        currentHistoryIndex: -1, hasUnsavedChanges: false, isSaving: false
      }),

      // Bu fonksiyonlar dışarıdan export edilmiyor ama burada tanımlı.
      // Bunlar EditorActions'da var.
      setActiveFilterKey: (key) => set({ activeFilterKey: key }),
    }),
    {
      name: 'enhanced-editor-storage-v2',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ userPresets: state.userPresets }),
    }
  )
);