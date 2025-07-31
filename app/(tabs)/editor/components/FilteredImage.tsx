// app/(tabs)/editor/components/FilteredImage.tsx

import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, interpolate, Extrapolate } from 'react-native-reanimated';

interface FilteredImageProps {
  imageUri: string;
  settings: any;
  style?: any;
  resizeMode?: 'contain' | 'cover' | 'stretch';
}

export const FilteredImage: React.FC<FilteredImageProps> = ({
  imageUri,
  settings,
  style,
  resizeMode = 'contain',
}) => {
  // Gelişmiş animasyonlu filtreler - SADECE OPACITY ve TINT
    const animatedStyle = useAnimatedStyle(() => {
    // 1. ÖNCE GÖRÜNÜR OLDUĞUNU VARSAYALIM
    // Bu, kodun en kritik kısmıdır. Ayarlar gelene kadar fotoğrafın görünür olmasını garanti eder.
    let calculatedOpacity = 1.0;
    let calculatedTintColor = 'transparent';

    // 2. AYARLARIN YÜKLENDİĞİNDEN EMİN OLALIM
    // Bu kontrol, ayarların null, undefined veya boş bir obje olma ihtimaline karşı
    // kodun hata vermesini veya yanlış hesaplama yapmasını engeller.
    if (settings && typeof settings === 'object' && Object.keys(settings).length > 0) {
      const brightness = settings.product_brightness ?? 0;
      const exposure = settings.product_exposure ?? 0;
      const warmth = settings.product_warmth ?? 0;
      const saturation = settings.product_saturation ?? 0;

      // Opaklık hesaplaması
      const opacityValue = 1.0 + (brightness / 100) + (exposure / 100);
      calculatedOpacity = Math.max(0.0, Math.min(2.0, opacityValue));

      // Renk tonu (Tint) hesaplaması
      if (warmth !== 0) {
        const warmthOpacity = Math.min(0.25, Math.abs(warmth) / 400);
        if (warmth > 0) {
          calculatedTintColor = `rgba(255, 180, 80, ${warmthOpacity})`;
        } else {
          calculatedTintColor = `rgba(80, 140, 255, ${warmthOpacity})`;
        }
      } else if (saturation < 0) {
        const desaturationOpacity = (Math.abs(saturation) / 100) * 0.5;
        calculatedTintColor = `rgba(150, 150, 150, ${desaturationOpacity})`;
      }
    }

    // 3. Her durumda geçerli bir stil döndür
    return {
      opacity: calculatedOpacity,
      tintColor: calculatedTintColor,
    };
    // Hook'un, ayarlar değiştiğinde yeniden çalışmasını garanti altına alıyoruz.
  }, [settings]); 

  return (
    <View style={[styles.container, style]}>
      <Animated.Image
        source={{ uri: imageUri }}
        style={[styles.image, animatedStyle]}
        resizeMode={resizeMode}
      />

      {/* OVERLAY'LERİ KALDIR - PNG transparency'yi bozuyorlar */}
      {/* Sadece Animated.Image'daki tintColor ve opacity kullan */}
    </View>
  );
};

// Warmth overlay - sadece görünür pixellerde
const renderWarmthOverlay = (settings: any) => {
  const warmth = settings.product_warmth || 0;

  if (warmth === 0) return null;

  const overlayColor = warmth > 0
    ? `rgba(255, 180, 80, ${Math.min(0.3, Math.abs(warmth) / 300)})` // Sıcak
    : `rgba(80, 140, 255, ${Math.min(0.3, Math.abs(warmth) / 300)})`; // Soğuk

  return (
    <View
      style={[
        styles.overlay,
        { backgroundColor: overlayColor }
      ]}
      pointerEvents="none"
    />
  );
};

// Saturation overlay - mono effect
const renderSaturationOverlay = (settings: any) => {
  const saturation = settings.product_saturation || 0;

  if (saturation >= -50) return null; // Sadece çok düşük saturation'da

  const monoOpacity = Math.abs(saturation + 50) / 100;

  return (
    <View
      style={[
        styles.overlay,
        { backgroundColor: `rgba(128, 128, 128, ${monoOpacity * 0.4})` }
      ]}
      pointerEvents="none"
    />
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    // Bu overlay'ler container'ın şeklini alır, PNG transparency'yi korur
  },
  maskContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  maskImage: {
    width: '100%',
    height: '100%',
  },
});