// features/editor/config/backgrounds.ts - KATEGORİLENDİRİLMİŞ BACKGROUND SİSTEMİ

export interface Background {
  id: string;
  name: string;
  thumbnailUrl: any; // require() için any type
  fullUrl: any;
  categoryId: string;
}

export interface BackgroundCategory {
  id: string;
  name: string;
  icon: string;
  backgrounds: Background[];
}

export const BACKGROUND_CATEGORIES: BackgroundCategory[] = [
  {
    id: 'home',
    name: 'Ev',
    icon: 'home',
    backgrounds: [
      {
        id: 'home_1',
        name: 'Modern Oturma Odası',
        thumbnailUrl: require('@/assets/images/backgrounds/home/home_1_thumb.jpg'),
        fullUrl: require('@/assets/images/backgrounds/home/home_1_full.jpg'),
        categoryId: 'home'
      },
      {
        id: 'home_2',
        name: 'Minimalist Yatak Odası',
        thumbnailUrl: require('@/assets/images/backgrounds/home/home_2_thumb.jpg'),
        fullUrl: require('@/assets/images/backgrounds/home/home_2_full.jpg'),
        categoryId: 'home'
      }
    ]
  },
  {
    id: 'office',
    name: 'Ofis',
    icon: 'briefcase',
    backgrounds: [
      {
        id: 'office_1',
        name: 'Modern Çalışma Masası',
        thumbnailUrl: require('@/assets/images/backgrounds/office/office_1_thumb.jpg'),
        fullUrl: require('@/assets/images/backgrounds/office/office_1_full.jpg'),
        categoryId: 'office'
      },
      {
        id: 'office_2',
        name: 'Toplantı Salonu',
        thumbnailUrl: require('@/assets/images/backgrounds/office/office_2_thumb.jpg'),
        fullUrl: require('@/assets/images/backgrounds/office/office_2_full.jpg'),
        categoryId: 'office'
      }
    ]
  }
];

// Tüm background'ları tek liste halinde topla (geriye uyumluluk için)
export const ALL_BACKGROUNDS: Background[] = BACKGROUND_CATEGORIES.flatMap(
  category => category.backgrounds
);

// Kategori ID'sine göre background'ları getir
export const getBackgroundsByCategory = (categoryId: string): Background[] => {
  const category = BACKGROUND_CATEGORIES.find(cat => cat.id === categoryId);
  return category ? category.backgrounds : [];
};

// Background ID'sine göre background bul
export const getBackgroundById = (backgroundId: string): Background | undefined => {
  return ALL_BACKGROUNDS.find(bg => bg.id === backgroundId);
};