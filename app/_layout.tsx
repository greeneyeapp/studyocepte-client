// client/app/_layout.tsx - DÜZELTİLMİŞ HALİ
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';
import { useAuthStore } from '@/stores/useAuthStore';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { GlobalUIProvider } from '@/context/GlobalUIProvider';

SplashScreen.preventAutoHideAsync();

// Bu kök layout, her şey yüklendikten sonra yönlendirmeyi yapar.
// Asıl layout mantığı AuthStateBasedLayout içindedir.
export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <I18nextProvider i18n={i18n}>
      <GlobalUIProvider>
        <AuthStateBasedLayout />
      </GlobalUIProvider>
    </I18nextProvider>
  );
}

// Bu bileşen, kimlik doğrulama durumuna göre doğru ekran grubunu (Stack) seçer.
function AuthStateBasedLayout() {
  const { isAuthenticated, checkAuthStatus, isLoading } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    checkAuthStatus();
  }, []);

  useEffect(() => {
    if (isLoading) return; // Henüz kontrol bitmediyse bekle

    const inTabsGroup = segments[0] === '(tabs)';
    
    // Eğer kullanıcı kimliği doğrulanmışsa ve tab grubunda değilse, ana sayfaya yönlendir.
    if (isAuthenticated && !inTabsGroup) {
      router.replace('/(tabs)/home');
    } 
    // Eğer kullanıcı kimliği doğrulanmamışsa ve tab grubundaysa, giriş ekranına yönlendir.
    else if (!isAuthenticated && inTabsGroup) {
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated, isLoading, segments]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}