// features/editor/hooks/useBackgroundPreloader.ts - BACKGROUND PRELOADING HOOK
import { useEffect, useCallback, useRef } from 'react';
import { backgroundThumbnailManager } from '@/services/backgroundThumbnailManager';

interface Background {
  id: string;
  name: string;
  thumbnailUrl: string;
  fullUrl: string;
}

interface BackgroundPreloaderOptions {
  enabled?: boolean; // Preloading aktif mi?
  priority?: 'low' | 'normal' | 'high'; // Preload priority
  maxConcurrent?: number; // Aynı anda max kaç background preload
  delayMs?: number; // Preload başlamadan önce bekleme süresi
}

/**
 * Background thumbnail'larını preload eden hook
 * Editor açıldığında background'ları önceden cache'e yükler
 */
export const useBackgroundPreloader = (
  backgrounds: Background[],
  options: BackgroundPreloaderOptions = {}
) => {
  const {
    enabled = true,
    priority = 'low',
    maxConcurrent = 3,
    delayMs = 1000 // 1 saniye sonra başla
  } = options;

  const preloadStarted = useRef(false);
  const preloadPromises = useRef<Set<Promise<void>>>(new Set());

  // Preload fonksiyonu
  const startPreloading = useCallback(async () => {
    if (!enabled || preloadStarted.current || backgrounds.length === 0) {
      return;
    }

    preloadStarted.current = true;
    console.log('🚀 Starting background preloading:', backgrounds.length, 'items');

    try {
      // Batch'lere ayır (concurrent limit için)
      const batches: Background[][] = [];
      for (let i = 0; i < backgrounds.length; i += maxConcurrent) {
        batches.push(backgrounds.slice(i, i + maxConcurrent));
      }

      // Her batch'i sırayla işle
      for (const batch of batches) {
        const batchPromises = batch.map(async (bg) => {
          try {
            const thumbnail = await backgroundThumbnailManager.getThumbnail(
              bg.id,
              bg.fullUrl
            );
            
            if (thumbnail) {
              console.log('✅ Preloaded background:', bg.id);
            } else {
              console.warn('⚠️ Failed to preload background:', bg.id);
            }
          } catch (error) {
            console.warn('❌ Background preload error:', bg.id, error);
          }
        });

        // Bu batch'i bekle, sonra bir sonrakine geç
        await Promise.allSettled(batchPromises);
      }

      console.log('🎉 Background preloading completed');

    } catch (error) {
      console.error('❌ Background preloading failed:', error);
    }
  }, [backgrounds, enabled, maxConcurrent]);

  // Cache durumunu kontrol et
  const getCacheStatus = useCallback(() => {
    const stats = backgroundThumbnailManager.getCacheStats();
    const cachedBgCount = backgrounds.filter(bg => 
      // Bu background cache'de var mı kontrol et (basit check)
      stats.itemCount > 0
    ).length;

    return {
      totalBackgrounds: backgrounds.length,
      cachedCount: Math.min(cachedBgCount, stats.itemCount),
      cacheSize: stats.totalSize,
      isFullyCached: cachedBgCount >= backgrounds.length,
      cacheStats: stats
    };
  }, [backgrounds]);

  // Memory optimization
  const optimizeCache = useCallback(async () => {
    try {
      await backgroundThumbnailManager.optimizeMemory();
      console.log('🧹 Background cache optimized');
    } catch (error) {
      console.warn('⚠️ Cache optimization failed:', error);
    }
  }, []);

  // Clear cache
  const clearCache = useCallback(async () => {
    try {
      await backgroundThumbnailManager.clearCache();
      preloadStarted.current = false;
      console.log('🗑️ Background cache cleared');
    } catch (error) {
      console.warn('⚠️ Cache clear failed:', error);
    }
  }, []);

  // Effect: Preloading başlat
  useEffect(() => {
    if (enabled && backgrounds.length > 0) {
      const timer = setTimeout(() => {
        startPreloading();
      }, delayMs);

      return () => clearTimeout(timer);
    }
  }, [enabled, backgrounds, delayMs, startPreloading]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      // Component unmount'ta devam eden preload'ları iptal et
      preloadPromises.current.forEach(promise => {
        // Promise'leri iptal etmenin doğrudan yolu yok, 
        // ama ref'i temizleyebiliriz
      });
      preloadPromises.current.clear();
    };
  }, []);

  return {
    // Status
    isPreloadStarted: preloadStarted.current,
    getCacheStatus,
    
    // Actions
    startPreloading,
    optimizeCache,
    clearCache,
    
    // Utils
    preloadSpecificBackgrounds: useCallback(async (bgList: Background[]) => {
      if (bgList.length === 0) return;
      
      console.log('🎯 Preloading specific backgrounds:', bgList.length);
      await backgroundThumbnailManager.preloadThumbnails(
        bgList.map(bg => ({ id: bg.id, fullUrl: bg.fullUrl }))
      );
    }, [])
  };
};