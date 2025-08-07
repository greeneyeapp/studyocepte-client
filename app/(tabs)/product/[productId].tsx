import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  SafeAreaView, ActivityIndicator, Image, RefreshControl,
  LayoutAnimation, Platform, Dimensions
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Feather } from '@expo/vector-icons';
import { useProductStore, ProductPhoto } from '@/stores/useProductStore';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants';
import { Card } from '@/components/Card';
import { ToastService } from '@/components/Toast/ToastService';
import { DialogService } from '@/components/Dialog/DialogService';
import { InputDialogService } from '@/components/Dialog/InputDialogService';
import { ImagePickerService } from '@/services/ui';

// Screen dimensions - Güvenli şekilde al
const getScreenWidth = () => {
  try {
    return Dimensions.get('window').width;
  } catch (error) {
    console.warn('Dimensions error, using fallback:', error);
    return 375; // iPhone SE fallback
  }
};

const screenWidth = getScreenWidth();

if (Platform.OS === 'android') {
  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
}

export default function ProductDetailScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { productId } = useLocalSearchParams<{ productId: string }>();
  
  const { 
    products, 
    addMultiplePhotos, 
    deletePhoto, 
    removeMultipleBackgrounds,
    removeSingleBackground,
    updateProductName, 
    deleteProduct,
    isProcessing,
    processingMessage,
    isLoading 
  } = useProductStore();

  const [refreshing, setRefreshing] = useState(false);
  // State for selection mode and selected photos
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set());

  // Product'ı bul
  const product = useMemo(() => {
    if (!productId) return null;
    return products.find(p => p.id === productId);
  }, [products, productId]);

  // Loading ve hata durumları
  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Yükleniyor...</Text>
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Feather name="alert-circle" size={48} color={Colors.error} />
        <Text style={styles.errorTitle}>Ürün Bulunamadı</Text>
        <Text style={styles.errorSubtitle}>Bu ürün silinmiş veya bulunamıyor.</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Geri Dön</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Pull to refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    // Burada gerekirse product'ı refresh edebiliriz
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  // Fotoğraf ekleme
  const handleAddPhotos = useCallback(async () => {
    try {
      const imageUri = await ImagePickerService.pickImageFromGallery();
      if (imageUri) {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        const success = await addMultiplePhotos(product.id, [imageUri]);
        if (success) {
          ToastService.show('Fotoğraf başarıyla eklendi!');
        }
      }
    } catch (error: any) {
      ToastService.show(error.message, 'error');
    }
  }, [product.id, addMultiplePhotos]);

  // Fotoğraf silme
  const handleDeletePhoto = useCallback((photoId: string) => {
    DialogService.show({
      title: 'Fotoğrafı Sil',
      message: 'Bu fotoğrafı silmek istediğinizden emin misiniz?',
      buttons: [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePhoto(product.id, photoId);
              ToastService.show('Fotoğraf silindi');
              setSelectedPhotos(prev => {
                const newSet = new Set(prev);
                newSet.delete(photoId);
                return newSet;
              });
            } catch (error: any) {
              ToastService.show(error.message, 'error');
            }
          }
        }
      ]
    });
  }, [product.id, deletePhoto]);

  // Ürün adını düzenle
  const handleEditProductName = useCallback(() => {
    InputDialogService.show({
      title: 'Ürün Adını Düzenle',
      placeholder: 'Yeni ürün adı',
      onConfirm: async (newName) => {
        if (newName.trim()) {
          try {
            await updateProductName(product.id, newName.trim());
            ToastService.show('Ürün adı güncellendi');
          } catch (error: any) {
            ToastService.show(error.message, 'error');
          }
        }
      }
    });
  }, [product.id, updateProductName]);

  // Ürünü sil
  const handleDeleteProduct = useCallback(() => {
    DialogService.show({
      title: 'Ürünü Sil',
      message: 'Bu ürünü ve tüm fotoğraflarını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.',
      buttons: [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteProduct(product.id);
              ToastService.show('Ürün silindi');
              router.back();
            } catch (error: any) {
              ToastService.show(error.message, 'error');
            }
          }
        }
      ]
    });
  }, [product.id, deleteProduct, router]);

  // Arka plan temizleme (multiple)
  const handleRemoveBackgrounds = useCallback(async () => {
    if (selectedPhotos.size === 0) {
      ToastService.show('Lütfen fotoğraf seçin', 'error');
      return;
    }

    const photosArray = Array.from(selectedPhotos);
    const success = await removeMultipleBackgrounds(product.id, photosArray);
    
    if (success) {
      ToastService.show('Arka plan temizlendi!');
      setSelectedPhotos(new Set());
      setIsSelectionMode(false);
    }
  }, [product.id, selectedPhotos, removeMultipleBackgrounds]);

  // Tek fotoğraf arka plan temizleme
  const handleRemoveSingleBackground = useCallback(async (photoId: string) => {
    const success = await removeSingleBackground(product.id, photoId);
    if (success) {
      ToastService.show('Arka plan temizlendi!');
    }
  }, [product.id, removeSingleBackground]);

  // Fotoğraf düzenleme (Editor'a git)
  const handleEditPhoto = useCallback((photo: ProductPhoto) => {
    console.log('📝 Navigating to editor:', { productId: product.id, photoId: photo.id });
    router.push({
      pathname: '/(tabs)/editor/[photoId]',
      params: { 
        photoId: photo.id, 
        productId: product.id 
      }
    });
  }, [product.id, router]);

  // Fotoğraf seçimi veya düzenleme
  const handlePhotoPress = useCallback((photo: ProductPhoto) => {
    if (isSelectionMode) {
      setSelectedPhotos(prev => {
        const newSet = new Set(prev);
        if (newSet.has(photo.id)) {
          newSet.delete(photo.id);
        } else {
          newSet.add(photo.id);
        }
        return newSet;
      });
    } else {
      // Normal modda fotoğraf düzenleme
      handleEditPhoto(photo);
    }
  }, [isSelectionMode, handleEditPhoto]);

  // Photo component
  const PhotoItem: React.FC<{ photo: ProductPhoto; index: number }> = React.memo(({ photo, index }) => (
    <TouchableOpacity
      style={[
        styles.photoItem,
        isSelectionMode && selectedPhotos.has(photo.id) && styles.photoSelected
      ]}
      onPress={() => handlePhotoPress(photo)}
      onLongPress={() => {
        if (!isSelectionMode) {
          setIsSelectionMode(true);
          setSelectedPhotos(new Set([photo.id]));
        }
      }}
      activeOpacity={0.8}
    >
      <Image source={{ uri: photo.thumbnailUri }} style={styles.photoImage} />
      
      {/* Status indicator */}
      <View style={[
        styles.statusBadge,
        photo.status === 'processed' && styles.statusProcessed,
        photo.status === 'processing' && styles.statusProcessing
      ]}>
        <Text style={styles.statusText}>
          {photo.status === 'raw' ? 'Ham' : 
           photo.status === 'processing' ? 'İşleniyor' : 'İşlendi'}
        </Text>
      </View>

      {/* Selection indicator */}
      {isSelectionMode && (
        <View style={styles.selectionIndicator}>
          {selectedPhotos.has(photo.id) && (
            <Feather name="check-circle" size={20} color={Colors.primary} />
          )}
        </View>
      )}

      {/* Action buttons */}
      {!isSelectionMode && (
        <View style={styles.photoActions}>
          {photo.status === 'raw' && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={(e) => {
                e.stopPropagation();
                handleRemoveSingleBackground(photo.id);
              }}
            >
              <Feather name="scissors" size={12} color={Colors.card} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={(e) => {
              e.stopPropagation();
              handleDeletePhoto(photo.id);
            }}
          >
            <Feather name="trash-2" size={12} color={Colors.card} />
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  ));

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ 
        title: product.name,
        headerShown: false 
      }} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBackButton}>
            <Feather name="arrow-left" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {product.name}
            </Text>
            <Text style={styles.headerSubtitle}>
              {product.photos.length} fotoğraf
            </Text>
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

      {/* Selection Mode Header */}
      {isSelectionMode && (
        <View style={styles.selectionHeader}>
          <Text style={styles.selectionText}>
            {selectedPhotos.size} fotoğraf seçili
          </Text>
          <View style={styles.selectionActions}>
            <TouchableOpacity
              style={styles.selectionButton}
              onPress={handleRemoveBackgrounds}
              disabled={selectedPhotos.size === 0}
            >
              <Text style={styles.selectionButtonText}>Arka Plan Temizle</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.selectionButton, styles.cancelButton]}
              onPress={() => {
                setIsSelectionMode(false);
                setSelectedPhotos(new Set());
              }}
            >
              <Text style={styles.cancelButtonText}>İptal</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
      >
        {/* Photos Grid */}
        {product.photos.length > 0 ? (
          <View style={styles.photosGrid}>
            {product.photos.map((photo, index) => (
              <PhotoItem key={photo.id} photo={photo} index={index} />
            ))}
          </View>
        ) : (
          <Card style={styles.emptyCard}>
            <Feather name="camera" size={48} color={Colors.gray300} />
            <Text style={styles.emptyTitle}>Henüz Fotoğraf Yok</Text>
            <Text style={styles.emptySubtitle}>
              İlk fotoğrafını eklemek için + butonuna dokun
            </Text>
          </Card>
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={handleAddPhotos}>
        <Feather name="plus" size={24} color={Colors.card} />
      </TouchableOpacity>

      {/* Processing Overlay */}
      {isProcessing && (
        <View style={styles.processingOverlay}>
          <View style={styles.processingContent}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.processingText}>{processingMessage}</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    gap: Spacing.lg,
  },
  loadingText: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  errorTitle: {
    ...Typography.h2,
    color: Colors.error,
    marginTop: Spacing.lg,
  },
  errorSubtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  backButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.lg,
  },
  backButtonText: {
    ...Typography.bodyMedium,
    color: Colors.card,
  },

  // Header
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerBackButton: {
    padding: Spacing.sm,
  },
  headerInfo: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  headerTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  headerSubtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  headerButton: {
    padding: Spacing.sm,
  },

  // Selection Header
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
  },
  selectionActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  selectionButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  selectionButtonText: {
    ...Typography.caption,
    color: Colors.card,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: Colors.gray300,
  },
  cancelButtonText: {
    ...Typography.caption,
    color: Colors.textPrimary,
    fontWeight: '600',
  },

  // Content
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: 100,
  },

  // Photos grid - SADELEŞTIRILMIŞ
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  photoItem: {
    width: (screenWidth - Spacing.md * 3) / 2,
    aspectRatio: 1,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: Colors.gray100,
  },
  photoSelected: {
    borderWidth: 3,
    borderColor: Colors.primary,
  },
  photoImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  statusBadge: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
    backgroundColor: Colors.warning,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  statusProcessed: {
    backgroundColor: Colors.success,
  },
  statusProcessing: {
    backgroundColor: Colors.primary,
  },
  statusText: {
    ...Typography.caption,
    color: Colors.card,
    fontSize: 10,
    fontWeight: '600',
  },
  selectionIndicator: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: Colors.card,
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoActions: {
    position: 'absolute',
    bottom: Spacing.sm,
    right: Spacing.sm,
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  actionButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: Colors.error,
  },

  // Empty state
  emptyCard: {
    alignItems: 'center',
    padding: Spacing.xxxl,
    marginTop: Spacing.xxxl,
  },
  emptyTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
    marginTop: Spacing.lg,
  },
  emptySubtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },

  // FAB
  fab: {
    position: 'absolute',
    bottom: Spacing.lg + 20,
    right: Spacing.lg,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },

  // Processing overlay
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  processingContent: {
    backgroundColor: Colors.card,
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    gap: Spacing.lg,
  },
  processingText: {
    ...Typography.body,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
});
