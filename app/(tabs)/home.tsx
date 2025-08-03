// client/app/(tabs)/home.tsx - YENİ YAPI GÜNCELLEMESİ
import React, { useState, useEffect } from 'react';
import {
  StyleSheet, SafeAreaView, TouchableOpacity,
  ActivityIndicator, View, AppState,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useProductStore } from '@/stores/useProductStore';
import { Colors, Spacing } from '@/constants';
import { Product } from '@/services/api';
import { ToastService } from '@/components/Toast/ToastService';
import { InputDialogService } from '@/components/Dialog/InputDialogService';
import { EnhancedSearchBar } from '@/components/EnhancedSearchBar';
import { OptimizedProductGrid } from '@/components/OptimizedProductGrid';
import { LoadingService } from '@/components/Loading/LoadingService';

export default function HomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { createProduct, refreshProductsIfNeeded, isLoading } = useProductStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'createdAt' | 'photoCount'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    refreshProductsIfNeeded();
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active') {
        refreshProductsIfNeeded();
      }
    });
    return () => {
      subscription.remove();
    };
  }, [refreshProductsIfNeeded]);

  const handleCreateNewProduct = () => {
    const d = new Date();
    const defaultName = `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')}.${d.getFullYear()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
    
    InputDialogService.show({
      title: t('products.nameYourProduct'),
      placeholder: t('products.productNamePlaceholder'),
      onConfirm: async (name) => {
        LoadingService.show();
        try {
          const newProduct = await createProduct(name.trim() || defaultName);
          if (newProduct) {
            ToastService.show({ type: 'success', text1: t('products.productCreated') });
            // Kullanıcıyı yeni oluşturulan ürünün detay sayfasına yönlendir
            router.push({
              pathname: '/(tabs)/product/[productId]',
              params: { productId: newProduct.id },
            });
          }
        } catch (e: any) {
          ToastService.show({ type: 'error', text1: t('common.error'), text2: e.message || t('common.errors.createProduct') });
        } finally {
          LoadingService.hide();
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ title: t('home.title'), headerShown: true }} />
      
      <EnhancedSearchBar
        onSearch={(query, filters) => {
          setSearchQuery(query);
          setSortBy(filters.sortBy);
          setSortOrder(filters.sortOrder);
        }}
      />
      
      <View style={styles.gridContainer}>
        <OptimizedProductGrid
          onProductPress={handleProductPress}
          searchQuery={searchQuery}
          sortBy={sortBy}
          sortOrder={sortOrder}
          key={`${sortBy}-${sortOrder}-${searchQuery}`}
        />
      </View>
      
      <TouchableOpacity
        style={[styles.fab, isLoading && styles.fabDisabled]}
        onPress={handleCreateNewProduct}
        activeOpacity={0.8}
        disabled={isLoading}
      >
        {isLoading ? <ActivityIndicator size="small" color={Colors.card} /> : <Feather name="plus" size={28} color={Colors.card} />}
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  gridContainer: { flex: 1, },
  fab: { position: 'absolute', right: Spacing.lg, bottom: Spacing.lg, width: 60, height: 60, borderRadius: 30, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 8 },
  fabDisabled: { backgroundColor: Colors.textSecondary },
});