// app/(tabs)/editor/[photoId].tsx - Güncellenmiş Ana Editör

import React, { useState } from 'react';
import { SafeAreaView, StyleSheet, ActivityIndicator, View, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useEditorState } from './hooks/useEditorState';
import { useScrollManager } from './hooks/useScrollManager';
import { EditorHeader } from './components/EditorHeader';
import { TargetSelector } from './components/TargetSelector';
import { EditorPreview } from './components/EditorPreview';
import { FeatureButton } from './components/FeatureButton';
import { CustomSlider } from './components/CustomSlider';
import { MainToolbar } from './components/MainToolbar';
import { FilterPreview } from './components/FilterPreview';
import { BackgroundButton } from './components/BackgroundButton';
import { ADJUST_FEATURES, BACKGROUND_FEATURES } from './config/features';
import { ALL_FILTERS } from './config/filters';
import { ToastService } from '@/components/Toast/ToastService';
import { Colors, Spacing } from '@/constants';

export default function ApplePhotosEditor() {
  const { t } = useTranslation();
  const { photoId } = useLocalSearchParams<{ photoId: string }>();
  const router = useRouter();

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
    handleFeaturePress,
    handleFilterPress, // YENİ EKLENEN
    getCurrentFeatureValue,
    hasMultipleValues,
    getFeatureValues,
    getFeatureButtonStatus,
    updateSettings,
    saveChanges,
  } = useEditorState({ photoId: photoId || '' });

  const [previewSize, setPreviewSize] = useState({ width: 0, height: 0 });

  // Güncellenmiş scroll manager
  const { 
    backgroundScrollRef, 
    filterScrollRef,
    adjustProductScrollRef,
    adjustBackgroundScrollRef,
    adjustAllScrollRef,
  } = useScrollManager({ 
    activeTool, 
    activeTarget,
    activeFeature, 
    isSliderActive 
  });

  const handleSave = async () => {
    try {
      await saveChanges();
      ToastService.show({ type: 'success', text1: t('common.success'), text2: 'Değişiklikler kaydedildi.' });
      router.back();
    } catch (error: any) {
      ToastService.show({ type: 'error', text1: t('common.error'), text2: error.message });
    }
  };

  const handleFeaturePressLocal = (featureKey: string) => {
    handleFeaturePress(featureKey);
  };
  
  const handleSliderChange = (value: number) => {
    if (activeFeature) handleFeatureChange(activeFeature, value);
  };

  if (isLoading || !activePhoto) {
    return <SafeAreaView style={styles.loadingContainer}><ActivityIndicator size="large" color={Colors.primary} /></SafeAreaView>;
  }

  const getActiveFeatures = () => {
    if (activeTool === 'adjust') return activeTarget === 'background' ? BACKGROUND_FEATURES : ADJUST_FEATURES;
    return [];
  };

  // Target'a göre doğru scroll ref'ini seç
  const getAdjustScrollRef = () => {
    switch (activeTarget) {
      case 'product':
        return adjustProductScrollRef;
      case 'background':
        return adjustBackgroundScrollRef;
      case 'all':
        return adjustAllScrollRef;
      default:
        return adjustProductScrollRef;
    }
  };

  const selectedBackground = backgrounds.find(bg => bg.id === settings.backgroundId);
  const activeFeatures = getActiveFeatures();
  const currentFeature = activeFeatures.find(f => f.key === activeFeature);

  // Mevcut feature için karışık durum bilgilerini al
  const currentFeatureStatus = activeFeature ? getFeatureButtonStatus(activeFeature) : null;
  const currentFeatureValues = activeFeature ? getFeatureValues(activeFeature) : null;
  const isCurrentFeatureMixed = activeFeature ? hasMultipleValues(activeFeature) : false;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        <EditorHeader onCancel={() => router.back()} onSave={handleSave} isSaving={isSaving} />
        
        {/* Target selector'ı filter için de göster */}
        <TargetSelector 
          activeTarget={activeTarget} 
          onTargetChange={handleTargetChange} 
          activeTool={activeTool} 
        />
        
        <EditorPreview
          activePhoto={activePhoto}
          selectedBackground={selectedBackground}
          settings={settings}
          showOriginal={showOriginal}
          onShowOriginalChange={setShowOriginal}
          onLayout={(e) => setPreviewSize(e.nativeEvent.layout)}
          updateSettings={updateSettings}
          previewSize={previewSize}
        />

        {currentFeature && (
          <CustomSlider
            feature={currentFeature}
            value={getCurrentFeatureValue(activeFeature || '')}
            onValueChange={handleSliderChange}
            onSlidingStart={() => setIsSliderActive(true)}
            onSlidingComplete={() => setIsSliderActive(false)}
            isActive={!!activeFeature}
            hasMixedValues={isCurrentFeatureMixed}
            productValue={currentFeatureValues?.productValue}
            backgroundValue={currentFeatureValues?.backgroundValue}
          />
        )}
        
        {!isSliderActive && (
          <View style={styles.subToolbarContainer}>
            {/* Background Tool */}
            {activeTool === 'background' && (
              <ScrollView 
                ref={backgroundScrollRef} 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                contentContainerStyle={styles.scrollContent}
              >
                {backgrounds.map(bg => 
                  <BackgroundButton 
                    key={bg.id} 
                    background={bg} 
                    isSelected={settings.backgroundId === bg.id} 
                    onPress={() => updateSettings({ backgroundId: bg.id })} 
                  />
                )}
              </ScrollView>
            )}
            
            {/* Filter Tool - YENİ GÜNCELLEME */}
            {activeTool === 'filter' && (
              <ScrollView 
                ref={filterScrollRef} 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                contentContainerStyle={styles.scrollContent}
              >
                {ALL_FILTERS.map(filter => 
                  <FilterPreview 
                    key={filter.key} 
                    filter={filter} 
                    imageUri={activePhoto?.processedImageUrl || ''} 
                    backgroundUri={selectedBackground?.fullUrl || ''} 
                    isSelected={currentFilter === filter.key} 
                    onPress={() => handleFilterPress(filter)} 
                  />
                )}
              </ScrollView>
            )}
            
            {/* Adjust Tool - Target bazlı ScrollView */}
            {activeTool === 'adjust' && (
              <ScrollView 
                ref={getAdjustScrollRef()} 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                contentContainerStyle={styles.scrollContent}
              >
                {activeFeatures.map(feature => {
                  const featureStatus = getFeatureButtonStatus(feature.key);
                  return (
                    <FeatureButton 
                      key={feature.key} 
                      icon={feature.icon} 
                      label={feature.label} 
                      value={getCurrentFeatureValue(feature.key)}
                      isActive={activeFeature === feature.key} 
                      onPress={() => handleFeaturePressLocal(feature.key)}
                      hasMixedValues={featureStatus.hasMixedValues}
                      productValue={featureStatus.productValue}
                      backgroundValue={featureStatus.backgroundValue}
                    />
                  );
                })}
              </ScrollView>
            )}
          </View>
        )}
        
        <MainToolbar activeTool={activeTool} onToolChange={handleToolChange} />
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  subToolbarContainer: { maxHeight: 100, backgroundColor: Colors.card, paddingVertical: Spacing.sm },
  scrollContent: { paddingHorizontal: Spacing.lg, gap: Spacing.lg },
});