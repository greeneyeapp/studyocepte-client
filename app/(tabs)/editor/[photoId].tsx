// app/(tabs)/editor/[photoId].tsx - YENİ KATEGORİLİ BACKGROUND SİSTEMİ İLE GÜNCELLENMİŞ

import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { SafeAreaView, StyleSheet, ActivityIndicator, View, ScrollView, Text, LayoutAnimation, UIManager, Platform, AppState } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { useEnhancedEditorStore } from '@/stores/useEnhancedEditorStore';
import { useProductStore } from '@/stores/useProductStore';
import { useExportManager } from '@/features/editor/hooks/useExportManager';
import { useScrollManager } from '@/features/editor/hooks/useScrollManager';
import { useEditorAutoSave } from '@/features/editor/hooks/useEditorAutoSave';
import { useDraftRestore } from '@/features/editor/hooks/useDraftRestore';

// YENİ: Background config'den import
import { BACKGROUND_CATEGORIES, getBackgroundById, Background } from '@/features/editor/config/backgrounds';

import { EditorHeader } from '@/features/editor/components/EditorHeader';
import { TargetSelector } from '@/features/editor/components/TargetSelector';
import { EditorPreview } from '@/features/editor/components/EditorPreview';
import { FeatureButton } from '@/features/editor/components/FeatureButton';
import { CustomSlider } from '@/features/editor/components/CustomSlider';
import { MainToolbar } from '@/features/editor/components/MainToolbar';
import { FilterPreview } from '@/features/editor/components/FilterPreview';
import { CropToolbar } from '@/features/editor/components/CropToolbar';
import { ExportToolbar } from '@/features/editor/components/ExportToolbar';
// YENİ: Kategorili background toolbar
import { CategorizedBackgroundToolbar } from '@/features/editor/components/CategorizedBackgroundToolbar';

import { ToolType, TargetType } from '@/features/editor/config/tools';
import { ADJUST_FEATURES, BACKGROUND_FEATURES } from '@/features/editor/config/features';
import { ALL_FILTERS } from '@/features/editor/config/filters';
import { Colors, Spacing, Typography } from '@/constants';
import { ExportPreset } from '@/features/editor/config/exportTools';
import { ToastService } from '@/components/Toast/ToastService';
import { imageProcessor } from '@/services/imageProcessor';

import { DialogService } from '@/components/Dialog/DialogService';
import { InputDialogService } from '@/components/Dialog/InputDialogService';
import { BottomSheetService } from '@/components/BottomSheet/BottomSheetService';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const previewRef = useRef<View>(null);

