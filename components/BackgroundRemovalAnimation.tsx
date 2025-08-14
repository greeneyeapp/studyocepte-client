import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, StyleSheet, Image, Animated, Text, Dimensions } from 'react-native';
import { Colors, BorderRadius, Typography, Spacing } from '@/constants';
import { Feather } from '@expo/vector-icons';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next'; // useTranslation import edildi

interface BackgroundRemovalAnimationProps {
  originalUri: string;
  processedUri?: string;
  isAnimating: boolean;
  onAnimationComplete: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ShimmeringInfoBox: React.FC<{ text: string; isActive: boolean }> = ({ text, isActive }) => {
    const shimmerAnim = useRef(new Animated.Value(-1)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (isActive) {
            Animated.timing(opacityAnim, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            }).start();
            Animated.loop(
                Animated.timing(shimmerAnim, {
                    toValue: 2,
                    duration: 1500,
                    useNativeDriver: true,
                })
            ).start();
        } else {
            Animated.timing(opacityAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }).start();
        }
    }, [isActive]);

    const translateX = shimmerAnim.interpolate({
        inputRange: [-1, 2],
        outputRange: [-300, 300],
    });

    if (!isActive) return null;

    return (
        <Animated.View style={[infoStyles.infoBox, { opacity: opacityAnim }]}>
            <MaskedView
                style={StyleSheet.absoluteFill}
                maskElement={<View style={infoStyles.mask} />}
            >
                <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateX }] }]}>
                    <LinearGradient
                        style={StyleSheet.absoluteFill}
                        colors={['transparent', Colors.primaryLight + '80', 'transparent']}
                        start={{ x: 0, y: 0.5 }}
                        end={{ x: 1, y: 0.5 }}
                    />
                </Animated.View>
            </MaskedView>
            <Feather name="zap" size={18} color={Colors.primary} />
            <Text style={infoStyles.infoText}>{text}</Text>
        </Animated.View>
    );
};

const FLOATING_ICONS = ['zap', 'star', 'heart', 'award', 'target', 'check-circle'];

const FloatingIcon: React.FC<{ icon: string; delay: number; index: number; isActive: boolean }> = ({
    icon, delay, index, isActive
}) => {
    const animValue = useRef(new Animated.Value(0)).current;
    const opacityValue = useRef(new Animated.Value(0)).current;

    const animateIcon = useCallback(() => {
        if (!isActive) return;
        animValue.setValue(0);
        opacityValue.setValue(0);
        const timeout = setTimeout(() => {
            if (!isActive) return;
            Animated.parallel([
                Animated.timing(opacityValue, { toValue: 1, duration: 400, useNativeDriver: true }),
                Animated.timing(animValue, { toValue: 1, duration: 2200, useNativeDriver: true })
            ]).start(() => {
                if (!isActive) return;
                Animated.timing(opacityValue, { toValue: 0, duration: 400, useNativeDriver: true }).start();
            });
        }, delay);
        return () => clearTimeout(timeout);
    }, [isActive, animValue, opacityValue, delay]);

    useEffect(() => {
        if (isActive) animateIcon();
    }, [isActive, animateIcon]);

    if (!isActive) return null;

    const positions = [{ top: '20%', left: '10%' }, { top: '30%', right: '5%' }, { top: '50%', left: '15%' }, { top: '60%', right: '20%' }, { top: '80%', left: '5%' }, { top: '15%', right: '15%' }];
    const position = positions[index % positions.length];
    const translateY = animValue.interpolate({ inputRange: [0, 1], outputRange: [30, -80] });
    const scale = animValue.interpolate({ inputRange: [0, 0.3, 0.7, 1], outputRange: [0.3, 1.3, 1.1, 0.6] });
    const rotate = animValue.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });

    return (
        <Animated.View style={[styles.floatingIcon, position, { opacity: opacityValue, transform: [{ translateY }, { scale }, { rotate }] }]}>
            <Feather name={icon as any} size={18} color={Colors.primary} />
        </Animated.View>
    );
};

