// kodlar/app/(tabs)/editor/[photoId].tsx
import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  PanResponder,
  Animated,
  Dimensions,
  Pressable,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Feather } from '@expo/vector-icons';
import { useEditorStore } from '@/stores/useEditorStore';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants';
import { ToastService } from '@/components/Toast/ToastService';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Enhanced settings interface
interface EnhancedSettings {
  // Background settings
  backgroundId: string;
  
  // Photo positioning
  photoX: number;
  photoY: number;
  photoScale: number;
  photoRotation: number;
  
  // Adjustment settings
  exposure: number;      // -100 to +100
  highlights: number;    // -100 to +100
  shadows: number;       // -100 to +100
  brightness: number;    // -100 to +100
  contrast: number;      // -100 to +100
  saturation: number;    // -100 to +100
  vibrance: number;      // -100 to +100
  warmth: number;        // -100 to +100
  tint: number;          // -100 to +100
  clarity: number;       // -100 to +100
  noise: number;         // -100 to +100
  vignette: number;      // -100 to +100
  
  // Crop settings
  cropAspectRatio: string; // 'original', '1:1', '4:3', '16:9', etc.
  cropX: number;
  cropY: number;
  cropWidth: number;
  cropHeight: number;
  
  // Active effect target
  effectTarget: 'photo' | 'background' | 'both';
}

// Default settings
const defaultSettings: EnhancedSettings = {
  backgroundId: 'bg1',
  photoX: 0.5, // Center of screen (0-1)
  photoY: 0.5,
  photoScale: 1.0,
  photoRotation: 0,
  exposure: 0,
  highlights: 0,
  shadows: 0,
  brightness: 0,
  contrast: 0,
  saturation: 0,
  vibrance: 0,
  warmth: 0,
  tint: 0,
  clarity: 0,
  noise: 0,
  vignette: 0,
  cropAspectRatio: 'original',
  cropX: 0,
  cropY: 0,
  cropWidth: 1,
  cropHeight: 1,
  effectTarget: 'photo',
};

