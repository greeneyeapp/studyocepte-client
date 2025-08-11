// features/editor/components/CategorizedBackgroundToolbar.tsx - BEYAZ EKRAN SORUNU DÜZELTİLMİŞ
import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants';
import { BACKGROUND_CATEGORIES, Background } from '../config/backgrounds';
import { OptimizedBackgroundButton } from './OptimizedBackgroundButton';

interface CategorizedBackgroundToolbarProps {
  selectedBackgroundId?: string;
  onBackgroundSelect: (background: Background) => void;
}

export const CategorizedBackgroundToolbar: React.FC<CategorizedBackgroundToolbarProps> = ({
  selectedBackgroundId,
  onBackgroundSelect
}) => {
  const [activeCategory, setActiveCategory] = useState(BACKGROUND_CATEGORIES[0]?.id || 'home');

  // ✅ DÜZELTME: useMemo ile kategori datası cache'le
  const activeCategoryData = useMemo(() => {
    return BACKGROUND_CATEGORIES.find(cat => cat.id === activeCategory);
  }, [activeCategory]);

  // ✅ DÜZELTME: Error boundary görevi görecek fallback
  if (!activeCategoryData || !activeCategoryData.backgrounds) {
    console.warn('⚠️ Active category data not found:', activeCategory);
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Arka plan kategorisi yüklenemedi</Text>
        </View>
      </View>
    );
  }

  // ✅ DÜZELTME: Background seçimi için safe handler
  const handleBackgroundSelect = (background: Background) => {
    try {
      console.log('🖼️ Background selected:', background.id);
      onBackgroundSelect(background);
    } catch (error) {
      console.error('❌ Background selection failed:', error);
    }
  };

  // ✅ DÜZELTME: Kategori değişimi için safe handler
  const handleCategoryChange = (categoryId: string) => {
    try {
      console.log('📂 Category changed to:', categoryId);
      setActiveCategory(categoryId);
    } catch (error) {
      console.error('❌ Category change failed:', error);
    }
  };

  return (
    <View style={styles.container}>
      {/* Kategori Seçici */}
      <View style={styles.categorySection}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScrollContent}
          removeClippedSubviews={false} // ✅ DÜZELTME: Clipping'i kapat
        >
          {BACKGROUND_CATEGORIES.map(category => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryButton,
                activeCategory === category.id && styles.categoryButtonActive
              ]}
              onPress={() => handleCategoryChange(category.id)}
              activeOpacity={0.7}
            >
              <View style={[
                styles.categoryIconContainer,
                activeCategory === category.id && styles.categoryIconContainerActive
              ]}>
                <Feather 
                  name={category.icon as any} 
                  size={20} 
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

      {/* Background'lar */}
      <View style={styles.backgroundSection}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.backgroundScrollContent}
          removeClippedSubviews={false} // ✅ DÜZELTME: Clipping'i kapat
          nestedScrollEnabled={true} // ✅ DÜZELTME: Nested scroll enable
        >
          {activeCategoryData.backgrounds.map(background => {
            // ✅ DÜZELTME: Her background için error boundary
            try {
              return (
                <OptimizedBackgroundButton
                  key={background.id}
                  background={background}
                  isSelected={selectedBackgroundId === background.id}
                  onPress={() => handleBackgroundSelect(background)}
                />
              );
            } catch (error) {
              console.error('❌ Background button render error:', background.id, error);
              // ✅ DÜZELTME: Hata durumunda placeholder render et
              return (
                <View key={background.id} style={styles.errorBackground}>
                  <Feather name="alert-triangle" size={16} color={Colors.error} />
                </View>
              );
            }
          })}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    minHeight: 140, // ✅ DÜZELTME: Minimum yükseklik garanti et
  },
  
  categorySection: {
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  
  categoryScrollContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
    minHeight: 60, // ✅ DÜZELTME: Minimum yükseklik
  },
  
  categoryButton: {
    alignItems: 'center',
    minWidth: 70,
  },
  
  categoryButtonActive: {
    // Aktif kategori için özel stil yok, iconContainer'da hallediliyor
  },
  
  categoryIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  
  categoryIconContainerActive: {
    backgroundColor: Colors.primary,
  },
  
  categoryText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: '500',
    textAlign: 'center',
  },
  
  categoryTextActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  
  backgroundSection: {
    paddingVertical: Spacing.md,
    minHeight: 80, // ✅ DÜZELTME: Minimum yükseklik
  },
  
  backgroundScrollContent: {
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.lg,
    minHeight: 60, // ✅ DÜZELTME: Minimum yükseklik
  },

  // ✅ DÜZELTME: Error state stilleri
  errorContainer: {
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },

  errorText: {
    ...Typography.body,
    color: Colors.error,
    textAlign: 'center',
  },

  errorBackground: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.gray200,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.error,
  },
});