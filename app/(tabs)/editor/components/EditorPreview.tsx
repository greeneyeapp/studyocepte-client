// app/(tabs)/editor/components/EditorPreview.tsx

import React from 'react';
import { View, Image, Pressable, Text, StyleSheet } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { ProductPhoto, Background } from '@/services/api';
import { Colors, BorderRadius, Spacing, Typography } from '@/constants';
import { FilteredImage } from './FilteredImage';

interface EditorPreviewProps {
  activePhoto: ProductPhoto;
  selectedBackground?: Background;
  settings: any;
  combinedGesture: any;
  combinedImageStyle: any;
  showOriginal: boolean;
  onShowOriginalChange: (show: boolean) => void;
  onLayout: (event: any) => void;
  activeTarget: string; // Prop tanımı var
}

export const EditorPreview: React.FC<EditorPreviewProps> = ({
  activePhoto,
  selectedBackground,
  settings,
  combinedGesture,
  combinedImageStyle,
  showOriginal,
  onShowOriginalChange,
  onLayout,
}) => {

  return (
    <View style={styles.container}>
      <Pressable
        style={styles.pressable}
        onPressIn={() => onShowOriginalChange(true)}
        onPressOut={() => onShowOriginalChange(false)}
        onLayout={onLayout}
      >
        <View style={styles.canvas}>
          <GestureDetector gesture={combinedGesture}>
            <View style={styles.layeredContainer}>
              {/* Arka Plan Katmanı */}
              {selectedBackground && (
                <View style={styles.backgroundLayerContainer}>
                  <Image 
                    source={{ uri: selectedBackground.fullUrl }}
                    style={[styles.backgroundLayer, getBackgroundStyle(settings)]}
                  />
                  {/* Arka plan filtre overlay'leri */}
                  {renderBackgroundOverlays(settings)}
                </View>
              )}
              
              {/* Ürün Katmanı - Filtrelenmiş PNG */}
              <Animated.View style={[styles.productLayer, combinedImageStyle]}>
                <View style={styles.productContainer}>
                  {/* Orijinal gösterme durumu */}
                  {showOriginal ? (
                    <Image
                      source={{ uri: activePhoto.processedImageUrl }}
                      style={styles.productImage}
                      resizeMode="contain"
                    />
                  ) : (
                    /* Filtrelenmiş görüntü - PNG transparency korumalı */
                    <FilteredImage
                      imageUri={activePhoto.processedImageUrl}
                      settings={settings}
                      style={styles.productImage}
                      resizeMode="contain"
                    />
                  )}
                </View>
              </Animated.View>
            </View>
          </GestureDetector>
          
          {/* Orijinal gösterme overlay'i */}
          {showOriginal && (
            <View style={styles.originalOverlay}>
              <Text style={styles.originalText}>Orijinal</Text>
            </View>
          )}
        </View>
      </Pressable>
    </View>
  );
};

// Arka plan stili - TÜM FİLTRELER
const getBackgroundStyle = (settings: any) => {
  const style: any = {};
  
  // Background brightness - ters matematik (React Native opacity sorunu)
  if (settings.background_brightness !== undefined) {
    const brightness = 1 - (settings.background_brightness / 100);
    style.opacity = Math.max(0.3, Math.min(2, brightness));
  }
  
  // Background exposure - brightness ile beraber
  if (settings.background_exposure !== undefined) {
    const currentOpacity = style.opacity || 1;
    const exposureBoost = 1 - (settings.background_exposure / 200); // Daha hafif
    style.opacity = Math.max(0.2, Math.min(2, currentOpacity * exposureBoost));
  }
  
  return style;
};

// Doğrudan image'e uygulanan stiller - sadece brightness korunur
const getDirectImageStyle = (settings: any) => {
  const style: any = {};
  
  // Sadece brightness - diğer filtreler background'da yapılır
  if (settings.product_brightness !== undefined) {
    if (settings.product_brightness >= 0) {
      style.opacity = 1 + (settings.product_brightness / 100);
    } else {
      style.opacity = Math.max(0.3, 1 + (settings.product_brightness / 100));
    }
  }
  
  return style;
};

// PNG transparency sorunu - şimdilik overlay'leri kaldır
const renderProductBlendOverlays = (settings: any) => {
  // PNG transparency koruması için overlay'ler kapatıldı
  // Sadece brightness çalışıyor
  return [];
};

