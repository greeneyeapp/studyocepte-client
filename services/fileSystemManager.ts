// services/fileSystemManager.ts - DATA URI DESTEKLİ VERSİYON (ÇEVİRİ ANAHTARLARI KULLANILDI)
import * as FileSystem from 'expo-file-system';
import i18n from '@/i18n'; // i18n import edildi

const productsDir = FileSystem.documentDirectory + 'products/';

const ensureBaseDirExists = async () => {
  const dirInfo = await FileSystem.getInfoAsync(productsDir);
  if (!dirInfo.exists) {
    console.log(i18n.t('filesystem.creatingProductFolder')); // Çeviri anahtarı kullanıldı
    await FileSystem.makeDirectoryAsync(productsDir, { intermediates: true });
  }
};

ensureBaseDirExists();

export const fileSystemManager = {
  getProductDirectory: (productId: string) => `${productsDir}${productId}/`,

  createProductDirectory: async (productId: string): Promise<string> => {
    const dir = fileSystemManager.getProductDirectory(productId);
    await ensureBaseDirExists();
    const dirInfo = await FileSystem.getInfoAsync(dir);
    if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
    }
    return dir;
  },

  saveImage: async (productId: string, sourceUri: string, newFilename: string): Promise<string> => {
    const productDir = fileSystemManager.getProductDirectory(productId);
    await fileSystemManager.createProductDirectory(productId);
    
    const permanentUri = `${productDir}${newFilename}`;

    try {
      if (sourceUri.startsWith('data:')) {
        console.log(i18n.t('filesystem.dataUriDetectedLog')); // Çeviri anahtarı kullanıldı
        
        const base64Data = sourceUri.split(',')[1];
        if (!base64Data) {
          throw new Error(i18n.t('filesystem.invalidDataUri')); // Çeviri anahtarı kullanıldı
        }
        
        await FileSystem.writeAsStringAsync(permanentUri, base64Data, {
          encoding: FileSystem.EncodingType.Base64,
        });
        
        console.log(i18n.t('filesystem.dataUriSavedLog'), permanentUri); // Çeviri anahtarı kullanıldı
      } else {
        console.log(i18n.t('filesystem.fileUriDetectedLog')); // Çeviri anahtarı kullanıldı
        await FileSystem.copyAsync({ from: sourceUri, to: permanentUri });
        console.log(i18n.t('filesystem.fileCopiedLog'), permanentUri); // Çeviri anahtarı kullanıldı
      }

      const fileInfo = await FileSystem.getInfoAsync(permanentUri);
      if (!fileInfo.exists) {
        throw new Error(i18n.t('filesystem.fileSaveCheckFailed')); // Çeviri anahtarı kullanıldı
      }
      
      console.log(i18n.t('filesystem.fileInfoLog'), { // Çeviri anahtarı kullanıldı
        uri: permanentUri,
        size: fileInfo.size,
        exists: fileInfo.exists
      });

      return permanentUri;
      
    } catch (error: any) {
      console.error(i18n.t('filesystem.fileSaveErrorLog'), error.message); // Çeviri anahtarı kullanıldı
      console.error(i18n.t('filesystem.errorDetailsLog'), { // Çeviri anahtarı kullanıldı
        productId,
        sourceUri: sourceUri.substring(0, 100) + '...',
        newFilename,
        permanentUri
      });
      throw new Error(`${i18n.t('filesystem.fileSaveFailed')}${error.message}`); // Çeviri anahtarı kullanıldı
    }
  },

  deleteImage: async (fileUri: string): Promise<void> => {
    if (!fileUri || !fileUri.startsWith('file://')) {
      console.warn(i18n.t('filesystem.invalidFileUriSkipDelete'), fileUri); // Çeviri anahtarı kullanıldı
      return;
    }
    
    try {
      await FileSystem.deleteAsync(fileUri, { idempotent: true });
      console.log(i18n.t('filesystem.fileDeletedLog'), fileUri); // Çeviri anahtarı kullanıldı
    } catch (error: any) {
      console.error(i18n.t('filesystem.fileDeleteError'), error.message); // Çeviri anahtarı kullanıldı
    }
  },

  deleteProductDirectory: async (productId: string) => {
    const dir = fileSystemManager.getProductDirectory(productId);
    console.log(i18n.t('filesystem.deletingProductFolderLog', { productId, dir })); // Çeviri anahtarı kullanıldı
    
    try {
      await FileSystem.deleteAsync(dir, { idempotent: true });
      console.log(i18n.t('filesystem.productFolderDeletedSuccessLog')); // Çeviri anahtarı kullanıldı
    } catch (error: any) {
      console.error(i18n.t('filesystem.productFolderDeleteError'), error.message); // Çeviri anahtarı kullanıldı
    }
  },

  saveBase64Image: async (productId: string, base64Data: string, filename: string): Promise<string> => {
    const productDir = fileSystemManager.getProductDirectory(productId);
    await fileSystemManager.createProductDirectory(productId);
    
    const permanentUri = `${productDir}${filename}`;

    try {
      console.log(i18n.t('filesystem.savingBase64ToFileLog'), { // Çeviri anahtarı kullanıldı
        filename,
        dataSize: base64Data.length
      });

      await FileSystem.writeAsStringAsync(permanentUri, base64Data, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const fileInfo = await FileSystem.getInfoAsync(permanentUri);
      if (!fileInfo.exists) {
        throw new Error(i18n.t('filesystem.base64SaveCheckFailed')); // Çeviri anahtarı kullanıldı
      }

      console.log(i18n.t('filesystem.base64FileSavedLog'), { // Çeviri anahtarı kullanıldı
        uri: permanentUri,
        size: fileInfo.size
      });

      return permanentUri;

    } catch (error: any) {
      console.error(i18n.t('filesystem.base64SaveErrorLog'), error.message); // Çeviri anahtarı kullanıldı
      throw new Error(`${i18n.t('filesystem.base64SaveFailed')}${error.message}`); // Çeviri anahtarı kullanıldı
    }
  },

  isValidFileUri: async (uri: string): Promise<boolean> => {
    if (!uri || (!uri.startsWith('file://') && !uri.startsWith('data:'))) {
      return false;
    }

    if (uri.startsWith('data:')) {
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