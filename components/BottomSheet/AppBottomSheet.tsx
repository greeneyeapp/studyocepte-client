// kodlar/components/BottomSheet/AppBottomSheet.tsx
import React, { forwardRef, useImperativeHandle, useState, useRef, useCallback } from 'react';
import { Animated, StyleSheet, Text, View, TouchableOpacity, Pressable, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants';
import { Layout } from '@/constants/Layout';
import { useTranslation } from 'react-i18next';

export interface BottomSheetAction {
    id: string;
    text: string;
    icon: keyof typeof Feather.glyphMap;
    onPress: () => void;
}

export interface BottomSheetOptions {
    title?: string;
    actions: BottomSheetAction[];
}

export interface AppBottomSheetRef {
    show: (options: BottomSheetOptions) => void;
    hide: () => void;
}

const AppBottomSheet = forwardRef<AppBottomSheetRef, {}>((_, ref) => {
    const { t } = useTranslation();
    const [options, setOptions] = useState<BottomSheetOptions | null>(null);
    const sheetAnim = useRef(new Animated.Value(Layout.screen.height)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    const handleShow = useCallback((opts: BottomSheetOptions) => {
        setOptions(opts);
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
            Animated.spring(sheetAnim, { toValue: 0, friction: 10, tension: 100, useNativeDriver: true }),
        ]).start();
    }, [fadeAnim, sheetAnim]);

    const handleHide = useCallback(() => {
        Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start();
        Animated.timing(sheetAnim, { toValue: Layout.screen.height, duration: 200, useNativeDriver: true }).start(() => {
            setOptions(null);
        });
    }, [fadeAnim, sheetAnim]);

    useImperativeHandle(ref, () => ({
        show: handleShow,
        hide: handleHide,
    }));

    if (!options) {
        return <View />;
    }

    return (
        <Pressable style={styles.overlayWrapper} onPress={handleHide}>
            <Animated.View style={[styles.overlay, { opacity: fadeAnim }]} />
            <Animated.View style={[styles.sheetContainer, { transform: [{ translateY: sheetAnim }] }]}>
                <View style={styles.handleBar} />
                {options.title && <Text style={styles.title}>{options.title}</Text>}
                {options.actions.map((action, index) => (
                    <TouchableOpacity
                        key={action.id}
                        style={[styles.actionItem, index === options.actions.length - 1 && styles.lastActionItem]}
                        onPress={() => {
                            handleHide();
                            action.onPress();
                        }}
                    >
                        <Feather name={action.icon} size={22} color={Colors.primary} />
                        <Text style={styles.actionText}>{action.text}</Text>
                    </TouchableOpacity>
                ))}
                <TouchableOpacity style={styles.cancelButton} onPress={handleHide}>
                    <Text style={styles.cancelText}>{t('common.cancel')}</Text>
                </TouchableOpacity>
            </Animated.View>
        </Pressable>
    );
});

const styles = StyleSheet.create({
    overlayWrapper: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 1000,
        justifyContent: 'flex-end',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
    },
    sheetContainer: {
        backgroundColor: Colors.card,
        borderTopLeftRadius: BorderRadius.xl,
        borderTopRightRadius: BorderRadius.xl,
        padding: Spacing.md,
        paddingBottom: Platform.OS === 'ios' ? Spacing.xl : Spacing.md,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -5 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 20,
    },
    handleBar: {
        width: 40,
        height: 5,
        borderRadius: 2.5,
        backgroundColor: Colors.border,
        marginBottom: Spacing.lg,
    },
    title: {
        ...Typography.h3,
        color: Colors.textPrimary,
        marginBottom: Spacing.lg,
    },
    actionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        paddingVertical: Spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    lastActionItem: {
        borderBottomWidth: 0,
    },
    actionText: {
        ...Typography.body,
        color: Colors.textPrimary,
        marginLeft: Spacing.lg,
    },
    cancelButton: {
        marginTop: Spacing.lg,
        paddingVertical: Spacing.md,
        width: '100%',
        alignItems: 'center',
    },
    cancelText: {
        ...Typography.bodyMedium,
        color: Colors.textSecondary,
    },
});

export default AppBottomSheet;