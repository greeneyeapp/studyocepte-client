// client/app/(tabs)/_layout.tsx - NAVBAR KALDIRILDI
import React from 'react';
import { Stack } from 'expo-router';

export default function TabLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="home" />
      <Stack.Screen name="product" />
      <Stack.Screen name="editor" />
      <Stack.Screen name="settings" />
    </Stack>
  );
}