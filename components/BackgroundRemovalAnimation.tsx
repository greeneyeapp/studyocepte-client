// components/BackgroundRemovalAnimation.tsx - SLIDER GEÇİŞİ DÜZELTİLMİŞ VERSİYON
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, StyleSheet, Image, Animated, Text, Dimensions } from 'react-native';
import { Colors, BorderRadius, Typography, Spacing } from '@/constants';
import { Feather } from '@expo/vector-icons';

interface BackgroundRemovalAnimationProps {
  originalUri: string;
  processedUri?: string;
  isAnimating: boolean;
  onAnimationComplete: () => void;
  containerStyle?: any;
  showLabel?: boolean;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const FLOATING_ICONS = [
  'zap', 'star', 'heart', 'award', 'target', 'check-circle', 
  'shield', 'trending-up', 'sun', 'moon', 'gift', 'aperture'
];

const FloatingIcon: React.FC<{ icon: string; delay: number; index: number; isActive: boolean }> = ({ 
  icon, delay, index, isActive 
}) => {
  const animValue = useRef(new Animated.Value(0)).current;
  const opacityValue = useRef(new Animated.Value(0)).current;
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const getRandomPosition = () => {
    const positions = [
      { top: '15%', left: '10%' },
      { top: '25%', right: '15%' },
      { top: '45%', left: '20%' },
      { top: '35%', right: '25%' },
      { top: '65%', left: '15%' },
      { top: '55%', right: '10%' },
    ];
    return positions[index % positions.length];
  };

  const position = getRandomPosition();

  const animateIcon = useCallback(() => {
    if (!isActive) return;
    
    animValue.setValue(0);
    opacityValue.setValue(0);

    const timeout = setTimeout(() => {
      if (!isActive) return;
      
      Animated.parallel([
        Animated.timing(opacityValue, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(animValue, {
          toValue: 1,
          duration: 2200,
          useNativeDriver: true,
        })
      ]).start(() => {
        if (!isActive) return;
        
        Animated.timing(opacityValue, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }).start(() => {
          if (isActive) {
            intervalRef.current = setTimeout(() => {
              animateIcon();
            }, 1000);
          }
        });
      });
    }, delay);

    return () => clearTimeout(timeout);
  }, [isActive, animValue, opacityValue, delay]);

  useEffect(() => {
    if (isActive) {
      animateIcon();
    } else {
      if (intervalRef.current) {
        clearTimeout(intervalRef.current);
        intervalRef.current = null;
      }
      opacityValue.setValue(0);
    }

    return () => {
      if (intervalRef.current) {
        clearTimeout(intervalRef.current);
      }
    };
  }, [isActive, animateIcon]);

  if (!isActive) return null;

  const translateY = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [30, -80],
  });

  const scale = animValue.interpolate({
    inputRange: [0, 0.3, 0.7, 1],
    outputRange: [0.3, 1.3, 1.1, 0.6],
  });

  const rotate = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <Animated.View
      style={[
        styles.floatingIcon,
        position,
        {
          opacity: opacityValue,
          transform: [
            { translateY },
            { scale },
            { rotate },
          ],
        },
      ]}
    >
      <Feather name={icon as any} size={18} color={Colors.primary} />
    </Animated.View>
  );
};

