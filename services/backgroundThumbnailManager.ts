// services/backgroundThumbnailManager.ts - 600x600 PNG SÜPER YÜKSEK KALİTE (ÇEVİRİ ANAHTARLARI KULLANILDI)

import * as FileSystem from 'expo-file-system';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { imageProcessor } from './imageProcessor';
import { Asset } from 'expo-asset';
import i18n from '@/i18n'; // i18n import edildi

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
  private maxCacheSize: number = 100 * 1024 * 1024;
  private maxThumbnailAge: number = 7 * 24 * 60 * 60 * 1000;
  private thumbnailSize: { width: number; height: number } = { width: 600, height: 600 };
  private isInitialized: boolean = false;
  private initPromise: Promise<void> | null = null;

  constructor() {
    this.cacheDirectory = FileSystem.cacheDirectory + 'bg_thumbnails_super_hq/';
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
        console.log(i18n.t('bgThumbnailManager.directoryCreatedLog')); // Çeviri anahtarı kullanıldı
      }

      await this.loadCacheIndex();
      await this.cleanupOldThumbnails();

      this.isInitialized = true;
      console.log(i18n.t('bgThumbnailManager.cacheInitializedLog')); // Çeviri anahtarı kullanıldı
    } catch (error: any) {
      console.error(i18n.t('bgThumbnailManager.failedToInitializeCacheLog'), error.message); // Çeviri anahtarı kullanıldı
      this.isInitialized = false;
      throw error;
    }
  }

  private async loadCacheIndex(): Promise<void> {
    try {
      const indexPath = this.cacheDirectory + 'cache_index_super_hq.json';
      const indexInfo = await FileSystem.getInfoAsync(indexPath);

      if (indexInfo.exists) {
        const indexContent = await FileSystem.readAsStringAsync(indexPath);
        this.cache = JSON.parse(indexContent);
        console.log(i18n.t('bgThumbnailManager.cacheLoadedLog', { count: Object.keys(this.cache).length })); // Çeviri anahtarı kullanıldı
      }
    } catch (error: any) {
      console.warn(i18n.t('bgThumbnailManager.failedToLoadCacheIndexLog'), error.message); // Çeviri anahtarı kullanıldı
      this.cache = {};
    }
  }

  private async saveCacheIndex(): Promise<void> {
    try {
      const indexPath = this.cacheDirectory + 'cache_index_super_hq.json';
      await FileSystem.writeAsStringAsync(indexPath, JSON.stringify(this.cache));
    } catch (error: any) {
      console.error(i18n.t('bgThumbnailManager.failedToSaveCacheIndexLog'), error.message); // Çeviri anahtarı kullanıldı
    }
  }

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
    console.log(i18n.t('bgThumbnailManager.cleanupCompletedLog')); // Çeviri anahtarı kullanıldı
  }

  async getThumbnail(backgroundId: string, fullImageModule: any): Promise<string | null> {
    try {
      await this.initializeCache();

      if (typeof fullImageModule === 'string' && isHexColor(fullImageModule)) {
        console.log(i18n.t('bgThumbnailManager.hexColorDetectedLog'), fullImageModule); // Çeviri anahtarı kullanıldı
        return fullImageModule;
      }

      const cached = this.cache[backgroundId];
      if (cached) {
        const fileInfo = await FileSystem.getInfoAsync(cached.thumbnailUri);
        if (fileInfo.exists) {
          console.log(i18n.t('bgThumbnailManager.servedFromCacheLog'), backgroundId); // Çeviri anahtarı kullanıldı
          return cached.thumbnailUri;
        } else {
          delete this.cache[backgroundId];
          await this.saveCacheIndex();
        }
      }

      let fullImageUriString: string;
      if (typeof fullImageModule === 'number') {
        try {
          const asset = Asset.fromModule(fullImageModule);

          const assetPromise = asset.downloadAsync();
          const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error(i18n.t('bgThumbnailManager.assetDownloadTimeout'))), 5000); // Çeviri anahtarı kullanıldı
          });

          await Promise.race([assetPromise, timeoutPromise]);

          fullImageUriString = asset.localUri || asset.uri;
          if (!fullImageUriString) {
            throw new Error(i18n.t('bgThumbnailManager.failedToResolveAssetUri', { module: fullImageModule })); // Çeviri anahtarı kullanıldı
          }
        } catch (assetError: any) {
          console.warn(i18n.t('bgThumbnailManager.assetLoadingFailedLog'), backgroundId, assetError.message); // Çeviri anahtarı kullanıldı
          fullImageUriString = `android.resource://com.greeneyeapp.studyocepte/${fullImageModule}`;
        }
      } else {
        fullImageUriString = fullImageModule;
      }

      console.log(i18n.t('bgThumbnailManager.creatingThumbnailLog'), backgroundId); // Çeviri anahtarı kullanıldı

      const thumbnailPromise = this.createSuperHighQualityThumbnail(backgroundId, fullImageUriString);
      const timeoutPromise = new Promise<string | null>((_, reject) => {
        setTimeout(() => reject(new Error(i18n.t('bgThumbnailManager.thumbnailCreationTimeout'))), 10000); // Çeviri anahtarı kullanıldı
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
        console.log(i18n.t('bgThumbnailManager.thumbnailCreatedAndCachedLog'), backgroundId); // Çeviri anahtarı kullanıldı
      }

      return thumbnailUri;
    } catch (error: any) {
      console.warn(i18n.t('bgThumbnailManager.thumbnailFailedReturningNullLog'), backgroundId, error.message); // Çeviri anahtarı kullanıldı
      return null;
    }
  }

  private async createSuperHighQualityThumbnail(backgroundId: string, fullImageUri: string): Promise<string | null> {
    if (isHexColor(fullImageUri)) {
      console.log(i18n.t('bgThumbnailManager.skippingThumbnailForHexColorLog'), fullImageUri); // Çeviri anahtarı kullanıldı
      return fullImageUri;
    }

    try {
      const thumbnailFilename = `bg_thumb_super_hq_${backgroundId}_${Date.now()}.png`;
      const thumbnailPath = this.cacheDirectory + thumbnailFilename;

      console.log(i18n.t('bgThumbnailManager.creatingThumbnailWithManipulateLog'), { // Çeviri anahtarı kullanıldı
        input: fullImageUri,
        output: thumbnailPath,
        size: this.thumbnailSize,
        quality: 'SUPER HIGH (PNG 1.0)'
      });

      const manipulatePromise = manipulateAsync(
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
          compress: 1.0,
          format: SaveFormat.PNG,
        }
      );

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(i18n.t('bgThumbnailManager.imageManipulationTimeout'))), 12000); // Çeviri anahtarı kullanıldı
      });

      const result = await Promise.race([manipulatePromise, timeoutPromise]);

      console.log(i18n.t('bgThumbnailManager.manipulateAsyncCompletedLog'), result.uri); // Çeviri anahtarı kullanıldı

      await FileSystem.copyAsync({
        from: result.uri,
        to: thumbnailPath
      });

      console.log(i18n.t('bgThumbnailManager.thumbnailCopiedToCacheLog'), thumbnailPath); // Çeviri anahtarı kullanıldı

      try {
        await FileSystem.deleteAsync(result.uri, { idempotent: true });
      } catch (cleanupError) {
        console.warn(i18n.t('common.cleanupWarning'), cleanupError); // Çeviri anahtarı kullanıldı
      }

      return thumbnailPath;
    } catch (error: any) {
      console.error(i18n.t('bgThumbnailManager.failedToCreateThumbnailLog', { id: backgroundId }), error.message); // Çeviri anahtarı kullanıldı
      return null;
    }
  }

  private async deleteThumbnail(backgroundId: string): Promise<void> {
    try {
      const thumbnail = this.cache[backgroundId];
      if (thumbnail) {
        if (isHexColor(thumbnail.thumbnailUri)) {
          console.log(i18n.t('bgThumbnailManager.skippingDeletionForHexColorLog'), backgroundId); // Çeviri anahtarı kullanıldı
          delete this.cache[backgroundId];
          return;
        }
        await FileSystem.deleteAsync(thumbnail.thumbnailUri, { idempotent: true });
        delete this.cache[backgroundId];
        console.log(i18n.t('bgThumbnailManager.thumbnailDeletedLog'), backgroundId); // Çeviri anahtarı kullanıldı
      }
    } catch (error: any) {
      console.warn(i18n.t('bgThumbnailManager.failedToDeleteThumbnailLog'), error.message); // Çeviri anahtarı kullanıldı
      delete this.cache[backgroundId];
    }
  }

  async clearCache(): Promise<void> {
    try {
      await this.initializeCache();

      const files = await FileSystem.readDirectoryAsync(this.cacheDirectory);

      const deletePromises = files.map(file =>
        FileSystem.deleteAsync(this.cacheDirectory + file, { idempotent: true })
          .catch(error => console.warn(i18n.t('bgThumbnailManager.failedToDeleteCacheFileLog'), file, error.message)) // Çeviri anahtarı kullanıldı
      );

      await Promise.allSettled(deletePromises);

      this.cache = {};
      await this.saveCacheIndex();
      console.log(i18n.t('bgThumbnailManager.cacheClearedLog')); // Çeviri anahtarı kullanıldı
    } catch (error: any) {
      console.error(i18n.t('bgThumbnailManager.failedToClearCacheLog'), error.message); // Çeviri anahtarı kullanıldı
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

    console.log(i18n.t('bgThumbnailManager.preloadingThumbnailsLog', { count: backgrounds.length })); // Çeviri anahtarı kullanıldı

    const results = await Promise.allSettled(
      backgrounds.map(async (bg) => {
        if (typeof bg.fullUrl === 'string' && isHexColor(bg.fullUrl)) {
          console.log(i18n.t('bgThumbnailManager.skippingPreloadForHexColorLog'), bg.id); // Çeviri anahtarı kullanıldı
          return null;
        }

        try {
          const result = await this.getThumbnail(bg.id, bg.fullUrl);
          if (result) {
            console.log(i18n.t('bgThumbnailManager.preloadedLog'), bg.id); // Çeviri anahtarı kullanıldı
          } else {
            console.warn(i18n.t('bgThumbnailManager.failedToPreloadLog'), bg.id); // Çeviri anahtarı kullanıldı
          }
          return result;
        } catch (error: any) {
          console.warn(i18n.t('bgThumbnailManager.preloadErrorLog', { id: bg.id }), error.message); // Çeviri anahtarı kullanıldı
          return null;
        }
      })
    );

    const successful = results.filter(r => r.status === 'fulfilled' && r.value !== null).length;
    console.log(i18n.t('bgThumbnailManager.preloadingCompletedLog', { successful, total: backgrounds.length })); // Çeviri anahtarı kullanıldı
  }

  async optimizeMemory(): Promise<void> {
    try {
      await this.cleanupOldThumbnails();

      if (__DEV__ && global.gc) {
        global.gc();
        console.log(i18n.t('bgThumbnailManager.memoryOptimizationCompletedLog')); // Çeviri anahtarı kullanıldı
      }
    } catch (error: any) {
      console.warn(i18n.t('bgThumbnailManager.memoryOptimizationFailedLog'), error.message); // Çeviri anahtarı kullanıldı
    }
  }

  async validateCache(): Promise<void> {
    try {
      await this.initializeCache();

      const idsToRemove: string[] = [];

      for (const [backgroundId, thumbnail] of Object.entries(this.cache)) {
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
        console.log(i18n.t('bgThumbnailManager.cacheValidationCompletedLog', { count: idsToRemove.length })); // Çeviri anahtarı kullanıldı
      }
    } catch (error: any) {
      console.warn(i18n.t('bgThumbnailManager.cacheValidationFailedLog'), error.message); // Çeviri anahtarı kullanıldı
    }
  }
}

export const backgroundThumbnailManager = new BackgroundThumbnailManager();