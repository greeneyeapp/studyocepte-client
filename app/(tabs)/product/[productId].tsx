// client/app/(tabs)/product/[productId].tsx - Düzeltilmiş
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  LayoutAnimation,
  UIManager,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useProductStore } from '@/stores/useProductStore';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { ProductPhoto, api } from '@/services/api';
import { ToastService } from '@/components/Toast/ToastService';
import { LoadingService } from '@/components/Loading/LoadingService';
import { Layout } from '@/constants/Layout';
import { useBatchOperations } from '@/hooks/useBatchOperations';
import { DialogService } from '@/components/Dialog/DialogService'; // Dialog servisini import et

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const numColumns = Layout.isTablet ? 4 : 3;

export default function ProductDetailScreen() {
  const { t } = useTranslation();
  const { productId } = useLocalSearchParams<{ productId: string }>();
  const router = useRouter();
  // HATA DÜZELTİLDİ: 'uploadAnotherPhoto' yerine 'uploadMultiplePhotos' çağrıldı.
  const { activeProduct, isLoading, fetchProductById, uploadMultiplePhotos } = useProductStore();
  const { startOperation, isStarting: isBatchStarting } = useBatchOperations();

  const [isSelectionMode, setSelectionMode] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (productId) {
      fetchProductById(productId);
    }
  }, [productId]);

  useEffect(() => {
    if (activeProduct?.photos.some(photo => photo.status === 'processing')) {
      const interval = setInterval(() => {
        if (productId && !isSelectionMode) {
          fetchProductById(productId);
        }
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [activeProduct?.photos, productId, isSelectionMode]);

  const handleAddPhoto = async () => {
    if (!productId) return;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      ToastService.show({ type: 'error', text1: t('common.permissions.galleryTitle'), text2: t('common.permissions.galleryMessage') });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: false,
      quality: 1,
      allowsMultipleSelection: true,
    });

    if (!result.canceled && result.assets) {
      LoadingService.show();
      try {
        const imageUris = result.assets.map(asset => asset.uri);
        await uploadMultiplePhotos(productId, imageUris); // Bu satır artık doğru çalışacak
        ToastService.show({ type: 'success', text1: t('common.success'), text2: `${imageUris.length} fotoğraf yüklendi ve işleniyor!` });
      } catch (error: any) {
        ToastService.show({ type: 'error', text1: t('common.error'), text2: error.message });
      } finally {
        LoadingService.hide();
      }
    }
  };

  const toggleSelectionMode = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelectionMode(!isSelectionMode);
    setSelectedPhotos(new Set());
  };

  const handlePhotoPress = (photo: ProductPhoto) => {
    if (isSelectionMode) {
      const newSelection = new Set(selectedPhotos);
      if (newSelection.has(photo.id)) {
        newSelection.delete(photo.id);
      } else {
        newSelection.add(photo.id);
      }
      setSelectedPhotos(newSelection);
    } else {
      if (photo.status !== 'completed') {
        ToastService.show({
          type: photo.status === 'failed' ? 'error' : 'info',
          text1: photo.status === 'failed' ? 'İşleme Başarısız' : 'İşleniyor',
          text2: photo.status === 'failed' ? 'Bu fotoğraf işlenemedi.' : 'Fotoğraf hala işleniyor.',
        });
        return;
      }
      router.push({
        pathname: '/(tabs)/editor/[photoId]',
        params: { photoId: photo.id },
      });
    }
  };

  const handleBatchDelete = async () => {
    if (selectedPhotos.size === 0) return;

    DialogService.show({
      title: 'Fotoğrafları Sil',
      message: `${selectedPhotos.size} adet fotoğrafı kalıcı olarak silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`,
      buttons: [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            LoadingService.show();
            try {
              await api.deleteMultiplePhotos(Array.from(selectedPhotos));
              await fetchProductById(productId!); // Sayfayı yenile
              ToastService.show({ type: 'success', text1: 'Başarılı', text2: `${selectedPhotos.size} fotoğraf silindi.` });
              toggleSelectionMode(); // Seçim modundan çık
            } catch (error: any) {
              ToastService.show({ type: 'error', text1: 'Hata', text2: error.message });
            } finally {
              LoadingService.hide();
            }
          },
        },
      ],
    });
  };

  const renderPhoto = ({ item: photo }: { item: ProductPhoto }) => {
    const isSelected = selectedPhotos.has(photo.id);
    return (
      <View style={styles.photoWrapper}>
        <TouchableOpacity onPress={() => handlePhotoPress(photo)} activeOpacity={0.8}>
          <Card padding="none" style={isSelected ? styles.selectedCard : undefined}>
            <Image
              source={{ uri: photo.thumbnailUrl || 'https://via.placeholder.com/150' }}
              style={styles.photoImage}
            />
            {isSelectionMode && (
              <View style={[styles.selectionOverlay, isSelected && styles.selectionOverlayActive]}>
                <Feather name={isSelected ? "check-circle" : "circle"} size={24} color={Colors.card} />
              </View>
            )}
            {photo.status !== 'completed' && !isSelectionMode && (
              <View style={styles.statusOverlay}>
                {photo.status === 'processing' && <ActivityIndicator color={Colors.card} />}
                {photo.status === 'failed' && <Feather name="alert-triangle" size={24} color={Colors.card} />}
              </View>
            )}
          </Card>
        </TouchableOpacity>
      </View>
    );
  };

  if (isLoading && !activeProduct) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: t('common.loading') }} />
        <ActivityIndicator size="large" style={styles.centered} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: activeProduct?.name || 'Ürün Detayı' }} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.productName} numberOfLines={1}>{activeProduct?.name}</Text>
          <Text style={styles.photoCount}>{activeProduct?.photos.length || 0} {t('products.photos')}</Text>
        </View>
        <Button title="Fotoğraf Ekle" onPress={handleAddPhoto} size="small" variant="outline" icon={<Feather name="plus" size={14} color={Colors.primary} />} />
        <Button title={isSelectionMode ? t('common.cancel') : "Seç"} onPress={toggleSelectionMode} size="small" variant="ghost" />
      </View>

      <FlatList
        data={activeProduct?.photos || []}
        keyExtractor={(item) => item.id}
        numColumns={numColumns}
        renderItem={renderPhoto}
        contentContainerStyle={styles.listContainer}
      />

      {isSelectionMode && selectedPhotos.size > 0 && (
        <View style={styles.batchActionsContainer}>
          <Text style={styles.selectionCountText}>{selectedPhotos.size} fotoğraf seçildi</Text>
          {/* Butonu "Sil" olarak değiştiriyoruz */}
          <Button
            title="Seçilenleri Sil"
            onPress={handleBatchDelete} // Yeni fonksiyonu bağlıyoruz
            icon={<Feather name="trash" size={16} color={Colors.error} />}
            variant="outline"
            textStyle={{ color: Colors.error }}
            style={{ borderColor: Colors.error }}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: Colors.card, gap: Spacing.sm },
  backButton: { padding: Spacing.xs },
  headerContent: { flex: 1 },
  productName: { ...Typography.h3, color: Colors.textPrimary },
  photoCount: { ...Typography.caption, color: Colors.textSecondary, marginTop: Spacing.xs },
  listContainer: { padding: Spacing.sm, paddingBottom: 100 },
  photoWrapper: { width: `${100 / numColumns}%`, padding: Spacing.sm },
  photoImage: { width: '100%', aspectRatio: 1, borderRadius: BorderRadius.lg, backgroundColor: Colors.gray100 },
  statusOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', borderRadius: BorderRadius.lg },
  selectedCard: { borderColor: Colors.primary, borderWidth: 3 },
  selectionOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center', borderRadius: BorderRadius.lg, },
  selectionOverlayActive: { backgroundColor: `rgba(79, 70, 229, 0.5)` },
  batchActionsContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.md, paddingBottom: Spacing.xl, backgroundColor: Colors.card, borderTopWidth: 1, borderTopColor: Colors.border, shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 8 },
  selectionCountText: { ...Typography.bodyMedium, color: Colors.textPrimary },
});