export const BackgroundRemovalAnimation: React.FC<BackgroundRemovalAnimationProps> = ({
  originalUri,
  processedUri,
  isAnimating,
  onAnimationComplete,
  containerStyle,
  showLabel = true
}) => {
  const slideAnim = useRef(new Animated.Value(0)).current;
  const [animationPhase, setAnimationPhase] = useState<'waiting' | 'sliding' | 'completed'>('waiting');
  
  // Modal boyutları
  const modalWidth = Math.min(SCREEN_WIDTH * 0.95, 500);
  const modalHeight = Math.min(SCREEN_HEIGHT * 0.7, 600);
  const imageContainerHeight = modalHeight - 120;

  console.log('🎨 Animation Render:', {
    originalUri: originalUri ? 'PRESENT' : 'MISSING',
    processedUri: processedUri ? 'PRESENT' : 'MISSING', 
    processedPath: processedUri?.split('/').pop() || 'NONE',
    animationPhase,
    isAnimating
  });

  // İşlem tamamlandığında slide animasyonunu başlat
  useEffect(() => {
    console.log('🎭 Effect Check:', {
      hasProcessedUri: !!processedUri,
      processedFile: processedUri?.split('/').pop() || 'NONE',
      currentPhase: animationPhase,
      isAnimating
    });

    // Sadece processed URI geldiğinde ve henüz sliding'e geçmediysek
    if (processedUri && isAnimating && animationPhase === 'waiting') {
      console.log('🎬 STARTING SLIDE ANIMATION');
      console.log('📂 Original URI:', originalUri);
      console.log('📂 Processed URI:', processedUri);
      
      setAnimationPhase('sliding');
      
      // Kısa bir gecikme sonra slide animasyonunu başlat
      setTimeout(() => {
        Animated.timing(slideAnim, {
          toValue: 100,
          duration: 3000,
          useNativeDriver: false,
        }).start((finished) => {
          if (finished) {
            console.log('✅ SLIDE ANIMATION COMPLETED');
            setAnimationPhase('completed');
            setTimeout(() => {
              onAnimationComplete();
            }, 1000);
          }
        });
      }, 300);
    }
  }, [processedUri, isAnimating, animationPhase, originalUri, onAnimationComplete, slideAnim]);

  // Reset when animation stops
  useEffect(() => {
    if (!isAnimating) {
      console.log('🔄 RESETTING ANIMATION STATE');
      slideAnim.setValue(0);
      setAnimationPhase('waiting');
    }
  }, [isAnimating, slideAnim]);

  const sliderPosition = slideAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  });

  return (
    <View style={[styles.container, containerStyle, { width: modalWidth, height: modalHeight }]}>
      {showLabel && (
        <View style={styles.labelContainer}>
          <Feather name="zap" size={20} color={Colors.primary} />
          <Text style={styles.label}>
            {animationPhase === 'waiting' ? 'Arka Plan Temizleniyor...' : 
             animationPhase === 'sliding' ? 'İşlem Tamamlandı!' :
             'Hazır!'}
          </Text>
        </View>
      )}
      
      <View style={[styles.imageContainer, { height: imageContainerHeight }]}>
        
        {/* Phase 1: WAITING - Orijinal görsel + floating iconlar */}
        {animationPhase === 'waiting' && (
          <>
            <Image 
              source={{ uri: originalUri }} 
              style={styles.baseImage}
              resizeMode="contain"
            />
            <View style={styles.floatingIconsContainer}>
              {FLOATING_ICONS.slice(0, 6).map((icon, index) => (
                <FloatingIcon
                  key={`${icon}-${index}`}
                  icon={icon}
                  index={index}
                  delay={index * 300}
                  isActive={animationPhase === 'waiting' && isAnimating}
                />
              ))}
            </View>
            <View style={styles.loadingOverlay} />
          </>
        )}

        {/* Phase 2: SLIDING - Processed görsel slide ile açılıyor */}
        {(animationPhase === 'sliding' || animationPhase === 'completed') && processedUri && (
          <>
            {console.log('🖼️ RENDERING SLIDE PHASE')}
            
            {/* KATMAN 1: Processed image (en altta) */}
            <Image 
              source={{ uri: processedUri }} 
              style={styles.processedImage}
              resizeMode="contain"
              onLoad={() => console.log('✅ Processed image loaded for slide')}
              onError={(error) => console.error('❌ Processed image error:', error)}
            />
            
            {/* KATMAN 2: Original image (ortada) - SABİT BOYUTTA */}
            <Image 
              source={{ uri: originalUri }} 
              style={styles.originalImageFixed}
              resizeMode="contain"
            />
            
            {/* KATMAN 3: Beyaz overlay mask - sağdan solda kayar ve original'i örter */}
            <Animated.View 
              style={[
                styles.overlayMask,
                {
                  left: slideAnim.interpolate({
                    inputRange: [0, 100],
                    outputRange: ['100%', '0%'],
                    extrapolate: 'clamp',
                  }),
                }
              ]}
            />

            {/* KATMAN 4: Slider line (en üstte) */}
            <Animated.View 
              style={[
                styles.sliderLine,
                {
                  left: slideAnim.interpolate({
                    inputRange: [0, 100],
                    outputRange: ['100%', '0%'],
                    extrapolate: 'clamp',
                  }),
                }
              ]}
            />
          </>
        )}
      </View>

      {/* Progress bar - sliding sırasında */}
      {animationPhase === 'sliding' && (
        <View style={styles.progressContainer}>
          <Text style={styles.progressLabel}>Arka Plan Temizleniyor...</Text>
          <View style={styles.progressBarContainer}>
            <Animated.View 
              style={[
                styles.progressBar,
                { width: sliderPosition }
              ]}
            />
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 25,
    elevation: 15,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.primary + '15',
    borderRadius: BorderRadius.full,
    gap: Spacing.sm,
  },
  label: {
    ...Typography.bodyMedium,
    color: Colors.primary,
    fontWeight: '600',
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    backgroundColor: Colors.gray50,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  
  // Base image (waiting phase)
  baseImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  
  // Floating Icons (waiting phase)
  floatingIconsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  floatingIcon: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.card + 'F5',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    borderWidth: 1.5,
    borderColor: Colors.primary + '40',
  },
  
  // Loading overlay (waiting phase)
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },

  // Slide animation (sliding phase) - OVERLAY MASK ÇÖZÜMÜ
  processedImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    zIndex: 1,
  },
  // Original image - SABİT BOYUTTA (küçülmeyecek)
  originalImageFixed: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    zIndex: 2,
  },
  // Overlay mask - Original image'ı sağdan solda örter
  overlayMask: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    backgroundColor: Colors.gray50, // Container ile aynı renk
    zIndex: 3,
  },
  sliderLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: Colors.primary,
    marginLeft: -2,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 20,
    zIndex: 3,
  },
  
  // Progress (sliding phase)
  progressContainer: {
    width: '100%',
    marginTop: Spacing.lg,
    alignItems: 'center',
  },
  progressLabel: {
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    fontWeight: '500',
  },
  progressBarContainer: {
    width: '100%',
    height: 8,
    backgroundColor: Colors.gray200,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
});