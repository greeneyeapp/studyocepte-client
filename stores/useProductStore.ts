// stores/useProductStore.ts - GERÇEK ZAMANLI THUMBNAIL GÜNCELLEMELİ VERSİYON
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '@/services/api';
import { fileSystemManager } from '@/services/fileSystemManager';
import { imageProcessor } from '@/services/imageProcessor';

export interface ProductPhoto {
  id: string;
  productId: string;
  originalUri: string;
  thumbnailUri: string;
  processedUri?: string;
  status: 'raw' | 'processing' | 'processed';
  createdAt: string;
  modifiedAt: string;
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
  isLoading: boolean;
  isProcessing: boolean;
  processingMessage: string;
  error: string | null;
  
  // Temel işlemler
  loadProducts: () => Promise<void>;
  createProduct: (name: string) => Promise<Product>;
  deleteProduct: (productId: string) => Promise<void>;
  updateProductName: (productId: string, name: string) => Promise<void>;
  
  // Fotoğraf işlemleri
  addMultiplePhotos: (productId: string, imageUris: string[]) => Promise<boolean>;
  deletePhoto: (productId: string, photoId: string) => Promise<void>;
  removeMultipleBackgrounds: (productId: string, photoIds: string[]) => Promise<boolean>;
  
  // Yardımcı fonksiyonlar
  getProductById: (productId: string) => Product | undefined;
  getPhotoById: (productId: string, photoId: string) => ProductPhoto | undefined;
  
  // YENİ: Gerçek zamanlı güncelleme fonksiyonları
  updatePhotoStatus: (productId: string, photoId: string, status: ProductPhoto['status']) => void;
  updatePhotoProcessedUri: (productId: string, photoId: string, processedUri: string) => void;
  updatePhotoThumbnail: (productId: string, photoId: string, thumbnailUri: string) => void;
}

const STORAGE_KEY = 'studyo_products';

