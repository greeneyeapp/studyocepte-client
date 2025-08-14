import { Stack } from 'expo-router';
export default function EditorLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="[photoId]" />
    </Stack>
  );
}