// services/imageCache.ts - Görsel Cache ve Lazy Loading Sistemi
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'react-native';

interface CacheEntry {
  uri: string;
  timestamp: number;
  localPath?: string;
}

interface ImageMetadata {
  width: number;
  height: number;
  size: number;
}

class ImageCacheService {
  private cache = new Map<string, CacheEntry>();
  private loadingPromises = new Map<string, Promise<string>>();
  private readonly CACHE_TTL = 24 * 60 * 60 * 1000; // 24 saat
  private readonly MAX_CACHE_SIZE = 100; // Maximum cache entries

  constructor() {
    this.loadCacheFromStorage();
  }

  // Cache'i AsyncStorage'dan yükle
  private async loadCacheFromStorage() {
    try {
      const cacheData = await AsyncStorage.getItem('imageCache');
      if (cacheData) {
        const parsed = JSON.parse(cacheData);
        this.cache = new Map(parsed);
        this.cleanExpiredEntries();
      }
    } catch (error) {
      console.warn('Cache yüklenirken hata:', error);
    }
  }

  // Cache'i AsyncStorage'a kaydet
  private async saveCacheToStorage() {
    try {
      const cacheArray = Array.from(this.cache.entries());
      await AsyncStorage.setItem('imageCache', JSON.stringify(cacheArray));
    } catch (error) {
      console.warn('Cache kaydedilirken hata:', error);
    }
  }

  // Süresi dolmuş cache girişlerini temizle
  private cleanExpiredEntries() {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.CACHE_TTL) {
        this.cache.delete(key);
      }
    }
    
    // Cache boyutunu kontrol et
    if (this.cache.size > this.MAX_CACHE_SIZE) {
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      // En eski girişleri sil
      const entriesToDelete = entries.slice(0, entries.length - this.MAX_CACHE_SIZE);
      entriesToDelete.forEach(([key]) => this.cache.delete(key));
    }
    
    this.saveCacheToStorage();
  }

  // Görseli cache'den al veya API'den yükle
  async getImage(originalUri: string, priority: 'low' | 'normal' | 'high' = 'normal'): Promise<string> {
    if (!originalUri) return '';

    // Cache'de var mı kontrol et
    const cacheEntry = this.cache.get(originalUri);
    if (cacheEntry && Date.now() - cacheEntry.timestamp < this.CACHE_TTL) {
      return cacheEntry.uri;
    }

    // Eğer zaten yükleniyorsa bekle
    if (this.loadingPromises.has(originalUri)) {
      return this.loadingPromises.get(originalUri)!;
    }

    // Yeni yükleme başlat
    const loadingPromise = this.loadImageWithRetry(originalUri, priority);
    this.loadingPromises.set(originalUri, loadingPromise);

    try {
      const uri = await loadingPromise;
      
      // Cache'e ekle
      this.cache.set(originalUri, {
        uri,
        timestamp: Date.now()
      });
      
      this.cleanExpiredEntries();
      return uri;
    } finally {
      this.loadingPromises.delete(originalUri);
    }
  }

  // Retry mekanizması ile görsel yükleme
  private async loadImageWithRetry(uri: string, priority: 'low' | 'normal' | 'high', maxRetries = 3): Promise<string> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Öncelik durumuna göre gecikme ekle
        if (priority === 'low' && attempt === 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        // Görsel boyutunu kontrol et
        const metadata = await this.getImageMetadata(uri);
        
        // Büyük görseller için uyarı
        if (metadata.size > 5 * 1024 * 1024) { // 5MB
          console.warn(`Büyük görsel yükleniyor: ${metadata.size / (1024 * 1024)}MB`);
        }

        return uri; // Başarılı yüklenme
      } catch (error) {
        console.warn(`Görsel yükleme denemesi ${attempt}/${maxRetries} başarısız:`, error);
        
        if (attempt === maxRetries) {
          throw error;
        }
        
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
    
    throw new Error('Görsel yüklenemedi');
  }

  // Görsel metadata'sını al
  private getImageMetadata(uri: string): Promise<ImageMetadata> {
    return new Promise((resolve, reject) => {
      Image.getSize(
        uri,
        (width, height) => {
          // Yaklaşık dosya boyutunu hesapla (width * height * 3 bytes for RGB)
          const estimatedSize = width * height * 3;
          resolve({ width, height, size: estimatedSize });
        },
        reject
      );
    });
  }

  // Cache'i temizle
  async clearCache() {
    this.cache.clear();
    this.loadingPromises.clear();
    await AsyncStorage.removeItem('imageCache');
  }

  // Cache istatistikleri
  getCacheStats() {
    return {
      entryCount: this.cache.size,
      loadingCount: this.loadingPromises.size,
      maxSize: this.MAX_CACHE_SIZE,
      ttl: this.CACHE_TTL
    };
  }

  // Prefetch - önceden yükleme
  async prefetchImages(uris: string[], priority: 'low' | 'normal' | 'high' = 'low') {
    const prefetchPromises = uris.map(uri => 
      this.getImage(uri, priority).catch(error => {
        console.warn(`Prefetch başarısız: ${uri}`, error);
        return '';
      })
    );
    
    await Promise.allSettled(prefetchPromises);
  }
}

export const imageCache = new ImageCacheService();