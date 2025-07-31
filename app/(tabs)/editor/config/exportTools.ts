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
  packageName?: string; // Android package name
  urlScheme?: string; // iOS URL scheme
  type: 'whatsapp' | 'instagram' | 'facebook' | 'gallery' | 'email' | 'generic';
}

// E-ticaret ve sosyal medya platformları için önceden tanımlanmış boyutlar
export const EXPORT_PRESETS: ExportPreset[] = [
  // Sosyal Medya
  {
    id: 'instagram_square',
    name: 'Instagram Kare',
    description: '1080x1080 - Instagram feed için ideal',
    dimensions: { width: 1080, height: 1080 },
    format: 'jpg',
    quality: 0.9,
    category: 'social',
    icon: 'square'
  },
  {
    id: 'instagram_story',
    name: 'Instagram Story',
    description: '1080x1920 - Story ve Reels için',
    dimensions: { width: 1080, height: 1920 },
    format: 'jpg',
    quality: 0.9,
    category: 'social',
    icon: 'smartphone'
  },
  {
    id: 'facebook_post',
    name: 'Facebook Post',
    description: '1200x630 - Facebook paylaşımları için',
    dimensions: { width: 1200, height: 630 },
    format: 'jpg',
    quality: 0.85,
    category: 'social',
    icon: 'image'
  },

  // E-ticaret Platformları
  {
    id: 'trendyol_main',
    name: 'Trendyol Ana',
    description: '1200x1200 - Trendyol ana ürün fotoğrafı',
    dimensions: { width: 1200, height: 1200 },
    format: 'jpg',
    quality: 0.9,
    category: 'marketplace',
    icon: 'shopping-bag'
  },
  {
    id: 'n11_product',
    name: 'N11 Ürün',
    description: '1000x1000 - N11 ürün fotoğrafı',
    dimensions: { width: 1000, height: 1000 },
    format: 'jpg',
    quality: 0.85,
    category: 'marketplace',
    icon: 'package'
  },
  {
    id: 'amazon_main',
    name: 'Amazon Ana',
    description: '2000x2000 - Amazon ana ürün görseli',
    dimensions: { width: 2000, height: 2000 },
    format: 'jpg',
    quality: 0.95,
    category: 'marketplace',
    icon: 'box'
  },
  {
    id: 'sahibinden',
    name: 'Sahibinden.com',
    description: '800x600 - Sahibinden ilan fotoğrafı',
    dimensions: { width: 800, height: 600 },
    format: 'jpg',
    quality: 0.8,
    category: 'marketplace',
    icon: 'home'
  },

  // Yazdırma
  {
    id: 'print_a4',
    name: 'A4 Baskı',
    description: '2480x3508 - 300 DPI A4 baskı',
    dimensions: { width: 2480, height: 3508 },
    format: 'jpg',
    quality: 1.0,
    category: 'print',
    icon: 'printer'
  },
  {
    id: 'print_square',
    name: 'Kare Baskı',
    description: '3000x3000 - Yüksek kalite kare baskı',
    dimensions: { width: 3000, height: 3000 },
    format: 'png',
    quality: 1.0,
    category: 'print',
    icon: 'grid'
  },

  // Özel
  {
    id: 'web_thumbnail',
    name: 'Web Thumbnail',
    description: '400x400 - Web sitesi küçük resmi',
    dimensions: { width: 400, height: 400 },
    format: 'jpg',
    quality: 0.8,
    category: 'custom',
    icon: 'monitor'
  },
  {
    id: 'whatsapp_status',
    name: 'WhatsApp Durum',
    description: '1080x1920 - WhatsApp durum için',
    dimensions: { width: 1080, height: 1920 },
    format: 'jpg',
    quality: 0.85,
    category: 'social',
    icon: 'message-circle'
  }
];

// Paylaşım seçenekleri
export const SHARE_OPTIONS: ShareOption[] = [
  {
    id: 'gallery',
    name: 'Galeriye Kaydet',
    icon: 'download',
    type: 'gallery'
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    icon: 'message-circle',
    packageName: 'com.whatsapp',
    urlScheme: 'whatsapp://send',
    type: 'whatsapp'
  },
  {
    id: 'instagram',
    name: 'Instagram',
    icon: 'instagram',
    packageName: 'com.instagram.android',
    urlScheme: 'instagram://share',
    type: 'instagram'
  },
  {
    id: 'facebook',
    name: 'Facebook',
    icon: 'facebook',
    packageName: 'com.facebook.katana',
    urlScheme: 'facebook://share',
    type: 'facebook'
  },
  {
    id: 'email',
    name: 'E-posta',
    icon: 'mail',
    type: 'email'
  },
  {
    id: 'more',
    name: 'Daha Fazla',
    icon: 'share',
    type: 'generic'
  }
];

export const EXPORT_CATEGORIES = [
  { key: 'social', name: 'Sosyal Medya', icon: 'share-2' },
  { key: 'marketplace', name: 'E-ticaret', icon: 'shopping-cart' },
  { key: 'print', name: 'Baskı', icon: 'printer' },
  { key: 'custom', name: 'Özel', icon: 'settings' }
] as const;