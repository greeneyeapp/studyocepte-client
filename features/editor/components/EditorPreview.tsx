// features/editor/components/EditorPreview.tsx - LAYOUT SORUNU DÜZELTİLMİŞ
import React, { forwardRef, useMemo, useState, useEffect } from 'react';
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
  backgroundDisplayUri?: string;
  settings: EditorSettings;
  showOriginal: boolean;
  onShowOriginalChange: (show: boolean) => void;
  onLayout: (event: any) => void;
  updateSettings: (newSettings: Partial<EditorSettings>) => void;
  previewSize: { width: number; height: number };
  isCropping: boolean;
}

export const EditorPreview = forwardRef<View, EditorPreviewProps>(({
  activePhoto, selectedBackground, backgroundDisplayUri, settings, showOriginal,
  onShowOriginalChange, onLayout, updateSettings, previewSize, isCropping
}, ref) => {
  const [isLayoutStable, setIsLayoutStable] = useState(false);
  const [stablePreviewSize, setStablePreviewSize] = useState({ width: 0, height: 0 });

  // ✅ DÜZELTME: Layout stability kontrolü
  useEffect(() => {
    // Preview size'ın geçerli olup olmadığını kontrol et
    const isValidSize = previewSize.width > 50 && previewSize.height > 50;
    
    if (isValidSize) {
      // Eğer layout stable değilse veya boyut önemli ölçüde değiştiyse güncelle
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
      // Geçersiz boyut gelirse layout'u unstable yap
      console.warn('⚠️ Invalid preview size detected, layout unstable:', previewSize);
      setIsLayoutStable(false);
    }
  }, [previewSize, stablePreviewSize, isLayoutStable]);

  // ✅ DÜZELTME: Gesture handler'ı sadece stable layout'ta kullan
  const { photoX, photoY, photoScale, combinedGesture } = useEditorGestures({ 
    settings, 
    previewSize: stablePreviewSize, // Stable size kullan
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
  
  const backgroundUri = backgroundDisplayUri; 
  const vignetteIntensity = (settings as any).background_vignette || 0;

  // ✅ DÜZELTME: Enhanced layout event handler
  const handleLayoutEvent = (event: any) => {
    const { width, height } = event.nativeEvent.layout;
    
    // ✅ DÜZELTME: Layout event'ini sadece geçerli boyutlar için tetikle
    if (width > 50 && height > 50) {
      console.log('📐 EditorPreview layout event:', { width, height });
      onLayout(event);
    } else {
      console.warn('⚠️ Invalid layout event ignored:', { width, height });
    }
  };

  // Debug logları
  if (__DEV__) {
    console.log('EditorPreview Render - URIs:', {
      product: imageUriToShow ? imageUriToShow.substring(0, 50) + '...' : 'N/A',
      background: backgroundUri ? backgroundUri.substring(0, 50) + '...' : 'N/A',
      showOriginal,
      previewSize,
      stablePreviewSize,
      isLayoutStable,
      // ✅ DÜZELTME: Daha detaylı background debug
      backgroundConfig: selectedBackground ? selectedBackground.name : 'NO_CONFIG',
      backgroundDisplayUri: backgroundDisplayUri ? 'PROVIDED' : 'NOT_PROVIDED'
    });
  }

  const { containerStyle, contentStyle } = useMemo(() => {
    const baseContainerStyle = [styles.previewWrapper];
    let baseContentStyle: any = { ...StyleSheet.absoluteFillObject };

    // ✅ DÜZELTME: Sadece layout stable ise crop hesaplaması yap
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
      
      baseContainerStyle.push({ width: containerWidth, height: containerHeight, alignSelf: 'center' });
      
      const scale = stablePreviewSize.width / (containerWidth * crop.width);
      const translateX = (-crop.x * stablePreviewSize.width) / crop.width;
      const translateY = (-crop.y * stablePreviewSize.height) / crop.width;

      baseContentStyle.transform = [{ scale }, { translateX }, { translateY }];
    }

    return { containerStyle: baseContainerStyle, contentStyle: baseContentStyle };
  }, [hasVisualCrop, isCropping, settings.visualCrop, stablePreviewSize, isLayoutStable]);

  // ✅ DÜZELTME: Layout stable değilse loading göster
  if (!isLayoutStable || stablePreviewSize.width === 0) {
    return (
      <View style={styles.container} onLayout={handleLayoutEvent}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Düzenleyici Hazırlanıyor...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container} onLayout={handleLayoutEvent}>
      <Pressable 
        style={styles.pressable} 
        onPressIn={() => onShowOriginalChange(true)} 
        onPressOut={() => onShowOriginalChange(false)}
      >
        <View style={containerStyle} ref={ref} collapsable={false}>
          {/* Sadece imageUriToShow ve layout stable ise içeriği render et */}
          {imageUriToShow ? (
            <Animated.View style={contentStyle}>
              <View style={styles.imageContainer}>
                {backgroundUri && (
                  <View style={styles.backgroundContainer}>
                    <Image 
                      source={{ uri: backgroundUri }} 
                      style={[styles.backgroundImage, backgroundFilterStyle]} 
                      resizeMode="cover" 
                      onError={(e) => console.error('Background Image Load Error:', backgroundUri, e.nativeEvent.error)}
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
                      onError={(e) => console.error('Product Image Load Error:', imageUriToShow, e.nativeEvent.error)}
                    />
                  </Animated.View>
                </GestureDetector>
                {isCropping && (
                  <View style={styles.cropOverlayContainer} pointerEvents="none">
                    <CropOverlay 
                      previewSize={stablePreviewSize} 
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
              <Text style={styles.loadingText}>Görsel Yükleniyor...</Text>
            </View>
          )}
        </View>
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
    minHeight: 300 // ✅ DÜZELTME: Daha yüksek minimum garanti et
  },
  pressable: { 
    width: '100%', 
    height: '100%', 
    justifyContent: 'center', 
    alignItems: 'center',
    minHeight: 300 // ✅ DÜZELTME: Daha yüksek minimum
  },
  previewWrapper: { 
    overflow: 'hidden', 
    backgroundColor: Colors.gray100, 
    borderRadius: BorderRadius.lg, 
    width: '100%', 
    height: '100%',
    minHeight: 300 // ✅ DÜZELTME: Daha yüksek minimum
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
    minHeight: 300 // ✅ DÜZELTME: Daha yüksek minimum
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