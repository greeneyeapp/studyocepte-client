// kodlar/app/_layout.tsx
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect, useState } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';
import { useAuthStore } from '@/stores/useAuthStore';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { LoadingService } from '@/components/Loading/LoadingService';
import { GlobalUIProvider } from '@/context/GlobalUIProvider'; // YENİ IMPORT

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { isAuthenticated, checkAuthStatus, isLoading: authLoading } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);

  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
  });

  useEffect(() => {
    checkAuthStatus().finally(() => setAuthChecked(true));
  }, []);

  useEffect(() => {
    if ((fontsLoaded || fontError) && authChecked) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError, authChecked]);

  useEffect(() => {
    if (!authChecked || (!fontsLoaded && !fontError)) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inTabsGroup = segments[0] === '(tabs)';

    if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)/home');
    } else if (!isAuthenticated && inTabsGroup) {
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated, segments, authChecked, fontsLoaded, fontError]);
  
  useEffect(() => {
    if (authLoading) {
      LoadingService.show();
    } else {
      LoadingService.hide();
    }
  }, [authLoading]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
  return (
    <I18nextProvider i18n={i18n}>
      <GlobalUIProvider>
        <RootLayoutNav />
      </GlobalUIProvider>
    </I18nextProvider>
  );
}