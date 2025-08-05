// client/app/(auth)/login.tsx - TAM KOD
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, KeyboardAvoidingView, Platform,
  SafeAreaView, ScrollView, TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/useAuthStore';
import { Colors, Spacing, Typography, Layout } from '@/constants';
import { TextInput } from '@/components/TextInput';
import { Button } from '@/components/Button';
import { ToastService } from '@/components/Toast/ToastService';
import { LoadingService } from '@/components/Loading/LoadingService';

export default function LoginScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, guestLogin, isLoading } = useAuthStore();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      ToastService.show({ type: 'error', text1: t('auth.emptyFieldsTitle'), text2: t('auth.emptyFieldsMessage') });
      return;
    }
    LoadingService.show();
    try { await login(email, password); } 
    catch (error: any) { ToastService.show({ type: 'error', text1: t('auth.loginFailed'), text2: error.message || t('auth.tryAgain') }); } 
    finally { LoadingService.hide(); }
  };

  const handleGuestLogin = async () => {
    LoadingService.show();
    try { await guestLogin(); } 
    catch (error: any) { ToastService.show({ type: 'error', text1: 'Misafir Girişi Başarısız', text2: error.message || t('auth.tryAgain') }); } 
    finally { LoadingService.hide(); }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient colors={[Colors.background, Colors.primaryLight]} style={styles.gradient}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardAvoidingView}>
          <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
            <View style={styles.formWrapper}>
              <View style={styles.headerContainer}>
                <Text style={styles.title}>Stüdyo Cepte</Text>
                <Text style={styles.subtitle}>{t('auth.loginSubtitle')}</Text>
              </View>
              <View style={styles.formContainer}>
                <TextInput placeholder={t('auth.emailPlaceholder')} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
                <TextInput placeholder={t('auth.passwordPlaceholder')} value={password} onChangeText={setPassword} secureTextEntry />
                <Button title="Giriş Yap" onPress={handleLogin} disabled={isLoading} size="medium" />
                <Button title="Misafir Olarak Devam Et" onPress={handleGuestLogin} variant="outline" disabled={isLoading} size="medium" icon={<Feather name="user" size={18} color={Colors.primary} />} />
              </View>
              <TouchableOpacity style={styles.registerLinkContainer} onPress={() => router.push('/(auth)/register')}>
                <Text style={styles.registerText}>Hesabın yok mu? <Text style={styles.registerLink}>Kayıt Ol</Text></Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
}

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
  registerLinkContainer: { marginTop: Spacing.xl, alignItems: 'center' },
  registerText: { ...Typography.body, color: Colors.textPrimary },
  registerLink: { color: Colors.primary, fontWeight: '600' },
});