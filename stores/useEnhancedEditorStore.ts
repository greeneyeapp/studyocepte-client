// stores/useEnhancedEditorStore.ts - MEMORY-OPTIMIZED Editor Store
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ToastService } from '@/components/Toast/ToastService'; // Varsayımsal ToastService
import { ALL_FILTERS } from '@/features/editor/config/filters'; // Varsayımsal filtre yapılandırması
import { ADJUST_FEATURES, BACKGROUND_FEATURES } from '@/features/editor/config/features'; // Varsayımsal özellik yapılandırması
import { TargetType } from '@/features/editor/config/tools'; // Varsayımsal araç tipi
import { useProductStore, ProductPhoto } from './useProductStore'; // useProductStore'dan bağımlılık
import { imageProcessor } from '@/services/imageProcessor'; // imageProcessor'dan bağımlılık
import { memoryManager, CriticalOperationManager } from '@/services/memoryManager'; // Bellek yönetimi bağımlılıkları
import i18n from '@/i18n'; // Uluslararasılaştırma

/**
 * Editor settings interface
 * Editör ayarlarının yapısını tanımlar.
 */
export interface EditorSettings {
  // Genel Ayarlar
  backgroundId: string; // Uygulanan arka planın kimliği

  // Fotoğraf Konumu, Boyutu ve Döndürme
  photoX?: number;
  photoY?: number;
  photoScale?: number;
  photoRotation?: number;

  // Ürün Ayarları (görselin ürüne uygulanan efektleri)
  product_exposure?: number;
  product_brightness?: number;
  product_highlights?: number;
  product_shadows?: number;
  product_contrast?: number;
  product_saturation?: number;
  product_vibrance?: number;
  product_warmth?: number;
  product_clarity?: number;

  // Arka Plan Ayarları (arka plana uygulanan efektler)
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
  visualCrop?: { // Uygulanan kırpma alanı
    aspectRatio: string;
    x: number;
    y: number;
    width: number;
    height: number;
    isApplied: boolean;
  };
}

/**
 * Draft system for each photo
 * Her fotoğraf için taslak verilerinin yapısını tanımlar.
 */
export interface PhotoDraft {
  photoId: string;
  productId: string;
  settings: EditorSettings;
  timestamp: number; // Taslağın kaydedildiği zaman damgası
  autoSaved: boolean; // Otomatik kaydedilip kaydedilmediği
  version: number; // Taslak sürümü
}

// Kullanıcı tarafından oluşturulan ön ayarlar
interface UserPreset extends EditorSettings {
  id: string;
  name: string;
}

// Geçmişteki her düzenleme adımının girdisi
interface EditorHistoryEntry {
  settings: EditorSettings;
  timestamp: number;
}

// Editör mağazasının ana durum arayüzü
interface EditorState {
  // Temel durum
  activePhoto: ProductPhoto | null; // Şu anda düzenlenmekte olan fotoğraf
  settings: EditorSettings; // Mevcut editör ayarları
  history: EditorHistoryEntry[]; // Undo/redo için ayarlar geçmişi
  currentHistoryIndex: number; // Geçmişteki mevcut konum
  activeFilterKey: string; // Uygulanan aktif filtre anahtarı
  hasUnsavedChanges: boolean; // Kaydedilmemiş değişiklikler olup olmadığı
  isSaving: boolean; // Kaydetme işleminin devam edip etmediği
  userPresets: UserPreset[]; // Kullanıcı ön ayarları

  // Taslak sistemi durumu
  photoDrafts: Map<string, PhotoDraft>; // Fotoğraf taslakları
  hasDraftChanges: boolean; // Taslakta değişiklik olup olmadığı
  isUpdatingThumbnail: boolean; // Küçük resim güncellemesinin devam edip etmediği
  thumbnailError: string | null; // Küçük resim güncelleme hatası
  lastAutoSave: number; // Son otomatik kaydetme zaman damgası
}

// Editör mağazasının eylemler arayüzü
interface EditorActions {
  // Temel eylemler
  setActivePhoto: (photo: ProductPhoto) => void;
  updateSettings: (newSettings: Partial<EditorSettings>) => Promise<void>;
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

