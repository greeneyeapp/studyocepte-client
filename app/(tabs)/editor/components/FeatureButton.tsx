// app/(tabs)/editor/components/FeatureButton.tsx

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants';

interface FeatureButtonProps {
  icon: string;
  label: string;
  value: number;
  isActive: boolean;
  onPress: () => void;
}

export const FeatureButton: React.FC<FeatureButtonProps> = ({
  icon,
  label,
  value,
  isActive,
  onPress,
}) => {
  const hasValue = value !== 0;
  
  return (
    <TouchableOpacity 
      style={[styles.container, isActive && styles.containerActive]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[
        styles.iconContainer, 
        hasValue && styles.iconContainerWithValue,
        isActive && styles.iconContainerActive
      ]}>
        {hasValue ? (
          <Text style={[
            styles.valueText,
            isActive && styles.valueTextActive
          ]}>
            {value > 0 ? `+${value}` : `${value}`}
          </Text>
        ) : (
          <Feather 
            name={icon as any} 
            size={18} 
            color={isActive ? Colors.card : Colors.textPrimary} 
          />
        )}
      </View>
      <Text style={[
        styles.label, 
        isActive && styles.labelActive,
        hasValue && styles.labelWithValue
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    minWidth: 60,
    paddingHorizontal: Spacing.xs,
  },
  containerActive: {
    // Active container styling if needed
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  iconContainerWithValue: {
    backgroundColor: Colors.primary,
  },
  iconContainerActive: {
    backgroundColor: Colors.primary,
    transform: [{ scale: 1.05 }],
  },
  valueText: {
    ...Typography.captionMedium,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.card,
    textAlign: 'center',
  },
  valueTextActive: {
    color: Colors.card,
  },
  label: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
    maxWidth: 60,
    numberOfLines: 1,
  },
  labelActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  labelWithValue: {
    color: Colors.primary,
    fontWeight: '600',
  },
});