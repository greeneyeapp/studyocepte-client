// features/editor/config/exportTools.ts - TAM VE EKSİKSİZ VERSİYON (KATEGORİ BAŞINA 10 PRESET)

export interface ExportPreset {
  id: string;
  name: string;
  description: string;
  dimensions: { width: number; height: number };
  format: 'jpg' | 'png';
  quality: number;
  category: 'social' | 'marketplace' | 'print' | 'custom' | 'web';
  icon: string;
}

export interface ShareOption {
  id: string;
  name: string;
  icon: string;
  type: 'gallery' | 'generic'; // 'quick_custom' kaldırıldı
}

export const EXPORT_PRESETS: ExportPreset[] = [
  // === SOSYAL MEDYA (Şimdi 10 Seçenek) ===
  {
    id: 'instagram_square',
    name: 'Instagram Kare (1:1)',
    description: '1080x1080 - Akış gönderileri için ideal',
    dimensions: { width: 1080, height: 1080 },
    format: 'jpg',
    quality: 0.9,
    category: 'social',
    icon: 'instagram'
  },
  {
    id: 'instagram_story',
    name: 'Instagram Hikaye',
    description: '1080x1920 - Dikey story formatı',
    dimensions: { width: 1080, height: 1920 },
    format: 'jpg',
    quality: 0.9,
    category: 'social',
    icon: 'smartphone'
  },
  {
    id: 'instagram_portrait',
    name: 'Instagram Dikey (4:5)',
    description: '1080x1350 - Portre gönderi formatı',
    dimensions: { width: 1080, height: 1350 },
    format: 'jpg',
    quality: 0.9,
    category: 'social',
    icon: 'maximize'
  },
  {
    id: 'youtube_thumbnail',
    name: 'YouTube Thumbnail',
    description: '1280x720 - Video kapak fotoğrafı',
    dimensions: { width: 1280, height: 720 },
    format: 'jpg',
    quality: 0.9,
    category: 'social',
    icon: 'youtube'
  },
  {
    id: 'facebook_post',
    name: 'Facebook Gönderi',
    description: '1200x630 - Yatay paylaşımlar için',
    dimensions: { width: 1200, height: 630 },
    format: 'jpg',
    quality: 0.85,
    category: 'social',
    icon: 'facebook'
  },
  {
    id: 'pinterest_pin',
    name: 'Pinterest Pin',
    description: '1000x1500 - Standart dikey Pin oranı',
    dimensions: { width: 1000, height: 1500 },
    format: 'jpg',
    quality: 0.9,
    category: 'social',
    icon: 'bookmark'
  },
  {
    id: 'twitter_post',
    name: 'X (Twitter) Gönderi',
    description: '1600x900 - Geniş formatlı tweet görüntüsü',
    dimensions: { width: 1600, height: 900 },
    format: 'png',
    quality: 0.9,
    category: 'social',
    icon: 'twitter'
  },
  {
    id: 'snapchat_story',
    name: 'Snapchat Hikaye',
    description: '1080x1920 - Full ekran dikey görsel',
    dimensions: { width: 1080, height: 1920 },
    format: 'jpg',
    quality: 0.88,
    category: 'social',
    icon: 'message-square'
  },
  {
    id: 'linkedin_post',
    name: 'LinkedIn Gönderi',
    description: '1200x627 - Profesyonel paylaşımlar için',
    dimensions: { width: 1200, height: 627 },
    format: 'jpg',
    quality: 0.9,
    category: 'social',
    icon: 'linkedin'
  },
  {
    id: 'tiktok_cover',
    name: 'TikTok Kapak',
    description: '1080x1920 - Dikey video kapak görseli',
    dimensions: { width: 1080, height: 1920 },
    format: 'jpg',
    quality: 0.88,
    category: 'social',
    icon: 'music'
  },

  // === E-TİCARET (Şimdi 10 Seçenek) ===
  {
    id: 'trendyol_main',
    name: 'Trendyol',
    description: '1200x1800 - Dikey ürün fotoğrafı formatı',
    dimensions: { width: 1200, height: 1800 },
    format: 'jpg',
    quality: 0.9,
    category: 'marketplace',
    icon: 'shopping-bag'
  },
  {
    id: 'hepsiburada_main',
    name: 'Hepsiburada',
    description: '1500x1500 - Standart kare ürün fotoğrafı',
    dimensions: { width: 1500, height: 1500 },
    format: 'jpg',
    quality: 0.9,
    category: 'marketplace',
    icon: 'shopping-cart'
  },
  {
    id: 'amazon_main',
    name: 'Amazon',
    description: '2000x2000 - Yüksek çözünürlüklü kare format',
    dimensions: { width: 2000, height: 2000 },
    format: 'jpg',
    quality: 0.95,
    category: 'marketplace',
    icon: 'box'
  },
  {
    id: 'shopify_product',
    name: 'Shopify',
    description: '2048x2048 - Yüksek kaliteli kare ürün görseli',
    dimensions: { width: 2048, height: 2048 },
    format: 'jpg',
    quality: 0.92,
    category: 'marketplace',
    icon: 'figma'
  },
  {
    id: 'etsy_listing',
    name: 'Etsy',
    description: '2700x2025 - Yatay listeleme fotoğrafı (4:3)',
    dimensions: { width: 2700, height: 2025 },
    format: 'jpg',
    quality: 0.92,
    category: 'marketplace',
    icon: 'gift'
  },
  {
    id: 'generic_ecommerce',
    name: 'Genel E-ticaret Kare',
    description: '1000x1000 - Çoğu platformla uyumlu standart boyut',
    dimensions: { width: 1000, height: 1000 },
    format: 'jpg',
    quality: 0.85,
    category: 'marketplace',
    icon: 'tag'
  },
  {
    id: 'ebay_listing',
    name: 'eBay Listeleme',
    description: '1600x1600 - eBay ürün görselleri için',
    dimensions: { width: 1600, height: 1600 },
    format: 'jpg',
    quality: 0.9,
    category: 'marketplace',
    icon: 'shopping-bag'
  },
  {
    id: 'aliexpress_product',
    name: 'AliExpress Ürün',
    description: '800x800 - AliExpress için kare format',
    dimensions: { width: 800, height: 800 },
    format: 'jpg',
    quality: 0.8,
    category: 'marketplace',
    icon: 'globe'
  },
  {
    id: 'google_shopping',
    name: 'Google Alışveriş',
    description: '1200x1200 - Google Merchant Center için kare',
    dimensions: { width: 1200, height: 1200 },
    format: 'jpg',
    quality: 0.9,
    category: 'marketplace',
    icon: 'shopping-cart'
  },
  {
    id: 'z_fashion_platform',
    name: 'Moda Platformu',
    description: '1080x1440 - Dikey moda görselleri için',
    dimensions: { width: 1080, height: 1440 },
    format: 'jpg',
    quality: 0.88,
    category: 'marketplace',
    icon: 'camera'
  },

  // === WEB & DİJİTAL (Şimdi 10 Seçenek) ===
  {
    id: 'web_hero',
    name: 'Website Hero Image',
    description: '1920x1080 - Full HD ana görsel formatı',
    dimensions: { width: 1920, height: 1080 },
    format: 'jpg',
    quality: 0.88,
    category: 'web',
    icon: 'layout'
  },
  {
    id: 'web_banner_wide',
    name: 'Geniş Banner',
    description: '728x90 - "Leaderboard" reklam banner formatı',
    dimensions: { width: 728, height: 90 },
    format: 'png',
    quality: 0.9,
    category: 'web',
    icon: 'minus'
  },
  {
    id: 'web_banner_square',
    name: 'Kare Banner',
    description: '300x250 - "Medium Rectangle" reklam formatı',
    dimensions: { width: 300, height: 250 },
    format: 'png',
    quality: 0.9,
    category: 'web',
    icon: 'sidebar'
  },
  {
    id: 'web_blog_featured',
    name: 'Öne Çıkan Blog Görseli',
    description: '1200x800 - Blog makaleleri için standart görsel',
    dimensions: { width: 1200, height: 800 },
    format: 'jpg',
    quality: 0.85,
    category: 'web',
    icon: 'align-left'
  },
  {
    id: 'web_favicon',
    name: 'Favicon',
    description: '64x64 - Website ikonu, şeffaf arka plan',
    dimensions: { width: 64, height: 64 },
    format: 'png',
    quality: 1.0,
    category: 'web',
    icon: 'star'
  },
  {
    id: 'email_header',
    name: 'E-posta Başlığı',
    description: '600x200 - E-bülten ve e-posta başlık görseli',
    dimensions: { width: 600, height: 200 },
    format: 'jpg',
    quality: 0.85,
    category: 'web',
    icon: 'mail'
  },
  {
    id: 'web_profile_banner',
    name: 'Web Profil Banner',
    description: '1500x500 - Web profil sayfaları için banner',
    dimensions: { width: 1500, height: 500 },
    format: 'jpg',
    quality: 0.88,
    category: 'web',
    icon: 'image'
  },
  {
    id: 'mobile_wallpaper',
    name: 'Mobil Duvar Kağıdı',
    description: '1080x1920 - Genel mobil cihazlar için',
    dimensions: { width: 1080, height: 1920 },
    format: 'jpg',
    quality: 0.9,
    category: 'web',
    icon: 'smartphone'
  },
  {
    id: 'desktop_wallpaper_hd',
    name: 'Masaüstü Duvar Kağıdı (HD)',
    description: '1920x1080 - Genel masaüstü cihazlar için',
    dimensions: { width: 1920, height: 1080 },
    format: 'jpg',
    quality: 0.9,
    category: 'web',
    icon: 'monitor'
  },
  {
    id: 'newsletter_ad_small',
    name: 'E-posta Reklamı (Küçük)',
    description: '320x100 - E-posta bültenleri için küçük reklam alanı',
    dimensions: { width: 320, height: 100 },
    format: 'png',
    quality: 0.85,
    category: 'web',
    icon: 'send'
  },

  // === BASKI (Şimdi 10 Seçenek) ===
  {
    id: 'print_a4',
    name: 'A4 Kağıt (300 DPI)',
    description: '2480x3508px - Katalog ve belge baskısı',
    dimensions: { width: 2480, height: 3508 },
    format: 'png',
    quality: 1.0,
    category: 'print',
    icon: 'file-text'
  },
  {
    id: 'print_a5',
    name: 'A5 Kağıt (300 DPI)',
    description: '1748x2480px - Broşür ve el ilanı baskısı',
    dimensions: { width: 1748, height: 2480 },
    format: 'png',
    quality: 1.0,
    category: 'print',
    icon: 'file'
  },
  {
    id: 'print_10x15',
    name: '10x15 Fotoğraf Baskı',
    description: '1181x1772px - Standart fotoğraf stüdyosu baskısı',
    dimensions: { width: 1181, height: 1772 },
    format: 'jpg',
    quality: 0.98,
    category: 'print',
    icon: 'camera'
  },
  {
    id: 'print_13x18',
    name: '13x18 Fotoğraf Baskı',
    description: '1535x2126px - Büyük boy fotoğraf baskısı',
    dimensions: { width: 1535, height: 2126 },
    format: 'jpg',
    quality: 0.98,
    category: 'print',
    icon: 'image'
  },
  {
    id: 'print_business_card',
    name: 'Kartvizit (EU Standard)',
    description: '1004x650px - Standart 85x55mm kartvizit baskısı',
    dimensions: { width: 1004, height: 650 },
    format: 'png',
    quality: 1.0,
    category: 'print',
    icon: 'credit-card'
  },
  {
    id: 'print_poster',
    name: 'Afiş (A3)',
    description: '3508x4961px - A3 boyutunda afiş baskısı',
    dimensions: { width: 3508, height: 4961 },
    format: 'png',
    quality: 1.0,
    category: 'print',
    icon: 'map'
  },
  {
    id: 'print_flyer_a6',
    name: 'El İlanı (A6)',
    description: '1240x1748px - Küçük el ilanları için',
    dimensions: { width: 1240, height: 1748 },
    format: 'png',
    quality: 0.98,
    category: 'print',
    icon: 'clipboard'
  },
  {
    id: 'print_post_card_a6',
    name: 'Kartpostal (A6 Yatay)',
    description: '1748x1240px - Standart kartpostal boyutu',
    dimensions: { width: 1748, height: 1240 },
    format: 'jpg',
    quality: 0.95,
    category: 'print',
    icon: 'mail'
  },
  {
    id: 'print_us_letter',
    name: 'US Letter (300 DPI)',
    description: '2550x3300px - Amerikan standart doküman boyutu',
    dimensions: { width: 2550, height: 3300 },
    format: 'png',
    quality: 1.0,
    category: 'print',
    icon: 'file-text'
  },
  {
    id: 'print_magazine_spread',
    name: 'Dergi Sayfa (Çift)',
    description: '5100x3300px - Dergi içi çift sayfa reklam',
    dimensions: { width: 5100, height: 3300 },
    format: 'png',
    quality: 1.0,
    category: 'print',
    icon: 'book'
  },

  // === ÖZEL (Şimdi 10 Seçenek) ===
  {
    id: 'custom_widescreen',
    name: 'Geniş Ekran (16:9)',
    description: '1920x1080 - TV ve monitör görüntüleme oranı',
    dimensions: { width: 1920, height: 1080 },
    format: 'png',
    quality: 0.95,
    category: 'custom',
    icon: 'tv'
  },
  {
    id: 'custom_classic_photo',
    name: 'Klasik Fotoğraf (3:2)',
    description: '1080x720 - 35mm film fotoğrafı oranı',
    dimensions: { width: 1080, height: 720 },
    format: 'png',
    quality: 0.95,
    category: 'custom',
    icon: 'camera'
  },
  {
    id: 'custom_portrait',
    name: 'Dikey Portre (2:3)',
    description: '720x1080 - Dikey fotoğraf portre oranı',
    dimensions: { width: 720, height: 1080 },
    format: 'png',
    quality: 0.95,
    category: 'custom',
    icon: 'user'
  },
  {
    id: 'custom_cinematic',
    name: 'Sinematik (21:9)',
    description: '2560x1080 - Ultra geniş sinema ekranı oranı',
    dimensions: { width: 2560, height: 1080 },
    format: 'png',
    quality: 0.95,
    category: 'custom',
    icon: 'film'
  },
  {
    id: 'custom_square_hd',
    name: 'HD Kare',
    description: '1920x1920 - Yüksek çözünürlüklü kare format',
    dimensions: { width: 1920, height: 1920 },
    format: 'png',
    quality: 0.95,
    category: 'custom',
    icon: 'square'
  },
  {
    id: 'custom_a4_landscape',
    name: 'A4 Yatay',
    description: '3508x2480px - Yatay A4 belge/sunum formatı',
    dimensions: { width: 3508, height: 2480 },
    format: 'png',
    quality: 0.95,
    category: 'custom',
    icon: 'file-text'
  },
  {
    id: 'custom_4k_uhd',
    name: '4K Ultra HD',
    description: '3840x2160 - Ultra yüksek çözünürlüklü ekranlar için',
    dimensions: { width: 3840, height: 2160 },
    format: 'png',
    quality: 0.98,
    category: 'custom',
    icon: 'monitor'
  },
  {
    id: 'custom_long_vertical',
    name: 'Uzun Dikey',
    description: '800x2000 - Özel dikey tasarımlar için',
    dimensions: { width: 800, height: 2000 },
    format: 'png',
    quality: 0.95,
    category: 'custom',
    icon: 'align-center'
  },
  {
    id: 'custom_ultra_wide_monitor',
    name: 'Ultra Geniş Monitör',
    description: '3440x1440 - Geniş formatlı monitörler için',
    dimensions: { width: 3440, height: 1440 },
    format: 'png',
    quality: 0.95,
    category: 'custom',
    icon: 'monitor'
  },
  {
    id: 'custom_square_small',
    name: 'Küçük Kare',
    description: '500x500 - Özel küçük kare boyutları',
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
    name: 'Galeriye Kaydet',
    icon: 'download',
    type: 'gallery'
  },
  {
    id: 'share',
    name: 'Paylaş...',
    icon: 'share-2',
    type: 'generic'
  },
];

