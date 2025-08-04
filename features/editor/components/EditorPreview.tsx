// features/editor/components/EditorPreview.tsx - GÜNCELLENMIŞ VERSİYON

import React, { forwardRef, useMemo } from 'react';
import { View, Pressable, Text, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { ProductPhoto, Background, EditorSettings } from '@/services/api';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants';
import { useEditorGestures } from '../hooks/useEditorGestures';
import { SimpleVignetteOverlay } from './VignetteOverlay'; // YENİ IMPORT
import { generateAdvancedImageStyle } from '../utils/cssFilterGenerator'; // YENİ IMPORT

interface EditorPreviewProps {
  activePhoto: ProductPhoto;
  selectedBackground?: Background;
  settings: EditorSettings;
  showOriginal: boolean;
  onShowOriginalChange: (show: boolean) => void;
  onLayout: (event: any) => void;
  updateSettings: (newSettings: Partial<EditorSettings>) => void;
  previewSize: { width: number; height: number };
  isCropping: boolean;
}

// Gerçek Vignette Overlay - Radial Gradient ile
const VignetteOverlay: React.FC<{ intensity: number }> = ({ intensity }) => {
  if (intensity <= 0) return null;

  // Intensity'ye göre vignette parametreleri
  const opacity = Math.min(0.8, intensity * 0.01); // 0-0.8 arası opacity
  const innerRadius = Math.max(20, 100 - intensity); // İç temiz alan
  const outerRadius = Math.min(90, 40 + intensity); // Dış karartma alanı

  return (
    <View 
      style={[
        StyleSheet.absoluteFillObject,
        {
          backgroundColor: 'transparent',
          // CSS'de radial-gradient yok ama box-shadow ile simüle edebiliriz
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: opacity,
          shadowRadius: intensity / 2,
          elevation: 0,
        }
      ]} 
      pointerEvents="none"
    >
      {/* Çoklu katmanlı vignette efekti */}
      <View style={[
        StyleSheet.absoluteFillObject,
        {
          backgroundColor: 'transparent',
          borderWidth: Math.max(1, intensity / 3),
          borderColor: `rgba(0,0,0,${opacity * 0.3})`,
          margin: -Math.max(1, intensity / 3),
          borderRadius: intensity,
        }
      ]} />
      
      <View style={[
        StyleSheet.absoluteFillObject,
        {
          backgroundColor: 'transparent', 
          borderWidth: Math.max(2, intensity / 2),
          borderColor: `rgba(0,0,0,${opacity * 0.5})`,
          margin: -Math.max(2, intensity / 2),
          borderRadius: intensity * 1.5,
        }
      ]} />
      
      <View style={[
        StyleSheet.absoluteFillObject,
        {
          backgroundColor: 'transparent',
          borderWidth: Math.max(3, intensity),
          borderColor: `rgba(0,0,0,${opacity * 0.7})`,
          margin: -Math.max(3, intensity),
          borderRadius: intensity * 2,
        }
      ]} />
    </View>
  );
};

export const EditorPreview = forwardRef<View, EditorPreviewProps>(({
  activePhoto, selectedBackground, settings, showOriginal,
  onShowOriginalChange, onLayout, updateSettings, previewSize, isCropping
}, ref) => {
  const { photoX, photoY, photoScale, combinedGesture } = useEditorGestures({ settings, previewSize, updateSettings });

  // Ürün transform animasyonu
  const productAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: photoX.value },
      { translateY: photoY.value },
      { scale: photoScale.value },
      { rotate: `${(settings.photoRotation || 0)}deg` },
    ],
  }));

  // GELİŞTİRİLMİŞ Filter stilleri
  const productFilterStyle = useMemo(() => 
    generateAdvancedImageStyle(settings, 'product', showOriginal), 
    [settings, showOriginal]
  );

  const backgroundFilterStyle = useMemo(() => 
    generateAdvancedImageStyle(settings, 'background', showOriginal), 
    [settings, showOriginal]
  );

  // Image URI'ları
  const imageUriToShow = activePhoto?.processedImageUrl || activePhoto?.thumbnailUrl;
  const backgroundUri = selectedBackground?.fullUrl;

  // Vignette intensity
  const vignetteIntensity = ((settings as any).background_vignette || 0) / 100;

  // DEBUG: Development ortamında filter değerlerini konsola yazdır
  if (__DEV__ && !showOriginal) {
    console.log('🎨 Applied Filters:', {
      product: productFilterStyle.filter,
      background: backgroundFilterStyle.filter,
      vignette: vignetteIntensity
    });
  }

  return (
    <View style={styles.container} onLayout={onLayout} ref={ref}>
      <Pressable 
        style={styles.pressable} 
        onPressIn={() => onShowOriginalChange(true)} 
        onPressOut={() => onShowOriginalChange(false)}
      >
        <View style={styles.previewWrapper}>
          {previewSize.width > 0 && imageUriToShow ? (
            <View style={styles.imageContainer}>
              {/* KATMAN 1: Background Layer */}
              {backgroundUri && (
                <View style={styles.backgroundContainer}>
                  <Image
                    source={{ uri: backgroundUri }}
                    style={[
                      styles.backgroundImage,
                      backgroundFilterStyle // Geliştirilmiş filtreler
                    ]}
                    resizeMode="cover"
                  />
                  
                  {/* Background Vignette - Gerçek gradient efekti */}
                  {vignetteIntensity > 0 && (
                    <SimpleVignetteOverlay intensity={vignetteIntensity * 100} />
                  )}
                </View>
              )}
              
              {/* KATMAN 2: Product Layer */}
              <GestureDetector gesture={combinedGesture}>
                <Animated.View 
                  style={[
                    styles.productContainer,
                    productAnimatedStyle
                  ]}
                >
                  <Image
                    source={{ uri: imageUriToShow }}
                    style={[
                      styles.productImage,
                      productFilterStyle // Geliştirilmiş filtreler
                    ]}
                    resizeMode="contain"
                    onError={(error) => {
                      console.error('❌ Product image load error:', error.nativeEvent.error);
                    }}
                    onLoad={() => {
                      if (__DEV__) console.log('✅ Product image loaded with filters:', productFilterStyle.filter);
                    }}
                  />
                </Animated.View>
              </GestureDetector>
            </View>
          ) : (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.loadingText}>
                {!imageUriToShow ? 'Ürün fotoğrafı yükleniyor...' : 'Önizleme hazırlanıyor...'}
              </Text>
            </View>
          )}
          
          {/* Crop Overlay */}
          {isCropping && (
            <CropOverlay 
              previewSize={previewSize} 
              aspectRatioString={settings.cropAspectRatio || 'original'} 
            />
          )}
          
          {/* Original Indicator */}
          {showOriginal && (
            <View style={styles.originalOverlay}>
              <Text style={styles.originalText}>Orijinal</Text>
            </View>
          )}

          {/* DEBUG: Aktif filtreler göstergesi (sadece development) */}
          {__DEV__ && !showOriginal && (
            <View style={styles.debugOverlay}>
              <Text style={styles.debugText}>
                Product: {productFilterStyle.filter === 'none' ? 'No filters' : 'Filtered'}
              </Text>
              <Text style={styles.debugText}>
                Background: {backgroundFilterStyle.filter === 'none' ? 'No filters' : 'Filtered'}
              </Text>
              {vignetteIntensity > 0 && (
                <Text style={styles.debugText}>Vignette: {Math.round(vignetteIntensity * 100)}%</Text>
              )}
            </View>
          )}
        </View>
      </Pressable>
    </View>
  );
});

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    width: '100%', 
    backgroundColor: Colors.background, 
    padding: Spacing.sm 
  },
  pressable: { 
    flex: 1 
  },
  previewWrapper: { 
    flex: 1, 
    overflow: 'hidden', 
    backgroundColor: Colors.gray100, 
    borderRadius: BorderRadius.lg 
  },
  imageContainer: {
    flex: 1,
    position: 'relative',
  },
  backgroundContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
  },
  productContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
    padding: Spacing.md,
  },
  productImage: {
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
  },
  loadingText: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  debugOverlay: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding: 8,
    borderRadius: 6,
    maxWidth: 200,
    zIndex: 1000,
  },
  debugText: {
    color: 'white',
    fontSize: 10,
    fontFamily: 'monospace',
    marginBottom: 2,
    lineHeight: 12,
  },
  originalOverlay: { 
    position: 'absolute', 
    bottom: Spacing.lg, 
    alignSelf: 'center', 
    backgroundColor: 'rgba(0,0,0,0.7)', 
    paddingHorizontal: Spacing.lg, 
    paddingVertical: Spacing.sm, 
    borderRadius: BorderRadius.full,
    zIndex: 100,
  },
  originalText: { 
    ...Typography.caption, 
    color: Colors.card 
  },
});