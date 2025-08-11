// client/features/editor/components/BackgroundPickerToolbar.tsx - YENİ ANA ARKA PLAN SEÇİCİ (Debug Renklerle)
import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants';
import { BACKGROUND_CATEGORIES, Background } from '../config/backgrounds';
import { BackgroundItem } from './BackgroundItem'; // Yeni basit background item

// Servisleri import et
import { backgroundThumbnailManager } from '@/services/backgroundThumbnailManager';
import { useEnhancedEditorStore } from '@/stores/useEnhancedEditorStore';

interface BackgroundPickerToolbarProps {
  selectedBackgroundId?: string;
  onBackgroundSelect: (background: Background) => void;
}

/**
 * ✅ YENİ: Arka Plan Seçici Araç Çubuğu.
 *    Kategorileri ve arka planları daha basit bir şekilde listeler.
 *    Thumbnail'ları `backgroundThumbnailManager` aracılığıyla yükler ve yönetir.
 *    DEBUG amaçlı arka plan renkleri ve kenarlıklar içerir.
 */
export const BackgroundPickerToolbar: React.FC<BackgroundPickerToolbarProps> = ({
  selectedBackgroundId,
  onBackgroundSelect
}) => {
  const [activeCategory, setActiveCategory] = useState(BACKGROUND_CATEGORIES[0]?.id || 'home');
  const [resolvedThumbnails, setResolvedThumbnails] = useState<Map<string, string>>(new Map());
  const [loadingThumbnails, setLoadingThumbnails] = useState<boolean>(true);
  const [thumbnailLoadError, setThumbnailLoadError] = useState<string | null>(null);

  // Aktif kategori verilerini memoize et
  const activeCategoryData = useMemo(() => {
    const category = BACKGROUND_CATEGORIES.find(cat => cat.id === activeCategory);
    return category;
  }, [activeCategory]);

  // Arka plan thumbnail'larını yükleme ve çözümleme etkisi
  useEffect(() => {
    let isMounted = true;
    setLoadingThumbnails(true);
    setThumbnailLoadError(null);
    setResolvedThumbnails(new Map()); // Her kategori değişiminde map'i sıfırla

    const loadThumbnails = async () => {
      if (!activeCategoryData || !activeCategoryData.backgrounds) {
        setLoadingThumbnails(false);
        return;
      }

      const newResolvedMap = new Map<string, string>();
      const promises = activeCategoryData.backgrounds.map(async (bg) => {
        try {
          const uri = await backgroundThumbnailManager.getThumbnail(bg.id, bg.fullUrl);
          if (isMounted) {
            if (uri) {
              newResolvedMap.set(bg.id, uri);
              if (__DEV__) console.log(`🖼️ Thumbnail çözümlendi ve yüklendi: ${bg.id}`);
            } else {
              console.warn(`⚠️ Thumbnail çözümlenemedi (null/undefined): ${bg.id}`);
            }
          }
        } catch (error: any) {
          if (isMounted) {
            console.error(`❌ Thumbnail yükleme hatası for ${bg.id}:`, error.message);
            // Hata durumunda bile, diğerlerini etkilemeden boş bırak
            newResolvedMap.set(bg.id, ''); // Hata durumunda boş string veya özel bir placeholder URI
            setThumbnailLoadError(`Görsel yüklenemedi: ${bg.id}`);
          }
        }
      });

      await Promise.allSettled(promises); // Tüm promise'lerin bitmesini bekle

      if (isMounted) {
        setResolvedThumbnails(newResolvedMap);
        setLoadingThumbnails(false);
      }
    };

    loadThumbnails();

    return () => {
      isMounted = false; // Temizleme
    };
  }, [activeCategoryData]); // activeCategoryData değiştiğinde yeniden yükle

  // Hata durumu kontrolü (eğer kategori verisi yoksa)
  if (!activeCategoryData) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Feather name="alert-triangle" size={24} color={Colors.error} />
          <Text style={styles.errorText}>Arka plan kategorileri yüklenemedi.</Text>
          <Text style={styles.errorSubtext}>Lütfen uygulamayı yeniden başlatın.</Text>
        </View>
      </View>
    );
  }

  // Debug logu
  if (__DEV__) {
    console.log('🎨 BackgroundPickerToolbar rendering:', {
      activeCategory,
      backgroundCount: activeCategoryData.backgrounds.length,
      selectedBackgroundId: selectedBackgroundId || 'none',
      loadingThumbnails,
      thumbnailLoadError,
      resolvedThumbnailsCount: resolvedThumbnails.size,
    });
  }

  return (
    <View style={styles.container}>
      {/* Kategori Seçici */}
      <View style={styles.categorySection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScrollContent}
          removeClippedSubviews={false}
        >
          {BACKGROUND_CATEGORIES.map(category => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryButton,
                activeCategory === category.id && styles.categoryButtonActive
              ]}
              onPress={() => setActiveCategory(category.id)}
              activeOpacity={0.7}
            >
              <View style={[
                styles.categoryIconContainer,
                activeCategory === category.id && styles.categoryIconContainerActive
              ]}>
                <Feather
                  name={category.icon as any}
                  size={18}
                  color={activeCategory === category.id ? Colors.card : Colors.textSecondary}
                />
              </View>
              <Text style={[
                styles.categoryText,
                activeCategory === category.id && styles.categoryTextActive
              ]}>
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Arka Planlar - BURADA GEÇİCİ STİLLER EKLENİYOR */}
      <View style={styles.backgroundSection}>
        {loadingThumbnails ? (
          <View style={styles.loadingThumbnailsContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingThumbnailsText}>Arka planlar yükleniyor...</Text>
          </View>
        ) : thumbnailLoadError ? (
          <View style={styles.errorContainer}>
            <Feather name="image-off" size={24} color={Colors.error} />
            <Text style={styles.errorText}>Görsel yükleme hatası!</Text>
            <Text style={styles.errorSubtext}>{thumbnailLoadError}</Text>
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.backgroundScrollContent}
            removeClippedSubviews={false}
          >
            {activeCategoryData.backgrounds.map((background) => {
              const itemThumbnailUri = resolvedThumbnails.get(background.id);
              return (
                <BackgroundItem
                  key={background.id}
                  background={{ ...background, thumbnailUrl: itemThumbnailUri || '' }} // Çözümlenmiş URI'yi ilet
                  isSelected={selectedBackgroundId === background.id}
                  onPress={() => onBackgroundSelect(background)}
                />
              );
            })}
          </ScrollView>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    flex: 1, // Flex 1'i koru
    // minHeight: 180, // minHeight'ı buradan kaldır, parent'ı yönetecek
  },
  categorySection: {
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    minHeight: 70,
  },
  categoryScrollContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
    minHeight: 50,
    alignItems: 'center',
  },
  categoryButton: {
    alignItems: 'center',
    minWidth: 60,
    paddingVertical: Spacing.xs,
  },
  categoryIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  categoryIconContainerActive: {
    backgroundColor: Colors.primary,
  },
  categoryText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: '500',
    textAlign: 'center',
    fontSize: 11,
  },
  categoryTextActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  backgroundSection: {
    paddingVertical: Spacing.md,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',

    // GEÇİCİ HATA AYIKLAMA STİLLERİ
    backgroundColor: 'yellow', // backgroundSection'ın arka planını sarı yap
    minHeight: 150,           // En az 150 birim yükseklik ver
    borderWidth: 3,           // 3 birimlik kenarlık
    borderColor: 'blue',      // Mavi kenarlık
  },
  backgroundScrollContent: {
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.md,
    minHeight: 60,
    // GEÇİCİ HATA AYIKLAMA STİLİ
    backgroundColor: 'orange', // ScrollView içeriğinin arka planını turuncu yap
  },
  loadingThumbnailsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 100,
  },
  loadingThumbnailsText: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 100,
    paddingHorizontal: Spacing.lg,
  },
  errorText: {
    ...Typography.bodyMedium,
    color: Colors.error,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  errorSubtext: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
});