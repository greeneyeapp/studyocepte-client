// utils/backgroundDebugHelper.ts - DEBUG ve TEST YARDIMCISI
import { BACKGROUND_CATEGORIES } from '@/features/editor/config/backgrounds';

export const BackgroundDebugHelper = {
  /**
   * Tüm background kategorilerini ve asset'lerini kontrol eder
   */
  validateAllBackgrounds: () => {
    console.log('🔍 === BACKGROUND VALIDATION BAŞLIYOR ===');
    
    let totalBackgrounds = 0;
    let validBackgrounds = 0;
    let invalidBackgrounds = 0;

    BACKGROUND_CATEGORIES.forEach(category => {
      console.log(`\n📂 Kategori: ${category.name} (${category.id})`);
      console.log(`🖼️ Background sayısı: ${category.backgrounds.length}`);
      
      category.backgrounds.forEach(background => {
        totalBackgrounds++;
        
        try {
          // Asset türünü kontrol et
          const thumbnailType = typeof background.thumbnailUrl;
          const fullUrlType = typeof background.fullUrl;
          
          console.log(`  - ${background.name} (${background.id})`);
          console.log(`    Thumbnail: ${thumbnailType} | Full: ${fullUrlType}`);
          
          // Temel validasyon
          if (background.id && background.name && background.thumbnailUrl && background.fullUrl) {
            validBackgrounds++;
            console.log(`    ✅ Geçerli`);
          } else {
            invalidBackgrounds++;
            console.log(`    ❌ Eksik alanlar var`);
          }
          
        } catch (error) {
          invalidBackgrounds++;
          console.log(`    ❌ Hata: ${error}`);
        }
      });
    });

    console.log('\n📊 === ÖZET ===');
    console.log(`Toplam Background: ${totalBackgrounds}`);
    console.log(`Geçerli: ${validBackgrounds}`);
    console.log(`Geçersiz: ${invalidBackgrounds}`);
    console.log(`Başarı Oranı: ${((validBackgrounds / totalBackgrounds) * 100).toFixed(1)}%`);
    
    return {
      total: totalBackgrounds,
      valid: validBackgrounds,
      invalid: invalidBackgrounds,
      successRate: (validBackgrounds / totalBackgrounds) * 100
    };
  },

  /**
   * Belirli bir background'ı test eder
   */
  testBackground: async (backgroundId: string) => {
    console.log(`🧪 Testing background: ${backgroundId}`);
    
    const allBackgrounds = BACKGROUND_CATEGORIES.flatMap(cat => cat.backgrounds);
    const background = allBackgrounds.find(bg => bg.id === backgroundId);
    
    if (!background) {
      console.error(`❌ Background bulunamadı: ${backgroundId}`);
      return null;
    }

    try {
      // Asset resolution test
      if (typeof background.thumbnailUrl === 'number') {
        console.log(`🔄 Asset resolution test başlıyor...`);
        
        const { Asset } = await import('expo-asset');
        const asset = Asset.fromModule(background.thumbnailUrl);
        
        console.log(`📦 Asset bilgisi:`, {
          name: asset.name,
          type: asset.type,
          uri: asset.uri,
          localUri: asset.localUri
        });
        
        // Asset'i download et
        await asset.downloadAsync();
        
        const resolvedUri = asset.localUri || asset.uri;
        console.log(`✅ Asset başarıyla resolve edildi: ${resolvedUri}`);
        
        return {
          success: true,
          background,
          resolvedUri,
          assetInfo: {
            name: asset.name,
            type: asset.type,
            uri: asset.uri,
            localUri: asset.localUri
          }
        };
        
      } else if (typeof background.thumbnailUrl === 'string') {
        console.log(`✅ String URI tespit edildi: ${background.thumbnailUrl}`);
        return {
          success: true,
          background,
          resolvedUri: background.thumbnailUrl,
          assetInfo: null
        };
      } else {
        throw new Error(`Desteklenmeyen thumbnail türü: ${typeof background.thumbnailUrl}`);
      }
      
    } catch (error) {
      console.error(`❌ Test başarısız:`, error);
      return {
        success: false,
        background,
        error: error.message,
        resolvedUri: null,
        assetInfo: null
      };
    }
  },

  /**
   * Background thumbnail manager'ı test eder
   */
  testThumbnailManager: async (backgroundId: string) => {
    try {
      console.log(`🔧 Thumbnail manager test: ${backgroundId}`);
      
      const { backgroundThumbnailManager } = await import('@/services/backgroundThumbnailManager');
      const allBackgrounds = BACKGROUND_CATEGORIES.flatMap(cat => cat.backgrounds);
      const background = allBackgrounds.find(bg => bg.id === backgroundId);
      
      if (!background) {
        throw new Error('Background bulunamadı');
      }

      const startTime = Date.now();
      const result = await backgroundThumbnailManager.getThumbnail(background.id, background.fullUrl);
      const endTime = Date.now();
      
      console.log(`⏱️ Süre: ${endTime - startTime}ms`);
      console.log(`📸 Sonuç: ${result ? '✅ Başarılı' : '❌ Başarısız'}`);
      
      if (result) {
        console.log(`🖼️ Thumbnail URI: ${result}`);
      }
      
      return {
        success: !!result,
        thumbnailUri: result,
        duration: endTime - startTime,
        background
      };
      
    } catch (error) {
      console.error(`❌ Thumbnail manager test başarısız:`, error);
      return {
        success: false,
        error: error.message,
        thumbnailUri: null,
        duration: 0,
        background: null
      };
    }
  },

  /**
   * Editor'da aktif olan background'ı kontrol eder
   */
  checkActiveBackground: () => {
    try {
      const { useEnhancedEditorStore } = require('@/stores/useEnhancedEditorStore');
      const state = useEnhancedEditorStore.getState();
      
      console.log(`🎯 Aktif background ID: ${state.settings.backgroundId}`);
      
      const allBackgrounds = BACKGROUND_CATEGORIES.flatMap(cat => cat.backgrounds);
      const activeBackground = allBackgrounds.find(bg => bg.id === state.settings.backgroundId);
      
      if (activeBackground) {
        console.log(`✅ Aktif background bulundu:`, {
          id: activeBackground.id,
          name: activeBackground.name,
          categoryId: activeBackground.categoryId
        });
      } else {
        console.warn(`⚠️ Aktif background bulunamadı: ${state.settings.backgroundId}`);
      }
      
      return {
        activeBackgroundId: state.settings.backgroundId,
        found: !!activeBackground,
        background: activeBackground || null
      };
      
    } catch (error) {
      console.error(`❌ Active background check failed:`, error);
      return null;
    }
  },

  /**
   * Hızlı sorun giderme
   */
  quickFix: async () => {
    console.log('🔧 === HİZLI SORUN GİDERME ===');
    
    // 1. Validation
    console.log('\n1️⃣ Background validation...');
    const validation = BackgroundDebugHelper.validateAllBackgrounds();
    
    // 2. Active background check
    console.log('\n2️⃣ Active background check...');
    const activeCheck = BackgroundDebugHelper.checkActiveBackground();
    
    // 3. İlk background'ı test et
    console.log('\n3️⃣ İlk background test...');
    const firstBackground = BACKGROUND_CATEGORIES[0]?.backgrounds[0];
    if (firstBackground) {
      const testResult = await BackgroundDebugHelper.testBackground(firstBackground.id);
      console.log('Test sonucu:', testResult?.success ? '✅' : '❌');
    }
    
    // 4. Öneriler
    console.log('\n💡 === ÖNERİLER ===');
    
    if (validation.invalid > 0) {
      console.log('❗ Geçersiz backgroundlar var, configi kontrol edin');
    }
    
    if (!activeCheck?.found) {
      console.log('❗ Aktif background bulunamadı, default background set edin');
    }
    
    if (validation.successRate < 100) {
      console.log('❗ Tüm backgroundlar geçerli değil, asset pathleri kontrol edin');
    } else {
      console.log('✅ Tüm backgroundlar geçerli görünüyor');
    }
    
    return {
      validation,
      activeCheck,
      recommendations: {
        checkAssetPaths: validation.invalid > 0,
        setDefaultBackground: !activeCheck?.found,
        reviewConfig: validation.successRate < 100
      }
    };
  }
};

// Development ortamında global olarak kullanılabilir hale getir
if (__DEV__) {
  (global as any).BackgroundDebugHelper = BackgroundDebugHelper;
  console.log('🐛 BackgroundDebugHelper global olarak kullanılabilir');
  console.log('Kullanım: BackgroundDebugHelper.quickFix()');
}