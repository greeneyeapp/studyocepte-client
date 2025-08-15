// stores/useProductStore.ts - MEMORY-OPTIMIZED Product Store
import { create } from 'zustand';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, apiUtils } from '@/services/api';
import { fileSystemManager } from '@/services/fileSystemManager';
import { imageProcessor } from '@/services/imageProcessor';
import { memoryManager, CriticalOperationManager } from '@/services/memoryManager';
import i18n from '@/i18n';

// Ürün fotoğrafı arayüzü
export interface ProductPhoto {
  id: string;
  productId: string;
  originalUri: string;
  thumbnailUri: string;
  processedUri?: string; // İşlenmiş görselin URI'si (arka planı kaldırılmış vb.)
  status: 'raw' | 'processing' | 'processed'; // Görselin durumu
  createdAt: string;
  modifiedAt: string;
  editorSettings?: any; // Editör ayarları (döndürme, filtreler vb.)
}

// Ürün arayüzü
export interface Product {
  id: string;
  name: string;
  photos: ProductPhoto[];
  createdAt: string;
  modifiedAt: string;
}

// Ürün mağazası arayüzü
interface ProductStore {
  products: Product[]; // Tüm ürünler
  error: string | null; // Hata mesajı
  isOnline: boolean; // Ağ bağlantı durumu
  currentLanguage: string; // Mevcut dil

  // Fonksiyon tanımlamaları
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
  updatePhotoThumbnail: (productId: string, photoId: string, newThumbnailUri: string) => Promise<void>;
  revertToRawForBackgroundChange: (productId: string, photoId: string) => Promise<void>;
  checkNetworkStatus: () => Promise<void>;
  changeLanguage: (lang: string) => void;
  batchDeletePhotos: (productId: string, photoIds: string[]) => Promise<boolean>;
  getMemoryStatus: () => {
    usedMemory: number;
    availableMemory: number;
    isLowMemory: boolean;
    operationsInQueue: number;
    productCount: number;
    totalPhotos: number;
    recommendations: {
      shouldCleanupOldDrafts: boolean;
      shouldOptimizeThumbnails: boolean;
      shouldReduceOperations: boolean;
    };
  };
  cleanupOldData: () => Promise<void>;
  emergencyRecovery: () => Promise<void>;
  getPerformanceStats: () => {
    platform: string;
    memory: ReturnType<ProductStore['getMemoryStatus']>;
    data: {
      products: number;
      photos: number;
      rawPhotos: number;
      processedPhotos: number;
    };
    criticalOperations: any; // CriticalOperationManager'dan gelen istatistikler
    lastUpdate: string;
  };
}

const STORAGE_KEY = 'studyo_products';

