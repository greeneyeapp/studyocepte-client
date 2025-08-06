// app/(tabs)/product/[productId].tsx - FULL EDITOR INTEGRATION + ALL FEATURES
import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ActivityIndicator, 
  LayoutAnimation, UIManager, Platform, Animated, Modal, RefreshControl, AppState, Alert
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack, useFocusEffect } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';

import { useProductStore, ProductPhoto } from '@/stores/useProductStore';
import { useEnhancedEditorStore } from '@/stores/useEnhancedEditorStore';
import { Colors, Spacing, Typography, BorderRadius, Layout } from '@/constants';
import { Card } from '@/components/Card';
import { ToastService } from '@/components/Toast/ToastService';
import { LoadingService } from '@/components/Loading/LoadingService';
import { BackgroundRemovalAnimation } from '@/components/BackgroundRemovalAnimation';
import { DialogService } from '@/components/Dialog/DialogService';
import { LazyImage, LazyImageUtils } from '@/components/LazyImage';
import { OptimizedFlatList, FlatListUtils } from '@/components/OptimizedFlatList';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const numColumns = Layout.isTablet ? 4 : 3;

// Performance monitoring
let photoRenderCount = 0;
const MAX_PHOTO_RENDER_COUNT = 100;

interface AnimatingPhoto {
  id: string;
  originalUri: string;
  processedUri?: string;
}

