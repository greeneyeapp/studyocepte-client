// features/editor/hooks/useBackgroundLoader.ts - SIMPLE AND RELIABLE BACKGROUND LOADER
import { useState, useEffect, useRef } from 'react';
import { backgroundThumbnailManager } from '@/services/backgroundThumbnailManager';

import { useTranslation } from 'react-i18next'; // useTranslation import edildi
interface Background {
  id: string;
  name: string;
  thumbnailUrl: any;
  fullUrl: any;
}

interface BackgroundLoadState {
  isLoading: boolean;
  hasError: boolean;
  resolvedUri: string | null;
  errorMessage?: string;
}

/**
 * ✅ SIMPLE HOOK: Handles background image loading with proper state management
 * This hook eliminates the white screen issue by properly managing loading states
 */
export const useBackgroundLoader = (selectedBackground: Background | undefined) => {
  const { t } = useTranslation(); // t hook'u kullanıldı
  const [loadState, setLoadState] = useState<BackgroundLoadState>({
    isLoading: false,
    hasError: false,
    resolvedUri: null
  });

  const mountedRef = useRef(true);
  const currentRequestRef = useRef<string | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Main effect to handle background changes
  useEffect(() => {
    if (!selectedBackground) {
      setLoadState({
        isLoading: false,
        hasError: false,
        resolvedUri: null
      });
      return;
    }

    const requestId = `${selectedBackground.id}_${Date.now()}`;
    currentRequestRef.current = requestId;

    const loadBackground = async () => {
      // Set loading state
      setLoadState({
        isLoading: true,
        hasError: false,
        resolvedUri: null
      });

      console.log('🖼️ Loading background:', selectedBackground.id);

      try {
        // Use the robust thumbnail manager
        const resolvedUri = await backgroundThumbnailManager.getThumbnail(
          selectedBackground.id,
          selectedBackground.fullUrl
        );

        // Check if this request is still current
        if (!mountedRef.current || currentRequestRef.current !== requestId) {
          console.log('⏭️ Background load cancelled (component unmounted or new request)');
          return;
        }

        if (resolvedUri) {
          console.log('✅ Background loaded successfully:', selectedBackground.id, resolvedUri);
          setLoadState({
            isLoading: false,
            hasError: false,
            resolvedUri
          });
        } else {
          throw new Error('Failed to resolve background URI');
        }

      } catch (error: any) {
        console.error('❌ Background load failed:', selectedBackground.id, error);
        
        // Check if this request is still current
        if (!mountedRef.current || currentRequestRef.current !== requestId) {
          return;
        }

        setLoadState({
          isLoading: false,
          hasError: true,
          resolvedUri: null,
          errorMessage: error.message || t('backgrounds.loadFailed') // Lokalize edildi
        });
      }
    };

    loadBackground();

    return () => {
      // Mark this request as cancelled
      if (currentRequestRef.current === requestId) {
        currentRequestRef.current = null;
      }
    };
  }, [selectedBackground?.id, selectedBackground?.fullUrl]);

  // Retry function
  const retryLoad = () => {
    if (selectedBackground && !loadState.isLoading) {
      console.log('🔄 Retrying background load:', selectedBackground.id);
      
      // Force effect to re-run by updating the dependency
      const event = new CustomEvent('background-retry');
      window.dispatchEvent(event);
      
      // Or simply trigger the effect by resetting state
      setLoadState({
        isLoading: true,
        hasError: false,
        resolvedUri: null
      });
    }
  };

  return {
    isLoading: loadState.isLoading,
    hasError: loadState.hasError,
    resolvedUri: loadState.resolvedUri,
    errorMessage: loadState.errorMessage,
    retryLoad,
    
    // Helper properties
    isReady: !loadState.isLoading && !loadState.hasError && !!loadState.resolvedUri,
    isEmpty: !selectedBackground,
  };
};