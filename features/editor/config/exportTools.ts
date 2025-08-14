// features/editor/config/exportTools.ts - TAM VE EKSİKSİZ VERSİYON (KATEGORİ BAŞINA 10 PRESET)
import i18n from '@/i18n'; // i18n import edildi

export interface ExportPreset {
  id: string;
  nameKey: string; // Lokalizasyon için nameKey eklendi
  descriptionKey: string; // Lokalizasyon için descriptionKey eklendi
  dimensions: { width: number; height: number };
  format: 'jpg' | 'png';
  quality: number;
  category: 'social' | 'marketplace' | 'print' | 'custom' | 'web';
  icon: string;
}

export interface ShareOption {
  id: string;
  nameKey: string; // Lokalizasyon için nameKey eklendi
  icon: string;
  type: 'gallery' | 'generic'; // 'quick_custom' kaldırıldı
}

export const EXPORT_PRESETS: ExportPreset[] = [
  // === SOSYAL MEDYA (Şimdi 10 Seçenek) ===
  { 
    id: 'instagram_square', 
    nameKey: 'exportPresets.instagram_square.name', 
    descriptionKey: 'exportPresets.instagram_square.description', 
    dimensions: { width: 1080, height: 1080 }, 
    format: 'jpg', 
    quality: 0.9, 
    category: 'social', 
    icon: 'instagram' 
  },
  { 
    id: 'instagram_story', 
    nameKey: 'exportPresets.instagram_story.name', 
    descriptionKey: 'exportPresets.instagram_story.description', 
    dimensions: { width: 1080, height: 1920 }, 
    format: 'jpg', 
    quality: 0.9, 
    category: 'social', 
    icon: 'smartphone' 
  },
  { 
    id: 'instagram_portrait', 
    nameKey: 'exportPresets.instagram_portrait.name', 
    descriptionKey: 'exportPresets.instagram_portrait.description', 
    dimensions: { width: 1080, height: 1350 }, 
    format: 'jpg', 
    quality: 0.9, 
    category: 'social', 
    icon: 'maximize' 
  },
  { 
    id: 'youtube_thumbnail', 
    nameKey: 'exportPresets.youtube_thumbnail.name', 
    descriptionKey: 'exportPresets.youtube_thumbnail.description', 
    dimensions: { width: 1280, height: 720 }, 
    format: 'jpg', 
    quality: 0.9, 
    category: 'social', 
    icon: 'youtube' 
  },
  { 
    id: 'facebook_post', 
    nameKey: 'exportPresets.facebook_post.name', 
    descriptionKey: 'exportPresets.facebook_post.description', 
    dimensions: { width: 1200, height: 630 }, 
    format: 'jpg', 
    quality: 0.85, 
    category: 'social', 
    icon: 'facebook' 
  },
  { 
    id: 'pinterest_pin', 
    nameKey: 'exportPresets.pinterest_pin.name', 
    descriptionKey: 'exportPresets.pinterest_pin.description', 
    dimensions: { width: 1000, height: 1500 }, 
    format: 'jpg', 
    quality: 0.9, 
    category: 'social', 
    icon: 'bookmark' 
  },
  { 
    id: 'twitter_post', 
    nameKey: 'exportPresets.twitter_post.name', 
    descriptionKey: 'exportPresets.twitter_post.description', 
    dimensions: { width: 1600, height: 900 }, 
    format: 'png', 
    quality: 0.9, 
    category: 'social', 
    icon: 'twitter' 
  },
  {
    id: 'snapchat_story',
    nameKey: 'exportPresets.snapchat_story.name',
    descriptionKey: 'exportPresets.snapchat_story.description',
    dimensions: { width: 1080, height: 1920 },
    format: 'jpg',
    quality: 0.88,
    category: 'social',
    icon: 'message-square'
  },
  {
    id: 'linkedin_post',
    nameKey: 'exportPresets.linkedin_post.name',
    descriptionKey: 'exportPresets.linkedin_post.description',
    dimensions: { width: 1200, height: 627 },
    format: 'jpg',
    quality: 0.9,
    category: 'social',
    icon: 'linkedin'
  },
  {
    id: 'tiktok_cover',
    nameKey: 'exportPresets.tiktok_cover.name',
    descriptionKey: 'exportPresets.tiktok_cover.description',
    dimensions: { width: 1080, height: 1920 },
    format: 'jpg',
    quality: 0.88,
    category: 'social',
    icon: 'music'
  },

  // === E-TİCARET (Şimdi 10 Seçenek) ===
  { 
    id: 'trendyol_main', 
    nameKey: 'exportPresets.trendyol_main.name', 
    descriptionKey: 'exportPresets.trendyol_main.description', 
    dimensions: { width: 1200, height: 1800 }, 
    format: 'jpg', 
    quality: 0.9, 
    category: 'marketplace', 
    icon: 'shopping-bag' 
  },
  { 
    id: 'hepsiburada_main', 
    nameKey: 'exportPresets.hepsiburada_main.name', 
    descriptionKey: 'exportPresets.hepsiburada_main.description', 
    dimensions: { width: 1500, height: 1500 }, 
    format: 'jpg', 
    quality: 0.9, 
    category: 'marketplace', 
    icon: 'shopping-cart' 
  },
  { 
    id: 'amazon_main', 
    nameKey: 'exportPresets.amazon_main.name', 
    descriptionKey: 'exportPresets.amazon_main.description', 
    dimensions: { width: 2000, height: 2000 }, 
    format: 'jpg', 
    quality: 0.95, 
    category: 'marketplace', 
    icon: 'box' 
  },
  { 
    id: 'shopify_product', 
    nameKey: 'exportPresets.shopify_product.name', 
    descriptionKey: 'exportPresets.shopify_product.description', 
    dimensions: { width: 2048, height: 2048 }, 
    format: 'jpg', 
    quality: 0.92, 
    category: 'marketplace', 
    icon: 'figma' 
  },
  { 
    id: 'etsy_listing', 
    nameKey: 'exportPresets.etsy_listing.name', 
    descriptionKey: 'exportPresets.etsy_listing.description', 
    dimensions: { width: 2700, height: 2025 }, 
    format: 'jpg', 
    quality: 0.92, 
    category: 'marketplace', 
    icon: 'gift' 
  },
  { 
    id: 'generic_ecommerce', 
    nameKey: 'exportPresets.generic_ecommerce.name', 
    descriptionKey: 'exportPresets.generic_ecommerce.description', 
    dimensions: { width: 1000, height: 1000 }, 
    format: 'jpg', 
    quality: 0.85, 
    category: 'marketplace', 
    icon: 'tag' 
  },
  {
    id: 'ebay_listing',
    nameKey: 'exportPresets.ebay_listing.name',
    descriptionKey: 'exportPresets.ebay_listing.description',
    dimensions: { width: 1600, height: 1600 },
    format: 'jpg',
    quality: 0.9,
    category: 'marketplace',
    icon: 'shopping-bag'
  },
  {
    id: 'aliexpress_product',
    nameKey: 'exportPresets.aliexpress_product.name',
    descriptionKey: 'exportPresets.aliexpress_product.description',
    dimensions: { width: 800, height: 800 },
    format: 'jpg',
    quality: 0.8,
    category: 'marketplace',
    icon: 'globe'
  },
  {
    id: 'google_shopping',
    nameKey: 'exportPresets.google_shopping.name',
    descriptionKey: 'exportPresets.google_shopping.description',
    dimensions: { width: 1200, height: 1200 },
    format: 'jpg',
    quality: 0.9,
    category: 'marketplace',
    icon: 'shopping-cart'
  },
  {
    id: 'z_fashion_platform',
    nameKey: 'exportPresets.z_fashion_platform.name',
    descriptionKey: 'exportPresets.z_fashion_platform.description',
    dimensions: { width: 1080, height: 1440 },
    format: 'jpg',
    quality: 0.88,
    category: 'marketplace',
    icon: 'camera'
  },

  // === WEB & DİJİTAL (Şimdi 10 Seçenek) ===
  { 
    id: 'web_hero', 
    nameKey: 'exportPresets.web_hero.name', 
    descriptionKey: 'exportPresets.web_hero.description', 
    dimensions: { width: 1920, height: 1080 }, 
    format: 'jpg', 
    quality: 0.88, 
    category: 'web', 
    icon: 'layout' 
  },
  { 
    id: 'web_banner_wide', 
    nameKey: 'exportPresets.web_banner_wide.name', 
    descriptionKey: 'exportPresets.web_banner_wide.description', 
    dimensions: { width: 728, height: 90 }, 
    format: 'png', 
    quality: 0.9, 
    category: 'web', 
    icon: 'minus' 
  },
  { 
    id: 'web_banner_square', 
    nameKey: 'exportPresets.web_banner_square.name', 
    descriptionKey: 'exportPresets.web_banner_square.description', 
    dimensions: { width: 300, height: 250 }, 
    format: 'png', 
    quality: 0.9, 
    category: 'web', 
    icon: 'sidebar' 
  },
  { 
    id: 'web_blog_featured', 
    nameKey: 'exportPresets.web_blog_featured.name', 
    descriptionKey: 'exportPresets.web_blog_featured.description', 
    dimensions: { width: 1200, height: 800 }, 
    format: 'jpg', 
    quality: 0.85, 
    category: 'web', 
    icon: 'align-left' 
  },
  { 
    id: 'web_favicon', 
    nameKey: 'exportPresets.web_favicon.name', 
    descriptionKey: 'exportPresets.web_favicon.description', 
    dimensions: { width: 64, height: 64 }, 
    format: 'png', 
    quality: 1.0, 
    category: 'web', 
    icon: 'star' 
  },
  { 
    id: 'email_header', 
    nameKey: 'exportPresets.email_header.name', 
    descriptionKey: 'exportPresets.email_header.description', 
    dimensions: { width: 600, height: 200 }, 
    format: 'jpg', 
    quality: 0.85, 
    category: 'web', 
    icon: 'mail' 
  },
  {
    id: 'web_profile_banner',
    nameKey: 'exportPresets.web_profile_banner.name',
    descriptionKey: 'exportPresets.web_profile_banner.description',
    dimensions: { width: 1500, height: 500 },
    format: 'jpg',
    quality: 0.88,
    category: 'web',
    icon: 'image'
  },
  {
    id: 'mobile_wallpaper',
    nameKey: 'exportPresets.mobile_wallpaper.name',
    descriptionKey: 'exportPresets.mobile_wallpaper.description',
    dimensions: { width: 1080, height: 1920 },
    format: 'jpg',
    quality: 0.9,
    category: 'web',
    icon: 'smartphone'
  },
  {
    id: 'desktop_wallpaper_hd',
    nameKey: 'exportPresets.desktop_wallpaper_hd.name',
    descriptionKey: 'exportPresets.desktop_wallpaper_hd.description',
    dimensions: { width: 1920, height: 1080 },
    format: 'jpg',
    quality: 0.9,
    category: 'web',
    icon: 'monitor'
  },
  {
    id: 'newsletter_ad_small',
    nameKey: 'exportPresets.newsletter_ad_small.name',
    descriptionKey: 'exportPresets.newsletter_ad_small.description',
    dimensions: { width: 320, height: 100 },
    format: 'png',
    quality: 0.85,
    category: 'web',
    icon: 'send'
  },

  // === BASKI (Şimdi 10 Seçenek) ===
  { 
    id: 'print_a4', 
    nameKey: 'exportPresets.print_a4.name', 
    descriptionKey: 'exportPresets.print_a4.description', 
    dimensions: { width: 2480, height: 3508 }, 
    format: 'png', 
    quality: 1.0, 
    category: 'print', 
    icon: 'file-text' 
  },
  { 
    id: 'print_a5', 
    nameKey: 'exportPresets.print_a5.name', 
    descriptionKey: 'exportPresets.print_a5.description', 
    dimensions: { width: 1748, height: 2480 }, 
    format: 'png', 
    quality: 1.0, 
    category: 'print', 
    icon: 'file' 
  },
  { 
    id: 'print_10x15', 
    nameKey: 'exportPresets.print_10x15.name', 
    descriptionKey: 'exportPresets.print_10x15.description', 
    dimensions: { width: 1181, height: 1772 }, 
    format: 'jpg', 
    quality: 0.98, 
    category: 'print', 
    icon: 'camera' 
  },
  { 
    id: 'print_13x18', 
    nameKey: 'exportPresets.print_13x18.name', 
    descriptionKey: 'exportPresets.print_13x18.description', 
    dimensions: { width: 1535, height: 2126 }, 
    format: 'jpg', 
    quality: 0.98, 
    category: 'print', 
    icon: 'image' 
  },
  { 
    id: 'print_business_card', 
    nameKey: 'exportPresets.print_business_card.name', 
    descriptionKey: 'exportPresets.print_business_card.description', 
    dimensions: { width: 1004, height: 650 }, 
    format: 'png', 
    quality: 1.0, 
    category: 'print', 
    icon: 'credit-card' 
  },
  { 
    id: 'print_poster', 
    nameKey: 'exportPresets.print_poster.name', 
    descriptionKey: 'exportPresets.print_poster.description', 
    dimensions: { width: 3508, height: 4961 }, 
    format: 'png', 
    quality: 1.0, 
    category: 'print', 
    icon: 'map' 
  },
  {
    id: 'print_flyer_a6',
    nameKey: 'exportPresets.print_flyer_a6.name',
    descriptionKey: 'exportPresets.print_flyer_a6.description',
    dimensions: { width: 1240, height: 1748 },
    format: 'png',
    quality: 0.98,
    category: 'print',
    icon: 'clipboard'
  },
  {
    id: 'print_post_card_a6',
    nameKey: 'exportPresets.print_post_card_a6.name',
    descriptionKey: 'exportPresets.print_post_card_a6.description',
    dimensions: { width: 1748, height: 1240 },
    format: 'jpg',
    quality: 0.95,
    category: 'print',
    icon: 'mail'
  },
  {
    id: 'print_us_letter',
    nameKey: 'exportPresets.print_us_letter.name',
    descriptionKey: 'exportPresets.print_us_letter.description',
    dimensions: { width: 2550, height: 3300 },
    format: 'png',
    quality: 1.0,
    category: 'print',
    icon: 'file-text'
  },
  {
    id: 'print_magazine_spread',
    nameKey: 'exportPresets.print_magazine_spread.name',
    descriptionKey: 'exportPresets.print_magazine_spread.description',
    dimensions: { width: 5100, height: 3300 },
    format: 'png',
    quality: 1.0,
    category: 'print',
    icon: 'book'
  },

  // === ÖZEL (Şimdi 10 Seçenek) ===
  { 
    id: 'custom_widescreen', 
    nameKey: 'exportPresets.custom_widescreen.name', 
    descriptionKey: 'exportPresets.custom_widescreen.description', 
    dimensions: { width: 1920, height: 1080 }, 
    format: 'png', 
    quality: 0.95, 
    category: 'custom', 
    icon: 'tv' 
  },
  { 
    id: 'custom_classic_photo', 
    nameKey: 'exportPresets.custom_classic_photo.name', 
    descriptionKey: 'exportPresets.custom_classic_photo.description', 
    dimensions: { width: 1080, height: 720 }, 
    format: 'png', 
    quality: 0.95, 
    category: 'custom', 
    icon: 'camera' 
  },
  { 
    id: 'custom_portrait', 
    nameKey: 'exportPresets.custom_portrait.name', 
    descriptionKey: 'exportPresets.custom_portrait.description', 
    dimensions: { width: 720, height: 1080 }, 
    format: 'png', 
    quality: 0.95, 
    category: 'custom', 
    icon: 'user' 
  },
  { 
    id: 'custom_cinematic', 
    nameKey: 'exportPresets.custom_cinematic.name', 
    descriptionKey: 'exportPresets.custom_cinematic.description', 
    dimensions: { width: 2560, height: 1080 }, 
    format: 'png', 
    quality: 0.95, 
    category: 'custom', 
    icon: 'film' 
  },
  { 
    id: 'custom_square_hd', 
    nameKey: 'exportPresets.custom_square_hd.name', 
    descriptionKey: 'exportPresets.custom_square_hd.description', 
    dimensions: { width: 1920, height: 1920 }, 
    format: 'png', 
    quality: 0.95, 
    category: 'custom', 
    icon: 'square' 
  },
  { 
    id: 'custom_a4_landscape', 
    nameKey: 'exportPresets.custom_a4_landscape.name', 
    descriptionKey: 'exportPresets.custom_a4_landscape.description', 
    dimensions: { width: 3508, height: 2480 }, 
    format: 'png', 
    quality: 0.95, 
    category: 'custom', 
    icon: 'file-text' 
  },
  {
    id: 'custom_4k_uhd',
    nameKey: 'exportPresets.custom_4k_uhd.name',
    descriptionKey: 'exportPresets.custom_4k_uhd.description',
    dimensions: { width: 3840, height: 2160 },
    format: 'png',
    quality: 0.98,
    category: 'custom',
    icon: 'monitor'
  },
  {
    id: 'custom_long_vertical',
    nameKey: 'exportPresets.custom_long_vertical.name',
    descriptionKey: 'exportPresets.custom_long_vertical.description',
    dimensions: { width: 800, height: 2000 },
    format: 'png',
    quality: 0.95,
    category: 'custom',
    icon: 'align-center'
  },
  {
    id: 'custom_ultra_wide_monitor',
    nameKey: 'exportPresets.custom_ultra_wide_monitor.name',
    descriptionKey: 'exportPresets.custom_ultra_wide_monitor.description',
    dimensions: { width: 3440, height: 1440 },
    format: 'png',
    quality: 0.95,
    category: 'custom',
    icon: 'monitor'
  },
  {
    id: 'custom_square_small',
    nameKey: 'exportPresets.custom_square_small.name',
    descriptionKey: 'exportPresets.custom_square_small.description',
    dimensions: { width: 500, height: 500 },
    format: 'jpg',
    quality: 0.8,
    category: 'custom',
    icon: 'square'
  },
];

