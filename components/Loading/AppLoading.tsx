import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Image } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Colors } from '@/constants';

const AnimatedImage = Animated.createAnimatedComponent(Image);

interface AppLoadingProps {
  ref?: any; // Kullanmıyoruz artık
}

const AppLoading: React.FC<AppLoadingProps> = () => {
  const logoScale = useSharedValue(1);

  useEffect(() => {
    // Logo sürekli ölçeklendirme animasyonu
    logoScale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
  }));

  return (
    <View style={styles.overlay}>
      <AnimatedImage
        source={require('@/assets/images/icon-transparant.png')}
        style={[styles.logo, logoAnimatedStyle]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(247, 247, 247, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10000, // Çok yüksek z-index
  },
  logo: {
    width: 200,
    height: 200,
  },
});

export default AppLoading;