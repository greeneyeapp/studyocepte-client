// app/(tabs)/editor/[photoId].tsx - FAZ 3 FİNAL SÜRÜMÜ (Tablet Optimizasyonu Dahil Tam Kod)
import React, { useEffect, useState } from 'react';
import { SafeAreaView, StyleSheet, ActivityIndicator, View, ScrollView, Text, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Feather } from '@expo/vector-icons';

import { useEnhancedEditorStore, EditorSettings } from '@/stores/useEnhancedEditorStore';
import { useExportManager } from './hooks/useExportManager';
import { useScrollManager } from './hooks/useScrollManager';

import { EditorHeader } from './components/EditorHeader';
import { TargetSelector } from './components/TargetSelector';
import { EditorPreview } from './components/EditorPreview';
import { FeatureButton } from './components/FeatureButton';
import { CustomSlider } from './components/CustomSlider';
import { MainToolbar } from './components/MainToolbar';
import { FilterPreview } from './components/FilterPreview';
import { BackgroundButton } from './components/BackgroundButton';
import { ExportToolbar } from './components/ExportToolbar';
import { CropToolbar } from './components/CropToolbar';

import { ToolType } from './config/tools';
import { ADJUST_FEATURES, BACKGROUND_FEATURES } from './config/features';
import { ALL_FILTERS } from './config/filters';
import { ExportPreset } from './config/exportTools';

import { ToastService } from '@/components/Toast/ToastService';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants';
import { Layout } from '@/constants/Layout';
import { api } from '@/services/api';

const staticBackgrounds = [
    {id: "bg1", name: "Studio White", thumbnailUrl: "https://images.pexels.com/photos/1762851/pexels-photo-1762851.jpeg?auto=compress&cs=tinysrgb&w=200", fullUrl: "https://images.pexels.com/photos/1762851/pexels-photo-1762851.jpeg?auto=compress&cs=tinysrgb&w=800"},
    {id: "bg2", name: "Concrete", thumbnailUrl: "https://images.pexels.com/photos/1191710/pexels-photo-1191710.jpeg?auto=compress&cs=tinysrgb&w=200", fullUrl: "https://images.pexels.com/photos/1191710/pexels-photo-1191710.jpeg?auto=compress&cs=tinysrgb&w=800"},
    {id: "bg3", name: "Wood", thumbnailUrl: "https://images.pexels.com/photos/129731/pexels-photo-129731.jpeg?auto=compress&cs=tinysrgb&w=200", fullUrl: "https://images.pexels.com/photos/129731/pexels-photo-129731.jpeg?auto=compress&cs=tinysrgb&w=800"},
    {id: "bg4", name: "Marble", thumbnailUrl: "https://images.pexels.com/photos/1139541/pexels-photo-1139541.jpeg?auto=compress&cs=tinysrgb&w=200", fullUrl: "https://images.pexels.com/photos/1139541/pexels-photo-1139541.jpeg?auto=compress&cs=tinysrgb&w=800"},
];

