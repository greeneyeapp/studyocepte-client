// features/editor/config/filters.ts - PROFESYONEL "GÖRÜNÜM" (LOOK) KÜTÜPHANESİ (ÇEVİRİ ANAHTARLARI KULLANILDI)

export interface FilterPreset {
  key: string;
  name: string; // Bu artık doğrudan çeviri anahtarı olacak (örn. 'editor.filter.original')
  settings: Record<string, number>;
  description?: string; // Bu artık doğrudan çeviri anahtarı olacak (örn. 'editor.filter.desc.original')
}

export const ALL_FILTERS: FilterPreset[] = [
  {
    key: 'original',
    name: 'editor.filter.original', // Çeviri anahtarı
    settings: {},
    description: 'editor.filter.desc.original', // Çeviri anahtarı
  },
  {
    key: 'cleanEcommerce',
    name: 'editor.filter.cleanEcommerce',
    settings: {
      product_exposure: 10,
      product_brightness: 5,
      product_clarity: 15,
      product_vibrance: 5,
      background_exposure: 15,
      background_brightness: 10,
    },
    description: 'editor.filter.desc.cleanEcommerce',
  },
  {
    key: 'vividPop',
    name: 'editor.filter.vividPop',
    settings: {
      product_vibrance: 30,
      product_contrast: 15,
      product_clarity: 10,
      background_saturation: 15,
      background_contrast: 5,
    },
    description: 'editor.filter.desc.vividPop',
  },
  {
    key: 'dramaticContrast',
    name: 'editor.filter.dramaticContrast',
    settings: {
      product_contrast: 35,
      product_clarity: 25,
      product_highlights: -25,
      product_shadows: 15,
      background_exposure: -10,
      background_vignette: 40,
    },
    description: 'editor.filter.desc.dramaticContrast',
  },
  {
    key: 'vintageDream',
    name: 'editor.filter.vintageDream',
    settings: {
      product_warmth: 20,
      product_contrast: -15,
      product_saturation: -10,
      product_shadows: 20,
      product_highlights: -10,
      background_saturation: -25,
      background_vignette: 50,
      background_blur: 5,
    },
    description: 'editor.filter.desc.vintageDream',
  },
  {
    key: 'cinematicTealOrange',
    name: 'editor.filter.cinematicTealOrange',
    settings: {
      product_warmth: 15,
      product_contrast: 20,
      product_clarity: 15,
      background_warmth: -20,
      background_contrast: 10,
      background_vignette: 30,
    },
    description: 'editor.filter.desc.cinematicTealOrange',
  },
  {
    key: 'goldenHour',
    name: 'editor.filter.goldenHour',
    settings: {
      product_warmth: 35,
      product_exposure: 5,
      product_shadows: -15,
      product_highlights: 10,
      background_warmth: 25,
      background_exposure: 10,
      background_blur: 8,
    },
    description: 'editor.filter.desc.goldenHour',
  },
  {
    key: 'filmNoir',
    name: 'editor.filter.filmNoir',
    settings: {
      product_saturation: -100,
      background_saturation: -100,
      product_contrast: 45,
      product_clarity: 30,
      product_highlights: -20,
      product_shadows: 25,
      background_vignette: 35,
      background_exposure: -15,
    },
    description: 'editor.filter.desc.filmNoir',
  },
  {
    key: 'softPortrait',
    name: 'editor.filter.softPortrait',
    settings: {
      product_clarity: -15,
      product_warmth: 10,
      product_shadows: 10,
      product_vibrance: 15,
      background_blur: 20,
      background_exposure: 5,
      background_saturation: -10,
    },
    description: 'editor.filter.desc.softPortrait',
  },
  {
    key: 'arcticBlue',
    name: 'editor.filter.arcticBlue',
    settings: {
        product_warmth: -25,
        product_contrast: 10,
        product_highlights: 5,
        background_warmth: -15,
        background_exposure: 10,
        background_contrast: 5,
    },
    description: 'editor.filter.desc.arcticBlue',
  }
];