// features/editor/components/EditorHeader.tsx - AUTO-SAVE HEP AÇIK VERSİYON
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Feather } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants';
import { DialogService } from '@/components/Dialog/DialogService';

interface EditorHeaderProps {
  onCancel: () => void;
  onSave: () => void;
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
  
  // ✅ AUTO-SAVE HEP AÇIK: Auto-save kontrol props'ları kaldırıldı
  // autoSaveEnabled?: boolean;
  // onForceAutoSave?: () => void;
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

  // ✅ AUTO-SAVE HEP AÇIK: Sadece draft status badge
  const DraftStatusBadge = () => {
    if (!hasDraftChanges && totalDraftsCount === 0) return null;
    
    return (
      <View style={styles.draftStatusContainer}>
        {/* Active draft indicator - ✅ AUTO-SAVE HEP AÇIK: Sadece bilgi amaçlı */}
        {hasDraftChanges && (
          <View style={styles.activeDraftBadge}>
            <View style={styles.draftDot} />
            <Text style={styles.draftText}>Otomatik Kaydediliyor</Text>
          </View>
        )}
        
        {/* Total drafts count */}
        {totalDraftsCount > 0 && onShowDraftManager && (
          <TouchableOpacity 
            style={styles.draftsCountBadge}
            onPress={onShowDraftManager}
            activeOpacity={0.7}
          >
            <Feather name="file-text" size={12} color={Colors.primary} />
            <Text style={styles.draftsCountText}>{totalDraftsCount}</Text>
          </TouchableOpacity>
        )}
      </View>
    );
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
        {/* History controls */}
        <View style={styles.historyButtons}>
          <TouchableOpacity 
            onPress={onUndo} 
            disabled={!canUndo} 
            style={[styles.historyButton, !canUndo && styles.disabledButton]}
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
            style={[styles.historyButton, !canRedo && styles.disabledButton]}
          >
            <Feather 
              name="rotate-cw" 
              size={18} 
              color={canRedo ? Colors.textPrimary : Colors.border} 
            />
          </TouchableOpacity>
        </View>

        {/* ✅ AUTO-SAVE HEP AÇIK: Sadeleştirilmiş control row */}
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

          {/* ✅ AUTO-SAVE HEP AÇIK: Sadece draft status indicators */}
          <DraftStatusBadge />
      
        </View>
      </View>
      
      {/* Sağ taraf - Save butonu */}
      <View style={styles.rightSection}>
        <TouchableOpacity 
          onPress={onSave} 
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
  },
  
  leftSection: {
    flex: 1,
    alignItems: 'flex-start',
  },
  
  centerSection: {
    flex: 2,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  
  rightSection: {
    flex: 1,
    alignItems: 'flex-end',
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
    gap: Spacing.sm,
    backgroundColor: Colors.gray100,
    borderRadius: BorderRadius.md,
    padding: 2,
  },
  
  historyButton: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  
  disabledButton: {
    opacity: 0.3,
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

  // ✅ AUTO-SAVE HEP AÇIK: Basitleştirilmiş draft status styles
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

  // ✅ AUTO-SAVE HEP AÇIK: Yeni otomatik kayıt bilgisi
  autoSaveInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs / 2,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs / 2,
    backgroundColor: Colors.success + '10',
    borderRadius: BorderRadius.sm,
  },

  autoSaveText: {
    ...Typography.caption,
    color: Colors.success,
    fontWeight: '500',
    fontSize: 10,
  },
});