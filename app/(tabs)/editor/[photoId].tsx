// Hooks

import React, { useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  ActivityIndicator,
  View,
  Text,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Hooks
import { useEditorState } from './hooks/useEditorState';
import { useEditorGestures } from './hooks/useEditorGestures';
import { useScrollManager } from './hooks/useScrollManager';

// Components
import { EditorHeader } from './components/EditorHeader';
import { TargetSelector } from './components/TargetSelector';
import { EditorPreview } from './components/EditorPreview';
import { FeatureButton } from './components/FeatureButton';
import { CustomSlider } from './components/CustomSlider';
import { MainToolbar } from './components/MainToolbar';
import { FilterPreview } from './components/FilterPreview';
import { BackgroundButton } from './components/BackgroundButton';

// Config
import { ADJUST_FEATURES, BACKGROUND_FEATURES, CROP_FEATURES, QUICK_FEATURES } from './config/features';
import { ALL_FILTERS } from './config/filters';

// Services
import { ToastService } from '@/components/Toast/ToastService';
import { Colors, Spacing } from '@/constants';

export default function ApplePhotosEditor() {
  const { t } = useTranslation();
  const { photoId } = useLocalSearchParams<{ photoId: string }>();
  const router = useRouter();

  // Scroll manager hook
  const { scrollViewRef } = useScrollManager({
    activeTool,
    activeFeature,
    isSliderActive,
  });

  // Preview boyutu state'i
  const [previewSize, setPreviewSize] = useState({ width: 0, height: 0 });

  // Ana state hook
  const {
    activeTarget,
    activeTool,
    activeFeature,
    isSliderActive,
    showOriginal,
    currentFilter,
    activePhoto,
    backgrounds,
    isLoading,
    isSaving,
    settings,
    setActiveFeature,
    setIsSliderActive,
    setShowOriginal,
    setCurrentFilter,
    handleTargetChange,
    handleToolChange,
    handleFeatureChange,
    getCurrentFeatureValue,
    updateSettings,
    saveChanges,
    resetToDefaults,
  } = useEditorState({ photoId: photoId || '' });

  // Gesture hook
  const {
    combinedGesture,
    combinedImageStyle,
    centerPhoto,
    fitPhotoToScreen,
    fillScreenWithPhoto,
  } = useEditorGestures({
    settings,
    previewSize,
    updateSettings,
  });

  // Event handlers
  const handleSave = async () => {
    try {
      await saveChanges();
      ToastService.show({
        type: 'success',
        text1: t('common.success'),
        text2: 'Değişiklikler kaydedildi.',
      });
      router.back();
    } catch (error: any) {
      ToastService.show({
        type: 'error',
        text1: t('common.error'),
        text2: error.message,
      });
    }
  };

  const handleFeaturePress = (featureKey: string) => {
    setActiveFeature(activeFeature === featureKey ? null : featureKey);
  };

  const handleSliderChange = (value: number) => {
    if (activeFeature) {
      handleFeatureChange(activeFeature, value);
    }
  };

  const handleFilterPress = (filter: any) => {
    console.log('🎨 Filter Selected:', filter.key, filter.settings);
    
    setCurrentFilter(filter.key);
    
    if (filter.key === 'original') {
      // Orijinal: Sadece product ayarlarını sıfırla
      const resetSettings = {
        product_brightness: 0,
        product_contrast: 0,
        product_saturation: 0,
        product_warmth: 0,
        product_exposure: 0,
        product_vibrance: 0,
        product_clarity: 0,
      };
      updateSettings(resetSettings);
    } else if (filter.settings && Object.keys(filter.settings).length > 0) {
      // Filtre ayarlarını product_ prefix'i ile uygula
      const productSettings: Record<string, number> = {};
      Object.entries(filter.settings).forEach(([key, value]) => {
        productSettings[`product_${key}`] = value as number;
      });
      
      console.log('🔧 Applying filter settings:', productSettings);
      updateSettings(productSettings);
    }
  };

  // Loading state
  if (isLoading || !activePhoto) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Fotoğraf yükleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Ana features - tool ve target'a göre
  const getActiveFeatures = () => {
    switch (activeTool) {
      case 'adjust':
        // Target'a göre farklı features
        switch (activeTarget) {
          case 'background':
            return BACKGROUND_FEATURES; // Vinyet dahil
          case 'product':
            return ADJUST_FEATURES; // Vinyet hariç
          case 'all':
            return ADJUST_FEATURES; // Ortak olanlar
          default:
            return ADJUST_FEATURES;
        }
      case 'crop':
        return CROP_FEATURES;
      default:
        return QUICK_FEATURES;
    }
  };

  const selectedBackground = backgrounds.find(bg => bg.id === settings.backgroundId);
  const activeFeatures = getActiveFeatures();
  const currentFeature = activeFeatures.find(f => f.key === activeFeature);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <EditorHeader
          onCancel={() => router.back()}
          onSave={handleSave}
          isSaving={isSaving}
        />

        {/* Target Selector - teknik spesifikasyona uygun */}
        <TargetSelector
          activeTarget={activeTarget}
          onTargetChange={handleTargetChange}
          activeTool={activeTool}
        />

        {/* Canvas/Preview */}
        <EditorPreview
          activePhoto={activePhoto}
          selectedBackground={selectedBackground}
          settings={settings}
          combinedGesture={combinedGesture}
          combinedImageStyle={combinedImageStyle}
          showOriginal={showOriginal}
          onShowOriginalChange={setShowOriginal}
          onLayout={(e) => setPreviewSize(e.nativeEvent.layout)}
          activeTarget={activeTarget}
        />

        {/* Custom Slider */}
        {currentFeature && (
          <CustomSlider
            feature={currentFeature}
            value={getCurrentFeatureValue(activeFeature || '')}
            onValueChange={handleSliderChange}
            onSlidingStart={() => setIsSliderActive(true)}
            onSlidingComplete={() => setIsSliderActive(false)}
            isActive={!!activeFeature}
          />
        )}

        {/* SubToolbar Container - dinamik içerik */}
        {!isSliderActive && (
          <View style={styles.subToolbarContainer}>
            <ScrollView
              ref={scrollViewRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {activeTool === 'background' && renderBackgrounds()}
              {activeTool === 'filter' && renderFilters()}
              {(activeTool === 'adjust' || activeTool === 'crop') && renderFeatures()}
            </ScrollView>
          </View>
        )}

        {/* Main Toolbar */}
        <MainToolbar
          activeTool={activeTool}
          onToolChange={handleToolChange}
        />
      </SafeAreaView>
    </GestureHandlerRootView>
  );

  // Render functions
  function renderFeatures() {
    return activeFeatures.map((feature) => (
      <FeatureButton
        key={feature.key}
        icon={feature.icon}
        label={feature.label}
        value={getCurrentFeatureValue(feature.key)}
        isActive={activeFeature === feature.key}
        onPress={() => handleFeaturePress(feature.key)}
      />
    ));
  }

  function renderFilters() {
    return ALL_FILTERS.map((filter) => (
      <FilterPreview
        key={filter.key}
        filter={filter}
        imageUri={activePhoto?.processedImageUrl || ''}
        backgroundUri={selectedBackground?.fullUrl || ''}
        isSelected={currentFilter === filter.key}
        onPress={() => handleFilterPress(filter)}
      />
    ));
  }

  function renderBackgrounds() {
    return backgrounds.map((bg) => (
      <BackgroundButton
        key={bg.id}
        background={bg}
        isSelected={settings.backgroundId === bg.id}
        onPress={() => updateSettings({ backgroundId: bg.id })}
      />
    ));
  }
}

// Geçici bileşenler kaldırıldı - artık gerçek komponentler kullanıyoruz

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Spacing.md,
    color: Colors.textSecondary,
  },
  subToolbarContainer: {
    maxHeight: 100,
    backgroundColor: Colors.card,
    paddingVertical: Spacing.sm,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.lg,
  },
});