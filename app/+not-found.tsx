import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Colors, Spacing, Typography } from '@/constants';
import { useTranslation } from 'react-i18next'; // useTranslation import edildi

export default function NotFoundScreen() {
  const { t } = useTranslation(); // useTranslation hook'u kullanıldı
  return (
    <>
      <Stack.Screen options={{ title: t('common.error') }} /> {/* 'Oops!' yerine common.error kullanıldı */}
      <View style={styles.container}>
        <Text style={styles.title}>404</Text>
        <Text style={styles.text}>{t('common.unknownError')}</Text> {/* 'This screen doesn't exist.' yerine common.unknownError kullanıldı */}
        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>{t('productDetail.backToHome')}</Text> {/* 'Go to home screen!' yerine productDetail.backToHome kullanıldı */}
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