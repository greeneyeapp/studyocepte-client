// hooks/useCacheManager.ts - Cache management
export const useCacheManager = () => {
  const [cacheStats, setCacheStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchCacheStats = useCallback(async () => {
    setIsLoading(true);
    try {
      const stats = await api.getCacheStats();
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