// app/(tabs)/editor/config/tools.ts - FAZ 3 GÜNCELLEMESİ (ÇEVİRİ ANAHTARLARI KULLANILDI)

export type ToolType = 'background' | 'adjust' | 'filter' | 'crop' | 'export';
export type TargetType = 'product' | 'background' | 'all';

export interface ToolConfig {
  key: ToolType;
  icon: string;
  label: string; // Bu artık doğrudan çeviri anahtarı olacak (örn. 'editor.tool.background')
  description?: string;
}

export interface TargetConfig {
  key: TargetType;
  label: string; // Bu artık doğrudan çeviri anahtarı olacak (örn. 'editor.target.product')
  description?: string;
}

export const MAIN_TOOLS: ToolConfig[] = [
  {
    key: 'background',
    icon: 'image',
    label: 'editor.tool.background', // Çeviri anahtarı
  },
  {
    key: 'adjust',
    icon: 'sliders',
    label: 'editor.tool.adjust', // Çeviri anahtarı
  },
  {
    key: 'filter',
    icon: 'filter',
    label: 'editor.tool.filters', // Çeviri anahtarı
  },
  {
    key: 'crop',
    icon: 'crop',
    label: 'editor.tool.crop', // Çeviri anahtarı
  },
  {
    key: 'export',
    icon: 'download',
    label: 'editor.tool.export', // Çeviri anahtarı
  },
];

export const TARGET_SELECTOR: TargetConfig[] = [
  { key: 'product', label: 'editor.target.product' }, // Çeviri anahtarı
  { key: 'background', label: 'editor.target.background' }, // Çeviri anahtarı
  { key: 'all', label: 'editor.target.all' }, // Çeviri anahtarı
];