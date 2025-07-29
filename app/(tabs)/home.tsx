// kodlar/app/(tabs)/home.tsx
import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  SectionList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import * as ImagePicker from 'expo-image-picker';
import { useProductStore } from '@/stores/useProductStore';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants';
import { Card } from '@/components/Card';
import { Product } from '@/services/api';
import { ToastService } from '@/components/Toast/ToastService';
import { LoadingService } from '@/components/Loading/LoadingService';
import { Layout } from '@/constants/Layout';
import { BottomSheetService } from '@/components/BottomSheet/BottomSheetService';
import { InputDialogService } from '@/components/Dialog/InputDialogService';

const numColumns = Layout.isTablet ? 4 : 3;

// SAAT DİLİMİNDEN ETKİLENMEYEN, KESİN TARİH GRUPLAMA FONKSİYONU
const groupProductsByDate = (products: Product[], t: (key: string) => string, language: string) => {
  if (!products.length) return [];
  const sortedProducts = [...products].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const groups: { [key: string]: Product[] } = {};

  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const isSameDay = (d1: Date, d2: Date) => d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();

  sortedProducts.forEach(product => {
    const productDate = new Date(product.createdAt);
    let key = '';
    if (isSameDay(productDate, today)) key = t('home.today');
    else if (isSameDay(productDate, yesterday)) key = t('home.yesterday');
    else key = productDate.toLocaleDateString(language, { day: 'numeric', month: 'long', year: 'numeric' });
    if (!groups[key]) groups[key] = [];
    groups[key].push(product);
  });

  // SectionList'in her bir satırını bir item olarak görmesi için veriyi yeniden yapılandırıyoruz
  return Object.keys(groups).map(key => {
    const chunkedData = [];
    const products = groups[key];
    for (let i = 0; i < products.length; i += numColumns) {
      chunkedData.push(products.slice(i, i + numColumns));
    }
    return { title: key, data: chunkedData };
  });
};

