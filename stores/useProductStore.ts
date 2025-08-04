import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import * as FileSystem from 'expo-file-system';
import * as Haptics from 'expo-haptics';

import { api } from '@/services/api';
import { fileSystemManager } from '@/services/fileSystemManager';
import { imageProcessor } from '@/services/imageProcessor';
import { EditorSettings } from './useEnhancedEditorStore';

// --- Arayüzler ---
export interface ProductPhoto {
  id: string;
  productId: string;
  originalUri: string;
  processedUri: string | null;
  thumbnailUri: string;
  createdAt: string;
  modifiedAt: number;
  editorSettings?: EditorSettings;
  status: 'raw' | 'processing' | 'processed';
}

export interface Product {
  id: string;
  name: string;
  createdAt: string;
  modifiedAt: number;
  photos: ProductPhoto[];
}

interface ProductState {
  products: Product[];
  isLoading: boolean;
  isProcessing: boolean;
  processingMessage: string;
  error: string | null;
}

interface ProductActions {
  loadProducts: () => void;
  createProduct: (name: string) => Promise<Product>;
  deleteProduct: (productId: string) => Promise<void>;
  addMultiplePhotos: (productId: string, originalImageUris: string[]) => Promise<boolean>;
  deletePhoto: (productId: string, photoId: string) => Promise<void>;
  removeMultipleBackgrounds: (productId: string, photoIds: string[]) => Promise<boolean>;
  updatePhotoSettings: (productId: string, photoId: string, settings: EditorSettings) => void;
  getProductById: (productId: string) => Product | undefined;
}

