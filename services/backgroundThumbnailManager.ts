// services/backgroundThumbnailManager.ts - 300x300 JPEG SÜPER YÜKSEK KALİTE (ÇEVİRİ ANAHTARLARI KULLANILDI)

import * as FileSystem from 'expo-file-system';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { Asset } from 'expo-asset';
import i18n from '@/i18n'; // i18n import edildi
import { memoryManager } from './memoryManager'; // memoryManager import edildi

interface BackgroundThumbnail {
  id: string;
  thumbnailUri: string;
  createdAt: number;
  size: number;
}

interface BackgroundCache {
  [backgroundId: string]: BackgroundThumbnail;
}

const isHexColor = (str: string): boolean => {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3}|[A-Fa-f0-9]{8})$/.test(str);
};

class BackgroundThumbnailManager {
  private cache: BackgroundCache = {};
  private cacheDirectory: string;
  private maxCacheSize: number = 50 * 1024 * 1024; // 50MB cache boyutu
  private maxThumbnailAge: number = 7 * 24 * 60 * 60 * 1000; // 7 gün
  // Thumbnail boyutu optimize edildi: 600x600 PNG -> 300x300 JPEG (Daha küçük ve verimli)
  private thumbnailSize: { width: number; height: number } = { width: 300, height: 300 };
  private thumbnailFormat: SaveFormat = SaveFormat.JPEG;
  private thumbnailCompressQuality: number = 0.8; // JPEG kalitesi

  private isInitialized: boolean = false;
  private initPromise: Promise<void> | null = null;