export default function EnhancedEditorScreen() {
  const { t } = useTranslation();
  const { photoId, productId } = useLocalSearchParams<{ photoId: string, productId: string }>();
  const router = useRouter();

  const store = useEnhancedEditorStore();
  const {
    activePhoto,
    settings,
    isSaving,
    activeFilterKey,
    applyFilter,
    undo,
    redo,
    canUndo,
    canRedo,
    addSnapshotToHistory,
    updateSettings,
    clearStore,
    setActivePhoto,
    setActiveFilterKey,
    resetCropAndRotation,
    isUpdatingThumbnail,
    thumbnailError,
    hasDraftChanges,
    resetAllSettings,
    saveDraft,
    clearDraft,
  } = store;

  const applyCrop = useEnhancedEditorStore((state) => state.applyCrop);
  const getProductById = useProductStore(state => state.getProductById);

  // ===== HOOKS =====
  const autoSaveStatus = useEditorAutoSave({
    intervalMs: 30000,
    onAppBackground: true,
    onBeforeUnload: true,
    debounceMs: 2000
  });

  const draftRestore = useDraftRestore({
    maxDraftAge: 7 * 24 * 60 * 60 * 1000 // 7 gün
  });

  // ===== STATE =====
  const [activeTool, setActiveTool] = useState<ToolType>('adjust');
  const [activeTarget, setActiveTarget] = useState<TargetType>('product');
  const [activeFeature, setActiveFeature] = useState<string | null>(null);
  const [isSliderActive, setIsSliderActive] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const [previewSize, setPreviewSize] = useState({ width: 0, height: 0 });
  const [selectedPreset, setSelectedPreset] = useState<ExportPreset | null>(null);

  const { isExporting, shareWithOption, skiaViewRef } = useExportManager();
  const { currentScrollRef } = useScrollManager({ activeTool, activeTarget, activeFeature, isSliderActive });
  const previewRef = useRef<View>(null);

  // ===== MEMORY OPTIMIZATION =====
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'background') {
        console.log('📱 App backgrounding, optimizing memory...');
        imageProcessor.optimizeMemoryUsage();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, []);

  // ===== PHOTO LOADING EFFECT =====
  useEffect(() => {
    console.log('✨ Editor mounted');
    if (photoId && productId) {
      const product = getProductById(productId);
      const photo = product?.photos.find(p => p.id === photoId);
      if (photo) {
        console.log('📸 Loading photo with auto-save enabled:', photo.id);
        setActivePhoto(photo);
      } else {
        router.back();
      }
    }

    return () => {
      console.log('🔄 Editor unmounting');
      const state = useEnhancedEditorStore.getState();
      if (state.activePhoto && state.hasDraftChanges) {
        console.log('💾 Saving draft on unmount');
        state.saveDraft();
      }

      clearStore();
      imageProcessor.optimizeMemoryUsage();
      DialogService.hide();
      InputDialogService.hide();
      ToastService.hide();
      BottomSheetService.hide();
    };
  }, [photoId, productId, getProductById, setActivePhoto, clearStore, router]);

  // ===== HANDLERS =====
  const animateLayout = () => LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

  const handleToolChange = (tool: ToolType) => {
    animateLayout();
    if (tool !== 'adjust' && activeFeature) addSnapshotToHistory();
    setActiveFeature(null);
    setActiveTool(tool);
  };

  const handleFeaturePress = (featureKey: string) => {
    if (activeFeature && activeFeature !== featureKey) addSnapshotToHistory();
    animateLayout();
    setActiveFeature(prev => (prev === featureKey ? null : featureKey));
  };

  const handleValueChange = useCallback((featureKey: string, value: number) => {
    if (activeFilterKey !== 'custom') setActiveFilterKey('custom');
    const changes: Record<string, any> = {};
    switch (activeTarget) {
      case 'product': changes[`product_${featureKey}`] = value; break;
      case 'background': changes[`background_${featureKey}`] = value; break;
      case 'all': changes[`product_${featureKey}`] = value; changes[`background_${featureKey}`] = value; break;
      default: return;
    }
    updateSettings(changes);
  }, [activeTarget, activeFilterKey, setActiveFilterKey, updateSettings]);

  const getSliderValue = useCallback((key: string | null): number => {
    if (!key) return 0;
    let settingKey: string;
    switch (activeTarget) {
      case 'product': settingKey = `product_${key}`; break;
      case 'background': settingKey = `background_${key}`; break;
      case 'all': default: settingKey = `product_${key}`;
    }
    return (settings as any)[settingKey] ?? 0;
  }, [settings, activeTarget]);

  const handlePreviewLayout = (event: any) => {
    const { width, height } = event.nativeEvent.layout;
    if (width > 0 && height > 0 && (width !== previewSize.width || height !== previewSize.height)) {
      setPreviewSize({ width, height });
    }
  };

  const handleApplyCrop = () => {
    applyCrop();
    setTimeout(() => handleToolChange('adjust'), 300);
  };

  const handleSave = async (withThumbnailUpdate: boolean = false) => {
    console.log('💾 Save triggered with thumbnail update:', withThumbnailUpdate);

    try {
      if (withThumbnailUpdate && previewRef.current) {
        console.log('🖼️ Saving with thumbnail update');
        await store.saveChanges(previewRef);
      } else {
        console.log('💾 Saving without thumbnail update');
        await store.saveChanges();
      }

      console.log('🚀 Save successful, navigating back to product page');

      setTimeout(() => {
        if (productId) {
          console.log('📱 Navigating to product:', productId);
          router.push({
            pathname: '/(tabs)/product/[productId]',
            params: { productId }
          });
        } else {
          console.log('📱 No productId, going back');
          router.back();
        }
      }, 500);

    } catch (error) {
      console.error('❌ Save failed, staying on editor:', error);
    }
  };

  const handleResetAll = () => {
    console.log('🔄 Reset all settings');
    resetAllSettings();
    clearDraft();
  };

  const handleCancel = () => {
    if (activeTool === 'crop' || activeTool === 'export' || activeFeature) {
      setActiveFeature(null);
      handleToolChange('adjust');
    } else {
      if (hasDraftChanges) {
        console.log('📂 Saving draft before exit');
        saveDraft();
      }

      console.log('🔙 Cancel: navigating back to product page');

      if (productId) {
        router.push({
          pathname: '/(tabs)/product/[productId]',
          params: { productId }
        });
      } else {
        router.back();
      }
    }
  };

  // ===== YENİ: BACKGROUND HANDLER =====
  const handleBackgroundSelect = (background: Background) => {
    console.log('🖼️ Background selected:', background.name);
    updateSettings({ backgroundId: background.id });
    addSnapshotToHistory();
  };

  // ===== YENİ: SELECTED BACKGROUND =====
  const selectedBackground = useMemo(() => {
    return getBackgroundById(settings.backgroundId);
  }, [settings.backgroundId]);

  // ===== BACKGROUND SECTION RENDER - YENİ =====
  const renderBackgroundSection = () => {
    if (activeTool !== 'background') return null;

    return (
      <CategorizedBackgroundToolbar
        selectedBackgroundId={settings.backgroundId}
        onBackgroundSelect={handleBackgroundSelect}
      />
    );
  };

  // ===== LOADING STATE =====
  if (!activePhoto) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  const featuresForCurrentTarget = activeTarget === 'background' ? BACKGROUND_FEATURES : ADJUST_FEATURES;
  const currentFeatureConfig = featuresForCurrentTarget.find(f => f.key === activeFeature);
  const currentSliderValue = getSliderValue(activeFeature);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        <EditorHeader
          onCancel={handleCancel}
          onSave={handleSave}
          isSaving={isSaving}
          canUndo={canUndo()}
          canRedo={canRedo()}
          onUndo={undo}
          onRedo={redo}
          onResetAll={handleResetAll}
          isUpdatingThumbnail={isUpdatingThumbnail}
          hasDraftChanges={hasDraftChanges}
        />

        <View style={styles.contentWrapper}>
          <View style={styles.previewContainer} ref={skiaViewRef} collapsable={false}>
            <EditorPreview
              ref={previewRef}
              activePhoto={{ ...activePhoto, processedImageUrl: activePhoto.processedUri }}
              selectedBackground={selectedBackground}
              settings={settings}
              showOriginal={showOriginal}
              onShowOriginalChange={setShowOriginal}
              onLayout={handlePreviewLayout}
              updateSettings={updateSettings}
              previewSize={previewSize}
              isCropping={activeTool === 'crop'}
            />
          </View>

          <View style={styles.bottomToolbarContainer}>
            {activeTool === 'crop' && (
              <CropToolbar
                activeRatio={settings.cropAspectRatio || 'original'}
                onAspectRatioSelect={(ratio) => {
                  updateSettings({ cropAspectRatio: ratio });
                  addSnapshotToHistory();
                }}
                onRotate={() => {
                  updateSettings({ photoRotation: ((settings.photoRotation || 0) + 90) % 360 });
                  addSnapshotToHistory();
                }}
                onReset={resetCropAndRotation}
                onApplyCrop={handleApplyCrop}
              />
            )}

            {activeTool === 'export' && (
              <View style={styles.fullScreenTool}>
                <ExportToolbar
                  selectedPreset={selectedPreset}
                  isExporting={isExporting}
                  setSelectedPreset={setSelectedPreset}
                  shareWithOption={shareWithOption}
                />
              </View>
            )}

            {activeTool !== 'export' && activeTool !== 'crop' && (
              <>
                {(activeTool === 'adjust' || activeTool === 'filter') && !activeFeature && (
                  <TargetSelector
                    activeTarget={activeTarget}
                    onTargetChange={(t) => {
                      animateLayout();
                      setActiveTarget(t);
                    }}
                    activeTool={activeTool}
                  />
                )}

                <View style={styles.dynamicToolContainer}>
                  {activeTool === 'adjust' && currentFeatureConfig ? (
                    <CustomSlider
                      feature={currentFeatureConfig}
                      value={currentSliderValue}
                      onValueChange={(v) => handleValueChange(activeFeature!, v)}
                      onSlidingStart={() => setIsSliderActive(true)}
                      onSlidingComplete={() => {
                        addSnapshotToHistory();
                        setIsSliderActive(false);
                        setActiveFeature(null);
                      }}
                      isActive={!!activeFeature}
                    />
                  ) : (
                    <>
                      {activeTool === 'adjust' && (
                        <ScrollView
                          ref={currentScrollRef}
                          horizontal
                          showsHorizontalScrollIndicator={false}
                          contentContainerStyle={styles.scrollContent}
                        >
                          {featuresForCurrentTarget.map(f =>
                            <FeatureButton
                              key={f.key}
                              icon={f.icon}
                              label={f.label}
                              value={getSliderValue(f.key)}
                              isActive={activeFeature === f.key}
                              onPress={() => handleFeaturePress(f.key)}
                            />
                          )}
                        </ScrollView>
                      )}

                      {activeTool === 'filter' && (
                        <ScrollView
                          ref={currentScrollRef}
                          horizontal
                          showsHorizontalScrollIndicator={false}
                          contentContainerStyle={styles.scrollContent}
                        >
                          {ALL_FILTERS.map(f =>
                            <FilterPreview
                              key={f.key}
                              filter={f}
                              imageUri={activePhoto.processedUri!}
                              backgroundUri={selectedBackground?.fullUrl}
                              isSelected={activeFilterKey === f.key}
                              onPress={() => applyFilter(f.key, activeTarget)}
                            />
                          )}
                        </ScrollView>
                      )}

                      {/* YENİ: Kategorili background section */}
                      {renderBackgroundSection()}
                    </>
                  )}
                </View>
              </>
            )}

            {activeTool !== 'crop' && (
              <MainToolbar
                activeTool={activeTool}
                onToolChange={handleToolChange}
              />
            )}
          </View>
        </View>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  contentWrapper: {
    flex: 1,
    flexDirection: 'column'
  },
  previewContainer: {
    flex: 1,
    width: '100%'
  },
  bottomToolbarContainer: {
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.border
  },
  dynamicToolContainer: {
    minHeight: 120,
    justifyContent: 'center',
    alignItems: 'center'
  },
  fullScreenTool: {
    minHeight: 120
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.lg,
    paddingVertical: Spacing.md
  },
});