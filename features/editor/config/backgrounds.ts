// features/editor/config/backgrounds.ts - KATEGORİLENDİRİLMİŞ BACKGROUND SİSTEMİ (ÇEVİRİ ANAHTARLARI KULLANILDI)

export interface Background {
    id: string;
    name: string; // Bu artık doğrudan çeviri anahtarı olacak (örn. 'editor.backgroundName.home_1')
    thumbnailUrl: any;
    fullUrl: any;
    categoryId: string; // Bu artık doğrudan çeviri anahtarı olacak (örn. 'editor.backgroundCategory.home')
}

export interface BackgroundCategory {
    id: string;
    name: string; // Bu artık doğrudan çeviri anahtarı olacak (örn. 'editor.backgroundCategory.home')
    icon: string;
    backgrounds: Background[];
}

export const BACKGROUND_CATEGORIES: BackgroundCategory[] = [
    {
        id: 'home',
        name: 'editor.backgroundCategory.home', // Çeviri anahtarı
        icon: 'home',
        backgrounds: [
            {
                id: 'home_1',
                name: 'editor.backgroundName.home_1', // Çeviri anahtarı
                thumbnailUrl: require('@/assets/images/backgrounds/home/home_1_thumb.jpg'),
                fullUrl: require('@/assets/images/backgrounds/home/home_1_full.jpg'),
                categoryId: 'home'
            },
            {
                id: 'home_2',
                name: 'editor.backgroundName.home_2', // Çeviri anahtarı
                thumbnailUrl: require('@/assets/images/backgrounds/home/home_2_thumb.jpg'),
                fullUrl: require('@/assets/images/backgrounds/home/home_2_full.jpg'),
                categoryId: 'home'
            },
            {
                id: 'home_3',
                name: 'editor.backgroundName.home_3', // Çeviri anahtarı
                thumbnailUrl: require('@/assets/images/backgrounds/home/home_3_thumb.jpg'),
                fullUrl: require('@/assets/images/backgrounds/home/home_3_full.jpg'),
                categoryId: 'home'
            }
        ]
    },
    {
        id: 'office',
        name: 'editor.backgroundCategory.office', // Çeviri anahtarı
        icon: 'briefcase',
        backgrounds: [
            {
                id: 'office_1',
                name: 'editor.backgroundName.office_1', // Çeviri anahtarı
                thumbnailUrl: require('@/assets/images/backgrounds/office/office_1_thumb.jpg'),
                fullUrl: require('@/assets/images/backgrounds/office/office_1_full.jpg'),
                categoryId: 'office'
            },
            {
                id: 'office_2',
                name: 'editor.backgroundName.office_2', // Çeviri anahtarı
                thumbnailUrl: require('@/assets/images/backgrounds/office/office_2_thumb.jpg'),
                fullUrl: require('@/assets/images/backgrounds/office/office_2_full.jpg'),
                categoryId: 'office'
            },
            {
                id: 'office_3',
                name: 'editor.backgroundName.office_3', // Çeviri anahtarı
                thumbnailUrl: require('@/assets/images/backgrounds/office/office_3_thumb.jpg'),
                fullUrl: require('@/assets/images/backgrounds/office/office_3_full.jpg'),
                categoryId: 'office'
            }
        ]
    },
    {
        id: 'solid_colors',
        name: 'editor.backgroundCategory.solidColors', // Çeviri anahtarı
        icon: 'square',
        backgrounds: [
            { id: 'white_solid', name: 'editor.backgroundName.white_solid', thumbnailUrl: '#FFFFFF', fullUrl: '#FFFFFF', categoryId: 'solid_colors' },
            { id: 'black_solid', name: 'editor.backgroundName.black_solid', thumbnailUrl: '#000000', fullUrl: '#000000', categoryId: 'solid_colors' },
            { id: 'gray_solid', name: 'editor.backgroundName.gray_solid', thumbnailUrl: '#E0E0E0', fullUrl: '#E0E0E0', categoryId: 'solid_colors' },
            { id: 'light_blue_solid', name: 'editor.backgroundName.light_blue_solid', thumbnailUrl: '#ADD8E6', fullUrl: '#ADD8E6', categoryId: 'solid_colors' },
            { id: 'light_pink_solid', name: 'editor.backgroundName.light_pink_solid', thumbnailUrl: '#FFC0CB', fullUrl: '#FFC0CB', categoryId: 'solid_colors' },
            { id: 'light_green_solid', name: 'editor.backgroundName.light_green_solid', thumbnailUrl: '#90EE90', fullUrl: '#90EE90', categoryId: 'solid_colors' },
            { id: 'beige_solid', name: 'editor.backgroundName.beige_solid', thumbnailUrl: '#F5F5DC', fullUrl: '#F5F5DC', categoryId: 'solid_colors' },
            { id: 'light_yellow_solid', name: 'editor.backgroundName.light_yellow_solid', thumbnailUrl: '#FFFFE0', fullUrl: '#FFFFE0', categoryId: 'solid_colors' },
            { id: 'light_purple_solid', name: 'editor.backgroundName.light_purple_solid', thumbnailUrl: '#E6E6FA', fullUrl: '#E6E6FA', categoryId: 'solid_colors' },
            { id: 'brown_solid', name: 'editor.backgroundName.brown_solid', thumbnailUrl: '#A52A2A', fullUrl: '#A52A2A', categoryId: 'solid_colors' },
        ]
    }
];

export const ALL_BACKGROUNDS: Background[] = BACKGROUND_CATEGORIES.flatMap(
    category => category.backgrounds
);

export const getBackgroundsByCategory = (categoryId: string): Background[] => {
    const category = BACKGROUND_CATEGORIES.find(cat => cat.id === categoryId);
    return category ? category.backgrounds : [];
};

export const getBackgroundById = (backgroundId: string): Background | undefined => {
    return ALL_BACKGROUNDS.find(bg => bg.id === backgroundId);
};