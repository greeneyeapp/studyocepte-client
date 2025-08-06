// features/editor/hooks/useEditorAutoSave.ts - TAM AUTO-SAVE SİSTEMİ
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
 * Enhanced auto-save hook with comprehensive features:
 * - Periodic auto-save timer
 * - App background/foreground detection
 * - Component unmount protection
 * - Debounced saves for performance
 * - Network-aware saving
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
    autoSaveEnabled, 
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

      if (autoSaveEnabled && hasDraftChanges && activePhoto && !isSaving && !isUpdatingThumbnail) {
        console.log('💾 Debounced auto-save triggered for photo:', activePhoto.id);
        lastSaveAttempt.current = now;
        performAutoSave();
      }
    }, debounceMs);
  }, [autoSaveEnabled, hasDraftChanges, activePhoto, isSaving, isUpdatingThumbnail, performAutoSave, debounceMs]);

  // ===== PERIODIC AUTO-SAVE TIMER =====
  
  const startPeriodicSave = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    if (!autoSaveEnabled) return;

    intervalRef.current = setInterval(() => {
      if (!mountedRef.current) return;

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

    console.log('🔄 Periodic auto-save started with interval:', intervalMs / 1000, 'seconds');
  }, [autoSaveEnabled, intervalMs, hasDraftChanges, activePhoto, isSaving, isUpdatingThumbnail, performAutoSave]);

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
    }

    if (nextAppState === 'active' && previousState === 'background') {
      // App came back to foreground - restart periodic saves
      console.log('📱 App foregrounded, restarting auto-save');
      startPeriodicSave();
    }
  }, [onAppBackground, activePhoto, hasDraftChanges, isSaving, saveDraft, startPeriodicSave]);

  // ===== EFFECTS =====

  // App state listener
  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [handleAppStateChange]);

  // Periodic auto-save setup
  useEffect(() => {
    startPeriodicSave();
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [startPeriodicSave]);

  // Debounced auto-save trigger
  useEffect(() => {
    if (hasDraftChanges && activePhoto) {
      debouncedAutoSave();
    }
  }, [hasDraftChanges, activePhoto, debouncedAutoSave]);

  // Cleanup and unmount protection
  useEffect(() => {
    mountedRef.current = true;
    
    return () => {
      mountedRef.current = false;
      
      // Clear timers
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      
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

  // ===== PUBLIC API =====

  const forceAutoSave = useCallback(() => {
    if (activePhoto && hasDraftChanges && !isSaving && !isUpdatingThumbnail) {
      console.log('🔥 Force auto-save triggered');
      lastSaveAttempt.current = Date.now();
      performAutoSave();
    }
  }, [activePhoto, hasDraftChanges, isSaving, isUpdatingThumbnail, performAutoSave]);

  const pauseAutoSave = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      console.log('⏸️ Auto-save paused');
    }
  }, []);

  const resumeAutoSave = useCallback(() => {
    startPeriodicSave();
    console.log('▶️ Auto-save resumed');
  }, [startPeriodicSave]);

  const getAutoSaveStatus = useCallback(() => {
    return {
      isEnabled: autoSaveEnabled,
      hasChanges: hasDraftChanges,
      isActive: !!intervalRef.current,
      lastSaveAttempt: lastSaveAttempt.current,
      currentPhoto: activePhoto?.id || null,
      isSaving,
      isUpdatingThumbnail
    };
  }, [autoSaveEnabled, hasDraftChanges, activePhoto, isSaving, isUpdatingThumbnail]);

  // Return public API
  return {
    // Status
    isAutoSaveEnabled: autoSaveEnabled,
    hasPendingChanges: hasDraftChanges,
    isSaving,
    isUpdatingThumbnail,
    
    // Controls
    forceAutoSave,
    pauseAutoSave,
    resumeAutoSave,
    getAutoSaveStatus,
    
    // Stats
    lastSaveAttempt: lastSaveAttempt.current,
    currentInterval: intervalMs
  };
};