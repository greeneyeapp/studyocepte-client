// stores/useProductStore.ts - YÜKSEK KALİTE THUMBNAIL VERSİYON
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, apiUtils } from '@/services/api';
import { fileSystemManager } from '@/services/fileSystemManager';
import { imageProcessor } from '@/services/imageProcessor';
import i18n from '@/i18n'; // i18n import edildi

export interface ProductPhoto {
  id: string;
  productId: string;
  originalUri: string;
  thumbnailUri: string;
  processedUri?: string;
  status: 'raw' | 'processing' | 'processed';
  createdAt: string;
  modifiedAt: string;
  editorSettings?: any;
}

export interface Product {
  id: string;
  name: string;
  photos: ProductPhoto[];
  createdAt: string;
  modifiedAt: string;
}

interface ProductStore {
  products: Product[];
  error: string | null;
  isOnline: boolean;
  currentLanguage: string;

  loadProducts: () => Promise<void>;
  createProduct: (name: string) => Promise<Product>;
  deleteProduct: (productId: string) => Promise<void>;
  updateProductName: (productId: string, name: string) => Promise<void>;
  addMultiplePhotos: (productId: string, imageUris: string[]) => Promise<boolean>;
  deletePhoto: (productId: string, photoId: string) => Promise<void>;
  removeMultipleBackgrounds: (productId: string, photoIds: string[]) => Promise<boolean>;
  getProductById: (productId: string) => Product | undefined;
  updatePhotoSettings: (productId: string, photoId: string, settings: any) => void;
  removeSingleBackground: (productId: string, photoId: string) => Promise<boolean>;
  updatePhotoThumbnail: (productId: string, photoId: string, newThumbnailUri: string) => void;
  checkNetworkStatus: () => Promise<void>;
  changeLanguage: (lang: string) => void;
}

const STORAGE_KEY = 'studyo_products';

