// features/editor/components/FilterPreview.tsx - NO SKIA VERSION

import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants';
import { FilterPreset } from '../config/filters';

interface FilterPreviewProps {
  filter: FilterPreset;
  imageUri: string;
  backgroundUri: string;
  isSelected: boolean;
  onPress: () => void;
}

// CSS Filter generator for filter preview
const generateFilterStyle = (settings: Record<string, number>) => {
  const filters = [];
  
  if (settings.brightness) {
    const brightness = 1 + (settings.brightness / 100);
    filters.push(`brightness(${brightness})`);
  }
  
  if (settings.contrast) {
    const contrast = 1 + (settings.contrast / 100);
    filters.push(`contrast(${contrast})`);
  }
  
  if (settings.saturation) {
    const saturation = Math.max(0, 1 + (settings.saturation / 100));
    filters.push(`saturate(${saturation})`);
  }
  
  if (settings.warmth) {
    // Warmth'i hue-rotate ile simüle et
    const hue = settings.warmth * 0.5;
    filters.push(`hue-rotate(${hue}deg)`);
  }
  
  if (settings.sepia) {
    const sepia = Math.max(0, Math.min(1, settings.sepia / 100));
    filters.push(`sepia(${sepia})`);
  }
  
  return filters.length > 0 ? { filter: filters.join(' ') } : {};
};

export const FilterPreview: React.FC<FilterPreviewProps> = ({
  filter,
  imageUri,
  backgroundUri,
  isSelected,
  onPress,
}) => {
  const filterStyle = generateFilterStyle(filter.settings);
  
  return (
    <TouchableOpacity
      style={[styles.container, isSelected && styles.containerSelected]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.previewContainer}>
        {/* Background layer */}
        <Image
          source={{ uri: backgroundUri }}
          style={styles.backgroundImage}
          resizeMode="cover"
        />

        {/* Photo layer with filter */}
        <View style={styles.photoContainer}>
          <Image
            source={{ uri: imageUri }}
            style={[styles.photoImage, filterStyle]}
            resizeMode="contain"
          />
        </View>
      </View>

      <Text style={[styles.label, isSelected && styles.labelSelected]}>
        {filter.name}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginRight: Spacing.lg,
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
  photoContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 6,
  },
  photoImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  label: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
    maxWidth: 65,
  },
  labelSelected: {
    color: Colors.primary,
    fontWeight: '600',
  },
});