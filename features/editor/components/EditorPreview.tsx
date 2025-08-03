// features/editor/components/EditorPreview.tsx - NİHAİ VE ÇALIŞAN SÜRÜM
import React from 'react';
import { View, Image, Pressable, Text, StyleSheet } from 'react-native';
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
  const { photoX, photoY, photoScale, photoRotation, combinedGesture } = useEditorGestures({
      settings, previewSize, updateSettings
  });
  
  const imageUriToShow = activePhoto.processedImageUrl;

  const productAnimatedStyle = useAnimatedStyle(() => {
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
      <Pressable 
        style={styles.pressable} 
        onPressIn={() => onShowOriginalChange(true)} 
        onPressOut={() => onShowOriginalChange(false)} 
        onLayout={onLayout}
      >
        <View style={styles.canvas}>
          {selectedBackground && (
            <Image 
                source={{ uri: selectedBackground.fullUrl }} 
                style={styles.fullSize} 
                resizeMode="cover" 
            />
          )}

          <GestureDetector gesture={combinedGesture}>
            <Animated.View style={[styles.fullSize, styles.productLayerWrapper]}>
              {imageUriToShow ? (
                <AnimatedImage 
                    source={{ uri: imageUriToShow }} 
                    style={[styles.productImage, productAnimatedStyle]} 
                    resizeMode="contain" 
                />
              ) : (
                <View style={styles.placeholder}>
                  <Text style={styles.placeholderText}>Görsel Bekleniyor...</Text>
                </View>
              )}
            </Animated.View>
          </GestureDetector>
          
          {isCropping && ( <View style={StyleSheet.absoluteFill} pointerEvents="none" /> )}
          {showOriginal && ( <View style={styles.originalOverlay}><Text style={styles.originalText}>Orijinal</Text></View> )}
        </View>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, margin: Spacing.sm, borderRadius: BorderRadius.xl, overflow: 'hidden' },
  pressable: { flex: 1 },
  canvas: { flex: 1, justifyContent: 'center', alignItems: 'center', overflow: 'hidden', backgroundColor: Colors.gray100 },
  fullSize: { width: '100%', height: '100%' },
  productLayerWrapper: { position: 'absolute' },
  productImage: { width: '100%', height: '100%' },
  originalOverlay: { position: 'absolute', bottom: Spacing.xl, alignSelf: 'center', backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full },
  originalText: { ...Typography.caption, color: Colors.card },
  placeholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  placeholderText: { ...Typography.body, color: Colors.textSecondary },
});