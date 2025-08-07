import React from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, SafeAreaView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/stores/useAuthStore';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants';
import { Card } from '@/components/Card';
import { ToastService } from '@/components/Toast/ToastService';
import { DialogService } from '@/components/Dialog/DialogService'; // Bu import önemli

// Akıllı Renk Seçen Profil Avatarı Bileşeni
const ProfileAvatar: React.FC<{ name: string }> = ({ name }) => {
  const PALETTE = [Colors.primary, Colors.secondary, Colors.accent, '#7D9A81', '#A288A6', '#E29578'];
  const getInitials = () => {
    const words = name.trim().split(' ');
    if (words.length > 1 && words[words.length - 1]) return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };
  const stringToColor = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
    const index = Math.abs(hash) % PALETTE.length;
    return PALETTE[index];
  };
  return (
    <View style={avatarStyles.avatarContainer}>
      <View style={[avatarStyles.avatar, { backgroundColor: stringToColor(name) }]}>
        <Text style={avatarStyles.avatarText}>{getInitials()}</Text>
      </View>
    </View>
  );
};

// Modern ayar kartı bileşeni
const ModernSettingCard: React.FC<{
  icon: string; title: string; subtitle?: string; value?: string; onPress: () => void;
  iconColor?: string; showChevron?: boolean; isLast?: boolean; titleColor?: string;
}> = ({ icon, title, subtitle, value, onPress, iconColor = Colors.primary, showChevron = true, isLast = false, titleColor = Colors.textPrimary }) => (
  <TouchableOpacity style={[styles.modernCard, !isLast && styles.modernCardBorder]} onPress={onPress} activeOpacity={0.6}>
    <View style={styles.modernCardContent}>
      <View style={[styles.modernIcon, { backgroundColor: iconColor + '15' }]}>
        <Feather name={icon as any} size={22} color={iconColor} />
      </View>
      <View style={styles.modernTextContainer}>
        <Text style={[styles.modernTitle, { color: titleColor }]}>{title}</Text>
        {subtitle && <Text style={styles.modernSubtitle}>{subtitle}</Text>}
      </View>
      <View style={styles.modernRightSection}>
        {value && <Text style={styles.modernValue}>{value}</Text>}
        {showChevron && <Feather name="chevron-right" size={20} color={Colors.gray400} />}
      </View>
    </View>
  </TouchableOpacity>
);

// Ayar grubu başlığı
const SectionHeader: React.FC<{ title: string; icon?: string }> = ({ title, icon }) => (
  <View style={styles.sectionHeader}>
    {icon && <Feather name={icon as any} size={16} color={Colors.primary} />}
    <Text style={styles.sectionHeaderText}>{title}</Text>
  </View>
);

