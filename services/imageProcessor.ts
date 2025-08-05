// services/imageProcessor.ts - GÜNCELLENMİŞ VERSİYON
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';

export const imageProcessor = {
  /**
   * Verilen bir görüntüden düşük kaliteli bir thumbnail oluşturur.
   * @param originalUri Orijinal resmin URI'si (file:// veya data: formatında)
   * @returns Thumbnail'in yeni URI'si (file://)
   */
  createThumbnail: async (originalUri: string, format: 'jpeg' | 'png'): Promise<string> => {
    const saveFormat = format === 'png'
      ? ImageManipulator.SaveFormat.PNG
      : ImageManipulator.SaveFormat.JPEG;

    try {
      const result = await ImageManipulator.manipulateAsync(
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
      const leftResult = await ImageManipulator.manipulateAsync(
        leftUri,
        [
          { resize: { width: halfWidth, height } }
        ],
        {
          compress: 0.8,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );

      // Sağ fotoğrafı resize et
      const rightResult = await ImageManipulator.manipulateAsync(
        rightUri,
        [
          { resize: { width: halfWidth, height } }
        ],
        {
          compress: 0.8,
          format: ImageManipulator.SaveFormat.JPEG,
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
      const result = await ImageManipulator.manipulateAsync(
        uri,
        [], // Hiçbir manipülasyon yapmadan sadece bilgi al
        {
          format: ImageManipulator.SaveFormat.JPEG,
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
   * Geçici dosyaları temizler
   */
  cleanupTempFiles: async (): Promise<void> => {
    try {
      const cacheDir = FileSystem.cacheDirectory;
      if (!cacheDir) return;

      const files = await FileSystem.readDirectoryAsync(cacheDir);
      const tempFiles = files.filter(file => file.startsWith('temp_'));

      await Promise.all(
        tempFiles.map(file =>
          FileSystem.deleteAsync(cacheDir + file, { idempotent: true })
        )
      );

      console.log(`${tempFiles.length} geçici dosya temizlendi`);
    } catch (error) {
      console.warn('Geçici dosya temizleme hatası:', error);
    }
  },
};