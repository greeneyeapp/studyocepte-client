// client/app/LanguageSelectionScreen.tsx

import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, Platform, Dimensions, Animated
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/stores/useAuthStore';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants';
import { Layout } from '@/constants/Layout';
import i18n from '@/i18n';
import { Feather } from '@expo/vector-icons';

const availableLanguages = [
  { key: 'tr', name: 'Türkçe', flag: '🇹🇷' },
  { key: 'en', name: 'English', flag: '🇬🇧' },
  { key: 'es', name: 'Español', flag: '🇪🇸' },
];

export default function LanguageSelectionScreen() {
  const { t } = useTranslation();
  const { changeLanguage } = useAuthStore();
  const [selectedLanguageKey, setSelectedLanguageKey] = useState(i18n.language);

  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(50)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const handleLanguageSelect = useCallback(async (langKey: string) => {
    setSelectedLanguageKey(langKey);
    await changeLanguage(langKey);
    await i18n.initPromise;
  }, [changeLanguage]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <Animated.View style={[styles.container, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
          <View style={styles.header}>
            <Text style={styles.title}>{t('languageSelection.title')}</Text>
            <Text style={styles.subtitle}>{t('languageSelection.subtitle')}</Text>
          </View>

          <View style={styles.languageOptions}>
            {availableLanguages.map((lang) => (
              <TouchableOpacity
                key={lang.key}
                style={[
                  styles.languageButton,
                  selectedLanguageKey === lang.key && styles.languageButtonSelected,
                ]}
                onPress={() => handleLanguageSelect(lang.key)}
                activeOpacity={0.7}
              >
                <Text style={styles.languageFlag}>{lang.flag}</Text>
                <Text
                  style={[
                    styles.languageName,
                    selectedLanguageKey === lang.key && styles.languageNameSelected,
                  ]}
                >
                  {lang.name}
                </Text>
                {selectedLanguageKey === lang.key && (
                  <Feather name="check-circle" size={24} color={Colors.card} style={styles.checkIcon} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    maxWidth: Dimensions.get('window').width * 0.9,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  title: {
    ...Typography.h1,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  languageOptions: {
    width: '100%',
    gap: Spacing.md,
  },
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    paddingVertical: 20,
    paddingHorizontal: 24,
    minHeight: 70,
    minWidth: 200,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  languageButtonSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  languageFlag: {
    fontSize: 28,
    marginRight: 12,
    minWidth: 35,
  },
  languageName: {
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
    flex: 1,
    fontWeight: '600',
    fontSize: 16,
    textAlign: 'left',
  },
  languageNameSelected: {
    color: Colors.card,
  },
  checkIcon: {
    marginLeft: 12,
    minWidth: 24,
  },
});