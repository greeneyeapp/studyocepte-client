// stores/useProductStore.ts - YÜKSEK KALİTE THUMBNAIL VERSİYON + STATUS FIX
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

      // Dosya varlık kontrolü ve düzeltme
      let hasChanges = false;

      for (const product of products) {
        for (const photo of product.photos) {
          // Orijinal dosyayı kontrol et
          if (photo.originalUri) {
            const validatedUri = await imageProcessor.validateAndRecoverFile(photo.originalUri);
            if (!validatedUri) {
              console.warn('⚠️ Missing original file for photo:', photo.id);
              if (photo.processedUri) {
                photo.originalUri = photo.processedUri;
                hasChanges = true;
              }
            }
          }

          // Thumbnail dosyasını kontrol et ve yüksek kalite ile yeniden oluştur
          if (photo.thumbnailUri) {
            const validatedThumbnail = await imageProcessor.validateAndRecoverFile(photo.thumbnailUri);
            if (!validatedThumbnail) {
              console.warn('⚠️ Missing thumbnail for photo, recreating HIGH QUALITY:', photo.id);
              try {
                const sourceUri = photo.processedUri || photo.originalUri;
                if (sourceUri) {
                  // ⭐ YÜKSEK KALİTE: PNG thumbnail oluştur
                  const newThumbnail = await imageProcessor.createThumbnail(sourceUri, 'png');
                  photo.thumbnailUri = newThumbnail;
                  hasChanges = true;
                  console.log('✅ HIGH QUALITY thumbnail recreated for photo:', photo.id);
                }
              } catch (error) {
                console.error('❌ Failed to recreate HIGH QUALITY thumbnail for:', photo.id, error);
              }
            }
          }

          // Processed dosyasını kontrol et
          if (photo.processedUri) {
            const validatedProcessed = await imageProcessor.validateAndRecoverFile(photo.processedUri);
            if (!validatedProcessed) {
              console.warn('⚠️ Missing processed file for photo:', photo.id);
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
        console.log('📁 Product storage updated after HIGH QUALITY file validation');
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

  /**
   * ⭐ YÜKSEK KALİTE: Multiple photo ekleme - PNG thumbnail ile
   */
  addMultiplePhotos: async (productId, imageUris) => {
    try {
      const product = get().products.find(p => p.id === productId);
      if (!product) throw new Error(i18n.t('common.productNotFound'));

      const newPhotos: ProductPhoto[] = [];
      for (const uri of imageUris) {
        const photoId = `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const originalFilename = `original_${photoId}.jpg`;
        const originalUri = await fileSystemManager.saveImage(productId, uri, originalFilename);
        
        // ⭐ YÜKSEK KALİTE: PNG thumbnail oluştur (jpeg → png)
        const thumbnailUri = await imageProcessor.createThumbnail(originalUri, 'png');
        
        console.log('✅ HIGH QUALITY PNG thumbnail created for new photo:', photoId);

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

  /**
   * ⭐ YÜKSEK KALİTE: Background removal - PNG thumbnail ile
   */
  removeMultipleBackgrounds: async (productId, photoIds) => {
    const isOnline = await apiUtils.checkNetworkConnection();
    if (!isOnline) {
      set({
        error: i18n.t('networkErrors.networkRequired'),
        isOnline: false
      });
      return false;
    }

    set({ error: null, isOnline: true });

    const originalProductsState = JSON.parse(JSON.stringify(get().products));

    try {
      const tempProducts = JSON.parse(JSON.stringify(get().products));
      const product = tempProducts.find(p => p.id === productId);
      if (!product) throw new Error(i18n.t('common.productNotFound'));

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
      if (!targetProduct) throw new Error(i18n.t('common.productNotFoundAfterProcess'));

      let successCount = 0;

      // Başarılı sonuçları işle - YÜKSEK KALİTE PNG thumbnail
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
          
          // ⭐ YÜKSEK KALİTE: PNG thumbnail oluştur
          photo.thumbnailUri = await imageProcessor.createThumbnail(photo.processedUri, 'png');
          console.log('✅ HIGH QUALITY PNG thumbnail created for processed photo:', photoId);
          
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

      const isNetworkError = errorMessage.includes(i18n.t('common.networkError')) ||
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

   revertToRawForBackgroundChange: async (productId: string, photoId: string) => {
    console.log('🔄 Reverting processed photo to raw for background change:', photoId);
    
    const currentProducts = get().products;
    const product = currentProducts.find(p => p.id === productId);
    const photo = product?.photos.find(p => p.id === photoId);
    
    if (!photo || photo.status !== 'processed') {
      console.log('⏭️ Photo not found or not processed, skipping revert');
      return;
    }

    // ✅ Raw fotoğraf dosyasını kullan (processed öncesi)
    let rawImageUri = photo.originalUri;
    
    // Eğer processedUri varsa ve background removal'dan gelmişse, 
    // o zaten temiz ürün fotoğrafıdır, onu kullan
    if (photo.processedUri) {
      rawImageUri = photo.processedUri;
    }

    // ✅ Yeni raw thumbnail oluştur
    const newThumbnailUri = await imageProcessor.createThumbnail(rawImageUri, 'png');
    console.log('✅ New raw thumbnail created for background change');

    const updatedProducts = currentProducts.map(p => {
      if (p.id === productId) {
        return {
          ...p,
          photos: p.photos.map(ph => {
            if (ph.id === photoId) {
              return {
                ...ph,
                originalUri: rawImageUri, // Raw ürün fotoğrafı
                thumbnailUri: newThumbnailUri, // Yeni thumbnail
                status: 'raw' as const, // ← ÖNEMLİ: Raw durumuna döndür
                editorSettings: {
                  ...ph.editorSettings,
                  backgroundId: 'none' // Background'u temizle
                },
                modifiedAt: new Date().toISOString()
              };
            }
            return ph;
          }),
          modifiedAt: new Date().toISOString()
        };
      }
      return p;
    });

    // State'i güncelle ve kaydet
    set({ products: updatedProducts });
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProducts));
    
    console.log('✅ Photo reverted to raw for background change:', photoId);
  },

  /**
   * ✅ DÜZELTİLDİ: Tek photo background removal - STATUS GÜNCELLEME FIX
   */
  removeSingleBackground: async (productId: string, photoId: string) => {
    const isOnline = await apiUtils.checkNetworkConnection();
    if (!isOnline) {
      set({
        error: i18n.t('networkErrors.networkRequired'),
        isOnline: false
      });
      return false;
    }

    set({ error: null, isOnline: true });

    try {
      const product = get().products.find(p => p.id === productId);
      const photo = product?.photos.find(p => p.id === photoId);

      if (!product || !photo) {
        throw new Error(i18n.t('common.productNotFound'));
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

      // ✅ DÜZELTME: ÖNCE processed dosyayı kaydet, SONRA status'u güncelle
      const oldOriginalUri = photo.originalUri;
      const oldThumbnailUri = photo.thumbnailUri;
      const processedFilename = `processed_${photoId}.png`;

      const processedUri = await fileSystemManager.saveBase64Image(
        productId,
        base64Data,
        processedFilename
      );

      // ⭐ YÜKSEK KALİTE: PNG thumbnail oluştur
      const newThumbnailUri = await imageProcessor.createThumbnail(processedUri, 'png');
      console.log('✅ HIGH QUALITY PNG thumbnail created for single processed photo:', photoId);

      // ✅ ÇOK ÖNEMLİ: Status'u ve dosya URI'lerini güncelle
      const finalProducts = get().products.map(p =>
        p.id === productId ? {
          ...p,
          photos: p.photos.map(ph => {
            if (ph.id === photoId) {
              return {
                ...ph,
                originalUri: processedUri, // ← Processed URI'yi original olarak kullan
                thumbnailUri: newThumbnailUri, // ← Yeni thumbnail
                processedUri: processedUri, // ← Processed URI'yi kaydet
                status: 'processed' as const, // ← ÇOK ÖNEMLİ: Status'u processed yap
                modifiedAt: new Date().toISOString()
              };
            }
            return ph;
          }),
          modifiedAt: new Date().toISOString()
        } : p
      );

      // State'i güncelle ve kaydet
      set({ products: finalProducts, isOnline: true });
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(finalProducts));

      // Eski dosyaları sil
      await fileSystemManager.deleteImage(oldOriginalUri);
      await fileSystemManager.deleteImage(oldThumbnailUri);

      console.log('✅ Photo status updated to PROCESSED:', photoId);
      console.log('✅ Single background removal completed with status fix');

      return true;

    } catch (error: any) {
      console.error("removeSingleBackground CATCH_BLOCK:", error);
      const errorMessage = apiUtils.extractErrorMessage(error);

      const isNetworkError = errorMessage.includes(i18n.t('common.networkError')) ||
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

  /**
   * ✅ DÜZELTİLDİ: Settings güncellenirken status kontrolü
   */
  updatePhotoSettings: (productId, photoId, settings) => {
    const updatedProducts = get().products.map(p => {
      if (p.id === productId) {
        return {
          ...p,
          photos: p.photos.map(photo => {
            if (photo.id === photoId) {
              // ✅ YENİ: Background eklendiyse status'u processed yap
              const hasBackground = settings.backgroundId && settings.backgroundId !== 'none';
              const shouldBeProcessed = hasBackground || photo.processedUri;
              
              return {
                ...photo,
                editorSettings: settings,
                status: shouldBeProcessed ? 'processed' : photo.status,
                modifiedAt: new Date().toISOString()
              };
            }
            return photo;
          }),
          modifiedAt: new Date().toISOString()
        };
      }
      return p;
    });
    
    set({ products: updatedProducts });
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProducts));
    
    console.log('💾 Photo settings and status updated:', {
      photoId,
      backgroundId: settings.backgroundId,
      hasBackground: settings.backgroundId !== 'none'
    });
  },

  /**
   * ⭐ GÜÇLÜ CACHE-BUSTING: Photo thumbnail güncelleme - ASYNC DÜZELTMESİ
   */
  updatePhotoThumbnail: async (productId: string, photoId: string, newThumbnailUri: string) => {
    console.log('🖼️ Starting HIGH QUALITY thumbnail update:', { productId, photoId, newThumbnailUri });

    // Önceki thumbnail URI'sini al (cache invalidation için)
    const currentProducts = get().products;
    const currentProduct = currentProducts.find(p => p.id === productId);
    const currentPhoto = currentProduct?.photos.find(p => p.id === photoId);
    const oldThumbnailUri = currentPhoto?.thumbnailUri;

    // ⭐ GÜÇLÜ CACHE-BUSTING: Strong cache-busted URI oluştur
    const cacheBustedUri = imageProcessor.createStrongCacheBustedUri(newThumbnailUri);

    const updatedProducts = currentProducts.map(p => {
      if (p.id === productId) {
        return {
          ...p,
          photos: p.photos.map(photo =>
            photo.id === photoId ? {
              ...photo,
              thumbnailUri: cacheBustedUri, // Cache-busted URI kullan
              modifiedAt: new Date().toISOString()
            } : photo
          ),
          modifiedAt: new Date().toISOString()
        };
      }
      return p;
    });

    // Önce state'i güncelle (UI hemen yansısın)
    set({ products: updatedProducts });

    try {
      // AsyncStorage'ı await et
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProducts));
      console.log('✅ HIGH QUALITY AsyncStorage updated successfully');

      // Eski thumbnail dosyasını sil (disk temizliği)
      if (oldThumbnailUri && oldThumbnailUri !== newThumbnailUri) {
        try {
          // Cache-busted parametreleri temizleyerek gerçek dosya yolunu al
          const cleanOldUri = oldThumbnailUri.split('?')[0];
          await fileSystemManager.deleteImage(cleanOldUri);
          console.log('🗑️ Old thumbnail deleted:', cleanOldUri);
        } catch (deleteError) {
          console.warn('⚠️ Old thumbnail deletion failed (non-critical):', deleteError);
        }
      }

      // ⭐ GÜÇLÜ CACHE INVALIDATION: Multiple cache clearing
      setTimeout(async () => {
        try {
          // 1. Image cache temizle
          await imageProcessor.clearImageCache();
          
          // 2. Force re-render trigger
          const currentState = get();
          set({
            products: [...currentState.products] // Shallow copy ile re-render trigger
          });
          
          console.log('🔄 STRONG cache invalidation completed for thumbnail update');
        } catch (cacheError) {
          console.warn('⚠️ Cache invalidation warning:', cacheError);
        }
      }, 100);

    } catch (storageError: any) {
      console.error('❌ HIGH QUALITY AsyncStorage update failed:', storageError);

      // Storage hatası durumunda state'i geri al
      set({ products: currentProducts });
      throw new Error(`${i18n.t('imageProcessing.thumbnailUpdateStorageFailed')}: ${storageError.message}`);
    }

    console.log('✅ HIGH QUALITY photo thumbnail update completed:', {
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
        set({ error: i18n.t('networkErrors.noInternet') });
      } else if (isOnline && get().error?.includes(i18n.t('networkErrors.noInternet'))) {
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