// components/OptimizedProductGrid.tsx - FAZ 3 GÜNCELLEMESİ (Animasyonlar)
import React, { useEffect, useMemo, useCallback, useRef } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Text,
  TouchableOpacity,
  Animated, // YENİ: Animasyon için import
} from 'react-native';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants';
import { Card } from '@/components/Card';
import { Product } from '@/services/api';
import { useProductStore } from '@/stores/useProductStore';
import { Layout } from '@/constants/Layout';
import { ErrorMessage } from '@/components/ErrorMessage';
import { LazyImage } from './LazyImage';

interface OptimizedProductGridProps {
  onProductPress: (product: Product) => void;
  searchQuery?: string;
  sortBy?: 'name' | 'createdAt' | 'photoCount';
  sortOrder?: 'asc' | 'desc';
}

const GRID_SPACING = Spacing.sm;

// ProductGridItem bileşenini animasyonlu hale getiriyoruz
const ProductGridItem: React.FC<{ 
    product: Product; 
    onPress: () => void; 
    priority?: 'low' | 'normal' | 'high';
    index: number; // YENİ: Animasyon sıralaması için index
}> = React.memo(({ product, onPress, priority, index }) => {
    
    // YENİ: Animasyon için state'ler
    const opacity = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(20)).current;

    useEffect(() => {
        // Her bir kartın index'ine göre küçük bir gecikmeyle animasyonu başlat
        Animated.timing(opacity, {
            toValue: 1,
            duration: 500,
            delay: index * 50, // Sıralı gelme efekti için gecikme
            useNativeDriver: true,
        }).start();

        Animated.timing(translateY, {
            toValue: 0,
            duration: 500,
            delay: index * 50,
            useNativeDriver: true,
        }).start();
    }, [opacity, translateY, index]);
    
    return (
        <Animated.View style={{ opacity, transform: [{ translateY }] }}>
            <View style={itemStyles.itemContainer}>
              <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
                <Card padding="none">
                  <View style={itemStyles.imageContainer}>
                    <LazyImage
                      uri={product.coverThumbnailUrl || ''}
                      style={itemStyles.productImage}
                      priority={priority}
                    />
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
        </Animated.View>
      );
});


export const OptimizedProductGrid: React.FC<OptimizedProductGridProps> = ({
  onProductPress,
  searchQuery = '',
  sortBy = 'createdAt',
  sortOrder = 'desc'
}) => {
  // Store ve state yönetimi aynı kalır
  const { products, isLoading, error, fetchProducts, clearError } = useProductStore();

  useEffect(() => {
    fetchProducts();
    return () => {
        clearError();
    }
  }, [fetchProducts, clearError]);

  const onRefresh = useCallback(async () => {
    await fetchProducts();
  }, [fetchProducts]);

  const filteredProducts = useMemo(() => {
    let filtered = products;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = products.filter(product => product.name.toLowerCase().includes(query));
    }
    filtered.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'name') comparison = a.name.localeCompare(b.name);
      else if (sortBy === 'createdAt') comparison = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      else comparison = b.photoCount - a.photoCount;
      return sortOrder === 'asc' ? -comparison : comparison;
    });
    return filtered;
  }, [products, searchQuery, sortBy, sortOrder]);


  // Hata, Yüklenme ve Boş Durum mantığı aynı kalır
  if (isLoading && products.length === 0) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.infoText}>Ürünler Yükleniyor...</Text>
      </View>
    );
  }
  if (error) {
    return <ErrorMessage message={`Ürünler yüklenirken bir hata oluştu.\n(${error})`} onRetry={onRefresh} retryText="Tekrar Dene" />;
  }
  if (!isLoading && filteredProducts.length === 0) {
      return <ErrorMessage message={searchQuery ? `"${searchQuery}" için sonuç bulunamadı.` : "Henüz hiç ürün oluşturmadınız."} onRetry={onRefresh} retryText="Yenile" />;
  }

  // FlatList
  return (
    <FlatList
      data={filteredProducts}
      renderItem={({ item, index }) => (
        <ProductGridItem
          product={item}
          onPress={() => onProductPress(item)}
          priority={index < 6 ? 'high' : 'normal'}
          index={index} // YENİ: index'i prop olarak iletiyoruz
        />
      )}
      keyExtractor={(item) => item.id}
      numColumns={numColumns}
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={onRefresh} tintColor={Colors.primary}/>
      }
      maxToRenderPerBatch={10}
      windowSize={10}
      removeClippedSubviews={true}
    />
  );
};

const numColumns = Layout.isTablet ? 4 : 3;

// Styles
const styles = StyleSheet.create({
  container: { padding: GRID_SPACING, flexGrow: 1, },
  centeredContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background, padding: Spacing.xl },
  infoText: { ...Typography.body, color: Colors.textSecondary, marginTop: Spacing.md, },
});

const itemStyles = StyleSheet.create({
    itemContainer: { width: `${100 / numColumns}%`, padding: GRID_SPACING },
    imageContainer: { aspectRatio: 1, borderTopLeftRadius: BorderRadius.lg, borderTopRightRadius: BorderRadius.lg, overflow: 'hidden', backgroundColor: Colors.gray100 },
    productImage: { width: '100%', height: '100%' },
    productInfo: { padding: Spacing.md },
    productName: { ...Typography.bodyMedium, color: Colors.textPrimary, marginBottom: Spacing.xs },
    photoCount: { ...Typography.caption, color: Colors.textSecondary },
});