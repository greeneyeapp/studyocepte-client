// kodlar/components/Dialog/AppDialog.tsx
import React, { forwardRef, useImperativeHandle, useState, useRef } from 'react';
import { Animated, StyleSheet, Text, View, Dimensions } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants';
import { Button } from '@/components/Button';
import { Layout } from '@/constants/Layout';

const { width } = Dimensions.get('window');

export interface DialogOptions {
  title: string;
  message: string;
  buttons: Array<{
    text: string;
    onPress?: () => void;
    style?: 'default' | 'cancel' | 'destructive';
  }>;
}

export interface AppDialogRef {
  show: (options: DialogOptions) => void;
  hide: () => void;
}

const AppDialog = forwardRef<AppDialogRef, {}>(({}, ref) => {
  const [dialogOptions, setDialogOptions] = useState<DialogOptions | null>(null);
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const handleHide = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 0.9, duration: 200, useNativeDriver: true }),
    ]).start(() => setDialogOptions(null));
  };
  
  useImperativeHandle(ref, () => ({
    show: (options) => {
      setDialogOptions(options);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, friction: 7, tension: 80, useNativeDriver: true }),
      ]).start();
    },
    hide: handleHide,
  }));

  const handleButtonPress = (onPress?: () => void) => {
    handleHide();
    onPress?.();
  };

  return (
    <Animated.View 
      style={[styles.overlay, { opacity: fadeAnim }]}
      pointerEvents={dialogOptions ? 'auto' : 'none'}
    >
      {dialogOptions && (
        <Animated.View style={[styles.dialogContainer, { transform: [{ scale: scaleAnim }] }]}>
          <Text style={styles.dialogTitle}>{dialogOptions.title}</Text>
          <Text style={styles.dialogMessage}>{dialogOptions.message}</Text>
          <View style={styles.buttonContainer}>
            {dialogOptions.buttons.map((button, index) => (
              <Button
                key={index}
                title={button.text}
                onPress={() => handleButtonPress(button.onPress)}
                variant={button.style === 'destructive' ? 'outline' : button.style === 'cancel' ? 'ghost' : 'primary'}
                textStyle={button.style === 'destructive' ? { color: Colors.error } : undefined}
                style={styles.dialogButton}
              />
            ))}
          </View>
        </Animated.View>
      )}
    </Animated.View>
  );
});

// ... (styles aynı kalabilir)
const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2000,
  },
  dialogContainer: {
    width: width * 0.8,
    maxWidth: Layout.isTablet ? 400 : 320,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 15,
  },
  dialogTitle: { ...Typography.h3, color: Colors.textPrimary, marginBottom: Spacing.sm, textAlign: 'center' },
  dialogMessage: { ...Typography.body, color: Colors.textSecondary, marginBottom: Spacing.lg, textAlign: 'center' },
  buttonContainer: { flexDirection: 'row', justifyContent: 'space-around', marginTop: Spacing.md, gap: Spacing.md },
  dialogButton: { flex: 1, marginHorizontal: Spacing.xs },
});


export default AppDialog;