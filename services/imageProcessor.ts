// services/imageProcessor.ts - YÜKSEK KALİTE THUMBNAIL VERSİYON (ÇEVİRİ ANAHTARLARI KULLANILDI)
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import { captureRef } from 'react-native-view-shot';
import { EditorSettings } from '@/stores/useEnhancedEditorStore';
import i18n from '@/i18n'; // i18n import edildi

export const imageProcessor = {
  createThumbnail: async (originalUri: string, format: 'jpeg' | 'png' = 'png'): Promise<string> => {
    const saveFormat = format === 'png' ? SaveFormat.PNG : SaveFormat.JPEG;

    try {
      const tempResult = await manipulateAsync(
        originalUri,
        [{ resize: { width: 600 } }],
        { 
          compress: 0.95,
          format: SaveFormat.PNG
        }
      );

      console.log(i18n.t('imageProcessor.thumbnailCreatedLog'), tempResult.uri); // Çeviri anahtarı kullanıldı

      const permanentUri = await imageProcessor.moveToDocuments(
        tempResult.uri,
        `thumb_hq_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.png`
      );

      console.log(i18n.t('imageProcessor.thumbnailMovedToPermanentLog'), permanentUri); // Çeviri anahtarı kullanıldı
      return permanentUri;

    } catch (error: any) {
      console.error(i18n.t('imageProcessor.createThumbnailFailedLog'), error.message); // Çeviri anahtarı kullanıldı
      throw new Error(i18n.t('imageProcessor.createThumbnailFailed')); // Çeviri anahtarı kullanıldı
    }
  },

  moveToDocuments: async (tempUri: string, filename: string): Promise<string> => {
    try {
      const documentsDir = FileSystem.documentDirectory + 'temp_images/';

      const dirInfo = await FileSystem.getInfoAsync(documentsDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(documentsDir, { intermediates: true });
      }

      const permanentUri = documentsDir + filename;

      await FileSystem.copyAsync({
        from: tempUri,
        to: permanentUri
      });

      try {
        await FileSystem.deleteAsync(tempUri, { idempotent: true });
      } catch (cleanupError) {
        console.warn(i18n.t('common.cleanupWarning'), cleanupError); // Çeviri anahtarı kullanıldı
      }

      return permanentUri;

    } catch (error: any) {
      console.error(i18n.t('imageProcessor.moveToDocumentsFailedLog'), error.message); // Çeviri anahtarı kullanıldı
      throw new Error(i18n.t('imageProcessor.moveToDocumentsFailed')); // Çeviri anahtarı kullanıldı
    }
  },

  createFilteredThumbnail: async (
    originalUri: string,
    editorSettings: EditorSettings,
    backgroundUri?: string
  ): Promise<string> => {
    try {
      console.log(i18n.t('imageProcessor.creatingFilteredThumbnailLog'), { // Çeviri anahtarı kullanıldı
        hasBackground: !!backgroundUri,
        settingsKeys: Object.keys(editorSettings)
      });

      const tempResized = await manipulateAsync(
        originalUri,
        [{ resize: { width: 800, height: 800 } }],
        {
          compress: 1.0,
          format: SaveFormat.PNG
        }
      );

      const tempFiltered = await imageProcessor.applyBasicFilters(
        tempResized.uri,
        editorSettings
      );

      const permanentUri = await imageProcessor.moveToDocuments(
        tempFiltered,
        `filtered_thumb_hq_${Date.now()}.png`
      );

      if (tempFiltered !== tempResized.uri) {
        try {
          await FileSystem.deleteAsync(tempFiltered, { idempotent: true });
        } catch (error) {
          console.warn(i18n.t('common.cleanupWarning'), error.message); // Çeviri anahtarı kullanıldı
        }
      }

      console.log(i18n.t('imageProcessor.filteredThumbnailCreatedLog')); // Çeviri anahtarı kullanıldı
      return permanentUri;

    } catch (error: any) {
      console.error(i18n.t('imageProcessor.createFilteredThumbnailFailedLog'), error.message); // Çeviri anahtarı kullanıldı
      return await imageProcessor.createThumbnail(originalUri, 'png');
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

      if (actions.length > 0) {
        const tempResult = await manipulateAsync(
          imageUri,
          actions,
          {
            compress: 1.0,
            format: SaveFormat.PNG
          }
        );

        const permanentUri = await imageProcessor.moveToDocuments(
          tempResult.uri,
          `filtered_hq_${Date.now()}.png`
        );

        return permanentUri;
      }

      return imageUri;

    } catch (error: any) {
      console.error(i18n.t('imageProcessor.filterApplicationFailedLog'), error.message); // Çeviri anahtarı kullanıldı
      return imageUri;
    }
  },

  captureFilteredThumbnail: async (
    viewRef: any,
    targetSize: { width: number; height: number } = { width: 800, height: 800 }
  ): Promise<string> => {
    try {
      if (!viewRef?.current) {
        throw new Error(i18n.t('imageProcessor.viewRefNotAvailable')); // Çeviri anahtarı kullanıldı
      }

      console.log(i18n.t('imageProcessor.capturingFilteredThumbnailLog')); // Çeviri anahtarı kullanıldı

      const tempCaptured = await captureRef(viewRef, {
        format: 'png',
        quality: 1.0,
        width: targetSize.width,
        height: targetSize.height,
        result: 'tmpfile',
      });

      console.log(i18n.t('imageProcessor.viewCapturedLog'), tempCaptured); // Çeviri anahtarı kullanıldı

      const permanentUri = await imageProcessor.moveToDocuments(
        tempCaptured,
        `captured_thumb_hq_${Date.now()}.png`
      );

      return permanentUri;

    } catch (error: any) {
      console.error(i18n.t('imageProcessor.captureFilteredThumbnailFailedLog'), error.message); // Çeviri anahtarı kullanıldı
      throw new Error(i18n.t('imageProcessor.captureFilteredThumbnailFailed')); // Çeviri anahtarı kullanıldı
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
      const version = Math.floor(timestamp / 1000);
      const thumbnailFilename = `thumb_hq_${photoId}_v${version}_${randomId}.png`;

      console.log(i18n.t('imageProcessor.savingCacheBustedThumbnailLog'), { // Çeviri anahtarı kullanıldı
        photoId,
        filename: thumbnailFilename,
        timestamp,
        version,
        randomId,
        sourceUri: sourceUri.substring(0, 50) + '...'
      });

      const permanentUri = await fileSystemManager.saveImage(
        productId,
        sourceUri,
        thumbnailFilename
      );

      if (sourceUri.includes('temp_images/') || sourceUri.includes('cache/')) {
        try {
          await FileSystem.deleteAsync(sourceUri, { idempotent: true });
        } catch (cleanupError) {
          console.warn(i18n.t('common.cleanupWarning'), cleanupError); // Çeviri anahtarı kullanıldı
        }
      }

      console.log(i18n.t('imageProcessor.cacheBustedThumbnailSavedLog'), { // Çeviri anahtarı kullanıldı
        photoId,
        filename: thumbnailFilename,
        uri: permanentUri,
        timestamp,
        version
      });

      return imageProcessor.createStrongCacheBustedUri(permanentUri, version, randomId);

    } catch (error: any) {
      console.error(i18n.t('imageProcessor.saveThumbnailFailedLog'), error.message); // Çeviri anahtarı kullanıldı
      throw new Error(`${i18n.t('imageProcessor.saveThumbnailFailed')}${error.message}`); // Çeviri anahtarı kullanıldı
    }
  },

  createStrongCacheBustedUri: (originalUri: string, version?: number, randomId?: string): string => {
    if (!originalUri) return originalUri;

    const timestamp = Date.now();
    const versionParam = version || Math.floor(timestamp / 1000);
    const randomParam = randomId || Math.random().toString(36).substr(2, 9);
    
    let cleanUri = originalUri.split('?')[0];
    
    const cacheBustingParams = [
      `cb=${timestamp}`,
      `v=${versionParam}`,
      `r=${randomParam}`,
      `t=${Date.now()}`
    ].join('&');

    const finalUri = `${cleanUri}?${cacheBustingParams}`;
    
    console.log(i18n.t('imageProcessor.strongCacheBustedUriCreatedLog'), { // Çeviri anahtarı kullanıldı
      original: originalUri,
      final: finalUri,
      params: { timestamp, versionParam, randomParam }
    });

    return finalUri;
  },

  refreshThumbnail: async (originalThumbnailUri: string): Promise<string> => {
    try {
      const cacheBustedUri = imageProcessor.createStrongCacheBustedUri(originalThumbnailUri);

      if (typeof global !== 'undefined' && (global as any).__turboModuleProxy) {
        try {
          const { Image } = await import('react-native');
          if (Image.getSize) {
            await new Promise((resolve, reject) => {
              Image.getSize(
                cacheBustedUri,
                () => resolve(true),
                () => resolve(false)
              );
            });
          }
        } catch (error) {
          console.warn(i18n.t('imageProcessor.imageCacheRefreshWarning'), error); // Çeviri anahtarı kullanıldı
        }
      }

      console.log(i18n.t('imageProcessor.thumbnailRefreshedLog'), { // Çeviri anahtarı kullanıldı
        original: originalThumbnailUri,
        cacheBusted: cacheBustedUri
      });

      return cacheBustedUri;

    } catch (error: any) {
      console.warn(i18n.t('imageProcessor.thumbnailRefreshFailedLog'), error.message); // Çeviri anahtarı kullanıldı
      return originalThumbnailUri;
    }
  },

  clearImageCache: async (): Promise<void> => {
    try {
      const { Image } = await import('react-native');

      if (typeof Image.clearMemoryCache === 'function') {
        await Image.clearMemoryCache();
        console.log(i18n.t('imageProcessor.memoryCacheClearedLog')); // Çeviri anahtarı kullanıldı
      }

      if (typeof Image.clearDiskCache === 'function') {
        await Image.clearDiskCache();
        console.log(i18n.t('imageProcessor.diskCacheClearedLog')); // Çeviri anahtarı kullanıldı
      }

    } catch (error: any) {
      console.warn(i18n.t('imageProcessor.imageCacheClearingFailedLog'), error.message); // Çeviri anahtarı kullanıldı
    }
  },

  base64ToTempFile: async (base64Data: string, filename: string = `temp_hq_${Date.now()}.png`): Promise<string> => {
    try {
      const documentsDir = FileSystem.documentDirectory + 'temp_images/';

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
        throw new Error(i18n.t('filesystem.fileSaveCheckFailed')); // Çeviri anahtarı kullanıldı
      }

      console.log(i18n.t('imageProcessor.base64FileSavedPermanentlyLog'), permanentUri); // Çeviri anahtarı kullanıldı
      return permanentUri;

    } catch (error: any) {
      console.error(i18n.t('imageProcessor.base64FileConversionFailedLog'), error.message); // Çeviri anahtarı kullanıldı
      throw new Error(i18n.t('imageProcessor.base64ToTempFileFailed')); // Çeviri anahtarı kullanıldı
    }
  },

  cleanupTempFiles: async (): Promise<void> => {
    try {
      const cacheDir = FileSystem.cacheDirectory;
      if (cacheDir) {
        const cacheFiles = await FileSystem.readDirectoryAsync(cacheDir);
        const tempCacheFiles = cacheFiles.filter(file =>
          file.includes('ImageManipulator') ||
          file.startsWith('temp_') ||
          file.startsWith('captured_')
        );

        const cacheDeletePromises = tempCacheFiles.map(file =>
          FileSystem.deleteAsync(cacheDir + file, { idempotent: true })
            .catch(error => console.warn(i18n.t('common.cleanupWarning'), file, error.message)) // Çeviri anahtarı kullanıldı
        );

        await Promise.allSettled(cacheDeletePromises);
      }

      const tempImagesDir = FileSystem.documentDirectory + 'temp_images/';
      const dirInfo = await FileSystem.getInfoAsync(tempImagesDir);

      if (dirInfo.exists) {
        const tempFiles = await FileSystem.readDirectoryAsync(tempImagesDir);
        const now = Date.now();
        const maxAge = 7 * 24 * 60 * 60 * 1000;

        const oldFilePromises = tempFiles.map(async (file) => {
          try {
            const fileUri = tempImagesDir + file;
            const fileInfo = await FileSystem.getInfoAsync(fileUri);

            if (fileInfo.exists && fileInfo.modificationTime) {
              const fileAge = now - fileInfo.modificationTime * 1000;
              if (fileAge > maxAge) {
                await FileSystem.deleteAsync(fileUri, { idempotent: true });
                console.log(i18n.t('imageProcessor.oldTempFileDeletedLog'), file); // Çeviri anahtarı kullanıldı
              }
            }
          } catch (error) {
            console.warn(i18n.t('imageProcessor.oldFileCleanupWarning'), file, error.message); // Çeviri anahtarı kullanıldı
          }
        });

        await Promise.allSettled(oldFilePromises);
      }

      console.log(i18n.t('imageProcessor.tempFilesCleanupCompletedLog')); // Çeviri anahtarı kullanıldı

    } catch (error: any) {
      console.warn(i18n.t('common.cleanupWarning'), error.message); // Çeviri anahtarı kullanıldı
    }
  },

  optimizeMemoryUsage: async (): Promise<void> => {
    try {
      await imageProcessor.cleanupTempFiles();

      if (__DEV__ && global.gc) {
        global.gc();
        console.log(i18n.t('imageProcessor.garbageCollectionTriggeredLog')); // Çeviri anahtarı kullanıldı
      }
    } catch (error: any) {
      console.warn(i18n.t('imageProcessor.memoryOptimizationFailedLog'), error.message); // Çeviri anahtarı kullanıldı
    }
  },

  createCacheBustedUri: (originalUri: string): string => {
    console.warn(i18n.t('imageProcessor.createCacheBustedUriDeprecationWarning')); // Çeviri anahtarı kullanıldı
    return imageProcessor.createStrongCacheBustedUri(originalUri);
  },

  validateAndRecoverFile: async (uri: string): Promise<string | null> => {
    try {
      if (!uri) return null;

      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (fileInfo.exists) {
        return uri;
      }

      console.warn(i18n.t('imageProcessor.fileNotFoundRecoveryAttemptLog'), uri); // Çeviri anahtarı kullanıldı
      return null;

    } catch (error: any) {
      console.warn(i18n.t('imageProcessor.fileValidationFailedLog'), uri, error.message); // Çeviri anahtarı kullanıldı
      return null;
    }
  }
};