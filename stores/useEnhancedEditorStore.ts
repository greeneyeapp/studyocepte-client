import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, ProductPhoto, EditorSettings as ApiEditorSettings } from '@/services/api';
import { ToastService } from '@/components/Toast/ToastService';
import { InputDialogService } from '@/components/Dialog/InputDialogService';
import { ALL_FILTERS } from '@/features/editor/config/filters';
import { ADJUST_FEATURES } from '@/features/editor/config/features';

export interface EditorSettings extends ApiEditorSettings {
  cropAspectRatio?: string;
  cropX?: number;
  cropY?: number;
  cropWidth?: number;
  cropHeight?: number;
}

interface UserPreset extends EditorSettings {
  id: string;
  name: string;
}

interface EditorHistoryEntry {
  settings: EditorSettings;
  timestamp: number;
}

interface EditorState {
  activePhoto: ProductPhoto | null;
  settings: EditorSettings;
  history: EditorHistoryEntry[];
  currentHistoryIndex: number;
  activeFilterKey: string;
  hasUnsavedChanges: boolean;
  isSaving: boolean;
  userPresets: UserPreset[];
  autoSaveEnabled: boolean;
  lastAutoSave: number;
}

interface EditorActions {
  setActivePhoto: (photo: ProductPhoto) => void;
  updateSettings: (newSettings: Partial<EditorSettings>) => void;
  saveChanges: () => Promise<void>;
  undo: () => void;
  redo: () => void;
  addSnapshotToHistory: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  applyFilter: (filterKey: string) => void;
  saveCurrentUserPreset: () => void;
  applyUserPreset: (presetId: string) => void;
  deleteUserPreset: (presetId: string) => void;
  resetToDefaults: () => void;
  clearStore: () => void;
  performAutoSave: () => Promise<void>;
  toggleAutoSave: (enabled: boolean) => void;
}

