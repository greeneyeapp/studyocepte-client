// client/features/editor/utils/styleUtils.ts (TAM, HATASIZ VE KESİN ÇÖZÜM)
import { 
    Skia, 
    TileMode,
    type SkImageFilter, 
    type SkColorFilter,
    type SkiaProps
} from "@shopify/react-native-skia";
import { EditorSettings } from '@/stores/useEnhancedEditorStore';

export interface SkiaAdjustmentProps {
  imageFilter: SkImageFilter | null;
}

type EditorSettingKey = keyof EditorSettings;

// --- WORKLET'LER ---
// UI thread'inde çağrılacakları için bu yardımcı fonksiyonların da worklet olması gerekir.
const saturationMatrix = (s: number) => {
  'worklet';
  return [
    0.213 + 0.787 * s, 0.715 - 0.715 * s, 0.072 - 0.072 * s, 0, 0,
    0.213 - 0.213 * s, 0.715 + 0.285 * s, 0.072 - 0.072 * s, 0, 0,
    0.213 - 0.213 * s, 0.715 - 0.715 * s, 0.072 + 0.928 * s, 0, 0,
    0, 0, 0, 1, 0,
  ];
};
const contrastMatrix = (c: number) => {
  'worklet';
  const t = (1.0 - c) / 2.0;
  return [c, 0, 0, 0, t, 0, c, 0, 0, t, 0, 0, c, 0, t, 0, 0, 0, 1, 0];
};
const warmthMatrix = (w: number) => {
  'worklet';
  return [1, 0, 0, w, 0, 0, 1, 0, 0, 0, 0, 0, 1, -w, 0, 0, 0, 0, 1, 0];
};

/**
 * Bu, projenizin yeni SKIA TABANLI GÖRSEL İŞLEME MOTORUDUR.
 * Artık bir WORKLET olduğu için Reanimated UI thread'inde güvenle çalışabilir.
 */
export const getSkiaFilters = (
  settings: Partial<EditorSettings>,
  prefix: 'product' | 'background'
): SkiaAdjustmentProps => {
  'worklet'; // <<< EN KRİTİK DEĞİŞİKLİK BURADA!

  const imageFilters: SkImageFilter[] = [];
  const colorFilters: SkColorFilter[] = [];

  const getSetting = (key: string): number => {
    'worklet';
    const fullKey = `${prefix}_${key}` as EditorSettingKey;
    const value = settings[fullKey];
    return typeof value === 'number' ? value : 0;
  };

  // --- IŞIK & RENK AYARLARI ---
  const totalBrightness = (getSetting('exposure') / 100) + (getSetting('brightness') / 255);
  if (totalBrightness !== 0) {
    colorFilters.push(Skia.ColorFilter.MakeMatrix([1, 0, 0, 0, totalBrightness, 0, 1, 0, 0, totalBrightness, 0, 0, 1, 0, totalBrightness, 0, 0, 0, 1, 0]));
  }
  
  const contrastValue = 1.0 + (getSetting('contrast') / 100);
  if (contrastValue !== 1.0) colorFilters.push(Skia.ColorFilter.MakeMatrix(contrastMatrix(contrastValue)));

  const saturationValue = 1.0 + ((getSetting('saturation') + getSetting('vibrance')) / 100);
  if (saturationValue !== 1.0) colorFilters.push(Skia.ColorFilter.MakeMatrix(saturationMatrix(saturationValue)));
  
  const warmthValue = getSetting('warmth') / 255;
  if (warmthValue !== 0) colorFilters.push(Skia.ColorFilter.MakeMatrix(warmthMatrix(warmthValue)));

  // --- EFEKT AYARLARI ---
  if (prefix === 'background') {
    const blur = settings.background_blur || 0;
    if (blur > 0) {
      imageFilters.push(Skia.ImageFilter.MakeBlur(blur / 10, blur / 10, TileMode.Clamp, null));
    }
  }

  // Tüm renk filtrelerini tek bir `colorFilter` prop'u olarak birleştir
  if (colorFilters.length > 0) {
      const composedColorFilter = colorFilters.length === 1 ? colorFilters[0] : colorFilters.reduce((outer, inner) => Skia.ColorFilter.MakeCompose(inner, outer));
      imageFilters.push(Skia.ImageFilter.MakeColorFilter(composedColorFilter, null));
  }

  // Tüm filtreleri tek bir `imageFilter` prop'u olarak birleştir
  if (imageFilters.length > 0) {
    const composedImageFilter = imageFilters.length === 1 ? imageFilters[0] : imageFilters.reduce((outer, inner) => Skia.ImageFilter.MakeCompose(inner, outer));
    return { imageFilter: composedImageFilter };
  }

  return { imageFilter: null };
};