// client/features/editor/components/ImageWithAdjustments.tsx (YENİ DOSYA)
import React from 'react';
import { View, Image, StyleSheet, ImageStyle } from 'react-native';

// Ayarları ve Filtreleri Görsel Efektlere Dönüştüren Yardımcı Fonksiyon
const getAdjustmentStyles = (settings: Record<string, any>, prefix: string) => {
  const overlays = [];

  // Parlaklık ve Pozlama (Beyaz/Siyah Overlay)
  const brightness = (settings[`${prefix}_brightness`] || 0) + (settings[`${prefix}_exposure`] || 0);
  if (brightness > 0) {
    overlays.push(<View key="brightness-pos" style={[styles.overlay, { backgroundColor: 'white', opacity: brightness / 200 }]} />);
  } else if (brightness < 0) {
    overlays.push(<View key="brightness-neg" style={[styles.overlay, { backgroundColor: 'black', opacity: Math.abs(brightness) / 200 }]} />);
  }

  // Sıcaklık (Turuncu/Mavi Overlay)
  const warmth = settings[`${prefix}_warmth`] || 0;
  if (warmth > 0) {
    overlays.push(<View key="warmth-pos" style={[styles.overlay, { backgroundColor: '#FFA500', opacity: warmth / 250 }]} />);
  } else if (warmth < 0) {
    overlays.push(<View key="warmth-neg" style={[styles.overlay, { backgroundColor: '#00BFFF', opacity: Math.abs(warmth) / 250 }]} />);
  }
  
  // Doygunluk (Grayscale Overlay)
  const saturation = settings[`${prefix}_saturation`] || 0;
  if (saturation < 0) {
      overlays.push(<View key="saturation" style={[styles.overlay, { backgroundColor: 'grey', opacity: Math.abs(saturation) / 100, mixBlendMode: 'saturation' }]} />);
  }

  return overlays;
};

interface ImageWithAdjustmentsProps {
  sourceUri: string;
  settings: Record<string, any>;
  prefix: 'product' | 'background'; // Hangi ayar setinin kullanılacağını belirtir
  style?: ImageStyle;
  resizeMode?: 'cover' | 'contain' | 'stretch';
  onLoad?: () => void;
  onError?: () => void;
}

export const ImageWithAdjustments: React.FC<ImageWithAdjustmentsProps> = ({
  sourceUri,
  settings,
  prefix,
  style,
  resizeMode = 'contain',
  onLoad,
  onError
}) => {
  const adjustmentOverlays = getAdjustmentStyles(settings, prefix);

  return (
    <View style={style}>
      <Image
        source={{ uri: sourceUri }}
        style={styles.image}
        resizeMode={resizeMode}
        onLoad={onLoad}
        onError={onError}
      />
      {/* Tüm ayar ve filtre katmanları buraya render edilir */}
      {adjustmentOverlays}
    </View>
  );
};

const styles = StyleSheet.create({
  image: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
});