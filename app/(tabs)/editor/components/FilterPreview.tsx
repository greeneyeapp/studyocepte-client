// app/(tabs)/editor/components/FilterPreview.tsx

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

export const FilterPreview: React.FC<FilterPreviewProps> = ({
  filter,
  imageUri,
  backgroundUri,
  isSelected,
  onPress,
}) => {
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
        />
        
        {/* Photo layer */}
        <View style={styles.photoContainer}>
          <Image 
            source={{ uri: imageUri }} 
            style={[styles.photoImage, getFilterImageStyle(filter.settings)]}
          />
        </View>
        
        {/* Filter overlays */}
        {renderFilterOverlays(filter.settings)}
      </View>
      
      <Text style={[styles.label, isSelected && styles.labelSelected]}>
        {filter.name}
      </Text>
    </TouchableOpacity>
  );
};

// Filtre stilini hesaplayan yardımcı fonksiyon
const getFilterImageStyle = (settings: Record<string, number>) => {
  if (!settings) return {};
  
  const style: any = {};
  
  // Brightness
  if (settings.brightness) {
    style.opacity = Math.max(0.3, Math.min(2, 1 + settings.brightness / 100));
  }
  
  return style;
};

// Filtre overlay'lerini render eden fonksiyon
const renderFilterOverlays = (settings: Record<string, number>) => {
  const overlays = [];
  
  // Warmth overlay
  if (settings?.warmth > 0) {
    overlays.push(
      <View 
        key="warm"
        style={[
          styles.warmOverlay, 
          { opacity: Math.min(0.3, settings.warmth / 200) }
        ]} 
      />
    );
  }
  
  if (settings?.warmth < 0) {
    overlays.push(
      <View 
        key="cool"
        style={[
          styles.coolOverlay, 
          { opacity: Math.min(0.3, Math.abs(settings.warmth) / 200) }
        ]} 
      />
    );
  }
  
  // Saturation overlay (mono effect)
  if (settings?.saturation < -50) {
    overlays.push(
      <View 
        key="mono"
        style={[
          styles.monoOverlay,
          { opacity: Math.abs(settings.saturation + 50) / 100 }
        ]} 
      />
    );
  }
  
  // Vignette overlay
  if (settings?.vignette > 0) {
    overlays.push(
      <View 
        key="vignette"
        style={[
          styles.vignetteOverlay,
          { 
            opacity: Math.min(0.8, settings.vignette / 100),
            borderWidth: Math.max(3, Math.min(8, settings.vignette * 0.1)),
          }
        ]} 
      />
    );
  }
  
  return overlays;
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
  
  // Filter overlays
  warmOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 180, 80, 0.4)',
  },
  coolOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(80, 140, 255, 0.4)',
  },
  monoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(128, 128, 128, 0.6)',
  },
  vignetteOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    borderColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: BorderRadius.sm,
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