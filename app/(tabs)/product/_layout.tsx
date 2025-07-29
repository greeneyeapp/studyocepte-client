// kodlar/app/(tabs)/product/_layout.tsx
import { Stack } from 'expo-router';

export default function ProductLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="[productId]" />
    </Stack>
  );
}