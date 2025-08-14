// app/(tabs)/editor/config/features.ts (ÇEVİRİ ANAHTARLARI KULLANILDI)

export interface FeatureConfig {
  key: string;
  label: string; // Bu artık doğrudan çeviri anahtarı olacak (örn. 'editor.feature.exposure')
  icon: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
}

export const ADJUST_FEATURES: FeatureConfig[] = [
  { key: 'exposure', label: 'editor.feature.exposure', icon: 'sun', min: -100, max: 100, step: 1, defaultValue: 0 },
  { key: 'brightness', label: 'editor.feature.brightness', icon: 'circle', min: -100, max: 100, step: 1, defaultValue: 0 },
  { key: 'highlights', label: 'editor.feature.highlights', icon: 'trending-up', min: -100, max: 100, step: 1, defaultValue: 0 },
  { key: 'shadows', label: 'editor.feature.shadows', icon: 'trending-down', min: -100, max: 100, step: 1, defaultValue: 0 },
  { key: 'contrast', label: 'editor.feature.contrast', icon: 'bar-chart-2', min: -100, max: 100, step: 1, defaultValue: 0 },
  { key: 'saturation', label: 'editor.feature.saturation', icon: 'droplet', min: -100, max: 100, step: 1, defaultValue: 0 },
  { key: 'vibrance', label: 'editor.feature.vibrance', icon: 'zap', min: -100, max: 100, step: 1, defaultValue: 0 },
  { key: 'warmth', label: 'editor.feature.warmth', icon: 'thermometer', min: -100, max: 100, step: 1, defaultValue: 0 },
  { key: 'clarity', label: 'editor.feature.clarity', icon: 'aperture', min: -100, max: 100, step: 1, defaultValue: 0 },
];

export const BACKGROUND_FEATURES: FeatureConfig[] = [
  { key: 'exposure', label: 'editor.feature.exposure', icon: 'sun', min: -100, max: 100, step: 1, defaultValue: 0 },
  { key: 'brightness', label: 'editor.feature.brightness', icon: 'circle', min: -100, max: 100, step: 1, defaultValue: 0 },
  { key: 'contrast', label: 'editor.feature.contrast', icon: 'bar-chart-2', min: -100, max: 100, step: 1, defaultValue: 0 },
  { key: 'saturation', label: 'editor.feature.saturation', icon: 'droplet', min: -100, max: 100, step: 1, defaultValue: 0 },
  { key: 'warmth', label: 'editor.feature.warmth', icon: 'thermometer', min: -100, max: 100, step: 1, defaultValue: 0 },
  { key: 'vignette', label: 'editor.feature.vignette', icon: 'target', min: 0, max: 100, step: 1, defaultValue: 0 },
  { key: 'blur', label: 'editor.feature.blur', icon: 'circle', min: 0, max: 100, step: 1, defaultValue: 0 },
];