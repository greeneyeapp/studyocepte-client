import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';
import { useAuthStore } from '@/stores/useAuthStore';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { GlobalUIProvider } from '@/context/GlobalUIProvider';

// 1. Splash ekranının otomatik olarak gizlenmesini en başta engelle
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  // Fontların yüklenmesini bekle
  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
  });

  // 2. Auth store'dan kimlik kontrolü durumunu al
  const { checkAuthStatus, isLoading: isAuthLoading } = useAuthStore();

  // 3. Uygulama ilk açıldığında kimlik kontrolünü başlat
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // 4. Hem fontlar yüklendiğinde HEM DE kimlik kontrolü bittiğinde splash ekranını gizle
  useEffect(() => {
    if ((fontsLoaded || fontError) && !isAuthLoading) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError, isAuthLoading]);

  // 5. Fontlar veya kimlik kontrolü henüz hazır değilse, hiçbir şey render etme (splash ekranı görünür kalır)
  if ((!fontsLoaded && !fontError) || isAuthLoading) {
    return null;
  }

  // Her şey hazır olduğunda, asıl layout'u render et
  return (
    <I18nextProvider i18n={i18n}>
      <GlobalUIProvider>
        <AuthStateBasedLayout />
      </GlobalUIProvider>
    </I18nextProvider>
  );
}

// Bu bileşen, kimlik doğrulama durumuna göre doğru ekran grubuna yönlendirmeyi yapar.
function AuthStateBasedLayout() {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // Yükleme devam ediyorsa yönlendirme yapma
    if (isAuthLoading) return;

    const inTabsGroup = segments[0] === '(tabs)';
    
    // Eğer kullanıcı kimliği doğrulanmışsa ve tab grubunda değilse, ana sayfaya yönlendir.
    if (isAuthenticated && !inTabsGroup) {
      router.replace('/(tabs)/home');
    } 
    // Eğer kullanıcı kimliği doğrulanmamışsa ve tab grubundaysa, giriş ekranına yönlendir.
    else if (!isAuthenticated && inTabsGroup) {
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated, isAuthLoading, segments]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}