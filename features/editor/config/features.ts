// app/(tabs)/editor/config/features.ts

export interface FeatureConfig {
  key: string;
  labelKey: string; // label yerine labelKey kullanıldı
  icon: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
}

export const ADJUST_FEATURES: FeatureConfig[] = [
  { key: 'exposure', labelKey: 'editor.featureLabels.exposure', icon: 'sun', min: -100, max: 100, step: 1, defaultValue: 0 },
  { key: 'brightness', labelKey: 'editor.featureLabels.brightness', icon: 'circle', min: -100, max: 100, step: 1, defaultValue: 0 },
  { key: 'highlights', labelKey: 'editor.featureLabels.highlights', icon: 'trending-up', min: -100, max: 100, step: 1, defaultValue: 0 },
  { key: 'shadows', labelKey: 'editor.featureLabels.shadows', icon: 'trending-down', min: -100, max: 100, step: 1, defaultValue: 0 },
  { key: 'contrast', labelKey: 'editor.featureLabels.contrast', icon: 'bar-chart-2', min: -100, max: 100, step: 1, defaultValue: 0 },
  { key: 'saturation', labelKey: 'editor.featureLabels.saturation', icon: 'droplet', min: -100, max: 100, step: 1, defaultValue: 0 },
  { key: 'vibrance', labelKey: 'editor.featureLabels.vibrance', icon: 'zap', min: -100, max: 100, step: 1, defaultValue: 0 },
  { key: 'warmth', labelKey: 'editor.featureLabels.warmth', icon: 'thermometer', min: -100, max: 100, step: 1, defaultValue: 0 },
  { key: 'clarity', labelKey: 'editor.featureLabels.clarity', icon: 'aperture', min: -100, max: 100, step: 1, defaultValue: 0 },
];

// Arka plan özel ayarları
export const BACKGROUND_FEATURES: FeatureConfig[] = [
  { key: 'exposure', labelKey: 'editor.featureLabels.exposure', icon: 'sun', min: -100, max: 100, step: 1, defaultValue: 0 },
  { key: 'brightness', labelKey: 'editor.featureLabels.brightness', icon: 'circle', min: -100, max: 100, step: 1, defaultValue: 0 },
  { key: 'contrast', labelKey: 'editor.featureLabels.contrast', icon: 'bar-chart-2', min: -100, max: 100, step: 1, defaultValue: 0 },
  { key: 'saturation', labelKey: 'editor.featureLabels.saturation', icon: 'droplet', min: -100, max: 100, step: 1, defaultValue: 0 },
  { key: 'warmth', labelKey: 'editor.featureLabels.warmth', icon: 'thermometer', min: -100, max: 100, step: 1, defaultValue: 0 },
  { key: 'vignette', labelKey: 'editor.featureLabels.vignette', icon: 'target', min: 0, max: 100, step: 1, defaultValue: 0 },
  { key: 'blur', labelKey: 'editor.featureLabels.blur', icon: 'circle', min: 0, max: 100, step: 1, defaultValue: 0 },
];