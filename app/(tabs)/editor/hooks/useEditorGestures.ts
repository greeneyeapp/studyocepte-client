// app/(tabs)/editor/hooks/useEditorGestures.ts

import { useSharedValue, useAnimatedStyle, runOnJS, withSpring, interpolate, Extrapolate } from 'react-native-reanimated';
import { Gesture } from 'react-native-gesture-handler';
import { useEffect } from 'react';

interface EditorGesturesConfig {
  settings: any;
  previewSize: { width: number; height: number };
  updateSettings: (newSettings: any) => void;
}

export const useEditorGestures = ({
  settings,
  previewSize,
  updateSettings,
}: EditorGesturesConfig) => {
  // Shared values for photo transformation
  const photoX = useSharedValue(0);
  const photoY = useSharedValue(0);
  const photoScale = useSharedValue(1);
  const photoRotation = useSharedValue(0);

  // Update shared values when settings change
  useEffect(() => {
    if (previewSize.width > 0 && previewSize.height > 0) {
      photoX.value = withSpring((settings.photoX - 0.5) * previewSize.width);
      photoY.value = withSpring((settings.photoY - 0.5) * previewSize.height);
      photoScale.value = withSpring(settings.photoScale);
      photoRotation.value = withSpring(settings.photoRotation);
    }
  }, [settings.photoX, settings.photoY, settings.photoScale, settings.photoRotation, previewSize]);

  // Pan gesture for moving photo
  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      photoX.value = (settings.photoX - 0.5) * previewSize.width + event.translationX;
      photoY.value = (settings.photoY - 0.5) * previewSize.height + event.translationY;
    })
    .onEnd(() => {
      const newX = photoX.value / previewSize.width + 0.5;
      const newY = photoY.value / previewSize.height + 0.5;
      runOnJS(updateSettings)({ 
        photoX: Math.max(0, Math.min(1, newX)), 
        photoY: Math.max(0, Math.min(1, newY))
      });
    });

  // Pinch gesture for scaling photo
  const pinchGesture = Gesture.Pinch()
    .onUpdate((event) => {
      photoScale.value = Math.max(0.1, Math.min(5, settings.photoScale * event.scale));
    })
    .onEnd(() => {
      runOnJS(updateSettings)({ photoScale: photoScale.value });
    });

  // Rotation gesture for rotating photo
  const rotateGesture = Gesture.Rotation()
    .onUpdate((event) => {
      photoRotation.value = settings.photoRotation + (event.rotation * 180 / Math.PI);
    })
    .onEnd(() => {
      runOnJS(updateSettings)({ photoRotation: photoRotation.value });
    });

  // Combined gesture
  const combinedGesture = Gesture.Simultaneous(panGesture, pinchGesture, rotateGesture);

  // Animated style for photo with filters
  const combinedImageStyle = useAnimatedStyle(() => {
    // Brightness filter - sadece opacity etkisi
    const brightnessOpacity = interpolate(
      settings.product_brightness || 0,
      [-100, 0, 100],
      [0.3, 1, 2],
      Extrapolate.CLAMP
    );

    // Transform array'ini ayrı tut - filtreler transform'u etkilemesin
    return {
      opacity: brightnessOpacity,
      transform: [
        { translateX: photoX.value },
        { translateY: photoY.value },
        { scale: photoScale.value }, // Kontrast scale'i kaldırdık
        { rotate: `${photoRotation.value}deg` },
      ],
    };
  });

  // Reset photo position to center
  const centerPhoto = () => {
    photoX.value = withSpring(0);
    photoY.value = withSpring(0);
    photoScale.value = withSpring(1);
    photoRotation.value = withSpring(0);
    
    runOnJS(updateSettings)({
      photoX: 0.5,
      photoY: 0.5,
      photoScale: 1,
      photoRotation: 0,
    });
  };

  // Fit photo to screen
  const fitPhotoToScreen = () => {
    photoX.value = withSpring(0);
    photoY.value = withSpring(0);
    photoScale.value = withSpring(1);
    
    runOnJS(updateSettings)({
      photoX: 0.5,
      photoY: 0.5,
      photoScale: 1,
    });
  };

  // Fill screen with photo
  const fillScreenWithPhoto = () => {
    photoScale.value = withSpring(1.5);
    
    runOnJS(updateSettings)({
      photoScale: 1.5,
    });
  };

  return {
    photoX,
    photoY,
    photoScale,
    photoRotation,
    combinedGesture,
    combinedImageStyle,
    centerPhoto,
    fitPhotoToScreen,
    fillScreenWithPhoto,
  };
};