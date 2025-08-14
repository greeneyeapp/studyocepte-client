// features/editor/components/EditorPreview.tsx - ÇIFT BACKGROUND VE TEXT ERROR DÜZELTİLMİŞ

import React, { forwardRef, useMemo, useState, useEffect, useImperativeHandle } from 'react';
import { View, Pressable, Text, StyleSheet, ActivityIndicator, Image, ViewStyle } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { ProductPhoto, Background, EditorSettings } from '@/services/api';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants';
import { useEditorGestures } from '../hooks/useEditorGestures';
import { SimpleVignetteOverlay } from './VignetteOverlay';
import { generateAdvancedImageStyle } from '../utils/cssFilterGenerator';
import { CropOverlay } from './CropOverlay';
import { useTranslation } from 'react-i18next';

interface EditorPreviewProps {
  activePhoto: ProductPhoto & { processedImageUrl?: string };
  selectedBackground?: Background;
  backgroundDisplayUri?: string;
  settings: EditorSettings;
  showOriginal: boolean;
  onShowOriginalChange: (show: boolean) => void;
  onLayout: (event: any) => void;
  updateSettings: (newSettings: Partial<EditorSettings>) => void;
  previewSize: { width: number; height: number };
  isCropping: boolean;
  style?: ViewStyle;
}

