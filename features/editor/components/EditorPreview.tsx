// client/features/editor/components/EditorPreview.tsx (ADVANCED CSS FILTERS)
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

// Gelişmiş CSS Filter + Overlay sistemi
const generateAdvancedImageStyle = (settings: EditorSettings, prefix: 'product' | 'background', showOriginal: boolean) => {
  if (showOriginal) return { style: {}, overlays: [] };

  const getSetting = (key: string): number => {
    const fullKey = `${prefix}_${key}` as keyof EditorSettings;
    return (settings[fullKey] as number) || 0;
  };

  const brightness = getSetting('brightness');
  const contrast = getSetting('contrast');
  const saturation = getSetting('saturation');
  const vibrance = getSetting('vibrance');
  const warmth = getSetting('warmth');
  const exposure = getSetting('exposure');
  const clarity = getSetting('clarity');
  const highlights = getSetting('highlights');
  const shadows = getSetting('shadows');

  // Background özel ayarları
  let blur = 0, vignette = 0;
  if (prefix === 'background') {
    blur = getSetting('blur');
    vignette = getSetting('vignette');
  }

  // CSS Filter array
  const filters = [];
  const overlays = [];

  // 1. BRIGHTNESS + EXPOSURE
  const totalBrightness = (brightness + exposure) / 100;
  if (Math.abs(totalBrightness) > 0.01) {
    const brightnessValue = Math.max(0.1, Math.min(3, 1 + totalBrightness));
    filters.push(`brightness(${brightnessValue})`);
  }

  // 2. CONTRAST + CLARITY
  const totalContrast = (contrast + clarity * 0.5) / 100; // Clarity = düşük seviye contrast
  if (Math.abs(totalContrast) > 0.01) {
    const contrastValue = Math.max(0.1, Math.min(3, 1 + totalContrast));
    filters.push(`contrast(${contrastValue})`);
  }

  // 3. SATURATION + VIBRANCE
  const totalSaturation = (saturation + vibrance) / 100;
  if (Math.abs(totalSaturation) > 0.01) {
    const saturationValue = Math.max(0, Math.min(3, 1 + totalSaturation));
    filters.push(`saturate(${saturationValue})`);
  }

  // 4. WARMTH (Hue Rotation)
  if (Math.abs(warmth) > 0.01) {
    const hueValue = warmth * 0.6; // -60 to +60 degree range
    filters.push(`hue-rotate(${hueValue}deg)`);
  }

  // 5. HIGHLIGHTS/SHADOWS kombinasyonu
  // Highlights: Parlak alanları etkiler (brightness ile)
  // Shadows: Karanlık alanları etkiler (contrast ile simüle)
  if (Math.abs(highlights) > 0.01) {
    const highlightValue = 1 + (highlights / 150);
    filters.push(`brightness(${Math.max(0.1, highlightValue)})`);
  }
  
  if (Math.abs(shadows) > 0.01) {
    const shadowValue = 1 + (shadows / 200);
    filters.push(`contrast(${Math.max(0.1, shadowValue)})`);
  }

  // 6. BACKGROUND BLUR
  if (prefix === 'background' && blur > 0) {
    const blurValue = blur / 8; // 0-12.5px blur range
    filters.push(`blur(${blurValue}px)`);
  }

  // 7. VIGNETTE (Overlay ile)
  if (prefix === 'background' && vignette > 0) {
    overlays.push({
      type: 'vignette',
      intensity: vignette / 100, // 0-1 range
    });
  }

  const filterString = filters.length > 0 ? filters.join(' ') : 'none';
  
  console.log(`🎨 [${prefix}] CSS Filter: ${filterString}`);
  if (overlays.length > 0) {
    console.log(`🎭 [${prefix}] Overlays:`, overlays);
  }
  
  return {
    style: {
      filter: filterString,
    },
    overlays
  };
};

// Vignette Overlay bileşeni
const VignetteOverlay: React.FC<{ intensity: number }> = ({ intensity }) => {
  const vignetteStyle = useMemo(() => ({
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    // Radial gradient simülasyonu
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: intensity * 0.8,
    shadowRadius: 100,
    // İç shadow effect için border radius
    borderRadius: 20,
    // Gradient mask effect
    opacity: intensity * 0.6,
  }), [intensity]);

  // CSS Box-shadow ile vignette simülasyonu
  const innerShadowStyle = {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    // Multiple inset shadows for vignette effect
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: intensity,
    shadowRadius: 80,
    borderRadius: 1,
  };

  return (
    <>
      {/* Outer shadow */}
      <View style={vignetteStyle} pointerEvents="none" />
      {/* Inner shadow for better vignette */}
      <View 
        style={[
          innerShadowStyle,
          {
            // Vignette gradient overlay
            backgroundColor: `rgba(0,0,0,${intensity * 0.3})`,
            // Radial gradient simulation with multiple borders
            borderWidth: intensity * 20,
            borderColor: 'transparent',
            margin: -intensity * 20,
          }
        ]} 
        pointerEvents="none" 
      />
    </>
  );
};

