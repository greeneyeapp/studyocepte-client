// hooks/useEditorAutoSave.ts - Güncellenmiş ve genişletilmiş auto-save hook
import { useEffect, useRef } from 'react';
import { useEnhancedEditorStore } from '@/stores/useEnhancedEditorStore';
import { AppState } from 'react-native';

export const useEditorAutoSave = (intervalMs: number = 30000) => {
  const { 
    autoSaveEnabled, 
    performAutoSave, 
    hasUnsavedChanges, 
    hasDraftChanges,
    saveDraft,
    activePhoto 
  } = useEnhancedEditorStore();
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const appStateRef = useRef(AppState.currentState);

  // Periodic auto-save
  useEffect(() => {
    const clearExistingInterval = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    if (autoSaveEnabled && (hasUnsavedChanges || hasDraftChanges)) {
      clearExistingInterval();
      
      intervalRef.current = setInterval(() => {
        if (hasDraftChanges) {
          saveDraft();
        } else {
          performAutoSave();
        }
      }, intervalMs);
    }

    return () => {
      clearExistingInterval();
    };
    
  }, [autoSaveEnabled, hasUnsavedChanges, hasDraftChanges, intervalMs, performAutoSave, saveDraft]);

  // App state change auto-save
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (
        appStateRef.current.match(/active|foreground/) &&
        nextAppState === 'background'
      ) {
        // App going to background, save draft
        if (activePhoto && hasDraftChanges) {
          console.log('📱 App backgrounding, saving draft...');
          saveDraft();
        }
      }
      appStateRef.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [activePhoto, hasDraftChanges, saveDraft]);

  // Component unmount auto-save
  useEffect(() => {
    return () => {
      const state = useEnhancedEditorStore.getState();
      if (state.autoSaveEnabled && state.hasDraftChanges && state.activePhoto) {
        console.log('🔄 Component unmounting, saving draft...');
        state.saveDraft();
      }
    };
  }, []);
};