// features/editor/hooks/useEditorAutoSave.ts - DÖNGÜ SORUNU DÜZELTİLMİŞ VERSİYON
import { useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useEnhancedEditorStore } from '@/stores/useEnhancedEditorStore';
import { useTranslation } from 'react-i18next'; // useTranslation import edildi

interface UseEditorAutoSaveOptions {
  intervalMs?: number;
  onAppBackground?: boolean;
  onBeforeUnload?: boolean;
  debounceMs?: number;
}

export const useEditorAutoSave = (options: UseEditorAutoSaveOptions = {}) => {
  const { t } = useTranslation();
  const {
    intervalMs = 30000,
    onAppBackground = true,
    onBeforeUnload = true,
    debounceMs = 2000
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
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const appStateRef = useRef(AppState.currentState);
  const lastSaveAttempt = useRef<number>(0);
  const mountedRef = useRef(true);
  const isInitializedRef = useRef(false);

  const debouncedAutoSave = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      if (!mountedRef.current) return;

      const now = Date.now();
      const timeSinceLastSave = now - lastSaveAttempt.current;
      
      if (timeSinceLastSave < 3000) {
        return;
      }

      if (autoSaveEnabled && hasDraftChanges && activePhoto && !isSaving && !isUpdatingThumbnail) {
        console.log(t('editor.autoSaveDebouncedLog'), activePhoto.id);
        lastSaveAttempt.current = now;
        performAutoSave();
      }
    }, debounceMs);
  }, [autoSaveEnabled, hasDraftChanges, activePhoto, isSaving, isUpdatingThumbnail, performAutoSave, debounceMs, t]);

  const startPeriodicSave = useCallback(() => {
    if (intervalRef.current || !autoSaveEnabled) {
      return;
    }

    console.log(t('editor.autoSaveStartingPeriodicLog'), intervalMs / 1000);

    intervalRef.current = setInterval(() => {
      if (!mountedRef.current) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        return;
      }

      const now = Date.now();
      const timeSinceLastSave = now - lastSaveAttempt.current;
      
      if (
        timeSinceLastSave >= intervalMs && 
        hasDraftChanges && 
        activePhoto && 
        !isSaving && 
        !isUpdatingThumbnail
      ) {
        console.log(t('editor.autoSavePeriodicTriggeredLog'), activePhoto.id);
        lastSaveAttempt.current = now;
        performAutoSave();
      }
    }, intervalMs);
  }, [autoSaveEnabled, intervalMs, hasDraftChanges, activePhoto, isSaving, isUpdatingThumbnail, performAutoSave, t]);

  const stopPeriodicSave = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      console.log(t('editor.autoSavePeriodicStoppedLog'));
    }
  }, [t]);

  const handleAppStateChange = useCallback((nextAppState: AppStateStatus) => {
    const previousState = appStateRef.current;
    appStateRef.current = nextAppState;

    console.log(t('app.stateChangedLog'), previousState, '->', nextAppState);

    if (onAppBackground && 
        previousState.match(/active|foreground/) && 
        nextAppState === 'background') {
      
      if (activePhoto && hasDraftChanges && !isSaving) {
        console.log(t('editor.appBackgroundSaveDraftLog'), activePhoto.id);
        saveDraft();
        lastSaveAttempt.current = Date.now();
      }
      
      stopPeriodicSave();
    }

    if (nextAppState === 'active' && previousState === 'background') {
      console.log(t('editor.appForegroundRestartAutoSaveLog'));
      startPeriodicSave();
    }
  }, [onAppBackground, activePhoto, hasDraftChanges, isSaving, saveDraft, startPeriodicSave, stopPeriodicSave, t]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [handleAppStateChange]);

  useEffect(() => {
    mountedRef.current = true;
    
    if (!isInitializedRef.current && autoSaveEnabled) {
      isInitializedRef.current = true;
      startPeriodicSave();
    }
    
    return () => {
      mountedRef.current = false;
      isInitializedRef.current = false;
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (autoSaveEnabled && !intervalRef.current && mountedRef.current) {
      startPeriodicSave();
    } else if (!autoSaveEnabled && intervalRef.current) {
      stopPeriodicSave();
    }
  }, [autoSaveEnabled, startPeriodicSave, stopPeriodicSave]);

  useEffect(() => {
    if (hasDraftChanges && activePhoto && autoSaveEnabled) {
      debouncedAutoSave();
    }
    
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
    };
  }, [hasDraftChanges, activePhoto?.id, debouncedAutoSave, autoSaveEnabled]);

  useEffect(() => {
    return () => {
      if (onBeforeUnload) {
        const state = useEnhancedEditorStore.getState();
        if (state.activePhoto && state.hasDraftChanges && !state.isSaving) {
          console.log(t('editor.componentUnmountSaveDraftLog'));
          state.saveDraft();
        }
      }
    };
  }, [onBeforeUnload, t]);

  const forceAutoSave = useCallback(() => {
    if (activePhoto && hasDraftChanges && !isSaving && !isUpdatingThumbnail) {
      console.log(t('editor.forceAutoSaveTriggeredLog'));
      lastSaveAttempt.current = Date.now();
      performAutoSave();
    }
  }, [activePhoto, hasDraftChanges, isSaving, isUpdatingThumbnail, performAutoSave, t]);

  const pauseAutoSave = useCallback(() => {
    stopPeriodicSave();
    console.log(t('editor.autoSavePausedLog'));
  }, [stopPeriodicSave, t]);

  const resumeAutoSave = useCallback(() => {
    if (autoSaveEnabled) {
      startPeriodicSave();
      console.log(t('editor.autoSaveResumedLog'));
    }
  }, [autoSaveEnabled, startPeriodicSave, t]);

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

  return {
    isAutoSaveEnabled: autoSaveEnabled,
    hasPendingChanges: hasDraftChanges,
    isSaving,
    isUpdatingThumbnail,
    forceAutoSave,
    pauseAutoSave,
    resumeAutoSave,
    getAutoSaveStatus,
    lastSaveAttempt: lastSaveAttempt.current,
    currentInterval: intervalMs,
    isIntervalActive: !!intervalRef.current
  };
};