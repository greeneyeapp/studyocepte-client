// features/editor/hooks/useBackgroundPreloader.ts - DÜZELTİLMİŞ VERSİYON
import { useEffect, useCallback, useRef, useState } from 'react';
import { backgroundThumbnailManager } from '@/services/backgroundThumbnailManager';

interface Background {
  id: string;
  name: string;
  thumbnailUrl: string;
  fullUrl: string;
}

interface BackgroundPreloaderOptions {
  enabled?: boolean;
  priority?: 'low' | 'normal' | 'high';
  maxConcurrent?: number;
  delayMs?: number;
}

/**
 * Background thumbnail'larını preload eden hook - DÜZELTİLMİŞ VERSİYON
 */
export const useBackgroundPreloader = (
  backgrounds: Background[],
  options: BackgroundPreloaderOptions = {}
) => {
  const {
    enabled = true,
    priority = 'low',
    maxConcurrent = 2, // Azaltıldı
    delayMs = 3000 // Artırıldı
  } = options;

  const preloadStarted = useRef(false);
  const preloadAborted = useRef(false);
  const [preloadStatus, setPreloadStatus] = useState<'idle' | 'loading' | 'completed' | 'error'>('idle');

  // Component unmount'ta preload'ı durdur
  useEffect(() => {
    return () => {
      preloadAborted.current = true;
    };
  }, []);

  // Preload fonksiyonu - GÜVENLİ VERSİYON
  const startPreloading = useCallback(async () => {
    if (!enabled || 
        preloadStarted.current || 
        preloadAborted.current ||
        !backgrounds || 
        backgrounds.length === 0) {
      return;
    }

    preloadStarted.current = true;
    setPreloadStatus('loading');
    
    console.log('🚀 Starting background preloading:', backgrounds.length, 'items');

    try {
      // Önce cache durumunu kontrol et
      await backgroundThumbnailManager.validateCache();

      if (preloadAborted.current) return;

      // Batch'lere ayır (concurrent limit için)
      const batches: Background[][] = [];
      for (let i = 0; i < backgrounds.length; i += maxConcurrent) {
        batches.push(backgrounds.slice(i, i + maxConcurrent));
      }

      let totalProcessed = 0;

      // Her batch'i sırayla işle
      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        if (preloadAborted.current) break;

        const batch = batches[batchIndex];
        console.log(`🎯 Processing batch ${batchIndex + 1}/${batches.length} (${batch.length} items)`);

        // Batch içindeki her item'i paralel işle ama hataları yalıt
        const batchPromises = batch.map(async (bg, itemIndex) => {
          try {
            if (preloadAborted.current) return null;

            // Her item için timeout ekle
            const timeoutPromise = new Promise<null>((_, reject) => {
              setTimeout(() => reject(new Error('Preload timeout')), 10000); // 10 saniye timeout
            });

            const preloadPromise = backgroundThumbnailManager.getThumbnail(bg.id, bg.fullUrl);

            const result = await Promise.race([preloadPromise, timeoutPromise]);
            
            if (result && !preloadAborted.current) {
              console.log(`✅ Preloaded (${batchIndex + 1}.${itemIndex + 1}):`, bg.id);
              return bg.id;
            } else {
              console.warn(`⚠️ Failed to preload (${batchIndex + 1}.${itemIndex + 1}):`, bg.id);
              return null;
            }
          } catch (error) {
            console.warn(`❌ Preload error for ${bg.id}:`, error instanceof Error ? error.message : error);
            return null;
          }
        });

        // Bu batch'i bekle, hataları yok say
        const batchResults = await Promise.allSettled(batchPromises);
        const successCount = batchResults.filter(r => r.status === 'fulfilled' && r.value !== null).length;
        
        totalProcessed += batch.length;
        console.log(`📊 Batch ${batchIndex + 1} completed: ${successCount}/${batch.length} successful`);

        // Batch'ler arası kısa bekleme (sistem yükünü azaltmak için)
        if (batchIndex < batches.length - 1 && !preloadAborted.current) {
          await new Promise(resolve => setTimeout(resolve, 1000)); // 1 saniye ara
        }
      }

      if (!preloadAborted.current) {
        console.log('🎉 Background preloading completed:', totalProcessed, 'processed');
        setPreloadStatus('completed');
      }

    } catch (error) {
      if (!preloadAborted.current) {
        console.error('❌ Background preloading failed:', error);
        setPreloadStatus('error');
      }
    }
  }, [backgrounds, enabled, maxConcurrent]);

  // Cache durumunu kontrol et
  const getCacheStatus = useCallback(() => {
    try {
      const stats = backgroundThumbnailManager.getCacheStats();
      const cachedBgCount = Math.min(stats.itemCount, backgrounds?.length || 0);

      return {
        totalBackgrounds: backgrounds?.length || 0,
        cachedCount: cachedBgCount,
        cacheSize: stats.totalSize,
        isFullyCached: cachedBgCount >= (backgrounds?.length || 0),
        cacheStats: stats,
        preloadStatus
      };
    } catch (error) {
      console.warn('Cache status error:', error);
      return {
        totalBackgrounds: backgrounds?.length || 0,
        cachedCount: 0,
        cacheSize: 0,
        isFullyCached: false,
        cacheStats: { itemCount: 0, totalSize: 0 },
        preloadStatus: 'error' as const
      };
    }
  }, [backgrounds, preloadStatus]);

  // Memory optimization - GÜVENLİ VERSİYON
  const optimizeCache = useCallback(async () => {
    try {
      await backgroundThumbnailManager.optimizeMemory();
      console.log('🧹 Background cache optimized');
    } catch (error) {
      console.warn('⚠️ Cache optimization failed:', error);
    }
  }, []);

  // Clear cache - GÜVENLİ VERSİYON
  const clearCache = useCallback(async () => {
    try {
      preloadAborted.current = true; // Devam eden preload'ı durdur
      await backgroundThumbnailManager.clearCache();
      preloadStarted.current = false;
      preloadAborted.current = false;
      setPreloadStatus('idle');
      console.log('🗑️ Background cache cleared');
    } catch (error) {
      console.warn('⚠️ Cache clear failed:', error);
    }
  }, []);

  // Effect: Preloading başlat - GÜVENLİ VERSİYON
  useEffect(() => {
    if (enabled && backgrounds && backgrounds.length > 0 && !preloadStarted.current) {
      const timer = setTimeout(() => {
        if (!preloadAborted.current) {
          startPreloading().catch(error => {
            console.warn('Preload timer error:', error);
            setPreloadStatus('error');
          });
        }
      }, delayMs);

      return () => {
        clearTimeout(timer);
      };
    }
  }, [enabled, backgrounds, delayMs, startPreloading]);

  return {
    // Status
    isPreloadStarted: preloadStarted.current,
    preloadStatus,
    getCacheStatus,
    
    // Actions
    startPreloading: useCallback(async () => {
      if (!preloadStarted.current && !preloadAborted.current) {
        await startPreloading();
      }
    }, [startPreloading]),
    optimizeCache,
    clearCache,
    
    // Utils
    preloadSpecificBackgrounds: useCallback(async (bgList: Background[]) => {
      if (!bgList || bgList.length === 0) return;
      
      try {
        console.log('🎯 Preloading specific backgrounds:', bgList.length);
        await backgroundThumbnailManager.preloadThumbnails(
          bgList.map(bg => ({ id: bg.id, fullUrl: bg.fullUrl }))
        );
      } catch (error) {
        console.warn('Specific preload failed:', error);
      }
    }, []),
    
    // Reset function
    resetPreloader: useCallback(() => {
      preloadStarted.current = false;
      preloadAborted.current = false;
      setPreloadStatus('idle');
    }, [])
  };
};