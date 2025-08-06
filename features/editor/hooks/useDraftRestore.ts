// features/editor/hooks/useDraftRestore.ts - SADECE HOOK
import { useEffect, useState, useCallback } from 'react';
import { useEnhancedEditorStore, PhotoDraft } from '@/stores/useEnhancedEditorStore';
import { ToastService } from '@/components/Toast/ToastService';
import { DialogService } from '@/components/Dialog/DialogService';

interface DraftRestoreOptions {
  autoRestore?: boolean; // Otomatik restore etsin mi?
  showNotification?: boolean; // Restore notification göstersin mi?
  maxDraftAge?: number; // Maksimum draft yaşı (ms)
}

/**
 * Draft restore hook - kullanıcı editor'a girdiğinde draft kontrolü yapar
 */
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
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [pendingDraft, setPendingDraft] = useState<PhotoDraft | null>(null);

  // Draft'ları filtrele (eski olanları temizle)
  const filterValidDrafts = useCallback((drafts: PhotoDraft[]) => {
    const now = Date.now();
    return drafts.filter(draft => {
      const age = now - draft.timestamp;
      return age <= maxDraftAge;
    });
  }, [maxDraftAge]);

  // Aktif foto için draft kontrolü
  const checkForDraft = useCallback(async () => {
    if (!activePhoto) return;

    const draft = loadDraftForPhoto(activePhoto.id);
    if (!draft) return;

    // Draft yaşını kontrol et
    const draftAge = Date.now() - draft.timestamp;
    if (draftAge > maxDraftAge) {
      console.log('🗑️ Old draft found, cleaning up:', activePhoto.id);
      clearDraftForPhoto(activePhoto.id);
      return;
    }

    console.log('📂 Draft found for photo:', activePhoto.id, 'Age:', Math.round(draftAge / 60000), 'minutes');

    if (autoRestore) {
      // Otomatik restore
      restoreFromDraft(draft);
      if (showNotification) {
        ToastService.show({
          type: 'info',
          text1: 'Taslak Geri Yüklendi',
          text2: `${Math.round(draftAge / 60000)} dakika önceki değişiklikler geri yüklendi`
        });
      }
    } else {
      // Manuel restore seçeneği sun
      setPendingDraft(draft);
      setShowRestoreDialog(true);
    }
  }, [activePhoto, loadDraftForPhoto, maxDraftAge, autoRestore, restoreFromDraft, showNotification, clearDraftForPhoto]);

  // Tüm draft'ları güncelle
  const refreshDrafts = useCallback(() => {
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
      
      setShowRestoreDialog(false);
      setPendingDraft(null);
    } catch (error) {
      console.error('❌ Draft restore failed:', error);
      ToastService.show({
        type: 'error',
        text1: 'Restore Hatası',
        text2: 'Taslak geri yüklenemedi'
      });
    }
  }, [restoreFromDraft]);

  // Restore dialog'unu reddet
  const handleRejectRestore = useCallback(() => {
    if (pendingDraft) {
      clearDraftForPhoto(pendingDraft.photoId);
    }
    setShowRestoreDialog(false);
    setPendingDraft(null);
  }, [pendingDraft, clearDraftForPhoto]);

  // Effects
  useEffect(() => {
    refreshDrafts();
  }, [refreshDrafts]);

  useEffect(() => {
    if (activePhoto) {
      checkForDraft();
    }
  }, [activePhoto, checkForDraft]);

  // Restore dialog göster
  useEffect(() => {
    if (showRestoreDialog && pendingDraft) {
      const draftAge = Date.now() - pendingDraft.timestamp;
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
            onPress: handleRejectRestore
          },
          {
            text: 'Geri Yükle',
            style: 'default',
            onPress: () => handleManualRestore(pendingDraft)
          }
        ]
      });
    }
  }, [showRestoreDialog, pendingDraft, handleManualRestore, handleRejectRestore]);

  return {
    // State
    availableDrafts,
    hasPendingRestore: showRestoreDialog,
    pendingDraft,
    
    // Actions
    refreshDrafts,
    checkForDraft,
    handleManualRestore,
    handleRejectRestore,
    
    // Utils
    hasActiveDraft: activePhoto ? hasDraftForPhoto(activePhoto.id) : false,
    totalDraftsCount: availableDrafts.length
  };
};

// ===== DRAFT MANAGEMENT UTILITIES =====

export const draftUtils = {
  /**
   * Draft yaşını human-readable formatta döndürür
   */
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

  /**
   * Draft boyutunu tahmin eder
   */
  estimateDraftSize: (draft: PhotoDraft): string => {
    const jsonSize = JSON.stringify(draft).length;
    if (jsonSize < 1024) return `${jsonSize} B`;
    if (jsonSize < 1024 * 1024) return `${Math.round(jsonSize / 1024)} KB`;
    return `${Math.round(jsonSize / (1024 * 1024))} MB`;
  },

  /**
   * Draft'ın ne kadar değişiklik içerdiğini analiz eder
   */
  analyzeDraftChanges: (draft: PhotoDraft): { changedSettings: number; hasSignificantChanges: boolean } => {
    const settings = draft.settings;
    let changedSettings = 0;
    let hasSignificantChanges = false;

    // Tüm ayarları kontrol et
    Object.entries(settings).forEach(([key, value]) => {
      if (key.includes('_') && typeof value === 'number' && Math.abs(value) > 0) {
        changedSettings++;
        if (Math.abs(value) > 10) { // Önemli değişiklik threshold
          hasSignificantChanges = true;
        }
      }
    });

    return { changedSettings, hasSignificantChanges };
  }
};