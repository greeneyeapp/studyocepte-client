// features/editor/utils/cssFilterGenerator.ts - GELIŞTIRILMIŞ VERSİYON

export interface FilterSettings {
  // Temel ışık ayarları
  exposure?: number;
  brightness?: number;
  highlights?: number;
  shadows?: number;
  
  // Renk ayarları
  contrast?: number;
  saturation?: number;
  vibrance?: number;
  warmth?: number;
  clarity?: number;
  
  // Arka plan özel
  blur?: number;
  vignette?: number;
}

/**
 * Geliştirilmiş CSS filter generator
 * Her ayarın kendine özgü etkisi olacak şekilde optimize edildi
 */
export const generateAdvancedImageStyle = (
  settings: Record<string, number>, 
  prefix: 'product' | 'background', 
  showOriginal: boolean = false
) => {
  if (showOriginal) return { filter: 'none' };

  const getSetting = (key: string): number => {
    const fullKey = `${prefix}_${key}` as string;
    return settings[fullKey] || 0;
  };

  // Değerleri al
  const exposure = getSetting('exposure');
  const brightness = getSetting('brightness');
  const highlights = getSetting('highlights');
  const shadows = getSetting('shadows');
  const contrast = getSetting('contrast');
  const saturation = getSetting('saturation');
  const vibrance = getSetting('vibrance');
  const warmth = getSetting('warmth');
  const clarity = getSetting('clarity');
  const blur = getSetting('blur');
  const vignette = getSetting('vignette');

  const filters: string[] = [];

  // 1. EXPOSURE - Genel ışık seviyesi (exponential curve)
  if (Math.abs(exposure) > 1) {
    // Exposure gerçek anlamda pozlama değişimi gibi çalışmalı
    const exposureMultiplier = exposure > 0 
      ? 1 + (exposure / 100) * 1.5  // Artı değerlerde daha güçlü etki
      : Math.max(0.1, 1 + (exposure / 100) * 0.8); // Eksi değerlerde kontrollü
    filters.push(`brightness(${exposureMultiplier})`);
  }

  // 2. BRIGHTNESS - Linear parlaklık artışı (exposure'dan farklı)
  if (Math.abs(brightness) > 1) {
    // Brightness sadece linear parlaklık değişimi
    const brightnessValue = 1 + (brightness / 200); // Daha yumuşak değişim
    filters.push(`brightness(${Math.max(0.1, brightnessValue)})`);
  }

  // 3. CONTRAST - Ton aralığı kontrolü
  if (Math.abs(contrast) > 1) {
    const contrastValue = 1 + (contrast / 100);
    filters.push(`contrast(${Math.max(0.1, contrastValue)})`);
  }

  // 4. HIGHLIGHTS - Parlak alanlar (CSS ile sınırlı, curve simulation)
  if (Math.abs(highlights) > 1) {
    // Highlights'ı brightness ve contrast kombinasyonu ile simüle et
    const highlightAdjust = highlights > 0 
      ? 1 + (highlights / 300) // Pozitif: biraz daha parlak
      : 1 + (highlights / 150); // Negatif: parlak alanları kontrol et
    filters.push(`brightness(${Math.max(0.3, highlightAdjust)})`);
  }

  // 5. SHADOWS - Koyu alanlar (contrast ile kombine)
  if (Math.abs(shadows) > 1) {
    // Shadows'u contrast ayarıyla kombine edelim
    const shadowBoost = shadows > 0 
      ? 1 + (shadows / 200) // Pozitif: gölgeleri açar
      : 1 + (shadows / 100); // Negatif: gölgeleri koyulaştırır
    
    // Gölge açma için hem brightness hem contrast kullan
    if (shadows > 0) {
      filters.push(`brightness(${shadowBoost})`);
      filters.push(`contrast(${0.9 + (shadows / 500)})`); // Hafif contrast azaltma
    } else {
      filters.push(`contrast(${1 + Math.abs(shadows) / 200})`); // Contrast artır
    }
  }

  // 6. SATURATION - Genel renk doygunluğu
  if (Math.abs(saturation) > 1) {
    const satValue = Math.max(0, 1 + (saturation / 100));
    filters.push(`saturate(${satValue})`);
  }

  // 7. VIBRANCE - Akıllı doygunluk (saturation'dan farklı olmalı)
  if (Math.abs(vibrance) > 1) {
    // Vibrance'ı daha yumuşak saturation + renk değişimi ile simüle et
    const vibranceValue = Math.max(0, 1 + (vibrance / 150)); // Daha yumuşak
    filters.push(`saturate(${vibranceValue})`);
    
    // Vibrance renk tonunu da hafif etkiler
    if (Math.abs(vibrance) > 20) {
      const hueShift = vibrance / 20; // Çok hafif hue değişimi
      filters.push(`hue-rotate(${hueShift}deg)`);
    }
  }

  // 8. WARMTH - Renk sıcaklığı (belirgin hue değişimi)
  if (Math.abs(warmth) > 1) {
    // Warmth için daha güçlü hue rotation
    const hueValue = warmth * 0.6; // Daha belirgin renk değişimi
    filters.push(`hue-rotate(${hueValue}deg)`);
    
    // Warmth aynı zamanda hafif saturation etkisi de yapar
    const warmthSat = 1 + (Math.abs(warmth) / 400);
    filters.push(`saturate(${warmthSat})`);
  }

  // 9. CLARITY - Detay keskinliği (sadece local contrast, parlaklık değil!)
  if (Math.abs(clarity) > 1) {
    // Clarity = orta tonlarda mikro-kontrast artışı
    // CSS'de tam clarity yapamayız ama en yakını:
    
    if (clarity > 0) {
      // Pozitif clarity: Hafif kontrast + saturasyon artışı
      const clarityContrast = 1 + (clarity / 150); // Daha güçlü kontrast
      const claritySat = 1 + (clarity / 400); // Çok hafif renk artışı
      
      filters.push(`contrast(${Math.max(0.5, clarityContrast)})`);
      filters.push(`saturate(${claritySat})`);
      
      // Çok yüksek clarity değerlerinde hafif keskinlik efekti
      if (clarity > 50) {
        // Unsharp mask simülasyonu: çok hafif blur'un tersini yapmaya çalış
        // CSS'de tam yapamayız ama drop-shadow ile keskinlik hissi verebiliriz
        const sharpness = Math.min(1, clarity / 100);
        filters.push(`drop-shadow(0 0 0.5px rgba(0,0,0,${sharpness * 0.3}))`);
      }
    } else {
      // Negatif clarity: Yumuşatma efekti (portrait skin smoothing)
      const soften = Math.abs(clarity);
      const softenContrast = Math.max(0.7, 1 - (soften / 300)); // Kontrast azalt
      
      filters.push(`contrast(${softenContrast})`);
      
      // Çok negatif değerlerde hafif blur
      if (soften > 30) {
        const blurAmount = Math.min(1, (soften - 30) / 70); // 0-1 arası
        filters.push(`blur(${blurAmount}px)`);
      }
    }
  }

  // 10. BLUR - Sadece background için
  if (prefix === 'background' && blur > 0) {
    const blurValue = blur / 8; // 0-12.5px arası blur
    filters.push(`blur(${blurValue}px)`);
  }

  // 11. VIGNETTE - CSS ile yapılamaz, React Native overlay ile yapılıyor
  // Bu kısım EditorPreview'da SimpleVignetteOverlay bileşeni ile hallediliyor

  return {
    filter: filters.length > 0 ? filters.join(' ') : 'none'
  };
};

