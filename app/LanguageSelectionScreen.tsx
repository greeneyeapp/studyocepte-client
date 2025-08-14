// app/LanguageSelectionScreen.tsx - ÇALIŞAN KOD İLE UYUMLU VERSİYON
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity,
  ScrollView, Image
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Spacing, Typography, BorderRadius, Layout } from '@/constants';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';

// Çalışan kodunuzdaki anahtar ile aynı
const APP_FIRST_LANGUAGE_SELECTED_KEY = 'app_first_language_selected';

interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

const AVAILABLE_LANGUAGES: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
];

const LanguageCard: React.FC<{
  language: Language;
  isSelected: boolean;
  onPress: () => void;
}> = ({ language, isSelected, onPress }) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
    <Card 
      style={[
        styles.languageCard,
        isSelected && styles.languageCardSelected
      ]}
      padding="medium"
    >
      <View style={styles.languageCardContent}>
        <View style={styles.languageInfo}>
          <Text style={styles.languageFlag}>{language.flag}</Text>
          <View style={styles.languageText}>
            <Text style={[
              styles.languageName,
              isSelected && styles.selectedLanguageText
            ]}>
              {language.nativeName}
            </Text>
            <Text style={[
              styles.languageSubtitle,
              isSelected && styles.selectedLanguageSubtitle
            ]}>
              {language.name}
            </Text>
          </View>
        </View>
        
        <View style={[
          styles.selectionIndicator,
          isSelected && styles.selectionIndicatorSelected
        ]}>
          {isSelected && (
            <Feather name="check" size={16} color={Colors.card} />
          )}
        </View>
      </View>
    </Card>
  </TouchableOpacity>
);

interface LanguageSelectionScreenProps {
  onLanguageSelected?: () => void;
}

export default function LanguageSelectionScreen({ onLanguageSelected }: LanguageSelectionScreenProps) {
  const { t, i18n } = useTranslation();
  const [selectedLanguage, setSelectedLanguage] = useState<string>(i18n.language || 'en');
  const [isLoading, setIsLoading] = useState(false);

  const handleLanguageSelect = (languageCode: string) => {
    setSelectedLanguage(languageCode);
    // Dili hemen değiştir ki kullanıcı anlık olarak değişikliği görebilsin
    i18n.changeLanguage(languageCode);
  };

  const handleContinue = async () => {
    setIsLoading(true);
    
    try {
      // Önce seçilen dili kaydet
      await AsyncStorage.setItem('selectedLanguage', selectedLanguage);
      
      // Dili i18next'e uygula
      await i18n.changeLanguage(selectedLanguage);
      
      // Dil seçimi yapıldı bayrağını kaydet
      await AsyncStorage.setItem(APP_FIRST_LANGUAGE_SELECTED_KEY, 'true');
      
      // Parent component'e bildir
      if (onLanguageSelected) {
        onLanguageSelected();
      }
      
    } catch (error) {
      console.error('Dil kaydedilirken hata oluştu:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient 
        colors={[Colors.background, Colors.primaryLight]} 
        style={styles.gradient}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <Image
                  source={require('@/assets/images/icon-transparant.png')}
                  style={styles.logo}
                  resizeMode="contain"
                />
              </View>
              
              <Text style={styles.title}>{t('appName')}</Text>
              <Text style={styles.subtitle}>{t('settings.languageSubtitle')}</Text>
            </View>

            {/* Language Options */}
            <View style={styles.languageContainer}>
              <Text style={styles.sectionTitle}>{t('settings.language')}</Text>
              
              <View style={styles.languageGrid}>
                {AVAILABLE_LANGUAGES.map((language) => (
                  <LanguageCard
                    key={language.code}
                    language={language}
                    isSelected={selectedLanguage === language.code}
                    onPress={() => handleLanguageSelect(language.code)}
                  />
                ))}
              </View>
            </View>

            {/* Continue Button */}
            <View style={styles.buttonContainer}>
              <Button
                title={t('common.save')}
                onPress={handleContinue}
                loading={isLoading}
                disabled={!selectedLanguage || isLoading}
                size="large"
                icon={<Feather name="arrow-right" size={20} color={Colors.card} />}
              />
            </View>

            {/* Footer Note */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                {t('settings.supportSubtitle')}
              </Text>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  gradient: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  container: {
    width: '100%',
    maxWidth: Layout.isTablet ? 500 : 400,
    alignSelf: 'center',
  },
  
  // Header Styles
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl * 2,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  logo: {
    width: 60,
    height: 60,
  },
  title: {
    ...Typography.h1,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.md,
    fontWeight: '700',
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: Spacing.md,
  },
  
  // Language Selection Styles
  languageContainer: {
    marginBottom: Spacing.xl * 2,
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
    fontWeight: '600',
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  languageGrid: {
    gap: Spacing.md,
  },
  languageCard: {
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  languageCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
    shadowColor: Colors.primary,
    shadowOpacity: 0.2,
    elevation: 4,
  },
  languageCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  languageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  languageFlag: {
    fontSize: 32,
    marginRight: Spacing.md,
  },
  languageText: {
    flex: 1,
  },
  languageName: {
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
    fontWeight: '600',
    marginBottom: 2,
  },
  selectedLanguageText: {
    color: Colors.primary,
  },
  languageSubtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  selectedLanguageSubtitle: {
    color: Colors.primaryDark,
  },
  selectionIndicator: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectionIndicatorSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  
  // Button Styles
  buttonContainer: {
    marginBottom: Spacing.xl,
  },
  
  // Footer Styles
  footer: {
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
  },
  footerText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    fontStyle: 'italic',
  },
});