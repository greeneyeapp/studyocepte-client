// features/editor/hooks/useDraftRestore.ts - DÜZELTILMIŞ VERSİYON
import { useEffect, useState, useCallback, useRef } from 'react';
import { useEnhancedEditorStore, PhotoDraft } from '@/stores/useEnhancedEditorStore';
import { ToastService } from '@/components/Toast/ToastService';
import { DialogService } from '@/components/Dialog/DialogService';

interface DraftRestoreOptions {
  autoRestore?: boolean;
  showNotification?: boolean;
  maxDraftAge?: number;
}

export const useDraftRestore = (options: DraftRestoreOptions = {}) => {
  const {
    autoRestore = false,
    showNotification = true,
    maxDraftAge = 7 * 24 * 60 * 60 * 1000 // 7 gün
  } = options;

  const { 
    activePhoto, 
    getAllDrafts, 
    loadDraftForPhoto, 
    restoreFromDraft, 
    clearDraftForPhoto,
    hasDraftForPhoto 
  } = useEnhancedEditorStore();

  const [availableDrafts, setAvailableDrafts] = useState<PhotoDraft[]>([]);
  
  // DÜZELTME: Dialog durumunu kontrol eden stable ref
  const dialogStateRef = useRef({
    isDialogShown: false,
    currentPhotoId: null as string | null,
    isProcessing: false
  });

  // DÜZELTME: Component mount durumunu track et
  const mountedRef = useRef(true);
  
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      // Component unmount olduğunda dialog'u temizle
      if (dialogStateRef.current.isDialogShown) {
        DialogService.hide();
        dialogStateRef.current.isDialogShown = false;
      }
    };
  }, []);

  // Draft'ları filtrele
  const filterValidDrafts = useCallback((drafts: PhotoDraft[]) => {
    const now = Date.now();
    return drafts.filter(draft => {
      const age = now - draft.timestamp;
      return age <= maxDraftAge;
    });
  }, [maxDraftAge]);

  // DÜZELTME: Tek seferlik draft kontrolü
  const checkForDraft = useCallback(async () => {
    if (!mountedRef.current || !activePhoto) {
      return;
    }

    // Eğer zaten bu photo için dialog açıksa, tekrar açma
    if (dialogStateRef.current.isDialogShown && 
        dialogStateRef.current.currentPhotoId === activePhoto.id) {
      return;
    }

    // Eğer processing durumundaysa bekle
    if (dialogStateRef.current.isProcessing) {
      return;
    }

    dialogStateRef.current.isProcessing = true;

    try {
      const draft = loadDraftForPhoto(activePhoto.id);
      if (!draft) {
        // Draft yoksa dialog'u gizle
        if (dialogStateRef.current.isDialogShown) {
          DialogService.hide();
          dialogStateRef.current.isDialogShown = false;
          dialogStateRef.current.currentPhotoId = null;
        }
        return;
      }

      // Draft yaşını kontrol et
      const draftAge = Date.now() - draft.timestamp;
      if (draftAge > maxDraftAge) {
        console.log('🗑️ Old draft found, cleaning up:', activePhoto.id);
        clearDraftForPhoto(activePhoto.id);
        return;
      }

      console.log('📂 Draft found for photo:', activePhoto.id, 'Age:', Math.round(draftAge / 60000), 'minutes');

      if (autoRestore) {
        // DÜZELTME: Auto-restore durumunda dialog gösterme
        console.log('🔄 Auto-restore enabled, restoring draft automatically');
        restoreFromDraft(draft);
        
        if (showNotification) {
          ToastService.show({
            type: 'info',
            text1: 'Taslak Geri Yüklendi',
            text2: `${Math.round(draftAge / 60000)} dakika önceki değişiklikler geri yüklendi`
          });
        }

        // Dialog'u gizle (auto-restore'da gösterilmemeli)
        if (dialogStateRef.current.isDialogShown) {
          DialogService.hide();
          dialogStateRef.current.isDialogShown = false;
        }
      } else {
        // DÜZELTME: Manuel restore için dialog göster (sadece bir kez)
        if (!dialogStateRef.current.isDialogShown) {
          console.log('💬 Showing draft restore dialog for:', activePhoto.id);
          
          dialogStateRef.current.isDialogShown = true;
          dialogStateRef.current.currentPhotoId = activePhoto.id;
          
          const ageMinutes = Math.round(draftAge / 60000);
          const ageText = ageMinutes < 60 
            ? `${ageMinutes} dakika önce`
            : `${Math.round(ageMinutes / 60)} saat önce`;

          DialogService.show({
            title: 'Kaydedilmemiş Değişiklikler',
            message: `Bu fotoğraf için ${ageText} kaydedilmemiş değişiklikler bulundu. Geri yüklemek ister misiniz?`,
            buttons: [
              {
                text: 'Hayır',
                style: 'cancel',
                onPress: () => {
                  clearDraftForPhoto(activePhoto.id);
                  dialogStateRef.current.isDialogShown = false;
                  dialogStateRef.current.currentPhotoId = null;
                }
              },
              {
                text: 'Geri Yükle',
                style: 'default',
                onPress: () => {
                  restoreFromDraft(draft);
                  dialogStateRef.current.isDialogShown = false;
                  dialogStateRef.current.currentPhotoId = null;
                  
                  if (showNotification) {
                    ToastService.show({
                      type: 'success',
                      text1: 'Taslak Geri Yüklendi',
                      text2: `${ageMinutes} dakika önceki değişiklikler geri yüklendi`
                    });
                  }
                }
              }
            ]
          });
        }
      }
    } finally {
      dialogStateRef.current.isProcessing = false;
    }
  }, [activePhoto, loadDraftForPhoto, maxDraftAge, restoreFromDraft, showNotification, clearDraftForPhoto, autoRestore]);

  // DÜZELTME: Tüm draft'ları güncelle
  const refreshDrafts = useCallback(() => {
    if (!mountedRef.current) return;
    
    const allDrafts = getAllDrafts();
    const validDrafts = filterValidDrafts(allDrafts);
    setAvailableDrafts(validDrafts);
    
    // Eski draft'ları temizle
    allDrafts.forEach(draft => {
      if (!validDrafts.includes(draft)) {
        clearDraftForPhoto(draft.photoId);
      }
    });
  }, [getAllDrafts, filterValidDrafts, clearDraftForPhoto]);

  // DÜZELTME: ActivePhoto değiştiğinde draft kontrolü (debounced)
  const draftCheckTimeoutRef = useRef<NodeJS.Timeout>();
  
  useEffect(() => {
    // Önceki timeout'u temizle
    if (draftCheckTimeoutRef.current) {
      clearTimeout(draftCheckTimeoutRef.current);
    }

    if (activePhoto) {
      // Kısa bir gecikme ile draft kontrolü yap (rapid changes'i önlemek için)
      draftCheckTimeoutRef.current = setTimeout(() => {
        if (mountedRef.current) {
          checkForDraft();
        }
      }, 500); // 500ms gecikme
    } else {
      // activePhoto yoksa dialog'u gizle
      if (dialogStateRef.current.isDialogShown) {
        DialogService.hide();
        dialogStateRef.current.isDialogShown = false;
        dialogStateRef.current.currentPhotoId = null;
      }
    }

    return () => {
      if (draftCheckTimeoutRef.current) {
        clearTimeout(draftCheckTimeoutRef.current);
      }
    };
  }, [activePhoto, checkForDraft]);

  // Draft listesini güncelle
  useEffect(() => {
    refreshDrafts();
  }, [refreshDrafts]);

  // Manuel restore fonksiyonu
  const handleManualRestore = useCallback((draft: PhotoDraft) => {
    try {
      restoreFromDraft(draft);
      const age = Date.now() - draft.timestamp;
      
      ToastService.show({
        type: 'success',
        text1: 'Taslak Geri Yüklendi',
        text2: `${Math.round(age / 60000)} dakika önceki değişiklikler geri yüklendi`
      });
      
      // Dialog durumunu temizle
      dialogStateRef.current.isDialogShown = false;
      dialogStateRef.current.currentPhotoId = null;
      
    } catch (error) {
      console.error('❌ Draft restore failed:', error);
      ToastService.show({
        type: 'error',
        text1: 'Restore Hatası',
        text2: 'Taslak geri yüklenemedi'
      });
    }
  }, [restoreFromDraft]);

  return {
    // State
    availableDrafts,
    
    // Actions
    refreshDrafts,
    checkForDraft,
    handleManualRestore,
    
    // Utils
    hasActiveDraft: activePhoto ? hasDraftForPhoto(activePhoto.id) : false,
    totalDraftsCount: availableDrafts.length
  };
};

