// services/imageProcessor.ts - YÜKSEK KALİTE THUMBNAIL VERSİYON (ÇEVİRİ ANAHTARLARI KULLANILDI)
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import { captureRef } from 'react-native-view-shot';
import { EditorSettings } from '@/stores/useEnhancedEditorStore';
import i18n from '@/i18n'; // i18n import edildi
import { memoryManager } from './memoryManager'; // memoryManager import edildi

export const imageProcessor = {
  // Olası geçici dosyaların bulunduğu dizin
  tempImagesDir: FileSystem.documentDirectory + 'temp_images/',

  // Thumbnail boyutları ve formatları optimize edildi
  THUMBNAIL_CONFIG: {
    width: 300,
    height: 300,
    format: SaveFormat.JPEG,
    compress: 0.8,
  },
  PREVIEW_CAPTURE_CONFIG: {
    width: 400,
    height: 400,
    format: SaveFormat.JPEG,
    quality: 0.85,
  },

  createThumbnail: async (originalUri: string, format: 'jpeg' | 'png' = 'jpeg'): Promise<string> => {
    const saveFormat = format === 'png' ? SaveFormat.PNG : SaveFormat.JPEG;
    const compressQuality = format === 'png' ? 0.95 : imageProcessor.THUMBNAIL_CONFIG.compress;

    try {
      const tempResult = await manipulateAsync(
        originalUri,
        [{ resize: { width: imageProcessor.THUMBNAIL_CONFIG.width, height: imageProcessor.THUMBNAIL_CONFIG.height } }],
        { 
          compress: compressQuality,
          format: saveFormat
        }
      );

      console.log(i18n.t('imageProcessor.thumbnailCreatedLog'), tempResult.uri);

      const permanentUri = await imageProcessor.moveToDocuments(
        tempResult.uri,
        `thumb_hq_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${format}`
      );

      console.log(i18n.t('imageProcessor.thumbnailMovedToPermanentLog'), permanentUri);
      await memoryManager.clearImageCache(); // Hafif cache temizliği
      return permanentUri;

    } catch (error: any) {
      console.error(i18n.t('imageProcessor.createThumbnailFailedLog'), error.message);
      throw new Error(i18n.t('imageProcessor.createThumbnailFailed'));
    }
  },

  moveToDocuments: async (tempUri: string, filename: string): Promise<string> => {
    try {
      const documentsDir = imageProcessor.tempImagesDir;

      const dirInfo = await FileSystem.getInfoAsync(documentsDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(documentsDir, { intermediates: true });
      }

      const permanentUri = documentsDir + filename;

      await FileSystem.copyAsync({
        from: tempUri,
        to: permanentUri
      });

      // Kaynak URI'si geçici bir dosya ise sil
      if (tempUri.startsWith(FileSystem.cacheDirectory!)) {
        try {
          await FileSystem.deleteAsync(tempUri, { idempotent: true });
        } catch (cleanupError) {
          console.warn(i18n.t('common.cleanupWarning'), cleanupError);
        }
      }

      return permanentUri;

    } catch (error: any) {
      console.error(i18n.t('imageProcessor.moveToDocumentsFailedLog'), error.message);
      throw new Error(i18n.t('imageProcessor.moveToDocumentsFailed'));
    }
  },

  createFilteredThumbnail: async (
    originalUri: string,
    editorSettings: EditorSettings,
    backgroundUri?: string
  ): Promise<string> => {
    try {
      console.log(i18n.t('imageProcessor.creatingFilteredThumbnailLog'), {
        hasBackground: !!backgroundUri,
        settingsKeys: Object.keys(editorSettings)
      });

      const tempResized = await manipulateAsync(
        originalUri,
        [{ resize: { width: imageProcessor.PREVIEW_CAPTURE_CONFIG.width, height: imageProcessor.PREVIEW_CAPTURE_CONFIG.height } }],
        {
          compress: imageProcessor.PREVIEW_CAPTURE_CONFIG.quality,
          format: imageProcessor.PREVIEW_CAPTURE_CONFIG.format
        }
      );

      const tempFiltered = await imageProcessor.applyBasicFilters(
        tempResized.uri,
        editorSettings
      );

      const permanentUri = await imageProcessor.moveToDocuments(
        tempFiltered,
        `filtered_thumb_hq_${Date.now()}.jpeg`
      );

      if (tempFiltered !== tempResized.uri) {
        try {
          await FileSystem.deleteAsync(tempFiltered, { idempotent: true });
        } catch (error) {
          console.warn(i18n.t('common.cleanupWarning'), error.message);
        }
      }

      console.log(i18n.t('imageProcessor.filteredThumbnailCreatedLog'));
      await memoryManager.clearImageCache();
      return permanentUri;

    } catch (error: any) {
      console.error(i18n.t('imageProcessor.createFilteredThumbnailFailedLog'), error.message);
      // Hata durumunda bile orijinal görselden bir thumbnail oluşturmayı dene
      return await imageProcessor.createThumbnail(originalUri, 'jpeg');
    }
  },

  applyBasicFilters: async (
    imageUri: string,
    settings: EditorSettings
  ): Promise<string> => {
    try {
      const actions: any[] = [];

      if (settings.photoRotation && settings.photoRotation !== 0) {
        actions.push({
          rotate: settings.photoRotation
        });
      }

      // Diğer basic filtreler burada manipulateAsync ile eklenebilir
      // Örn: brightness, contrast vb. (eğer manipulateAsync tarafından destekleniyorsa)

      if (actions.length > 0) {
        const tempResult = await manipulateAsync(
          imageUri,
          actions,
          {
            compress: imageProcessor.PREVIEW_CAPTURE_CONFIG.quality,
            format: imageProcessor.PREVIEW_CAPTURE_CONFIG.format
          }
        );

        const permanentUri = await imageProcessor.moveToDocuments(
          tempResult.uri,
          `filtered_hq_${Date.now()}.jpeg`
        );

        return permanentUri;
      }

      return imageUri;

    } catch (error: any) {
      console.error(i18n.t('imageProcessor.filterApplicationFailedLog'), error.message);
      return imageUri;
    }
  },

  captureFilteredThumbnail: async (
    viewRef: any,
    targetSize: { width: number; height: number } = { width: 400, height: 400 }
  ): Promise<string> => {
    try {
      if (!viewRef?.current) {
        throw new Error(i18n.t('imageProcessor.viewRefNotAvailable'));
      }

      console.log(i18n.t('imageProcessor.capturingFilteredThumbnailLog'));

      const tempCaptured = await captureRef(viewRef, {
        format: imageProcessor.PREVIEW_CAPTURE_CONFIG.format as any,
        quality: imageProcessor.PREVIEW_CAPTURE_CONFIG.quality,
        width: targetSize.width,
        height: targetSize.height,
        result: 'tmpfile',
        snapshotContentContainer: false, // Sadece view'ın kendisini yakala, scroll içeriğini değil
      });

      console.log(i18n.t('imageProcessor.viewCapturedLog'), tempCaptured);

      const permanentUri = await imageProcessor.moveToDocuments(
        tempCaptured,
        `captured_thumb_hq_${Date.now()}.jpeg`
      );

      return permanentUri;

    } catch (error: any) {
      console.error(i18n.t('imageProcessor.captureFilteredThumbnailFailedLog'), error.message);
      throw new Error(i18n.t('imageProcessor.captureFilteredThumbnailFailed'));
    }
  },

  saveFilteredThumbnail: async (
    productId: string,
    photoId: string,
    sourceUri: string
  ): Promise<string> => {
    try {
      const { fileSystemManager } = await import('@/services/fileSystemManager');

      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substr(2, 9);
      const version = Math.floor(timestamp / 1000); // Daha dinamik bir versiyonlama

      const thumbnailFilename = `thumb_hq_${photoId}_v${version}_${randomId}.jpeg`; // JPEG formatı

      console.log(i18n.t('imageProcessor.savingCacheBustedThumbnailLog'), {
        photoId,
        filename: thumbnailFilename,
        timestamp,
        version,
        randomId,
        sourceUri: sourceUri.substring(0, Math.min(sourceUri.length, 50)) + '...'
      });

      const permanentUri = await fileSystemManager.saveImage(
        productId,
        sourceUri,
        thumbnailFilename
      );

      // Kaynak URI'si geçici bir dosya ise sil
      if (sourceUri.startsWith(FileSystem.cacheDirectory!) || sourceUri.startsWith(imageProcessor.tempImagesDir)) {
        try {
          await FileSystem.deleteAsync(sourceUri, { idempotent: true });
        } catch (cleanupError) {
          console.warn(i18n.t('common.cleanupWarning'), cleanupError);
        }
      }

      console.log(i18n.t('imageProcessor.cacheBustedThumbnailSavedLog'), {
        photoId,
        filename: thumbnailFilename,
        uri: permanentUri,
        timestamp,
        version
      });

      return imageProcessor.createStrongCacheBustedUri(permanentUri, version, randomId);

    } catch (error: any) {
      console.error(i18n.t('imageProcessor.saveThumbnailFailedLog'), error.message);
      throw new Error(`${i18n.t('imageProcessor.saveThumbnailFailed')}${error.message}`);
    }
  },

  createStrongCacheBustedUri: (originalUri: string, version?: number, randomId?: string): string => {
    if (!originalUri) return originalUri;

    const timestamp = Date.now();
    // Eğer bir versiyon veya randomId verilmemişse, zaman damgasıyla yenisini oluştur
    const versionParam = version || Math.floor(timestamp / 1000);
    const randomParam = randomId || Math.random().toString(36).substr(2, 9);
    
    // URI'deki mevcut sorgu parametrelerini temizle
    let cleanUri = originalUri.split('?')[0];
    
    const cacheBustingParams = [
      `cb=${timestamp}`, // Genel cache buster
      `v=${versionParam}`, // Versiyon parametresi (içerik değişimi için)
      `r=${randomParam}`, // Rastgele parametre (ekstra garanti için)
    ].join('&');

    const finalUri = `${cleanUri}?${cacheBustingParams}`;
    
    console.log(i18n.t('imageProcessor.strongCacheBustedUriCreatedLog'), {
      original: originalUri,
      final: finalUri.substring(0, Math.min(finalUri.length, 100)) + '...',
      params: { timestamp, versionParam, randomParam }
    });

    return finalUri;
  },

  refreshThumbnail: async (originalThumbnailUri: string): Promise<string> => {
    try {
      const cacheBustedUri = imageProcessor.createStrongCacheBustedUri(originalThumbnailUri);

      // React Native Image cache'ini tetiklemek için bir yöntem
      // `Image.getSize` çağrısı, URI'nin tekrar yüklenmesini sağlar.
      if (typeof global !== 'undefined' && (global as any).__turboModuleProxy) {
        try {
          const { Image } = await import('react-native');
          if (Image.getSize) {
            await new Promise((resolve, reject) => {
              Image.getSize(
                cacheBustedUri,
                () => resolve(true),
                (error) => {
                  console.warn(i18n.t('imageProcessor.imageSizeCheckFailedLog'), error);
                  resolve(false); // Başarısız olsa bile devam et
                }
              );
            });
          }
        } catch (error) {
          console.warn(i18n.t('imageProcessor.imageCacheRefreshWarning'), error);
        }
      }

      console.log(i18n.t('imageProcessor.thumbnailRefreshedLog'), {
        original: originalThumbnailUri.substring(0, Math.min(originalThumbnailUri.length, 50)) + '...',
        cacheBusted: cacheBustedUri.substring(0, Math.min(cacheBustedUri.length, 50)) + '...'
      });

      return cacheBustedUri;

    } catch (error: any) {
      console.warn(i18n.t('imageProcessor.thumbnailRefreshFailedLog'), error.message);
      return originalThumbnailUri;
    }
  },

  // Ortak bellek temizleme fonksiyonunu memoryManager'a devret
  clearImageCache: async (): Promise<void> => {
    await memoryManager.cleanup();
  },

  base64ToTempFile: async (base64Data: string, filename: string = `temp_hq_${Date.now()}.png`): Promise<string> => {
    try {
      const documentsDir = imageProcessor.tempImagesDir;

      const dirInfo = await FileSystem.getInfoAsync(documentsDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(documentsDir, { intermediates: true });
      }

      const permanentUri = documentsDir + filename;

      await FileSystem.writeAsStringAsync(permanentUri, base64Data, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const fileInfo = await FileSystem.getInfoAsync(permanentUri);
      if (!fileInfo.exists) {
        throw new Error(i18n.t('filesystem.fileSaveCheckFailed'));
      }

      console.log(i18n.t('imageProcessor.base64FileSavedPermanentlyLog'), permanentUri);
      return permanentUri;

    } catch (error: any) {
      console.error(i18n.t('imageProcessor.base64FileConversionFailedLog'), error.message);
      throw new Error(i18n.t('imageProcessor.base64ToTempFileFailed'));
    }
  },

  cleanupTempFiles: async (): Promise<void> => {
    try {
      const cacheDir = FileSystem.cacheDirectory;
      if (cacheDir) {
        const cacheFiles = await FileSystem.readDirectoryAsync(cacheDir);
        const tempCacheFiles = cacheFiles.filter(file =>
          file.includes('ImageManipulator') ||
          file.startsWith('tmp-') ||
          file.startsWith('view-shot-') ||
          file.startsWith('bg_thumb_')
        );

        const cacheDeletePromises = tempCacheFiles.map(file =>
          FileSystem.deleteAsync(cacheDir + file, { idempotent: true })
            .catch(error => console.warn(i18n.t('common.cleanupWarning'), file, error.message))
        );

        await Promise.allSettled(cacheDeletePromises);
      }

      const tempImagesDir = imageProcessor.tempImagesDir;
      const dirInfo = await FileSystem.getInfoAsync(tempImagesDir);

      if (dirInfo.exists) {
        const tempFiles = await FileSystem.readDirectoryAsync(tempImagesDir);
        const now = Date.now();
        const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days

        const oldFilePromises = tempFiles.map(async (file) => {
          try {
            const fileUri = tempImagesDir + file;
            const fileInfo = await FileSystem.getInfoAsync(fileUri);

            if (fileInfo.exists && fileInfo.modificationTime) {
              const fileAge = now - fileInfo.modificationTime * 1000;
              if (fileAge > maxAge) {
                await FileSystem.deleteAsync(fileUri, { idempotent: true });
                console.log(i18n.t('imageProcessor.oldTempFileDeletedLog'), file);
              }
            }
          } catch (error) {
            console.warn(i18n.t('imageProcessor.oldFileCleanupWarning'), file, error.message);
          }
        });

        await Promise.allSettled(oldFilePromises);
      }

      console.log(i18n.t('imageProcessor.tempFilesCleanupCompletedLog'));

    } catch (error: any) {
      console.warn(i18n.t('common.cleanupWarning'), error.message);
    }
  },

  optimizeMemoryUsage: async (): Promise<void> => {
    await memoryManager.cleanup();
  },

  createCacheBustedUri: (originalUri: string): string => {
    console.warn(i18n.t('imageProcessor.createCacheBustedUriDeprecationWarning'));
    return imageProcessor.createStrongCacheBustedUri(originalUri);
  },

  validateAndRecoverFile: async (uri: string): Promise<string | null> => {
    try {
      if (!uri) return null;

      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (fileInfo.exists) {
        return uri;
      }

      console.warn(i18n.t('imageProcessor.fileNotFoundRecoveryAttemptLog'), uri);
      return null;

    } catch (error: any) {
      console.warn(i18n.t('imageProcessor.fileValidationFailedLog'), uri, error.message);
      return null;
    }
  }
};