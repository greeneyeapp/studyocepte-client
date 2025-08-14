// client/app/(auth)/register.tsx - TAM VE DOĞRU ÇÖZÜM
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, KeyboardAvoidingView, Platform,
  SafeAreaView, ScrollView, TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next'; // ADDED
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '@/stores/useAuthStore';
import { Colors, Spacing, Typography, Layout } from '@/constants';
import { TextInput } from '@/components/TextInput';
import { Button } from '@/components/Button';
import { ToastService } from '@/components/Toast/ToastService';

// --- Validasyon Yardımcı Fonksiyonları ---
const validateName = (name: string, t: any): { isValid: boolean; message: string } => { // t prop added
  const trimmedName = name.trim();
  if (!trimmedName.includes(' ')) {
    return { isValid: false, message: t('auth.nameValidationSpace') }; // LOCALIZED
  }
  const parts = trimmedName.split(' ');
  const firstName = parts; // Kept original logic (parts) for first name
  const lastName = parts[parts.length - 1];
  if (firstName.length < 2 || lastName.length < 2) {
    return { isValid: false, message: t('auth.nameValidationLength') }; // LOCALIZED
  }
  return { isValid: true, message: '' };
};

const validatePassword = (password: string, t: any): { isValid: boolean; message: string } => { // t prop added
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  if (!passwordRegex.test(password)) {
    return { isValid: false, message: t('auth.passwordValidationRules') }; // LOCALIZED
  }
  return { isValid: true, message: '' };
};

export default function RegisterScreen() {
  const { t } = useTranslation(); // ADDED
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const { register } = useAuthStore();
  
  // YENİ: Butonun yüklenme durumunu yönetmek için LOKAL state.
  const [isRegistering, setRegistering] = useState(false);

  const handleRegister = async () => {
    // Zaten bir kayıt işlemi devam ediyorsa tekrar tıklamayı engelle
    if (isRegistering) return;

    // Validasyonlar
    const nameValidation = validateName(name, t); // t prop passed
    if (!nameValidation.isValid) {
      ToastService.show(nameValidation.message );
      return;
    }
    if (!email.trim()) {
      ToastService.show(t('auth.emptyEmail')); // LOCALIZED
      return;
    }
    const passwordValidation = validatePassword(password, t); // t prop passed
    if (!passwordValidation.isValid) {
      ToastService.show(passwordValidation.message);
      return;
    }
    if (password !== confirmPassword) {
      ToastService.show(t('auth.passwordMismatchMessage') ); // LOCALIZED
      return;
    }

    // Butonu loading durumuna getir
    setRegistering(true);

    const success = await register(name.trim(), email.trim(), password);
    
    // Eğer işlem BAŞARISIZ olursa, toast göster ve butonu tekrar aktif hale getir.
    if (!success) {
      const error = useAuthStore.getState().error;
      ToastService.show( error || t('auth.tryAgain') ); // LOCALIZED
      setRegistering(false); // Butonları tekrar kullanılabilir yap
    }
    // Başarılı olursa hiçbir şey yapma. _layout.tsx geçişi yönetecek.
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient colors={[Colors.background, Colors.primaryLight]} style={styles.gradient}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardAvoidingView}>
          <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
            <View style={styles.formWrapper}>
              <View style={styles.headerContainer}>
                <Text style={styles.title}>{t('auth.createAccount')}</Text> {/* LOCALIZED */}
                <Text style={styles.subtitle}>{t('auth.registerSubtitle')}</Text> {/* LOCALIZED */}
              </View>

              <View style={styles.formContainer}>
                <TextInput placeholder={t('auth.fullName')} value={name} onChangeText={setName} autoCapitalize="words" /> {/* LOCALIZED */}
                <TextInput placeholder={t('auth.emailPlaceholder')} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" /> {/* LOCALIZED */}
                <TextInput placeholder={t('auth.passwordPlaceholder')} value={password} onChangeText={setPassword} secureTextEntry /> {/* LOCALIZED */}
                <TextInput placeholder={t('auth.confirmPasswordPlaceholder')} value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry /> {/* LOCALIZED */}
                
                {/* Buton artık kendi LOKAL durumunu kontrol ediyor */}
                <Button 
                  title={t('auth.registerButton')} // LOCALIZED
                  onPress={handleRegister} 
                  loading={isRegistering}
                  disabled={isRegistering} 
                  size="medium"
                />
              </View>

              <TouchableOpacity style={styles.loginLinkContainer} onPress={() => router.push('/(auth)/login')}>
                <Text style={styles.loginText}>
                  {t('auth.alreadyHaveAccount')}{' '} {/* LOCALIZED */}
                  <Text style={styles.loginLink}>{t('auth.loginNow')}</Text> {/* LOCALIZED */}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
}

// Stillerde değişiklik yok.
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  gradient: { flex: 1 },
  keyboardAvoidingView: { flex: 1 },
  scrollContainer: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.lg },
  formWrapper: { width: '100%', maxWidth: Layout.isTablet ? 450 : 380, padding: Spacing.lg, backgroundColor: Colors.card, borderRadius: 20, shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
  headerContainer: { alignItems: 'center', marginBottom: Spacing.xl },
  title: { ...Typography.h1, color: Colors.textPrimary, marginBottom: Spacing.sm },
  subtitle: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center' },
  formContainer: { gap: Spacing.md },
  loginLinkContainer: { marginTop: Spacing.xl, alignItems: 'center' },
  loginText: { ...Typography.body, color: Colors.textPrimary },
  loginLink: { color: Colors.primary, fontWeight: '600' },
});