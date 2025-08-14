// app/(tabs)/editor/[photoId].tsx - Loading states kontrol edildi ve düzeltildi

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

import { ToolType, TargetType, MAIN_TOOLS, TARGET_SELECTOR } from '@/features/editor/config/tools';
import { ADJUST_FEATURES, BACKGROUND_FEATURES } from '@/features/editor/config/features';
import { ALL_FILTERS } from '@/features/editor/config/filters';
import { Colors, Spacing, Typography } from '@/constants';
import { ExportPreset } from '@/features/editor/config/exportTools';
import { ToastService } from '@/components/Toast/ToastService';
import { imageProcessor } from '@/services/imageProcessor';

import { DialogService } from '@/components/Dialog/DialogService';
import { InputDialogService } from '@/components/Dialog/InputDialogService';
import { BottomSheetService } from '@/components/BottomSheet/BottomSheetService';
// 👇 ÖNEMLİ: LoadingService'i import edin
import { LoadingService } from '@/components/Loading/LoadingService';


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
    // ✅ KONTROL: isSaving zaten editor store'dan geliyor, bu doğru
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

  // 👇 ÖNEMLİ: AppLoading'in bu ekran için gizlenip gizlenmediğini takip eden ref
  const appLoadingHiddenForThisLoad = useRef(false);

  // 👇 ÖNEMLİ: Editörün görsel olarak "tamamen hazır" olduğu durumu belirleyen bir `useMemo`
  const isEditorTrulyReady = useMemo(() => {
    // activePhoto yüklenmiş OLMALI
    // previewSize, EditorPreview'ın layoutunu almış OLMALI (genişlik ve yükseklik 0'dan büyük)
    // Kaydetme veya thumbnail güncelleme gibi işlemler aktif OLMAMALI
    return activePhoto && previewSize.width > 0 && previewSize.height > 0 && !isSaving && !isUpdatingThumbnail;
  }, [activePhoto, previewSize, isSaving, isUpdatingThumbnail]);

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

  // ===== PHOTO LOADING EFFECT (ve AppLoading gizleme) =====
  useEffect(() => {
    console.log('✨ Editor mounted');
    // Bu flag'i resetliyoruz, çünkü bu useEffect genellikle yeni bir fotoğraf/productId için çalışır.
    appLoadingHiddenForThisLoad.current = false;

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
      // Komponent unmount olduğunda AppLoading'i gizliyoruz,
      // her ihtimale karşı açık kalmasın diye.
      LoadingService.hide();
    };
  }, [photoId, productId, getProductById, setActivePhoto, clearStore, router]);

  // 👇 ÖNEMLİ: Editör gerçekten hazır olduğunda AppLoading'i gizle
  useEffect(() => {
    if (isEditorTrulyReady && !appLoadingHiddenForThisLoad.current) {
      console.log('✅ Editör gerçekten hazır, AppLoading gizleniyor.');
      LoadingService.hide();
      appLoadingHiddenForThisLoad.current = true; // Bu yükleme için gizlendi olarak işaretle
    }
  }, [isEditorTrulyReady]); // isEditorTrulyReady değiştiğinde tetiklenir


  // ===== ARKA PLAN URI ÇÖZÜMLEMESİ =====
  const selectedBackgroundConfig = useMemo(() => {
    console.log('🎨 Current background ID:', settings.backgroundId);
    const config = getBackgroundById(settings.backgroundId);
    console.log('🎨 Found background config:', config ? config.name : 'NOT FOUND');
    return config;
  }, [settings.backgroundId]);

  const [resolvedBackgroundUri, setResolvedBackgroundUri] = useState<string | undefined>(undefined);

  useEffect(() => {
    let isMounted = true;

    const resolveBackgroundUri = async () => {
      if (!selectedBackgroundConfig) {
        console.log('🎨 No background config, clearing URI');
        if (isMounted) {
          setResolvedBackgroundUri(undefined);
        }
        return;
      }

      console.log('🎨 Starting background URI resolution for:', selectedBackgroundConfig.id);

      try {
        if (typeof selectedBackgroundConfig.thumbnailUrl === 'string') {
          console.log('🎨 Using direct string thumbnail URL');
          if (isMounted) {
            setResolvedBackgroundUri(selectedBackgroundConfig.thumbnailUrl);
          }
          return;
        }

        console.log('🎨 Resolving asset-based thumbnail');

        const resolvePromise = backgroundThumbnailManager.getThumbnail(
          selectedBackgroundConfig.id,
          selectedBackgroundConfig.fullUrl
        );

        const timeoutPromise = new Promise<string | null>((_, reject) => {
          setTimeout(() => reject(new Error('Resolution timeout')), 2000);
        });

        const resolvedUri = await Promise.race([resolvePromise, timeoutPromise]);

        if (isMounted) {
          if (resolvedUri) {
            console.log('✅ Background URI resolved:', selectedBackgroundConfig.id);
            setResolvedBackgroundUri(resolvedUri);
          } else {
            console.warn('⚠️ Background URI resolution returned null, using fallback');
            try {
              const Asset = require('expo-asset').Asset;
              const asset = Asset.fromModule(selectedBackgroundConfig.thumbnailUrl);
              await asset.downloadAsync();
              const fallbackUri = asset.localUri || asset.uri;

              if (fallbackUri && isMounted) {
                console.log('✅ Using fallback asset URI:', selectedBackgroundConfig.id);
                setResolvedBackgroundUri(fallbackUri);
              } else {
                setResolvedBackgroundUri(undefined);
              }
            } catch (fallbackError) {
              console.warn('⚠️ Fallback asset resolution failed:', fallbackError);
              if (isMounted) {
                setResolvedBackgroundUri(undefined);
              }
            }
          }
        }

      } catch (error) {
        console.error('❌ Background URI resolution failed:', selectedBackgroundConfig.id, error);
        if (isMounted) {
          setResolvedBackgroundUri(undefined);
        }
      }
    };

    resolveBackgroundUri();

    return () => {
      isMounted = false;
    };
  }, [selectedBackgroundConfig]);

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

  const handlePreviewLayout = useCallback((event: any) => { // Callback olarak sarıldı
    const { width, height } = event.nativeEvent.layout;

    const isValidLayout = width > 200 && height > 200;
    const isSizeChanged = Math.abs(width - previewSize.width) > 5 || Math.abs(height - previewSize.height) > 5;

    if (isValidLayout && isSizeChanged) {
      console.log('📐 Preview layout updated:', {
        width,
        height,
        previous: previewSize,
        activeTool
      });
      setPreviewSize({ width, height });
    } else {
      console.log('📐 Layout event filtered:', {
        width,
        height,
        isValidLayout,
        isSizeChanged,
        activeTool,
        reason: !isValidLayout ? 'Invalid size' : 'Size not changed significantly'
      });
    }
  }, [previewSize, activeTool]); // Dependency array'e previewSize ve activeTool eklendi


  const handleApplyCrop = () => {
    applyCrop();
    setTimeout(() => handleToolChange('adjust'), 300);
  };

  const handleSave = async (withThumbnailUpdate: boolean = false) => {
    console.log('💾 Save triggered with thumbnail update:', withThumbnailUpdate);

    try {
      if (withThumbnailUpdate && skiaViewRef.current) {
        console.log('🖼️ Saving with thumbnail update');
        await store.saveChanges(skiaViewRef);
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
    DialogService.show({
      title: t('editor.editorHeaderResetTitle'),
      message: t('editor.editorHeaderResetMessage'),
      buttons: [
        {
          text: t('common.cancel'),
          style: 'cancel'
        },
        {
          text: t('editor.reset'),
          style: 'destructive',
          onPress: resetAllSettings
        }
      ]
    });
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

      console.log('🔙 Cancel: always navigating back to product page');

      // ✅ HER ZAMAN productId sayfasına geri dön
      if (productId) {
        router.push({
          pathname: '/(tabs)/product/[productId]',
          params: { productId }
        });
      } else {
        // Fallback: productId yoksa home'a git
        router.push('/(tabs)/home');
      }
    }
  };

  useEffect(() => {
    console.log('🎨 Background state update:', {
      selectedBackgroundId: settings.backgroundId,
      hasConfig: !!selectedBackgroundConfig,
      configName: selectedBackgroundConfig?.name,
      resolvedUri: resolvedBackgroundUri ? 'RESOLVED' : 'NOT_RESOLVED',
      activeTool
    });
  }, [settings.backgroundId, selectedBackgroundConfig, resolvedBackgroundUri, activeTool]);

  // ===== BACKGROUND HANDLER =====
  const handleBackgroundSelect = async (background: Background) => {
    console.log('🖼️ Background selection started:', background.name, background.id);

    try {
      // ✅ updateSettings async olabilir artık
      await updateSettings({ backgroundId: background.id });
      addSnapshotToHistory();
      console.log('✅ Background selection completed:', background.name);
    } catch (error) {
      console.error('❌ Background selection failed:', error);
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

  // Validate image URI before passing it to EditorPreview
  const imageUriForPreview = useMemo(() => {
    const uri = activePhoto?.processedImageUrl || activePhoto?.thumbnailUrl;
    return uri && uri.length > 0 ? uri : undefined; // Convert "" to undefined
  }, [activePhoto?.processedImageUrl, activePhoto?.thumbnailUrl]);

  // Validate background URI before passing it to EditorPreview
  const backgroundUriForPreview = useMemo(() => {
    return resolvedBackgroundUri && resolvedBackgroundUri.length > 0 ? resolvedBackgroundUri : undefined; // Convert "" to undefined
  }, [resolvedBackgroundUri]);

  const featuresForCurrentTarget = activeTarget === 'background' ? BACKGROUND_FEATURES : ADJUST_FEATURES;
  const currentFeatureConfig = featuresForCurrentTarget.find(f => f.key === activeFeature);
  const currentSliderValue = getSliderValue(activeFeature);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        <EditorHeader
          onCancel={handleCancel}
          onSave={handleSave}
          // ✅ KONTROL: isSaving editor store'dan geliyor, bu doğru
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
            activePhoto={{ ...activePhoto, processedImageUrl: imageUriForPreview }} // Pass validated URI
            selectedBackground={selectedBackgroundConfig}
            backgroundDisplayUri={backgroundUriForPreview} // Pass validated URI
            settings={settings}
            showOriginal={showOriginal}
            onShowOriginalChange={setShowOriginal}
            onLayout={handlePreviewLayout} // handlePreviewLayout useCallback ile sarılı
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
                              icon={f.icon}
                              label={t(`editor.featureLabels.${f.key}`)} // Lokalize edildi
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
                              imageUri={imageUriForPreview!} // Use validated URI
                              backgroundUri={backgroundUriForPreview} // Use validated URI
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
});