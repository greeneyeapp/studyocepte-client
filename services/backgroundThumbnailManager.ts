// services/backgroundThumbnailManager.ts - YÜKSEK KALİTE BACKGROUND THUMBNAIL'LAR
import * as FileSystem from 'expo-file-system';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { imageProcessor } from './imageProcessor';
import { Asset } from 'expo-asset';

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
 * ✅ YÜKSEK KALİTE: Background görselleri için yüksek kaliteli thumbnail cache ve optimization manager
 * Memory kullanımını azaltmak ve YÜKSEK KALİTE performance artırmak için kullanılır
 */
class BackgroundThumbnailManager {
  private cache: BackgroundCache = {};
  private cacheDirectory: string;
  private maxCacheSize: number = 50 * 1024 * 1024; // ✅ 25MB'den 50MB'e çıkarıldı
  private maxThumbnailAge: number = 7 * 24 * 60 * 60 * 1000; // 7 gün
  // ✅ YÜKSEK KALİTE: Thumbnail boyutu büyütüldü
  private thumbnailSize: { width: number; height: number } = { width: 400, height: 400 }; // 200x200'den 400x400'e
  private isInitialized: boolean = false;
  private initPromise: Promise<void> | null = null;

  constructor() {
    this.cacheDirectory = FileSystem.cacheDirectory + 'bg_thumbnails_hq/'; // ✅ Yeni klasör adı
  }

  /**
   * Cache directory'sini oluştur ve mevcut thumbnail'leri yükle
   */
  private async initializeCache(): Promise<void> {
    if (this.isInitialized) return;

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this._doInitialize();
    return this.initPromise;
  }

  private async _doInitialize(): Promise<void> {
    try {
      const dirInfo = await FileSystem.getInfoAsync(this.cacheDirectory);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.cacheDirectory, { intermediates: true });
        console.log('📁 High quality background thumbnail directory created');
      }

      await this.loadCacheIndex();
      await this.cleanupOldThumbnails();