export const useProductStore = create<ProductStore>((set, get) => ({
  products: [],
  error: null,
  isOnline: true,
  currentLanguage: i18n.language || 'tr',

  /**
   * ✅ MEMORY-OPTIMIZED: Product Loading with File Validation
   * Ürünleri AsyncStorage'dan yükler ve dosya doğrulamasını gerçekleştirir.
   * Eksik veya geçersiz dosyaları kurtarmaya çalışır.
   * @returns Promise<void>
   * @throws Yükleme veya doğrulama sırasında hata oluşursa.
   */
  loadProducts: async () => {
    return await memoryManager.addOperation(async () => {
      set({ error: null });

      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        let products: Product[] = stored ? JSON.parse(stored) : [];

        // Platforma duyarlı dosya doğrulama ve kurtarma
        let hasChanges = false;

        for (const product of products) {
          for (const photo of product.photos) {
            // Orijinal dosyayı doğrula
            if (photo.originalUri) {
              const validatedUri = await imageProcessor.validateAndRecoverFile(photo.originalUri);
              if (!validatedUri) {
                console.warn(`⚠️ [${Platform.OS}] Missing original file for photo:`, photo.id);
                if (photo.processedUri) {
                  // İşlenmiş URI varsa orijinal URI olarak ayarla
                  photo.originalUri = photo.processedUri;
                  hasChanges = true;
                }
              }
            }

            // Küçük resmi doğrula ve platform optimizasyonu ile yeniden oluştur
            if (photo.thumbnailUri) {
              const validatedThumbnail = await imageProcessor.validateAndRecoverFile(photo.thumbnailUri);
              if (!validatedThumbnail) {
                console.warn(`⚠️ [${Platform.OS}] Missing thumbnail, recreating optimized:`, photo.id);
                try {
                  const sourceUri = photo.processedUri || photo.originalUri;
                  if (sourceUri) {
                    // Platforma optimize edilmiş küçük resim
                    const config = memoryManager.getThumbnailConfig();
                    const newThumbnail = await imageProcessor.createThumbnail(sourceUri, config.format);
                    photo.thumbnailUri = newThumbnail;
                    hasChanges = true;
                    console.log(`✅ [${Platform.OS}] Optimized thumbnail recreated:`, photo.id);
                  }
                } catch (error) {
                  console.error(`❌ [${Platform.OS}] Failed to recreate thumbnail:`, photo.id, error);
                }
              }
            }

            // İşlenmiş dosyayı doğrula
            if (photo.processedUri) {
              const validatedProcessed = await imageProcessor.validateAndRecoverFile(photo.processedUri);
              if (!validatedProcessed) {
                console.warn(`⚠️ [${Platform.OS}] Missing processed file:`, photo.id);
                photo.status = 'raw'; // Durumu 'raw'a geri döndür
                photo.processedUri = undefined; // İşlenmiş URI'yi kaldır
                hasChanges = true;
              }
            }
          }
        }

        // Değişiklik yapıldıysa depolamayı güncelle
        if (hasChanges) {
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(products));
          console.log(`📁 [${Platform.OS}] Product storage updated after file validation`);
        }

        set({ products });
      } catch (error: any) {
        const errorMessage = apiUtils.extractErrorMessage(error);
        set({ error: errorMessage });
        throw error;
      }
    }, {
      priority: 'high',
      memoryEstimate: Platform.OS === 'ios' ? 10 : 15,
      timeout: 30000
    });
  },

  /**
   * Yeni bir ürün oluşturur ve depolamaya kaydeder.
   * @param name Ürünün adı.
   * @returns Oluşturulan ürün nesnesi.
   * @throws Hata oluşursa.
   */
  createProduct: async (name: string): Promise<Product> => {
    try {
      const newProduct: Product = {
        id: `product_${Date.now()}`,
        name,
        photos: [],
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString(),
      };

      await fileSystemManager.createProductDirectory(newProduct.id); // Ürün için dizin oluştur
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

  /**
   * Bir ürünü ve ilgili tüm dosyalarını siler.
   * @param productId Silinecek ürünün kimliği.
   * @returns Promise<void>
   * @throws Hata oluşursa.
   */
  deleteProduct: async (productId: string) => {
    try {
      await fileSystemManager.deleteProductDirectory(productId); // Ürün dizinini sil
      const updatedProducts = get().products.filter(p => p.id !== productId);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProducts));
      set({ products: updatedProducts });
    } catch (error: any) {
      const errorMessage = apiUtils.extractErrorMessage(error);
      set({ error: errorMessage });
      throw error;
    }
  },

  /**
   * Bir ürünün adını günceller.
   * @param productId Güncellenecek ürünün kimliği.
   * @param name Yeni ürün adı.
   * @returns Promise<void>
   * @throws Hata oluşursa.
   */
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
   * ✅ ÇÖZÜM 1: Sequential Photo Addition with Memory Management
   * Bir ürüne birden fazla fotoğrafı sıralı olarak ekler, her fotoğraf için bellek yönetimi ve küçük resim oluşturmayı optimize eder.
   * @param productId Fotoğrafların ekleneceği ürünün kimliği.
   * @param imageUris Eklenecek görsellerin URI'leri.
   * @returns İşlemin başarılı olup olmadığını belirten bir boolean.
   */
  addMultiplePhotos: async (productId, imageUris) => {
    return await CriticalOperationManager.withLock('add-multiple-photos', async () => {
      try {
        const product = get().products.find(p => p.id === productId);
        if (!product) throw new Error(i18n.t('common.productNotFound'));

        console.log(`📸 [${Platform.OS}] Starting sequential photo addition:`, {
          count: imageUris.length,
          productId
        });

        const newPhotos: ProductPhoto[] = [];

        // ✅ SIRALI İŞLEM: Her seferinde bir fotoğraf
        for (let i = 0; i < imageUris.length; i++) {
          const uri = imageUris[i];

          console.log(`📸 [${Platform.OS}] Processing photo ${i + 1}/${imageUris.length}`);

          const photoId = `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          const originalFilename = `original_${photoId}.jpg`;

          // Bellek yönetimi ile sıralı işlemler
          const originalUri = await memoryManager.addOperation(async () => {
            return await fileSystemManager.saveImage(productId, uri, originalFilename);
          }, {
            priority: 'normal',
            memoryEstimate: Platform.OS === 'ios' ? 8 : 12,
            timeout: 15000
          });

          // Platforma optimize edilmiş küçük resim oluşturma
          const thumbnailUri = await imageProcessor.createThumbnail(originalUri);

          console.log(`✅ [${Platform.OS}] Photo ${i + 1} processed successfully:`, photoId);

          newPhotos.push({
            id: photoId,
            productId,
            originalUri,
            thumbnailUri,
            status: 'raw',
            createdAt: new Date().toISOString(),
            modifiedAt: new Date().toISOString(),
          });

          // İşlemler arasında platforma özgü gecikme
          if (i < imageUris.length - 1) {
            await new Promise(resolve => setTimeout(resolve, Platform.OS === 'ios' ? 500 : 200));
          }
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

        console.log(`✅ [${Platform.OS}] All photos added successfully:`, newPhotos.length);
        return true;

      } catch (error: any) {
        const errorMessage = apiUtils.extractErrorMessage(error);
        set({ error: errorMessage });
        console.error(`❌ [${Platform.OS}] Photo addition failed:`, error);
        return false;
      }
    });
  },

  /**
   * Belirli bir fotoğrafı ve ilgili tüm dosyalarını siler.
   * @param productId Fotoğrafın ait olduğu ürünün kimliği.
   * @param photoId Silinecek fotoğrafın kimliği.
   * @returns Promise<void>
   * @throws Hata oluşursa.
   */
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
   * ✅ ÇÖZÜM 1: Sequential Background Removal with Memory Management
   * Birden fazla fotoğrafın arka planını sıralı olarak kaldırır, ağ bağlantısını kontrol eder ve bellek yönetimi uygular.
   * @param productId Fotoğrafların ait olduğu ürünün kimliği.
   * @param photoIds Arka planı kaldırılacak fotoğrafların kimlikleri.
   * @returns İşlemin başarılı olup olmadığını belirten bir boolean.
   */
  removeMultipleBackgrounds: async (productId, photoIds) => {
    return await CriticalOperationManager.withLock('remove-multiple-backgrounds', async () => {
      const isOnline = await apiUtils.checkNetworkConnection();
      if (!isOnline) {
        set({
          error: i18n.t('networkErrors.networkRequired'),
          isOnline: false
        });
        return false;
      }

      set({ error: null, isOnline: true });
      const originalProductsState = JSON.parse(JSON.stringify(get().products)); // Başarısızlık durumunda geri döndürmek için

      try {
        const tempProducts = JSON.parse(JSON.stringify(get().products));
        const product = tempProducts.find(p => p.id === productId);
        if (!product) throw new Error(i18n.t('common.productNotFound'));

        const photosToProcess = product.photos.filter(p =>
          photoIds.includes(p.id) && p.status === 'raw'
        );

        if (photosToProcess.length === 0) {
          return true; // İşlenecek fotoğraf yoksa başarılı say
        }

        console.log(`🔄 [${Platform.OS}] Starting sequential background removal:`, {
          count: photosToProcess.length,
          productId
        });

        // UI: İşleme durumunu göster
        photosToProcess.forEach(p => { p.status = 'processing'; });
        set({ products: tempProducts });

        // API çağrısı (dil parametresi ile)
        const currentLang = get().currentLanguage;
        const apiPayload = photosToProcess.map(p => ({
          filename: `${p.id}.jpg`,
          uri: p.originalUri
        }));

        const result = await api.removeMultipleBackgrounds(apiPayload, currentLang);

        // Sonuçları sıralı olarak işle
        const finalProducts = JSON.parse(JSON.stringify(get().products));
        const targetProduct = finalProducts.find(p => p.id === productId);
        if (!targetProduct) throw new Error(i18n.t('common.productNotFoundAfterProcess'));

        let successCount = 0;

        // ✅ SIRALI SONUÇ İŞLEME: Her seferinde bir sonuç
        for (const [id, base64Data] of Object.entries(result.success)) {
          const photoId = id.replace('.jpg', '');
          const photo = targetProduct.photos.find(p => p.id === photoId);

          if (photo) {
            console.log(`🔄 [${Platform.OS}] Processing successful result for photo:`, photoId);

            // Bellek yönetimi ile sıralı dosya işlemleri
            await memoryManager.addOperation(async () => {
              const oldOriginalUri = photo.originalUri;
              const oldThumbnailUri = photo.thumbnailUri;
              const processedFilename = `processed_${photoId}.png`;

              photo.processedUri = await fileSystemManager.saveBase64Image(
                productId,
                base64Data,
                processedFilename
              );
              photo.originalUri = photo.processedUri; // Orijinal URI'yi işlenmiş URI olarak güncelle

              // Platforma optimize edilmiş küçük resim
              const config = memoryManager.getThumbnailConfig();
              photo.thumbnailUri = await imageProcessor.createThumbnail(photo.processedUri, config.format);

              photo.status = 'processed'; // Durumu 'processed' olarak ayarla
              photo.modifiedAt = new Date().toISOString();

              // Eski dosyaları temizle
              await fileSystemManager.deleteImage(oldOriginalUri);
              await fileSystemManager.deleteImage(oldThumbnailUri);

              console.log(`✅ [${Platform.OS}] Photo processed successfully:`, photoId);
            }, {
              priority: 'normal',
              memoryEstimate: Platform.OS === 'ios' ? 15 : 25,
              timeout: 20000
            });

            successCount++;
          }
        }

        // Başarısız sonuçları ele al
        for (const [id] of Object.entries(result.errors)) {
          const photoId = id.replace('.jpg', '');
          const photo = targetProduct.photos.find(p => p.id === photoId);
          if (photo) {
            photo.status = 'raw'; // Durumu 'raw'a geri döndür
            console.warn(`⚠️ [${Platform.OS}] Photo processing failed:`, photoId);
          }
        }

        targetProduct.modifiedAt = new Date().toISOString();
        set({ products: finalProducts, isOnline: true });
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(finalProducts));

        console.log(`✅ [${Platform.OS}] Background removal completed:`, {
          successful: successCount,
          total: photosToProcess.length
        });

        return successCount > 0;

      } catch (error: any) {
        console.error(`❌ [${Platform.OS}] removeMultipleBackgrounds failed:`, error);
        const errorMessage = apiUtils.extractErrorMessage(error);

        const isNetworkError = errorMessage.includes(i18n.t('common.networkError')) ||
          errorMessage.includes('network') ||
          errorMessage.includes('timeout');

        // Hata durumunda durumu orijinal haline geri döndür
        set({
          error: errorMessage,
          products: originalProductsState,
          isOnline: !isNetworkError
        });

        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(originalProductsState));
        return false;
      }
    });
  },

  /**
   * Belirli bir ürün kimliğine göre ürünü döndürür.
   * @param productId Aranacak ürünün kimliği.
   * @returns Ürün nesnesi veya bulunamazsa undefined.
   */
  getProductById: (productId) => get().products.find(p => p.id === productId),

  /**
   * Bir fotoğrafın editör ayarlarını günceller ve arka plan durumuna göre fotoğrafın durumunu kontrol eder.
   * @param productId Fotoğrafın ait olduğu ürünün kimliği.
   * @param photoId Güncellenecek fotoğrafın kimliği.
   * @param settings Yeni editör ayarları.
   * @returns Promise<void>
   */
  updatePhotoSettings: (productId, photoId, settings) => {
    const updatedProducts = get().products.map(p => {
      if (p.id === productId) {
        return {
          ...p,
          photos: p.photos.map(photo => {
            if (photo.id === photoId) {
              // Durum güncellemesi için arka plan kontrolü
              const hasBackground = settings.backgroundId && settings.backgroundId !== 'none';
              const shouldBeProcessed = hasBackground || photo.processedUri; // Arka plan varsa veya zaten işlenmişse 'processed' olmalı

              return {
                ...photo,
                editorSettings: settings,
                status: shouldBeProcessed ? 'processed' : photo.status, // Durumu güncelle
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
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProducts)); // Depolamaya kaydet

    console.log(`💾 [${Platform.OS}] Photo settings and status updated:`, {
      photoId,
      backgroundId: settings.backgroundId,
      hasBackground: settings.backgroundId !== 'none'
    });
  },

  /**
   * Belirli bir fotoğrafın arka planını tek başına kaldırır.
   * @param productId Fotoğrafın ait olduğu ürünün kimliği.
   * @param photoId Arka planı kaldırılacak fotoğrafın kimliği.
   * @returns İşlemin başarılı olup olmadığını belirten bir boolean.
   */
  removeSingleBackground: async (productId: string, photoId: string) => {
    return await CriticalOperationManager.withLock('remove-single-background', async () => {
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
          return true; // Zaten işlenmişse başarılı say
        }

        console.log(`🔄 [${Platform.OS}] Starting single background removal:`, photoId);

        // UI: İşleme durumunu göster
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

        console.log(`📦 [${Platform.OS}] API response received for photo:`, photoId);

        // ✅ KRİTİK: Sonucu doğru durum güncellemesi ile işle
        const processResult = await memoryManager.addOperation(async () => {
          const oldOriginalUri = photo.originalUri;
          const oldThumbnailUri = photo.thumbnailUri;
          const processedFilename = `processed_${photoId}.png`;

          const processedUri = await fileSystemManager.saveBase64Image(
            productId,
            base64Data,
            processedFilename
          );

          // Platforma optimize edilmiş küçük resim
          const config = memoryManager.getThumbnailConfig();
          const newThumbnailUri = await imageProcessor.createThumbnail(processedUri, config.format);

          console.log(`✅ [${Platform.OS}] Files processed for photo:`, photoId);

          return {
            processedUri,
            newThumbnailUri,
            oldOriginalUri,
            oldThumbnailUri
          };
        }, {
          priority: 'high',
          memoryEstimate: Platform.OS === 'ios' ? 20 : 30,
          timeout: 25000
        });

        // ✅ DURUM VE DOSYALARI GÜNCELLE
        const finalProducts = get().products.map(p =>
          p.id === productId ? {
            ...p,
            photos: p.photos.map(ph => {
              if (ph.id === photoId) {
                return {
                  ...ph,
                  originalUri: processResult.processedUri,
                  thumbnailUri: processResult.newThumbnailUri,
                  processedUri: processResult.processedUri, // İşlenmiş URI'yi kaydet
                  status: 'processed' as const,
                  modifiedAt: new Date().toISOString()
                };
              }
              return ph;
            }),
            modifiedAt: new Date().toISOString()
          } : p
        );

        // Durumu ve depolamayı güncelle
        set({ products: finalProducts, isOnline: true });
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(finalProducts));

        // Eski dosyaları temizle
        await fileSystemManager.deleteImage(processResult.oldOriginalUri);
        await fileSystemManager.deleteImage(processResult.oldThumbnailUri);

        console.log(`✅ [${Platform.OS}] Single background removal completed with status fix:`, photoId);
        return true;

      } catch (error: any) {
        console.error(`❌ [${Platform.OS}] removeSingleBackground failed:`, error);
        const errorMessage = apiUtils.extractErrorMessage(error);

        const isNetworkError = errorMessage.includes(i18n.t('common.networkError')) ||
          errorMessage.includes('network') ||
          errorMessage.includes('timeout');

        // Hata durumunda fotoğraf durumunu 'raw'a geri döndür
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
    });
  },

  /**
   * ✅ ÇÖZÜM 4: Memory-Safe Thumbnail Update with Strong Cache Busting
   * Belirli bir fotoğrafın küçük resmini bellek güvenli bir şekilde günceller ve güçlü önbellek bozan kullanır.
   * @param productId Fotoğrafın ait olduğu ürünün kimliği.
   * @param photoId Güncellenecek fotoğrafın kimliği.
   * @param newThumbnailUri Yeni küçük resmin URI'si.
   * @returns Promise<void>
   * @throws Hata oluşursa.
   */
  updatePhotoThumbnail: async (productId: string, photoId: string, newThumbnailUri: string) => {
    return await CriticalOperationManager.withLock('update-thumbnail', async () => {
      console.log(`🖼️ [${Platform.OS}] Starting memory-safe thumbnail update:`, { productId, photoId, newThumbnailUri });

      // Temizleme için önceki küçük resmi al
      const currentProducts = get().products;
      const currentProduct = currentProducts.find(p => p.id === productId);
      const currentPhoto = currentProduct?.photos.find(p => p.id === photoId);
      const oldThumbnailUri = currentPhoto?.thumbnailUri;

      // Platforma optimize edilmiş güçlü önbellek bozan
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

      // Önce durumu güncelle (anında UI geri bildirimi)
      set({ products: updatedProducts });

      try {
        // Bellek yönetimi ile AsyncStorage'a kaydet
        await memoryManager.addOperation(async () => {
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProducts));
        }, {
          priority: 'high',
          memoryEstimate: Platform.OS === 'ios' ? 5 : 8,
          timeout: 10000
        });

        console.log(`✅ [${Platform.OS}] AsyncStorage updated successfully`);

        // Eski küçük resmi temizle
        if (oldThumbnailUri && oldThumbnailUri !== newThumbnailUri) {
          try {
            const cleanOldUri = oldThumbnailUri.split('?')[0]; // Önbellek bozan parametreleri temizle
            await fileSystemManager.deleteImage(cleanOldUri);
            console.log(`🗑️ [${Platform.OS}] Old thumbnail deleted:`, cleanOldUri);
          } catch (deleteError) {
            console.warn(`⚠️ [${Platform.OS}] Old thumbnail deletion warning:`, deleteError);
          }
        }

        // Platforma özgü önbellek geçersizleştirme
        setTimeout(async () => {
          try {
            await imageProcessor.clearImageCache();

            // Yeniden oluşturmayı zorla
            const currentState = get();
            set({
              products: [...currentState.products] // Yeniden oluşturmak için yüzeysel kopyalama
            });

            console.log(`🔄 [${Platform.OS}] Cache invalidation completed`);
          } catch (cacheError) {
            console.warn(`⚠️ [${Platform.OS}] Cache invalidation warning:`, cacheError);
          }
        }, Platform.OS === 'ios' ? 100 : 200);

      } catch (storageError: any) {
        console.error(`❌ [${Platform.OS}] AsyncStorage update failed:`, storageError);

        // Depolama hatası durumunda durumu geri döndür
        set({ products: currentProducts });
        throw new Error(`${i18n.t('imageProcessing.thumbnailUpdateStorageFailed')}: ${storageError.message}`);
      }

      console.log(`✅ [${Platform.OS}] Memory-safe thumbnail update completed:`, {
        productId,
        photoId,
        oldUri: oldThumbnailUri,
        newUri: cacheBustedUri
      });
    });
  },

  /**
   * ✅ Background Change Optimization: Revert to Raw
   * Arka plan değişikliği için işlenmiş bir fotoğrafı ham durumuna geri döndürür.
   * @param productId Fotoğrafın ait olduğu ürünün kimliği.
   * @param photoId Geri döndürülecek fotoğrafın kimliği.
   * @returns Promise<void>
   */
  revertToRawForBackgroundChange: async (productId: string, photoId: string) => {
    return await CriticalOperationManager.withLock('revert-to-raw', async () => {
      console.log(`🔄 [${Platform.OS}] Reverting processed photo to raw for background change:`, photoId);

      const currentProducts = get().products;
      const product = currentProducts.find(p => p.id === productId);
      const photo = product?.photos.find(p => p.id === photoId);

      if (!photo || photo.status !== 'processed') {
        console.log(`⏭️ [${Platform.OS}] Photo not found or not processed, skipping revert`);
        return;
      }

      // Ham görseli kullan (işlenmiş olan temiz ürün fotoğrafıdır)
      let rawImageUri = photo.originalUri;

      // Eğer işlenmiş URI varsa, onu ham URI olarak kullan
      if (photo.processedUri) {
        rawImageUri = photo.processedUri;
      }

      // Platform optimizasyonu ile yeni ham küçük resim oluştur
      const config = memoryManager.getThumbnailConfig();
      const newThumbnailUri = await imageProcessor.createThumbnail(rawImageUri, config.format);
      console.log(`✅ [${Platform.OS}] New raw thumbnail created for background change`);

      const updatedProducts = currentProducts.map(p => {
        if (p.id === productId) {
          return {
            ...p,
            photos: p.photos.map(ph => {
              if (ph.id === photoId) {
                return {
                  ...ph,
                  originalUri: rawImageUri, // Orijinal URI'yi ham görsel URI'si olarak ayarla
                  thumbnailUri: newThumbnailUri,
                  status: 'raw' as const, // Durumu 'raw' olarak ayarla
                  editorSettings: {
                    ...ph.editorSettings,
                    backgroundId: 'none' // Arka plan kimliğini 'none' olarak ayarla
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

      set({ products: updatedProducts });
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProducts)); // Depolamaya kaydet

      console.log(`✅ [${Platform.OS}] Photo reverted to raw for background change:`, photoId);
    });
  },

  /**
   * Ağ bağlantı durumunu kontrol eder ve mağazanın durumunu günceller.
   * @returns Promise<void>
   */
  checkNetworkStatus: async () => {
    try {
      const isOnline = await apiUtils.checkNetworkConnection();
      set({ isOnline });

      if (!isOnline && get().error === null) {
        set({ error: i18n.t('networkErrors.noInternet') });
      } else if (isOnline && get().error?.includes(i18n.t('networkErrors.noInternet'))) {
        set({ error: null }); // Ağ geri geldiğinde hata mesajını temizle
      }
    } catch (error) {
      set({ isOnline: false });
    }
  },

  /**
   * Uygulama dilini değiştirir.
   * @param lang Ayarlanacak dil kodu (örneğin 'tr', 'en').
   */
  changeLanguage: (lang: string) => {
    set({ currentLanguage: lang });
  },

  /**
   * ✅ Batch Operations Support
   * Birden fazla fotoğrafı toplu olarak siler, her silme işlemi arasında gecikme uygular.
   * @param productId Fotoğrafların ait olduğu ürünün kimliği.
   * @param photoIds Silinecek fotoğrafların kimlikleri.
   * @returns İşlemin başarılı olup olmadığını belirten bir boolean.
   */
  batchDeletePhotos: async (productId: string, photoIds: string[]) => {
    return await CriticalOperationManager.withLock('batch-delete', async () => {
      try {
        console.log(`🗑️ [${Platform.OS}] Starting batch photo deletion:`, photoIds.length);

        const product = get().products.find(p => p.id === productId);
        if (!product) throw new Error(i18n.t('common.productNotFound'));

        // Bellek güvenliği için sıralı silme
        for (const photoId of photoIds) {
          await get().deletePhoto(productId, photoId); // Her fotoğrafı tek tek sil

          // Silmeler arasında platforma özgü gecikme
          await new Promise(resolve =>
            setTimeout(resolve, Platform.OS === 'ios' ? 300 : 150)
          );
        }

        console.log(`✅ [${Platform.OS}] Batch deletion completed`);
        return true;
      } catch (error: any) {
        console.error(`❌ [${Platform.OS}] Batch deletion failed:`, error);
        return false;
      }
    });
  },

  /**
   * ✅ Memory Status and Cleanup
   * Mevcut bellek durumu istatistiklerini ve olası temizleme önerilerini döndürür.
   * @returns Bellek durumu ve önerileri içeren bir nesne.
   */
  getMemoryStatus: () => {
    const memoryStatus = memoryManager.getMemoryStatus();
    const products = get().products;

    return {
      ...memoryStatus,
      productCount: products.length,
      totalPhotos: products.reduce((total, product) => total + product.photos.length, 0),
      recommendations: {
        shouldCleanupOldDrafts: products.length > 10, // Örneğin, 10'dan fazla taslak ürün varsa temizle
        shouldOptimizeThumbnails: memoryStatus.isLowMemory,
        shouldReduceOperations: memoryStatus.operationsInQueue > 5,
      }
    };
  },

  /**
   * ✅ Cleanup Old Data
   * Geçici dosyaları ve önbelleği temizleyerek eski verileri temizler.
   * @returns Promise<void>
   */
  cleanupOldData: async () => {
    try {
      console.log(`🧹 [${Platform.OS}] Starting old data cleanup`);

      // Bellek yöneticisini temizle
      await memoryManager.cleanupMemory();

      // Görsel işlemci önbelleğini temizle
      await imageProcessor.clearImageCache();

      console.log(`✅ [${Platform.OS}] Old data cleanup completed`);
    } catch (error) {
      console.warn(`⚠️ [${Platform.OS}] Cleanup warning:`, error);
    }
  },

  /**
   * ✅ Emergency Recovery
   * Acil durumlarda uygulamayı kurtarmak için kritik kurtarma işlemleri başlatır.
   * @returns Promise<void>
   */
  emergencyRecovery: async () => {
    try {
      console.log(`🆘 [${Platform.OS}] Emergency recovery initiated`);

      // Tüm kritik operasyonları durdur
      CriticalOperationManager.clearAllLocks();

      // Acil bellek temizliği
      await memoryManager.emergencyCleanup();
      await imageProcessor.emergencyMemoryRecovery();

      // Ürünleri depolamadan yeniden yükle
      await get().loadProducts();

      console.log(`✅ [${Platform.OS}] Emergency recovery completed`);
    } catch (error) {
      console.error(`❌ [${Platform.OS}] Emergency recovery failed:`, error);
    }
  },

  /**
   * ✅ Performance Monitoring
   * Uygulamanın performans istatistiklerini (bellek, veri, kritik operasyonlar) döndürür.
   * @returns Performans istatistiklerini içeren bir nesne.
   */
  getPerformanceStats: () => {
    const memoryStats = get().getMemoryStatus();
    const products = get().products;

    return {
      platform: Platform.OS,
      memory: memoryStats,
      data: {
        products: products.length,
        photos: products.reduce((total, p) => total + p.photos.length, 0),
        rawPhotos: products.reduce((total, p) =>
          total + p.photos.filter(ph => ph.status === 'raw').length, 0
        ),
        processedPhotos: products.reduce((total, p) =>
          total + p.photos.filter(ph => ph.status === 'processed').length, 0
        ),
      },
      criticalOperations: CriticalOperationManager.getStats(),
      lastUpdate: new Date().toISOString(),
    };
  },
}));