export const useProductStore = create<ProductStore>((set, get) => ({
  products: [],
  error: null,
  isOnline: true,
  currentLanguage: i18n.language || 'tr',

  loadProducts: async () => {
    set({ error: null });
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      let products: Product[] = stored ? JSON.parse(stored) : [];

      let hasChanges = false;

      for (const product of products) {
        for (const photo of product.photos) {
          if (photo.originalUri) {
            const validatedUri = await imageProcessor.validateAndRecoverFile(photo.originalUri);
            if (!validatedUri) {
              console.warn(i18n.t('products.missingOriginalFileLog'), photo.id); // Çeviri anahtarı kullanıldı
              if (photo.processedUri) {
                photo.originalUri = photo.processedUri;
                hasChanges = true;
              }
            }
          }

          if (photo.thumbnailUri) {
            const validatedThumbnail = await imageProcessor.validateAndRecoverFile(photo.thumbnailUri);
            if (!validatedThumbnail) {
              console.warn(i18n.t('products.missingThumbnailLog'), photo.id); // Çeviri anahtarı kullanıldı
              try {
                const sourceUri = photo.processedUri || photo.originalUri;
                if (sourceUri) {
                  const newThumbnail = await imageProcessor.createThumbnail(sourceUri, 'png');
                  photo.thumbnailUri = newThumbnail;
                  hasChanges = true;
                  console.log(i18n.t('products.thumbnailRecreatedLog'), photo.id); // Çeviri anahtarı kullanıldı
                }
              } catch (error) {
                console.error(i18n.t('products.failedToRecreateThumbnailLog'), photo.id, error); // Çeviri anahtarı kullanıldı
              }
            }
          }

          if (photo.processedUri) {
            const validatedProcessed = await imageProcessor.validateAndRecoverFile(photo.processedUri);
            if (!validatedProcessed) {
              console.warn(i18n.t('products.missingProcessedFileLog'), photo.id); // Çeviri anahtarı kullanıldı
              photo.status = 'raw';
              photo.processedUri = undefined;
              hasChanges = true;
            }
          }
        }
      }

      if (hasChanges) {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(products));
        console.log(i18n.t('products.productStorageUpdatedLog')); // Çeviri anahtarı kullanıldı
      }

      set({ products });
    } catch (error: any) {
      const errorMessage = apiUtils.extractErrorMessage(error);
      set({ error: errorMessage });
      throw error;
    }
  },

  createProduct: async (name: string): Promise<Product> => {
    try {
      const newProduct: Product = {
        id: `product_${Date.now()}`,
        name,
        photos: [],
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString(),
      };

      await fileSystemManager.createProductDirectory(newProduct.id);
      const updatedProducts = [...get().products, newProduct];
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProducts));
      set({ products: updatedProducts });
      return newProduct;
    } catch (error: any) {
      const errorMessage = apiUtils.extractErrorMessage(error);
      set({ error: errorMessage });
      throw error;
    }
  },

  deleteProduct: async (productId: string) => {
    try {
      await fileSystemManager.deleteProductDirectory(productId);
      const updatedProducts = get().products.filter(p => p.id !== productId);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProducts));
      set({ products: updatedProducts });
    } catch (error: any) {
      const errorMessage = apiUtils.extractErrorMessage(error);
      set({ error: errorMessage });
      throw error;
    }
  },

  updateProductName: async (productId, name) => {
    try {
      const updatedProducts = get().products.map(p =>
        p.id === productId ? { ...p, name, modifiedAt: new Date().toISOString() } : p
      );
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProducts));
      set({ products: updatedProducts });
    } catch (error: any) {
      const errorMessage = apiUtils.extractErrorMessage(error);
      set({ error: errorMessage });
      throw error;
    }
  },

  addMultiplePhotos: async (productId, imageUris) => {
    try {
      const product = get().products.find(p => p.id === productId);
      if (!product) throw new Error(i18n.t('api.error.productNotFound')); // Çeviri anahtarı kullanıldı

      const newPhotos: ProductPhoto[] = [];
      for (const uri of imageUris) {
        const photoId = `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const originalFilename = `original_${photoId}.jpg`;
        const originalUri = await fileSystemManager.saveImage(productId, uri, originalFilename);
        
        const thumbnailUri = await imageProcessor.createThumbnail(originalUri, 'png');
        
        console.log(i18n.t('products.pngThumbnailCreatedLog'), photoId); // Çeviri anahtarı kullanıldı

        newPhotos.push({
          id: photoId,
          productId,
          originalUri,
          thumbnailUri,
          status: 'raw',
          createdAt: new Date().toISOString(),
          modifiedAt: new Date().toISOString(),
        });
      }

      const updatedProducts = get().products.map(p =>
        p.id === productId ? {
          ...p,
          photos: [...p.photos, ...newPhotos],
          modifiedAt: new Date().toISOString()
        } : p
      );

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProducts));
      set({ products: updatedProducts });
      return true;
    } catch (error: any) {
      const errorMessage = apiUtils.extractErrorMessage(error);
      set({ error: errorMessage });
      return false;
    }
  },

  deletePhoto: async (productId, photoId) => {
    try {
      const product = get().products.find(p => p.id === productId);
      const photo = product?.photos.find(p => p.id === photoId);

      if (photo) {
        await fileSystemManager.deleteImage(photo.originalUri);
        if (photo.processedUri) await fileSystemManager.deleteImage(photo.processedUri);
        await fileSystemManager.deleteImage(photo.thumbnailUri);
      }

      const updatedProducts = get().products.map(p =>
        p.id === productId ? {
          ...p,
          photos: p.photos.filter(ph => ph.id !== photoId),
          modifiedAt: new Date().toISOString()
        } : p
      );

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProducts));
      set({ products: updatedProducts });
    } catch (error: any) {
      const errorMessage = apiUtils.extractErrorMessage(error);
      set({ error: errorMessage });
      throw error;
    }
  },

  removeMultipleBackgrounds: async (productId, photoIds) => {
    const isOnline = await apiUtils.checkNetworkConnection();
    if (!isOnline) {
      set({
        error: i18n.t('api.error.internetRequired'), // Çeviri anahtarı kullanıldı
        isOnline: false
      });
      return false;
    }

    set({ error: null, isOnline: true });

    const originalProductsState = JSON.parse(JSON.stringify(get().products));

    try {
      const tempProducts = JSON.parse(JSON.stringify(get().products));
      const product = tempProducts.find(p => p.id === productId);
      if (!product) throw new Error(i18n.t('api.error.productNotFound')); // Çeviri anahtarı kullanıldı

      const photosToProcess = product.photos.filter(p =>
        photoIds.includes(p.id) && p.status === 'raw'
      );

      if (photosToProcess.length === 0) {
        return true;
      }

      photosToProcess.forEach(p => { p.status = 'processing'; });
      // UI'da "işleniyor" durumunu hemen göstermek için state'i güncelliyoruz
      set({ products: tempProducts });

      const currentLang = get().currentLanguage;
      const apiPayload = photosToProcess.map(p => ({
        filename: `${p.id}.jpg`,
        uri: p.originalUri
      }));

      const result = await api.removeMultipleBackgrounds(apiPayload, currentLang);

      // API'den dönen veriye göre gerçek ürünler state'ini güncelliyoruz
      const finalProducts = JSON.parse(JSON.stringify(get().products));
      const targetProduct = finalProducts.find(p => p.id === productId);
      if (!targetProduct) throw new Error(i18n.t('api.error.productNotFoundPostProcess')); // Çeviri anahtarı kullanıldı

      let successCount = 0;

      for (const [id, value] of Object.entries(result.success)) {
        const photoId = id.replace('.jpg', '');
        const photo = targetProduct.photos.find(p => p.id === photoId);
        if (photo) {
          let base64String: string;

          // API'den gelen base64 verisinin tipini kontrol et ve doğru şekilde çıkar.
          // Eğer API processed_image'ı bir objenin içinde döndürüyorsa bu şekilde erişilir.
          if (typeof value === 'object' && value !== null) {
            if (typeof (value as any).processed_image === 'string') {
              base64String = (value as any).processed_image;
            } else if (typeof (value as any).data === 'string') {
              base64String = (value as any).data;
            } else {
              console.error(i18n.t('products.unexpectedBase64FormatLog'), photoId, value);
              photo.status = 'raw'; // Hata durumunda fotoğrafı ham duruma geri döndür
              continue; // Bu fotoğrafı atla
            }
          } else if (typeof value === 'string') {
            base64String = value;
          } else {
            console.error(i18n.t('products.invalidBase64DataTypeLog'), photoId, typeof value, value);
            photo.status = 'raw';
            continue;
          }
          
          // Çok kısa veya boş base64 verilerini temel kontrol
          // Minimum 100 karakterlik bir Base64 string'i bile boş bir resimdir, ama kontrol için mantıklı bir değer.
          if (!base64String || base64String.length < 100) { 
              console.error(i18n.t('products.base64TooShortLog'), photoId, base64String.substring(0, Math.min(base64String.length, 50)) + '...');
              photo.status = 'raw';
              continue;
          }

          const oldOriginalUri = photo.originalUri;
          const oldThumbnailUri = photo.thumbnailUri;
          const processedFilename = `processed_${photoId}.png`;

          photo.processedUri = await fileSystemManager.saveBase64Image(
            productId,
            base64String, // Düzeltilmiş base64 string'ini kullan
            processedFilename
          );
          photo.originalUri = photo.processedUri;
          
          photo.thumbnailUri = await imageProcessor.createThumbnail(photo.processedUri, 'png');
          console.log(i18n.t('products.pngThumbnailCreatedProcessedLog'), photoId);
          
          photo.status = 'processed';
          photo.modifiedAt = new Date().toISOString();

          // Eski dosyaları siliyoruz
          await fileSystemManager.deleteImage(oldOriginalUri);
          await fileSystemManager.deleteImage(oldThumbnailUri);
          successCount++;
        }
      }

      // Hata alan fotoğrafları "raw" durumuna geri çekiyoruz
      for (const [id] of Object.entries(result.errors)) {
        const photoId = id.replace('.jpg', '');
        const photo = targetProduct.photos.find(p => p.id === photoId);
        if (photo) photo.status = 'raw';
      }

      targetProduct.modifiedAt = new Date().toISOString();
      set({ products: finalProducts, isOnline: true });
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(finalProducts));

      return successCount > 0;

    } catch (error: any) {
      console.error(i18n.t('products.removeMultipleBackgroundsErrorLog'), error);
      const errorMessage = apiUtils.extractErrorMessage(error);

      const isNetworkError = errorMessage.includes(i18n.t('api.error.networkKeyword1')) ||
        errorMessage.includes(i18n.t('api.error.networkKeyword2')) ||
        errorMessage.includes(i18n.t('api.error.timeoutKeyword'));

      // Hata durumunda "işleniyor" olarak işaretlenen tüm fotoğrafları geri alıyoruz
      const revertedProducts = originalProductsState.map((p: Product) =>
        p.id === productId ? {
          ...p,
          photos: p.photos.map(ph =>
            photoIds.includes(ph.id) && ph.status === 'processing' ? { ...ph, status: 'raw' as const } : ph
          )
        } : p
      );

      set({
        error: errorMessage,
        products: revertedProducts,
        isOnline: !isNetworkError
      });

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(revertedProducts));
      return false;
    }
  },

  removeSingleBackground: async (productId: string, photoId: string) => {
    const isOnline = await apiUtils.checkNetworkConnection();
    if (!isOnline) {
      set({
        error: i18n.t('api.error.internetRequired'), // Çeviri anahtarı kullanıldı
        isOnline: false
      });
      return false;
    }

    set({ error: null, isOnline: true });

    try {
      const product = get().products.find(p => p.id === productId);
      const photo = product?.photos.find(p => p.id === photoId);

      if (!product || !photo) {
        throw new Error(i18n.t('api.error.productPhotoNotFound')); // Çeviri anahtarı kullanıldı
      }

      if (photo.status !== 'raw') {
        return true;
      }

      const tempProducts = get().products.map(p =>
        p.id === productId ? {
          ...p,
          photos: p.photos.map(ph =>
            ph.id === photoId ? { ...ph, status: 'processing' as const } : ph
          )
        } : p
      );
      set({ products: tempProducts });

      const currentLang = get().currentLanguage;
      const base64Data = await api.removeSingleBackground({
        filename: `${photoId}.jpg`,
        uri: photo.originalUri
      }, currentLang);

      const finalProducts = get().products.map(p =>
        p.id === productId ? {
          ...p,
          photos: p.photos.map(ph => {
            if (ph.id === photoId) {
              return {
                ...ph,
                status: 'processed' as const,
                modifiedAt: new Date().toISOString()
              };
            }
            return ph;
          }),
          modifiedAt: new Date().toISOString()
        } : p
      );

      const updatedProduct = finalProducts.find(p => p.id === productId);
      const updatedPhoto = updatedProduct?.photos.find(p => p.id === photoId);

      if (updatedPhoto) {
        const oldOriginalUri = updatedPhoto.originalUri;
        const oldThumbnailUri = updatedPhoto.thumbnailUri;
        const processedFilename = `processed_${photoId}.png`;

        updatedPhoto.processedUri = await fileSystemManager.saveBase64Image(
          productId,
          base64Data,
          processedFilename
        );
        updatedPhoto.originalUri = updatedPhoto.processedUri;
        
        updatedPhoto.thumbnailUri = await imageProcessor.createThumbnail(
          updatedPhoto.processedUri,
          'png'
        );
        console.log(i18n.t('products.pngThumbnailCreatedSingleProcessedLog'), photoId); // Çeviri anahtarı kullanıldı

        await fileSystemManager.deleteImage(oldOriginalUri);
        await fileSystemManager.deleteImage(oldThumbnailUri);
      }

      set({ products: finalProducts, isOnline: true });
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(finalProducts));

      return true;

    } catch (error: any) {
      console.error(i18n.t('products.removeSingleBackgroundErrorLog'), error); // Çeviri anahtarı kullanıldı
      const errorMessage = apiUtils.extractErrorMessage(error);

      const isNetworkError = errorMessage.includes(i18n.t('api.error.networkKeyword1')) ||
        errorMessage.includes(i18n.t('api.error.networkKeyword2')) ||
        errorMessage.includes(i18n.t('api.error.timeoutKeyword')); // Çeviri anahtarı kullanıldı

      const revertedProducts = get().products.map(p =>
        p.id === productId ? {
          ...p,
          photos: p.photos.map(ph =>
            ph.id === photoId ? { ...ph, status: 'raw' as const } : ph
          )
        } : p
      );

      set({
        error: errorMessage,
        products: revertedProducts,
        isOnline: !isNetworkError
      });

      return false;
    }
  },

  updatePhotoSettings: (productId, photoId, settings) => {
    const updatedProducts = get().products.map(p => {
      if (p.id === productId) {
        return {
          ...p,
          photos: p.photos.map(photo =>
            photo.id === photoId ? {
              ...photo,
              editorSettings: settings,
              modifiedAt: new Date().toISOString()
            } : photo
          ),
          modifiedAt: new Date().toISOString()
        };
      }
      return p;
    });
    set({ products: updatedProducts });
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProducts));
  },

  updatePhotoThumbnail: async (productId: string, photoId: string, newThumbnailUri: string) => {
    console.log(i18n.t('products.startingThumbnailUpdateLog'), { productId, photoId, newThumbnailUri }); // Çeviri anahtarı kullanıldı

    const currentProducts = get().products;
    const currentProduct = currentProducts.find(p => p.id === productId);
    const currentPhoto = currentProduct?.photos.find(p => p.id === photoId);
    const oldThumbnailUri = currentPhoto?.thumbnailUri;

    const cacheBustedUri = imageProcessor.createStrongCacheBustedUri(newThumbnailUri);

    const updatedProducts = currentProducts.map(p => {
      if (p.id === productId) {
        return {
          ...p,
          photos: p.photos.map(photo =>
            photo.id === photoId ? {
              ...photo,
              thumbnailUri: cacheBustedUri,
              modifiedAt: new Date().toISOString()
            } : photo
          ),
          modifiedAt: new Date().toISOString()
        };
      }
      return p;
    });

    set({ products: updatedProducts });

    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProducts));
      console.log(i18n.t('products.asyncStorageUpdatedLog')); // Çeviri anahtarı kullanıldı

      if (oldThumbnailUri && oldThumbnailUri !== newThumbnailUri) {
        try {
          const cleanOldUri = oldThumbnailUri.split('?')[0];
          await fileSystemManager.deleteImage(cleanOldUri);
          console.log(i18n.t('products.oldThumbnailDeletedLog'), cleanOldUri); // Çeviri anahtarı kullanıldı
        } catch (deleteError) {
          console.warn(i18n.t('products.oldThumbnailDeletionFailedLog'), deleteError); // Çeviri anahtarı kullanıldı
        }
      }

      setTimeout(async () => {
        try {
          await imageProcessor.clearImageCache();
          const currentState = get();
          set({
            products: [...currentState.products]
          });
          
          console.log(i18n.t('products.strongCacheInvalidationCompletedLog')); // Çeviri anahtarı kullanıldı
        } catch (cacheError) {
          console.warn(i18n.t('common.cacheInvalidationWarning'), cacheError); // Çeviri anahtarı kullanıldı
        }
      }, 100);

    } catch (storageError: any) {
      console.error(i18n.t('products.asyncStorageUpdateFailedLog'), storageError); // Çeviri anahtarı kullanıldı
      set({ products: currentProducts });
      throw new Error(`${i18n.t('products.updateThumbnailStorageFailed')}${storageError.message}`); // Çeviri anahtarı kullanıldı
    }

    console.log(i18n.t('products.photoThumbnailUpdateCompletedLog'), { // Çeviri anahtarı kullanıldı
      productId,
      photoId,
      oldUri: oldThumbnailUri,
      newUri: cacheBustedUri
    });
  },

  getProductById: (productId) => get().products.find(p => p.id === productId),

  checkNetworkStatus: async () => {
    try {
      const isOnline = await apiUtils.checkNetworkConnection();
      set({ isOnline });

      if (!isOnline && get().error === null) {
        set({ error: i18n.t('api.error.noInternet') }); // Çeviri anahtarı kullanıldı
      } else if (isOnline && get().error?.includes(i18n.t('api.error.internetKeyword'))) { // Çeviri anahtarı kullanıldı
        set({ error: null });
      }
    } catch (error) {
      set({ isOnline: false });
    }
  },

  changeLanguage: (lang: string) => {
    set({ currentLanguage: lang });
  },
}));