  constructor() {
    this.cacheDirectory = FileSystem.cacheDirectory + 'bg_thumbnails_optimized/';
  }

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
        console.log(i18n.t('bgThumbnailManager.directoryCreatedLog'));
      }

      await this.loadCacheIndex();
      await this.cleanupOldThumbnails();

      this.isInitialized = true;
      console.log(i18n.t('bgThumbnailManager.cacheInitializedLog'));
    } catch (error: any) {
      console.error(i18n.t('bgThumbnailManager.failedToInitializeCacheLog'), error.message);
      this.isInitialized = false;
      throw error;
    } finally {
      this.initPromise = null; // Promise tamamlandığında sıfırla
    }
  }

  private async loadCacheIndex(): Promise<void> {
    try {
      const indexPath = this.cacheDirectory + 'cache_index_optimized.json'; // Index dosyası adı güncellendi
      const indexInfo = await FileSystem.getInfoAsync(indexPath);

      if (indexInfo.exists) {
        const indexContent = await FileSystem.readAsStringAsync(indexPath);
        this.cache = JSON.parse(indexContent);
        console.log(i18n.t('bgThumbnailManager.cacheLoadedLog', { count: Object.keys(this.cache).length }));
      }
    } catch (error: any) {
      console.warn(i18n.t('bgThumbnailManager.failedToLoadCacheIndexLog'), error.message);
      this.cache = {}; // Hata durumunda cache'i sıfırla
    }
  }

  private async saveCacheIndex(): Promise<void> {
    try {
      const indexPath = this.cacheDirectory + 'cache_index_optimized.json';
      await FileSystem.writeAsStringAsync(indexPath, JSON.stringify(this.cache));
    } catch (error: any) {
      console.error(i18n.t('bgThumbnailManager.failedToSaveCacheIndexLog'), error.message);
    }
  }

  private async cleanupOldThumbnails(): Promise<void> {
    const now = Date.now();
    const toDelete: string[] = [];
    let totalSize = 0;

    // Önce eskimiş ve boyutu aşanları işaretle
    for (const [backgroundId, thumbnail] of Object.entries(this.cache)) {
      const age = now - thumbnail.createdAt;

      if (age > this.maxThumbnailAge) {
        toDelete.push(backgroundId);
      } else {
        totalSize += thumbnail.size;
      }
    }

    // İşaretlenenleri sil
    for (const backgroundId of toDelete) {
      await this.deleteThumbnail(backgroundId);
    }

    // Boyut sınırı aşılmışsa en eski olanları silmeye devam et
    if (totalSize > this.maxCacheSize) {
      const sortedThumbnails = Object.entries(this.cache)
        .sort(([, a], [, b]) => a.createdAt - b.createdAt); // En eskiden en yeniye sırala

      while (totalSize > this.maxCacheSize && sortedThumbnails.length > 0) {
        const [backgroundId, thumbnail] = sortedThumbnails.shift()!;
        await this.deleteThumbnail(backgroundId);
        totalSize -= thumbnail.size;
      }
    }

    await this.saveCacheIndex();
    console.log(i18n.t('bgThumbnailManager.cleanupCompletedLog'));
  }

  async getThumbnail(backgroundId: string, fullImageModule: any): Promise<string | null> {
    try {
      await this.initializeCache();

      // Eğer modül bir hex renk kodu ise, doğrudan döndür
      if (typeof fullImageModule === 'string' && isHexColor(fullImageModule)) {
        console.log(i18n.t('bgThumbnailManager.hexColorDetectedLog'), fullImageModule);
        return fullImageModule;
      }

      // Cache'te var mı kontrol et
      const cached = this.cache[backgroundId];
      if (cached) {
        const fileInfo = await FileSystem.getInfoAsync(cached.thumbnailUri);
        if (fileInfo.exists) {
          console.log(i18n.t('bgThumbnailManager.servedFromCacheLog'), backgroundId);
          return cached.thumbnailUri;
        } else {
          // Cache'te kayıtlı ama dosya yoksa, cache'ten sil
          delete this.cache[backgroundId];
          await this.saveCacheIndex();
        }
      }

      // Dosya URI'sini çözümle
      let fullImageUriString: string;
      if (typeof fullImageModule === 'number') {
        // Asset'i yükle (timeout ile)
        try {
          const asset = Asset.fromModule(fullImageModule);
          const assetPromise = asset.downloadAsync();
          const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error(i18n.t('bgThumbnailManager.assetDownloadTimeout'))), 5000);
          });
          await Promise.race([assetPromise, timeoutPromise]);
          fullImageUriString = asset.localUri || asset.uri;
          if (!fullImageUriString) {
            throw new Error(i18n.t('bgThumbnailManager.failedToResolveAssetUri', { module: fullImageModule }));
          }
        } catch (assetError: any) {
          console.warn(i18n.t('bgThumbnailManager.assetLoadingFailedLog'), backgroundId, assetError.message);
          // Android resource fallback (eğer Expo asset'i çözemezse)
          fullImageUriString = `android.resource://com.greeneyeapp.studyocepte/${fullImageModule}`;
        }
      } else {
        fullImageUriString = fullImageModule;
      }

      console.log(i18n.t('bgThumbnailManager.creatingThumbnailLog'), backgroundId);

      // Thumbnail oluştur (timeout ile)
      const thumbnailPromise = this.createOptimizedThumbnail(backgroundId, fullImageUriString);
      const timeoutPromiseForThumbnail = new Promise<string | null>((_, reject) => {
        setTimeout(() => reject(new Error(i18n.t('bgThumbnailManager.thumbnailCreationTimeout'))), 15000); // Daha uzun timeout
      });
      const thumbnailUri = await Promise.race([thumbnailPromise, timeoutPromiseForThumbnail]);

      if (thumbnailUri) {
        // Oluşturulan thumbnail'ı cache'e ekle
        const fileInfo = await FileSystem.getInfoAsync(thumbnailUri);
        this.cache[backgroundId] = {
          id: backgroundId,
          thumbnailUri,
          createdAt: Date.now(),
          size: fileInfo.size || 0
        };
        await this.saveCacheIndex();
        console.log(i18n.t('bgThumbnailManager.thumbnailCreatedAndCachedLog'), backgroundId);
      }

      return thumbnailUri;
    } catch (error: any) {
      console.warn(i18n.t('bgThumbnailManager.thumbnailFailedReturningNullLog'), backgroundId, error.message);
      return null;
    }
  }

  // Thumbnail oluşturma metodunu optimize edildi
  private async createOptimizedThumbnail(backgroundId: string, fullImageUri: string): Promise<string | null> {
    if (isHexColor(fullImageUri)) {
      return fullImageUri; // Renk kodları için thumbnail oluşturma
    }

    try {
      const thumbnailFilename = `bg_thumb_opt_${backgroundId}_${Date.now()}.${this.thumbnailFormat.toLowerCase()}`;
      const thumbnailPath = this.cacheDirectory + thumbnailFilename;

      console.log(i18n.t('bgThumbnailManager.creatingThumbnailWithManipulateLog'), {
        input: fullImageUri,
        output: thumbnailPath,
        size: this.thumbnailSize,
        quality: this.thumbnailCompressQuality
      });

      const result = await manipulateAsync(
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
          compress: this.thumbnailCompressQuality,
          format: this.thumbnailFormat,
        }
      );

      console.log(i18n.t('bgThumbnailManager.manipulateAsyncCompletedLog'), result.uri);

      // Manipule edilen geçici dosyayı kalıcı cache konumuna kopyala
      await FileSystem.copyAsync({
        from: result.uri,
        to: thumbnailPath
      });

      console.log(i18n.t('bgThumbnailManager.thumbnailCopiedToCacheLog'), thumbnailPath);

      // Geçici dosyayı sil
      try {
        await FileSystem.deleteAsync(result.uri, { idempotent: true });
      } catch (cleanupError) {
        console.warn(i18n.t('common.cleanupWarning'), cleanupError);
      }

      return thumbnailPath;
    } catch (error: any) {
      console.error(i18n.t('bgThumbnailManager.failedToCreateThumbnailLog', { id: backgroundId }), error.message);
      return null;
    }
  }

  private async deleteThumbnail(backgroundId: string): Promise<void> {
    try {
      const thumbnail = this.cache[backgroundId];
      if (thumbnail) {
        if (isHexColor(thumbnail.thumbnailUri)) {
          console.log(i18n.t('bgThumbnailManager.skippingDeletionForHexColorLog'), backgroundId);
          delete this.cache[backgroundId]; // Cache'ten kaldır
          return;
        }
        await FileSystem.deleteAsync(thumbnail.thumbnailUri, { idempotent: true });
        delete this.cache[backgroundId];
        console.log(i18n.t('bgThumbnailManager.thumbnailDeletedLog'), backgroundId);
      }
    } catch (error: any) {
      console.warn(i18n.t('bgThumbnailManager.failedToDeleteThumbnailLog'), error.message);
      delete this.cache[backgroundId]; // Hata olsa bile cache'ten kaldır
    }
  }

  async clearCache(): Promise<void> {
    try {
      await this.initializeCache();

      const files = await FileSystem.readDirectoryAsync(this.cacheDirectory);

      const deletePromises = files.map(file =>
        FileSystem.deleteAsync(this.cacheDirectory + file, { idempotent: true })
          .catch(error => console.warn(i18n.t('bgThumbnailManager.failedToDeleteCacheFileLog'), file, error.message))
      );

      await Promise.allSettled(deletePromises);

      this.cache = {}; // Cache'i tamamen sıfırla
      await this.saveCacheIndex();
      console.log(i18n.t('bgThumbnailManager.cacheClearedLog'));
    } catch (error: any) {
      console.error(i18n.t('bgThumbnailManager.failedToClearCacheLog'), error.message);
    }
  }

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
      averageQuality: i18n.t('bgThumbnailManager.averageQuality')
    };
  }

  async preloadThumbnails(backgrounds: { id: string; fullUrl: any }[]): Promise<void> {
    if (!backgrounds || backgrounds.length === 0) return;

    console.log(i18n.t('bgThumbnailManager.preloadingThumbnailsLog', { count: backgrounds.length }));

    const results = await Promise.allSettled(
      backgrounds.map(async (bg) => {
        if (typeof bg.fullUrl === 'string' && isHexColor(bg.fullUrl)) {
          console.log(i18n.t('bgThumbnailManager.skippingPreloadForHexColorLog'), bg.id);
          return null;
        }

        try {
          // getThumbnail içinde zaten init ve cache kontrolü var
          const result = await this.getThumbnail(bg.id, bg.fullUrl);
          if (result) {
            console.log(i18n.t('bgThumbnailManager.preloadedLog'), bg.id);
          } else {
            console.warn(i18n.t('bgThumbnailManager.failedToPreloadLog'), bg.id);
          }
          return result;
        } catch (error: any) {
          console.warn(i18n.t('bgThumbnailManager.preloadErrorLog', { id: bg.id }), error.message);
          return null;
        }
      })
    );

    const successful = results.filter(r => r.status === 'fulfilled' && r.value !== null).length;
    console.log(i18n.t('bgThumbnailManager.preloadingCompletedLog', { successful, total: backgrounds.length }));
  }

  // Bellek optimizasyonunu memoryManager üzerinden çağır
  async optimizeMemory(): Promise<void> {
    await memoryManager.cleanup(); // memoryManager'ın tam temizliğini çağır
  }

  async validateCache(): Promise<void> {
    try {
      await this.initializeCache();

      const idsToRemove: string[] = [];

      for (const [backgroundId, thumbnail] of Object.entries(this.cache)) {
        // Hex renk kodları dosya değildir, atla
        if (isHexColor(thumbnail.thumbnailUri)) {
          continue;
        }

        try {
          const fileInfo = await FileSystem.getInfoAsync(thumbnail.thumbnailUri);
          if (!fileInfo.exists) {
            idsToRemove.push(backgroundId);
          }
        } catch (error) {
          // getInfoAsync hata verirse dosya yok sayılır
          idsToRemove.push(backgroundId);
        }
      }

      for (const id of idsToRemove) {
        delete this.cache[id];
      }

      if (idsToRemove.length > 0) {
        await this.saveCacheIndex();
        console.log(i18n.t('bgThumbnailManager.cacheValidationCompletedLog', { count: idsToRemove.length }));
      }
    } catch (error: any) {
      console.warn(i18n.t('bgThumbnailManager.cacheValidationFailedLog'), error.message);
    }
  }
}

export const backgroundThumbnailManager = new BackgroundThumbnailManager();