  // Taslak sistemi eylemleri
  saveDraft: () => void;
  saveDraftForPhoto: (photoId: string) => void;
  loadDraftForPhoto: (photoId: string) => PhotoDraft | null;
  clearDraft: () => void;
  clearDraftForPhoto: (photoId: string) => void;
  hasDraftForPhoto: (photoId: string) => boolean;
  getAllDrafts: () => PhotoDraft[];
  restoreFromDraft: (draft: PhotoDraft) => void;
  performAutoSave: () => void;

  // Platforma optimize edilmiş küçük resim eylemleri
  updateThumbnailWithPreview: (previewRef: React.RefObject<any>) => Promise<void>;

  // Ayarları sıfırlama
  resetAllSettings: () => void;

  // Taslak ve bellek yönetimi istatistikleri ve eylemleri
  getDraftStats: () => {
    totalDrafts: number;
    oldDrafts: number;
    autoSavedDrafts: number;
    lastAutoSave: number;
    platform: string;
  };
  cleanupOldDrafts: () => number;
  optimizeMemory: () => Promise<void>;
  getPerformanceStats: () => {
    platform: string;
    editor: {
      activePhoto: boolean;
      hasChanges: boolean;
      isSaving: boolean;
      isUpdatingThumbnail: boolean;
      historySize: number;
      currentHistoryIndex: number;
    };
    drafts: ReturnType<EditorActions['getDraftStats']>;
    memory: ReturnType<typeof memoryManager.getMemoryStatus>;
    criticalOperations: ReturnType<typeof CriticalOperationManager.getStats>;
    lastUpdate: string;
  };
  emergencyRecovery: () => Promise<void>;
}

// Varsayılan editör ayarları
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
 * ✅ MEMORY-OPTIMIZED Enhanced Editor Store
 * Zustand ile oluşturulmuş, düzenleme işlemlerini, geçmişi, taslakları ve bellek yönetimini
 * optimize edilmiş bir şekilde ele alan gelişmiş bir editör mağazası.
 */
