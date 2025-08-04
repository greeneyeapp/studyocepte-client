// app/(tabs)/product/[productId].tsx - ANIMASYONLU VERSİYON
import React, { useState, useMemo, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, FlatList,
  TouchableOpacity, Image, ActivityIndicator, LayoutAnimation,
  UIManager, Platform, Animated, Modal,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';

import { useProductStore, ProductPhoto } from '@/stores/useProductStore';
import { Colors, Spacing, Typography, BorderRadius, Layout } from '@/constants';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { ToastService } from '@/components/Toast/ToastService';
import { DialogService } from '@/components/Dialog/DialogService';
import { ErrorMessage } from '@/components/ErrorMessage';
import { LoadingService } from '@/components/Loading/LoadingService';
import { BackgroundRemovalAnimation } from '@/components/BackgroundRemovalAnimation';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const numColumns = Layout.isTablet ? 4 : 3;

// GÜNCELLEME: Animasyon durumlarını track etmek için interface
interface AnimatingPhoto {
  id: string;
  originalUri: string;
  processedUri?: string;
}

const AnimatedCard = ({ photo, isSelected, showRemoveBgIcon, onPress, onLongPress }: {
  photo: ProductPhoto;
  isSelected: boolean;
  showRemoveBgIcon: boolean;
  onPress: () => void;
  onLongPress: () => void;
}) => {
  const scale = new Animated.Value(1);
  const handlePressIn = () => Animated.spring(scale, { toValue: 0.95, useNativeDriver: true }).start();
  const handlePressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        onPress={onPress}
        onLongPress={onLongPress}
        activeOpacity={0.9}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <Card padding="none" style={isSelected ? styles.selectedCard : undefined}>
          <Image
            key={photo.modifiedAt}
            source={{ uri: `${photo.thumbnailUri}?v=${photo.modifiedAt}` }}
            style={styles.photoImage}
            resizeMode="contain" // COVER'DAN CONTAIN'E DEĞİŞTİRİLDİ
          />
          {photo.status === 'processing' && <View style={styles.statusOverlay}><ActivityIndicator color={Colors.card} /></View>}
          {showRemoveBgIcon && <View style={styles.removeBgButton}><Feather name="zap" size={14} color={Colors.card} /></View>}
          {isSelected && <View style={[styles.selectionOverlay, styles.selectionOverlayActive]}><Feather name="check-circle" size={24} color={Colors.card} /></View>}
        </Card>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function ProductDetailScreen() {
  const { t } = useTranslation();
  const { productId } = useLocalSearchParams<{ productId: string }>();
  const router = useRouter();

  const { addMultiplePhotos, deletePhoto, removeMultipleBackgrounds } = useProductStore();
  const activeProduct = useProductStore(state => state.products.find(p => p.id === productId));
  const isProcessing = useProductStore(state => state.isProcessing);
  const processingMessage = useProductStore(state => state.processingMessage);
  const storeError = useProductStore(state => state.error);

  const [isSelectionMode, setSelectionMode] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set());

  // YENİ: Animasyon durumları (basitleştirildi)
  const [showAnimationModal, setShowAnimationModal] = useState(false);
  const [currentAnimatingPhoto, setCurrentAnimatingPhoto] = useState<AnimatingPhoto | null>(null);

  useEffect(() => {
    if (isProcessing) {
      LoadingService.show(processingMessage);
    } else {
      LoadingService.hide();
    }
  }, [isProcessing, processingMessage]);

  const handleAddPhoto = async () => {
    console.log('🔘 Add photo button pressed');

    if (!productId) {
      console.error('❌ Product ID missing');
      return;
    }

    try {
      console.log('📱 Requesting media library permissions...');
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      console.log('✅ Permission status:', status);

      if (status !== 'granted') {
        ToastService.show({
          type: 'error',
          text1: 'İzin Gerekli',
          text2: 'Galeri erişimi için izin verin'
        });
        return;
      }

      console.log('🖼️ Launching image picker...');
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images, // ESKİ FORMAT GERİ ALINDI
        quality: 1,
        allowsMultipleSelection: true,
      });

      console.log('📋 Image picker result:', {
        canceled: result.canceled,
        assetsCount: result.assets?.length || 0
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uris = result.assets.map(asset => asset.uri);
        console.log('📸 Selected image URIs:', uris);

        console.log('💾 Adding photos to product...');
        const success = await addMultiplePhotos(productId, uris);

        if (success) {
          ToastService.show({
            type: 'success',
            text1: `${uris.length} Fotoğraf Eklendi!`
          });
          console.log('✅ Photos added successfully');
        } else {
          ToastService.show({
            type: 'error',
            text1: 'Hata',
            text2: storeError || 'Fotoğraflar eklenemedi.'
          });
          console.error('❌ Failed to add photos:', storeError);
        }
      } else {
        console.log('ℹ️ User canceled or no assets selected');
      }
    } catch (error) {
      console.error('❌ Add photo error:', error);
      ToastService.show({
        type: 'error',
        text1: 'Hata',
        text2: 'Fotoğraf eklenirken bir hata oluştu'
      });
    }
  };

  const toggleSelectionMode = (photoId?: string) => {
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
  };

  const handlePhotoPress = (photo: ProductPhoto) => {
    if (isSelectionMode) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      const newSelection = new Set(selectedPhotos);
      newSelection.has(photo.id) ? newSelection.delete(photo.id) : newSelection.add(photo.id);
      setSelectedPhotos(newSelection);
    } else {
      if (photo.status === 'processed') {
        router.push({
          pathname: '/(tabs)/editor/[photoId]',
          params: { photoId: photo.id, productId: photo.productId },
        });
      } else if (photo.status === 'raw') {
        DialogService.show({
          title: 'Arka Planı Temizle',
          message: 'Bu fotoğrafı düzenlemeden önce arka planını temizlemek ister misiniz?',
          buttons: [
            { text: 'İptal', style: 'cancel' },
            { text: 'Evet, Temizle', onPress: () => handleSingleRemoveBackground(photo) }
          ]
        });
      } else {
        ToastService.show({ type: 'info', text1: 'Lütfen Bekleyin', text2: 'Fotoğraf şu anda işleniyor.' });
      }
    }
  };

  const handleSingleRemoveBackground = async (photo: ProductPhoto) => {
    console.log('🚀 Starting background removal for photo:', photo.id);

    // YENİ: Tek fotoğraf için animasyon başlat - sadece original URI ile
    const animatingPhoto: AnimatingPhoto = {
      id: photo.id,
      originalUri: photo.originalUri,
      // processedUri: undefined - Başlangıçta yok
    };

    setCurrentAnimatingPhoto(animatingPhoto);
    setShowAnimationModal(true);

    // Arka plan temizleme işlemini başlat
    const success = await removeMultipleBackgrounds(photo.productId, [photo.id]);

    if (success) {
      console.log('✅ Background removal successful, finding processed photo...');

      // İşlem başarılı - işlenmiş fotoğrafı bul
      const updatedProduct = useProductStore.getState().products.find(p => p.id === photo.productId);
      const updatedPhoto = updatedProduct?.photos.find(p => p.id === photo.id);

      console.log('🔍 Updated photo data:', {
        found: !!updatedPhoto,
        hasProcessedUri: !!updatedPhoto?.processedUri,
        processedUri: updatedPhoto?.processedUri,
        status: updatedPhoto?.status
      });

      if (updatedPhoto && updatedPhoto.processedUri) {
        console.log('🎬 Setting processed URI for animation:', updatedPhoto.processedUri);

        // GÜNCELLENME: Mevcut animating photo objesini güncelle
        setCurrentAnimatingPhoto(prevPhoto => {
          if (prevPhoto && prevPhoto.id === photo.id) {
            return {
              ...prevPhoto,
              processedUri: updatedPhoto.processedUri
            };
          }
          return prevPhoto;
        });

        // NOT: onAnimationComplete modal'ı kapatacak, burada manuel kapatmaya gerek yok
      } else {
        console.error('❌ No processed URI found in updated photo');
        setShowAnimationModal(false);
        setCurrentAnimatingPhoto(null);
      }
    } else {
      console.error('❌ Background removal failed');
      setShowAnimationModal(false);
      setCurrentAnimatingPhoto(null);
      ToastService.show({ type: 'error', text1: 'Hata', text2: storeError || 'Arka plan temizlenemedi.' });
    }
  };

  const handleBatchDelete = () => {
    if (selectedPhotos.size === 0) return;
    DialogService.show({
      title: 'Fotoğrafları Sil',
      message: `${selectedPhotos.size} fotoğraf kalıcı olarak silinecek. Emin misiniz?`,
      buttons: [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil', style: 'destructive',
          onPress: async () => {
            await Promise.all(Array.from(selectedPhotos).map(photoId => deletePhoto(productId!, photoId)));
            ToastService.show({ type: 'success', text1: 'Başarılı', text2: `${selectedPhotos.size} fotoğraf silindi.` });
            toggleSelectionMode();
          },
        },
      ],
    });
  };

  const handleBatchRemoveBackground = async () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
    const selectedIds = Array.from(selectedPhotos);
    if (!productId || selectedIds.length === 0) return;

    // YENİ: Toplu animasyonu başlat
    // Burada hızlı gösterim için sadece toast gösterelim, 
    // gerçek uygulamada her fotoğraf için ayrı animasyon da yapılabilir
    await removeMultipleBackgrounds(productId, selectedIds);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    toggleSelectionMode();
  };

  const canRemoveBackground = useMemo(() => {
    if (!activeProduct || selectedPhotos.size === 0) return false;
    return Array.from(selectedPhotos).some(photoId => {
      const photo = activeProduct.photos.find(p => p.id === photoId);
      return photo?.status === 'raw';
    });
  }, [selectedPhotos, activeProduct]);

  if (!activeProduct) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'Yükleniyor...' }} />
        <View style={styles.header}><ActivityIndicator /></View>
        <View style={styles.listContainer}>
          {Array.from({ length: 9 }).map((_, index) => (
            <View key={index} style={styles.photoWrapper}>
              <View style={styles.skeletonItem} />
            </View>
          ))}
        </View>
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
          <Text style={styles.productName} numberOfLines={1}>{activeProduct.name}</Text>
          <Text style={styles.photoCount}>{activeProduct.photos.length} {t('products.photos')}</Text>
        </View>
        <Button
          title="Ekle"
          onPress={() => {
            console.log('🔘 Button touched!');
            handleAddPhoto();
          }}
          size="small"
          variant="outline"
          icon={<Feather name="plus" size={14} color={Colors.primary} />}
          disabled={isProcessing}
          loading={isProcessing}
        />
        <Button title={isSelectionMode ? t('common.cancel') : "Seç"} onPress={toggleSelectionMode} size="small" variant="ghost" />
      </View>

      <FlatList
        data={activeProduct.photos || []}
        keyExtractor={(item) => item.id}
        numColumns={numColumns}
        renderItem={({ item }) => (
          <View style={styles.photoWrapper}>
            <AnimatedCard
              photo={item}
              isSelected={selectedPhotos.has(item.id)}
              showRemoveBgIcon={item.status === 'raw' && !isSelectionMode}
              onPress={() => handlePhotoPress(item)}
              onLongPress={() => toggleSelectionMode(item.id)}
            />
          </View>
        )}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={<ErrorMessage message="Bu ürüne ait hiç fotoğraf yok." />}
        extraData={activeProduct.modifiedAt}
      />

      {isSelectionMode && selectedPhotos.size > 0 && (
        <View style={styles.batchActionsContainer}>
          <Text style={styles.selectionCountText}>{selectedPhotos.size} seçildi</Text>
          <View style={styles.batchButtons}>
            {canRemoveBackground && (
              <Button
                title="Temizle"
                onPress={handleBatchRemoveBackground}
                icon={<Feather name="zap" size={16} color={Colors.primary} />}
                variant="outline"
              />
            )}
            <Button
              title="Sil"
              onPress={handleBatchDelete}
              icon={<Feather name="trash" size={16} color={Colors.error} />}
              variant="outline"
              textStyle={{ color: Colors.error }}
              style={{ borderColor: Colors.error }}
            />
          </View>
        </View>
      )}

      <Modal
        visible={showAnimationModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          console.log('📱 Modal close requested');
          setShowAnimationModal(false);
          setCurrentAnimatingPhoto(null);
        }}
      >
        <View style={styles.animationModalOverlay}>
          <View style={styles.animationModalContent}>
            {currentAnimatingPhoto && (
              <BackgroundRemovalAnimation
                key={`animation-${currentAnimatingPhoto.id}-${Date.now()}`} // Unique key with timestamp
                originalUri={currentAnimatingPhoto.originalUri}
                processedUri={currentAnimatingPhoto.processedUri}
                isAnimating={true}
                onAnimationComplete={() => {
                  console.log('🎉 Animation completed, closing modal...');
                  setTimeout(() => {
                    setShowAnimationModal(false);
                    setCurrentAnimatingPhoto(null);
                  }, 500);
                }}
                containerStyle={styles.animationContainer}
              />
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: Colors.card, gap: Spacing.sm, minHeight: 60 },
  backButton: { padding: Spacing.xs },
  headerContent: { flex: 1 },
  productName: { ...Typography.h3, color: Colors.textPrimary },
  photoCount: { ...Typography.caption, color: Colors.textSecondary, marginTop: Spacing.xs / 2 },
  listContainer: { padding: Spacing.sm, paddingBottom: 100 },
  photoWrapper: { width: `${100 / numColumns}%`, padding: Spacing.sm },
  photoImage: { width: '100%', aspectRatio: 1, borderRadius: BorderRadius.lg, backgroundColor: Colors.gray100 },
  selectedCard: { borderColor: Colors.primary, borderWidth: 3, borderRadius: BorderRadius.lg + 3 },
  selectionOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', borderRadius: BorderRadius.lg },
  selectionOverlayActive: { backgroundColor: `rgba(79, 70, 229, 0.5)` },
  batchActionsContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.md, paddingBottom: Spacing.xl, backgroundColor: Colors.card, borderTopWidth: 1, borderTopColor: Colors.border, shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 8 },
  selectionCountText: { ...Typography.bodyMedium, color: Colors.textPrimary },
  batchButtons: { flexDirection: 'row', gap: Spacing.md },
  statusOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', borderRadius: BorderRadius.lg },
  removeBgButton: { position: 'absolute', bottom: Spacing.sm, right: Spacing.sm, backgroundColor: 'rgba(0, 0, 0, 0.6)', width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', pointerEvents: 'none' },
  skeletonItem: { width: '100%', aspectRatio: 1, backgroundColor: Colors.gray200, borderRadius: BorderRadius.lg },

  // YENİ: Animasyon modal stilleri
  animationModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)', // Daha koyu
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xl,
  },
  animationModalContent: {
    backgroundColor: 'transparent', // Animation component'ı kendi stilini kullanır
    width: '100%',
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
  },
  animationContainer: {
    
  },
});