// stores/useProductStore.ts - LOADING KALDIRILMIŞ VERSİYON
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, apiUtils } from '@/services/api';
import { fileSystemManager } from '@/services/fileSystemManager';
import { imageProcessor } from '@/services/imageProcessor';
import i18n from '@/i18n';

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
  // YENİ: Network ve dil durumu
  isOnline: boolean;
  currentLanguage: string;

  // Mevcut fonksiyonlar
  loadProducts: () => Promise<void>;
  createProduct: (name: string) => Promise<Product>;
  deleteProduct: (productId: string) => Promise<void>;
  updateProductName: (productId: string, name: string) => Promise<void>;
  addMultiplePhotos: (productId: string, imageUris: string[]) => Promise<boolean>;
  deletePhoto: (productId: string, photoId: string) => Promise<void>;
  removeMultipleBackgrounds: (productId: string, photoIds: string[]) => Promise<boolean>;
  getProductById: (productId: string) => Product | undefined;
  updatePhotoSettings: (productId: string, photoId: string, settings: any) => void;

  // YENİ: Tek photo background removal
  removeSingleBackground: (productId: string, photoId: string) => Promise<boolean>;
  // YENİ: Thumbnail güncelleme
  updatePhotoThumbnail: (productId: string, photoId: string, newThumbnailUri: string) => void;
  // YENİ: Network durumu kontrolü
  checkNetworkStatus: () => Promise<void>;
  // YENİ: Dil değiştirme
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

      // YENİ: Dosya varlık kontrolü ve düzeltme
      let hasChanges = false;

      for (const product of products) {
        for (const photo of product.photos) {
          // Orijinal dosyayı kontrol et
          if (photo.originalUri) {
            const validatedUri = await imageProcessor.validateAndRecoverFile(photo.originalUri);
            if (!validatedUri) {
              console.warn('⚠️ Missing original file for photo:', photo.id);
              // Eksik dosya için fallback stratejisi
              if (photo.processedUri) {
                photo.originalUri = photo.processedUri;
                hasChanges = true;
              }
            }
          }

          // Thumbnail dosyasını kontrol et
          if (photo.thumbnailUri) {
            const validatedThumbnail = await imageProcessor.validateAndRecoverFile(photo.thumbnailUri);
            if (!validatedThumbnail) {
              console.warn('⚠️ Missing thumbnail for photo:', photo.id);
              // Thumbnail yoksa orijinal veya processed'den yeniden oluştur
              try {
                const sourceUri = photo.processedUri || photo.originalUri;
                if (sourceUri) {
                  const newThumbnail = await imageProcessor.createThumbnail(sourceUri, 'png');
                  photo.thumbnailUri = newThumbnail;
                  hasChanges = true;
                  console.log('✅ Thumbnail recreated for photo:', photo.id);
                }
              } catch (error) {
                console.error('❌ Failed to recreate thumbnail for:', photo.id, error);
              }
            }
          }

          // Processed dosyasını kontrol et
          if (photo.processedUri) {
            const validatedProcessed = await imageProcessor.validateAndRecoverFile(photo.processedUri);
            if (!validatedProcessed) {
              console.warn('⚠️ Missing processed file for photo:', photo.id);
              // Processed dosya yoksa status'u raw'a çevir
              photo.status = 'raw';
              photo.processedUri = undefined;
              hasChanges = true;
            }
          }
        }
      }

      // Değişiklikler varsa storage'ı güncelle
      if (hasChanges) {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(products));
        console.log('📁 Product storage updated after file validation');
      }

      set({ products });
    } catch (error: any) {
      const errorMessage = apiUtils.extractErrorMessage(error);
      set({ error: errorMessage });
      throw error; // Component'e hata fırlat
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
      if (!product) throw new Error('Ürün bulunamadı');

      const newPhotos: ProductPhoto[] = [];
      for (const uri of imageUris) {
        const photoId = `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const originalFilename = `original_${photoId}.jpg`;
        const originalUri = await fileSystemManager.saveImage(productId, uri, originalFilename);
        const thumbnailUri = await imageProcessor.createThumbnail(originalUri, 'jpeg');

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

  // GÜNCELLEME: Dil desteği ile background removal
  removeMultipleBackgrounds: async (productId, photoIds) => {
    // Network kontrolü
    const isOnline = await apiUtils.checkNetworkConnection();
    if (!isOnline) {
      set({
        error: 'İnternet bağlantısı gerekli. Lütfen bağlantınızı kontrol edin.',
        isOnline: false
      });
      return false;
    }

    set({ error: null, isOnline: true });

    const originalProductsState = JSON.parse(JSON.stringify(get().products));

    try {
      const tempProducts = JSON.parse(JSON.stringify(get().products));
      const product = tempProducts.find(p => p.id === productId);
      if (!product) throw new Error('Ürün bulunamadı');

      const photosToProcess = product.photos.filter(p =>
        photoIds.includes(p.id) && p.status === 'raw'
      );

      if (photosToProcess.length === 0) {
        return true;
      }

      // UI'da processing durumunu göster
      photosToProcess.forEach(p => { p.status = 'processing'; });
      set({ products: tempProducts });

      // API çağrısı - dil parametresi ile
      const currentLang = get().currentLanguage;
      const apiPayload = photosToProcess.map(p => ({
        filename: `${p.id}.jpg`,
        uri: p.originalUri
      }));

      const result = await api.removeMultipleBackgrounds(apiPayload, currentLang);

      // Sonuçları işle
      const finalProducts = JSON.parse(JSON.stringify(get().products));
      const targetProduct = finalProducts.find(p => p.id === productId);
      if (!targetProduct) throw new Error("İşlem sonrası ürün bulunamadı");

      let successCount = 0;

      // Başarılı sonuçları işle
      for (const [id, base64Data] of Object.entries(result.success)) {
        const photoId = id.replace('.jpg', '');
        const photo = targetProduct.photos.find(p => p.id === photoId);
        if (photo) {
          const oldOriginalUri = photo.originalUri;
          const oldThumbnailUri = photo.thumbnailUri;
          const processedFilename = `processed_${photoId}.png`;

          photo.processedUri = await fileSystemManager.saveBase64Image(
            productId,
            base64Data,
            processedFilename
          );
          photo.originalUri = photo.processedUri;
          photo.thumbnailUri = await imageProcessor.createThumbnail(photo.processedUri, 'png');
          photo.status = 'processed';
          photo.modifiedAt = new Date().toISOString();

          await fileSystemManager.deleteImage(oldOriginalUri);
          await fileSystemManager.deleteImage(oldThumbnailUri);
          successCount++;
        }
      }

      // Hatalı sonuçları işle
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
      console.error("removeMultipleBackgrounds CATCH_BLOCK:", error);
      const errorMessage = apiUtils.extractErrorMessage(error);

      // Network hatası kontrolü
      const isNetworkError = errorMessage.includes('ağ') ||
        errorMessage.includes('network') ||
        errorMessage.includes('timeout');

      set({
        error: errorMessage,
        products: originalProductsState,
        isOnline: !isNetworkError
      });

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(originalProductsState));
      return false;
    }
  },

  // YENİ: Tek photo background removal
  removeSingleBackground: async (productId: string, photoId: string) => {
    // Network kontrolü
    const isOnline = await apiUtils.checkNetworkConnection();
    if (!isOnline) {
      set({
        error: 'İnternet bağlantısı gerekli. Lütfen bağlantınızı kontrol edin.',
        isOnline: false
      });
      return false;
    }

    set({ error: null, isOnline: true });

    try {
      const product = get().products.find(p => p.id === productId);
      const photo = product?.photos.find(p => p.id === photoId);

      if (!product || !photo) {
        throw new Error('Ürün veya fotoğraf bulunamadı');
      }

      if (photo.status !== 'raw') {
        return true; // Zaten işlenmiş
      }

      // UI'da processing durumunu göster
      const tempProducts = get().products.map(p =>
        p.id === productId ? {
          ...p,
          photos: p.photos.map(ph =>
            ph.id === photoId ? { ...ph, status: 'processing' as const } : ph
          )
        } : p
      );
      set({ products: tempProducts });

      // API çağrısı
      const currentLang = get().currentLanguage;
      const base64Data = await api.removeSingleBackground({
        filename: `${photoId}.jpg`,
        uri: photo.originalUri
      }, currentLang);

      // Sonucu işle
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

      // Processed dosyayı kaydet
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

        await fileSystemManager.deleteImage(oldOriginalUri);
        await fileSystemManager.deleteImage(oldThumbnailUri);
      }

      set({ products: finalProducts, isOnline: true });
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(finalProducts));

      return true;

    } catch (error: any) {
      console.error("removeSingleBackground CATCH_BLOCK:", error);
      const errorMessage = apiUtils.extractErrorMessage(error);

      const isNetworkError = errorMessage.includes('ağ') ||
        errorMessage.includes('network') ||
        errorMessage.includes('timeout');

      // Photo'nun durumunu raw'a geri döndür
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

  // YENİ: Photo thumbnail güncelleme - ASYNC DÜZELTMESİ
  updatePhotoThumbnail: async (productId: string, photoId: string, newThumbnailUri: string) => {
    console.log('🖼️ Starting thumbnail update:', { productId, photoId, newThumbnailUri });

    // Önceki thumbnail URI'sini al (cache invalidation için)
    const currentProducts = get().products;
    const currentProduct = currentProducts.find(p => p.id === productId);
    const currentPhoto = currentProduct?.photos.find(p => p.id === photoId);
    const oldThumbnailUri = currentPhoto?.thumbnailUri;

    const updatedProducts = currentProducts.map(p => {
      if (p.id === productId) {
        return {
          ...p,
          photos: p.photos.map(photo =>
            photo.id === photoId ? {
              ...photo,
              thumbnailUri: newThumbnailUri,
              modifiedAt: new Date().toISOString()
            } : photo
          ),
          modifiedAt: new Date().toISOString()
        };
      }
      return p;
    });

    // ÖNEMLİ: Önce state'i güncelle (UI hemen yansısın)
    set({ products: updatedProducts });

    try {
      // ÖNEMLİ: AsyncStorage'ı await et
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProducts));
      console.log('✅ AsyncStorage updated successfully');

      // YENİ: Eski thumbnail dosyasını sil (disk temizliği)
      if (oldThumbnailUri && oldThumbnailUri !== newThumbnailUri) {
        try {
          await fileSystemManager.deleteImage(oldThumbnailUri);
          console.log('🗑️ Old thumbnail deleted:', oldThumbnailUri);
        } catch (deleteError) {
          console.warn('⚠️ Old thumbnail deletion failed (non-critical):', deleteError);
        }
      }

      // YENİ: Force re-render trigger (image cache invalidation için)
      // Micro-task ile component'leri force re-render et
      setTimeout(() => {
        const currentState = get();
        set({
          products: [...currentState.products] // Shallow copy ile re-render trigger
        });
        console.log('🔄 Force re-render triggered for thumbnail update');
      }, 100);

    } catch (storageError) {
      console.error('❌ AsyncStorage update failed:', storageError);

      // Storage hatası durumunda state'i geri al
      set({ products: currentProducts });
      throw new Error('Thumbnail güncelleme storage hatası: ' + storageError.message);
    }

    console.log('✅ Photo thumbnail update completed:', {
      productId,
      photoId,
      oldUri: oldThumbnailUri,
      newUri: newThumbnailUri
    });
  },

  getProductById: (productId) => get().products.find(p => p.id === productId),

  // YENİ: Network durumu kontrolü
  checkNetworkStatus: async () => {
    try {
      const isOnline = await apiUtils.checkNetworkConnection();
      set({ isOnline });

      if (!isOnline && get().error === null) {
        set({ error: 'İnternet bağlantısı kesildi' });
      } else if (isOnline && get().error?.includes('İnternet')) {
        set({ error: null }); // Network error'ını temizle
      }
    } catch (error) {
      set({ isOnline: false });
    }
  },

  // YENİ: Dil değiştirme
  changeLanguage: (lang: string) => {
    set({ currentLanguage: lang });
  },
}));