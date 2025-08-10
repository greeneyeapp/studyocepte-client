// client/features/editor/components/EditorPreview.tsx - "KIRPILDI" BİLGİSİ KALDIRILMIŞ TAM KOD

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

  const hasVisualCrop = settings.visualCrop?.isApplied;

  const productAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: photoX.value },
      { translateY: photoY.value },
      { scale: photoScale.value },
      { rotate: `${(settings.photoRotation || 0)}deg` },
    ],
  }));

  const productFilterStyle = useMemo(() => generateAdvancedImageStyle(settings, 'product', showOriginal), [settings, showOriginal]);
  const backgroundFilterStyle = useMemo(() => generateAdvancedImageStyle(settings, 'background', showOriginal), [settings, showOriginal]);
  const imageUriToShow = activePhoto?.processedImageUrl || activePhoto?.thumbnailUrl;
  const backgroundUri = selectedBackground?.fullUrl;
  const vignetteIntensity = (settings as any).background_vignette || 0;

  const { containerStyle, contentStyle } = useMemo(() => {
    const baseContainerStyle = [styles.previewWrapper];
    let baseContentStyle: any = { ...StyleSheet.absoluteFillObject };

    if (hasVisualCrop && !isCropping && settings.visualCrop && previewSize.width > 0) {
      const crop = settings.visualCrop;
      let cropAspectRatio;
      if (!crop.aspectRatio || crop.aspectRatio === 'original') { 
        cropAspectRatio = previewSize.width / previewSize.height; 
      } else { 
        const [w, h] = crop.aspectRatio.split(':').map(Number); 
        cropAspectRatio = w && h ? w / h : previewSize.width / previewSize.height; 
      }
      
      let containerWidth = previewSize.width;
      let containerHeight = containerWidth / cropAspectRatio;
      if (containerHeight > previewSize.height) { 
        containerHeight = previewSize.height; 
        containerWidth = containerHeight * cropAspectRatio; 
      }
      
      baseContainerStyle.push({ width: containerWidth, height: containerHeight, alignSelf: 'center' });
      
      const scale = previewSize.width / (containerWidth * crop.width);
      const translateX = (-crop.x * previewSize.width) / crop.width;
      const translateY = (-crop.y * previewSize.height) / crop.width;

      baseContentStyle.transform = [{ scale }, { translateX }, { translateY }];
    }

    return { containerStyle: baseContainerStyle, contentStyle: baseContentStyle };
  }, [hasVisualCrop, isCropping, settings.visualCrop, previewSize]);

  return (
    <View style={styles.container} onLayout={onLayout}>
      <Pressable 
        style={styles.pressable} 
        onPressIn={() => onShowOriginalChange(true)} 
        onPressOut={() => onShowOriginalChange(false)}
      >
        {/* ✅ GÜNCELLEME: Ana container'a ref ekle */}
        <View style={containerStyle} ref={ref} collapsable={false}>
          {previewSize.width > 0 && imageUriToShow ? (
            <Animated.View style={contentStyle}>
              <View style={styles.imageContainer}>
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
                <GestureDetector gesture={combinedGesture}>
                  <Animated.View style={[styles.productContainer, productAnimatedStyle]}>
                    <Image 
                      source={{ uri: imageUriToShow }} 
                      style={[styles.productImage, productFilterStyle]} 
                      resizeMode="contain" 
                    />
                  </Animated.View>
                </GestureDetector>
                {isCropping && (
                  <View style={styles.cropOverlayContainer} pointerEvents="none">
                    <CropOverlay 
                      previewSize={previewSize} 
                      aspectRatioString={settings.cropAspectRatio || 'original'}
                    />
                  </View>
                )}
                {showOriginal && (
                  <View style={styles.originalOverlay}>
                    <Text style={styles.originalText}>Orijinal</Text>
                  </View>
                )}
              </View>
            </Animated.View>
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

EditorPreview.displayName = 'EditorPreview';

// Stiller aynı kalabilir, değişiklik yok.
const styles = StyleSheet.create({
  container: { flex: 1, width: '100%', backgroundColor: Colors.background, padding: Spacing.sm, justifyContent: 'center', alignItems: 'center' },
  pressable: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  previewWrapper: { overflow: 'hidden', backgroundColor: Colors.gray100, borderRadius: BorderRadius.lg, width: '100%', height: '100%' },
  imageContainer: { ...StyleSheet.absoluteFillObject },
  backgroundContainer: { ...StyleSheet.absoluteFillObject, zIndex: 1 },
  backgroundImage: { width: '100%', height: '100%' },
  productContainer: { ...StyleSheet.absoluteFillObject, zIndex: 2 },
  productImage: { width: '100%', height: '100%', backgroundColor: 'transparent' },
  cropOverlayContainer: { ...StyleSheet.absoluteFillObject, zIndex: 10 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  originalOverlay: { position: 'absolute', bottom: Spacing.lg, alignSelf: 'center', backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full, zIndex: 100 },
  originalText: { ...Typography.caption, color: Colors.card },
});