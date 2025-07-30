// app/(tabs)/editor/config/tools.ts

export type ToolType = 'background' | 'adjust' | 'filter' | 'crop';
export type TargetType = 'product' | 'background' | 'all';

export interface ToolConfig {
  key: ToolType;
  icon: string;
  label: string;
  description?: string;
}

export interface TargetConfig {
  key: TargetType;
  label: string;
  description?: string;
}

// Ana araçlar - teknik spesifikasyona uygun
export const MAIN_TOOLS: ToolConfig[] = [
  {
    key: 'background',
    icon: 'image',
    label: 'Arka Plan',
    description: 'Arka plan görsellerini değiştir'
  },
  {
    key: 'adjust',
    icon: 'sliders',
    label: 'Ayarla',
    description: 'Pozlama, kontrast ve diğer ayarlar'
  },
  {
    key: 'filter',
    icon: 'filter',
    label: 'Filtreler',
    description: 'Hazır filtre efektlerini uygula'
  },
  {
    key: 'crop',
    icon: 'crop',
    label: 'Kırp',
    description: 'Kırpma, döndürme ve perspektif'
  },
];

// Hedef seçici - teknik spesifikasyona uygun
export const TARGET_SELECTOR: TargetConfig[] = [
  {
    key: 'product',
    label: 'Ürün',
    description: 'Sadece ürün fotoğrafına uygula'
  },
  {
    key: 'background',
    label: 'Arka Plan',
    description: 'Sadece arka plana uygula'
  },
  {
    key: 'all',
    label: 'Tümü',
    description: 'Hem ürün hem arka plana uygula'
  },
];

// Kırpma araçları
export const CROP_TOOLS = [
  { key: 'rotate', icon: 'rotate-cw', label: 'Döndür' },
  { key: 'flip', icon: 'flip-horizontal', label: 'Çevir' },
  { key: 'straighten', icon: 'move', label: 'Düzelt' },
  { key: 'perspective', icon: 'square', label: 'Perspektif' },
];

// Kırpma oranları
export const ASPECT_RATIOS = [
  { key: 'original', label: 'Orijinal', ratio: null },
  { key: 'square', label: '1:1', ratio: 1 },
  { key: 'portrait', label: '4:5', ratio: 4/5 },
  { key: 'landscape', label: '16:9', ratio: 16/9 },
  { key: 'story', label: '9:16', ratio: 9/16 },
  { key: 'post', label: '4:3', ratio: 4/3 },
];