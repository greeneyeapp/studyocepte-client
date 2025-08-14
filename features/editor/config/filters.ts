// features/editor/config/filters.ts - PROFESYONEL "GÖRÜNÜM" (LOOK) KÜTÜPHANESİ

export interface FilterPreset {
  key: string;
  nameKey: string; // Lokalizasyon için nameKey eklendi
  descriptionKey?: string; // Lokalizasyon için descriptionKey eklendi
  settings: Record<string, number>;
}

/**
 * Bu filtreler artık basit ayar değişiklikleri değil, birden çok ayarın birleşimiyle
 * oluşturulmuş, profesyonel "görünümler" (looks) sunar. Her biri, ürün ve arka planı
 * farklı şekillerde etkileyerek daha sofistike sonuçlar üretir.
 */
export const ALL_FILTERS: FilterPreset[] = [
  {
    key: 'original',
    nameKey: 'editor.filterNames.original', // Lokalize edildi
    descriptionKey: 'editor.filterNames.original', // Lokalize edildi
    settings: {},
  },
  {
    key: 'clean_ecommerce',
    nameKey: 'editor.filterNames.clean_ecommerce', // Lokalize edildi
    descriptionKey: 'editor.filterNames.clean_ecommerce', // Lokalize edildi
    settings: {
      product_exposure: 10,
      product_brightness: 5,
      product_clarity: 15,
      product_vibrance: 5,
      background_exposure: 15,
      background_brightness: 10,
    },
  },
  {
    key: 'vivid_pop',
    nameKey: 'editor.filterNames.vivid_pop', // Lokalize edildi
    descriptionKey: 'editor.filterNames.vivid_pop', // Lokalize edildi
    settings: {
      product_vibrance: 30,
      product_contrast: 15,
      product_clarity: 10,
      background_saturation: 15,
      background_contrast: 5,
    },
  },
  {
    key: 'dramatic_contrast',
    nameKey: 'editor.filterNames.dramatic_contrast', // Lokalize edildi
    descriptionKey: 'editor.filterNames.dramatic_contrast', // Lokalize edildi
    settings: {
      product_contrast: 35,
      product_clarity: 25,
      product_highlights: -25,
      product_shadows: 15,
      background_exposure: -10,
      background_vignette: 40,
    },
  },
  {
    key: 'vintage_dream',
    nameKey: 'editor.filterNames.vintage_dream', // Lokalize edildi
    descriptionKey: 'editor.filterNames.vintage_dream', // Lokalize edildi
    settings: {
      product_warmth: 20,
      product_contrast: -15,
      product_saturation: -10,
      product_shadows: 20, // Soluk siyahlar için
      product_highlights: -10,
      background_saturation: -25,
      background_vignette: 50,
      background_blur: 5,
    },
  },
  {
    key: 'cinematic_teal_orange',
    nameKey: 'editor.filterNames.cinematic_teal_orange', // Lokalize edildi
    descriptionKey: 'editor.filterNames.cinematic_teal_orange', // Lokalize edildi
    settings: {
      product_warmth: 15,    // Ürünü turuncuya/sıcağa çeker
      product_contrast: 20,
      product_clarity: 15,
      background_warmth: -20,  // Arka planı turkuaza/soğuğa çeker
      background_contrast: 10,
      background_vignette: 30,
    },
  },
  {
    key: 'golden_hour',
    nameKey: 'editor.filterNames.golden_hour', // Lokalize edildi
    descriptionKey: 'editor.filterNames.golden_hour', // Lokalize edildi
    settings: {
      product_warmth: 35,
      product_exposure: 5,
      product_shadows: -15,
      product_highlights: 10,
      background_warmth: 25,
      background_exposure: 10,
      background_blur: 8,
    },
  },
  {
    key: 'film_noir',
    nameKey: 'editor.filterNames.film_noir', // Lokalize edildi
    descriptionKey: 'editor.filterNames.film_noir', // Lokalize edildi
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
  },
  {
    key: 'soft_portrait',
    nameKey: 'editor.filterNames.soft_portrait', // Lokalize edildi
    descriptionKey: 'editor.filterNames.soft_portrait', // Lokalize edildi
    settings: {
      product_clarity: -15, // Cildi veya yüzeyi yumuşatır
      product_warmth: 10,
      product_shadows: 10,
      product_vibrance: 15,
      background_blur: 20,   // Arka planı belirgin şekilde odaktan çıkarır
      background_exposure: 5,
      background_saturation: -10,
    },
  },
  {
    key: 'arctic_blue',
    nameKey: 'editor.filterNames.arctic_blue', // Lokalize edildi
    descriptionKey: 'editor.filterNames.arctic_blue', // Lokalize edildi
    settings: {
        product_warmth: -25,
        product_contrast: 10,
        product_highlights: 5,
        background_warmth: -15,
        background_exposure: 10,
        background_contrast: 5,
    },
  }
];