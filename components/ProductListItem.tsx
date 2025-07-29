import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { Product } from '@/services/api';
import { Card, Title, Paragraph } from 'react-native-paper';

interface ProductListItemProps {
  product: Product;
  onPress: () => void;
}

export function ProductListItem({ product, onPress }: ProductListItemProps) {
  return (
    <Card style={styles.card} onPress={onPress}>
      <Card.Content style={styles.content}>
        <Image 
          source={{ uri: product.coverThumbnailUrl || 'https://via.placeholder.com/100' }} 
          style={styles.thumbnail}
        />
        <View style={styles.info}>
          <Title>{product.name}</Title>
          <Paragraph>{product.photoCount || 0} fotoğraf</Paragraph>
        </View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginHorizontal: 12, marginVertical: 6 },
  content: { flexDirection: 'row', alignItems: 'center' },
  thumbnail: { width: 80, height: 80, borderRadius: 8, backgroundColor: '#eee' },
  info: { flex: 1, marginLeft: 16 },
});