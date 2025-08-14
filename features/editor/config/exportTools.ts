// features/editor/config/exportTools.ts - TAM VE EKSİKSİZ VERSİYON (ÇEVİRİ ANAHTARLARI KULLANILDI)

export interface ExportPreset {
  id: string;
  name: string; // Bu artık çeviri anahtarı olacak (örn. 'export.preset.instagramSquare')
  description: string; // Bu artık çeviri anahtarı olacak (örn. 'export.desc.instagramSquare')
  dimensions: { width: number; height: number };
  format: 'jpg' | 'png';
  quality: number;
  category: 'social' | 'marketplace' | 'print' | 'custom' | 'web';
  icon: string;
}

export interface ShareOption {
  id: string;
  name: string; // Bu artık çeviri anahtarı olacak (örn. 'export.shareOption.gallerySave')
  icon: string;
  type: 'gallery' | 'generic';
}

export const EXPORT_PRESETS: ExportPreset[] = [
  // === SOSYAL MEDYA (Şimdi 10 Seçenek) ===
  {
    id: 'instagramSquare',
    name: 'export.preset.instagramSquare', // Çeviri anahtarı
    description: 'export.desc.instagramSquare', // Çeviri anahtarı
    dimensions: { width: 1080, height: 1080 },
    format: 'jpg',
    quality: 0.9,
    category: 'social',
    icon: 'instagram'
  },
  {
    id: 'instagramStory',
    name: 'export.preset.instagramStory',
    description: 'export.desc.instagramStory',
    dimensions: { width: 1080, height: 1920 },
    format: 'jpg',
    quality: 0.9,
    category: 'social',
    icon: 'smartphone'
  },
  {
    id: 'instagramPortrait',
    name: 'export.preset.instagramPortrait',
    description: 'export.desc.instagramPortrait',
    dimensions: { width: 1080, height: 1350 },
    format: 'jpg',
    quality: 0.9,
    category: 'social',
    icon: 'maximize'
  },
  {
    id: 'youtubeThumbnail',
    name: 'export.preset.youtubeThumbnail',
    description: 'export.desc.youtubeThumbnail',
    dimensions: { width: 1280, height: 720 },
    format: 'jpg',
    quality: 0.9,
    category: 'social',
    icon: 'youtube'
  },
  {
    id: 'facebookPost',
    name: 'export.preset.facebookPost',
    description: 'export.desc.facebookPost',
    dimensions: { width: 1200, height: 630 },
    format: 'jpg',
    quality: 0.85,
    category: 'social',
    icon: 'facebook'
  },
  {
    id: 'pinterestPin',
    name: 'export.preset.pinterestPin',
    description: 'export.desc.pinterestPin',
    dimensions: { width: 1000, height: 1500 },
    format: 'jpg',
    quality: 0.9,
    category: 'social',
    icon: 'bookmark'
  },
  {
    id: 'twitterPost',
    name: 'export.preset.twitterPost',
    description: 'export.desc.twitterPost',
    dimensions: { width: 1600, height: 900 },
    format: 'png',
    quality: 0.9,
    category: 'social',
    icon: 'twitter'
  },
  {
    id: 'snapchatStory',
    name: 'export.preset.snapchatStory',
    description: 'export.desc.snapchatStory',
    dimensions: { width: 1080, height: 1920 },
    format: 'jpg',
    quality: 0.88,
    category: 'social',
    icon: 'message-square'
  },
  {
    id: 'linkedinPost',
    name: 'export.preset.linkedinPost',
    description: 'export.desc.linkedinPost',
    dimensions: { width: 1200, height: 627 },
    format: 'jpg',
    quality: 0.9,
    category: 'social',
    icon: 'linkedin'
  },
  {
    id: 'tiktokCover',
    name: 'export.preset.tiktokCover',
    description: 'export.desc.tiktokCover',
    dimensions: { width: 1080, height: 1920 },
    format: 'jpg',
    quality: 0.88,
    category: 'social',
    icon: 'music'
  },

  // === E-TİCARET (Şimdi 10 Seçenek) ===
  {
    id: 'trendyolMain',
    name: 'export.preset.trendyolMain',
    description: 'export.desc.trendyolMain',
    dimensions: { width: 1200, height: 1800 },
    format: 'jpg',
    quality: 0.9,
    category: 'marketplace',
    icon: 'shopping-bag'
  },
  {
    id: 'hepsiburadaMain',
    name: 'export.preset.hepsiburadaMain',
    description: 'export.desc.hepsiburadaMain',
    dimensions: { width: 1500, height: 1500 },
    format: 'jpg',
    quality: 0.9,
    category: 'marketplace',
    icon: 'shopping-cart'
  },
  {
    id: 'amazonMain',
    name: 'export.preset.amazonMain',
    description: 'export.desc.amazonMain',
    dimensions: { width: 2000, height: 2000 },
    format: 'jpg',
    quality: 0.95,
    category: 'marketplace',
    icon: 'box'
  },
  {
    id: 'shopifyProduct',
    name: 'export.preset.shopifyProduct',
    description: 'export.desc.shopifyProduct',
    dimensions: { width: 2048, height: 2048 },
    format: 'jpg',
    quality: 0.92,
    category: 'marketplace',
    icon: 'figma'
  },
  {
    id: 'etsyListing',
    name: 'export.preset.etsyListing',
    description: 'export.desc.etsyListing',
    dimensions: { width: 2700, height: 2025 },
    format: 'jpg',
    quality: 0.92,
    category: 'marketplace',
    icon: 'gift'
  },
  {
    id: 'genericEcommerce',
    name: 'export.preset.genericEcommerce',
    description: 'export.desc.genericEcommerce',
    dimensions: { width: 1000, height: 1000 },
    format: 'jpg',
    quality: 0.85,
    category: 'marketplace',
    icon: 'tag'
  },
  {
    id: 'ebayListing',
    name: 'export.preset.ebayListing',
    description: 'export.desc.ebayListing',
    dimensions: { width: 1600, height: 1600 },
    format: 'jpg',
    quality: 0.9,
    category: 'marketplace',
    icon: 'shopping-bag'
  },
  {
    id: 'aliexpressProduct',
    name: 'export.preset.aliexpressProduct',
    description: 'export.desc.aliexpressProduct',
    dimensions: { width: 800, height: 800 },
    format: 'jpg',
    quality: 0.8,
    category: 'marketplace',
    icon: 'globe'
  },
  {
    id: 'googleShopping',
    name: 'export.preset.googleShopping',
    description: 'export.desc.googleShopping',
    dimensions: { width: 1200, height: 1200 },
    format: 'jpg',
    quality: 0.9,
    category: 'marketplace',
    icon: 'shopping-cart'
  },
  {
    id: 'fashionPlatform',
    name: 'export.preset.fashionPlatform',
    description: 'export.desc.fashionPlatform',
    dimensions: { width: 1080, height: 1440 },
    format: 'jpg',
    quality: 0.88,
    category: 'marketplace',
    icon: 'camera'
  },

  // === WEB & DİJİTAL (Şimdi 10 Seçenek) ===
  {
    id: 'webHero',
    name: 'export.preset.webHero',
    description: 'export.desc.webHero',
    dimensions: { width: 1920, height: 1080 },
    format: 'jpg',
    quality: 0.88,
    category: 'web',
    icon: 'layout'
  },
  {
    id: 'webBannerWide',
    name: 'export.preset.webBannerWide',
    description: 'export.desc.webBannerWide',
    dimensions: { width: 728, height: 90 },
    format: 'png',
    quality: 0.9,
    category: 'web',
    icon: 'minus'
  },
  {
    id: 'webBannerSquare',
    name: 'export.preset.webBannerSquare',
    description: 'export.desc.webBannerSquare',
    dimensions: { width: 300, height: 250 },
    format: 'png',
    quality: 0.9,
    category: 'web',
    icon: 'sidebar'
  },
  {
    id: 'webBlogFeatured',
    name: 'export.preset.webBlogFeatured',
    description: 'export.desc.webBlogFeatured',
    dimensions: { width: 1200, height: 800 },
    format: 'jpg',
    quality: 0.85,
    category: 'web',
    icon: 'align-left'
  },
  {
    id: 'webFavicon',
    name: 'export.preset.webFavicon',
    description: 'export.desc.webFavicon',
    dimensions: { width: 64, height: 64 },
    format: 'png',
    quality: 1.0,
    category: 'web',
    icon: 'star'
  },
  {
    id: 'emailHeader',
    name: 'export.preset.emailHeader',
    description: 'export.desc.emailHeader',
    dimensions: { width: 600, height: 200 },
    format: 'jpg',
    quality: 0.85,
    category: 'web',
    icon: 'mail'
  },
  {
    id: 'webProfileBanner',
    name: 'export.preset.webProfileBanner',
    description: 'export.desc.webProfileBanner',
    dimensions: { width: 1500, height: 500 },
    format: 'jpg',
    quality: 0.88,
    category: 'web',
    icon: 'image'
  },
  {
    id: 'mobileWallpaper',
    name: 'export.preset.mobileWallpaper',
    description: 'export.desc.mobileWallpaper',
    dimensions: { width: 1080, height: 1920 },
    format: 'jpg',
    quality: 0.9,
    category: 'web',
    icon: 'smartphone'
  },
  {
    id: 'desktopWallpaperHd',
    name: 'export.preset.desktopWallpaperHd',
    description: 'export.desc.desktopWallpaperHd',
    dimensions: { width: 1920, height: 1080 },
    format: 'jpg',
    quality: 0.9,
    category: 'web',
    icon: 'monitor'
  },
  {
    id: 'newsletterAdSmall',
    name: 'export.preset.newsletterAdSmall',
    description: 'export.desc.newsletterAdSmall',
    dimensions: { width: 320, height: 100 },
    format: 'png',
    quality: 0.85,
    category: 'web',
    icon: 'send'
  },

  // === BASKI (Şimdi 10 Seçenek) ===
  {
    id: 'printA4',
    name: 'export.preset.printA4',
    description: 'export.desc.printA4',
    dimensions: { width: 2480, height: 3508 },
    format: 'png',
    quality: 1.0,
    category: 'print',
    icon: 'file-text'
  },
  {
    id: 'printA5',
    name: 'export.preset.printA5',
    description: 'export.desc.printA5',
    dimensions: { width: 1748, height: 2480 },
    format: 'png',
    quality: 1.0,
    category: 'print',
    icon: 'file'
  },
  {
    id: 'print10x15',
    name: 'export.preset.print10x15',
    description: 'export.desc.print10x15',
    dimensions: { width: 1181, height: 1772 },
    format: 'jpg',
    quality: 0.98,
    category: 'print',
    icon: 'camera'
  },
  {
    id: 'print13x18',
    name: 'export.preset.print13x18',
    description: 'export.desc.print13x18',
    dimensions: { width: 1535, height: 2126 },
    format: 'jpg',
    quality: 0.98,
    category: 'print',
    icon: 'image'
  },
  {
    id: 'printBusinessCard',
    name: 'export.preset.printBusinessCard',
    description: 'export.desc.printBusinessCard',
    dimensions: { width: 1004, height: 650 },
    format: 'png',
    quality: 1.0,
    category: 'print',
    icon: 'credit-card'
  },
  {
    id: 'printPosterA3',
    name: 'export.preset.printPosterA3',
    description: 'export.desc.printPosterA3',
    dimensions: { width: 3508, height: 4961 },
    format: 'png',
    quality: 1.0,
    category: 'print',
    icon: 'map'
  },
  {
    id: 'printFlyerA6',
    name: 'export.preset.printFlyerA6',
    description: 'export.desc.printFlyerA6',
    dimensions: { width: 1240, height: 1748 },
    format: 'png',
    quality: 0.98,
    category: 'print',
    icon: 'clipboard'
  },
  {
    id: 'printPostcardA6',
    name: 'export.preset.printPostcardA6',
    description: 'export.desc.printPostcardA6',
    dimensions: { width: 1748, height: 1240 },
    format: 'jpg',
    quality: 0.95,
    category: 'print',
    icon: 'mail'
  },
  {
    id: 'printUsLetter',
    name: 'export.preset.printUsLetter',
    description: 'export.desc.printUsLetter',
    dimensions: { width: 2550, height: 3300 },
    format: 'png',
    quality: 1.0,
    category: 'print',
    icon: 'file-text'
  },
  {
    id: 'printMagazineSpread',
    name: 'export.preset.printMagazineSpread',
    description: 'export.desc.printMagazineSpread',
    dimensions: { width: 5100, height: 3300 },
    format: 'png',
    quality: 1.0,
    category: 'print',
    icon: 'book'
  },

  // === ÖZEL (Şimdi 10 Seçenek) ===
  {
    id: 'customWidescreen',
    name: 'export.preset.customWidescreen',
    description: 'export.desc.customWidescreen',
    dimensions: { width: 1920, height: 1080 },
    format: 'png',
    quality: 0.95,
    category: 'custom',
    icon: 'tv'
  },
  {
    id: 'customClassicPhoto',
    name: 'export.preset.customClassicPhoto',
    description: 'export.desc.customClassicPhoto',
    dimensions: { width: 1080, height: 720 },
    format: 'png',
    quality: 0.95,
    category: 'custom',
    icon: 'camera'
  },
  {
    id: 'customPortrait',
    name: 'export.preset.customPortrait',
    description: 'export.desc.customPortrait',
    dimensions: { width: 720, height: 1080 },
    format: 'png',
    quality: 0.95,
    category: 'custom',
    icon: 'user'
  },
  {
    id: 'customCinematic',
    name: 'export.preset.customCinematic',
    description: 'export.desc.customCinematic',
    dimensions: { width: 2560, height: 1080 },
    format: 'png',
    quality: 0.95,
    category: 'custom',
    icon: 'film'
  },
  {
    id: 'customSquareHd',
    name: 'export.preset.customSquareHd',
    description: 'export.desc.customSquareHd',
    dimensions: { width: 1920, height: 1920 },
    format: 'png',
    quality: 0.95,
    category: 'custom',
    icon: 'square'
  },
  {
    id: 'customA4Landscape',
    name: 'export.preset.customA4Landscape',
    description: 'export.desc.customA4Landscape',
    dimensions: { width: 3508, height: 2480 },
    format: 'png',
    quality: 0.95,
    category: 'custom',
    icon: 'file-text'
  },
  {
    id: 'custom4kUhd',
    name: 'export.preset.custom4kUhd',
    description: 'export.desc.custom4kUhd',
    dimensions: { width: 3840, height: 2160 },
    format: 'png',
    quality: 0.98,
    category: 'custom',
    icon: 'monitor'
  },
  {
    id: 'customLongVertical',
    name: 'export.preset.customLongVertical',
    description: 'export.desc.customLongVertical',
    dimensions: { width: 800, height: 2000 },
    format: 'png',
    quality: 0.95,
    category: 'custom',
    icon: 'align-center'
  },
  {
    id: 'customUltraWideMonitor',
    name: 'export.preset.customUltraWideMonitor',
    description: 'export.desc.customUltraWideMonitor',
    dimensions: { width: 3440, height: 1440 },
    format: 'png',
    quality: 0.95,
    category: 'custom',
    icon: 'monitor'
  },
  {
    id: 'customSquareSmall',
    name: 'export.preset.customSquareSmall',
    description: 'export.desc.customSquareSmall',
    dimensions: { width: 500, height: 500 },
    format: 'jpg',
    quality: 0.8,
    category: 'custom',
    icon: 'square'
  },
];