// Arka plan overlay'lerini render et - TÜM FİLTRELER DEBUG
const renderBackgroundOverlays = (settings: any) => {
  const overlays = [];
  
  // Background warmth - KONTROL ET
  if (settings.background_warmth > 0) {
    console.log('🔥 Background Warmth +:', settings.background_warmth);
    overlays.push(
      <View 
        key="bg-warm"
        style={[
          styles.warmOverlay, 
          { opacity: Math.min(0.4, settings.background_warmth / 150) }
        ]} 
      />
    );
  }
  
  if (settings.background_warmth < 0) {
    console.log('❄️ Background Warmth -:', settings.background_warmth);
    overlays.push(
      <View 
        key="bg-cool"
        style={[
          styles.coolOverlay, 
          { opacity: Math.min(0.4, Math.abs(settings.background_warmth) / 150) }
        ]} 
      />
    );
  }
  
  // Background saturation (mono) - KONTROL ET
  if (settings.background_saturation < -50) {
    console.log('⚫ Background Mono:', settings.background_saturation);
    overlays.push(
      <View 
        key="bg-mono"
        style={[
          styles.monoOverlay,
          { opacity: Math.abs(settings.background_saturation + 50) / 100 }
        ]} 
      />
    );
  }
  
  // Background vignette - LINEAR GRADIENT ile
  if (settings.background_vignette > 0) {
    console.log('🎯 Background Vignette:', settings.background_vignette);
    
    const vignetteOpacity = Math.min(0.6, settings.background_vignette / 150);
    
    overlays.push(
      <LinearGradient
        key="bg-vignette"
        colors={[
          'transparent',
          'transparent', 
          'rgba(0,0,0,0.3)',
          'rgba(0,0,0,0.6)'
        ]}
        locations={[0, 0.4, 0.8, 1]}
        style={[
          styles.vignetteGradient,
          { opacity: vignetteOpacity }
        ]}
        start={{ x: 0.5, y: 0.5 }}
        end={{ x: 1, y: 1 }}
      />
    );
  }
  
  // Background contrast overlay - KONTROL ET
  if (settings.background_contrast !== 0) {
    console.log('📊 Background Contrast:', settings.background_contrast);
    const contrastIntensity = Math.abs(settings.background_contrast) / 100;
    const overlayColor = settings.background_contrast > 0 
      ? `rgba(255, 255, 255, ${contrastIntensity * 0.2})` // Pozitif: beyaz overlay
      : `rgba(0, 0, 0, ${contrastIntensity * 0.3})`; // Negatif: siyah overlay
    
    overlays.push(
      <View 
        key="bg-contrast"
        style={[
          styles.contrastOverlay,
          { backgroundColor: overlayColor }
        ]} 
      />
    );
  }
  
  return overlays;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    margin: Spacing.sm,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
  },
  pressable: {
    flex: 1,
  },
  canvas: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    padding: Spacing.xs,
  },
  layeredContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  backgroundLayerContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  backgroundLayer: {
    ...StyleSheet.absoluteFillObject,
    resizeMode: 'cover',
  },
  productLayer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  productContainer: {
    width: '80%',
    height: '80%',
    justifyContent: 'center',
    alignItems: 'center',
    // Container'a filtre uygulamayız - sadece image'e
  },
  productImage: {
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
  vignetteOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    borderColor: 'rgba(0,0,0,0.9)',
  },
  vignetteGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    // CSS'de: radial-gradient(circle, transparent 30%, black 100%)
    // React Native'de yaklaşık simülasyon
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 50,
    elevation: 0,
    borderWidth: 20,
    borderColor: 'transparent',
    // İç gölge efekti
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  contrastOverlay: {
    ...StyleSheet.absoluteFillObject,
    mixBlendMode: 'overlay', // Web'de çalışır, mobile'da görsel efekt
  },
  clarityOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    mixBlendMode: 'hard-light',
  },
  monoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(128,128,128,0.6)',
  },
  
  // Original overlay
  originalOverlay: {
    position: 'absolute',
    bottom: Spacing.xl,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  originalText: {
    ...Typography.captionMedium,
    color: Colors.card,
  },
});