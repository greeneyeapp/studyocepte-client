// features/editor/components/EditorHeader.tsx - Reset All Settings butonlu versiyon
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Feather } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '@/constants';
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
  // YENİ: Reset ve thumbnail durumu
  onResetAll: () => void;
  isUpdatingThumbnail?: boolean;
  hasDraftChanges?: boolean;
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

  return (
    <View style={styles.container}>
      {/* Sol taraf - Cancel butonu */}
      <TouchableOpacity onPress={onCancel} style={styles.button}>
        <Text style={styles.cancelText}>{t('common.cancel')}</Text>
      </TouchableOpacity>
      
      {/* Orta kısım - History ve Reset butonları */}
      <View style={styles.centerSection}>
        {/* Undo/Redo butonları */}
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

        {/* Reset All butonu */}
        <TouchableOpacity 
          onPress={handleResetAllPress} 
          style={styles.resetButton}
          disabled={isSaving || isUpdatingThumbnail}
        >
          <Feather 
            name="refresh-ccw" 
            size={16} 
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

        {/* Draft indicator */}
        {hasDraftChanges && (
          <View style={styles.draftIndicator}>
            <View style={styles.draftDot} />
            <Text style={styles.draftText}>Taslak</Text>
          </View>
        )}
      </View>
      
      {/* Sağ taraf - Save butonu */}
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
    minHeight: 64, // Sabit yükseklik
  },
  
  button: {
    paddingVertical: Spacing.xs,
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

  centerSection: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  
  historyButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
    backgroundColor: Colors.gray100,
    borderRadius: 8,
    padding: 2,
  },
  
  historyButton: {
    padding: Spacing.sm,
    borderRadius: 6,
  },
  
  disabledButton: {
    opacity: 0.3,
  },

  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.error + '10',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.error + '30',
  },
  
  resetText: {
    ...Typography.caption,
    color: Colors.error,
    fontWeight: '600',
    fontSize: 11,
  },

  draftIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs / 2,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs / 2,
    backgroundColor: Colors.warning + '15',
    borderRadius: 4,
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
});