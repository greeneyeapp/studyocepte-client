import React, { useState, useImperativeHandle, forwardRef } from 'react';
import { StyleSheet, View, Image, Text } from 'react-native'; // Text bileşeni eklendi
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

// Props'lara isteğe bağlı 'text' özelliği eklendi
interface AppLoadingProps {
  text?: string;
}

const AppLoading = forwardRef<AppLoadingRef, AppLoadingProps>((props, ref) => {
  const { text } = props; // text prop'u ayrıştırıldı
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
    transform: [{ scale: scale.value }],
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
      {text && <Text style={styles.text}>{text}</Text>}
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
  // Metin için yeni stil eklendi
  text: {
    marginTop: 20,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary, // Veya istediğiniz başka bir renk
  },
});

export default AppLoading;