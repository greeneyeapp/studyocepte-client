// kodlar/components/Dialog/InputDialog.tsx
import React, { forwardRef, useImperativeHandle, useState, useRef } from 'react';
import { Animated, StyleSheet, Text, View, Dimensions, KeyboardAvoidingView, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants';
import { Button } from '@/components/Button';
import { TextInput } from '@/components/TextInput';
import { Layout } from '@/constants/Layout';

const { width } = Dimensions.get('window');

interface InputDialogOptions {
    title: string;
    message?: string;
    initialValue?: string;
    placeholder?: string;
    onConfirm: (text: string) => void;
    onCancel?: () => void;
}

export interface InputDialogRef {
    show: (options: InputDialogOptions) => void;
    hide: () => void;
}

const InputDialog = forwardRef<InputDialogRef, {}>(({ }, ref) => {
    const { t } = useTranslation();
    const [options, setOptions] = useState<InputDialogOptions | null>(null);
    const [inputValue, setInputValue] = useState('');
    const scaleAnim = useRef(new Animated.Value(0.9)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    const handleHide = () => {
        Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
            setOptions(null);
        });
    };

    useImperativeHandle(ref, () => ({
        show: (opts) => {
            setOptions(opts);
            setInputValue(opts.initialValue || '');
            Animated.spring(scaleAnim, { toValue: 1, friction: 7, useNativeDriver: true }).start();
            Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
        },
        hide: handleHide,
    }));

    const handleConfirm = () => {
        if (options) {
            options.onConfirm(inputValue);
        }
        handleHide();
    };

    if (!options) {
        return <View />; // ASLA NULL DÖNDÜRME
    }

    return (
        <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
                <Animated.View style={[styles.dialogContainer, { transform: [{ scale: scaleAnim }] }]}>
                    <Text style={styles.dialogTitle}>{options.title}</Text>
                    {options.message && <Text style={styles.dialogMessage}>{options.message}</Text>}
                    <TextInput
                        style={styles.inputStyle} // YENİ STİL EKLENDİ
                        placeholder={options.placeholder}
                        value={inputValue}
                        onChangeText={setInputValue}
                        autoFocus
                    />
                    <View style={styles.buttonContainer}>
                        <Button
                            title={t('common.cancel')}
                            onPress={handleHide}
                            variant="ghost"
                            style={styles.dialogButton}
                        />
                        <Button
                            title={t('common.done')}
                            onPress={handleConfirm}
                            style={styles.dialogButton}
                        />
                    </View>
                </Animated.View>
            </KeyboardAvoidingView>
        </Animated.View>
    );
});

const styles = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2500,
    },
    keyboardView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
    },
    dialogContainer: {
        width: width * 0.85,
        maxWidth: Layout.isTablet ? 450 : 340,
        backgroundColor: Colors.card,
        borderRadius: BorderRadius.xl,
        padding: Spacing.lg,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 15,
    },
    inputStyle: { // YENİ STİL TANIMI
        ...Typography.body,
        paddingVertical: Spacing.md,
        textAlign: 'center',
    },
    dialogTitle: { ...Typography.h3, color: Colors.textPrimary, marginBottom: Spacing.sm, textAlign: 'center' },
    dialogMessage: { ...Typography.body, color: Colors.textSecondary, marginBottom: Spacing.lg, textAlign: 'center' },
    buttonContainer: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: Spacing.lg, gap: Spacing.sm },
    dialogButton: { flex: 1 },
});

export default InputDialog;