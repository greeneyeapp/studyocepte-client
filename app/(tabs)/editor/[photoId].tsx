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
import { ADJUST_FEATURES, BACKGROUND_FEATURES, CROP_FEATURES } from './config/features';
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
    getCurrentFeatureValue,
    updateSettings,
    saveChanges,
  } = useEditorState({ photoId: photoId || '' });

  const [previewSize, setPreviewSize] = useState({ width: 0, height: 0 });

  const { scrollViewRef } = useScrollManager({ activeTool, activeFeature, isSliderActive });

  const handleSave = async () => {
    try {
      await saveChanges();
      ToastService.show({ type: 'success', text1: t('common.success'), text2: 'Değişiklikler kaydedildi.' });
      router.back();
    } catch (error: any) {
      ToastService.show({ type: 'error', text1: t('common.error'), text2: error.message });
    }
  };

  const handleFeaturePress = (featureKey: string) => {
    setActiveFeature(activeFeature === featureKey ? null : featureKey);
  };
  
  const handleSliderChange = (value: number) => {
    if (activeFeature) handleFeatureChange(activeFeature, value);
  };
  
  const handleFilterPress = (filter: any) => {
    setCurrentFilter(filter.key);
    const newSettings: Record<string, number> = {};
    ADJUST_FEATURES.forEach(f => { newSettings[`product_${f.key}`] = 0; });
    if (filter.key !== 'original') {
      Object.entries(filter.settings).forEach(([key, value]) => { newSettings[`product_${key}`] = value as number; });
    }
    updateSettings(newSettings);
  };

  if (isLoading || !activePhoto) {
    return <SafeAreaView style={styles.loadingContainer}><ActivityIndicator size="large" color={Colors.primary} /></SafeAreaView>;
  }

  const getActiveFeatures = () => {
    if (activeTool === 'adjust') return activeTarget === 'background' ? BACKGROUND_FEATURES : ADJUST_FEATURES;
    return activeTool === 'crop' ? CROP_FEATURES : [];
  };

  const selectedBackground = backgrounds.find(bg => bg.id === settings.backgroundId);
  const activeFeatures = getActiveFeatures();
  const currentFeature = activeFeatures.find(f => f.key === activeFeature);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        <EditorHeader onCancel={() => router.back()} onSave={handleSave} isSaving={isSaving} />
        <TargetSelector activeTarget={activeTarget} onTargetChange={handleTargetChange} activeTool={activeTool} />
        
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
          />
        )}
        
        {!isSliderActive && (
          <View style={styles.subToolbarContainer}>
            <ScrollView ref={scrollViewRef} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
              {activeTool === 'background' && backgrounds.map(bg => <BackgroundButton key={bg.id} background={bg} isSelected={settings.backgroundId === bg.id} onPress={() => updateSettings({ backgroundId: bg.id })} />)}
              {activeTool === 'filter' && ALL_FILTERS.map(filter => <FilterPreview key={filter.key} filter={filter} imageUri={activePhoto?.processedImageUrl || ''} backgroundUri={selectedBackground?.fullUrl || ''} isSelected={currentFilter === filter.key} onPress={() => handleFilterPress(filter)} />)}
              {(activeTool === 'adjust' || activeTool === 'crop') && activeFeatures.map(feature => <FeatureButton key={feature.key} icon={feature.icon} label={feature.label} value={getCurrentFeatureValue(feature.key)} isActive={activeFeature === feature.key} onPress={() => handleFeaturePress(feature.key)} />)}
            </ScrollView>
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