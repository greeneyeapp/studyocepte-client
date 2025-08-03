// client/app/(tabs)/editor/components/CropToolbar.tsx (YENİ DOSYA)
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants';

interface CropToolbarProps {
  onAspectRatioSelect: (ratio: string) => void;
  onRotate: () => void;
  onReset: () => void;
  onDone: () => void;
  onCancel: () => void;
  activeRatio: string;
}

const ASPECT_RATIOS = [
  { key: 'original', label: 'Orijinal' },
  { key: '1:1', label: 'Kare' },
  { key: '4:5', label: '4:5' },
  { key: '3:4', label: '3:4' },
  { key: '2:3', label: '2:3' },
  { key: '16:9', label: '16:9' },
];

export const CropToolbar: React.FC<CropToolbarProps> = ({
  onAspectRatioSelect,
  onRotate,
  onReset,
  onDone,
  onCancel,
  activeRatio,
}) => {
  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.ratioScroll}>
        {ASPECT_RATIOS.map(ratio => (
          <TouchableOpacity
            key={ratio.key}
            style={[styles.ratioButton, activeRatio === ratio.key && styles.ratioButtonActive]}
            onPress={() => onAspectRatioSelect(ratio.key)}
          >
            <Text style={[styles.ratioText, activeRatio === ratio.key && styles.ratioTextActive]}>
              {ratio.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      <View style={styles.bottomActions}>
        <TouchableOpacity onPress={onCancel} style={styles.confirmButton}>
          <Feather name="x" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={onRotate} style={styles.iconButton}>
          <Feather name="rotate-cw" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={onReset} style={styles.iconButton}>
          <Feather name="refresh-ccw" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={onDone} style={styles.confirmButton}>
          <Feather name="check" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  iconButton: {
    padding: Spacing.md,
  },
  ratioScroll: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  ratioButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginRight: Spacing.md,
    backgroundColor: Colors.gray100,
  },
  ratioButtonActive: {
    backgroundColor: Colors.primary + '20',
  },
  ratioText: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontWeight: '500'
  },
  ratioTextActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  bottomActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  confirmButton: {
    padding: Spacing.md,
  },
});