// features/editor/config/exportTools.ts - HIZLI EXPORT EKLENMİŞ VERSİYON

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
  type: 'gallery' | 'generic' | 'quick_custom'; // Yeni type eklendi
}

export const EXPORT_PRESETS: ExportPreset[] = [
  // --- SOSYAL MEDYA (7 Seçenek) ---
  { id: 'instagram_square', name: 'Instagram Kare (1:1)', description: '1080x1080 - Akış gönderileri', dimensions: { width: 1080, height: 1080 }, format: 'jpg', quality: 0.9, category: 'social', icon: 'instagram' },
  { id: 'instagram_story', name: 'Instagram Hikaye', description: '1080x1920 - Dikey format', dimensions: { width: 1080, height: 1920 }, format: 'jpg', quality: 0.9, category: 'social', icon: 'smartphone' },
  { id: 'instagram_portrait', name: 'Instagram Dikey (4:5)', description: '1080x1350 - Portre gönderi', dimensions: { width: 1080, height: 1350 }, format: 'jpg', quality: 0.9, category: 'social', icon: 'maximize' },
  { id: 'youtube_thumbnail', name: 'YouTube Thumbnail', description: '1280x720 - Video kapak fotoğrafı', dimensions: { width: 1280, height: 720 }, format: 'jpg', quality: 0.9, category: 'social', icon: 'youtube' },
  { id: 'facebook_post', name: 'Facebook Gönderi', description: '1200x630 - Yatay paylaşımlar', dimensions: { width: 1200, height: 630 }, format: 'jpg', quality: 0.85, category: 'social', icon: 'facebook' },
  { id: 'pinterest_pin', name: 'Pinterest Pin', description: '1000x1500 - Standart dikey Pin oranı', dimensions: { width: 1000, height: 1500 }, format: 'jpg', quality: 0.9, category: 'social', icon: 'bookmark' },
  { id: 'twitter_post', name: 'X (Twitter) Gönderi', description: '1600x900 - Geniş formatlı tweet', dimensions: { width: 1600, height: 900 }, format: 'png', quality: 0.9, category: 'social', icon: 'twitter' },

  // --- E-TİCARET (6 Seçenek) ---
  { id: 'trendyol_main', name: 'Trendyol', description: '1200x1800 - Dikey ürün fotoğrafı', dimensions: { width: 1200, height: 1800 }, format: 'jpg', quality: 0.9, category: 'marketplace', icon: 'shopping-bag' },
  { id: 'hepsiburada_main', name: 'Hepsiburada', description: '1500x1500 - Standart kare ürün fotoğrafı', dimensions: { width: 1500, height: 1500 }, format: 'jpg', quality: 0.9, category: 'marketplace', icon: 'shopping-cart' },
  { id: 'amazon_main', name: 'Amazon', description: '2000x2000 - Yüksek çözünürlüklü kare', dimensions: { width: 2000, height: 2000 }, format: 'jpg', quality: 0.95, category: 'marketplace', icon: 'box' },
  { id: 'shopify_product', name: 'Shopify', description: '2048x2048 - Yüksek kaliteli kare', dimensions: { width: 2048, height: 2048 }, format: 'jpg', quality: 0.92, category: 'marketplace', icon: 'figma' },
  { id: 'etsy_listing', name: 'Etsy', description: '2700x2025 - Yatay listeleme fotoğrafı', dimensions: { width: 2700, height: 2025 }, format: 'jpg', quality: 0.92, category: 'marketplace', icon: 'gift' },
  { id: 'generic_ecommerce', name: 'Genel E-ticaret Kare', description: '1000x1000 - Çoğu platformla uyumlu', dimensions: { width: 1000, height: 1000 }, format: 'jpg', quality: 0.85, category: 'marketplace', icon: 'tag' },
  
  // --- WEB & DİJİTAL (6 Seçenek) ---
  { id: 'web_hero', name: 'Website Hero Image', description: '1920x1080 - Full HD, ana görsel', dimensions: { width: 1920, height: 1080 }, format: 'jpg', quality: 0.88, category: 'web', icon: 'layout' },
  { id: 'web_banner_wide', name: 'Geniş Banner', description: '728x90 - "Leaderboard" reklam alanı', dimensions: { width: 728, height: 90 }, format: 'png', quality: 0.9, category: 'web', icon: 'minus' },
  { id: 'web_banner_square', name: 'Kare Banner', description: '300x250 - "Medium Rectangle" reklam', dimensions: { width: 300, height: 250 }, format: 'png', quality: 0.9, category: 'web', icon: 'sidebar' },
  { id: 'web_blog_featured', name: 'Öne Çıkan Blog Görseli', description: '1200x800 - Makaleler için standart', dimensions: { width: 1200, height: 800 }, format: 'jpg', quality: 0.85, category: 'web', icon: 'align-left' },
  { id: 'web_favicon', name: 'Favicon', description: '64x64 - Website ikonu, şeffaf', dimensions: { width: 64, height: 64 }, format: 'png', quality: 1.0, category: 'web', icon: 'star' },
  { id: 'email_header', name: 'E-posta Başlığı', description: '600x200 - E-bültenler için başlık', dimensions: { width: 600, height: 200 }, format: 'jpg', quality: 0.85, category: 'web', icon: 'mail' },

  // --- BASKI (6 Seçenek) ---
  { id: 'print_a4', name: 'A4 Kağıt (300 DPI)', description: '2480x3508px - Katalog, belge', dimensions: { width: 2480, height: 3508 }, format: 'png', quality: 1.0, category: 'print', icon: 'file-text' },
  { id: 'print_a5', name: 'A5 Kağıt (300 DPI)', description: '1748x2480px - Broşür, el ilanı', dimensions: { width: 1748, height: 2480 }, format: 'png', quality: 1.0, category: 'print', icon: 'file' },
  { id: 'print_10x15', name: '10x15 Fotoğraf Baskı', description: '1181x1772px - Standart stüdyo baskısı', dimensions: { width: 1181, height: 1772 }, format: 'jpg', quality: 0.98, category: 'print', icon: 'camera' },
  { id: 'print_13x18', name: '13x18 Fotoğraf Baskı', description: '1535x2126px - Büyük boy fotoğraf', dimensions: { width: 1535, height: 2126 }, format: 'jpg', quality: 0.98, category: 'print', icon: 'image' },
  { id: 'print_business_card', name: 'Kartvizit (EU)', description: '1004x650px - Standart 85x55mm baskı', dimensions: { width: 1004, height: 650 }, format: 'png', quality: 1.0, category: 'print', icon: 'credit-card' },
  { id: 'print_poster', name: 'Afiş (A3)', description: '3508x4961px - Küçük boy afiş baskısı', dimensions: { width: 3508, height: 4961 }, format: 'png', quality: 1.0, category: 'print', icon: 'map' },

  // --- ÖZEL (6 Seçenek) ---
  { id: 'custom_widescreen', name: 'Geniş Ekran (16:9)', description: '1920x1080 - TV ve Monitör oranı', dimensions: { width: 1920, height: 1080 }, format: 'png', quality: 0.95, category: 'custom', icon: 'tv' },
  { id: 'custom_classic_photo', name: 'Klasik Fotoğraf (3:2)', description: '1080x720 - 35mm film oranı', dimensions: { width: 1080, height: 720 }, format: 'png', quality: 0.95, category: 'custom', icon: 'camera' },
  { id: 'custom_portrait', name: 'Dikey Portre (2:3)', description: '720x1080 - Dikey fotoğraf oranı', dimensions: { width: 720, height: 1080 }, format: 'png', quality: 0.95, category: 'custom', icon: 'user' },
  { id: 'custom_cinematic', name: 'Sinematik (21:9)', description: '2560x1080 - Ultra geniş ekran', dimensions: { width: 2560, height: 1080 }, format: 'png', quality: 0.95, category: 'custom', icon: 'film' },
  { id: 'custom_A4_yatay', name: 'A4 Yatay', description: '3508x2480px - Yatay belge/sunum', dimensions: { width: 3508, height: 2480 }, format: 'png', quality: 0.95, category: 'custom', icon: 'file-text' },
  { id: 'custom_size_input', name: 'Kendi Boyutunu Gir', description: 'Genişlik ve yükseklik değerlerini belirle', dimensions: { width: 1024, height: 1024 }, format: 'png', quality: 0.95, category: 'custom', icon: 'edit' },
];

export const SHARE_OPTIONS: ShareOption[] = [
  { id: 'gallery', name: 'Galeriye Kaydet', icon: 'download', type: 'gallery' },
  { id: 'share', name: 'Paylaş...', icon: 'share-2', type: 'generic' },
  { id: 'quick_custom', name: 'Hızlı Boyut', icon: 'zap', type: 'quick_custom' } // YENİ SEÇENEK
];

export const EXPORT_CATEGORIES = [
  { key: 'social', name: 'Sosyal Medya', icon: 'share-2' },
  { key: 'marketplace', name: 'E-ticaret', icon: 'shopping-cart' },
  { key: 'web', name: 'Web', icon: 'globe' },
  { key: 'print', name: 'Baskı', icon: 'printer' },
  { key: 'custom', name: 'Özel', icon: 'settings' }
] as const;