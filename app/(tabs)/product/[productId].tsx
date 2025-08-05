// app/(tabs)/product/[productId].tsx - LAZY LOADING OPTIMIZED VERSION
import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ActivityIndicator, 
  LayoutAnimation, UIManager, Platform, Animated, Modal, RefreshControl, AppState
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';

import { useProductStore, ProductPhoto } from '@/stores/useProductStore';
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

// YENİ: Performance monitoring
let photoRenderCount = 0;
const MAX_PHOTO_RENDER_COUNT = 100;

interface AnimatingPhoto {
  id: string;
  originalUri: string;
  processedUri?: string;
}

// YENİ: Optimized ModernPhotoCard with LazyImage
const ModernPhotoCard = React.memo<{
  photo: ProductPhoto; 
  isSelected: boolean; 
  showRemoveBgIcon: boolean;
  onPress: () => void; 
  onLongPress: () => void;
  index: number;
  siblingUris: string[];
}>(({ photo, isSelected, showRemoveBgIcon, onPress, onLongPress, index, siblingUris }) => {
  const scale = useRef(new Animated.Value(1)).current;
  
  // Performance monitoring
  useEffect(() => {
    photoRenderCount++;
    if (photoRenderCount > MAX_PHOTO_RENDER_COUNT && photoRenderCount % 50 === 0) {
      console.log(`📸 Photo render count: ${photoRenderCount}, optimizing...`);
      LazyImageUtils.optimizeMemory();
    }
  }, []);

  // Optimized animation handlers
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

  // Memoized URI with cache buster
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

  return (
    <View style={photoStyles.cardContainer}>
      <Animated.View style={{ transform: [{ scale }] }}>
        <TouchableOpacity
          onPress={onPress} 
          onLongPress={onLongPress} 
          activeOpacity={0.9}
          onPressIn={handlePressIn} 
          onPressOut={handlePressOut}
        >
          <Card padding="none" style={[
            photoStyles.photoCard, 
            isSelected && photoStyles.selectedCard
          ]}>
            <View style={photoStyles.imageContainer}>
              <LazyImage
                uri={imageUri}
                style={photoStyles.photoImage}
                priority={priority}
                fadeIn={true}
                lazyLoad={true}
                progressive={true}
                siblingUris={siblingUris}
                resizeMode="cover"
                retryCount={3}
                placeholder={
                  <View style={photoStyles.placeholder}>
                    <ActivityIndicator size="small" color={Colors.primary} />
                  </View>
                }
                onError={(error) => {
                  console.warn(`Photo load error for ${photo.id}:`, error);
                }}
              />
              
              {/* Status Overlay */}
              {photo.status === 'processing' && (
                <View style={photoStyles.statusOverlay}>
                  <ActivityIndicator size="small" color={Colors.card} />
                  <Text style={photoStyles.statusText}>İşleniyor...</Text>
                </View>
              )}
              
              {/* Remove BG Button */}
              {showRemoveBgIcon && (
                <TouchableOpacity style={photoStyles.removeBgButton} onPress={onPress}>
                  <Feather name="zap" size={12} color={Colors.card} />
                </TouchableOpacity>
              )}
              
              {/* Selection Overlay */}
              {isSelected && (
                <View style={photoStyles.selectionOverlay}>
                  <View style={photoStyles.selectionCheck}>
                    <Feather name="check" size={16} color={Colors.card} />
                  </View>
                </View>
              )}
            </View>
          </Card>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
});

// YENİ: Optimized Header with memoization
const ModernHeader = React.memo<{
  productName: string; 
  photoCount: number; 
  onBack: () => void;
}>(({ productName, photoCount, onBack }) => (
  <View style={styles.header}>
    <View style={styles.leftSection}>
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <Feather name="arrow-left" size={24} color={Colors.textPrimary} />
      </TouchableOpacity>
    </View>
    <View style={styles.centerSection}>
      <Text style={styles.productName} numberOfLines={1} ellipsizeMode="tail">
        {productName}
      </Text>
      <Text style={styles.photoCount}>{photoCount} fotoğraf</Text>
    </View>
    <View style={styles.rightSection} />
  </View>
));

// YENİ: Enhanced Empty State
const EmptyPhotoState = React.memo<{ onAddPhoto: () => void }>(({ onAddPhoto }) => (
  <View style={styles.emptyContainer}>
    <Animated.View style={{ opacity: 1 }}>
      <View style={styles.emptyIcon}>
        <Feather name="camera" size={64} color={Colors.gray300} />
      </View>
      <Text style={styles.emptyTitle}>İlk Fotoğrafınızı Ekleyin</Text>
      <Text style={styles.emptySubtitle}>
        Eklemek için sağ alttaki '+' butonuna dokunun!
      </Text>
      <TouchableOpacity style={styles.emptyButton} onPress={onAddPhoto}>
        <Feather name="plus" size={20} color={Colors.primary} />
        <Text style={styles.emptyButtonText}>Fotoğraf Ekle</Text>
      </TouchableOpacity>
    </Animated.View>
  </View>
));

// YENİ: Optimized Selection Action Bar
const SelectionActionBar = React.memo<{
  selectedCount: number; 
  onDelete: () => void; 
  onCancel: () => void;
}>(({ selectedCount, onDelete, onCancel }) => (
  <View style={styles.actionBar}>
    <TouchableOpacity onPress={onCancel} style={styles.cancelAction}>
      <Text style={styles.cancelActionText}>İptal</Text>
    </TouchableOpacity>
    <Text style={styles.selectionCount}>{selectedCount} seçildi</Text>
    <TouchableOpacity onPress={onDelete} style={styles.actionButton}>
      <Feather name="trash-2" size={18} color={Colors.error} />
      <Text style={styles.actionButtonText}>Sil</Text>
    </TouchableOpacity>
  </View>
));

// YENİ: Enhanced FAB with better performance
const ModernFAB = React.memo<{ 
  onPress: () => void; 
  isVisible: boolean 
}>(({ onPress, isVisible }) => {
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

// YENİ: Main optimized component
export default function ProductDetailScreen() {
  const { productId } = useLocalSearchParams<{ productId: string }>();
  const router = useRouter();
  const { addMultiplePhotos, deleteMultiplePhotos, removeMultipleBackgrounds } = useProductStore();
  const activeProduct = useProductStore(state => state.products.find(p => p.id === productId));
  const isProcessing = useProductStore(state => state.isProcessing);
  const storeError = useProductStore(state => state.error);

  // State management
  const [isSelectionMode, setSelectionMode] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set());
  const [showAnimationModal, setShowAnimationModal] = useState(false);
  const [currentAnimatingPhoto, setCurrentAnimatingPhoto] = useState<AnimatingPhoto | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Performance refs
  const flatListRef = useRef<any>(null);
  const lastPhotoAddTime = useRef<number>(0);
  const debounceTimeout = useRef<NodeJS.Timeout>();

  // YENİ: Memoized values for performance
  const photos = useMemo(() => activeProduct?.photos || [], [activeProduct?.photos]);
  const photoCount = useMemo(() => photos.length, [photos.length]);
  const selectedCount = useMemo(() => selectedPhotos.size, [selectedPhotos.size]);

  // YENİ: Image extractor for preloading
  const imageExtractor = useCallback((item: ProductPhoto) => {
    return [item.thumbnailUri].filter(Boolean);
  }, []);

  // YENİ: Generate sibling URIs for preloading
  const generateSiblingUris = useCallback((currentIndex: number) => {
    const start = Math.max(0, currentIndex - 2);
    const end = Math.min(photos.length, currentIndex + 3);
    return photos.slice(start, end)
      .map(photo => `${photo.thumbnailUri}?v=${photo.modifiedAt}`)
      .filter(Boolean);
  }, [photos]);

  // YENİ: Enhanced add photo handler with throttling
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
        ToastService.show({ type: 'error', text1: 'İzin Gerekli' }); 
        return; 
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images, 
        quality: 1, 
        allowsMultipleSelection: true,
        selectionLimit: 10, // Limit to prevent memory issues
      });

      if (!result.canceled && result.assets) {
        LoadingService.show();
        
        // Add smooth animation
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        
        setTimeout(async () => {
          try {
            const uris = result.assets.map(asset => asset.uri);
            const success = await addMultiplePhotos(productId, uris);
            
            if (!success) {
              ToastService.show({ 
                type: 'error', 
                text1: 'Hata', 
                text2: storeError || 'Fotoğraflar eklenemedi.' 
              });
            } else {
              // Scroll to bottom to show new photos
              setTimeout(() => {
                FlatListUtils.scrollToIndex(flatListRef, photos.length - 1, true);
              }, 500);
            }
          } catch (e) {
            ToastService.show({ 
              type: 'error', 
              text1: 'Hata', 
              text2: 'Fotoğraflar eklenemedi.' 
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

  // YENİ: Enhanced selection mode toggle with animation
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

  // YENİ: Optimized photo press handler with debouncing
  const handlePhotoPress = useCallback((photo: ProductPhoto) => {
    if (isProcessing) {
      ToastService.show({ 
        type: 'info', 
        text1: 'Lütfen bekleyin', 
        text2: 'Mevcut işlem devam ediyor.' 
      });
      return;
    }

    // Clear previous debounce
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    // Debounce rapid taps
    debounceTimeout.current = setTimeout(() => {
      if (isSelectionMode) {
        const newSelection = new Set(selectedPhotos);
        newSelection.has(photo.id) ? newSelection.delete(photo.id) : newSelection.add(photo.id);
        
        if (newSelection.size === 0) {
          setSelectionMode(false);
        }
        setSelectedPhotos(newSelection);
      } else {
        if (photo.status === 'processed') {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          router.push({ 
            pathname: '/(tabs)/editor/[photoId]', 
            params: { photoId: photo.id, productId: photo.productId } 
          });
        } else if (photo.status === 'raw') {
          DialogService.show({
            title: 'Arka Planı Temizle',
            message: 'Bu fotoğrafı düzenlemeden önce arka planını temizlemek ister misiniz?',
            buttons: [
              { text: 'İptal', style: 'cancel' }, 
              { 
                text: 'Evet', 
                style: 'default', 
                onPress: () => handleSingleRemoveBackground(photo) 
              }
            ]
          });
        } else {
          ToastService.show({ 
            type: 'info', 
            text1: 'Lütfen Bekleyin', 
            text2: 'Fotoğraf şu anda işleniyor.' 
          });
        }
      }
    }, 150); // 150ms debounce
  }, [isProcessing, isSelectionMode, selectedPhotos, router]);

  // YENİ: Enhanced single background removal
  const handleSingleRemoveBackground = useCallback(async (photo: ProductPhoto) => {
    const animatingPhoto: AnimatingPhoto = { 
      id: photo.id, 
      originalUri: photo.originalUri 
    };
    
    setCurrentAnimatingPhoto(animatingPhoto);
    setShowAnimationModal(true);
    
    const success = await removeMultipleBackgrounds(photo.productId, [photo.id]);
    
    if (success) {
      const updatedProduct = useProductStore.getState().products.find(p => p.id === photo.productId);
      const updatedPhoto = updatedProduct?.photos.find(p => p.id === photo.id);
      
      if (updatedPhoto && updatedPhoto.processedUri) {
        setCurrentAnimatingPhoto(prev => 
          prev ? { ...prev, processedUri: updatedPhoto.processedUri } : null
        );
      } else {
        setShowAnimationModal(false);
        setCurrentAnimatingPhoto(null);
      }
    } else {
      setShowAnimationModal(false);
      setCurrentAnimatingPhoto(null);
      ToastService.show({ 
        type: 'error', 
        text1: 'Hata', 
        text2: storeError || 'Arka plan temizlenemedi.' 
      });
    }
  }, [removeMultipleBackgrounds, storeError]);

  // YENİ: Enhanced batch delete with confirmation
  const handleBatchDelete = useCallback(() => {
    if (selectedPhotos.size === 0) return;
    
    DialogService.show({
      title: 'Fotoğrafları Sil',
      message: `${selectedPhotos.size} fotoğraf kalıcı olarak silinecek. Emin misiniz?`,
      buttons: [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            if (productId) {
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
              
              const photoIdsToDelete = Array.from(selectedPhotos);
              await deleteMultiplePhotos(productId, photoIdsToDelete);
              toggleSelectionMode();
              
              // Memory cleanup after deletion
              LazyImageUtils.optimizeMemory();
            }
          }
        }
      ]
    });
  }, [selectedPhotos.size, productId, deleteMultiplePhotos, toggleSelectionMode]);

  // YENİ: Pull to refresh handler
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    
    try {
      // Refresh product data and optimize memory
      LazyImageUtils.optimizeMemory();
      await new Promise(resolve => setTimeout(resolve, 500)); // Small delay for UX
    } finally {
      setRefreshing(false);
    }
  }, []);

  // YENİ: Optimized render item
  const renderItem = useCallback(({ item, index }: { item: ProductPhoto, index: number }) => {
    const siblingUris = generateSiblingUris(index);
    
    return (
      <ModernPhotoCard
        photo={item} 
        isSelected={selectedPhotos.has(item.id)}
        showRemoveBgIcon={item.status === 'raw' && !isSelectionMode && !isProcessing}
        onPress={() => handlePhotoPress(item)}
        onLongPress={() => toggleSelectionMode(item.id)}
        index={index}
        siblingUris={siblingUris}
      />
    );
  }, [selectedPhotos, isSelectionMode, isProcessing, handlePhotoPress, toggleSelectionMode, generateSiblingUris]);

  // Memory cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
      LazyImageUtils.optimizeMemory();
    };
  }, []);

  // App state management
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'background') {
        LazyImageUtils.optimizeMemory();
      }
    });
    
    return () => subscription?.remove();
  }, []);

  // Loading state
  if (!activeProduct) {
    return (
      <SafeAreaView style={styles.container}>
        <ModernHeader 
          productName={productId || ''} 
          photoCount={0} 
          onBack={() => router.back()} 
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: activeProduct.name, headerShown: false }} />
      
      {/* Header */}
      <ModernHeader 
        productName={activeProduct.name} 
        photoCount={photoCount} 
        onBack={() => router.back()} 
      />
      
      {/* Main Content */}
      {photoCount === 0 ? (
        <EmptyPhotoState onAddPhoto={handleAddPhoto} />
      ) : (
        <OptimizedFlatList
          ref={flatListRef}
          data={photos}
          keyExtractor={(item) => item.id}
          numColumns={numColumns}
          key={String(numColumns)}
          renderItem={renderItem}
          contentContainerStyle={styles.photoGrid}
          extraData={`${activeProduct.modifiedAt}-${selectedCount}-${isProcessing}`}
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

      {/* Selection Action Bar */}
      {isSelectionMode && selectedCount > 0 && (
        <SelectionActionBar 
          selectedCount={selectedCount} 
          onDelete={handleBatchDelete} 
          onCancel={() => toggleSelectionMode()} 
        />
      )}

      {/* FAB */}
      <ModernFAB 
        onPress={handleAddPhoto} 
        isVisible={!isProcessing && !isSelectionMode} 
      />

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

// Optimized styles with performance considerations
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
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
  rightSection: { width: 48 },
  backButton: { padding: Spacing.sm, marginLeft: -Spacing.sm },
  productName: {
    ...Typography.h2, color: Colors.textPrimary, fontWeight: '700', 
    textAlign: 'center', maxWidth: '100%'
  },
  photoCount: {
    ...Typography.body, color: Colors.textSecondary, fontSize: 14, 
    marginTop: 2, textAlign: 'center'
  },
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
  photoGrid: { padding: Spacing.sm, paddingBottom: 100 },
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
  actionButton: { 
    flexDirection: 'row', alignItems: 'center', padding: Spacing.md, gap: Spacing.sm, 
    backgroundColor: Colors.error + '1A', borderRadius: BorderRadius.md 
  },
  actionButtonText: { ...Typography.bodyMedium, color: Colors.error, fontWeight: '600' },
  fabContainer: { position: 'absolute', right: Spacing.lg, bottom: Spacing.lg + 20 },
  fab: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.primary,
    justifyContent: 'center', alignItems: 'center', shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, 
    elevation: 12,
  },
  animationModalOverlay: { 
    flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.9)', justifyContent: 'center', 
    alignItems: 'center', padding: Spacing.lg 
  },
});

const photoStyles = StyleSheet.create({
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
  imageContainer: { 
    aspectRatio: 1, position: 'relative', backgroundColor: Colors.background 
  },
  photoImage: { width: '100%', height: '100%' },
  placeholder: {
    width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center',
    backgroundColor: Colors.gray100,
  },
  statusOverlay: { 
    ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0, 0, 0, 0.6)', 
    justifyContent: 'center', alignItems: 'center', gap: Spacing.sm 
  },
  statusText: { ...Typography.caption, color: Colors.card, fontWeight: '500' },
  removeBgButton: {
    position: 'absolute', top: Spacing.sm, right: Spacing.sm,
    width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center',
  },
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
});