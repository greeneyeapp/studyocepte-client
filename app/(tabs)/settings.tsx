import React from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, SafeAreaView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Feather } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/useAuthStore';
import { Colors, Typography, Spacing, BorderRadius, Layout } from '@/constants';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { ToastService } from '@/components/Toast/ToastService';
import { DialogService } from '@/components/Dialog/DialogService';

// YENİ: Baş Harf Avatarı Bileşeni
const InitialsAvatar = ({ name }: { name: string }) => {
  const getInitials = () => {
    const words = name.trim().split(' ');
    if (words.length > 1) {
      return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };
  
  // İsimden tutarlı bir renk üretmek için basit bir hash fonksiyonu
  const stringToColor = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    let color = '#';
    for (let i = 0; i < 3; i++) {
      const value = (hash >> (i * 8)) & 0xFF;
      color += ('00' + value.toString(16)).substr(-2);
    }
    return color;
  };

  return (
    <View style={[styles.avatarContainer, { backgroundColor: stringToColor(name) }]}>
      <Text style={styles.avatarText}>{getInitials()}</Text>
    </View>
  );
};

// YENİ: Ayar Bölümü Bileşeni
const SettingsSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <View style={styles.sectionContainer}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <Card style={styles.settingsCard}>
      {children}
    </Card>
  </View>
);

export default function SettingsScreen() {
  const { t, i18n } = useTranslation();
  const { user, logout, isLoading } = useAuthStore();

  const handleLogout = () => {
    DialogService.show({
      title: t('settings.logoutTitle'),
      message: t('settings.logoutMessage'),
      buttons: [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('auth.logout'), style: 'destructive', onPress: async () => { await logout(); } },
      ],
    });
  };

  const settingsItems = {
    app: [
      { id: 'language', title: t('settings.language'), icon: 'globe', value: i18n.language === 'en' ? 'English' : 'Türkçe', onPress: () => i18n.changeLanguage(i18n.language === 'en' ? 'tr' : 'en') },
      { id: 'subscription', title: t('settings.subscription'), icon: 'credit-card', onPress: () => ToastService.show({ type: 'info', text1: t('common.comingSoon') }) },
    ],
    support: [
      { id: 'help', title: t('settings.support'), icon: 'help-circle', onPress: () => ToastService.show({ type: 'info', text1: 'Destek' }) },
      { id: 'about', title: t('settings.about'), icon: 'info', onPress: () => ToastService.show({ type: 'info', text1: 'Stüdyo Cepte v2.0' }) },
    ]
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('settings.title')}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {user && (
          <View style={styles.profileSection}>
            <InitialsAvatar name={user.name || 'S C'} />
            <Text style={styles.userName}>{user.name}</Text>
            <Text style={styles.userEmail}>{user.email}</Text>
          </View>
        )}

        <SettingsSection title="Uygulama Ayarları">
          {settingsItems.app.map((item, index) => (
            <TouchableOpacity key={item.id} style={[styles.settingItem, index < settingsItems.app.length - 1 && styles.settingItemBorder]} onPress={item.onPress} activeOpacity={0.6}>
              <Feather name={item.icon as any} size={20} color={Colors.textSecondary} />
              <Text style={styles.settingTitle}>{item.title}</Text>
              <View style={styles.settingRight}>
                {item.value && <Text style={styles.settingValue}>{item.value}</Text>}
                <Feather name="chevron-right" size={20} color={Colors.textSecondary} />
              </View>
            </TouchableOpacity>
          ))}
        </SettingsSection>

        <SettingsSection title="Destek ve Hakkında">
          {settingsItems.support.map((item, index) => (
             <TouchableOpacity key={item.id} style={[styles.settingItem, index < settingsItems.support.length - 1 && styles.settingItemBorder]} onPress={item.onPress} activeOpacity={0.6}>
                <Feather name={item.icon as any} size={20} color={Colors.textSecondary} />
                <Text style={styles.settingTitle}>{item.title}</Text>
                <Feather name="chevron-right" size={20} color={Colors.textSecondary} />
             </TouchableOpacity>
          ))}
        </SettingsSection>

        <View style={styles.logoutButtonContainer}>
          <Button title={t('auth.logout')} onPress={handleLogout} variant="outline" disabled={isLoading} loading={isLoading} style={styles.logoutButton} icon={<Feather name="log-out" size={18} color={Colors.error} />} textStyle={{ color: Colors.error }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  title: { ...Typography.h1, color: Colors.textPrimary },
  scrollContainer: { paddingVertical: Spacing.lg, paddingHorizontal: Spacing.md },
  
  profileSection: { alignItems: 'center', marginBottom: Spacing.xl },
  avatarContainer: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.md },
  avatarText: { ...Typography.h1, color: Colors.card, fontSize: 32 },
  userName: { ...Typography.h2, color: Colors.textPrimary },
  userEmail: { ...Typography.body, color: Colors.textSecondary, marginTop: Spacing.xs },
  
  sectionContainer: { marginBottom: Spacing.xl },
  sectionTitle: { ...Typography.bodyMedium, color: Colors.textSecondary, marginBottom: Spacing.sm, paddingHorizontal: Spacing.sm },
  settingsCard: { paddingHorizontal: 0 },
  
  settingItem: { flexDirection: 'row', alignItems: 'center', padding: Spacing.lg },
  settingItemBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  settingTitle: { ...Typography.body, color: Colors.textPrimary, flex: 1, marginLeft: Spacing.md },
  settingRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  settingValue: { ...Typography.body, color: Colors.textSecondary },

  logoutButtonContainer: { marginTop: Spacing.lg },
  logoutButton: { borderColor: Colors.error, backgroundColor: Colors.card },
});