export const SHARE_OPTIONS: ShareOption[] = [
  { 
    id: 'gallery', 
    nameKey: 'editor.shareOptions.gallery', 
    icon: 'download', 
    type: 'gallery' 
  },
  { 
    id: 'share', 
    nameKey: 'editor.shareOptions.share', 
    icon: 'share-2', 
    type: 'generic' 
  },
];

export const EXPORT_CATEGORIES = [
  { key: 'social', nameKey: 'editor.presetCategories.social', icon: 'share-2' },
  { key: 'marketplace', nameKey: 'editor.presetCategories.marketplace', icon: 'shopping-cart' },
  { key: 'web', nameKey: 'editor.presetCategories.web', icon: 'globe' },
  { key: 'print', nameKey: 'editor.presetCategories.print', icon: 'printer' },
  { key: 'custom', nameKey: 'editor.presetCategories.custom', icon: 'settings' }
] as const;

// === UTILITY FONKSİYONLARI ===

/**
 * Kategori ID'sine göre export preset'lerini filtreler
 */
export const getPresetsByCategory = (category: string): ExportPreset[] => {
  return EXPORT_PRESETS.filter(preset => preset.category === category);
};

/**
 * Preset ID'sine göre preset objesini döndürür
 */
export const getPresetById = (id: string): ExportPreset | undefined => {
  return EXPORT_PRESETS.find(preset => preset.id === id);
};

