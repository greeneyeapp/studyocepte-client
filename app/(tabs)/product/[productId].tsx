import React, { useEffect } from 'react';
import { View, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useProductStore } from '@/stores/useProductStore';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { PhotoGridItem } from '@/components/PhotoGridItem'; // Yeni bileşen
import { FAB } from 'react-native-paper';
import { ImagePickerService, ToastService } from '@/services/ui';

export default function ProductDetailScreen() {
  const { productId } = useLocalSearchParams<{ productId: string }>();
  const router = useRouter();
  const { activeProduct, isLoading, fetchProductById, uploadAnotherPhoto } = useProductStore();

  useEffect(() => {
    if (productId) {
      fetchProductById(productId);
    }
  }, [productId]);

  const handleAddPhoto = async () => {
    if (!productId) return;
    try {
        const imageUri = await ImagePickerService.pickImageFromGallery();
        if (imageUri) {
            await uploadAnotherPhoto(productId, imageUri);
            ToastService.show('Fotoğraf yüklendi!');
        }
    } catch(error: any) {
        ToastService.show(error.message, 'error');
    }
  };

  if (isLoading || !activeProduct) {
    return <ActivityIndicator size="large" style={styles.centered} />;
  }

  return (
    <ThemedView style={styles.container}>
        <Stack.Screen options={{ title: activeProduct.name }} />
        {activeProduct.photos.length === 0 ? (
             <View style={styles.centered}>
                <ThemedText type="subtitle">Hiç Fotoğraf Yok</ThemedText>
                <ThemedText type="default" style={{textAlign: 'center', marginTop: 8}}>Bu ürüne ilk fotoğrafı ekleyin.</ThemedText>
            </View>
        ) : (
            <FlatList
                data={activeProduct.photos}
                keyExtractor={(item) => item.id}
                numColumns={3}
                renderItem={({ item }) => (
                    <PhotoGridItem 
                        photo={item} 
                        onPress={() => router.push(`/(tabs)/editor/${item.id}`)} 
                    />
                )}
                contentContainerStyle={styles.grid}
            />
        )}
       <FAB
        icon="camera-plus"
        style={styles.fab}
        onPress={handleAddPhoto}
        label='Fotoğraf Ekle'
        loading={isLoading}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  grid: { padding: 4 },
  fab: { position: 'absolute', margin: 16, right: 0, bottom: 0 },
});