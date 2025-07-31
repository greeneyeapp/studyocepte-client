// app/(tabs)/editor/components/ExportToolbar.tsx
import React, { useState } from 'react';
import { View, ScrollView, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants';
import { ExportPresetCard, ShareOptionButton } from './ExportComponents';
import { useExportManager } from '../hooks/useExportManager';
import { 
  EXPORT_PRESETS, 
  SHARE_OPTIONS, 
  EXPORT_CATEGORIES,
  ExportPreset 
} from '../config/exportTools';
import { Button } from '@/components/Button';

interface ExportToolbarProps {
  activeTool: string;
}

export const ExportToolbar: React.FC<ExportToolbarProps> = ({ activeTool }) => {
  const {
    selectedPreset,
    isExporting,
    setSelectedPreset,
    shareWithOption,
    batchExport,
  } = useExportManager();

  const [selectedCategory, setSelectedCategory] = useState<string>('social');
  const [showBatchMode, setShowBatchMode] = useState(false);
  const [selectedPresets, setSelectedPresets] = useState<ExportPreset[]>([]);

  // Sadece export tool aktifken göster
  if (activeTool !== 'export') {
    return null;
  }

  // Kategoriye göre preset'leri filtrele
  const filteredPresets = EXPORT_PRESETS.filter(preset => preset.category === selectedCategory);

  const handlePresetSelect = (preset: ExportPreset) => {
    if (showBatchMode) {
      setSelectedPresets(prev => {
        const exists = prev.find(p => p.id === preset.id);
        if (exists) {
          return prev.filter(p => p.id !== preset.id);
        } else {
          return [...prev, preset];
        }
      });
    } else {
      setSelectedPreset(preset);
    }
  };

  const handleBatchExport = async () => {
    if (selectedPresets.length === 0) {
      return;
    }
    await batchExport(selectedPresets);
    setSelectedPresets([]);
    setShowBatchMode(false);
  };

  const isPresetSelected = (preset: ExportPreset) => {
    if (showBatchMode) {
      return selectedPresets.some(p => p.id === preset.id);
    }
    return selectedPreset?.id === preset.id;
  };

  return (
    <View style={styles.container}>
      {/* Kategori Seçici */}
      <View style={styles.categoryContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
          {EXPORT_CATEGORIES.map((category) => (
            <TouchableOpacity
              key={category.key}
              style={[
                styles.categoryButton,
                selectedCategory === category.key && styles.categoryButtonActive
              ]}
              onPress={() => setSelectedCategory(category.key)}
            >
              <Feather 
                name={category.icon as any} 
                size={16} 
                color={selectedCategory === category.key ? Colors.primary : Colors.textSecondary} 
              />
              <Text style={[
                styles.categoryText,
                selectedCategory === category.key && styles.categoryTextActive
              ]}>
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Toplu Export Modu Toggle */}
      <View style={styles.modeContainer}>
        <TouchableOpacity
          style={[styles.modeButton, showBatchMode && styles.modeButtonActive]}
          onPress={() => {
            setShowBatchMode(!showBatchMode);
            setSelectedPresets([]);
          }}
        >
          <Feather 
            name="layers" 
            size={16} 
            color={showBatchMode ? Colors.primary : Colors.textSecondary} 
          />
          <Text style={[
            styles.modeText,
            showBatchMode && styles.modeTextActive
          ]}>
            Toplu Export
          </Text>
        </TouchableOpacity>

        {showBatchMode && selectedPresets.length > 0 && (
          <Button
            title={`${selectedPresets.length} Dosya Export Et`}
            onPress={handleBatchExport}
            size="small"
            disabled={isExporting}
            loading={isExporting}
            style={styles.batchButton}
          />
        )}
      </View>

      {/* Export Preset'leri */}
      <ScrollView style={styles.presetContainer} showsVerticalScrollIndicator={false}>
        {filteredPresets.map((preset) => (
          <ExportPresetCard
            key={preset.id}
            preset={preset}
            isSelected={isPresetSelected(preset)}
            onPress={() => handlePresetSelect(preset)}
          />
        ))}
      </ScrollView>

      {/* Paylaşım Seçenekleri - Sadece tek seçim modunda */}
      {!showBatchMode && selectedPreset && (
        <View style={styles.shareContainer}>
          <Text style={styles.shareTitle}>Paylaş veya Kaydet</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.shareScroll}>
            {SHARE_OPTIONS.map((option) => (
              <ShareOptionButton
                key={option.id}
                option={option}
                onPress={() => shareWithOption(option)}
                disabled={isExporting}
              />
            ))}
          </ScrollView>
        </View>
      )}

      {/* Seçili Preset Bilgileri */}
      {!showBatchMode && selectedPreset && (
        <View style={styles.infoContainer}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Boyut:</Text>
            <Text style={styles.infoValue}>
              {selectedPreset.dimensions.width} × {selectedPreset.dimensions.height}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Format:</Text>
            <Text style={styles.infoValue}>{selectedPreset.format.toUpperCase()}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Kalite:</Text>
            <Text style={styles.infoValue}>{Math.round(selectedPreset.quality * 100)}%</Text>
          </View>
        </View>
      )}

      {/* Toplu Export Bilgileri */}
      {showBatchMode && (
        <View style={styles.batchInfoContainer}>
          <Text style={styles.batchInfoText}>
            {selectedPresets.length} preset seçildi
          </Text>
          {selectedPresets.length > 0 && (
            <Text style={styles.batchInfoDetail}>
              Toplam boyut: {selectedPresets.reduce((acc, p) => acc + (p.dimensions.width * p.dimensions.height / 1000000), 0).toFixed(1)}MP
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.card,
    maxHeight: 400,
  },
  
  // Kategori stilleri
  categoryContainer: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingVertical: Spacing.sm,
  },
  categoryScroll: {
    paddingHorizontal: Spacing.md,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginRight: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.gray100,
  },
  categoryButtonActive: {
    backgroundColor: Colors.primary + '15',
  },
  categoryText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginLeft: Spacing.xs,
    fontWeight: '500',
  },
  categoryTextActive: {
    color: Colors.primary,
    fontWeight: '600',
  },

  // Mod container
  modeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  modeButtonActive: {
    backgroundColor: Colors.primary + '15',
  },
  modeText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginLeft: Spacing.xs,
    fontWeight: '500',
  },
  modeTextActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  batchButton: {
    paddingHorizontal: Spacing.md,
  },

  // Preset container
  presetContainer: {
    maxHeight: 200,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },

  // Paylaşım container
  shareContainer: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingVertical: Spacing.md,
  },
  shareTitle: {
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.md,
    fontWeight: '600',
  },
  shareScroll: {
    paddingHorizontal: Spacing.md,
  },

  // Bilgi container
  infoContainer: {
    backgroundColor: Colors.gray50,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  infoLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  infoValue: {
    ...Typography.caption,
    color: Colors.textPrimary,
    fontWeight: '600',
  },

  // Toplu export bilgi
  batchInfoContainer: {
    backgroundColor: Colors.primary + '10',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  batchInfoText: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '600',
  },
  batchInfoDetail: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
});