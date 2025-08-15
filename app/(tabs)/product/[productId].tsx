// app/(tabs)/product/[productId].tsx - YÜKSEK KALİTE UI OPTİMİZASYON VE HATA DÜZELTMELERİ

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  SafeAreaView, Image, RefreshControl,
  LayoutAnimation, Platform, Dimensions, Modal, ActivityIndicator
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Feather } from '@expo/vector-icons';
import { useProductStore, ProductPhoto } from '@/stores/useProductStore';
import { Colors, Typography, Spacing, BorderRadius, PHOTO_GRID_GAP } from '@/constants';
import { Card } from '@/components/Card';
import { DialogService } from '@/components/Dialog/DialogService';
import { InputDialogService } from '@/components/Dialog/InputDialogService';
import { ImagePickerService } from '@/services/ui';
import { BackgroundRemovalAnimation } from '@/components/BackgroundRemovalAnimation';
import AppLoading, { AppLoadingRef } from '@/components/Loading/AppLoading';
import { ToastService } from '@/components/Toast/ToastService';
import { memoryManager } from '@/services/memoryManager'; // memoryManager import edildi
import { LazyImageUtils } from '@/components/LazyImage'; // LazyImageUtils import edildi

/**
 * ⭐ YÜKSEK KALİTE: PhotoItem component with advanced image optimization
 */
