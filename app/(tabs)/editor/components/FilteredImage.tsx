// app/(tabs)/editor/components/FilteredImage.tsx

import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, interpolate, Extrapolate } from 'react-native-reanimated';

interface FilteredImageProps {
  imageUri: string;
  settings: any;
  style?: any;
  resizeMode?: 'contain' | 'cover' | 'stretch';
}

export const FilteredImage: React.FC<FilteredImageProps> = ({
  imageUri,
  settings,
  style,
  resizeMode = 'contain',
}) => {
  // Gelişmiş animasyonlu filtreler - SADECE OPACITY ve TINT
  const animatedStyle = useAnimatedStyle(() => {
    const brightness = settings.product_brightness || 0;
    const exposure = settings.product_exposure || 0;
    const warmth = settings.product_warmth || 0;
    const saturation = settings.product_saturation || 0;
    
    console.log('🎨 Product Filters:', { brightness, exposure, warmth, saturation });
    
    // Brightness + Exposure: opacity ile
    const brightnessOpacity = interpolate(
      brightness + exposure,
      [-200, 0, 200],
      [0.3, 1, 1.8],
      Extrapolate.CLAMP
    );
    
    // Warmth: tintColor ile (PNG transparency korumalı)
    let tintColor = 'transparent';
    if (warmth !== 0) {
      if (warmth > 0) {
        tintColor = `rgba(255, 180, 80, ${Math.min(0.2, warmth / 500)})`; // Çok hafif
      } else {
        tintColor = `rgba(80, 140, 255, ${Math.min(0.2, Math.abs(warmth) / 500)})`; // Çok hafif
      }
    }
    
    return {
      opacity: Math.max(0.2, Math.min(2, brightnessOpacity)),
      tintColor: tintColor,
    };
  });

  return (
    <View style={[styles.container, style]}>
      <Animated.Image
        source={{ uri: imageUri }}
        style={[styles.image, animatedStyle]}
        resizeMode={resizeMode}
      />
      
      {/* OVERLAY'LERİ KALDIR - PNG transparency'yi bozuyorlar */}
      {/* Sadece Animated.Image'daki tintColor ve opacity kullan */}
    </View>
  );
};

// Warmth overlay - sadece görünür pixellerde
const renderWarmthOverlay = (settings: any) => {
  const warmth = settings.product_warmth || 0;
  
  if (warmth === 0) return null;
  
  const overlayColor = warmth > 0 
    ? `rgba(255, 180, 80, ${Math.min(0.3, Math.abs(warmth) / 300)})` // Sıcak
    : `rgba(80, 140, 255, ${Math.min(0.3, Math.abs(warmth) / 300)})`; // Soğuk
  
  return (
    <View 
      style={[
        styles.overlay,
        { backgroundColor: overlayColor }
      ]}
      pointerEvents="none"
    />
  );
};

// Saturation overlay - mono effect
const renderSaturationOverlay = (settings: any) => {
  const saturation = settings.product_saturation || 0;
  
  if (saturation >= -50) return null; // Sadece çok düşük saturation'da
  
  const monoOpacity = Math.abs(saturation + 50) / 100;
  
  return (
    <View 
      style={[
        styles.overlay,
        { backgroundColor: `rgba(128, 128, 128, ${monoOpacity * 0.4})` }
      ]}
      pointerEvents="none"
    />
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    // Bu overlay'ler container'ın şeklini alır, PNG transparency'yi korur
  },
  maskContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  maskImage: {
    width: '100%',
    height: '100%',
  },
});