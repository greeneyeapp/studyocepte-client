import React, { useEffect, useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Pressable,
  Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Feather } from '@expo/vector-icons';
import { useEditorStore } from '@/stores/useEditorStore';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants';
import { ToastService } from '@/components/Toast/ToastService';
import { Layout } from '@/constants/Layout';

// Gesture handler ve Reanimated
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  runOnJS,
  withSpring,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';

// React Native Community Slider kullanıyoruz
import Slider from '@react-native-community/slider';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// =================================================================
// Temiz Feature Button Component - Value ikonu yerine geçer
// =================================================================
const FeatureButton = ({ 
  icon, 
  label, 
  value, 
  isActive, 
  onPress 
}) => (
  <TouchableOpacity 
    style={[styles.featureButton, isActive && styles.featureButtonActive]} 
    onPress={onPress}
  >
    <View style={[styles.iconContainer, value !== 0 && styles.iconContainerActive]}>
      {value !== 0 ? (
        <Text style={styles.valueText}>
          {value > 0 ? `+${value}` : `${value}`}
        </Text>
      ) : (
        <Feather 
          name={icon} 
          size={18} 
          color={isActive ? Colors.card : Colors.textPrimary} 
        />
      )}
    </View>
    <Text style={[styles.featureLabel, isActive && styles.featureLabelActive]}>
      {label}
    </Text>
  </TouchableOpacity>
);

// =================================================================
// Background Button Component
// =================================================================
const BackgroundButton = ({ backgroundUri, isSelected, onPress }) => (
  <TouchableOpacity 
    style={[styles.backgroundButton, isSelected && styles.backgroundButtonSelected]} 
    onPress={onPress}
  >
    <Image source={{ uri: backgroundUri }} style={styles.backgroundImage} />
  </TouchableOpacity>
);

// =================================================================
// Filter Preview Component - Background + Photo'ya filtre uygular
// =================================================================
const FilterPreview = ({ 
  imageUri, 
  backgroundUri, 
  filterName,
  filterSettings,
  isSelected, 
  onPress 
}) => (
  <TouchableOpacity 
    style={[styles.filterPreview, isSelected && styles.filterPreviewSelected]} 
    onPress={onPress}
  >
    <View style={[styles.filterImageContainer, getFilterStyle(filterSettings)]}>
      {/* Background + Photo combined with filter */}
      <Image source={{ uri: backgroundUri }} style={styles.filterBg} />
      <View style={styles.filterPhotoContainer}>
        <Image source={{ uri: imageUri }} style={styles.filterImage} />
      </View>
      
      {/* Combined filter overlays */}
      {filterSettings?.warmth > 0 && (
        <View style={[
          styles.previewWarmOverlay, 
          { opacity: Math.min(0.4, filterSettings.warmth / 150) }
        ]} />
      )}
      
      {filterSettings?.warmth < 0 && (
        <View style={[
          styles.previewCoolOverlay, 
          { opacity: Math.min(0.4, Math.abs(filterSettings.warmth) / 150) }
        ]} />
      )}
      
      {filterSettings?.saturation < -50 && (
        <View style={[
          styles.previewMonoOverlay,
          { opacity: Math.abs(filterSettings.saturation + 50) / 100 }
        ]} />
      )}
    </View>
    <Text style={[styles.filterLabel, isSelected && styles.filterLabelSelected]}>
      {filterName}
    </Text>
  </TouchableOpacity>
);

// =================================================================
// Filtre stillerini hesaplayan yardımcı fonksiyon
// =================================================================
const getFilterStyle = (filterSettings) => {
  if (!filterSettings) return {};
  
  const styles = {};
  
  // Brightness - opacity ile
  if (filterSettings.brightness) {
    styles.opacity = Math.max(0.3, Math.min(2, 1 + filterSettings.brightness / 100));
  }
  
  return styles;
};

