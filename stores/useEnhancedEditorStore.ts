// stores/useEnhancedEditorStore.ts - 800x800 YÜKSEK KALİTE EDITOR THUMBNAIL
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ToastService } from '@/components/Toast/ToastService';
import { ALL_FILTERS } from '@/features/editor/config/filters';
import { ADJUST_FEATURES, BACKGROUND_FEATURES } from '@/features/editor/config/features';
import { TargetType } from '@/features/editor/config/tools';
import { useProductStore, ProductPhoto } from './useProductStore';
import { imageProcessor } from '@/services/imageProcessor';
import i18n from '@/i18n'; // i18n import edildi
import { memoryManager } from '@/services/memoryManager'; // memoryManager import edildi

export interface EditorSettings {
  backgroundId: string;
  photoX?: number;
  photoY?: number;
  photoScale?: number;
  photoRotation?: number;
  product_exposure?: number;
  product_brightness?: number;
  product_highlights?: number;
  product_shadows?: number;
  product_contrast?: number;
  product_saturation?: number;
  product_vibrance?: number;
  product_warmth?: number;
  product_clarity?: number;
  background_exposure?: number;
  background_brightness?: number;
  background_contrast?: number;
  background_saturation?: number;
  background_warmth?: number;
  background_vignette?: number;
  background_blur?: number;
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

export interface PhotoDraft {
  photoId: string;
  productId: string;
  settings: EditorSettings;
  timestamp: number;
  autoSaved: boolean;
  version: number;
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
  photoDrafts: Map<string, PhotoDraft>;
  hasDraftChanges: boolean;
  isUpdatingThumbnail: boolean;
  thumbnailError: string | null;
  lastAutoSave: number;
  autoSaveEnabled: boolean; // Auto-save özelliğini etkinleştir/devre dışı bırak
}

interface EditorActions {
  setActivePhoto: (photo: ProductPhoto) => void;
  updateSettings: (newSettings: Partial<EditorSettings>) => void;
  setActiveFilterKey: (key: string) => void;
  saveChanges: (previewRef?: React.RefObject<any>) => Promise<void>;
  undo: () => void;
  redo: () => void;
  addSnapshotToHistory: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  applyFilter: (filterKey: string, target: TargetType) => void;
  resetCropAndRotation: () => void;
  applyCrop: () => void;
  clearStore: () => void;
  saveDraft: () => void;
  saveDraftForPhoto: (photoId: string, autoSaved?: boolean) => void; // autoSaved parametresi eklendi
  loadDraftForPhoto: (photoId: string) => PhotoDraft | null;
  clearDraft: () => void;
  clearDraftForPhoto: (photoId: string) => void;
  hasDraftForPhoto: (photoId: string) => boolean;
  getAllDrafts: () => PhotoDraft[];
  restoreFromDraft: (draft: PhotoDraft) => void;
  performAutoSave: () => void;
  updateThumbnailWithPreview: (previewRef: React.RefObject<any>) => Promise<void>;
  resetAllSettings: () => void;
  toggleAutoSave: () => void; // Auto-save'i açıp kapamak için
}

const defaultSettings: EditorSettings = {
  backgroundId: 'home_1',
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
      photoDrafts: new Map<string, PhotoDraft>(),
      hasDraftChanges: false,
      isUpdatingThumbnail: false,
      thumbnailError: null,
      lastAutoSave: 0,
      autoSaveEnabled: true, // Varsayılan olarak auto-save açık

      toggleAutoSave: () => {
        set(state => ({ autoSaveEnabled: !state.autoSaveEnabled }));
        ToastService.show(get().autoSaveEnabled ? i18n.t('editor.autoSaveEnabled') : i18n.t('editor.autoSaveDisabled'));
      },

      setActivePhoto: (photo: ProductPhoto) => {
        const currentActivePhoto = get().activePhoto;
        if (currentActivePhoto && currentActivePhoto.id === photo.id) {
          console.log(i18n.t('editor.activePhotoAlreadySetLog'));
          return;
        }

        console.log(i18n.t('editor.settingActivePhotoLog'), photo.id);

        const currentPhoto = get().activePhoto;
        if (currentPhoto && get().hasDraftChanges) {
          get().saveDraftForPhoto(currentPhoto.id, false); // Manuel kayıtta autoSaved = false
        }

        const existingDraft = get().loadDraftForPhoto(photo.id);
        let loadedSettings: EditorSettings;

        if (existingDraft) {
          console.log(i18n.t('editor.autoLoadingDraftLog'), photo.id);
          loadedSettings = existingDraft.settings;
        } else if (photo.editorSettings && Object.keys(photo.editorSettings).length > 0) {
          console.log(i18n.t('editor.loadingExistingSettingsLog'), photo.id);
          loadedSettings = { ...photo.editorSettings };
        } else {
          console.log(i18n.t('editor.firstTimeEditingLog'), photo.id);
          loadedSettings = { ...defaultSettings, backgroundId: 'white_solid' };
        }

        const initialEntry = { settings: loadedSettings, timestamp: Date.now() };
        set({
          activePhoto: photo,
          settings: loadedSettings,
          hasUnsavedChanges: false,
          hasDraftChanges: !!existingDraft,
          history: [initialEntry],
          currentHistoryIndex: 0,
          activeFilterKey: 'original',
          isUpdatingThumbnail: false,
          thumbnailError: null
        });
      },

      updateSettings: (newSettings: Partial<EditorSettings>) => {
        const updatedSettings = { ...get().settings, ...newSettings };

        set(state => ({
          settings: updatedSettings,
          hasUnsavedChanges: true,
          hasDraftChanges: true,
          activeFilterKey: 'custom',
          lastAutoSave: Date.now()
        }));

        const currentPhoto = get().activePhoto;
        if (currentPhoto) {
          // Debounced auto-save çağrısı performAutoSave hook'undan yönetilecek
        }
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

        set({
          settings: currentSettings,
          activeFilterKey: filterKey,
          hasUnsavedChanges: true,
          hasDraftChanges: true
        });

        get().addSnapshotToHistory();
      },

      // ⭐ ÇÖZÜM 3: Kaydetme işlemi ve bellek güvenli navigasyon
      saveChanges: async (previewRef?: React.RefObject<any>) => {
        const { activePhoto, settings, isSaving } = get();
        if (!activePhoto || isSaving) return;

        set({ isSaving: true, thumbnailError: null });
        console.log(i18n.t('editor.saveChangesStartedLog'), {
          photoId: activePhoto.id,
          withThumbnailUpdate: !!previewRef,
          hasPreviewRef: !!previewRef?.current
        });

        try {
          // 1. Ürün ayarlarını güncelle
          useProductStore.getState().updatePhotoSettings(
            activePhoto.productId,
            activePhoto.id,
            settings
          );
          console.log(i18n.t('editor.photoSettingsUpdatedLog'));

          // 2. Thumbnail'ı güncelle (varsa)
          if (previewRef && previewRef.current) {
            console.log(i18n.t('editor.startingThumbnailUpdateLog'));
            await get().updateThumbnailWithPreview(previewRef); // Bu artık kritik bir işlem olarak kilitli
            console.log(i18n.t('editor.thumbnailUpdateCompletedLog'));
          } else {
            console.log(i18n.t('editor.skippingThumbnailUpdateLog'));
          }

          // 3. Taslağı temizle (işlem başarıyla tamamlandığı için)
          get().clearDraftForPhoto(activePhoto.id);
          console.log(i18n.t('editor.draftClearedLog'));

          set({
            isSaving: false,
            hasUnsavedChanges: false,
            hasDraftChanges: false
          });

          ToastService.show(previewRef ? i18n.t('editor.changesAndThumbnailSaved') : i18n.t('editor.settingsSaved'));

          console.log(i18n.t('editor.saveChangesCompletedLog'));

        } catch (error: any) {
          console.error(i18n.t('editor.saveFailedLog'), error);
          set({
            isSaving: false,
            thumbnailError: error.message || i18n.t('editor.saveFailed')
          });

          ToastService.show(error.message || i18n.t('editor.changesSaveFailed'));

          throw error;
        } finally {
          // Her durumda bellek temizliği yap
          await memoryManager.cleanup();
        }
      },

      addSnapshotToHistory: () => {
        const { settings, history, currentHistoryIndex } = get();
        const currentSnapshot = history[currentHistoryIndex]?.settings;

        if (currentSnapshot && JSON.stringify(currentSnapshot) === JSON.stringify(settings)) {
          return;
        }

        const newHistory = history.slice(0, currentHistoryIndex + 1);
        newHistory.push({ settings: { ...settings }, timestamp: Date.now() });

        const maxHistorySize = 50;
        if (newHistory.length > maxHistorySize) {
          newHistory.shift(); // En eski snapshot'ı kaldır
        }

        set({
          history: newHistory,
          currentHistoryIndex: newHistory.length - 1
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
            hasDraftChanges: true
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
            hasDraftChanges: true
          });
        }
      },

