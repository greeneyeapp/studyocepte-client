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

/**
 * Editor'da kullanılabilecek tüm ayarları içeren kapsamlı arayüz
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

/**
 * Her fotoğraf için ayrı draft sistemi
 */
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
  // Temel state
  activePhoto: ProductPhoto | null;
  settings: EditorSettings;
  history: EditorHistoryEntry[];
  currentHistoryIndex: number;
  activeFilterKey: string;
  hasUnsavedChanges: boolean;
  isSaving: boolean;
  userPresets: UserPreset[];

  // Draft system state - AUTO-SAVE HEP AÇIK
  photoDrafts: Map<string, PhotoDraft>;
  hasDraftChanges: boolean;
  isUpdatingThumbnail: boolean;
  thumbnailError: string | null;
  lastAutoSave: number;
}

interface EditorActions {
  // Temel actions
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

  // Draft system actions
  saveDraft: () => void;
  saveDraftForPhoto: (photoId: string) => void;
  loadDraftForPhoto: (photoId: string) => PhotoDraft | null;
  clearDraft: () => void;
  clearDraftForPhoto: (photoId: string) => void;
  hasDraftForPhoto: (photoId: string) => boolean;
  getAllDrafts: () => PhotoDraft[];
  restoreFromDraft: (draft: PhotoDraft) => void;

  performAutoSave: () => void;

  // ⭐ YÜKSEK KALİTE: Thumbnail actions
  updateThumbnailWithPreview: (previewRef: React.RefObject<any>) => Promise<void>;

