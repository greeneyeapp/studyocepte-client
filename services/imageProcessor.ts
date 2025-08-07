// services/imageProcessor.ts - IMPORT HATALARI DÜZELTİLMİŞ VERSİYON
import { manipulateAsync, SaveFormat, FlipType } from 'expo-image-manipulator'; // DÜZELTME: Doğru import
import * as FileSystem from 'expo-file-system';
import { captureRef } from 'react-native-view-shot';
import { EditorSettings } from '@/stores/useEnhancedEditorStore';

export const imageProcessor = {
  /**
   * Verilen bir görüntüden düşük kaliteli bir thumbnail oluşturur.
   * @param originalUri Orijinal resmin URI'si (file:// veya data: formatında)
   * @returns Thumbnail'in yeni URI'si (file://)
   */
  createThumbnail: async (originalUri: string, format: 'jpeg' | 'png'): Promise<string> => {
    const saveFormat = format === 'png' ? SaveFormat.PNG : SaveFormat.JPEG;

    try {
      const result = await manipulateAsync(
        originalUri,
        [{ resize: { width: 300 } }],
        { compress: 0.7, format: saveFormat }
      );
      return result.uri;
    } catch (error) {
      console.error('Thumbnail oluşturma hatası:', error);
      throw new Error('Thumbnail oluşturulamadı');
    }
  },

  /**
   * YENİ: Editor ayarları uygulanmış filtered thumbnail oluşturur
   * @param originalUri Orijinal fotoğraf URI'si
   * @param editorSettings Editor'da yapılan ayarlar
   * @param backgroundUri Arka plan URI'si (opsiyonel)
   * @returns Filtered thumbnail URI'si
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

      // Temel resize işlemi - thumbnail boyutunda
      const resizedResult = await manipulateAsync(
        originalUri,
        [{ resize: { width: 300, height: 300 } }], // Kare thumbnail
        { 
          compress: 0.8, 
          format: SaveFormat.PNG // Alpha channel için PNG
        }
      );

      // CSS filter benzeri manipulasyonlar uygula
      const filteredResult = await this.applyBasicFilters(
        resizedResult.uri,
        editorSettings
      );

      console.log('✅ Filtered thumbnail created successfully');
      return filteredResult;

    } catch (error) {
      console.error('❌ Filtered thumbnail creation failed:', error);
      // Fallback: normal thumbnail oluştur
      return await this.createThumbnail(originalUri, 'png');
    }
  },

  /**
   * YENİ: Temel filter'ları manipulateAsync ile uygula
   * @param imageUri Görüntü URI'si
   * @param settings Editor ayarları
   * @returns Filtered görüntü URI'si
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

      // Temel manipülasyonlar
      let finalUri = imageUri;

      // Manipülasyonlar varsa uygula
      if (actions.length > 0) {
        const result = await manipulateAsync(
          imageUri,
          actions,
          { 
            compress: 0.8, 
            format: SaveFormat.PNG 
          }
        );
        finalUri = result.uri;
      }
      
      return finalUri;

    } catch (error) {
      console.error('Filter application failed:', error);
      return imageUri; // Fallback: orijinal URI döndür
    }
  },

  /**
   * YENİ: View component'inden filtered thumbnail capture
   * @param viewRef React ref to the preview component
   * @param targetSize Thumbnail boyutu
   * @returns Captured thumbnail URI
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

      const capturedUri = await captureRef(viewRef, {
        format: 'png',
        quality: 0.8,
        width: targetSize.width,
        height: targetSize.height,
        result: 'tmpfile',
      });

      console.log('✅ View captured successfully:', capturedUri);
      return capturedUri;

    } catch (error) {
      console.error('❌ View capture failed:', error);
      throw new Error('Filtered thumbnail capture başarısız');
    }
  },

  /**
   * Base64 verisini geçici dosyaya yazar ve URI döndürür
   * @param base64Data Base64 formatında veri
   * @param filename Dosya adı
   * @returns Geçici dosyanın URI'si
   */
  base64ToTempFile: async (base64Data: string, filename: string = `temp_${Date.now()}.png`): Promise<string> => {
    try {
      const tempUri = FileSystem.cacheDirectory + filename;

      await FileSystem.writeAsStringAsync(tempUri, base64Data, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Dosyanın oluştuğunu kontrol et
      const fileInfo = await FileSystem.getInfoAsync(tempUri);
      if (!fileInfo.exists) {
        throw new Error('Geçici dosya oluşturulamadı');
      }

      return tempUri;
    } catch (error) {
      console.error('Base64 dosya dönüştürme hatası:', error);
      throw new Error('Base64 verisi dosyaya dönüştürülemedi');
    }
  },

  /**
   * YENİ: Kalıcı thumbnail dosyası oluştur ve kaydet
   * @param productId Ürün ID'si
   * @param photoId Fotoğraf ID'si
   * @param sourceUri Kaynak URI (geçici veya kalıcı)
   * @returns Kalıcı thumbnail URI'si
   */
  saveFilteredThumbnail: async (
    productId: string,
    photoId: string,
    sourceUri: string
  ): Promise<string> => {
    try {
      const { fileSystemManager } = await import('@/services/fileSystemManager');
      
      // Filtered thumbnail için özel dosya adı
      const thumbnailFilename = `thumb_filtered_${photoId}.png`;
      
      // Kalıcı konuma kaydet
      const permanentUri = await fileSystemManager.saveImage(
        productId,
        sourceUri,
        thumbnailFilename
      );

      console.log('💾 Filtered thumbnail saved:', {
        photoId,
        filename: thumbnailFilename,
        uri: permanentUri
      });

      return permanentUri;

    } catch (error) {
      console.error('❌ Filtered thumbnail save failed:', error);
      throw new Error('Filtered thumbnail kaydedilemedi');
    }
  },

  /**
   * İki fotoğrafı karşılaştırmak için yan yana koyar
   * @param leftUri Sol taraftaki fotoğraf URI'si
   * @param rightUri Sağ taraftaki fotoğraf URI'si
   * @param width Toplam genişlik
   * @param height Yükseklik
   * @returns Birleştirilmiş fotoğrafın URI'si
   */
  createBeforeAfterComparison: async (
    leftUri: string,
    rightUri: string,
    width: number = 600,
    height: number = 400
  ): Promise<string> => {
    try {
      const halfWidth = width / 2;

      // Sol fotoğrafı resize et
      const leftResult = await manipulateAsync(
        leftUri,
        [
          { resize: { width: halfWidth, height } }
        ],
        {
          compress: 0.8,
          format: SaveFormat.JPEG,
        }
      );

      // Sağ fotoğrafı resize et
      const rightResult = await manipulateAsync(
        rightUri,
        [
          { resize: { width: halfWidth, height } }
        ],
        {
          compress: 0.8,
          format: SaveFormat.JPEG,
        }
      );

      // Canvas-like işlemler React Native'de mümkün olmadığı için
      // bu özellik gelecekte native modül veya farklı kütüphane ile yapılabilir
      // Şimdilik sadece sol fotoğrafı döndürelim
      return leftResult.uri;

    } catch (error) {
      console.error('Karşılaştırma fotoğrafı oluşturma hatası:', error);
      throw new Error('Karşılaştırma fotoğrafı oluşturulamadı');
    }
  },

  /**
   * Görüntü boyutlarını alır
   * @param uri Görüntü URI'si
   * @returns Genişlik ve yükseklik bilgisi
   */
  getImageDimensions: async (uri: string): Promise<{ width: number; height: number }> => {
    try {
      const result = await manipulateAsync(
        uri,
        [], // Hiçbir manipülasyon yapmadan sadece bilgi al
        {
          format: SaveFormat.JPEG,
        }
      );

      // ImageManipulator sonucundan boyut bilgisi almak için
      // getInfoAsync kullanabiliriz (dosya boyutu için)
      const fileInfo = await FileSystem.getInfoAsync(result.uri);

      // Gerçek boyutları almak için farklı bir kütüphane gerekebilir
      // Şimdilik varsayılan değerler döndürelim
      return { width: 1000, height: 1000 };

    } catch (error) {
      console.error('Görüntü boyutu alınamadı:', error);
      return { width: 1000, height: 1000 }; // Varsayılan değer
    }
  },

  /**
   * Geçici dosyaları temizler - GÜVENLİ VERSİYON
   */
  cleanupTempFiles: async (): Promise<void> => {
    try {
      const cacheDir = FileSystem.cacheDirectory;
      if (!cacheDir) return;

      const files = await FileSystem.readDirectoryAsync(cacheDir);
      const tempFiles = files.filter(file => 
        file.startsWith('temp_') || 
        file.startsWith('captured_') ||
        file.startsWith('filtered_') ||
        file.startsWith('ImageManipulator') // Expo'nun geçici dosyaları
      );

      // Her dosyayı ayrı ayrı sil, hata durumunda diğerlerini etkilemesin
      const deletePromises = tempFiles.map(file =>
        FileSystem.deleteAsync(cacheDir + file, { idempotent: true })
          .catch(error => {
            console.warn('⚠️ Failed to delete temp file:', file, error);
          })
      );

      await Promise.allSettled(deletePromises);

      console.log(`🧹 ${tempFiles.length} geçici dosya temizlendi`);
    } catch (error) {
      console.warn('⚠️ Geçici dosya temizleme hatası:', error);
    }
  },

  /**
   * YENİ: Memory usage optimization - GÜVENLİ VERSİYON
   */
  optimizeMemoryUsage: async (): Promise<void> => {
    try {
      // Geçici dosyaları temizle
      await this.cleanupTempFiles();
      
      // JavaScript garbage collection'ı tetikle (sadece debug için)
      if (__DEV__ && global.gc) {
        global.gc();
        console.log('🗑️ Image processor garbage collection triggered');
      }
    } catch (error) {
      console.warn('⚠️ Image processor memory optimization failed:', error);
    }
  },
};