export const SHARE_OPTIONS: ShareOption[] = [
  {
    id: 'gallerySave',
    name: 'export.shareOption.gallerySave', // Çeviri anahtarı
    icon: 'download',
    type: 'gallery'
  },
  {
    id: 'genericShare',
    name: 'export.shareOption.genericShare', // Çeviri anahtarı
    icon: 'share-2',
    type: 'generic'
  },
];

export const EXPORT_CATEGORIES = [
  { key: 'social', name: 'export.category.social', icon: 'share-2' }, // Çeviri anahtarı
  { key: 'marketplace', name: 'export.category.marketplace', icon: 'shopping-cart' }, // Çeviri anahtarı
  { key: 'web', name: 'export.category.web', icon: 'globe' }, // Çeviri anahtarı
  { key: 'print', name: 'export.category.print', icon: 'printer' }, // Çeviri anahtarı
  { key: 'custom', name: 'export.category.custom', icon: 'settings' } // Çeviri anahtarı
] as const;

export const getPresetsByCategory = (category: string): ExportPreset[] => {
  return EXPORT_PRESETS.filter(preset => preset.category === category);
};

export const getPresetById = (id: string): ExportPreset | undefined => {
  return EXPORT_PRESETS.find(preset => preset.id === id);
};

export const suggestPresetsByAspectRatio = (aspectRatio: number): ExportPreset[] => {
  const tolerance = 0.1;

  return EXPORT_PRESETS.filter(preset => {
    const presetRatio = preset.dimensions.width / preset.dimensions.height;
    return Math.abs(presetRatio - aspectRatio) <= tolerance;
  }).slice(0, 5);
};

