// client/features/editor/components/CustomSlider.tsx - KOMPAKT TASARIM
import React, { useCallback, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import { Colors, Typography, Spacing } from '@/constants';
import { FeatureConfig } from '../config/features';
import { useTranslation } from 'react-i18next'; // useTranslation import edildi

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
  feature, value, onValueChange, onSlidingStart, onSlidingComplete, isActive,
  hasMixedValues = false, productValue = 0, backgroundValue = 0,
}) => {
  const { t } = useTranslation();
  const handleValueChange = useCallback((newValue: number) => onValueChange(Math.round(newValue)), [onValueChange]);
  const formattedValue = useMemo(() => (value > 0 ? `+${value}` : `${value}`), [value]);

  if (!isActive) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.featureLabel}>{t(`editor.feature.${feature.key}`)}</Text>
        <Text style={styles.featureValue}>{formattedValue}</Text>
      </View>
      <Slider
        style={styles.slider}
        minimumValue={feature.min}
        maximumValue={feature.max}
        value={value}
        onValueChange={handleValueChange}
        onSlidingStart={onSlidingStart}
        onSlidingComplete={onSlidingComplete}
        minimumTrackTintColor={Colors.primary}
        maximumTrackTintColor={Colors.gray200}
        thumbTintColor={Colors.primary}
        step={feature.step}
      />
    </View>
  );
};

// YENİ, DAHA KOMPAKT STİLLER
const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.card,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.xs,
  },
  featureLabel: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  featureValue: {
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
    fontWeight: '600',
    minWidth: 40,
    textAlign: 'center',
  },
  slider: {
    width: '100%',
    height: 40,
  },
});