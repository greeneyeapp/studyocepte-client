// features/editor/components/FilterPreview.tsx - DÜZELTILMIŞ VERSİYON

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants';
import { FilterPreset } from '../config/filters';
import { generateAdvancedImageStyle } from '../utils/cssFilterGenerator';

interface FilterPreviewProps {
  filter: FilterPreset;
  imageUri: string;
  backgroundUri?: string;
  isSelected: boolean;
  onPress: () => void;
}

export const FilterPreview: React.FC<FilterPreviewProps> = ({
  filter,
  imageUri,
  backgroundUri,
  isSelected,
  onPress,
}) => {
  // Filter ayarlarını CSS stiline çevir
  const filterStyle = generateAdvancedImageStyle(filter.settings, 'product', false);

  return (
    <TouchableOpacity 
      style={[
        styles.container,
        isSelected && styles.containerSelected
      ]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.previewContainer}>
        {/* Arka plan görseli */}
        {backgroundUri && (
          <Image 
            source={{ uri: backgroundUri }} 
            style={styles.backgroundImage}
          />
        )}
        
        {/* Ürün görseli - filtre uygulanmış */}
        <Image 
          source={{ uri: imageUri }} 
          style={[styles.productImage, filterStyle]}
        />
      </View>
      
      {/* Filter adı */}
      <Text 
        style={[
          styles.filterName,
          isSelected && styles.filterNameSelected
        ]}
        numberOfLines={1}
      >
        {filter.name}
      </Text>
      
      {/* Seçili durumu göstergesi */}
      {isSelected && <View style={styles.selectionIndicator} />}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginRight: Spacing.lg,
    minWidth: 70,
  },
  containerSelected: {
    transform: [{ scale: 1.05 }],
  },
  previewContainer: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    backgroundColor: Colors.gray100,
    marginBottom: Spacing.sm,
    position: 'relative',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    resizeMode: 'cover',
  },
  productImage: {
    ...StyleSheet.absoluteFillObject,
    resizeMode: 'contain',
  },
  filterName: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
    maxWidth: 70,
  },
  filterNameSelected: {
    color: Colors.primary,
    fontWeight: '600',
  },
  selectionIndicator: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },
});