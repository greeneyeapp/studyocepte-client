// app/(tabs)/editor/config/tools.ts - FAZ 3 GÜNCELLEMESİ (Crop Aracı Eklendi)

export type ToolType = 'background' | 'adjust' | 'filter' | 'crop' | 'export'; // Crop eklendi
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

export const MAIN_TOOLS: ToolConfig[] = [
  {
    key: 'background',
    icon: 'image',
    label: 'Arka Plan',
  },
  {
    key: 'adjust',
    icon: 'sliders',
    label: 'Ayarla',
  },
  {
    key: 'filter',
    icon: 'filter',
    label: 'Filtreler',
  },
  {
    key: 'crop', // YENİ
    icon: 'crop',
    label: 'Kırp',
  },
  {
    key: 'export',
    icon: 'download',
    label: 'Export',
  },
];

export const TARGET_SELECTOR: TargetConfig[] = [
  { key: 'product', label: 'Ürün' },
  { key: 'background', label: 'Arka Plan' },
  { key: 'all', label: 'Tümü' },
];