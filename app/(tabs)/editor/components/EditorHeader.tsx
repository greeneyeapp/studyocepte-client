// app/(tabs)/editor/components/EditorHeader.tsx

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Colors, Typography, Spacing } from '@/constants';

interface EditorHeaderProps {
  onCancel: () => void;
  onSave: () => void;
  isSaving: boolean;
}

export const EditorHeader: React.FC<EditorHeaderProps> = ({
  onCancel,
  onSave,
  isSaving,
}) => {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onCancel} style={styles.button}>
        <Text style={styles.cancelText}>{t('common.cancel')}</Text>
      </TouchableOpacity>
      
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
    paddingHorizontal: Spacing.sm,
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
});