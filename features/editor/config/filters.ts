// features/editor/config/filters.ts - PROFESYONEL "GÖRÜNÜM" (LOOK) KÜTÜPHANESİ

export interface FilterPreset {
  key: string;
  name: string;
  settings: Record<string, number>;
  description?: string;
}

/**
 * Bu filtreler artık basit ayar değişiklikleri değil, birden çok ayarın birleşimiyle
 * oluşturulmuş, profesyonel "görünümler" (looks) sunar. Her biri, ürün ve arka planı
 * farklı şekillerde etkileyerek daha sofistike sonuçlar üretir.
 */
export const ALL_FILTERS: FilterPreset[] = [
  {
    key: 'original',
    name: 'Orijinal',
    settings: {},
    description: 'Uygulanan tüm ayarları sıfırlar.',
  },
  {
    key: 'clean_ecommerce',
    name: 'Temiz E-Ticaret',
    settings: {
      product_exposure: 10,
      product_brightness: 5,
      product_clarity: 15,
      product_vibrance: 5,
      background_exposure: 15,
      background_brightness: 10,
    },
    description: 'Ürünü öne çıkaran, aydınlık, net ve ticari çekimler için ideal görünüm.',
  },
  {
    key: 'vivid_pop',
    name: 'Canlı Pop',
    settings: {
      product_vibrance: 30,
      product_contrast: 15,
      product_clarity: 10,
      background_saturation: 15,
      background_contrast: 5,
    },
    description: 'Renkleri patlatan, enerjik ve dikkat çekici bir stil.',
  },
  {
    key: 'dramatic_contrast',
    name: 'Dramatik Kontrast',
    settings: {
      product_contrast: 35,
      product_clarity: 25,
      product_highlights: -25,
      product_shadows: 15,
      background_exposure: -10,
      background_vignette: 40,
    },
    description: 'Derin gölgeler ve güçlü vurgularla etkileyici ve çarpıcı bir hava.',
  },
  {
    key: 'vintage_dream',
    name: 'Vintage Rüya',
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
    description: 'Sıcak tonlar, soluk siyahlar ve vinyet ile nostaljik film estetiği.',
  },
  {
    key: 'cinematic_teal_orange',
    name: 'Sinematik (T&O)',
    settings: {
      product_warmth: 15,    // Ürünü turuncuya/sıcağa çeker
      product_contrast: 20,
      product_clarity: 15,
      background_warmth: -20,  // Arka planı turkuaza/soğuğa çeker
      background_contrast: 10,
      background_vignette: 30,
    },
    description: 'Popüler "Teal & Orange" renk paletiyle modern film görünümü.',
  },
  {
    key: 'golden_hour',
    name: 'Altın Saat',
    settings: {
      product_warmth: 35,
      product_exposure: 5,
      product_shadows: -15,
      product_highlights: 10,
      background_warmth: 25,
      background_exposure: 10,
      background_blur: 8,
    },
    description: 'Gün batımının yumuşak ve sıcak ışığını taklit eden büyülü tonlar.',
  },
  {
    key: 'film_noir',
    name: 'Film Noir',
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
    description: 'Yüksek kontrastlı, grenli ve gizemli klasik siyah beyaz film stili.',
  },
  {
    key: 'soft_portrait',
    name: 'Yumuşak Portre',
    settings: {
      product_clarity: -15, // Cildi veya yüzeyi yumuşatır
      product_warmth: 10,
      product_shadows: 10,
      product_vibrance: 15,
      background_blur: 20,   // Arka planı belirgin şekilde odaktan çıkarır
      background_exposure: 5,
      background_saturation: -10,
    },
    description: 'Özneyi yumuşatarak öne çıkaran ve arka planı bulanıklaştıran portre filtresi.',
  },
  {
    key: 'arctic_blue',
    name: 'Arktik Mavi',
    settings: {
        product_warmth: -25,
        product_contrast: 10,
        product_highlights: 5,
        background_warmth: -15,
        background_exposure: 10,
        background_contrast: 5,
    },
    description: 'Soğuk, temiz ve modern bir görünüm için buzlu mavi tonları.',
  }
];