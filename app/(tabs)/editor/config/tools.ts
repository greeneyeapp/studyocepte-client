// app/(tabs)/editor/config/tools.ts - Updated with Export Tool

export type ToolType = 'background' | 'adjust' | 'filter' | 'export'; // Export eklendi
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

// Ana araçlar - Export eklendi
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
    key: 'export',
    icon: 'download',
    label: 'Export',
    description: 'Kaydet ve paylaş'
  },
];

// Hedef seçici - export için de gösterilecek (ama sadece preview etkilemek için)
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