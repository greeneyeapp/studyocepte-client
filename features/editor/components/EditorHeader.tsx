// app/(tabs)/editor/components/EditorHeader.tsx - FAZ 2 GÜNCELLEMESİ (Undo/Redo Butonları)
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Feather } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '@/constants';

interface EditorHeaderProps {
  onCancel: () => void;
  onSave: () => void;
  isSaving: boolean;
  // Undo/Redo için yeni proplar
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
}

export const EditorHeader: React.FC<EditorHeaderProps> = ({
  onCancel,
  onSave,
  isSaving,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
}) => {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onCancel} style={styles.button}>
        <Text style={styles.cancelText}>{t('common.cancel')}</Text>
      </TouchableOpacity>
      
      {/* --- YENİ EKLENEN UNDO/REDO BUTONLARI --- */}
      <View style={styles.historyButtons}>
        <TouchableOpacity onPress={onUndo} disabled={!canUndo} style={styles.historyButton}>
          <Feather name="rotate-ccw" size={20} color={canUndo ? Colors.textPrimary : Colors.border} />
        </TouchableOpacity>
        <TouchableOpacity onPress={onRedo} disabled={!canRedo} style={styles.historyButton}>
          <Feather name="rotate-cw" size={20} color={canRedo ? Colors.textPrimary : Colors.border} />
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity onPress={onSave} disabled={isSaving} style={styles.button}>
        <Text style={[styles.doneText, isSaving && styles.disabledText]}>
          {isSaving ? t('common.saving') : t('common.done')}
        </Text>
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
  },
  button: {
    paddingVertical: Spacing.xs,
    minWidth: 60,
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
    gap: Spacing.xl,
  },
  historyButton: {
    padding: Spacing.xs,
  },
});