import React, { useState, useImperativeHandle, forwardRef } from 'react';
import { StyleSheet, View, Image, Text } from 'react-native';
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
import { useTranslation } from 'react-i18next'; // useTranslation import edildi

export interface AppLoadingRef {
  show: (options?: { text?: string }) => void; // Options eklendi
  hide: () => void;
}

interface AppLoadingProps {
  // text prop kaldırıldı, çünkü show metodundan gelecek
}

const AppLoading = forwardRef<AppLoadingRef, AppLoadingProps>((props, ref) => {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const [displayText, setDisplayText] = useState<string | undefined>(undefined); // Yeni state

  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.9);

  useImperativeHandle(ref, () => ({
    show: (options) => {
      runOnJS(setDisplayText)(options?.text || t('common.loading')); // Varsayılan metin
      runOnJS(setVisible)(true);
    },
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
          source={require('@/assets/images/icon-transparent.png')}
          style={styles.logo}
        />
      </Animated.View>
      {displayText && <Text style={styles.text}>{displayText}</Text>}
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
  text: {
    marginTop: 20,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
});

export default AppLoading;