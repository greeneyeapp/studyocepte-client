// features/editor/components/TargetSelector.tsx - DÜZELTILMIŞ VERSİYON

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants';
import { TargetType, TARGET_SELECTOR } from '../config/tools';

interface TargetSelectorProps {
  activeTarget: TargetType;
  onTargetChange: (target: TargetType) => void;
  activeTool: string;
}

export const TargetSelector: React.FC<TargetSelectorProps> = ({
  activeTarget,
  onTargetChange,
  activeTool,
}) => {
  // Sadece background aracında gösterme - artık filter'da da göster
  if (activeTool === 'background') {
    return null;
  }

  const handleTargetChange = (target: TargetType) => {
    console.log('🎯 Target changed from', activeTarget, 'to', target);
    onTargetChange(target);
  };

  return (
    <View style={styles.container}>
      <View style={styles.segmentedControl}>
        {TARGET_SELECTOR.map((target) => (
          <TouchableOpacity
            key={target.key}
            style={[
              styles.segment,
              activeTarget === target.key && styles.activeSegment,
            ]}
            onPress={() => handleTargetChange(target.key)}
          >
            <Text
              style={[
                styles.segmentText,
                activeTarget === target.key && styles.activeSegmentText,
              ]}
            >
              {target.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.card,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: Colors.gray100,
    borderRadius: BorderRadius.md,
    padding: 2,
  },
  segment: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
  },
  activeSegment: {
    backgroundColor: Colors.card,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentText: {
    ...Typography.captionMedium,
    color: Colors.textSecondary,
  },
  activeSegmentText: {
    color: Colors.textPrimary,
    fontWeight: '600',
  },
});