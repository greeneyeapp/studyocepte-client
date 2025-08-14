// app/(tabs)/editor/components/ExportPresetCard.tsx - Düzeltilmiş
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants';
import { ExportPreset, ShareOption } from '../config/exportTools';
import { useTranslation } from 'react-i18next'; // useTranslation import edildi

interface ExportPresetCardProps {
  preset: ExportPreset;
  onPress: () => void;
  isSelected?: boolean;
}

export const ExportPresetCard: React.FC<ExportPresetCardProps> = ({
  preset,
  onPress,
  isSelected = false
}) => {
  const { t } = useTranslation(); // t hook'u kullanıldı
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

  const categoryColor = getCategoryColor(preset.category);

  return (
    <TouchableOpacity
      style={[
        styles.container,
        isSelected && styles.selected,
        { borderLeftColor: categoryColor }
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: categoryColor + '20' }]}>
          <Feather name={preset.icon as any} size={20} color={categoryColor} />
        </View>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{t(`exportPresets.${preset.id}.name`)}</Text> {/* Lokalize edildi */}
          <Text style={styles.dimensions}>
            {preset.dimensions.width} × {preset.dimensions.height}
          </Text>
        </View>
        {isSelected && (
          <Feather name="check-circle" size={20} color={Colors.primary} />
        )}
      </View>
      <Text style={styles.description}>{t(`exportPresets.${preset.id}.description`)}</Text> {/* Lokalize edildi */}
      <View style={styles.details}>
        <Text style={styles.format}>{preset.format.toUpperCase()}</Text>
        <Text style={styles.quality}>{t('editor.quality', { quality: Math.round(preset.quality * 100) })}</Text> {/* Lokalize edildi */}
      </View>
    </TouchableOpacity>
  );
};

interface ShareOptionButtonProps {
  option: ShareOption;
  onPress: () => void;
  disabled?: boolean;
}

export const ShareOptionButton: React.FC<ShareOptionButtonProps> = ({
  option,
  onPress,
  disabled = false
}) => {
  const { t } = useTranslation(); // t hook'u kullanıldı
  const getOptionColor = (type: string) => {
    switch (type) {
      case 'gallery': return '#34C759';
      case 'generic': return Colors.primary;
      default: return Colors.primary;
    }
  };

  const optionColor = getOptionColor(option.type);

  return (
    <TouchableOpacity
      style={[styles.shareButton, disabled && styles.shareButtonDisabled]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <View style={[styles.shareIconContainer, { backgroundColor: optionColor }]}>
        <Feather name={option.icon as any} size={20} color={Colors.card} />
      </View>
      <Text style={[styles.shareText, disabled && styles.shareTextDisabled]}>
        {t(`editor.shareOptions.${option.id}`)} {/* Lokalize edildi */}
      </Text>
    </TouchableOpacity>
  );
};

interface ExportPreviewProps {
  preset: ExportPreset;
  imageUri: string;
  backgroundUri?: string;
  settings: any;
}

export const ExportPreview: React.FC<ExportPreviewProps> = ({
  preset,
  imageUri,
  backgroundUri,
  settings
}) => {
  const { t } = useTranslation(); // t hook'u kullanıldı
  const aspectRatio = preset.dimensions.width / preset.dimensions.height;
  const previewWidth = 120;
  const previewHeight = previewWidth / aspectRatio;

  return (
    <View style={styles.previewContainer}>
      <View 
        style={[
          styles.previewFrame,
          {
            width: previewWidth,
            height: previewHeight,
            aspectRatio: aspectRatio
          }
        ]}
      >
        {backgroundUri && (
          <Image
            source={{ uri: backgroundUri }}
            style={styles.previewBackground}
            resizeMode="cover"
          />
        )}
        <Image
          source={{ uri: imageUri }}
          style={styles.previewImage}
          resizeMode="contain"
        />
      </View>
      <Text style={styles.previewDimensions}>
        {t('editor.dimensions', { width: preset.dimensions.width, height: preset.dimensions.height })} {/* Lokalize edildi */}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  // ExportPresetCard styles
  container: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderLeftWidth: 4,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selected: {
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  dimensions: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  description: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    lineHeight: 20,
  },
  details: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  format: {
    ...Typography.captionMedium,
    color: Colors.primary,
    backgroundColor: Colors.primary + '15',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
  },
  quality: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },

  // ShareOptionButton styles
  shareButton: {
    alignItems: 'center',
    minWidth: 80,
    marginHorizontal: Spacing.xs,
  },
  shareButtonDisabled: {
    opacity: 0.5,
  },
  shareIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  shareText: {
    ...Typography.caption,
    color: Colors.textPrimary,
    textAlign: 'center',
    fontWeight: '500',
  },
  shareTextDisabled: {
    color: Colors.textSecondary,
  },

  // ExportPreview styles
  previewContainer: {
    alignItems: 'center',
    marginVertical: Spacing.md,
  },
  previewFrame: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    backgroundColor: Colors.gray100,
    position: 'relative',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  previewBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  previewImage: {
    ...StyleSheet.absoluteFillObject,
  },
  previewDimensions: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    fontWeight: '500',
  },
});