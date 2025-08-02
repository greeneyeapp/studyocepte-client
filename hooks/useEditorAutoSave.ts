// hooks/useEditorAutoSave.ts - Auto-save Hook
import { useEffect, useRef } from 'react';
import { useEnhancedEditorStore } from '@/stores/useEnhancedEditorStore';

export const useEditorAutoSave = (intervalMs: number = 30000) => {
  const { autoSaveEnabled, performAutoSave, hasUnsavedChanges } = useEnhancedEditorStore();
  const intervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (autoSaveEnabled && hasUnsavedChanges) {
      intervalRef.current = setInterval(() => {
        performAutoSave();
      }, intervalMs);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [autoSaveEnabled, hasUnsavedChanges, intervalMs]);

  // Component unmount olduğunda son bir kez kaydet
  useEffect(() => {
    return () => {
      if (hasUnsavedChanges && autoSaveEnabled) {
        performAutoSave();
      }
    };
  }, []);
};