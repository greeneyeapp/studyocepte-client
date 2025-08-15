// components/OptimizedFlatList.tsx - Performance optimized FlatList
import React, { memo, useCallback, useMemo, useRef, useEffect } from 'react';
import { 
  FlatList, 
  FlatListProps, 
  ViewToken, 
  ListRenderItem,
  RefreshControl,
  View,
  Text,
  StyleSheet,
  ActivityIndicator
} from 'react-native';
import { Colors, Typography, Spacing } from '@/constants';
import { LazyImageUtils } from './LazyImage';
import { useTranslation } from 'react-i18next';
import { memoryManager } from '@/services/memoryManager'; // memoryManager import edildi

// DÜZELTME: global nesnesine 'gc' metodu ekle ve __DEV__ için tip tanımı yap
declare global {
  var gc: (() => void) | undefined;
  var __DEV__: boolean;
}

interface OptimizedFlatListProps<T> extends Omit<FlatListProps<T>, 'renderItem' | 'data'> {
  renderItem: ListRenderItem<T>;
  data: T[] | null;
  enableVirtualization?: boolean;
  preloadDistance?: number;
  maxToRenderPerBatch?: number;
  windowSize?: number;
  removeClippedSubviews?: boolean;
  enableProgressiveLoading?: boolean;
  onEndReachedThreshold?: number;
  enableMemoryOptimization?: boolean;
  memoryCleanupThreshold?: number;
  imageExtractor?: (item: T) => string | string[];
  isLoading?: boolean;
  isEmpty?: boolean;
  emptyComponent?: React.ReactNode;
  loadingComponent?: React.ReactNode;
  onRefresh?: () => void;
  refreshing?: boolean;
}

