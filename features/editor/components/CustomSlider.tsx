// features/editor/components/CustomSlider.tsx - DÜZELTILMIŞ VERSİYON

import React, { useCallback, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants';
import { FeatureConfig } from '../config/features';

interface CustomSliderProps {
  feature: FeatureConfig;
  value: number;
  onValueChange: (value: number) => void;
  onSlidingStart: () => void;
  onSlidingComplete: () => void;
  isActive: boolean;
  hasMixedValues?: boolean;
  productValue?: number;
  backgroundValue?: number;
}

export const CustomSlider: React.FC<CustomSliderProps> = ({
  feature,
  value,
  onValueChange,
  onSlidingStart,
  onSlidingComplete,
  isActive,
  hasMixedValues = false,
  productValue = 0,
  backgroundValue = 0,
}) => {
  // Performans optimizasyonu: callbacks'leri memoize et
  const handleValueChange = useCallback((newValue: number) => {
    const roundedValue = Math.round(newValue);
    onValueChange(roundedValue);
  }, [onValueChange]);

  const handleSlidingStart = useCallback(() => {
    onSlidingStart();
  }, [onSlidingStart]);

  const handleSlidingComplete = useCallback(() => {
    onSlidingComplete();
  }, [onSlidingComplete]);

  // Değer formatlamasını memoize et
  const formattedValue = useMemo(() => {
    return value > 0 ? `+${value}` : `${value}`;
  }, [value]);

  const mixedInfoText = useMemo(() => {
    if (!hasMixedValues) return null;
    return `Ürün: ${productValue > 0 ? '+' : ''}${productValue} • Arka Plan: ${backgroundValue > 0 ? '+' : ''}${backgroundValue}`;
  }, [hasMixedValues, productValue, backgroundValue]);

  if (!isActive) return null;

  return (
    <View style={styles.container}>
      {/* Feature bilgileri - GENİŞLETİLMİŞ */}
      <View style={styles.featureInfo}>
        <Text 
          style={styles.featureLabel} 
          numberOfLines={1} 
          adjustsFontSizeToFit={true}
          minimumFontScale={0.8} // Minimum %80 küçülme
          allowFontScaling={true} // Sistem font scaling'e izin ver
        >
          {feature.label}
        </Text>
        <Text style={styles.featureValue}>
          {formattedValue}
        </Text>
        
        {/* Karışık durum bilgisi */}
        {mixedInfoText && (
          <Text style={styles.mixedInfo} numberOfLines={2}>
            {mixedInfoText}
          </Text>
        )}
      </View>

      {/* Slider */}
      <View style={styles.sliderContainer}>
        <Slider
          style={styles.slider}
          minimumValue={feature.min}
          maximumValue={feature.max}
          value={value}
          onValueChange={handleValueChange}
          onSlidingStart={handleSlidingStart}
          onSlidingComplete={handleSlidingComplete}
          minimumTrackTintColor={Colors.primary}
          maximumTrackTintColor={Colors.gray200}
          thumbStyle={styles.sliderThumb}
          trackStyle={styles.sliderTrack}
          step={feature.step}
        />
        
        {/* Slider işaretleri */}
        <View style={styles.sliderMarkers}>
          <Text style={styles.markerText}>{feature.min}</Text>
          <View style={styles.centerMarker} />
          <Text style={styles.markerText}>{feature.max}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.card,
    paddingHorizontal: Spacing.xl, // Daha geniş padding
    paddingVertical: Spacing.lg,
    minWidth: '100%', // Tam genişliği kullan
  },
  featureInfo: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
    minHeight: 70, // Daha yüksek minimum
    justifyContent: 'center',
    width: '100%', // Tam genişlik
    paddingHorizontal: Spacing.md, // İç padding
  },
  featureLabel: {
    ...Typography.captionMedium,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    textAlign: 'center',
    // METİN TAŞMASI ÇÖZÜMLERİ:
    width: '100%', // Tam genişlik kullan
    maxWidth: 200, // Daha geniş maksimum
    minHeight: 20, // Yeterli yükseklik
    flexWrap: 'nowrap', // Tek satırda zorla
    // numberOfLines={1} ve adjustsFontSizeToFit={true} prop'ları ile birlikte
  },
  featureValue: {
    ...Typography.h2,
    fontWeight: '700', // Daha bold
    color: Colors.textPrimary,
    minHeight: 32, // Sabit yükseklik
    textAlign: 'center',
    lineHeight: 32, // Dikey ortalama için
  },
  mixedInfo: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    textAlign: 'center',
    maxWidth: 200, // Maksimum genişlik
    minHeight: 24, // İki satır için minimum yükseklik
  },
  sliderContainer: {
    position: 'relative',
    paddingHorizontal: Spacing.sm, // Slider için daha fazla alan
  },
  slider: {
    width: '100%',
    height: 44, // Biraz daha yüksek
  },
  sliderThumb: {
    backgroundColor: Colors.card,
    borderWidth: 3, // Daha kalın border
    borderColor: Colors.primary,
    width: 32, // Biraz daha büyük
    height: 32,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 6,
  },
  sliderTrack: {
    height: 6, // Daha kalın track
    borderRadius: 3,
  },
  sliderMarkers: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.md, // Daha fazla boşluk  
    paddingHorizontal: Spacing.md, // İç boşluk
  },
  markerText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  centerMarker: {
    width: 2,
    height: 10, // Biraz daha uzun
    backgroundColor: Colors.border,
    borderRadius: 1,
  },
});