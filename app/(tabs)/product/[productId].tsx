// kodlar/app/(tabs)/product/[productId].tsx
import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useProductStore } from '@/stores/useProductStore';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { ProductPhoto } from '@/services/api';
import { ToastService } from '@/components/Toast/ToastService';
import { LoadingService } from '@/components/Loading/LoadingService';
import { Layout } from '@/constants/Layout';

const numColumns = Layout.isTablet ? 4 : 3;

export default function ProductDetailScreen() {
  const { t } = useTranslation();
  const { productId } = useLocalSearchParams<{ productId: string }>();
  const router = useRouter();
  const { activeProduct, isLoading, fetchProductById, uploadAnotherPhoto } = useProductStore();

  useEffect(() => {
    if (productId) {
      fetchProductById(productId);
    }
  }, [productId]);

  useEffect(() => {
    // Fotoğraflar işlenmeyi beklerken otomatik yenileme
    if (activeProduct?.photos.some(photo => photo.status === 'processing')) {
      const interval = setInterval(() => {
        if (productId) {
          fetchProductById(productId);
        }
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [activeProduct?.photos, productId]);

  const handleAddPhoto = async () => {
    if (!productId) return;
    
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      ToastService.show({
        type: 'error',
        text1: t('common.permissions.galleryTitle'),
        text2: t('common.permissions.galleryMessage'),
      });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled && result.assets) {
      LoadingService.show();
      try {
        await uploadAnotherPhoto(productId, result.assets[0].uri);
        ToastService.show({
          type: 'success',
          text1: t('common.success'),
          text2: 'Fotoğraf yüklendi!',
        });
      } catch (error: any) {
        ToastService.show({
          type: 'error',
          text1: t('common.error'),
          text2: error.message,
        });
      } finally {
        LoadingService.hide();
      }
    }
  };

  const handlePhotoPress = (photo: ProductPhoto) => {
    if (photo.status !== 'completed') {
      ToastService.show({
        type: photo.status === 'failed' ? 'error' : 'info',
        text1: photo.status === 'failed' ? 'İşleme Başarısız' : 'İşleniyor',
        text2: photo.status === 'failed' 
          ? 'Bu fotoğraf işlenemedi.' 
          : 'Fotoğraf hala işleniyor. Lütfen bekleyin.',
      });
      return;
    }

    router.push({
      pathname: '/(tabs)/editor/[photoId]',
      params: { photoId: photo.id },
    });
  };

  const renderPhoto = ({ item: photo }: { item: ProductPhoto }) => (
    <View style={styles.photoWrapper}>
      <TouchableOpacity onPress={() => handlePhotoPress(photo)} activeOpacity={0.8}>
        <Card padding="none">
          <Image
            source={{ 
              uri: photo.thumbnailUrl || 'https://via.placeholder.com/150?text=Yükleniyor' 
            }}
            style={styles.photoImage}
          />
          {photo.status !== 'completed' && (
            <View style={styles.statusOverlay}>
              {photo.status === 'processing' && (
                <ActivityIndicator color={Colors.card} />
              )}
              {photo.status === 'failed' && (
                <Feather name="alert-triangle" size={24} color={Colors.card} />
              )}
            </View>
          )}
        </Card>
      </TouchableOpacity>
    </View>
  );

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Feather name="camera" size={48} color={Colors.textSecondary} />
      <Text style={styles.emptyText}>Hiç Fotoğraf Yok</Text>
      <Text style={styles.emptySubtext}>Bu ürüne ilk fotoğrafı ekleyin.</Text>
    </View>
  );

  if (isLoading || !activeProduct) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'Yükleniyor...' }} />
        <ActivityIndicator size="large" style={styles.centered} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: activeProduct.name }} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.productName} numberOfLines={1}>
            {activeProduct.name}
          </Text>
          <Text style={styles.photoCount}>
            {activeProduct.photos.length} {t('products.photos')}
          </Text>
        </View>
        <Button
          title="Fotoğraf Ekle"
          onPress={handleAddPhoto}
          size="small"
          icon={<Feather name="plus" size={16} color={Colors.card} />}
        />
      </View>

      <FlatList
        data={activeProduct.photos}
        keyExtractor={(item) => item.id}
        numColumns={numColumns}
        renderItem={renderPhoto}
        ListEmptyComponent={renderEmptyComponent}
        contentContainerStyle={styles.listContainer}
        columnWrapperStyle={numColumns > 1 ? styles.row : undefined}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.card,
  },
  backButton: {
    padding: Spacing.sm,
    marginRight: Spacing.sm,
  },
  headerContent: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  productName: {
    ...Typography.h3,
    color: Colors.textPrimary,
  },
  photoCount: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  listContainer: {
    padding: Spacing.sm,
    flexGrow: 1,
  },
  row: {
    justifyContent: 'space-around',
  },
  photoWrapper: {
    width: `${100 / numColumns}%`,
    padding: Spacing.sm,
  },
  photoImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.gray100,
  },
  statusOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emptyText: {
    ...Typography.h2,
    color: Colors.textPrimary,
    marginTop: Spacing.md,
  },
  emptySubtext: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
});