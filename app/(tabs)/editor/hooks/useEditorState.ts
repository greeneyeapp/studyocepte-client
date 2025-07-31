// app/(tabs)/editor/hooks/useEditorState.ts - Karışık Durum Mantığı

import { useState, useEffect } from 'react';
import { useEditorStore } from '@/stores/useEditorStore';
import { ToolType, TargetType } from '../config/tools';

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
    else if (tool === 'crop') setActiveTarget('all');
  };

  const handleFeatureChange = (featureKey: string, value: number) => {
    const targetedSettings: Record<string, any> = {};
    
    if (activeTarget === 'all') {
      // "Tümü" seçiliyken her iki katmana da uygula (karışık durumu çözer)
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
      
      // Değerler farklıysa ortalama döndür (button görselliği için)
      // Slider'da kullanılmayacak ama button'ların rengini doğru göstermek için
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

  return {
    activeTarget,
    activeTool,
    activeFeature,
    isSliderActive,
    showOriginal,
    currentFilter,
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
    handleFeaturePress, // Yeni eklenen
    getCurrentFeatureValue,
    hasMultipleValues,
    getFeatureValues,
    getFeatureButtonStatus,
    updateSettings,
    saveChanges,
  };
};