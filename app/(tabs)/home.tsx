// app/(tabs)/home.tsx - TÜM ANİMASYONLAR APPLOADING İLE YÖNETİLİYOR
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  StyleSheet, SafeAreaView, TouchableOpacity, View, Text,
  AppState, TextInput, RefreshControl,
  LayoutAnimation, Platform, Animated, Dimensions
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useProductStore, Product } from '@/stores/useProductStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { Colors, Spacing, Typography, BorderRadius, Layout } from '@/constants';
import { ToastService } from '@/components/Toast/ToastService';
import { InputDialogService } from '@/components/Dialog/InputDialogService';
import { Card } from '@/components/Card';
import { LazyImage, LazyImageUtils } from '@/components/LazyImage';
import { OptimizedFlatList, FlatListUtils } from '@/components/OptimizedFlatList';
import AppLoading, { AppLoadingRef } from '@/components/Loading/AppLoading';

const GRID_SPACING = 4;
const { width } = Dimensions.get('window');

const numColumns = width > 768 ? 5 : 3;

let renderCount = 0;
const MAX_RENDER_COUNT = 50;

// Optimized ProfileAvatar with memoization
const ProfileAvatar = React.memo<{ name: string; onPress: () => void }>(({ name, onPress }) => {
  const PALETTE = [Colors.primary, Colors.secondary, Colors.accent, '#7D9A81', '#A288A6', '#E29578'];

  const { initials, backgroundColor } = useMemo(() => {
    const getInitials = () => {
      const words = name.trim().split(' ');
      if (words.length > 1 && words[words.length - 1]) {
        return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
      }
      return name.substring(0, 2).toUpperCase();
    };

    const stringToColor = (str: string) => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
      const index = Math.abs(hash) % PALETTE.length;
      return PALETTE[index];
    };

    return {
      initials: getInitials(),
      backgroundColor: stringToColor(name)
    };
  }, [name]);

  return (
    <TouchableOpacity onPress={onPress} style={styles.profileButton} activeOpacity={0.7}>
      <View style={[styles.avatarContainer, { backgroundColor }]}>
        <Text style={styles.avatarText}>{initials}</Text>
      </View>
    </TouchableOpacity>
  );
});

