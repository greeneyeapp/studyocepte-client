// components/BackgroundRemovalAnimation.tsx - ÜRÜN ARKA PLAN TEMİZLEME ANİMASYONU
import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Image, Animated, Text } from 'react-native';
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

// Rastgele görünecek iconlar - SADECE GEÇERLİ FEATHER İKONLARI
const FLOATING_ICONS = [
  'zap', 'star', 'heart', 'award', 'target', 'check-circle', 
  'shield', 'trending-up', 'sun', 'moon', 'gift', 'aperture'
];

const FloatingIcon: React.FC<{ icon: string; delay: number; index: number }> = ({ icon, delay, index }) => {
  const animValue = useRef(new Animated.Value(0)).current;
  const opacityValue = useRef(new Animated.Value(0)).current;

  // Rastgele pozisyon hesapla
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

  useEffect(() => {
    const animateIcon = () => {
      animValue.setValue(0);
      opacityValue.setValue(0);

      setTimeout(() => {
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
          Animated.timing(opacityValue, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }).start(() => {
            // 1 saniye bekle ve tekrar başla
            setTimeout(() => {
              animateIcon();
            }, 1000);
          });
        });
      }, delay);
    };

    animateIcon();
  }, []);

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
  const [showRevealAnimation, setShowRevealAnimation] = useState(false);

  // Processed URI geldiğinde reveal animasyonunu başlat
  useEffect(() => {
    console.log('🎭 Animation effect triggered:', {
      hasProcessedUri: !!processedUri,
      processedUri: processedUri ? processedUri.split('/').pop() : 'NONE',
      isAnimating,
      showRevealAnimation,
    });
    
    if (processedUri && isAnimating && !showRevealAnimation) {
      console.log('🎬 Starting reveal animation with processed URI:', processedUri);
      
      // Reveal state'ini hemen set et
      setShowRevealAnimation(true);
      
      // Animasyonu biraz geciktir ki render tamamlansın
      setTimeout(() => {
        Animated.timing(slideAnim, {
          toValue: 100,
          duration: 3000,
          useNativeDriver: false,
        }).start(() => {
          console.log('✅ Reveal animation completed');
          onAnimationComplete();
        });
      }, 200); // 200ms delay
    }
  }, [processedUri, isAnimating, showRevealAnimation]);

  // Reset animasyonu
  useEffect(() => {
    if (!isAnimating) {
      slideAnim.setValue(0);
      setShowRevealAnimation(false);
    }
  }, [isAnimating]);

  // Slider animasyonu - soldan sağa
  const sliderPosition = slideAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  });

  console.log('🎨 Component props:', {
    hasOriginalUri: !!originalUri,
    hasProcessedUri: !!processedUri,
    processedUriPath: processedUri?.split('/').pop() || 'NONE',
    showRevealAnimation,
    currentSliderValue: slideAnim._value
  });

  console.log('🎨 Current render state:', {
    hasProcessedUri: !!processedUri,
    showRevealAnimation,
    currentSliderValue: slideAnim._value
  });

  return (
    <View style={[styles.container, containerStyle]}>
      {showLabel && (
        <View style={styles.labelContainer}>
          <Feather name="zap" size={16} color={Colors.primary} />
          <Text style={styles.label}>
            {!showRevealAnimation ? 'Arka Plan Temizleniyor...' : 'İşlem Tamamlandı!'}
          </Text>
        </View>
      )}
      
      <View style={styles.imageContainer}>
        {/* Orijinal fotoğraf her zaman görünür - ARKADA */}
        <Image 
          source={{ uri: originalUri }} 
          style={styles.originalImage}
          resizeMode="contain"
        />

        {/* Floating icons - sadece bekleme sırasında */}
        {isAnimating && !showRevealAnimation && (
          <View style={styles.floatingIconsContainer}>
            {FLOATING_ICONS.slice(0, 6).map((icon, index) => (
              <FloatingIcon
                key={`${icon}-${index}`}
                icon={icon}
                index={index}
                delay={index * 500}
              />
            ))}
          </View>
        )}

        {/* Reveal aşaması - TAMAMEN YENİ YAPIŞ */}
        {processedUri && showRevealAnimation && (
          <>
            {console.log('🖼️ Rendering processed image section')}
            
            {/* Processed image - TAM BOYUTTA ARKADA */}
            <Image 
              source={{ uri: processedUri }} 
              style={styles.processedImageFull}
              resizeMode="contain"
              onLoad={() => console.log('✅ Processed image loaded successfully')}
              onError={(error) => console.error('❌ Processed image load error:', error)}
            />
            
            {/* Orijinal image mask - SOL TARAFTAN KÜÇÜLÜR */}
            <Animated.View 
              style={[
                styles.originalMask,
                { 
                  width: slideAnim.interpolate({
                    inputRange: [0, 100],
                    outputRange: ['100%', '0%'], // Tam'dan 0'a küçülür
                    extrapolate: 'clamp',
                  }),
                }
              ]}
            >
              <Image 
                source={{ uri: originalUri }} 
                style={styles.originalImageInMask}
                resizeMode="contain"
              />
            </Animated.View>

            {/* Slider çizgisi */}
            <Animated.View 
              style={[
                styles.sliderLine,
                {
                  left: slideAnim.interpolate({
                    inputRange: [0, 100],
                    outputRange: ['100%', '0%'], // Sağdan sola hareket
                    extrapolate: 'clamp',
                  }),
                }
              ]}
            />
          </>
        )}

        {/* Hafif overlay - sadece bekleme sırasında */}
        {isAnimating && !showRevealAnimation && (
          <View style={styles.loadingOverlay} />
        )}
      </View>

      {/* İlerleme çubuğu - sadece reveal sırasında */}
      {showRevealAnimation && (
        <View style={styles.progressContainer}>
          <Text style={styles.progressLabel}>Arka Plan Temizleniyor...</Text>
          <View style={styles.progressBarContainer}>
            <Animated.View 
              style={[
                styles.progressBar,
                {
                  width: sliderPosition,
                }
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
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.primary + '15',
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  label: {
    ...Typography.captionMedium,
    color: Colors.primary,
    fontWeight: '600',
  },
  imageContainer: {
    position: 'relative',
    width: 350,
    height: 280,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    backgroundColor: Colors.gray100,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  
  // Original Image (Background)
  originalImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  
  // Floating Icons
  floatingIconsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  floatingIcon: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.card + 'F0',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 8,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  
  // Loading
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },

  // Slider Animation - YENİ YAPIŞ
  processedImageFull: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
    zIndex: 1, // Orijinalin üstünde
  },
  originalMask: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    overflow: 'hidden',
    zIndex: 2, // En üstte
  },
  originalImageInMask: {
    width: 350, // Sabit boyut
    height: 280, // Sabit boyut
    backgroundColor: 'transparent',
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
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 10,
  },
  
  // Progress
  progressContainer: {
    width: '100%',
    marginTop: Spacing.md,
    alignItems: 'center',
  },
  progressLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  progressBarContainer: {
    width: '100%',
    height: 6,
    backgroundColor: Colors.gray200,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
});