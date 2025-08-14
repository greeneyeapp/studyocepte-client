// features/editor/components/MainToolbar.tsx - GELİŞTİRİLMİŞ VE STANDARTLAŞTIRILMIŞ (İKON SEÇİLİ DURUMU KESİN DÜZELTİLDİ)

import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants';
import { ToolType, MAIN_TOOLS } from '../config/tools';
import { useTranslation } from 'react-i18next'; // useTranslation import edildi

interface MainToolbarProps {
  activeTool: ToolType;
  onToolChange: (tool: ToolType) => void;
}

export const MainToolbar: React.FC<MainToolbarProps> = ({
  activeTool,
  onToolChange,
}) => {
  const { t } = useTranslation(); // t hook'u kullanıldı
  return (
    <View style={styles.container}>
      {MAIN_TOOLS.map((tool, index) => {
        const isActive = activeTool === tool.key;
        
        return (
          <TouchableOpacity
            key={tool.key}
            style={styles.toolButton} // Her zaman şeffaf arka plan
            onPress={() => onToolChange(tool.key)}
            activeOpacity={0.7}
          >
            {/* Icon Container - aktifse birincil renk arka planı alacak */}
            <View style={[
              styles.iconContainer,
              isActive && styles.iconContainerActive // Aktif olduğunda bu stil uygulanacak
            ]}>
              <Feather
                name={tool.icon as any}
                size={20}
                color={isActive ? Colors.card : Colors.textSecondary} // Aktifse beyaz ikon, değilse ikincil metin rengi
              />
            </View>
            
            {/* Label */}
            <Text
              style={[
                styles.toolButtonText,
                isActive && styles.toolButtonTextActive, // Aktifse metin rengi değişecek
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit={true}
              minimumFontScale={0.8}
            >
              {t(`editor.toolLabels.${tool.key}`)} {/* Lokalize edildi */}
            </Text>
            
            {/* Alt çizgi indicator */}
            {isActive && <View style={styles.activeIndicator} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    backgroundColor: Colors.card,
    borderTopWidth: 0.5,
    borderTopColor: Colors.border,
    minHeight: 80, // Sabit minimum yükseklik
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 5,
  },
  
  toolButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    borderRadius: BorderRadius.lg,
    minWidth: 60, // Sabit minimum genişlik
    flex: 1, // Eşit dağılım
    maxWidth: 80, // Maksimum genişlik sınırı
    position: 'relative',
    marginHorizontal: 2, // Butonlar arası minimum boşluk
    backgroundColor: 'transparent', // KESİN ÇÖZÜM: Butonun kendi arka planı her zaman şeffaf olmalı
  },
  
  // styles.toolButtonActive stili tamamen kaldırıldı

  // Icon container
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xs,
    backgroundColor: Colors.gray100, // Varsayılan gri arka plan
  },
  
  iconContainerActive: {
    backgroundColor: Colors.primary, // KESİN ÇÖZÜM: Aktifse birincil renk arka planı
    // transform: [{ scale: 1.1 }] kaldırıldı (boyutlandırma yok)
  },
  
  toolButtonText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: '500',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 13,
  },
  
  toolButtonTextActive: {
    color: Colors.primary, // KESİN ÇÖZÜM: Aktifse birincil metin rengi
    fontWeight: '700',
    fontSize: 12,
  },
  
  // Alt çizgi indicator
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    left: '25%',
    right: '25%',
    height: 3,
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
});