const MultiPhotoDisplay = React.memo<{ photos: any[] }>(({ photos }) => {
  const photoCount = photos.length;

  const siblingUris = useMemo(() =>
    photos.slice(0, 4).map(photo => photo.thumbnailUri).filter(Boolean),
    [photos]
  );

  if (photoCount === 0) {
    return (
      <View style={itemStyles.emptyPhotoContainer}>
        <View style={itemStyles.emptyPhotoIcon}>
          <Feather name="camera" size={24} color={Colors.primary} />
        </View>
        <Text style={itemStyles.emptyPhotoTitle}>Fotoğraf Ekle</Text>
        <Text style={itemStyles.emptyPhotoSubtitle}>İlk fotoğrafını yükle</Text>
      </View>
    );
  }

  if (photoCount === 1) {
    return (
      <LazyImage
        uri={photos[0].thumbnailUri}
        style={itemStyles.singlePhoto}
        priority="normal"
        fadeIn={true}
        lazyLoad={true}
        progressive={true}
        siblingUris={siblingUris.slice(1)}
        resizeMode="cover"
      />
    );
  }

  if (photoCount === 2) {
    return (
      <View style={itemStyles.twoPhotoContainer}>
        <LazyImage
          uri={photos[0].thumbnailUri}
          style={itemStyles.twoPhotoTop}
          priority="high"
          fadeIn={true}
          lazyLoad={true}
          siblingUris={[photos[1].thumbnailUri]}
          resizeMode="cover"
        />
        <LazyImage
          uri={photos[1].thumbnailUri}
          style={itemStyles.twoPhotoBottom}
          priority="normal"
          fadeIn={true}
          lazyLoad={true}
          resizeMode="cover"
        />
      </View>
    );
  }

  if (photoCount === 3) {
    return (
      <View style={itemStyles.threePhotoContainer}>
        <LazyImage
          uri={photos[0].thumbnailUri}
          style={itemStyles.threePhotoMain}
          priority="high"
          fadeIn={true}
          lazyLoad={true}
          siblingUris={[photos[1].thumbnailUri, photos[2].thumbnailUri]}
          resizeMode="cover"
        />
        <View style={itemStyles.threePhotoSide}>
          <LazyImage
            uri={photos[1].thumbnailUri}
            style={itemStyles.threePhotoTop}
            priority="normal"
            fadeIn={true}
            lazyLoad={true}
            resizeMode="cover"
          />
          <LazyImage
            uri={photos[2].thumbnailUri}
            style={itemStyles.threePhotoBottom}
            priority="normal"
            fadeIn={true}
            lazyLoad={true}
            resizeMode="cover"
          />
        </View>
      </View>
    );
  }

  return (
    <View style={itemStyles.fourPhotoContainer}>
      <View style={itemStyles.fourPhotoRow}>
        <LazyImage
          uri={photos[0].thumbnailUri}
          style={itemStyles.fourPhotoItem}
          priority="high"
          fadeIn={true}
          lazyLoad={true}
          siblingUris={siblingUris.slice(1)}
          resizeMode="cover"
        />
        <LazyImage
          uri={photos[1].thumbnailUri}
          style={itemStyles.fourPhotoItem}
          priority="normal"
          fadeIn={true}
          lazyLoad={true}
          resizeMode="cover"
        />
      </View>
      <View style={itemStyles.fourPhotoRow}>
        <LazyImage
          uri={photos[2].thumbnailUri}
          style={itemStyles.fourPhotoItem}
          priority="normal"
          fadeIn={true}
          lazyLoad={true}
          resizeMode="cover"
        />
        <View style={itemStyles.fourPhotoItem}>
          <LazyImage
            uri={photos[3].thumbnailUri}
            style={styles.fullSizeImage}
            priority="low"
            fadeIn={true}
            lazyLoad={true}
            resizeMode="cover"
          />
          {photoCount > 4 && (
            <View style={itemStyles.morePhotosOverlay}>
              <Text style={itemStyles.morePhotosText}>+{photoCount - 4}</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
});

const ModernProductCard = React.memo<{
  product: Product;
  onPress: () => void;
  index: number;
}>(({ product, onPress, index }) => {
  useEffect(() => {
    renderCount++;
    if (renderCount > MAX_RENDER_COUNT && renderCount % 20 === 0) {
      console.log(`🔄 Render count: ${renderCount}, optimizing memory...`);
      LazyImageUtils.optimizeMemory();
    }
  }, []);

  return (
    <View style={itemStyles.itemContainer}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        <Card padding="none" style={itemStyles.cardContainer}>
          <View style={itemStyles.imageContainer}>
            <MultiPhotoDisplay photos={product.photos} />
          </View>
          <View style={itemStyles.productInfo}>
            <Text style={itemStyles.productName} numberOfLines={2}>
              {product.name}
            </Text>
          </View>
        </Card>
      </TouchableOpacity>
    </View>
  );
});

const ModernFAB = React.memo<{ onPress: () => void; isVisible: boolean }>(({ onPress, isVisible }) => {
  const scaleValue = useRef(new Animated.Value(isVisible ? 1 : 0)).current;

  useEffect(() => {
    const animation = Animated.spring(scaleValue, {
      toValue: isVisible ? 1 : 0,
      useNativeDriver: true,
      tension: 100,
      friction: 8
    });
    animation.start();

    return () => animation.stop();
  }, [isVisible, scaleValue]);

  return (
    <Animated.View
      style={[styles.fabContainer, { transform: [{ scale: scaleValue }] }]}
      pointerEvents={isVisible ? 'auto' : 'none'}
    >
      <TouchableOpacity style={styles.fab} onPress={onPress} activeOpacity={0.8}>
        <Feather name="plus" size={24} color={Colors.card} />
      </TouchableOpacity>
    </Animated.View>
  );
});

const SearchBar = React.memo<{
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onClear: () => void;
}>(({ searchQuery, onSearchChange, onClear }) => {
  const inputRef = useRef<TextInput>(null);
  const debounceTimeout = useRef<NodeJS.Timeout>();

  const handleSearchChange = useCallback((text: string) => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    debounceTimeout.current = setTimeout(() => {
      onSearchChange(text);
    }, 300);
  }, [onSearchChange]);

  useEffect(() => {
    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, []);

  return (
    <View style={styles.searchContainer}>
      <TouchableOpacity
        style={styles.searchInputContainer}
        onPress={() => inputRef.current?.focus()}
        activeOpacity={0.7}
      >
        <Feather name="search" size={18} color={Colors.textSecondary} />
        <TextInput
          ref={inputRef}
          style={styles.searchInput}
          placeholder="Ürünlerde ara..."
          placeholderTextColor={Colors.textSecondary}
          value={searchQuery}
          onChangeText={handleSearchChange}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={onClear} style={styles.clearButton}>
            <Feather name="x" size={16} color={Colors.textSecondary} />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    </View>
  );
});

export default function HomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { products, createProduct, isLoading, loadProducts } = useProductStore();
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const flatListRef = useRef<any>(null);
  const lastLoadTime = useRef<number>(0);
  const loadingRef = useRef<AppLoadingRef>(null); // AppLoading referansı eklendi

  const shouldShowSearch = useMemo(() => products.length > 9, [products.length]);
  const firstName = useMemo(() => user?.name?.split(' ')[0] || 'Misafir', [user?.name]);

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    const query = searchQuery.toLowerCase();
    return products.filter(p =>
      p.name.toLowerCase().includes(query) ||
      p.photos.length.toString().includes(query)
    );
  }, [products, searchQuery]);

  // AppLoading'i kullanarak ürünleri yükleme
  const handleLoadProducts = useCallback(async () => {
    const now = Date.now();
    if (now - lastLoadTime.current < 1000) return;
    lastLoadTime.current = now;

    if (products.length === 0) {
      loadingRef.current?.show(); // İlk yüklemede AppLoading'i göster
    }

    try {
      await loadProducts();
    } finally {
      loadingRef.current?.hide(); // İşlem bitince AppLoading'i gizle
    }
  }, [loadProducts, products.length]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    try {
      await handleLoadProducts();
      LazyImageUtils.optimizeMemory();
    } finally {
      setRefreshing(false);
    }
  }, [handleLoadProducts]);

  useEffect(() => {
    handleLoadProducts();
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        handleLoadProducts();
      } else if (nextAppState === 'background') {
        LazyImageUtils.optimizeMemory();
      }
    });
    return () => subscription.remove();
  }, [handleLoadProducts]);

  const handleCreateNewProduct = useCallback(() => {
    InputDialogService.show({
      title: 'Yeni Ürün Oluştur',
      placeholder: 'Ürün adını girin',
      onConfirm: async (name) => {
        if (!name.trim()) {
          ToastService.show({
            type: 'error',
            text1: 'İsim Gerekli',
            text2: 'Lütfen ürün için bir isim girin.'
          });
          return;
        }
        loadingRef.current?.show(); // Ürün oluşturma animasyonunu göster
        try {
          const newProduct = await createProduct(name.trim());
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          router.push({
            pathname: '/(tabs)/product/[productId]',
            params: { productId: newProduct.id }
          });
        } catch (e: any) {
          ToastService.show({
            type: 'error',
            text1: 'Hata',
            text2: e.message
          });
        } finally {
          loadingRef.current?.hide(); // İşlem bitince animasyonu gizle
        }
      },
    });
  }, [createProduct, router]);

  const handleProductPress = useCallback((product: Product) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    router.push({
      pathname: '/(tabs)/product/[productId]',
      params: { productId: product.id }
    });
  }, [router]);

  const handleProfilePress = useCallback(() => {
    router.push('/(tabs)/settings');
  }, [router]);

  const imageExtractor = useCallback((item: Product) => {
    return item.photos.map(photo => photo.thumbnailUri).filter(Boolean);
  }, []);

  const renderItem = useCallback(({ item, index }: { item: Product, index: number }) => (
    <ModernProductCard
      product={item}
      onPress={() => handleProductPress(item)}
      index={index}
    />
  ), [handleProductPress]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ title: t('home.title'), headerShown: false }} />
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerGreeting}>Merhaba, {firstName}</Text>
          <Text style={styles.headerSubtitle}>
            {products.length > 0 ? `Toplam ${products.length} ürünün var.` : 'Başlamaya hazır mısın?'}
          </Text>
        </View>
        {user && (
          <ProfileAvatar
            name={user.name || 'Misafir Kullanıcı'}
            onPress={handleProfilePress}
          />
        )}
      </View>
      {shouldShowSearch && (
        <SearchBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onClear={() => setSearchQuery('')}
        />
      )}
      <View style={styles.gridContainer}>
        {filteredProducts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <Feather name="package" size={64} color={Colors.gray300} />
            </View>
            <Text style={styles.emptyTitle}>
              {searchQuery ? 'Sonuç Bulunamadı' : 'Henüz Ürün Yok'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery
                ? `"${searchQuery}" için sonuç bulunamadı.`
                : 'İlk ürününü oluşturmak için + butonuna dokun.'
              }
            </Text>
            {!searchQuery && (
              <TouchableOpacity style={styles.emptyButton} onPress={handleCreateNewProduct}>
                <Feather name="plus" size={20} color={Colors.primary} />
                <Text style={styles.emptyButtonText}>İlk Ürününü Oluştur</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <OptimizedFlatList
            ref={flatListRef}
            data={filteredProducts}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            numColumns={numColumns}
            key={String(numColumns)}
            contentContainerStyle={styles.flatListContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={[Colors.primary]}
                tintColor={Colors.primary}
              />
            }
            enableVirtualization={true}
            enableProgressiveLoading={true}
            enableMemoryOptimization={true}
            imageExtractor={imageExtractor}
            maxToRenderPerBatch={10}
            windowSize={10}
            initialNumToRender={15}
            removeClippedSubviews={true}
            isEmpty={filteredProducts.length === 0}
            loadingComponent={null}
          />
        )}
      </View>
      <ModernFAB onPress={handleCreateNewProduct} isVisible={true} />
      <AppLoading ref={loadingRef} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.lg,
    backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border,
    shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 5, elevation: 4,
  },
  headerLeft: { flex: 1 },
  headerGreeting: {
    ...Typography.h2, color: Colors.textPrimary, fontWeight: '700', marginBottom: 2
  },
  headerSubtitle: { ...Typography.body, color: Colors.textSecondary, fontSize: 15 },
  profileButton: { padding: Spacing.xs },
  avatarContainer: {
    width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center',
    shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 4, elevation: 3,
    borderWidth: 2, borderColor: Colors.card,
  },
  avatarText: {
    ...Typography.bodyMedium, color: Colors.card, fontWeight: '700', fontSize: 16
  },
  searchContainer: {
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  searchInputContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.gray100,
    borderRadius: BorderRadius.lg, paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm, gap: Spacing.sm,
  },
  searchInput: {
    ...Typography.body, color: Colors.textPrimary, flex: 1, fontSize: 15,
    paddingVertical: Spacing.xs, minHeight: 20,
  },
  clearButton: {},
  gridContainer: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: {
    flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing.xl
  },
  emptyIcon: { marginBottom: Spacing.xl },
  emptyTitle: {
    ...Typography.h2, color: Colors.textPrimary, marginBottom: Spacing.sm, textAlign: 'center'
  },
  emptySubtitle: {
    ...Typography.body, color: Colors.textSecondary, textAlign: 'center',
    lineHeight: 22, marginBottom: Spacing.xl,
  },
  emptyButton: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primary + '15',
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full, gap: Spacing.sm,
  },
  emptyButtonText: { ...Typography.bodyMedium, color: Colors.primary, fontWeight: '600' },
  flatListContent: { padding: GRID_SPACING, paddingBottom: 100 },
  fabContainer: { position: 'absolute', right: Spacing.lg, bottom: Spacing.lg + 20 },
  fab: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.primary,
    justifyContent: 'center', alignItems: 'center', shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 12,
  },
  fullSizeImage: { width: '100%', height: '100%' },
});

