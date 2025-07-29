import React from 'react';
import { StyleSheet, Pressable, Image, View, ActivityIndicator, useWindowDimensions } from 'react-native';
import { ProductPhoto } from '@/services/api';

interface PhotoGridItemProps {
  photo: ProductPhoto;
  onPress: () => void;
}

export function PhotoGridItem({ photo, onPress }: PhotoGridItemProps) {
  const { width } = useWindowDimensions();
  const size = (width / 3) - 8; // 3 sütunlu grid için boşluklu boyut

  return (
    <Pressable onPress={onPress} style={[styles.container, { width: size, height: size }]}>
      {photo.status === 'processing' && (
        <View style={styles.overlay}>
            <ActivityIndicator color="#fff" />
        </View>
      )}
      <Image 
        source={{ uri: photo.thumbnailUrl || 'https://via.placeholder.com/150' }}
        style={styles.image}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { margin: 4 },
  image: { width: '100%', height: '100%', backgroundColor: '#eee', borderRadius: 4 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    borderRadius: 4,
  }
});