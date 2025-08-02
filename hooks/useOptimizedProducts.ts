// hooks/useOptimizedProducts.ts - Optimized product fetching with cache
import { useState, useEffect, useCallback } from 'react';
import { api, Product } from '@/services/api';
import { ToastService } from '@/components/Toast/ToastService';

interface UseOptimizedProductsParams {
  limit?: number;
  autoRefresh?: boolean;
  includePhotos?: boolean;
}

export const useOptimizedProducts = (params: UseOptimizedProductsParams = {}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);

  const { limit = 20, autoRefresh = false, includePhotos = true } = params;

  const fetchProducts = useCallback(async (reset = false) => {
    if (isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const currentOffset = reset ? 0 : offset;
      
      const newProducts = await api.fetchProductsOptimized({
        limit,
        offset: currentOffset,
        include_photos: includePhotos,
        sort_by: 'createdAt',
        sort_order: 'desc'
      });

      if (reset) {
        setProducts(newProducts);
        setOffset(newProducts.length);
      } else {
        setProducts(prev => [...prev, ...newProducts]);
        setOffset(prev => prev + newProducts.length);
      }

      setHasMore(newProducts.length === limit);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch products');
      ToastService.show({
        type: 'error',
        text1: 'Error',
        text2: err.message || 'Failed to fetch products'
      });
    } finally {
      setIsLoading(false);
    }
  }, [limit, offset, includePhotos, isLoading]);

  const refresh = useCallback(() => {
    setOffset(0);
    fetchProducts(true);
  }, [fetchProducts]);

  const loadMore = useCallback(() => {
    if (hasMore && !isLoading) {
      fetchProducts(false);
    }
  }, [hasMore, isLoading, fetchProducts]);

  useEffect(() => {
    fetchProducts(true);
  }, [limit, includePhotos]);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(refresh, 30000); // 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refresh]);

  return {
    products,
    isLoading,
    error,
    hasMore,
    refresh,
    loadMore,
    clearError: () => setError(null)
  };
};
