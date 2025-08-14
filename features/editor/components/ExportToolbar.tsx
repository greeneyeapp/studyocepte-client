// features/editor/components/ExportToolbar.tsx - DÜZELTİLDİ

import React, { useState } from 'react';
import { View, ScrollView, Text, StyleSheet, TouchableOpacity, LayoutAnimation, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants';
import { EXPORT_PRESETS, SHARE_OPTIONS, EXPORT_CATEGORIES, ExportPreset, ShareOption } from '../config/exportTools';
import { ToastService } from '@/components/Toast/ToastService';
import { BottomSheetService, BottomSheetAction } from '@/components/BottomSheet/BottomSheetService';
import { useTranslation } from 'react-i18next';

interface ExportToolbarProps {
  selectedPreset: ExportPreset | null;
  isExporting: boolean;
  setSelectedPreset: (preset: ExportPreset | null) => void;
  shareWithOption: (option: ShareOption, preset?: ExportPreset) => Promise<void>;
}

const CompactPresetCard: React.FC<{
  preset: ExportPreset;
  isSelected: boolean;
  onPress: () => void;
}> = ({ preset, isSelected, onPress }) => {
  const { t } = useTranslation();
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'social': return '#FF6B6B';
      case 'marketplace': return '#4ECDC4';
      case 'print': return '#45B7D1';
      case 'custom': return '#96CEB4';
      case 'web': return '#FFA726';
      default: return Colors.primary;
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.compactCard,
        isSelected && styles.compactCardSelected
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.compactHeader}>
        <View style={[styles.compactIcon, { backgroundColor: getCategoryColor(preset.category) }]}>
          <Feather name={preset.icon as any} size={16} color={Colors.card} />
        </View>
        <View style={styles.compactInfo}>
          <Text style={styles.compactTitle} numberOfLines={1}>{t(preset.name)}</Text> {/* preset.name artık çeviri anahtarı */}
          <Text style={styles.compactDimensions}>
            {preset.dimensions.width} × {preset.dimensions.height}
          </Text>
        </View>
        {isSelected && (
          <Feather name="check-circle" size={18} color={Colors.primary} />
        )}
      </View>
    </TouchableOpacity>
  );
};

export const ExportToolbar: React.FC<ExportToolbarProps> = ({
  selectedPreset,
  isExporting,
  setSelectedPreset,
  shareWithOption,
}) => {
  const { t } = useTranslation();
  const [selectedCategory, setSelectedCategory] = useState<string>('social');

  const handlePresetSelect = (preset: ExportPreset) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    setSelectedPreset(preset);

    const actions: BottomSheetAction[] = SHARE_OPTIONS.map(option => ({
      id: option.id,
      text: t(option.name), // option.name artık çeviri anahtarı
      icon: option.icon as any,
      onPress: () => {
        setTimeout(() => shareWithOption(option, preset), 300);
      },
    }));

    BottomSheetService.show({
      title: t('export.exportingFormatTitle', { presetName: t(preset.name), dimensions: `${preset.dimensions.width}×${preset.dimensions.height}` }),
      actions: actions,
    });
  };

  const filteredPresets = EXPORT_PRESETS.filter(p => p.category === selectedCategory);

  return (
    <View style={styles.container}>
      <View style={styles.categorySection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
          {EXPORT_CATEGORIES.map((category) => (
            <TouchableOpacity
              key={category.key}
              style={[
                styles.categoryChip,
                selectedCategory === category.key && styles.categoryChipActive
              ]}
              onPress={() => setSelectedCategory(category.key)}
            >
              <Feather
                name={category.icon as any}
                size={14}
                color={selectedCategory === category.key ? Colors.card : Colors.textSecondary}
              />
              <Text style={[
                styles.categoryChipText,
                selectedCategory === category.key && styles.categoryChipTextActive
              ]}>
                {t(category.name)} {/* category.name artık çeviri anahtarı */}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={styles.presetsSection} contentContainerStyle={styles.presetsContainer}>
        {filteredPresets.map((preset) => (
          <CompactPresetCard
            key={preset.id}
            preset={preset}
            isSelected={selectedPreset?.id === preset.id}
            onPress={() => handlePresetSelect(preset)}
          />
        ))}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background
  },

  exportMainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.primary,
    gap: Spacing.sm,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  exportMainButtonDisabled: {
    backgroundColor: Colors.gray400,
    shadowColor: Colors.gray400,
  },
  exportMainButtonText: {
    ...Typography.bodyMedium,
    color: Colors.card,
    fontWeight: '600',
  },

  noSelectionContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    flex: 1,
  },

  categorySection: {
    backgroundColor: Colors.card,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border
  },

  categoryScroll: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm
  },

  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.gray100,
    borderWidth: 1,
    borderColor: "transparent",
    gap: Spacing.xs
  },

  categoryChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary
  },

  categoryChipText: {
    ...Typography.caption,
    fontWeight: '500',
    color: Colors.textSecondary
  },

  categoryChipTextActive: {
    color: Colors.card
  },

  presetsSection: {
    flex: 1
  },

  presetsContainer: {
    padding: Spacing.md
  },

  compactCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border
  },

  compactCardSelected: {
    borderColor: Colors.primary,
    borderWidth: 2,
    backgroundColor: Colors.primary + '05'
  },

  compactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md
  },

  compactIcon: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center'
  },

  compactInfo: {
    flex: 1
  },

  compactTitle: {
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
    fontWeight: '600'
  },

  compactDimensions: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2
  },
});