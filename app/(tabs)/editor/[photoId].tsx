// app/(tabs)/editor/[photoId].tsx - BACKGROUND SECTION ENTEGRASYONLu VERSİYON
import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { SafeAreaView, StyleSheet, ActivityIndicator, View, ScrollView, Text, LayoutAnimation, UIManager, Platform, AppState, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Feather } from '@expo/vector-icons';

import { useEnhancedEditorStore } from '@/stores/useEnhancedEditorStore';
import { useProductStore } from '@/stores/useProductStore';
import { useExportManager } from '@/features/editor/hooks/useExportManager';
import { useScrollManager } from '@/features/editor/hooks/useScrollManager';
import { useEditorAutoSave } from '@/features/editor/hooks/useEditorAutoSave';
import { useDraftRestore } from '@/features/editor/hooks/useDraftRestore';
import { useBackgroundPreloader } from '@/features/editor/hooks/useBackgroundPreloader';

import { EditorHeader } from '@/features/editor/components/EditorHeader';
import { TargetSelector } from '@/features/editor/components/TargetSelector';
import { EditorPreview } from '@/features/editor/components/EditorPreview'; 
import { FeatureButton } from '@/features/editor/components/FeatureButton';
import { CustomSlider } from '@/features/editor/components/CustomSlider';
import { MainToolbar } from '@/features/editor/components/MainToolbar';
import { FilterPreview } from '@/features/editor/components/FilterPreview';
import { BackgroundButton } from '@/features/editor/components/BackgroundButton';
import { CropToolbar } from '@/features/editor/components/CropToolbar';
import { ExportToolbar } from '@/features/editor/components/ExportToolbar';
import { DraftManager } from '@/features/editor/components/DraftManager';

import { ToolType, TargetType } from '@/features/editor/config/tools';
import { ADJUST_FEATURES, BACKGROUND_FEATURES } from '@/features/editor/config/features';
import { ALL_FILTERS } from '@/features/editor/config/filters';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants';
import { ExportPreset } from '@/features/editor/config/exportTools';
import { ToastService } from '@/components/Toast/ToastService';
import { imageProcessor } from '@/services/imageProcessor';
import { backgroundThumbnailManager }  from '@/services/backgroundThumbnailManager'; 

// Yeni eklenen importlar:
import { DialogService } from '@/components/Dialog/DialogService';
import { InputDialogService } from '@/components/Dialog/InputDialogService';
import { BottomSheetService } from '@/components/BottomSheet/BottomSheetService';


