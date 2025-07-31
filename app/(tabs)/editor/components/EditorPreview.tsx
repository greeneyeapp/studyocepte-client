import React from 'react';
import { View, Image, Pressable, Text, StyleSheet } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { ProductPhoto, Background } from '@/services/api';
import { Colors, BorderRadius, Spacing, Typography } from '@/constants';
import { useEditorGestures } from '../hooks/useEditorGestures';

const AnimatedImage = Animated.createAnimatedComponent(Image);
const AnimatedGradient = Animated.createAnimatedComponent(LinearGradient);

interface EditorPreviewProps {
  activePhoto: ProductPhoto;
  selectedBackground?: Background;
  settings: any;
  showOriginal: boolean;
  onShowOriginalChange: (show: boolean) => void;
  onLayout: (event: any) => void;
  updateSettings: (newSettings: any) => void;
  previewSize: { width: number; height: number };
}

export const EditorPreview: React.FC<EditorPreviewProps> = ({
  activePhoto,
  selectedBackground,
  settings,
  showOriginal,
  onShowOriginalChange,
  onLayout,
  updateSettings,
  previewSize,
}) => {
  const {
    photoX,
    photoY,
    photoScale,
    photoRotation,
    combinedGesture
  } = useEditorGestures({ settings, previewSize, updateSettings });

  // --- ÜRÜN FİLTRE MANTIĞI ---
  const productAnimatedStyle = useAnimatedStyle(() => {
    let opacity = 1.0;
    let tintColor = 'transparent';

    if (settings && Object.keys(settings).length > 0) {
      const prefix = 'product_';
      const brightness = settings[prefix + 'brightness'] ?? 0;
      const exposure = settings[prefix + 'exposure'] ?? 0;
      const highlights = settings[prefix + 'highlights'] ?? 0;
      const shadows = settings[prefix + 'shadows'] ?? 0;
      const contrast = settings[prefix + 'contrast'] ?? 0;
      const warmth = settings[prefix + 'warmth'] ?? 0;
      const saturation = settings[prefix + 'saturation'] ?? 0;
      
      opacity = 1.0 + (brightness / 100) + (exposure / 100) + (highlights / 200) - (shadows / 200);
      opacity = opacity * (1 + contrast / 200);

      if (warmth !== 0) {
        const amount = Math.min(0.2, Math.abs(warmth) / 500);
        tintColor = warmth > 0 ? `rgba(255, 165, 0, ${amount})` : `rgba(0, 100, 255, ${amount})`;
      } else if (saturation < 0) {
        const amount = (Math.abs(saturation) / 100) * 0.7;
        tintColor = `rgba(128, 128, 128, ${amount})`;
      }
    }

    return {
      opacity: showOriginal ? 1 : Math.max(0, Math.min(3, opacity)),
      tintColor: showOriginal ? 'transparent' : tintColor,
      transform: [
        { translateX: photoX.value },
        { translateY: photoY.value },
        { scale: photoScale.value },
        { rotate: `${photoRotation.value}deg` },
      ],
    };
  }, [settings, showOriginal, photoX, photoY, photoScale, photoRotation]);

  // --- ARKA PLAN FİLTRE MANTIĞI (EKSİK KISIM TAMAMLANDI VE DÜZELTİLDİ) ---
  const backgroundAnimatedStyle = useAnimatedStyle(() => {
    // Başlangıçta görünürlüğü garanti altına al
    let opacity = 1.0;
    let blurRadius = 0;
    let tintColor = 'transparent';

    if (settings && Object.keys(settings).length > 0) {
        const prefix = 'background_';
        const brightness = settings[prefix + 'brightness'] ?? 0;
        const exposure = settings[prefix + 'exposure'] ?? 0;
        const contrast = settings[prefix + 'contrast'] ?? 0;
        const warmth = settings[prefix + 'warmth'] ?? 0;
        const saturation = settings[prefix + 'saturation'] ?? 0;
        blurRadius = settings[prefix + 'blur'] ?? 0;

        opacity = 1.0 + (brightness / 100) + (exposure / 100);
        opacity = opacity * (1 + contrast / 200);

        if (warmth !== 0) {
            const amount = Math.min(0.2, Math.abs(warmth) / 500);
            tintColor = warmth > 0 ? `rgba(255, 165, 0, ${amount})` : `rgba(0, 100, 255, ${amount})`;
        } else if (saturation < 0) {
            const amount = (Math.abs(saturation) / 100) * 0.7;
            tintColor = `rgba(128, 128, 128, ${amount})`;
        }
    }
    
    return {
      opacity: Math.max(0.1, Math.min(2, opacity)),
      blurRadius: blurRadius,
      tintColor: tintColor,
    };
  }, [settings]);
  
  // --- Vinyet Mantığı ---
  const vignetteStyle = useAnimatedStyle(() => {
    let opacity = 0;
    if (settings && Object.keys(settings).length > 0) {
        opacity = settings.background_vignette ?? 0;
    }
    return {
      opacity: Math.max(0, Math.min(1, opacity / 100)),
    };
  }, [settings]);

  return (
    <View style={styles.container}>
      <Pressable style={styles.pressable} onPressIn={() => onShowOriginalChange(true)} onPressOut={() => onShowOriginalChange(false)} onLayout={onLayout}>
        <View style={styles.canvas}>
          {/* Arka Plan Katmanı */}
          {selectedBackground && (
            <View style={styles.backgroundLayer}>
                <AnimatedImage source={{ uri: selectedBackground.fullUrl }} style={[styles.fullSize, backgroundAnimatedStyle]} resizeMode="cover" />
                <AnimatedGradient colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.1)', 'rgba(0,0,0,0.8)']} style={[styles.fullSize, vignetteStyle]} />
            </View>
          )}

          {/* Ürün Katmanı */}
          <GestureDetector gesture={combinedGesture}>
            <Animated.View style={[styles.productLayerWrapper, productAnimatedStyle]}>
              <AnimatedImage source={{ uri: activePhoto.processedImageUrl }} style={styles.productImage} resizeMode="contain" />
            </Animated.View>
          </GestureDetector>
          
          {showOriginal && ( <View style={styles.originalOverlay}><Text style={styles.originalText}>Orijinal</Text></View> )}
        </View>
      </Pressable>
    </View>
  ); 
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, margin: Spacing.sm, borderRadius: BorderRadius.xl, overflow: 'hidden' },
  pressable: { flex: 1 },
  canvas: { flex: 1, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  backgroundLayer: { ...StyleSheet.absoluteFillObject },
  fullSize: { width: '100%', height: '100%' },
  productLayerWrapper: { 
    position: 'absolute',
    width: '80%',
    height: '80%',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  originalOverlay: { 
    position: 'absolute', 
    bottom: Spacing.xl, 
    alignSelf: 'center', 
    backgroundColor: 'rgba(0,0,0,0.7)', 
    paddingHorizontal: Spacing.lg, 
    paddingVertical: Spacing.sm, 
    borderRadius: BorderRadius.full,
    zIndex: 10,
  },
});