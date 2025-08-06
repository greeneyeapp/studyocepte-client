// services/backgroundThumbnailManager.ts - SADECE SERVICE KODU
import * as FileSystem from 'expo-file-system';
import { ImageManipulator } from 'expo-image-manipulator';
import { imageProcessor } from './imageProcessor';

interface BackgroundThumbnail {
  id: string;
  thumbnailUri: string;
  createdAt: number;
  size: number; // bytes
}

interface BackgroundCache {
  [backgroundId: string]: BackgroundThumbnail;
}

/**
 * Background görselleri için thumbnail cache ve optimization manager
 * Memory kullanımını azaltmak ve performance artırmak için kullanılır
 */
class BackgroundThumbnailManager {
  private cache: BackgroundCache = {};
  private cacheDirectory: string;
  private maxCacheSize: number = 50 * 1024 * 1024; // 50MB
  private maxThumbnailAge: number = 7 * 24 * 60 * 60 * 1000; // 7 gün
  private thumbnailSize: { width: number; height: number } = { width: 300, height: 300 };

  constructor() {
    this.cacheDirectory = FileSystem.cacheDirectory + 'bg_thumbnails/';
    this.initializeCache();
  }

  /**
   * Cache directory'sini oluştur ve mevcut thumbnail'leri yükle
   */
  private async initializeCache(): Promise<void> {
    try {
      const dirInfo = await FileSystem.getInfoAsync(this.cacheDirectory);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.cacheDirectory, { intermediates: true });
        console.log('📁 Background thumbnail directory created');
      }

