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

  /** Geçici bir URI'deki görüntüyü kalıcı olarak ürün klasörüne kaydeder. */
  saveImage: async (productId: string, tempUri: string, newFilename: string): Promise<string> => {
    const productDir = fileSystemManager.getProductDirectory(productId);
    await fileSystemManager.createProductDirectory(productId); // Klasörün varlığından emin ol
    
    const permanentUri = `${productDir}${newFilename}`;
    await FileSystem.copyAsync({ from: tempUri, to: permanentUri });
    return permanentUri;
  },

  /** Bir dosyayı siler. */
  deleteImage: async (fileUri: string): Promise<void> => {
    if (!fileUri || !fileUri.startsWith('file://')) return;
    await FileSystem.deleteAsync(fileUri, { idempotent: true });
  },

  /** Bir ürünün tüm dosyalarıyla birlikte klasörünü siler. */
  deleteProductDirectory: async (productId: string) => {
    const dir = fileSystemManager.getProductDirectory(productId);
    console.log(`'${productId}' ürününün klasörü siliniyor: ${dir}`);
    await FileSystem.deleteAsync(dir, { idempotent: true });
  },
};