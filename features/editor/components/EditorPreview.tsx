// client/features/editor/components/EditorPreview.tsx (DÜZELTİLMİŞ VERSİYON)
import React, { forwardRef, useEffect } from 'react';
import { View, Pressable, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import { useDerivedValue, useSharedValue, runOnJS } from 'react-native-reanimated';
import { Canvas, Image, useImage, Group, type SkiaView } from "@shopify/react-native-skia";
import { ProductPhoto, Background, EditorSettings } from '@/services/api';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants';
import { useEditorGestures } from '../hooks/useEditorGestures';
import { CropOverlay } from './CropOverlay';
import { getSkiaFilters } from '../utils/styleUtils';

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

export const EditorPreview = forwardRef<SkiaView, EditorPreviewProps>(({
  activePhoto, selectedBackground, settings, showOriginal,
  onShowOriginalChange, onLayout, updateSettings, previewSize, isCropping
}, ref) => {
  const { photoX, photoY, photoScale, combinedGesture } = useEditorGestures({ settings, previewSize, updateSettings });

  // ÇÖZÜM 1: Settings'i shared value'ya kopyalama işlemini optimize et
  const sharedSettings = useSharedValue(settings);
  const showOriginalShared = useSharedValue(showOriginal);
  
  useEffect(() => {
    // Sadece değiştiğinde güncelle
    if (JSON.stringify(sharedSettings.value) !== JSON.stringify(settings)) {
      sharedSettings.value = settings;
    }
  }, [settings]);

  useEffect(() => {
    showOriginalShared.value = showOriginal;
  }, [showOriginal]);

  const imageUriToShow = activePhoto?.processedImageUrl || activePhoto?.thumbnailUrl;
  const backgroundUri = selectedBackground?.fullUrl;

  const skiaProductImage = useImage(imageUriToShow);
  const skiaBackgroundImage = useImage(backgroundUri);
  
  // ÇÖZÜM 2: Transform hesaplamalarını optimize et
  const canvasTransform = useDerivedValue(() => {
    'worklet';
    const rotation = sharedSettings.value.photoRotation || 0;
    return [{ rotate: rotation * (Math.PI / 180) }];
  }, []);

  const origin = useDerivedValue(() => ({ 
    x: previewSize.width / 2, 
    y: previewSize.height / 2 
  }), [previewSize]);

  const productTransform = useDerivedValue(() => ([
    { translateX: photoX.value }, 
    { translateY: photoY.value }, 
    { scale: photoScale.value }
  ]), []);

  // ÇÖZÜM 3: Filter hesaplamalarını worklet içinde yap
  const filterProps = useDerivedValue(() => {
    'worklet';
    
    // showOriginal kontrolünü shared value'dan al
    const displayedSettings = showOriginalShared.value ? {} : sharedSettings.value;
    
    try {
      return {
        product: getSkiaFilters(displayedSettings, 'product'),
        background: getSkiaFilters(displayedSettings, 'background'),
      };
    } catch (error) {
      // Hata durumunda varsayılan değerleri döndür
      return {
        product: { imageFilter: null },
        background: { imageFilter: null },
      };
    }
  }, []);

  return (
    <View style={styles.container} onLayout={onLayout}>
      <Pressable 
        style={styles.pressable} 
        onPressIn={() => onShowOriginalChange(true)} 
        onPressOut={() => onShowOriginalChange(false)}
      >
        <View style={styles.canvasWrapper}>
          {(previewSize.width > 0 && skiaProductImage) ? (
            <GestureDetector gesture={combinedGesture}>
              <Canvas style={styles.fullSize} ref={ref}>
                <Group transform={canvasTransform} origin={origin}>
                  {skiaBackgroundImage && (
                    <Image 
                      image={skiaBackgroundImage} 
                      fit="cover" 
                      x={0} 
                      y={0} 
                      width={previewSize.width} 
                      height={previewSize.height}
                      imageFilter={filterProps.value.background.imageFilter}
                    />
                  )}
                  <Group transform={productTransform}>
                    <Image 
                      image={skiaProductImage} 
                      fit="contain" 
                      x={0} 
                      y={0} 
                      width={previewSize.width} 
                      height={previewSize.height}
                      imageFilter={filterProps.value.product.imageFilter}
                    />
                  </Group>
                </Group>
              </Canvas>
            </GestureDetector>
          ) : (
            <ActivityIndicator style={StyleSheet.absoluteFill} color={Colors.primary} />
          )}
          
          {isCropping && (
            <CropOverlay 
              previewSize={previewSize} 
              aspectRatioString={settings.cropAspectRatio || 'original'} 
            />
          )}
          
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
  canvasWrapper: { 
    flex: 1, 
    overflow: 'hidden', 
    backgroundColor: Colors.gray100, 
    borderRadius: BorderRadius.lg 
  },
  fullSize: { 
    flex: 1 
  },
  originalOverlay: { 
    position: 'absolute', 
    bottom: Spacing.lg, 
    alignSelf: 'center', 
    backgroundColor: 'rgba(0,0,0,0.7)', 
    paddingHorizontal: Spacing.lg, 
    paddingVertical: Spacing.sm, 
    borderRadius: BorderRadius.full 
  },
  originalText: { 
    ...Typography.caption, 
    color: Colors.card 
  },
});