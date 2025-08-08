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

  // Debugging log: Hook başlatıldığında autoRestore değeri ve sayım
  console.count('useDraftRestore initialization'); 
  console.log('useDraftRestore: Hook initialized with autoRestore =', autoRestore);

  const { 
    activePhoto, 
    getAllDrafts, 
    loadDraftForPhoto, 
    restoreFromDraft, 
    clearDraftForPhoto,
    hasDraftForPhoto 
  } = useEnhancedEditorStore();

  const [availableDrafts, setAvailableDrafts] = useState<PhotoDraft[]>([]);
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
    console.log('checkForDraft: Executing with autoRestore =', autoRestore);

    if (!activePhoto) {
      // Fotoğraf yoksa, pendingDraft'ı sıfırla ve diyalogu gizle
      setPendingDraft(null);
      DialogService.hide();
      return;
    }

    const draft = loadDraftForPhoto(activePhoto.id);
    if (!draft) {
      // Taslak yoksa, pendingDraft'ı sıfırla ve diyalogu gizle
      setPendingDraft(null);
      DialogService.hide();
      return;
    }

    // Draft yaşını kontrol et
    const draftAge = Date.now() - draft.timestamp;
    if (draftAge > maxDraftAge) {
      console.log('🗑️ Old draft found, cleaning up:', activePhoto.id);
      clearDraftForPhoto(activePhoto.id);
      // Eski taslak temizlendi, pendingDraft'ı sıfırla ve diyalogu gizle
      setPendingDraft(null);
      DialogService.hide();
      return;
    }

    console.log('📂 Draft found for photo:', activePhoto.id, 'Age:', Math.round(draftAge / 60000), 'minutes');

    if (autoRestore) {
      // Otomatik restore
      console.log('checkForDraft: autoRestore is TRUE, performing automatic restore.');
      restoreFromDraft(draft);
      // Otomatik restore yapıldığı için pendingDraft'ı sıfırla ve diyalogu gizle
      setPendingDraft(null);
      DialogService.hide(); 

      if (showNotification) { 
        ToastService.show({
          type: 'info',
          text1: 'Taslak Geri Yüklendi',
          text2: `${Math.round(draftAge / 60000)} dakika önceki değişiklikler geri yüklendi`
        });
      }
    } else {
      // Manuel restore seçeneği sun
      console.log('checkForDraft: autoRestore is FALSE, setting pendingDraft to prompt user.');
      setPendingDraft(draft); // Set pendingDraft to trigger dialog via useEffect
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
      
      setPendingDraft(null); // Restore sonrası diyalogu kapatmak için
      DialogService.hide(); // Manuel restore yapıldığında da diyalog servisini gizle
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
    setPendingDraft(null); // İptal sonrası diyalogu kapatmak için
    DialogService.hide(); // Manuel iptal yapıldığında da diyalog servisini gizle
  }, [pendingDraft, clearDraftForPhoto]);

  // Effects
  useEffect(() => {
    refreshDrafts();
  }, [refreshDrafts]);

  // activePhoto değiştiğinde veya bileşen mount edildiğinde draft kontrolü
  useEffect(() => {
    if (activePhoto) {
      checkForDraft();
    } else {
      // activePhoto null olduğunda diyalog servisinin temizlendiğinden emin ol
      setPendingDraft(null);
      DialogService.hide();
    }
  }, [activePhoto, checkForDraft]);

  // Pop-up gösterme ve gizleme mantığı (pendingDraft'e bağlı)
  useEffect(() => {
    if (autoRestore) {
      // autoRestore TRUE ise, dialog state'lerini temizle ve gizle.
      // Bu, overlay'in yanlışlıkla görünmesini önler.
      if (pendingDraft) { // Eğer bir şekilde pendingDraft set edildiyse, temizle.
        console.log('useDraftRestore: autoRestore is TRUE, but pendingDraft is set. Forcing hide.');
        setPendingDraft(null);
      }
      DialogService.hide(); // Her durumda diyalogu gizle
      return; 
    }

    // autoRestore FALSE ise (manuel onay modu)
    if (pendingDraft) { 
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
    } else {
      // pendingDraft yoksa diyalogu gizle
      DialogService.hide();
    }
  }, [pendingDraft, autoRestore, handleManualRestore, handleRejectRestore]);

  return {
    // State
    availableDrafts,
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
        if (Math.abs(value) > 10) { 
          hasSignificantChanges = true;
        }
      }
    });

    return { changedSettings, hasSignificantChanges };
  }
};