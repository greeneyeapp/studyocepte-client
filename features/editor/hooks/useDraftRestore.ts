// features/editor/hooks/useDraftRestore.ts - AUTO-SAVE HEP AÇIK TAM VERSİYON
import { useEffect, useState, useCallback, useRef } from 'react';
import { useEnhancedEditorStore, PhotoDraft } from '@/stores/useEnhancedEditorStore';
import { ToastService } from '@/components/Toast/ToastService';

// ✅ AUTO-SAVE HEP AÇIK: Dialog seçenekleri kaldırıldı, sadece maxDraftAge kalıyor
interface DraftRestoreOptions {
  maxDraftAge?: number;
}

export const useDraftRestore = (options: DraftRestoreOptions = {}) => {
  const {
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
  
  // Component mount durumunu track et
  const mountedRef = useRef(true);
  
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
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

  // ✅ AUTO-SAVE HEP AÇIK: Otomatik draft kontrolü ve yükleme
  const checkForDraft = useCallback(async () => {
    if (!mountedRef.current || !activePhoto) {
      return;
    }

    try {
      const draft = loadDraftForPhoto(activePhoto.id);
      if (!draft) {
        return; // Draft yok, hiçbir şey yapma
      }

      // Draft yaşını kontrol et
      const draftAge = Date.now() - draft.timestamp;
      if (draftAge > maxDraftAge) {
        console.log('🗑️ Old draft found, cleaning up:', activePhoto.id);
        clearDraftForPhoto(activePhoto.id);
        return;
      }

      // ✅ AUTO-SAVE HEP AÇIK: Draft var ise otomatik olarak restore et
      console.log('📂 Auto-restoring draft for photo:', activePhoto.id, 'Age:', Math.round(draftAge / 60000), 'minutes');
      
      // setActivePhoto tarafından zaten otomatik yükleniyor, 
      // bu yüzden burada ekstra işlem yapmaya gerek yok
      // Sadece bilgi verme amaçlı log
      const ageMinutes = Math.round(draftAge / 60000);
      console.log(`✅ Draft auto-loaded: ${ageMinutes} minutes old`);

    } catch (error) {
      console.warn('⚠️ Draft check failed:', error);
    }
  }, [activePhoto, loadDraftForPhoto, maxDraftAge, clearDraftForPhoto]);

  // Tüm draft'ları güncelle
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

  // ✅ AUTO-SAVE HEP AÇIK: ActivePhoto değiştiğinde sadece draft temizliği yap
  useEffect(() => {
    if (activePhoto) {
      // checkForDraft artık sadece log için kullanılıyor
      // asıl restore işlemi setActivePhoto tarafından yapılıyor
      setTimeout(() => {
        if (mountedRef.current) {
          checkForDraft();
        }
      }, 100); // Kısa bir gecikme
    }
  }, [activePhoto, checkForDraft]);

  // Draft listesini güncelle
  useEffect(() => {
    refreshDrafts();
  }, [refreshDrafts]);

  // Manuel restore fonksiyonu (Draft Manager için)
  const handleManualRestore = useCallback((draft: PhotoDraft) => {
    try {
      restoreFromDraft(draft);
      const age = Date.now() - draft.timestamp;
      
      ToastService.show({
        type: 'success',
        text1: 'Taslak Geri Yüklendi',
        text2: `${Math.round(age / 60000)} dakika önceki değişiklikler geri yüklendi`
      });
      
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

// Utility fonksiyonları aynı kalıyor
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