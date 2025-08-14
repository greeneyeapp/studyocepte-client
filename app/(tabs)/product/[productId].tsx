// app/(tabs)/product/[productId].tsx - YÜKSEK KALİTE UI OPTİMİZASYON
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  SafeAreaView, Image, RefreshControl,
  LayoutAnimation, Platform, Dimensions, Modal
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Feather } from '@expo/vector-icons';
import { useProductStore, ProductPhoto } from '@/stores/useProductStore';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants';
import { Card } from '@/components/Card';
import { DialogService } from '@/components/Dialog/DialogService';
import { InputDialogService } from '@/components/Dialog/InputDialogService';
import { ImagePickerService } from '@/services/ui';
import { BackgroundRemovalAnimation } from '@/components/BackgroundRemovalAnimation';
import AppLoading, { AppLoadingRef } from '@/components/Loading/AppLoading';

/**
 * ⭐ YÜKSEK KALİTE: PhotoItem component with advanced image optimization
 */
const PhotoItem: React.FC<{
  photo: ProductPhoto;
  isSelected: boolean;
  isSelectionMode: boolean;
  onPress: (photo: ProductPhoto) => void;
  onLongPress: (photo: ProductPhoto) => void;
  t: any; // t prop'u eklendi
}> = React.memo(({ photo, isSelected, isSelectionMode, onPress, onLongPress, t }) => {
  if (!photo) return null;

  // ⭐ GÜÇLÜ CACHE-BUSTING: URI'yi her render'da unique yap
  const cacheBustedUri = useMemo(() => {
    if (!photo.thumbnailUri) return '';

    // Zaten cache-busted parametreler varsa onları koru, yoksa ekle
    const hasParams = photo.thumbnailUri.includes('?');
    const timestamp = Date.now();
    const randomParam = Math.random().toString(36).substr(2, 6);

    if (hasParams) {
      // Mevcut parametrelere ek cache-buster ekle
      return `${photo.thumbnailUri}&t=${timestamp}&r=${randomParam}`;
    } else {
      // Yeni cache-buster parametreleri ekle
      return `${photo.thumbnailUri}?cb=${timestamp}&r=${randomParam}`;
    }
  }, [photo.thumbnailUri, photo.modifiedAt]); // modifiedAt değiştiğinde de yenile

  console.log('🖼️ PhotoItem rendering with cache-busted URI:', {
    photoId: photo.id,
    originalUri: photo.thumbnailUri,
    cacheBustedUri: cacheBustedUri.substring(0, 80) + '...',
    modifiedAt: photo.modifiedAt
  });

  return (
    <TouchableOpacity
      style={[styles.photoItem, isSelected && styles.photoSelected]}
      onPress={() => onPress(photo)}
      onLongPress={() => onLongPress(photo)}
      activeOpacity={0.8}
    >
      <Image
        source={{ uri: cacheBustedUri }}
        style={styles.photoImage}
        // ⭐ YÜKSEK KALİTE: Image rendering optimizasyonları
        resizeMode="cover"
        resizeMethod="resize" // Android için optimize edilmiş resize
        fadeDuration={200} // Smooth loading
        // ⭐ CACHE CONTROL: Aggressive cache busting
        cache="reload" // Her zaman fresh version yükle
        onError={(error) => {
          console.warn('⚠️ PhotoItem image load error:', photo.id, error);
        }}
        onLoad={() => {
          console.log('✅ PhotoItem image loaded successfully:', photo.id);
        }}
      />

      {/* Status Badge */}
      <View style={[
        styles.statusBadge,
        photo.status === 'processed' && styles.statusProcessed,
        photo.status === 'processing' && styles.statusProcessing
      ]}>
        <Text style={styles.statusText}>
          {photo.status === 'raw' ? t('productDetail.rawStatus') : photo.status === 'processing' ? t('productDetail.processingStatus') : t('productDetail.processedStatus')}
        </Text>
      </View>

      {/* Selection Indicator */}
      {isSelectionMode && (
        <View style={styles.selectionIndicator}>
          {isSelected && <Feather name="check-circle" size={20} color={Colors.primary} />}
        </View>
      )}
    </TouchableOpacity>
  );
});

const getScreenWidth = () => {
  try { return Dimensions.get('window').width; }
  catch (error) { console.warn('Dimensions error, using fallback:', error); return 375; }
};
const screenWidth = getScreenWidth();

