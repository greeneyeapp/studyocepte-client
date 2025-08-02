// kodlar/stores/useProductStore.ts - FAZ 3 GÜNCELLEMESİ (Akıllı Senkronizasyon)
import { create } from 'zustand';
import { api, Product, ProductDetail } from '@/services/api';

interface ProductState {
  products: Product[];
  activeProduct: ProductDetail | null;
  isLoading: boolean;
  error: string | null;
  lastFetched: number | null; // YENİ: Son veri çekme zamanını tutar (timestamp)
}

interface ProductActions {
  fetchProducts: (force?: boolean) => Promise<void>; // YENİ: Zorla yenileme parametresi
  fetchProductById: (productId: string) => Promise<void>;
  createProductAndUpload: (name: string, imageUri: string) => Promise<Product | undefined>;
  uploadAnotherPhoto: (productId: string, imageUri: string) => Promise<void>;
  clearActiveProduct: () => void;
  refreshProductsIfNeeded: () => Promise<void>; // YENİ: Akıllı yenileme fonksiyonu
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
    // Eğer zorla yenileme istenmiyorsa ve zaten yükleniyorsa, işlemi tekrar başlatma
    if (!force && get().isLoading) return;

    set({ isLoading: true, error: null });
    try {
      // API'dan optimize edilmiş endpoint'i kullanıyoruz
      const products = await api.fetchProductsOptimized({ include_photos: true });
      set({ products, isLoading: false, lastFetched: Date.now() }); // Başarılı olunca zamanı kaydet
    } catch (error: any) {
      set({ error: error.message || 'Ürünler yüklenemedi.', isLoading: false });
    }
  },

  refreshProductsIfNeeded: async () => {
    const { lastFetched, isLoading } = get();
    // Veri hiç çekilmediyse veya 15 dakikadan eskiyse ve şu an bir yükleme işlemi yoksa yenile
    if (!isLoading && (!lastFetched || Date.now() - lastFetched > REFRESH_THRESHOLD)) {
      console.log('Veri eski, arka planda yenileniyor...');
      await get().fetchProducts(true); // fetchProducts'u zorla yenileme modunda çağır
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
  
  createProductAndUpload: async (name: string, imageUri: string) => {
    set({ isLoading: true });
    try {
      const newProduct = await api.createProduct(name);
      await api.uploadPhoto(newProduct.id, imageUri);
      await get().fetchProducts(true); // Yeni ürün eklenince listeyi zorla yenile
      set({ isLoading: false });
      return newProduct;
    } catch (error: any) {
      const errorMessage = error.message || 'Ürün oluşturulamadı.';
      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage);
    }
  },

  uploadAnotherPhoto: async (productId: string, imageUri: string) => {
      set({ isLoading: true });
      try {
          await api.uploadPhoto(productId, imageUri);
          await get().fetchProductById(productId); // Detay sayfasını yenile
          await get().fetchProducts(true); // Ana listeyi de zorla yenile
          set({ isLoading: false });
      } catch(error: any) {
          const errorMessage = error.message || 'Yeni fotoğraf yüklenemedi.';
          set({ error: errorMessage, isLoading: false });
          throw new Error(errorMessage);
      }
  },

  getProductById: (productId: string) => {
    return get().products.find(p => p.id === productId);
  },

  clearActiveProduct: () => set({ activeProduct: null }),
  clearError: () => set({ error: null }),
}));