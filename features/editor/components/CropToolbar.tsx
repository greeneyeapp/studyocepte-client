// features/editor/components/CropToolbar.tsx - UYARI GİDERİLDİ (KESİN ÇÖZÜM)

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

const ACTION_BUTTON_DIMENSIONS = {
  width: 90,
  height: 70,
};

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
              {/* KESİN ÇÖZÜM: ratio.label zaten string olmalı ama garanti için String() kullanımı */}
              <Text style={[styles.ratioText, activeRatio === ratio.key && styles.ratioTextActive]}>
                {String(ratio.label)} 
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      
      {/* Alt Kısım: İşlem butonları - Aynı boyutta ve ortalanmış */}
      <View style={styles.actionContainer}>
        {/* Döndür Butonu */}
        <TouchableOpacity onPress={onRotate} style={styles.actionButton}>
          {/* İçerik sarmalayan View */}
          <View style={styles.actionButtonContent}>
            <Feather name="rotate-cw" size={20} color={Colors.textPrimary} />
            <Text style={styles.actionText}>Döndür</Text>
          </View>
        </TouchableOpacity>
        
        {/* Sıfırla Butonu */}
        <TouchableOpacity onPress={onReset} style={styles.actionButton}>
          {/* İçerik sarmalayan View */}
          <View style={styles.actionButtonContent}>
            <Feather name="refresh-ccw" size={20} color={Colors.textPrimary} />
            <Text style={styles.actionText}>Sıfırla</Text>
          </View>
        </TouchableOpacity>
        
        {/* Uygula Butonu */}
        <TouchableOpacity onPress={onApplyCrop} style={[styles.actionButton, styles.applyButton]}>
          {/* İçerik sarmalayan View */}
          <View style={styles.actionButtonContent}>
            <Feather name="check" size={24} color={Colors.card} />
            <Text style={[styles.actionText, styles.applyText]}>Uygula</Text>
          </View>
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  actionButton: {
    width: ACTION_BUTTON_DIMENSIONS.width,
    height: ACTION_BUTTON_DIMENSIONS.height,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.lg,
    backgroundColor: 'transparent',
  },
  actionButtonContent: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs, // İkon ve metin arasına boşluk koy
  },
  applyButton: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  actionText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  applyText: {
    ...Typography.bodyMedium,
    color: Colors.card,
    fontWeight: '700',
  },
});