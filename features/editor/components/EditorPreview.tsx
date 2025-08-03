// features/editor/components/EditorPreview.tsx - Final Düzeltilmiş Versiyon
import React, { useState } from 'react';
import { View, Image, Pressable, Text, StyleSheet, ActivityIndicator, Dimensions } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { ProductPhoto, Background, EditorSettings } from '@/services/api';
import { Colors, BorderRadius, Spacing, Typography } from '@/constants';
import { useEditorGestures } from '../hooks/useEditorGestures';

const AnimatedImage = Animated.createAnimatedComponent(Image);

interface EditorPreviewProps {
  activePhoto: ProductPhoto;
  selectedBackground?: Background;
  settings: EditorSettings;
  showOriginal: boolean;
  onShowOriginalChange: (show: boolean) => void;
  onLayout: (event: any) => void;
  updateSettings: (newSettings: any) => void;
  previewSize: { width: number; height: number };
  isCropping: boolean;
}

export const EditorPreview: React.FC<EditorPreviewProps> = ({
  activePhoto, selectedBackground, settings, showOriginal,
  onShowOriginalChange, onLayout, updateSettings, previewSize, isCropping
}) => {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [localPreviewSize, setLocalPreviewSize] = useState({ width: 0, height: 0 });
  
  // Ekran boyutlarını fallback olarak kullan
  const screenDimensions = Dimensions.get('window');
  const fallbackSize = {
    width: screenDimensions.width - (Spacing.sm * 2),
    height: screenDimensions.height * 0.6
  };

  // Güvenli preview size - eğer width 0 ise fallback kullan
  const safePreviewSize = {
    width: previewSize.width > 0 ? previewSize.width : localPreviewSize.width > 0 ? localPreviewSize.width : fallbackSize.width,
    height: previewSize.height > 0 ? previewSize.height : localPreviewSize.height > 0 ? localPreviewSize.height : fallbackSize.height
  };
  
  const { photoX, photoY, photoScale, photoRotation, combinedGesture } = useEditorGestures({
      settings, previewSize: safePreviewSize, updateSettings
  });
  
  const imageUriToShow = activePhoto?.processedImageUrl || activePhoto?.thumbnailUrl;
  const backgroundUri = selectedBackground?.fullUrl;

  // Local layout handler
  const handleLayout = (event: any) => {
    const { width, height, x, y } = event.nativeEvent.layout;
    
    // Width 0 ise ekran genişliğinden hesapla
    if (width === 0) {
      const screenWidth = Dimensions.get('window').width;
      const calculatedWidth = screenWidth - (Spacing.sm * 4);
      setLocalPreviewSize({ width: calculatedWidth, height: height || 400 });
    } else if (width > 0 && height > 0) {
      setLocalPreviewSize({ width, height });
    }
    
    // Ana component'e de bildir
    onLayout(event);
  };

  const productAnimatedStyle = useAnimatedStyle(() => {
    // NaN kontrolü ekle
    const safeX = isNaN(photoX.value) ? 0 : photoX.value;
    const safeY = isNaN(photoY.value) ? 0 : photoY.value;
    const safeScale = isNaN(photoScale.value) ? 1 : photoScale.value;
    const safeRotation = isNaN(photoRotation.value) ? 0 : photoRotation.value;
    
    return {
      transform: [
        { translateX: safeX },
        { translateY: safeY },
        { scale: Math.max(0.1, Math.min(5, safeScale)) },
        { rotate: `${safeRotation}deg` },
      ],
    };
  }, [settings, showOriginal, photoX, photoY, photoScale, photoRotation]);

  // Görsel yükleme durumu
  if (!activePhoto) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Fotoğraf bulunamadı</Text>
        </View>
      </View>
    );
  }

  if (!imageUriToShow) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Fotoğraf işleniyor...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Pressable 
        style={styles.pressable} 
        onPressIn={() => onShowOriginalChange(true)} 
        onPressOut={() => onShowOriginalChange(false)} 
        onLayout={handleLayout}
      >
        <View style={styles.canvas}>
          {/* Arka plan katmanı */}
          {backgroundUri && (
            <Image 
              source={{ uri: backgroundUri }} 
              style={styles.fullSize} 
              resizeMode="cover"
            />
          )}

          {/* Ürün fotoğrafı katmanı */}
          <GestureDetector gesture={combinedGesture}>
            <Animated.View style={[styles.fullSize, styles.productLayerWrapper]}>
              {imageLoading && (
                <View style={styles.imageLoadingOverlay}>
                  <ActivityIndicator size="large" color={Colors.primary} />
                  <Text style={styles.loadingText}>Yükleniyor...</Text>
                </View>
              )}
              
              {imageError ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>Görsel yüklenemedi</Text>
                  <Text style={styles.errorSubtext}>Lütfen tekrar deneyin</Text>
                </View>
              ) : (
                <AnimatedImage 
                  source={{ uri: imageUriToShow }} 
                  style={[styles.productImage, productAnimatedStyle]} 
                  resizeMode="contain"
                  onLoad={() => {
                    setImageLoading(false);
                    setImageError(false);
                  }}
                  onError={() => {
                    setImageLoading(false);
                    setImageError(true);
                  }}
                />
              )}
            </Animated.View>
          </GestureDetector>
          
          {/* Kırpma modu overlay */}
          {isCropping && (
            <View style={StyleSheet.absoluteFill} pointerEvents="none" />
          )}
          
          {/* Orijinal gösterimi */}
          {showOriginal && (
            <View style={styles.originalOverlay}>
              <Text style={styles.originalText}>Orijinal</Text>
            </View>
          )}
        </View>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    width: '100%',
    alignSelf: 'stretch',
    backgroundColor: Colors.background, 
    margin: Spacing.sm, 
    borderRadius: BorderRadius.xl, 
    overflow: 'hidden' 
  },
  pressable: { 
    flex: 1,
    width: '100%',
    alignSelf: 'stretch',
    minHeight: 200
  },
  canvas: { 
    flex: 1, 
    width: '100%',
    justifyContent: 'center', 
    alignItems: 'center', 
    overflow: 'hidden', 
    backgroundColor: Colors.gray100,
    position: 'relative'
  },
  fullSize: { 
    width: '100%', 
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0
  },
  productLayerWrapper: { 
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center'
  },
  productImage: { 
    width: '100%', 
    height: '100%' 
  },
  
  // Loading ve Error durumları
  loadingContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.gray100
  },
  imageLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(249, 250, 251, 0.9)',
    zIndex: 10
  },
  loadingText: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
    textAlign: 'center'
  },
  errorContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.gray100,
    padding: Spacing.lg
  },
  errorText: {
    ...Typography.h3,
    color: Colors.error,
    textAlign: 'center',
    marginBottom: Spacing.sm
  },
  errorSubtext: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center'
  },
  
  // Orijinal overlay
  originalOverlay: { 
    position: 'absolute', 
    bottom: Spacing.xl, 
    alignSelf: 'center', 
    backgroundColor: 'rgba(0,0,0,0.7)', 
    paddingHorizontal: Spacing.lg, 
    paddingVertical: Spacing.sm, 
    borderRadius: BorderRadius.full 
  },
  originalText: { ...Typography.caption, color: Colors.card },
});