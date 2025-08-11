// client/features/editor/components/BackgroundPickerToolbar.tsx - DEBUG STİLLERİ TEMİZLENMİŞ
import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants';
import { BACKGROUND_CATEGORIES, Background } from '../config/backgrounds';
import { BackgroundItem } from './BackgroundItem';

// Servisleri import et
import { backgroundThumbnailManager } from '@/services/backgroundThumbnailManager';
import { useEnhancedEditorStore } from '@/stores/useEnhancedEditorStore';

interface BackgroundPickerToolbarProps {
  selectedBackgroundId?: string;
  onBackgroundSelect: (background: Background) => void;
}

/**
 * ✅ TEMİZLENMİŞ: Arka Plan Seçici Araç Çubuğu.
 *    Debug renkler ve kenarlıklar kaldırıldı.
 *    Düzgün flex layout ile çalışacak şekilde düzenlendi.
 */
export const BackgroundPickerToolbar: React.FC<BackgroundPickerToolbarProps> = ({
  selectedBackgroundId,
  onBackgroundSelect
}) => {
  const [activeCategory, setActiveCategory] = useState(BACKGROUND_CATEGORIES[0]?.id || 'home');
  const [categorySelected, setCategorySelected] = useState<boolean>(false); // ✅ YENİ: Kategori seçildi mi?
  const [resolvedThumbnails, setResolvedThumbnails] = useState<Map<string, string>>(new Map());
  const [loadingThumbnails, setLoadingThumbnails] = useState<boolean>(true);
  const [thumbnailLoadError, setThumbnailLoadError] = useState<string | null>(null);

  // Aktif kategori verilerini memoize et
  const activeCategoryData = useMemo(() => {
    const category = BACKGROUND_CATEGORIES.find(cat => cat.id === activeCategory);
    return category;
  }, [activeCategory]);

  // ✅ DÜZELTME: Component mount olduğunda categorySelected'i false olarak başlat
  useEffect(() => {
    setCategorySelected(false);
  }, []);

  // Arka plan thumbnail'larını yükleme ve çözümleme etkisi
  useEffect(() => {
    let isMounted = true;
    
    // ✅ DÜZELTME: Sadece kategori seçildiyse thumbnail'ları yükle
    if (!categorySelected) {
      setLoadingThumbnails(false);
      return;
    }
    
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
  }, [activeCategoryData, categorySelected]); // ✅ categorySelected dependency eklendi

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
      categorySelected,
      backgroundCount: activeCategoryData.backgrounds.length,
      selectedBackgroundId: selectedBackgroundId || 'none',
      loadingThumbnails,
      thumbnailLoadError,
      resolvedThumbnailsCount: resolvedThumbnails.size,
    });
  }

  return (
    <View style={styles.container}>
      {/* ✅ YENİ: Back butonu (kategori seçildiyse) */}
      {categorySelected && activeCategoryData && (
        <View style={styles.backButtonContainer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setCategorySelected(false)}
            activeOpacity={0.7}
          >
            <Feather name="arrow-left" size={20} color={Colors.primary} />
            <Text style={styles.backButtonText}>Kategoriler</Text>
          </TouchableOpacity>
          <Text style={styles.selectedCategoryTitle}>
            {activeCategoryData.name}
          </Text>
        </View>
      )}

      {/* Kategori Seçici - sadece kategori seçilmemişse göster */}
      {!categorySelected && (
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
                style={styles.categoryButton}
                onPress={() => {
                  setActiveCategory(category.id);
                  setCategorySelected(true); // ✅ YENİ: Kategori seçildi olarak işaretle
                }}
                activeOpacity={0.7}
              >
                <View style={styles.categoryIconContainer}>
                  <Feather
                    name={category.icon as any}
                    size={20} // ✅ İcon boyutu azaltıldı
                    color={Colors.primary}
                  />
                </View>
                <Text style={styles.categoryText}>
                  {category.name}
                </Text>
                <Text style={styles.categoryCount}>
                  {category.backgrounds.length} görsel
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Arka Planlar - sadece kategori seçildiyse göster */}
      {categorySelected && activeCategoryData && (
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
                    background={{ ...background, thumbnailUrl: itemThumbnailUri || '' }}
                    isSelected={selectedBackgroundId === background.id}
                    onPress={() => onBackgroundSelect(background)}
                  />
                );
              })}
            </ScrollView>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    flex: 1, // Flex 1'i koru, parent container yönetecek
  },
  
  // ✅ YENİ: Back button styles - daha kompakt
  backButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm, // ✅ Padding azaltıldı
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.gray50,
    minHeight: 50, // ✅ Minimum yükseklik
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  backButtonText: {
    ...Typography.bodyMedium,
    color: Colors.primary,
    fontWeight: '600',
  },
  selectedCategoryTitle: {
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
    fontWeight: '600',
  },

  // ✅ GÜNCELLEME: Kategori seçici stilleri - daha kompakt
  categorySection: {
    paddingVertical: Spacing.md, // ✅ Padding azaltıldı
    flex: 1,
    justifyContent: 'center',
  },
  categoryScrollContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.lg, // ✅ Gap azaltıldı
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryButton: {
    alignItems: 'center',
    minWidth: 90, // ✅ Width azaltıldı
    paddingVertical: Spacing.md, // ✅ Padding azaltıldı
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.gray50,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  categoryIconContainer: {
    width: 40, // ✅ Boyut azaltıldı
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  categoryText: {
    ...Typography.body, // ✅ Font boyutu artırıldı
    color: Colors.textPrimary,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  // ✅ YENİ: Kategori sayaç
  categoryCount: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontSize: 11,
    textAlign: 'center',
  },

  backgroundSection: {
    paddingVertical: Spacing.sm, // ✅ Padding azaltıldı
    flex: 1,
    justifyContent: 'flex-start', // ✅ Yukarı yasla
    alignItems: 'stretch', // ✅ Full width kullan
  },
  backgroundScrollContent: {
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.sm, // ✅ Gap azaltıldı
    paddingVertical: Spacing.sm, // ✅ Vertical padding eklendi
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