export const useEnhancedEditorStore = create<EditorState & EditorActions>()(
  persist(
    (set, get) => ({
      // Temel durum başlatma
      activePhoto: null,
      settings: { ...defaultSettings },
      history: [],
      currentHistoryIndex: -1,
      activeFilterKey: 'original',
      hasUnsavedChanges: false,
      isSaving: false,
      userPresets: [],

      // Taslak sistemi durumu başlatma
      photoDrafts: new Map<string, PhotoDraft>(),
      hasDraftChanges: false,
      isUpdatingThumbnail: false,
      thumbnailError: null,
      lastAutoSave: 0,

      // ===== CORE EDITOR ACTIONS =====

      /**
       * Aktif fotoğrafı ayarlar. Yeni bir fotoğraf seçildiğinde mevcut taslağı kaydeder
       * ve çift arka plan sorununu önlemek için fotoğraf durumunu kontrol eder.
       * @param photo Aktif olarak düzenlenecek ürün fotoğrafı.
       */
      setActivePhoto: (photo: ProductPhoto) => {
        console.log(`📸 [${Platform.OS}] Setting active photo for editing:`, photo.id);

        // Mevcut fotoğraf için taslağı kaydet
        const currentPhoto = get().activePhoto;
        if (currentPhoto && currentPhoto.id !== photo.id && get().hasDraftChanges) {
          get().saveDraftForPhoto(currentPhoto.id);
        }

        // ✅ ÇİFT ARKA PLAN SORUNU ÇÖZÜMÜ: Fotoğraf durumu kontrolü
        let needsBackgroundCheck = false;
        const currentActivePhoto = get().activePhoto;

        if (currentActivePhoto && currentActivePhoto.id === photo.id) {
          const currentBackgroundId = get().settings.backgroundId;
          const hasBackground = photo.editorSettings?.backgroundId && photo.editorSettings.backgroundId !== 'none';

          if (photo.status === 'processed' && hasBackground && currentBackgroundId !== 'none') {
            console.log(`📸 [${Platform.OS}] Same photo but needs background fix for processed photo`);
            needsBackgroundCheck = true;
          } else {
            console.log(`📸 [${Platform.OS}] Active photo already set, skipping re-initialization.`);
            return;
          }
        }

        // Mevcut taslağı yükle veya yeni ayarlar oluştur
        const existingDraft = get().loadDraftForPhoto(photo.id);
        let loadedSettings: EditorSettings;

        if (existingDraft && !needsBackgroundCheck) {
          console.log(`📂 [${Platform.OS}] Auto-loading existing draft for photo:`, photo.id);
          loadedSettings = existingDraft.settings;
        } else {
          // ✅ ÇİFT ARKA PLAN SORUNU ÇÖZÜMÜ
          const baseSettings = photo.editorSettings || {};

          if (photo.status === 'processed' && baseSettings.backgroundId && baseSettings.backgroundId !== 'none') {
            console.log(`🎨 [${Platform.OS}] PROCESSED photo with background detected - DISABLING background layer to prevent double rendering`);
            console.log(`🎨 [${Platform.OS}] Photo status:`, photo.status, 'Background ID:', baseSettings.backgroundId);

            loadedSettings = {
              ...defaultSettings,
              ...baseSettings,
              backgroundId: 'none' // Arka planı devre dışı bırak
            };
          } else {
            loadedSettings = { ...defaultSettings, ...baseSettings };
            console.log(`🎨 [${Platform.OS}] RAW photo or no background - normal settings applied`);
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

      /**
       * ✅ ÇÖZÜM 3: Memory-Safe Settings Update
       * Editör ayarlarını günceller. Eğer işlenmiş bir fotoğrafta arka plan değişikliği algılanırsa,
       * fotoğrafı ham durumuna geri döndürme ve bellek yönetimi içerir.
       * @param newSettings Güncellenecek kısmi editör ayarları.
       * @returns Promise<void>
       */
      updateSettings: async (newSettings: Partial<EditorSettings>) => {
        return await CriticalOperationManager.withLock('update-settings', async () => {
          const currentSettings = get().settings;
          const activePhoto = get().activePhoto;

          console.log(`⚙️ [${Platform.OS}] updateSettings called:`, {
            newSettings,
            currentBackgroundId: currentSettings.backgroundId,
            photoStatus: activePhoto?.status
          });

          // ✅ ARKA PLAN DEĞİŞİKLİĞİ ALGILAMA
          const isBackgroundChange = newSettings.backgroundId &&
            newSettings.backgroundId !== 'none' &&
            currentSettings.backgroundId !== newSettings.backgroundId;

          const isProcessedPhoto = activePhoto?.status === 'processed';
          const hasExistingBackground = currentSettings.backgroundId && currentSettings.backgroundId !== 'none';

          if (isBackgroundChange && isProcessedPhoto && hasExistingBackground) {
            console.log(`🔄 [${Platform.OS}] Background change detected on processed photo, reverting to raw`);
            console.log(`🔄 [${Platform.OS}] From:`, currentSettings.backgroundId, 'To:', newSettings.backgroundId);

            try {
              // ✅ 1. Fotoğrafı ham duruma geri döndür
              await useProductStore.getState().revertToRawForBackgroundChange(
                activePhoto.productId,
                activePhoto.id
              );

              // ✅ 2. Aktif fotoğrafı güncelle
              const updatedPhoto = {
                ...activePhoto,
                status: 'raw' as const,
                editorSettings: {
                  ...activePhoto.editorSettings,
                  backgroundId: 'none'
                }
              };

              // ✅ 3. Ayarları sıfırla ve yeni arka planı uygula
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

              console.log(`✅ [${Platform.OS}] Photo reverted to raw and new background applied`);

              // ✅ 4. Otomatik kaydetme tetikleyicisi
              setTimeout(() => {
                const state = get();
                if (state.activePhoto?.id === updatedPhoto.id && state.hasDraftChanges) {
                  state.performAutoSave();
                }
              }, Platform.OS === 'ios' ? 3000 : 2000);

              return; // Normal güncelleme mantığını atla ve erken çık
            } catch (error) {
              console.error(`❌ [${Platform.OS}] Failed to revert photo for background change:`, error);
              // Hata durumunda normal akışla devam et
            }
          }

          // ✅ NORMAL AYAR GÜNCELLEMESİ (arka plan değişikliği veya ham fotoğraf değil)
          const updatedSettings = { ...currentSettings, ...newSettings };

          set(state => ({
            settings: updatedSettings,
            hasUnsavedChanges: true,
            hasDraftChanges: true,
            activeFilterKey: newSettings.backgroundId ? 'custom' : state.activeFilterKey,
            lastAutoSave: Date.now()
          }));

          console.log(`⚙️ [${Platform.OS}] Normal settings update completed:`, {
            updatedBackgroundId: updatedSettings.backgroundId,
            hasUnsavedChanges: true
          });

          // ✅ OTOMATİK KAYDETME: Her değişiklik otomatik kaydetmeyi tetikler
          const currentPhoto = get().activePhoto;
          if (currentPhoto) {
            // Platforma özgü debounce edilmiş otomatik kaydetme
            setTimeout(() => {
              const state = get();
              if (state.activePhoto?.id === currentPhoto.id && state.hasDraftChanges) {
                state.performAutoSave();
              }
            }, Platform.OS === 'ios' ? 3000 : 2000);
          }
        });
      },

      /**
       * Bir filtreyi uygular ve ilgili ayarları sıfırlar/ayarlar.
       * @param filterKey Uygulanacak filtrenin anahtarı.
       * @param target Filtrenin uygulanacağı hedef ('all', 'product', 'background').
       */
      applyFilter: (filterKey: string, target: TargetType) => {
        const filterPreset = ALL_FILTERS.find(f => f.key === filterKey);
        if (!filterPreset) return;

        const currentSettings = { ...get().settings };

        // Hedefe göre sıfırlanacak özellikleri belirle
        const featuresToReset = target === 'all'
          ? [...ADJUST_FEATURES, ...BACKGROUND_FEATURES]
          : target === 'product' ? ADJUST_FEATURES : BACKGROUND_FEATURES;

        // İlgili ayarları önce sıfırla
        featuresToReset.forEach(feature => {
          if (target === 'all') {
            (currentSettings as any)[`product_${feature.key}`] = 0;
            (currentSettings as any)[`background_${feature.key}`] = 0;
          } else {
            (currentSettings as any)[`${target}_${feature.key}`] = 0;
          }
        });

        // Filtre ayarlarını uygula
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

        get().addSnapshotToHistory(); // Ayar geçmişine anlık görüntü ekle
      },

      // ===== SAVE & HISTORY ACTIONS =====

      /**
       * ✅ ÇÖZÜM 3: Memory-Safe Save Changes
       * Editördeki değişiklikleri kaydeder. İsteğe bağlı olarak küçük resim güncellemesi de yapabilir
       * ve bellek yönetimi ile sorunsuz çalışır.
       * @param previewRef Önizleme için React ref'i (isteğe bağlı).
       * @returns Promise<void>
       * @throws Kaydetme işlemi başarısız olursa.
       */
      saveChanges: async (previewRef?: React.RefObject<any>) => {
        return await CriticalOperationManager.withLock('save-changes', async () => {
          const { activePhoto, settings, isSaving } = get();
          if (!activePhoto || isSaving) return;

          set({ isSaving: true, thumbnailError: null });
          console.log(`💾 [${Platform.OS}] Memory-safe saveChanges started:`, {
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
            console.log(`✅ [${Platform.OS}] Photo settings updated in product store`);

            // 2. ✅ PLATFORM-OPTIMIZED: Küçük resim güncellemesi (eğer previewRef mevcutsa)
            if (previewRef && previewRef.current) {
              console.log(`🖼️ [${Platform.OS}] Starting platform-optimized thumbnail update with preview ref`);
              await get().updateThumbnailWithPreview(previewRef);
              console.log(`✅ [${Platform.OS}] Platform-optimized thumbnail update completed`);
            } else {
              console.log(`⏭️ [${Platform.OS}] Skipping thumbnail update (no preview ref)`);
            }

            // 3. Taslağı temizle
            get().clearDraftForPhoto(activePhoto.id);
            console.log(`🗑️ [${Platform.OS}] Draft cleared`);

            set({
              isSaving: false,
              hasUnsavedChanges: false,
              hasDraftChanges: false
            });

            // Yerelleştirilmiş bildirim
            ToastService.show(previewRef
              ? i18n.t('editor.changesSavedAndThumbnail')
              : i18n.t('editor.settingsSaved')
            );

            console.log(`✅ [${Platform.OS}] Memory-safe saveChanges completed successfully`);

          } catch (error: any) {
            console.error(`❌ [${Platform.OS}] Memory-safe save failed:`, error);
            set({
              isSaving: false,
              thumbnailError: error.message || i18n.t('editor.settingsSaveFailed')
            });

            ToastService.show(error.message || i18n.t('editor.settingsSaveFailed'));
            throw error;
          }
        });
      },

      /**
       * Ayar geçmişine anlık görüntü (snapshot) ekler.
       * Yinelenen ayarları önler ve geçmiş boyutunu bellek yönetimi için sınırlar.
       */
      addSnapshotToHistory: () => {
        const { settings, history, currentHistoryIndex } = get();
        const currentSnapshot = history[currentHistoryIndex]?.settings;

        // Yinelenen ayarları ekleme
        if (currentSnapshot && JSON.stringify(currentSnapshot) === JSON.stringify(settings)) {
          return;
        }

        const newHistory = history.slice(0, currentHistoryIndex + 1);
        newHistory.push({ settings: { ...settings }, timestamp: Date.now() });

        // Bellek yönetimi için geçmiş boyutunu sınırla
        const maxHistorySize = Platform.OS === 'ios' ? 30 : 50; // iOS: daha küçük geçmiş
        if (newHistory.length > maxHistorySize) {
          newHistory.shift(); // En eskiyi kaldır
        }

        set({
          history: newHistory,
          currentHistoryIndex: newHistory.length - 1
        });
      },

      /**
       * Geçmişte bir adım geri gider (geri al).
       */
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

      /**
       * Geçmişte bir adım ileri gider (yeniden yap).
       */
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

      /**
       * Geri alma işleminin mümkün olup olmadığını kontrol eder.
       * @returns Geri alınabiliyorsa true, aksi takdirde false.
       */
      canUndo: () => get().currentHistoryIndex > 0,
      /**
       * Yeniden yapma işleminin mümkün olup olmadığını kontrol eder.
       * @returns Yeniden yapılabiliyorsa true, aksi takdirde false.
       */
      canRedo: () => get().currentHistoryIndex < get().history.length - 1,

      // ===== DRAFT SYSTEM ACTIONS =====

      /**
       * Aktif fotoğraf için taslağı kaydeder.
       */
      saveDraft: () => {
        const activePhoto = get().activePhoto;
        if (activePhoto) {
          get().saveDraftForPhoto(activePhoto.id);
        }
      },

      /**
       * Belirli bir fotoğraf kimliği için taslağı kaydeder.
       * @param photoId Taslağı kaydedilecek fotoğrafın kimliği.
       */
      saveDraftForPhoto: (photoId: string) => {
        const { settings, photoDrafts, activePhoto } = get();
        if (!activePhoto || activePhoto.id !== photoId) return; // Sadece aktif fotoğrafın taslağını kaydet

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
          lastAutoSave: Date.now() // Son otomatik kaydetme zamanını güncelle
        });

        console.log(`💾 [${Platform.OS}] Draft saved for photo:`, photoId);
      },

      /**
       * Belirli bir fotoğraf kimliği için taslağı yükler.
       * @param photoId Yüklenecek taslağın fotoğraf kimliği.
       * @returns Yüklenen taslak veya bulunamazsa null.
       */
      loadDraftForPhoto: (photoId: string) => {
        return get().photoDrafts.get(photoId) || null;
      },

      /**
       * Aktif fotoğrafın taslağını temizler.
       */
      clearDraft: () => {
        const activePhoto = get().activePhoto;
        if (activePhoto) {
          get().clearDraftForPhoto(activePhoto.id);
        }
      },

      /**
       * Belirli bir fotoğraf kimliği için taslağı temizler.
       * @param photoId Temizlenecek taslağın fotoğraf kimliği.
       */
      clearDraftForPhoto: (photoId: string) => {
        const { photoDrafts } = get();
        const newDrafts = new Map(photoDrafts);
        newDrafts.delete(photoId); // Taslağı haritadan sil

        set({
          photoDrafts: newDrafts,
          hasDraftChanges: false // Taslakta değişiklik olmadığını belirt
        });

        console.log(`🗑️ [${Platform.OS}] Draft cleared for photo:`, photoId);
      },

      /**
       * Belirli bir fotoğraf kimliği için taslak olup olmadığını kontrol eder.
       * @param photoId Kontrol edilecek fotoğrafın kimliği.
       * @returns Taslak varsa true, aksi takdirde false.
       */
      hasDraftForPhoto: (photoId: string) => {
        return get().photoDrafts.has(photoId);
      },

      /**
       * Tüm fotoğraf taslaklarını bir dizi olarak döndürür.
       * @returns Tüm taslakları içeren bir dizi.
       */
      getAllDrafts: () => {
        return Array.from(get().photoDrafts.values());
      },

      /**
       * Bir taslaktan ayarları geri yükler ve geçmişi sıfırlar.
       * @param draft Geri yüklenecek taslak.
       */
      restoreFromDraft: (draft: PhotoDraft) => {
        const initialEntry = { settings: draft.settings, timestamp: Date.now() };

        set({
          settings: draft.settings,
          history: [initialEntry],
          currentHistoryIndex: 0,
          hasUnsavedChanges: true,
          hasDraftChanges: true,
          activeFilterKey: 'custom' // Filtre anahtarını özel olarak ayarla
        });

        console.log(`🔄 [${Platform.OS}] Restored from draft:`, draft.photoId);
      },

      // ===== AUTO-SAVE ACTIONS =====

      /**
       * Otomatik kaydetme işlemini gerçekleştirir.
       * Platforma özgü bir debounce mekanizması içerir.
       */
      performAutoSave: () => {
        const { activePhoto, hasDraftChanges } = get();

        if (!activePhoto || !hasDraftChanges) {
          return;
        }

        // Platforma özgü debounce koruması
        const now = Date.now();
        const timeSinceLastSave = now - get().lastAutoSave;
        const minInterval = Platform.OS === 'ios' ? 8000 : 5000; // iOS: daha uzun aralık

        if (timeSinceLastSave < minInterval) {
          return;
        }

        try {
          get().saveDraftForPhoto(activePhoto.id);
          console.log(`⚡ [${Platform.OS}] Auto-save completed for photo:`, activePhoto.id);
        } catch (error) {
          console.warn(`⚠️ [${Platform.OS}] Auto-save failed:`, error);
        }
      },

      // ===== PLATFORM-OPTIMIZED THUMBNAIL ACTIONS =====

      /**
       * ✅ ÇÖZÜM 2: Platform-Optimized Thumbnail Update
       * Önizleme ref'i kullanarak optimize edilmiş bir küçük resim yakalar ve kaydeder.
       * Bellek yönetimi ve ürün mağazasını güncelleme içerir.
       * @param previewRef Önizleme için React ref'i.
       * @returns Promise<void>
       * @throws Küçük resim güncelleme işlemi başarısız olursa.
       */
      updateThumbnailWithPreview: async (previewRef: React.RefObject<any>) => {
        return await CriticalOperationManager.withLock('thumbnail-update', async () => {
          const { activePhoto } = get();
          if (!activePhoto || !previewRef.current) return;

          set({ isUpdatingThumbnail: true, thumbnailError: null });
          console.log(`🖼️ [${Platform.OS}] Starting platform-optimized thumbnail update for photo:`, activePhoto.id);

          try {
            // 1. Platforma optimize edilmiş önizleme yakalama
            const config = memoryManager.getPreviewConfig();
            const capturedUri = await imageProcessor.captureFilteredThumbnail(previewRef, {
              width: config.width,
              height: config.height
            });
            console.log(`📸 [${Platform.OS}] Platform-optimized preview captured:`, capturedUri);

            // 2. Önbellek bozan kalıcı küçük resim olarak kaydet
            const newThumbnailUri = await imageProcessor.saveFilteredThumbnail(
              activePhoto.productId,
              activePhoto.id,
              capturedUri
            );
            console.log(`💾 [${Platform.OS}] Cache-busted thumbnail saved:`, newThumbnailUri);

            // 3. KRİTİK: Ürün mağazasını BEKLETEREK güncelle
            await useProductStore.getState().updatePhotoThumbnail(
              activePhoto.productId,
              activePhoto.id,
              newThumbnailUri
            );
            console.log(`🔄 [${Platform.OS}] Product store updated with optimized thumbnail`);

            // 4. Yerel durumu güncelle (anlık UI geri bildirimi)
            const updatedPhoto = {
              ...activePhoto,
              thumbnailUri: newThumbnailUri,
              modifiedAt: new Date().toISOString()
            };

            set({
              activePhoto: updatedPhoto,
              isUpdatingThumbnail: false
            });

            // 5. Bellek yönetimi ile platforma özgü önbellek geçersizleştirme
            setTimeout(async () => {
              try {
                await memoryManager.addOperation(async () => {
                  // Görsel önbelleğini temizle
                  await imageProcessor.clearImageCache();

                  // Ürün mağazasını zorla yeniden yükle
                  const productStore = useProductStore.getState();
                  await productStore.loadProducts();

                  console.log(`🔄 [${Platform.OS}] Forced product store refresh for UI update`);
                }, {
                  priority: 'low',
                  memoryEstimate: Platform.OS === 'ios' ? 5 : 8,
                  timeout: 10000
                });
              } catch (refreshError) {
                console.warn(`⚠️ [${Platform.OS}] Cache refresh warning:`, refreshError);
              }
            }, Platform.OS === 'ios' ? 500 : 300);

            console.log(`✅ [${Platform.OS}] Platform-optimized thumbnail update completed successfully`);

          } catch (error: any) {
            console.error(`❌ [${Platform.OS}] Platform-optimized thumbnail update failed:`, error);
            set({
              isUpdatingThumbnail: false,
              thumbnailError: error.message || i18n.t('editor.thumbnailUpdateFailed')
            });

            // Hata durumunda acil temizlik
            try {
              await memoryManager.addOperation(async () => {
                await imageProcessor.clearImageCache();
              }, {
                priority: 'high',
                memoryEstimate: 3,
                timeout: 5000
              });
            } catch (cacheError) {
              console.warn(`⚠️ [${Platform.OS}] Emergency cache clear failed:`, cacheError);
            }

            throw error;
          }
        });
      },

      // ===== RESET ACTIONS =====

      /**
       * Tüm editör ayarlarını varsayılana sıfırlar ve geçmişi temizler.
       */
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

        // Aktif fotoğraf taslağını temizle
        const activePhoto = get().activePhoto;
        if (activePhoto) {
          get().clearDraftForPhoto(activePhoto.id);
        }

        console.log(`🔄 [${Platform.OS}] All settings reset to default`);
      },

      /**
       * Kırpma ve döndürme ayarlarını varsayılana sıfırlar.
       */
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

      /**
       * Mevcut kırpma ayarlarını görsel kırpma olarak uygular.
       */
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

        ToastService.show(i18n.t('editor.cropApplied'));
      },

      /**
       * Editör mağazasını temizler ve bellek temizliği yapar.
       */
      clearStore: () => {
        // Değişiklikler varsa temizlemeden önce taslağı kaydet
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

        // Platforma özgü bellek temizliği
        setTimeout(async () => {
          try {
            await memoryManager.cleanupMemory();
            console.log(`🧹 [${Platform.OS}] Editor store cleared with memory cleanup`);
          } catch (error) {
            console.warn(`⚠️ [${Platform.OS}] Store cleanup warning:`, error);
          }
        }, 100);
      },

      // Yardımcı eylemler
      setActiveFilterKey: (key) => set({ activeFilterKey: key }),

      /**
       * ✅ Advanced Draft Management
       * Taslak sistemi hakkında ayrıntılı istatistikler döndürür.
       * @returns Taslak istatistiklerini içeren bir nesne.
       */
      getDraftStats: () => {
        const drafts = get().photoDrafts;
        const now = Date.now();

        return {
          totalDrafts: drafts.size,
          oldDrafts: Array.from(drafts.values()).filter(draft =>
            now - draft.timestamp > 24 * 60 * 60 * 1000 // 24 saatten eski taslaklar
          ).length,
          autoSavedDrafts: Array.from(drafts.values()).filter(draft =>
            draft.autoSaved // Otomatik kaydedilmiş taslaklar
          ).length,
          lastAutoSave: get().lastAutoSave,
          platform: Platform.OS,
        };
      },

      /**
       * ✅ Cleanup Old Drafts
       * Belirli bir yaştan (örneğin 7 gün) eski taslakları temizler.
       * @returns Temizlenen taslak sayısı.
       */
      cleanupOldDrafts: () => {
        const { photoDrafts } = get();
        const now = Date.now();
        const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 gün

        const newDrafts = new Map();
        let cleanedCount = 0;

        for (const [photoId, draft] of photoDrafts.entries()) {
          if (now - draft.timestamp < maxAge) {
            newDrafts.set(photoId, draft);
          } else {
            cleanedCount++;
          }
        }

        set({ photoDrafts: newDrafts });

        console.log(`🧹 [${Platform.OS}] Cleaned ${cleanedCount} old drafts`);
        return cleanedCount;
      },

      /**
       * ✅ Memory Optimization
       * Editörün bellek kullanımını optimize eder: eski taslakları temizler, geçmiş boyutunu sınırlar
       * ve genel bellek temizliği yapar.
       * @returns Promise<void>
       */
      optimizeMemory: async () => {
        try {
          console.log(`🔧 [${Platform.OS}] Starting editor memory optimization`);

          // 1. Eski taslakları temizle
          get().cleanupOldDrafts();

          // 2. Geçmiş boyutunu sınırla
          const { history, currentHistoryIndex } = get();
          const maxHistory = Platform.OS === 'ios' ? 20 : 30; // iOS: daha küçük geçmiş

          if (history.length > maxHistory) {
            const newHistory = history.slice(-maxHistory); // En yeni 'maxHistory' öğeyi tut
            const newIndex = Math.min(currentHistoryIndex, newHistory.length - 1); // İndeksi ayarla

            set({
              history: newHistory,
              currentHistoryIndex: Math.max(0, newIndex)
            });
          }

          // 3. Bellek yöneticisi temizliği
          await memoryManager.cleanupMemory();

          console.log(`✅ [${Platform.OS}] Editor memory optimization completed`);
        } catch (error) {
          console.warn(`⚠️ [${Platform.OS}] Memory optimization warning:`, error);
        }
      },

      /**
       * ✅ Performance Stats
       * Editörün performans istatistiklerini (taslaklar, bellek, kritik operasyonlar) döndürür.
       * @returns Performans istatistiklerini içeren bir nesne.
       */
      getPerformanceStats: () => {
        const draftStats = get().getDraftStats();
        const memoryStatus = memoryManager.getMemoryStatus();
        const criticalOps = CriticalOperationManager.getStats();

        return {
          platform: Platform.OS,
          editor: {
            activePhoto: !!get().activePhoto,
            hasChanges: get().hasUnsavedChanges,
            isSaving: get().isSaving,
            isUpdatingThumbnail: get().isUpdatingThumbnail,
            historySize: get().history.length,
            currentHistoryIndex: get().currentHistoryIndex,
          },
          drafts: draftStats,
          memory: memoryStatus,
          criticalOperations: criticalOps,
          lastUpdate: new Date().toISOString(),
        };
      },

      /**
       * ✅ Emergency Recovery
       * Editör için acil durum kurtarma işlemleri başlatır: taslakları kaydeder,
       * kritik kilitleri temizler ve bellek kurtarma yapar.
       * @returns Promise<void>
       */
      emergencyRecovery: async () => {
        try {
          console.log(`🆘 [${Platform.OS}] Editor emergency recovery initiated`);

          // 1. Mümkünse mevcut taslağı kaydet
          const activePhoto = get().activePhoto;
          if (activePhoto && get().hasDraftChanges) {
            try {
              get().saveDraftForPhoto(activePhoto.id);
            } catch (error) {
              console.warn(`⚠️ [${Platform.OS}] Emergency draft save failed:`, error);
            }
          }

          // 2. Kritik kilitleri temizle
          CriticalOperationManager.clearAllLocks();

          // 3. Sorunlu durumları sıfırla
          set({
            isSaving: false,
            isUpdatingThumbnail: false,
            thumbnailError: null,
          });

          // 4. Bellek kurtarma
          await memoryManager.emergencyCleanup();

          console.log(`✅ [${Platform.OS}] Editor emergency recovery completed`);
        } catch (error) {
          console.error(`❌ [${Platform.OS}] Editor emergency recovery failed:`, error);
        }
      },
    }),
    {
      name: `enhanced-editor-storage-${Platform.OS}-v6`, // Platforma özgü depolama adı
      storage: createJSONStorage(() => AsyncStorage), // AsyncStorage'ı depolama motoru olarak kullan
      partialize: (state) => ({ // Depolanacak durumun alt kümesini seç
        userPresets: state.userPresets,
        photoDrafts: Array.from(state.photoDrafts.entries()), // Map'i serileştir
      }),
      onRehydrateStorage: () => (state) => { // Yeniden canlandırma sırasında çağrılır
        if (state && Array.isArray(state.photoDrafts)) {
          // Map'i seri durumdan çıkar
          state.photoDrafts = new Map(state.photoDrafts);
        } else {
          // Varsayılan olarak boş bir Map ayarla
          state.photoDrafts = new Map();
        }

        console.log(`🔄 [${Platform.OS}] Editor store rehydrated with ${state?.photoDrafts?.size || 0} drafts`);
      }
    }
  )
);
