// kodlar/app/(tabs)/editor/[photoId].tsx
import React, { useEffect, useState } from 'react';
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
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Feather } from '@expo/vector-icons';
import { useEditorStore } from '@/stores/useEditorStore';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants';
import { ToastService } from '@/components/Toast/ToastService';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Real-time image filter component
const LiveFilteredImage = ({ 
  imageUri, 
  settings, 
  style 
}: { 
  imageUri: string;
  settings: any;
  style: any;
}) => {
  return (
    <View style={style}>
      <Image
        source={{ uri: imageUri }}
        style={[
          StyleSheet.absoluteFillObject,
          {
            opacity: Math.max(0.2, Math.min(2, settings.brightness || 1)),
            transform: [
              { 
                scale: settings.contrast ? 0.8 + (settings.contrast * 0.4) : 1 
              }
            ]
          }
        ]}
        resizeMode="contain"
      />
      
      {/* Brightness overlay */}
      {settings.brightness !== 1 && (
        <View
          style={[
            StyleSheet.absoluteFillObject,
            {
              backgroundColor: settings.brightness > 1 ? '#FFFFFF' : '#000000',
              opacity: Math.abs(settings.brightness - 1) * 0.5,
            }
          ]}
        />
      )}
      
      {/* Contrast overlay */}
      {settings.contrast !== 1 && (
        <View
          style={[
            StyleSheet.absoluteFillObject,
            {
              backgroundColor: settings.contrast > 1 ? '#000000' : '#FFFFFF',
              opacity: Math.abs(settings.contrast - 1) * 0.3,
            }
          ]}
        />
      )}
      
      {/* Saturation - Black & White */}
      {settings.saturation <= 0.1 && (
        <View
          style={[
            StyleSheet.absoluteFillObject,
            {
              backgroundColor: '#808080',
              opacity: 0.7,
            }
          ]}
        />
      )}
      
      {/* Sepia effect */}
      {settings.sepia > 0 && (
        <View
          style={[
            StyleSheet.absoluteFillObject,
            {
              backgroundColor: '#DEB887',
              opacity: settings.sepia * 0.6,
            }
          ]}
        />
      )}
      
      {/* Temperature/Hue effect */}
      {settings.hue !== 0 && (
        <View
          style={[
            StyleSheet.absoluteFillObject,
            {
              backgroundColor: settings.hue > 0 ? '#FFB347' : '#87CEEB',
              opacity: Math.abs(settings.hue) * 0.4,
            }
          ]}
        />
      )}
    </View>
  );
};

