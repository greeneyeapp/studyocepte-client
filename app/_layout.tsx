// client/app/_layout.tsx - TAM VE NİHAİ KONTROL MERKEZİ
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect, useState } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';
import { useAuthStore } from '@/stores/useAuthStore';
import { GlobalUIProvider } from '@/context/GlobalUIProvider';
import { useAssets } from 'expo-asset';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import AppLoading from '@/components/Loading/AppLoading';

SplashScreen.preventAutoHideAsync();

// Bu bileşen, state değişikliklerine göre yönlendirmeyi ve geçiş animasyonunu yönetir.
function RootLayoutNav() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const segments = useSegments();
  const router = useRouter();

  // Yönlendirme geçişi sırasında animasyonu göstermek için yerel bir state.
  const [isTransitioning, setTransitioning] = useState(false);

  useEffect(() => {
    const inAuthGroup = segments[0] === '(auth)';
    
    // Senaryo 1: Kullanıcı giriş yaptı ve hala auth ekranında.
    if (isAuthenticated && inAuthGroup) {
      setTransitioning(true); // Geçiş animasyonunu göster
      router.replace('/(tabs)/home'); // Yönlendirmeyi yap
      
      // Yönlendirmenin tamamlanması ve yeni ekranın render olması için bekle, sonra animasyonu kaldır.
      setTimeout(() => setTransitioning(false), 800);
    }

    // Senaryo 2: Kullanıcı çıkış yaptı ve hala uygulama içinde (tabs grubunda).
    if (!isAuthenticated && !inAuthGroup) {
      setTransitioning(true); // Geçiş animasyonunu göster
      router.replace('/(auth)/login'); // Yönlendirmeyi yap
      
      // Yönlendirme bitince animasyonu kaldır.
      setTimeout(() => setTransitioning(false), 800);
    }
  }, [isAuthenticated, segments]);

  return (
    <>
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="+not-found" />
      </Stack>
      
      {/* Animasyon, bir servisle değil, doğrudan burada koşullu olarak render edilir. */}
      {isTransitioning && <AppLoading />}
    </>
  );
}

// Bu ana bileşen, uygulamanın başlaması için gereken her şeyi yükler.
export default function RootLayout() {
  const { checkAuthStatus } = useAuthStore();
  const [isAuthChecked, setAuthChecked] = useState(false);
  
  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': Inter_400Regular, 'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold, 'Inter-Bold': Inter_700Bold,
  });

  const [assets, assetsError] = useAssets([
    require('@/assets/images/icon-transparant.png')
  ]);
  
  useEffect(() => {
    // Uygulama başlarken auth durumunu kontrol et.
    checkAuthStatus().finally(() => {
      setAuthChecked(true);
    });
  }, []);
  
  // Her şeyin (font, asset, auth kontrolü) hazır olup olmadığını kontrol et.
  const isAppReady = (fontsLoaded || fontError) && (assets || assetsError) && isAuthChecked;

  useEffect(() => {
    if (isAppReady) {
      SplashScreen.hideAsync();
    }
  }, [isAppReady]);

  if (!isAppReady) {
    return null; // Her şey hazır olana kadar Splash Screen görünür kalır.
  }

  return (
    <I18nextProvider i18n={i18n}>
      {/* GlobalUIProvider artık animasyondan sorumlu değil, ama Toast vb. için kalabilir. */}
      <GlobalUIProvider>
        <RootLayoutNav />
      </GlobalUIProvider>
    </I18nextProvider>
  );
}