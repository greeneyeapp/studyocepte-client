// stores/useEnhancedEditorStore.ts - AUTO-SAVE HEP AÇIK VERSİYON
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ToastService } from '@/components/Toast/ToastService';
import { ALL_FILTERS } from '@/features/editor/config/filters';
import { ADJUST_FEATURES, BACKGROUND_FEATURES } from '@/features/editor/config/features';
import { TargetType } from '@/features/editor/config/tools';
import { useProductStore, ProductPhoto } from './useProductStore';
import { imageProcessor } from '@/services/imageProcessor';

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
  // ✅ AUTO-SAVE HEP AÇIK: Bu ayarlar kaldırıldı
  // autoSaveEnabled: boolean; 
  // autoSaveInterval: number;
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

  // ✅ AUTO-SAVE HEP AÇIK: Sadece performAutoSave kalıyor
  performAutoSave: () => void;

  // Thumbnail actions
  updateThumbnailWithPreview: (previewRef: React.RefObject<any>) => Promise<void>;

  // Settings reset
  resetAllSettings: () => void;
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

/**
 * ✅ AUTO-SAVE HEP AÇIK: Enhanced Editor Store with Always-On Auto-Save
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
        const currentActivePhoto = get().activePhoto;
        if (currentActivePhoto && currentActivePhoto.id === photo.id) {
          console.log('📸 Active photo already set, skipping re-initialization.');
          return;
        }

        console.log('📸 Setting active photo:', photo.id);

        // Önce mevcut photo için draft kaydet
        const currentPhoto = get().activePhoto;
        if (currentPhoto && get().hasDraftChanges) {
          get().saveDraftForPhoto(currentPhoto.id);
        }

        // ✅ AUTO-SAVE HEP AÇIK: Yeni photo için draft var mı kontrol et ve otomatik yükle
        const existingDraft = get().loadDraftForPhoto(photo.id);
        let loadedSettings: EditorSettings;

        if (existingDraft) {
          console.log('📂 Auto-loading existing draft for photo:', photo.id);
          loadedSettings = existingDraft.settings;

          // ✅ KULLANICI BİLGİLENDİRME: Sessiz toast ile bildir
          const age = Date.now() - existingDraft.timestamp;
          const ageMinutes = Math.round(age / 60000);

          ToastService.show(`${ageMinutes} dakika önceki değişiklikler geri yüklendi`);
        } else {
          loadedSettings = { ...defaultSettings, ...(photo.editorSettings || {}) };
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
        console.log('💾 saveChanges started:', {
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

          // 2. ✅ GÜNCELLEME: Thumbnail güncelle (previewRef varsa)
          if (previewRef && previewRef.current) {
            console.log('🖼️ Starting thumbnail update with preview ref');
            await get().updateThumbnailWithPreview(previewRef);
            console.log('✅ Thumbnail update completed');
          } else {
            console.log('⏭️ Skipping thumbnail update (no preview ref)');
          }

          // 3. Draft'ı temizle
          get().clearDraftForPhoto(activePhoto.id);
          console.log('🗑️ Draft cleared');

          set({
            isSaving: false,
            hasUnsavedChanges: false,
            hasDraftChanges: false
          });

          ToastService.show(previewRef ? 'Değişiklikler ve thumbnail kaydedildi' : 'Ayarlar kaydedildi');

          console.log('✅ saveChanges completed successfully');

        } catch (error: any) {
          console.error('❌ Save failed:', error);
          set({
            isSaving: false,
            thumbnailError: error.message || 'Kayıt başarısız'
          });

          ToastService.show(error.message || 'Değişiklikler kaydedilemedi.');

          throw error; // Re-throw for debugging
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

        console.log('💾 Draft saved for photo:', photoId);
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

        console.log('🗑️ Draft cleared for photo:', photoId);
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

        console.log('🔄 Restored from draft:', draft.photoId);
      },

      // ===== AUTO-SAVE ACTIONS (SİMPLİFİED) =====

      performAutoSave: () => {
        const { activePhoto, hasDraftChanges } = get();

        if (!activePhoto || !hasDraftChanges) {
          return;
        }

        // ✅ AUTO-SAVE HEP AÇIK: Çok sık auto-save'i engelle (debounce)
        const now = Date.now();
        const timeSinceLastSave = now - get().lastAutoSave;
        const minInterval = 5000; // En az 5 saniye

        if (timeSinceLastSave < minInterval) {
          return;
        }

        try {
          get().saveDraftForPhoto(activePhoto.id);
          console.log('⚡ Auto-save completed for photo:', activePhoto.id);
        } catch (error) {
          console.warn('⚠️ Auto-save failed:', error);
        }
      },

      // ===== THUMBNAIL ACTIONS =====

      updateThumbnailWithPreview: async (previewRef: React.RefObject<any>) => {
        const { activePhoto } = get();
        if (!activePhoto || !previewRef.current) return;

        set({ isUpdatingThumbnail: true, thumbnailError: null });
        console.log('🖼️ Starting thumbnail update with cache busting for photo:', activePhoto.id);

        try {
          // 1. Preview'dan thumbnail capture et
          const capturedUri = await imageProcessor.captureFilteredThumbnail(previewRef, {
            width: 300,
            height: 300
          });
          console.log('📸 Preview captured:', capturedUri);

          // 2. Cache-busted kalıcı thumbnail olarak kaydet
          const newThumbnailUri = await imageProcessor.saveFilteredThumbnail(
            activePhoto.productId,
            activePhoto.id,
            capturedUri
          );
          console.log('💾 Cache-busted thumbnail saved:', newThumbnailUri);

          // 3. ÖNEMLİ: Product store'da thumbnail'i AWAIT ile güncelle
          await useProductStore.getState().updatePhotoThumbnail(
            activePhoto.productId,
            activePhoto.id,
            newThumbnailUri
          );
          console.log('🔄 Product store updated with new thumbnail');

          // 4. YENİ: Local state'te de activePhoto'yu güncelle (immediate UI feedback)
          const updatedPhoto = {
            ...activePhoto,
            thumbnailUri: newThumbnailUri,
            modifiedAt: new Date().toISOString()
          };

          set({
            activePhoto: updatedPhoto,
            isUpdatingThumbnail: false
          });

          // 5. YENİ: Force UI refresh (cache invalidation)
          setTimeout(() => {
            // Micro-task ile diğer component'lerin re-render olmasını sağla
            const productStore = useProductStore.getState();
            productStore.loadProducts(); // Force reload products
            console.log('🔄 Forced product store refresh for UI update');
          }, 200);

          console.log('✅ Thumbnail update completed successfully with cache busting');

        } catch (error: any) {
          console.error('❌ Thumbnail update failed:', error);
          set({
            isUpdatingThumbnail: false,
            thumbnailError: error.message || 'Thumbnail güncellenemedi'
          });

          // YENİ: Hata durumunda da cache'i temizle
          try {
            await imageProcessor.clearImageCache();
          } catch (cacheError) {
            console.warn('⚠️ Cache clear after error failed:', cacheError);
          }

          throw error; // Re-throw for upper level handling
        }
      },

      refreshActiveThumbnail: async () => {
        const { activePhoto } = get();
        if (!activePhoto?.thumbnailUri) return;

        try {
          console.log('🔄 Manually refreshing active thumbnail:', activePhoto.id);

          // Cache-busted URI oluştur
          const refreshedUri = await imageProcessor.refreshThumbnail(activePhoto.thumbnailUri);

          // Product store'u güncelle
          await useProductStore.getState().updatePhotoThumbnail(
            activePhoto.productId,
            activePhoto.id,
            refreshedUri
          );

          // Local state'i güncelle
          set({
            activePhoto: {
              ...activePhoto,
              thumbnailUri: refreshedUri,
              modifiedAt: new Date().toISOString()
            }
          });

          console.log('✅ Active thumbnail refreshed successfully');

        } catch (error) {
          console.warn('⚠️ Thumbnail refresh failed:', error);
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

        console.log('🔄 All settings reset to default');
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

        ToastService.show('Kırpma ayarları başarıyla uygulandı');
      },

      clearStore: () => {
        // ✅ AUTO-SAVE HEP AÇIK: Store'u temizlerken draft'ları da kaydet
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
      name: 'enhanced-editor-storage-v4', // Version artırıldı
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        userPresets: state.userPresets,
        photoDrafts: Array.from(state.photoDrafts.entries()), // Map'i serialize et
        // ✅ AUTO-SAVE HEP AÇIK: autoSave ayarları kaldırıldı
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