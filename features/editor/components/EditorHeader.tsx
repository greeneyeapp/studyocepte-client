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
  // Draft props
  totalDraftsCount = 0,
  onShowDraftManager,
}) => {
  const { t } = useTranslation();

  const handleResetAllPress = () => {
    DialogService.show({
      title: 'Tüm Ayarları Sıfırla',
      message: 'Bu işlem tüm düzenleme ayarlarını varsayılan değerlere döndürecek. Bu işlem geri alınamaz. Emin misiniz?',
      buttons: [
        {
          text: 'İptal',
          style: 'cancel'
        },
        {
          text: 'Sıfırla',
          style: 'destructive',
          onPress: onResetAll
        }
      ]
    });
  };

  const handleSavePress = () => {
    console.log('💾 EditorHeader: Save button pressed with thumbnail update');
    onSave(true);
  };

  const getSaveButtonTitle = () => {
    if (isSaving) return t('common.saving');
    if (isUpdatingThumbnail) return 'Thumbnail...';
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
        {/* ✅ ENHANCEMENt: History butonları HER ZAMAN GÖRÜNÜR ama duruma göre disabled */}
        <View style={styles.historyButtons}>
          <TouchableOpacity
            onPress={onUndo}
            disabled={!canUndo} // ✅ Disable when can't undo, but always visible
            style={[
              styles.historyButton,
              !canUndo && styles.disabledButton // ✅ Visual feedback for disabled state
            ]}
            activeOpacity={canUndo ? 0.7 : 1} // ✅ No touch feedback when disabled
          >
            <Feather
              name="rotate-ccw"
              size={18}
              color={canUndo ? Colors.textPrimary : Colors.border} // ✅ Clear visual distinction
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onRedo}
            disabled={!canRedo} // ✅ Disable when can't redo, but always visible
            style={[
              styles.historyButton,
              !canRedo && styles.disabledButton // ✅ Visual feedback for disabled state
            ]}
            activeOpacity={canRedo ? 0.7 : 1} // ✅ No touch feedback when disabled
          >
            <Feather
              name="rotate-cw"
              size={18}
              color={canRedo ? Colors.textPrimary : Colors.border} // ✅ Clear visual distinction
            />
          </TouchableOpacity>
        </View>

        {/* Control row with Reset and Draft info */}
        <View style={styles.controlRow}>
          {/* Reset All butonu */}
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
              Sıfırla
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
    // ✅ Z-index ve pointer events ekleyelim
    zIndex: 1000,
    elevation: 5, // Android için
  },

  leftSection: {
    flex: 1,
    alignItems: 'flex-start',
    // ✅ Touch alanını garanti edelim
    zIndex: 1001,
  },

  centerSection: {
    flex: 2,
    alignItems: 'center',
    gap: Spacing.sm,
    // ✅ Orta kısım için özel z-index ve pointer events
    zIndex: 1002,
    pointerEvents: 'box-none', // Alt elementlerin touch'ını engelleme
  },

  rightSection: {
    flex: 1,
    alignItems: 'flex-end',
    // ✅ Touch alanını garanti edelim
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

  // ✅ ENHANCED: History butonları için iyileştirilmiş stiller
  historyButtons: {
    flexDirection: 'row',
    gap: Spacing.xs,
    backgroundColor: Colors.card, // ✅ Colors.gray100 → Colors.card (beyaz arka plan)
    borderRadius: BorderRadius.md,
    padding: 4,
    // ✅ Daha belirgin görünüm için border ekle
    borderWidth: 1,
    borderColor: Colors.border,
    // ✅ Shadow ekle ki öne çıksın
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3, // Android için
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
    // ✅ Aktif buton için beyaz arka plan
    backgroundColor: Colors.card,
    // ✅ Hafif border ekle
    borderWidth: 1,
    borderColor: 'transparent',
    zIndex: 1004,
  },

  // ✅ ENHANCED: Disabled state için daha belirgin stil
  disabledButton: {
    opacity: 0.6, // ✅ 0.4'ten 0.6'ya çıkarıldı - daha görünür
    backgroundColor: Colors.gray100, // ✅ Disabled için gri arka plan
    borderColor: Colors.border, // ✅ Sınır çizgisi ekle
  },

  // Control row styles
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

  // Draft status styles
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