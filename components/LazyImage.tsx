// components/LazyImage.tsx - Gelişmiş Lazy Loading Image Component
import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { Image, View, ActivityIndicator, StyleSheet, ImageStyle, Animated, Pressable } from 'react-native';
import { Colors } from '@/constants';

// YENİ: Global image cache
class ImageCache {
  private cache = new Map<string, string>();
  private loading = new Map<string, Promise<string>>();
  private priorities = new Map<string, number>();
  private maxCacheSize = 100; // Maksimum cache boyutu

  async getImage(uri: string, priority: 'low' | 'normal' | 'high' = 'normal'): Promise<string> {
    // Cache'de varsa hemen döndür
    if (this.cache.has(uri)) {
      this.updatePriority(uri, priority);
      return this.cache.get(uri)!;
    }

    // Zaten yükleniyorsa promise'i döndür
    if (this.loading.has(uri)) {
      return this.loading.get(uri)!;
    }

    // Yeni yükleme başlat
    const loadPromise = this.loadImage(uri, priority);
    this.loading.set(uri, loadPromise);

    try {
      const result = await loadPromise;
      this.cache.set(uri, result);
      this.updatePriority(uri, priority);
      this.cleanupCache();
      return result;
    } finally {
      this.loading.delete(uri);
    }
  }

  private async loadImage(uri: string, priority: 'low' | 'normal' | 'high'): Promise<string> {
    return new Promise((resolve, reject) => {
      const priorityValue = { low: 1, normal: 2, high: 3 }[priority];

      // Priority'ye göre delay ekle (low priority için daha yavaş yükle)
      const delay = priority === 'low' ? 100 : priority === 'normal' ? 50 : 0;

      setTimeout(() => {
        Image.prefetch(uri)
          .then(() => resolve(uri))
          .catch(reject);
      }, delay);
    });
  }

  private updatePriority(uri: string, priority: 'low' | 'normal' | 'high') {
    const priorityValue = { low: 1, normal: 2, high: 3 }[priority];
    this.priorities.set(uri, priorityValue);
  }

  private cleanupCache() {
    if (this.cache.size <= this.maxCacheSize) return;

    // Priority ve kullanım sırasına göre cache temizle
    const entries = Array.from(this.cache.entries());
    const priorities = Array.from(this.priorities.entries());

    // En düşük priority'li ve en eski olanları sil
    entries
      .sort((a, b) => {
        const aPriority = this.priorities.get(a[0]) || 0;
        const bPriority = this.priorities.get(b[0]) || 0;
        return aPriority - bPriority;
      })
      .slice(0, this.cache.size - this.maxCacheSize + 10) // 10 extra temizle
      .forEach(([uri]) => {
        this.cache.delete(uri);
        this.priorities.delete(uri);
      });
  }

  preloadImages(uris: string[], priority: 'low' | 'normal' | 'high' = 'low') {
    uris.forEach(uri => {
      if (!this.cache.has(uri) && !this.loading.has(uri)) {
        this.getImage(uri, priority);
      }
    });
  }

  clearCache() {
    this.cache.clear();
    this.priorities.clear();
    this.loading.clear();
  }

  getCacheSize() {
    return this.cache.size;
  }

  getCacheInfo() {
    return {
      cached: this.cache.size,
      loading: this.loading.size,
      maxSize: this.maxCacheSize
    };
  }
}

const imageCache = new ImageCache();

interface LazyImageProps {
  uri: string;
  style?: ImageStyle;
  placeholder?: React.ReactNode;
  priority?: 'low' | 'normal' | 'high';
  onLoad?: () => void;
  onError?: (error: any) => void;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'repeat' | 'center';
  // YENİ: Progressive loading
  progressive?: boolean;
  // YENİ: Intersection observer support
  lazyLoad?: boolean;
  // YENİ: Fade animation
  fadeIn?: boolean;
  // YENİ: Error retry
  retryCount?: number;
  // YENİ: Preload sibling images
  siblingUris?: string[];
}