export const estimateFileSize = (preset: ExportPreset): string => {
  const { width, height, quality, format } = preset;
  const pixelCount = width * height;

  let estimatedBytes: number;

  if (format === 'png') {
    estimatedBytes = pixelCount * 3.5;
  } else {
    const qualityFactor = quality < 0.7 ? 0.5 : quality < 0.9 ? 1.0 : 1.5;
    estimatedBytes = pixelCount * qualityFactor;
  }

  const mb = estimatedBytes / (1024 * 1024);

  if (mb < 1) {
    return `${Math.round(mb * 1024)} KB`;
  } else if (mb < 10) {
    return `${mb.toFixed(1)} MB`;
  } else {
    return `${Math.round(mb)} MB`;
  }
};

export const getPopularPresets = (): ExportPreset[] => {
  const popularIds = [
    'instagramSquare',
    'instagramStory',
    'trendyolMain',
    'amazonMain',
    'webHero',
    'customWidescreen'
  ];

  return popularIds
    .map(id => getPresetById(id))
    .filter(Boolean) as ExportPreset[];
};

export const getPlatformRecommendations = (platform: string): ExportPreset[] => {
  const recommendations: Record<string, string[]> = {
    'instagram': ['instagramSquare', 'instagramStory', 'instagramPortrait'],
    'facebook': ['facebookPost', 'instagramSquare'],
    'twitter': ['twitterPost', 'webHero'],
    'ecommerce': ['amazonMain', 'trendyolMain', 'hepsiburadaMain'],
    'web': ['webHero', 'webBlogFeatured', 'webBannerWide'],
    'print': ['printA4', 'print10x15', 'printBusinessCard']
  };

  const presetIds = recommendations[platform.toLowerCase()] || [];
  return presetIds
    .map(id => getPresetById(id))
    .filter(Boolean) as ExportPreset[];
};

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
  const MAX_PIXELS = 50 * 1024 * 1024;

  if (totalPixels > MAX_PIXELS) {
    return {
      isValid: false,
      message: 'Toplam piksel sayısı çok büyük. Daha küçük boyutlar deneyin.'
    };
  }

  return { isValid: true };
};

export const createCustomPreset = (
  width: number,
  height: number,
  name?: string,
  format: 'jpg' | 'png' = 'png'
): ExportPreset => {
  const aspectRatio = width / height;
  const defaultName = name || `Özel ${width}×${height}`;

  let category: ExportPreset['category'] = 'custom';
  if (aspectRatio > 1.5) category = 'web';
  else if (aspectRatio === 1) category = 'social';
  else if (aspectRatio < 0.8) category = 'social';

  return {
    id: `custom_${width}x${height}_${Date.now()}`,
    name: defaultName, // Bu burada doğrudan string kalabilir çünkü özel oluşturuluyor
    description: `Kullanıcı tanımlı ${width}×${height} boyutu`, // Bu da
    dimensions: { width, height },
    format,
    quality: format === 'png' ? 0.95 : 0.9,
    category,
    icon: 'settings'
  };
};