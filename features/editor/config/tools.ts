// app/(tabs)/editor/config/tools.ts - FAZ 3 GÜNCELLEMESİ (Crop Aracı Eklendi)

export type ToolType = 'background' | 'adjust' | 'filter' | 'crop' | 'export'; // Crop eklendi
export type TargetType = 'product' | 'background' | 'all';

export interface ToolConfig {
  key: ToolType;
  icon: string;
  labelKey: string; // label yerine labelKey kullanıldı
  descriptionKey?: string; // description yerine descriptionKey kullanıldı
}

export interface TargetConfig {
  key: TargetType;
  labelKey: string; // label yerine labelKey kullanıldı
  descriptionKey?: string; // description yerine descriptionKey kullanıldı
}

export const MAIN_TOOLS: ToolConfig[] = [
  {
    key: 'background',
    icon: 'image',
    labelKey: 'editor.toolLabels.background', // Lokalize edildi
  },
  {
    key: 'adjust',
    icon: 'sliders',
    labelKey: 'editor.toolLabels.adjust', // Lokalize edildi
  },
  {
    key: 'filter',
    icon: 'filter',
    labelKey: 'editor.toolLabels.filter', // Lokalize edildi
  },
  {
    key: 'crop', // YENİ
    icon: 'crop',
    labelKey: 'editor.toolLabels.crop', // Lokalize edildi
  },
  {
    key: 'export',
    icon: 'download',
    labelKey: 'editor.toolLabels.export', // Lokalize edildi
  },
];

export const TARGET_SELECTOR: TargetConfig[] = [
  { key: 'product', labelKey: 'editor.targetLabels.product' }, // Lokalize edildi
  { key: 'background', labelKey: 'editor.targetLabels.background' }, // Lokalize edildi
  { key: 'all', labelKey: 'editor.targetLabels.all' }, // Lokalize edildi
];