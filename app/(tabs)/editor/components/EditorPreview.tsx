// app/(tabs)/editor/components/EditorPreview.tsx - FAZ 3 GÜNCELLEMESİ (Crop Arayüzü Eklendi)
import React from 'react';
import { View, Image, Pressable, Text, StyleSheet } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
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
  isCropping: boolean; // YENİ
}

export const EditorPreview: React.FC<EditorPreviewProps> = ({
  activePhoto, selectedBackground, settings, showOriginal,
  onShowOriginalChange, onLayout, updateSettings, previewSize, isCropping
}) => {
  const { photoX, photoY, photoScale, photoRotation, combinedGesture } = useEditorGestures({
      settings, previewSize, updateSettings
  });

  const productAnimatedStyle = useAnimatedStyle(() => {
    // ... (Filtre mantığı aynı kalır)
    return {
      transform: [
        { translateX: photoX.value },
        { translateY: photoY.value },
        { scale: photoScale.value },
        { rotate: `${photoRotation.value}deg` },
      ],
    };
  }, [settings, showOriginal, photoX, photoY, photoScale, photoRotation]);

  return (
    <View style={styles.container}>
      <Pressable style={styles.pressable} onPressIn={() => onShowOriginalChange(true)} onPressOut={() => onShowOriginalChange(false)} onLayout={onLayout}>
        <View style={styles.canvas}>
          {selectedBackground && (
            <Image source={{ uri: selectedBackground.fullUrl }} style={styles.fullSize} resizeMode="cover" />
          )}

          <GestureDetector gesture={combinedGesture}>
            <Animated.View style={[styles.fullSize, styles.productLayerWrapper]}>
              <AnimatedImage source={{ uri: activePhoto.processedImageUrl }} style={[styles.productImage, productAnimatedStyle]} resizeMode="contain" />
            </Animated.View>
          </GestureDetector>
          
          {isCropping && (
            <View style={StyleSheet.absoluteFill} pointerEvents="none">
                {/* Karartılmış Alanlar */}
                <View style={[styles.overlay, { top: 0, bottom: 'auto', height: '10%' }]}/>
                <View style={[styles.overlay, { bottom: 0, top: 'auto', height: '10%' }]}/>
                <View style={[styles.overlay, { left: 0, right: 'auto', width: '10%', height: '80%', top: '10%' }]}/>
                <View style={[styles.overlay, { right: 0, left: 'auto', width: '10%', height: '80%', top: '10%' }]}/>
                
                {/* Kırpma Çerçevesi ve Izgara */}
                <View style={[styles.cropBox, { top: '10%', left: '10%', width: '80%', height: '80%' }]}>
                    <View style={styles.gridLine} />
                    <View style={styles.gridLine} />
                    <View style={[styles.gridLine, { transform: [{ rotate: '90deg' }] }]} />
                    <View style={[styles.gridLine, { transform: [{ rotate: '90deg' }] }]} />
                </View>
            </View>
          )}

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
  fullSize: { width: '100%', height: '100%' },
  productLayerWrapper: { position: 'absolute' },
  productImage: { width: '100%', height: '100%' },
  originalOverlay: { position: 'absolute', bottom: Spacing.xl, alignSelf: 'center', backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full },
  originalText: { ...Typography.caption, color: Colors.card },
  // Crop Stilleri
  overlay: { position: 'absolute', backgroundColor: 'rgba(0,0,0,0.6)' },
  cropBox: { position: 'absolute', borderWidth: 1, borderColor: 'rgba(255,255,255,0.8)', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around', alignItems: 'center' },
  gridLine: { position: 'absolute', backgroundColor: 'rgba(255,255,255,0.4)', width: '33.33%', height: 1 },
});