const defaultSettings: EditorSettings = {
  backgroundId: 'bg1',
  photoX: 0.5, photoY: 0.5, photoScale: 1.0, photoRotation: 0,
  product_exposure: 0, product_brightness: 0, product_contrast: 0, product_saturation: 0,
  product_vibrance: 0, product_warmth: 0, product_clarity: 0, product_vignette: 0,
  product_highlights: 0, product_shadows: 0,
  background_exposure: 0, background_brightness: 0, background_contrast: 0, background_saturation: 0,
  background_vibrance: 0, background_warmth: 0, background_clarity: 0, background_vignette: 0,
  background_highlights: 0, background_shadows: 0, background_blur: 0,
  shadow: 0.5, lighting: 0.7,
  cropAspectRatio: 'original',
  cropX: 0, cropY: 0, cropWidth: 1, cropHeight: 1,
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
      autoSaveEnabled: true,
      lastAutoSave: 0,

      setActivePhoto: (photo: ProductPhoto) => {
        const loadedSettings: EditorSettings = {
          ...defaultSettings,
          ...(photo.editorSettings || {}),
        };

        set({
          activePhoto: photo,
          settings: loadedSettings,
          hasUnsavedChanges: false,
          history: [{ settings: loadedSettings, timestamp: Date.now() }],
          currentHistoryIndex: 0,
          activeFilterKey: 'original',
        });
      },

      updateSettings: (newSettings: Partial<EditorSettings>) => {
        set(state => ({
          settings: { ...state.settings, ...newSettings },
          hasUnsavedChanges: true,
          activeFilterKey: 'custom'
        }));
      },
      
      applyFilter: (filterKey: string) => {
        const filter = ALL_FILTERS.find(f => f.key === filterKey);
        if (!filter) return;

        const resetSettings: { [key: string]: number } = {};
        ADJUST_FEATURES.forEach(feature => {
            resetSettings[`product_${feature.key}`] = 0;
        });

        const settingsToApply = { ...get().settings, ...resetSettings, ...filter.settings };

        get().updateSettings(settingsToApply);
        get().addSnapshotToHistory();
        set({ activeFilterKey: filterKey });
      },
      
      saveChanges: async () => {
        const { activePhoto, settings } = get();
        if (!activePhoto) throw new Error('Aktif fotoğraf bulunamadı.');
        set({ isSaving: true });
        try {
          await api.savePhotoSettings(activePhoto.id, settings);
          set({ hasUnsavedChanges: false, isSaving: false });
        } catch (error) {
          set({ isSaving: false });
          throw error;
        }
      },

      addSnapshotToHistory: () => {
        const { settings, history, currentHistoryIndex } = get();
        const newHistory = history.slice(0, currentHistoryIndex + 1);
        if (JSON.stringify(newHistory[newHistory.length - 1]?.settings) === JSON.stringify(settings)) {
            return;
        }
        newHistory.push({ settings: { ...settings }, timestamp: Date.now() });
        set({
          history: newHistory,
          currentHistoryIndex: newHistory.length - 1,
        });
      },

      undo: () => {
        const { history, currentHistoryIndex } = get();
        if (currentHistoryIndex > 0) {
          const newIndex = currentHistoryIndex - 1;
          set({
            settings: { ...history[newIndex].settings },
            currentHistoryIndex: newIndex,
            hasUnsavedChanges: true,
          });
        }
      },

      redo: () => {
        const { history, currentHistoryIndex } = get();
        if (currentHistoryIndex < history.length - 1) {
          const newIndex = currentHistoryIndex + 1;
          set({
            settings: { ...history[newIndex].settings },
            currentHistoryIndex: newIndex,
            hasUnsavedChanges: true,
          });
        }
      },

      canUndo: () => get().currentHistoryIndex > 0,
      canRedo: () => get().currentHistoryIndex < get().history.length - 1,
      
      saveCurrentUserPreset: () => {
        InputDialogService.show({
          title: 'Preset Kaydet',
          message: 'Bu ayarlara bir isim verin:',
          placeholder: 'Örn: Canlı Tonlar',
          onConfirm: (name) => {
            if (!name.trim()) {
              ToastService.show({ type: 'error', text1: 'Geçersiz İsim', text2: 'Lütfen bir isim girin.' });
              return;
            }
            const { settings, userPresets } = get();
            const { id, name: presetName, ...settingsToSave } = { ...settings, name: name.trim(), id: `userpreset_${Date.now()}` };
            set({ userPresets: [...userPresets, { ...settingsToSave, id, name: presetName }] });
            ToastService.show({ type: 'success', text1: 'Preset Kaydedildi', text2: `"${name}" başarıyla kaydedildi.` });
          }
        });
      },

      applyUserPreset: (presetId: string) => {
        const preset = get().userPresets.find(p => p.id === presetId);
        if (preset) {
          const { id, name, ...settingsToApply } = preset;
          get().updateSettings(settingsToApply);
          get().addSnapshotToHistory();
          ToastService.show({ type: 'info', text1: 'Preset Uygulandı', text2: `"${preset.name}" ayarları yüklendi.` });
        }
      },

      deleteUserPreset: (presetId: string) => {
        set(state => ({
          userPresets: state.userPresets.filter(p => p.id !== presetId),
        }));
        ToastService.show({ type: 'success', text1: 'Preset Silindi' });
      },
      
      resetToDefaults: () => {
        get().updateSettings(defaultSettings);
        get().addSnapshotToHistory();
      },
      
      clearStore: () => {
        set({
            activePhoto: null, settings: {...defaultSettings}, history: [],
            currentHistoryIndex: -1, hasUnsavedChanges: false, isSaving: false,
            activeFilterKey: 'original'
        });
      },

      toggleAutoSave: (enabled: boolean) => {
        set({ autoSaveEnabled: enabled });
      },
      
      performAutoSave: async () => {
        const { hasUnsavedChanges, activePhoto, settings, isSaving } = get();
        if (isSaving || !hasUnsavedChanges || !activePhoto) return;
        
        try {
          await api.savePhotoSettings(activePhoto.id, settings);
          set({ 
            hasUnsavedChanges: false,
            lastAutoSave: Date.now() 
          });
        } catch (error) {
          console.warn('Auto-save failed:', error);
        }
      },
    }),
    {
      name: 'enhanced-editor-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        userPresets: state.userPresets,
        autoSaveEnabled: state.autoSaveEnabled,
      }),
    }
  )
);