export default function HomeScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { products, isLoading, fetchProducts, createProductAndUpload, refreshProducts } = useProductStore();
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const productSections = useMemo(() => groupProductsByDate(products, t, i18n.language), [products, t, i18n.language]);

  const handleCreateNewProduct = () => {
    const d = new Date();
    const defaultName = `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')}.${d.getFullYear()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
    InputDialogService.show({
      title: t('products.nameYourProduct'),
      placeholder: t('products.productNamePlaceholder'),
      onConfirm: (name) => {
        askForImageSource(name.trim() || defaultName);
      },
    });
  };

  const askForImageSource = (productName: string) => {
    BottomSheetService.show({
      title: t('products.createProductTitle'),
      actions: [
        { id: 'gallery', text: t('projects.selectFromGallery'), icon: 'image', onPress: () => pickImageFromGallery(productName) },
        { id: 'camera', text: t('projects.takePhoto'), icon: 'camera', onPress: () => takePhoto(productName) },
      ],
    });
  };

  const pickImageFromGallery = async (productName: string) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { 
      ToastService.show({ type: 'error', text1: t('common.permissions.galleryTitle'), text2: t('common.permissions.galleryMessage') }); 
      return; 
    }
    const result = await ImagePicker.launchImageLibraryAsync({ allowsEditing: false, quality: 1 });
    if (!result.canceled && result.assets) {
      await createProductWithImage(result.assets[0].uri, productName);
    }
  };

  const takePhoto = async (productName: string) => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') { 
      ToastService.show({ type: 'error', text1: t('common.permissions.cameraTitle'), text2: t('common.permissions.cameraMessage') }); 
      return; 
    }
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: false, quality: 1 });
    if (!result.canceled && result.assets) {
      await createProductWithImage(result.assets[0].uri, productName);
    }
  };

  const createProductWithImage = async (imageUri: string, productName: string) => {
    setIsCreating(true);
    LoadingService.show();
    try {
      await createProductAndUpload(productName, imageUri);
      ToastService.show({ type: 'success', text1: t('common.success'), text2: t('products.productCreated') });
    } catch (e: any) {
      ToastService.show({ type: 'error', text1: t('common.error'), text2: e.message || t('common.errors.createProduct') });
    } finally {
      setIsCreating(false);
      LoadingService.hide();
    }
  };

  const handleProductPress = (product: Product) => {
    router.push({
      pathname: '/(tabs)/product/[productId]',
      params: { productId: product.id },
    });
  };

  const renderProductRow = ({ item }: { item: Product[] }) => (
    <View style={styles.row}>
      {item.map((product) => (
        <View key={product.id} style={styles.cardWrapper}>
          <TouchableOpacity onPress={() => handleProductPress(product)} activeOpacity={0.8}>
            <Card padding="none">
              <Image
                source={{ uri: product.coverThumbnailUrl || `https://via.placeholder.com/150?text=${t('products.noImage')}` }}
                style={styles.productImage}
              />
              <View style={styles.productInfo}>
                <Text style={styles.productName} numberOfLines={1}>{product.name}</Text>
                <Text style={styles.photoCount}>{product.photoCount} {t('products.photos')}</Text>
              </View>
            </Card>
          </TouchableOpacity>
        </View>
      ))}
      {/* Satırı doldurmak için boş view'lar ekle */}
      {Array.from({ length: numColumns - item.length }).map((_, index) => (
        <View key={`placeholder-${index}`} style={styles.cardWrapper} />
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('products.title')}</Text>
      </View>

      <SectionList
        sections={productSections}
        keyExtractor={(item, index) => 'row-' + index}
        renderSectionHeader={({ section: { title } }) => <Text style={styles.sectionHeader}>{title}</Text>}
        renderItem={renderProductRow}
        ListEmptyComponent={() => !isLoading && (
          <View style={styles.emptyContainer}>
            <Feather name="package" size={48} color={Colors.textSecondary} />
            <Text style={styles.emptyText}>{t('products.empty')}</Text>
            <Text style={styles.emptySubtext}>{t('products.emptySubtitle')}</Text>
          </View>
        )}
        ListFooterComponent={isLoading && products.length === 0 ? <ActivityIndicator style={{ margin: Spacing.lg }} /> : null}
        contentContainerStyle={styles.listContainer}
        onRefresh={fetchProducts}
        refreshing={isLoading}
      />
      <TouchableOpacity
        style={[styles.fab, isCreating && styles.fabDisabled]}
        onPress={handleCreateNewProduct}
        activeOpacity={0.8}
        disabled={isCreating || isLoading}
      >
        {isCreating ? <ActivityIndicator size="small" color={Colors.card} /> : <Feather name="plus" size={28} color={Colors.card} />}
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.md },
  title: { ...Typography.h1, color: Colors.textPrimary },
  listContainer: { paddingHorizontal: Spacing.sm, paddingBottom: 100 },
  sectionHeader: { ...Typography.body, fontWeight: '600', color: Colors.textSecondary, marginBottom: Spacing.sm, marginTop: Spacing.lg, paddingHorizontal: Spacing.md },
  row: { flexDirection: 'row' },
  cardWrapper: { width: `${100 / numColumns}%`, padding: Spacing.sm },
  productImage: { width: '100%', aspectRatio: 1, borderTopLeftRadius: BorderRadius.lg, borderTopRightRadius: BorderRadius.lg, backgroundColor: Colors.gray100 },
  productInfo: { padding: Spacing.md },
  productName: { ...Typography.bodyMedium, color: Colors.textPrimary, marginBottom: Spacing.xs },
  photoCount: { ...Typography.caption, color: Colors.textSecondary },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', height: Layout.screen.height * 0.6 },
  emptyText: { ...Typography.h2, color: Colors.textPrimary, marginTop: Spacing.md },
  emptySubtext: { ...Typography.body, color: Colors.textSecondary, marginTop: Spacing.sm, textAlign: 'center' },
  fab: { position: 'absolute', right: Spacing.lg, bottom: Spacing.lg, width: 60, height: 60, borderRadius: 30, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 8 },
  fabDisabled: { backgroundColor: Colors.textSecondary },
});