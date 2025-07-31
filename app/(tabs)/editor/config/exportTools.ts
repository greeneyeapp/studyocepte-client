// app/(tabs)/editor/config/exportTools.ts

export interface ExportPreset {
  id: string;
  name: string;
  description: string;
  dimensions: { width: number; height: number };
  format: 'jpg' | 'png';
  quality: number; // 0.1 to 1.0
  category: 'social' | 'marketplace' | 'print' | 'custom';
  icon: string;
}

export interface ShareOption {
  id: string;
  name: string;
  icon: string;
  type: 'gallery' | 'generic'; // Tipler sadeleştirildi
}

// ... EXPORT_PRESETS aynı kalabilir ...
export const EXPORT_PRESETS: ExportPreset[] = [
  // ... mevcut presetler ...
];


// --- DÜZELTME ---
// Paylaşım seçenekleri, platform kurallarına uygun olacak şekilde yeniden düzenlendi.
export const SHARE_OPTIONS: ShareOption[] = [
  {
    id: 'gallery',
    name: 'Galeriye Kaydet',
    icon: 'download',
    type: 'gallery'
  },
  {
    id: 'share',
    name: 'Paylaş...',
    icon: 'share-2', // Standart paylaş ikonu
    type: 'generic'
  }
];


export const EXPORT_CATEGORIES = [
  { key: 'social', name: 'Sosyal Medya', icon: 'share-2' },
  { key: 'marketplace', name: 'E-ticaret', icon: 'shopping-cart' },
  { key: 'print', name: 'Baskı', icon: 'printer' },
  { key: 'custom', name: 'Özel', icon: 'settings' }
] as const;