export const EditorPreview = forwardRef<View, EditorPreviewProps>(({
  activePhoto, selectedBackground, backgroundDisplayUri, settings, showOriginal,
  onShowOriginalChange, onLayout, updateSettings, previewSize, isCropping,
  style
}, ref) => {
  const { t } = useTranslation();
  const [isLayoutStable, setIsLayoutStable] = useState(false);
  const [stablePreviewSize, setStablePreviewSize] = useState({ width: 0, height: 0 });

  // ✅ DÜZELTME: Export için ayrı bir internal ref oluştur
  const internalRef = React.useRef<View>(null);

  // ✅ DÜZELTME: useImperativeHandle ile ref'i expose et
  useImperativeHandle(ref, () => {
    console.log('🔧 useImperativeHandle called, internalRef.current:', !!internalRef.current);

    if (!internalRef.current) {
      console.warn('⚠️ internalRef.current is null in useImperativeHandle');
      return {
        measure: () => { },
        measureInWindow: () => { },
        measureLayout: () => { },
        setNativeProps: () => { },
        focus: () => { },
        blur: () => { },
      } as View;
    }

    return internalRef.current;
  }, [internalRef.current]);

  // ✅ DÜZELTME: GÜVENLİ TRANSLATION FONKSIYONLARI
  const safeTranslate = (key: string, fallback: string = '') => {
    try {
      const translated = t(key);
      return translated && typeof translated === 'string' && translated !== key ? translated : fallback;
    } catch (error) {
      console.warn('Translation error for key:', key, error);
      return fallback;
    }
  };

  const loadingText = useMemo(() => safeTranslate('editor.previewLoading', 'Loading...'), [t]);
  const originalText = useMemo(() => safeTranslate('editor.original', 'Original'), [t]);

  // Layout stability kontrolü
  useEffect(() => {
    const isValidSize = previewSize.width > 50 && previewSize.height > 50;

    if (isValidSize) {
      const widthDiff = Math.abs(previewSize.width - stablePreviewSize.width);
      const heightDiff = Math.abs(previewSize.height - stablePreviewSize.height);

      if (!isLayoutStable || widthDiff > 10 || heightDiff > 10) {
        console.log('📐 Layout stabilizing:', {
          from: stablePreviewSize,
          to: previewSize,
          isFirstTime: !isLayoutStable
        });

        setStablePreviewSize(previewSize);
        setIsLayoutStable(true);
      }
    } else if (isLayoutStable) {
      console.warn('⚠️ Invalid preview size detected, layout unstable:', previewSize);
      setIsLayoutStable(false);
      setStablePreviewSize({ width: 0, height: 0 });
    }
  }, [previewSize, stablePreviewSize, isLayoutStable]);

  // Gesture handler'ı sadece stable layout'ta kullan
  const { photoX, photoY, photoScale, combinedGesture } = useEditorGestures({
    settings,
    previewSize: isLayoutStable && stablePreviewSize.width > 0 ? stablePreviewSize : { width: 0, height: 0 },
    updateSettings
  });

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

  // ✅ DÜZELTME: ULTRA GÜVENLİ URI KONTROLÜ
  const finalImageUri = useMemo(() => {
    const uri = activePhoto?.processedImageUrl || activePhoto?.thumbnailUri;

    if (!uri) {
      console.warn('⚠️ No image URI available');
      return undefined;
    }

    if (typeof uri !== 'string') {
      console.warn('⚠️ Image URI is not a string:', typeof uri, uri);
      return undefined;
    }

    if (uri.trim() === '' || uri === 'null' || uri === 'undefined') {
      console.warn('⚠️ Invalid image URI:', uri);
      return undefined;
    }

    console.log('✅ Valid image URI:', uri);
    return uri;
  }, [activePhoto?.processedImageUrl, activePhoto?.thumbnailUri]);

  // ✅ DÜZELTME: ULTRA GÜVENLİ BACKGROUND URI KONTROLÜ
  const finalBackgroundUri = useMemo(() => {
    // Settings'te background none ise hiç background gösterme
    if (settings.backgroundId === 'none') {
      console.log('🎨 Background ID is none, not showing any background');
      return undefined;
    }

    // Normal background logic
    if (backgroundDisplayUri && backgroundDisplayUri.length > 0) {
      return backgroundDisplayUri;
    }

    if (selectedBackground?.thumbnailUrl && !backgroundDisplayUri) {
      return selectedBackground.thumbnailUrl;
    }

    return undefined;
  }, [backgroundDisplayUri, selectedBackground, settings.backgroundId]); // ← Bu dependency'yi ekle

  const vignetteIntensity = (settings as any).background_vignette || 0;

  const handleLayoutEvent = (event: any) => {
    const { width, height } = event.nativeEvent.layout;

    if (width > 50 && height > 50) {
      onLayout(event);
    }
  };

  const visualCropAnimatedStyle = useAnimatedStyle(() => {
    if (hasVisualCrop && !isCropping && settings.visualCrop && isLayoutStable && stablePreviewSize.width > 0) {
      const crop = settings.visualCrop;
      let cropAspectRatio;
      if (!crop.aspectRatio || crop.aspectRatio === 'original') {
        cropAspectRatio = stablePreviewSize.width / stablePreviewSize.height;
      } else {
        const [w, h] = crop.aspectRatio.split(':').map(Number);
        cropAspectRatio = w && h ? w / h : stablePreviewSize.width / stablePreviewSize.height;
      }

      let containerWidth = stablePreviewSize.width;
      let containerHeight = containerWidth / cropAspectRatio;
      if (containerHeight > stablePreviewSize.height) {
        containerHeight = stablePreviewSize.height;
        containerWidth = containerHeight * cropAspectRatio;
      }

      const scale = stablePreviewSize.width / (containerWidth * crop.width);
      const translateX = (-crop.x * stablePreviewSize.width) / crop.width;
      const translateY = (-crop.y * stablePreviewSize.height) / crop.width;

      return {
        transform: [{ scale }, { translateX }, { translateY }],
      };
    }
    return { transform: [{ scale: 1 }, { translateX: 0 }, { translateY: 0 }] };
  });

  // Layout stable değilse veya görsel yoksa loading göster
  if (!isLayoutStable || stablePreviewSize.width === 0 || !finalImageUri) {
    return (
      <View style={[styles.container, style]} onLayout={handleLayoutEvent}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          {loadingText ? <Text style={styles.loadingText}>{loadingText}</Text> : null}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]} onLayout={handleLayoutEvent}>
      <Pressable
        style={styles.pressable}
        onPressIn={() => onShowOriginalChange(true)}
        onPressOut={() => onShowOriginalChange(false)}
      >
        <Animated.View
          style={[styles.previewWrapper, visualCropAnimatedStyle]}
          ref={internalRef}
          collapsable={false}
          pointerEvents={style?.opacity === 0 ? 'none' : 'auto'}
        >
          {finalImageUri ? (
            <View style={styles.imageContainer}>
              {/* ✅ DÜZELTME: Sadece geçerli background URI varsa render et */}
              {finalBackgroundUri && typeof finalBackgroundUri === 'string' && (
                <View style={styles.backgroundContainer}>
                  <Image
                    source={{ uri: finalBackgroundUri }}
                    style={[styles.backgroundImage, backgroundFilterStyle]}
                    resizeMode="cover"
                    onError={(e) => {
                      console.error('Background Image Load Error:', finalBackgroundUri, e.nativeEvent.error);
                    }}
                    onLoad={() => {
                      console.log('✅ Background image loaded successfully:', finalBackgroundUri);
                    }}
                  />
                  {vignetteIntensity > 0 && <SimpleVignetteOverlay intensity={vignetteIntensity} />}
                </View>
              )}

              {/* Export modunda gesture'ları devre dışı bırak ama görsel'i göster */}
              {isLayoutStable && stablePreviewSize.width > 0 && style?.opacity !== 0 ? (
                <GestureDetector gesture={combinedGesture}>
                  <Animated.View style={[styles.productContainer, productAnimatedStyle]}>
                    <Image
                      source={{ uri: finalImageUri }}
                      style={[styles.productImage, productFilterStyle]}
                      resizeMode="contain"
                      onError={(e) => {
                        console.error('Product Image Load Error:', finalImageUri, e.nativeEvent.error);
                      }}
                      onLoad={() => {
                        console.log('✅ Product image loaded successfully:', finalImageUri);
                      }}
                    />
                  </Animated.View>
                </GestureDetector>
              ) : (
                <Animated.View style={[styles.productContainer, productAnimatedStyle]}>
                  <Image
                    source={{ uri: finalImageUri }}
                    style={[styles.productImage, productFilterStyle]}
                    resizeMode="contain"
                    onError={(e) => {
                      console.error('Product Image Load Error (export mode):', finalImageUri, e.nativeEvent.error);
                    }}
                    onLoad={() => {
                      console.log('✅ Product image loaded successfully (export mode):', finalImageUri);
                    }}
                  />
                </Animated.View>
              )}

              {isCropping && style?.opacity !== 0 && (
                <View style={styles.cropOverlayContainer} pointerEvents="none">
                  <CropOverlay
                    previewSize={stablePreviewSize}
                    aspectRatioString={settings.cropAspectRatio || 'original'}
                  />
                </View>
              )}

              {/* ✅ DÜZELTME: GÜVENLİ TEXT RENDERING */}
              {showOriginal && style?.opacity !== 0 && originalText && (
                <View style={styles.originalOverlay}>
                  <Text style={styles.originalText}>{originalText}</Text>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
              {loadingText ? <Text style={styles.loadingText}>{loadingText}</Text> : null}
            </View>
          )}
        </Animated.View>
      </Pressable>
    </View>
  );
});

EditorPreview.displayName = 'EditorPreview';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    backgroundColor: Colors.background,
    padding: Spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pressable: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewWrapper: {
    overflow: 'hidden',
    backgroundColor: Colors.gray100,
    borderRadius: BorderRadius.lg,
    width: '100%',
    height: '100%',
  },
  imageContainer: { ...StyleSheet.absoluteFillObject },
  backgroundContainer: { ...StyleSheet.absoluteFillObject, zIndex: 1 },
  backgroundImage: { width: '100%', height: '100%' },
  productContainer: { ...StyleSheet.absoluteFillObject, zIndex: 2 },
  productImage: { width: '100%', height: '100%', backgroundColor: 'transparent' },
  cropOverlayContainer: { ...StyleSheet.absoluteFillObject, zIndex: 10 },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    textAlign: 'center'
  },
  originalOverlay: {
    position: 'absolute',
    bottom: Spacing.lg,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    zIndex: 100
  },
  originalText: { ...Typography.caption, color: Colors.card },
});