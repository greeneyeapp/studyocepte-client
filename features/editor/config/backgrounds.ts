// features/editor/config/backgrounds.ts - KATEGORİLENDİRİLMİŞ BACKGROUND SİSTEMİ

export interface Background {
    id: string;
    name: string;
    thumbnailUrl: any; // require() veya hex renk kodu için any type
    fullUrl: any;      // require() veya hex renk kodu için any type
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
            },
            {
                id: 'home_3',
                name: 'He He',
                thumbnailUrl: require('@/assets/images/backgrounds/home/home_3_thumb.jpg'),
                fullUrl: require('@/assets/images/backgrounds/home/home_3_full.jpg'),
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
            },
            {
                id: 'office_3',
                name: 'He he',
                thumbnailUrl: require('@/assets/images/backgrounds/office/office_3_thumb.jpg'),
                fullUrl: require('@/assets/images/backgrounds/office/office_3_full.jpg'),
                categoryId: 'office'
            }
        ]
    },
    // YENİ: SABİT RENKLER KATEGORİSİ
    {
        id: 'solid_colors',
        name: 'Sabit Renkler',
        icon: 'square', // Veya 'droplet', 'grid' gibi bir ikon
        backgrounds: [
            { id: 'white_solid', name: 'Beyaz', thumbnailUrl: '#FFFFFF', fullUrl: '#FFFFFF', categoryId: 'solid_colors' },
            { id: 'black_solid', name: 'Siyah', thumbnailUrl: '#000000', fullUrl: '#000000', categoryId: 'solid_colors' },
            { id: 'gray_solid', name: 'Gri', thumbnailUrl: '#E0E0E0', fullUrl: '#E0E0E0', categoryId: 'solid_colors' },
            { id: 'light_blue_solid', name: 'Açık Mavi', thumbnailUrl: '#ADD8E6', fullUrl: '#ADD8E6', categoryId: 'solid_colors' },
            { id: 'light_pink_solid', name: 'Açık Pembe', thumbnailUrl: '#FFC0CB', fullUrl: '#FFC0CB', categoryId: 'solid_colors' },
            { id: 'light_green_solid', name: 'Açık Yeşil', thumbnailUrl: '#90EE90', fullUrl: '#90EE90', categoryId: 'solid_colors' },
            { id: 'beige_solid', name: 'Bej', thumbnailUrl: '#F5F5DC', fullUrl: '#F5F5DC', categoryId: 'solid_colors' },
            { id: 'light_yellow_solid', name: 'Açık Sarı', thumbnailUrl: '#FFFFE0', fullUrl: '#FFFFE0', categoryId: 'solid_colors' },
            { id: 'light_purple_solid', name: 'Açık Mor', thumbnailUrl: '#E6E6FA', fullUrl: '#E6E6FA', categoryId: 'solid_colors' },
            { id: 'brown_solid', name: 'Kahverengi', thumbnailUrl: '#A52A2A', fullUrl: '#A52A2A', categoryId: 'solid_colors' },
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