// Utility fonksiyonları aynı kalabilir
export const draftUtils = {
  formatDraftAge: (timestamp: number): string => {
    const age = Date.now() - timestamp;
    const minutes = Math.round(age / 60000);
    const hours = Math.round(minutes / 60);
    const days = Math.round(hours / 24);

    if (minutes < 1) return 'Şimdi';
    if (minutes < 60) return `${minutes} dakika önce`;
    if (hours < 24) return `${hours} saat önce`;
    return `${days} gün önce`;
  },

  estimateDraftSize: (draft: PhotoDraft): string => {
    const jsonSize = JSON.stringify(draft).length;
    if (jsonSize < 1024) return `${jsonSize} B`;
    if (jsonSize < 1024 * 1024) return `${Math.round(jsonSize / 1024)} KB`;
    return `${Math.round(jsonSize / (1024 * 1024))} MB`;
  },

  analyzeDraftChanges: (draft: PhotoDraft): { changedSettings: number; hasSignificantChanges: boolean } => {
    const settings = draft.settings;
    let changedSettings = 0;
    let hasSignificantChanges = false;

    Object.entries(settings).forEach(([key, value]) => {
      if (key.includes('_') && typeof value === 'number' && Math.abs(value) > 0) {
        changedSettings++;
        if (Math.abs(value) > 10) { 
          hasSignificantChanges = true;
        }
      }
    });

    return { changedSettings, hasSignificantChanges };
  }
};