// Apple-style adjustment slider
const AppleAdjustmentSlider = ({
  label,
  value,
  min,
  max,
  defaultValue,
  onValueChange,
  icon
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  defaultValue: number;
  onValueChange: (value: number) => void;
  icon: keyof typeof Feather.glyphMap;
}) => {
  const [sliderWidth, setSliderWidth] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  
  const safeValue = typeof value === 'number' && !isNaN(value) ? value : defaultValue;
  
  // Convert to -50 to +50 display range
  const range = max - min;
  const normalizedValue = ((safeValue - min) / range) * 100;
  const displayValue = Math.round(normalizedValue - 50);
  
  const position = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (sliderWidth > 0) {
      const newPosition = (normalizedValue / 100) * sliderWidth;
      Animated.timing(position, {
        toValue: Math.max(0, Math.min(sliderWidth, newPosition)),
        duration: isDragging ? 0 : 200,
        useNativeDriver: false,
      }).start();
    }
  }, [normalizedValue, sliderWidth, isDragging]);

  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => setIsDragging(true),
      onPanResponderMove: (evt) => {
        if (sliderWidth <= 0) return;
        
        const newPosition = Math.max(0, Math.min(sliderWidth, evt.nativeEvent.locationX));
        const percentage = newPosition / sliderWidth;
        const newValue = min + (percentage * range);
        
        if (!isNaN(newValue) && isFinite(newValue)) {
          onValueChange(newValue);
        }
      },
      onPanResponderRelease: () => setIsDragging(false),
    })
  ).current;

  return (
    <View style={styles.adjustmentSliderContainer}>
      {/* Header with icon, label, and value */}
      <View style={styles.sliderHeader}>
        <View style={styles.sliderLabelContainer}>
          <Feather name={icon} size={16} color={Colors.textPrimary} />
          <Text style={styles.sliderLabel}>{label}</Text>
        </View>
        <Text style={[styles.sliderValueText, isDragging && styles.sliderValueActive]}>
          {displayValue > 0 ? `+${displayValue}` : displayValue}
        </Text>
      </View>
      
      {/* Slider track */}
      <View
        style={styles.sliderTrackContainer}
        onLayout={(e) => setSliderWidth(e.nativeEvent.layout.width)}
        {...panResponder.panHandlers}
      >
        <View style={styles.sliderTrack} />
        
        {/* Center mark */}
        <View style={styles.sliderCenterMark} />
        
        {/* Active track */}
        <Animated.View
          style={[
            styles.sliderActiveTrack,
            { width: position }
          ]}
        />
        
        {/* Thumb */}
        <Animated.View
          style={[
            styles.sliderThumb,
            {
              transform: [{ translateX: position }],
              shadowOpacity: isDragging ? 0.3 : 0.15,
              transform: [
                { translateX: position },
                { scale: isDragging ? 1.2 : 1 }
              ]
            }
          ]}
        />
      </View>
    </View>
  );
};

