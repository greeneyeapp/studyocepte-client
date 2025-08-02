import React, { useState } from 'react';
import { SafeAreaView, StyleSheet, ActivityIndicator, View, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useEditorState } from './hooks/useEditorState';
import { useScrollManager } from './hooks/useScrollManager';
import { useExportManager } from './hooks/useExportManager';
import { EditorHeader } from './components/EditorHeader';
import { TargetSelector } from './components/TargetSelector';
import { EditorPreview } from './components/EditorPreview';
import { FeatureButton } from './components/FeatureButton';
import { CustomSlider } from './components/CustomSlider';
import { MainToolbar } from './components/MainToolbar';
import { FilterPreview } from './components/FilterPreview';
import { BackgroundButton } from './components/BackgroundButton';
import { ExportToolbar } from './components/ExportToolbar';
import { ADJUST_FEATURES, BACKGROUND_FEATURES } from './config/features';
import { ALL_FILTERS } from './config/filters';
import { ToastService } from '@/components/Toast/ToastService';
import { Colors, Spacing } from '@/constants';
import { ExportPreset } from './config/exportTools';

export default function ApplePhotosEditor() {
  const { t } = useTranslation();
  const { photoId } = useLocalSearchParams<{ photoId: string }>();
  const router = useRouter();

  const {
    activeTarget, activeTool, activeFeature, isSliderActive, showOriginal,
    currentFilter, activePhoto, backgrounds, isLoading, isSaving, settings,
    setActiveFeature, setIsSliderActive, setShowOriginal, handleTargetChange,
    handleToolChange, handleFeatureChange, handleFeaturePress, handleFilterPress,
    getCurrentFeatureValue, hasMultipleValues, getFeatureValues,
    getFeatureButtonStatus, updateSettings, saveChanges,
  } = useEditorState({ photoId: photoId || '' });

  const { previewRef, isExporting, shareWithOption } = useExportManager();
  const [selectedPreset, setSelectedPreset] = useState<ExportPreset | null>(null);
  const [previewSize, setPreviewSize] = useState({ width: 0, height: 0 });

  const { backgroundScrollRef, filterScrollRef, adjustProductScrollRef, adjustBackgroundScrollRef } = useScrollManager({ activeTool, activeTarget, activeFeature, isSliderActive });

  const handleSave = async () => {
    try {
      await saveChanges();
      ToastService.show({ type: 'success', text1: t('common.success'), text2: 'Değişiklikler kaydedildi.' });
      router.back();
    } catch (error: any) {
      ToastService.show({ type: 'error', text1: t('common.error'), text2: error.message });
    }
  };

  const onToolChange = (tool: any) => {
    handleToolChange(tool);
    if (tool !== 'export') setSelectedPreset(null);
  };

  const renderActiveToolbar = () => {
    switch (activeTool) {
      case 'background':
        return (
          <ScrollView ref={backgroundScrollRef} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {backgrounds.map(bg => <BackgroundButton key={bg.id} background={bg} isSelected={settings.backgroundId === bg.id} onPress={() => updateSettings({ backgroundId: bg.id })} />)}
          </ScrollView>
        );
      case 'filter':
        const selectedBg = backgrounds.find(bg => bg.id === settings.backgroundId);
        return (
          <ScrollView ref={filterScrollRef} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {ALL_FILTERS.map(filter => <FilterPreview key={filter.key} filter={filter} imageUri={activePhoto?.processedImageUrl || ''} backgroundUri={selectedBg?.fullUrl || ''} isSelected={currentFilter === filter.key} onPress={() => handleFilterPress(filter)} />)}
          </ScrollView>
        );
      case 'adjust':
        const features = activeTarget === 'background' ? BACKGROUND_FEATURES : ADJUST_FEATURES;
        const scrollRef = activeTarget === 'product' ? adjustProductScrollRef : adjustBackgroundScrollRef;
        return (
          <ScrollView ref={scrollRef} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {features.map(feature => <FeatureButton key={feature.key} icon={feature.icon} label={feature.label} value={getCurrentFeatureValue(feature.key)} isActive={activeFeature === feature.key} onPress={() => handleFeaturePress(feature.key)} hasMixedValues={getFeatureButtonStatus(feature.key).hasMixedValues} productValue={getFeatureButtonStatus(feature.key).productValue} backgroundValue={getFeatureButtonStatus(feature.key).backgroundValue} />)}
          </ScrollView>
        );
      default:
        return null;
    }
  };

  if (isLoading || !activePhoto) {
    return <SafeAreaView style={styles.loadingContainer}><ActivityIndicator size="large" color={Colors.primary} /></SafeAreaView>;
  }

  const currentFeature = (activeTool === 'adjust' ? (activeTarget === 'background' ? BACKGROUND_FEATURES : ADJUST_FEATURES) : []).find(f => f.key === activeFeature);

  const captureAspectRatio = selectedPreset ? selectedPreset.dimensions.width / selectedPreset.dimensions.height : 1;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.hiddenContainer} pointerEvents="none">
        <View
          ref={previewRef}
          collapsable={false}
          style={{ width: 1080, aspectRatio: captureAspectRatio }}
        >
          <EditorPreview
            activePhoto={activePhoto}
            selectedBackground={backgrounds.find(bg => bg.id === settings.backgroundId)}
            settings={settings}
            showOriginal={false}
            onShowOriginalChange={() => {}}
            onLayout={() => {}}
            updateSettings={updateSettings}
            previewSize={{ width: 1080, height: 1080 / captureAspectRatio }}
          />
        </View>
      </View>

      <SafeAreaView style={styles.container}>
        <EditorHeader onCancel={() => router.back()} onSave={handleSave} isSaving={isSaving} />

        {activeTool !== 'export' ? (
          <>
            <TargetSelector activeTarget={activeTarget} onTargetChange={handleTargetChange} activeTool={activeTool} />
            <View style={styles.previewWrapper}>
              <View style={[styles.previewCanvas, { aspectRatio: 1 }]}>
                <EditorPreview
                  activePhoto={activePhoto}
                  selectedBackground={backgrounds.find(bg => bg.id === settings.backgroundId)}
                  settings={settings}
                  showOriginal={showOriginal}
                  onShowOriginalChange={setShowOriginal}
                  onLayout={(e) => setPreviewSize(e.nativeEvent.layout)}
                  updateSettings={updateSettings}
                  previewSize={previewSize}
                />
              </View>
            </View>
          </>
        ) : (
          <View style={styles.exportToolbarWrapper}>
            <ExportToolbar
              activeTool={activeTool}
              selectedPreset={selectedPreset}
              isExporting={isExporting}
              setSelectedPreset={setSelectedPreset}
              shareWithOption={(option) => {
                if (selectedPreset) {
                  shareWithOption(option, selectedPreset);
                }
              }}
            />
          </View>
        )}

        {activeTool === 'adjust' && currentFeature && (
          <CustomSlider
            feature={currentFeature}
            value={getCurrentFeatureValue(activeFeature || '')}
            onValueChange={(value) => handleFeatureChange(activeFeature || '', value)}
            onSlidingStart={() => setIsSliderActive(true)}
            onSlidingComplete={() => setIsSliderActive(false)}
            isActive={!!activeFeature}
            hasMixedValues={hasMultipleValues(activeFeature || '')}
            productValue={getFeatureValues(activeFeature || '').productValue}
            backgroundValue={getFeatureValues(activeFeature || '').backgroundValue}
          />
        )}
        
        {activeTool !== 'export' && !isSliderActive && (
          <View style={styles.toolbarsContainer}>
            {renderActiveToolbar()}
          </View>
        )}
        
        <MainToolbar activeTool={activeTool} onToolChange={onToolChange} />
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  hiddenContainer: {
    position: 'absolute',
    top: -9999,
    left: 0,
    opacity: 0,
  },
  previewWrapper: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.sm, overflow: 'hidden' },
  previewCanvas: { width: '100%', backgroundColor: Colors.background },
  exportToolbarWrapper: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  toolbarsContainer: { 
    backgroundColor: Colors.card, 
    minHeight: 120,
    justifyContent: 'center' 
  },
  scrollContent: { 
    paddingHorizontal: Spacing.lg, 
    alignItems: 'center', 
    gap: Spacing.lg, 
    paddingVertical: Spacing.md
  },
});