  // Settings reset
  resetAllSettings: () => void;
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

/**
 * ⭐ YÜKSEK KALİTE: Enhanced Editor Store with 800x800 High Quality Thumbnails
 */
export const useEnhancedEditorStore = create<EditorState & EditorActions>()(
  persist(
    (set, get) => ({
      // Temel state
      activePhoto: null,
      settings: { ...defaultSettings },
      history: [],
      currentHistoryIndex: -1,
      activeFilterKey: 'original',
      hasUnsavedChanges: false,
      isSaving: false,
      userPresets: [],

      // Draft system state - AUTO-SAVE HEP AÇIK
      photoDrafts: new Map<string, PhotoDraft>(),
      hasDraftChanges: false,
      isUpdatingThumbnail: false,
      thumbnailError: null,
      lastAutoSave: 0,

      // ===== TEMEL EDITOR ACTIONS =====

      setActivePhoto: (photo: ProductPhoto) => {
        console.log('📸 Setting active photo for HIGH QUALITY editing:', photo.id);

        // Önce mevcut photo için draft kaydet
        const currentPhoto = get().activePhoto;
        if (currentPhoto && currentPhoto.id !== photo.id && get().hasDraftChanges) {
          get().saveDraftForPhoto(currentPhoto.id);
        }

        // ✅ ÇİFT BACKGROUND SORUNU İÇİN: Photo status kontrolü
        let needsBackgroundCheck = false;
        const currentActivePhoto = get().activePhoto;

        if (currentActivePhoto && currentActivePhoto.id === photo.id) {
          // Aynı photo ama background kontrolü yapılmamış olabilir
          const currentBackgroundId = get().settings.backgroundId;
          const hasBackground = photo.editorSettings?.backgroundId && photo.editorSettings.backgroundId !== 'none';

          if (photo.status === 'processed' && hasBackground && currentBackgroundId !== 'none') {
            console.log('📸 Same photo but needs background fix for processed photo');
            needsBackgroundCheck = true;
          } else {
            console.log('📸 Active photo already set, skipping re-initialization.');
            return;
          }
        }

        // Yeni photo için draft var mı kontrol et ve otomatik yükle
        const existingDraft = get().loadDraftForPhoto(photo.id);
        let loadedSettings: EditorSettings;

        if (existingDraft && !needsBackgroundCheck) {
          console.log('📂 Auto-loading existing HIGH QUALITY draft for photo:', photo.id);
          loadedSettings = existingDraft.settings;
        } else {
          // ✅ ÇİFT BACKGROUND SORUNU ÇÖZÜMÜ
          const baseSettings = photo.editorSettings || {};

          if (photo.status === 'processed' && baseSettings.backgroundId && baseSettings.backgroundId !== 'none') {
            console.log('🎨 PROCESSED photo with background detected - DISABLING background layer to prevent double rendering');
            console.log('🎨 Photo status:', photo.status, 'Background ID:', baseSettings.backgroundId);

            loadedSettings = {
              ...defaultSettings,
              ...baseSettings,
              backgroundId: 'none' // Background'ı devre dışı bırak
            };
          } else {
            loadedSettings = { ...defaultSettings, ...baseSettings };
            console.log('🎨 RAW photo or no background - normal settings applied');
          }
        }

        const initialEntry = { settings: loadedSettings, timestamp: Date.now() };
        set({
          activePhoto: photo,
          settings: loadedSettings,
          hasUnsavedChanges: false,
          hasDraftChanges: !!existingDraft && !needsBackgroundCheck,
          history: [initialEntry],
          currentHistoryIndex: 0,
          activeFilterKey: 'original',
          isUpdatingThumbnail: false,
          thumbnailError: null
        });
      },

      updateSettings: async (newSettings: Partial<EditorSettings>) => {
        const currentSettings = get().settings;
        const activePhoto = get().activePhoto;

        console.log('⚙️ updateSettings called:', {
          newSettings,
          currentBackgroundId: currentSettings.backgroundId,
          photoStatus: activePhoto?.status
        });

        // ✅ BACKGROUND DEĞİŞİKLİĞİ ALGILA
        const isBackgroundChange = newSettings.backgroundId &&
          newSettings.backgroundId !== 'none' &&
          currentSettings.backgroundId !== newSettings.backgroundId;

        const isProcessedPhoto = activePhoto?.status === 'processed';
        const hasExistingBackground = currentSettings.backgroundId && currentSettings.backgroundId !== 'none';

        if (isBackgroundChange && isProcessedPhoto && hasExistingBackground) {
          console.log('🔄 Background change detected on processed photo, reverting to raw');
          console.log('🔄 From:', currentSettings.backgroundId, 'To:', newSettings.backgroundId);

          try {
            // ✅ 1. Fotoğrafı raw durumuna döndür
            await useProductStore.getState().revertToRawForBackgroundChange(
              activePhoto.productId,
              activePhoto.id
            );

            // ✅ 2. Active photo'yu güncelle
            const updatedPhoto = {
              ...activePhoto,
              status: 'raw' as const,
              editorSettings: {
                ...activePhoto.editorSettings,
                backgroundId: 'none'
              }
            };

            // ✅ 3. Settings'i sıfırla ve yeni background'ı uygula
            const resetSettings = {
              ...defaultSettings,
              backgroundId: newSettings.backgroundId
            };

            const initialEntry = { settings: resetSettings, timestamp: Date.now() };

            set({
              activePhoto: updatedPhoto,
              settings: resetSettings,
              history: [initialEntry],
              currentHistoryIndex: 0,
              hasUnsavedChanges: true,
              hasDraftChanges: true,
              activeFilterKey: 'custom',
              lastAutoSave: Date.now()
            });

            console.log('✅ Photo reverted to raw and new background applied');

            // ✅ 4. Auto-save trigger
            setTimeout(() => {
              const state = get();
              if (state.activePhoto?.id === updatedPhoto.id && state.hasDraftChanges) {
                state.performAutoSave();
              }
            }, 2000);

            return; // Erken çık, normal updateSettings logic'ini atla

          } catch (error) {
            console.error('❌ Failed to revert photo for background change:', error);
            // Hata durumunda normal flow'a devam et
          }
        }

        // ✅ NORMAL SETTINGS UPDATE (background değişikliği değilse veya raw fotoğraf ise)
        const updatedSettings = { ...currentSettings, ...newSettings };

        set(state => ({
          settings: updatedSettings,
          hasUnsavedChanges: true,
          hasDraftChanges: true,
          activeFilterKey: newSettings.backgroundId ? 'custom' : state.activeFilterKey,
          lastAutoSave: Date.now()
        }));

        console.log('⚙️ Normal settings update completed:', {
          updatedBackgroundId: updatedSettings.backgroundId,
          hasUnsavedChanges: true
        });

        // ✅ AUTO-SAVE HEP AÇIK: Her değişiklikte otomatik save trigger
        const currentPhoto = get().activePhoto;
        if (currentPhoto) {
          // 2 saniye sonra auto-save (debounced)
          setTimeout(() => {
            const state = get();
            if (state.activePhoto?.id === currentPhoto.id && state.hasDraftChanges) {
              state.performAutoSave();
            }
          }, 2000);
        }
      },

      applyFilter: (filterKey: string, target: TargetType) => {
        const filterPreset = ALL_FILTERS.find(f => f.key === filterKey);
        if (!filterPreset) return;

        const currentSettings = { ...get().settings };

        // Target'a göre reset edilecek feature'ları belirle
        const featuresToReset = target === 'all'
          ? [...ADJUST_FEATURES, ...BACKGROUND_FEATURES]
          : target === 'product' ? ADJUST_FEATURES : BACKGROUND_FEATURES;

        // Önce ilgili ayarları sıfırla
        featuresToReset.forEach(feature => {
          if (target === 'all') {
            (currentSettings as any)[`product_${feature.key}`] = 0;
            (currentSettings as any)[`background_${feature.key}`] = 0;
          } else {
            (currentSettings as any)[`${target}_${feature.key}`] = 0;
          }
        });

        // Sonra filter ayarlarını uygula
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

      // ===== SAVE & HISTORY ACTIONS =====

      saveChanges: async (previewRef?: React.RefObject<any>) => {
        const { activePhoto, settings, isSaving } = get();
        if (!activePhoto || isSaving) return;

        set({ isSaving: true, thumbnailError: null });
        console.log('💾 HIGH QUALITY saveChanges started:', {
          photoId: activePhoto.id,
          withThumbnailUpdate: !!previewRef,
          hasPreviewRef: !!previewRef?.current
        });

        try {
          // 1. Ana ayarları kaydet
          useProductStore.getState().updatePhotoSettings(
            activePhoto.productId,
            activePhoto.id,
            settings
          );
          console.log('✅ Photo settings updated in product store');

          // 2. ⭐ YÜKSEK KALİTE: 800x800 Thumbnail güncelle (previewRef varsa)
          if (previewRef && previewRef.current) {
            console.log('🖼️ Starting HIGH QUALITY 800x800 thumbnail update with preview ref');
            await get().updateThumbnailWithPreview(previewRef);
            console.log('✅ HIGH QUALITY thumbnail update completed');
          } else {
            console.log('⏭️ Skipping HIGH QUALITY thumbnail update (no preview ref)');
          }

          // 3. Draft'ı temizle
          get().clearDraftForPhoto(activePhoto.id);
          console.log('🗑️ Draft cleared');

          set({
            isSaving: false,
            hasUnsavedChanges: false,
            hasDraftChanges: false
          });

          // Lokalize edildi
          ToastService.show(previewRef ? i18n.t('editor.changesSavedAndThumbnail') : i18n.t('editor.settingsSaved'));

          console.log('✅ HIGH QUALITY saveChanges completed successfully');

        } catch (error: any) { // error type any eklendi
          console.error('❌ HIGH QUALITY save failed:', error);
          set({
            isSaving: false,
            thumbnailError: error.message || i18n.t('editor.settingsSaveFailed') // Lokalize edildi
          });

          ToastService.show(error.message || i18n.t('editor.settingsSaveFailed')); // Lokalize edildi

          throw error;
        }
      },

      addSnapshotToHistory: () => {
        const { settings, history, currentHistoryIndex } = get();
        const currentSnapshot = history[currentHistoryIndex]?.settings;

        // Aynı ayarları tekrar ekleme
        if (currentSnapshot && JSON.stringify(currentSnapshot) === JSON.stringify(settings)) {
          return;
        }

        const newHistory = history.slice(0, currentHistoryIndex + 1);
        newHistory.push({ settings: { ...settings }, timestamp: Date.now() });

        // History size'ı sınırla (memory için)
        const maxHistorySize = 50;
        if (newHistory.length > maxHistorySize) {
          newHistory.shift();
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

      // ===== DRAFT SYSTEM ACTIONS =====

      saveDraft: () => {
        const activePhoto = get().activePhoto;
        if (activePhoto) {
          get().saveDraftForPhoto(activePhoto.id);
        }
      },

      saveDraftForPhoto: (photoId: string) => {
        const { settings, photoDrafts, activePhoto } = get();
        if (!activePhoto || activePhoto.id !== photoId) return;

        const draft: PhotoDraft = {
          photoId,
          productId: activePhoto.productId,
          settings: { ...settings },
          timestamp: Date.now(),
          autoSaved: true,
          version: Date.now()
        };

        const newDrafts = new Map(photoDrafts);
        newDrafts.set(photoId, draft);

        set({
          photoDrafts: newDrafts,
          lastAutoSave: Date.now()
        });

        console.log('💾 HIGH QUALITY draft saved for photo:', photoId);
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
          hasDraftChanges: false
        });

        console.log('🗑️ HIGH QUALITY draft cleared for photo:', photoId);
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

        console.log('🔄 Restored from HIGH QUALITY draft:', draft.photoId);
      },

      // ===== AUTO-SAVE ACTIONS (SİMPLİFİED) =====

      performAutoSave: () => {
        const { activePhoto, hasDraftChanges } = get();

        if (!activePhoto || !hasDraftChanges) {
          return;
        }

        // Çok sık auto-save'i engelle (debounce)
        const now = Date.now();
        const timeSinceLastSave = now - get().lastAutoSave;
        const minInterval = 5000; // En az 5 saniye

        if (timeSinceLastSave < minInterval) {
          return;
        }

        try {
          get().saveDraftForPhoto(activePhoto.id);
          console.log('⚡ HIGH QUALITY auto-save completed for photo:', activePhoto.id);
        } catch (error) {
          console.warn('⚠️ HIGH QUALITY auto-save failed:', error);
        }
      },

      // ===== ⭐ YÜKSEK KALİTE THUMBNAIL ACTIONS =====

      /**
       * ⭐ YÜKSEK KALİTE: 800x800 PNG thumbnail güncelleme
       */
      updateThumbnailWithPreview: async (previewRef: React.RefObject<any>) => {
        const { activePhoto } = get();
        if (!activePhoto || !previewRef.current) return;

        set({ isUpdatingThumbnail: true, thumbnailError: null });
        console.log('🖼️ Starting HIGH QUALITY 800x800 PNG thumbnail update for photo:', activePhoto.id);

        try {
          // 1. ⭐ YÜKSEK KALİTE: 800x800 Preview'dan thumbnail capture et
          const capturedUri = await imageProcessor.captureFilteredThumbnail(previewRef, {
            width: 800,  // 300 → 800 (yüksek kalite)
            height: 800  // 300 → 800 (yüksek kalite)
          });
          console.log('📸 HIGH QUALITY 800x800 preview captured:', capturedUri);

          // 2. Cache-busted kalıcı thumbnail olarak kaydet
          const newThumbnailUri = await imageProcessor.saveFilteredThumbnail(
            activePhoto.productId,
            activePhoto.id,
            capturedUri
          );
          console.log('💾 HIGH QUALITY cache-busted thumbnail saved:', newThumbnailUri);

          // 3. ÖNEMLİ: Product store'da thumbnail'i AWAIT ile güncelle
          await useProductStore.getState().updatePhotoThumbnail(
            activePhoto.productId,
            activePhoto.id,
            newThumbnailUri
          );
          console.log('🔄 Product store updated with HIGH QUALITY thumbnail');

          // 4. Local state'te de activePhoto'yu güncelle (immediate UI feedback)
          const updatedPhoto = {
            ...activePhoto,
            thumbnailUri: newThumbnailUri,
            modifiedAt: new Date().toISOString()
          };

          set({
            activePhoto: updatedPhoto,
            isUpdatingThumbnail: false
          });

          // 5. ⭐ GÜÇLÜ CACHE INVALIDATION: Force UI refresh
          setTimeout(async () => {
            try {
              // Image cache temizle
              await imageProcessor.clearImageCache();

              // Force product store reload
              const productStore = useProductStore.getState();
              await productStore.loadProducts();

              console.log('🔄 HIGH QUALITY forced product store refresh for UI update');
            } catch (refreshError) {
              console.warn('⚠️ Cache refresh warning:', refreshError);
            }
          }, 300);

          console.log('✅ HIGH QUALITY thumbnail update completed successfully (800x800 PNG)');

        } catch (error: any) { // error type any eklendi
          console.error('❌ HIGH QUALITY thumbnail update failed:', error);
          set({
            isUpdatingThumbnail: false,
            thumbnailError: error.message || i18n.t('editor.thumbnailUpdateFailed') // Lokalize edildi
          });

          // Hata durumunda da cache'i temizle
          try {
            await imageProcessor.clearImageCache();
          } catch (cacheError) {
            console.warn('⚠️ Cache clear after error failed:', cacheError);
          }

          throw error;
        }
      },

      // ===== RESET ACTIONS =====

      resetAllSettings: () => {
        const resetSettings = { ...defaultSettings };
        const initialEntry = { settings: resetSettings, timestamp: Date.now() };

        set({
          settings: resetSettings,
          history: [initialEntry],
          currentHistoryIndex: 0,
          hasUnsavedChanges: true,
          hasDraftChanges: true,
          activeFilterKey: 'original'
        });

        // Aktif photo'nun draft'ını da temizle
        const activePhoto = get().activePhoto;
        if (activePhoto) {
          get().clearDraftForPhoto(activePhoto.id);
        }

        console.log('🔄 All HIGH QUALITY settings reset to default');
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

        ToastService.show(i18n.t('editor.cropApplied')); // Lokalize edildi
      },

      clearStore: () => {
        // AUTO-SAVE HEP AÇIK: Store'u temizlerken draft'ları da kaydet
        const activePhoto = get().activePhoto;
        if (activePhoto && get().hasDraftChanges) {
          get().saveDraftForPhoto(activePhoto.id);
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

      // Diğer mevcut fonksiyonlar
      setActiveFilterKey: (key) => set({ activeFilterKey: key }),
    }),
    {
      name: 'enhanced-editor-storage-hq-v5', // Version artırıldı
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        userPresets: state.userPresets,
        photoDrafts: Array.from(state.photoDrafts.entries()), // Map'i serialize et
      }),
      onRehydrateStorage: () => (state) => {
        if (state && Array.isArray(state.photoDrafts)) {
          // Deserialized data'yı Map'e çevir
          state.photoDrafts = new Map(state.photoDrafts);
        } else {
          state.photoDrafts = new Map();
        }
      }
    }
  )
);