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
    setActiveFeature(null);
  };

  const handleToolChange = (tool: ToolType) => {
    setActiveTool(tool);
    setActiveFeature(null);
    if (tool === 'background') setActiveTarget('background');
    else if (tool === 'crop') setActiveTarget('all');
  };

  const handleFeatureChange = (featureKey: string, value: number) => {
    const targetedSettings: Record<string, any> = {};
    const targets: TargetType[] = activeTarget === 'all' ? ['product', 'background'] : [activeTarget];
    
    targets.forEach(target => {
      const key = `${target}_${featureKey}`;
      targetedSettings[key] = value;
    });

    updateSettings(targetedSettings);
  };

  const getCurrentFeatureValue = (featureKey: string): number => {
    if (!featureKey) return 0;
    // 'all' hedefindeyken bile, genellikle birincil hedef olan 'product' değerini göstermek daha mantıklıdır.
    const primaryTarget = activeTarget === 'background' ? 'background' : 'product';
    const key = `${primaryTarget}_${featureKey}`;
    return settings[key as keyof typeof settings] ?? 0;
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
    // HATAYI GİDEREN EKLEMELER
    setActiveFeature,
    setIsSliderActive,
    setShowOriginal,
    setCurrentFilter,
    //-------------------------
    handleTargetChange,
    handleToolChange,
    handleFeatureChange,
    getCurrentFeatureValue,
    updateSettings,
    saveChanges,
  };
};