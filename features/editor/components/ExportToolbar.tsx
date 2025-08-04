// features/editor/components/ExportToolbar.tsx - ORİJİNAL EXPORT SEÇENEKLERI

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
  shareWithOption: (option: ShareOption, preset?: ExportPreset) => Promise<void>;
}

export const ExportToolbar: React.FC<ExportToolbarProps> = ({
  activeTool,
  selectedPreset,
  isExporting,
  setSelectedPreset,
  shareWithOption,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('social');

  console.log('🚀 ExportToolbar render:', { activeTool, selectedPreset, isExporting });

  if (activeTool !== 'export') {
    console.log('❌ ExportToolbar: activeTool is not export, returning null');
    return null;
  }

  console.log('✅ ExportToolbar: Rendering full export content');

  // Hızlı custom export fonksiyonu
  const handleQuickCustomExport = () => {
    InputDialogService.show({
      title: 'Genişlik (px)',
      placeholder: 'Örn: 1920',
      onConfirm: (widthText) => {
        const width = parseInt(widthText, 10);
        if (isNaN(width) || width <= 0 || width > 10000) {
          ToastService.show({ 
            type: 'error', 
            text1: 'Geçersiz Değer', 
            text2: 'Lütfen 1-10000 arası bir genişlik girin.' 
          });
          return;
        }

        // İkinci dialog için gecikme
        setTimeout(() => {
          InputDialogService.show({
            title: 'Yükseklik (px)',
            placeholder: 'Örn: 1080',
            onConfirm: async (heightText) => {
              const height = parseInt(heightText, 10);
              if (isNaN(height) || height <= 0 || height > 10000) {
                ToastService.show({ 
                  type: 'error', 
                  text1: 'Geçersiz Değer', 
                  text2: 'Lütfen 1-10000 arası bir yükseklik girin.' 
                });
                return;
              }

              // Özel preset oluştur ve direkt galeriye kaydet
              const quickPreset: ExportPreset = {
                id: `quick_${width}x${height}_${Date.now()}`,
                name: `Özel ${width}×${height}`,
                description: `Kullanıcı tanımlı boyut`,
                dimensions: { width, height },
                format: 'png',
                quality: 0.95,
                category: 'custom',
                icon: 'zap',
              };

              // Direkt galeriye kaydet
              const galleryOption = SHARE_OPTIONS.find(opt => opt.type === 'gallery');
              if (galleryOption) {
                await shareWithOption(galleryOption, quickPreset);
              }
            },
          });
        }, 300);
      },
    });
  };

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
        }, 300);
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

  const handleShareOptionPress = async (option: ShareOption) => {
    if (option.type === 'quick_custom') {
      handleQuickCustomExport();
    } else {
      if (!selectedPreset) {
        ToastService.show({ 
          type: 'error', 
          text1: 'Format Seçin', 
          text2: 'Lütfen önce bir export formatı seçin.' 
        });
        return;
      }
      await shareWithOption(option, selectedPreset);
    }
  };

  const filteredPresets = EXPORT_PRESETS.filter(p => p.category === selectedCategory);

  return (
    <View style={styles.container}>
      {/* Kategori seçici */}
      <View style={styles.categoryContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
          {EXPORT_CATEGORIES.map((category) => (
            <TouchableOpacity 
              key={category.key} 
              style={[styles.categoryButton, selectedCategory === category.key && styles.categoryButtonActive]} 
              onPress={() => setSelectedCategory(category.key)}
            >
              <Feather name={category.icon as any} size={16} color={selectedCategory === category.key ? Colors.primary : Colors.textSecondary} />
              <Text style={[styles.categoryText, selectedCategory === category.key && styles.categoryTextActive]}>
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Preset listesi */}
      <ScrollView style={styles.presetListWrapper} contentContainerStyle={styles.presetListContainer}>
        {filteredPresets.map((preset) => (
          <ExportPresetCard 
            key={preset.id} 
            preset={preset} 
            isSelected={selectedPreset?.id === preset.id} 
            onPress={() => handlePresetSelect(preset)} 
          />
        ))}
      </ScrollView>

      {/* Paylaşım seçenekleri */}
      <View style={styles.shareContainer}>
        <Text style={styles.shareTitle}>Export Seçenekleri</Text>
        <View style={styles.shareButtonsWrapper}>
          {SHARE_OPTIONS.map((option) => (
            <ShareOptionButton 
              key={option.id} 
              option={option} 
              onPress={() => handleShareOptionPress(option)} 
              disabled={isExporting || (option.type !== 'quick_custom' && !selectedPreset)}
            />
          ))}
        </View>
        {!selectedPreset && (
          <Text style={styles.selectPresetHint}>
            Hızlı Boyut dışındaki seçenekler için yukarıdan bir format seçin
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    flexDirection: 'column', 
    backgroundColor: Colors.background,
  },
  categoryContainer: { 
    borderBottomWidth: 1, 
    borderBottomColor: Colors.border, 
    backgroundColor: Colors.background, 
    paddingBottom: Spacing.md,
    paddingTop: Spacing.sm,
  },
  categoryScroll: { 
    paddingHorizontal: Spacing.md 
  },
  categoryButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: Spacing.md, 
    paddingVertical: Spacing.sm, 
    marginRight: Spacing.md, 
    borderRadius: BorderRadius.md, 
    backgroundColor: Colors.card, 
    borderWidth: 1, 
    borderColor: Colors.border 
  },
  categoryButtonActive: { 
    backgroundColor: Colors.primary + '15', 
    borderColor: Colors.primary,
  },
  categoryText: { 
    ...Typography.caption, 
    color: Colors.textSecondary, 
    marginLeft: Spacing.xs, 
    fontWeight: '500' 
  },
  categoryTextActive: { 
    color: Colors.primary, 
    fontWeight: '600' 
  },
  presetListWrapper: { 
    flex: 1,
  },
  presetListContainer: { 
    padding: Spacing.md,
  },
  shareContainer: { 
    paddingVertical: Spacing.lg, 
    backgroundColor: Colors.card, 
    borderTopWidth: 1, 
    borderTopColor: Colors.border,
  },
  shareTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  shareButtonsWrapper: { 
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center', 
    gap: Spacing.xl, 
    paddingHorizontal: Spacing.md 
  },
  selectPresetHint: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    fontStyle: 'italic',
  },
});