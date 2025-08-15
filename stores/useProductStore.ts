// stores/useProductStore.ts - YÜKSEK KALİTE THUMBNAIL VERSİYON
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, apiUtils } from '@/services/api';
import { fileSystemManager } from '@/services/fileSystemManager';
import { imageProcessor } from '@/services/imageProcessor';
import i18n from '@/i18n'; // i18n import edildi
import { memoryManager } from '@/services/memoryManager'; // memoryManager import edildi

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

      // Her ürün ve fotoğraf için geçerliliği kontrol et ve düzelt
      for (const product of products) {
        for (const photo of product.photos) {
          // Orijinal URI kontrolü
          if (photo.originalUri) {
            const validatedUri = await imageProcessor.validateAndRecoverFile(photo.originalUri);
            if (!validatedUri) {
              console.warn(i18n.t('products.missingOriginalFileLog'), photo.id);
              // Eğer processedUri varsa onu originalUri olarak kullan, yoksa raw durumuna çek
              if (photo.processedUri) {
                photo.originalUri = photo.processedUri;
                hasChanges = true;
              } else {
                photo.status = 'raw';
                hasChanges = true;
              }
            }
          }

          // Thumbnail URI kontrolü
          if (photo.thumbnailUri) {
            const validatedThumbnail = await imageProcessor.validateAndRecoverFile(photo.thumbnailUri);
            if (!validatedThumbnail) {
              console.warn(i18n.t('products.missingThumbnailLog'), photo.id);
              try {
                const sourceUri = photo.processedUri || photo.originalUri;
                if (sourceUri) {
                  const newThumbnail = await imageProcessor.createThumbnail(sourceUri, 'jpeg'); // JPEG olarak oluştur
                  photo.thumbnailUri = newThumbnail;
                  hasChanges = true;
                  console.log(i18n.t('products.thumbnailRecreatedLog'), photo.id);
                }
              } catch (error) {
                console.error(i18n.t('products.failedToRecreateThumbnailLog'), photo.id, error);
              }
            }
          }

          // İşlenmiş URI kontrolü
          if (photo.processedUri) {
            const validatedProcessed = await imageProcessor.validateAndRecoverFile(photo.processedUri);
            if (!validatedProcessed) {
              console.warn(i18n.t('products.missingProcessedFileLog'), photo.id);
              photo.status = 'raw';
              photo.processedUri = undefined;
              hasChanges = true;
            }
          }
        }
      }

      if (hasChanges) {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(products));
        console.log(i18n.t('products.productStorageUpdatedLog'));
      }

      set({ products });
      await memoryManager.cleanup(); // Ürünler yüklendikten sonra bellek temizliği
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
      await memoryManager.queue.addOperation(`delete-product-${productId}`, async () => {
        await fileSystemManager.deleteProductDirectory(productId);
        const updatedProducts = get().products.filter(p => p.id !== productId);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProducts));
        set({ products: updatedProducts });
      });
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

  // ⭐ ÇÖZÜM 1: addMultiplePhotos sıralı işleniyor
  addMultiplePhotos: async (productId, imageUris) => {
    try {
      const product = get().products.find(p => p.id === productId);
      if (!product) throw new Error(i18n.t('api.error.productNotFound'));

      const newPhotos: ProductPhoto[] = [];
      const currentProductsState = get().products; // Mevcut state'in bir kopyasını al

      for (const uri of imageUris) {
        const photoId = `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const originalFilename = `original_${photoId}.jpeg`; // JPEG olarak kaydet
        
        await memoryManager.queue.addOperation(`add-photo-${photoId}`, async () => {
          const originalUri = await fileSystemManager.saveImage(productId, uri, originalFilename);
          const thumbnailUri = await imageProcessor.createThumbnail(originalUri, 'jpeg'); // JPEG olarak oluştur
          
          console.log(i18n.t('products.pngThumbnailCreatedLog'), photoId); // Log mesajını düzelt
          
          const newPhoto: ProductPhoto = {
            id: photoId,
            productId,
            originalUri,
            thumbnailUri,
            status: 'raw',
            createdAt: new Date().toISOString(),
            modifiedAt: new Date().toISOString(),
          };
          newPhotos.push(newPhoto);

          // Her fotoğraf eklendiğinde state'i ve AsyncStorage'ı güncelle
          const updatedProducts = currentProductsState.map(p =>
            p.id === productId ? {
              ...p,
              photos: [...p.photos, newPhoto],
              modifiedAt: new Date().toISOString()
            } : p
          );
          set({ products: updatedProducts });
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProducts));
        });
      }
      return true;
    } catch (error: any) {
      const errorMessage = apiUtils.extractErrorMessage(error);
      set({ error: errorMessage });
      return false;
    }
  },

  deletePhoto: async (productId, photoId) => {
    try {
      await memoryManager.queue.addOperation(`delete-photo-${photoId}`, async () => {
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
      });
    } catch (error: any) {
      const errorMessage = apiUtils.extractErrorMessage(error);
      set({ error: errorMessage });
      throw error;
    }
  },

  // ⭐ ÇÖZÜM 5: Batch işlemleri kilit altında ve sıralı yapılıyor
  removeMultipleBackgrounds: async (productId, photoIds) => {
    const isOnline = await apiUtils.checkNetworkConnection();
    if (!isOnline) {
      set({
        error: i18n.t('api.error.internetRequired'),
        isOnline: false
      });
      return false;
    }

    set({ error: null, isOnline: true });

    // İşlem başlamadan önceki ürün durumunu yedekle
    const originalProductsState = JSON.parse(JSON.stringify(get().products));

    try {
      return await memoryManager.critical.withLock('remove-background-batch', async () => {
        const product = get().products.find(p => p.id === productId);
        if (!product) throw new Error(i18n.t('api.error.productNotFound'));

        const photosToProcess = product.photos.filter(p =>
          photoIds.includes(p.id) && p.status === 'raw'
        );

        if (photosToProcess.length === 0) {
          return true; // İşlenecek fotoğraf yoksa başarılı say
        }

        // UI'da "işleniyor" durumunu hemen göstermek için state'i güncelliyoruz
        set(state => ({
          products: state.products.map(p =>
            p.id === productId ? {
              ...p,
              photos: p.photos.map(ph =>
                photoIds.includes(ph.id) && ph.status === 'raw' ? { ...ph, status: 'processing' as const } : ph
              )
            } : p
          )
        }));

        const currentLang = get().currentLanguage;
        const apiPayload = photosToProcess.map(p => ({
          filename: `${p.id}.jpeg`, // JPEG olarak gönder
          uri: p.originalUri
        }));

        const result = await api.removeMultipleBackgrounds(apiPayload, currentLang);

        let successCount = 0;
        const processedPhotoUpdates: { photoId: string, base64Data: string }[] = [];
        const failedPhotoIds: string[] = [];

        for (const [id, value] of Object.entries(result.success)) {
          const photoId = id.replace('.jpeg', ''); // ID'yi jpeg'den temizle
          let base64String: string;

          if (typeof value === 'object' && value !== null) {
            if (typeof (value as any).processed_image === 'string') {
              base64String = (value as any).processed_image;
            } else if (typeof (value as any).data === 'string') {
              base64String = (value as any).data;
            } else {
              console.error(i18n.t('products.unexpectedBase64FormatLog'), photoId, value);
              failedPhotoIds.push(photoId);
              continue;
            }
          } else if (typeof value === 'string') {
            base64String = value;
          } else {
            console.error(i18n.t('products.invalidBase64DataTypeLog'), photoId, typeof value, value);
            failedPhotoIds.push(photoId);
            continue;
          }
          
          if (!base64String || base64String.length < 100) { 
              console.error(i18n.t('products.base64TooShortLog'), photoId, base64String.substring(0, Math.min(base64String.length, 50)) + '...');
              failedPhotoIds.push(photoId);
              continue;
          }
          processedPhotoUpdates.push({ photoId, base64Data: base64String });
        }

        for (const [id] of Object.entries(result.errors)) {
          failedPhotoIds.push(id.replace('.jpeg', ''));
        }

        // Tüm dosya işlemlerini sıralı olarak kuyruğa ekle
        const updatePromises = processedPhotoUpdates.map(({ photoId, base64Data }) => 
          memoryManager.queue.addOperation(`process-photo-${photoId}`, async () => {
            const currentPhoto = get().products.find(p => p.id === productId)?.photos.find(ph => ph.id === photoId);
            if (!currentPhoto) return;

            const oldOriginalUri = currentPhoto.originalUri;
            const oldThumbnailUri = currentPhoto.thumbnailUri;
            const processedFilename = `processed_${photoId}.png`; // Processed her zaman PNG olabilir

            const processedUri = await fileSystemManager.saveBase64Image(
              productId,
              base64Data,
              processedFilename
            );
            const thumbnailUri = await imageProcessor.createThumbnail(processedUri, 'jpeg'); // Yeni thumbnail JPEG

            set(state => ({
              products: state.products.map(p =>
                p.id === productId ? {
                  ...p,
                  photos: p.photos.map(ph =>
                    ph.id === photoId ? {
                      ...ph,
                      originalUri: processedUri,
                      processedUri: processedUri,
                      thumbnailUri: thumbnailUri,
                      status: 'processed' as const,
                      modifiedAt: new Date().toISOString()
                    } : ph
                  )
                } : p
              )
            }));
            await fileSystemManager.deleteImage(oldOriginalUri);
            await fileSystemManager.deleteImage(oldThumbnailUri);
            successCount++;
          })
        );
        
        // Hata alan fotoğrafları "raw" durumuna geri çek
        failedPhotoIds.forEach(photoId => {
          set(state => ({
            products: state.products.map(p =>
              p.id === productId ? {
                ...p,
                photos: p.photos.map(ph =>
                  ph.id === photoId ? { ...ph, status: 'raw' as const } : ph
                )
              } : p
            )
          }));
        });

        await Promise.all(updatePromises); // Tüm Promise'lerin bitmesini bekle

        // Son state güncellemesi ve AsyncStorage kaydı
        const finalProductsState = get().products.map(p =>
          p.id === productId ? { ...p, modifiedAt: new Date().toISOString() } : p
        );
        set({ products: finalProductsState, isOnline: true });
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(finalProductsState));

        return successCount > 0;
      });
    } catch (error: any) {
      console.error(i18n.t('products.removeMultipleBackgroundsErrorLog'), error);
      const errorMessage = apiUtils.extractErrorMessage(error);

      const isNetworkError = errorMessage.includes(i18n.t('api.error.network')) ||
        errorMessage.includes(i18n.t('api.error.networkKeyword1')) ||
        errorMessage.includes(i18n.t('api.error.networkKeyword2')) ||
        errorMessage.includes(i18n.t('api.error.timeoutKeyword'));

      // Hata durumunda "işleniyor" olarak işaretlenen tüm fotoğrafları geri al
      set(state => ({
        error: errorMessage,
        products: originalProductsState.map((p: Product) =>
          p.id === productId ? {
            ...p,
            photos: p.photos.map(ph =>
              photoIds.includes(ph.id) && ph.status === 'processing' ? { ...ph, status: 'raw' as const } : ph
            )
          } : p
        ),
        isOnline: !isNetworkError
      }));

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(get().products)); // Reverted state'i kaydet
      return false;
    }
  },

  removeSingleBackground: async (productId: string, photoId: string) => {
    const isOnline = await apiUtils.checkNetworkConnection();
    if (!isOnline) {
      set({
        error: i18n.t('api.error.internetRequired'),
        isOnline: false
      });
      return false;
    }

    set({ error: null, isOnline: true });

    // İşlem başlamadan önceki ürün durumunu yedekle
    const originalProductsState = JSON.parse(JSON.stringify(get().products));

    try {
      return await memoryManager.critical.withLock(`remove-background-single-${photoId}`, async () => {
        const product = get().products.find(p => p.id === productId);
        const photo = product?.photos.find(p => p.id === photoId);

        if (!product || !photo) {
          throw new Error(i18n.t('api.error.productPhotoNotFound'));
        }

        if (photo.status !== 'raw') {
          return true; // Zaten işlenmişse başarılı say
        }

        // UI'da "işleniyor" durumunu hemen göstermek için state'i güncelliyoruz
        set(state => ({
          products: state.products.map(p =>
            p.id === productId ? {
              ...p,
              photos: p.photos.map(ph =>
                ph.id === photoId ? { ...ph, status: 'processing' as const } : ph
              )
            } : p
          )
        }));

        const currentLang = get().currentLanguage;
        const base64Data = await api.removeSingleBackground({
          filename: `${photoId}.jpeg`, // JPEG olarak gönder
          uri: photo.originalUri
        }, currentLang);

        // API'den başarılı response geldikten sonra dosya işlemlerini sıralı yap
        return await memoryManager.queue.addOperation(`process-single-photo-${photoId}`, async () => {
          const currentPhotoInState = get().products.find(p => p.id === productId)?.photos.find(ph => ph.id === photoId);
          if (!currentPhotoInState) return false; // Eğer bu noktada fotoğraf state'ten kaybolduysa

          const oldOriginalUri = currentPhotoInState.originalUri;
          const oldThumbnailUri = currentPhotoInState.thumbnailUri;
          const processedFilename = `processed_${photoId}.png`; // Processed her zaman PNG olabilir

          currentPhotoInState.processedUri = await fileSystemManager.saveBase64Image(
            productId,
            base64Data,
            processedFilename
          );
          currentPhotoInState.originalUri = currentPhotoInState.processedUri;
          
          currentPhotoInState.thumbnailUri = await imageProcessor.createThumbnail(
            currentPhotoInState.processedUri,
            'jpeg' // Yeni thumbnail JPEG
          );
          console.log(i18n.t('products.pngThumbnailCreatedSingleProcessedLog'), photoId);

          currentPhotoInState.status = 'processed';
          currentPhotoInState.modifiedAt = new Date().toISOString();

          // Eski dosyaları sil
          await fileSystemManager.deleteImage(oldOriginalUri);
          await fileSystemManager.deleteImage(oldThumbnailUri);

          // State'i güncelle ve kaydet
          set(state => ({
            products: state.products.map(p =>
              p.id === productId ? { ...p, photos: p.photos.map(ph => ph.id === photoId ? currentPhotoInState : ph), modifiedAt: new Date().toISOString() } : p
            ),
            isOnline: true
          }));
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(get().products));
          return true;
        });
      });

    } catch (error: any) {
      console.error(i18n.t('products.removeSingleBackgroundErrorLog'), error);
      const errorMessage = apiUtils.extractErrorMessage(error);

      const isNetworkError = errorMessage.includes(i18n.t('api.error.network')) ||
        errorMessage.includes(i18n.t('api.error.networkKeyword1')) ||
        errorMessage.includes(i18n.t('api.error.networkKeyword2')) ||
        errorMessage.includes(i18n.t('api.error.timeoutKeyword'));

      // Hata durumunda fotoğrafı "raw" durumuna geri al
      set(state => ({
        error: errorMessage,
        products: originalProductsState.map(p =>
          p.id === productId ? {
            ...p,
            photos: p.photos.map(ph =>
              ph.id === photoId ? { ...ph, status: 'raw' as const } : ph
            )
          } : p
        ),
        isOnline: !isNetworkError
      }));

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(get().products)); // Reverted state'i kaydet
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

  // ⭐ ÇÖZÜM 4: Eski thumbnail silme ve memoryManager entegrasyonu
  updatePhotoThumbnail: async (productId: string, photoId: string, newThumbnailUri: string) => {
    console.log(i18n.t('products.startingThumbnailUpdateLog'), { productId, photoId, newThumbnailUri });

    // Önceki thumbnail URI'sini al
    const currentProducts = get().products;
    const currentProduct = currentProducts.find(p => p.id === productId);
    const currentPhoto = currentProduct?.photos.find(p => p.id === photoId);
    const oldThumbnailUri = currentPhoto?.thumbnailUri;

    // Yeni thumbnail için güçlü bir cache busting URI oluştur
    const cacheBustedUri = imageProcessor.createStrongCacheBustedUri(newThumbnailUri);

    const updatedProducts = currentProducts.map(p => {
      if (p.id === productId) {
        return {
          ...p,
          photos: p.photos.map(photo =>
            photo.id === photoId ? {
              ...photo,
              thumbnailUri: cacheBustedUri, // Artık bu direkt cache busted URI
              modifiedAt: new Date().toISOString()
            } : photo
          ),
          modifiedAt: new Date().toISOString()
        };
      }
      return p;
    });

    set({ products: updatedProducts }); // UI'ı hemen güncelle

    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProducts));
      console.log(i18n.t('products.asyncStorageUpdatedLog'));

      // Eski thumbnail'ı memoryManager kuyruğuna ekleyerek güvenli bir şekilde sil
      if (oldThumbnailUri && oldThumbnailUri !== cacheBustedUri) {
        await memoryManager.queue.addOperation(`delete-old-thumbnail-${photoId}`, async () => {
          try {
            // Cache busting parametrelerinden arındırılmış URI'yi al
            const cleanOldUri = oldThumbnailUri.split('?')[0];
            await fileSystemManager.deleteImage(cleanOldUri);
            console.log(i18n.t('products.oldThumbnailDeletedLog'), cleanOldUri);
          } catch (deleteError) {
            console.warn(i18n.t('products.oldThumbnailDeletionFailedLog'), deleteError);
          }
        });
      }

      // Güçlü cache geçersizleştirme ve bellek temizliği
      await memoryManager.cleanup(); // Tüm image cache'lerini temizle

      // Ürün mağazasını UI için yeniden yükle (görsel tutarlılık için)
      // Bu çağrı aslında useEnhancedEditorStore.saveChanges içinde yapılıyor,
      // ancak burada da genel tutarlılık için tekrar çağrılabilir.
      // Ya da sadece imageProcessor.clearImageCache() çağrısını yeterli görebiliriz.
      // Şimdilik imageProcessor.clearImageCache() yerine MemoryManager'ın cleanup() çağrıldı.

      console.log(i18n.t('products.photoThumbnailUpdateCompletedLog'), {
        productId,
        photoId,
        oldUri: oldThumbnailUri?.substring(0, Math.min(oldThumbnailUri.length, 50)) + '...',
        newUri: cacheBustedUri.substring(0, Math.min(cacheBustedUri.length, 50)) + '...'
      });

    } catch (storageError: any) {
      console.error(i18n.t('products.asyncStorageUpdateFailedLog'), storageError);
      set({ products: currentProducts }); // Hata durumunda eski state'e geri dön
      throw new Error(`${i18n.t('products.updateThumbnailStorageFailed')}${storageError.message}`);
    }
  },

  getProductById: (productId) => get().products.find(p => p.id === productId),

  checkNetworkStatus: async () => {
    try {
      const isOnline = await apiUtils.checkNetworkConnection();
      set({ isOnline });

      if (!isOnline && get().error === null) {
        set({ error: i18n.t('api.error.noInternet') });
      } else if (isOnline && get().error?.includes(i18n.t('api.error.internetKeyword'))) {
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