/**
 * En boy oranına göre uygun preset'leri önerir
 */
export const suggestPresetsByAspectRatio = (aspectRatio: number): ExportPreset[] => {
  const tolerance = 0.1; // %10 tolerans
  
  return EXPORT_PRESETS.filter(preset => {
    const presetRatio = preset.dimensions.width / preset.dimensions.height;
    return Math.abs(presetRatio - aspectRatio) <= tolerance;
  }).slice(0, 5); // En fazla 5 öneri
};

/**
 * Dosya boyutu tahmini (yaklaşık)
 */
export const estimateFileSize = (preset: ExportPreset): string => {
  const { width, height, quality, format } = preset;
  const pixelCount = width * height;
  
  // Yaklaşık hesaplama (bytes)
  let estimatedBytes: number;
  
  if (format === 'png') {
    // PNG için yaklaşık 3-4 bytes per pixel
    estimatedBytes = pixelCount * 3.5;
  } else {
    // JPEG için kalite faktörü ile
    const qualityFactor = quality < 0.7 ? 0.5 : quality < 0.9 ? 1.0 : 1.5;
    estimatedBytes = pixelCount * qualityFactor;
  }
  
  // MB cinsinden döndür
  const mb = estimatedBytes / (1024 * 1024);
  
  if (mb < 1) {
    return `${Math.round(mb * 1024)} KB`;
  } else if (mb < 10) {
    return `${mb.toFixed(1)} MB`;
  } else {
    return `${Math.round(mb)} MB`;
  }
};

