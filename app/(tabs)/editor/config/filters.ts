// app/(tabs)/editor/config/filters.ts

export interface FilterPreset {
  key: string;
  name: string;
  settings: Record<string, number>;
  intensity?: number;
}

// Sadece Apple Photos filtreleri - duplikasyon kaldırıldı
export const APPLE_FILTERS: FilterPreset[] = [
  {
    key: 'original',
    name: 'Orijinal',
    settings: {},
  },
  {
    key: 'vivid',
    name: 'Canlı',
    settings: {
      saturation: 35,
      vibrance: 25,
      contrast: 20,
      clarity: 15,
      warmth: 5,
    },
  },
  {
    key: 'dramatic',
    name: 'Dramatik',
    settings: {
      contrast: 45,
      highlights: -25,
      shadows: 30,
      clarity: 25,
      vignette: 20,
      saturation: 15,
    },
  },
  {
    key: 'mono',
    name: 'Mono',
    settings: {
      saturation: -100,
      contrast: 25,
      clarity: 20,
      highlights: -5,
      shadows: 10,
    },
  },
  {
    key: 'vintage',
    name: 'Vintage',
    settings: {
      warmth: 40,
      contrast: -10,
      vignette: 30,
      saturation: -20,
      shadows: 15,
    },
  },
  {
    key: 'cool',
    name: 'Soğuk',
    settings: {
      warmth: -30,
      saturation: 10,
      highlights: 10,
      contrast: 5,
    },
  },
];

// Sadece Apple filtrelerini kullan
export const ALL_FILTERS = APPLE_FILTERS;