export const BackgroundRemovalAnimation: React.FC<BackgroundRemovalAnimationProps> = ({
    originalUri, processedUri, isAnimating, onAnimationComplete
}) => {
    const { t } = useTranslation(); // t hook'u kullanıldı
    const slideAnim = useRef(new Animated.Value(0)).current;
    const [animationPhase, setAnimationPhase] = useState<'waiting' | 'sliding' | 'completed'>('waiting');

    const modalWidth = SCREEN_WIDTH;

    useEffect(() => {
        if (processedUri && isAnimating && animationPhase === 'waiting') {
            setAnimationPhase('sliding');
            setTimeout(() => {
                Animated.timing(slideAnim, {
                    toValue: 1, duration: 1500, useNativeDriver: false,
                }).start(({ finished }) => {
                    if (finished) {
                        setAnimationPhase('completed');
                        setTimeout(onAnimationComplete, 500);
                    }
                });
            }, 300);
        }
    }, [processedUri, isAnimating, animationPhase]);

    useEffect(() => {
        if (!isAnimating) {
            slideAnim.setValue(0);
            setAnimationPhase('waiting');
        }
    }, [isAnimating]);

    const getInfoText = () => {
        if (animationPhase === 'sliding') return t('imageProcessing.backgroundsBeingCleaned');
        if (animationPhase === 'completed') return t('imageProcessing.operationCompleted');
        return t('imageProcessing.pleaseWait');
    };

    const imageWidth = modalWidth * 0.9;

    return (
        <View style={styles.container}>
            <ShimmeringInfoBox text={getInfoText()} isActive={isAnimating} />

            <View style={[styles.imageContainer, { width: imageWidth, height: imageWidth }]}>
                <Image
                    source={{ uri: processedUri || originalUri }}
                    style={styles.baseImage}
                    resizeMode="contain"
                />
                <Animated.View style={[styles.overlayImageContainer, {
                    width: slideAnim.interpolate({ inputRange: [0, 1], outputRange: [imageWidth, 0] })
                }]}>
                    <Image
                        source={{ uri: originalUri }}
                        style={[styles.overlayImage, { width: imageWidth }]}
                        resizeMode="contain"
                    />
                </Animated.View>
                {animationPhase === 'waiting' && (
                    <View style={StyleSheet.absoluteFillObject}>
                        {FLOATING_ICONS.map((icon, index) => (
                            <FloatingIcon key={`${icon}-${index}`} icon={icon} index={index} delay={index * 200} isActive={true} />
                        ))}
                    </View>
                )}
                {animationPhase === 'sliding' && (
                    <Animated.View style={[styles.wipeIndicatorLine, {
                        left: slideAnim.interpolate({ inputRange: [0, 1], outputRange: [0, imageWidth] })
                    }]} />
                )}
            </View>

            {animationPhase === 'sliding' && (
                <View style={styles.progressBarContainer}>
                    <Animated.View style={[styles.progressBar, {
                        width: slideAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] })
                    }]} />
                </View>
            )}
        </View>
    );
};

const infoStyles = StyleSheet.create({
    infoBox: {
        position: 'absolute',
        top: Spacing.xxxl,
        flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
        backgroundColor: Colors.card, paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.lg, borderRadius: BorderRadius.full,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: Colors.border,
    },
    infoText: { ...Typography.bodyMedium, color: Colors.textPrimary, fontWeight: '600' },
    mask: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'transparent',
        borderRadius: BorderRadius.full,
        borderWidth: 2,
        borderColor: Colors.primary,
    },
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: Spacing.xxxl,
    },
    imageContainer: {
        borderRadius: BorderRadius.xl,
        overflow: 'hidden',
        backgroundColor: Colors.background, // Arka plan rengi krem tonu olarak güncellendi
        borderWidth: 1,
        borderColor: Colors.border,
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 8,
    },
    baseImage: { ...StyleSheet.absoluteFillObject },
    overlayImageContainer: { ...StyleSheet.absoluteFillObject, overflow: 'hidden' },
    overlayImage: { height: '100%' },
    wipeIndicatorLine: {
        position: 'absolute', top: 0, bottom: 0, width: 3, backgroundColor: Colors.card,
        shadowColor: '#FFF', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8,
        shadowRadius: 4, elevation: 15,
    },
    progressBarContainer: {
        position: 'absolute',
        bottom: Spacing.xxxl,
        width: '90%',
        height: 8,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressBar: { height: '100%', backgroundColor: Colors.primary, borderRadius: 4 },
    floatingIcon: {
        position: 'absolute', width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.card + 'E6',
        justifyContent: 'center', alignItems: 'center', shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3, shadowRadius: 8, elevation: 10, borderWidth: 1.5, borderColor: Colors.primary + '40',
    },
    animationOverlay: { // Modal için yeni stil eklendi
        ...StyleSheet.absoluteFillObject,
        backgroundColor: Colors.background, // Krem tonu arka plan
        justifyContent: 'center', 
        alignItems: 'center', 
        zIndex: 2000 
    },
});