// ===== ENHANCED PHOTO CARD WITH EDITOR INTEGRATION =====
const EnhancedPhotoCard = React.memo<{
  photo: ProductPhoto; 
  isSelected: boolean; 
  showRemoveBgIcon: boolean;
  onPress: () => void; 
  onLongPress: () => void;
  onEditPress: () => void; // YENİ: Editor'a git
  onRemoveBgPress: () => void; // YENİ: Background removal
  index: number;
  siblingUris: string[];
  hasDraft?: boolean; // YENİ: Draft indicator
  isProcessing?: boolean; // Enhanced processing state
}>(({ 
  photo, isSelected, showRemoveBgIcon, onPress, onLongPress, onEditPress, 
  onRemoveBgPress, index, siblingUris, hasDraft = false, isProcessing = false 
}) => {
  const scale = useRef(new Animated.Value(1)).current;
  
  // Performance monitoring
  useEffect(() => {
    photoRenderCount++;
    if (photoRenderCount > MAX_PHOTO_RENDER_COUNT && photoRenderCount % 50 === 0) {
      LazyImageUtils.optimizeMemory();
    }
  }, []);

  // Animation handlers
  const handlePressIn = useCallback(() => {
    Animated.spring(scale, { 
      toValue: 0.96, 
      useNativeDriver: true,
      tension: 300,
      friction: 10
    }).start();
  }, [scale]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scale, { 
      toValue: 1, 
      useNativeDriver: true,
      tension: 300,
      friction: 10
    }).start();
  }, [scale]);

  // Optimized URI with cache buster
  const imageUri = useMemo(() => 
    `${photo.thumbnailUri}?v=${photo.modifiedAt}`,
    [photo.thumbnailUri, photo.modifiedAt]
  );

  // Priority based on position
  const priority = useMemo(() => {
    if (index < 6) return 'high';
    if (index < 20) return 'normal';
    return 'low';
  }, [index]);

  // YENİ: Action button handler
  const handleActionPress = useCallback((action: 'edit' | 'remove_bg') => {
    if (action === 'edit') {
      onEditPress();
    } else {
      onRemoveBgPress();
    }
  }, [onEditPress, onRemoveBgPress]);

  return (
    <View style={styles.cardContainer}>
      <Animated.View style={{ transform: [{ scale }] }}>
        <TouchableOpacity
          onPress={onPress} 
          onLongPress={onLongPress} 
          activeOpacity={0.9}
          onPressIn={handlePressIn} 
          onPressOut={handlePressOut}
        >
          <Card padding="none" style={[
            styles.photoCard, 
            isSelected && styles.selectedCard,
            hasDraft && styles.draftCard
          ]}>
            <View style={styles.imageContainer}>
              <LazyImage
                uri={imageUri}
                style={styles.photoImage}
                priority={priority}
                fadeIn={true}
                lazyLoad={true}
                progressive={true}
                siblingUris={siblingUris}
                resizeMode="cover"
                retryCount={3}
                placeholder={
                  <View style={styles.placeholder}>
                    <ActivityIndicator size="small" color={Colors.primary} />
                  </View>
                }
                onError={(error) => {
                  console.warn(`Photo load error for ${photo.id}:`, error);
                }}
              />
              
              {/* YENİ: Enhanced Status Overlay */}
              {(photo.status === 'processing' || isProcessing) && (
                <View style={styles.statusOverlay}>
                  <ActivityIndicator size="small" color={Colors.card} />
                  <Text style={styles.statusText}>İşleniyor...</Text>
                </View>
              )}
              
              {/* YENİ: Action Buttons - Context Aware */}
              {!isSelected && !isProcessing && (
                <View style={styles.actionButtonsContainer}>
                  {/* Edit Button - Always visible for processed photos */}
                  {photo.status === 'processed' && (
                    <TouchableOpacity 
                      style={[styles.actionButton, styles.editButton]} 
                      onPress={() => handleActionPress('edit')}
                    >
                      <Feather name="edit-3" size={12} color={Colors.card} />
                    </TouchableOpacity>
                  )}
                  
                  {/* Remove BG Button - For raw photos */}
                  {photo.status === 'raw' && (
                    <TouchableOpacity 
                      style={[styles.actionButton, styles.removeBgButton]} 
                      onPress={() => handleActionPress('remove_bg')}
                    >
                      <Feather name="zap" size={12} color={Colors.card} />
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {/* YENİ: Draft Indicator */}
              {hasDraft && (
                <View style={styles.draftIndicator}>
                  <View style={styles.draftDot} />
                  <Text style={styles.draftText}>Taslak</Text>
                </View>
              )}
              
              {/* Selection Overlay */}
              {isSelected && (
                <View style={styles.selectionOverlay}>
                  <View style={styles.selectionCheck}>
                    <Feather name="check" size={16} color={Colors.card} />
                  </View>
                </View>
              )}

              {/* YENİ: Status Badge */}
              <View style={[
                styles.statusBadge,
                photo.status === 'processed' && styles.processedBadge,
                photo.status === 'processing' && styles.processingBadge,
              ]}>
                <Text style={styles.statusBadgeText}>
                  {photo.status === 'raw' ? 'RAW' : 
                   photo.status === 'processing' ? '...' : '✓'}
                </Text>
              </View>
            </View>
          </Card>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
});

// ===== ENHANCED BATCH ACTION BAR =====
const EnhancedActionBar = React.memo<{
  selectedCount: number; 
  onDelete: () => void; 
  onBatchRemoveBg: () => void; // YENİ: Batch background removal
  onCancel: () => void;
  isProcessing: boolean;
}>(({ selectedCount, onDelete, onBatchRemoveBg, onCancel, isProcessing }) => (
  <View style={styles.actionBar}>
    <TouchableOpacity onPress={onCancel} style={styles.cancelAction}>
      <Text style={styles.cancelActionText}>İptal</Text>
    </TouchableOpacity>
    
    <Text style={styles.selectionCount}>{selectedCount} seçildi</Text>
    
    <View style={styles.batchActions}>
      <TouchableOpacity 
        onPress={onBatchRemoveBg} 
        style={[styles.batchActionButton, styles.removeBgAction]}
        disabled={isProcessing}
      >
        <Feather name="zap" size={16} color={Colors.warning} />
        <Text style={styles.batchActionText}>Arka Plan</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        onPress={onDelete} 
        style={[styles.batchActionButton, styles.deleteAction]}
        disabled={isProcessing}
      >
        <Feather name="trash-2" size={16} color={Colors.error} />
        <Text style={styles.batchActionText}>Sil</Text>
      </TouchableOpacity>
    </View>
  </View>
));

// ===== MAIN COMPONENT =====
export default function EnhancedProductDetailScreen() {
  const { productId } = useLocalSearchParams<{ productId: string }>();
  const router = useRouter();
  
  // Stores
  const { 
    addMultiplePhotos, 
    deleteMultiplePhotos, 
    removeMultipleBackgrounds,
    removeSingleBackground,
    isProcessing: storeIsProcessing
  } = useProductStore();
  const activeProduct = useProductStore(state => state.products.find(p => p.id === productId));
  const storeError = useProductStore(state => state.error);
  
  // YENİ: Editor store integration for draft detection
  const { getAllDrafts, hasDraftForPhoto } = useEnhancedEditorStore();

  // State management
  const [isSelectionMode, setSelectionMode] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set());
  const [showAnimationModal, setShowAnimationModal] = useState(false);
  const [currentAnimatingPhoto, setCurrentAnimatingPhoto] = useState<AnimatingPhoto | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isLocalProcessing, setIsLocalProcessing] = useState(false);

  // Performance refs
  const flatListRef = useRef<any>(null);
  const lastPhotoAddTime = useRef<number>(0);
  const debounceTimeout = useRef<NodeJS.Timeout>();

  // YENİ: Draft detection memoization
  const photosWithDrafts = useMemo(() => {
    const drafts = getAllDrafts();
    return new Set(drafts.map(d => d.photoId));
  }, [getAllDrafts]);

  // Computed values
  const photos = useMemo(() => activeProduct?.photos || [], [activeProduct?.photos]);
  const photoCount = useMemo(() => photos.length, [photos.length]);
  const selectedCount = useMemo(() => selectedPhotos.size, [selectedPhotos.size]);
  const isProcessing = storeIsProcessing || isLocalProcessing;

  // YENİ: Focus effect to refresh drafts when returning from editor
  useFocusEffect(
    useCallback(() => {
      // Refresh drafts when screen comes into focus (returning from editor)
      console.log('🔄 Product screen focused, refreshing draft states...');
    }, [])
  );

  // Image extractor for preloading
  const imageExtractor = useCallback((item: ProductPhoto) => {
    return [item.thumbnailUri].filter(Boolean);
  }, []);

  // Generate sibling URIs for preloading
  const generateSiblingUris = useCallback((currentIndex: number) => {
    const start = Math.max(0, currentIndex - 2);
    const end = Math.min(photos.length, currentIndex + 3);
    return photos.slice(start, end)
      .map(photo => `${photo.thumbnailUri}?v=${photo.modifiedAt}`)
      .filter(Boolean);
  }, [photos]);

  // ===== ENHANCED PHOTO ACTIONS =====

  // YENİ: Enhanced photo press with editor navigation
  const handlePhotoPress = useCallback((photo: ProductPhoto) => {
    if (isProcessing) {
      ToastService.show({ 
        type: 'info', 
        text1: 'Lütfen bekleyin', 
        text2: 'İşlem devam ediyor.' 
      });
      return;
    }

    // Clear debounce
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    debounceTimeout.current = setTimeout(() => {
      if (isSelectionMode) {
        togglePhotoSelection(photo.id);
      } else {
        // YENİ: Smart navigation based on status
        if (photo.status === 'processed') {
          navigateToEditor(photo);
        } else if (photo.status === 'raw') {
          // Show remove background option
          DialogService.show({
            title: 'Fotoğraf Hazırlanıyor',
            message: 'Bu fotoğrafı düzenlemek için önce arka planını temizlemek gerekiyor. Devam etmek ister misiniz?',
            buttons: [
              { text: 'İptal', style: 'cancel' },
              { 
                text: 'Arka Planı Temizle', 
                style: 'default', 
                onPress: () => handleSingleRemoveBackground(photo) 
              }
            ]
          });
        } else {
          ToastService.show({ 
            type: 'info', 
            text1: 'Lütfen Bekleyin', 
            text2: 'Fotoğraf işleniyor...' 
          });
        }
      }
    }, 150);
  }, [isProcessing, isSelectionMode]);

  // YENİ: Navigate to editor with enhanced feedback
  const navigateToEditor = useCallback((photo: ProductPhoto) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    
    // Show loading briefly to indicate navigation
    LoadingService.show();
    
    setTimeout(() => {
      LoadingService.hide();
      router.push({ 
        pathname: '/(tabs)/editor/[photoId]', 
        params: { 
          photoId: photo.id, 
          productId: photo.productId,
          // YENİ: Pass context for better UX
          returnTo: 'product'
        } 
      });
    }, 300);
  }, [router]);

  // YENİ: Direct edit handler
  const handleEditPhoto = useCallback((photo: ProductPhoto) => {
    if (photo.status !== 'processed') {
      ToastService.show({
        type: 'warning',
        text1: 'Düzenleme Yapılamaz',
        text2: 'Sadece işlenmiş fotoğraflar düzenlenebilir.'
      });
      return;
    }
    navigateToEditor(photo);
  }, [navigateToEditor]);

  // Enhanced single background removal
  const handleSingleRemoveBackground = useCallback(async (photo: ProductPhoto) => {
    if (photo.status !== 'raw') return;

    const animatingPhoto: AnimatingPhoto = { 
      id: photo.id, 
      originalUri: photo.originalUri 
    };
    
    setCurrentAnimatingPhoto(animatingPhoto);
    setShowAnimationModal(true);
    setIsLocalProcessing(true);
    
    try {
      const success = await removeSingleBackground(photo.productId, photo.id);
      
      if (success) {
        const updatedProduct = useProductStore.getState().products.find(p => p.id === photo.productId);
        const updatedPhoto = updatedProduct?.photos.find(p => p.id === photo.id);
        
        if (updatedPhoto?.processedUri) {
          setCurrentAnimatingPhoto(prev => 
            prev ? { ...prev, processedUri: updatedPhoto.processedUri } : null
          );
          
          ToastService.show({
            type: 'success',
            text1: 'İşlem Tamamlandı',
            text2: 'Arka plan başarıyla temizlendi. Şimdi düzenleme yapabilirsiniz.'
          });
          
          // Auto-navigate to editor after successful processing
          setTimeout(() => {
            setShowAnimationModal(false);
            setCurrentAnimatingPhoto(null);
            if (updatedPhoto) {
              navigateToEditor(updatedPhoto);
            }
          }, 1500);
        } else {
          throw new Error('İşlenmiş fotoğraf bulunamadı');
        }
      } else {
        throw new Error(storeError || 'İşlem başarısız');
      }
    } catch (error: any) {
      setShowAnimationModal(false);
      setCurrentAnimatingPhoto(null);
      ToastService.show({ 
        type: 'error', 
        text1: 'İşlem Başarısız', 
        text2: error.message || 'Arka plan temizlenemedi.' 
      });
    } finally {
      setIsLocalProcessing(false);
    }
  }, [removeSingleBackground, storeError, navigateToEditor]);

  // ===== BATCH OPERATIONS =====

  // YENİ: Enhanced batch background removal
  const handleBatchRemoveBackground = useCallback(() => {
    if (selectedPhotos.size === 0) return;
    
    const selectedPhotoObjects = photos.filter(p => selectedPhotos.has(p.id));
    const rawPhotos = selectedPhotoObjects.filter(p => p.status === 'raw');
    
    if (rawPhotos.length === 0) {
      ToastService.show({
        type: 'info',
        text1: 'Işlem Gerekmiyor',
        text2: 'Seçili fotoğraflar zaten işlenmiş.'
      });
      return;
    }

    DialogService.show({
      title: 'Toplu Arka Plan Temizleme',
      message: `${rawPhotos.length} fotoğrafın arka planı temizlenecek. Bu işlem biraz zaman alabilir. Devam etmek ister misiniz?`,
      buttons: [
        { text: 'İptal', style: 'cancel' },
        {
          text: `${rawPhotos.length} Fotoğrafı İşle`,
          style: 'default',
          onPress: async () => {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            
            const rawPhotoIds = rawPhotos.map(p => p.id);
            const success = await removeMultipleBackgrounds(productId!, rawPhotoIds);
            
            if (success) {
              ToastService.show({
                type: 'success',
                text1: 'Toplu İşlem Tamamlandı',
                text2: `${rawPhotos.length} fotoğrafın arka planı temizlendi.`
              });
              toggleSelectionMode();
            }
          }
        }
      ]
    });
  }, [selectedPhotos, photos, removeMultipleBackgrounds, productId]);

  // Enhanced batch delete with confirmation
  const handleBatchDelete = useCallback(() => {
    if (selectedPhotos.size === 0) return;
    
    DialogService.show({
      title: 'Fotoğrafları Sil',
      message: `${selectedPhotos.size} fotoğraf kalıcı olarak silinecek. Bu işlem geri alınamaz. Emin misiniz?`,
      buttons: [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Kalıcı Olarak Sil',
          style: 'destructive',
          onPress: async () => {
            if (productId) {
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
              
              const photoIdsToDelete = Array.from(selectedPhotos);
              await deleteMultiplePhotos(productId, photoIdsToDelete);
              toggleSelectionMode();
              
              LazyImageUtils.optimizeMemory();
              
              ToastService.show({
                type: 'success',
                text1: 'Silme İşlemi Tamamlandı',
                text2: `${photoIdsToDelete.length} fotoğraf silindi.`
              });
            }
          }
        }
      ]
    });
  }, [selectedPhotos.size, productId, deleteMultiplePhotos]);

  // Selection management
  const togglePhotoSelection = useCallback((photoId: string) => {
    const newSelection = new Set(selectedPhotos);
    newSelection.has(photoId) ? newSelection.delete(photoId) : newSelection.add(photoId);
    setSelectedPhotos(newSelection);
    
    if (newSelection.size === 0) {
      setSelectionMode(false);
    }
  }, [selectedPhotos]);

  const toggleSelectionMode = useCallback((photoId?: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    
    setSelectionMode(prev => {
      const newMode = !prev;
      if (newMode && photoId) {
        setSelectedPhotos(new Set([photoId]));
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } else {
        setSelectedPhotos(new Set());
      }
      return newMode;
    });
  }, []);

  // ===== ENHANCED ADD PHOTO =====
  
  const handleAddPhoto = useCallback(async () => {
    if (isProcessing) return;
    if (!productId) return;

    // Throttle rapid additions
    const now = Date.now();
    if (now - lastPhotoAddTime.current < 2000) {
      ToastService.show({
        type: 'info',
        text1: 'Lütfen Bekleyin',
        text2: 'Fotoğraf ekleme işlemi devam ediyor.'
      });
      return;
    }
    lastPhotoAddTime.current = now;

    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') { 
        ToastService.show({ 
          type: 'error', 
          text1: 'İzin Gerekli',
          text2: 'Galeriye erişim izni gerekli.' 
        }); 
        return; 
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images, 
        quality: 1, 
        allowsMultipleSelection: true,
        selectionLimit: 10,
      });

      if (!result.canceled && result.assets) {
        LoadingService.show();
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        
        setTimeout(async () => {
          try {
            const uris = result.assets.map(asset => asset.uri);
            const success = await addMultiplePhotos(productId, uris);
            
            if (success) {
              // Auto-scroll to show new photos
              setTimeout(() => {
                FlatListUtils.scrollToIndex(flatListRef, photos.length - 1, true);
              }, 500);
              
              ToastService.show({
                type: 'success',
                text1: 'Fotoğraflar Eklendi',
                text2: `${uris.length} fotoğraf başarıyla eklendi.`
              });
            } else {
              throw new Error(storeError || 'Fotoğraflar eklenemedi.');
            }
          } catch (e: any) {
            ToastService.show({ 
              type: 'error', 
              text1: 'Hata', 
              text2: e.message 
            });
          } finally {
            LoadingService.hide();
          }
        }, 50);
      }
    } catch (error) { 
      ToastService.show({ 
        type: 'error', 
        text1: 'Hata', 
        text2: 'Fotoğraf seçilemedi.' 
      }); 
      LoadingService.hide();
    }
  }, [isProcessing, productId, addMultiplePhotos, storeError, photos.length]);

  // Pull to refresh handler
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    
    try {
      LazyImageUtils.optimizeMemory();
      await new Promise(resolve => setTimeout(resolve, 500));
    } finally {
      setRefreshing(false);
    }
  }, []);

  // Optimized render item
  const renderItem = useCallback(({ item, index }: { item: ProductPhoto, index: number }) => {
    const siblingUris = generateSiblingUris(index);
    const hasDraft = photosWithDrafts.has(item.id);
    
    return (
      <EnhancedPhotoCard
        photo={item} 
        isSelected={selectedPhotos.has(item.id)}
        showRemoveBgIcon={item.status === 'raw' && !isSelectionMode && !isProcessing}
        onPress={() => handlePhotoPress(item)}
        onLongPress={() => toggleSelectionMode(item.id)}
        onEditPress={() => handleEditPhoto(item)}
        onRemoveBgPress={() => handleSingleRemoveBackground(item)}
        index={index}
        siblingUris={siblingUris}
        hasDraft={hasDraft}
        isProcessing={isProcessing}
      />
    );
  }, [
    selectedPhotos, isSelectionMode, isProcessing, handlePhotoPress, 
    toggleSelectionMode, handleEditPhoto, handleSingleRemoveBackground, 
    generateSiblingUris, photosWithDrafts
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
      LazyImageUtils.optimizeMemory();
    };
  }, []);

  // Loading state
  if (!activeProduct) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: activeProduct.name, headerShown: false }} />
      
      {/* Enhanced Header with Draft Count */}
      <View style={styles.header}>
        <View style={styles.leftSection}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Feather name="arrow-left" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.centerSection}>
          <Text style={styles.productName} numberOfLines={1} ellipsizeMode="tail">
            {activeProduct.name}
          </Text>
          <Text style={styles.photoCount}>
            {photoCount} fotoğraf
            {photosWithDrafts.size > 0 && (
              <Text style={styles.draftCount}> • {photosWithDrafts.size} taslak</Text>
            )}
          </Text>
        </View>
        
        <View style={styles.rightSection}>
          {/* Processing indicator */}
          {isProcessing && (
            <ActivityIndicator size="small" color={Colors.primary} />
          )}
        </View>
      </View>
      
      {/* Main Content */}
      {photoCount === 0 ? (
        <View style={styles.emptyContainer}>
          <Animated.View style={{ opacity: 1 }}>
            <View style={styles.emptyIcon}>
              <Feather name="camera" size={64} color={Colors.gray300} />
            </View>
            <Text style={styles.emptyTitle}>İlk Fotoğrafınızı Ekleyin</Text>
            <Text style={styles.emptySubtitle}>
              Fotoğraf ekledikten sonra arka planını temizleyip düzenleyebilirsiniz!
            </Text>
            <TouchableOpacity style={styles.emptyButton} onPress={handleAddPhoto}>
              <Feather name="plus" size={20} color={Colors.primary} />
              <Text style={styles.emptyButtonText}>Fotoğraf Ekle</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      ) : (
        <OptimizedFlatList
          ref={flatListRef}
          data={photos}
          keyExtractor={(item) => item.id}
          numColumns={numColumns}
          key={String(numColumns)}
          renderItem={renderItem}
          contentContainerStyle={styles.photoGrid}
          extraData={`${activeProduct.modifiedAt}-${selectedCount}-${isProcessing}-${photosWithDrafts.size}`}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[Colors.primary]}
              tintColor={Colors.primary}
            />
          }
          // Performance optimizations
          enableVirtualization={true}
          enableProgressiveLoading={true}
          enableMemoryOptimization={true}
          imageExtractor={imageExtractor}
          maxToRenderPerBatch={15}
          windowSize={15}
          initialNumToRender={20}
          removeClippedSubviews={true}
          preloadDistance={3}
          // Loading states
          isLoading={false}
          isEmpty={photoCount === 0}
        />
      )}

      {/* Enhanced Batch Action Bar */}
      {isSelectionMode && selectedCount > 0 && (
        <EnhancedActionBar 
          selectedCount={selectedCount} 
          onDelete={handleBatchDelete}
          onBatchRemoveBg={handleBatchRemoveBackground}
          onCancel={() => toggleSelectionMode()}
          isProcessing={isProcessing}
        />
      )}

      {/* Enhanced FAB with processing state */}
      <TouchableOpacity 
        style={[
          styles.fab, 
          isProcessing && styles.fabDisabled,
          isSelectionMode && styles.fabHidden
        ]}
        onPress={handleAddPhoto}
        disabled={isProcessing}
        activeOpacity={0.8}
      >
        {isProcessing ? (
          <ActivityIndicator size="small" color={Colors.card} />
        ) : (
          <Feather name="plus" size={24} color={Colors.card} />
        )}
      </TouchableOpacity>

      {/* Background Removal Animation Modal */}
      <Modal visible={showAnimationModal} transparent animationType="fade">
        <View style={styles.animationModalOverlay}>
          {currentAnimatingPhoto && (
            <BackgroundRemovalAnimation
              key={`anim-${currentAnimatingPhoto.id}`}
              originalUri={currentAnimatingPhoto.originalUri}
              processedUri={currentAnimatingPhoto.processedUri}
              isAnimating={true}
              onAnimationComplete={() => {
                setTimeout(() => { 
                  setShowAnimationModal(false); 
                  setCurrentAnimatingPhoto(null); 
                }, 500);
              }}
            />
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ===== ENHANCED STYLES =====
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  
  // Enhanced Header
  header: {
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    minHeight: 64,
  },
  leftSection: { width: 48, alignItems: 'flex-start' },
  centerSection: { flex: 1, alignItems: 'center', paddingHorizontal: Spacing.sm },
  rightSection: { width: 48, alignItems: 'flex-end' },
  backButton: { padding: Spacing.sm, marginLeft: -Spacing.sm },
  productName: {
    ...Typography.h2, color: Colors.textPrimary, fontWeight: '700', 
    textAlign: 'center', maxWidth: '100%'
  },
  photoCount: {
    ...Typography.body, color: Colors.textSecondary, fontSize: 14, 
    marginTop: 2, textAlign: 'center'
  },
  draftCount: { color: Colors.warning, fontWeight: '600' },
  
  // Loading & Empty States
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { 
    flex: 1, justifyContent: 'center', alignItems: 'center', 
    paddingHorizontal: Spacing.xl 
  },
  emptyIcon: { marginBottom: Spacing.xl },
  emptyTitle: { 
    ...Typography.h2, color: Colors.textPrimary, marginBottom: Spacing.sm, textAlign: 'center' 
  },
  emptySubtitle: { 
    ...Typography.body, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22,
    marginBottom: Spacing.xl
  },
  emptyButton: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primary + '15',
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full, gap: Spacing.sm,
  },
  emptyButtonText: { ...Typography.bodyMedium, color: Colors.primary, fontWeight: '600' },
  
  // Photo Grid
  photoGrid: { padding: Spacing.sm, paddingBottom: 100 },
  
  // Enhanced Photo Card
  cardContainer: { width: `${100 / numColumns}%`, padding: Spacing.sm },
  photoCard: {
    backgroundColor: Colors.card, borderRadius: BorderRadius.xl,
    shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 12, elevation: 4, overflow: 'hidden',
  },
  selectedCard: { 
    borderWidth: 3, borderColor: Colors.primary, shadowColor: Colors.primary, 
    shadowOpacity: 0.2 
  },
  draftCard: {
    borderWidth: 2, borderColor: Colors.warning + '50',
  },
  imageContainer: { 
    aspectRatio: 1, position: 'relative', backgroundColor: Colors.background 
  },
  photoImage: { width: '100%', height: '100%' },
  placeholder: {
    width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center',
    backgroundColor: Colors.gray100,
  },
  
  // Enhanced Status & Action Elements
  statusOverlay: { 
    ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0, 0, 0, 0.6)', 
    justifyContent: 'center', alignItems: 'center', gap: Spacing.sm 
  },
  statusText: { ...Typography.caption, color: Colors.card, fontWeight: '500' },
  
  actionButtonsContainer: {
    position: 'absolute', top: Spacing.sm, right: Spacing.sm,
    flexDirection: 'column', gap: Spacing.xs,
  },
  actionButton: {
    width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center',
    shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3, shadowRadius: 4, elevation: 4,
  },
  editButton: { backgroundColor: Colors.primary },
  removeBgButton: { backgroundColor: Colors.warning },
  
  draftIndicator: {
    position: 'absolute', top: Spacing.sm, left: Spacing.sm,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.warning + '90', paddingHorizontal: Spacing.sm,
    paddingVertical: 4, borderRadius: BorderRadius.sm,
  },
  draftDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.card },
  draftText: { ...Typography.caption, color: Colors.card, fontSize: 10, fontWeight: '600' },
  
  selectionOverlay: { 
    ...StyleSheet.absoluteFillObject, backgroundColor: Colors.primary + '60', 
    justifyContent: 'center', alignItems: 'center' 
  },
  selectionCheck: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.primary,
    justifyContent: 'center', alignItems: 'center', shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.4, shadowRadius: 4, 
    elevation: 4, borderWidth: 2, borderColor: Colors.card,
  },
  
  statusBadge: {
    position: 'absolute', bottom: Spacing.sm, left: Spacing.sm,
    paddingHorizontal: Spacing.sm, paddingVertical: 2,
    borderRadius: BorderRadius.sm, backgroundColor: Colors.gray500,
  },
  processedBadge: { backgroundColor: Colors.success },
  processingBadge: { backgroundColor: Colors.warning },
  statusBadgeText: {
    ...Typography.caption, color: Colors.card, fontSize: 10, fontWeight: '700'
  },
  
  // Enhanced Action Bar
  actionBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, 
    paddingBottom: Spacing.xl + 10,
    backgroundColor: Colors.card, borderTopWidth: 1, borderTopColor: Colors.border,
    shadowColor: Colors.shadow, shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1, shadowRadius: 8, elevation: 10,
  },
  cancelAction: { paddingVertical: Spacing.sm },
  cancelActionText: { ...Typography.bodyMedium, color: Colors.primary, fontWeight: '600' },
  selectionCount: { 
    flex: 1, ...Typography.bodyMedium, color: Colors.textPrimary, 
    textAlign: 'center', fontWeight: '600' 
  },
  batchActions: { flexDirection: 'row', gap: Spacing.sm },
  batchActionButton: { 
    flexDirection: 'row', alignItems: 'center', padding: Spacing.sm, 
    gap: Spacing.xs, borderRadius: BorderRadius.md, minWidth: 70,
    justifyContent: 'center',
  },
  removeBgAction: { backgroundColor: Colors.warning + '1A' },
  deleteAction: { backgroundColor: Colors.error + '1A' },
  batchActionText: { 
    ...Typography.caption, fontWeight: '600', fontSize: 11 
  },
  
  // Enhanced FAB
  fab: {
    position: 'absolute', right: Spacing.lg, bottom: Spacing.lg + 20,
    width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.primary,
    justifyContent: 'center', alignItems: 'center', shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, 
    elevation: 12,
  },
  fabDisabled: { backgroundColor: Colors.gray400, opacity: 0.7 },
  fabHidden: { opacity: 0, transform: [{ scale: 0.8 }] },
  
  // Animation Modal
  animationModalOverlay: { 
    flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.9)', justifyContent: 'center', 
    alignItems: 'center', padding: Spacing.lg 
  },
});