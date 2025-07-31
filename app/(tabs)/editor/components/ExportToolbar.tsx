// kodlar/app/(tabs)/editor/components/ExportToolbar.tsx
import React, { useState } from 'react';
import { View, ScrollView, Text, StyleSheet, TouchableOpacity, LayoutAnimation } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants';
import { ExportPresetCard, ShareOptionButton } from './ExportComponents';
import { 
  EXPORT_PRESETS, 
  SHARE_OPTIONS, // Artık sadeleştirilmiş listeyi kullanacak
  EXPORT_CATEGORIES,
  ExportPreset,
  ShareOption,
} from '../config/exportTools';

interface ExportToolbarProps {
  activeTool: string;
  selectedPreset: ExportPreset | null;
  isExporting: boolean;
  setSelectedPreset: (preset: ExportPreset | null) => void;
  shareWithOption: (option: ShareOption) => Promise<void>;
  batchExport: (presets: ExportPreset[]) => Promise<any>;
}

export const ExportToolbar: React.FC<ExportToolbarProps> = ({
  activeTool,
  selectedPreset,
  isExporting,
  setSelectedPreset,
  shareWithOption,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('social');

  if (activeTool !== 'export') return null;

  const handlePresetSelect = (preset: ExportPreset) => {
    // Geçiş animasyonu ekleyerek daha akıcı bir görünüm sağlıyoruz
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (selectedPreset?.id === preset.id) {
      setSelectedPreset(null);
    } else {
      setSelectedPreset(preset);
    }
  };

  const filteredPresets = EXPORT_PRESETS.filter(p => p.category === selectedCategory);

  return (
    <View style={styles.container}>
      {/* Kategori Seçimi */}
      <View style={styles.categoryContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
          {EXPORT_CATEGORIES.map((category) => (
            <TouchableOpacity key={category.key} style={[styles.categoryButton, selectedCategory === category.key && styles.categoryButtonActive]} onPress={() => setSelectedCategory(category.key)}>
              <Feather name={category.icon as any} size={16} color={selectedCategory === category.key ? Colors.primary : Colors.textSecondary} />
              <Text style={[styles.categoryText, selectedCategory === category.key && styles.categoryTextActive]}>{category.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Preset Seçim Listesi */}
      <ScrollView style={styles.presetContainer}>
        {filteredPresets.map((preset) => (
          <ExportPresetCard key={preset.id} preset={preset} isSelected={selectedPreset?.id === preset.id} onPress={() => handlePresetSelect(preset)} />
        ))}
      </ScrollView>

      {/* Paylaşım Alanı (Sadece bir preset seçildiğinde görünür) */}
      {selectedPreset && (
        <View style={styles.shareContainer}>
          <Text style={styles.shareTitle}>{selectedPreset.name} için seçenekler</Text>
          {/* Butonları yan yana göstermek için bir View */}
          <View style={styles.shareButtonsWrapper}>
            {SHARE_OPTIONS.map((option) => (
              <ShareOptionButton key={option.id} option={option} onPress={() => shareWithOption(option)} disabled={isExporting} />
            ))}
          </View>
        </View>
      )}
    </View>
  );
};


const styles = StyleSheet.create({
  container: { backgroundColor: Colors.card, borderTopWidth: 1, borderTopColor: Colors.border, maxHeight: 420 },
  categoryContainer: { borderBottomWidth: 1, borderBottomColor: Colors.border, paddingVertical: Spacing.sm },
  categoryScroll: { paddingHorizontal: Spacing.md },
  categoryButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, marginRight: Spacing.md, borderRadius: BorderRadius.md, backgroundColor: Colors.gray100 },
  categoryButtonActive: { backgroundColor: Colors.primary + '15' },
  categoryText: { ...Typography.caption, color: Colors.textSecondary, marginLeft: Spacing.xs, fontWeight: '500' },
  categoryTextActive: { color: Colors.primary, fontWeight: '600' },
  presetContainer: { maxHeight: 220, padding: Spacing.md },
  shareContainer: { borderTopWidth: 1, borderTopColor: Colors.border, paddingVertical: Spacing.md, backgroundColor: Colors.gray50 },
  shareTitle: { ...Typography.bodyMedium, color: Colors.textPrimary, marginBottom: Spacing.md, paddingHorizontal: Spacing.md, fontWeight: '600', textAlign: 'center' },
  shareButtonsWrapper: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.xl,
    paddingHorizontal: Spacing.md,
  },
});