      canUndo: () => get().currentHistoryIndex > 0,
      canRedo: () => get().currentHistoryIndex < get().history.length - 1,

      saveDraft: () => {
        const activePhoto = get().activePhoto;
        if (activePhoto) {
          get().saveDraftForPhoto(activePhoto.id, false); // Manuel kayıtta autoSaved = false
        }
      },

      // saveDraftForPhoto içine autoSaved parametresi eklendi
      saveDraftForPhoto: (photoId: string, autoSaved: boolean = true) => {
        const { settings, photoDrafts, activePhoto } = get();
        if (!activePhoto || activePhoto.id !== photoId) return;

        const draft: PhotoDraft = {
          photoId,
          productId: activePhoto.productId,
          settings: { ...settings },
          timestamp: Date.now(),
          autoSaved: autoSaved, // autoSaved parametresi kullanılıyor
          version: Date.now()
        };

        const newDrafts = new Map(photoDrafts);
        newDrafts.set(photoId, draft);

        set({
          photoDrafts: newDrafts,
          lastAutoSave: Date.now()
        });

        console.log(i18n.t('editor.draftSavedLog'), photoId, autoSaved ? '(Auto)' : '(Manual)');
      },

      loadDraftForPhoto: (photoId: string) => {
        return get().photoDrafts.get(photoId) || null;
      },