export default function EnhancedEditorScreen() {
  const { t } = useTranslation();
  const { photoId } = useLocalSearchParams<{ photoId: string }>();
  const router = useRouter();

  const store = useEnhancedEditorStore();
  const {
    activePhoto, settings, isSaving, userPresets,
  } = store;

  const [activeTool, setActiveTool] = useState<ToolType>('adjust');
  const [activeTarget, setActiveTarget] = useState('product');
  const [activeFeature, setActiveFeature] = useState<string | null>(null);
  const [isSliderActive, setIsSliderActive] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const [previewSize, setPreviewSize] = useState({ width: 0, height: 0 });
  const [selectedPreset, setSelectedPreset] = useState<ExportPreset | null>(null);
  
  const { previewRef, isExporting, shareWithOption } = useExportManager();
  const { currentScrollRef } = useScrollManager({ activeTool, activeTarget, activeFeature, isSliderActive });

  useEffect(() => {
    const loadPhoto = async () => {
        if (photoId) {
            try {
                const photo = await api.fetchPhotoById(photoId);
                store.setActivePhoto(photo);
            } catch (error) {
                ToastService.show({type: 'error', text1: 'Hata', text2: 'Fotoğraf yüklenemedi.'});
                router.back();
            }
        }
    }
    loadPhoto();
    return () => { store.clearStore(); };
  }, [photoId]);

  const handleToolChange = (tool: ToolType) => {
    setActiveTool(tool);
    if (tool !== 'crop' && tool !== 'adjust') {
        store.addSnapshotToHistory();
    }
    if (tool === 'crop') {
        store.addSnapshotToHistory();
    }
    setActiveFeature(null);
  };

  const handleSave = async () => {
      try {
        await store.saveChanges();
        ToastService.show({ type: 'success', text1: t('common.success'), text2: 'Değişiklikler kaydedildi.' });
        router.back();
      } catch (error: any) {
        ToastService.show({ type: 'error', text1: t('common.error'), text2: error.message });
      }
  };
  
  const handleFeaturePress = (featureKey: string) => setActiveFeature(prev => (prev === featureKey ? null : featureKey));
  const handleBackgroundSelect = (bgId: string) => { store.updateSettings({ backgroundId: bgId }); store.addSnapshotToHistory(); };
  
  const handleCropDone = () => { store.addSnapshotToHistory(); setActiveTool('adjust'); };
  const handleCropCancel = () => { store.undo(); setActiveTool('adjust'); };
  const handleRotation = () => store.updateSettings({ photoRotation: ((settings.photoRotation || 0) + 90) % 360 });
  const handleAspectRatio = (ratio: string) => store.updateSettings({ cropAspectRatio: ratio });
  const handleResetCrop = () => {
      store.updateSettings({
          photoRotation: 0, cropAspectRatio: 'original',
          cropX: 0, cropY: 0, cropWidth: 1, cropHeight: 1,
      });
      store.addSnapshotToHistory();
  };

  const renderActiveToolbar = () => {
    switch (activeTool) {
      case 'background':
        return (
          <ScrollView ref={currentScrollRef} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {staticBackgrounds.map(bg => <BackgroundButton key={bg.id} background={bg} isSelected={settings.backgroundId === bg.id} onPress={() => handleBackgroundSelect(bg.id)} />)}
          </ScrollView>
        );
      case 'filter':
        return (
          <ScrollView ref={currentScrollRef} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            <TouchableOpacity style={styles.savePresetButton} onPress={store.saveCurrentUserPreset}>
              <Feather name="plus-circle" size={24} color={Colors.primary} />
              <Text style={styles.savePresetText}>Preset Kaydet</Text>
            </TouchableOpacity>

            {userPresets.map(preset => (
              <TouchableOpacity key={preset.id} style={styles.presetButton} onPress={() => store.applyUserPreset(preset.id)}>
                <Text style={styles.presetText}>{preset.name}</Text>
              </TouchableOpacity>
            ))}
            
            {ALL_FILTERS.map(filter => <FilterPreview key={filter.key} filter={filter} imageUri={activePhoto?.processedImageUrl || ''} backgroundUri={staticBackgrounds.find(bg => bg.id === settings.backgroundId)?.fullUrl || ''} isSelected={false} onPress={() => {}} />)}
          </ScrollView>
        );
      case 'adjust':
        const features = activeTarget === 'background' ? BACKGROUND_FEATURES : ADJUST_FEATURES;
        return (
          <ScrollView ref={currentScrollRef} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {features.map(feature => (
              <FeatureButton
                key={feature.key}
                icon={feature.icon}
                label={feature.label}
                value={(settings as any)[`${activeTarget}_${feature.key}`] ?? 0}
                isActive={activeFeature === feature.key}
                onPress={() => handleFeaturePress(feature.key)}
              />
            ))}
          </ScrollView>
        );
      default: return null;
    }
  };

  if (!activePhoto) {
    return <SafeAreaView style={styles.loadingContainer}><ActivityIndicator size="large" color={Colors.primary} /></SafeAreaView>;
  }

  const currentFeatureConfig = (activeTool === 'adjust' ? (activeTarget === 'background' ? BACKGROUND_FEATURES : ADJUST_FEATURES) : []).find(f => f.key === activeFeature);

  const MainContent = (
    <>
      {activeTool !== 'export' ? (
        <>
          {activeTool !== 'crop' && <TargetSelector activeTarget={activeTarget} onTargetChange={setActiveTarget} activeTool={activeTool} />}
          <View style={styles.previewWrapper}>
            <EditorPreview
              activePhoto={activePhoto}
              selectedBackground={staticBackgrounds.find(bg => bg.id === settings.backgroundId)}
              settings={settings} showOriginal={showOriginal}
              onShowOriginalChange={setShowOriginal} onLayout={(e) => setPreviewSize(e.nativeEvent.layout)}
              updateSettings={store.updateSettings} previewSize={previewSize}
              isCropping={activeTool === 'crop'}
            />
          </View>
        </>
      ) : (
        <ExportToolbar 
          activeTool={activeTool} selectedPreset={selectedPreset}
          isExporting={isExporting} setSelectedPreset={setSelectedPreset}
          shareWithOption={(option) => { if(selectedPreset) shareWithOption(option, selectedPreset)}}
        />
      )}
    </>
  );

  const Toolbars = (
    <>
      {activeTool === 'crop' ? (
        <CropToolbar
          activeRatio={settings.cropAspectRatio || 'original'}
          onAspectRatioSelect={handleAspectRatio} onRotate={handleRotation}
          onReset={handleResetCrop} onDone={handleCropDone} onCancel={handleCropCancel}
        />
      ) : (
        <>
          {activeTool === 'adjust' && currentFeatureConfig && (
            <CustomSlider
              feature={currentFeatureConfig}
              value={(settings as any)[`${activeTarget}_${activeFeature}`] ?? 0}
              onValueChange={(value) => store.updateSettings({ [`${activeTarget}_${activeFeature}`]: value })}
              onSlidingStart={() => setIsSliderActive(true)}
              onSlidingComplete={store.addSnapshotToHistory}
              isActive={!!activeFeature}
            />
          )}
          {!isSliderActive && activeTool !== 'export' && (
            <View style={styles.toolbarsContainer}>{renderActiveToolbar()}</View>
          )}
          <MainToolbar activeTool={activeTool} onToolChange={handleToolChange} />
        </>
      )}
    </>
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        <EditorHeader
          onCancel={() => router.back()} onSave={handleSave} isSaving={isSaving}
          canUndo={store.canUndo()} canRedo={store.canRedo()} onUndo={store.undo} onRedo={store.redo}
        />
        
        {Layout.isTablet ? (
          <View style={styles.tabletLayoutContainer}>
            <View style={styles.tabletMainContent}>{MainContent}</View>
            <View style={styles.tabletSidebar}>{Toolbars}</View>
          </View>
        ) : (
          <>
            {MainContent}
            {Toolbars}
          </>
        )}
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  previewWrapper: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.sm },
  toolbarsContainer: { minHeight: 120, justifyContent: 'center', backgroundColor: Colors.card },
  
  tabletLayoutContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  tabletMainContent: {
    flex: 3,
    height: '100%',
  },
  tabletSidebar: {
    flex: 1,
    height: '100%',
    backgroundColor: Colors.card,
    borderLeftWidth: 1,
    borderLeftColor: Colors.border,
    paddingVertical: Spacing.md,
    justifyContent: 'flex-end'
  },

  scrollContent: { paddingHorizontal: Spacing.lg, alignItems: 'center', gap: Spacing.lg, paddingVertical: Spacing.md },
  savePresetButton: { alignItems: 'center', justifyContent: 'center', width: 60, height: 60, borderRadius: BorderRadius.md, backgroundColor: Colors.indigo50, borderWidth: 1, borderColor: Colors.primary, borderStyle: 'dashed' },
  savePresetText: { ...Typography.caption, fontSize: 9, color: Colors.primary, marginTop: Spacing.xs, textAlign: 'center' },
  presetButton: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.md, height: 60, borderRadius: BorderRadius.md, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border },
  presetText: { ...Typography.captionMedium, color: Colors.textPrimary },
});