const photoColumns = screenWidth > 768 ? 6 : 4;
const PHOTO_GRID_SPACING = 8;

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

    try {
      // ⭐ CACHE INVALIDATION: Force product store refresh
      console.log('🔄 Starting HIGH QUALITY refresh with cache invalidation');

      // 1. Image cache temizle
      const { imageProcessor } = await import('@/services/imageProcessor');
      await imageProcessor.clearImageCache();

      // 2. Product store'u yeniden yükle
      await useProductStore.getState().loadProducts();

      // 3. Force re-render
      setTimeout(() => {
        const currentProducts = useProductStore.getState().products;
        useProductStore.setState({ products: [...currentProducts] });
        console.log('✅ HIGH QUALITY refresh completed with cache invalidation');
      }, 500);

    } catch (error) {
      console.warn('⚠️ Refresh cache invalidation failed:', error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const handleAddPhotos = useCallback(async () => {
    if (!product?.id) return;
    try {
      loadingRef.current?.show();
      const imageUris = await ImagePickerService.pickImagesFromGallery();

      if (imageUris && imageUris.length > 0) {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        const success = await addMultiplePhotos(product.id, imageUris);

        // ⭐ CACHE INVALIDATION: Photo ekleme sonrası
        if (success) {
          console.log('📸 New photos added, triggering cache invalidation');
          setTimeout(async () => {
            try {
              const { imageProcessor } = await import('@/services/imageProcessor');
              await imageProcessor.clearImageCache();

              // Force re-render
              const currentProducts = useProductStore.getState().products;
              useProductStore.setState({ products: [...currentProducts] });
            } catch (error) {
              console.warn('⚠️ Post-add cache invalidation failed:', error);
            }
          }, 1000);
        }
      }
    } finally {
      loadingRef.current?.hide();
    }
  }, [product?.id, addMultiplePhotos]);

  const handleDeleteSinglePhoto = useCallback((photoId: string) => {
    if (!product?.id) return;
    DialogService.show({
      title: t('productDetail.deletePhotoTitle'),
      message: t('productDetail.deletePhotoMessage'),
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
              console.log('🗑️ Photo deleted, triggering cache invalidation');
              setTimeout(async () => {
                try {
                  const { imageProcessor } = await import('@/services/imageProcessor');
                  await imageProcessor.clearImageCache();
                } catch (error) {
                  console.warn('⚠️ Post-delete cache invalidation failed:', error);
                }
              }, 500);

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
      title: t('productDetail.deleteSelectedPhotosTitle'),
      message: t('productDetail.deleteSelectedPhotosMessage', { count: selectedPhotos.size }),
      buttons: [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'), style: 'destructive',
          onPress: async () => {
            loadingRef.current?.show();
            try {
              for (const photoId of selectedPhotos) {
                await deletePhoto(product.id, photoId);
              }
              setSelectedPhotos(new Set());
              setIsSelectionMode(false);

              // ⭐ CACHE INVALIDATION: Çoklu silme sonrası
              console.log('🗑️ Multiple photos deleted, triggering cache invalidation');
              setTimeout(async () => {
                try {
                  const { imageProcessor } = await import('@/services/imageProcessor');
                  await imageProcessor.clearImageCache();
                } catch (error) {
                  console.warn('⚠️ Post-bulk-delete cache invalidation failed:', error);
                }
              }, 500);

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
      title: t('productDetail.editProductName'),
      placeholder: t('productDetail.newProductNamePlaceholder'),
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
      title: t('productDetail.deleteProductTitle'),
      message: t('productDetail.deleteProductMessage'),
      buttons: [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'), style: 'destructive',
          onPress: async () => {
            loadingRef.current?.show();
            try {
              await deleteProduct(product.id);
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
    loadingRef.current?.show({ text: t('imageProcessing.backgroundsBeingCleaned') });
    try {
      const success = await removeMultipleBackgrounds(product.id, photosArray);
      setSelectedPhotos(new Set());
      setIsSelectionMode(false);

      // ⭐ CACHE INVALIDATION: Background removal sonrası
      if (success) {
        console.log('🖼️ Background removal completed, triggering cache invalidation');
        setTimeout(async () => {
          try {
            const { imageProcessor } = await import('@/services/imageProcessor');
            await imageProcessor.clearImageCache();

            // Force re-render
            const currentProducts = useProductStore.getState().products;
            useProductStore.setState({ products: [...currentProducts] });
          } catch (error) {
            console.warn('⚠️ Post-background-removal cache invalidation failed:', error);
          }
        }, 1000);
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

      // ⭐ CACHE INVALIDATION: Single background removal sonrası
      console.log('🖼️ Single background removal completed, triggering cache invalidation');
      setTimeout(async () => {
        try {
          const { imageProcessor } = await import('@/services/imageProcessor');
          await imageProcessor.clearImageCache();

          // Force re-render
          const currentProducts = useProductStore.getState().products;
          useProductStore.setState({ products: [...currentProducts] });
        } catch (error) {
          console.warn('⚠️ Post-single-background-removal cache invalidation failed:', error);
        }
      }, 1000);

    } else {
      setAnimationState({ isAnimating: false, originalUri: null, processedUri: null });
    }
  }, [product, removeSingleBackground]);

  const handleEditPhoto = useCallback((photo: ProductPhoto) => {
    if (!product?.id) return;
    router.push({ pathname: '/(tabs)/editor/[photoId]', params: { photoId: photo.id, productId: product.id } });
  }, [product?.id, router]);

  const handlePhotoPress = useCallback((photo: ProductPhoto) => {
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
          title: t('productDetail.removeBackgroundTitle'),
          message: t('imageProcessing.singleBackgroundRemovalPrompt'),
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
    if (!isSelectionMode) {
      setIsSelectionMode(true);
      setSelectedPhotos(new Set([photo.id]));
    }
  }, [isSelectionMode]);

  if (!product) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Feather name="alert-circle" size={48} color={Colors.error} />
        <Text style={styles.errorTitle}>{t('productDetail.productNotFoundTitle')}</Text>
        <Text style={styles.errorSubtitle}>{t('productDetail.productNotFoundSubtitle')}</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            console.log('🔙 Error back button: navigating to home');
            router.push('/(tabs)/home');
          }}
        >
          <Text style={styles.backButtonText}>{t('productDetail.backToHome')}</Text>
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
              console.log('🔙 Back button: always navigating to home');
              router.push('/(tabs)/home');
            }}
            style={styles.headerBackButton}
          >
            <Feather name="arrow-left" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle} numberOfLines={1}>{product.name}</Text>
            <Text style={styles.headerSubtitle}>{product.photos.length} {t('productDetail.photosCountLabel')}</Text>
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
          <Text style={styles.selectionText}>{t('productDetail.selectPhotos', { count: selectedPhotos.size })}</Text>
          <View style={styles.selectionActions}>
            <TouchableOpacity style={styles.selectionButton} onPress={handleRemoveBackgrounds} disabled={selectedPhotos.size === 0}>
              <Text style={styles.selectionButtonText}>{t('productDetail.removeBackgroundsAction')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.selectionButton, styles.deleteSelectionButton]} onPress={handleDeleteSelectedPhotos} disabled={selectedPhotos.size === 0}>
              <Text style={styles.selectionButtonText}>{t('productDetail.deleteAction')}</Text>
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
            title={t('productDetail.refreshThumbnailMessage')}
          />
        }
      >
        {product.photos && product.photos.length > 0 ? (
          <View style={styles.photosGrid}>
            {product.photos.filter(Boolean).map((photo) => (
              <PhotoItem
                key={`${photo.id}-${photo.modifiedAt}`} // ⭐ CACHE-BUSTING: Key'e modifiedAt ekle
                photo={photo}
                isSelected={selectedPhotos.has(photo.id)}
                isSelectionMode={isSelectionMode}
                onPress={handlePhotoPress}
                onLongPress={handlePhotoLongPress}
                t={t} // t prop'u geçirildi
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptyPhotosContainer}>
            <View style={styles.emptyPhotosIcon}>
              <Feather name="camera" size={64} color={Colors.gray300} />
            </View>
            <Text style={styles.emptyPhotosTitle}>{t('productDetail.noPhotos')}</Text>
            <Text style={styles.emptyPhotosSubtitle}>{t('productDetail.noPhotosSubtitle')}</Text>
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
  scrollView: { flex: 1 },
  scrollContent: { padding: PHOTO_GRID_SPACING, paddingBottom: 100 },
  emptyScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: PHOTO_GRID_SPACING,
  },
  photoItem: {
    width: (screenWidth - PHOTO_GRID_SPACING * (photoColumns + 1)) / photoColumns,
    aspectRatio: 1,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: Colors.gray100
  },
  photoSelected: { borderWidth: 3, borderColor: Colors.primary },
  // ⭐ YÜKSEK KALİTE: PhotoImage optimizasyonları
  photoImage: {
    width: '100%',
    height: '100%',
    // ⭐ Advanced rendering props for high quality
    resizeMode: 'cover',
  },
  statusBadge: { position: 'absolute', top: Spacing.sm, left: Spacing.sm, backgroundColor: Colors.warning, paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.sm },
  statusProcessed: { backgroundColor: Colors.success },
  statusProcessing: { backgroundColor: Colors.primary },
  statusText: { ...Typography.caption, color: Colors.card, fontSize: 10, fontWeight: '600' },
  selectionIndicator: { position: 'absolute', top: Spacing.sm, right: Spacing.sm, backgroundColor: Colors.card, borderRadius: 12, width: 24, height: 24, justifyContent: 'center', alignItems: 'center' },
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