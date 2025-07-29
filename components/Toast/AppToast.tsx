// kodlar/components/Toast/AppToast.tsx
import React, { forwardRef, useImperativeHandle, useState, useRef } from 'react';
import { Animated, StyleSheet, Text, View, Easing } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants';
import { Feather } from '@expo/vector-icons';
import { Layout } from '@/constants/Layout';

type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastProps {
  type: ToastType;
  text1: string;
  text2?: string;
  duration?: number;
}

export interface AppToastRef {
  show: (props: ToastProps) => void;
  hide: () => void;
}

const AppToast = forwardRef<AppToastRef, {}>(({ }, ref) => {
  const [toastProps, setToastProps] = useState<ToastProps | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-150)).current;
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleHide = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: -150, duration: 300, easing: Easing.in(Easing.ease), useNativeDriver: true }),
    ]).start(() => setToastProps(null));
  };

  useImperativeHandle(ref, () => ({
    show: (props) => {
      // Clear any existing timeout
      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      setToastProps(props);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 300, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      ]).start();

      timeoutRef.current = setTimeout(handleHide, props.duration || 3000);
    },
    hide: handleHide,
  }));

  if (!toastProps) {
    return null; // Toast için null dönmek sorun teşkil etmez, anlık bir bileşendir. Ama diğerleri gibi yapalım.
  }

  return (
    <View style={styles.wrapper} pointerEvents="none">
      {toastProps && (
        <Animated.View
          style={[styles.toastContainer, { backgroundColor: typeStyles[toastProps.type].backgroundColor }, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
        >
          <Feather name={typeStyles[toastProps.type].icon} size={Layout.isTablet ? 28 : 20} color={Colors.card} style={styles.toastIcon} />
          <View style={styles.textContainer}>
            <Text style={[styles.text1, { color: Colors.card }]}>{toastProps.text1}</Text>
            {toastProps.text2 && <Text style={[styles.text2, { color: Colors.card }]}>{toastProps.text2}</Text>}
          </View>
        </Animated.View>
      )}
    </View>
  );
});

const typeStyles = {
  success: { backgroundColor: Colors.success, icon: 'check-circle' as const },
  error: { backgroundColor: Colors.error, icon: 'x-circle' as const },
  info: { backgroundColor: Colors.primary, icon: 'info' as const },
  warning: { backgroundColor: Colors.warning, icon: 'alert-triangle' as const },
};

// ... (styles aynı kalabilir)
const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 9999,
  },
  toastContainer: {
    width: '90%',
    maxWidth: Layout.isTablet ? 500 : undefined,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 8,
  },
  toastIcon: { marginRight: Spacing.md },
  textContainer: { flex: 1 },
  text1: { ...Typography.bodyMedium },
  text2: { ...Typography.caption, marginTop: Spacing.xs / 2, },
});


export default AppToast;