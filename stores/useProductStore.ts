import { create } from 'zustand';
import { api, Product, ProductDetail } from '@/services/api';

interface ProductState {
  products: Product[];
  activeProduct: ProductDetail | null;
  isLoading: boolean;
  error: string | null;
}

interface ProductActions {
  fetchProducts: () => Promise<void>;
  fetchProductById: (productId: string) => Promise<void>;
  createProductAndUpload: (name: string, imageUri: string) => Promise<Product | undefined>;
  uploadAnotherPhoto: (productId: string, imageUri: string) => Promise<void>;
  clearActiveProduct: () => void;
}

export const useProductStore = create<ProductState & ProductActions>((set, get) => ({
  products: [],
  activeProduct: null,
  isLoading: false,
  error: null,

  fetchProducts: async () => {
    set({ isLoading: true, error: null });
    try {
      const products = await api.fetchProducts();
      set({ products, isLoading: false });
    } catch (error: any) {
      set({ error: error.message || 'Ürünler yüklenemedi.', isLoading: false });
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
      await get().fetchProducts();
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
          await get().fetchProductById(productId);
          set({ isLoading: false });
      } catch(error: any) {
          const errorMessage = error.message || 'Yeni fotoğraf yüklenemedi.';
          set({ error: errorMessage, isLoading: false });
          throw new Error(errorMessage);
      }
  },

  clearActiveProduct: () => set({ activeProduct: null }),
}));