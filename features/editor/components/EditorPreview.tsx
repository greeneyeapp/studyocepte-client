// client/features/editor/components/EditorPreview.tsx - "KIRPILDI" BİLGİSİ KALDIRILMIŞ TAM KOD
// backgroundDisplayUri prop'u eklendi ve debug logları eklendi.

import React, { forwardRef, useMemo } from 'react';
import { View, Pressable, Text, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { ProductPhoto, Background, EditorSettings } from '@/services/api'; // Background tipini Api'den veya Backgrounds.ts'den import edin
import { Colors, Spacing, Typography, BorderRadius } from '@/constants';
import { useEditorGestures } from '../hooks/useEditorGestures';
import { SimpleVignetteOverlay } from './VignetteOverlay';
import { generateAdvancedImageStyle } from '../utils/cssFilterGenerator';
import { CropOverlay } from './CropOverlay';

interface EditorPreviewProps {
  activePhoto: ProductPhoto;
  selectedBackground?: Background; // Metadata için hala gerekebilir
  backgroundDisplayUri?: string; // YENİ PROP: Bu string URI olacaktır
  settings: EditorSettings;
  showOriginal: boolean;
  onShowOriginalChange: (show: boolean) => void;
  onLayout: (event: any) => void;
  updateSettings: (newSettings: Partial<EditorSettings>) => void;
  previewSize: { width: number; height: number };
  isCropping: boolean;
}

export const EditorPreview = forwardRef<View, EditorPreviewProps>(({
  activePhoto, selectedBackground, backgroundDisplayUri, settings, showOriginal, // backgroundDisplayUri'yi kullanın
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
  
  // ÖNEMLİ: Artık doğrudan selectedBackground?.fullUrl yerine backgroundDisplayUri kullanılıyor
  const backgroundUri = backgroundDisplayUri; 
  
  const vignetteIntensity = (settings as any).background_vignette || 0;

  // Debug logları: Görüntü URI'larını kontrol et
  if (__DEV__) {
    console.log('EditorPreview Render - URIs:', {
      product: imageUriToShow ? imageUriToShow.substring(0, 50) + '...' : 'N/A',
      background: backgroundUri ? backgroundUri.substring(0, 50) + '...' : 'N/A',
      showOriginal,
      previewSize,
    });
  }

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
        {/* Ana container'a ref ekle */}
        <View style={containerStyle} ref={ref} collapsable={false}>
          {/* Sadece imageUriToShow ve previewSize geçerliyse içeriği render et */}
          {previewSize.width > 0 && imageUriToShow ? (
            <Animated.View style={contentStyle}>
              <View style={styles.imageContainer}>
                {backgroundUri && ( // backgroundUri artık her zaman string olacak
                  <View style={styles.backgroundContainer}>
                    {/* Hata olasılığını azaltmak için backgroundUri boş değilse render et */}
                    <Image 
                      source={{ uri: backgroundUri }} 
                      style={[styles.backgroundImage, backgroundFilterStyle]} 
                      resizeMode="cover" 
                      onError={(e) => console.error('Background Image Load Error:', backgroundUri, e.nativeEvent.error)} // Hata yakalama
                    />
                    {vignetteIntensity > 0 && <SimpleVignetteOverlay intensity={vignetteIntensity} />}
                  </View>
                )}
                <GestureDetector gesture={combinedGesture}>
                  <Animated.View style={[styles.productContainer, productAnimatedStyle]}>
                    {/* Hata olasılığını azaltmak için imageUriToShow boş değilse render et */}
                    <Image 
                      source={{ uri: imageUriToShow }} 
                      style={[styles.productImage, productFilterStyle]} 
                      resizeMode="contain" 
                      onError={(e) => console.error('Product Image Load Error:', imageUriToShow, e.nativeEvent.error)} // Hata yakalama
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
            // URI veya boyutlar henüz hazır değilse yükleme göstergesi
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
              {!imageUriToShow && <Text style={styles.loadingText}>Görsel Yükleniyor...</Text>}
            </View>
          )}
        </View>
      </Pressable>
    </View>
  );
});

EditorPreview.displayName = 'EditorPreview';

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
  loadingText: { ...Typography.body, color: Colors.textSecondary, marginTop: Spacing.sm }, // Yeni stil
  originalOverlay: { position: 'absolute', bottom: Spacing.lg, alignSelf: 'center', backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full, zIndex: 100 },
  originalText: { ...Typography.caption, color: Colors.card },
});