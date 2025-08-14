import { Stack } from 'expo-router';
import React from 'react';
// Fonksiyon wrappera gerek yok, doğrudan Stack'i export et.
// Bu, Expo Router'ın en sevdiği ve stabil olan yapıdır.
export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
    </Stack>
  );
}