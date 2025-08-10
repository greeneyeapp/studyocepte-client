// services/imageProcessor.ts - KALİCİ DOSYA YÖNETİMİ İLE DÜZELTİLMİŞ VERSİYON
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import { captureRef } from 'react-native-view-shot';
import { EditorSettings } from '@/stores/useEnhancedEditorStore';

export const imageProcessor = {
  /**
   * DÜZELTME: Kalıcı thumbnail oluştur ve geçici dosyayı hemen temizle
   */
  createThumbnail: async (originalUri: string, format: 'jpeg' | 'png'): Promise<string> => {
    const saveFormat = format === 'png' ? SaveFormat.PNG : SaveFormat.JPEG;

    try {
      // Geçici thumbnail oluştur
      const tempResult = await manipulateAsync(
        originalUri,
        [{ resize: { width: 300 } }],
        { compress: 0.7, format: saveFormat }
      );

      console.log('🖼️ Temporary thumbnail created:', tempResult.uri);

      // DÜZELTME: Geçici dosyayı kalıcı konuma taşı
      const permanentUri = await imageProcessor.moveToDocuments(
        tempResult.uri,
        `thumb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${format}`
      );

      console.log('✅ Thumbnail moved to permanent location:', permanentUri);
      return permanentUri;

    } catch (error) {
      console.error('❌ Thumbnail creation failed:', error);
      throw new Error('Thumbnail oluşturulamadı');
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

    } catch (error) {
      console.error('❌ Failed to move to documents:', error);
      throw new Error('Dosya kalıcı konuma taşınamadı');
    }
  },

  /**
   * DÜZELTME: Filtered thumbnail oluştur - kalıcı dosya yönetimi ile
   */
  createFilteredThumbnail: async (
    originalUri: string,
    editorSettings: EditorSettings,
    backgroundUri?: string
  ): Promise<string> => {
    try {
      console.log('🖼️ Creating filtered thumbnail:', {
        hasBackground: !!backgroundUri,
        settingsKeys: Object.keys(editorSettings)
      });

      // Geçici resize işlemi
      const tempResized = await manipulateAsync(
        originalUri,
        [{ resize: { width: 300, height: 300 } }],
        {
          compress: 0.8,
          format: SaveFormat.PNG
        }
      );

      // Temel filter'ları uygula
      const tempFiltered = await imageProcessor.applyBasicFilters(
        tempResized.uri,
        editorSettings
      );

      // DÜZELTME: Kalıcı konuma taşı
      const permanentUri = await imageProcessor.moveToDocuments(
        tempFiltered,
        `filtered_thumb_${Date.now()}.png`
      );

      // Eğer farklı dosyalarsa geçici dosyayı da temizle
      if (tempFiltered !== tempResized.uri) {
        try {
          await FileSystem.deleteAsync(tempFiltered, { idempotent: true });
        } catch (error) {
          console.warn('⚠️ Cleanup warning:', error);
        }
      }

      console.log('✅ Filtered thumbnail created successfully');
      return permanentUri;

    } catch (error) {
      console.error('❌ Filtered thumbnail creation failed:', error);
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
            compress: 0.8,
            format: SaveFormat.PNG
          }
        );

        // DÜZELTME: Kalıcı konuma taşı
        const permanentUri = await imageProcessor.moveToDocuments(
          tempResult.uri,
          `filtered_${Date.now()}.png`
        );

        return permanentUri;
      }

      return imageUri; // Değişiklik yoksa orijinal URI döndür

    } catch (error) {
      console.error('❌ Filter application failed:', error);
      return imageUri; // Fallback: orijinal URI döndür
    }
  },

  /**
   * DÜZELTME: View component'inden kalıcı thumbnail capture
   */
  captureFilteredThumbnail: async (
    viewRef: any,
    targetSize: { width: number; height: number } = { width: 300, height: 300 }
  ): Promise<string> => {
    try {
      if (!viewRef?.current) {
        throw new Error('View ref is not available');
      }

      console.log('📸 Capturing filtered thumbnail from view...');

      // Geçici capture
      const tempCaptured = await captureRef(viewRef, {
        format: 'png',
        quality: 0.8,
        width: targetSize.width,
        height: targetSize.height,
        result: 'tmpfile',
      });

      console.log('✅ View captured successfully:', tempCaptured);

      // DÜZELTME: Kalıcı konuma taşı
      const permanentUri = await imageProcessor.moveToDocuments(
        tempCaptured,
        `captured_thumb_${Date.now()}.png`
      );

      return permanentUri;

    } catch (error) {
      console.error('❌ View capture failed:', error);
      throw new Error('Filtered thumbnail capture başarısız');
    }
  },

  /**
   * DÜZELTME: Kalıcı thumbnail dosyası oluştur ve doğru dosya sistemine kaydet
   */
  saveFilteredThumbnail: async (
    productId: string,
    photoId: string,
    sourceUri: string
  ): Promise<string> => {
    try {
      // fileSystemManager'ı dynamic import ile al
      const { fileSystemManager } = await import('@/services/fileSystemManager');

      // Filtered thumbnail için timestamp'li dosya adı (unique olması için)
      const timestamp = Date.now();
      const thumbnailFilename = `thumb_filtered_${photoId}_${timestamp}.png`;

      console.log('💾 Saving cache-busted filtered thumbnail:', {
        photoId,
        filename: thumbnailFilename,
        sourceUri: sourceUri.substring(0, 50) + '...'
      });

      // fileSystemManager kullanarak kalıcı ürün klasörüne kaydet
      const permanentUri = await fileSystemManager.saveImage(
        productId,
        sourceUri,
        thumbnailFilename
      );

      // ✅ DÜZELTME: Kaynak dosya geçici konumdaysa sil - doğru import ile
      if (sourceUri.includes('temp_images/') || sourceUri.includes('cache/')) {
        try {
          await FileSystem.deleteAsync(sourceUri, { idempotent: true }); // ✅ Doğru import kullanımı
        } catch (cleanupError) {
          console.warn('⚠️ Source cleanup warning:', cleanupError);
        }
      }

      console.log('✅ Cache-busted filtered thumbnail saved permanently:', {
        photoId,
        filename: thumbnailFilename,
        uri: permanentUri,
        timestamp
      });

      // Cache-busted URI döndür
      return imageProcessor.createCacheBustedUri(permanentUri);

    } catch (error) {
      console.error('❌ Filtered thumbnail save failed:', error);
      throw new Error('Filtered thumbnail kaydedilemedi: ' + error.message);
    }
  },

  refreshThumbnail: async (originalThumbnailUri: string): Promise<string> => {
    try {
      // Cache-busted version oluştur
      const cacheBustedUri = imageProcessor.createCacheBustedUri(originalThumbnailUri);

      // React Native Image cache'ini temizle (platform-specific)
      if (typeof global !== 'undefined' && global.__turboModuleProxy) {
        // Turbo Modules varsa
        try {
          const { Image } = await import('react-native');
          if (Image.getSize) {
            // getSize çağrısı cache'i refresh eder
            await new Promise((resolve, reject) => {
              Image.getSize(
                cacheBustedUri,
                () => resolve(true),
                () => resolve(false) // Error'ı ignore et
              );
            });
          }
        } catch (error) {
          console.warn('⚠️ Image cache refresh warning:', error);
        }
      }

      console.log('🔄 Thumbnail refreshed with cache busting:', {
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
  base64ToTempFile: async (base64Data: string, filename: string = `temp_${Date.now()}.png`): Promise<string> => {
    try {
      // DÜZELTME: Documents klasörüne kaydet, cache'e değil
      const documentsDir = FileSystem.documentDirectory + 'temp_images/';

      // Klasörü oluştur
      const dirInfo = await FileSystem.getInfoAsync(documentsDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(documentsDir, { intermediates: true });
      }

      const permanentUri = documentsDir + filename;

      await FileSystem.writeAsStringAsync(permanentUri, base64Data, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Dosyanın oluştuğunu kontrol et
      const fileInfo = await FileSystem.getInfoAsync(permanentUri);
      if (!fileInfo.exists) {
        throw new Error('Dosya oluşturulamadı');
      }

      console.log('✅ Base64 file saved permanently:', permanentUri);
      return permanentUri;

    } catch (error) {
      console.error('❌ Base64 file conversion failed:', error);
      throw new Error('Base64 verisi dosyaya dönüştürülemedi');
    }
  },

  /**
   * DÜZELTME: Sadece gerçek geçici dosyaları temizle
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

  /**
   * Memory optimization - sadece gerçek cache'i temizle
   */
  optimizeMemoryUsage: async (): Promise<void> => {
    try {
      // Geçici dosyaları temizle
      await imageProcessor.cleanupTempFiles();

      // JavaScript garbage collection'ı tetikle (sadece debug için)
      if (__DEV__ && global.gc) {
        global.gc();
        console.log('🗑️ Image processor garbage collection triggered');
      }
    } catch (error) {
      console.warn('⚠️ Image processor memory optimization failed:', error);
    }
  },

  createCacheBustedUri: (originalUri: string): string => {
    if (!originalUri) return originalUri;

    // Zaten cache-buster varsa güncelle
    if (originalUri.includes('?cb=')) {
      return originalUri.replace(/\?cb=\d+/, `?cb=${Date.now()}`);
    }

    // Yeni cache-buster ekle
    const separator = originalUri.includes('?') ? '&' : '?';
    return `${originalUri}${separator}cb=${Date.now()}`;
  },

  /**
   * YENİ: Dosya varlık kontrolü ve recovery
   */
  validateAndRecoverFile: async (uri: string): Promise<string | null> => {
    try {
      if (!uri) return null;

      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (fileInfo.exists) {
        return uri; // Dosya mevcut
      }

      console.warn('⚠️ File not found, attempting recovery:', uri);

      // Dosya yoksa null döndür (recovery logic gelecekte eklenebilir)
      return null;

    } catch (error) {
      console.warn('⚠️ File validation failed:', uri, error);
      return null;
    }
  }
};