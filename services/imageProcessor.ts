// services/imageProcessor.ts - PLATFORM-OPTIMIZED Image Processing
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import { EditorSettings } from '@/stores/useEnhancedEditorStore';
import { memoryManager, CriticalOperationManager } from './memoryManager';
import i18n from '@/i18n';

export const imageProcessor = {
  /**
   * ✅ ÇÖZÜM 2: Platform-Optimized Thumbnail Creation
   * Belirtilen URI'deki görselden optimize edilmiş bir küçük resim oluşturur.
   * Cihaza özel ayarlar ve bellek yönetimi ile performans odaklıdır.
   * @param originalUri Orijinal görselin URI'si.
   * @param format Çıkış formatı ('jpeg' veya 'png').
   * @returns Oluşturulan küçük resmin kalıcı URI'si.
   * @throws Hata oluşursa.
   */
  createThumbnail: async (originalUri: string, format?: 'jpeg' | 'png'): Promise<string> => {
    return await memoryManager.addOperation(async () => {
      // Platforma özgü yapılandırma ayarlarını al
      const config = memoryManager.getThumbnailConfig();
      const finalFormat = format || config.format;
      const saveFormat = finalFormat === 'png' ? SaveFormat.PNG : SaveFormat.JPEG;

      console.log(`🖼️ [${Platform.OS}] Creating optimized thumbnail:`, {
        size: `${config.width}x${config.height}`,
        format: finalFormat,
        quality: config.quality
      });

      try {
        // Görseli yeniden boyutlandır ve sıkıştır
        const tempResult = await manipulateAsync(
          originalUri,
          [{ resize: { width: config.width } }],
          {
            compress: config.quality,
            format: saveFormat
          }
        );

        // Geçici dosyayı kalıcı bir konuma taşı
        const permanentUri = await imageProcessor.moveToDocuments(
          tempResult.uri,
          `thumb_${Platform.OS}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${finalFormat}`
        );

        console.log(`✅ [${Platform.OS}] Optimized thumbnail created:`, permanentUri);
        return permanentUri;

      } catch (error: any) {
        console.error(`❌ [${Platform.OS}] Thumbnail creation failed:`, error);
        throw new Error(i18n.t('imageProcessing.createThumbnailFailed'));
      }
    }, {
      // Bellek yöneticisine özel seçenekler
      priority: 'normal',
      memoryEstimate: Platform.OS === 'ios' ? 8 : 12, // iOS: 8MB, Android: 12MB
      timeout: 25000
    });
  },

  /**
   * ✅ ÇÖZÜM 4: Platform-Optimized Strong Cache Busting
   * Belirtilen URI'ye önbellek bozan parametreler ekleyerek güçlü bir önbellek bozan URI oluşturur.
   * Uygulamanın en güncel görselleri göstermesini sağlar.
   * @param originalUri Orijinal görsel URI'si.
   * @param version İsteğe bağlı sürüm numarası.
   * @param randomId İsteğe bağlı rastgele kimlik.
   * @returns Önbellek bozan parametreler eklenmiş yeni URI.
   */
  createStrongCacheBustedUri: (originalUri: string, version?: number, randomId?: string): string => {
    if (!originalUri) return originalUri;

    const timestamp = Date.now();
    const versionParam = version || Math.floor(timestamp / 1000);
    const randomParam = randomId || Math.random().toString(36).substr(2, 9);

    // Mevcut parametreleri temizle
    let cleanUri = originalUri.split('?')[0];

    // Platforma özgü önbellek bozan strateji
    const cacheBustingParams = Platform.OS === 'ios'
      ? [
        `cb=${timestamp}`,         // Önbellek bozan zaman damgası
        `v=${versionParam}`,        // Sürüm numarası
        `r=${randomParam}`,         // Rastgele kimlik
        `ios=1`                     // iOS bayrağı
      ]
      : [
        `cb=${timestamp}`,         // Önbellek bozan zaman damgası
        `v=${versionParam}`,        // Sürüm numarası
        `r=${randomParam}`,         // Rastgele kimlik
        `android=1`                 // Android bayrağı
      ];

    const finalUri = `${cleanUri}?${cacheBustingParams.join('&')}`;

    console.log(`🔄 [${Platform.OS}] Strong cache-busted URI created:`, {
      original: originalUri,
      final: finalUri,
      params: { timestamp, versionParam, randomParam }
    });

    return finalUri;
  },

  /**
   * ✅ Platform-Optimized File Moving
   * Geçici bir dosyayı uygulama belgeler dizinindeki kalıcı bir konuma taşır.
   * Bellek yönetimi ve geçici dosya temizliğini içerir.
   * @param tempUri Geçici dosyanın URI'si.
   * @param filename Yeni dosya adı.
   * @returns Kalıcı dosyanın URI'si.
   * @throws Hata oluşursa.
   */
  moveToDocuments: async (tempUri: string, filename: string): Promise<string> => {
    try {
      const documentsDir = FileSystem.documentDirectory + 'temp_images/';

      // Dizin yoksa oluştur
      const dirInfo = await FileSystem.getInfoAsync(documentsDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(documentsDir, { intermediates: true });
      }

      const permanentUri = documentsDir + filename;

      // Dosyayı kopyala
      await FileSystem.copyAsync({
        from: tempUri,
        to: permanentUri
      });

      // Platforma özgü temizleme stratejisi
      try {
        await FileSystem.deleteAsync(tempUri, { idempotent: true });
      } catch (cleanupError) {
        console.warn(`⚠️ [${Platform.OS}] Failed to cleanup temp file:`, cleanupError);
      }

      return permanentUri;

    } catch (error: any) {
      console.error(`❌ [${Platform.OS}] Failed to move to documents:`, error);
      throw new Error(i18n.t('imageProcessing.moveToPermanentFailed'));
    }
  },

  /**
   * ✅ Platform-Optimized Thumbnail Refresh
   * Mevcut bir küçük resmi güçlü önbellek bozan bir URI ile yeniler.
   * Görselin uygulamanın önbelleğinde güncellenmesini sağlar.
   * @param originalThumbnailUri Orijinal küçük resmin URI'si.
   * @returns Yenilenmiş, önbellek bozan URI.
   */
  refreshThumbnail: async (originalThumbnailUri: string): Promise<string> => {
    try {
      // Güçlü önbellek bozan sürüm oluştur
      const cacheBustedUri = imageProcessor.createStrongCacheBustedUri(originalThumbnailUri);

      // Platforma özgü görsel önbelleği temizleme
      if (Platform.OS === 'ios') {
        // iOS: Daha agresif önbellek temizleme
        try {
          const { Image } = await import('react-native');
          if (Image.getSize) {
            await new Promise((resolve, reject) => {
              Image.getSize(
                cacheBustedUri,
                () => resolve(true),
                () => resolve(false)
              );
            });
          }
        } catch (error) {
          console.warn(`⚠️ [${Platform.OS}] Image cache refresh warning:`, error);
        }
      } else {
        // Android: Daha nazik önbellek yönetimi
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      console.log(`🔄 [${Platform.OS}] Thumbnail refreshed with strong cache busting:`, {
        original: originalThumbnailUri,
        cacheBusted: cacheBustedUri
      });

      return cacheBustedUri;

    } catch (error) {
      console.warn(`⚠️ [${Platform.OS}] Thumbnail refresh failed, returning original:`, error);
      return originalThumbnailUri;
    }
  },

  /**
   * ✅ Platform-Optimized Image Cache Clearing
   * React Native'in görsel önbelleklerini (bellek ve disk) platforma özel olarak temizler.
   * Uygulamanın kullandığı belleği optimize etmeye yardımcı olur.
   * @returns Promise<void>
   */
  clearImageCache: async (): Promise<void> => {
    try {
      const { Image } = await import('react-native');

      // Platforma özgü önbellek temizleme
      if (Platform.OS === 'ios') {
        // iOS: Agresif önbellek temizleme
        if (typeof Image.clearMemoryCache === 'function') {
          await Image.clearMemoryCache();
          console.log(`🧹 [iOS] React Native image memory cache cleared`);
        }

        if (typeof Image.clearDiskCache === 'function') {
          await Image.clearDiskCache();
          console.log(`🧹 [iOS] React Native image disk cache cleared`);
        }
      } else {
        // Android: Seçici önbellek temizleme
        if (typeof Image.clearMemoryCache === 'function') {
          await Image.clearMemoryCache();
          console.log(`🧹 [Android] React Native image memory cache cleared`);
        }
        // Performans için Android'de disk önbelleği temizlemeyi atla
      }

    } catch (error) {
      console.warn(`⚠️ [${Platform.OS}] Image cache clearing failed:`, error);
    }
  },

  /**
   * ✅ Platform-Optimized Base64 to File
   * Base64 kodlu bir dizeyi geçici bir dosyaya kaydeder.
   * Genellikle görsel verilerini ağdan alıp yerel olarak depolamak için kullanılır.
   * @param base64Data Base64 kodlu görsel verisi.
   * @param filename İsteğe bağlı dosya adı.
   * @returns Oluşturulan dosyanın URI'si.
   * @throws Hata oluşursa.
   */
  base64ToTempFile: async (base64Data: string, filename?: string): Promise<string> => {
    return await memoryManager.addOperation(async () => {
      try {
        const config = memoryManager.getThumbnailConfig();
        const finalFilename = filename || `temp_${Platform.OS}_${Date.now()}.${config.format}`;
        const documentsDir = FileSystem.documentDirectory + 'temp_images/';

        const dirInfo = await FileSystem.getInfoAsync(documentsDir);
        if (!dirInfo.exists) {
          await FileSystem.makeDirectoryAsync(documentsDir, { intermediates: true });
        }

        const permanentUri = documentsDir + finalFilename;

        await FileSystem.writeAsStringAsync(permanentUri, base64Data, {
          encoding: FileSystem.EncodingType.Base64,
        });

        const fileInfo = await FileSystem.getInfoAsync(permanentUri);
        if (!fileInfo.exists) {
          throw new Error(i18n.t('imageProcessing.moveToPermanentFailed'));
        }

        console.log(`✅ [${Platform.OS}] Base64 file saved:`, permanentUri);
        return permanentUri;

      } catch (error: any) {
        console.error(`❌ [${Platform.OS}] Base64 file conversion failed:`, error);
        throw new Error(i18n.t('imageProcessing.base64ToFileFailed'));
      }
    }, {
      priority: 'normal',
      memoryEstimate: Platform.OS === 'ios' ? 6 : 10, // iOS: 6MB, Android: 10MB
      timeout: 15000
    });
  },

  /**
   * ✅ Platform-Optimized Temp Files Cleanup
   * Uygulamanın geçici dosyalarını bellek yöneticisi aracılığıyla temizler.
   * @returns Promise<void>
   */
  cleanupTempFiles: async (): Promise<void> => {
    try {
      // Bellek yöneticisinin platforma duyarlı temizleme işlevini kullan
      await memoryManager.cleanupMemory();

      console.log(`🧹 [${Platform.OS}] Temp files cleanup completed`);

    } catch (error) {
      console.warn(`⚠️ [${Platform.OS}] Cleanup warning:`, error);
    }
  },

  /**
   * ✅ Platform-Optimized Memory Usage Optimization
   * Geçici dosyaları temizleyerek ve platforma özel bellek optimizasyonları uygulayarak
   * uygulamanın bellek kullanımını optimize eder.
   * @returns Promise<void>
   */
  optimizeMemoryUsage: async (): Promise<void> => {
    try {
      await imageProcessor.cleanupTempFiles();

      // Platforma özgü bellek optimizasyonu
      if (Platform.OS === 'ios') {
        // iOS: Eğer varsa çöp toplamayı zorla
        if (__DEV__ && global.gc) {
          global.gc();
          console.log(`🗑️ [iOS] Image processor garbage collection triggered`);
        }
      } else {
        // Android: Daha nazik bellek yönetimi
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      console.log(`🔧 [${Platform.OS}] Memory optimization completed`);
    } catch (error) {
      console.warn(`⚠️ [${Platform.OS}] Memory optimization failed:`, error);
    }
  },

  /**
   * ✅ File Validation and Recovery
   * Bir dosyanın varlığını doğrular ve bulunamazsa kurtarmaya çalışır (şu anda basit bir kontrol).
   * @param uri Doğrulanacak dosyanın URI'si.
   * @returns Dosya varsa URI, yoksa null.
   */
  validateAndRecoverFile: async (uri: string): Promise<string | null> => {
    try {
      if (!uri) return null;

      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (fileInfo.exists) {
        return uri;
      }

      console.warn(`⚠️ [${Platform.OS}] File not found, attempting recovery:`, uri);
      // Gelecekte burada daha karmaşık kurtarma mantığı olabilir.
      return null;

    } catch (error) {
      console.warn(`⚠️ [${Platform.OS}] File validation failed:`, uri, error);
      return null;
    }
  },

  /**
   * ✅ Get Platform-Specific Processing Stats
   * Bellek yöneticisinden ve kritik operasyon yöneticisinden platforma özgü işlem istatistiklerini alır.
   * @returns İşlem istatistiklerini içeren bir nesne.
   */
  getProcessingStats() {
    const memoryStatus = memoryManager.getMemoryStatus();

    return {
      platform: Platform.OS,
      memoryStatus,
      thumbnailConfig: memoryManager.getThumbnailConfig(),
      previewConfig: memoryManager.getPreviewConfig(),
      activeCriticalOps: CriticalOperationManager.getActiveCriticalOperations(),
    };
  },

  // ⚠️ DEPRECATED: Use createStrongCacheBustedUri instead
  createCacheBustedUri: (originalUri: string): string => {
    console.warn(`⚠️ [${Platform.OS}] createCacheBustedUri deprecated, use createStrongCacheBustedUri instead`);
    return imageProcessor.createStrongCacheBustedUri(originalUri);
  },

  /**
   * ✅ Advanced Memory Monitoring
   * Bellek kullanım istatistiklerini ve bunlara dayalı optimizasyon önerilerini döndürür.
   * @returns Bellek kullanım istatistikleri ve öneriler.
   */
  getMemoryUsageStats: () => {
    const memoryStatus = memoryManager.getMemoryStatus();
    const processingStats = memoryManager.getProcessingStats();

    return {
      platform: Platform.OS,
      memoryStatus,
      processingStats,
      recommendations: {
        shouldReduceQuality: memoryStatus.isLowMemory,
        shouldDelayOperations: memoryStatus.operationsInQueue > 3,
        shouldCleanupCache: memoryStatus.usedMemory > (Platform.OS === 'ios' ? 120 : 250),
      }
    };
  },

  /**
   * ✅ Batch Operation Support
   * Bir dizi işlemi partiler halinde işler, bellek güvenliği için sıralı yürütme ve partiler arası gecikmeler kullanır.
   * @param operations İşlenecek asenkron işlem dizisi.
   * @param batchSize Her partideki işlem sayısı.
   * @returns Tüm işlemlerin sonuçlarını içeren bir dizi.
   */
  processBatch: async (
    operations: Array<() => Promise<any>>,
    batchSize: number = Platform.OS === 'ios' ? 2 : 3
  ): Promise<any[]> => {
    const results = [];

    for (let i = 0; i < operations.length; i += batchSize) {
      const batch = operations.slice(i, i + batchSize);

      console.log(`📦 [${Platform.OS}] Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(operations.length / batchSize)}`);

      // Bellek güvenliği için parti içindeki sıralı işlem
      const batchResults = [];
      for (const operation of batch) {
        const result = await memoryManager.addOperation(operation, {
          priority: 'normal',
          memoryEstimate: Platform.OS === 'ios' ? 8 : 12,
          timeout: 20000
        });
        batchResults.push(result);
      }

      results.push(...batchResults);

      // Partiler arasında platforma özgü gecikme
      if (i + batchSize < operations.length) {
        await new Promise(resolve => setTimeout(resolve, Platform.OS === 'ios' ? 800 : 400));
      }
    }

    return results;
  },

  /**
   * ✅ Smart Quality Adjustment Based on Memory
   * Mevcut bellek durumuna göre optimal görsel kalitesi ve boyut ayarlarını döndürür.
   * @returns Optimal format, kalite ve boyut ayarlarını içeren bir nesne.
   */
  getOptimalQuality: (): { format: 'jpeg' | 'png', quality: number, size: number } => {
    const memoryStatus = memoryManager.getMemoryStatus();

    if (memoryStatus.isLowMemory) {
      // Düşük bellek: agresif sıkıştırma
      return {
        format: 'jpeg',
        quality: Platform.OS === 'ios' ? 0.6 : 0.7,
        size: Platform.OS === 'ios' ? 200 : 250
      };
    } else if (memoryStatus.usedMemory > memoryStatus.availableMemory * 0.7) {
      // Orta bellek basıncı: dengeli
      return {
        format: Platform.OS === 'ios' ? 'jpeg' : 'png',
        quality: Platform.OS === 'ios' ? 0.75 : 0.85,
        size: Platform.OS === 'ios' ? 250 : 350
      };
    } else {
      // İyi bellek: yüksek kalite
      return {
        format: Platform.OS === 'ios' ? 'jpeg' : 'png',
        quality: Platform.OS === 'ios' ? 0.85 : 0.95,
        size: Platform.OS === 'ios' ? 300 : 400
      };
    }
  },

  /**
   * ✅ Emergency Memory Recovery
   * Acil durumlarda bellek kurtarma işlemleri başlatır.
   * Geçici dosyaları temizler, görsel önbelleklerini temizler ve çöp toplamayı zorlar.
   * @returns Promise<void>
   */
  emergencyMemoryRecovery: async (): Promise<void> => {
    console.log(`🆘 [${Platform.OS}] Emergency memory recovery initiated`);

    try {
      // 1. Acil temizlik
      await memoryManager.emergencyCleanup();

      // 2. Tüm görsel önbelleklerini temizle
      await imageProcessor.clearImageCache();

      // 3. Platforma özgü kurtarma
      if (Platform.OS === 'ios') {
        // iOS: Daha agresif kurtarma - önbellek dizinindeki dosyaları sil
        const cacheDir = FileSystem.cacheDirectory;
        if (cacheDir) {
          const files = await FileSystem.readDirectoryAsync(cacheDir);
          await Promise.allSettled(files.map(file =>
            FileSystem.deleteAsync(cacheDir + file, { idempotent: true })
          ));
        }
      }

      // 4. Eğer varsa çöp toplamayı zorla
      if (__DEV__ && global.gc) {
        global.gc();
      }

      console.log(`✅ [${Platform.OS}] Emergency memory recovery completed`);
    } catch (error) {
      console.error(`❌ [${Platform.OS}] Emergency memory recovery failed:`, error);
    }
  },

  /**
   * ✅ ÇÖZÜM 2: Platform-Optimized Filtered Thumbnail
   * Editör ayarları ve isteğe bağlı bir arka plan URI'si ile optimize edilmiş bir filtreli küçük resim oluşturur.
   * @param originalUri Orijinal görselin URI'si.
   * @param editorSettings Uygulanacak editör ayarları.
   * @param backgroundUri İsteğe bağlı arka plan görseli URI'si.
   * @returns Oluşturulan filtreli küçük resmin kalıcı URI'si.
   * @throws Hata oluşursa.
   */
  createFilteredThumbnail: async (
    originalUri: string,
    editorSettings: EditorSettings,
    backgroundUri?: string
  ): Promise<string> => {
    return await CriticalOperationManager.withLock('filtered-thumbnail', async () => {
      return await memoryManager.addOperation(async () => {
        try {
          const config = memoryManager.getPreviewConfig();

          console.log(`🖼️ [${Platform.OS}] Creating optimized filtered thumbnail:`, {
            size: `${config.width}x${config.height}`,
            format: config.format,
            quality: config.quality,
            hasBackground: !!backgroundUri
          });

          // Platforma optimize edilmiş yeniden boyutlandırma
          const tempResized = await manipulateAsync(
            originalUri,
            [{ resize: { width: config.width, height: config.height } }],
            {
              compress: config.quality,
              format: config.format === 'png' ? SaveFormat.PNG : SaveFormat.JPEG
            }
          );

          // Temel filtreleri uygula
          const tempFiltered = await imageProcessor.applyBasicFilters(
            tempResized.uri,
            editorSettings
          );

          // Kalıcı konuma taşı
          const permanentUri = await imageProcessor.moveToDocuments(
            tempFiltered,
            `filtered_${Platform.OS}_${Date.now()}.${config.format}`
          );

          // Geçici dosyaları temizle
          if (tempFiltered !== tempResized.uri) {
            try {
              await FileSystem.deleteAsync(tempFiltered, { idempotent: true });
            } catch (error) {
              console.warn(`⚠️ [${Platform.OS}] Temp cleanup warning:`, error);
            }
          }

          console.log(`✅ [${Platform.OS}] Optimized filtered thumbnail created`);
          return permanentUri;

        } catch (error: any) {
          console.error(`❌ [${Platform.OS}] Filtered thumbnail creation failed:`, error);
          // Geri dönüş: normal küçük resim oluştur
          return await imageProcessor.createThumbnail(originalUri);
        }
      }, {
        priority: 'high',
        memoryEstimate: Platform.OS === 'ios' ? 15 : 25, // iOS: 15MB, Android: 25MB
        timeout: 30000
      });
    });
  },

  /**
   * ✅ Platform-Optimized Basic Filters
   * Bir görsele temel filtre ayarlarını (örneğin döndürme) uygular.
   * @param imageUri Filtrelerin uygulanacağı görselin URI'si.
   * @param settings Editör ayarları.
   * @returns İşlenmiş görselin URI'si veya değişiklik yapılmadıysa orijinal URI.
   */
  applyBasicFilters: async (
    imageUri: string,
    settings: EditorSettings
  ): Promise<string> => {
    try {
      const actions: any[] = [];

      // Döndürme
      if (settings.photoRotation && settings.photoRotation !== 0) {
        actions.push({
          rotate: settings.photoRotation
        });
      }

      // Eğer herhangi bir manipülasyon varsa uygula
      if (actions.length > 0) {
        const config = memoryManager.getPreviewConfig();

        const tempResult = await manipulateAsync(
          imageUri,
          actions,
          {
            compress: config.quality,
            format: config.format === 'png' ? SaveFormat.PNG : SaveFormat.JPEG
          }
        );

        // Kalıcı konuma taşı
        const permanentUri = await imageProcessor.moveToDocuments(
          tempResult.uri,
          `filtered_basic_${Platform.OS}_${Date.now()}.${config.format}`
        );

        return permanentUri;
      }

      return imageUri; // Değişiklik gerekmez

    } catch (error: any) {
      console.error(`❌ [${Platform.OS}] Basic filter application failed:`, error);
      return imageUri; // Geri dönüş: orijinali döndür
    }
  },

  /**
   * ✅ ÇÖZÜM 2: Platform-Optimized View Capture
   * Belirtilen bir React Native görünümünden optimize edilmiş bir görsel yakalar.
   * @param viewRef Yakalanacak görünümün referansı.
   * @param targetSize Hedef genişlik ve yükseklik (isteğe bağlı).
   * @returns Yakalanan görselin kalıcı URI'si.
   * @throws Hata oluşursa.
   */
  captureFilteredThumbnail: async (
    viewRef: any,
    targetSize?: { width: number; height: number }
  ): Promise<string> => {
    return await CriticalOperationManager.withLock('view-capture', async () => {
      return await memoryManager.addOperation(async () => {
        try {
          if (!viewRef?.current) {
            throw new Error('View ref is not available');
          }

          const config = targetSize || memoryManager.getPreviewConfig();

          console.log(`📸 [${Platform.OS}] Capturing optimized view:`, {
            size: `${config.width}x${config.height}`,
            platform: Platform.OS
          });

          // Platforma optimize edilmiş yakalama ayarları
          const captureOptions = {
            format: Platform.OS === 'ios' ? 'jpeg' : 'png', // iOS: JPEG, Android: PNG
            quality: Platform.OS === 'ios' ? 0.85 : 0.95,   // iOS: daha düşük, Android: daha yüksek
            width: config.width,
            height: config.height,
            result: 'tmpfile' as const,
          };

          const tempCaptured = await captureRef(viewRef, captureOptions);

          console.log(`✅ [${Platform.OS}] View captured:`, tempCaptured);

          // Kalıcı konuma taşı
          const permanentUri = await imageProcessor.moveToDocuments(
            tempCaptured,
            `captured_${Platform.OS}_${Date.now()}.${captureOptions.format}`
          );

          return permanentUri;

        } catch (error: any) {
          console.error(`❌ [${Platform.OS}] View capture failed:`, error);
          throw new Error(i18n.t('imageProcessing.captureFilteredThumbnailFailed'));
        }
      }, {
        priority: 'high',
        memoryEstimate: Platform.OS === 'ios' ? 20 : 35, // iOS: 20MB, Android: 35MB
        timeout: 20000
      });
    });
  },

  /**
   * ✅ ÇÖZÜM 4: Smart Cache-Busted Thumbnail Save
   * Belirli bir ürün ve fotoğraf için filtreli bir küçük resmi akıllı önbellek bozan URI ile kaydeder.
   * @param productId İlgili ürünün kimliği.
   * @param photoId Kaydedilen fotoğrafın kimliği.
   * @param sourceUri Kaydedilecek küçük resmin kaynak URI'si.
   * @returns Kaydedilen küçük resmin güçlü önbellek bozan URI'si.
   * @throws Hata oluşursa.
   */
  saveFilteredThumbnail: async (
    productId: string,
    photoId: string,
    sourceUri: string
  ): Promise<string> => {
    return await memoryManager.addOperation(async () => {
      try {
        // Döngüsel bağımlılıkları önlemek için dinamik içe aktarma
        const { fileSystemManager } = await import('@/services/fileSystemManager');

        // Platforma optimize edilmiş önbellek bozan
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substr(2, 9);
        const version = Math.floor(timestamp / 1000);
        const format = Platform.OS === 'ios' ? 'jpeg' : 'png';
        const thumbnailFilename = `thumb_${Platform.OS}_${photoId}_v${version}_${randomId}.${format}`;

        console.log(`💾 [${Platform.OS}] Saving cache-busted thumbnail:`, {
          photoId,
          filename: thumbnailFilename,
          platform: Platform.OS,
          timestamp,
          version
        });

        // fileSystemManager kullanarak kaydet
        const permanentUri = await fileSystemManager.saveImage(
          productId,
          sourceUri,
          thumbnailFilename
        );

        // Kaynak geçici ise temizle
        if (sourceUri.includes('temp_images/') || sourceUri.includes('cache/')) {
          try {
            await FileSystem.deleteAsync(sourceUri, { idempotent: true });
          } catch (cleanupError) {
            console.warn(`⚠️ [${Platform.OS}] Source cleanup warning:`, cleanupError);
          }
        }

        console.log(`✅ [${Platform.OS}] Cache-busted thumbnail saved:`, {
          photoId,
          filename: thumbnailFilename,
          uri: permanentUri
        });

        // Güçlü önbellek bozan URI'yi döndür
        return imageProcessor.createStrongCacheBustedUri(permanentUri, version, randomId);

      } catch (error: any) {
        console.error(`❌ [${Platform.OS}] Thumbnail save failed:`, error);
        throw new Error(`${i18n.t('imageProcessing.saveThumbnailFailed')}: ${error.message}`);
      }
    }, {
      priority: 'normal',
      memoryEstimate: Platform.OS === 'ios' ? 8 : 12, // iOS: 8MB, Android: 12MB
      timeout: 25000
    });
  }
};
