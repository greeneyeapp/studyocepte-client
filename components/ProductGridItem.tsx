// components/ProductGridItem.tsx - Tam versiyon
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants';
import { LazyImage } from '@/components/LazyImage';
import { Card } from '@/components/Card';
import { Product } from '@/services/api';

interface ProductGridItemProps {
  product: Product;
  onPress: () => void;
  style?: any;
  priority?: 'low' | 'normal' | 'high';
}

export const ProductGridItem: React.FC<ProductGridItemProps> = ({
  product,
  onPress,
  style,
  priority = 'normal'
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <View style={[styles.itemContainer, style]}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        <Card padding="none">
          <View style={styles.imageContainer}>
            <LazyImage
              uri={product.coverThumbnailUrl || ''}
              style={styles.productImage}
              priority={priority}
              onLoad={() => setImageLoaded(true)}
              placeholder={
                <View style={styles.imagePlaceholder}>
                  <ActivityIndicator size="small" color={Colors.primary} />
                </View>
              }
            />
            {!imageLoaded && (
              <View style={styles.imageOverlay}>
                <ActivityIndicator size="small" color={Colors.card} />
              </View>
            )}
          </View>
          <View style={styles.productInfo}>
            <Text style={styles.productName} numberOfLines={1}>
              {product.name}
            </Text>
            <Text style={styles.photoCount}>
              {product.photoCount} fotoğraf
            </Text>
          </View>
        </Card>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  itemContainer: {
    flex: 1,
    margin: Spacing.sm / 2,
  },
  imageContainer: {
    position: 'relative',
    aspectRatio: 1,
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.gray100,
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  productInfo: {
    padding: Spacing.md,
  },
  productName: {
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  photoCount: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
});