// Apple-style slider component (FIXED VERSION)
const AppleSlider = ({
  label,
  value,
  onValueChange,
  icon,
  min = -100,
  max = 100,
  step = 1,
  onReset,
}: {
  label: string;
  value: number;
  onValueChange: (value: number) => void;
  icon: keyof typeof Feather.glyphMap;
  min?: number;
  max?: number;
  step?: number;
  onReset?: () => void;
}) => {
  const [sliderWidth, setSliderWidth] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const position = useRef(new Animated.Value(0)).current;

  // Calculate position based on value
  const calculatePosition = (val: number) => {
    const percentage = (val - min) / (max - min);
    return percentage * sliderWidth;
  };

  // Update position when value or slider width changes
  useEffect(() => {
    if (sliderWidth > 0) {
      const newPosition = calculatePosition(value);
      Animated.timing(position, {
        toValue: newPosition,
        duration: isDragging ? 0 : 150,
        useNativeDriver: false,
      }).start();
    }
  }, [value, sliderWidth, isDragging]);

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      setIsDragging(true);
    },
    onPanResponderMove: (evt) => {
      if (sliderWidth <= 0) return;
      
      const locationX = Math.max(0, Math.min(sliderWidth, evt.nativeEvent.locationX));
      const percentage = locationX / sliderWidth;
      const newValue = min + (percentage * (max - min));
      const steppedValue = Math.round(newValue / step) * step;
      
      onValueChange(steppedValue);
    },
    onPanResponderRelease: () => {
      setIsDragging(false);
    },
  });

  return (
    <View style={styles.sliderContainer}>
      <View style={styles.sliderHeader}>
        <View style={styles.sliderLabelContainer}>
          <Feather name={icon} size={18} color={Colors.textPrimary} />
          <Text style={styles.sliderLabel}>{label}</Text>
        </View>
        <View style={styles.sliderValueContainer}>
          <Text style={[styles.sliderValue, isDragging && styles.sliderValueActive]}>
            {value > 0 ? `+${value}` : value}
          </Text>
          {onReset && value !== 0 && (
            <TouchableOpacity onPress={onReset} style={styles.resetButton}>
              <Feather name="rotate-ccw" size={16} color={Colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      <View
        style={styles.sliderTrackContainer}
        onLayout={(e) => setSliderWidth(e.nativeEvent.layout.width)}
        {...panResponder.panHandlers}
      >
        {/* Track background */}
        <View style={styles.sliderTrack} />
        
        {/* Center mark */}
        <View style={[styles.centerMark, { left: sliderWidth / 2 - 1 }]} />
        
        {/* Active track (left or right of center) */}
        {value !== 0 && (
          <Animated.View
            style={[
              styles.activeTrack,
              {
                left: value > 0 ? sliderWidth / 2 : position,
                width: Math.abs(calculatePosition(value) - sliderWidth / 2),
                backgroundColor: value > 0 ? Colors.primary : Colors.error,
              }
            ]}
          />
        )}
        
        {/* Thumb */}
        <Animated.View
          style={[
            styles.sliderThumb,
            {
              left: position,
              transform: [{ scale: isDragging ? 1.2 : 1 }],
            }
          ]}
        />
      </View>
    </View>
  );
};

// Photo positioning component
const PhotoPositioner = ({ 
  settings, 
  onSettingsChange, 
  imageUri, 
  containerSize 
}: {
  settings: EnhancedSettings;
  onSettingsChange: (newSettings: Partial<EnhancedSettings>) => void;
  imageUri: string;
  containerSize: { width: number; height: number };
}) => {
  const photoSize = containerSize.width * 0.6; // 60% of container width
  
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderMove: (evt, gestureState) => {
      const newX = Math.max(0, Math.min(1, 
        (gestureState.moveX - photoSize/2) / (containerSize.width - photoSize)
      ));
      const newY = Math.max(0, Math.min(1, 
        (gestureState.moveY - photoSize/2) / (containerSize.height - photoSize)
      ));
      
      onSettingsChange({
        photoX: newX,
        photoY: newY,
      });
    },
  });

  return (
    <Animated.View
      style={[
        styles.photoPositioner,
        {
          left: settings.photoX * (containerSize.width - photoSize),
          top: settings.photoY * (containerSize.height - photoSize),
          width: photoSize,
          height: photoSize,
          transform: [
            { scale: settings.photoScale },
            { rotate: `${settings.photoRotation}deg` }
          ],
        }
      ]}
      {...panResponder.panHandlers}
    >
      <Image source={{ uri: imageUri }} style={styles.positionerImage} />
    </Animated.View>
  );
};

