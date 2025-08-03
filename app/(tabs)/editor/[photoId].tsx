// app/(tabs)/editor/[photoId].tsx - Final Düzeltilmiş Versiyon
import React, { useEffect, useState } from 'react';
import { SafeAreaView, StyleSheet, ActivityIndicator, View, ScrollView, Text, TouchableOpacity, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Feather } from '@expo/vector-icons';

import { useEnhancedEditorStore, EditorSettings } from '@/stores/useEnhancedEditorStore';
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
import { ExportToolbar } from '@/features/editor/components/ExportToolbar';
import { CropToolbar } from '@/features/editor/components/CropToolbar';
import { ToolType, TargetType } from '@/features/editor/config/tools';
import { ADJUST_FEATURES, BACKGROUND_FEATURES } from '@/features/editor/config/features';
import { ALL_FILTERS } from '@/features/editor/config/filters';
import { ExportPreset, ShareOption } from '@/features/editor/config/exportTools';

import { ToastService } from '@/components/Toast/ToastService';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants';
import { Layout } from '@/constants/Layout';
import { api, Background, ProductPhoto } from '@/services/api';

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
    activePhoto, settings, isSaving, userPresets, activeFilterKey,
    applyFilter, undo, redo, canUndo, canRedo, addSnapshotToHistory, updateSettings, clearStore, setActivePhoto
  } = store;

  const [activeTool, setActiveTool] = useState<ToolType>('adjust');
  const [activeTarget, setActiveTarget] = useState<TargetType>('product');
  const [activeFeature, setActiveFeature] = useState<string | null>(null);
  const [isSliderActive, setIsSliderActive] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const [previewSize, setPreviewSize] = useState({ width: 0, height: 0 });
  const [selectedPreset, setSelectedPreset] = useState<ExportPreset | null>(null);
  
  const { isExporting, shareWithOption } = useExportManager();
  const { currentScrollRef } = useScrollManager({ activeTool, activeTarget, activeFeature, isSliderActive });

  useEffect(() => {
    const loadPhoto = async () => {
        if (photoId) {
            try {
                const photo = await api.fetchPhotoById(photoId);
                setActivePhoto(photo);
            } catch (error) {
                console.error('[EditorScreen] Fotoğraf yükleme hatası:', error);
                ToastService.show({type: 'error', text1: 'Hata', text2: 'Fotoğraf yüklenemedi.'});
                router.back();
            }
        }
    }
    loadPhoto();
    return () => { clearStore(); };
  }, [photoId]);

  // PreviewSize fallback kontrolü
  useEffect(() => {
    const timer = setTimeout(() => {
      if (previewSize.width === 0 || previewSize.height === 0) {
        const screenDimensions = Dimensions.get('window');
        const fallbackSize = {
          width: screenDimensions.width - (Spacing.sm * 2),
          height: screenDimensions.height * 0.6
        };
        setPreviewSize(fallbackSize);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [previewSize]);

  const handleToolChange = (tool: ToolType) => {
    setActiveTool(tool);
    if (tool !== 'adjust' && activeFeature) {
        addSnapshotToHistory();
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
  
  const handleFeaturePress = (featureKey: string) => {
      if (activeFeature && activeFeature !== featureKey) {
          addSnapshotToHistory();
      }
      setActiveFeature(prev => (prev === featureKey ? null : featureKey));
  };

  const handleBackgroundSelect = (bgId: string) => {
      updateSettings({ backgroundId: bgId });
      addSnapshotToHistory();
  };
  
  const handleCropDone = () => { addSnapshotToHistory(); setActiveTool('adjust'); };
  const handleCropCancel = () => { undo(); setActiveTool('adjust'); };
  const handleRotation = () => updateSettings({ photoRotation: ((settings.photoRotation || 0) + 90) % 360 });
  const handleAspectRatio = (ratio: string) => updateSettings({ cropAspectRatio: ratio });
  const handleResetCrop = () => {
      updateSettings({
          photoRotation: 0, cropAspectRatio: 'original',
          cropX: 0, cropY: 0, cropWidth: 1, cropHeight: 1,
      });
      addSnapshotToHistory();
  };

  const handlePreviewLayout = (event: any) => {
    const { width, height, x, y } = event.nativeEvent.layout;
    
    // Width 0 ise parent container'dan al
    if (width === 0) {
      const screenWidth = Dimensions.get('window').width;
      const calculatedWidth = screenWidth - (Spacing.sm * 4);
      setPreviewSize({ width: calculatedWidth, height: height || 400 });
    } else if (width > 0 && height > 0) {
      setPreviewSize({ width, height });
    }
  };

  const renderActiveToolbar = () => {
    if (!activePhoto) return null;
    const imageUri = activePhoto.processedImageUrl;

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
            {ALL_FILTERS.map(filter => 
              <FilterPreview 
                key={filter.key} 
                filter={filter} 
                imageUri={imageUri || ''}
                backgroundUri={staticBackgrounds.find(bg => bg.id === settings.backgroundId)?.fullUrl || ''} 
                isSelected={activeFilterKey === filter.key}
                onPress={() => applyFilter(filter.key)}
              />
            )}
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
    return (
        <SafeAreaView style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Editör Yükleniyor...</Text>
        </SafeAreaView>
    );
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
              settings={settings}
              showOriginal={showOriginal}
              onShowOriginalChange={setShowOriginal}
              onLayout={handlePreviewLayout}
              updateSettings={updateSettings}
              previewSize={previewSize}
              isCropping={activeTool === 'crop'}
            />
          </View>
        </>
      ) : (
        <ExportToolbar 
          activeTool={activeTool} selectedPreset={selectedPreset}
          isExporting={isExporting} setSelectedPreset={setSelectedPreset}
          shareWithOption={async (option: ShareOption) => { if(selectedPreset) await shareWithOption(option, selectedPreset)}}
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
              onValueChange={(value) => updateSettings({ [`${activeTarget}_${activeFeature}`]: value })}
              onSlidingStart={() => setIsSliderActive(true)}
              onSlidingComplete={addSnapshotToHistory}
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
          onCancel={() => router.back()}
          onSave={handleSave}
          isSaving={isSaving}
          canUndo={canUndo()}
          canRedo={canRedo()}
          onUndo={undo}
          onRedo={redo}
        />
        
        {Layout.isTablet ? (
          <View style={styles.tabletLayoutContainer}>
            <View style={styles.tabletMainContent}>{MainContent}</View>
            <View style={styles.tabletSidebar}>{Toolbars}</View>
          </View>
        ) : (
          <View style={{ flex: 1, width: '100%' }}>
            {MainContent}
            {Toolbars}
          </View>
        )}
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    width: '100%',
    backgroundColor: Colors.background 
  },
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: Colors.background 
  },
  loadingText: { 
    ...Typography.body, 
    color: Colors.textSecondary, 
    marginTop: Spacing.md 
  },
  previewWrapper: { 
    flex: 1, 
    width: '100%',
    alignSelf: 'stretch',
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: Spacing.sm,
    backgroundColor: Colors.background,
    minHeight: 300,
    minWidth: 200
  },
  toolbarsContainer: { 
    minHeight: 120, 
    width: '100%',
    justifyContent: 'center', 
    backgroundColor: Colors.card 
  },
  
  tabletLayoutContainer: { 
    flex: 1, 
    flexDirection: 'row',
    width: '100%'
  },
  tabletMainContent: { 
    flex: 3, 
    height: '100%', 
    width: '100%'
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

  scrollContent: { 
    paddingHorizontal: Spacing.lg, 
    alignItems: 'center', 
    gap: Spacing.lg, 
    paddingVertical: Spacing.md 
  },
  savePresetButton: { 
    alignItems: 'center', 
    justifyContent: 'center', 
    width: 60, 
    height: 60, 
    borderRadius: BorderRadius.md, 
    backgroundColor: Colors.indigo50, 
    borderWidth: 1, 
    borderColor: Colors.primary, 
    borderStyle: 'dashed' 
  },
  savePresetText: { 
    ...Typography.caption, 
    fontSize: 9, 
    color: Colors.primary, 
    marginTop: Spacing.xs, 
    textAlign: 'center' 
  },
  presetButton: { 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingHorizontal: Spacing.md, 
    height: 60, 
    borderRadius: BorderRadius.md, 
    backgroundColor: Colors.card, 
    borderWidth: 1, 
    borderColor: Colors.border 
  },
  presetText: { 
    ...Typography.captionMedium, 
    color: Colors.textPrimary 
  },
});