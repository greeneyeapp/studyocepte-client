// app/(tabs)/editor/config/filters.ts

export interface FilterPreset {
  key: string;
  name: string;
  settings: Record<string, number>;
  intensity?: number;
}

// Genişletilmiş Apple Photos filtreleri
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
      exposure: 5,
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
      exposure: -5,
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
      exposure: 5,
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
      exposure: -10,
      clarity: -5,
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
      clarity: 5,
    },
  },
  {
    key: 'warm',
    name: 'Sıcak',
    settings: {
      warmth: 25,
      exposure: 5,
      shadows: -10,
      saturation: 15,
      contrast: 5,
    },
  },
  {
    key: 'bright',
    name: 'Parlak',
    settings: {
      exposure: 20,
      highlights: 15,
      shadows: -10,
      contrast: 10,
      clarity: 10,
      saturation: 5,
      warmth: 5,
    },
  },
  {
    key: 'fade',
    name: 'Soluk',
    settings: {
      highlights: -30,
      shadows: 20,
      contrast: -20,
      saturation: -15,
      exposure: 10,
      warmth: 5,
      clarity: -10,
      vignette: 5,
    },
  },
  {
    key: 'cinema',
    name: 'Sinema',
    settings: {
      contrast: 30,
      shadows: 25,
      highlights: -15,
      warmth: 5,
      vignette: 20,
      saturation: -5,
      clarity: 15,
      exposure: -5,
    },
  },
  {
    key: 'noir',
    name: 'Noir',
    settings: {
      saturation: -100,
      contrast: 40,
      highlights: -20,
      shadows: 35,
      vignette: 25,
      clarity: 20,
    },
  },
  {
    key: 'pastel',
    name: 'Pastel',
    settings: {
      exposure: 10,
      highlights: -20,
      shadows: 15,
      contrast: -15,
      saturation: -10,
      warmth: 10,
      clarity: -5,
    },
  },
];

export const ALL_FILTERS = APPLE_FILTERS;