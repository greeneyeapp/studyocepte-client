// client/app/(tabs)/editor/[photoId].tsx - TÜM SORUNLARI ÇÖZEN NİHAİ KOD

import React, { useEffect, useState, useCallback } from 'react';
import { SafeAreaView, StyleSheet, ActivityIndicator, View, ScrollView, Text, LayoutAnimation, UIManager, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// ... (tüm importlar aynı kalacak)
import { useEnhancedEditorStore } from '@/stores/useEnhancedEditorStore';
import { useExportManager } from '@/features/editor/hooks/useExportManager';
import { useScrollManager } from '@/features/editor/hooks/useScrollManager';
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
import { ToolType, TargetType } from '@/features/editor/config/tools';
import { ADJUST_FEATURES, BACKGROUND_FEATURES } from '@/features/editor/config/features';
import { ALL_FILTERS } from '@/features/editor/config/filters';
import { api, Background } from '@/services/api';
import { Colors, Spacing } from '@/constants';
import { ExportPreset } from '@/features/editor/config/exportTools';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const staticBackgrounds: Background[] = [
    {id: "bg1", name: "Studio White", thumbnailUrl: "https://images.pexels.com/photos/1762851/pexels-photo-1762851.jpeg?auto=compress&cs=tinysrgb&w=200", fullUrl: "https://images.pexels.com/photos/1762851/pexels-photo-1762851.jpeg?auto=compress&cs=tinysrgb&w=800"},
    {id: "bg2", name: "Concrete", thumbnailUrl: "https://images.pexels.com/photos/1191710/pexels-photo-1191710.jpeg?auto=compress&cs=tinysrgb&w=200", fullUrl: "https://images.pexels.com/photos/1191710/pexels-photo-1191710.jpeg?auto=compress&cs=tinysrgb&w=800"},
];

export default function EnhancedEditorScreen() {
    const { t } = useTranslation();
    const { photoId } = useLocalSearchParams<{ photoId: string }>();
    const router = useRouter();

    const store = useEnhancedEditorStore();
    const { activePhoto, settings, isSaving, activeFilterKey, applyFilter, undo, redo, canUndo, canRedo, addSnapshotToHistory, updateSettings, clearStore, setActivePhoto, setActiveFilterKey, resetCropAndRotation } = store;
    const applyCrop = useEnhancedEditorStore((state) => state.applyCrop);

    const [activeTool, setActiveTool] = useState<ToolType>('adjust');
    const [activeTarget, setActiveTarget] = useState<TargetType>('product');
    const [activeFeature, setActiveFeature] = useState<string | null>(null);
    const [isSliderActive, setIsSliderActive] = useState(false);
    const [showOriginal, setShowOriginal] = useState(false);
    const [previewSize, setPreviewSize] = useState({ width: 0, height: 0 });
    const [selectedPreset, setSelectedPreset] = useState<ExportPreset | null>(null);

    const { isExporting, shareWithOption, skiaViewRef } = useExportManager();
    const { currentScrollRef } = useScrollManager({ activeTool, activeTarget, activeFeature, isSliderActive });

    useEffect(() => {
        if (photoId) api.fetchPhotoById(photoId).then(setActivePhoto).catch(() => router.back());
        return () => clearStore();
    }, [photoId, setActivePhoto, clearStore]);

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
    
    const handlePreviewLayout = (event: any) => { const { width, height } = event.nativeEvent.layout; if (width > 0 && height > 0 && (width !== previewSize.width || height !== previewSize.height)) { setPreviewSize({ width, height }); } };
    const handleApplyCrop = () => { applyCrop(); setTimeout(() => handleToolChange('adjust'), 300); };
    const handleSave = async () => { await store.saveChanges(); };

    // YENİLİK: Cancel butonu artık bağlama duyarlı
    const handleCancel = () => {
        // Eğer kullanıcı kırpma veya export modundaysa, sadece ana arayüze dön
        if (activeTool === 'crop' || activeTool === 'export' || activeFeature) {
            setActiveFeature(null);
            handleToolChange('adjust');
        } else {
            // Aksi halde editörden tamamen çık
            router.back();
        }
    };

    if (!activePhoto) {
        return <SafeAreaView style={styles.loadingContainer}><ActivityIndicator size="large" color={Colors.primary} /></SafeAreaView>;
    }

    const featuresForCurrentTarget = activeTarget === 'background' ? BACKGROUND_FEATURES : ADJUST_FEATURES;
    const currentFeatureConfig = featuresForCurrentTarget.find(f => f.key === activeFeature);
    const currentSliderValue = getSliderValue(activeFeature);
    
    return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        {/* onCancel prop'u yeni fonksiyonu kullanıyor */}
        <EditorHeader onCancel={handleCancel} onSave={handleSave} isSaving={isSaving} canUndo={canUndo()} canRedo={canRedo()} onUndo={undo} onRedo={redo} />
        
        {/* YENİ YAPI: Ana içerik ve toolbar'lar flex ile ayrıldı */}
        <View style={styles.contentWrapper}>
            <View style={styles.previewContainer} ref={skiaViewRef} collapsable={false}>
                <EditorPreview activePhoto={activePhoto} selectedBackground={staticBackgrounds.find(bg => bg.id === settings.backgroundId)} settings={settings} showOriginal={showOriginal} onShowOriginalChange={setShowOriginal} onLayout={handlePreviewLayout} updateSettings={updateSettings} previewSize={previewSize} isCropping={activeTool === 'crop'} />
            </View>

            <View style={styles.bottomToolbarContainer}>
                {activeTool === 'crop' && (
                    <CropToolbar activeRatio={settings.cropAspectRatio || 'original'} onAspectRatioSelect={(ratio) => { updateSettings({ cropAspectRatio: ratio }); addSnapshotToHistory(); }} onRotate={() => { updateSettings({ photoRotation: ((settings.photoRotation || 0) + 90) % 360 }); addSnapshotToHistory(); }} onReset={resetCropAndRotation} onApplyCrop={handleApplyCrop}/>
                )}
                
                {activeTool === 'export' && (
                    <View style={styles.fullScreenTool}>
                        <ExportToolbar activeTool={activeTool} selectedPreset={selectedPreset} isExporting={isExporting} setSelectedPreset={setSelectedPreset} shareWithOption={shareWithOption} />
                    </View>
                )}

                {activeTool !== 'export' && activeTool !== 'crop' && (
                    <>
                        {(activeTool === 'adjust' || activeTool === 'filter') && !activeFeature && (
                            <TargetSelector activeTarget={activeTarget} onTargetChange={(t) => { animateLayout(); setActiveTarget(t); }} activeTool={activeTool} />
                        )}
                        {/* YENİLİK: Slider veya Butonlar'dan sadece biri gösteriliyor */}
                        <View style={styles.dynamicToolContainer}>
                            {activeTool === 'adjust' && currentFeatureConfig ? (
                                <CustomSlider feature={currentFeatureConfig} value={currentSliderValue} onValueChange={(v) => handleValueChange(activeFeature!, v)} onSlidingStart={() => setIsSliderActive(true)} onSlidingComplete={() => { addSnapshotToHistory(); setIsSliderActive(false); setActiveFeature(null); }} isActive={!!activeFeature} />
                            ) : (
                                <ScrollView ref={currentScrollRef} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                                    {activeTool === 'adjust' && featuresForCurrentTarget.map(f => <FeatureButton key={f.key} icon={f.icon} label={f.label} value={getSliderValue(f.key)} isActive={activeFeature === f.key} onPress={() => handleFeaturePress(f.key)} />)}
                                    {activeTool === 'filter' && ALL_FILTERS.map(f => <FilterPreview key={f.key} filter={f} imageUri={activePhoto.processedImageUrl!} backgroundUri={staticBackgrounds.find(bg => bg.id === settings.backgroundId)?.fullUrl!} isSelected={activeFilterKey === f.key} onPress={() => applyFilter(f.key, activeTarget)} />)}
                                    {activeTool === 'background' && staticBackgrounds.map(bg => <BackgroundButton key={bg.id} background={bg} isSelected={settings.backgroundId === bg.id} onPress={() => { updateSettings({backgroundId: bg.id}); addSnapshotToHistory();}} />)}
                                </ScrollView>
                            )}
                        </View>
                    </>
                )}
                
                {/* YENİLİK: MainToolbar artık sadece 'crop' modunda gizli */}
                {activeTool !== 'crop' && <MainToolbar activeTool={activeTool} onToolChange={handleToolChange} />}
            </View>
        </View>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

// TAMAMEN YENİLENMİŞ STİLLER
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  contentWrapper: { flex: 1, flexDirection: 'column' },
  previewContainer: {
    flex: 1, // Önizleme mevcut tüm dikey alanı kullanır
    width: '100%',
  },
  bottomToolbarContainer: {
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  dynamicToolContainer: {
    minHeight: 120, // Slider veya butonlar için sabit yükseklik
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenTool: {
      // Export gibi tam ekran araçlar için
      height: '100%', 
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.lg,
    paddingVertical: Spacing.md,
  },
});