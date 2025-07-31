// app/(tabs)/editor/hooks/useEditorState.ts - Hedef Tabanlı Filtre Mantığı

import { useState, useEffect } from 'react';
import { useEditorStore } from '@/stores/useEditorStore';
import { ToolType, TargetType } from '../config/tools';
import { ALL_FILTERS } from '../config/filters';

interface EditorStateConfig {
  photoId: string;
}

export const useEditorState = ({ photoId }: EditorStateConfig) => {
  const [activeTarget, setActiveTarget] = useState<TargetType>('product');
  const [activeTool, setActiveTool] = useState<ToolType>('adjust');
  const [activeFeature, setActiveFeature] = useState<string | null>(null);
  const [isSliderActive, setIsSliderActive] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const [currentFilter, setCurrentFilter] = useState('original');

  const {
    activePhoto,
    backgrounds,
    isLoading,
    isSaving,
    settings,
    setActivePhotoById,
    fetchBackgrounds,
    updateSettings,
    saveChanges,
    clearStore,
  } = useEditorStore();

  useEffect(() => {
    if (photoId) {
      setActivePhotoById(photoId);
      fetchBackgrounds();
    }
    return () => clearStore();
  }, [photoId]);

  const handleTargetChange = (target: TargetType) => {
    setActiveTarget(target);
    setActiveFeature(null); // Slider'ı kapat
  };

  const handleToolChange = (tool: ToolType) => {
    setActiveTool(tool);
    setActiveFeature(null);
    if (tool === 'background') setActiveTarget('background');
  };

  const handleFeatureChange = (featureKey: string, value: number) => {
    const targetedSettings: Record<string, any> = {};
    
    if (activeTarget === 'all') {
      // "Tümü" seçiliyken her iki katmana da uygula
      targetedSettings[`product_${featureKey}`] = value;
      targetedSettings[`background_${featureKey}`] = value;
    } else {
      // Tek bir hedef seçiliyken sadece o hedefe uygula
      const key = `${activeTarget}_${featureKey}`;
      targetedSettings[key] = value;
    }

    updateSettings(targetedSettings);
  };

  const handleFeaturePress = (featureKey: string) => {
    if (activeFeature === featureKey) {
      setActiveFeature(null);
    } else {
      setActiveFeature(featureKey);
      
      // Karışık durumda otomatik ortalama al
      if (activeTarget === 'all' && hasMultipleValues(featureKey)) {
        const { productValue, backgroundValue } = getFeatureValues(featureKey);
        const averageValue = Math.round((productValue + backgroundValue) / 2);
        
        // Ortalama değerle başlat
        updateSettings({
          [`product_${featureKey}`]: averageValue,
          [`background_${featureKey}`]: averageValue,
        });
      }
    }
  };

  // YENİ FONKSİYON: Hedef tabanlı filtre uygulama
  const handleFilterPress = (filter: any) => {
    setCurrentFilter(filter.key);
    
    if (filter.key === 'original') {
      // Orijinal filtreyi uygula - tüm ayarları sıfırla
      const resetSettings: Record<string, number> = {};
      
      if (activeTarget === 'all') {
        // Her iki katmana da sıfırlama uygula
        ['exposure', 'brightness', 'highlights', 'shadows', 'contrast', 'saturation', 'vibrance', 'warmth', 'clarity', 'vignette'].forEach(key => {
          resetSettings[`product_${key}`] = 0;
          resetSettings[`background_${key}`] = 0;
        });
      } else {
        // Sadece seçili hedefe sıfırlama uygula
        ['exposure', 'brightness', 'highlights', 'shadows', 'contrast', 'saturation', 'vibrance', 'warmth', 'clarity', 'vignette'].forEach(key => {
          resetSettings[`${activeTarget}_${key}`] = 0;
        });
      }
      
      updateSettings(resetSettings);
    } else {
      // Diğer filtreleri uygula
      const newSettings: Record<string, number> = {};
      
      if (activeTarget === 'all') {
        // Her iki katmana da filtre uygula
        Object.entries(filter.settings).forEach(([key, value]) => {
          newSettings[`product_${key}`] = value as number;
          newSettings[`background_${key}`] = value as number;
        });
      } else {
        // Sadece seçili hedefe filtre uygula
        Object.entries(filter.settings).forEach(([key, value]) => {
          newSettings[`${activeTarget}_${key}`] = value as number;
        });
      }
      
      updateSettings(newSettings);
    }
  };

  // Değerlerin karışık olup olmadığını kontrol et
  const hasMultipleValues = (featureKey: string): boolean => {
    if (activeTarget !== 'all') return false;
    
    const productValue = settings[`product_${featureKey}` as keyof typeof settings] ?? 0;
    const backgroundValue = settings[`background_${featureKey}` as keyof typeof settings] ?? 0;
    
    return productValue !== backgroundValue;
  };

  // Mevcut değerleri al
  const getFeatureValues = (featureKey: string) => {
    const productValue = settings[`product_${featureKey}` as keyof typeof settings] ?? 0;
    const backgroundValue = settings[`background_${featureKey}` as keyof typeof settings] ?? 0;
    
    return { productValue, backgroundValue };
  };

  // Slider için değer hesapla
  const getCurrentFeatureValue = (featureKey: string): number => {
    if (!featureKey) return 0;
    
    if (activeTarget === 'all') {
      const { productValue, backgroundValue } = getFeatureValues(featureKey);
      
      // Değerler aynıysa o değeri döndür
      if (productValue === backgroundValue) {
        return productValue;
      }
      
      // Değerler farklıysa ortalama döndür
      return Math.round((productValue + backgroundValue) / 2);
    } else {
      // Tek hedef seçiliyken o hedefin değerini göster
      const key = `${activeTarget}_${featureKey}`;
      return settings[key as keyof typeof settings] ?? 0;
    }
  };

  // Feature button durumunu kontrol et
  const getFeatureButtonStatus = (featureKey: string) => {
    const { productValue, backgroundValue } = getFeatureValues(featureKey);
    
    if (activeTarget === 'all') {
      return {
        hasValue: productValue !== 0 || backgroundValue !== 0,
        hasMixedValues: productValue !== backgroundValue,
        productValue,
        backgroundValue,
      };
    } else {
      const key = `${activeTarget}_${featureKey}`;
      const value = settings[key as keyof typeof settings] ?? 0;
      return {
        hasValue: value !== 0,
        hasMixedValues: false,
        productValue: activeTarget === 'product' ? value : 0,
        backgroundValue: activeTarget === 'background' ? value : 0,
      };
    }
  };

  // YENİ: Mevcut filtreyi kontrol et
  const getCurrentFilter = () => {
    // Mevcut ayarları filtrelerle karşılaştır
    for (const filter of ALL_FILTERS) {
      if (filter.key === 'original') continue;
      
      let isMatch = true;
      const targetPrefix = activeTarget === 'all' ? 'product' : activeTarget;
      
      for (const [key, expectedValue] of Object.entries(filter.settings)) {
        const actualValue = settings[`${targetPrefix}_${key}` as keyof typeof settings] ?? 0;
        if (Math.abs(actualValue - (expectedValue as number)) > 5) { // 5 birim tolerans
          isMatch = false;
          break;
        }
      }
      
      if (isMatch) {
        return filter.key;
      }
    }
    
    return 'original';
  };

  return {
    activeTarget,
    activeTool,
    activeFeature,
    isSliderActive,
    showOriginal,
    currentFilter: getCurrentFilter(), // Dinamik olarak hesapla
    activePhoto,
    backgrounds,
    isLoading,
    isSaving,
    settings,
    setActiveFeature,
    setIsSliderActive,
    setShowOriginal,
    setCurrentFilter,
    handleTargetChange,
    handleToolChange,
    handleFeatureChange,
    handleFeaturePress,
    handleFilterPress, // YENİ EKLENEN
    getCurrentFeatureValue,
    hasMultipleValues,
    getFeatureValues,
    getFeatureButtonStatus,
    updateSettings,
    saveChanges,
  };
};