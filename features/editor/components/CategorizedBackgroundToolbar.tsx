// features/editor/components/CategorizedBackgroundToolbar.tsx - YENİ KATEGORİLİ BACKGROUND TOOLBAR

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants';
import { BACKGROUND_CATEGORIES, Background } from '../config/backgrounds';
import { BackgroundButton } from './BackgroundButton';

interface CategorizedBackgroundToolbarProps {
  selectedBackgroundId?: string;
  onBackgroundSelect: (background: Background) => void;
}

export const CategorizedBackgroundToolbar: React.FC<CategorizedBackgroundToolbarProps> = ({
  selectedBackgroundId,
  onBackgroundSelect
}) => {
  const [activeCategory, setActiveCategory] = useState(BACKGROUND_CATEGORIES[0]?.id || 'home');

  const activeCategoryData = BACKGROUND_CATEGORIES.find(cat => cat.id === activeCategory);

  return (
    <View style={styles.container}>
      {/* Kategori Seçici */}
      <View style={styles.categorySection}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScrollContent}
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
        >
          {activeCategoryData?.backgrounds.map(background => (
            <BackgroundButton
              key={background.id}
              background={background}
              isSelected={selectedBackgroundId === background.id}
              onPress={() => onBackgroundSelect(background)}
            />
          ))}
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
  },
  
  categorySection: {
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  
  categoryScrollContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
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
  },
  
  backgroundScrollContent: {
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.lg,
  },
});