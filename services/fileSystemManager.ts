import * as FileSystem from 'expo-file-system';
import i18n from '@/i18n';

const productsDir = FileSystem.documentDirectory + 'products/';

const ensureBaseDirExists = async () => {
  const dirInfo = await FileSystem.getInfoAsync(productsDir);
  if (!dirInfo.exists) {
    console.log(i18n.t('filesystem.creatingProductFolder'));
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
        console.log(i18n.t('filesystem.dataUriDetectedLog'));
        
        const base64Data = sourceUri.split(',')[1];
        if (!base64Data) {
          throw new Error(i18n.t('filesystem.invalidDataUri'));
        }
        
        await FileSystem.writeAsStringAsync(permanentUri, base64Data, {
          encoding: FileSystem.EncodingType.Base64,
        });
        
        console.log(i18n.t('filesystem.dataUriSavedLog'), permanentUri);
      } else {
        console.log(i18n.t('filesystem.fileUriDetectedLog'));
        await FileSystem.copyAsync({ from: sourceUri, to: permanentUri });
        console.log(i18n.t('filesystem.fileCopiedLog'), permanentUri);
      }

      const fileInfo = await FileSystem.getInfoAsync(permanentUri);
      if (!fileInfo.exists) {
        throw new Error(i18n.t('filesystem.fileSaveCheckFailed'));
      }
      
      console.log(i18n.t('filesystem.fileInfoLog'), {
        uri: permanentUri,
        size: fileInfo.size,
        exists: fileInfo.exists
      });

      return permanentUri;
      
    } catch (error: any) {
      console.error(i18n.t('filesystem.fileSaveErrorLog'), error.message);
      console.error(i18n.t('filesystem.errorDetailsLog'), {
        productId,
        sourceUri: sourceUri.substring(0, Math.min(sourceUri.length, 100)) + '...',
        newFilename,
        permanentUri
      });
      throw new Error(`${i18n.t('filesystem.fileSaveFailed')}${error.message}`);
    }
  },

  deleteImage: async (fileUri: string): Promise<void> => {
    if (!fileUri || (!fileUri.startsWith('file://') && !fileUri.startsWith('content://') && !fileUri.startsWith('data:'))) {
      console.warn(i18n.t('filesystem.invalidFileUriSkipDelete'), fileUri);
      return;
    }
    
    try {
      await FileSystem.deleteAsync(fileUri, { idempotent: true });
      console.log(i18n.t('filesystem.fileDeletedLog'), fileUri);
    } catch (error: any) {
      console.error(i18n.t('filesystem.fileDeleteError'), error.message);
    }
  },

  deleteProductDirectory: async (productId: string) => {
    const dir = fileSystemManager.getProductDirectory(productId);
    console.log(i18n.t('filesystem.deletingProductFolderLog', { productId, dir }));
    
    try {
      await FileSystem.deleteAsync(dir, { idempotent: true });
      console.log(i18n.t('filesystem.productFolderDeletedSuccessLog'));
    } catch (error: any) {
      console.error(i18n.t('filesystem.productFolderDeleteError'), error.message);
    }
  },

  saveBase64Image: async (productId: string, base64Data: string, filename: string): Promise<string> => {
    const productDir = fileSystemManager.getProductDirectory(productId);
    await fileSystemManager.createProductDirectory(productId);
    
    const permanentUri = `${productDir}${filename}`;

    try {
      console.log(i18n.t('filesystem.savingBase64ToFileLog'), {
        filename,
        dataSize: base64Data.length
      });

      await FileSystem.writeAsStringAsync(permanentUri, base64Data, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const fileInfo = await FileSystem.getInfoAsync(permanentUri);
      if (!fileInfo.exists) {
        throw new Error(i18n.t('filesystem.base64SaveCheckFailed'));
      }

      console.log(i18n.t('filesystem.base64FileSavedLog'), {
        uri: permanentUri,
        size: fileInfo.size
      });

      return permanentUri;

    } catch (error: any) {
      console.error(i18n.t('filesystem.base64SaveErrorLog'), error.message);
      throw new Error(`${i18n.t('filesystem.base64SaveFailed')}${error.message}`);
    }
  },

  isValidFileUri: async (uri: string): Promise<boolean> => {
    if (!uri || (!uri.startsWith('file://') && !uri.startsWith('data:') && !uri.startsWith('content://'))) {
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