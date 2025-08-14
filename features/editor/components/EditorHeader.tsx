// features/editor/components/EditorHeader.tsx - ENHANCED UNDO/REDO VİSİBİLİTY
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Feather } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants';
import { DialogService } from '@/components/Dialog/DialogService';

interface EditorHeaderProps {
  onCancel: () => void;
  onSave: (withThumbnailUpdate?: boolean) => void;
  isSaving: boolean;

  // Undo/Redo için proplar
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;

  // Reset ve thumbnail durumu
  onResetAll: () => void;
  isUpdatingThumbnail?: boolean;
  hasDraftChanges?: boolean;

  // Draft Manager props
  totalDraftsCount?: number;
  onShowDraftManager?: () => void;
}

export const EditorHeader: React.FC<EditorHeaderProps> = ({
  onCancel,
  onSave,
  isSaving,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onResetAll,
  isUpdatingThumbnail = false,
  hasDraftChanges = false,
  totalDraftsCount = 0,
  onShowDraftManager,
}) => {
  const { t } = useTranslation();

  const handleResetAllPress = () => {
    DialogService.show({
      title: t('editor.resetAllSettingsTitle'),
      message: t('editor.resetAllSettingsMessage'),
      buttons: [
        {
          text: t('common.cancel'),
          style: 'cancel'
        },
        {
          text: t('common.reset'),
          style: 'destructive',
          onPress: onResetAll
        }
      ]
    });
  };

  const handleSavePress = () => {
    console.log(t('editor.saveButtonPressedLog'));
    onSave(true);
  };

  const getSaveButtonTitle = () => {
    if (isSaving) return t('common.saving');
    if (isUpdatingThumbnail) return t('editor.thumbnailUpdating');
    return t('common.done');
  };

  const getSaveButtonIcon = () => {
    if (isSaving || isUpdatingThumbnail) {
      return <ActivityIndicator size="small" color={Colors.primary} />;
    }
    return null;
  };

  return (
    <View style={styles.container}>
      {/* Sol taraf - Cancel butonu */}
      <View style={styles.leftSection}>
        <TouchableOpacity onPress={onCancel} style={styles.button}>
          <Text style={styles.cancelText}>{t('common.cancel')}</Text>
        </TouchableOpacity>
      </View>

      {/* Orta kısım - History, Reset ve Draft controls */}
      <View style={styles.centerSection}>
        <View style={styles.historyButtons}>
          <TouchableOpacity
            onPress={onUndo}
            disabled={!canUndo}
            style={[
              styles.historyButton,
              !canUndo && styles.disabledButton
            ]}
            activeOpacity={canUndo ? 0.7 : 1}
          >
            <Feather
              name="rotate-ccw"
              size={18}
              color={canUndo ? Colors.textPrimary : Colors.border}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onRedo}
            disabled={!canRedo}
            style={[
              styles.historyButton,
              !canRedo && styles.disabledButton
            ]}
            activeOpacity={canRedo ? 0.7 : 1}
          >
            <Feather
              name="rotate-cw"
              size={18}
              color={canRedo ? Colors.textPrimary : Colors.border}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.controlRow}>
          <TouchableOpacity
            onPress={handleResetAllPress}
            style={styles.resetButton}
            disabled={isSaving || isUpdatingThumbnail}
          >
            <Feather
              name="refresh-ccw"
              size={14}
              color={isSaving || isUpdatingThumbnail ? Colors.border : Colors.error}
            />
            <Text
              style={[
                styles.resetText,
                (isSaving || isUpdatingThumbnail) && styles.disabledText
              ]}
            >
              {t('common.reset')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Sağ taraf - Save butonu */}
      <View style={styles.rightSection}>
        <TouchableOpacity
          onPress={handleSavePress}
          disabled={isSaving || isUpdatingThumbnail}
          style={[styles.button, styles.saveButton]}
        >
          <View style={styles.saveButtonContent}>
            {getSaveButtonIcon()}
            <Text
              style={[
                styles.doneText,
                (isSaving || isUpdatingThumbnail) && styles.disabledText
              ]}
            >
              {getSaveButtonTitle()}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.card,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
    minHeight: 64,
    zIndex: 1000,
    elevation: 5,
  },

  leftSection: {
    flex: 1,
    alignItems: 'flex-start',
    zIndex: 1001,
  },

  centerSection: {
    flex: 2,
    alignItems: 'center',
    gap: Spacing.sm,
    zIndex: 1002,
    pointerEvents: 'box-none',
  },

  rightSection: {
    flex: 1,
    alignItems: 'flex-end',
    zIndex: 1001,
  },

  button: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    minWidth: 60,
  },

  saveButton: {
    alignItems: 'flex-end',
  },

  saveButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },

  cancelText: {
    ...Typography.body,
    color: Colors.primary,
    textAlign: 'left',
  },

  doneText: {
    ...Typography.bodyMedium,
    color: Colors.primary,
    textAlign: 'right',
  },

  disabledText: {
    opacity: 0.5,
  },

  historyButtons: {
    flexDirection: 'row',
    gap: Spacing.xs,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
    zIndex: 1003,
    minWidth: 100,
    justifyContent: 'center',
  },

  historyButton: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    minWidth: 40,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: 'transparent',
    zIndex: 1004,
  },

  disabledButton: {
    opacity: 0.6,
    backgroundColor: Colors.gray100,
    borderColor: Colors.border,
  },

  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },

  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.error + '10',
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.error + '30',
  },

  resetText: {
    ...Typography.caption,
    color: Colors.error,
    fontWeight: '600',
    fontSize: 11,
  },

  draftStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },

  activeDraftBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs / 2,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs / 2,
    backgroundColor: Colors.success + '15',
    borderRadius: BorderRadius.sm,
  },

  draftDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.success,
  },

  draftText: {
    ...Typography.caption,
    color: Colors.success,
    fontWeight: '500',
    fontSize: 10,
  },

  draftsCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs / 2,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs / 2,
    backgroundColor: Colors.primary + '15',
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },

  draftsCountText: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '600',
    fontSize: 10,
  },
});