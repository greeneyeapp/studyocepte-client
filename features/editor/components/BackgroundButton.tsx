// features/editor/components/BackgroundButton.tsx - OPTİMİZE EDİLMİŞ VERSİYON
import React from 'react';
import { OptimizedBackgroundButton } from './OptimizedBackgroundButton';

interface Background {
  id: string;
  name: string;
  thumbnailUrl: string;
  fullUrl: string;
}

interface BackgroundButtonProps {
  background: Background;
  isSelected: boolean;
  onPress: () => void;
}

/**
 * BackgroundButton artık optimize edilmiş versiyonu kullanır
 * 
 * ÖZELLİKLER:
 * ✅ Cache'li thumbnail loading (50MB limit)
 * ✅ Memory optimization ve cleanup
 * ✅ Error handling ve fallback
 * ✅ Performance monitoring
 * ✅ Preloading support
 * 
 * CACHE SİSTEMİ:
 * - Background thumbnail'ları cache/bg_thumbnails/ klasöründe saklanır
 * - 300x300 boyutunda optimize edilir
 * - 7 gün cache süresi, sonra otomatik temizlik
 * - LRU cache algoritması ile memory yönetimi
 * 
 * GÖRSEL İNDİKATÖRLER:
 * - ✅ Selection indicator (mavi check)
 * - ⚠️ Error indicator (kırmızı triangle)
 * - 💾 Cache indicator (yeşil database - dev mode)
 * - 🔄 Loading spinner
 */
export const BackgroundButton: React.FC<BackgroundButtonProps> = (props) => {
  return <OptimizedBackgroundButton {...props} />;
};