// client/app/(tabs)/_layout.tsx - GÜNCELLENMİŞ HALİ
import React from 'react';
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
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: t('home.title'),
          tabBarIcon: ({ color, size }) => (
            <Feather name="grid" size={size} color={color} />
          ),
        }}
      />
      
      {/* Bu ekranlar birer Stack yerleşimi içerir ve tab bar'da görünmezler */}
      <Tabs.Screen
        name="product"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="editor"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          title: t('settings.title'),
          tabBarIcon: ({ color, size }) => (
            <Feather name="settings" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}