const LazyImage: React.FC<LazyImageProps> = memo(({
  uri,
  style,
  placeholder,
  priority = 'normal',
  onLoad,
  onError,
  resizeMode = 'cover',
  progressive = true,
  lazyLoad = true,
  fadeIn = true,
  retryCount = 2,
  siblingUris = []
}) => {
  const [imageUri, setImageUri] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isVisible, setIsVisible] = useState(!lazyLoad);
  const [currentRetry, setCurrentRetry] = useState(0);
  const [cacheKey, setCacheKey] = useState(0);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const componentRef = useRef<View>(null);
  const mountedRef = useRef(true);

  // YENİ: Intersection observer benzeri visibility detection
  const checkVisibility = useCallback(() => {
    if (!lazyLoad || isVisible) return;

    componentRef.current?.measure((x, y, width, height, pageX, pageY) => {
      // Basit visibility check (ekranda görünüyor mu?)
      if (pageY < 1000 && pageY + height > -100) { // 1000px tolerance
        setIsVisible(true);
      }
    });
  }, [lazyLoad, isVisible]);

  useEffect(() => {
    if (uri && mountedRef.current) {
      // URI değişti, cache'i refresh et
      setCacheKey(prev => prev + 1);
      setHasError(false);
      setCurrentRetry(0);

      console.log('🔄 LazyImage URI changed, invalidating cache:', {
        uri: uri.substring(0, 50) + '...',
        cacheKey: cacheKey + 1
      });
    }
  }, [uri]);

  const getCacheBustedUri = useCallback((originalUri: string): string => {
    if (!originalUri) return originalUri;

    // Eğer URI'de zaten cache buster varsa kullan
    if (originalUri.includes('?cb=') || originalUri.includes('&cb=')) {
      return originalUri;
    }

    // Cache buster ekle
    const separator = originalUri.includes('?') ? '&' : '?';
    return `${originalUri}${separator}cb=${cacheKey}`;
  }, [cacheKey]);

  // Visibility check effect
  useEffect(() => {
    if (lazyLoad && !isVisible) {
      const timer = setInterval(checkVisibility, 500);
      return () => clearInterval(timer);
    }
  }, [lazyLoad, isVisible, checkVisibility]);

  useEffect(() => {
    if (!uri || !isVisible) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    const cacheBustedUri = getCacheBustedUri(uri);

    const loadImage = async () => {
      try {
        setIsLoading(true);
        setHasError(false);

        // Sibling images'ları preload et
        if (siblingUris.length > 0) {
          imageCache.preloadImages(siblingUris, 'low');
        }

        // YENİ: Cache-busted URI ile yükle
        const cachedUri = await imageCache.getImage(cacheBustedUri, priority);

        if (isMounted && mountedRef.current) {
          setImageUri(cachedUri);
          setIsLoading(false);
          onLoad?.();

          // Fade in animation
          if (fadeIn) {
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }).start();
          } else {
            fadeAnim.setValue(1);
          }

          console.log('✅ LazyImage loaded with cache busting:', {
            original: uri.substring(0, 30) + '...',
            cacheBusted: cacheBustedUri.substring(0, 30) + '...',
            cacheKey
          });
        }
      } catch (error) {
        if (isMounted && mountedRef.current) {
          console.warn(`❌ LazyImage load failed for ${uri}:`, error);

          // Retry logic
          if (currentRetry < retryCount) {
            setTimeout(() => {
              setCurrentRetry(prev => prev + 1);
            }, 1000 * (currentRetry + 1));
          } else {
            setHasError(true);
            setIsLoading(false);
            onError?.(error);
          }
        }
      }
    };

    loadImage();

    return () => {
      isMounted = false;
    };
  }, [uri, isVisible, priority, onLoad, onError, fadeIn, currentRetry, retryCount, siblingUris, getCacheBustedUri, cacheKey]);

  // Component unmount cleanup
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Retry handler
  const handleRetry = useCallback(() => {
    setCurrentRetry(0);
    setHasError(false);
    setCacheKey(prev => prev + 1);
  }, []);

  if (hasError) {
    return (
      <View style={[styles.container, style]} ref={componentRef}>
        <View style={styles.errorContainer}>
          {placeholder || (
            <Pressable onPress={handleRetry} style={styles.retryContainer}>
              <View style={styles.errorPlaceholder}>
                <ActivityIndicator size="small" color={Colors.error} />
              </View>
            </Pressable>
          )}
        </View>
      </View>
    );
  }

  if (isLoading || !imageUri || !isVisible) {
    return (
      <View style={[styles.container, style]} ref={componentRef}>
        <View style={styles.loadingContainer}>
          {placeholder || <ActivityIndicator color={Colors.primary} />}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]} ref={componentRef}>
      <Animated.Image
        source={{ uri: imageUri }}
        style={[
          style,
          fadeIn && { opacity: fadeAnim }
        ]}
        resizeMode={resizeMode}
        onLoad={onLoad}
        onError={onError}
        key={`image-${cacheKey}`}
      />
    </View>
  );
});

// YENİ: LazyImage utilities
export const LazyImageUtils = {
  preloadImages: (uris: string[], priority: 'low' | 'normal' | 'high' = 'low') => {
    imageCache.preloadImages(uris, priority);
  },

  clearCache: () => {
    imageCache.clearCache();
  },

  getCacheInfo: () => {
    return imageCache.getCacheInfo();
  },

  optimizeMemory: () => {
    const info = imageCache.getCacheInfo();
    if (info.cached > 50) {
      console.log('🧹 Optimizing LazyImage memory usage...');
      imageCache.clearCache();
    }
  },

  // YENİ: Force refresh all images
  forceRefreshAll: () => {
    console.log('🔄 Force refreshing all LazyImages...');
    imageCache.clearCache();

    // Global cache invalidation event
    if (typeof global !== 'undefined') {
      global.LAZY_IMAGE_CACHE_VERSION = (global.LAZY_IMAGE_CACHE_VERSION || 0) + 1;
    }
  }
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.gray100,
    overflow: 'hidden',
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.gray100,
  },

  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.gray50,
  },

  errorPlaceholder: {
    width: '80%',
    height: '80%',
    backgroundColor: Colors.gray200,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.error + '30',
    borderStyle: 'dashed',
  },

  retryContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

LazyImage.displayName = 'LazyImage';

export { LazyImage, imageCache };