export const useProductStore = create<ProductStore>((set, get) => ({
  products: [],
  isLoading: false,
  isProcessing: false,
  processingMessage: '',
  error: null,

  loadProducts: async () => {
    set({ isLoading: true, error: null });
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      const products = stored ? JSON.parse(stored) : [];
      set({ products, isLoading: false });
    } catch (error: any) {
      console.error('Ürünler yüklenemedi:', error);
      set({ error: error.message, isLoading: false });
    }
  },

  createProduct: async (name: string): Promise<Product> => {
    const newProduct: Product = {
      id: `product_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
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
  },

  deleteProduct: async (productId: string): Promise<void> => {
    await fileSystemManager.deleteProductDirectory(productId);
    const updatedProducts = get().products.filter(p => p.id !== productId);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProducts));
    set({ products: updatedProducts });
  },

  updateProductName: async (productId: string, name: string): Promise<void> => {
    const updatedProducts = get().products.map(product => 
      product.id === productId 
        ? { ...product, name, modifiedAt: new Date().toISOString() }
        : product
    );
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProducts));
    set({ products: updatedProducts });
  },

  addMultiplePhotos: async (productId: string, imageUris: string[]): Promise<boolean> => {
    set({ isProcessing: true, processingMessage: 'Fotoğraflar ekleniyor...', error: null });
    
    try {
      const product = get().products.find(p => p.id === productId);
      if (!product) throw new Error('Ürün bulunamadı');

      const newPhotos: ProductPhoto[] = [];
      
      for (const [index, uri] of imageUris.entries()) {
        set({ processingMessage: `Fotoğraf işleniyor: ${index + 1}/${imageUris.length}` });
        
        const photoId = `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const timestamp = new Date().toISOString();
        
        // Orijinal fotoğrafı kaydet
        const originalFilename = `original_${photoId}.jpg`;
        const originalUri = await fileSystemManager.saveImage(productId, uri, originalFilename);
        
        // Thumbnail oluştur
        const thumbnailUri = await imageProcessor.createThumbnail(originalUri);
        const thumbnailFilename = `thumb_${photoId}.jpg`;
        const finalThumbnailUri = await fileSystemManager.saveImage(productId, thumbnailUri, thumbnailFilename);
        
        const newPhoto: ProductPhoto = {
          id: photoId,
          productId,
          originalUri,
          thumbnailUri: finalThumbnailUri,
          status: 'raw',
          createdAt: timestamp,
          modifiedAt: timestamp,
        };
        
        newPhotos.push(newPhoto);
      }

      // Ürünü güncelle
      const updatedProducts = get().products.map(p => 
        p.id === productId 
          ? { ...p, photos: [...p.photos, ...newPhotos], modifiedAt: new Date().toISOString() }
          : p
      );
      
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProducts));
      set({ products: updatedProducts, isProcessing: false, processingMessage: '' });
      return true;
      
    } catch (error: any) {
      console.error('Fotoğraf ekleme hatası:', error);
      set({ error: error.message, isProcessing: false, processingMessage: '' });
      return false;
    }
  },

  deletePhoto: async (productId: string, photoId: string): Promise<void> => {
    const product = get().products.find(p => p.id === productId);
    const photo = product?.photos.find(p => p.id === photoId);
    
    if (photo) {
      // Dosyaları sil
      await fileSystemManager.deleteImage(photo.originalUri);
      await fileSystemManager.deleteImage(photo.thumbnailUri);
      if (photo.processedUri) {
        await fileSystemManager.deleteImage(photo.processedUri);
      }
    }

    const updatedProducts = get().products.map(p => 
      p.id === productId 
        ? { ...p, photos: p.photos.filter(photo => photo.id !== photoId), modifiedAt: new Date().toISOString() }
        : p
    );
    
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProducts));
    set({ products: updatedProducts });
  },

  removeMultipleBackgrounds: async (productId: string, photoIds: string[]): Promise<boolean> => {
    set({ isProcessing: true, processingMessage: 'Arka planlar temizleniyor...', error: null });
    
    try {
      const product = get().products.find(p => p.id === productId);
      if (!product) throw new Error('Ürün bulunamadı');

      // Sadece raw durumundaki fotoğrafları filtrele
      const photosToProcess = product.photos.filter(photo => 
        photoIds.includes(photo.id) && photo.status === 'raw'
      );

      if (photosToProcess.length === 0) {
        throw new Error('İşlenecek fotoğraf bulunamadı');
      }

      // Fotoğraf durumlarını 'processing' olarak güncelle
      photosToProcess.forEach(photo => {
        get().updatePhotoStatus(productId, photo.id, 'processing');
      });

      // API'ye gönderilecek dosya listesini hazırla
      const photosForApi = photosToProcess.map(photo => ({
        filename: `photo_${photo.id}.jpg`,
        uri: photo.originalUri
      }));

      set({ processingMessage: 'Arka planlar temizleniyor...' });

      // API çağrısı yap
      const result = await api.removeMultipleBackgrounds(photosForApi);

      // Başarılı sonuçları işle
      let processedCount = 0;
      const updatedProducts = [...get().products];
      const targetProduct = updatedProducts.find(p => p.id === productId);
      
      if (targetProduct) {
        for (const [filename, base64Data] of Object.entries(result.success)) {
          const photoId = filename.replace('photo_', '').replace('.jpg', '');
          const photo = targetProduct.photos.find(p => p.id === photoId);
          
          if (photo && base64Data) {
            set({ processingMessage: `İşlenen fotoğraf kaydediliyor: ${++processedCount}/${Object.keys(result.success).length}` });
            
            try {
              // Base64 veriyi dosyaya dönüştür
              const processedFilename = `processed_${photoId}.png`;
              const processedUri = await fileSystemManager.saveBase64Image(productId, base64Data, processedFilename);
              
              console.log('✅ İşlenmiş fotoğraf kaydedildi:', processedUri);
              
              // YENİ: İşlenmiş fotoğraftan yeni thumbnail oluştur
              const newThumbnailUri = await imageProcessor.createThumbnail(processedUri);
              const newThumbnailFilename = `thumb_processed_${photoId}.jpg`;
              const finalNewThumbnailUri = await fileSystemManager.saveImage(productId, newThumbnailUri, newThumbnailFilename);
              
              console.log('✅ Yeni thumbnail oluşturuldu:', finalNewThumbnailUri);
              
              // Eski thumbnail'i sil
              await fileSystemManager.deleteImage(photo.thumbnailUri);
              
              // Fotoğraf bilgilerini güncelle
              photo.processedUri = processedUri;
              photo.thumbnailUri = finalNewThumbnailUri; // YENİ: Thumbnail'i güncelle
              photo.status = 'processed';
              photo.modifiedAt = new Date().toISOString();
              
              console.log('✅ Fotoğraf bilgileri güncellendi:', {
                photoId,
                status: photo.status,
                hasProcessedUri: !!photo.processedUri,
                thumbnailUpdated: true
              });
              
            } catch (fileError) {
              console.error(`❌ Fotoğraf ${photoId} kaydedilemedi:`, fileError);
              console.error('🔍 Dosya kaydetme detayları:', {
                photoId,
                base64Size: base64Data.length,
                error: fileError.message
              });
              photo.status = 'raw'; // Hata durumunda raw'a geri dön
            }
          }
        }

        // Hatalı sonuçları işle
        for (const [filename, errorMessage] of Object.entries(result.errors)) {
          const photoId = filename.replace('photo_', '').replace('.jpg', '');
          const photo = targetProduct.photos.find(p => p.id === photoId);
          if (photo) {
            photo.status = 'raw'; // Hata durumunda raw'a geri dön
            console.error(`Fotoğraf ${photoId} işlenemedi:`, errorMessage);
          }
        }

        targetProduct.modifiedAt = new Date().toISOString();
      }

      // Store'u güncelle ve kaydet
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProducts));
      set({ products: updatedProducts, isProcessing: false, processingMessage: '' });

      // Sonuç raporu
      const successCount = Object.keys(result.success).length;
      const errorCount = Object.keys(result.errors).length;
      
      if (successCount > 0 && errorCount === 0) {
        return true; // Tamamen başarılı
      } else if (successCount > 0) {
        set({ error: `${successCount} fotoğraf işlendi, ${errorCount} fotoğrafta hata oluştu.` });
        return true; // Kısmen başarılı
      } else {
        throw new Error('Hiçbir fotoğraf işlenemedi.');
      }

    } catch (error: any) {
      console.error('Arka plan temizleme hatası:', error);
      
      // Hata durumunda tüm fotoğrafları raw durumuna geri döndür
      const updatedProducts = get().products.map(p => 
        p.id === productId 
          ? { 
              ...p, 
              photos: p.photos.map(photo => 
                photoIds.includes(photo.id) 
                  ? { ...photo, status: 'raw' as const, modifiedAt: new Date().toISOString() }
                  : photo
              ),
              modifiedAt: new Date().toISOString()
            }
          : p
      );
      
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProducts));
      set({ products: updatedProducts, error: error.message, isProcessing: false, processingMessage: '' });
      return false;
    }
  },

  getProductById: (productId: string) => {
    return get().products.find(p => p.id === productId);
  },

  getPhotoById: (productId: string, photoId: string) => {
    const product = get().getProductById(productId);
    return product?.photos.find(p => p.id === photoId);
  },

  // YENİ: Gerçek zamanlı güncelleme fonksiyonları
  updatePhotoStatus: (productId: string, photoId: string, status: ProductPhoto['status']) => {
    const updatedProducts = get().products.map(p => 
      p.id === productId 
        ? { 
            ...p, 
            photos: p.photos.map(photo => 
              photo.id === photoId 
                ? { ...photo, status, modifiedAt: new Date().toISOString() }
                : photo
            ),
            modifiedAt: new Date().toISOString()
          }
        : p
    );
    set({ products: updatedProducts });
    // AsyncStorage'e kaydet (background'da)
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProducts));
  },

  updatePhotoProcessedUri: (productId: string, photoId: string, processedUri: string) => {
    const updatedProducts = get().products.map(p => 
      p.id === productId 
        ? { 
            ...p, 
            photos: p.photos.map(photo => 
              photo.id === photoId 
                ? { ...photo, processedUri, modifiedAt: new Date().toISOString() }
                : photo
            ),
            modifiedAt: new Date().toISOString()
          }
        : p
    );
    set({ products: updatedProducts });
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProducts));
  },

  updatePhotoThumbnail: (productId: string, photoId: string, thumbnailUri: string) => {
    const updatedProducts = get().products.map(p => 
      p.id === productId 
        ? { 
            ...p, 
            photos: p.photos.map(photo => 
              photo.id === photoId 
                ? { ...photo, thumbnailUri, modifiedAt: new Date().toISOString() }
                : photo
            ),
            modifiedAt: new Date().toISOString()
          }
        : p
    );
    set({ products: updatedProducts });
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProducts));
  },
}));