// client/components/Loading/AppLoading.tsx - DÖNME ANİMASYONU KALDIRILDI
import React, { useState, useImperativeHandle, forwardRef } from 'react';
import { StyleSheet, View, Image } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { Colors } from '@/constants';

export interface AppLoadingRef {
  show: () => void;
  hide: () => void;
}

const AppLoading = forwardRef<AppLoadingRef, {}>((props, ref) => {
  const [visible, setVisible] = useState(false);

  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.9);

  useImperativeHandle(ref, () => ({
    show: () => runOnJS(setVisible)(true),
    hide: () => {
      opacity.value = withTiming(0, { duration: 250 }, (isFinished) => {
        if (isFinished) runOnJS(setVisible)(false);
      });
    },
  }));

  React.useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 250 });
      // Sadece ölçeklenme animasyonunu çalıştır
      scale.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 800, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.95, { duration: 800, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }], // rotate kaldırıldı
  }));

  if (!visible) {
    return null;
  }

  return (
    <View style={styles.overlay}>
      <Animated.View style={animatedStyle}>
        <Image
          source={require('@/assets/images/icon-transparant.png')}
          style={styles.logo}
        />
      </Animated.View>
    </View>
  );
});

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10000,
  },
  logo: {
    width: 130,
    height: 130,
  },
});

export default AppLoading;