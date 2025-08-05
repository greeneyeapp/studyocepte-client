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

// DÜZELTME: global nesnesine 'gc' metodu ekle ve __DEV__ için tip tanımı yap
declare global {
  var gc: (() => void) | undefined;
  var __DEV__: boolean;
}

interface OptimizedFlatListProps<T> extends Omit<FlatListProps<T>, 'renderItem' | 'data'> {
  renderItem: ListRenderItem<T>;
  data: T[] | null; // DÜZELTME: data'nın null olabileceğini belirt
  // YENİ: Performance optimizations
  enableVirtualization?: boolean;
  preloadDistance?: number;
  maxToRenderPerBatch?: number;
  windowSize?: number;
  removeClippedSubviews?: boolean;
  // YENİ: Progressive loading
  enableProgressiveLoading?: boolean;
  onEndReachedThreshold?: number;
  // YENİ: Memory management
  enableMemoryOptimization?: boolean;
  memoryCleanupThreshold?: number;
  // YENİ: Image preloading
  imageExtractor?: (item: T) => string | string[];
  // YENİ: Loading states
  isLoading?: boolean;
  isEmpty?: boolean;
  emptyComponent?: React.ReactNode;
  loadingComponent?: React.ReactNode;
  // YENİ: Refresh control
  onRefresh?: () => void;
  refreshing?: boolean;
}

// DÜZELTME: Bileşen tipini doğru şekilde tanımlayarak ref hatasını gider
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
  ref: React.Ref<FlatList<T>> // DÜZELTME: Ref'i bileşene forward et
) => {
  const flatListRef = useRef<FlatList<T>>(null);
  
  // DÜZELTME: ref forwarding ile kendi ref'imizi birleştir
  const resolvedRef = useCallback((node: FlatList<T> | null) => {
    flatListRef.current = node;
    if (typeof ref === 'function') {
      ref(node);
    } else if (ref) {
      ref.current = node;
    }
  }, [ref]);

  const viewabilityConfigRef = useRef({
    viewAreaCoveragePercentThreshold: 50,
    waitForInteraction: true,
  });

  const renderCountRef = useRef(0);

  const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (!imageExtractor || !enableProgressiveLoading || !data) return; // DÜZELTME: data null kontrolü

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

  useEffect(() => {
    if (!enableMemoryOptimization) return;

    const cleanupMemory = () => {
      renderCountRef.current++;
      
      if (renderCountRef.current > memoryCleanupThreshold) {
        console.log('🧹 Cleaning up FlatList memory...');
        LazyImageUtils.optimizeMemory();
        renderCountRef.current = 0;
        
        if (__DEV__ && typeof global.gc === 'function') {
          global.gc();
        }
      }
    };

    const timer = setInterval(cleanupMemory, 30000);
    return () => clearInterval(timer);
  }, [enableMemoryOptimization, memoryCleanupThreshold]);

  const optimizedRenderItem: ListRenderItem<T> = useCallback((info) => {
    renderCountRef.current++;
    return renderItem(info);
  }, [renderItem]);

  const getItemLayout = useCallback((_data: ArrayLike<T> | null | undefined, index: number) => {
    const ITEM_HEIGHT = 200;
    return {
      length: ITEM_HEIGHT,
      offset: ITEM_HEIGHT * index,
      index,
    };
  }, []);

  const keyExtractor = useCallback((item: T, index: number) => {
    // DÜZELTME: item.id'ye güvenli erişim için tip kontrolü
    if (item && typeof item === 'object' && 'id' in item && item.id != null) {
      return String(item.id);
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
    initialNumToRender: Math.min(data ? data.length : 0, 15), // DÜZELTME: data null kontrolü
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
            <Text style={styles.emptyTitle}>Henüz içerik yok</Text>
            <Text style={styles.emptySubtitle}>İçerik eklendiğinde burada görünecek</Text>
          </>
        )}
      </View>
    );
  }

  if (isLoading && (!data || data.length === 0)) { // DÜZELTME: data null kontrolü
    return (
      <View style={styles.loadingContainer}>
        {loadingComponent || (
          <>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Yükleniyor...</Text>
          </>
        )}
      </View>
    );
  }

  return (
    <FlatList
      ref={resolvedRef} // DÜZELTME: Düzeltilmiş ref'i kullan
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

// DÜZELTME: Bileşeni memo ve forwardRef ile sarmala
export const OptimizedFlatList = memo(React.forwardRef(OptimizedFlatListComponent));

// ... (FlatListUtils ve styles kısmı aynı kalıyor)
export const FlatListUtils = {
  /**
    * Scroll to item with animation
    */
  scrollToItem: <T,>(
    ref: React.RefObject<FlatList<T>>, 
    item: T, 
    animated: boolean = true
  ) => {
    ref.current?.scrollToItem({ item, animated });
  },

  /**
    * Scroll to index with animation
    */
  scrollToIndex: <T,>(
    ref: React.RefObject<FlatList<T>>, 
    index: number, 
    animated: boolean = true
  ) => {
    ref.current?.scrollToIndex({ index, animated });
  },

  /**
    * Scroll to top
    */
  scrollToTop: <T,>(
    ref: React.RefObject<FlatList<T>>, 
    animated: boolean = true
  ) => {
    ref.current?.scrollToOffset({ offset: 0, animated });
  },

  /**
    * Force refresh
    */
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