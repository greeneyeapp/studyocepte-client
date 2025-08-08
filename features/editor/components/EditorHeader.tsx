// features/editor/components/EditorHeader.tsx - AUTO-SAVE CONTROLS İLE GELİŞTİRİLMİŞ VERSİYON
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
  
  // ✅ YENİ: Auto-save props
  autoSaveEnabled?: boolean;
  onForceAutoSave?: () => void;
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
  // ✅ YENİ: Auto-save props
  autoSaveEnabled = true,
  onForceAutoSave,
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

  // ✅ YENİ: Draft status badge component
  const DraftStatusBadge = () => {
    if (!hasDraftChanges && totalDraftsCount === 0) return null;
    
    return (
      <View style={styles.draftStatusContainer}>
        {/* Active draft indicator */}
        {hasDraftChanges && (
          <View style={styles.activeDraftBadge}>
            <View style={styles.draftDot} />
            <Text style={styles.draftText}>Taslak</Text>
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

  // ✅ YENİ: Auto-save indicator component
  const AutoSaveIndicator = () => {
    if (!onForceAutoSave) return null;
    
    return (
      <TouchableOpacity 
        style={[
          styles.autoSaveButton,
          autoSaveEnabled && styles.autoSaveButtonActive
        ]}
        onPress={onForceAutoSave}
        disabled={!onForceAutoSave}
        activeOpacity={0.7}
      >
        <Feather 
          name={autoSaveEnabled ? "clock" : "pause"} 
          size={12} 
          color={autoSaveEnabled ? Colors.success : Colors.textSecondary} 
        />
        <Text 
          style={[
            styles.autoSaveText,
            autoSaveEnabled && styles.autoSaveTextActive
          ]}
        >
          Auto
        </Text>
      </TouchableOpacity>
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

        {/* ✅ YENİ: Enhanced control row */}
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

          {/* ✅ YENİ: Draft status indicators */}
          <DraftStatusBadge />
          
          {/* ✅ YENİ: Auto-save indicator */}
          <AutoSaveIndicator />
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

  // ✅ YENİ: Draft status styles
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
    backgroundColor: Colors.warning + '15',
    borderRadius: BorderRadius.sm,
  },

  draftDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.warning,
  },

  draftText: {
    ...Typography.caption,
    color: Colors.warning,
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

  // ✅ YENİ: Auto-save styles
  autoSaveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs / 2,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs / 2,
    backgroundColor: Colors.gray100,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: 'transparent',
  },

  autoSaveButtonActive: {
    backgroundColor: Colors.success + '15',
    borderColor: Colors.success + '30',
  },

  autoSaveText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: '500',
    fontSize: 10,
  },

  autoSaveTextActive: {
    color: Colors.success,
    fontWeight: '600',
  },
});