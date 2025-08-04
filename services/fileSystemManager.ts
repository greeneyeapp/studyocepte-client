// services/fileSystemManager.ts - DATA URI DESTEKLİ VERSİYON
import * as FileSystem from 'expo-file-system';

// Tüm ürünlerin saklanacağı ana klasörün yolu
const productsDir = FileSystem.documentDirectory + 'products/';

// Uygulama açıldığında ana ürün klasörünün var olduğundan emin olan fonksiyon
const ensureBaseDirExists = async () => {
  const dirInfo = await FileSystem.getInfoAsync(productsDir);
  if (!dirInfo.exists) {
    console.log("Ana ürün klasörü oluşturuluyor...");
    await FileSystem.makeDirectoryAsync(productsDir, { intermediates: true });
  }
};

// Servisi başlat
ensureBaseDirExists();

export const fileSystemManager = {
  /** Belirli bir ürüne ait klasörün yolunu döndürür. */
  getProductDirectory: (productId: string) => `${productsDir}${productId}/`,

  /** Yeni bir ürün için klasör oluşturur. */
  createProductDirectory: async (productId: string): Promise<string> => {
    const dir = fileSystemManager.getProductDirectory(productId);
    await ensureBaseDirExists();
    const dirInfo = await FileSystem.getInfoAsync(dir);
    if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
    }
    return dir;
  },

  /** 
   * Geçici bir URI'deki görüntüyü kalıcı olarak ürün klasörüne kaydeder.
   * Data URI formatını da destekler.
   */
  saveImage: async (productId: string, sourceUri: string, newFilename: string): Promise<string> => {
    const productDir = fileSystemManager.getProductDirectory(productId);
    await fileSystemManager.createProductDirectory(productId); // Klasörün varlığından emin ol
    
    const permanentUri = `${productDir}${newFilename}`;

    try {
      // Data URI formatında mı kontrol et
      if (sourceUri.startsWith('data:')) {
        console.log('📝 Data URI formatı tespit edildi, base64 olarak kaydediliyor...');
        
        // Data URI'den base64 veriyi çıkar
        const base64Data = sourceUri.split(',')[1];
        if (!base64Data) {
          throw new Error('Geçersiz data URI formatı');
        }
        
        // Base64 veriyi dosyaya yaz
        await FileSystem.writeAsStringAsync(permanentUri, base64Data, {
          encoding: FileSystem.EncodingType.Base64,
        });
        
        console.log('✅ Data URI başarıyla kaydedildi:', permanentUri);
      } else {
        // Normal file URI - kopyala
        console.log('📁 File URI formatı tespit edildi, kopyalanıyor...');
        await FileSystem.copyAsync({ from: sourceUri, to: permanentUri });
        console.log('✅ Dosya başarıyla kopyalandı:', permanentUri);
      }

      // Dosyanın gerçekten oluştuğunu kontrol et
      const fileInfo = await FileSystem.getInfoAsync(permanentUri);
      if (!fileInfo.exists) {
        throw new Error('Dosya kaydedildi ancak kontrol edilemedi');
      }
      
      console.log('📊 Dosya bilgisi:', {
        uri: permanentUri,
        size: fileInfo.size,
        exists: fileInfo.exists
      });

      return permanentUri;
      
    } catch (error) {
      console.error('❌ Dosya kaydetme hatası:', error);
      console.error('🔍 Hata detayları:', {
        productId,
        sourceUri: sourceUri.substring(0, 100) + '...',
        newFilename,
        permanentUri
      });
      throw new Error(`Dosya kaydedilemedi: ${error.message}`);
    }
  },

  /** Bir dosyayı siler. */
  deleteImage: async (fileUri: string): Promise<void> => {
    if (!fileUri || !fileUri.startsWith('file://')) {
      console.warn('⚠️ Geçersiz dosya URI\'si, silme işlemi atlanıyor:', fileUri);
      return;
    }
    
    try {
      await FileSystem.deleteAsync(fileUri, { idempotent: true });
      console.log('🗑️ Dosya silindi:', fileUri);
    } catch (error) {
      console.error('❌ Dosya silme hatası:', error);
      // Hata olsa bile devam et, critical değil
    }
  },

  /** Bir ürünün tüm dosyalarıyla birlikte klasörünü siler. */
  deleteProductDirectory: async (productId: string) => {
    const dir = fileSystemManager.getProductDirectory(productId);
    console.log(`🗂️ '${productId}' ürününün klasörü siliniyor: ${dir}`);
    
    try {
      await FileSystem.deleteAsync(dir, { idempotent: true });
      console.log('✅ Ürün klasörü başarıyla silindi');
    } catch (error) {
      console.error('❌ Ürün klasörü silme hatası:', error);
    }
  },

  /**
   * Base64 verisini doğrudan dosyaya kaydeder
   * @param productId Ürün ID'si
   * @param base64Data Base64 formatında veri
   * @param filename Dosya adı
   * @returns Kaydedilen dosyanın URI'si
   */
  saveBase64Image: async (productId: string, base64Data: string, filename: string): Promise<string> => {
    const productDir = fileSystemManager.getProductDirectory(productId);
    await fileSystemManager.createProductDirectory(productId);
    
    const permanentUri = `${productDir}${filename}`;

    try {
      console.log('💾 Base64 veri dosyaya kaydediliyor...', {
        filename,
        dataSize: base64Data.length
      });

      await FileSystem.writeAsStringAsync(permanentUri, base64Data, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Kontrol et
      const fileInfo = await FileSystem.getInfoAsync(permanentUri);
      if (!fileInfo.exists) {
        throw new Error('Base64 dosya kaydedildi ancak kontrol edilemedi');
      }

      console.log('✅ Base64 dosya başarıyla kaydedildi:', {
        uri: permanentUri,
        size: fileInfo.size
      });

      return permanentUri;

    } catch (error) {
      console.error('❌ Base64 dosya kaydetme hatası:', error);
      throw new Error(`Base64 dosya kaydedilemedi: ${error.message}`);
    }
  },

  /**
   * Dosya URI'sinin geçerli olup olmadığını kontrol eder
   */
  isValidFileUri: async (uri: string): Promise<boolean> => {
    if (!uri || (!uri.startsWith('file://') && !uri.startsWith('data:'))) {
      return false;
    }

    if (uri.startsWith('data:')) {
      // Data URI için base64 formatını kontrol et
      return uri.includes(',') && uri.split(',')[1].length > 0;
    }

    try {
      const fileInfo = await FileSystem.getInfoAsync(uri);
      return fileInfo.exists;
    } catch {
      return false;
    }
  },
};