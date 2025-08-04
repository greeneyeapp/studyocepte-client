import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet, SafeAreaView, TouchableOpacity, View, Text,
  ActivityIndicator, AppState, FlatList, Image
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useProductStore, Product } from '@/stores/useProductStore';
import { Colors, Spacing, Typography, BorderRadius, Layout } from '@/constants';
import { ToastService } from '@/components/Toast/ToastService';
import { InputDialogService } from '@/components/Dialog/InputDialogService';
import { EnhancedSearchBar } from '@/components/EnhancedSearchBar';
import { Card } from '@/components/Card';
import { ErrorMessage } from '@/components/ErrorMessage';

const GRID_SPACING = Spacing.sm;
const numColumns = Layout.isTablet ? 4 : 3;

/**
 * Grid'deki her bir ürün kartını render eden, memoize edilmiş bileşen.
 * Performans için ana bileşenin dışında tanımlanmıştır.
 */
const ProductGridItem: React.FC<{ product: Product; onPress: () => void; }> = React.memo(({ product, onPress }) => {
    // Ürünün kapak fotoğrafı olarak ilk fotoğrafın thumbnail'ini kullanıyoruz.
    const coverImageUri = product.photos[0]?.thumbnailUri;

    return (
        <View style={itemStyles.itemContainer}>
            <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
                <Card padding="none">
                    <View style={itemStyles.imageContainer}>
                    {coverImageUri ? (
                        <Image source={{ uri: coverImageUri }} style={itemStyles.productImage} />
                    ) : (
                        // Fotoğraf yoksa bir placeholder göster
                        <View style={itemStyles.placeholder}>
                            <Feather name="image" size={40} color={Colors.gray300} />
                        </View>
                    )}
                    </View>
                    <View style={itemStyles.productInfo}>
                        <Text style={itemStyles.productName} numberOfLines={1}>{product.name}</Text>
                        <Text style={itemStyles.photoCount}>{product.photos.length} fotoğraf</Text>
                    </View>
                </Card>
            </TouchableOpacity>
        </View>
    );
});

export default function HomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { products, createProduct, isLoading, loadProducts } = useProductStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'createdAt'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    // Uygulama açıldığında veya ekrana odaklanıldığında yerel depodan verileri yükle
    loadProducts();
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active') {
        loadProducts();
      }
    });
    return () => {
      subscription.remove();
    };
  }, [loadProducts]);

  const handleCreateNewProduct = async () => {
    const defaultName = `Yeni Ürün - ${new Date().toLocaleDateString()}`;

    InputDialogService.show({
      title: t('products.nameYourProduct'),
      placeholder: t('products.productNamePlaceholder'),
      initialValue: defaultName,
      onConfirm: async (name) => {
        try {
          const newProduct = await createProduct(name.trim() || defaultName);
          ToastService.show({ type: 'success', text1: t('products.productCreated') });
          router.push({
            pathname: '/(tabs)/product/[productId]',
            params: { productId: newProduct.id },
          });
        } catch (e: any) {
          ToastService.show({ type: 'error', text1: t('common.error'), text2: e.message });
        }
      },
    });
  };

  const handleProductPress = (product: Product) => {
    router.push({
      pathname: '/(tabs)/product/[productId]',
      params: { productId: product.id },
    });
  };

  // Performans için filtreleme ve sıralama mantığını memoize et
  const filteredAndSortedProducts = useMemo(() => {
    let filtered = products;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = products.filter(product => product.name.toLowerCase().includes(query));
    }
    return filtered.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else { // createdAt
        comparison = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return sortOrder === 'asc' ? -comparison : comparison;
    });
  }, [products, searchQuery, sortBy, sortOrder]);


  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ title: t('home.title'), headerShown: true }} />

      <EnhancedSearchBar
        onSearch={(query, filters) => {
          setSearchQuery(query);
          setSortBy(filters.sortBy as 'name' | 'createdAt');
          setSortOrder(filters.sortOrder);
        }}
      />

      <View style={styles.gridContainer}>
        {isLoading && products.length === 0 ? (
            <ActivityIndicator style={{marginTop: 50}} size="large" color={Colors.primary}/>
        ) : filteredAndSortedProducts.length === 0 ? (
            <ErrorMessage 
              message={searchQuery ? `"${searchQuery}" için sonuç bulunamadı.` : "Henüz hiç ürün oluşturmadınız. Yeni bir tane eklemek için '+' butonuna dokunun."} 
              onRetry={loadProducts}
              retryText="Yenile"
            />
        ) : (
            <FlatList
                data={filteredAndSortedProducts}
                renderItem={({ item }) => <ProductGridItem product={item} onPress={() => handleProductPress(item)} />}
                keyExtractor={(item) => item.id}
                numColumns={numColumns}
                contentContainerStyle={{ padding: GRID_SPACING, paddingBottom: 100 }}
                onRefresh={loadProducts}
                refreshing={isLoading}
            />
        )}
      </View>

      <TouchableOpacity
        style={styles.fab}
        onPress={handleCreateNewProduct}
        activeOpacity={0.8}
      >
        <Feather name="plus" size={28} color={Colors.card} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  gridContainer: { flex: 1 },
  fab: { position: 'absolute', right: Spacing.lg, bottom: Spacing.lg, width: 60, height: 60, borderRadius: 30, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 8 },
});

const itemStyles = StyleSheet.create({
    itemContainer: { width: `${100 / numColumns}%`, padding: GRID_SPACING },
    imageContainer: { aspectRatio: 1, borderTopLeftRadius: BorderRadius.lg, borderTopRightRadius: BorderRadius.lg, overflow: 'hidden', backgroundColor: Colors.gray100 },
    productImage: { width: '100%', height: '100%' },
    placeholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    productInfo: { padding: Spacing.md },
    productName: { ...Typography.bodyMedium, color: Colors.textPrimary, marginBottom: Spacing.xs },
    photoCount: { ...Typography.caption, color: Colors.textSecondary },
});