      clearDraft: () => {
        const activePhoto = get().activePhoto;
        if (activePhoto) {
          get().clearDraftForPhoto(activePhoto.id);
        }
      },

      clearDraftForPhoto: (photoId: string) => {
        const { photoDrafts } = get();
        const newDrafts = new Map(photoDrafts);
        newDrafts.delete(photoId);

        set({
          photoDrafts: newDrafts,
          hasDraftChanges: false // Taslak temizlendiğinde değişiklik kalmaz
        });

        console.log(i18n.t('editor.draftClearedForPhotoLog'), photoId);
      },

      hasDraftForPhoto: (photoId: string) => {
        return get().photoDrafts.has(photoId);
      },

      getAllDrafts: () => {
        return Array.from(get().photoDrafts.values());
      },

      restoreFromDraft: (draft: PhotoDraft) => {
        const initialEntry = { settings: draft.settings, timestamp: Date.now() };

        set({
          settings: draft.settings,
          history: [initialEntry],
          currentHistoryIndex: 0,
          hasUnsavedChanges: true,
          hasDraftChanges: true,
          activeFilterKey: 'custom'
        });

        console.log(i18n.t('editor.restoredFromDraftLog'), draft.photoId);
      },

      performAutoSave: () => {
        const { activePhoto, hasDraftChanges, autoSaveEnabled, lastAutoSave } = get();

        if (!activePhoto || !hasDraftChanges || !autoSaveEnabled) {
          return;
        }

        const now = Date.now();
        const timeSinceLastSave = now - lastAutoSave;
        const minInterval = 5000; // Minimum 5 saniye aralıkla auto-save

        if (timeSinceLastSave < minInterval) {
          return;
        }

        // Auto-save işlemini bir kuyruğa ekleyerek sequential çalışmasını sağla
        memoryManager.queue.addOperation(`auto-save-${activePhoto.id}`, async () => {
          try {
            get().saveDraftForPhoto(activePhoto.id, true); // autoSaved = true
            console.log(i18n.t('editor.autoSaveCompletedLog'), activePhoto.id);
          } catch (error) {
            console.warn(i18n.t('editor.autoSaveFailedLog'), error);
          }
        });
      },

