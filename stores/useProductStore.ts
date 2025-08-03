// stores/useProductStore.ts - YENİ YAPI GÜNCELLEMESİ
import { create } from 'zustand';
import { api, Product, ProductDetail, ProductPhoto  } from '@/services/api';
import { LoadingService } from '@/components/Loading/LoadingService';

const poll = (fn: () => Promise<boolean>, ms: number) => {
  return new Promise<void>((resolve, reject) => {
    const interval = setInterval(async () => {
      try {
        const done = await fn();
        if (done) {
          clearInterval(interval);
          resolve();
        }
      } catch (error) {
        clearInterval(interval);
        reject(error);
      }
    }, ms);
  });
};

interface ProductState {
  products: Product[];
  activeProduct: ProductDetail | null;
  isLoading: boolean;
  error: string | null;
  lastFetched: number | null;
}

interface ProductActions {
  fetchProducts: (force?: boolean) => Promise<void>;
  fetchProductById: (productId: string) => Promise<void>;
  createProduct: (name: string) => Promise<Product | undefined>; // Değiştirildi
  uploadMultiplePhotos: (productId: string, imageUris: string[]) => Promise<void>; // Yeni
  clearActiveProduct: () => void;
  refreshProductsIfNeeded: () => Promise<void>;
  getProductById: (productId: string) => Product | undefined;
  clearError: () => void;
}

const REFRESH_THRESHOLD = 15 * 60 * 1000; // 15 dakika

export const useProductStore = create<ProductState & ProductActions>((set, get) => ({
  products: [],
  activeProduct: null,
  isLoading: false,
  error: null,
  lastFetched: null,

  fetchProducts: async (force = false) => {
    if (!force && get().isLoading) return;
    set({ isLoading: true, error: null });
    try {
      const products = await api.fetchProductsOptimized({ include_photos: true });
      set({ products, isLoading: false, lastFetched: Date.now() });
    } catch (error: any) {
      set({ error: error.message || 'Ürünler yüklenemedi.', isLoading: false });
    }
  },

  refreshProductsIfNeeded: async () => {
    const { lastFetched, isLoading } = get();
    if (!isLoading && (!lastFetched || Date.now() - lastFetched > REFRESH_THRESHOLD)) {
      await get().fetchProducts(true);
    }
  },

  fetchProductById: async (productId: string) => {
    set({ isLoading: true, error: null, activeProduct: null });
    try {
      const product = await api.fetchProductById(productId);
      set({ activeProduct: product, isLoading: false });
    } catch (error: any) {
      set({ error: error.message || 'Ürün detayı alınamadı.', isLoading: false });
    }
  },

  // Sadece ürün oluşturan yeni fonksiyon
  createProduct: async (name: string) => {
    set({ isLoading: true });
    try {
      const newProduct = await api.createProduct(name);
      await get().fetchProducts(true); // Listeyi yenile
      set({ isLoading: false });
      return newProduct;
    } catch (error: any) {
      const errorMessage = error.message || 'Ürün oluşturulamadı.';
      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage);
    }
  },

  uploadMultiplePhotos: async (productId: string, imageUris: string[]) => {
    // Yükleme başladığında Loading'i metinsiz göster
    LoadingService.show();
    let uploadedPhotos: ProductPhoto[] = [];

    try {
      for (const uri of imageUris) {
        if (uri && typeof uri === 'string') {
          const newPhoto = await api.uploadPhoto(productId, uri);
          uploadedPhotos.push(newPhoto);
        }
      }

      // Yükleme bitti, şimdi arka plan temizlemeyi takip et
      const total = uploadedPhotos.length;
      if (total > 0) {
        let completed = 0;
        LoadingService.show(`0 / ${total} fotoğraf işlendi...`);

        // Her fotoğrafın durumunu periyodik olarak kontrol et
        await Promise.all(uploadedPhotos.map(async (photo) => {
          await poll(async () => {
            const statusRes = await api.getPhotoStatus(photo.id); // API'ye yeni endpoint'i çağır
            if (statusRes.status === 'completed' || statusRes.status === 'failed') {
              completed++;
              LoadingService.show(`${completed} / ${total} fotoğraf işlendi...`);
              return true; // Polling'i durdur
            }
            return false; // Devam et
          }, 2000); // Her 2 saniyede bir kontrol et
        }));
      }

      await get().fetchProductById(productId);
      await get().fetchProducts(true);

    } catch (error: any) {
      throw new Error(error.message || 'Fotoğraflar yüklenemedi.');
    } finally {
      LoadingService.hide();
    }
  },

  getProductById: (productId: string) => {
    return get().products.find(p => p.id === productId);
  },

  clearActiveProduct: () => set({ activeProduct: null }),
  clearError: () => set({ error: null }),
}));