// components/OptimizedProductGrid.tsx - Düzeltilmiş versiyon
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  FlatList,
  Dimensions,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Text,
  TouchableOpacity,
} from 'react-native';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants';
import { LazyImage } from '@/components/LazyImage';
import { Card } from '@/components/Card';
import { Product } from '@/services/api';
import { useProductStore } from '@/stores/useProductStore';
import { Layout } from '@/constants/Layout';

interface OptimizedProductGridProps {
  onProductPress: (product: Product) => void;
  searchQuery?: string;
  sortBy?: 'name' | 'createdAt' | 'photoCount';
  sortOrder?: 'asc' | 'desc';
}

const ITEM_HEIGHT = 220;
const GRID_SPACING = Spacing.sm;

// ProductGridItem component - inline tanımı
interface ProductGridItemProps {
  product: Product;
  onPress: () => void;
  style?: any;
  priority?: 'low' | 'normal' | 'high';
}

const ProductGridItem: React.FC<ProductGridItemProps> = ({
  product,
  onPress,
  style,
  priority = 'normal'
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <View style={[itemStyles.itemContainer, style]}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        <Card padding="none">
          <View style={itemStyles.imageContainer}>
            <LazyImage
              uri={product.coverThumbnailUrl || ''}
              style={itemStyles.productImage}
              priority={priority}
              onLoad={() => setImageLoaded(true)}
              placeholder={
                <View style={itemStyles.imagePlaceholder}>
                  <ActivityIndicator size="small" color={Colors.primary} />
                </View>
              }
            />
            {!imageLoaded && (
              <View style={itemStyles.imageOverlay}>
                <ActivityIndicator size="small" color={Colors.card} />
              </View>
            )}
          </View>
          <View style={itemStyles.productInfo}>
            <Text style={itemStyles.productName} numberOfLines={1}>
              {product.name}
            </Text>
            <Text style={itemStyles.photoCount}>
              {product.photoCount} fotoğraf
            </Text>
          </View>
        </Card>
      </TouchableOpacity>
    </View>
  );
};

export const OptimizedProductGrid: React.FC<OptimizedProductGridProps> = ({
  onProductPress,
  searchQuery = '',
  sortBy = 'createdAt',
  sortOrder = 'desc'
}) => {
  const { products, isLoading, fetchProducts, error } = useProductStore();
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const screenWidth = Dimensions.get('window').width;
  const numColumns = Layout.isTablet ? 4 : 3;
  const itemWidth = (screenWidth - (numColumns + 1) * GRID_SPACING) / numColumns;

  // Memoized filtered and sorted products
  const filteredProducts = useMemo(() => {
    let filtered = products;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = products.filter(product =>
        product.name.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'photoCount':
          comparison = a.photoCount - b.photoCount;
          break;
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });

    return filtered;
  }, [products, searchQuery, sortBy, sortOrder]);

  // Pagination logic
  const paginatedProducts = useMemo(() => {
    const pageSize = 20;
    return filteredProducts.slice(0, page * pageSize);
  }, [filteredProducts, page]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setPage(1);
    try {
      await fetchProducts();
    } finally {
      setRefreshing(false);
    }
  }, [fetchProducts]);

  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore && paginatedProducts.length < filteredProducts.length) {
      setLoadingMore(true);
      setTimeout(() => {
        setPage(prev => prev + 1);
        setLoadingMore(false);
      }, 500);
    }
  }, [loadingMore, hasMore, paginatedProducts.length, filteredProducts.length]);

  const renderProductItem = useCallback(({ item, index }: { item: Product; index: number }) => (
    <ProductGridItem
      product={item}
      onPress={() => onProductPress(item)}
      style={{ width: itemWidth, marginBottom: GRID_SPACING }}
      priority={index < 6 ? 'high' : 'normal'} // First 6 items high priority
    />
  ), [onProductPress, itemWidth]);

  const keyExtractor = useCallback((item: Product) => item.id, []);

  const renderFooter = useCallback(() => {
    if (!loadingMore) return null;
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color={Colors.primary} />
        <Text style={styles.loadingText}>Daha fazla yükleniyor...</Text>
      </View>
    );
  }, [loadingMore]);

  const renderEmpty = useCallback(() => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>
        {searchQuery ? 'Arama sonucu bulunamadı' : 'Henüz ürün yok'}
      </Text>
    </View>
  ), [searchQuery]);

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Ürünler yüklenirken hata oluştu</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={paginatedProducts}
      renderItem={renderProductItem}
      keyExtractor={keyExtractor}
      numColumns={numColumns}
      contentContainerStyle={styles.container}
      columnWrapperStyle={numColumns > 1 ? styles.row : undefined}
      onEndReached={loadMore}
      onEndReachedThreshold={0.3}
      maxToRenderPerBatch={10}
      windowSize={10}
      removeClippedSubviews={true}
      getItemLayout={(data, index) => ({
        length: ITEM_HEIGHT,
        offset: ITEM_HEIGHT * Math.floor(index / numColumns),
        index,
      })}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      ListFooterComponent={renderFooter}
      ListEmptyComponent={!isLoading ? renderEmpty : null}
    />
  );
};

// ProductGridItem için ayrı stiller
const itemStyles = StyleSheet.create({
  itemContainer: {
    flex: 1,
    margin: GRID_SPACING / 2,
  },
  imageContainer: {
    position: 'relative',
    aspectRatio: 1,
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.gray100,
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  productInfo: {
    padding: Spacing.md,
  },
  productName: {
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  photoCount: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
});

// Ana grid stiller
const styles = StyleSheet.create({
  container: {
    padding: GRID_SPACING,
  },
  row: {
    justifyContent: 'space-around',
  },
  loadingFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  loadingText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  emptyText: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  errorText: {
    ...Typography.body,
    color: Colors.error,
    textAlign: 'center',
  },
});