if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Background tipini ve verisini yerel olarak tanımlıyoruz
interface Background { id: string; name: string; thumbnailUrl: string; fullUrl: string; }
const staticBackgrounds: Background[] = [
    {id: "bg1", name: "Studio White", thumbnailUrl: "https://images.pexels.com/photos/1762851/pexels-photo-1762851.jpeg?auto=compress&cs=tinysrgb&w=200", fullUrl: "https://images.pexels.com/photos/1762851/pexels-photo-1762851.jpeg?auto=compress&cs=tinysrgb&w=800"},
    {id: "bg2", name: "Concrete", thumbnailUrl: "https://images.pexels.com/photos/1191710/pexels-photo-1191710.jpeg?auto=compress&cs=tinysrgb&w=200", fullUrl: "https://images.pexels.com/photos/1191710/pexels-photo-1191710.jpeg?auto=compress&cs=tinysrgb&w=800"},
    {id: "bg3", name: "Warm Light", thumbnailUrl: "https://images.pexels.com/photos/2306281/pexels-photo-2306281.jpeg?auto=compress&cs=tinysrgb&w=200", fullUrl: "https://images.pexels.com/photos/2306281/pexels-photo-2306281.jpeg?auto=compress&cs=tinysrgb&w=800"},
    {id: "bg4", name: "Wooden Floor", thumbnailUrl: "https://images.pexels.com/photos/276583/pexels-photo-276583.jpeg?auto=compress&cs=tinysrgb&w=200", fullUrl: "https://images.pexels.com/photos/276583/pexels-photo-276583.jpeg?auto=compress&cs=tinysrgb&w=800"},
];

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
      // Draft system states
      isUpdatingThumbnail,
      thumbnailError,
      hasDraftChanges,
      resetAllSettings,
      saveDraft,
      clearDraft,
      autoSaveEnabled,
      performAutoSave
    } = store;
    
    const applyCrop = useEnhancedEditorStore((state) => state.applyCrop);
    const getProductById = useProductStore(state => state.getProductById);

    // ===== DRAFT SYSTEM HOOKS (Calls moved to top level) =====
    const autoSaveStatus = useEditorAutoSave({
      intervalMs: 30000,
      onAppBackground: true,
      onBeforeUnload: true,
      debounceMs: 2000
    });
    
    const draftRestore = useDraftRestore({
      autoRestore: true, 
      showNotification: false, // DEĞİŞİKLİK: Burası false yapıldı (Toast'u kaldırmak için)
      maxDraftAge: 7 * 24 * 60 * 60 * 1000
    });

    // ===== YENİ: BACKGROUND PRELOADER HOOK (Call moved to top level) =====
    const backgroundPreloader = useBackgroundPreloader(staticBackgrounds, {
      enabled: true,
      priority: 'low',
      maxConcurrent: 2,
      delayMs: 2000 // Editor yüklendikten 2 saniye sonra başla
    });

    // ===== STATE =====
    
    const [activeTool, setActiveTool] = useState<ToolType>('adjust');
    const [activeTarget, setActiveTarget] = useState<TargetType>('product');
    const [activeFeature, setActiveFeature] = useState<string | null>(null);
    const [isSliderActive, setIsSliderActive] = useState(false);
    const [showOriginal, setShowOriginal] = useState(false);
    const [previewSize, setPreviewSize] = useState({ width: 0, height: 0 });
    const [selectedPreset, setSelectedPreset] = useState<ExportPreset | null>(null);
    const [showDraftManager, setShowDraftManager] = useState(false);
    
    // YENİ: Cache status monitoring (dev mode)
    const [cacheStatus, setCacheStatus] = useState<any>(null);

    const { isExporting, shareWithOption, skiaViewRef } = useExportManager();
    const { currentScrollRef } = useScrollManager({ activeTool, activeTarget, activeFeature, isSliderActive });
    const previewRef = useRef<View>(null);

    // ===== BACKGROUND CACHE MONITORING (Döngüyü önlemek için düzenlendi) =====
    useEffect(() => {
      if (__DEV__) {
        // Init status'u al ve logla
        const initialStatus = backgroundThumbnailManager.getCacheStats();
        setCacheStatus({
          totalBackgrounds: staticBackgrounds?.length || 0,
          cachedCount: initialStatus.itemCount,
          cacheSize: initialStatus.totalSize,
          isFullyCached: initialStatus.itemCount >= (staticBackgrounds?.length || 0),
          cacheStats: initialStatus,
          preloadStatus: backgroundPreloader.preloadStatus // Preloader'dan güncel status'ü al
        });
        console.log('📊 Background cache status (initial):', initialStatus);

        // Her 10 saniyede bir güncellemeyi ayarla
        const interval = setInterval(() => {
          const currentStatus = backgroundThumbnailManager.getCacheStats();
          setCacheStatus({
            totalBackgrounds: staticBackgrounds?.length || 0,
            cachedCount: currentStatus.itemCount,
            cacheSize: currentStatus.totalSize,
            isFullyCached: currentStatus.itemCount >= (staticBackgrounds?.length || 0),
            cacheStats: currentStatus,
            preloadStatus: backgroundPreloader.preloadStatus // Preloader'dan güncel status'ü al
          });
          console.log('📊 Background cache status:', currentStatus);
        }, 10000);

        // Component unmount olduğunda interval'i temizle
        return () => clearInterval(interval);
      }
    }, [backgroundPreloader.preloadStatus]); // Sadece preloader'ın kendi preloadStatus'u değiştiğinde tetiklensin

    // ===== MEMORY OPTIMIZATION =====
    
    useEffect(() => {
      const handleAppStateChange = (nextAppState: string) => {
        if (nextAppState === 'background') {
          console.log('📱 App backgrounding, optimizing background cache...');
          backgroundPreloader.optimizeCache();
        }
      };

      const subscription = AppState.addEventListener('change', handleAppStateChange);
      return () => subscription?.remove();
    }, [backgroundPreloader]);

    // ===== PHOTO LOADING EFFECT (Mount/Unmount logları eklendi) =====
    
    useEffect(() => {
        console.log('✨ EnhancedEditorScreen mounted!'); // Mount logu
        if (photoId && productId) {
          const product = getProductById(productId);
          const photo = product?.photos.find(p => p.id === photoId);
          if (photo) {
            console.log('📸 Loading photo with systems:', {
              photoId: photo.id,
              draftSystem: 'enabled',
              backgroundCache: 'enabled',
              autoSave: 'enabled'
            });
            setActivePhoto(photo);
          } else {
            router.back();
          }
        }
        
        return () => {
          console.log('🗑️ EnhancedEditorScreen unmounted!'); // Unmount logu
          const state = useEnhancedEditorStore.getState();
          if (state.activePhoto && state.hasDraftChanges) {
            console.log('🔄 Component unmounting, saving draft...');
            state.saveDraft();
          }
          
          clearStore();
          imageProcessor.optimizeMemoryUsage();
          // EKLENEN KISIM: Global UI servislerini manuel olarak gizle
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
        switch(activeTarget) {
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

    const handleSave = async () => { 
      console.log('💾 Save triggered - with thumbnail update');
      await store.saveChanges(previewRef); 
    };

    const handleResetAll = () => {
      console.log('🔄 Reset all settings triggered');
      resetAllSettings();
      clearDraft();
    };

    const handleForceAutoSave = () => {
      console.log('⚡ Force auto-save triggered');
      autoSaveStatus.forceAutoSave();
    };

    const handleCancel = () => {
        if (activeTool === 'crop' || activeTool === 'export' || activeFeature) {
          setActiveFeature(null);
          handleToolChange('adjust');
        } else {
          if (hasDraftChanges) {
            console.log('📂 Saving draft before leaving...');
            saveDraft();
          }
          router.back();
        }
    };

    // ===== YENİ: BACKGROUND SECTION RENDER =====
    
    const renderBackgroundSection = () => {
      if (activeTool !== 'background') return null;

      return (
        <View style={styles.backgroundSection}>
          {/* YENİ: Cache status indicator (dev mode) */}
          {__DEV__ && cacheStatus && (
            <View style={styles.cacheStatusBar}>
              <Text style={styles.cacheStatusText}>
                🗂️ Cache: {cacheStatus.cachedCount}/{cacheStatus.totalBackgrounds} • 
                {Math.round(cacheStatus.cacheSize / 1024)}KB
                {cacheStatus.isFullyCached && ' ✅'}
              </Text>
              <TouchableOpacity 
                style={styles.cacheOptimizeButton}
                onPress={backgroundPreloader.optimizeCache}
              >
                <Feather name="refresh-cw" size={12} color={Colors.primary} />
              </TouchableOpacity>
            </View>
          )}

          {/* Background buttons */}
          <ScrollView 
            ref={currentScrollRef} 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={styles.scrollContent}
          >
            {staticBackgrounds.map(bg => 
              <BackgroundButton 
                key={bg.id} 
                background={bg} 
                isSelected={settings.backgroundId === bg.id} 
                onPress={() => { 
                  console.log('🖼️ Background selected:', bg.name);
                  updateSettings({backgroundId: bg.id}); 
                  addSnapshotToHistory();
                }} 
              />
            )}
          </ScrollView>

          {/* YENİ: Background management controls (dev mode) */}
          {__DEV__ && (
            <View style={styles.backgroundControls}>
              <TouchableOpacity 
                style={styles.controlButton}
                onPress={() => {
                  console.log('🚀 Manual background preload triggered');
                  backgroundPreloader.startPreloading();
                }}
              >
                <Feather name="download" size={14} color={Colors.primary} />
                <Text style={styles.controlButtonText}>Preload</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.controlButton, styles.dangerButton]}
                onPress={() => {
                  console.log('🗑️ Background cache clear triggered');
                  backgroundPreloader.clearCache();
                  setCacheStatus(null);
                }}
              >
                <Feather name="trash-2" size={14} color={Colors.error} />
                <Text style={[styles.controlButtonText, styles.dangerText]}>Clear Cache</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.controlButton}
                onPress={() => {
                  const status = backgroundPreloader.getCacheStatus(); 
                  console.log('📊 Background cache info:', status);
                }}
              >
                <Feather name="info" size={14} color={Colors.primary} />
                <Text style={styles.controlButtonText}>Info</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
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
        {/* Enhanced Header */}
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
          totalDraftsCount={draftRestore.totalDraftsCount}
          onShowDraftManager={() => setShowDraftManager(true)}
          autoSaveEnabled={autoSaveEnabled}
          onForceAutoSave={handleForceAutoSave}
        />
        
        <View style={styles.contentWrapper}>
            {/* Preview */}
            <View style={styles.previewContainer} ref={skiaViewRef} collapsable={false}>
                <EditorPreview 
                  ref={previewRef}
                  activePhoto={{...activePhoto, processedImageUrl: activePhoto.processedUri}} 
                  selectedBackground={staticBackgrounds.find(bg => bg.id === settings.backgroundId)} 
                  settings={settings} 
                  showOriginal={showOriginal} 
                  onShowOriginalChange={setShowOriginal} 
                  onLayout={handlePreviewLayout} 
                  updateSettings={updateSettings} 
                  previewSize={previewSize} 
                  isCropping={activeTool === 'crop'} 
                />
            </View>

            {/* Status Indicators */}
            {isUpdatingThumbnail && (
              <View style={styles.thumbnailUpdateIndicator}>
                <ActivityIndicator size="small" color={Colors.primary} />
                <Text style={styles.thumbnailUpdateText}>Thumbnail güncelleniyor...</Text>
              </View>
            )}

            {__DEV__ && autoSaveStatus.hasPendingChanges && (
              <View style={styles.autoSaveIndicator}>
                <Text style={styles.autoSaveText}>
                  Auto-save: {autoSaveStatus.isAutoSaveEnabled ? 'ON' : 'OFF'} • 
                  Son: {new Date(autoSaveStatus.lastSaveAttempt).toLocaleTimeString()}
                </Text>
              </View>
            )}

            <View style={styles.bottomToolbarContainer}>
              {/* Crop Toolbar */}
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
              
              {/* Export Toolbar */}
              {activeTool === 'export' && (
                  <View style={styles.fullScreenTool}>
                    <ExportToolbar 
                      activeTool={activeTool} 
                      selectedPreset={selectedPreset} 
                      isExporting={isExporting} 
                      setSelectedPreset={setSelectedPreset} 
                      shareWithOption={shareWithOption} 
                    />
                  </View>
              )}

              {/* Main Tool Content */}
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
                        {/* Slider Mode */}
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
                              {/* Adjust Features */}
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
                              
                              {/* Filter Previews */}
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
                                      backgroundUri={staticBackgrounds.find(bg => bg.id === settings.backgroundId)?.fullUrl!} 
                                      isSelected={activeFilterKey === f.key} 
                                      onPress={() => applyFilter(f.key, activeTarget)} 
                                    />
                                  )}
                                </ScrollView>
                              )}
                              
                              {/* GÜNCELLEME: Background Section - Optimize edilmiş */}
                              {renderBackgroundSection()}
                            </>
                        )}
                    </View>
                  </>
              )}
              
              {/* Main Toolbar */}
              {activeTool !== 'crop' && (
                <MainToolbar 
                  activeTool={activeTool} 
                  onToolChange={handleToolChange} 
                />
              )}
            </View>
        </View>

        {/* Draft Manager Modal */}
        <DraftManager 
          visible={showDraftManager}
          onClose={() => setShowDraftManager(false)}
        />
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  contentWrapper: { flex: 1, flexDirection: 'column' },
  previewContainer: { flex: 1, width: '100%' },
  bottomToolbarContainer: { backgroundColor: Colors.card, borderTopWidth: 1, borderTopColor: Colors.border },
  dynamicToolContainer: { minHeight: 120, justifyContent: 'center', alignItems: 'center' },
  fullScreenTool: { minHeight: 120 },
  scrollContent: { paddingHorizontal: Spacing.lg, alignItems: 'center', gap: Spacing.lg, paddingVertical: Spacing.md },

  // Status indicators
  thumbnailUpdateIndicator: {
    position: 'absolute', top: 80, left: 0, right: 0, flexDirection: 'row',
    justifyContent: 'center', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.primary + '90', paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg, borderRadius: 20, marginHorizontal: Spacing.lg, zIndex: 100,
  },
  thumbnailUpdateText: { color: Colors.card, fontSize: 14, fontWeight: '600' },
  autoSaveIndicator: {
    position: 'absolute', top: 120, left: Spacing.lg, right: Spacing.lg,
    backgroundColor: Colors.success + '90', paddingVertical: 4,
    paddingHorizontal: Spacing.md, borderRadius: 12, zIndex: 90,
  },
  autoSaveText: { color: Colors.card, fontSize: 12, fontWeight: '500', textAlign: 'center' },

  // YENİ: Background section styles
  backgroundSection: { width: '100%', paddingVertical: Spacing.md },
  cacheStatusBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm,
    backgroundColor: Colors.gray100, marginBottom: Spacing.sm,
    borderRadius: BorderRadius.sm, marginHorizontal: Spacing.md,
  },
  cacheStatusText: { ...Typography.caption, color: Colors.textSecondary, fontSize: 11, fontWeight: '500' },
  cacheOptimizeButton: { padding: Spacing.xs, borderRadius: BorderRadius.sm, backgroundColor: Colors.primary + '15' },
  backgroundControls: {
    flexDirection: 'row', justifyContent: 'center', gap: Spacing.md,
    paddingHorizontal: Spacing.lg, paddingTop: Spacing.md,
  },
  controlButton: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    backgroundColor: Colors.gray100, borderRadius: BorderRadius.md,
  },
  dangerButton: { backgroundColor: Colors.error + '10' },
  controlButtonText: { ...Typography.caption, color: Colors.textPrimary, fontWeight: '500', fontSize: 11 },
  dangerText: { color: Colors.error },
});