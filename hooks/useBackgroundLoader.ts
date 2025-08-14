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

export const useBackgroundLoader = (selectedBackground: Background | undefined) => {
  const { t } = useTranslation();
  const [loadState, setLoadState] = useState<BackgroundLoadState>({
    isLoading: false,
    hasError: false,
    resolvedUri: null
  });

  const mountedRef = useRef(true);
  const currentRequestRef = useRef<string | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

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
      setLoadState({
        isLoading: true,
        hasError: false,
        resolvedUri: null
      });

      console.log(t('editor.backgroundLoadingLog'), selectedBackground.id);

      try {
        const resolvedUri = await backgroundThumbnailManager.getThumbnail(
          selectedBackground.id,
          selectedBackground.fullUrl
        );

        if (!mountedRef.current || currentRequestRef.current !== requestId) {
          console.log(t('editor.backgroundLoadCancelledLog'));
          return;
        }

        if (resolvedUri) {
          console.log(t('editor.backgroundLoadedSuccessfullyLog'), selectedBackground.id, resolvedUri);
          setLoadState({
            isLoading: false,
            hasError: false,
            resolvedUri
          });
        } else {
          throw new Error(t('editor.failedToResolveBackgroundUri'));
        }

      } catch (error: any) {
        console.error(t('editor.backgroundLoadFailedLog'), selectedBackground.id, error);
        
        if (!mountedRef.current || currentRequestRef.current !== requestId) {
          return;
        }

        setLoadState({
          isLoading: false,
          hasError: true,
          resolvedUri: null,
          errorMessage: error.message || t('editor.backgroundLoadErrorDefault')
        });
      }
    };

    loadBackground();

    return () => {
      if (currentRequestRef.current === requestId) {
        currentRequestRef.current = null;
      }
    };
  }, [selectedBackground?.id, selectedBackground?.fullUrl, t]);

  const retryLoad = () => {
    if (selectedBackground && !loadState.isLoading) {
      console.log(t('editor.retryingBackgroundLoadLog'), selectedBackground.id);
      
      const event = new CustomEvent('background-retry');
      window.dispatchEvent(event);
      
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
    isReady: !loadState.isLoading && !loadState.hasError && !!loadState.resolvedUri,
    isEmpty: !selectedBackground,
  };
};