const PhotoItem: React.FC<{
  photo: ProductPhoto;
  isSelected: boolean;
  isSelectionMode: boolean;
  onPress: (photo: ProductPhoto) => void;
  onLongPress: (photo: ProductPhoto) => void;
}> = React.memo(({ photo, isSelected, isSelectionMode, onPress, onLongPress }) => {
  const { t } = useTranslation();
  if (!photo) return null;

  // Dinamik değerleri bileşen içinde hesaplayın
  const { width: windowWidth } = Dimensions.get('window');
  // Sütun sayısını doğrudan burada belirleyelim veya Layout.ts'den alabiliriz
  const photoColumns = windowWidth > 768 ? 6 : 4;

  // itemWidth'i useMemo ile hesaplayın
  const itemWidth = useMemo(() => {
    // Toplam boşlukları çıkarın (sütun sayısı + 1 boşluk kenarlar için)
    return (windowWidth - PHOTO_GRID_GAP * (photoColumns + 1)) / photoColumns;
  }, [windowWidth, photoColumns]);


  const cacheBustedUri = useMemo(() => {
    // photo.modifiedAt veya Date.now() kullanarak güçlü cache busting
    return LazyImageUtils.createStrongCacheBustedUri(photo.thumbnailUri, undefined, photo.modifiedAt);
  }, [photo.thumbnailUri, photo.modifiedAt]);

  const isDisabled = photo.status === 'processing';

  console.log(t('products.photoItemRenderingLog'), {
    photoId: photo.id,
    originalUri: photo.thumbnailUri.substring(0, 50) + '...',
    cacheBustedUri: cacheBustedUri.substring(0, 80) + '...',
    modifiedAt: photo.modifiedAt,
    status: photo.status,
    isDisabled: isDisabled
  });

  return (
    <TouchableOpacity
      // style'a dinamik genişliği doğrudan atayın
      style={[
        styles.photoItemBase, // Temel stil
        { width: itemWidth, height: itemWidth }, // Dinamik genişlik/yükseklik
        isSelected && styles.photoSelected,
        isDisabled && styles.photoItemDisabled // Yeni stil: İşlemdeyken hafifçe karart
      ]}
      onPress={() => onPress(photo)}
      onLongPress={() => onLongPress(photo)}
      activeOpacity={isDisabled ? 1 : 0.8} // İşlemdeyse opacity değişmesin
      disabled={isDisabled} // ⭐ BURASI ÖNEMLİ: Dokunulmaz hale getir
    >
      <Image
        source={{ uri: cacheBustedUri }}
        style={styles.photoImage}
        resizeMode="cover"
        fadeDuration={200}
        // cache="reload" // Artık URI'de cache buster olduğu için reload'a gerek yok
        onError={(error) => {
          console.warn(t('products.photoItemLoadErrorLog'), photo.id, error.nativeEvent.error);
        }}
        onLoad={() => {
          console.log(t('products.photoItemLoadedLog'), photo.id);
        }}
      />

      {/* Status Badge */}
      <View style={[
        styles.statusBadge,
        photo.status === 'processed' && styles.statusProcessed,
        photo.status === 'processing' && styles.statusProcessing
      ]}>
        <Text style={styles.statusText}>
          {photo.status === 'raw' ? t('products.status.raw') : photo.status === 'processing' ? t('products.status.processing') : t('products.status.processed')}
        </Text>
      </View>

      {/* Selection Indicator */}
      {!isDisabled && isSelectionMode && ( // İşlemde değilse ve seçim modundaysa göster
        <View style={styles.selectionIndicator}>
          {isSelected && <Feather name="check-circle" size={20} color={Colors.primary} />}
        </View>
      )}

      {/* ⭐ YENİ: İşleniyor animasyonu */}
      {isDisabled && (
        <View style={styles.processingOverlay} pointerEvents="none"> {/* pointerEvents eklendi */}
          <ActivityIndicator size="large" color={Colors.card} />
          <Text style={styles.processingText}>{t('products.status.processing')}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
});

// Artık global screenWidth ve photoColumns tanımlarına ihtiyacımız yok

if (Platform.OS === 'android') {
  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
}

interface AnimationState { isAnimating: boolean; originalUri: string | null; processedUri: string | null; }

export default function ProductDetailScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { productId } = useLocalSearchParams<{ productId: string }>();

  const { products, addMultiplePhotos, deletePhoto, removeMultipleBackgrounds, removeSingleBackground, updateProductName, deleteProduct } = useProductStore();

  const [refreshing, setRefreshing] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set());
  const [animationState, setAnimationState] = useState<AnimationState>({ isAnimating: false, originalUri: null, processedUri: null });
  const loadingRef = useRef<AppLoadingRef>(null);
  const [localIsLoading, setLocalIsLoading] = useState(true);

  const product = useMemo(() => {
    if (!productId) return null;
    return products.find(p => p.id === productId);
  }, [products, productId]);

  useEffect(() => {
    if (product && localIsLoading) {
      loadingRef.current?.hide();
      setLocalIsLoading(false);
    }
  }, [product, localIsLoading]);

  useEffect(() => {
    loadingRef.current?.show();
    setLocalIsLoading(true);
  }, [productId]);

  /**
   * ⭐ YÜKSEK KALİTE: Refresh with cache invalidation
   */
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    // Güçlü bellek temizliği ve cache invalidation
    await memoryManager.cleanup();
    // Ardından ürünleri yeniden yükle
    await useProductStore.getState().loadProducts();
    setRefreshing(false);
    ToastService.show(t('products.refreshCompleteLog'));
  }, [t]);

  const handleAddPhotos = useCallback(async () => {
    if (!product?.id) return;

    // Kritik işlemi kilitle
    try {
      await memoryManager.critical.withLock('add-photos-product-detail', async () => {
        loadingRef.current?.show();
        const imageUris = await ImagePickerService.pickImagesFromGallery();

        if (imageUris && imageUris.length > 0) {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          const success = await addMultiplePhotos(product.id, imageUris);

          // ⭐ CACHE INVALIDATION: Photo ekleme sonrası
          if (success) {
            console.log(t('products.photosAddedCacheInvalidationLog'));
            // memoryManager.cleanup() zaten addMultiplePhotos içinde çağrılıyor
          }
        }
      });
    } catch (e: any) {
      ToastService.error(e.message || t('common.errors.galleryPickFailed'));
    } finally {
      loadingRef.current?.hide();
    }
  }, [product?.id, addMultiplePhotos, t]);

  const handleDeleteSinglePhoto = useCallback((photoId: string) => {
    if (!product?.id) return;
    DialogService.show({
      title: t('products.deletePhotoTitle'),
      message: t('products.deletePhotoMessage'),
      buttons: [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'), style: 'destructive',
          onPress: async () => {
            loadingRef.current?.show();
            try {
              await deletePhoto(product.id, photoId);
              setSelectedPhotos(prev => {
                const newSet = new Set(prev);
                newSet.delete(photoId);
                return newSet;
              });

              // ⭐ CACHE INVALIDATION: Photo silme sonrası
              console.log(t('products.photoDeletedCacheInvalidationLog'));
              await memoryManager.cleanup(); // Temizlik
            } finally {
              loadingRef.current?.hide();
            }
          }
        },
      ],
    });
  }, [product?.id, deletePhoto, t]);

  const handleDeleteSelectedPhotos = useCallback(async () => {
    if (!product?.id) return;
    if (selectedPhotos.size === 0) {
      return;
    }
    DialogService.show({
      title: t('products.deleteSelectedPhotosTitle'),
      message: t('products.deleteSelectedPhotosMessage', { count: selectedPhotos.size }),
      buttons: [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'), style: 'destructive',
          onPress: async () => {
            loadingRef.current?.show();
            try {
              // Çoklu silme işlemini sıralı kuyruğa ekle
              const deletePromises = Array.from(selectedPhotos).map(photoId =>
                memoryManager.queue.addOperation(`delete-selected-photo-${photoId}`, async () => {
                  await deletePhoto(product.id, photoId);
                })
              );
              await Promise.all(deletePromises); // Tüm Promise'lerin bitmesini bekle

              setSelectedPhotos(new Set());
              setIsSelectionMode(false);

              // ⭐ CACHE INVALIDATION: Çoklu silme sonrası
              console.log(t('products.multiPhotoDeletedCacheInvalidationLog'));
              await memoryManager.cleanup(); // Temizlik

            } finally {
              loadingRef.current?.hide();
            }
          }
        },
      ],
    });
  }, [product?.id, selectedPhotos, deletePhoto, t]);

  const handleEditProductName = useCallback(() => {
    if (!product?.id) return;
    InputDialogService.show({
      title: t('products.editProductNameTitle'),
      placeholder: t('products.newProductNamePlaceholder'),
    }).then(async (newName) => {
      if (newName?.trim()) {
        loadingRef.current?.show();
        try {
          await updateProductName(product.id, newName.trim());
        } finally {
          loadingRef.current?.hide();
        }
      }
    });
  }, [product?.id, updateProductName, t]);

  const handleDeleteProduct = useCallback(() => {
    if (!product?.id) return;
    DialogService.show({
      title: t('products.deleteProductTitle'),
      message: t('products.deleteProductMessage'),
      buttons: [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'), style: 'destructive',
          onPress: async () => {
            loadingRef.current?.show();
            try {
              await deleteProduct(product.id);
              router.push('/(tabs)/home'); // Ürün silindiğinde anasayfaya dön
            } finally {
              loadingRef.current?.hide();
            }
          }
        }
      ]
    });
  }, [product?.id, deleteProduct, router, t]);

  const handleRemoveBackgrounds = useCallback(async () => {
    if (!product?.id) return;
    if (selectedPhotos.size === 0) {
      return;
    }
    const photosArray = Array.from(selectedPhotos);
    loadingRef.current?.show({ text: t('loading.processingBackgrounds') });
    try {
      const success = await removeMultipleBackgrounds(product.id, photosArray);

      if (success) {
        setSelectedPhotos(new Set());
        setIsSelectionMode(false);
        console.log(t('products.backgroundRemovalCompleteLog'));
        await memoryManager.cleanup(); // İşlem sonrası temizlik
      } else {
        ToastService.error(t('products.backgroundRemovalFailed'));
      }
    } finally {
      loadingRef.current?.hide();
    }
  }, [product?.id, selectedPhotos, removeMultipleBackgrounds, t]);

  const handleRemoveSingleBackground = useCallback(async (photoId: string) => {
    if (!product) return;
    const photoToProcess = product.photos.find(p => p.id === photoId);
    if (!photoToProcess) return;

    setAnimationState({ isAnimating: true, originalUri: photoToProcess.originalUri, processedUri: null });
    const success = await removeSingleBackground(product.id, photoId);

    if (success) {
      const updatedProduct = useProductStore.getState().products.find(p => p.id === product.id);
      const processedPhoto = updatedProduct?.photos.find(p => p.id === photoId);
      if (processedPhoto?.processedUri) {
        setAnimationState(prev => ({ ...prev, processedUri: processedPhoto.processedUri }));
      }
      console.log(t('products.singleBackgroundRemovalCompleteLog'));
      await memoryManager.cleanup(); // İşlem sonrası temizlik
    } else {
      setAnimationState({ isAnimating: false, originalUri: null, processedUri: null });
      ToastService.error(t('products.backgroundRemovalFailed'));
    }
  }, [product, removeSingleBackground, t]);

  const handleEditPhoto = useCallback((photo: ProductPhoto) => {
    if (!product?.id) return;
    router.push({ pathname: '/(tabs)/editor/[photoId]', params: { photoId: photo.id, productId: product.id } });
  }, [product?.id, router]);

  const handlePhotoPress = useCallback((photo: ProductPhoto) => {
    // ⭐ YENİ: Fotoğraf işlemde ise tıklama engellenir
    if (photo.status === 'processing') {
      ToastService.info(t('products.photoIsProcessing'));
      return;
    }

    if (isSelectionMode) {
      setSelectedPhotos(prev => {
        const newSet = new Set(prev);
        if (newSet.has(photo.id)) newSet.delete(photo.id);
        else newSet.add(photo.id);
        return newSet;
      });
    } else {
      if (photo.status === 'raw') {
        DialogService.show({
          title: t('products.removeBackgroundsButton'),
          message: t('products.removeSingleBackgroundMessage'),
          buttons: [
            { text: t('common.cancel'), style: 'cancel' },
            {
              text: t('common.clean'),
              onPress: () => handleRemoveSingleBackground(photo.id),
              style: 'default',
            },
          ],
        });
      } else if (photo.status === 'processed') {
        handleEditPhoto(photo);
      }
    }
  }, [isSelectionMode, handleEditPhoto, handleRemoveSingleBackground, t]);

  useEffect(() => {
    if (isSelectionMode && selectedPhotos.size === 0) {
      setIsSelectionMode(false);
    }
  }, [selectedPhotos.size, isSelectionMode]);

  const handlePhotoLongPress = useCallback((photo: ProductPhoto) => {
    // ⭐ YENİ: Fotoğraf işlemde ise uzun basma engellenir
    if (photo.status === 'processing') {
      ToastService.info(t('products.photoIsProcessing'));
      return;
    }
    if (!isSelectionMode) {
      setIsSelectionMode(true);
      setSelectedPhotos(new Set([photo.id]));
    }
  }, [isSelectionMode, t]);

  // ⭐ YENİ: Çoklu arka plan temizleme butonu için disabled kontrolü
  const isMultiRemoveButtonDisabled = useMemo(() => {
    if (selectedPhotos.size === 0) return true;
    if (!product) return true;
    
    // Seçilen tüm fotoğrafların RAW durumunda olduğunu kontrol et
    // Herhangi biri processing veya processed ise düğme devre dışı bırakılacak
    const allSelectedAreRaw = Array.from(selectedPhotos).every(photoId => {
      const p = product.photos.find(ph => ph.id === photoId);
      return p && p.status === 'raw';
    });
    
    return !allSelectedAreRaw; // Hepsi raw değilse disabled olsun
  }, [selectedPhotos, product]);

  if (!product) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Feather name="alert-circle" size={48} color={Colors.error} />
        <Text style={styles.errorTitle}>{t('products.notFoundTitle')}</Text>
        <Text style={styles.errorSubtitle}>{t('products.notFoundMessage')}</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            console.log(t('common.goToHomeLog'));
            router.push('/(tabs)/home');
          }}
        >
          <Text style={styles.backButtonText}>{t('common.goToHome')}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: product.name, headerShown: false }} />
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={() => {
              console.log(t('common.goToHomeLog'));
              router.push('/(tabs)/home');
            }}
            style={styles.headerBackButton}
          >
            <Feather name="arrow-left" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle} numberOfLines={1}>{product.name}</Text>
            <Text style={styles.headerSubtitle}>{t('products.photoCountSuffix', { count: product.photos.length })}</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={handleEditProductName} style={styles.headerButton}>
            <Feather name="edit-2" size={20} color={Colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDeleteProduct} style={styles.headerButton}>
            <Feather name="trash-2" size={20} color={Colors.error} />
          </TouchableOpacity>
        </View>
      </View>

      {isSelectionMode && (
        <View style={styles.selectionHeader}>
          <Text style={styles.selectionText}>{t('products.selectedPhotosCount', { count: selectedPhotos.size })}</Text>
          <View style={styles.selectionActions}>
            <TouchableOpacity
              style={[
                styles.selectionButton,
                isMultiRemoveButtonDisabled && styles.selectionButtonDisabled
              ]}
              onPress={handleRemoveBackgrounds}
              disabled={isMultiRemoveButtonDisabled}
            >
              <Text style={styles.selectionButtonText}>{t('products.removeBackgroundsButton')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.selectionButton, styles.deleteSelectionButton]} onPress={handleDeleteSelectedPhotos} disabled={selectedPhotos.size === 0}>
              <Text style={styles.selectionButtonText}>{t('common.delete')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={product.photos && product.photos.length > 0 ? styles.scrollContent : styles.emptyScrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
            title={t('loading.refreshingThumbnails')}
          />
        }
      >
        {product.photos && product.photos.length > 0 ? (
          <View style={styles.photosGrid}>
            {product.photos.filter(Boolean).map((photo) => (
              <PhotoItem
                key={`${photo.id}-${photo.modifiedAt}`}
                photo={photo}
                isSelected={selectedPhotos.has(photo.id)}
                isSelectionMode={isSelectionMode}
                onPress={handlePhotoPress}
                onLongPress={handlePhotoLongPress}
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptyPhotosContainer}>
            <View style={styles.emptyPhotosIcon}>
              <Feather name="camera" size={64} color={Colors.gray300} />
            </View>
            <Text style={styles.emptyPhotosTitle}>{t('products.emptyPhotosTitle')}</Text>
            <Text style={styles.emptyPhotosSubtitle}>{t('products.addPhotoSubtitle')}</Text>
          </View>
        )}
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={handleAddPhotos}>
        <Feather name="plus" size={24} color={Colors.card} />
      </TouchableOpacity>

      <AppLoading ref={loadingRef} />

      <Modal visible={animationState.isAnimating} transparent={true} animationType="fade">
        <View style={styles.animationOverlay}>
          <BackgroundRemovalAnimation
            originalUri={animationState.originalUri!}
            processedUri={animationState.processedUri!}
            isAnimating={animationState.isAnimating}
            onAnimationComplete={() => {
              setAnimationState({ isAnimating: false, originalUri: null, processedUri: null });
            }}
          />
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// styles nesnesini, dinamik hesaplamalardan bağımsız olarak tanımlayın
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background, gap: Spacing.lg },
  loadingText: { ...Typography.body, color: Colors.textSecondary },
  errorTitle: { ...Typography.h2, color: Colors.error, marginTop: Spacing.lg },
  errorSubtitle: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.sm },
  backButton: { backgroundColor: Colors.primary, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderRadius: BorderRadius.md, marginTop: Spacing.lg },
  backButtonText: { ...Typography.bodyMedium, color: Colors.card },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border },
  headerLeft: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  headerBackButton: { padding: Spacing.sm },
  headerInfo: { marginLeft: Spacing.md, flex: 1 },
  headerTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
    fontWeight: '700',
    fontSize: 16,
  },
  headerSubtitle: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  headerRight: { flexDirection: 'row', gap: Spacing.sm },
  headerButton: { padding: Spacing.sm },
  selectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.primaryLight,
    borderBottomWidth: 1,
    borderBottomColor: Colors.primary,
  },
  selectionText: {
    ...Typography.bodyMedium,
    color: Colors.primaryDark,
    fontWeight: '600',
    flex: 1,
  },
  selectionActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  selectionButton: { backgroundColor: Colors.primary, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.md },
  selectionButtonText: { ...Typography.caption, color: Colors.card, fontWeight: '600' },
  deleteSelectionButton: {
    backgroundColor: Colors.error,
  },

  // ⭐ YENİ EKLEME: Disabled buton stili
  selectionButtonDisabled: {
    backgroundColor: Colors.gray400, // Daha soluk bir gri tonu
    opacity: 0.7, // Genel opaklığı düşür
  },

  scrollView: { flex: 1 },
  // scrollContent artık PHOTO_GRID_GAP kullanıyor
  scrollContent: { padding: PHOTO_GRID_GAP, paddingBottom: 100 },
  emptyScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: PHOTO_GRID_GAP, // Burası da PHOTO_GRID_GAP kullanıyor
  },
  // photoItem'ın genişliği artık PhotoItem bileşeninin içinde ayarlanacak
  photoItemBase: { // Yeni bir temel stil tanımlayın
    aspectRatio: 1,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: Colors.gray100
  },
  photoItemDisabled: { // Yeni stil: İşlemdeyken hafifçe karart
    opacity: 0.7,
  },
  photoSelected: { borderWidth: 3, borderColor: Colors.primary },
  photoImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  statusBadge: { position: 'absolute', top: Spacing.sm, left: Spacing.sm, backgroundColor: Colors.warning, paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.sm },
  statusProcessed: { backgroundColor: Colors.success },
  statusProcessing: { backgroundColor: Colors.primary },
  statusText: { ...Typography.caption, color: Colors.card, fontSize: 10, fontWeight: '600' },
  selectionIndicator: { position: 'absolute', top: Spacing.sm, right: Spacing.sm, backgroundColor: Colors.card, borderRadius: 12, width: 24, height: 24, justifyContent: 'center', alignItems: 'center' },
  
  // ⭐ YENİ STİL: İşleniyor animasyonu overlay'i
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1, // Diğer her şeyin üstünde olması için
    gap: Spacing.xs,
  },
  processingText: {
    ...Typography.caption,
    color: Colors.card,
    fontSize: 10,
    fontWeight: '600',
  },

  emptyPhotosContainer: {
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emptyPhotosIcon: { marginBottom: Spacing.xl },
  emptyPhotosTitle: {
    ...Typography.h2,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    textAlign: 'center'
  },
  emptyPhotosSubtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  fab: { position: 'absolute', bottom: Spacing.lg + 20, right: Spacing.lg, width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', shadowColor: Colors.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 12 },
  animationOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0, 0, 0, 0.75)', justifyContent: 'center', alignItems: 'center', zIndex: 2000 },
});