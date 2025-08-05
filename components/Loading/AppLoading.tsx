import React, { forwardRef, useImperativeHandle, useState, useEffect } from 'react';
import { StyleSheet, View, Image } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { Colors } from '@/constants';

export interface AppLoadingRef {
  show: () => void;
  hide: () => void;
}

const AnimatedImage = Animated.createAnimatedComponent(Image);

const AppLoading = forwardRef<AppLoadingRef, {}>(({}, ref) => {
  const [isVisible, setIsVisible] = useState(false);
  const overlayFade = useSharedValue(0);
  const logoScale = useSharedValue(1); // Sadece ölçeklendirme için shared value

  useEffect(() => {
    // Sadece ölçeklendirme (büyüyüp küçülme) animasyonu
    logoScale.value = withRepeat(
      withSequence(
        // 1 saniyede %10 büyüsün
        withTiming(1.1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        // 1 saniyede eski boyutuna dönsün
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
      ),
      -1, // Sonsuz tekrar
      true // Geriye doğru tekrarla (büyü -> küçül -> büyü...)
    );
  }, []);

  const onHideComplete = () => {
    setIsVisible(false);
  };

  useImperativeHandle(ref, () => ({
    show: () => {
      setIsVisible(true);
      overlayFade.value = withTiming(1, { duration: 300 });
    },
    hide: () => {
      overlayFade.value = withTiming(0, { duration: 200 }, (isFinished) => {
        if (isFinished) {
          runOnJS(onHideComplete)();
        }
      });
    },
  }));

  const overlayAnimatedStyle = useAnimatedStyle(() => ({
    opacity: overlayFade.value,
  }));

  // Animasyonlu stil artık sadece 'transform' içeriyor, 'opacity' yok.
  const logoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
  }));

  if (!isVisible) {
    return null;
  }

  return (
    <Animated.View style={[styles.overlay, overlayAnimatedStyle]}>
      <AnimatedImage
        // DEĞİŞİKLİK: icon-transparant.png kullanılıyor
        source={require('@/assets/images/icon-transparant.png')}
        style={[styles.logo, logoAnimatedStyle]}
      />
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(247, 247, 247, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  logo: {
    // DEĞİŞİKLİK: Logo boyutu büyütüldü
    width: 200,
    height: 200,
  },
});

export default AppLoading;