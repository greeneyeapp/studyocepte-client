import React, { useState, useMemo, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, FlatList,
  TouchableOpacity, Image, ActivityIndicator, LayoutAnimation,
  UIManager, Platform, Animated, Modal,
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

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const numColumns = Layout.isTablet ? 4 : 3;

interface AnimatingPhoto {
  id: string;
  originalUri: string;
  processedUri?: string;
}

const ModernPhotoCard = ({ photo, isSelected, showRemoveBgIcon, onPress, onLongPress }: {
  photo: ProductPhoto; isSelected: boolean; showRemoveBgIcon: boolean;
  onPress: () => void; onLongPress: () => void;
}) => {
  const scale = new Animated.Value(1);
  const handlePressIn = () => Animated.spring(scale, { toValue: 0.96, useNativeDriver: true }).start();
  const handlePressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();

  return (
    <View style={photoStyles.cardContainer}>
      <Animated.View style={{ transform: [{ scale }] }}>
        <TouchableOpacity
          onPress={onPress} onLongPress={onLongPress} activeOpacity={0.9}
          onPressIn={handlePressIn} onPressOut={handlePressOut}
        >
          <Card padding="none" style={[photoStyles.photoCard, isSelected && photoStyles.selectedCard]}>
            <View style={photoStyles.imageContainer}>
              <Image
                key={photo.modifiedAt}
                source={{ uri: `${photo.thumbnailUri}?v=${photo.modifiedAt}` }}
                style={photoStyles.photoImage}
                resizeMode="cover"
              />
              {photo.status === 'processing' && (
                <View style={photoStyles.statusOverlay}>
                  <ActivityIndicator size="small" color={Colors.card} />
                  <Text style={photoStyles.statusText}>İşleniyor...</Text>
                </View>
              )}
              {showRemoveBgIcon && (
                <TouchableOpacity style={photoStyles.removeBgButton} onPress={onPress}>
                  <Feather name="zap" size={12} color={Colors.card} />
                </TouchableOpacity>
              )}
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
};

// DÜZELTİLMİŞ HEADER BİLEŞENİ
const ModernHeader: React.FC<{
  productName: string; photoCount: number; onBack: () => void;
}> = ({ productName, photoCount, onBack }) => (
  <View style={styles.header}>
    {/* Sol - Geri Butonu */}
    <View style={styles.leftSection}>
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <Feather name="arrow-left" size={24} color={Colors.textPrimary} />
      </TouchableOpacity>
    </View>
    
    {/* Orta - Başlık ve Fotoğraf Sayısı */}
    <View style={styles.centerSection}>
      <Text style={styles.productName} numberOfLines={1} ellipsizeMode="tail">
        {productName}
      </Text>
      <Text style={styles.photoCount}>{photoCount} fotoğraf</Text>
    </View>
    
    {/* Sağ - Boş Alan (Simetri için) */}
    <View style={styles.rightSection} />
  </View>
);

const EmptyPhotoState: React.FC<{ onAddPhoto: () => void }> = ({ onAddPhoto }) => (
  <View style={styles.emptyContainer}>
    <View style={styles.emptyIcon}><Feather name="camera" size={64} color={Colors.gray300} /></View>
    <Text style={styles.emptyTitle}>İlk Fotoğrafınızı Ekleyin</Text>
    <Text style={styles.emptySubtitle}>Eklemek için sağ alttaki '+' butonuna dokunun!</Text>
  </View>
);

const SelectionActionBar: React.FC<{
  selectedCount: number; onDelete: () => void; onCancel: () => void;
}> = ({ selectedCount, onDelete, onCancel }) => (
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
);

const ModernFAB: React.FC<{ onPress: () => void; isVisible: boolean }> = ({ onPress, isVisible }) => {
    const scaleValue = new Animated.Value(isVisible ? 1 : 0);
    useEffect(() => {
      Animated.spring(scaleValue, { toValue: isVisible ? 1 : 0, useNativeDriver: true, tension: 100, friction: 8 }).start();
    }, [isVisible]);
    return (
      <Animated.View style={[styles.fabContainer, { transform: [{ scale: scaleValue }] }]}>
        <TouchableOpacity style={styles.fab} onPress={onPress} activeOpacity={0.8}>
          <Feather name="plus" size={24} color={Colors.card} />
        </TouchableOpacity>
      </Animated.View>
    );
};

export default function ProductDetailScreen() {
  const { productId } = useLocalSearchParams<{ productId: string }>();
  const router = useRouter();
  const { addMultiplePhotos, deletePhoto, removeMultipleBackgrounds } = useProductStore();
  const activeProduct = useProductStore(state => state.products.find(p => p.id === productId));
  const isProcessing = useProductStore(state => state.isProcessing);
  const storeError = useProductStore(state => state.error);

  const [isSelectionMode, setSelectionMode] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set());
  const [showAnimationModal, setShowAnimationModal] = useState(false);
  const [currentAnimatingPhoto, setCurrentAnimatingPhoto] = useState<AnimatingPhoto | null>(null);

  const handleAddPhoto = async () => {
    if (isProcessing) return;
    if (!productId) return;
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') { ToastService.show({ type: 'error', text1: 'İzin Gerekli' }); return; }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 1, allowsMultipleSelection: true,
      });
      if (!result.canceled && result.assets) {
        LoadingService.show(); // Text parametresi kaldırıldı
        const uris = result.assets.map(asset => asset.uri);
        const success = await addMultiplePhotos(productId, uris);
        LoadingService.hide();
        if (!success) ToastService.show({ type: 'error', text1: 'Hata', text2: storeError || 'Fotoğraflar eklenemedi.' });
      }
    } catch (error) { ToastService.show({ type: 'error', text1: 'Hata', text2: 'Fotoğraf seçilemedi.' }); }
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
    if (isProcessing) {
        ToastService.show({type: 'info', text1: 'Lütfen bekleyin', text2: 'Mevcut işlem devam ediyor.'});
        return;
    }
    if (isSelectionMode) {
      const newSelection = new Set(selectedPhotos);
      newSelection.has(photo.id) ? newSelection.delete(photo.id) : newSelection.add(photo.id);
      if (newSelection.size === 0) {
        setSelectionMode(false);
      }
      setSelectedPhotos(newSelection);
    } else {
      if (photo.status === 'processed') {
        router.push({ pathname: '/(tabs)/editor/[photoId]', params: { photoId: photo.id, productId: photo.productId } });
      } else if (photo.status === 'raw') {
        DialogService.show({
            title: 'Arka Planı Temizle',
            message: 'Bu fotoğrafı düzenlemeden önce arka planını temizlemek ister misiniz?',
            buttons: [ { text: 'İptal', style: 'cancel' }, { text: 'Evet', style: 'default', onPress: () => handleSingleRemoveBackground(photo) }]
        });
      } else {
        ToastService.show({ type: 'info', text1: 'Lütfen Bekleyin', text2: 'Fotoğraf şu anda işleniyor.' });
      }
    }
  };

  const handleSingleRemoveBackground = async (photo: ProductPhoto) => {
    const animatingPhoto: AnimatingPhoto = { id: photo.id, originalUri: photo.originalUri };
    setCurrentAnimatingPhoto(animatingPhoto);
    setShowAnimationModal(true);
    const success = await removeMultipleBackgrounds(photo.productId, [photo.id]);
    if (success) {
      const updatedProduct = useProductStore.getState().products.find(p => p.id === photo.productId);
      const updatedPhoto = updatedProduct?.photos.find(p => p.id === photo.id);
      if (updatedPhoto && updatedPhoto.processedUri) {
        setCurrentAnimatingPhoto(prev => prev ? { ...prev, processedUri: updatedPhoto.processedUri } : null);
      } else {
        setShowAnimationModal(false);
        setCurrentAnimatingPhoto(null);
      }
    } else {
      setShowAnimationModal(false);
      setCurrentAnimatingPhoto(null);
      ToastService.show({ type: 'error', text1: 'Hata', text2: storeError || 'Arka plan temizlenemedi.' });
    }
  };
  
  const handleBatchDelete = () => {
    if (selectedPhotos.size === 0) return;
    DialogService.show({
      title: 'Fotoğrafları Sil', message: `${selectedPhotos.size} fotoğraf kalıcı olarak silinecek. Emin misiniz?`,
      buttons: [ { text: 'İptal', style: 'cancel' }, { text: 'Sil', style: 'destructive', onPress: async () => {
            await Promise.all(Array.from(selectedPhotos).map(photoId => deletePhoto(productId!, photoId)));
            toggleSelectionMode();
      }}]
    });
  };

  if (!activeProduct) {
    return (
        <SafeAreaView style={styles.container}>
            <ModernHeader productName={productId || ''} photoCount={0} onBack={() => router.back()} />
            <ActivityIndicator size="large" color={Colors.primary} style={{flex: 1}} />
        </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: activeProduct.name, headerShown: false }} />
      <ModernHeader productName={activeProduct.name} photoCount={activeProduct.photos.length} onBack={() => router.back()} />
      {activeProduct.photos.length === 0 ? (
        <EmptyPhotoState onAddPhoto={handleAddPhoto} />
      ) : (
        <FlatList
          data={activeProduct.photos || []}
          keyExtractor={(item) => item.id}
          numColumns={numColumns}
          key={String(numColumns)}
          renderItem={({ item }) => (
            <ModernPhotoCard
              photo={item} isSelected={selectedPhotos.has(item.id)}
              showRemoveBgIcon={item.status === 'raw' && !isSelectionMode && !isProcessing}
              onPress={() => handlePhotoPress(item)}
              onLongPress={() => toggleSelectionMode(item.id)}
            />
          )}
          contentContainerStyle={styles.photoGrid}
          extraData={`${activeProduct.modifiedAt}-${selectedPhotos.size}-${isProcessing}`}
        />
      )}
      {isSelectionMode && selectedPhotos.size > 0 && (
        <SelectionActionBar selectedCount={selectedPhotos.size} onDelete={handleBatchDelete} onCancel={() => toggleSelectionMode()} />
      )}
      <ModernFAB onPress={handleAddPhoto} isVisible={!isProcessing && !isSelectionMode} />
      <Modal visible={showAnimationModal} transparent animationType="fade">
        <View style={styles.animationModalOverlay}>
          {currentAnimatingPhoto && (
            <BackgroundRemovalAnimation
              key={`anim-${currentAnimatingPhoto.id}`}
              originalUri={currentAnimatingPhoto.originalUri}
              processedUri={currentAnimatingPhoto.processedUri}
              isAnimating={true}
              onAnimationComplete={() => {
                setTimeout(() => { setShowAnimationModal(false); setCurrentAnimatingPhoto(null); }, 500);
              }}
            />
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  // DÜZELTİLMİŞ HEADER STİLLERİ
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
    minHeight: 64, // Sabit yükseklik
  },
  
  leftSection: {
    width: 48, // Sabit genişlik
    alignItems: 'flex-start',
  },
  
  centerSection: {
    flex: 1, // Kalan alanı kapla
    alignItems: 'center',
    paddingHorizontal: Spacing.sm, // Yan taraflardan biraz boşluk
  },
  
  rightSection: {
    width: 48, // Sol ile aynı genişlik (simetri için)
  },
  
  backButton: {
    padding: Spacing.sm,
    marginLeft: -Spacing.sm, // Hizalama için
  },
  
  productName: {
    ...Typography.h2,
    color: Colors.textPrimary,
    fontWeight: '700',
    textAlign: 'center',
    maxWidth: '100%', // Taşmayı önle
  },
  
  photoCount: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontSize: 14,
    marginTop: 2,
    textAlign: 'center',
  },
  
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing.xl, },
  emptyIcon: { marginBottom: Spacing.xl, },
  emptyTitle: { ...Typography.h2, color: Colors.textPrimary, marginBottom: Spacing.sm, textAlign: 'center', },
  emptySubtitle: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22, },
  photoGrid: { padding: Spacing.sm, paddingBottom: 100, },
  actionBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, paddingBottom: Spacing.xl + 10,
    backgroundColor: Colors.card, borderTopWidth: 1, borderTopColor: Colors.border,
    shadowColor: Colors.shadow, shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1, shadowRadius: 8, elevation: 10,
  },
  cancelAction: { paddingVertical: Spacing.sm, },
  cancelActionText: { ...Typography.bodyMedium, color: Colors.primary, fontWeight: '600' },
  selectionCount: { flex: 1, ...Typography.bodyMedium, color: Colors.textPrimary, textAlign: 'center', fontWeight: '600', },
  actionButton: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, gap: Spacing.sm, backgroundColor: Colors.error + '1A', borderRadius: BorderRadius.md },
  actionButtonText: { ...Typography.bodyMedium, color: Colors.error, fontWeight: '600' },
  fabContainer: { position: 'absolute', right: Spacing.lg, bottom: Spacing.lg + 20 },
  fab: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.primary,
    justifyContent: 'center', alignItems: 'center', shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 12,
  },
  animationModalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.9)', justifyContent: 'center', alignItems: 'center', padding: Spacing.lg },
});

const photoStyles = StyleSheet.create({
  cardContainer: { width: `${100 / numColumns}%`, padding: Spacing.sm, },
  photoCard: {
    backgroundColor: Colors.card, borderRadius: BorderRadius.xl,
    shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 12, elevation: 4, overflow: 'hidden',
  },
  selectedCard: { borderWidth: 3, borderColor: Colors.primary, shadowColor: Colors.primary, shadowOpacity: 0.2, },
  imageContainer: { aspectRatio: 1, position: 'relative', backgroundColor: Colors.background },
  photoImage: { width: '100%', height: '100%', },
  statusOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0, 0, 0, 0.6)', justifyContent: 'center', alignItems: 'center', gap: Spacing.sm, },
  statusText: { ...Typography.caption, color: Colors.card, fontWeight: '500', },
  removeBgButton: {
    position: 'absolute', top: Spacing.sm, right: Spacing.sm,
    width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center',
  },
  selectionOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: Colors.primary + '60', justifyContent: 'center', alignItems: 'center', },
  selectionCheck: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.primary,
    justifyContent: 'center', alignItems: 'center', shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.4, shadowRadius: 4, elevation: 4,
    borderWidth: 2, borderColor: Colors.card,
  },
});