export const EXPORT_CATEGORIES = [
  { key: 'social', name: 'Sosyal Medya', icon: 'share-2' },
  { key: 'marketplace', name: 'E-ticaret', icon: 'shopping-cart' },
  { key: 'web', name: 'Web', icon: 'globe' },
  { key: 'print', name: 'Baskı', icon: 'printer' },
  { key: 'custom', name: 'Özel', icon: 'settings' }
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
      message: `Minimum boyut ${MIN_SIZE}x${MIN_SIZE} piksel olmalıdır`
    };
  }

  if (width > MAX_SIZE || height > MAX_SIZE) {
    return {
      isValid: false,
      message: `Maksimum boyut ${MAX_SIZE}x${MAX_SIZE} piksel olmalıdır`
    };
  }

  const totalPixels = width * height;
  const MAX_PIXELS = 50 * 1024 * 1024; // 50 megapixel

  if (totalPixels > MAX_PIXELS) {
    return {
      isValid: false,
      message: 'Toplam piksel sayısı çok büyük. Daha küçük boyutlar deneyin.'
    };
  }

  return { isValid: true };
};

/**
 * Dinamik preset oluşturur
 */
export const createCustomPreset = (
  width: number,
  height: number,
  name?: string,
  format: 'jpg' | 'png' = 'png'
): ExportPreset => {
  const aspectRatio = width / height;
  const defaultName = name || `Özel ${width}×${height}`;

  // En boy oranına göre kategori belirle
  let category: ExportPreset['category'] = 'custom';
  if (aspectRatio > 1.5) category = 'web';
  else if (aspectRatio === 1) category = 'social';
  else if (aspectRatio < 0.8) category = 'social';

  return {
    id: `custom_${width}x${height}_${Date.now()}`,
    name: defaultName,
    description: `Kullanıcı tanımlı ${width}×${height} boyutu`,
    dimensions: { width, height },
    format,
    quality: format === 'png' ? 0.95 : 0.9,
    category,
    icon: 'settings'
  };
};