const itemStyles = StyleSheet.create({
  itemContainer: {
    width: `${100 / numColumns}%`,
    padding: GRID_SPACING,
  },
  cardContainer: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
    height: 180,
  },
  imageContainer: {
    aspectRatio: 1,
    backgroundColor: Colors.gray50,
    position: 'relative',
    overflow: 'hidden'
  },
  singlePhoto: { width: '100%', height: '100%' },
  twoPhotoContainer: {
    flexDirection: 'column',
    width: '100%',
    height: '100%',
  },
  twoPhotoTop: {
    width: '100%',
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: Colors.card,
  },
  twoPhotoBottom: {
    width: '100%',
    flex: 1,
  },
  threePhotoContainer: {
    flexDirection: 'row',
    width: '100%',
    height: '100%'
  },
  threePhotoMain: {
    flex: 2,
    borderRightWidth: 1,
    borderRightColor: Colors.card
  },
  threePhotoSide: {
    flex: 1,
    flexDirection: 'column',
  },
  threePhotoTop: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: Colors.card
  },
  threePhotoBottom: {
    flex: 1,
  },
  fourPhotoContainer: {
    width: '100%',
    height: '100%'
  },
  fourPhotoRow: {
    flexDirection: 'row',
    flex: 1,
  },
  fourPhotoItem: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.card,
    position: 'relative'
  },
  morePhotosOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)', justifyContent: 'center', alignItems: 'center',
  },
  morePhotosText: { ...Typography.bodyMedium, color: Colors.card, fontWeight: '700', fontSize: 24 },
  emptyPhotoContainer: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    backgroundColor: Colors.gray100, gap: Spacing.sm
  },
  emptyPhotoIcon: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.background,
    justifyContent: 'center', alignItems: 'center',
  },
  emptyPhotoTitle: { ...Typography.caption, color: Colors.textPrimary, fontWeight: '600' },
  emptyPhotoSubtitle: {
    ...Typography.caption, color: Colors.textSecondary, fontSize: 11, textAlign: 'center',
  },
  productInfo: {
    padding: Spacing.sm,
    flexGrow: 1,
    justifyContent: 'center',
  },
  productName: {
    ...Typography.caption, color: Colors.textPrimary, fontWeight: '600',
    lineHeight: 16, fontSize: 13,
    minHeight: 32,
    maxHeight: 32,
    overflow: 'hidden',
  },
});