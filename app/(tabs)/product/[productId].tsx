import React, { useState, useMemo, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, FlatList,
  TouchableOpacity, Image, ActivityIndicator, LayoutAnimation,
  UIManager, Platform, Animated,
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

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const numColumns = Layout.isTablet ? 4 : 3;

// DÜZELTME: 'showRemoveBgIcon' prop'u eklendi
const AnimatedCard = ({ photo, isSelected, showRemoveBgIcon, onPress, onLongPress }: { 
    photo: ProductPhoto; 
    isSelected: boolean; 
    showRemoveBgIcon: boolean; // YENİ PROP
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
                    />
                    {photo.status === 'processing' && <View style={styles.statusOverlay}><ActivityIndicator color={Colors.card} /></View>}
                    {/* DÜZELTME: 'isSelectionMode' yerine yeni prop kullanılıyor */}
                    {showRemoveBgIcon && <View style={styles.removeBgButton}><Feather name="wand" size={14} color={Colors.card} /></View>}
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

  useEffect(() => {
    if (isProcessing) {
      LoadingService.show(processingMessage);
    } else {
      LoadingService.hide();
    }
  }, [isProcessing, processingMessage]);

  const handleAddPhoto = async () => {
    if (!productId) return;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      ToastService.show({ type: 'error', text1: t('common.permissions.galleryTitle'), text2: t('common.permissions.galleryMessage') });
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
      allowsMultipleSelection: true,
    });
    if (!result.canceled && result.assets) {
      const uris = result.assets.map(asset => asset.uri);
      const success = await addMultiplePhotos(productId, uris);
      if (success) {
        ToastService.show({ type: 'success', text1: `${uris.length} Fotoğraf Eklendi!` });
      } else {
        ToastService.show({ type: 'error', text1: 'Hata', text2: storeError || 'Fotoğraflar eklenemedi.' });
      }
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
      const success = await removeMultipleBackgrounds(photo.productId, [photo.id]);
      if (success) {
          ToastService.show({type: 'success', text1: 'Arka Plan Temizlendi!'});
      } else {
          ToastService.show({type: 'error', text1: 'Hata', text2: storeError || 'Arka plan temizlenemedi.'});
      }
  };

  const handleBatchDelete = () => {
    if (selectedPhotos.size === 0) return;
    DialogService.show({
      title: 'Fotoğrafları Sil',
      message: `${selectedPhotos.size} fotoğraf kalıcı olarak silinecek. Emin misiniz?`,
      buttons: [
        { text: 'İptal', style: 'cancel' },
        { text: 'Sil', style: 'destructive',
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
         <View style={styles.header}><ActivityIndicator/></View>
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
        <Button title="Ekle" onPress={handleAddPhoto} size="small" variant="outline" icon={<Feather name="plus" size={14} color={Colors.primary} />} />
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
                    // DÜZELTME: Gerekli bilgiyi prop olarak iletiyoruz
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
                icon={<Feather name="wand" size={16} color={Colors.primary} />}
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
});