// =================================================================
// Ana Final Apple Photos Editör
// =================================================================
export default function FinalApplePhotosEditor() {
  const { t } = useTranslation();
  const { photoId } = useLocalSearchParams<{ photoId: string }>();
  const router = useRouter();
  
  const [currentTool, setCurrentTool] = useState<'adjust' | 'filters' | 'background' | 'crop'>('adjust');
  const [activeFeature, setActiveFeature] = useState<string | null>(null);
  const [isSliderActive, setIsSliderActive] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const [previewSize, setPreviewSize] = useState({ width: 0, height: 0 });
  
  // ScrollView pozisyonunu korumak için
  const scrollViewRef = useRef(null);
  const [scrollPosition, setScrollPosition] = useState(0);

  const {
    activePhoto, backgrounds, isLoading, isSaving, settings,
    setActivePhotoById, fetchBackgrounds, updateSettings, saveChanges, 
    clearStore, resetToDefaults, applyPresetFilter,
  } = useEditorStore();

  // Fotoğraf transformasyon değerleri
  const photoX = useSharedValue(0);
  const photoY = useSharedValue(0);
  const photoScale = useSharedValue(1);
  const photoRotation = useSharedValue(0);

  // Store'dan gelen değerleri shared values'a aktar
  useEffect(() => {
    if (previewSize.width > 0 && previewSize.height > 0) {
      photoX.value = withSpring((settings.photoX - 0.5) * previewSize.width);
      photoY.value = withSpring((settings.photoY - 0.5) * previewSize.height);
      photoScale.value = withSpring(settings.photoScale);
      photoRotation.value = withSpring(settings.photoRotation);
    }
  }, [settings.photoX, settings.photoY, settings.photoScale, settings.photoRotation, previewSize]);

  // Bileşen mount/unmount
  useEffect(() => {
    if (photoId) {
      setActivePhotoById(photoId);
      fetchBackgrounds();
    }
    return () => clearStore();
  }, [photoId]);

  // ScrollView pozisyonunu koru
  useEffect(() => {
    if (scrollViewRef.current && !isSliderActive) {
      scrollViewRef.current.scrollTo({ x: scrollPosition, animated: false });
    }
  }, [activeFeature, isSliderActive]);

  // =================================================================
  // Feature Definitions
  // =================================================================
  const adjustFeatures = useMemo(() => [
    { key: 'exposure', label: 'Pozlama', icon: 'sun' as const },
    { key: 'brightness', label: 'Parlaklık', icon: 'circle' as const },
    { key: 'highlights', label: 'Vurgular', icon: 'trending-up' as const },
    { key: 'shadows', label: 'Gölgeler', icon: 'trending-down' as const },
    { key: 'contrast', label: 'Kontrast', icon: 'bar-chart-2' as const },
    { key: 'saturation', label: 'Doygunluk', icon: 'droplet' as const },
    { key: 'vibrance', label: 'Titreşim', icon: 'zap' as const },
    { key: 'warmth', label: 'Sıcaklık', icon: 'thermometer' as const },
    { key: 'clarity', label: 'Netlik', icon: 'aperture' as const },
    { key: 'vignette', label: 'Vinyet', icon: 'target' as const },
  ], []);

  const filterPresets = useMemo(() => [
    { key: 'original', name: 'Orijinal', settings: {} },
    { key: 'vivid', name: 'Canlı', settings: { saturation: 30, vibrance: 20, warmth: 10, brightness: 5 } },
    { key: 'dramatic', name: 'Dramatik', settings: { contrast: 40, highlights: -20, shadows: 20, clarity: 15 } },
    { key: 'mono', name: 'Mono', settings: { saturation: -100, contrast: 20, clarity: 10 } },
    { key: 'vintage', name: 'Vintage', settings: { warmth: 40, contrast: -10, vignette: 30, saturation: -20 } },
    { key: 'cool', name: 'Soğuk', settings: { warmth: -30, saturation: 10, brightness: 5 } },
    { key: 'warm', name: 'Sıcak', settings: { warmth: 25, exposure: 5, brightness: 10 } },
    { key: 'cinema', name: 'Sinema', settings: { contrast: 30, shadows: 25, vignette: 20, saturation: -5 } },
    { key: 'bright', name: 'Parlak', settings: { exposure: 20, highlights: 15, vibrance: 15, brightness: 15 } },
  ], []);

  // Her açılışta ayarları sıfırla
  useEffect(() => {
    if (photoId && activePhoto) {
      resetToDefaults();
    }
  }, [photoId, activePhoto]);

  // Mevcut filtre state
  const [currentFilter, setCurrentFilter] = useState('original');

  const cropFeatures = useMemo(() => [
    { key: 'straighten', label: 'Düzelt', icon: 'rotate-cw' as const },
    { key: 'vertical', label: 'Dikey', icon: 'maximize-2' as const },
    { key: 'horizontal', label: 'Yatay', icon: 'minimize-2' as const },
  ], []);

  // =================================================================
  // Gesture Handler'lar
  // =================================================================
  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      photoX.value = (settings.photoX - 0.5) * previewSize.width + event.translationX;
      photoY.value = (settings.photoY - 0.5) * previewSize.height + event.translationY;
    })
    .onEnd(() => {
      const newX = photoX.value / previewSize.width + 0.5;
      const newY = photoY.value / previewSize.height + 0.5;
      runOnJS(updateSettings)({ 
        photoX: Math.max(0, Math.min(1, newX)), 
        photoY: Math.max(0, Math.min(1, newY))
      });
    });

  const pinchGesture = Gesture.Pinch()
    .onUpdate((event) => {
      photoScale.value = Math.max(0.1, Math.min(5, settings.photoScale * event.scale));
    })
    .onEnd(() => {
      runOnJS(updateSettings)({ photoScale: photoScale.value });
    });

  const rotateGesture = Gesture.Rotation()
    .onUpdate((event) => {
      photoRotation.value = settings.photoRotation + (event.rotation * 180 / Math.PI);
    })
    .onEnd(() => {
      runOnJS(updateSettings)({ photoRotation: photoRotation.value });
    });

  const combinedGesture = Gesture.Simultaneous(panGesture, pinchGesture, rotateGesture);

  // Combine edilmiş görüntü stili - background + photo + filters
  const combinedImageStyle = useAnimatedStyle(() => {
    // Parlaklık düzeltmesi: pozitif değerler parlaklaştırır, negatif koyulaştırır
    const brightnessOpacity = interpolate(
      settings.brightness,
      [-100, 0, 100],
      [0.3, 1, 2],  // Düzeltildi: pozitif değerler daha parlak yapar
      Extrapolate.CLAMP
    );

    const contrastScale = interpolate(
      settings.contrast,
      [-100, 0, 100],
      [0.8, 1, 1.2],  // Daha yumuşak contrast
      Extrapolate.CLAMP
    );

    return {
      opacity: brightnessOpacity,
      transform: [
        { translateX: photoX.value },
        { translateY: photoY.value },
        { scale: photoScale.value },
        { rotate: `${photoRotation.value}deg` },
      ],
    };
  });

  // =================================================================
  // UI Fonksiyonları
  // =================================================================
  const handleSave = async () => {
    try {
      await saveChanges();
      ToastService.show({ type: 'success', text1: t('common.success'), text2: 'Değişiklikler kaydedildi.' });
      router.back();
    } catch (error: any) {
      ToastService.show({ type: 'error', text1: t('common.error'), text2: error.message });
    }
  };

  const handleFeaturePress = (featureKey: string) => {
    setActiveFeature(featureKey);
  };

  const handleSliderChange = (value: number) => {
    if (activeFeature) {
      updateSettings({ [activeFeature]: value });
    }
  };

  const handleScrollMomentumEnd = (event) => {
    setScrollPosition(event.nativeEvent.contentOffset.x);
  };

  const getCurrentFeatureValue = () => {
    if (!activeFeature) return 0;
    return settings[activeFeature] || 0;
  };

  const getCurrentFeatureLabel = () => {
    if (!activeFeature) return '';
    const feature = adjustFeatures.find(f => f.key === activeFeature) ||
                   cropFeatures.find(f => f.key === activeFeature);
    return feature?.label || '';
  };

  // Loading durumu
  if (isLoading || !activePhoto) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Fotoğraf yükleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const selectedBackground = backgrounds.find(bg => bg.id === settings.backgroundId);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        {/* Minimal Üst Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.topBarText}>{t('common.cancel')}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSave} disabled={isSaving}>
            <Text style={[styles.topBarText, styles.topBarTextDone]}>
              {isSaving ? t('common.saving') : t('common.done')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* BÜYÜK Önizleme Alanı - Combined Image */}
        <View style={styles.previewContainer}>
          <Pressable
            style={{ flex: 1 }}
            onPressIn={() => setShowOriginal(true)}
            onPressOut={() => setShowOriginal(false)}
            onLayout={(e) => setPreviewSize(e.nativeEvent.layout)}
          >
            {previewSize.width > 0 && (
              <View style={styles.preview}>
                <GestureDetector gesture={combinedGesture}>
                  <View style={styles.combinedImageContainer}>
                    {/* Arka Plan - Tam kaplar */}
                    {selectedBackground && (
                      <Image 
                        source={{ uri: selectedBackground.fullUrl }} 
                        style={styles.backgroundImageFixed}
                      />
                    )}
                    
                    {/* Fotoğraf Container - Tam ekranı kaplar, ama foto küçük */}
                    <Animated.View style={[styles.photoAnimatedContainer, combinedImageStyle]}>
                      <Image
                        source={{ uri: activePhoto.processedImageUrl }}
                        style={styles.photoImageFixed}
                        resizeMode="contain"
                      />
                    </Animated.View>
                    
                    {/* Kombinasyon Filtre Overlay'leri - Tam ekranı kaplar */}
                    {settings.warmth > 0 && (
                      <View style={[
                        styles.combinedWarmOverlay, 
                        { opacity: Math.min(0.4, settings.warmth / 150) }
                      ]} />
                    )}
                    
                    {settings.warmth < 0 && (
                      <View style={[
                        styles.combinedCoolOverlay, 
                        { opacity: Math.min(0.4, Math.abs(settings.warmth) / 150) }
                      ]} />
                    )}
                    
                    {settings.vignette > 0 && (
                      <View style={[
                        styles.combinedVignetteOverlay,
                        { 
                          opacity: Math.min(1, settings.vignette / 100),
                          borderWidth: Math.max(5, Math.min(20, settings.vignette * 0.2)), // Dynamic border width
                          borderRadius: Math.max(10, Math.min(30, settings.vignette * 0.3)), // Dynamic radius
                        }
                      ]} />
                    )}
                    
                    {settings.saturation < -50 && (
                      <View style={[
                        styles.monoOverlay,
                        { opacity: Math.abs(settings.saturation + 50) / 100 }
                      ]} />
                    )}
                  </View>
                </GestureDetector>
                
                {showOriginal && (
                  <View style={styles.originalOverlay}>
                    <Text style={styles.originalText}>Orijinal</Text>
                  </View>
                )}
              </View>
            )}
          </Pressable>
        </View>

        {/* Alt Kontrol Paneli */}
        <View style={styles.controlPanel}>
          {/* Horizontal Scrollable Features */}
          {!isSliderActive && (
            <ScrollView 
              ref={scrollViewRef}
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.featuresScrollContainer}
              style={styles.featuresScroll}
              onMomentumScrollEnd={handleScrollMomentumEnd}
            >
              {currentTool === 'adjust' && (
                <>
                  {adjustFeatures.map((feature) => (
                    <FeatureButton
                      key={feature.key}
                      icon={feature.icon}
                      label={feature.label}
                      value={settings[feature.key]}
                      isActive={activeFeature === feature.key}
                      onPress={() => handleFeaturePress(feature.key)}
                    />
                  ))}
                </>
              )}
              
              {currentTool === 'filters' && (
                <>
                  {filterPresets.map((preset) => (
                    <FilterPreview
                      key={preset.key}
                      imageUri={activePhoto.processedImageUrl}
                      backgroundUri={selectedBackground?.fullUrl}
                      filterName={preset.name}
                      filterSettings={preset.settings}
                      isSelected={currentFilter === preset.key}
                      onPress={() => {
                        setCurrentFilter(preset.key);
                        // Filtreleri mevcut ayarların üzerine EKLE, değiştirme
                        if (preset.settings && Object.keys(preset.settings).length > 0) {
                          const newSettings = { ...preset.settings };
                          // Mevcut kullanıcı ayarlarını koru, sadece filtre ayarlarını ekle
                          updateSettings(newSettings);
                        } else {
                          // Original filtresi - sadece filtre ayarlarını sıfırla
                          resetToDefaults();
                        }
                      }}
                    />
                  ))}
                </>
              )}
              
              {currentTool === 'background' && (
                <>
                  {backgrounds.length > 0 ? backgrounds.map((bg) => (
                    <BackgroundButton
                      key={bg.id}
                      backgroundUri={bg.thumbnailUrl}
                      isSelected={settings.backgroundId === bg.id}
                      onPress={() => updateSettings({ backgroundId: bg.id })}
                    />
                  )) : (
                    <View style={styles.loadingBackgrounds}>
                      <ActivityIndicator size="small" color={Colors.primary} />
                      <Text style={styles.loadingText}>Arka planlar yükleniyor...</Text>
                    </View>
                  )}
                </>
              )}
              
              {currentTool === 'crop' && (
                <>
                  {cropFeatures.map((feature) => (
                    <FeatureButton
                      key={feature.key}
                      icon={feature.icon}
                      label={feature.label}
                      value={settings[feature.key] || 0}
                      isActive={activeFeature === feature.key}
                      onPress={() => handleFeaturePress(feature.key)}
                    />
                  ))}
                </>
              )}
            </ScrollView>
          )}

          {/* Aktif Özellik Değeri */}
          {isSliderActive && activeFeature && (
            <View style={styles.activeFeatureContainer}>
              <Text style={styles.activeFeatureLabel}>{getCurrentFeatureLabel()}</Text>
              <Text style={styles.activeFeatureValue}>
                {getCurrentFeatureValue() > 0 ? `+${getCurrentFeatureValue()}` : getCurrentFeatureValue()}
              </Text>
            </View>
          )}

          {/* Hazır React Native Community Slider */}
          {activeFeature && (
            <View style={styles.sliderContainer}>
              <Slider
                style={styles.slider}
                minimumValue={-100}
                maximumValue={100}
                value={getCurrentFeatureValue()}
                onValueChange={handleSliderChange}
                onSlidingStart={() => setIsSliderActive(true)}
                onSlidingComplete={() => setIsSliderActive(false)}
                minimumTrackTintColor={Colors.primary}
                maximumTrackTintColor={Colors.gray200}
                thumbStyle={styles.sliderThumb}
                trackStyle={styles.sliderTrack}
                step={1}
              />
            </View>
          )}

          {/* Alt Araç Seçimi - Background Eklendi */}
          <View style={styles.toolSelector}>
            {[
              { key: 'adjust', icon: 'sliders', label: 'Ayarla' },
              { key: 'filters', icon: 'filter', label: 'Filtreler' },
              { key: 'background', icon: 'image', label: 'Arka Plan' },
              { key: 'crop', icon: 'crop', label: 'Kırp' },
            ].map((tool) => (
              <TouchableOpacity
                key={tool.key}
                style={[styles.toolButton, currentTool === tool.key && styles.toolButtonActive]}
                onPress={() => {
                  setCurrentTool(tool.key as any);
                  setActiveFeature(null);
                }}
              >
                <Feather
                  name={tool.icon as any}
                  size={20}
                  color={currentTool === tool.key ? Colors.primary : Colors.textSecondary}
                />
                <Text style={[
                  styles.toolButtonText,
                  currentTool === tool.key && styles.toolButtonTextActive
                ]}>
                  {tool.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

// =================================================================
// Final Stiller
// =================================================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: Colors.textSecondary,
  },
  
  // Top Bar
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: Colors.card,
  },
  topBarText: {
    fontSize: 17,
    color: Colors.primary,
  },
  topBarTextDone: {
    fontWeight: '600',
  },
  
  // Preview - Combined Image
  previewContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    margin: 8,
    borderRadius: 16,
    overflow: 'hidden',
  },
  preview: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent', // Gri çerçeve çıkmasın
    padding: 4, // Çok küçük padding
  },
  combinedImageContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'transparent', // Çerçeve çıkmasın diye
  },
  backgroundImageFixed: {
    ...StyleSheet.absoluteFillObject,
    resizeMode: 'cover',
  },
  photoAnimatedContainer: {
    ...StyleSheet.absoluteFillObject, // Padding'i kaldırdık
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent', // Çerçeve çıkmasın
  },
  photoImageFixed: {
    width: '80%', // Fotoğrafın boyutunu sabitledik
    height: '80%',
    resizeMode: 'contain',
  },
  
  // Combined Filters - tüm görüntüye uygulanır
  combinedWarmOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 180, 80, 0.4)',
  },
  combinedCoolOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(80, 140, 255, 0.4)',
  },
  combinedVignetteOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    borderColor: 'rgba(0,0,0,0.9)', // Daha koyu siyah
    // borderWidth ve borderRadius artık dinamik - style içinde set edilecek
  },
  monoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(128,128,128,0.6)',
    mixBlendMode: 'saturation', // React Native'de çalışmayabilir ama deniyoruz
  },
  
  originalOverlay: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
  },
  originalText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  
  // Control Panel
  controlPanel: {
    backgroundColor: Colors.card,
    paddingTop: 16,
    paddingBottom: 8,
  },
  
  // Horizontal Features Scroll
  featuresScroll: {
    maxHeight: 90,
    marginBottom: 16,
  },
  featuresScrollContainer: {
    paddingHorizontal: 16,
    gap: 20,
  },
  
  // Feature Button - Value gösterir
  featureButton: {
    alignItems: 'center',
  },
  featureButtonActive: {
    // Aktif state
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconContainerActive: {
    backgroundColor: Colors.primary,
  },
  valueText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.card,
    textAlign: 'center',
  },
  featureLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
    maxWidth: 60,
  },
  featureLabelActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  
  // Background Button
  backgroundButton: {
    width: 60,
    height: 60,
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  backgroundButtonSelected: {
    borderColor: Colors.primary,
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  loadingBackgrounds: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    marginLeft: 10,
    color: Colors.textSecondary,
    fontSize: 12,
  },
  
  // Active Feature Display
  activeFeatureContainer: {
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  activeFeatureLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  activeFeatureValue: {
    fontSize: 28,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  
  // React Native Community Slider
  sliderContainer: {
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderThumb: {
    backgroundColor: Colors.card,
    borderWidth: 2,
    borderColor: Colors.primary,
    width: 24,
    height: 24,
  },
  sliderTrack: {
    height: 4,
    borderRadius: 2,
  },
  
  // Filter Preview
  filterPreview: {
    alignItems: 'center',
    marginRight: 20,
  },
  filterPreviewSelected: {
    // Seçili state - border eklenir
  },
  filterImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: Colors.gray100,
    marginBottom: 8,
    position: 'relative',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  filterBg: {
    ...StyleSheet.absoluteFillObject,
    resizeMode: 'cover',
  },
  filterPhotoContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  filterImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  // Filter preview overlays
  previewWarmOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 180, 80, 0.4)',
  },
  previewCoolOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(80, 140, 255, 0.4)',
  },
  previewMonoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(128,128,128,0.6)',
  },
  filterLabel: {
    fontSize: 11,
    color: Colors.textPrimary,
    textAlign: 'center',
    fontWeight: '500',
    maxWidth: 60,
  },
  filterLabelSelected: {
    color: Colors.primary,
    fontWeight: '600',
  },
  
  // Tool Selector
  toolSelector: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 0.5,
    borderTopColor: Colors.border,
    backgroundColor: Colors.card,
  },
  toolButton: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  toolButtonActive: {
    backgroundColor: Colors.primary + '15',
  },
  toolButtonText: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginTop: 4,
    fontWeight: '500',
  },
  toolButtonTextActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
});