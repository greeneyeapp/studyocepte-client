// features/editor/components/ExportToolbar.tsx - SİMPLİFİİED EXPORT TOOLBAR (GALERİ VE PAYLAŞ BUTONLARI ALT MENÜYE TAŞINDI, BUTON GÖRÜNÜRLÜĞÜ DÜZELTİLDİ, 'FORMAT SEÇİN' ALANI VE BOŞ ALANI TAMAMEN KALDIRILDI VE SEÇİM DOĞRUDAN BOTTOMSHEET'İ TETİKLER)

import React, { useState } from 'react';
import { View, ScrollView, Text, StyleSheet, TouchableOpacity, LayoutAnimation, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants';
import { EXPORT_PRESETS, SHARE_OPTIONS, EXPORT_CATEGORIES, ExportPreset, ShareOption } from '../config/exportTools';
import { ToastService } from '@/components/Toast/ToastService';
import { BottomSheetService, BottomSheetAction } from '@/components/BottomSheet/BottomSheetService'; // BottomSheetService import edildi

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

export const ExportToolbar: React.FC<ExportToolbarProps> = ({
  selectedPreset,
  isExporting,
  setSelectedPreset,
  shareWithOption,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('social');

  // KESİN ÇÖZÜM: handlePresetSelect artık doğrudan BottomSheet'i tetikleyecek
  const handlePresetSelect = (preset: ExportPreset) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    
    // Preset'i seçili olarak ayarla (UI'da checkmark'ın görünmesi için)
    setSelectedPreset(preset); 

    // BottomSheet için aksiyonları hazırla
    const actions: BottomSheetAction[] = SHARE_OPTIONS.map(option => ({
      id: option.id,
      text: option.name,
      icon: option.icon as any,
      // Doğrudan shareWithOption'ı çağır, selectedPreset'i burada gönderiyoruz
      onPress: () => {
        // BottomSheet kapanırken animation sorununu engellemek için küçük bir gecikme
        setTimeout(() => shareWithOption(option, preset), 100); 
      }, 
    }));

    // BottomSheet'i göster
    BottomSheetService.show({
      title: `${preset.name} (${preset.dimensions.width}×${preset.dimensions.height})`, // Başlıkta seçili preset bilgisi
      actions: actions,
    });
  };

  const filteredPresets = EXPORT_PRESETS.filter(p => p.category === selectedCategory);
  
  return (
    <View style={styles.container}>
      {/* KESİN ÇÖZÜM: actionsSection tamamen kaldırıldı. Export sayfasında üst kısımda boş alan kalmayacak. */}
      {/* selectedPreset null ise hiçbir şey render edilmiyor, selectedPreset varsa da o alan render edilmiyor */}
      
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
            // KESİN ÇÖZÜM: onPress artık doğrudan handlePresetSelect'i çağırıyor
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
  
  // KESİN ÇÖZÜM: actionsSection stili artık JSX'te ilgili View render edilmediği için kullanılmıyor.
  // Ancak referans olarak burada bırakılabilir.
  actionsSection: { 
    backgroundColor: Colors.card, 
    padding: Spacing.lg, 
    borderBottomWidth: 1, 
    borderBottomColor: Colors.border, 
    minHeight: 140, // Bu minHeight artık kullanılmayacak
    justifyContent: 'center',
    alignItems: 'center', 
  },
  
  sectionTitleSmall: { 
    ...Typography.h3, 
    color: Colors.textPrimary, 
    textAlign: 'center', 
    marginBottom: Spacing.xs 
  },
  selectedPresetInfoSmall: { 
    ...Typography.body,
    color: Colors.textSecondary, 
    textAlign: 'center', 
    marginBottom: Spacing.lg 
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