// Main component
export default function ProfessionalPhotoEditor() {
  const { t } = useTranslation();
  const { photoId } = useLocalSearchParams<{ photoId: string }>();
  const router = useRouter();
  const [currentTool, setCurrentTool] = useState<'adjust' | 'filters' | 'crop'>('adjust');

  const {
    activePhoto,
    settings,
    isLoading,
    isSaving,
    backgrounds,
    setActivePhotoById,
    fetchBackgrounds,
    updateSettings,
    saveChanges,
    resetSettings,
    clearStore,
  } = useEditorStore();

  // Adjustment definitions
  const adjustments = [
    { 
      id: 'exposure', 
      label: 'Pozlama', 
      icon: 'sun' as const, 
      key: 'brightness', 
      min: 0.1, 
      max: 2.0, 
      defaultValue: 1.0 
    },
    { 
      id: 'highlights', 
      label: 'Vurgular', 
      icon: 'trending-up' as const, 
      key: 'contrast', 
      min: 0.1, 
      max: 2.0, 
      defaultValue: 1.0 
    },
    { 
      id: 'shadows', 
      label: 'Gölgeler', 
      icon: 'trending-down' as const, 
      key: 'shadow', 
      min: 0.0, 
      max: 1.0, 
      defaultValue: 0.5 
    },
    { 
      id: 'brightness', 
      label: 'Parlaklık', 
      icon: 'circle' as const, 
      key: 'lighting', 
      min: 0.0, 
      max: 1.0, 
      defaultValue: 0.7 
    },
    { 
      id: 'saturation', 
      label: 'Doygunluk', 
      icon: 'droplet' as const, 
      key: 'saturation', 
      min: 0.0, 
      max: 2.0, 
      defaultValue: 1.0 
    },
    { 
      id: 'vibrance', 
      label: 'Canlılık', 
      icon: 'zap' as const, 
      key: 'hue', 
      min: -1.0, 
      max: 1.0, 
      defaultValue: 0.0 
    },
    { 
      id: 'warmth', 
      label: 'Sıcaklık', 
      icon: 'thermometer' as const, 
      key: 'sepia', 
      min: 0.0, 
      max: 1.0, 
      defaultValue: 0.0 
    },
  ];

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

  const handleAdjustmentChange = (key: string, value: number) => {
    if (isNaN(value) || !isFinite(value)) return;
    updateSettings({ [key]: value });
  };

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

      {/* Photo Preview */}
      <View style={styles.photoPreviewContainer}>
        <View style={styles.photoFrame}>
          {selectedBackground && (
            <Image
              source={{ uri: selectedBackground.fullUrl }}
              style={styles.backgroundImage}
            />
          )}
          
          {activePhoto.processedImageUrl && (
            <LiveFilteredImage
              imageUri={activePhoto.processedImageUrl}
              settings={settings}
              style={styles.mainPhoto}
            />
          )}
        </View>
      </View>

      {/* Tool Selection */}
      <View style={styles.toolSelector}>
        <TouchableOpacity 
          style={[styles.toolButton, currentTool === 'adjust' && styles.toolButtonActive]}
          onPress={() => setCurrentTool('adjust')}
        >
          <Feather 
            name="sliders" 
            size={28} 
            color={currentTool === 'adjust' ? Colors.primary : Colors.textSecondary} 
          />
          <Text style={[styles.toolButtonText, currentTool === 'adjust' && styles.toolButtonTextActive]}>
            Ayarla
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.toolButton, currentTool === 'filters' && styles.toolButtonActive]}
          onPress={() => setCurrentTool('filters')}
        >
          <Feather 
            name="filter" 
            size={28} 
            color={currentTool === 'filters' ? Colors.primary : Colors.textSecondary} 
          />
          <Text style={[styles.toolButtonText, currentTool === 'filters' && styles.toolButtonTextActive]}>
            Filtreler
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.toolButton, currentTool === 'crop' && styles.toolButtonActive]}
          onPress={() => setCurrentTool('crop')}
        >
          <Feather 
            name="crop" 
            size={28} 
            color={currentTool === 'crop' ? Colors.primary : Colors.textSecondary} 
          />
          <Text style={[styles.toolButtonText, currentTool === 'crop' && styles.toolButtonTextActive]}>
            Kırp
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tool Content */}
      <View style={styles.toolContent}>
        {currentTool === 'adjust' && (
          <ScrollView style={styles.adjustPanel} showsVerticalScrollIndicator={false}>
            {adjustments.map((adjustment) => (
              <AppleAdjustmentSlider
                key={adjustment.id}
                label={adjustment.label}
                value={settings[adjustment.key as keyof typeof settings] as number || adjustment.defaultValue}
                min={adjustment.min}
                max={adjustment.max}
                defaultValue={adjustment.defaultValue}
                onValueChange={(value) => handleAdjustmentChange(adjustment.key, value)}
                icon={adjustment.icon}
              />
            ))}
            
            <TouchableOpacity onPress={resetSettings} style={styles.resetButton}>
              <Text style={styles.resetButtonText}>Tüm Ayarları Sıfırla</Text>
            </TouchableOpacity>
          </ScrollView>
        )}

        {currentTool === 'filters' && (
          <ScrollView style={styles.filtersPanel} showsVerticalScrollIndicator={false}>
            {/* Background Selection */}
            <View style={styles.backgroundsSection}>
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
                        <Feather name="check" size={20} color="white" />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Preset Filters */}
            <View style={styles.filtersSection}>
              <Text style={styles.sectionTitle}>Hazır Filtreler</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filtersContainer}
              >
                <TouchableOpacity 
                  style={styles.filterPreset}
                  onPress={() => updateSettings({ 
                    brightness: 1, contrast: 1, saturation: 1, sepia: 0, hue: 0 
                  })}
                >
                  <View style={[styles.filterPreview, { backgroundColor: '#F0F0F0' }]} />
                  <Text style={styles.filterLabel}>Orijinal</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.filterPreset}
                  onPress={() => updateSettings({ 
                    saturation: 0, contrast: 1.2, brightness: 1.1 
                  })}
                >
                  <View style={[styles.filterPreview, { backgroundColor: '#888' }]} />
                  <Text style={styles.filterLabel}>Siyah-Beyaz</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.filterPreset}
                  onPress={() => updateSettings({ 
                    sepia: 0.7, brightness: 0.9, contrast: 1.1 
                  })}
                >
                  <View style={[styles.filterPreview, { backgroundColor: '#D2B48C' }]} />
                  <Text style={styles.filterLabel}>Sepya</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.filterPreset}
                  onPress={() => updateSettings({ 
                    brightness: 0.8, contrast: 1.4, saturation: 0.6, sepia: 0.3 
                  })}
                >
                  <View style={[styles.filterPreview, { backgroundColor: '#8B7355' }]} />
                  <Text style={styles.filterLabel}>Vintage</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.filterPreset}
                  onPress={() => updateSettings({ 
                    brightness: 1.2, saturation: 1.3, hue: -0.3 
                  })}
                >
                  <View style={[styles.filterPreview, { backgroundColor: '#4A90E2' }]} />
                  <Text style={styles.filterLabel}>Soğuk</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.filterPreset}
                  onPress={() => updateSettings({ 
                    brightness: 1.1, saturation: 1.2, hue: 0.3 
                  })}
                >
                  <View style={[styles.filterPreview, { backgroundColor: '#F5A623' }]} />
                  <Text style={styles.filterLabel}>Sıcak</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </ScrollView>
        )}

        {currentTool === 'crop' && (
          <View style={styles.cropPanel}>
            <Text style={styles.comingSoonTitle}>Kırpma Araçları</Text>
            <Text style={styles.comingSoonText}>Bu özellik yakında aktif olacak</Text>
            <View style={styles.cropToolsPreview}>
              <Feather name="rotate-ccw" size={32} color={Colors.textSecondary} />
              <Feather name="maximize" size={32} color={Colors.textSecondary} />
              <Feather name="square" size={32} color={Colors.textSecondary} />
            </View>
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

  // Photo Preview
  photoPreviewContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.gray50,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  photoFrame: {
    width: screenWidth - 40,
    height: (screenWidth - 40) * 0.8,
    backgroundColor: Colors.card,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    position: 'relative',
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  mainPhoto: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },

  // Tool Selector
  toolSelector: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: Colors.card,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  toolButton: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  toolButtonActive: {},
  toolButtonText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  toolButtonTextActive: {
    color: Colors.primary,
    fontWeight: '600',
  },

  // Tool Content
  toolContent: {
    height: 320,
    backgroundColor: Colors.card,
  },

  // Adjust Panel
  adjustPanel: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  adjustmentSliderContainer: {
    marginBottom: 24,
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
  sliderValueText: {
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
  sliderCenterMark: {
    position: 'absolute',
    left: '50%',
    marginLeft: -1,
    width: 2,
    height: 14,
    backgroundColor: Colors.textSecondary,
    borderRadius: 1,
  },
  sliderActiveTrack: {
    height: 3,
    backgroundColor: Colors.primary,
    borderRadius: 1.5,
    position: 'absolute',
  },
  sliderThumb: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.card,
    position: 'absolute',
    marginLeft: -14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 3,
    borderColor: Colors.primary,
  },
  resetButton: {
    marginTop: 20,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: Colors.gray100,
    borderRadius: 8,
  },
  resetButtonText: {
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
  backgroundsSection: {
    marginBottom: 32,
  },
  filtersSection: {},
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 16,
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
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filtersContainer: {
    gap: 16,
    paddingHorizontal: 4,
  },
  filterPreset: {
    alignItems: 'center',
    width: 90,
  },
  filterPreview: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginBottom: 8,
  },
  filterLabel: {
    fontSize: 14,
    color: Colors.textPrimary,
    textAlign: 'center',
    fontWeight: '500',
  },

  // Crop Panel
  cropPanel: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  comingSoonTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  comingSoonText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
  },
  cropToolsPreview: {
    flexDirection: 'row',
    gap: 32,
  },
});