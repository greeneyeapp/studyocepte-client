// app/(tabs)/editor/hooks/useScrollManager.ts

import { useRef, useEffect } from 'react';
import { ScrollView } from 'react-native';

interface ScrollManagerConfig {
  activeTool: string;
  activeTarget?: string; // YENİ EKLENEN
  activeFeature: string | null;
  isSliderActive: boolean;
}

export const useScrollManager = ({ activeTool, activeTarget, activeFeature, isSliderActive }: ScrollManagerConfig) => {
  // Her tool ve target kombinasyonu için ayrı ref'ler
  const backgroundScrollRef = useRef<ScrollView>(null);
  const filterScrollRef = useRef<ScrollView>(null);
  const cropScrollRef = useRef<ScrollView>(null);
  
  // Adjust tool için target bazlı ref'ler
  const adjustProductScrollRef = useRef<ScrollView>(null);
  const adjustBackgroundScrollRef = useRef<ScrollView>(null);
  const adjustAllScrollRef = useRef<ScrollView>(null);
  
  // Aktif tool ve target'a göre doğru ref'i döndür
  const getCurrentScrollRef = () => {
    switch (activeTool) {
      case 'background':
        return backgroundScrollRef;
      case 'filter':
        return filterScrollRef;
      case 'crop':
        return cropScrollRef;
      case 'adjust':
        // Adjust tool'unda target'a göre farklı ref'ler
        switch (activeTarget) {
          case 'product':
            return adjustProductScrollRef;
          case 'background':
            return adjustBackgroundScrollRef;
          case 'all':
            return adjustAllScrollRef;
          default:
            return adjustProductScrollRef;
        }
      default:
        return adjustProductScrollRef; // fallback
    }
  };

  // Tool değiştiğinde scroll'u sıfırla
  useEffect(() => {
    const currentRef = getCurrentScrollRef();
    if (currentRef.current && !isSliderActive) {
      currentRef.current.scrollTo({ x: 0, animated: true });
    }
  }, [activeTool]);

  // Target değiştiğinde scroll'u sıfırla (sadece adjust tool'unda)
  useEffect(() => {
    if (activeTool === 'adjust') {
      const currentRef = getCurrentScrollRef();
      if (currentRef.current && !isSliderActive) {
        currentRef.current.scrollTo({ x: 0, animated: true });
      }
    }
  }, [activeTarget, activeTool]);

  // Feature kapandığında scroll'u sıfırla
  useEffect(() => {
    const currentRef = getCurrentScrollRef();
    if (currentRef.current && !activeFeature && !isSliderActive) {
      currentRef.current.scrollTo({ x: 0, animated: true });
    }
  }, [activeFeature, isSliderActive]);

  return {
    // Her duruma özel ref'leri döndür
    backgroundScrollRef,
    filterScrollRef,
    cropScrollRef,
    adjustProductScrollRef,
    adjustBackgroundScrollRef,
    adjustAllScrollRef,
    // Aktif ref'i de döndür
    currentScrollRef: getCurrentScrollRef(),
  };
};