export const EditorPreview = forwardRef<View, EditorPreviewProps>(({
  activePhoto, selectedBackground, settings, showOriginal,
  onShowOriginalChange, onLayout, updateSettings, previewSize, isCropping
}, ref) => {
  const { photoX, photoY, photoScale, combinedGesture } = useEditorGestures({ settings, previewSize, updateSettings });

  // Animated styles for transforms
  const productAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: photoX.value },
      { translateY: photoY.value },
      { scale: photoScale.value },
      { rotate: `${(settings.photoRotation || 0)}deg` },
    ],
  }));

  // Advanced CSS Filter styles
  const productFilterData = useMemo(() => 
    generateAdvancedImageStyle(settings, 'product', showOriginal), 
    [settings, showOriginal]
  );

  const backgroundFilterData = useMemo(() => 
    generateAdvancedImageStyle(settings, 'background', showOriginal), 
    [settings, showOriginal]
  );

  const imageUriToShow = activePhoto?.processedImageUrl || activePhoto?.thumbnailUrl;
  const backgroundUri = selectedBackground?.fullUrl;

  return (
    <View style={styles.container} onLayout={onLayout} ref={ref}>
      <Pressable 
        style={styles.pressable} 
        onPressIn={() => {
          console.log('👆 Show original pressed');
          onShowOriginalChange(true);
        }} 
        onPressOut={() => {
          console.log('🖐️ Show original released');
          onShowOriginalChange(false);
        }}
      >
        <View style={styles.previewWrapper}>
          {previewSize.width > 0 ? (
            <GestureDetector gesture={combinedGesture}>
              <View style={styles.imageContainer}>
                {/* Background Layer */}
                {backgroundUri && (
                  <View style={styles.backgroundContainer}>
                    <Image
                      source={{ uri: backgroundUri }}
                      style={[
                        styles.backgroundImage,
                        backgroundFilterData.style
                      ]}
                      resizeMode="cover"
                    />
                    
                    {/* Background Overlays (Vignette etc.) */}
                    {backgroundFilterData.overlays.map((overlay, index) => {
                      if (overlay.type === 'vignette') {
                        return (
                          <VignetteOverlay 
                            key={`vignette-${index}`} 
                            intensity={overlay.intensity} 
                          />
                        );
                      }
                      return null;
                    })}
                  </View>
                )}
                
                {/* Product Layer */}
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
                      productFilterData.style
                    ]}
                    resizeMode="contain"
                  />
                  
                  {/* Product Overlays (if any) */}
                  {productFilterData.overlays.map((overlay, index) => {
                    if (overlay.type === 'vignette') {
                      return (
                        <VignetteOverlay 
                          key={`product-vignette-${index}`} 
                          intensity={overlay.intensity} 
                        />
                      );
                    }
                    return null;
                  })}
                </Animated.View>
              </View>
            </GestureDetector>
          ) : (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.debugText}>Loading preview...</Text>
            </View>
          )}
          
          {/* Enhanced Debug Overlay */}
          {__DEV__ && (
            <View style={styles.debugOverlay}>
              <Text style={styles.debugText}>
                Settings: {Object.keys(settings).filter(k => Math.abs((settings as any)[k] || 0) > 0).length}
              </Text>
              <Text style={styles.debugText}>
                Brightness: {(settings as any).product_brightness || 0}
              </Text>
              <Text style={styles.debugText}>
                Vignette: {(settings as any).background_vignette || 0}
              </Text>
              <Text style={styles.debugText}>
                Product Filter: {productFilterData.style.filter !== 'none' ? '✅' : '❌'}
              </Text>
              <Text style={styles.debugText}>
                Background Filter: {backgroundFilterData.style.filter !== 'none' ? '✅' : '❌'}
              </Text>
              <Text style={styles.debugText}>
                Show Original: {showOriginal ? '✅' : '❌'}
              </Text>
            </View>
          )}
          
          {isCropping && (
            <CropOverlay 
              previewSize={previewSize} 
              aspectRatioString={settings.cropAspectRatio || 'original'} 
            />
          )}
          
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
    position: 'relative',
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
  },
  productContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  debugOverlay: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(0,0,0,0.9)',
    padding: 10,
    borderRadius: 8,
    minWidth: 250,
    maxWidth: 300,
  },
  debugText: {
    color: 'white',
    fontSize: 11,
    fontFamily: 'monospace',
    marginBottom: 3,
    lineHeight: 14,
  },
  originalOverlay: { 
    position: 'absolute', 
    bottom: Spacing.lg, 
    alignSelf: 'center', 
    backgroundColor: 'rgba(0,0,0,0.7)', 
    paddingHorizontal: Spacing.lg, 
    paddingVertical: Spacing.sm, 
    borderRadius: BorderRadius.full 
  },
  originalText: { 
    ...Typography.caption, 
    color: Colors.card 
  },
});