// services/imageProcessor.ts - YÜKSEK KALİTE THUMBNAIL VERSİYON
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import { captureRef } from 'react-native-view-shot';
import { EditorSettings } from '@/stores/useEnhancedEditorStore';
import i18n from '@/i18n'; // i18n import edildi

export const imageProcessor = {
  /**
   * ⭐ YÜKSEK KALİTE: 600px PNG kaliteli thumbnail oluştur
   */
  createThumbnail: async (originalUri: string, format: 'jpeg' | 'png' = 'png'): Promise<string> => {
    const saveFormat = format === 'png' ? SaveFormat.PNG : SaveFormat.JPEG;

    try {
      // ⭐ YÜKSEK KALİTE: 300px → 600px, 0.7 → 0.95, PNG default
      const tempResult = await manipulateAsync(
        originalUri,
        [{ resize: { width: 600 } }], // 300px → 600px
        { 
          compress: 0.95, // 0.7 → 0.95 (yüksek kalite)
          format: SaveFormat.PNG // PNG her zaman en kaliteli
        }
      );

      console.log('🖼️ High quality thumbnail created (600px PNG):', tempResult.uri);

      // Geçici dosyayı kalıcı konuma taşı
      const permanentUri = await imageProcessor.moveToDocuments(
        tempResult.uri,
        `thumb_hq_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.png` // PNG extension
      );

      console.log('✅ High quality thumbnail moved to permanent location:', permanentUri);
      return permanentUri;

    } catch (error: any) { // error type any eklendi
      console.error('❌ High quality thumbnail creation failed:', error);
      throw new Error(i18n.t('imageProcessing.createThumbnailFailed')); // Lokalize edildi
    }
  },

  /**
   * YENİ: Geçici dosyayı Documents klasörüne taşı
   */
  moveToDocuments: async (tempUri: string, filename: string): Promise<string> => {
    try {
      const documentsDir = FileSystem.documentDirectory + 'temp_images/';

      // Documents içinde temp klasörü oluştur
      const dirInfo = await FileSystem.getInfoAsync(documentsDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(documentsDir, { intermediates: true });
      }

      const permanentUri = documentsDir + filename;

      // Dosyayı kopyala
      await FileSystem.copyAsync({
        from: tempUri,
        to: permanentUri
      });

      // Geçici dosyayı sil
      try {
        await FileSystem.deleteAsync(tempUri, { idempotent: true });
      } catch (cleanupError) {
        console.warn('⚠️ Failed to cleanup temp file:', cleanupError);
      }

      return permanentUri;

    } catch (error: any) { // error type any eklendi
      console.error('❌ Failed to move to documents:', error);
      throw new Error(i18n.t('imageProcessing.moveToPermanentFailed')); // Lokalize edildi
    }
  },

  /**
   * ⭐ YÜKSEK KALİTE: 800x800 PNG filtered thumbnail oluştur
   */
  createFilteredThumbnail: async (
    originalUri: string,
    editorSettings: EditorSettings,
    backgroundUri?: string
  ): Promise<string> => {
    try {
      console.log('🖼️ Creating HIGH QUALITY filtered thumbnail:', {
        hasBackground: !!backgroundUri,
        settingsKeys: Object.keys(editorSettings)
      });

      // ⭐ YÜKSEK KALİTE: 300x300 → 800x800, 0.8 → 1.0, PNG
      const tempResized = await manipulateAsync(
        originalUri,
        [{ resize: { width: 800, height: 800 } }], // 300x300 → 800x800
        {
          compress: 1.0, // 0.8 → 1.0 (maksimum kalite)
          format: SaveFormat.PNG // PNG for best quality
        }
      );

      // Temel filter'ları uygula
      const tempFiltered = await imageProcessor.applyBasicFilters(
        tempResized.uri,
        editorSettings
      );

      // Kalıcı konuma taşı
      const permanentUri = await imageProcessor.moveToDocuments(
        tempFiltered,
        `filtered_hq_${Date.now()}.png`
      );

      // Eğer farklı dosyalarsa geçici dosyayı da temizle
      if (tempFiltered !== tempResized.uri) {
        try {
          await FileSystem.deleteAsync(tempFiltered, { idempotent: true });
        } catch (error) {
          console.warn('⚠️ Cleanup warning:', error);
        }
      }

      console.log('✅ HIGH QUALITY filtered thumbnail created (800x800 PNG)');
      return permanentUri;

    } catch (error: any) { // error type any eklendi
      console.error('❌ High quality filtered thumbnail creation failed:', error);
      // Fallback: normal thumbnail oluştur
      return await imageProcessor.createThumbnail(originalUri, 'png');
    }
  },

  /**
   * DÜZELTME: Temel filter'ları uygula ve kalıcı dosya döndür
   */
  applyBasicFilters: async (
    imageUri: string,
    settings: EditorSettings
  ): Promise<string> => {
    try {
      const actions: any[] = [];

      // Rotation uygula
      if (settings.photoRotation && settings.photoRotation !== 0) {
        actions.push({
          rotate: settings.photoRotation
        });
      }

      // Manipülasyonlar varsa uygula
      if (actions.length > 0) {
        const tempResult = await manipulateAsync(
          imageUri,
          actions,
          {
            compress: 1.0, // ⭐ YÜKSEK KALİTE: 0.8 → 1.0
            format: SaveFormat.PNG // ⭐ YÜKSEK KALİTE: PNG
          }
        );

        // Kalıcı konuma taşı
        const permanentUri = await imageProcessor.moveToDocuments(
          tempResult.uri,
          `filtered_hq_${Date.now()}.png`
        );

        return permanentUri;
      }

      return imageUri; // Değişiklik yoksa orijinal URI döndür

    } catch (error: any) { // error type any eklendi
      console.error('❌ High quality filter application failed:', error);
      return imageUri; // Fallback: orijinal URI döndür
    }
  },

  /**
   * ⭐ YÜKSEK KALİTE: 800x800 view component'inden kalıcı thumbnail capture
   */
  captureFilteredThumbnail: async (
    viewRef: any,
    targetSize: { width: number; height: number } = { width: 800, height: 800 } // 300x300 → 800x800
  ): Promise<string> => {
    try {
      if (!viewRef?.current) {
        throw new Error('View ref is not available');
      }

      console.log('📸 Capturing HIGH QUALITY filtered thumbnail from view (800x800)...');

      // ⭐ YÜKSEK KALİTE: PNG, yüksek kalite, büyük boyut
      const tempCaptured = await captureRef(viewRef, {
        format: 'png', // PNG for lossless quality
        quality: 1.0, // 0.8 → 1.0 (maksimum kalite)
        width: targetSize.width, // 800px
        height: targetSize.height, // 800px
        result: 'tmpfile',
      });

      console.log('✅ HIGH QUALITY view captured (800x800 PNG):', tempCaptured);

      // Kalıcı konuma taşı
      const permanentUri = await imageProcessor.moveToDocuments(
        tempCaptured,
        `captured_thumb_hq_${Date.now()}.png`
      );

      return permanentUri;

    } catch (error: any) { // error type any eklendi
      console.error('❌ High quality view capture failed:', error);
      throw new Error(i18n.t('imageProcessing.captureFilteredThumbnailFailed')); // Lokalize edildi
    }
  },

  /**
   * ⭐ GÜÇLÜ CACHE-BUSTING: Timestamp + Random ile unique thumbnail URI
   */
  saveFilteredThumbnail: async (
    productId: string,
    photoId: string,
    sourceUri: string
  ): Promise<string> => {
    try {
      // fileSystemManager'ı dynamic import ile al
      const { fileSystemManager } = await import('@/services/fileSystemManager');

      // ⭐ GÜÇLÜ CACHE-BUSTING: Timestamp + random + version
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substr(2, 9);
      const version = Math.floor(timestamp / 1000); // Saniye bazlı version
      const thumbnailFilename = `thumb_hq_${photoId}_v${version}_${randomId}.png`;

      console.log('💾 Saving CACHE-BUSTED high quality thumbnail:', {
        photoId,
        filename: thumbnailFilename,
        timestamp,
        version,
        randomId,
        sourceUri: sourceUri.substring(0, 50) + '...'
      });

      // fileSystemManager kullanarak kalıcı ürün klasörüne kaydet
      const permanentUri = await fileSystemManager.saveImage(
        productId,
        sourceUri,
        thumbnailFilename
      );

      // Kaynak dosya geçici konumdaysa sil
      if (sourceUri.includes('temp_images/') || sourceUri.includes('cache/')) {
        try {
          await FileSystem.deleteAsync(sourceUri, { idempotent: true });
        } catch (cleanupError) {
          console.warn('⚠️ Source cleanup warning:', cleanupError);
        }
      }

      console.log('✅ CACHE-BUSTED high quality thumbnail saved:', {
        photoId,
        filename: thumbnailFilename,
        uri: permanentUri,
        timestamp,
        version
      });

      // ⭐ GÜÇLÜ CACHE-BUSTING URI döndür
      return imageProcessor.createStrongCacheBustedUri(permanentUri, version, randomId);

    } catch (error: any) { // error type any eklendi
      console.error('❌ High quality thumbnail save failed:', error);
      throw new Error(`${i18n.t('imageProcessing.saveThumbnailFailed')}: ${error.message}`); // Lokalize edildi
    }
  },

  /**
   * ⭐ GÜÇLÜ CACHE-BUSTING: Multiple parameters ile
   */
  createStrongCacheBustedUri: (originalUri: string, version?: number, randomId?: string): string => {
    if (!originalUri) return originalUri;

    const timestamp = Date.now();
    const versionParam = version || Math.floor(timestamp / 1000);
    const randomParam = randomId || Math.random().toString(36).substr(2, 9);
    
    // Mevcut parametreleri temizle
    let cleanUri = originalUri.split('?')[0];
    
    // ⭐ MULTIPLE CACHE-BUSTING PARAMETERS
    const cacheBustingParams = [
      `cb=${timestamp}`, // Cache buster timestamp
      `v=${versionParam}`, // Version number
      `r=${randomParam}`, // Random ID
      `t=${Date.now()}` // Additional timestamp
    ].join('&');

    const finalUri = `${cleanUri}?${cacheBustingParams}`;
    
    console.log('🔄 STRONG cache-busted URI created:', {
      original: originalUri,
      final: finalUri,
      params: { timestamp, versionParam, randomParam }
    });

    return finalUri;
  },

  refreshThumbnail: async (originalThumbnailUri: string): Promise<string> => {
    try {
      // ⭐ GÜÇLÜ CACHE-BUSTING version oluştur
      const cacheBustedUri = imageProcessor.createStrongCacheBustedUri(originalThumbnailUri);

      // React Native Image cache'ini temizle (platform-specific)
      if (typeof global !== 'undefined' && global.__turboModuleProxy) {
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
          console.warn('⚠️ Image cache refresh warning:', error);
        }
      }

      console.log('🔄 HIGH QUALITY thumbnail refreshed with strong cache busting:', {
        original: originalThumbnailUri,
        cacheBusted: cacheBustedUri
      });

      return cacheBustedUri;

    } catch (error) {
      console.warn('⚠️ Thumbnail refresh failed, returning original:', error);
      return originalThumbnailUri;
    }
  },

  clearImageCache: async (): Promise<void> => {
    try {
      // React Native'de image cache temizliği
      const { Image } = await import('react-native');

      // Platform-specific cache clearing
      if (typeof Image.clearMemoryCache === 'function') {
        await Image.clearMemoryCache();
        console.log('🧹 React Native image memory cache cleared');
      }

      if (typeof Image.clearDiskCache === 'function') {
        await Image.clearDiskCache();
        console.log('🧹 React Native image disk cache cleared');
      }

    } catch (error) {
      console.warn('⚠️ Image cache clearing failed:', error);
    }
  },

  /**
   * Base64 verisini kalıcı dosyaya yazar
   */
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
        throw new Error(i18n.t('imageProcessing.moveToPermanentFailed')); // Lokalize edildi
      }

      console.log('✅ HIGH QUALITY base64 file saved permanently:', permanentUri);
      return permanentUri;

    } catch (error: any) { // error type any eklendi
      console.error('❌ Base64 file conversion failed:', error);
      throw new Error(i18n.t('imageProcessing.base64ToFileFailed')); // Lokalize edildi
    }
  },

  /**
   * Sadece gerçek geçici dosyaları temizle
   */
  cleanupTempFiles: async (): Promise<void> => {
    try {
      // Cache klasöründeki ImageManipulator dosyalarını temizle
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
            .catch(error => console.warn('⚠️ Cache cleanup warning:', file, error))
        );

        await Promise.allSettled(cacheDeletePromises);
      }

      // Documents/temp_images klasöründeki eski dosyaları temizle (7 günden eski)
      const tempImagesDir = FileSystem.documentDirectory + 'temp_images/';
      const dirInfo = await FileSystem.getInfoAsync(tempImagesDir);

      if (dirInfo.exists) {
        const tempFiles = await FileSystem.readDirectoryAsync(tempImagesDir);
        const now = Date.now();
        const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 gün

        const oldFilePromises = tempFiles.map(async (file) => {
          try {
            const fileUri = tempImagesDir + file;
            const fileInfo = await FileSystem.getInfoAsync(fileUri);

            if (fileInfo.exists && fileInfo.modificationTime) {
              const fileAge = now - fileInfo.modificationTime * 1000;
              if (fileAge > maxAge) {
                await FileSystem.deleteAsync(fileUri, { idempotent: true });
                console.log('🗑️ Old temp file deleted:', file);
              }
            }
          } catch (error) {
            console.warn('⚠️ Old file cleanup warning:', file, error);
          }
        });

        await Promise.allSettled(oldFilePromises);
      }

      console.log('🧹 Temp files cleanup completed');

    } catch (error) {
      console.warn('⚠️ Cleanup warning:', error);
    }
  },

  optimizeMemoryUsage: async (): Promise<void> => {
    try {
      await imageProcessor.cleanupTempFiles();

      if (__DEV__ && global.gc) {
        global.gc();
        console.log('🗑️ Image processor garbage collection triggered');
      }
    } catch (error) {
      console.warn('⚠️ Image processor memory optimization failed:', error);
    }
  },

  // ⚠️ DEPRECATED: createCacheBustedUri yerine createStrongCacheBustedUri kullan
  createCacheBustedUri: (originalUri: string): string => {
    console.warn('⚠️ createCacheBustedUri deprecated, use createStrongCacheBustedUri instead');
    return imageProcessor.createStrongCacheBustedUri(originalUri);
  },

  /**
   * Dosya varlık kontrolü ve recovery
   */
  validateAndRecoverFile: async (uri: string): Promise<string | null> => {
    try {
      if (!uri) return null;

      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (fileInfo.exists) {
        return uri;
      }

      console.warn('⚠️ File not found, attempting recovery:', uri);
      return null;

    } catch (error) {
      console.warn('⚠️ File validation failed:', uri, error);
      return null;
    }
  }
};