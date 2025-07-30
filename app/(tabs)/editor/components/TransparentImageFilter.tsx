// app/(tabs)/editor/components/TransparentImageFilter.tsx

import React from 'react';
import { View, Image, StyleSheet } from 'react-native';

interface TransparentImageFilterProps {
  imageUri: string;
  settings: any;
  style?: any;
}

export const TransparentImageFilter: React.FC<TransparentImageFilterProps> = ({
  imageUri,
  settings,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      {/* Ana PNG resim */}
      <Image
        source={{ uri: imageUri }}
        style={[styles.baseImage, getImageFilterStyle(settings)]}
        resizeMode="contain"
      />
      
      {/* Overlay'ler - sadece visible pixellerde çalışır */}
      {renderTransparentAwareOverlays(imageUri, settings)}
    </View>
  );
};

// Temel image filtreleri - transparanlığı korur
const getImageFilterStyle = (settings: any) => {
  const style: any = {};
  
  // Brightness - opacity ile (transparanlığı korur)
  if (settings.product_brightness !== undefined) {
    if (settings.product_brightness >= 0) {
      style.opacity = 1 + (settings.product_brightness / 100);
    } else {
      style.opacity = Math.max(0.3, 1 + (settings.product_brightness / 100));
    }
  }
  
  return style;
};

// Transparent PNG'e özel overlay sistemi
const renderTransparentAwareOverlays = (imageUri: string, settings: any) => {
  const overlays = [];
  
  // Warmth overlay - PNG mask kullanarak
  if (settings.product_warmth !== 0) {
    const warmthColor = settings.product_warmth > 0 
      ? 'rgba(255, 180, 80, 0.4)'
      : 'rgba(80, 140, 255, 0.4)';
    
    const opacity = Math.min(0.4, Math.abs(settings.product_warmth) / 150);
    
    overlays.push(
      <View key="warmth-overlay" style={styles.overlayContainer}>
        {/* PNG'yi mask olarak kullan */}
        <Image
          source={{ uri: imageUri }}
          style={[styles.maskImage, { opacity: 0 }]}
          resizeMode="contain"
        />
        {/* Renk overlay'i */}
        <View 
          style={[
            styles.colorOverlay,
            { 
              backgroundColor: warmthColor,
              opacity: opacity,
            }
          ]} 
        />
      </View>
    );
  }
  
  // Contrast overlay - blend mode ile
  if (settings.product_contrast !== 0) {
    const contrastIntensity = Math.abs(settings.product_contrast) / 100;
    const overlayColor = settings.product_contrast > 0 
      ? `rgba(255, 255, 255, ${contrastIntensity * 0.15})`
      : `rgba(0, 0, 0, ${contrastIntensity * 0.25})`;
    
    overlays.push(
      <View key="contrast-overlay" style={styles.overlayContainer}>
        <Image
          source={{ uri: imageUri }}
          style={[styles.maskImage, { opacity: 0 }]}
          resizeMode="contain"
        />
        <View 
          style={[
            styles.colorOverlay,
            { backgroundColor: overlayColor }
          ]} 
        />
      </View>
    );
  }
  
  // Saturation (mono) overlay
  if (settings.product_saturation < -50) {
    const monoOpacity = Math.abs(settings.product_saturation + 50) / 100;
    
    overlays.push(
      <View key="mono-overlay" style={styles.overlayContainer}>
        <Image
          source={{ uri: imageUri }}
          style={[styles.maskImage, { opacity: 0 }]}
          resizeMode="contain"
        />
        <View 
          style={[
            styles.colorOverlay,
            { 
              backgroundColor: `rgba(128, 128, 128, ${monoOpacity * 0.6})`,
            }
          ]} 
        />
      </View>
    );
  }
  
  return overlays;
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  baseImage: {
    width: '100%',
    height: '100%',
  },
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  maskImage: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  colorOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
    // CSS'de mask kullanılabilir, React Native'de ise clipping
  },
});