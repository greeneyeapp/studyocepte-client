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
  const { t } = useTranslation(); // t hook'u kullanıldı
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
    } catch (error) {
      console.error('❌ Draft restore failed:', error);
      ToastService.show(t('editor.draftManager.draftRestoreFailed')); // Lokalize edildi
    }
  }, [restoreFromDraft, t]);

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
  formatDraftAge: (timestamp: number, t: any): string => { // t prop'u eklendi
    const age = Date.now() - timestamp;
    const minutes = Math.round(age / 60000);
    const hours = Math.round(minutes / 60);
    const days = Math.round(hours / 24);

    if (minutes < 1) return t('common.time.now'); // Lokalize edildi
    if (minutes < 60) return t('common.time.minutesAgo', { minutes: minutes }); // Lokalize edildi
    if (hours < 24) return t('common.time.hoursAgo', { hours: hours }); // Lokalize edildi
    return t('common.time.daysAgo', { days: days }); // Lokalize edildi
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
};```

**35. `client/features/editor/hooks/useEditorAutoSave.ts`**

```typescript
// features/editor/hooks/useEditorAutoSave.ts - AUTO-SAVE HEP AÇIK BASİTLEŞTİRİLMİŞ VERSİYON
import { useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useEnhancedEditorStore } from '@/stores/useEnhancedEditorStore';
import { useTranslation } from 'react-i18next'; // useTranslation import edildi

interface UseEditorAutoSaveOptions {
  intervalMs?: number; // Auto-save interval (default: 30 seconds)
  onAppBackground?: boolean; // Save when app goes to background
  onBeforeUnload?: boolean; // Save before component unmounts
  debounceMs?: number; // Debounce rapid changes (default: 2 seconds)
}

/**
 * ✅ AUTO-SAVE HEP AÇIK: Basitleştirilmiş auto-save hook
 * - Periodic auto-save timer (HEP AKTİF)
 * - App background/foreground detection
 * - Component unmount protection
 * - Debounced saves for performance
 */