      this.isInitialized = true;
      console.log('✅ High quality background thumbnail cache initialized');
    } catch (error) {
      console.error('❌ Failed to initialize high quality background thumbnail cache:', error);
      this.isInitialized = false;
      throw error;
    }
  }

  /**
   * Cache index'ini diskten yükle
   */
  private async loadCacheIndex(): Promise<void> {
    try {
      const indexPath = this.cacheDirectory + 'cache_index_hq.json';
      const indexInfo = await FileSystem.getInfoAsync(indexPath);

      if (indexInfo.exists) {
        const indexContent = await FileSystem.readAsStringAsync(indexPath);
        this.cache = JSON.parse(indexContent);
        console.log('📋 High quality background thumbnail cache loaded:', Object.keys(this.cache).length, 'items');
      }
    } catch (error) {
      console.warn('⚠️ Failed to load high quality thumbnail cache index, starting fresh:', error);
      this.cache = {};
    }
  }

  /**
   * Cache index'ini diske kaydet
   */
  private async saveCacheIndex(): Promise<void> {
    try {
      const indexPath = this.cacheDirectory + 'cache_index_hq.json';
      await FileSystem.writeAsStringAsync(indexPath, JSON.stringify(this.cache));
    } catch (error) {
      console.error('❌ Failed to save high quality thumbnail cache index:', error);
    }
  }

  /**
   * Eski thumbnail'leri temizle
   */
  private async cleanupOldThumbnails(): Promise<void> { // Buradaki sözdizimi hatası düzeltildi
    const now = Date.now();
    const toDelete: string[] = [];
    let totalSize = 0;

    for (const [backgroundId, thumbnail] of Object.entries(this.cache)) {
      const age = now - thumbnail.createdAt;

      if (age > this.maxThumbnailAge) {
        toDelete.push(backgroundId);
      } else {
        totalSize += thumbnail.size;
      }
    }

    for (const backgroundId of toDelete) {
      await this.deleteThumbnail(backgroundId);
    }

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
    console.log('🧹 High quality background thumbnail cleanup completed');
  }

  async getThumbnail(backgroundId: string, fullImageModule: any): Promise<string | null> {
    try {
      await this.initializeCache();

      // Cache'de var mı kontrol et
      const cached = this.cache[backgroundId];
      if (cached) {
        const fileInfo = await FileSystem.getInfoAsync(cached.thumbnailUri);
        if (fileInfo.exists) {
          console.log('💾 High quality background thumbnail served from cache:', backgroundId);
          return cached.thumbnailUri;
        } else {
          delete this.cache[backgroundId];
          await this.saveCacheIndex();
        }
      }

      // ✅ YÜKSEK KALİTE: fullImageModule'u bir URI dizesine çözümle
      let fullImageUriString: string;
      if (typeof fullImageModule === 'number') {
        try {
          const asset = Asset.fromModule(fullImageModule);

          const assetPromise = asset.downloadAsync();
          const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('Asset download timeout')), 3000); // ✅ Timeout artırıldı
          });

          await Promise.race([assetPromise, timeoutPromise]);

          fullImageUriString = asset.localUri || asset.uri;
          if (!fullImageUriString) {
            throw new Error(`Failed to resolve asset URI for module: ${fullImageModule}`);
          }
        } catch (assetError) {
          console.warn('⚠️ Asset loading failed, using fallback:', backgroundId, assetError);
          fullImageUriString = `android.resource://com.greeneyeapp.studyocepte/${fullImageModule}`;
        }
      } else {
        fullImageUriString = fullImageModule;
      }

      // ✅ YÜKSEK KALİTE: Thumbnail oluşturma için daha uzun timeout
      console.log('🖼️ Creating high quality background thumbnail:', backgroundId);

      const thumbnailPromise = this.createHighQualityThumbnail(backgroundId, fullImageUriString);
      const timeoutPromise = new Promise<string | null>((_, reject) => {
        setTimeout(() => reject(new Error('High quality thumbnail creation timeout')), 5000); // ✅ 5 saniye timeout
      });

      const thumbnailUri = await Promise.race([thumbnailPromise, timeoutPromise]);

      if (thumbnailUri) {
        const fileInfo = await FileSystem.getInfoAsync(thumbnailUri);
        this.cache[backgroundId] = {
          id: backgroundId,
          thumbnailUri,
          createdAt: Date.now(),
          size: fileInfo.size || 0
        };

        await this.saveCacheIndex();
        console.log('✅ High quality background thumbnail created and cached:', backgroundId);
      }

      return thumbnailUri;
    } catch (error) {
      console.warn('⚠️ High quality background thumbnail failed, returning null:', backgroundId, error);
      return null;
    }
  }

  /**
   * ✅ YÜKSEK KALİTE: Background thumbnail oluştur
   */
  private async createHighQualityThumbnail(backgroundId: string, fullImageUri: string): Promise<string | null> {
    try {
      const thumbnailFilename = `bg_thumb_hq_${backgroundId}_${Date.now()}.png`; // ✅ PNG format
      const thumbnailPath = this.cacheDirectory + thumbnailFilename;

      console.log('🔧 Creating high quality thumbnail with manipulateAsync:', {
        input: fullImageUri,
        output: thumbnailPath,
        size: this.thumbnailSize,
        quality: 'High (PNG 0.95)'
      });

      // ✅ YÜKSEK KALİTE: manipulateAsync için optimize edilmiş settings
      const manipulatePromise = manipulateAsync(
        fullImageUri,
        [
          {
            resize: {
              width: this.thumbnailSize.width,    // 400px
              height: this.thumbnailSize.height   // 400px
            }
          }
        ],
        {
          compress: 0.95,   // ✅ Yüksek kalite (0.7'den 0.95'e)
          format: SaveFormat.PNG, // ✅ En iyi kalite için PNG
        }
      );

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('High quality image manipulation timeout')), 8000); // ✅ 8 saniye timeout
      });

      const result = await Promise.race([manipulatePromise, timeoutPromise]);

      console.log('✅ High quality manipulateAsync completed:', result.uri);

      // Cache directory'sine kopyala
      await FileSystem.copyAsync({
        from: result.uri,
        to: thumbnailPath
      });

      console.log('✅ High quality thumbnail copied to cache:', thumbnailPath);

      // Geçici dosyayı sil
      try {
        await FileSystem.deleteAsync(result.uri, { idempotent: true });
      } catch (cleanupError) {
        console.warn('⚠️ Failed to cleanup temp high quality thumbnail:', cleanupError);
      }

      return thumbnailPath;
    } catch (error) {
      console.error('❌ Failed to create high quality background thumbnail for', backgroundId, ':', error);
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
        console.log('🗑️ High quality background thumbnail deleted:', backgroundId);
      }
    } catch (error) {
      console.warn('⚠️ Failed to delete high quality background thumbnail:', error);
      delete this.cache[backgroundId];
    }
  }

  /**
   * Tüm cache'i temizle
   */
  async clearCache(): Promise<void> {
    try {
      await this.initializeCache();

      const files = await FileSystem.readDirectoryAsync(this.cacheDirectory);

      const deletePromises = files.map(file =>
        FileSystem.deleteAsync(this.cacheDirectory + file, { idempotent: true })
          .catch(error => console.warn('⚠️ Failed to delete cache file:', file, error))
      );

      await Promise.allSettled(deletePromises);

      this.cache = {};
      await this.saveCacheIndex();
      console.log('🧹 High quality background thumbnail cache cleared');
    } catch (error) {
      console.error('❌ Failed to clear high quality background thumbnail cache:', error);
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
    averageQuality: string;
  } {
    const thumbnails = Object.values(this.cache);
    const totalSize = thumbnails.reduce((sum, thumb) => sum + thumb.size, 0);
    const timestamps = thumbnails.map(thumb => thumb.createdAt);

    return {
      itemCount: thumbnails.length,
      totalSize,
      oldestItem: timestamps.length > 0 ? Math.min(...timestamps) : undefined,
      newestItem: timestamps.length > 0 ? Math.max(...timestamps) : undefined,
      averageQuality: '400x400 PNG (High Quality)' // ✅ Kalite bilgisi
    };
  }

  /**
   * ✅ YÜKSEK KALİTE: Belirli background'lar için pre-cache yap
   */
  async preloadThumbnails(backgrounds: { id: string; fullUrl: any }[]): Promise<void> {
    if (!backgrounds || backgrounds.length === 0) return;

    console.log('🚀 Preloading high quality background thumbnails:', backgrounds.length, 'items');

    const results = await Promise.allSettled(
      backgrounds.map(async (bg) => {
        try {
          const result = await this.getThumbnail(bg.id, bg.fullUrl);
          if (result) {
            console.log('✅ High quality preloaded:', bg.id, '(400x400 PNG)');
          } else {
            console.warn('⚠️ Failed to preload high quality:', bg.id);
          }
          return result;
        } catch (error) {
          console.warn('❌ High quality preload error for', bg.id, ':', error);
          return null;
        }
      })
    );

    const successful = results.filter(r => r.status === 'fulfilled' && r.value !== null).length;
    console.log('✅ High quality background thumbnail preloading completed:', successful, '/', backgrounds.length);
  }

  /**
   * Memory optimization
   */
  async optimizeMemory(): Promise<void> {
    try {
      await this.cleanupOldThumbnails();

      if (__DEV__ && global.gc) {
        global.gc();
        console.log('🗑️ High quality background thumbnail memory optimization completed');
      }
    } catch (error) {
      console.warn('⚠️ High quality memory optimization failed:', error);
    }
  }

  /**
   * Cache durumunu kontrol et ve gerekirse onar
   */
  async validateCache(): Promise<void> {
    try {
      await this.initializeCache();

      const idsToRemove: string[] = [];

      for (const [backgroundId, thumbnail] of Object.entries(this.cache)) {
        try {
          const fileInfo = await FileSystem.getInfoAsync(thumbnail.thumbnailUri);
          if (!fileInfo.exists) {
            idsToRemove.push(backgroundId);
          }
        } catch (error) {
          idsToRemove.push(backgroundId);
        }
      }

      for (const id of idsToRemove) {
        delete this.cache[id];
      }

      if (idsToRemove.length > 0) {
        await this.saveCacheIndex();
        console.log('🔧 High quality cache validation completed, removed', idsToRemove.length, 'invalid entries');
      }
    } catch (error) {
      console.warn('⚠️ High quality cache validation failed:', error);
    }
  }
}

// Singleton instance
export const backgroundThumbnailManager = new BackgroundThumbnailManager();
