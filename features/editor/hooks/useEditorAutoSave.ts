// features/editor/hooks/useEditorAutoSave.ts - AUTO-SAVE HEP AÇIK BASİTLEŞTİRİLMİŞ VERSİYON
import { useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useEnhancedEditorStore } from '@/stores/useEnhancedEditorStore';

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