// client/app/(auth)/login.tsx - HATA DÜZELTİLMİŞ VERSİYON
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

export default function LoginScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, guestLogin } = useAuthStore();

  // YENİ: Hangi eylemin aktif olduğunu tutan LOKAL state.
  // Bu state, butonların görünümünü yönetecek.
  const [activeAction, setActiveAction] = useState<'login' | 'guest' | null>(null);

  const handleAction = async (actionType: 'login' | 'guest') => {
    // Zaten bir işlem devam ediyorsa tekrar tıklamayı engelle
    if (activeAction) return;

    // Giriş yapma eylemi için validasyon
    if (actionType === 'login' && (!email.trim() || !password.trim())) {
      ToastService.show(t('auth.emptyFieldsMessage'));
      return;
    }

    // Doğru butonu loading durumuna getir
    setActiveAction(actionType);

    // Store'daki ilgili fonksiyonu çağır
    const success = actionType === 'login'
      ? await login(email, password)
      : await guestLogin();

    // Eğer işlem BAŞARISIZ olursa, toast göster ve butonları tekrar aktif hale getir.
    if (!success) {
      const error = useAuthStore.getState().error;
      const defaultMessage = actionType === 'login' ? t('auth.loginFailed') : t('auth.guestLoginFailed');
      ToastService.show(t('auth.tryAgain'));
      setActiveAction(null); // Butonları tekrar kullanılabilir yap
    }
    // Başarılı olursa hiçbir şey yapma. _layout.tsx geçişi yönetecek ve bu component zaten yok olacak.
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient colors={[Colors.background, Colors.primaryLight]} style={styles.gradient}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardAvoidingView}>
          <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
            <View style={styles.formWrapper}>
              <View style={styles.headerContainer}>
                <Text style={styles.title}>{t('appName')}</Text>
                <Text style={styles.subtitle}>{t('auth.loginSubtitle')}</Text>
              </View>
              <View style={styles.formContainer}>
                <TextInput 
                  placeholder={t('auth.emailPlaceholder')} 
                  value={email} 
                  onChangeText={setEmail} 
                  keyboardType="email-address" 
                  autoCapitalize="none" 
                />
                <TextInput 
                  placeholder={t('auth.passwordPlaceholder')} 
                  value={password} 
                  onChangeText={setPassword} 
                  secureTextEntry 
                />

                {/* DÜZELTME: Her buton artık kendi LOKAL durumunu kontrol ediyor */}
                <Button
                  title={t('auth.loginButton')}
                  onPress={() => handleAction('login')}
                  loading={activeAction === 'login'} // Sadece bu butonun eylemi aktifse loading olur
                  disabled={activeAction !== null}  // Herhangi bir eylem aktifse ikisi de disabled olur
                  size="medium"
                />
                <Button
                  title={t('auth.guestLoginButton')}
                  onPress={() => handleAction('guest')}
                  variant="outline"
                  loading={activeAction === 'guest'} // Sadece bu butonun eylemi aktifse loading olur
                  disabled={activeAction !== null}   // Herhangi bir eylem aktifse ikisi de disabled olur
                  size="medium"
                  icon={<Feather name="user" size={18} color={Colors.primary} />}
                />
              </View>
              <TouchableOpacity style={styles.registerLinkContainer} onPress={() => router.push('/(auth)/register')}>
                <Text style={styles.registerText}>
                  {t('auth.noAccount')} <Text style={styles.registerLink}>{t('auth.registerNow')}</Text>
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
  registerLinkContainer: { marginTop: Spacing.xl, alignItems: 'center' },
  registerText: { ...Typography.body, color: Colors.textPrimary },
  registerLink: { color: Colors.primary, fontWeight: '600' },
});