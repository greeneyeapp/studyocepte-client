// client/features/editor/components/BackgroundPickerToolbar.tsx - DÜZELTİLDİ

import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants';
import { BACKGROUND_CATEGORIES, Background } from '../config/backgrounds';
import { BackgroundItem } from './BackgroundItem';
import { useTranslation } from 'react-i18next';

import { backgroundThumbnailManager } from '@/services/backgroundThumbnailManager';
import { useEnhancedEditorStore } from '@/stores/useEnhancedEditorStore';

interface BackgroundPickerToolbarProps {
  selectedBackgroundId?: string;
  onBackgroundSelect: (background: Background) => void;
}

export const BackgroundPickerToolbar: React.FC<BackgroundPickerToolbarProps> = ({
  selectedBackgroundId,
  onBackgroundSelect
}) => {
  const { t } = useTranslation();
  const [activeCategory, setActiveCategory] = useState(BACKGROUND_CATEGORIES[0]?.id || 'home');
  const [categorySelected, setCategorySelected] = useState<boolean>(false);
  const [resolvedThumbnails, setResolvedThumbnails] = useState<Map<string, string>>(new Map());
  const [loadingThumbnails, setLoadingThumbnails] = useState<boolean>(true);
  const [thumbnailLoadError, setThumbnailLoadError] = useState<string | null>(null);

  const activeCategoryData = useMemo(() => {
    const category = BACKGROUND_CATEGORIES.find(cat => cat.id === activeCategory);
    return category;
  }, [activeCategory]);

  useEffect(() => {
    setCategorySelected(false);
  }, []);

  useEffect(() => {
    let isMounted = true;
    
    if (!categorySelected) {
      setLoadingThumbnails(false);
      return;
    }
    
    setLoadingThumbnails(true);
    setThumbnailLoadError(null);
    setResolvedThumbnails(new Map());

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
              if (__DEV__) console.log(t('editor.backgroundThumbnailResolvedLog', { id: bg.id }));
            } else {
              console.warn(t('editor.backgroundThumbnailNullLog', { id: bg.id }));
            }
          }
        } catch (error: any) {
          if (isMounted) {
            console.error(t('editor.backgroundThumbnailLoadErrorLog', { id: bg.id, message: error.message }));
            newResolvedMap.set(bg.id, '');
            setThumbnailLoadError(t('editor.backgroundLoadError', { id: bg.id }));
          }
        }
      });

      await Promise.allSettled(promises);

      if (isMounted) {
        setResolvedThumbnails(newResolvedMap);
        setLoadingThumbnails(false);
      }
    };

    loadThumbnails();

    return () => {
      isMounted = false;
    };
  }, [activeCategoryData, categorySelected, t]);

  if (!activeCategoryData) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Feather name="alert-triangle" size={24} color={Colors.error} />
          <Text style={styles.errorText}>{t('editor.backgroundCategoriesLoadError')}</Text>
          <Text style={styles.errorSubtext}>{t('editor.restartAppSuggestion')}</Text>
        </View>
      </View>
    );
  }

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
      {categorySelected && activeCategoryData && (
        <View style={styles.backButtonContainer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setCategorySelected(false)}
            activeOpacity={0.7}
          >
            <Feather name="arrow-left" size={20} color={Colors.primary} />
            <Text style={styles.backButtonText}>{t('editor.backgroundPicker.categories')}</Text>
          </TouchableOpacity>
          <Text style={styles.selectedCategoryTitle}>
            {t(activeCategoryData.name)} {/* category.name artık çeviri anahtarı */}
          </Text>
        </View>
      )}

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
                  setCategorySelected(true);
                }}
                activeOpacity={0.7}
              >
                <View style={styles.categoryIconContainer}>
                  <Feather
                    name={category.icon as any}
                    size={20}
                    color={Colors.primary}
                  />
                </View>
                <Text style={styles.categoryText}>
                  {t(category.name)} {/* category.name artık çeviri anahtarı */}
                </Text>
                <Text style={styles.categoryCount}>
                  {t('editor.backgroundPicker.imagesSuffix', { count: category.backgrounds.length })}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {categorySelected && activeCategoryData && (
        <View style={styles.backgroundSection}>
          {loadingThumbnails ? (
            <View style={styles.loadingThumbnailsContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.loadingThumbnailsText}>{t('editor.backgroundsLoading')}</Text>
            </View>
          ) : thumbnailLoadError ? (
            <View style={styles.errorContainer}>
              <Feather name="image-off" size={24} color={Colors.error} />
              <Text style={styles.errorText}>{t('editor.imageLoadError')}</Text>
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
                    background={{ ...background, thumbnailUrl: itemThumbnailUri || background.thumbnailUrl }}
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
    flex: 1,
  },
  
  backButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.gray50,
    minHeight: 50,
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

  categorySection: {
    paddingVertical: Spacing.md,
    flex: 1,
    justifyContent: 'center',
  },
  categoryScrollContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryButton: {
    alignItems: 'center',
    minWidth: 90,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.gray50,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  categoryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  categoryText: {
    ...Typography.body,
    color: Colors.textPrimary,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  categoryCount: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontSize: 11,
    textAlign: 'center',
  },

  backgroundSection: {
    paddingVertical: Spacing.sm,
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'stretch',
  },
  backgroundScrollContent: {
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
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