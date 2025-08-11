// app/(tabs)/editor/[photoId].tsx - YENİ ARKA PLAN SEÇİCİ İLE GÜNCEL VE TEMİZLENMİŞ
// Background Image URI 'Double to String' hatası düzeltildi ve Export Snapshot sorunu giderildi.

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
// YENİ: KATEGORİLİ BACKGROUND TOOLBAR YERİNE YENİ PİCKER
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
  const [isDraftManagerVisible, setIsDraftManagerVisible] = useState(false);


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

  // ===== ARKA PLAN URI ÇÖZÜMLEMESİ (Double to String hatası için) =====
  const selectedBackgroundConfig = useMemo(() => {
    console.log('🎨 Current background ID:', settings.backgroundId);
    const config = getBackgroundById(settings.backgroundId);
    console.log('🎨 Found background config:', config ? config.name : 'NOT FOUND');
    return config;
  }, [settings.backgroundId]);


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


  const [resolvedBackgroundUri, setResolvedBackgroundUri] = useState<string | undefined>(undefined);

  useEffect(() => {
    let isMounted = true;
    if (selectedBackgroundConfig) {
      backgroundThumbnailManager.getThumbnail(selectedBackgroundConfig.id, selectedBackgroundConfig.fullUrl)
        .then(uri => {
          if (isMounted) {
            setResolvedBackgroundUri(uri || undefined);
            console.log(`🖼️ Resolved background URI for ${selectedBackgroundConfig.id}:`, uri);
          }
        })
        .catch(error => {
          console.error(`Error resolving background URI for ${selectedBackgroundConfig.id}:`, error);
          if (isMounted) {
            setResolvedBackgroundUri(undefined);
          }
        });
    } else {
      setResolvedBackgroundUri(undefined);
    }
    return () => { isMounted = false; };
  }, [selectedBackgroundConfig]);


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
    store.clearDraft();
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

  useEffect(() => {
    console.log('🎨 Background state update:', {
      selectedBackgroundId: settings.backgroundId,
      hasConfig: !!selectedBackgroundConfig,
      configName: selectedBackgroundConfig?.name,
      resolvedUri: resolvedBackgroundUri ? 'RESOLVED' : 'NOT_RESOLVED',
      activeTool
    });
  }, [settings.backgroundId, selectedBackgroundConfig, resolvedBackgroundUri, activeTool]);

  // ===== YENİ: BACKGROUND HANDLER =====
  const handleBackgroundSelect = (background: Background) => {
    if (__DEV__) {
      console.log('🖼️ Background selection started:', background.name, background.id);
    }
    try {
      updateSettings({ backgroundId: background.id });
      addSnapshotToHistory();
      if (__DEV__) {
        console.log('✅ Background selection completed:', background.name);
      }
    } catch (error) {
      console.error('❌ Background selection failed:', error);
    }
  };

  // ===== DİNAMİK STİL HESAPLAMALARI (Export ekranı için) =====
  const previewContainerStyle = useMemo(() => {
    const baseStyle = {
      flex: 1,
      width: '100%',
      position: 'relative' as const,
      minHeight: 300,
    };

    if (activeTool === 'export') {
      return {
        ...baseStyle,
        position: 'absolute' as const,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        opacity: 0,
        zIndex: -1,
        pointerEvents: 'none' as const,
      };
    }

    return baseStyle;
  }, [activeTool]);

  const bottomToolbarStyle = useMemo(() => {
    const baseStyle = {
      backgroundColor: Colors.card,
      borderTopWidth: 1,
      borderTopColor: Colors.border,
      // ÖNEMLİ: Bu container'ı bir flex column yapısı olarak tanımla
      flexDirection: 'column' as const,
      justifyContent: 'flex-end' as const, // İçeriği alta yasla
      // minHeight: 120, // minHeight'ı buradan kaldır, flex yönetecek
    };

    if (activeTool === 'export') {
      return {
        ...baseStyle,
        flex: 1, // Export aracı tam alanı kaplasın
        justifyContent: 'flex-start' as const, // Export araç çubuğu en üstten başlasın
      };
    }
    return baseStyle; // Varsayılan durum
  }, [activeTool]);


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
          totalDraftsCount={availableDrafts.length}
          onShowDraftManager={() => setIsDraftManagerVisible(true)}
        />

        <View style={styles.contentWrapper}>
          <View style={previewContainerStyle} ref={skiaViewRef} collapsable={false}>
            <EditorPreview
              ref={previewRef}
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
          </View>

          <View style={bottomToolbarStyle}> {/* bottomToolbarStyle burada flex column olarak ayarlandı */}
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
              <View style={styles.exportToolbarWrapper}>
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

                <View style={styles.dynamicToolContainer}> {/* dynamicToolContainer burada */}
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
                              backgroundUri={resolvedBackgroundUri}
                              isSelected={activeFilterKey === f.key}
                              onPress={() => applyFilter(f.key, activeTarget)}
                            />
                          )}
                        </ScrollView>
                      )}

                      {activeTool === 'background' && (
                        <View style={{
                          flex: 1, // Bu View, dynamicToolContainer içindeki alanı kaplayacak
                          padding: 0,
                          justifyContent: 'flex-start',
                          alignItems: 'stretch',
                          // HATA AYIKLAMA: İç View'ın arka planı ve kenarlığı
                          backgroundColor: 'lightgray', // Add light gray background to see this inner container
                          borderWidth: 2, // And a border
                          borderColor: 'orange', // And an orange border
                        }}>
                          <BackgroundPickerToolbar
                            selectedBackgroundId={settings.backgroundId}
                            onBackgroundSelect={handleBackgroundSelect}
                          />
                        </View>
                      )}
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

        {/* Draft Manager Modal */}
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
  previewContainerInvisible: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0,
    zIndex: -1,
    pointerEvents: 'none' as const,
  },
  bottomToolbarContainer: {
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    minHeight: 120,
  },
  bottomToolbarContainerExpanded: {
    flex: 1,
    minHeight: 400,
  },
  exportToolbarWrapper: {
    flex: 1,
  },
  dynamicToolContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'stretch',

    // YENİ GEÇİCİ HATA AYIKLAMA STİLLERİ
    backgroundColor: 'cyan', // dynamicToolContainer'ın arka planını camgöbeği yap
    borderWidth: 5,           // 5 birimlik kenarlık
    borderColor: 'magenta',   // Macenta kenarlık
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.lg,
    paddingVertical: Spacing.md
  },
});