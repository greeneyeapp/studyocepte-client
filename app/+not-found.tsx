// kodlar/app/+not-found.tsx
import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Colors, Spacing, Typography } from '@/constants';
import { useTranslation } from 'react-i18next'; // useTranslation import edildi

export default function NotFoundScreen() {
  const { t } = useTranslation(); // t fonksiyonu tanımlandı
  return (
    <>
      <Stack.Screen options={{ title: t('notFound.title') }} /> {/* Çeviri eklendi */}
      <View style={styles.container}>
        <Text style={styles.title}>{t('notFound.errorCode')}</Text> {/* Çeviri eklendi */}
        <Text style={styles.text}>{t('notFound.message')}</Text> {/* Çeviri eklendi */}
        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>{t('notFound.goToHomeButton')}</Text> {/* Çeviri eklendi */}
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
    backgroundColor: Colors.background,
  },
  title: {
    ...Typography.h1,
    fontSize: 80,
    color: Colors.textSecondary,
  },
  text: {
    ...Typography.h3,
    color: Colors.textPrimary,
    marginTop: Spacing.sm,
  },
  link: {
    marginTop: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  linkText: {
    ...Typography.bodyMedium,
    color: Colors.primary,
  }
});