export const useProductStore = create<ProductState & ProductActions>()(
  persist(
    (set, get) => ({
      products: [],
      isLoading: false,
      isProcessing: false,
      processingMessage: '',
      error: null,

      loadProducts: () => {},

      createProduct: async (name: string): Promise<Product> => {
        const now = Date.now();
        const newProduct: Product = {
          id: uuidv4(), name, createdAt: new Date(now).toISOString(), modifiedAt: now, photos: [],
        };
        await fileSystemManager.createProductDirectory(newProduct.id);
        set(state => ({ products: [newProduct, ...state.products] }));
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        return newProduct;
      },

      deleteProduct: async (productId: string) => {
        set(state => ({ products: state.products.filter(p => p.id !== productId) }));
        await fileSystemManager.deleteProductDirectory(productId);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      },

      addMultiplePhotos: async (productId: string, originalImageUris: string[]): Promise<boolean> => {
        set({ isProcessing: true, processingMessage: `0 / ${originalImageUris.length} fotoğraf ekleniyor...` });
        const now = Date.now();
        const newPhotos: ProductPhoto[] = [];
        try {
            for (const [index, uri] of originalImageUris.entries()) {
              set({ processingMessage: `${index + 1} / ${originalImageUris.length} fotoğraf ekleniyor...` });
              const photoId = uuidv4();
              const originalUri = await fileSystemManager.saveImage(productId, uri, `${photoId}-original.jpg`);
              const thumbnailTempUri = await imageProcessor.createThumbnail(originalUri);
              const thumbnailUri = await fileSystemManager.saveImage(productId, thumbnailTempUri, `${photoId}-thumb.jpg`);
              newPhotos.push({
                id: photoId, productId, originalUri, thumbnailUri,
                processedUri: null, status: 'raw',
                createdAt: new Date(now).toISOString(), modifiedAt: now,
              });
            }
            set(state => ({
              products: state.products.map(p =>
                p.id === productId ? { ...p, photos: [...newPhotos, ...p.photos], modifiedAt: now } : p
              ),
            }));
            return true; // Başarılı olduğunu belirtmek için true dön
        } catch (error: any) {
            console.error("Fotoğraf ekleme hatası:", error);
            set({ error: "Fotoğraflar eklenirken bir sorun oluştu." });
            return false; // Başarısız olduğunu belirt
        } finally {
            set({ isProcessing: false, processingMessage: '' });
        }
      },
      
      removeMultipleBackgrounds: async (productId: string, photoIds: string[]): Promise<boolean> => {
        const product = get().getProductById(productId);
        if (!product) return false;
        const photosToProcess = product.photos.filter(p => photoIds.includes(p.id) && p.status === 'raw');
        if (photosToProcess.length === 0) return true;
        
        set({ isProcessing: true, processingMessage: `0 / ${photosToProcess.length} arka plan temizleniyor...` });

        try {
          const photoPayload = photosToProcess.map(p => ({ filename: `${p.id}-original.jpg`, uri: p.originalUri }));
          const results = await api.removeMultipleBackgrounds(photoPayload);
          
          const now = Date.now();
          const updatedPhotos: Partial<ProductPhoto>[] = [];
          for (const filename in results.success) {
            const photoId = filename.split('-')[0];
            const originalPhoto = photosToProcess.find(p => p.id === photoId);
            if (!originalPhoto) continue;
            const tempUri = FileSystem.cacheDirectory + `processed-${photoId}.png`;
            await FileSystem.writeAsStringAsync(tempUri, results.success[filename], { encoding: FileSystem.EncodingType.Base64 });
            const processedUri = await fileSystemManager.saveImage(productId, tempUri, `${photoId}-processed.png`);
            await fileSystemManager.deleteImage(originalPhoto.thumbnailUri);
            const newThumbnailTempUri = await imageProcessor.createThumbnail(processedUri);
            const thumbnailUri = await fileSystemManager.saveImage(productId, newThumbnailTempUri, `${photoId}-thumb.jpg`);
            updatedPhotos.push({ id: photoId, status: 'processed', processedUri, thumbnailUri, modifiedAt: now });
          }

          set(state => ({
            products: state.products.map(p => p.id === productId ? {
              ...p, modifiedAt: now,
              photos: p.photos.map(ph => {
                const update = updatedPhotos.find(u => u.id === ph.id);
                if (update) return { ...ph, ...update };
                if (results.errors[`${ph.id}-original.jpg`]) return { ...ph, status: 'raw', modifiedAt: now };
                return ph;
              })
            } : p)
          }));
          return true;
        } catch (error: any) {
          console.error("Arka plan temizleme hatası:", error);
          set(state => ({
            products: state.products.map(p => p.id === productId ? {
              ...p, photos: p.photos.map(ph => photoIds.includes(ph.id) ? { ...ph, status: 'raw' } : ph)
            } : p),
            error: error.message
          }));
          return false;
        } finally {
          set({ isProcessing: false, processingMessage: '' });
        }
      },

      deletePhoto: async (productId: string, photoId: string) => {
        const product = get().getProductById(productId);
        const photo = product?.photos.find(p => p.id === photoId);
        if (!photo) return;
        set(state => ({
          products: state.products.map(p =>
            p.id === productId ? { ...p, photos: p.photos.filter(ph => ph.id !== photoId), modifiedAt: Date.now() } : p
          ),
        }));
        await Promise.all([
            fileSystemManager.deleteImage(photo.originalUri),
            fileSystemManager.deleteImage(photo.processedUri || ''),
            fileSystemManager.deleteImage(photo.thumbnailUri),
        ]);
      },
      
      updatePhotoSettings: (productId, photoId, settings) => {
          const now = Date.now();
          set(state => ({
              products: state.products.map(p =>
                  p.id === productId ? {
                      ...p, modifiedAt: now,
                      photos: p.photos.map(ph =>
                          ph.id === photoId ? { ...ph, editorSettings: settings, modifiedAt: now } : ph
                      )
                  } : p
              )
          }));
      },

      getProductById: (productId: string) => get().products.find(p => p.id === productId),
    }),
    {
      name: 'studyo-cepte-products-v3',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

useProductStore.getState().loadProducts();