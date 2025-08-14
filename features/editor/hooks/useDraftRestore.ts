// features/editor/hooks/useDraftRestore.ts - AUTO-SAVE HEP AÇIK TAM VERSİYON
import { useEffect, useState, useCallback, useRef } from 'react';
import { useEnhancedEditorStore, PhotoDraft } from '@/stores/useEnhancedEditorStore';
import { ToastService } from '@/components/Toast/ToastService';
import { useTranslation } from 'react-i18next'; // useTranslation import edildi

// ✅ AUTO-SAVE HEP AÇIK: Dialog seçenekleri kaldırıldı, sadece maxDraftAge kalıyor
interface DraftRestoreOptions {
  maxDraftAge?: number;
}

export const useDraftRestore = (options: DraftRestoreOptions = {}) => {
  const { t } = useTranslation();
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
        console.log(t('editor.draft.oldDraftCleanupLog'), activePhoto.id);
        clearDraftForPhoto(activePhoto.id);
        return;
      }

      // ✅ AUTO-SAVE HEP AÇIK: Draft var ise otomatik olarak restore et
      console.log(t('editor.draft.autoRestoringDraftLog'), activePhoto.id, t('editor.draft.ageLog'), Math.round(draftAge / 60000), 'minutes');
      
      const ageMinutes = Math.round(draftAge / 60000);
      console.log(t('editor.draft.autoLoadedLog', { ageMinutes }));

    } catch (error) {
      console.warn(t('editor.draft.checkFailedLog'), error);
    }
  }, [activePhoto, loadDraftForPhoto, maxDraftAge, clearDraftForPhoto, t]);

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
      setTimeout(() => {
        if (mountedRef.current) {
          checkForDraft();
        }
      }, 100);
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
    } catch (error) {
      console.error(t('editor.draft.restoreFailedLog'), error);
      ToastService.show(t('editor.draft.restoreFailed'));
    }
  }, [restoreFromDraft, t]);

  return {
    availableDrafts,
    refreshDrafts,
    checkForDraft,
    handleManualRestore,
    hasActiveDraft: activePhoto ? hasDraftForPhoto(activePhoto.id) : false,
    totalDraftsCount: availableDrafts.length
  };
};

// Utility fonksiyonları aynı kalıyor
export const draftUtils = {
  formatDraftAge: (timestamp: number): string => {
    const { t } = useTranslation(); // Burada t fonksiyonunu tekrar çağırın
    const age = Date.now() - timestamp;
    const minutes = Math.round(age / 60000);
    const hours = Math.round(minutes / 60);
    const days = Math.round(hours / 24);

    if (minutes < 1) return t('editor.draft.age.now');
    if (minutes < 60) return t('editor.draft.age.minutesAgo', { minutes });
    if (hours < 24) return t('editor.draft.age.hoursAgo', { hours });
    return t('editor.draft.age.daysAgo', { days });
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