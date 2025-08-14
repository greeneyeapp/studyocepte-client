// app/(tabs)/editor/[photoId].tsx - DÜZELTİLDİ

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

import { BACKGROUND_CATEGORIES, getBackgroundById, Background } from '@/features/editor/config/backgrounds';
import { backgroundThumbnailManager } from '@/services/backgroundThumbnailManager';

import { EditorHeader } from '@/features/editor/components/EditorHeader';
import { TargetSelector } from '@/features/editor/components/TargetSelector';
import { EditorPreview } from '@/features/editor/components/EditorPreview';
import { FeatureButton } from '@/features/editor/components/FeatureButton';
import { CustomSlider } from '@/features/editor/components/CustomSlider';
import { MainToolbar } from '@/features/editor/components/MainToolbar';
import { FilterPreview } from '@/features/editor/components/FilterPreview';
import { CropToolbar } from '@/features/editor/components/CropToolbar';
import { ExportToolbar } from '@/features/editor/components/ExportToolbar';
import { BackgroundPickerToolbar } from '@/features/editor/components/BackgroundPickerToolbar';
import { DraftManager } from '@/features/editor/components/DraftManager';

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

  const { availableDrafts } = useDraftRestore({
    maxDraftAge: 7 * 24 * 60 * 60 * 1000
  });

  // ===== STATE =====
  const [activeTool, setActiveTool] = useState<ToolType>('adjust');
  const [activeTarget, setActiveTarget] = useState<TargetType>('product');
  const [activeFeature, setActiveFeature] = useState<string | null>(null);
  const [isSliderActive, setIsSliderActive] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const [previewSize, setPreviewSize] = useState({ width: 0, height: 0 });
  const [selectedPreset, setSelectedPreset] = useState<ExportPreset | null>(null);
  const [isDraftManagerVisible, setIsDraftManagerVisible] = useState(false);

  const { isExporting, shareWithOption, skiaViewRef } = useExportManager();
  const { currentScrollRef } = useScrollManager({ activeTool, activeTarget, activeFeature, isSliderActive });

  // ===== MEMORY OPTIMIZATION =====
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'background') {
        console.log(t('app.memoryOptimizationWarning'));
        imageProcessor.optimizeMemoryUsage();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [t]);

  // ===== PHOTO LOADING EFFECT =====
  useEffect(() => {
    console.log(t('editor.mountedLog'));
    if (photoId && productId) {
      const product = getProductById(productId);
      const photo = product?.photos.find(p => p.id === photoId);
      if (photo) {
        console.log(t('editor.loadingPhotoLog'), photo.id);
        setActivePhoto(photo);
      } else {
        router.back();
      }
    }

    return () => {
      console.log(t('editor.unmountingLog'));
      const state = useEnhancedEditorStore.getState();
      if (state.activePhoto && state.hasDraftChanges) {
        console.log(t('editor.savingDraftOnUnmountLog'));
        state.saveDraft();
      }

      clearStore();
      imageProcessor.optimizeMemoryUsage();
      DialogService.hide();
      InputDialogService.hide();
      ToastService.hide();
      BottomSheetService.hide();
    };
  }, [photoId, productId, getProductById, setActivePhoto, clearStore, router, t]);

  // ===== ARKA PLAN URI ÇÖZÜMLEMESİ =====
  const selectedBackgroundConfig = useMemo(() => {
    console.log(t('editor.currentBackgroundIdLog'), settings.backgroundId);
    const config = getBackgroundById(settings.backgroundId);
    // config.name artık çeviri anahtarı, bu yüzden t() ile çevrilmeli
    console.log(t('editor.foundBackgroundConfigLog'), config ? t(config.name) : t('common.notFound'));
    return config;
  }, [settings.backgroundId, t]);

  const [resolvedBackgroundUri, setResolvedBackgroundUri] = useState<string | undefined>(undefined);

  useEffect(() => {
    let isMounted = true;

    const resolveBackgroundUri = async () => {
      if (!selectedBackgroundConfig) {
        console.log(t('editor.noBackgroundConfigLog'));
        if (isMounted) {
          setResolvedBackgroundUri(undefined);
        }
        return;
      }

      console.log(t('editor.startingBackgroundResolutionLog'), selectedBackgroundConfig.id);

      try {
        if (typeof selectedBackgroundConfig.thumbnailUrl === 'string') {
          console.log(t('editor.directThumbnailUrlLog'));
          if (isMounted) {
            setResolvedBackgroundUri(selectedBackgroundConfig.thumbnailUrl);
          }
          return;
        }

        console.log(t('editor.resolvingAssetThumbnailLog'));

        const resolvePromise = backgroundThumbnailManager.getThumbnail(
          selectedBackgroundConfig.id,
          selectedBackgroundConfig.fullUrl
        );

        const timeoutPromise = new Promise<string | null>((_, reject) => {
          setTimeout(() => reject(new Error(t('editor.resolutionTimeout'))), 2000);
        });

        const resolvedUri = await Promise.race([resolvePromise, timeoutPromise]);

        if (isMounted) {
          if (resolvedUri) {
            console.log(t('editor.backgroundUriResolvedLog'), selectedBackgroundConfig.id);
            setResolvedBackgroundUri(resolvedUri);
          } else {
            console.warn(t('editor.backgroundUriNullFallbackLog'));
            try {
              const Asset = require('expo-asset').Asset;
              const asset = Asset.fromModule(selectedBackgroundConfig.thumbnailUrl);
              await asset.downloadAsync();
              const fallbackUri = asset.localUri || asset.uri;

              if (fallbackUri && isMounted) {
                console.log(t('editor.usingFallbackAssetUriLog'), selectedBackgroundConfig.id);
                setResolvedBackgroundUri(fallbackUri);
              } else {
                setResolvedBackgroundUri(undefined);
              }
            } catch (fallbackError) {
              console.warn(t('editor.fallbackAssetResolutionFailedLog'), fallbackError);
              if (isMounted) {
                setResolvedBackgroundUri(undefined);
              }
            }
          }
        }

      } catch (error) {
        console.error(t('editor.backgroundUriResolutionFailedLog'), selectedBackgroundConfig.id, error);
        if (isMounted) {
          setResolvedBackgroundUri(undefined);
        }
      }
    };

    resolveBackgroundUri();

    return () => {
      isMounted = false;
    };
  }, [selectedBackgroundConfig, t]);

  // ===== HANDLERS =====
  const animateLayout = () => LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

  const handleToolChange = (tool: ToolType) => {
    if ((activeFeature && ['adjust', 'filter', 'background'].includes(activeTool) && activeTool !== tool) || (activeTool === 'crop' && tool !== 'crop')) {
      addSnapshotToHistory();
    }
    animateLayout();
    setActiveFeature(null);
    setActiveTool(tool);
    if (tool !== 'export' && selectedPreset !== null) {
      setSelectedPreset(null);
    }
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

    const isValidLayout = width > 200 && height > 200;
    const isSizeChanged = Math.abs(width - previewSize.width) > 5 || Math.abs(height - previewSize.height) > 5;

    if (isValidLayout && isSizeChanged) {
      console.log(t('editor.previewLayoutUpdatedLog'), {
        width,
        height,
        previous: previewSize,
        activeTool
      });
      setPreviewSize({ width, height });
    } else {
      console.log(t('editor.layoutEventFilteredLog'), {
        width,
        height,
        isValidLayout,
        isSizeChanged,
        activeTool,
        reason: !isValidLayout ? t('common.invalidSize') : t('common.sizeNotChanged')
      });
    }
  };

  const handleApplyCrop = () => {
    applyCrop();
    setTimeout(() => handleToolChange('adjust'), 300);
  };

  const handleSave = async (withThumbnailUpdate: boolean = false) => {
    console.log(t('editor.saveTriggeredLog'), withThumbnailUpdate);

    try {
      if (withThumbnailUpdate && skiaViewRef.current) {
        console.log(t('editor.savingWithThumbnailLog'));
        await store.saveChanges(skiaViewRef);
      } else {
        console.log(t('editor.savingWithoutThumbnailLog'));
        await store.saveChanges();
      }

      console.log(t('editor.saveSuccessfulLog'));

      setTimeout(() => {
        if (productId) {
          console.log(t('editor.navigateToProductLog'), productId);
          router.push({
            pathname: '/(tabs)/product/[productId]',
            params: { productId }
          });
        } else {
          console.log(t('editor.noProductIdBackLog'));
          router.back();
        }
      }, 500);

    } catch (error) {
      console.error(t('editor.saveFailedLog'), error);
    }
  };

  const handleResetAll = () => {
    console.log(t('editor.resetAllSettingsLog'));
    resetAllSettings();
    store.clearDraft();
  };

  const handleCancel = () => {
    if (activeTool === 'crop' || activeTool === 'export' || activeFeature) {
      setActiveFeature(null);
      handleToolChange('adjust');
    } else {
      if (hasDraftChanges) {
        console.log(t('editor.savingDraftBeforeExitLog'));
        saveDraft();
      }

      console.log(t('editor.cancelNavigateBackLog'));

      if (productId) {
        router.push({
          pathname: '/(tabs)/product/[productId]',
          params: { productId }
        });
      } else {
        router.push('/(tabs)/home');
      }
    }
  };

  useEffect(() => {
    console.log(t('editor.backgroundStateUpdateLog'), {
      selectedBackgroundId: settings.backgroundId,
      hasConfig: !!selectedBackgroundConfig,
      // config.name artık çeviri anahtarı, bu yüzden t() ile çevrilmeli
      configName: selectedBackgroundConfig ? t(selectedBackgroundConfig.name) : t('common.notFound'),
      resolvedUri: resolvedBackgroundUri ? t('common.resolved') : t('common.notResolved'),
      activeTool
    });
  }, [settings.backgroundId, selectedBackgroundConfig, resolvedBackgroundUri, activeTool, t]);

  // ===== BACKGROUND HANDLER =====
  const handleBackgroundSelect = (background: Background) => {
    if (__DEV__) {
      console.log(t('editor.backgroundSelectionStartedLog'), background.name, background.id);
    }
    try {
      updateSettings({ backgroundId: background.id });
      addSnapshotToHistory();
      if (__DEV__) {
        console.log(t('editor.backgroundSelectionCompletedLog'), background.name);
      }
    } catch (error) {
      console.error(t('editor.backgroundSelectionFailedLog'), error);
    }
  };

  const previewComponentStyle = useMemo(() => {
    if (activeTool === 'export') {
      return {
        position: 'absolute' as const,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        opacity: 0.01,
        pointerEvents: 'none' as const,
        zIndex: -1000,
        overflow: 'hidden' as const,
      };
    }
    return {
      flex: 1,
      minHeight: 300,
      width: '100%',
      position: 'relative' as const,
    };
  }, [activeTool]);

  const bottomToolbarStyle = useMemo(() => {
    const baseStyle = {
      backgroundColor: Colors.card,
      borderTopWidth: 1,
      borderTopColor: Colors.border,
      flexDirection: 'column' as const,
      minHeight: 80,
    };

    if (activeTool === 'export') {
      return {
        ...baseStyle,
        flex: 1,
        justifyContent: 'flex-start' as const,
      };
    }

    return {
      ...baseStyle,
      height: 280,
      justifyContent: 'flex-end' as const,
    };
  }, [activeTool]);

  // ===== LOADING STATE =====
  if (!activePhoto) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>{t('editor.photoLoading')}</Text>
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
          totalDraftsCount={availableDrafts.length}
          onShowDraftManager={() => setIsDraftManagerVisible(true)}
        />

        <View style={styles.contentWrapper}>
          <EditorPreview
            key={`preview-${activePhoto?.id || 'none'}`}
            ref={skiaViewRef}
            style={previewComponentStyle}
            activePhoto={{ ...activePhoto, processedImageUrl: activePhoto.processedUri }}
            selectedBackground={selectedBackgroundConfig}
            backgroundDisplayUri={resolvedBackgroundUri}
            settings={settings}
            showOriginal={showOriginal}
            onShowOriginalChange={setShowOriginal}
            onLayout={handlePreviewLayout}
            updateSettings={updateSettings}
            previewSize={previewSize}
            isCropping={activeTool === 'crop'}
          />

          <View style={bottomToolbarStyle}>
            {activeTool === 'export' ? (
              <ExportToolbar
                selectedPreset={selectedPreset}
                isExporting={isExporting}
                setSelectedPreset={setSelectedPreset}
                shareWithOption={shareWithOption}
              />
            ) : (
              <View style={styles.upperToolbarContentArea}>
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

                <View style={styles.toolContentArea}>
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
                              label={f.label} // label artık çeviri anahtarı, FeatureButton içinde t() çağrılıyor
                              icon={f.icon}
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
                              backgroundUri={resolvedBackgroundUri}
                              isSelected={activeFilterKey === f.key}
                              onPress={() => applyFilter(f.key, activeTarget)}
                            />
                          )}
                        </ScrollView>
                      )}

                      {activeTool === 'background' && (
                        <View style={styles.backgroundToolArea}>
                          <BackgroundPickerToolbar
                            selectedBackgroundId={settings.backgroundId}
                            onBackgroundSelect={handleBackgroundSelect}
                          />
                        </View>
                      )}
                    </>
                  )}
                </View>
              </View>
            )}

            <MainToolbar
              activeTool={activeTool}
              onToolChange={handleToolChange}
            />
          </View>
        </View>

        {isDraftManagerVisible && (
          <DraftManager
            visible={isDraftManagerVisible}
            onClose={() => setIsDraftManagerVisible(false)}
          />
        )}
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
  upperToolbarContentArea: {
    flex: 1,
    alignItems: 'stretch',
    justifyContent: 'flex-start',
  },
  toolContentArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'stretch',
    paddingVertical: Spacing.sm,
  },
  backgroundToolArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.lg,
    paddingVertical: Spacing.md,
    minHeight: 80,
  },
  loadingText: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    textAlign: 'center'
  },
});