/**
 * Popüler preset'leri döndürür (kullanım sıklığına göre)
 */
export const getPopularPresets = (): ExportPreset[] => {
  const popularIds = [
    'instagram_square',
    'instagram_story',
    'trendyol_main',
    'amazon_main',
    'web_hero',
    'custom_widescreen'
  ];
  
  return popularIds
    .map(id => getPresetById(id))
    .filter(Boolean) as ExportPreset[];
};

/**
 * Platform önerilerini döndürür
 */
export const getPlatformRecommendations = (platform: string): ExportPreset[] => {
  const recommendations: Record<string, string[]> = {
    'instagram': ['instagram_square', 'instagram_story', 'instagram_portrait'],
    'facebook': ['facebook_post', 'instagram_square'],
    'twitter': ['twitter_post', 'web_hero'],
    'ecommerce': ['amazon_main', 'trendyol_main', 'hepsiburada_main'],
    'web': ['web_hero', 'web_blog_featured', 'web_banner_wide'],
    'print': ['print_a4', 'print_10x15', 'print_business_card']
  };
  
  const presetIds = recommendations[platform.toLowerCase()] || [];
  return presetIds
    .map(id => getPresetById(id))
    .filter(Boolean) as ExportPreset[];
};

/**
 * Özel boyut validasyonu
 */
