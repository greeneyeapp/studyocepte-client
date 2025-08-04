// client/stores/useEnhancedEditorStore.ts (TAM VE GÜNCELLENMİŞ HALİ)
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, ProductPhoto, EditorSettings as ApiEditorSettings } from '@/services/api';
import { ToastService } from '@/components/Toast/ToastService';
import { ALL_FILTERS } from '@/features/editor/config/filters';
import { ADJUST_FEATURES, BACKGROUND_FEATURES } from '@/features/editor/config/features';
import { TargetType } from '@/features/editor/config/tools';

export interface EditorSettings extends ApiEditorSettings {
  cropAspectRatio?: string;
  cropX?: number;
  cropY?: number;
  cropWidth?: number;
  cropHeight?: number;
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
  resetCropAndRotation: () => void; // YENİ AKSİYON
  clearStore: () => void;
}

const defaultSettings: EditorSettings = {
  backgroundId: 'bg1',
  photoX: 0.5, photoY: 0.5, photoScale: 1.0, photoRotation: 0,
  product_exposure: 0, product_brightness: 0, product_contrast: 0, product_saturation: 0,
  product_vibrance: 0, product_warmth: 0, product_clarity: 0,
  product_highlights: 0, product_shadows: 0,
  background_exposure: 0, background_brightness: 0, background_contrast: 0, background_saturation: 0,
  background_vibrance: 0, background_warmth: 0, background_clarity: 0,
  background_highlights: 0, background_shadows: 0, background_blur: 0, background_vignette: 0,
  cropAspectRatio: 'original', cropX: 0, cropY: 0, cropWidth: 1, cropHeight: 1,
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

      // YENİ AKSİYON TANIMI
      resetCropAndRotation: () => {
        get().updateSettings({
          cropAspectRatio: 'original',
          photoRotation: 0,
        });
        get().addSnapshotToHistory();
      },

      setActivePhoto: (photo: ProductPhoto) => {
        const loadedSettings: EditorSettings = { ...defaultSettings, ...(photo.editorSettings || {}) };
        const initialEntry = { settings: loadedSettings, timestamp: Date.now() };
        set({ activePhoto: photo, settings: loadedSettings, hasUnsavedChanges: false, history: [initialEntry], currentHistoryIndex: 0, activeFilterKey: 'original' });
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

        const currentState = get();
        const currentSettings = currentState.settings;
        const newSettings = { ...currentSettings };

        if (target === 'all') {
             const allFeatures = Array.from(new Set([...ADJUST_FEATURES, ...BACKGROUND_FEATURES]));
             allFeatures.forEach(feature => {
                 (newSettings as any)[`product_${feature.key}`] = 0;
                 (newSettings as any)[`background_${feature.key}`] = 0;
             });
             (newSettings as any).background_blur = 0;
             (newSettings as any).background_vignette = 0;
        }

        for (const [key, value] of Object.entries(filterPreset.settings)) {
          const settingKey = key as keyof EditorSettings;
          if (target === 'all') {
            (newSettings as any)[settingKey] = value;
          } else if (target === 'product' && key.startsWith('product_')) {
            (newSettings as any)[settingKey] = value;
          } else if (target === 'background' && key.startsWith('background_')) {
            (newSettings as any)[settingKey] = value;
          }
        }
        
        set({
          settings: newSettings,
          activeFilterKey: filterKey,
          hasUnsavedChanges: true
        });
        
        currentState.addSnapshotToHistory();
      },

      setActiveFilterKey: (key) => set({ activeFilterKey: key }),

      saveChanges: async () => {
        const { activePhoto, settings, isSaving } = get();
        if (!activePhoto || isSaving) return;
        set({ isSaving: true });
        try {
          await api.savePhotoSettings(activePhoto.id, settings);
          set({ isSaving: false, hasUnsavedChanges: false });
          ToastService.show({ type: 'success', text1: 'Kaydedildi', text2: 'Değişiklikler başarıyla kaydedildi.' });
        } catch (error: any) {
          set({ isSaving: false });
          ToastService.show({ type: 'error', text1: 'Hata', text2: error.message || 'Değişiklikler kaydedilemedi.' });
        }
      },

      addSnapshotToHistory: () => {
        const { settings, history, currentHistoryIndex } = get();
        if (JSON.stringify(history[currentHistoryIndex]?.settings) === JSON.stringify(settings)) return;
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

      clearStore: () => set({ activePhoto: null, settings: { ...defaultSettings }, history: [], currentHistoryIndex: -1, hasUnsavedChanges: false, isSaving: false }),
    }),
    {
      name: 'enhanced-editor-storage-v2',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ userPresets: state.userPresets }),
    }
  )
);