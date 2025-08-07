// services/backgroundThumbnailManager.ts - DÜZELTİLMİŞ VERSİYON
import * as FileSystem from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator'; // DÜZELTME: Doğru import
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
  private maxCacheSize: number = 25 * 1024 * 1024; // 25MB (Azaltıldı)
  private maxThumbnailAge: number = 3 * 24 * 60 * 60 * 1000; // 3 gün (Azaltıldı)
  private thumbnailSize: { width: number; height: number } = { width: 200, height: 200 }; // Küçültüldü
  private isInitialized: boolean = false;
  private initPromise: Promise<void> | null = null;

  constructor() {
    this.cacheDirectory = FileSystem.cacheDirectory + 'bg_thumbnails/';
  }

  /**
   * Cache directory'sini oluştur ve mevcut thumbnail'leri yükle
   */
  private async initializeCache(): Promise<void> {
    if (this.isInitialized) return;
    
    // Eğer zaten initialize ediliyorsa, bekle
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
        console.log('📁 Background thumbnail directory created');
      }

      await this.loadCacheIndex();
      await this.cleanupOldThumbnails();
      
      this.isInitialized = true;
      console.log('✅ Background thumbnail cache initialized');
    } catch (error) {
      console.error('❌ Failed to initialize background thumbnail cache:', error);
      this.isInitialized = false;
      throw error;
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
      console.warn('⚠️ Failed to load thumbnail cache index, starting fresh:', error);
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
      // İlk initialize et
      await this.initializeCache();
      
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
          await this.saveCacheIndex();
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
      console.error('❌ Failed to get background thumbnail for', backgroundId, ':', error);
      return null; // Hata durumunda null döndür, döngüye girmesin
    }
  }

  /**
   * Background thumbnail oluştur - DÜZELTİLMİŞ VERSİYON
   */
  private async createThumbnail(backgroundId: string, fullImageUri: string): Promise<string | null> {
    try {
      const thumbnailFilename = `bg_thumb_${backgroundId}_${Date.now()}.jpg`;
      const thumbnailPath = this.cacheDirectory + thumbnailFilename;

      // ImageManipulator ile thumbnail oluştur - DÜZELTME: Doğru API kullanımı
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
          compress: 0.7, // Compression artırıldı
          format: SaveFormat.JPEG, // DÜZELTME: Doğru import kullanımı
        }
      );

      // Cache directory'sine kopyala
      await FileSystem.copyAsync({
        from: result.uri,
        to: thumbnailPath
      });

      // Geçici dosyayı sil
      try {
        await FileSystem.deleteAsync(result.uri, { idempotent: true });
      } catch (cleanupError) {
        console.warn('⚠️ Failed to cleanup temp thumbnail:', cleanupError);
      }

      return thumbnailPath;
    } catch (error) {
      console.error('❌ Failed to create background thumbnail for', backgroundId, ':', error);
      
      // Specific hata mesajlarını logla
      if (error instanceof Error) {
        console.error('Error details:', {
          message: error.message,
          stack: error.stack?.substring(0, 200)
        });
      }
      
      return null; // Hata durumunda null döndür
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
      // Cache'den kaldır ama dosya silme hatasını yok say
      delete this.cache[backgroundId];
    }
  }

  /**
   * Tüm cache'i temizle
   */
  async clearCache(): Promise<void> {
    try {
      await this.initializeCache();
      
      // Tüm dosyaları sil
      const files = await FileSystem.readDirectoryAsync(this.cacheDirectory);
      
      const deletePromises = files.map(file => 
        FileSystem.deleteAsync(this.cacheDirectory + file, { idempotent: true })
          .catch(error => console.warn('⚠️ Failed to delete cache file:', file, error))
      );
      
      await Promise.allSettled(deletePromises);
      
      this.cache = {};
      await this.saveCacheIndex();
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
   * Belirli background'lar için pre-cache yap - GÜVENLİ VERSİYON
   */
  async preloadThumbnails(backgrounds: { id: string; fullUrl: string }[]): Promise<void> {
    if (!backgrounds || backgrounds.length === 0) return;
    
    console.log('🚀 Preloading background thumbnails:', backgrounds.length, 'items');
    
    // Her background için ayrı ayrı, hata durumunda diğerlerini etkilemesin
    const results = await Promise.allSettled(
      backgrounds.map(async (bg) => {
        try {
          const result = await this.getThumbnail(bg.id, bg.fullUrl);
          if (result) {
            console.log('✅ Preloaded:', bg.id);
          } else {
            console.warn('⚠️ Failed to preload:', bg.id);
          }
          return result;
        } catch (error) {
          console.warn('❌ Preload error for', bg.id, ':', error);
          return null;
        }
      })
    );
    
    const successful = results.filter(r => r.status === 'fulfilled' && r.value !== null).length;
    console.log('✅ Background thumbnail preloading completed:', successful, '/', backgrounds.length);
  }

  /**
   * Memory optimization - eski cache'leri temizle
   */
  async optimizeMemory(): Promise<void> {
    try {
      await this.cleanupOldThumbnails();
      
      // JavaScript garbage collection'ı tetikle (sadece debug için)
      if (__DEV__ && global.gc) {
        global.gc();
        console.log('🗑️ Background thumbnail memory optimization completed');
      }
    } catch (error) {
      console.warn('⚠️ Memory optimization failed:', error);
    }
  }

  /**
   * Cache durumunu kontrol et ve gerekirse onar
   */
  async validateCache(): Promise<void> {
    try {
      await this.initializeCache();
      
      const idsToRemove: string[] = [];
      
      // Her cache entry'sini kontrol et
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
      
      // Bozuk entry'leri temizle
      for (const id of idsToRemove) {
        delete this.cache[id];
      }
      
      if (idsToRemove.length > 0) {
        await this.saveCacheIndex();
        console.log('🔧 Cache validation completed, removed', idsToRemove.length, 'invalid entries');
      }
    } catch (error) {
      console.warn('⚠️ Cache validation failed:', error);
    }
  }
}

// Singleton instance
export const backgroundThumbnailManager = new BackgroundThumbnailManager();