export default function SettingsScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { user, logout, isLoading } = useAuthStore();

  const handleBackPress = () => router.back();

  // GÜNCELLEME: Çıkış onayı artık tasarıma uygun DialogService kullanıyor.
  const handleLogout = () => {
    DialogService.show({
      title: "Çıkış Yap",
      message: "Oturumu sonlandırmak istediğinizden emin misiniz?",
      buttons: [
        { text: "İptal", style: 'cancel' },
        { text: "Çıkış Yap", style: 'destructive', onPress: async () => await logout() },
      ],
    });
  };

  const getCurrentLanguageLabel = () => i18n.language === 'en' ? 'English' : 'Türkçe';

  if (!user) return <SafeAreaView style={styles.container} />;

  const isGuest = user.isGuest;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Hesap</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Profil Kartı (Sadeleştirildi) */}
        <Card style={styles.profileCard}>
          <View style={styles.profileCardContent}>
            <ProfileAvatar name={user.name || 'Misafir'} />
            <Text style={styles.userName}>{user.name}</Text>
            {!isGuest && (
              <Text style={styles.userEmail} numberOfLines={1} ellipsizeMode="tail">
                {user.email}
              </Text>
            )}
            {/* "Profili Düzenle" butonu kaldırıldı */}
          </View>
        </Card>

        {/* Uygulama Ayarları */}
        <View style={styles.sectionContainer}>
          <SectionHeader title="Uygulama Ayarları" icon="settings" />
          <Card padding="none" style={styles.settingsCard}>
            <ModernSettingCard icon="globe" title="Dil" subtitle="Uygulama dilini değiştirin" value={getCurrentLanguageLabel()} onPress={() => { }} iconColor={Colors.primary} />
            <ModernSettingCard
              icon="credit-card" title="Abonelik"
              subtitle={isGuest ? "Abone olmak için hesap oluşturun" : "Premium özelliklere erişin"}
              onPress={() => ToastService.show({ type: 'info', text1: isGuest ? 'Lütfen önce kayıt olun.' : 'Yakında gelecek!' })}
              iconColor={Colors.accent} isLast
            />
          </Card>
        </View>

        {/* Destek ve Hakkında */}
        <View style={styles.sectionContainer}>
          <SectionHeader title="Destek ve Bilgi" icon="help-circle" />
          <Card padding="none" style={styles.settingsCard}>
            <ModernSettingCard icon="message-circle" title="Destek" subtitle="Yardım alın ve geri bildirimde bulunun" onPress={() => { }} iconColor="#10B981" />
            <ModernSettingCard icon="info" title="Hakkında" subtitle="Uygulama bilgileri ve sürüm" value="v1.0.0" onPress={() => { }} iconColor="#8B5CF6" />
            <ModernSettingCard icon="star" title="Uygulamayı Değerlendirin" subtitle="App Store'da bizi değerlendirin" onPress={() => { }} iconColor="#F59E0B" showChevron={false} isLast />
          </Card>
        </View>

        {/* GÜNCELLEME: Yeni Çıkış Yap Butonu */}
        <View style={styles.sectionContainer}>
          <SectionHeader title="Hesap" icon="user" />
          <Card padding="none" style={styles.settingsCard}>
            <ModernSettingCard
              icon="log-out"
              title="Çıkış Yap"
              onPress={handleLogout}
              iconColor={Colors.error}
              titleColor={Colors.error}
              showChevron={false}
              isLast
            />
          </Card>
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const avatarStyles = StyleSheet.create({
  avatarContainer: { marginBottom: Spacing.md },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 4, borderColor: Colors.card,
  },
  avatarText: { ...Typography.h1, color: Colors.card, fontWeight: '700' },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md, // Bu satırı değiştirin
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: { padding: Spacing.xs, marginLeft: -Spacing.xs },
  headerTitle: { ...Typography.h2, color: Colors.textPrimary, fontWeight: '700' },
  headerRight: { width: 40 },
  scrollContainer: { paddingVertical: Spacing.lg, paddingHorizontal: Spacing.md },

  profileCard: {
    marginBottom: Spacing.xl, borderRadius: BorderRadius.xl,
    padding: Spacing.xl, // İçerik için padding eklendi
  },
  profileCardContent: { // İçeriği ortalamak için yeni stil
    alignItems: 'center',
  },
  userName: {
    ...Typography.h2, color: Colors.textPrimary,
    fontWeight: '700', marginBottom: Spacing.xs / 2,
  },
  userEmail: { ...Typography.body, color: Colors.textSecondary },

  sectionContainer: { marginBottom: Spacing.xl },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md,
    paddingHorizontal: Spacing.sm, gap: Spacing.sm,
  },
  sectionHeaderText: {
    ...Typography.bodyMedium, color: Colors.textSecondary, fontWeight: '600',
    textTransform: 'uppercase', letterSpacing: 0.5, fontSize: 13,
  },
  settingsCard: { backgroundColor: Colors.card, borderRadius: BorderRadius.xl },

  modernCard: { paddingVertical: Spacing.md, paddingHorizontal: Spacing.lg },
  modernCardBorder: { borderBottomWidth: 1, borderBottomColor: Colors.gray100 },
  modernCardContent: { flexDirection: 'row', alignItems: 'center' },
  modernIcon: {
    width: 44, height: 44, borderRadius: BorderRadius.lg,
    justifyContent: 'center', alignItems: 'center', marginRight: Spacing.md,
  },
  modernTextContainer: { flex: 1 },
  modernTitle: { ...Typography.bodyMedium, fontWeight: '600', marginBottom: 2 },
  modernSubtitle: { ...Typography.caption, color: Colors.textSecondary, lineHeight: 16 },
  modernRightSection: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  modernValue: { ...Typography.body, color: Colors.primary, fontWeight: '500' },
});