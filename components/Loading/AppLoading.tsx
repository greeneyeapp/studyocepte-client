// kodlar/components/Loading/AppLoading.tsx
import React, { forwardRef, useImperativeHandle, useState, useRef } from 'react';
import { Animated, StyleSheet, View, ActivityIndicator } from 'react-native';
import { Colors, Spacing } from '@/constants';
import { Layout } from '@/constants/Layout';

export interface AppLoadingRef {
  show: () => void;
  hide: () => void;
}

const AppLoading = forwardRef<AppLoadingRef, {}>(({}, ref) => {
  const [isVisible, setIsVisible] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useImperativeHandle(ref, () => ({
    show: () => {
      setIsVisible(true);
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    },
    hide: () => {
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => setIsVisible(false));
    },
  }));

  // Her zaman render et, pointerEvents ile etkileşimi engelle
  return (
    <Animated.View 
      style={[styles.overlay, { opacity: fadeAnim }]}
      pointerEvents={isVisible ? 'auto' : 'none'}
    >
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    </Animated.View>
  );
});

// ... (styles aynı kalabilir)
const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 3000,
  },
  loadingContainer: {
    backgroundColor: Colors.card,
    padding: Layout.isTablet ? Spacing.xl : Spacing.lg,
    borderRadius: 15,
  },
});

export default AppLoading;