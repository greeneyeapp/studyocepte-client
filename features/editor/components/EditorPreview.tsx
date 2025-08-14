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
import { useTranslation } from 'react-i18next'; // useTranslation import edildi

interface EditorPreviewProps {
  activePhoto: ProductPhoto;
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

const isHexColor = (str: string | undefined): boolean => {
  if (typeof str !== 'string') return false;
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3}|[A-Fa-f0-9]{8})$/.test(str);
};

export const EditorPreview = forwardRef<View, EditorPreviewProps>(({
  activePhoto, selectedBackground, backgroundDisplayUri, settings, showOriginal,
  onShowOriginalChange, onLayout, updateSettings, previewSize, isCropping,
  style
}, ref) => {
  const { t } = useTranslation();
  const [isLayoutStable, setIsLayoutStable] = useState(false);
  const [stablePreviewSize, setStablePreviewSize] = useState({ width: 0, height: 0 });

  const internalRef = React.useRef<View>(null);

  useImperativeHandle(ref, () => {
    console.log(t('editor.useImperativeHandleCalledLog'), !!internalRef.current);

    if (!internalRef.current) {
      console.warn(t('editor.internalRefNullWarningLog'));
      return {
        measure: () => {},
        measureInWindow: () => {},
        measureLayout: () => {},
        setNativeProps: () => {},
        focus: () => {},
        blur: () => {},
      } as View;
    }

    return internalRef.current;
  }, [internalRef.current, t]);

  useEffect(() => {
    const isValidSize = previewSize.width > 50 && previewSize.height > 50;

    if (isValidSize) {
      const widthDiff = Math.abs(previewSize.width - stablePreviewSize.width);
      const heightDiff = Math.abs(previewSize.height - stablePreviewSize.height);

      if (!isLayoutStable || widthDiff > 10 || heightDiff > 10) {
        console.log(t('editor.layoutStabilizingLog'), {
          from: stablePreviewSize,
          to: previewSize,
          isFirstTime: !isLayoutStable
        });

        setStablePreviewSize(previewSize);
        setIsLayoutStable(true);
      }
    } else if (isLayoutStable) {
      console.warn(t('editor.invalidPreviewSizeDetectedLog'), previewSize);
      setIsLayoutStable(false);
      setStablePreviewSize({ width: 0, height: 0 });
    }
  }, [previewSize, stablePreviewSize, isLayoutStable, t]);

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
  const imageUriToShow = activePhoto?.processedImageUrl || activePhoto?.thumbnailUrl;

  const backgroundDisplayIsColor = isHexColor(backgroundDisplayUri);
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

  if (!isLayoutStable || stablePreviewSize.width === 0 || !imageUriToShow) {
    return (
      <View style={[styles.container, style]} onLayout={handleLayoutEvent}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>{t('editor.photoLoading')}</Text>
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
          {imageUriToShow ? (
            <View style={styles.imageContainer}>
              {backgroundDisplayUri && (
                <View style={styles.backgroundContainer}>
                  {backgroundDisplayIsColor ? (
                    <View style={[styles.backgroundImage, { backgroundColor: backgroundDisplayUri }, backgroundFilterStyle]} />
                  ) : (
                    <Image
                      source={{ uri: backgroundDisplayUri }}
                      style={[styles.backgroundImage, backgroundFilterStyle]}
                      resizeMode="cover"
                      onError={(e) => console.error(t('editor.backgroundLoadError'), backgroundDisplayUri, e.nativeEvent.error)}
                    />
                  )}
                  {vignetteIntensity > 0 && <SimpleVignetteOverlay intensity={vignetteIntensity} />}
                </View>
              )}

              {isLayoutStable && stablePreviewSize.width > 0 && style?.opacity !== 0 ? (
                <GestureDetector gesture={combinedGesture}>
                  <Animated.View style={[styles.productContainer, productAnimatedStyle]}>
                    <Image
                      source={{ uri: imageUriToShow }}
                      style={[styles.productImage, productFilterStyle]}
                      resizeMode="contain"
                      onError={(e) => console.error(t('editor.productImageLoadErrorEditorMode'), imageUriToShow, e.nativeEvent.error)}
                    />
                  </Animated.View>
                </GestureDetector>
              ) : (
                <Animated.View style={[styles.productContainer, productAnimatedStyle]}>
                  <Image
                    source={{ uri: imageUriToShow }}
                    style={[styles.productImage, productFilterStyle]}
                    resizeMode="contain"
                    onError={(e) => console.error(t('editor.productImageLoadErrorExportMode'), imageUriToShow, e.nativeEvent.error)}
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

              {showOriginal && style?.opacity !== 0 && (
                <View style={styles.originalOverlay}>
                  <Text style={styles.originalText}>{t('editor.original')}</Text>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.loadingText}>{t('editor.photoLoading')}</Text>
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