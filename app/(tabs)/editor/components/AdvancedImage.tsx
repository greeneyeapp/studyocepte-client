import React from 'react';
import { Image, View, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

// Bu bileşenin alacağı props'ların tanımı
interface AdvancedImageProps {
  sourceUri: string;
  settings: any; // Tüm ayarları içeren obje
  target: 'product' | 'background'; // Hangi katman için çalıştığı
  style?: any;
}

// Animatible Image bileşenini oluşturuyoruz
const AnimatedImage = Animated.createAnimatedComponent(Image);
const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

export const AdvancedImage: React.FC<AdvancedImageProps> = ({
  sourceUri,
  settings,
  target,
  style,
}) => {
  // Tüm filtre mantığının kalbi olan animasyonlu stil hook'u
  const animatedStyle = useAnimatedStyle(() => {
    // 1. Gerekli ayarları 'settings' objesinden güvenli bir şekilde alalım
    const prefix = `${target}_`; // 'product_' veya 'background_'
    const brightness = settings[prefix + 'brightness'] ?? 0;
    const contrast = settings[prefix + 'contrast'] ?? 0;
    const saturation = settings[prefix + 'saturation'] ?? 0;
    const warmth = settings[prefix + 'warmth'] ?? 0;
    const exposure = settings[prefix + 'exposure'] ?? 0;
    const highlights = settings[prefix + 'highlights'] ?? 0;
    const shadows = settings[prefix + 'shadows'] ?? 0;
    const clarity = settings[prefix + 'clarity'] ?? 0;

    // Sadece arka plana özel ayarlar
    const vignette = target === 'background' ? (settings[prefix + 'vignette'] ?? 0) : 0;
    const blur = target === 'background' ? (settings[prefix + 'blur'] ?? 0) : 0;

    // 2. Filtreleri stillere dönüştürelim
    // Parlaklık, Pozlama, Vurgular ve Gölgeleri birleştirerek opaklığı hesapla
    const opacityValue =
      1.0 +
      brightness / 100 +
      exposure / 100 +
      highlights / 200 - // Vurgular opaklığı artırır (daha az etkiyle)
      shadows / 200;    // Gölgeler opaklığı azaltır (daha az etkiyle)
      
    // Kontrastı da opaklık üzerinden simüle edelim
    const contrastFactor = 1 + (contrast / 100);

    // Doygunluk (Saturation) için renk tonu (tintColor) kullanacağız
    let tintColor = 'transparent';
    if (warmth !== 0) { // Sıcaklık ayarı öncelikli
      const warmthOpacity = Math.min(0.25, Math.abs(warmth) / 400);
      tintColor = warmth > 0 ? `rgba(255, 165, 0, ${warmthOpacity})` : `rgba(0, 100, 255, ${warmthOpacity})`;
    } else if (saturation < 0) { // Doygunluk azaltma
      // Gri bir ton vererek siyah-beyaz efekti taklit ediyoruz
      const desaturation = (Math.abs(saturation) / 100) * 0.7; // 0.7 ile efekti yumuşat
      tintColor = `rgba(150, 150, 150, ${desaturation})`;
    }

    return {
      // Değerin makul sınırlar içinde kalmasını sağlıyoruz
      opacity: Math.max(0, Math.min(3, opacityValue)),
      transform: [{ scale: contrastFactor }], // Kontrast için ölçeklendirme
      tintColor: tintColor,
      // Arka plan için bulanıklık
      blurRadius: blur,
    };
  }, [settings]);

  // Vinyet için ayrı bir stil (sadece arka planda)
  const vignetteStyle = useAnimatedStyle(() => {
    const vignette = target === 'background' ? (settings['background_vignette'] ?? 0) : 0;
    // Vinyet değeri arttıkça opaklık artar
    const vignetteOpacity = Math.min(0.8, vignette / 100);
    return {
      opacity: vignetteOpacity,
    };
  }, [settings]);

  return (
    <View style={[styles.container, style]}>
      <AnimatedImage
        source={{ uri: sourceUri }}
        style={[styles.image, animatedStyle]}
        resizeMode="cover"
      />
      {/* Vinyet efekti için overlay (sadece arka planda) */}
      {target === 'background' && (
        <AnimatedLinearGradient
          colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,1)']}
          style={[styles.vignette, vignetteStyle]}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    overflow: 'hidden', // Bulanıklığın taşmasını engeller
  },
  image: {
    width: '100%',
    height: '100%',
  },
  vignette: {
    ...StyleSheet.absoluteFillObject,
  },
});