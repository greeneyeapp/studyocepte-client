// app/(tabs)/editor/hooks/useScrollManager.ts

import { useRef, useEffect } from 'react';
import { ScrollView } from 'react-native';

interface ScrollManagerConfig {
  activeTool: string;
  activeFeature: string | null;
  isSliderActive: boolean;
}

export const useScrollManager = ({ activeTool, activeFeature, isSliderActive }: ScrollManagerConfig) => {
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Tool değiştiğinde scroll'u sıfırla
  useEffect(() => {
    if (scrollViewRef.current && !isSliderActive) {
      scrollViewRef.current.scrollTo({ x: 0, animated: true });
    }
  }, [activeTool]);

  // Feature kapandığında scroll'u sıfırla
  useEffect(() => {
    if (scrollViewRef.current && !activeFeature && !isSliderActive) {
      scrollViewRef.current.scrollTo({ x: 0, animated: true });
    }
  }, [activeFeature, isSliderActive]);

  return {
    scrollViewRef,
  };
};