// client/features/editor/utils/styleUtils.ts (DAHA AGRESİF FİLTRELER)
import { 
    Skia, 
    TileMode,
    type SkImageFilter, 
    type SkColorFilter
} from "@shopify/react-native-skia";
import { EditorSettings } from '@/stores/useEnhancedEditorStore';

export interface SkiaAdjustmentProps {
  imageFilter: SkImageFilter | null;
}

type EditorSettingKey = keyof EditorSettings;

// Daha agresif matrix hesaplamaları
const createBrightnessMatrix = (brightness: number) => {
  'worklet';
  // Brightness etkisini artır
  const adjustedBrightness = brightness * 2.0; // 2x daha güçlü
  return [
    1, 0, 0, 0, adjustedBrightness,
    0, 1, 0, 0, adjustedBrightness,
    0, 0, 1, 0, adjustedBrightness,
    0, 0, 0, 1, 0
  ];
};

const createContrastMatrix = (contrast: number) => {
  'worklet';
  // Contrast etkisini artır
  const adjustedContrast = Math.max(0.1, contrast * 1.5); // 1.5x daha güçlü
  const t = (1.0 - adjustedContrast) / 2.0;
  return [
    adjustedContrast, 0, 0, 0, t,
    0, adjustedContrast, 0, 0, t,
    0, 0, adjustedContrast, 0, t,
    0, 0, 0, 1, 0
  ];
};

const createSaturationMatrix = (saturation: number) => {
  'worklet';
  // Saturation etkisini artır
  const adjustedSaturation = Math.max(0, saturation * 1.8); // 1.8x daha güçlü
  const lumR = 0.3086;
  const lumG = 0.6094;
  const lumB = 0.0820;
  
  return [
    lumR + (1 - lumR) * adjustedSaturation, lumG - lumG * adjustedSaturation, lumB - lumB * adjustedSaturation, 0, 0,
    lumR - lumR * adjustedSaturation, lumG + (1 - lumG) * adjustedSaturation, lumB - lumB * adjustedSaturation, 0, 0,
    lumR - lumR * adjustedSaturation, lumG - lumG * adjustedSaturation, lumB + (1 - lumB) * adjustedSaturation, 0, 0,
    0, 0, 0, 1, 0
  ];
};

const createWarmthMatrix = (warmth: number) => {
  'worklet';
  // Warmth etkisini çok daha agresif yap
  const warmthFactor = warmth / 50; // Daha güçlü etki için 50'ye böl
  return [
    1 + warmthFactor * 0.3, 0, 0, 0, warmthFactor * 0.1,
    0, 1 + warmthFactor * 0.1, 0, 0, warmthFactor * 0.05,
    0, 0, 1 - warmthFactor * 0.4, 0, -warmthFactor * 0.1,
    0, 0, 0, 1, 0
  ];
};

/**
 * Daha agresif Skia filtre sistemi
 */