      await this.loadCacheIndex();
      await this.cleanupOldThumbnails();
    } catch (error) {
      console.error('❌ Failed to initialize background thumbnail cache:', error);
    }
  }

  /**
   * Cache index'ini diskten yükle
   */
  private async loadCacheIndex(): Promise<void> {
    try {
      const indexPath = this.cacheDirectory + 'cache_index.json';
      const indexInfo = await FileSystem.getInfoAsync(indexPath);
      
      if (indexInfo.exists) {
        const indexContent = await FileSystem.readAsStringAsync(indexPath);
        this.cache = JSON.parse(indexContent);
        console.log('📋 Background thumbnail cache loaded:', Object.keys(this.cache).length, 'items');
      }
    } catch (error) {
      console.warn('⚠️ Failed to load thumbnail cache index:', error);
      this.cache = {};
    }
  }

  /**
   * Cache index'ini diske kaydet
   */
  private async saveCacheIndex(): Promise<void> {
    try {
      const indexPath = this.cacheDirectory + 'cache_index.json';
      await FileSystem.writeAsStringAsync(indexPath, JSON.stringify(this.cache));
    } catch (error) {
      console.error('❌ Failed to save thumbnail cache index:', error);
    }
  }

  /**
   * Eski thumbnail'leri temizle
   */
  private async cleanupOldThumbnails(): Promise<void> {
    const now = Date.now();
    const toDelete: string[] = [];
    let totalSize = 0;

    // Yaş kontrolü ve boyut hesaplama
    for (const [backgroundId, thumbnail] of Object.entries(this.cache)) {
      const age = now - thumbnail.createdAt;
      
      if (age > this.maxThumbnailAge) {
        toDelete.push(backgroundId);
      } else {
        totalSize += thumbnail.size;
      }
    }

    // Yaşlı thumbnail'leri sil
    for (const backgroundId of toDelete) {
      await this.deleteThumbnail(backgroundId);
    }

    // Boyut sınırını aşıyorsa en eski thumbnail'leri sil
    if (totalSize > this.maxCacheSize) {
      const sortedThumbnails = Object.entries(this.cache)
        .sort(([, a], [, b]) => a.createdAt - b.createdAt);
      
      while (totalSize > this.maxCacheSize && sortedThumbnails.length > 0) {
        const [backgroundId, thumbnail] = sortedThumbnails.shift()!;
        await this.deleteThumbnail(backgroundId);
        totalSize -= thumbnail.size;
      }
    }

    await this.saveCacheIndex();
    console.log('🧹 Background thumbnail cleanup completed');
  }

  /**
   * Belirli bir background için thumbnail oluştur veya cache'den getir
   */
  async getThumbnail(backgroundId: string, fullImageUri: string): Promise<string | null> {
    try {
      // Cache'de var mı kontrol et
      const cached = this.cache[backgroundId];
      if (cached) {
        // Dosyanın hala var olup olmadığını kontrol et
        const fileInfo = await FileSystem.getInfoAsync(cached.thumbnailUri);
        if (fileInfo.exists) {
          console.log('💾 Background thumbnail served from cache:', backgroundId);
          return cached.thumbnailUri;
        } else {
          // Cache'de var ama dosya yok, cache'den sil
          delete this.cache[backgroundId];
        }
      }

      // Yeni thumbnail oluştur
      console.log('🖼️ Creating background thumbnail:', backgroundId);
      const thumbnailUri = await this.createThumbnail(backgroundId, fullImageUri);
      
      if (thumbnailUri) {
        // Cache'e ekle
        const fileInfo = await FileSystem.getInfoAsync(thumbnailUri);
        this.cache[backgroundId] = {
          id: backgroundId,
          thumbnailUri,
          createdAt: Date.now(),
          size: fileInfo.size || 0
        };
        
        await this.saveCacheIndex();
        console.log('✅ Background thumbnail created and cached:', backgroundId);
      }

      return thumbnailUri;
    } catch (error) {
      console.error('❌ Failed to get background thumbnail:', error);
      return null;
    }
  }

  /**
   * Background thumbnail oluştur
   */
  private async createThumbnail(backgroundId: string, fullImageUri: string): Promise<string | null> {
    try {
      const thumbnailFilename = `bg_thumb_${backgroundId}.jpg`;
      const thumbnailPath = this.cacheDirectory + thumbnailFilename;

      // ImageManipulator ile thumbnail oluştur
      const result = await ImageManipulator.manipulateAsync(
        fullImageUri,
        [
          { 
            resize: { 
              width: this.thumbnailSize.width, 
              height: this.thumbnailSize.height 
            } 
          }
        ],
        {
          compress: 0.8,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );

      // Cache directory'sine kopyala
      await FileSystem.copyAsync({
        from: result.uri,
        to: thumbnailPath
      });

      return thumbnailPath;
    } catch (error) {
      console.error('❌ Failed to create background thumbnail:', error);
      return null;
    }
  }

  /**
   * Belirli bir thumbnail'i sil
   */
  private async deleteThumbnail(backgroundId: string): Promise<void> {
    try {
      const thumbnail = this.cache[backgroundId];
      if (thumbnail) {
        await FileSystem.deleteAsync(thumbnail.thumbnailUri, { idempotent: true });
        delete this.cache[backgroundId];
        console.log('🗑️ Background thumbnail deleted:', backgroundId);
      }
    } catch (error) {
      console.warn('⚠️ Failed to delete background thumbnail:', error);
    }
  }

  /**
   * Tüm cache'i temizle
   */
  async clearCache(): Promise<void> {
    try {
      const files = await FileSystem.readDirectoryAsync(this.cacheDirectory);
      
      for (const file of files) {
        await FileSystem.deleteAsync(this.cacheDirectory + file, { idempotent: true });
      }
      
      this.cache = {};
      console.log('🧹 Background thumbnail cache cleared');
    } catch (error) {
      console.error('❌ Failed to clear background thumbnail cache:', error);
    }
  }

  /**
   * Cache istatistiklerini getir
   */
  getCacheStats(): {
    itemCount: number;
    totalSize: number;
    oldestItem?: number;
    newestItem?: number;
  } {
    const thumbnails = Object.values(this.cache);
    const totalSize = thumbnails.reduce((sum, thumb) => sum + thumb.size, 0);
    const timestamps = thumbnails.map(thumb => thumb.createdAt);

    return {
      itemCount: thumbnails.length,
      totalSize,
      oldestItem: timestamps.length > 0 ? Math.min(...timestamps) : undefined,
      newestItem: timestamps.length > 0 ? Math.max(...timestamps) : undefined,
    };
  }

  /**
   * Belirli background'lar için pre-cache yap
   */
  async preloadThumbnails(backgrounds: { id: string; fullUrl: string }[]): Promise<void> {
    console.log('🚀 Preloading background thumbnails:', backgrounds.length, 'items');
    
    const promises = backgrounds.map(async (bg) => {
      try {
        await this.getThumbnail(bg.id, bg.fullUrl);
      } catch (error) {
        console.warn('⚠️ Failed to preload thumbnail for:', bg.id, error);
      }
    });

    await Promise.allSettled(promises);
    console.log('✅ Background thumbnail preloading completed');
  }

  /**
   * Memory optimization - eski cache'leri temizle
   */
  async optimizeMemory(): Promise<void> {
    await this.cleanupOldThumbnails();
    
    // JavaScript garbage collection'ı tetikle (sadece debug için)
    if (__DEV__ && global.gc) {
      global.gc();
      console.log('🗑️ Background thumbnail memory optimization completed');
    }
  }
}

// Singleton instance
export const backgroundThumbnailManager = new BackgroundThumbnailManager();