export const useEditorAutoSave = (options: UseEditorAutoSaveOptions = {}) => {
  const { t } = useTranslation(); // t hook'u kullanıldı
  const {
    intervalMs = 30000, // 30 seconds
    onAppBackground = true,
    onBeforeUnload = true,
    debounceMs = 2000 // 2 seconds
  } = options;

  const { 
    activePhoto,
    hasDraftChanges,
    performAutoSave,
    saveDraft,
    isUpdatingThumbnail,
    isSaving
  } = useEnhancedEditorStore();
  
  // Refs for tracking state and timers
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const appStateRef = useRef(AppState.currentState);
  const lastSaveAttempt = useRef<number>(0);
  const mountedRef = useRef(true);

  // ===== DEBOUNCED AUTO-SAVE =====
  
  const debouncedAutoSave = useCallback(() => {
    // Clear existing debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Set new debounce
    debounceRef.current = setTimeout(() => {
      if (!mountedRef.current) return;

      const now = Date.now();
      const timeSinceLastSave = now - lastSaveAttempt.current;
      
      // Prevent too frequent saves
      if (timeSinceLastSave < 3000) { // Min 3 seconds between saves
        return;
      }

      // ✅ AUTO-SAVE HEP AÇIK: autoSaveEnabled kontrolü kaldırıldı
      if (hasDraftChanges && activePhoto && !isSaving && !isUpdatingThumbnail) {
        console.log('💾 Debounced auto-save triggered for photo:', activePhoto.id);
        lastSaveAttempt.current = now;
        performAutoSave();
      }
    }, debounceMs);
  }, [hasDraftChanges, activePhoto, isSaving, isUpdatingThumbnail, performAutoSave, debounceMs]);

  // ===== PERIODIC AUTO-SAVE TIMER =====
  
  const startPeriodicSave = useCallback(() => {
    // Zaten çalışan interval varsa temizle
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    console.log('🔄 Starting periodic auto-save with interval:', intervalMs / 1000, 'seconds');

    intervalRef.current = setInterval(() => {
      if (!mountedRef.current) {
        return;
      }

      const now = Date.now();
      const timeSinceLastSave = now - lastSaveAttempt.current;
      
      // Only save if enough time has passed and conditions are met
      if (
        timeSinceLastSave >= intervalMs && 
        hasDraftChanges && 
        activePhoto && 
        !isSaving && 
        !isUpdatingThumbnail
      ) {
        console.log('⏰ Periodic auto-save triggered for photo:', activePhoto.id);
        lastSaveAttempt.current = now;
        performAutoSave();
      }
    }, intervalMs);
  }, [intervalMs, hasDraftChanges, activePhoto, isSaving, isUpdatingThumbnail, performAutoSave]);

  const stopPeriodicSave = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      console.log('⏹️ Periodic auto-save stopped');
    }
  }, []);

  // ===== APP STATE MANAGEMENT =====
  
  const handleAppStateChange = useCallback((nextAppState: AppStateStatus) => {
    const previousState = appStateRef.current;
    appStateRef.current = nextAppState;

    console.log('📱 App state changed:', previousState, '->', nextAppState);

    if (onAppBackground && 
        previousState.match(/active|foreground/) && 
        nextAppState === 'background') {
      
      // App going to background - save immediately
      if (activePhoto && hasDraftChanges && !isSaving) {
        console.log('📱 App backgrounding, saving draft for photo:', activePhoto.id);
        saveDraft();
        lastSaveAttempt.current = Date.now();
      }
      
      // Background'a giderken periodic save'i durdur
      stopPeriodicSave();
    }

    if (nextAppState === 'active' && previousState === 'background') {
      // App came back to foreground - restart periodic saves
      console.log('📱 App foregrounded, restarting auto-save');
      startPeriodicSave();
    }
  }, [onAppBackground, activePhoto, hasDraftChanges, isSaving, saveDraft, startPeriodicSave, stopPeriodicSave]);

  // ===== EFFECTS =====

  // App state listener - sadece bir kez setup
  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [handleAppStateChange]);

  // ✅ AUTO-SAVE HEP AÇIK: Component mount'ta otomatik başlat
  useEffect(() => {
    mountedRef.current = true;
    
    // Hemen başlat
    startPeriodicSave();
    
    return () => {
      mountedRef.current = false;
      
      // Cleanup
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
    };
  }, [startPeriodicSave]);

  // ✅ AUTO-SAVE HEP AÇIK: Debounced auto-save trigger - sadece değişiklik olduğunda
  useEffect(() => {
    if (hasDraftChanges && activePhoto) {
      debouncedAutoSave();
    }
    
    return () => {
      // Cleanup debounce on dependency change
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
    };
  }, [hasDraftChanges, activePhoto?.id, debouncedAutoSave]);

  // Cleanup and unmount protection
  useEffect(() => {
    return () => {
      // Save on unmount if needed
      if (onBeforeUnload) {
        const state = useEnhancedEditorStore.getState();
        if (state.activePhoto && state.hasDraftChanges && !state.isSaving) {
          console.log('🔄 Component unmounting, saving draft...');
          state.saveDraft();
        }
      }
    };
  }, [onBeforeUnload]);

  // ===== PUBLIC API (BASİTLEŞTİRİLMİŞ) =====

  const forceAutoSave = useCallback(() => {
    if (activePhoto && hasDraftChanges && !isSaving && !isUpdatingThumbnail) {
      console.log('🔥 Force auto-save triggered');
      lastSaveAttempt.current = Date.now();
      performAutoSave();
    }
  }, [activePhoto, hasDraftChanges, isSaving, isUpdatingThumbnail, performAutoSave]);

  // ✅ AUTO-SAVE HEP AÇIK: pause/resume kaldırıldı çünkü hep aktif olacak

  const getAutoSaveStatus = useCallback(() => {
    return {
      isEnabled: true, // ✅ HEP AÇIK
      hasChanges: hasDraftChanges,
      isActive: !!intervalRef.current,
      lastSaveAttempt: lastSaveAttempt.current,
      currentPhoto: activePhoto?.id || null,
      isSaving,
      isUpdatingThumbnail
    };
  }, [hasDraftChanges, activePhoto, isSaving, isUpdatingThumbnail]);

  // Return simplified public API
  return {
    // Status
    isAutoSaveEnabled: true, // ✅ HEP AÇIK
    hasPendingChanges: hasDraftChanges,
    isSaving,
    isUpdatingThumbnail,
    
    // Controls
    forceAutoSave,
    getAutoSaveStatus,
    
    // Stats
    lastSaveAttempt: lastSaveAttempt.current,
    currentInterval: intervalMs,
    isIntervalActive: !!intervalRef.current
  };
};