// client/features/editor/components/EditorPreview.tsx (ÜRÜ N GÖRÜNÜRLÜK SORUNU DÜZELTİLDİ)
import React, { forwardRef, useMemo } from 'react';
import { View, Pressable, Text, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { ProductPhoto, Background, EditorSettings } from '@/services/api';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants';
import { useEditorGestures } from '../hooks/useEditorGestures';
import { CropOverlay } from './CropOverlay';

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

// CSS Filter generator - sadeleştirilmiş versiyon
const generateImageStyle = (settings: EditorSettings, prefix: 'product' | 'background', showOriginal: boolean) => {
  if (showOriginal) return { filter: 'none' };

  const getSetting = (key: string): number => {
    const fullKey = `${prefix}_${key}` as keyof EditorSettings;
    return (settings[fullKey] as number) || 0;
  };

  const filters = [];
  
  // Temel ayarlar
  const brightness = getSetting('brightness') + getSetting('exposure') * 0.8;
  const contrast = getSetting('contrast') + getSetting('clarity') * 0.5;
  const saturation = getSetting('saturation') + getSetting('vibrance') * 0.7;
  const warmth = getSetting('warmth');

  if (Math.abs(brightness) > 1) {
    filters.push(`brightness(${Math.max(0.1, 1 + brightness / 100)})`);
  }
  
  if (Math.abs(contrast) > 1) {
    filters.push(`contrast(${Math.max(0.1, 1 + contrast / 100)})`);
  }
  
  if (Math.abs(saturation) > 1) {
    filters.push(`saturate(${Math.max(0, 1 + saturation / 100)})`);
  }
  
  if (Math.abs(warmth) > 1) {
    filters.push(`hue-rotate(${warmth * 0.4}deg)`);
  }

  // Background özel efektler
  if (prefix === 'background') {
    const blur = getSetting('blur');
    if (blur > 0) {
      filters.push(`blur(${blur / 5}px)`);
    }
  }

  return {
    filter: filters.length > 0 ? filters.join(' ') : 'none'
  };
};

// Basitleştirilmiş Vignette Overlay
const VignetteOverlay: React.FC<{ intensity: number }> = ({ intensity }) => {
  if (intensity <= 0) return null;

  return (
    <View 
      style={[
        StyleSheet.absoluteFillObject,
        {
          backgroundColor: 'transparent',
          borderWidth: intensity * 20,
          borderColor: `rgba(0,0,0,${Math.min(0.7, intensity * 0.8)})`,
          margin: -intensity * 20,
          borderRadius: 1,
        }
      ]} 
      pointerEvents="none"
    />
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

  // Filter stilleri
  const productFilterStyle = useMemo(() => 
    generateImageStyle(settings, 'product', showOriginal), 
    [settings, showOriginal]
  );

  const backgroundFilterStyle = useMemo(() => 
    generateImageStyle(settings, 'background', showOriginal), 
    [settings, showOriginal]
  );

  // Image URI'ları
  const imageUriToShow = activePhoto?.processedImageUrl || activePhoto?.thumbnailUrl;
  const backgroundUri = selectedBackground?.fullUrl;

  // Vignette intensity
  const vignetteIntensity = ((settings as any).background_vignette || 0) / 100;

  console.log('🖼️ EditorPreview render:', {
    imageUri: imageUriToShow,
    backgroundUri,
    previewSize,
    productFilter: productFilterStyle.filter,
    backgroundFilter: backgroundFilterStyle.filter,
    vignetteIntensity
  });

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
                      backgroundFilterStyle
                    ]}
                    resizeMode="cover"
                  />
                  
                  {/* Background Vignette */}
                  {vignetteIntensity > 0 && (
                    <VignetteOverlay intensity={vignetteIntensity} />
                  )}
                </View>
              )}
              
              {/* KATMAN 2: Product Layer - Bu kısım düzeltildi */}
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
                      productFilterStyle
                    ]}
                    resizeMode="contain"
                    onError={(error) => {
                      console.error('❌ Product image load error:', error.nativeEvent.error);
                    }}
                    onLoad={() => {
                      console.log('✅ Product image loaded successfully');
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
          
          {/* Debug Overlay - Genişletildi */}
          {__DEV__ && (
            <View style={styles.debugOverlay}>
              <Text style={styles.debugText}>Image URI: {imageUriToShow ? '✅' : '❌'}</Text>
              <Text style={styles.debugText}>Background URI: {backgroundUri ? '✅' : '❌'}</Text>
              <Text style={styles.debugText}>Preview Size: {previewSize.width}x{previewSize.height}</Text>
              <Text style={styles.debugText}>Product Brightness: {(settings as any).product_brightness || 0}</Text>
              <Text style={styles.debugText}>Background Vignette: {(settings as any).background_vignette || 0}</Text>
              <Text style={styles.debugText}>Photo Scale: {settings.photoScale || 1}</Text>
              <Text style={styles.debugText}>Photo Position: {settings.photoX || 0.5}, {settings.photoY || 0.5}</Text>
              <Text style={styles.debugText}>Show Original: {showOriginal ? '✅' : '❌'}</Text>
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
    zIndex: 1, // Background en altta
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
  },
  productContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2, // Product en üstte
    // Padding ekleyerek ürünün kenarlardan uzak durmasını sağla
    padding: Spacing.md,
  },
  productImage: {
    width: '100%',
    height: '100%',
    // Görünürlük sorunlarını önlemek için
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
    backgroundColor: 'rgba(0,0,0,0.9)',
    padding: 8,
    borderRadius: 6,
    maxWidth: 280,
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