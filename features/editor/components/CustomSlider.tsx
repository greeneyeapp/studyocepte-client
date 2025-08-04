// features/editor/components/CustomSlider.tsx - Optimize Edilmiş Versiyon

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
      {/* Feature bilgileri */}
      <View style={styles.featureInfo}>
        <Text style={styles.featureLabel}>{feature.label}</Text>
        <Text style={styles.featureValue}>
          {formattedValue}
        </Text>
        
        {/* Karışık durum bilgisi */}
        {mixedInfoText && (
          <Text style={styles.mixedInfo}>
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
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  featureInfo: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  featureLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  featureValue: {
    ...Typography.h2,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  mixedInfo: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  sliderContainer: {
    position: 'relative',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderThumb: {
    backgroundColor: Colors.card,
    borderWidth: 2,
    borderColor: Colors.primary,
    width: 28,
    height: 28,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  sliderTrack: {
    height: 4,
    borderRadius: 2,
  },
  sliderMarkers: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.sm,
  },
  markerText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  centerMarker: {
    width: 2,
    height: 8,
    backgroundColor: Colors.border,
    borderRadius: 1,
  },
});