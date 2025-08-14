import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  Switch,
  StyleSheet,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants';
import { useTranslation } from 'react-i18next'; // useTranslation import edildi

interface SearchFilters {
  sortBy: 'name' | 'createdAt' | 'photoCount';
  sortOrder: 'asc' | 'desc';
  hasPhotos: boolean | null;
  dateRange: { start?: Date; end?: Date } | null;
}

interface EnhancedSearchBarProps {
  onSearch: (query: string, filters: SearchFilters) => void;
  placeholder?: string;
}

export const EnhancedSearchBar: React.FC<EnhancedSearchBarProps> = ({
  onSearch,
  placeholder = 'Ürün ara...'
}) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    sortBy: 'createdAt',
    sortOrder: 'desc',
    hasPhotos: null,
    dateRange: null,
  });

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    onSearch(query, filters);
  }, [filters, onSearch]);

  const handleFilterChange = useCallback((newFilters: Partial<SearchFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    onSearch(searchQuery, updatedFilters);
  }, [filters, searchQuery, onSearch]);

  const clearFilters = useCallback(() => {
    const defaultFilters: SearchFilters = {
      sortBy: 'createdAt',
      sortOrder: 'desc',
      hasPhotos: null,
      dateRange: null,
    };
    setFilters(defaultFilters);
    onSearch(searchQuery, defaultFilters);
  }, [searchQuery, onSearch]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.sortBy !== 'createdAt' || filters.sortOrder !== 'desc') count++;
    if (filters.hasPhotos !== null) count++;
    if (filters.dateRange) count++;
    return count;
  }, [filters]);

  return (
    <>
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Feather name="search" size={20} color={Colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('home.searchPlaceholder')}
            value={searchQuery}
            onChangeText={handleSearch}
            placeholderTextColor={Colors.textSecondary}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <Feather name="x" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
        
        <TouchableOpacity
          style={[styles.filterButton, activeFiltersCount > 0 && styles.filterButtonActive]}
          onPress={() => setShowFilters(true)}
        >
          <Feather name="filter" size={20} color={activeFiltersCount > 0 ? Colors.primary : Colors.textSecondary} />
          {activeFiltersCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFiltersCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <Modal
        visible={showFilters}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowFilters(false)}>
              <Text style={styles.modalCancel}>{t('common.cancel')}</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{t('home.filter.modalTitle')}</Text>
            <TouchableOpacity onPress={clearFilters}>
              <Text style={styles.modalClear}>{t('common.clear')}</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Sort Options */}
            <View style={styles.filterSection}>
              <Text style={styles.sectionTitle}>{t('home.filter.sortSectionTitle')}</Text>
              
              <View style={styles.filterRow}>
                <Text style={styles.filterLabel}>{t('home.filter.sortByLabel')}</Text>
                <View style={styles.sortButtons}>
                  {(['name', 'createdAt', 'photoCount'] as const).map((option) => (
                    <TouchableOpacity
                      key={option}
                      style={[
                        styles.sortButton,
                        filters.sortBy === option && styles.sortButtonActive
                      ]}
                      onPress={() => handleFilterChange({ sortBy: option })}
                    >
                      <Text style={[
                        styles.sortButtonText,
                        filters.sortBy === option && styles.sortButtonTextActive
                      ]}>
                        {option === 'name' ? t('home.filter.sortByName') : option === 'createdAt' ? t('home.filter.sortByDate') : t('home.filter.sortByPhotoCount')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.filterRow}>
                <Text style={styles.filterLabel}>{t('home.filter.sortOrderLabel')}</Text>
                <View style={styles.sortButtons}>
                  <TouchableOpacity
                    style={[
                      styles.sortButton,
                      filters.sortOrder === 'asc' && styles.sortButtonActive
                    ]}
                    onPress={() => handleFilterChange({ sortOrder: 'asc' })}
                  >
                    <Text style={[
                      styles.sortButtonText,
                      filters.sortOrder === 'asc' && styles.sortButtonTextActive
                    ]}>
                      {t('home.filter.sortOrderAscending')}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.sortButton,
                      filters.sortOrder === 'desc' && styles.sortButtonActive
                    ]}
                    onPress={() => handleFilterChange({ sortOrder: 'desc' })}
                  >
                    <Text style={[
                      styles.sortButtonText,
                      filters.sortOrder === 'desc' && styles.sortButtonTextActive
                    ]}>
                      {t('home.filter.sortOrderDescending')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Photo Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.sectionTitle}>{t('home.filter.photoStatusSectionTitle')}</Text>
              
              <View style={styles.filterRow}>
                <Text style={styles.filterLabel}>{t('home.filter.onlyProductsWithPhotos')}</Text>
                <Switch
                  value={filters.hasPhotos === true}
                  onValueChange={(value) => 
                    handleFilterChange({ hasPhotos: value ? true : null })
                  }
                  trackColor={{ false: Colors.gray200, true: Colors.primary }}
                  thumbColor={Colors.card}
                />
              </View>
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.applyButton}
              onPress={() => setShowFilters(false)}
            >
              <Text style={styles.applyButtonText}>{t('common.apply')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray100,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...Typography.body,
    color: Colors.textPrimary,
    padding: 0,
  },
  filterButton: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.gray100,
    position: 'relative',
  },
  filterButtonActive: {
    backgroundColor: Colors.primary + '15',
  },
  filterBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: Colors.primary,
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    ...Typography.caption,
    fontSize: 10,
    color: Colors.card,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
  },
  modalCancel: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  modalClear: {
    ...Typography.body,
    color: Colors.primary,
  },
  modalContent: {
    flex: 1,
    padding: Spacing.lg,
  },
  filterSection: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  filterLabel: {
    ...Typography.body,
    color: Colors.textPrimary,
  },
  sortButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  sortButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.gray100,
  },
  sortButtonActive: {
    backgroundColor: Colors.primary,
  },
  sortButtonText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  sortButtonTextActive: {
    color: Colors.card,
  },
  modalFooter: {
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  applyButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  applyButtonText: {
    ...Typography.bodyMedium,
    color: Colors.card,
    fontWeight: '600',
  },
});