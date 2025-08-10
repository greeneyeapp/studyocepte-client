// components/Toast/AppToast.tsx - YENİ TEK METİN TASARIMI
import React, { forwardRef, useImperativeHandle, useState, useRef } from 'react';
import { Animated, StyleSheet, Text, View, Easing } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants';

type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastProps {
  type: ToastType;
  text: string; // Artık sadece tek metin
  duration?: number;
}

export interface AppToastRef {
  show: (props: ToastProps) => void;
  hide: () => void;
}

const AppToast = forwardRef<AppToastRef, {}>(({ }, ref) => {
  const [toastProps, setToastProps] = useState<ToastProps | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleHide = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, { 
        toValue: 0, 
        duration: 250, 
        easing: Easing.in(Easing.ease),
        useNativeDriver: true 
      }),
      Animated.timing(scaleAnim, { 
        toValue: 0.8, 
        duration: 250, 
        easing: Easing.in(Easing.ease),
        useNativeDriver: true 
      }),
    ]).start(() => setToastProps(null));
  };

  useImperativeHandle(ref, () => ({
    show: (props) => {
      // Mevcut toast'ı temizle
      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      setToastProps(props);
      
      // Giriş animasyonu
      Animated.parallel([
        Animated.timing(fadeAnim, { 
          toValue: 1, 
          duration: 300, 
          easing: Easing.out(Easing.ease),
          useNativeDriver: true 
        }),
        Animated.spring(scaleAnim, { 
          toValue: 1, 
          friction: 8, 
          tension: 100,
          useNativeDriver: true 
        }),
      ]).start();

      // Otomatik gizleme
      timeoutRef.current = setTimeout(handleHide, props.duration || 3000);
    },
    hide: handleHide,
  }));

  if (!toastProps) {
    return null;
  }

  const getToastStyle = (type: ToastType) => {
    switch (type) {
      case 'success':
        return {
          backgroundColor: Colors.success,
        };
      case 'error':
        return {
          backgroundColor: Colors.error,
        };
      case 'warning':
        return {
          backgroundColor: Colors.warning,
        };
      case 'info':
      default:
        return {
          backgroundColor: Colors.primary,
        };
    }
  };

  const toastStyle = getToastStyle(toastProps.type);

  return (
    <View style={styles.wrapper} pointerEvents="none">
      <Animated.View
        style={[
          styles.toastContainer,
          { 
            backgroundColor: toastStyle.backgroundColor,
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }]
          }
        ]}
      >
        <Text style={styles.text} numberOfLines={1}>
          {toastProps.text}
        </Text>
      </Animated.View>
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    pointerEvents: 'none',
  },
  toastContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    maxWidth: '90%',
    minWidth: 250,
    height: 44, // Sabit yükseklik
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 10,
  },
  text: {
    ...Typography.body,
    color: Colors.card,
    fontWeight: '600',
    textAlign: 'center',
    fontSize: 15, // Metin boyutu küçültüldü
  },
});

export default AppToast;