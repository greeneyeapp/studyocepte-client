// services/backgroundThumbnailManager.ts - 600x600 PNG SÜPER YÜKSEK KALİTE

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

// YENİ: Hex renk kodu kontrolü için yardımcı fonksiyon
const isHexColor = (str: string): boolean => {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3}|[A-Fa-f0-9]{8})$/.test(str);
};

/**
 * ⭐ SÜPER YÜKSEK KALİTE: 600x600 PNG Background thumbnail cache ve optimization manager
 * Memory kullanımını azaltmak ve SÜPER YÜKSEK KALİTE performance artırmak için kullanılır
 */
class BackgroundThumbnailManager {
  private cache: BackgroundCache = {};
  private cacheDirectory: string;
  private maxCacheSize: number = 100 * 1024 * 1024; // ⭐ 50MB'den 100MB'e artırıldı
  private maxThumbnailAge: number = 7 * 24 * 60 * 60 * 1000; // 7 gün
  // ⭐ SÜPER YÜKSEK KALİTE: 400x400'den 600x600'e artırıldı
  private thumbnailSize: { width: number; height: number } = { width: 600, height: 600 };
  private isInitialized: boolean = false;
  private initPromise: Promise<void> | null = null;

  constructor() {
    this.cacheDirectory = FileSystem.cacheDirectory + 'bg_thumbnails_super_hq/'; // ⭐ Yeni klasör adı
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
        console.log('📁 SUPER HIGH QUALITY background thumbnail directory created (600x600 PNG)');
      }

      await this.loadCacheIndex();
      await this.cleanupOldThumbnails();

