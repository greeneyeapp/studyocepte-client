// client/app/(tabs)/editor/[photoId].tsx (NO SKIA VERSION)
import React, { useEffect, useState, useCallback } from 'react';
import { SafeAreaView, StyleSheet, ActivityIndicator, View, ScrollView, Text, LayoutAnimation, UIManager, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

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
import { api, Background, ProductPhoto } from '@/services/api';
import { Colors, Spacing } from '@/constants';
import { ShareOption, ExportPreset } from '@/features/editor/config/exportTools';

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
  const {
    activePhoto, settings, isSaving, activeFilterKey,
    applyFilter, undo, redo, canUndo, canRedo, addSnapshotToHistory, updateSettings, clearStore, setActivePhoto,
    setActiveFilterKey
  } = store;

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
  }, [photoId]);

  const animateLayout = () => LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

  const handleToolChange = (tool: ToolType) => {
    console.log('🔧 Tool changed from', activeTool, 'to', tool);
    animateLayout();
    if (tool !== 'adjust' && activeFeature) addSnapshotToHistory();
    setActiveFeature(null);
    setActiveTool(tool);
  };
  
  const handleFeaturePress = (featureKey: string) => {
    console.log('🎛️ Feature pressed:', featureKey, 'Current active:', activeFeature);
    if (activeFeature && activeFeature !== featureKey) addSnapshotToHistory();
    animateLayout();
    setActiveFeature(prev => (prev === featureKey ? null : featureKey));
  };
  
  const handleValueChange = useCallback((featureKey: string, value: number) => {
    console.log(`🎯 Value Change: ${featureKey} = ${value}, Target: ${activeTarget}`);
    
    if (activeFilterKey !== 'custom') {
      setActiveFilterKey('custom');
    }
    
    const changes: Record<string, number> = {};
    
    switch (activeTarget) {
      case 'product':
        changes[`product_${featureKey}`] = value;
        console.log(`📝 Setting product_${featureKey} = ${value}`);
        break;
        
      case 'background':
        changes[`background_${featureKey}`] = value;
        console.log(`📝 Setting background_${featureKey} = ${value}`);
        break;
        
      case 'all':
        changes[`product_${featureKey}`] = value;
        changes[`background_${featureKey}`] = value;
        console.log(`📝 Setting both product_${featureKey} and background_${featureKey} = ${value}`);
        break;
        
      default:
        console.warn(`❌ Unknown target: ${activeTarget}`);
        return;
    }
    
    console.log('📦 Changes to apply:', changes);
    updateSettings(changes);
  }, [activeTarget, activeFilterKey, setActiveFilterKey, updateSettings]);

  const getSliderValue = useCallback((featureKey: string | null): number => {
    if (!featureKey) return 0;
    
    let settingKey: string;
    
    switch (activeTarget) {
      case 'product':
        settingKey = `product_${featureKey}`;
        break;
      case 'background':
        settingKey = `background_${featureKey}`;
        break;
      case 'all':
        settingKey = `product_${featureKey}`;
        break;
      default:
        settingKey = `product_${featureKey}`;
    }
    
    const value = (settings as any)[settingKey] ?? 0;
    console.log(`🎚️ Slider Value: ${settingKey} = ${value}`);
    return value;
  }, [settings, activeTarget]);

  const handlePreviewLayout = (event: any) => {
    const { width, height } = event.nativeEvent.layout;
    if (width > 0 && height > 0 && (width !== previewSize.width || height !== previewSize.height)) {
        console.log('📐 Preview size changed:', { width, height });
        setPreviewSize({ width, height });
    }
  };

  const handleSave = async () => { /* ... Kaydet işlemi ... */ };
  
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
          onCancel={() => router.back()} 
          onSave={handleSave} 
          isSaving={isSaving} 
          canUndo={canUndo()} 
          canRedo={canRedo()} 
          onUndo={undo} 
          onRedo={redo} 
        />
        
        <View style={styles.mainContent}>
          {activeTool !== 'export' ? (
            <EditorPreview
              ref={skiaViewRef}
              activePhoto={activePhoto}
              selectedBackground={staticBackgrounds.find(bg => bg.id === settings.backgroundId)}
              settings={settings}
              showOriginal={showOriginal}
              onShowOriginalChange={setShowOriginal}
              onLayout={handlePreviewLayout}
              updateSettings={updateSettings}
              previewSize={previewSize}
              isCropping={activeTool === 'crop'}
            />
          ) : (
            <ExportToolbar 
              activeTool={activeTool} 
              selectedPreset={selectedPreset}
              isExporting={isExporting} 
              setSelectedPreset={setSelectedPreset}
              shareWithOption={async (option: ShareOption) => { 
                if(selectedPreset) await shareWithOption(option, selectedPreset) 
              }}
            />
          )}
        </View>

        <View style={styles.toolbarsWrapper}>
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
              onReset={() => {}} 
              onDone={() => handleToolChange('adjust')} 
              onCancel={() => {
                undo(); 
                handleToolChange('adjust');
              }} 
            />
          )}
          
          {activeTool === 'adjust' && !isSliderActive && (
            <TargetSelector 
              activeTarget={activeTarget} 
              onTargetChange={(t) => {
                console.log('🎯 Target changed from', activeTarget, 'to', t);
                animateLayout(); 
                setActiveTarget(t);
              }} 
              activeTool={activeTool} 
            />
          )}

          {activeTool === 'adjust' && currentFeatureConfig && (
            <CustomSlider 
              feature={currentFeatureConfig} 
              value={currentSliderValue}
              onValueChange={(v) => handleValueChange(activeFeature!, v)} 
              onSlidingStart={() => setIsSliderActive(true)} 
              onSlidingComplete={() => {
                addSnapshotToHistory(); 
                setIsSliderActive(false);
              }} 
              isActive={!!activeFeature} 
              hasMixedValues={activeTarget === 'all'} 
              productValue={(settings as any)[`product_${activeFeature}`] ?? 0} 
              backgroundValue={(settings as any)[`background_${activeFeature}`] ?? 0} 
            />
          )}
          
          <View style={styles.scrollToolbarContainer}>
            {!isSliderActive && activeTool === 'adjust' && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {featuresForCurrentTarget.map(f => (
                  <FeatureButton 
                    key={f.key} 
                    icon={f.icon} 
                    label={f.label} 
                    value={getSliderValue(f.key)} 
                    isActive={activeFeature === f.key} 
                    onPress={() => handleFeaturePress(f.key)} 
                  />
                ))}
              </ScrollView>
            )}

            {!isSliderActive && activeTool === 'filter' && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {ALL_FILTERS.map(f => (
                  <FilterPreview 
                    key={f.key} 
                    filter={f} 
                    imageUri={activePhoto.processedImageUrl!} 
                    backgroundUri={staticBackgrounds.find(bg => bg.id === settings.backgroundId)?.fullUrl!} 
                    isSelected={activeFilterKey === f.key} 
                    onPress={() => applyFilter(f.key)} 
                  />
                ))}
              </ScrollView>
            )}

            {!isSliderActive && activeTool === 'background' && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {staticBackgrounds.map(bg => (
                  <BackgroundButton 
                    key={bg.id} 
                    background={bg} 
                    isSelected={settings.backgroundId === bg.id} 
                    onPress={() => {
                      updateSettings({backgroundId: bg.id}); 
                      addSnapshotToHistory();
                    }} 
                  />
                ))}
              </ScrollView>
            )}
          </View>
          
          <MainToolbar activeTool={activeTool} onToolChange={handleToolChange} />
        </View>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  mainContent: { flex: 1 },
  toolbarsWrapper: { backgroundColor: Colors.card, borderTopWidth: 1, borderTopColor: Colors.border },
  scrollToolbarContainer: { minHeight: 120, justifyContent: 'center' },
  scrollContent: { paddingHorizontal: Spacing.lg, alignItems: 'center', gap: Spacing.lg, paddingVertical: Spacing.md },
});