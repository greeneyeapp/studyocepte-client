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

// DÜZELTME: global nesnesine 'gc' metodu ekle
declare global {
  var gc: (() => void) | undefined;
  var __DEV__: boolean; // __DEV__ için tip tanımı
}

interface OptimizedFlatListProps<T> extends Omit<FlatListProps<T>, 'renderItem'> {
  renderItem: ListRenderItem<T>;
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

function OptimizedFlatListComponent<T>({
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
}: OptimizedFlatListProps<T>) {
  const flatListRef = useRef<FlatList<T>>(null);
  const viewabilityConfigRef = useRef({
    viewAreaCoveragePercentThreshold: 50,
    waitForInteraction: true,
  });

  // YENİ: Memory cleanup counter
  const renderCountRef = useRef(0);

  // Viewability change handler for image preloading
  const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (!imageExtractor || !enableProgressiveLoading) return;

    // Görünen itemlar ve yakınındaki itemların resimlerini preload et
    const allItemsToPreload: T[] = [];
    
    viewableItems.forEach(({ item, index }) => {
      if (!item || typeof index !== 'number') return;
      
      // Mevcut item
      allItemsToPreload.push(item);
      
      // Preload distance kadar yakındaki itemlar
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

    // Image URLs'leri çıkar ve preload et
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

  // Memory optimization
  useEffect(() => {
    if (!enableMemoryOptimization) return;

    const cleanupMemory = () => {
      renderCountRef.current++;
      
      if (renderCountRef.current > memoryCleanupThreshold) {
        console.log('🧹 Cleaning up FlatList memory...');
        LazyImageUtils.optimizeMemory();
        renderCountRef.current = 0;
        
        // DÜZELTME: global.gc() kontrolü
        if (__DEV__ && typeof global.gc === 'function') {
          global.gc();
        }
      }
    };

    const timer = setInterval(cleanupMemory, 30000); // 30 saniyede bir kontrol
    return () => clearInterval(timer);
  }, [enableMemoryOptimization, memoryCleanupThreshold]);

  // Optimized renderItem wrapper
  const optimizedRenderItem: ListRenderItem<T> = useCallback((info) => {
    renderCountRef.current++;
    return renderItem(info);
  }, [renderItem]);

  // getItemLayout optimization (eğer itemlar sabit boyutta ise)
  const getItemLayout = useCallback((data: ArrayLike<T> | null | undefined, index: number) => {
    // Bu örnekte 200px sabit yükseklik varsayıyoruz
    // Gerçek uygulamada item tipine göre hesaplanmalı
    const ITEM_HEIGHT = 200;
    return {
      length: ITEM_HEIGHT,
      offset: ITEM_HEIGHT * index,
      index,
    };
  }, []);

  // keyExtractor optimization
  const keyExtractor = useCallback((item: T, index: number) => {
    // Item'da id varsa onu kullan, yoksa index
    if (item && typeof item === 'object' && 'id' in item) {
      return String((item as any).id);
    }
    return String(index);
  }, []);

  // Performance props
  const performanceProps = useMemo(() => ({
    // Virtualization
    disableVirtualization: !enableVirtualization,
    maxToRenderPerBatch,
    windowSize,
    removeClippedSubviews,
    
    // Progressive loading
    onEndReachedThreshold,
    
    // Optimization
    getItemLayout: enableVirtualization ? getItemLayout : undefined,
    keyExtractor,
    
    // Viewability
    onViewableItemsChanged: enableProgressiveLoading ? onViewableItemsChanged : undefined,
    viewabilityConfig: enableProgressiveLoading ? viewabilityConfigRef.current : undefined,
    
    // Performance tuning
    initialNumToRender: Math.min(data.length, 15),
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
    data.length
  ]);

  // Empty state
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

  // Loading state
  if (isLoading && data.length === 0) {
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
      ref={flatListRef}
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
}

// YENİ: FlatList utilities
export const FlatListUtils = {
  /**
    * Scroll to item with animation
    */
  scrollToItem: <T>(
    ref: React.RefObject<FlatList<T>>, 
    item: T, 
    animated: boolean = true
  ) => {
    ref.current?.scrollToItem({ item, animated });
  },

  /**
    * Scroll to index with animation
    */
  scrollToIndex: <T>(
    ref: React.RefObject<FlatList<T>>, 
    index: number, 
    animated: boolean = true
  ) => {
    ref.current?.scrollToIndex({ index, animated });
  },

  /**
    * Scroll to top
    */
  scrollToTop: <T>(
    ref: React.RefObject<FlatList<T>>, 
    animated: boolean = true
  ) => {
    ref.current?.scrollToOffset({ offset: 0, animated });
  },

  /**
    * Force refresh
    */
  refresh: <T>(ref: React.RefObject<FlatList<T>>) => {
    // Force re-render by scrolling slightly
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

export const OptimizedFlatList = memo(OptimizedFlatListComponent) as <T>(
  props: OptimizedFlatListProps<T> & { ref?: React.Ref<FlatList<T>> }
) => React.ReactElement;