// Live preview component with enhanced effects
const LivePreview = ({ 
  photoUri, 
  backgroundUri, 
  settings, 
  style,
  showOriginal = false 
}: {
  photoUri: string;
  backgroundUri?: string;
  settings: EnhancedSettings;
  style: any;
  showOriginal?: boolean;
}) => {
  const getImageStyle = (target: 'photo' | 'background') => {
    if (showOriginal || settings.effectTarget === 'photo' && target === 'background' || 
        settings.effectTarget === 'background' && target === 'photo') {
      return {};
    }

    const applyToTarget = settings.effectTarget === 'both' || settings.effectTarget === target;
    if (!applyToTarget) return {};

    return {
      opacity: Math.max(0.1, Math.min(1, 1 + (settings.brightness / 100))),
      transform: [
        { scale: 1 + (settings.contrast / 200) }
      ],
    };
  };

  return (
    <View style={style}>
      {/* Background */}
      {backgroundUri && (
        <View style={styles.backgroundContainer}>
          <Image
            source={{ uri: backgroundUri }}
            style={[styles.backgroundImage, getImageStyle('background')]}
          />
          {/* Background effects overlay */}
          {!showOriginal && (settings.effectTarget === 'background' || settings.effectTarget === 'both') && (
            <>
              {/* Warmth overlay */}
              {settings.warmth !== 0 && (
                <View
                  style={[
                    StyleSheet.absoluteFillObject,
                    {
                      backgroundColor: settings.warmth > 0 ? '#FFB347' : '#87CEEB',
                      opacity: Math.abs(settings.warmth) / 300,
                    }
                  ]}
                />
              )}
              {/* Saturation overlay */}
              {settings.saturation < -50 && (
                <View
                  style={[
                    StyleSheet.absoluteFillObject,
                    {
                      backgroundColor: '#808080',
                      opacity: Math.abs(settings.saturation + 50) / 150,
                    }
                  ]}
                />
              )}
            </>
          )}
        </View>
      )}
      
      {/* Photo */}
      <View
        style={[
          styles.photoContainer,
          {
            left: `${settings.photoX * 100}%`,
            top: `${settings.photoY * 100}%`,
            transform: [
              { translateX: -50 },
              { translateY: -50 },
              { scale: settings.photoScale },
              { rotate: `${settings.photoRotation}deg` }
            ],
          }
        ]}
      >
        <Image
          source={{ uri: photoUri }}
          style={[styles.photoImage, getImageStyle('photo')]}
        />
        {/* Photo effects overlay */}
        {!showOriginal && (settings.effectTarget === 'photo' || settings.effectTarget === 'both') && (
          <>
            {/* Exposure overlay */}
            {settings.exposure !== 0 && (
              <View
                style={[
                  StyleSheet.absoluteFillObject,
                  {
                    backgroundColor: settings.exposure > 0 ? '#FFFFFF' : '#000000',
                    opacity: Math.abs(settings.exposure) / 300,
                  }
                ]}
              />
            )}
            {/* Highlights/Shadows overlay */}
            {settings.highlights !== 0 && (
              <View
                style={[
                  StyleSheet.absoluteFillObject,
                  {
                    backgroundColor: settings.highlights > 0 ? '#FFFFFF' : '#000000',
                    opacity: Math.abs(settings.highlights) / 400,
                  }
                ]}
              />
            )}
          </>
        )}
      </View>
    </View>
  );
};