export const validateCustomDimensions = (width: number, height: number): {
  isValid: boolean;
  message?: string;
} => {
  const MIN_SIZE = 32;
  const MAX_SIZE = 8192;
  
  if (width < MIN_SIZE || height < MIN_SIZE) {
    return {
      isValid: false,
      message: i18n.t('editor.minDimensionError', { minSize: MIN_SIZE }) // Lokalize edildi
    };
  }
  
  if (width > MAX_SIZE || height > MAX_SIZE) {
    return {
      isValid: false,
      message: i18n.t('editor.maxDimensionError', { maxSize: MAX_SIZE }) // Lokalize edildi
    };
  }
  
  const totalPixels = width * height;
  const MAX_PIXELS = 50 * 1024 * 1024; // 50 megapixel
  
  if (totalPixels > MAX_PIXELS) {
    return {
      isValid: false,
      message: i18n.t('editor.maxPixelCountError') // Lokalize edildi
    };
  }
  
  return { isValid: true };
};

/**
 * Dinamik preset oluşturur.
 * nameKey ve descriptionKey, i18n dosyalarındaki anahtarlara referans verir.
 * Gösterilirken dinamik değerler (width, height) interpolate edilmelidir.
 */
export const createCustomPreset = (
  width: number, 
  height: number, 
  name?: string, 
  format: 'jpg' | 'png' = 'png'
): ExportPreset => {
  const aspectRatio = width / height;
  const defaultNameKey = name || 'exportPresets.customGeneratedName'; // Ham metin yerine anahtar
  
  // En boy oranına göre kategori belirle
  let category: ExportPreset['category'] = 'custom';
  if (aspectRatio > 1.5) category = 'web';
  else if (aspectRatio === 1) category = 'social';
  else if (aspectRatio < 0.8) category = 'social';
  
  return {
    id: `custom_${width}x${height}_${Date.now()}`, // Unique ID
    nameKey: defaultNameKey, // Bu bir i18n anahtarı olacak, bileşen tarafında {width, height} ile çevrilecek
    descriptionKey: 'exportPresets.customGeneratedDescription', // Bu da bir i18n anahtarı olacak
    dimensions: { width, height },
    format,
    quality: format === 'png' ? 0.95 : 0.9,
    category,
    icon: 'settings'
  };
};