export const getSkiaFilters = (
  settings: Partial<EditorSettings>,
  prefix: 'product' | 'background'
): SkiaAdjustmentProps => {
  'worklet';

  try {
    const imageFilters: SkImageFilter[] = [];
    const colorFilters: SkColorFilter[] = [];

    // Debug için konsola yazdır
    console.log(`[${prefix}] Settings:`, JSON.stringify(settings, null, 2));

    const getSetting = (key: string): number => {
      'worklet';
      const fullKey = `${prefix}_${key}` as EditorSettingKey;
      const value = settings[fullKey];
      const result = typeof value === 'number' ? value : 0;
      console.log(`[${prefix}] ${key}: ${result}`);
      return result;
    };

    // 1. BRIGHTNESS & EXPOSURE - Çok daha agresif
    const exposure = getSetting('exposure');
    const brightness = getSetting('brightness');
    const totalBrightness = (exposure + brightness) / 80; // 80'e böl daha güçlü etki için
    
    if (Math.abs(totalBrightness) > 0.001) {
      console.log(`[${prefix}] Applying brightness: ${totalBrightness}`);
      const brightnessMatrix = createBrightnessMatrix(totalBrightness);
      const brightnessFilter = Skia.ColorFilter.MakeMatrix(brightnessMatrix);
      if (brightnessFilter) {
        colorFilters.push(brightnessFilter);
      }
    }

    // 2. CONTRAST - Daha agresif
    const contrast = getSetting('contrast');
    if (Math.abs(contrast) > 0.001) {
      console.log(`[${prefix}] Applying contrast: ${contrast}`);
      const contrastValue = 1.0 + (contrast / 60); // 60'a böl daha güçlü etki için
      const contrastMatrix = createContrastMatrix(contrastValue);
      const contrastFilter = Skia.ColorFilter.MakeMatrix(contrastMatrix);
      if (contrastFilter) {
        colorFilters.push(contrastFilter);
      }
    }

    // 3. SATURATION & VIBRANCE - Çok daha agresif
    const saturation = getSetting('saturation');
    const vibrance = getSetting('vibrance');
    const totalSaturation = saturation + vibrance;
    
    if (Math.abs(totalSaturation) > 0.001) {
      console.log(`[${prefix}] Applying saturation: ${totalSaturation}`);
      const saturationValue = 1.0 + (totalSaturation / 60); // 60'a böl daha güçlü etki için
      const saturationMatrix = createSaturationMatrix(Math.max(0, saturationValue));
      const saturationFilter = Skia.ColorFilter.MakeMatrix(saturationMatrix);
      if (saturationFilter) {
        colorFilters.push(saturationFilter);
      }
    }

    // 4. WARMTH - Çok daha agresif
    const warmth = getSetting('warmth');
    if (Math.abs(warmth) > 0.001) {
      console.log(`[${prefix}] Applying warmth: ${warmth}`);
      const warmthMatrix = createWarmthMatrix(warmth);
      const warmthFilter = Skia.ColorFilter.MakeMatrix(warmthMatrix);
      if (warmthFilter) {
        colorFilters.push(warmthFilter);
      }
    }

    // 5. HIGHLIGHTS & SHADOWS
    const highlights = getSetting('highlights');
    const shadows = getSetting('shadows');
    
    if (Math.abs(highlights) > 0.001 || Math.abs(shadows) > 0.001) {
      console.log(`[${prefix}] Applying highlights/shadows: ${highlights}/${shadows}`);
      const highlightShadowAdjustment = (highlights - shadows) / 100; // Daha güçlü etki
      if (Math.abs(highlightShadowAdjustment) > 0.001) {
        const hsMatrix = createBrightnessMatrix(highlightShadowAdjustment);
        const hsFilter = Skia.ColorFilter.MakeMatrix(hsMatrix);
        if (hsFilter) {
          colorFilters.push(hsFilter);
        }
      }
    }

    // 6. BACKGROUND ÖZELLİKLERİ
    if (prefix === 'background') {
      const blur = getSetting('blur');
      if (blur > 0) {
        console.log(`[${prefix}] Applying blur: ${blur}`);
        const blurRadius = blur / 5; // Daha güçlü blur
        const blurFilter = Skia.ImageFilter.MakeBlur(
          blurRadius, 
          blurRadius, 
          TileMode.Clamp, 
          null
        );
        if (blurFilter) {
          imageFilters.push(blurFilter);
        }
      }

      const vignette = getSetting('vignette');
      if (vignette > 0) {
        console.log(`[${prefix}] Applying vignette: ${vignette}`);
        const vignetteDarkness = -(vignette / 100); // Daha güçlü vignette
        const vignetteMatrix = createBrightnessMatrix(vignetteDarkness);
        const vignetteFilter = Skia.ColorFilter.MakeMatrix(vignetteMatrix);
        if (vignetteFilter) {
          colorFilters.push(vignetteFilter);
        }
      }
    }

    // 7. CLARITY
    const clarity = getSetting('clarity');
    if (Math.abs(clarity) > 0.001) {
      console.log(`[${prefix}] Applying clarity: ${clarity}`);
      const clarityValue = 1.0 + (clarity / 80); // Daha güçlü clarity
      const clarityMatrix = createContrastMatrix(clarityValue);
      const clarityFilter = Skia.ColorFilter.MakeMatrix(clarityMatrix);
      if (clarityFilter) {
        colorFilters.push(clarityFilter);
      }
    }

    console.log(`[${prefix}] Total color filters: ${colorFilters.length}`);
    console.log(`[${prefix}] Total image filters: ${imageFilters.length}`);

    // Renk filtrelerini birleştir
    let finalColorFilter: SkColorFilter | null = null;
    if (colorFilters.length > 0) {
      finalColorFilter = colorFilters.reduce((combined, current) => {
        if (!combined) return current;
        const composed = Skia.ColorFilter.MakeCompose(current, combined);
        return composed || combined;
      });
    }

    // Renk filtresini image filter'a dönüştür
    if (finalColorFilter) {
      const colorImageFilter = Skia.ImageFilter.MakeColorFilter(finalColorFilter, null);
      if (colorImageFilter) {
        imageFilters.push(colorImageFilter);
      }
    }

    // Tüm image filtreleri birleştir
    let finalImageFilter: SkImageFilter | null = null;
    if (imageFilters.length > 0) {
      finalImageFilter = imageFilters.reduce((combined, current) => {
        if (!combined) return current;
        const composed = Skia.ImageFilter.MakeCompose(current, combined);
        return composed || combined;
      });
    }

    console.log(`[${prefix}] Final filter applied:`, !!finalImageFilter);
    return { imageFilter: finalImageFilter };

  } catch (error) {
    console.error(`[${prefix}] Skia filter error:`, error);
    return { imageFilter: null };
  }
};