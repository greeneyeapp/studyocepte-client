// features/editor/components/CropToolbar.tsx - SADECE UYGULA BUTONU

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants';

interface CropToolbarProps {
  onAspectRatioSelect: (ratio: string) => void;
  onRotate: () => void;
  onReset: () => void;
  onApplyCrop: () => void; // Crop'u uygula ve çık
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
  onApplyCrop,
  activeRatio,
}) => {
  return (
    <View style={styles.container}>
      {/* Üst Kısım: En-boy oranı seçenekleri */}
      <View style={styles.ratioContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.ratioScrollContent}>
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
      </View>
      
      {/* Alt Kısım: İşlem butonları - SADECE 3 BUTON */}
      <View style={styles.actionContainer}>
        <TouchableOpacity onPress={onRotate} style={styles.actionButton}>
          <Feather name="rotate-cw" size={20} color={Colors.textPrimary} />
          <Text style={styles.actionText}>Döndür</Text>
        </TouchableOpacity>
        
        <TouchableOpacity onPress={onReset} style={styles.actionButton}>
          <Feather name="refresh-ccw" size={20} color={Colors.textPrimary} />
          <Text style={styles.actionText}>Sıfırla</Text>
        </TouchableOpacity>
        
        <TouchableOpacity onPress={onApplyCrop} style={[styles.actionButton, styles.applyButton]}>
          <Feather name="check" size={24} color={Colors.card} />
          <Text style={[styles.actionText, styles.applyText]}>Uygula</Text>
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
  ratioContainer: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingVertical: Spacing.md,
  },
  ratioScrollContent: {
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.md,
  },
  ratioButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.gray100,
    minWidth: 60,
    alignItems: 'center',
  },
  ratioButtonActive: {
    backgroundColor: Colors.primary,
  },
  ratioText: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontWeight: '500',
    fontSize: 14,
  },
  ratioTextActive: {
    color: Colors.card,
    fontWeight: '600',
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  actionButton: {
    alignItems: 'center',
    padding: Spacing.md,
    minWidth: 80,
    borderRadius: BorderRadius.lg,
  },
  applyButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  actionText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    fontWeight: '500',
  },
  applyText: {
    ...Typography.bodyMedium,
    color: Colors.card,
    fontWeight: '700',
    marginTop: Spacing.xs,
  },
});