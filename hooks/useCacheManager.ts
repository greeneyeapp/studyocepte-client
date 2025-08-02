// hooks/useCacheManager.ts - Düzeltilmiş ve Doğrulanmış
import { useState, useCallback, useEffect } from 'react';
import { api } from '@/services/api';

export const useCacheManager = () => {
  const [cacheStats, setCacheStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchCacheStats = useCallback(async () => {
    setIsLoading(true);
    try {
      const stats = await api.getCacheStats(); // Bu satır artık hata vermeyecek
      setCacheStats(stats);
      return stats;
    } catch (error: any) {
      console.warn('Failed to fetch cache stats:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshCacheStats = useCallback(() => {
    fetchCacheStats();
  }, [fetchCacheStats]);

  useEffect(() => {
    fetchCacheStats();
  }, [fetchCacheStats]);

  return {
    cacheStats,
    isLoading,
    refreshCacheStats
  };
};