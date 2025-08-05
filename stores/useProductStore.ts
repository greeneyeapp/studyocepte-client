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
  isLoading: boolean;
  isProcessing: boolean;
  processingMessage: string;
  error: string | null;
  loadProducts: () => Promise<void>;
  createProduct: (name: string) => Promise<Product>;
  deleteProduct: (productId: string) => Promise<void>;
  updateProductName: (productId: string, name: string) => Promise<void>;
  addMultiplePhotos: (productId: string, imageUris: string[]) => Promise<boolean>;
  deletePhoto: (productId: string, photoId: string) => Promise<void>;
  removeMultipleBackgrounds: (productId: string, photoIds: string[]) => Promise<boolean>;
  getProductById: (productId: string) => Product | undefined;
  updatePhotoSettings: (productId: string, photoId: string, settings: any) => void;
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
      set({ error: error.message, isLoading: false });
    }
  },

  createProduct: async (name: string): Promise<Product> => {
    const newProduct: Product = {
      id: `product_${Date.now()}`, name, photos: [],
      createdAt: new Date().toISOString(), modifiedAt: new Date().toISOString(),
    };
    await fileSystemManager.createProductDirectory(newProduct.id);
    const updatedProducts = [...get().products, newProduct];
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProducts));
    set({ products: updatedProducts });
    return newProduct;
  },
  
  deleteProduct: async (productId: string) => {
    await fileSystemManager.deleteProductDirectory(productId);
    const updatedProducts = get().products.filter(p => p.id !== productId);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProducts));
    set({ products: updatedProducts });
  },

  updateProductName: async (productId, name) => {
    const updatedProducts = get().products.map(p => 
      p.id === productId ? { ...p, name, modifiedAt: new Date().toISOString() } : p
    );
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProducts));
    set({ products: updatedProducts });
  },

  addMultiplePhotos: async (productId, imageUris) => {
    set({ isProcessing: true, processingMessage: 'Fotoğraflar ekleniyor...' });
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
          id: photoId, productId, originalUri, thumbnailUri,
          status: 'raw', createdAt: new Date().toISOString(), modifiedAt: new Date().toISOString(),
        });
      }
      
      const updatedProducts = get().products.map(p => 
        p.id === productId ? { ...p, photos: [...p.photos, ...newPhotos], modifiedAt: new Date().toISOString() } : p
      );
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProducts));
      set({ products: updatedProducts, isProcessing: false });
      return true;
    } catch (error: any) {
      set({ error: error.message, isProcessing: false });
      return false;
    }
  },

  deletePhoto: async (productId, photoId) => {
    const product = get().products.find(p => p.id === productId);
    const photo = product?.photos.find(p => p.id === photoId);
    if (photo) {
      await fileSystemManager.deleteImage(photo.originalUri);
      if (photo.processedUri) await fileSystemManager.deleteImage(photo.processedUri);
      await fileSystemManager.deleteImage(photo.thumbnailUri);
    }
    const updatedProducts = get().products.map(p => 
      p.id === productId ? { ...p, photos: p.photos.filter(ph => ph.id !== photoId), modifiedAt: new Date().toISOString() } : p
    );
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProducts));
    set({ products: updatedProducts });
  },
  
  removeMultipleBackgrounds: async (productId, photoIds) => {
    if (get().isProcessing) return false;

    set({ isProcessing: true, processingMessage: 'Arka plan temizleniyor...', error: null });
    const originalProductsState = JSON.parse(JSON.stringify(get().products));
    
    try {
      const tempProducts = JSON.parse(JSON.stringify(get().products));
      const product = tempProducts.find(p => p.id === productId);
      if (!product) throw new Error('Ürün bulunamadı.');

      const photosToProcess = product.photos.filter(p => photoIds.includes(p.id) && p.status === 'raw');
      if (photosToProcess.length === 0) {
        set({ isProcessing: false });
        return true;
      }
      
      photosToProcess.forEach(p => { p.status = 'processing'; });
      set({ products: tempProducts });

      const apiPayload = photosToProcess.map(p => ({ filename: `${p.id}.jpg`, uri: p.originalUri }));
      const result = await api.removeMultipleBackgrounds(apiPayload);

      const finalProducts = JSON.parse(JSON.stringify(get().products));
      const targetProduct = finalProducts.find(p => p.id === productId);
      if(!targetProduct) throw new Error("İşlem sonrası ürün bulunamadı");
      
      let successCount = 0;
      for (const [id, base64Data] of Object.entries(result.success)) {
        const photoId = id.replace('.jpg', '');
        const photo = targetProduct.photos.find(p => p.id === photoId);
        if (photo) {
          const oldOriginalUri = photo.originalUri;
          const oldThumbnailUri = photo.thumbnailUri;
          const processedFilename = `processed_${photoId}.png`;
          photo.processedUri = await fileSystemManager.saveBase64Image(productId, base64Data, processedFilename);
          photo.originalUri = photo.processedUri;
          photo.thumbnailUri = await imageProcessor.createThumbnail(photo.processedUri, 'png');
          photo.status = 'processed';
          photo.modifiedAt = new Date().toISOString();
          await fileSystemManager.deleteImage(oldOriginalUri);
          await fileSystemManager.deleteImage(oldThumbnailUri);
          successCount++;
        }
      }

      for (const [id] of Object.entries(result.errors)) {
        const photoId = id.replace('.jpg', '');
        const photo = targetProduct.photos.find(p => p.id === photoId);
        if (photo) photo.status = 'raw';
      }

      targetProduct.modifiedAt = new Date().toISOString();
      set({ products: finalProducts, isProcessing: false });
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(finalProducts));
      
      return successCount > 0;

    } catch (error: any) {
      console.error("removeMultipleBackgrounds CATCH_BLOCK:", error);
      set({ error: error.message, isProcessing: false, products: originalProductsState });
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(originalProductsState));
      return false;
    }
  },
  
  updatePhotoSettings: (productId, photoId, settings) => {
    const updatedProducts = get().products.map(p => {
      if (p.id === productId) {
        return { 
          ...p,
          photos: p.photos.map(photo => 
            photo.id === photoId ? { ...photo, editorSettings: settings, modifiedAt: new Date().toISOString() } : photo
          ),
          modifiedAt: new Date().toISOString() 
        };
      }
      return p;
    });
    set({ products: updatedProducts });
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProducts));
  },
  
  getProductById: (productId) => get().products.find(p => p.id === productId),
}));