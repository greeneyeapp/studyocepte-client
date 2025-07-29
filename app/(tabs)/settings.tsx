// kodlar/app/(tabs)/settings.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Feather } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/useAuthStore';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { TextInput } from '@/components/TextInput';
import { ToastService } from '@/components/Toast/ToastService';
import { DialogService } from '@/components/Dialog/DialogService';
import { LoadingService } from '@/components/Loading/LoadingService';
import { Layout } from '@/constants/Layout';

export default function SettingsScreen() {
  const { t, i18n } = useTranslation();
  const { user, logout, isLoading, updateProfile, error, clearError } = useAuthStore();

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileName, setProfileName] = useState(user?.name || '');

  useEffect(() => {
    if (isLoading) {
      LoadingService.show();
    } else {
      LoadingService.hide();
    }
  }, [isLoading]);

  useEffect(() => {
    if (error) {
      ToastService.show({ type: 'error', text1: t('common.error'), text2: error });
      clearError();
    }
  }, [error, clearError, t]);

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

  const handleLanguageToggle = () => {
    const newLanguage = i18n.language === 'en' ? 'tr' : 'en';
    i18n.changeLanguage(newLanguage);
  };

  const handleSaveProfile = async () => {
    if (!profileName.trim()) {
      ToastService.show({ type: 'error', text1: t('common.error'), text2: t('settings.emptyNameError') });
      return;
    }
    try {
      await updateProfile({ name: profileName });
      setIsEditingProfile(false);
      ToastService.show({ type: 'success', text1: t('common.success'), text2: t('settings.profileUpdated') });
    } catch (e) {
      // Error is handled by the useEffect hook
    }
  };

  const settingsItems = [
    { id: 'subscription', title: t('settings.subscription'), icon: 'credit-card', onPress: () => ToastService.show({ type: 'info', text1: t('common.comingSoon'), text2: t('settings.subscriptionComingSoon') }) },
    { id: 'language', title: t('settings.language'), icon: 'globe', value: i18n.language === 'en' ? 'English' : 'Türkçe', onPress: handleLanguageToggle },
    { id: 'support', title: t('settings.support'), icon: 'help-circle', onPress: () => ToastService.show({ type: 'info', text1: t('settings.supportTitle'), text2: t('settings.supportMessage') }) },
    { id: 'about', title: t('settings.about'), icon: 'info', onPress: () => ToastService.show({ type: 'info', text1: t('settings.aboutTitle'), text2: t('settings.aboutMessage') }) },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('settings.title')}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.content}>
          {user && (
            <Card style={styles.profileCard}>
              <View style={styles.profileHeader}>
                <Image
                  source={{ uri: user.avatar || `https://i.pravatar.cc/150?u=${user.email}` }}
                  style={styles.avatar}
                />
                <View style={styles.profileInfo}>
                  {isEditingProfile ? (
                    <TextInput value={profileName} onChangeText={setProfileName} style={styles.editInput} containerStyle={styles.editInputContainer} />
                  ) : (
                    <Text style={styles.userName}>{user.name}</Text>
                  )}
                  <Text style={styles.userEmail}>{user.email}</Text>
                </View>
              </View>
              <View style={styles.profileActions}>
                {isEditingProfile ? (
                  <>
                    <Button title={t('common.save')} onPress={handleSaveProfile} size="small" disabled={isLoading} loading={isLoading} style={styles.profileActionButton} />
                    <Button title={t('common.cancel')} onPress={() => { setIsEditingProfile(false); setProfileName(user.name || ''); clearError(); }} size="small" variant="ghost" style={styles.profileActionButton} />
                  </>
                ) : (
                  <Button title={t('common.edit')} onPress={() => setIsEditingProfile(true)} size="small" variant="outline" style={styles.profileActionButton} icon={<Feather name="edit" size={14} color={Colors.primary} />} />
                )}
              </View>
            </Card>
          )}

          <Card style={styles.settingsCard}>
            {settingsItems.map((item, index) => (
              <TouchableOpacity key={item.id} style={[ styles.settingItem, index < settingsItems.length - 1 && styles.settingItemBorder ]} onPress={item.onPress} activeOpacity={0.6}>
                <View style={styles.settingLeft}>
                  <Feather name={item.icon as any} size={Layout.isTablet ? 28 : 20} color={Colors.textSecondary} />
                  <Text style={styles.settingTitle}>{item.title}</Text>
                </View>
                <View style={styles.settingRight}>
                  {item.value && <Text style={styles.settingValue}>{item.value}</Text>}
                  <Feather name="chevron-right" size={Layout.isTablet ? 28 : 20} color={Colors.textSecondary} />
                </View>
              </TouchableOpacity>
            ))}
          </Card>

          <Button title={t('auth.logout')} onPress={handleLogout} variant="outline" disabled={isLoading} loading={isLoading} style={styles.logoutButton} icon={<Feather name="log-out" size={18} color={Colors.error} />} textStyle={{ color: Colors.error }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    ...Typography.h1,
    color: Colors.textPrimary,
  },
  scrollContainer: {
    alignItems: 'center',
  },
  content: {
    width: '100%',
    maxWidth: Layout.isTablet ? 700 : undefined,
    padding: Spacing.lg,
  },
  profileCard: {
    marginBottom: Spacing.xl,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  avatar: {
    width: Layout.isTablet ? 80 : 60,
    height: Layout.isTablet ? 80 : 60,
    borderRadius: Layout.isTablet ? 40 : 30,
    backgroundColor: Colors.border,
  },
  profileInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  userName: {
    ...Typography.h2,
    color: Colors.textPrimary,
  },
  userEmail: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  editInputContainer: {
    marginBottom: 0,
  },
  editInput: {
    ...Typography.h2,
    paddingVertical: Spacing.xs,
  },
  profileActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.sm,
  },
  profileActionButton: {
    minWidth: 80,
    paddingHorizontal: Spacing.sm,
  },
  settingsCard: {
    marginBottom: Spacing.xl,
    paddingHorizontal: 0, // Card provides padding
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  settingItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingTitle: {
    ...Typography.body,
    color: Colors.textPrimary,
    marginLeft: Spacing.lg,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  settingValue: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  logoutButton: {
    borderColor: Colors.error,
    backgroundColor: 'transparent',
  },
});