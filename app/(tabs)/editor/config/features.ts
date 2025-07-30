// app/(tabs)/editor/config/features.ts

export interface FeatureConfig {
  key: string;
  label: string;
  icon: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
}

export const ADJUST_FEATURES: FeatureConfig[] = [
  { key: 'exposure', label: 'Pozlama', icon: 'sun', min: -100, max: 100, step: 1, defaultValue: 0 },
  { key: 'brightness', label: 'Parlaklık', icon: 'circle', min: -100, max: 100, step: 1, defaultValue: 0 },
  { key: 'highlights', label: 'Vurgular', icon: 'trending-up', min: -100, max: 100, step: 1, defaultValue: 0 },
  { key: 'shadows', label: 'Gölgeler', icon: 'trending-down', min: -100, max: 100, step: 1, defaultValue: 0 },
  { key: 'contrast', label: 'Kontrast', icon: 'bar-chart-2', min: -100, max: 100, step: 1, defaultValue: 0 },
  { key: 'saturation', label: 'Doygun.', icon: 'droplet', min: -100, max: 100, step: 1, defaultValue: 0 },
  { key: 'vibrance', label: 'Titreşim', icon: 'zap', min: -100, max: 100, step: 1, defaultValue: 0 },
  { key: 'warmth', label: 'Sıcaklık', icon: 'thermometer', min: -100, max: 100, step: 1, defaultValue: 0 },
  { key: 'clarity', label: 'Netlik', icon: 'aperture', min: -100, max: 100, step: 1, defaultValue: 0 },
  // Vinyet kaldırıldı - sadece background'da olacak
];

// Arka plan özel ayarları
export const BACKGROUND_FEATURES: FeatureConfig[] = [
  { key: 'exposure', label: 'Pozlama', icon: 'sun', min: -100, max: 100, step: 1, defaultValue: 0 },
  { key: 'brightness', label: 'Parlaklık', icon: 'circle', min: -100, max: 100, step: 1, defaultValue: 0 },
  { key: 'contrast', label: 'Kontrast', icon: 'bar-chart-2', min: -100, max: 100, step: 1, defaultValue: 0 },
  { key: 'saturation', label: 'Doygunluk', icon: 'droplet', min: -100, max: 100, step: 1, defaultValue: 0 },
  { key: 'warmth', label: 'Sıcaklık', icon: 'thermometer', min: -100, max: 100, step: 1, defaultValue: 0 },
  { key: 'vignette', label: 'Vinyet', icon: 'target', min: 0, max: 100, step: 1, defaultValue: 0 }, // Sadece pozitif
  { key: 'blur', label: 'Bulanıklık', icon: 'circle', min: 0, max: 100, step: 1, defaultValue: 0 },
];

export const CROP_FEATURES: FeatureConfig[] = [
  { key: 'straighten', label: 'Düzelt', icon: 'rotate-cw', min: -45, max: 45, step: 0.1, defaultValue: 0 },
  { key: 'vertical', label: 'Dikey', icon: 'maximize-2', min: -100, max: 100, step: 1, defaultValue: 0 },
  { key: 'horizontal', label: 'Yatay', icon: 'minimize-2', min: -100, max: 100, step: 1, defaultValue: 0 },
];

// Apple Photos tarzı hızlı ayarlar
export const QUICK_FEATURES: FeatureConfig[] = [
  { key: 'auto', label: 'Otomatik', icon: 'magic-wand', min: 0, max: 100, step: 1, defaultValue: 0 },
  { key: 'brilliance', label: 'Parlaklık', icon: 'sun', min: -100, max: 100, step: 1, defaultValue: 0 },
  { key: 'highlights', label: 'Vurgular', icon: 'trending-up', min: -100, max: 100, step: 1, defaultValue: 0 },
  { key: 'shadows', label: 'Gölgeler', icon: 'trending-down', min: -100, max: 100, step: 1, defaultValue: 0 },
  { key: 'contrast', label: 'Kontrast', icon: 'bar-chart-2', min: -100, max: 100, step: 1, defaultValue: 0 },
  { key: 'brightness', label: 'Parlaklık', icon: 'circle', min: -100, max: 100, step: 1, defaultValue: 0 },
  { key: 'blackPoint', label: 'Siyah Nokta', icon: 'circle', min: -100, max: 100, step: 1, defaultValue: 0 },
  { key: 'saturation', label: 'Doygunluk', icon: 'droplet', min: -100, max: 100, step: 1, defaultValue: 0 },
  { key: 'vibrance', label: 'Titreşim', icon: 'zap', min: -100, max: 100, step: 1, defaultValue: 0 },
  { key: 'warmth', label: 'Sıcaklık', icon: 'thermometer', min: -100, max: 100, step: 1, defaultValue: 0 },
  { key: 'tint', label: 'Ton', icon: 'palette', min: -100, max: 100, step: 1, defaultValue: 0 },
  { key: 'sharpness', label: 'Keskinlik', icon: 'aperture', min: -100, max: 100, step: 1, defaultValue: 0 },
  { key: 'definition', label: 'Tanım', icon: 'layers', min: -100, max: 100, step: 1, defaultValue: 0 },
  { key: 'noiseReduction', label: 'Gürültü Azaltma', icon: 'shield', min: 0, max: 100, step: 1, defaultValue: 0 },
  { key: 'vignette', label: 'Vinyet', icon: 'target', min: -100, max: 100, step: 1, defaultValue: 0 },
];