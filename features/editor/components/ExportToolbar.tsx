// features/editor/components/ExportToolbar.tsx - SİMPLİFİED EXPORT TOOLBAR

import React, { useState } from 'react';
import { View, ScrollView, Text, StyleSheet, TouchableOpacity, LayoutAnimation } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants';
import { EXPORT_PRESETS, SHARE_OPTIONS, EXPORT_CATEGORIES, ExportPreset, ShareOption } from '../config/exportTools';
import { ToastService } from '@/components/Toast/ToastService';

interface ExportToolbarProps {
  selectedPreset: ExportPreset | null;
  isExporting: boolean;
  setSelectedPreset: (preset: ExportPreset | null) => void;
  shareWithOption: (option: ShareOption, preset?: ExportPreset) => Promise<void>;
}

// Kompakt preset kartı
const CompactPresetCard: React.FC<{
  preset: ExportPreset;
  isSelected: boolean;
  onPress: () => void;
}> = ({ preset, isSelected, onPress }) => {
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
      style={[styles.compactCard, isSelected && styles.compactCardSelected]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.compactHeader}>
        <View style={[styles.compactIcon, { backgroundColor: getCategoryColor(preset.category) }]}>
          <Feather name={preset.icon as any} size={16} color={Colors.card} />
        </View>
        <View style={styles.compactInfo}>
          <Text style={styles.compactTitle} numberOfLines={1}>{preset.name}</Text>
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

// Ana export butonları
const ExportActionButton: React.FC<{
  option: ShareOption;
  onPress: () => void;
  disabled?: boolean;
}> = ({ option, onPress, disabled = false }) => {
  const getButtonStyle = (type: string) => {
    switch (type) {
      case 'gallery': return { bg: '#34C759', text: 'Galeriye Kaydet' };
      case 'generic': return { bg: Colors.primary, text: 'Paylaş' };
      default: return { bg: Colors.primary, text: option.name };
    }
  };

  const buttonStyle = getButtonStyle(option.type);

  return (
    <TouchableOpacity
      style={[
        styles.actionButton,
        { backgroundColor: disabled ? Colors.gray300 : buttonStyle.bg }
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <Feather
        name={option.icon as any}
        size={20}
        color={disabled ? Colors.gray500 : Colors.card}
      />
      <Text style={[
        styles.actionButtonText,
        { color: disabled ? Colors.gray500 : Colors.card }
      ]}>
        {buttonStyle.text}
      </Text>
    </TouchableOpacity>
  );
};

export const ExportToolbar: React.FC<ExportToolbarProps> = ({
  selectedPreset,
  isExporting,
  setSelectedPreset,
  shareWithOption,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('social');

  const handlePresetSelect = (preset: ExportPreset) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelectedPreset(selectedPreset?.id === preset.id ? null : preset);
  };

  const handleShareOptionPress = async (option: ShareOption) => {
    if (!selectedPreset) {
      ToastService.show('Lütfen önce bir dışa aktarma formatı seçin.');
      return;
    }
    await shareWithOption(option, selectedPreset);
  };

  const filteredPresets = EXPORT_PRESETS.filter(p => p.category === selectedCategory);
  
  // Sadece gallery ve generic paylaşım seçenekleri (quick_custom kaldırıldı)
  const filteredShareOptions = SHARE_OPTIONS.filter(opt => opt.type !== 'quick_custom');

  return (
    <View style={styles.container}>
      {/* Üst Kısım - Seçili Format ve Export Butonları */}
      <View style={styles.actionsSection}>
        {selectedPreset ? (
          <>
            <Text style={styles.sectionTitle}>{selectedPreset.name}</Text>
            <Text style={styles.selectedPresetInfo}>
              {`${selectedPreset.dimensions.width} × ${selectedPreset.dimensions.height} • ${selectedPreset.format.toUpperCase()}`}
            </Text>
            <View style={styles.actionsRow}>
              {filteredShareOptions.map((option) => (
                <ExportActionButton 
                  key={option.id} 
                  option={option} 
                  onPress={() => handleShareOptionPress(option)} 
                  disabled={isExporting}
                />
              ))}
            </View>
          </>
        ) : (
          <View style={styles.noSelectionContainer}>
            <Text style={styles.sectionTitle}>Format Seçin</Text>
            <Text style={styles.selectedPresetInfo}>Dışa aktarmak için bir format seçin</Text>
          </View>
        )}
      </View>

      {/* Kategori Seçici */}
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
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Preset Listesi */}
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
  
  actionsSection: { 
    backgroundColor: Colors.card, 
    padding: Spacing.lg, 
    borderBottomWidth: 1, 
    borderBottomColor: Colors.border, 
    minHeight: 140, 
    justifyContent: 'center' 
  },
  
  sectionTitle: { 
    ...Typography.h2, 
    color: Colors.textPrimary, 
    textAlign: 'center', 
    marginBottom: Spacing.xs 
  },
  
  selectedPresetInfo: { 
    ...Typography.body, 
    color: Colors.textSecondary, 
    textAlign: 'center', 
    marginBottom: Spacing.lg 
  },
  
  actionsRow: { 
    flexDirection: 'row', 
    justifyContent: 'center', 
    gap: Spacing.md 
  },
  
  noSelectionContainer: { 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingHorizontal: Spacing.xl 
  },
  
  actionButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: Spacing.md, 
    paddingHorizontal: Spacing.lg, 
    borderRadius: BorderRadius.lg, 
    gap: Spacing.sm, 
    shadowColor: Colors.shadow, 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 4, 
    elevation: 3, 
    minWidth: 140, 
    flex: 1, 
    maxWidth: 200
  },
  
  actionButtonText: { 
    ...Typography.bodyMedium, 
    fontWeight: '600' 
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