// Main component
export default function ModernPhotoEditor() {
  const { t } = useTranslation();
  const { photoId } = useLocalSearchParams<{ photoId: string }>();
  const router = useRouter();
  
  const [currentTool, setCurrentTool] = useState<'adjust' | 'filters' | 'crop'>('adjust');
  const [settings, setSettings] = useState<EnhancedSettings>(defaultSettings);
  const [activeAdjustment, setActiveAdjustment] = useState<string | null>(null);
  const [showOriginal, setShowOriginal] = useState(false);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  const {
    activePhoto,
    backgrounds,
    isLoading,
    isSaving,
    setActivePhotoById,
    fetchBackgrounds,
    saveChanges,
    clearStore,
  } = useEditorStore();

  useEffect(() => {
    if (!photoId) {
      ToastService.show({
        type: 'error',
        text1: t('common.error'),
        text2: "Fotoğraf ID'si bulunamadı.",
      });
      router.back();
      return;
    }

    const loadPhoto = async () => {
      try {
        await setActivePhotoById(photoId);
        await fetchBackgrounds();
      } catch (error: any) {
        ToastService.show({
          type: 'error',
          text1: t('common.error'),
          text2: error.message || 'Fotoğraf yüklenemedi.',
        });
        router.back();
      }
    };

    loadPhoto();
    return () => clearStore();
  }, [photoId]);

  const handleSave = async () => {
    try {
      // Convert our enhanced settings to the format expected by the API
      const apiSettings = {
        backgroundId: settings.backgroundId,
        shadow: settings.shadows / 100,
        lighting: settings.brightness / 100,
        brightness: 1 + (settings.exposure / 100),
        contrast: 1 + (settings.contrast / 100),
        saturation: 1 + (settings.saturation / 100),
        hue: settings.warmth / 100,
        sepia: Math.max(0, settings.warmth / 100),
      };
      
      await saveChanges();
      ToastService.show({
        type: 'success',
        text1: t('common.success'),
        text2: t('editor.saved'),
      });
      router.back();
    } catch (error: any) {
      ToastService.show({
        type: 'error',
        text1: t('common.error'),
        text2: error.message || t('editor.saveFailed'),
      });
    }
  };

  const updateSettings = (newSettings: Partial<EnhancedSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const resetAdjustment = (key: keyof EnhancedSettings) => {
    updateSettings({ [key]: 0 });
  };

  const resetAllAdjustments = () => {
    const resetSettings = { ...defaultSettings };
    resetSettings.backgroundId = settings.backgroundId; // Keep background
    resetSettings.photoX = settings.photoX; // Keep positioning
    resetSettings.photoY = settings.photoY;
    resetSettings.photoScale = settings.photoScale;
    resetSettings.photoRotation = settings.photoRotation;
    setSettings(resetSettings);
  };

  // Adjustment definitions
  const adjustments = [
    { key: 'exposure', label: 'Pozlama', icon: 'sun' as const },
    { key: 'highlights', label: 'Vurgular', icon: 'trending-up' as const },
    { key: 'shadows', label: 'Gölgeler', icon: 'trending-down' as const },
    { key: 'brightness', label: 'Parlaklık', icon: 'circle' as const },
    { key: 'contrast', label: 'Kontrast', icon: 'square' as const },
    { key: 'saturation', label: 'Doygunluk', icon: 'droplet' as const },
    { key: 'vibrance', label: 'Canlılık', icon: 'zap' as const },
    { key: 'warmth', label: 'Sıcaklık', icon: 'thermometer' as const },
    { key: 'tint', label: 'Ton', icon: 'palette' as const },
    { key: 'clarity', label: 'Berraklık', icon: 'aperture' as const },
    { key: 'noise', label: 'Gürültü', icon: 'radio' as const },
    { key: 'vignette', label: 'Vinyet', icon: 'target' as const },
  ];

  const selectedBackground = backgrounds.find(bg => bg.id === settings.backgroundId);

  if (isLoading || !activePhoto) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Navigation */}
      <View style={styles.navigation}>
        <TouchableOpacity onPress={() => router.back()} style={styles.navButton}>
          <Text style={styles.cancelText}>Vazgeç</Text>
        </TouchableOpacity>
        
        <Text style={styles.navTitle}>Düzenle</Text>
        
        <TouchableOpacity onPress={handleSave} style={styles.navButton}>
          <Text style={[styles.doneText, isSaving && styles.doneTextDisabled]}>
            {isSaving ? 'Kaydediyor...' : 'Bitti'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Photo Preview with Hold-to-Compare */}
      <Pressable
        style={styles.previewContainer}
        onPressIn={() => setShowOriginal(true)}
        onPressOut={() => setShowOriginal(false)}
        onLayout={(e) => setContainerSize(e.nativeEvent.layout)}
      >
        <LivePreview
          photoUri={activePhoto.processedImageUrl || activePhoto.originalImageUrl}
          backgroundUri={selectedBackground?.fullUrl}
          settings={settings}
          style={styles.preview}
          showOriginal={showOriginal}
        />
        
        {showOriginal && (
          <View style={styles.originalOverlay}>
            <Text style={styles.originalText}>Orijinal</Text>
          </View>
        )}
      </Pressable>

      {/* Tool Tabs */}
      <View style={styles.toolTabs}>
        <TouchableOpacity
          style={[styles.toolTab, currentTool === 'adjust' && styles.toolTabActive]}
          onPress={() => setCurrentTool('adjust')}
        >
          <Feather 
            name="sliders" 
            size={24} 
            color={currentTool === 'adjust' ? Colors.primary : Colors.textSecondary} 
          />
          <Text style={[styles.toolTabText, currentTool === 'adjust' && styles.toolTabTextActive]}>
            Ayarla
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.toolTab, currentTool === 'filters' && styles.toolTabActive]}
          onPress={() => setCurrentTool('filters')}
        >
          <Feather 
            name="filter" 
            size={24} 
            color={currentTool === 'filters' ? Colors.primary : Colors.textSecondary} 
          />
          <Text style={[styles.toolTabText, currentTool === 'filters' && styles.toolTabTextActive]}>
            Filtreler
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.toolTab, currentTool === 'crop' && styles.toolTabActive]}
          onPress={() => setCurrentTool('crop')}
        >
          <Feather 
            name="crop" 
            size={24} 
            color={currentTool === 'crop' ? Colors.primary : Colors.textSecondary} 
          />
          <Text style={[styles.toolTabText, currentTool === 'crop' && styles.toolTabTextActive]}>
            Kırp
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tool Content */}
      <View style={styles.toolContent}>
        {currentTool === 'adjust' && (
          <ScrollView style={styles.adjustPanel} showsVerticalScrollIndicator={false}>
            {/* Effect Target Selector */}
            <View style={styles.targetSelector}>
              <Text style={styles.sectionTitle}>Etki Hedefi</Text>
              <View style={styles.targetButtons}>
                {[
                  { key: 'photo', label: 'Fotoğraf', icon: 'image' },
                  { key: 'background', label: 'Arka Plan', icon: 'layers' },
                  { key: 'both', label: 'Her İkisi', icon: 'package' },
                ].map((target) => (
                  <TouchableOpacity
                    key={target.key}
                    style={[
                      styles.targetButton,
                      settings.effectTarget === target.key && styles.targetButtonActive
                    ]}
                    onPress={() => updateSettings({ effectTarget: target.key as any })}
                  >
                    <Feather 
                      name={target.icon as any} 
                      size={16} 
                      color={settings.effectTarget === target.key ? Colors.card : Colors.textSecondary} 
                    />
                    <Text style={[
                      styles.targetButtonText,
                      settings.effectTarget === target.key && styles.targetButtonTextActive
                    ]}>
                      {target.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Auto Adjust Button */}
            <TouchableOpacity style={styles.autoButton}>
              <Feather name="zap" size={20} color={Colors.primary} />
              <Text style={styles.autoButtonText}>Otomatik</Text>
            </TouchableOpacity>

            {/* Adjustments */}
            {adjustments.map((adjustment) => (
              <AppleSlider
                key={adjustment.key}
                label={adjustment.label}
                value={settings[adjustment.key as keyof EnhancedSettings] as number}
                onValueChange={(value) => updateSettings({ [adjustment.key]: value })}
                icon={adjustment.icon}
                onReset={() => resetAdjustment(adjustment.key as keyof EnhancedSettings)}
              />
            ))}

            {/* Reset All Button */}
            <TouchableOpacity onPress={resetAllAdjustments} style={styles.resetAllButton}>
              <Text style={styles.resetAllButtonText}>Tüm Ayarları Sıfırla</Text>
            </TouchableOpacity>
          </ScrollView>
        )}

        {currentTool === 'filters' && (
          <ScrollView style={styles.filtersPanel} showsVerticalScrollIndicator={false}>
            {/* Background Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Arka Planlar</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.backgroundsContainer}
              >
                {backgrounds.map((bg) => (
                  <TouchableOpacity
                    key={bg.id}
                    onPress={() => updateSettings({ backgroundId: bg.id })}
                    style={[
                      styles.backgroundThumbnail,
                      settings.backgroundId === bg.id && styles.backgroundThumbnailSelected
                    ]}
                  >
                    <Image source={{ uri: bg.thumbnailUrl }} style={styles.backgroundImage} />
                    {settings.backgroundId === bg.id && (
                      <View style={styles.backgroundSelectedOverlay}>
                        <Feather name="check" size={16} color="white" />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Position Controls */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Konum ve Boyut</Text>
              <View style={styles.positionControls}>
                <AppleSlider
                  label="Ölçek"
                  value={Math.round((settings.photoScale - 0.5) * 100)}
                  onValueChange={(value) => updateSettings({ photoScale: 0.5 + (value / 100) })}
                  icon="maximize-2"
                  min={-50}
                  max={50}
                  onReset={() => updateSettings({ photoScale: 1.0 })}
                />
                <AppleSlider
                  label="Döndürme"
                  value={settings.photoRotation}
                  onValueChange={(value) => updateSettings({ photoRotation: value })}
                  icon="rotate-cw"
                  min={-180}
                  max={180}
                  onReset={() => updateSettings({ photoRotation: 0 })}
                />
              </View>
            </View>

            {/* Preset Filters */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Hazır Filtreler</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filtersContainer}
              >
                {[
                  { 
                    name: 'Orijinal', 
                    color: '#F0F0F0',
                    settings: { exposure: 0, contrast: 0, saturation: 0, warmth: 0 }
                  },
                  { 
                    name: 'Canlı', 
                    color: '#FF6B6B',
                    settings: { saturation: 30, vibrance: 20, warmth: 10 }
                  },
                  { 
                    name: 'Drama', 
                    color: '#4ECDC4',
                    settings: { contrast: 40, highlights: -20, shadows: 20 }
                  },
                  { 
                    name: 'Mono', 
                    color: '#888',
                    settings: { saturation: -100, contrast: 20 }
                  },
                  { 
                    name: 'Vintage', 
                    color: '#D2B48C',
                    settings: { warmth: 40, contrast: -10, vignette: 30 }
                  },
                  { 
                    name: 'Soğuk', 
                    color: '#4A90E2',
                    settings: { warmth: -30, tint: -20, saturation: 10 }
                  },
                ].map((filter) => (
                  <TouchableOpacity 
                    key={filter.name}
                    style={styles.filterPreset}
                    onPress={() => updateSettings(filter.settings)}
                  >
                    <View style={[styles.filterPreview, { backgroundColor: filter.color }]} />
                    <Text style={styles.filterLabel}>{filter.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </ScrollView>
        )}

        {currentTool === 'crop' && (
          <View style={styles.cropPanel}>
            <Text style={styles.sectionTitle}>Kırp & Döndür</Text>
            
            {/* Aspect Ratio Buttons */}
            <View style={styles.aspectRatioContainer}>
              {[
                { key: 'original', label: 'Orijinal' },
                { key: '1:1', label: '1:1' },
                { key: '4:3', label: '4:3' },
                { key: '16:9', label: '16:9' },
                { key: '3:4', label: '3:4' },
                { key: '9:16', label: '9:16' },
              ].map((ratio) => (
                <TouchableOpacity
                  key={ratio.key}
                  style={[
                    styles.aspectRatioButton,
                    settings.cropAspectRatio === ratio.key && styles.aspectRatioButtonActive
                  ]}
                  onPress={() => updateSettings({ cropAspectRatio: ratio.key })}
                >
                  <Text style={[
                    styles.aspectRatioButtonText,
                    settings.cropAspectRatio === ratio.key && styles.aspectRatioButtonTextActive
                  ]}>
                    {ratio.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Crop Tools */}
            <View style={styles.cropTools}>
              <TouchableOpacity style={styles.cropTool}>
                <Feather name="rotate-ccw" size={24} color={Colors.textPrimary} />
                <Text style={styles.cropToolText}>Döndür</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.cropTool}>
                <Feather name="flip-horizontal" size={24} color={Colors.textPrimary} />
                <Text style={styles.cropToolText}>Aynala</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.cropTool}>
                <Feather name="maximize" size={24} color={Colors.textPrimary} />
                <Text style={styles.cropToolText}>Düzelt</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.comingSoonText}>
              Gelişmiş kırpma araçları yakında aktif olacak
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

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

  // Navigation
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  navButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    minWidth: 70,
  },
  navTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  cancelText: {
    fontSize: 16,
    color: Colors.primary,
  },
  doneText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
    textAlign: 'right',
  },
  doneTextDisabled: {
    opacity: 0.5,
  },

  // Preview
  previewContainer: {
    flex: 1,
    backgroundColor: Colors.gray50,
    position: 'relative',
  },
  preview: {
    flex: 1,
    position: 'relative',
  },
  backgroundContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  photoContainer: {
    position: 'absolute',
    width: '60%',
    aspectRatio: 1,
  },
  photoImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  photoPositioner: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: 8,
  },
  positionerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
    borderRadius: 6,
  },
  originalOverlay: {
    position: 'absolute',
    top: 20,
    left: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  originalText: {
    color: Colors.card,
    fontSize: 14,
    fontWeight: '600',
  },

  // Tool Tabs
  toolTabs: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  toolTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  toolTabActive: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
  },
  toolTabText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
    fontWeight: '500',
  },
  toolTabTextActive: {
    color: Colors.primary,
    fontWeight: '600',
  },

  // Tool Content
  toolContent: {
    height: 350,
    backgroundColor: Colors.card,
  },

  // Adjust Panel
  adjustPanel: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  targetSelector: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  targetButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  targetButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: Colors.gray100,
    borderRadius: 8,
    gap: 6,
  },
  targetButtonActive: {
    backgroundColor: Colors.primary,
  },
  targetButtonText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  targetButtonTextActive: {
    color: Colors.card,
  },
  autoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.gray100,
    borderRadius: 8,
    marginBottom: 24,
    gap: 8,
  },
  autoButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },

  // Slider Components
  sliderContainer: {
    marginBottom: 20,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sliderLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sliderLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  sliderValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sliderValue: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: '500',
    minWidth: 40,
    textAlign: 'right',
  },
  sliderValueActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  resetButton: {
    padding: 4,
  },
  sliderTrackContainer: {
    height: 44,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  sliderTrack: {
    height: 3,
    backgroundColor: Colors.border,
    borderRadius: 1.5,
    position: 'absolute',
    width: '100%',
  },
  centerMark: {
    position: 'absolute',
    width: 2,
    height: 16,
    backgroundColor: Colors.textSecondary,
    borderRadius: 1,
    top: 14,
  },
  activeTrack: {
    height: 3,
    borderRadius: 1.5,
    position: 'absolute',
    top: 20.5,
  },
  sliderThumb: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.card,
    position: 'absolute',
    marginLeft: -14,
    top: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    shadowOpacity: 0.2,
    elevation: 4,
    borderWidth: 3,
    borderColor: Colors.primary,
  },
  resetAllButton: {
    marginTop: 20,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: Colors.gray100,
    borderRadius: 8,
  },
  resetAllButtonText: {
    fontSize: 16,
    color: Colors.error,
    fontWeight: '600',
  },

  // Filters Panel
  filtersPanel: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  section: {
    marginBottom: 24,
  },
  backgroundsContainer: {
    gap: 12,
    paddingHorizontal: 4,
  },
  backgroundThumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  backgroundThumbnailSelected: {
    borderWidth: 3,
    borderColor: Colors.primary,
  },
  backgroundSelectedOverlay: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  positionControls: {
    gap: 16,
  },
  filtersContainer: {
    gap: 16,
    paddingHorizontal: 4,
  },
  filterPreset: {
    alignItems: 'center',
    width: 80,
  },
  filterPreview: {
    width: 70,
    height: 70,
    borderRadius: 8,
    marginBottom: 8,
  },
  filterLabel: {
    fontSize: 12,
    color: Colors.textPrimary,
    textAlign: 'center',
    fontWeight: '500',
  },

  // Crop Panel
  cropPanel: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  aspectRatioContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  aspectRatioButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.gray100,
    borderRadius: 20,
  },
  aspectRatioButtonActive: {
    backgroundColor: Colors.primary,
  },
  aspectRatioButtonText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  aspectRatioButtonTextActive: {
    color: Colors.card,
  },
  cropTools: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  cropTool: {
    alignItems: 'center',
    padding: 16,
  },
  cropToolText: {
    fontSize: 12,
    color: Colors.textPrimary,
    marginTop: 8,
    fontWeight: '500',
  },
  comingSoonText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});