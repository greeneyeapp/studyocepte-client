// kodlar/app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Colors, Typography } from '@/constants';
import { Layout } from '@/constants/Layout';

export default function TabLayout() {
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarStyle: {
          backgroundColor: Colors.card,
          borderTopColor: Colors.border,
          height: Layout.isTablet ? 90 : 65,
          paddingBottom: Layout.isTablet ? 20 : 10,
          paddingTop: 5,
        },
        tabBarLabelStyle: {
          ...Typography.caption,
          fontFamily: 'Inter-Medium',
        },
        tabBarIconStyle: {
          marginBottom: -3,
        }
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: t('home.title'),
          tabBarIcon: ({ size, color }) => (
            <Feather name="grid" size={Layout.isTablet ? size * 1.4 : size} color={color} />
          ),
        }}
      />
      
      {/* Product detail sayfası - Tab bar'da görünmez */}
      <Tabs.Screen
        name="product"
        options={{
          href: null, // Tab bar'da görünmez
          title: t('products.title'),
        }}
      />

      {/* Editor sayfası - Tab bar'da görünmez */}
      <Tabs.Screen
        name="editor"
        options={{
          href: null, // Tab bar'da görünmez
          title: t('editor.title'),
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          title: t('settings.title'),
          tabBarIcon: ({ size, color }) => (
            <Feather name="settings" size={Layout.isTablet ? size * 1.4 : size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}