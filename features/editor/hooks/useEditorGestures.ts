import { useSharedValue, runOnJS, withSpring } from 'react-native-reanimated';
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
  const photoX = useSharedValue(0);
  const photoY = useSharedValue(0);
  const photoScale = useSharedValue(1);
  const photoRotation = useSharedValue(0);

  useEffect(() => {
    if (previewSize && previewSize.width > 0) {
      photoX.value = withSpring((settings.photoX - 0.5) * previewSize.width);
      photoY.value = withSpring((settings.photoY - 0.5) * previewSize.height);
      photoScale.value = withSpring(settings.photoScale);
      photoRotation.value = withSpring(settings.photoRotation);
    }
  }, [settings.photoX, settings.photoY, settings.photoScale, settings.photoRotation, previewSize]);

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      if (!previewSize || previewSize.width === 0) return;
      photoX.value = (settings.photoX - 0.5) * previewSize.width + event.translationX;
      photoY.value = (settings.photoY - 0.5) * previewSize.height + event.translationY;
    })
    .onEnd(() => {
      if (!previewSize || previewSize.width === 0) return;
      const newX = photoX.value / previewSize.width + 0.5;
      const newY = photoY.value / previewSize.height + 0.5;
      runOnJS(updateSettings)({
        photoX: Math.max(0, Math.min(1, newX)),
        photoY: Math.max(0, Math.min(1, newY))
      });
    });

  const pinchGesture = Gesture.Pinch()
    .onUpdate((event) => {
      photoScale.value = Math.max(0.1, Math.min(5, settings.photoScale * event.scale));
    })
    .onEnd(() => {
      runOnJS(updateSettings)({ photoScale: photoScale.value });
    });

  const rotateGesture = Gesture.Rotation()
    .onUpdate((event) => {
      photoRotation.value = settings.photoRotation + (event.rotation * 180 / Math.PI);
    })
    .onEnd(() => {
      runOnJS(updateSettings)({ photoRotation: photoRotation.value });
    });

  const combinedGesture = Gesture.Simultaneous(panGesture, pinchGesture, rotateGesture);

  return { photoX, photoY, photoScale, photoRotation, combinedGesture };
};