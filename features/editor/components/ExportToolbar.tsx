import React, { useState } from 'react';
import { View, ScrollView, Text, StyleSheet, TouchableOpacity, LayoutAnimation } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants';
import { ExportPresetCard, ShareOptionButton } from './ExportComponents';
import { 
  EXPORT_PRESETS, 
  SHARE_OPTIONS,
  EXPORT_CATEGORIES,
  ExportPreset,
  ShareOption,
} from '../config/exportTools';
import { InputDialogService } from '@/components/Dialog/InputDialogService';
import { ToastService } from '@/components/Toast/ToastService';

interface ExportToolbarProps {
  activeTool: string;
  selectedPreset: ExportPreset | null;
  isExporting: boolean;
  setSelectedPreset: (preset: ExportPreset | null) => void;
  shareWithOption: (option: ShareOption) => Promise<void>;
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

  // DÜZELTME: Özel boyut girişinin sorunsuz çalışması için yeni mantık
  const handleCustomSizeInput = (originalPreset: ExportPreset) => {
    InputDialogService.show({
      title: 'Genişlik Girin (px)',
      placeholder: 'Örn: 1920',
      onConfirm: (widthText) => {
        const width = parseInt(widthText, 10);
        if (isNaN(width) || width <= 0) {
          ToastService.show({ type: 'error', text1: 'Geçersiz Değer', text2: 'Lütfen pozitif bir sayı girin.' });
          return;
        }

        // Pop-up'ın kapanmasını bekleyip yenisini açmak için küçük bir gecikme
        setTimeout(() => {
          InputDialogService.show({
            title: 'Yükseklik Girin (px)',
            placeholder: 'Örn: 1080',
            onConfirm: (heightText) => {
              const height = parseInt(heightText, 10);
              if (isNaN(height) || height <= 0) {
                ToastService.show({ type: 'error', text1: 'Geçersiz Değer', text2: 'Lütfen pozitif bir sayı girin.' });
                return;
              }

              const customPreset: ExportPreset = {
                ...originalPreset,
                id: `custom_${width}x${height}`,
                name: `Özel Boyut`,
                description: `${width} × ${height} piksel`,
                dimensions: { width, height },
              };
              
              setSelectedPreset(customPreset);
            },
          });
        }, 300); // 300 milisaniye gecikme
      },
    });
  };

  const handlePresetSelect = (preset: ExportPreset) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (preset.id === 'custom_size_input') {
      handleCustomSizeInput(preset);
    } else {
      setSelectedPreset(selectedPreset?.id === preset.id ? null : preset);
    }
  };

  const filteredPresets = EXPORT_PRESETS.filter(p => p.category === selectedCategory);

  return (
    <View style={styles.container}>
      <View>
        <View style={styles.categoryContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
            {EXPORT_CATEGORIES.map((category) => (
              <TouchableOpacity 
                key={category.key} 
                style={[styles.categoryButton, selectedCategory === category.key && styles.categoryButtonActive]} 
                onPress={() => setSelectedCategory(category.key)}
              >
                <Feather name={category.icon as any} size={16} color={selectedCategory === category.key ? Colors.primary : Colors.textSecondary} />
                <Text style={[styles.categoryText, selectedCategory === category.key && styles.categoryTextActive]}>{category.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      <ScrollView style={styles.presetListWrapper} contentContainerStyle={styles.presetListContainer}>
        {filteredPresets.map((preset) => (
          <ExportPresetCard key={preset.id} preset={preset} isSelected={selectedPreset?.id === preset.id} onPress={() => handlePresetSelect(preset)} />
        ))}
      </ScrollView>

      {selectedPreset && (
        <View style={styles.shareContainer}>
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

// Stillerde değişiklik yok
const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'column', backgroundColor: Colors.background, },
  categoryContainer: { 
    borderBottomWidth: 1, 
    borderBottomColor: Colors.border, 
    backgroundColor: Colors.background, 
    paddingBottom: Spacing.md,
    paddingTop: Spacing.sm,
  },
  categoryScroll: { paddingHorizontal: Spacing.md },
  categoryButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, marginRight: Spacing.md, borderRadius: BorderRadius.md, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border },
  categoryButtonActive: { backgroundColor: Colors.primary + '15', borderColor: Colors.primary, },
  categoryText: { ...Typography.caption, color: Colors.textSecondary, marginLeft: Spacing.xs, fontWeight: '500' },
  categoryTextActive: { color: Colors.primary, fontWeight: '600' },
  presetListWrapper: { flex: 1, },
  presetListContainer: { padding: Spacing.md, },
  shareContainer: { paddingVertical: Spacing.lg, backgroundColor: Colors.card, borderTopWidth: 1, borderTopColor: Colors.border, },
  shareButtonsWrapper: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: Spacing.xl, paddingHorizontal: Spacing.md },
});