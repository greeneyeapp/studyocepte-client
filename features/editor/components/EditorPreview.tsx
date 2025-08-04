// features/editor/components/EditorPreview.tsx - CROP GÖRSELLEŞTİRME DÜZELTMESİ

import React, { forwardRef, useMemo } from 'react';
import { View, Pressable, Text, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { ProductPhoto, Background, EditorSettings } from '@/services/api';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants';
import { useEditorGestures } from '../hooks/useEditorGestures';
import { SimpleVignetteOverlay } from './VignetteOverlay';
import { generateAdvancedImageStyle } from '../utils/cssFilterGenerator';
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

export const EditorPreview = forwardRef<View, EditorPreviewProps>(({
  activePhoto, selectedBackground, settings, showOriginal,
  onShowOriginalChange, onLayout, updateSettings, previewSize, isCropping
}, ref) => {
  const { photoX, photoY, photoScale, combinedGesture } = useEditorGestures({ settings, previewSize, updateSettings });

  // Visual crop uygulanmış mı kontrol et
  const hasVisualCrop = settings.visualCrop?.isApplied;

  const productAnimatedStyle = useAnimatedStyle(() => {
    let transforms = [
      { translateX: photoX.value },
      { translateY: photoY.value },
      { scale: photoScale.value },
      { rotate: `${(settings.photoRotation || 0)}deg` },
    ];

    // Eğer visual crop uygulanmışsa crop transformasyonlarını ekle
    if (hasVisualCrop && settings.visualCrop) {
      const cropTransforms = [
        { translateX: -(settings.visualCrop.x * previewSize.width) },
        { translateY: -(settings.visualCrop.y * previewSize.height) },
        { scaleX: settings.visualCrop.width },
        { scaleY: settings.visualCrop.height },
      ];
      transforms = [...cropTransforms, ...transforms];
    }

    return { transform: transforms };
  });

  const productFilterStyle = useMemo(() => generateAdvancedImageStyle(settings, 'product', showOriginal), [settings, showOriginal]);
  const backgroundFilterStyle = useMemo(() => generateAdvancedImageStyle(settings, 'background', showOriginal), [settings, showOriginal]);
  const imageUriToShow = activePhoto?.processedImageUrl || activePhoto?.thumbnailUrl;
  const backgroundUri = selectedBackground?.fullUrl;
  const vignetteIntensity = (settings as any).background_vignette || 0;

  // Debug için console log
  console.log('🎬 EditorPreview render:', {
    isCropping,
    hasVisualCrop,
    cropAspectRatio: settings.cropAspectRatio,
    previewSize,
    hasPhoto: !!imageUriToShow,
    visualCropSettings: settings.visualCrop
  });

  // Container style - visual crop uygulanmışsa dinamik boyutlandırma
  const containerStyle = useMemo(() => {
    const baseStyle = [styles.previewWrapper];
    
    if (hasVisualCrop && settings.visualCrop && previewSize.width > 0) {
      // Crop aspect ratio'sunu hesapla
      const cropAspectRatio = (() => {
        if (settings.visualCrop!.aspectRatio === 'original') {
          return previewSize.width / previewSize.height;
        }
        const [w, h] = settings.visualCrop!.aspectRatio.split(':').map(Number);
        return w && h ? w / h : previewSize.width / previewSize.height;
      })();
      
      // Container boyutunu hesapla - ekrana sığacak şekilde
      const containerWidth = previewSize.width;
      let containerHeight = containerWidth / cropAspectRatio;
      
      // Eğer yükseklik ekranı aşıyorsa, yüksekliği sınırla ve genişliği ayarla
      const maxHeight = previewSize.height;
      if (containerHeight > maxHeight) {
        containerHeight = maxHeight;
        // containerWidth = containerHeight * cropAspectRatio; // Genişliği ayarlamaya gerek yok, center'da kalacak
      }
      
      baseStyle.push({
        height: containerHeight,
        alignSelf: 'center', // Yatayda ortala
        overflow: 'hidden' as const,
        borderWidth: 3,
        borderColor: Colors.primary,
        borderRadius: BorderRadius.lg,
      });
    }
    
    return baseStyle;
  }, [hasVisualCrop, settings.visualCrop, previewSize]);

  return (
    <View style={styles.container} onLayout={onLayout} ref={ref}>
      <Pressable 
        style={styles.pressable} 
        onPressIn={() => onShowOriginalChange(true)} 
        onPressOut={() => onShowOriginalChange(false)}
      >
        <View style={containerStyle}>
          {previewSize.width > 0 && imageUriToShow ? (
            <View style={styles.imageContainer}>
              {/* KATMAN 1: Background Layer */}
              {backgroundUri && (
                <View style={styles.backgroundContainer}>
                  <Image
                    source={{ uri: backgroundUri }}
                    style={[styles.backgroundImage, backgroundFilterStyle]}
                    resizeMode="cover"
                  />
                  {vignetteIntensity > 0 && <SimpleVignetteOverlay intensity={vignetteIntensity} />}
                </View>
              )}
              
              {/* KATMAN 2: Product Layer */}
              <GestureDetector gesture={combinedGesture}>
                <Animated.View style={[styles.productContainer, productAnimatedStyle]}>
                  <Image
                    source={{ uri: imageUriToShow }}
                    style={[styles.productImage, productFilterStyle]}
                    resizeMode="contain"
                  />
                </Animated.View>
              </GestureDetector>
              
              {/* KATMAN 3: Crop Overlay - Sadece crop modundayken göster */}
              {isCropping && previewSize.width > 0 && !hasVisualCrop && (
                <View style={styles.cropOverlayContainer} pointerEvents="none">
                  <CropOverlay 
                    previewSize={previewSize} 
                    aspectRatioString={settings.cropAspectRatio || 'original'}
                    photoScale={settings.photoScale}
                    photoX={settings.photoX}
                    photoY={settings.photoY}
                  />
                </View>
              )}
              
              {/* KATMAN 4: Visual Crop Indicator */}
              {hasVisualCrop && (
                <View style={styles.cropAppliedIndicator}>
                  <Text style={styles.cropAppliedText}>
                    ✂️ {settings.visualCrop?.aspectRatio} Kırpıldı
                  </Text>
                </View>
              )}
              
              {/* KATMAN 5: Original Indicator */}
              {showOriginal && (
                <View style={styles.originalOverlay}>
                  <Text style={styles.originalText}>Orijinal</Text>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
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
  
  // Crop overlay container
  cropOverlayContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
    backgroundColor: 'transparent',
  },
  
  // Visual crop indicator
  cropAppliedIndicator: {
    position: 'absolute',
    top: Spacing.md,
    left: Spacing.md,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    zIndex: 15,
  },
  cropAppliedText: {
    ...Typography.caption,
    color: Colors.card,
    fontWeight: '600',
  },
  
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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