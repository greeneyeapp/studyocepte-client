// hooks/useEditorAutoSave.ts - Düzeltilmiş ve Çalışır Hali
import { useEffect, useRef } from 'react';
import { useEnhancedEditorStore } from '@/stores/useEnhancedEditorStore';

export const useEditorAutoSave = (intervalMs: number = 30000) => {
  const { autoSaveEnabled, performAutoSave, hasUnsavedChanges } = useEnhancedEditorStore();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const clearExistingInterval = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    if (autoSaveEnabled && hasUnsavedChanges) {
      clearExistingInterval();
      
      intervalRef.current = setInterval(() => {
        performAutoSave();
      }, intervalMs);
    }

    return () => {
      clearExistingInterval();
    };
    
  }, [autoSaveEnabled, hasUnsavedChanges, intervalMs, performAutoSave]);

  useEffect(() => {
    return () => {
      const state = useEnhancedEditorStore.getState();
      if (state.autoSaveEnabled && state.hasUnsavedChanges) {
        state.performAutoSave();
      }
    };
  }, []);
};