// features/editor/components/CategorizedBackgroundToolbar.tsx - TEXT HATASI DÜZELTİLMİŞ
import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants';
import { BACKGROUND_CATEGORIES, Background } from '../config/backgrounds';
import { SimpleBackgroundButton } from './SimpleBackgroundButton';

interface CategorizedBackgroundToolbarProps {
  selectedBackgroundId?: string;
  onBackgroundSelect: (background: Background) => void;
}

export const CategorizedBackgroundToolbar: React.FC<CategorizedBackgroundToolbarProps> = ({
  selectedBackgroundId,
  onBackgroundSelect
}) => {
  const [activeCategory, setActiveCategory] = useState(BACKGROUND_CATEGORIES[0]?.id || 'home');

  // ✅ DÜZELTİLMİŞ: useMemo ile kategori datası cache'le
  const activeCategoryData = useMemo(() => {
    const category = BACKGROUND_CATEGORIES.find(cat => cat.id === activeCategory);
    console.log('🗂️ Active category loaded:', activeCategory, 'Backgrounds count:', category?.backgrounds?.length || 0);
    return category;
  }, [activeCategory]);

  // ✅ DÜZELTİLMİŞ: Error boundary görevi görecek fallback
  if (!activeCategoryData || !activeCategoryData.backgrounds || activeCategoryData.backgrounds.length === 0) {
    console.warn('⚠️ Active category data not found or empty:', activeCategory);
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Feather name="alert-triangle" size={24} color={Colors.error} />
          <Text style={styles.errorText}>Arka plan kategorisi yüklenemedi</Text>
          <Text style={styles.errorSubtext}>Kategori: {activeCategory || 'undefined'}</Text>
        </View>
      </View>
    );
  }

  // ✅ DÜZELTİLMİŞ: Background seçimi için safe handler
  const handleBackgroundSelect = (background: Background) => {
    try {
      console.log('🖼️ Background selected:', background.id, background.name);
      onBackgroundSelect(background);
    } catch (error) {
      console.error('❌ Background selection failed:', error);
    }
  };

  // ✅ DÜZELTİLMİŞ: Kategori değişimi için safe handler
  const handleCategoryChange = (categoryId: string) => {
    try {
      console.log('📂 Category changed from', activeCategory, 'to', categoryId);
      setActiveCategory(categoryId);
    } catch (error) {
      console.error('❌ Category change failed:', error);
    }
  };

  // ✅ DÜZELTİLMİŞ: Debug render
  console.log('🎨 CategorizedBackgroundToolbar rendering:', {
    activeCategory,
    backgroundCount: activeCategoryData.backgrounds.length,
    selectedBackgroundId: selectedBackgroundId || 'none'
  });

  return (
    <View style={styles.container}>
      {/* DEBUG BİLGİSİ */}
      <View style={styles.debugHeader}>
        <Text style={styles.debugHeaderText}>
          📂 {activeCategoryData.name} ({activeCategoryData.backgrounds.length} arka plan)
        </Text>
      </View>

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
              onPress={() => handleCategoryChange(category.id)}
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

      {/* Background'lar */}
      <View style={styles.backgroundSection}>
        <Text style={styles.debugFooterText}>
          🧪 Background Section Test - Count: {activeCategoryData.backgrounds.length}
        </Text>

        {/* Manuel test butonları */}
        <View style={{
          flexDirection: 'row',
          padding: 20,
          gap: 10,
          backgroundColor: '#00ff00', // Yeşil arka plan
          minHeight: 100,
        }}>
          <View style={{
            width: 60,
            height: 60,
            backgroundColor: '#ff0000',
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: 8,
          }}>
            <Text style={{ color: 'white', fontWeight: 'bold' }}>1</Text>
          </View>

          <View style={{
            width: 60,
            height: 60,
            backgroundColor: '#0000ff',
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: 8,
          }}>
            <Text style={{ color: 'white', fontWeight: 'bold' }}>2</Text>
          </View>

          <View style={{
            width: 60,
            height: 60,
            backgroundColor: '#ffff00',
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: 8,
          }}>
            <Text style={{ color: 'black', fontWeight: 'bold' }}>3</Text>
          </View>
        </View>

        {/* ScrollView Test */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{
            backgroundColor: '#ff00ff', // Mor arka plan
            minHeight: 80,
          }}
          contentContainerStyle={{
            paddingHorizontal: 20,
            alignItems: 'center',
            gap: 10,
            minHeight: 80,
          }}
        >
          {/* Data test */}
          {activeCategoryData.backgrounds.map((background, index) => (
            <View
              key={`test-${background.id}-${index}`}
              style={{
                width: 70,
                height: 70,
                backgroundColor: Colors.primary,
                justifyContent: 'center',
                alignItems: 'center',
                borderRadius: 8,
                marginHorizontal: 5,
              }}
            >
              <Text style={{
                color: 'white',
                fontWeight: 'bold',
                fontSize: 12,
                textAlign: 'center'
              }}>
                {background.name.substring(0, 3)}
              </Text>
              <Text style={{
                color: 'white',
                fontSize: 10,
                textAlign: 'center'
              }}>
                {background.id}
              </Text>
            </View>
          ))}
        </ScrollView>

        {/* Component test */}
        <View style={{
          backgroundColor: '#ffa500', // Turuncu arka plan
          padding: 20,
          minHeight: 80,
        }}>
          <Text style={{ textAlign: 'center', fontWeight: 'bold' }}>
            Component Test:
          </Text>
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 10, marginTop: 10 }}>
            {activeCategoryData.backgrounds.slice(0, 3).map((background, index) => (
              <SimpleBackgroundButton
                key={`comp-${background.id}-${index}`}
                background={background}
                isSelected={selectedBackgroundId === background.id}
                onPress={() => handleBackgroundSelect(background)}
              />
            ))}
          </View>
        </View>
      </View>

      {/* Alt Debug Bilgisi */}
      <View style={styles.debugFooter}>
        <Text style={styles.debugFooterText}>
          Seçili: {selectedBackgroundId || 'Yok'} | Aktif Araç: background
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    minHeight: 180, // ✅ DÜZELTİLMİŞ: Daha yüksek minimum garanti et
  },

  // ✅ YENİ: Debug header
  debugHeader: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
  },

  debugHeaderText: {
    ...Typography.caption,
    color: Colors.card,
    fontWeight: '600',
    textAlign: 'center',
    fontSize: 12,
  },

  categorySection: {
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    minHeight: 70, // ✅ DÜZELTİLMİŞ: Minimum yükseklik
  },

  categoryScrollContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
    minHeight: 50, // ✅ DÜZELTİLMİŞ: Minimum yükseklik
    alignItems: 'center', // ✅ DÜZELTİLMİŞ: İçeriği ortala
  },

  categoryButton: {
    alignItems: 'center',
    minWidth: 60, // ✅ DÜZELTİLMİŞ: Daha küçük min width
    paddingVertical: Spacing.xs,
  },

  categoryIconContainer: {
    width: 36, // ✅ DÜZELTİLMİŞ: Daha küçük icon container
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
    fontSize: 11, // ✅ DÜZELTİLMİŞ: Daha küçük font
  },

  categoryTextActive: {
    color: Colors.primary,
    fontWeight: '600',
  },

  backgroundSection: {
    paddingVertical: Spacing.md,
    minHeight: 80, // ✅ DÜZELTİLMİŞ: Minimum yükseklik
    flex: 1, // ✅ DÜZELTİLMİŞ: Kalan alanı kapla
  },

  backgroundScrollContent: {
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.md, // ✅ DÜZELTİLMİŞ: Daha küçük gap
    minHeight: 60, // ✅ DÜZELTİLMİŞ: Minimum yükseklik
  },

  // ✅ DÜZELTİLMİŞ: Error state stilleri
  errorContainer: {
    padding: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
    flex: 1,
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

  errorBackgroundText: {
    ...Typography.caption,
    color: Colors.error,
    fontSize: 10,
    marginTop: 2,
  },

  // ✅ YENİ: Debug footer
  debugFooter: {
    backgroundColor: Colors.gray100,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },

  debugFooterText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontSize: 10,
  },
});