// features/editor/components/EditorPreview.tsx - HATA GİDERİLMİŞ VE GÜNCELLENMİŞ VERSİYON

import React, { forwardRef, useMemo } from 'react';
import { View, Pressable, Text, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { ProductPhoto, Background, EditorSettings } from '@/services/api';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants';
import { useEditorGestures } from '../hooks/useEditorGestures';
import { SimpleVignetteOverlay } from './VignetteOverlay';
import { generateAdvancedImageStyle } from '../utils/cssFilterGenerator';
import { CropOverlay } from './CropOverlay'; // HATA DÜZELTİLDİ: CropOverlay bileşeni import edildi.

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

  const productAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: photoX.value },
      { translateY: photoY.value },
      { scale: photoScale.value },
      { rotate: `${(settings.photoRotation || 0)}deg` },
    ],
  }));

  const productFilterStyle = useMemo(() => 
    generateAdvancedImageStyle(settings, 'product', showOriginal), 
    [settings, showOriginal]
  );

  const backgroundFilterStyle = useMemo(() => 
    generateAdvancedImageStyle(settings, 'background', showOriginal), 
    [settings, showOriginal]
  );

  const imageUriToShow = activePhoto?.processedImageUrl || activePhoto?.thumbnailUrl;
  const backgroundUri = selectedBackground?.fullUrl;
  const vignetteIntensity = ((settings as any).background_vignette || 0);

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
                  {vignetteIntensity > 0 && (
                    <SimpleVignetteOverlay intensity={vignetteIntensity} />
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
                      productFilterStyle
                    ]}
                    resizeMode="contain"
                  />
                </Animated.View>
              </GestureDetector>
            </View>
          ) : (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
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