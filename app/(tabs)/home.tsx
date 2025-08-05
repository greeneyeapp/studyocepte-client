import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet, SafeAreaView, TouchableOpacity, View, Text,
  ActivityIndicator, AppState, FlatList, Image
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
import { ErrorMessage } from '@/components/ErrorMessage';

const GRID_SPACING = Spacing.sm;
const numColumns = Layout.isTablet ? 4 : 3;

// Profil avatarı bileşeni
const ProfileAvatar: React.FC<{ name: string; onPress: () => void }> = ({ name, onPress }) => {
  const getInitials = () => {
    const words = name.trim().split(' ');
    if (words.length > 1) {
      return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };
  
  const stringToColor = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    let color = '#';
    for (let i = 0; i < 3; i++) {
      const value = (hash >> (i * 8)) & 0xFF;
      color += ('00' + value.toString(16)).substr(-2);
    }
    return color;
  };

  return (
    <TouchableOpacity onPress={onPress} style={styles.profileButton} activeOpacity={0.7}>
      <View style={[styles.avatarContainer, { backgroundColor: stringToColor(name) }]}>
        <Text style={styles.avatarText}>{getInitials()}</Text>
      </View>
    </TouchableOpacity>
  );
};

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
                        <Image source={{ uri: coverImageUri }} style={itemStyles.productImage} resizeMode="cover" />
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
  const { user } = useAuthStore();

  const [searchQuery, setSearchQuery] = useState('');

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

  const handleProfilePress = () => {
    router.push('/(tabs)/settings');
  };

  // Basit filtreleme - sadece arama
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    const query = searchQuery.toLowerCase();
    return products.filter(product => product.name.toLowerCase().includes(query));
  }, [products, searchQuery]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ title: t('home.title'), headerShown: false }} />

      {/* COMPACT HEADER - Sadece başlık + profil */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Ürünlerim</Text>
        {user && (
          <ProfileAvatar name={user.name || 'Kullanıcı'} onPress={handleProfilePress} />
        )}
      </View>

      <View style={styles.gridContainer}>
        {isLoading && products.length === 0 ? (
            <ActivityIndicator style={{marginTop: 50}} size="large" color={Colors.primary}/>
        ) : filteredProducts.length === 0 ? (
            <ErrorMessage 
              message={searchQuery ? `"${searchQuery}" için sonuç bulunamadı.` : "Henüz hiç ürün oluşturmadınız. Yeni bir tane eklemek için '+' butonuna dokunun."} 
              onRetry={loadProducts}
              retryText="Yenile"
            />
        ) : (
            <FlatList
                data={filteredProducts}
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
  
  // HEADER STYLES
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    ...Typography.h2,
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  headerSubtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  
  // PROFILE AVATAR STYLES
  profileButton: {
    padding: Spacing.xs,
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarText: {
    ...Typography.bodyMedium,
    color: Colors.card,
    fontWeight: '700',
    fontSize: 16,
  },
  
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