      // ⭐ ÇÖZÜM 5: Thumbnail güncellemesi kritik bir işlem olarak kilitleniyor
      updateThumbnailWithPreview: async (previewRef: React.RefObject<any>) => {
        const { activePhoto } = get();
        if (!activePhoto || !previewRef.current) return;

        set({ isUpdatingThumbnail: true, thumbnailError: null });
        console.log(i18n.t('editor.startingThumbnailUpdatePreviewLog'), activePhoto.id);

        try {
          await memoryManager.critical.withLock(`editor-thumbnail-update-${activePhoto.id}`, async () => {
            const capturedUri = await imageProcessor.captureFilteredThumbnail(
              previewRef,
              imageProcessor.PREVIEW_CAPTURE_CONFIG // Optimize edilmiş boyutlar
            );
            console.log(i18n.t('editor.previewCapturedLog'), capturedUri);

            const newThumbnailUri = await imageProcessor.saveFilteredThumbnail(
              activePhoto.productId,
              activePhoto.id,
              capturedUri
            );
            console.log(i18n.t('editor.thumbnailSavedLog'), newThumbnailUri);

            await useProductStore.getState().updatePhotoThumbnail(
              activePhoto.productId,
              activePhoto.id,
              newThumbnailUri
            );
            console.log(i18n.t('editor.productStoreUpdatedThumbnailLog'));

            const updatedPhoto = {
              ...activePhoto,
              thumbnailUri: newThumbnailUri,
              modifiedAt: new Date().toISOString()
            };

            set({
              activePhoto: updatedPhoto,
              isUpdatingThumbnail: false
            });

            // Bellek temizliği yap
            await memoryManager.cleanup();

            console.log(i18n.t('editor.thumbnailUpdateCompletedSuccessLog'));
          });

        } catch (error: any) {
          console.error(i18n.t('editor.thumbnailUpdateFailedLog'), error);
          set({
            isUpdatingThumbnail: false,
            thumbnailError: error.message || i18n.t('editor.thumbnailUpdateFailed')
          });

          await memoryManager.cleanup(); // Hata durumunda da bellek temizle

          throw error;
        }
      },

      resetAllSettings: () => {
        const resetSettings = { ...defaultSettings, backgroundId: 'white_solid' };
        const initialEntry = { settings: resetSettings, timestamp: Date.now() };

        set({
          settings: resetSettings,
          history: [initialEntry],
          currentHistoryIndex: 0,
          hasUnsavedChanges: true,
          hasDraftChanges: true,
          activeFilterKey: 'original'
        });

        const activePhoto = get().activePhoto;
        if (activePhoto) {
          get().clearDraftForPhoto(activePhoto.id);
        }

        console.log(i18n.t('editor.allSettingsResetLog'));
      },

      resetCropAndRotation: () => {
        get().updateSettings({
          cropAspectRatio: 'original',
          photoRotation: 0,
          cropX: 0,
          cropY: 0,
          cropWidth: 1,
          cropHeight: 1,
          visualCrop: undefined,
        });
        get().addSnapshotToHistory();
      },

      applyCrop: () => {
        const { settings } = get();
        const visualCrop = {
          aspectRatio: settings.cropAspectRatio || 'original',
          x: settings.cropX || 0,
          y: settings.cropY || 0,
          width: settings.cropWidth || 1,
          height: settings.cropHeight || 1,
          isApplied: true,
        };

        get().updateSettings({ visualCrop });
        get().addSnapshotToHistory();

        ToastService.show(i18n.t('editor.crop.applySuccess'));
      },

      clearStore: () => {
        const activePhoto = get().activePhoto;
        if (activePhoto && get().hasDraftChanges) {
          get().saveDraftForPhoto(activePhoto.id, false); // Manuel kayıt olarak işaretle
        }

        set({
          activePhoto: null,
          settings: { ...defaultSettings },
          history: [],
          currentHistoryIndex: -1,
          hasUnsavedChanges: false,
          hasDraftChanges: false,
          isSaving: false,
          isUpdatingThumbnail: false,
          thumbnailError: null
        });
      },

      setActiveFilterKey: (key) => set({ activeFilterKey: key }),
    }),
    {
      name: 'enhanced-editor-storage-hq-v5',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        userPresets: state.userPresets,
        photoDrafts: Array.from(state.photoDrafts.entries()),
      }),
      onRehydrateStorage: () => (state) => {
        if (state && Array.isArray(state.photoDrafts)) {
          state.photoDrafts = new Map(state.photoDrafts);
        } else {
          state.photoDrafts = new Map();
        }
      }
    }
  )
);