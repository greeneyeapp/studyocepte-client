// app/(tabs)/editor/utils/filterUtils.ts

import { FilterPreset } from '../config/filters';

/**
 * Filtre ayarlarını normalize eder (-100 ile 100 arasında)
 */
export const normalizeFilterValue = (value: number, min = -100, max = 100): number => {
  return Math.max(min, Math.min(max, value));
};

/**
 * Filtre yoğunluğunu uygular
 */
export const applyFilterIntensity = (
  settings: Record<string, number>, 
  intensity: number = 1.0
): Record<string, number> => {
  const normalizedIntensity = Math.max(0, Math.min(1, intensity));
  const result: Record<string, number> = {};
  
  Object.entries(settings).forEach(([key, value]) => {
    result[key] = value * normalizedIntensity;
  });
  
  return result;
};

/**
 * İki filtre ayarını karıştırır
 */
export const blendFilterSettings = (
  settings1: Record<string, number>,
  settings2: Record<string, number>,
  blendRatio: number = 0.5
): Record<string, number> => {
  const ratio = Math.max(0, Math.min(1, blendRatio));
  const result: Record<string, number> = { ...settings1 };
  
  Object.entries(settings2).forEach(([key, value]) => {
    const currentValue = result[key] || 0;
    result[key] = currentValue * (1 - ratio) + value * ratio;
  });
  
  return result;
};

/**
 * Filtre önizlemesi için CSS filter string oluşturur (Web için)
 */
export const createCSSFilterString = (settings: Record<string, number>): string => {
  const filters: string[] = [];
  
  if (settings.brightness) {
    const brightness = 1 + (settings.brightness / 100);
    filters.push(`brightness(${brightness})`);
  }
  
  if (settings.contrast) {
    const contrast = 1 + (settings.contrast / 100);
    filters.push(`contrast(${contrast})`);
  }
  
  if (settings.saturation) {
    const saturation = Math.max(0, 1 + (settings.saturation / 100));
    filters.push(`saturate(${saturation})`);
  }
  
  if (settings.warmth) {
    // Warmth'i hue-rotate ile simüle et
    const hue = settings.warmth * 0.3; // Warmth -> hue conversion
    filters.push(`hue-rotate(${hue}deg)`);
  }
  
  if (settings.sepia) {
    const sepia = Math.max(0, Math.min(1, settings.sepia / 100));
    filters.push(`sepia(${sepia})`);
  }
  
  return filters.length > 0 ? filters.join(' ') : 'none';
};

/**
 * Filtre ayarlarının etkisini hesaplar (0-1 arası)
 */
export const calculateFilterImpact = (settings: Record<string, number>): number => {
  const values = Object.values(settings);
  const totalImpact = values.reduce((sum, value) => sum + Math.abs(value), 0);
  const maxPossibleImpact = values.length * 100; // Her değer max 100 olabilir
  
  return Math.min(1, totalImpact / maxPossibleImpact);
};

/**
 * Otomatik filtre önerisi oluşturur
 */
export const suggestAutoFilter = (
  imageAnalysis: {
    brightness: number;
    contrast: number;
    saturation: number;
  }
): Record<string, number> => {
  const suggestions: Record<string, number> = {};
  
  // Karanlık görüntüler için brightness artır
  if (imageAnalysis.brightness < 0.4) {
    suggestions.brightness = 20;
    suggestions.shadows = 15;
  }
  
  // Düşük kontrast için contrast artır
  if (imageAnalysis.contrast < 0.5) {
    suggestions.contrast = 25;
    suggestions.clarity = 10;
  }
  
  // Soluk renkler için saturation artır
  if (imageAnalysis.saturation < 0.6) {
    suggestions.saturation = 15;
    suggestions.vibrance = 20;
  }
  
  return suggestions;
};

/**
 * Filtre geçişi animasyonu için ara değerler oluşturur
 */
export const interpolateFilterSettings = (
  fromSettings: Record<string, number>,
  toSettings: Record<string, number>,
  progress: number
): Record<string, number> => {
  const normalizedProgress = Math.max(0, Math.min(1, progress));
  const result: Record<string, number> = {};
  
  // Tüm unique key'leri topla
  const allKeys = new Set([
    ...Object.keys(fromSettings),
    ...Object.keys(toSettings)
  ]);
  
  allKeys.forEach(key => {
    const fromValue = fromSettings[key] || 0;
    const toValue = toSettings[key] || 0;
    result[key] = fromValue + (toValue - fromValue) * normalizedProgress;
  });
  
  return result;
};

/**
 * Preset filtre arar
 */
export const findPresetBySettings = (
  settings: Record<string, number>,
  presets: FilterPreset[],
  tolerance: number = 10
): FilterPreset | null => {
  for (const preset of presets) {
    let isMatch = true;
    
    for (const [key, value] of Object.entries(settings)) {
      const presetValue = preset.settings[key] || 0;
      if (Math.abs(value - presetValue) > tolerance) {
        isMatch = false;
        break;
      }
    }
    
    if (isMatch) {
      return preset;
    }
  }
  
  return null;
};