// utils/backgroundDebugHelper.ts - DEBUG ve TEST YARDIMCISI (ÇEVİRİ ANAHTARLARI KULLANILDI)
import { BACKGROUND_CATEGORIES } from '@/features/editor/config/backgrounds';
import i18n from '@/i18n'; // i18n import edildi

export const BackgroundDebugHelper = {
  /**
   * Tüm background kategorilerini ve asset'lerini kontrol eder
   */
  validateAllBackgrounds: () => {
    console.log(i18n.t('debug.backgroundValidationStarting'));
    
    let totalBackgrounds = 0;
    let validBackgrounds = 0;
    let invalidBackgrounds = 0;

    BACKGROUND_CATEGORIES.forEach(category => {
      console.log(i18n.t('debug.categoryInfo', { name: i18n.t(category.name), id: category.id }));
      console.log(i18n.t('debug.backgroundCount', { count: category.backgrounds.length }));
      
      category.backgrounds.forEach(background => {
        totalBackgrounds++;
        
        try {
          const thumbnailType = typeof background.thumbnailUrl;
          const fullUrlType = typeof background.fullUrl;
          
          console.log(i18n.t('debug.backgroundItemInfo', { name: i18n.t(background.name), id: background.id }));
          console.log(i18n.t('debug.thumbnailAndFullUrlType', { thumbnail: thumbnailType, full: fullUrlType }));
          
          if (background.id && background.name && background.thumbnailUrl && background.fullUrl) {
            validBackgrounds++;
            console.log(i18n.t('debug.valid'));
          } else {
            invalidBackgrounds++;
            console.log(i18n.t('debug.missingFields'));
          }
          
        } catch (error: any) {
          invalidBackgrounds++;
          console.log(i18n.t('debug.error'), error.message);
        }
      });
    });

    console.log(i18n.t('debug.summary'));
    console.log(i18n.t('debug.totalBackgrounds', { count: totalBackgrounds }));
    console.log(i18n.t('debug.validCount', { count: validBackgrounds }));
    console.log(i18n.t('debug.invalidCount', { count: invalidBackgrounds }));
    console.log(i18n.t('debug.successRate', { rate: ((validBackgrounds / totalBackgrounds) * 100).toFixed(1) }));
    
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
    console.log(i18n.t('debug.testingBackground'), backgroundId);
    
    const allBackgrounds = BACKGROUND_CATEGORIES.flatMap(cat => cat.backgrounds);
    const background = allBackgrounds.find(bg => bg.id === backgroundId);
    
    if (!background) {
      console.error(i18n.t('debug.backgroundNotFound'), backgroundId);
      return null;
    }

    try {
      if (typeof background.thumbnailUrl === 'number') {
        console.log(i18n.t('debug.assetResolutionTestStarting'));
        
        const { Asset } = await import('expo-asset');
        const asset = Asset.fromModule(background.thumbnailUrl);
        
        console.log(i18n.t('debug.assetInfo'), {
          name: asset.name,
          type: asset.type,
          uri: asset.uri,
          localUri: asset.localUri
        });
        
        await asset.downloadAsync();
        
        const resolvedUri = asset.localUri || asset.uri;
        console.log(i18n.t('debug.assetResolvedSuccessfully'), resolvedUri);
        
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
        console.log(i18n.t('debug.stringUriDetected'), background.thumbnailUrl);
        return {
          success: true,
          background,
          resolvedUri: background.thumbnailUrl,
          assetInfo: null
        };
      } else {
        throw new Error(i18n.t('debug.unsupportedThumbnailType', { type: typeof background.thumbnailUrl }));
      }
      
    } catch (error: any) {
      console.error(i18n.t('debug.testFailed'), error.message);
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
      console.log(i18n.t('debug.thumbnailManagerTest'), backgroundId);
      
      const { backgroundThumbnailManager } = await import('@/services/backgroundThumbnailManager');
      const allBackgrounds = BACKGROUND_CATEGORIES.flatMap(cat => cat.backgrounds);
      const background = allBackgrounds.find(bg => bg.id === backgroundId);
      
      if (!background) {
        throw new Error(i18n.t('debug.backgroundNotFoundShort'));
      }

      const startTime = Date.now();
      const result = await backgroundThumbnailManager.getThumbnail(background.id, background.fullUrl);
      const endTime = Date.now();
      
      console.log(i18n.t('debug.duration'), `${endTime - startTime}ms`);
      console.log(i18n.t('debug.result'), result ? i18n.t('debug.successful') : i18n.t('debug.failed'));
      
      if (result) {
        console.log(i18n.t('debug.thumbnailUri'), result);
      }
      
      return {
        success: !!result,
        thumbnailUri: result,
        duration: endTime - startTime,
        background
      };
      
    } catch (error: any) {
      console.error(i18n.t('debug.thumbnailManagerTestFailed'), error.message);
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
      
      console.log(i18n.t('debug.activeBackgroundId'), state.settings.backgroundId);
      
      const allBackgrounds = BACKGROUND_CATEGORIES.flatMap(cat => cat.backgrounds);
      const activeBackground = allBackgrounds.find(bg => bg.id === state.settings.backgroundId);
      
      if (activeBackground) {
        console.log(i18n.t('debug.activeBackgroundFound'), {
          id: activeBackground.id,
          name: i18n.t(activeBackground.name), // Çeviri anahtarı kullanıldı
          categoryId: activeBackground.categoryId
        });
      } else {
        console.warn(i18n.t('debug.activeBackgroundNotFoundWarning'), state.settings.backgroundId);
      }
      
      return {
        activeBackgroundId: state.settings.backgroundId,
        found: !!activeBackground,
        background: activeBackground || null
      };
      
    } catch (error: any) {
      console.error(i18n.t('debug.activeBackgroundCheckFailed'), error.message);
      return null;
    }
  },

  /**
   * Hızlı sorun giderme
   */
  quickFix: async () => {
    console.log(i18n.t('debug.quickFixStarting'));
    
    console.log(i18n.t('debug.backgroundValidationStep'));
    const validation = BackgroundDebugHelper.validateAllBackgrounds();
    
    console.log(i18n.t('debug.activeBackgroundCheckStep'));
    const activeCheck = BackgroundDebugHelper.checkActiveBackground();
    
    console.log(i18n.t('debug.firstBackgroundTestStep'));
    const firstBackground = BACKGROUND_CATEGORIES[0]?.backgrounds[0];
    if (firstBackground) {
      const testResult = await BackgroundDebugHelper.testBackground(firstBackground.id);
      console.log(i18n.t('debug.testResult'), testResult?.success ? i18n.t('debug.successfulEmoji') : i18n.t('debug.failedEmoji'));
    }
    
    console.log(i18n.t('debug.recommendations'));
    
    if (validation.invalid > 0) {
      console.log(i18n.t('debug.invalidBackgroundsWarning'));
    }
    
    if (!activeCheck?.found) {
      console.log(i18n.t('debug.activeBackgroundNotFoundRecommendation'));
    }
    
    if (validation.successRate < 100) {
      console.log(i18n.t('debug.allBackgroundsNotValidRecommendation'));
    } else {
      console.log(i18n.t('debug.allBackgroundsValidSuccess'));
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

if (__DEV__) {
  (global as any).BackgroundDebugHelper = BackgroundDebugHelper;
  console.log(i18n.t('debug.helperGloballyAvailable'));
  console.log(i18n.t('debug.usageExample'));
}