const OptimizedFlatListComponent = <T,>(
  {
    data = [],
    renderItem,
    enableVirtualization = true,
    preloadDistance = 2,
    maxToRenderPerBatch = 10,
    windowSize = 10,
    removeClippedSubviews = true,
    enableProgressiveLoading = true,
    onEndReachedThreshold = 0.5,
    enableMemoryOptimization = true,
    memoryCleanupThreshold = 50,
    imageExtractor,
    isLoading = false,
    isEmpty = false,
    emptyComponent,
    loadingComponent,
    onRefresh,
    refreshing = false,
    ...props
  }: OptimizedFlatListProps<T>,
  ref: React.Ref<FlatList<T>>
) => {
  const { t } = useTranslation();
  const flatListRef = useRef<FlatList<T>>(null);
  
  const resolvedRef = useCallback((node: FlatList<T> | null) => {
    flatListRef.current = node;
    if (typeof ref === 'function') {
      ref(node);
    } else if (ref) {
      (ref as React.MutableRefObject<FlatList<T> | null>).current = node;
    }
  }, [ref]);

  const viewabilityConfigRef = useRef({
    viewAreaCoveragePercentThreshold: 50,
    waitForInteraction: true,
  });

  const renderCountRef = useRef(0);

  const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (!imageExtractor || !enableProgressiveLoading || !data) return;

    const allItemsToPreload: T[] = [];
    
    viewableItems.forEach(({ item, index }) => {
      if (!item || typeof index !== 'number') return;
      
      allItemsToPreload.push(item);
      
      for (let i = 1; i <= preloadDistance; i++) {
        const nextIndex = index + i;
        const prevIndex = index - i;
        
        if (nextIndex < data.length) {
          allItemsToPreload.push(data[nextIndex]);
        }
        if (prevIndex >= 0) {
          allItemsToPreload.push(data[prevIndex]);
        }
      }
    });

    const imageUrls: string[] = [];
    allItemsToPreload.forEach(item => {
      const urls = imageExtractor(item);
      if (Array.isArray(urls)) {
        imageUrls.push(...urls);
      } else if (urls) {
        imageUrls.push(urls);
      }
    });

    if (imageUrls.length > 0) {
      LazyImageUtils.preloadImages(imageUrls, 'normal');
    }
  }, [imageExtractor, enableProgressiveLoading, preloadDistance, data]);

  // Bellek optimizasyonunu memoryManager aracılığıyla yap
  useEffect(() => {
    if (!enableMemoryOptimization) return;

    const cleanupMemory = () => {
      renderCountRef.current++;
      
      if (renderCountRef.current > memoryCleanupThreshold) {
        console.log(t('home.renderCountLog', { renderCount: renderCountRef.current }));
        // Bellek temizliğini memoryManager üzerinden çağır
        memoryManager.cleanup();
        renderCountRef.current = 0; // Reset counter after cleanup
      }
    };

    const timer = setInterval(cleanupMemory, 30000); // Her 30 saniyede bir kontrol et
    return () => clearInterval(timer);
  }, [enableMemoryOptimization, memoryCleanupThreshold, t]);

  const optimizedRenderItem: ListRenderItem<T> = useCallback((info) => {
    renderCountRef.current++;
    return renderItem(info);
  }, [renderItem]);

  const getItemLayout = useCallback((_data: ArrayLike<T> | null | undefined, index: number) => {
    const ITEM_HEIGHT = 200; // Varsayılan öğe yüksekliği
    return {
      length: ITEM_HEIGHT,
      offset: ITEM_HEIGHT * index,
      index,
    };
  }, []);

  const keyExtractor = useCallback((item: T, index: number) => {
    if (item && typeof item === 'object' && 'id' in item && item.id != null) {
      return String((item as any).id);
    }
    return String(index);
  }, []);
  
  const performanceProps = useMemo(() => ({
    disableVirtualization: !enableVirtualization,
    maxToRenderPerBatch,
    windowSize,
    removeClippedSubviews,
    onEndReachedThreshold,
    getItemLayout: enableVirtualization ? getItemLayout : undefined,
    keyExtractor,
    onViewableItemsChanged: enableProgressiveLoading ? onViewableItemsChanged : undefined,
    viewabilityConfig: enableProgressiveLoading ? viewabilityConfigRef.current : undefined,
    initialNumToRender: Math.min(data ? data.length : 0, 15),
    updateCellsBatchingPeriod: 50,
    legacyImplementation: false,
  }), [
    enableVirtualization,
    maxToRenderPerBatch,
    windowSize,
    removeClippedSubviews,
    onEndReachedThreshold,
    getItemLayout,
    keyExtractor,
    onViewableItemsChanged,
    enableProgressiveLoading,
    data
  ]);

  if (isEmpty && !isLoading) {
    return (
      <View style={styles.emptyContainer}>
        {emptyComponent || (
          <>
            <Text style={styles.emptyTitle}>{t('common.emptyContentTitle')}</Text>
            <Text style={styles.emptySubtitle}>{t('common.emptyContentSubtitle')}</Text>
          </>
        )}
      </View>
    );
  }

  if (isLoading && (!data || data.length === 0)) {
    return (
      <View style={styles.loadingContainer}>
        {loadingComponent || (
          <>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>{t('common.loading')}</Text>
          </>
        )}
      </View>
    );
  }

  return (
    <FlatList
      ref={resolvedRef}
      data={data}
      renderItem={optimizedRenderItem}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        ) : undefined
      }
      {...performanceProps}
      {...props}
    />
  );
};

export const OptimizedFlatList = memo(React.forwardRef(OptimizedFlatListComponent));

export const FlatListUtils = {
  scrollToItem: <T,>(
    ref: React.RefObject<FlatList<T>>, 
    item: T, 
    animated: boolean = true
  ) => {
    ref.current?.scrollToItem({ item, animated });
  },

  scrollToIndex: <T,>(
    ref: React.RefObject<FlatList<T>>, 
    index: number, 
    animated: boolean = true
  ) => {
    ref.current?.scrollToIndex({ index, animated });
  },

  scrollToTop: <T,>(
    ref: React.RefObject<FlatList<T>>, 
    animated: boolean = true
  ) => {
    ref.current?.scrollToOffset({ offset: 0, animated });
  },

  refresh: <T,>(ref: React.RefObject<FlatList<T>>) => {
    ref.current?.scrollToOffset({ offset: 1, animated: false });
    setTimeout(() => {
      ref.current?.scrollToOffset({ offset: 0, animated: false });
    }, 50);
  },
};

const styles = StyleSheet.create({
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xxxl,
  },

  emptyTitle: {
    ...Typography.h2,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },

  emptySubtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xxxl,
  },

  loadingText: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing.lg,
  },
});