      this.isInitialized = true;
      console.log('✅ SUPER HIGH QUALITY background thumbnail cache initialized (600x600 PNG)');
    } catch (error) {
      console.error('❌ Failed to initialize SUPER HIGH QUALITY background thumbnail cache:', error);
      this.isInitialized = false;
      throw error;
    }
  }

  /**
   * Cache index'ini diskten yükle
   */
  private async loadCacheIndex(): Promise<void> {
    try {
      const indexPath = this.cacheDirectory + 'cache_index_super_hq.json';
      const indexInfo = await FileSystem.getInfoAsync(indexPath);

      if (indexInfo.exists) {
        const indexContent = await FileSystem.readAsStringAsync(indexPath);
        this.cache = JSON.parse(indexContent);
        console.log('📋 SUPER HIGH QUALITY background thumbnail cache loaded:', Object.keys(this.cache).length, 'items (600x600 PNG)');
      }
    } catch (error) {
      console.warn('⚠️ Failed to load SUPER HIGH QUALITY thumbnail cache index, starting fresh:', error);
      this.cache = {};
    }
  }

  /**
   * Cache index'ini diske kaydet
   */
  private async saveCacheIndex(): Promise<void> {
    try {
      const indexPath = this.cacheDirectory + 'cache_index_super_hq.json';
      await FileSystem.writeAsStringAsync(indexPath, JSON.stringify(this.cache));
    } catch (error) {
      console.error('❌ Failed to save SUPER HIGH QUALITY thumbnail cache index:', error);
    }
  }

  /**
   * Eski thumbnail'leri temizle
   */
  private async cleanupOldThumbnails(): Promise<void> {
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
    console.log('🧹 SUPER HIGH QUALITY background thumbnail cleanup completed (600x600 PNG)');
  }

  async getThumbnail(backgroundId: string, fullImageModule: any): Promise<string | null> {
    try {
      await this.initializeCache();

      // YENİ: Eğer fullImageModule bir hex renk kodu ise, onu doğrudan döndür.
      if (typeof fullImageModule === 'string' && isHexColor(fullImageModule)) {
        console.log('🎨 Hex color detected, returning directly:', fullImageModule);
        return fullImageModule;
      }

      // Cache'de var mı kontrol et
      const cached = this.cache[backgroundId];
      if (cached) {
        const fileInfo = await FileSystem.getInfoAsync(cached.thumbnailUri);
        if (fileInfo.exists) {
          console.log('💾 SUPER HIGH QUALITY background thumbnail served from cache (600x600 PNG):', backgroundId);
          return cached.thumbnailUri;
        } else {
          delete this.cache[backgroundId];
          await this.saveCacheIndex();
        }
      }

      // ⭐ SÜPER YÜKSEK KALİTE: fullImageModule'u bir URI dizesine çözümle
      let fullImageUriString: string;
      if (typeof fullImageModule === 'number') {
        try {
          const asset = Asset.fromModule(fullImageModule);

          const assetPromise = asset.downloadAsync();
          const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('Asset download timeout')), 5000); // ⭐ Timeout artırıldı 5 saniye
          });

          await Promise.race([assetPromise, timeoutPromise]);

          fullImageUriString = asset.localUri || asset.uri;
          if (!fullImageUriString) {
            throw new Error(`Failed to resolve asset URI for module: ${fullImageModule}`);
          }
        } catch (assetError) {
          console.warn('⚠️ Asset loading failed, using fallback:', backgroundId, assetError);
          // Fallback URI, asset'in yüklenememesi durumunda kullanılabilir.
          // Bu, genellikle sadece Android'de `require` edilmiş yerel varlıklar için geçerlidir.
          fullImageUriString = `android.resource://com.greeneyeapp.studyocepte/${fullImageModule}`;
        }
      } else {
        fullImageUriString = fullImageModule;
      }

      // ⭐ SÜPER YÜKSEK KALİTE: Thumbnail oluşturma için daha uzun timeout
      console.log('🖼️ Creating SUPER HIGH QUALITY background thumbnail (600x600 PNG):', backgroundId);

      const thumbnailPromise = this.createSuperHighQualityThumbnail(backgroundId, fullImageUriString);
      const timeoutPromise = new Promise<string | null>((_, reject) => {
        setTimeout(() => reject(new Error('SUPER HIGH QUALITY thumbnail creation timeout')), 10000); // ⭐ 10 saniye timeout
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
        console.log('✅ SUPER HIGH QUALITY background thumbnail created and cached (600x600 PNG):', backgroundId);
      }

      return thumbnailUri;
    } catch (error) {
      console.warn('⚠️ SUPER HIGH QUALITY background thumbnail failed, returning null:', backgroundId, error);
      return null;
    }
  }

  /**
   * ⭐ SÜPER YÜKSEK KALİTE: 600x600 PNG Background thumbnail oluştur
   */
  private async createSuperHighQualityThumbnail(backgroundId: string, fullImageUri: string): Promise<string | null> {
    // YENİ: Eğer fullImageUri bir hex renk kodu ise, thumbnail oluşturmaya çalışma
    if (isHexColor(fullImageUri)) {
      console.log('🎨 Skipping thumbnail creation for hex color:', fullImageUri);
      return fullImageUri; // Zaten bir renk kodu olduğu için doğrudan döndür
    }

    try {
      const thumbnailFilename = `bg_thumb_super_hq_${backgroundId}_${Date.now()}.png`; // ⭐ PNG format
      const thumbnailPath = this.cacheDirectory + thumbnailFilename;

      console.log('🔧 Creating SUPER HIGH QUALITY thumbnail with manipulateAsync (600x600 PNG):', {
        input: fullImageUri,
        output: thumbnailPath,
        size: this.thumbnailSize,
        quality: 'SUPER HIGH (PNG 1.0)'
      });

      // ⭐ SÜPER YÜKSEK KALİTE: manipulateAsync için optimize edilmiş settings
      const manipulatePromise = manipulateAsync(
        fullImageUri,
        [
          {
            resize: {
              width: this.thumbnailSize.width,    // 600px
              height: this.thumbnailSize.height   // 600px
            }
          }
        ],
        {
          compress: 1.0,   // ⭐ MAKSIMUM KALİTE (0.95'den 1.0'a)
          format: SaveFormat.PNG, // ⭐ En iyi kalite için PNG
        }
      );

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('SUPER HIGH QUALITY image manipulation timeout')), 12000); // ⭐ 12 saniye timeout
      });

      const result = await Promise.race([manipulatePromise, timeoutPromise]);

      console.log('✅ SUPER HIGH QUALITY manipulateAsync completed (600x600 PNG):', result.uri);

      // Cache directory'sine kopyala
      await FileSystem.copyAsync({
        from: result.uri,
        to: thumbnailPath
      });

      console.log('✅ SUPER HIGH QUALITY thumbnail copied to cache (600x600 PNG):', thumbnailPath);

      // Geçici dosyayı sil
      try {
        await FileSystem.deleteAsync(result.uri, { idempotent: true });
      } catch (cleanupError) {
        console.warn('⚠️ Failed to cleanup temp SUPER HIGH QUALITY thumbnail:', cleanupError);
      }

      return thumbnailPath;
    } catch (error) {
      console.error('❌ Failed to create SUPER HIGH QUALITY background thumbnail for', backgroundId, ':', error);
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
        // YENİ: Eğer thumbnailUri bir renk kodu ise silmeye çalışma
        if (isHexColor(thumbnail.thumbnailUri)) {
          console.log('🎨 Skipping deletion for hex color thumbnail:', backgroundId);
          delete this.cache[backgroundId];
          return;
        }
        await FileSystem.deleteAsync(thumbnail.thumbnailUri, { idempotent: true });
        delete this.cache[backgroundId];
        console.log('🗑️ SUPER HIGH QUALITY background thumbnail deleted:', backgroundId);
      }
    } catch (error) {
      console.warn('⚠️ Failed to delete SUPER HIGH QUALITY background thumbnail:', error);
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
      console.log('🧹 SUPER HIGH QUALITY background thumbnail cache cleared (600x600 PNG)');
    } catch (error) {
      console.error('❌ Failed to clear SUPER HIGH QUALITY background thumbnail cache:', error);
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
      averageQuality: '600x600 PNG (SUPER HIGH Quality)' // ⭐ Güncellenmiş kalite bilgisi
    };
  }

  /**
   * ⭐ SÜPER YÜKSEK KALİTE: Belirli background'lar için pre-cache yap
   */
  async preloadThumbnails(backgrounds: { id: string; fullUrl: any }[]): Promise<void> {
    if (!backgrounds || backgrounds.length === 0) return;

    console.log('🚀 Preloading SUPER HIGH QUALITY background thumbnails (600x600 PNG):', backgrounds.length, 'items');

    const results = await Promise.allSettled(
      backgrounds.map(async (bg) => {
        // YENİ: Eğer background bir renk kodu ise, pre-cache'i atla
        if (typeof bg.fullUrl === 'string' && isHexColor(bg.fullUrl)) {
          console.log('🎨 Skipping preload for hex color background:', bg.id);
          return null;
        }

        try {
          const result = await this.getThumbnail(bg.id, bg.fullUrl);
          if (result) {
            console.log('✅ SUPER HIGH QUALITY preloaded (600x600 PNG):', bg.id);
          } else {
            console.warn('⚠️ Failed to preload SUPER HIGH QUALITY:', bg.id);
          }
          return result;
        } catch (error) {
          console.warn('❌ SUPER HIGH QUALITY preload error for', bg.id, ':', error);
          return null;
        }
      })
    );

    const successful = results.filter(r => r.status === 'fulfilled' && r.value !== null).length;
    console.log('✅ SUPER HIGH QUALITY background thumbnail preloading completed (600x600 PNG):', successful, '/', backgrounds.length);
  }

  /**
   * Memory optimization
   */
  async optimizeMemory(): Promise<void> {
    try {
      await this.cleanupOldThumbnails();

      if (__DEV__ && global.gc) {
        global.gc();
        console.log('🗑️ SUPER HIGH QUALITY background thumbnail memory optimization completed (600x600 PNG)');
      }
    } catch (error) {
      console.warn('⚠️ SUPER HIGH QUALITY memory optimization failed:', error);
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
        // YENİ: Eğer thumbnailUri bir renk kodu ise dosya varlığını kontrol etmeye çalışma
        if (isHexColor(thumbnail.thumbnailUri)) {
          continue;
        }

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
        console.log('🔧 SUPER HIGH QUALITY cache validation completed (600x600 PNG), removed', idsToRemove.length, 'invalid entries');
      }
    } catch (error) {
      console.warn('⚠️ SUPER HIGH QUALITY cache validation failed:', error);
    }
  }
}

// Singleton instance
export const backgroundThumbnailManager = new BackgroundThumbnailManager();