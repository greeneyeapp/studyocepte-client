// client/components/Loading/AppLoading.tsx - GÜNCELLENDİ
import React, { forwardRef, useImperativeHandle, useState, useRef } from 'react';
import { Animated, StyleSheet, View, ActivityIndicator, Text } from 'react-native';
import { Colors, Spacing, Typography } from '@/constants';

export interface AppLoadingRef {
  show: (text?: string) => void; // Artık text alabilir
  hide: () => void;
}

const AppLoading = forwardRef<AppLoadingRef, {}>(({}, ref) => {
  const [isVisible, setIsVisible] = useState(false);
  const [text, setText] = useState<string | undefined>(undefined); // Metin için state
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useImperativeHandle(ref, () => ({
    show: (newText?: string) => {
      setText(newText);
      setIsVisible(true);
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    },
    hide: () => {
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
        setIsVisible(false);
        setText(undefined);
      });
    },
  }));

  return (
    <Animated.View 
      style={[styles.overlay, { opacity: fadeAnim }]}
      pointerEvents={isVisible ? 'auto' : 'none'}
    >
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        {text && <Text style={styles.loadingText}>{text}</Text>}
      </View>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0, 0, 0, 0.4)', justifyContent: 'center', alignItems: 'center', zIndex: 3000 },
  loadingContainer: { backgroundColor: Colors.card, padding: Spacing.xl, borderRadius: 15, alignItems: 'center' },
  loadingText: { ...Typography.body, color: Colors.textSecondary, marginTop: Spacing.md },
});

export default AppLoading;