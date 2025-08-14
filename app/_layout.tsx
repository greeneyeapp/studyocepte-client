// client/app/_layout.tsx - TAM VE NİHAİ KONTROL MERKEZİ GÜNCELLENDİ
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect, useState, useRef } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';
import { useAuthStore } from '@/stores/useAuthStore';
import { GlobalUIProvider } from '@/context/GlobalUIProvider';
import { useAssets } from 'expo-asset';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import AppLoading from '@/components/Loading/AppLoading';
import AppBottomSheet, { AppBottomSheetRef } from '@/components/BottomSheet/AppBottomSheet';
import { BottomSheetService } from '@/components/BottomSheet/BottomSheetService';
import AsyncStorage from '@react-native-async-storage/async-storage'; // AsyncStorage import edildi
import LanguageSelectionScreen from './LanguageSelectionScreen'; // Yeni dil seçim ekranı import edildi

SplashScreen.preventAutoHideAsync();

// Dil seçimi bayrağı için anahtar
const APP_FIRST_LANGUAGE_SELECTED_KEY = 'app_first_language_selected';

// Bu bileşen, state değişikliklerine göre yönlendirmeyi ve geçiş animasyonunu yönetir.
function RootLayoutNav() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const segments = useSegments();
  const router = useRouter();

  // BottomSheet ref'i
  const bottomSheetRef = useRef<AppBottomSheetRef>(null);

  // Yönlendirme geçişi sırasında animasyonu göstermek için yerel bir state.
  const [isTransitioning, setTransitioning] = useState(false);

  // BottomSheetService'e ref'i ver
  useEffect(() => {
    BottomSheetService.setRef(bottomSheetRef.current);

    return () => {
      BottomSheetService.setRef(null);
    };
  }, []);

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

      {/* BottomSheet bileşenini en üstte render et */}
      <AppBottomSheet ref={bottomSheetRef} />
    </>
  );
}

// Bu ana bileşen, uygulamanın başlaması için gereken her şeyi yükler.
export default function RootLayout() {
  const { checkAuthStatus } = useAuthStore();
  const [isAuthChecked, setAuthChecked] = useState(false);
  const [isLanguageScreenNeeded, setIsLanguageScreenNeeded] = useState(true); // ⭐ Yeni state

  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': Inter_400Regular, 'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold, 'Inter-Bold': Inter_700Bold,
  });

  const [assets, assetsError] = useAssets([
    require('@/assets/images/icon-transparant.png')
  ]);

  // ⭐ DİL SEÇİMİNİ KONTROL ETME EFFECT'İ
  useEffect(() => {
    async function checkInitialLanguageSelection() {
      const savedLanguage = await AsyncStorage.getItem('selectedLanguage');
      if (savedLanguage) {
        await i18n.changeLanguage(savedLanguage);
      }
      try {
        const hasSelected = await AsyncStorage.getItem(APP_FIRST_LANGUAGE_SELECTED_KEY);
        // Eğer daha önce seçim yapıldığına dair bir işaret yoksa veya 'false' ise
        if (hasSelected === null || hasSelected === 'false') {
          setIsLanguageScreenNeeded(true);
        } else {
          setIsLanguageScreenNeeded(false);
        }
      } catch (e) {
        console.error("Failed to check initial language selection", e);
        setIsLanguageScreenNeeded(true); // Hata olursa gösterelim
      } finally {
        // Auth kontrolü ile birlikte veya ayrı bir 'ready' durumu tutabiliriz.
        // Şimdilik, dil kontrolü bittiğinde auth'u da kontrol et.
        checkAuthStatus().finally(() => {
          setAuthChecked(true);
        });
      }
    }
    checkInitialLanguageSelection();
  }, []); // Sadece bir kez çalışsın

  // Her şeyin (font, asset, auth kontrolü, dil kontrolü) hazır olup olmadığını kontrol et.
  const isAppReady = (fontsLoaded || fontError) && (assets || assetsError) && isAuthChecked;

  // ⭐ Splash Screen'i gizleme ve dil ekranını gösterme/gizleme mantığı
  useEffect(() => {
    if (isAppReady) {
      if (!isLanguageScreenNeeded) { // Dil seçimi yapılmışsa splash'i gizle ve normal akışa geç
        SplashScreen.hideAsync();
      } else {
        // Eğer dil seçimi gerekiyorsa, splash'i gizle ama uygulamayı başlatmadan LanguageSelectionScreen'i göster
        SplashScreen.hideAsync();
        // LanguageSelectionScreen kendi kendine kapanıp diğer rotaya geçişi sağlayacak
      }
    }
  }, [isAppReady, isLanguageScreenNeeded]);

  if (!isAppReady) {
    return null; // Her şey hazır olana kadar Splash Screen görünür kalır.
  }

  if (isLanguageScreenNeeded) {
    return (
      <I18nextProvider i18n={i18n}>
        <LanguageSelectionScreen
          onLanguageSelected={() => {
            setIsLanguageScreenNeeded(false);
          }}
        />
      </I18nextProvider>
    );
  }

  // Normal uygulama akışı
  return (
    <I18nextProvider i18n={i18n}>
      <GlobalUIProvider>
        <RootLayoutNav />
      </GlobalUIProvider>
    </I18nextProvider>
  );
}