import React, { useState } from 'react';
import {
  View, Text, StyleSheet, KeyboardAvoidingView, Platform,
  SafeAreaView, ScrollView, TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '@/stores/useAuthStore';
import { Colors, Spacing, Typography, Layout } from '@/constants';
import { TextInput } from '@/components/TextInput';
import { Button } from '@/components/Button';
import { ToastService } from '@/components/Toast/ToastService';

// --- Validasyon Yardımcı Fonksiyonları ---
const validateName = (name: string): { isValid: boolean; message: string } => {
  const trimmedName = name.trim();
  if (!trimmedName.includes(' ')) {
    return { isValid: false, message: 'Lütfen adınızı ve soyadınızı aralarında boşluk bırakarak girin.' };
  }
  const parts = trimmedName.split(' ');
  const firstName = parts[0];
  const lastName = parts[parts.length - 1];
  if (firstName.length < 3 || lastName.length < 3) {
    return { isValid: false, message: 'Adınız ve soyadınız en az 3 harften oluşmalıdır.' };
  }
  return { isValid: true, message: '' };
};

const validatePassword = (password: string): { isValid: boolean; message: string } => {
  // En az 8 karakter, 1 büyük harf, 1 küçük harf, 1 rakam, 1 özel karakter
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  if (!passwordRegex.test(password)) {
    return { isValid: false, message: 'Şifre; en az 8 karakter, 1 büyük, 1 küçük harf, 1 rakam ve 1 özel karakter içermelidir.' };
  }
  return { isValid: true, message: '' };
};

export default function RegisterScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const register = useAuthStore((state) => state.register);
  const isLoading = useAuthStore((state) => state.isLoading);

  const handleRegister = async () => {
    // 1. İsim Validasyonu
    const nameValidation = validateName(name);
    if (!nameValidation.isValid) {
      ToastService.show({ type: 'error', text1: 'Geçersiz Ad Soyad', text2: nameValidation.message });
      return;
    }
    
    // 2. Şifre Validasyonu
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      ToastService.show({ type: 'error', text1: 'Güçsüz Şifre', text2: passwordValidation.message });
      return;
    }

    // 3. Şifre Tekrar Kontrolü
    if (password !== confirmPassword) {
      ToastService.show({ type: 'error', text1: t('auth.passwordMismatchTitle'), text2: t('auth.passwordMismatchMessage') });
      return;
    }
    
    // 4. Boş Alan Kontrolü (Email için)
    if (!email.trim()) {
      ToastService.show({ type: 'error', text1: t('auth.emptyFieldsTitle'), text2: 'E-posta alanı boş bırakılamaz.' });
      return;
    }

    try {
      await register(name.trim(), email.trim(), password);
      // Başarılı kayıt sonrası Toast gösterilebilir
      ToastService.show({ type: 'success', text1: 'Kayıt Başarılı!', text2: 'Giriş sayfasına yönlendiriliyorsunuz.' });
    } catch (error: any) {
      ToastService.show({ type: 'error', text1: t('auth.registerFailed'), text2: error.message || t('auth.tryAgain') });
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient colors={[Colors.background, Colors.indigo100]} style={styles.gradient}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardAvoidingView}>
          <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
            <View style={styles.formWrapper}>
              <View style={styles.headerContainer}>
                <Text style={styles.title}>Stüdyo Cepte</Text>
                <Text style={styles.subtitle}>{t('auth.registerSubtitle')}</Text>
              </View>

              <View style={styles.formContainer}>
                <TextInput placeholder="Ad Soyad" value={name} onChangeText={setName} autoCapitalize="words" />
                <TextInput placeholder={t('auth.emailPlaceholder')} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
                <TextInput placeholder={t('auth.passwordPlaceholder')} value={password} onChangeText={setPassword} secureTextEntry />
                <TextInput placeholder={t('auth.confirmPasswordPlaceholder')} value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />
                <Button title={t('auth.registerButton')} onPress={handleRegister} disabled={isLoading} loading={isLoading} size="large" />
              </View>

              <TouchableOpacity style={styles.loginLinkContainer} onPress={() => router.push('/(auth)/login')}>
                <Text style={styles.loginText}>
                  {t('auth.alreadyHaveAccount')} <Text style={styles.loginLink}>{t('auth.loginNow')}</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
}

// Stillerde değişiklik yok...
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  gradient: { flex: 1 },
  keyboardAvoidingView: { flex: 1 },
  scrollContainer: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.lg },
  formWrapper: { width: '100%', maxWidth: Layout.isTablet ? 450 : undefined },
  headerContainer: { alignItems: 'center', marginBottom: Spacing.xl },
  title: { ...Typography.h1, color: Colors.primary, marginBottom: Spacing.sm },
  subtitle: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center' },
  formContainer: { gap: Spacing.md },
  loginLinkContainer: { marginTop: Spacing.xl, alignItems: 'center' },
  loginText: { ...Typography.body, color: Colors.textPrimary },
  loginLink: { color: Colors.primary, fontWeight: '600' },
});