// Orijinal fonksiyonunuzu değiştirin
export const generateImageStyle = generateAdvancedImageStyle;

// Test fonksiyonu - development ortamında kullanın
export const testFilterDifferences = () => {
  const testSettings = {
    product_exposure: 50,
    product_brightness: 50,
    product_contrast: 50,
    product_saturation: 50,
    product_vibrance: 50,
    product_warmth: 50,
    product_clarity: 50,
  };

  console.log('🧪 FILTER TEST RESULTS:');
  
  Object.keys(testSettings).forEach(key => {
    const isolatedSettings = { [key]: 50 };
    const result = generateAdvancedImageStyle(isolatedSettings, 'product');
    console.log(`${key}: ${result.filter}`);
  });
};

// Karşılaştırma tablosu
export const FILTER_COMPARISON = {
  exposure: {
    purpose: 'Genel ışık seviyesi (exponential)',
    cssEffect: 'brightness() - güçlü değişim',
    visualEffect: 'Tüm tonları exponential olarak değiştirir',
    range: 'Dramatic değişim (-100: çok karanlık, +100: yanmış)'
  },
  brightness: {
    purpose: 'Linear parlaklık artışı',
    cssEffect: 'brightness() - yumuşak değişim', 
    visualEffect: 'Tüm tonları eşit oranda değiştirir',
    range: 'Yumuşak değişim (-100: koyu, +100: parlak)'
  },
  contrast: {
    purpose: 'Açık-koyu ton farkı',
    cssEffect: 'contrast()',
    visualEffect: 'Ton aralığını genişletir/daraltır',
    range: 'Dramatic etki (-100: düz, +100: keskin)'
  },
  saturation: {
    purpose: 'Genel renk doygunluğu',
    cssEffect: 'saturate()',
    visualEffect: 'Tüm renkleri eşit oranda etkiler',
    range: 'Linear etki (-100: gri, +100: aşırı canlı)'
  },
  vibrance: {
    purpose: 'Akıllı renk doygunluğu',
    cssEffect: 'saturate() + hafif hue-rotate()',
    visualEffect: 'Zaten canlı renkleri korur, solukları canlandırır',
    range: 'Daha doğal (-100: mat, +100: doğal canlı)'
  },
  warmth: {
    purpose: 'Renk sıcaklığı',
    cssEffect: 'hue-rotate() + hafif saturate()',
    visualEffect: 'Renk tonunu sıcak/soğuk yapar',
    range: 'Belirgin renk değişimi (-100: soğuk mavi, +100: sıcak sarı)'
  }
};