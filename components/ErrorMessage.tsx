// kodlar/components/ErrorMessage.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '@/constants';
import { Button } from './Button';
import { Layout } from '@/constants/Layout';
import { useTranslation } from 'react-i18next'; // useTranslation import edildi

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
  retryText?: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  onRetry,
  retryText, // retryText prop'u artık optional
}) => {
  const { t } = useTranslation(); // t hook'u kullanıldı
  const displayedRetryText = retryText || t('common.retry'); // Varsayılan değer t() ile alındı
  
  return (
    <View style={styles.container}>
      <Feather name="alert-circle" size={Layout.isTablet ? 72 : 48} color={Colors.error} />
      <Text style={styles.message}>{message}</Text>
      {onRetry && (
        <Button
          title={displayedRetryText}
          onPress={onRetry}
          variant="outline"
          style={styles.retryButton}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.xl,
  },
  message: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
    maxWidth: 600, // For tablet readability
  },
  retryButton: {
    minWidth: Layout.isTablet ? 180 : 120,
  },
});