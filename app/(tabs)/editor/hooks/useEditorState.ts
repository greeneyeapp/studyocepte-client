// app/(tabs)/editor/hooks/useEditorState.ts

import { useState, useEffect } from 'react';
import { useEditorStore } from '@/stores/useEditorStore';
import { ToolType, TargetType } from '../config/tools';

interface EditorStateConfig {
  photoId: string;
}

export const useEditorState = ({ photoId }: EditorStateConfig) => {
  // Temel state
  const [activeTarget, setActiveTarget] = useState<TargetType>('product');
  const [activeTool, setActiveTool] = useState<ToolType>('adjust');
  const [activeFeature, setActiveFeature] = useState<string | null>(null);
  const [isSliderActive, setIsSliderActive] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const [currentFilter, setCurrentFilter] = useState('original');

  // Store
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
    resetToDefaults,
  } = useEditorStore();

  // İlk yükleme
  useEffect(() => {
    if (photoId) {
      setActivePhotoById(photoId);
      fetchBackgrounds();
    }
    return () => clearStore();
  }, [photoId]);

  // Her açılışta ayarları sıfırla
  useEffect(() => {
    if (photoId && activePhoto) {
      resetToDefaults();
    }
  }, [photoId, activePhoto]);

  // Hedef değiştirme logic'i - teknik spesifikasyona uygun
  const handleTargetChange = (target: TargetType) => {
    setActiveTarget(target);
    setActiveFeature(null); // Aktif özelliği sıfırla
  };

  // Araç değiştirme logic'i - teknik spesifikasyona uygun
  const handleToolChange = (tool: ToolType) => {
    setActiveTool(tool);
    setActiveFeature(null); // Aktif özelliği sıfırla
    
    // Araç değişiminde varsayılan davranışlar
    switch (tool) {
      case 'background':
        // Arka plan aracı seçildiğinde otomatik olarak arka plan hedefi seç
        setActiveTarget('background');
        break;
      case 'crop':
        // Kırpma aracı HER ZAMAN tüm canvas'a uygulanır (teknik spesifikasyon)
        setActiveTarget('all');
        break;
      default:
        // Diğer araçlarda kullanıcının seçtiği hedefi koru
        break;
    }
  };

  // Özellik değiştirme - katmanlı ayar sistemi
  const handleFeatureChange = (featureKey: string, value: number) => {
    // Kırpma aracı özel durumu
    if (activeTool === 'crop') {
      updateSettings({ [featureKey]: value });
      return;
    }

    // Katmanlı ayar sistemi
    const targetedSettings: Record<string, any> = {};

    switch (activeTarget) {
      case 'product':
        // Sadece ürün katmanına uygula
        targetedSettings[`product_${featureKey}`] = value;
        break;
      case 'background':
        // Sadece arka plan katmanına uygula  
        targetedSettings[`background_${featureKey}`] = value;
        break;
      case 'all':
        // Her iki katmana da uygula
        targetedSettings[`product_${featureKey}`] = value;
        targetedSettings[`background_${featureKey}`] = value;
        break;
    }

    updateSettings(targetedSettings);
  };

  // Mevcut özellik değerini al - katmanlı sistem
  const getCurrentFeatureValue = (featureKey: string): number => {
    if (!featureKey) return 0;

    // Kırpma araçları için doğrudan değer
    if (activeTool === 'crop') {
      return settings[featureKey as keyof typeof settings] || 0;
    }

    // Katmanlı değer okuma
    switch (activeTarget) {
      case 'product':
        return settings[`product_${featureKey}` as keyof typeof settings] || 0;
      case 'background':
        return settings[`background_${featureKey}` as keyof typeof settings] || 0;
      case 'all':
        // Her iki katmanın ortalama değeri
        const productValue = settings[`product_${featureKey}` as keyof typeof settings] || 0;
        const backgroundValue = settings[`background_${featureKey}` as keyof typeof settings] || 0;
        return (productValue + backgroundValue) / 2;
      default:
        return 0;
    }
  };

  return {
    // State
    activeTarget,
    activeTool,
    activeFeature,
    isSliderActive,
    showOriginal,
    currentFilter,
    
    // Store data
    activePhoto,
    backgrounds,
    isLoading,
    isSaving,
    settings,
    
    // Actions
    setActiveFeature,
    setIsSliderActive,
    setShowOriginal,
    setCurrentFilter,
    handleTargetChange,
    handleToolChange,
    handleFeatureChange,
    getCurrentFeatureValue,
    
    // Store actions
    updateSettings,
    saveChanges,
    resetToDefaults,
  };
};