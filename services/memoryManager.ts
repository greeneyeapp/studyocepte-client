// services/memoryManager.ts - iOS Memory Optimization Service
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import i18n from '@/i18n'; // Uluslararasılaştırma için

// İşlem yapılandırması arayüzü
interface OperationConfig {
  priority: 'low' | 'normal' | 'high'; // İşlemin önceliği
  memoryEstimate: number; // İşlemin tahmini bellek kullanımı (MB)
  timeout: number; // İşlemin zaman aşımı süresi (ms)
}

// Bellek durumu arayüzü
export interface MemoryStatus {
  availableMemory: number; // Tahmini kullanılabilir bellek (MB)
  usedMemory: number; // Tahmini kullanılan bellek (MB)
  isLowMemory: boolean; // Belleğin düşük olup olmadığı
  operationsInQueue: number; // Kuyruktaki işlem sayısı
  platform: string; // Çalışılan platform (iOS/Android)
}

// Kuyruk öğesi arayüzü
interface QueueItem<T> {
  operation: () => Promise<T>; // Gerçek işlem fonksiyonu
  config: OperationConfig; // İşlem yapılandırması
  resolve: (value: T) => void; // Promise'ı çözmek için
  reject: (error: any) => void; // Promise'ı reddetmek için
  id: string; // İşlemin benzersiz kimliği
  timestamp: number; // Kuyruğa eklendiği zaman
}

/**
 * ⭐ ÇÖZÜM: Memory Manager - Sequential Processing + Operation Queue
 * Bellek yönetimi, işlem sırası ve platforma özel optimizasyonlar sağlayan servis.
 */
class MemoryManager {
  private operationQueue: Array<QueueItem<any>> = []; // İşlem kuyruğu
  private isProcessing = false; // Kuyruğun şu anda işlenip işlenmediği
  private currentMemoryUsage = 0; // Tahmini mevcut bellek kullanımı (MB)
  private maxMemoryThreshold = Platform.OS === 'ios' ? 150 : 300; // MB (Android için 2 katı)
  private lowMemoryThreshold = Platform.OS === 'ios' ? 100 : 200; // MB (Android için 2 katı)
  private maxConcurrentOps = Platform.OS === 'ios' ? 1 : 2; // iOS: katı sıralı (1), Android: 2 eşzamanlı
  private thumbnailSize = Platform.OS === 'ios' ? 300 : 400; // iOS: daha küçük, Android: daha büyük OK

  /**
   * ✅ ÇÖZÜM 1: Operation Queue ile sıralı işlem
   * Bir işlemi bellek yönetimi kuyruğuna ekler. İşlemler önceliklerine göre sıraya alınır.
   * @param operation Eklenecek asenkron fonksiyon.
   * @param config İşlem yapılandırması (öncelik, bellek tahmini, zaman aşımı).
   * @returns İşlemin sonucunu döndüren bir Promise.
   */
  async addOperation<T>(
    operation: () => Promise<T>,
    config: OperationConfig = { priority: 'normal', memoryEstimate: 10, timeout: 30000 }
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const queueItem: QueueItem<T> = {
        operation,
        config,
        resolve,
        reject,
        id: `op_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        timestamp: Date.now()
      };

      // Önceliğe göre kuyruğa ekle
      if (config.priority === 'high') {
        this.operationQueue.unshift(queueItem); // Yüksek önceliklileri başa ekle
      } else {
        this.operationQueue.push(queueItem); // Diğerlerini sona ekle
      }

      console.log(`📋 [${Platform.OS}] Operation queued (${config.priority}):`, {
        queueLength: this.operationQueue.length,
        memoryEstimate: config.memoryEstimate + 'MB',
        isProcessing: this.isProcessing
      });

      this.processQueue(); // Kuyruğu işlemeye başla (zaten işlemiyorsa)
    });
  }

  /**
   * ✅ PLATFORM-AWARE Processing Logic
   * İşlem kuyruğunu platforma duyarlı bir şekilde işler.
   * iOS için katı sıralı, Android için eşzamanlı işlemleri yönetir.
   * @returns Promise<void>
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.operationQueue.length === 0) {
      return; // Zaten işleniyorsa veya kuyruk boşsa çık
    }

    this.isProcessing = true;
    console.log(`🔄 Starting ${Platform.OS} memory-safe operation queue processing`);

    // ✅ ANDROID: Eşzamanlı işlem (maksimum 2 işlem)
    if (Platform.OS === 'android') {
      await this.processAndroidQueue();
    } else {
      // ✅ iOS: Katı sıralı işlem
      await this.processIOSQueue();
    }

    this.isProcessing = false;
    console.log(`✅ ${Platform.OS} memory-safe operation queue processing completed.`);
  }

  /**
   * ✅ iOS: Strict Sequential Processing
   * iOS için katı sıralı işlem kuyruğu yönetimi. Her işlem sonrası bellek temizliği yapar.
   * @returns Promise<void>
   */
  private async processIOSQueue(): Promise<void> {
    while (this.operationQueue.length > 0) {
      const queueItem = this.operationQueue.shift()!; // Kuyruktan ilk öğeyi al

      try {
        // iOS: Katı bellek baskısı kontrolü
        await this.checkMemoryPressure(queueItem.config.memoryEstimate);

        console.log(`⚡ [iOS] Executing operation (Est: ${queueItem.config.memoryEstimate}MB, ID: ${queueItem.id})`);

        this.currentMemoryUsage += queueItem.config.memoryEstimate; // Tahmini bellek kullanımını artır

        const result = await this.executeWithTimeout(queueItem); // Zaman aşımı ile işlemi çalıştır
        queueItem.resolve(result); // İşlemi başarıyla çöz

        this.currentMemoryUsage = Math.max(0, this.currentMemoryUsage - queueItem.config.memoryEstimate); // Bellek kullanımını güncelle

        // iOS: Her işlem sonrası temizlik ve gecikme
        await this.cleanupMemory();
        if (this.operationQueue.length > 0) {
          await this.delay(300); // iOS kararlılık gecikmesi
        }

      } catch (error) {
        this.currentMemoryUsage = Math.max(0, this.currentMemoryUsage - queueItem.config.memoryEstimate); // Bellek kullanımını güncelle
        queueItem.reject(error); // İşlemi hatayla reddet
        console.error(`❌ [iOS] Operation failed (ID: ${queueItem.id}):`, error);
      }
    }
  }

  /**
   * ✅ ANDROID: Concurrent Processing (up to 2 operations)
   * Android için eşzamanlı işlem kuyruğu yönetimi (maksimum 2 eşzamanlı işlem).
   * @returns Promise<void>
   */
  private async processAndroidQueue(): Promise<void> {
    const runningOperations = new Set<Promise<void>>(); // Çalışan işlemlerin kümesi

    while (this.operationQueue.length > 0 || runningOperations.size > 0) {
      // Android: 2 işleme kadar eşzamanlı çalıştır
      while (this.operationQueue.length > 0 && runningOperations.size < this.maxConcurrentOps) {
        const queueItem = this.operationQueue.shift()!;

        const operationPromise = this.executeAndroidOperation(queueItem); // Android işlemini çalıştır
        runningOperations.add(operationPromise); // Çalışan işlemlere ekle

        // İşlem tamamlandığında kümeden çıkar
        operationPromise.finally(() => {
          runningOperations.delete(operationPromise);
        });
      }

      // Bir işlemin tamamlanmasını bekle
      if (runningOperations.size > 0) {
        await Promise.race(Array.from(runningOperations)); // En hızlı biteni bekle
      } else if (this.operationQueue.length === 0) {
        break; // Kuyruk boşsa ve çalışan işlem yoksa döngüden çık
      }
    }
  }

  /**
   * ✅ ANDROID: Single Operation Executor
   * Android için tek bir işlemi yürüten yardımcı fonksiyon.
   * @param queueItem Yürütülecek kuyruk öğesi.
   * @returns Promise<void>
   */
  private async executeAndroidOperation(queueItem: QueueItem<any>): Promise<void> {
    try {
      // Android: Daha esnek bellek kontrolü
      const currentUsageEstimate = this.currentMemoryUsage + queueItem.config.memoryEstimate;
      if (currentUsageEstimate > this.maxMemoryThreshold) {
        console.log(`⚠️ [Android] High memory estimate, triggering cleanup for (ID: ${queueItem.id})`);
        await this.cleanupMemory(); // Bellek eşiğini aşarsa temizlik yap
        await this.delay(100); // Android: daha kısa gecikme
      }

      console.log(`⚡ [Android] Executing operation (Est: ${queueItem.config.memoryEstimate}MB, ID: ${queueItem.id})`);

      this.currentMemoryUsage += queueItem.config.memoryEstimate; // Tahmini bellek kullanımını artır

      const result = await this.executeWithTimeout(queueItem); // Zaman aşımı ile işlemi çalıştır
      queueItem.resolve(result); // İşlemi başarıyla çöz

      this.currentMemoryUsage = Math.max(0, this.currentMemoryUsage - queueItem.config.memoryEstimate); // Bellek kullanımını güncelle

    } catch (error) {
      this.currentMemoryUsage = Math.max(0, this.currentMemoryUsage - queueItem.config.memoryEstimate); // Bellek kullanımını güncelle
      queueItem.reject(error); // İşlemi hatayla reddet
      console.error(`❌ [Android] Operation failed (ID: ${queueItem.id}):`, error);
    }
  }

  /**
   * ✅ COMMON: Timeout wrapper
   * Bir Promise'ı belirtilen bir zaman aşımı süresi içinde sarmalar.
   * @param queueItem Zaman aşımı ile yürütülecek kuyruk öğesi.
   * @returns İşlemin sonucunu döndüren veya zaman aşımına uğrarsa hata atan bir Promise.
   */
  private async executeWithTimeout<T>(queueItem: QueueItem<T>): Promise<T> {
    const timeoutPromise = new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(i18n.t('common.operationTimeout'))), queueItem.config.timeout);
    });

    return Promise.race([
      queueItem.operation(), // Orijinal işlemi çalıştır
      timeoutPromise // Zaman aşımı Promise'ı
    ]);
  }

  /**
   * ✅ ÇÖZÜM 4: Smart Cache Management - Platform Aware
   * Tahmini bellek kullanımına göre bellek baskısını kontrol eder ve gerekirse temizlik yapar.
   * @param estimatedUsage Tahmini bellek kullanımı (MB).
   * @returns Promise<void>
   */
  async checkMemoryPressure(estimatedUsage: number): Promise<void> {
    const totalEstimated = this.currentMemoryUsage + estimatedUsage;

    if (totalEstimated > this.maxMemoryThreshold) {
      console.log(`⚠️ [${Platform.OS}] Memory pressure detected, cleaning up...`);
      await this.emergencyCleanup(); // Bellek eşiği aşılırsa zorunlu temizlik yap

      // Platforma özgü bekleme
      if (Platform.OS === 'ios') {
        await this.delay(500); // iOS: daha uzun stabilizasyon süresi
      } else {
        await this.delay(200); // Android: daha kısa gecikme
      }
    }
  }

  /**
   * ✅ Platform-Aware Memory Cleanup
   * Platforma özel (iOS/Android) bellek temizleme işlemleri yapar.
   * Geçici dosyaları temizler ve eğer varsa çöp toplamayı tetikler.
   * @returns Promise<void>
   */
  async cleanupMemory(): Promise<void> {
    try {
      // 1. Geçici dosyaları temizle
      await this.cleanupTempFiles();

      // 2. Platforma özel temizlik
      if (Platform.OS === 'ios') {
        await this.iosSpecificCleanup();
      } else {
        await this.androidSpecificCleanup();
      }

      // 3. Eğer varsa çöp toplamayı zorla
      if (__DEV__ && typeof global.gc === 'function') { // `global.gc`'nin varlığını kontrol et
        global.gc();
        console.log(`🗑️ [${Platform.OS}] Garbage collection triggered`);
      }

      console.log(`🧹 [${Platform.OS}] Memory cleanup completed`);
    } catch (error) {
      console.warn(`⚠️ [${Platform.OS}] Memory cleanup warning:`, error);
    }
  }

  /**
   * ✅ iOS-Specific Memory Cleanup (Aggressive)
   * iOS için agresif bellek temizliği yapar: görsel önbelleğini temizler ve
   * belirtilen önbellek dizinlerindeki geçici dosyaları siler.
   * @returns Promise<void>
   */
  private async iosSpecificCleanup(): Promise<void> {
    try {
      // iOS: Görsel önbelleği temizleme
      const { imageProcessor } = await import('@/services/imageProcessor');
      await imageProcessor.clearImageCache();

      // iOS: Daha agresif geçici dosya temizliği
      const cacheDir = FileSystem.cacheDirectory;
      if (cacheDir) {
        const cacheFiles = await FileSystem.readDirectoryAsync(cacheDir);
        const tempFiles = cacheFiles.filter(file =>
          file.includes('temp') ||
          file.includes('cache') ||
          file.includes('ImageManipulator')
        );

        // iOS: Tüm geçici dosyaları hemen sil
        const deletePromises = tempFiles.map(file =>
          FileSystem.deleteAsync(cacheDir + file, { idempotent: true })
            .catch(error => console.warn('⚠️ iOS temp file cleanup warning:', error))
        );

        await Promise.allSettled(deletePromises);
        console.log(`🗑️ [iOS] Cleaned ${tempFiles.length} temp files`);
      }
    } catch (error) {
      console.warn('⚠️ iOS cleanup warning:', error);
    }
  }

  /**
   * ✅ Android-Specific Memory Cleanup (Gentle)
   * Android için daha nazik bellek temizliği yapar: sadece eski (30 dakikadan eski)
   * önbellek dosyalarını siler.
   * @returns Promise<void>
   */
  private async androidSpecificCleanup(): Promise<void> {
    try {
      // Android: Daha nazik temizlik, sadece eski dosyalar
      const cacheDir = FileSystem.cacheDirectory;
      if (cacheDir) {
        const cacheFiles = await FileSystem.readDirectoryAsync(cacheDir);
        const now = Date.now();
        const maxAge = 30 * 60 * 1000; // 30 dakika Android için

        const oldFiles = [];
        for (const file of cacheFiles) {
          try {
            const fileInfo = await FileSystem.getInfoAsync(cacheDir + file);
            if (fileInfo.exists && fileInfo.modificationTime) {
              const fileAge = now - (fileInfo.modificationTime * 1000);
              if (fileAge > maxAge) {
                oldFiles.push(file);
              }
            }
          } catch (error) {
            // Sorunlu dosyaları atla
            console.warn(`⚠️ [Android] Error getting file info for ${file}:`, error);
          }
        }

        // Android: Sadece eski dosyaları sil
        const deletePromises = oldFiles.map(file =>
          FileSystem.deleteAsync(cacheDir + file, { idempotent: true })
            .catch(error => console.warn('⚠️ Android file cleanup warning:', error))
        );

        await Promise.allSettled(deletePromises);
        console.log(`🗑️ [Android] Cleaned ${oldFiles.length} old files`);
      }
    } catch (error) {
      console.warn('⚠️ Android cleanup warning:', error);
    }
  }

  /**
   * ✅ Force cleanup for critical memory situations
   * Kritik bellek durumları için zorunlu temizlik yapar.
   * Tüm geçici dosyaları, görsel önbelleklerini temizler ve bellek takibini sıfırlar.
   * @returns Promise<void>
   */
  async emergencyCleanup(): Promise<void> { // `forceCleanup` adını `emergencyCleanup` olarak değiştirdim
    console.log(`🆘 [${Platform.OS}] Emergency cleanup initiated`);

    try {
      // 1. Yaşına bakılmaksızın tüm geçici dosyaları temizle
      await this.cleanupTempFiles();

      // 2. Görsel önbelleğini temizle
      const { imageProcessor } = await import('@/services/imageProcessor');
      await imageProcessor.clearImageCache();

      // 3. Platforma özel zorunlu temizlik (iOS: tüm önbellek dizinlerini temizle)
      if (Platform.OS === 'ios') {
        const dirs = [FileSystem.cacheDirectory, FileSystem.documentDirectory + 'temp_images/'];
        for (const dir of dirs) {
          if (dir) {
            try {
              const files = await FileSystem.readDirectoryAsync(dir);
              await Promise.allSettled(files.map(file =>
                FileSystem.deleteAsync(dir + file, { idempotent: true })
              ));
            } catch (error) {
              // Dizin mevcut olmayabilir, uyarıyı yoksay
              console.warn(`⚠️ [iOS] Directory access or cleanup warning for ${dir}:`, error);
            }
          }
        }
      }

      // 4. Bellek takibini sıfırla
      this.currentMemoryUsage = 0;

      console.log(`✅ [${Platform.OS}] Emergency cleanup completed`);
    } catch (error) {
      console.error(`❌ [${Platform.OS}] Emergency cleanup failed:`, error);
    }
  }


  /**
   * ✅ Platform-Aware Temp Files Cleanup
   * Geçici dosya dizinlerini platforma özel yaş eşiklerine göre temizler.
   * @returns Promise<void>
   */
  private async cleanupTempFiles(): Promise<void> {
    try {
      const tempDirs = [
        FileSystem.cacheDirectory,
        FileSystem.documentDirectory + 'temp_images/'
      ];

      for (const dir of tempDirs) {
        if (!dir) continue;

        try {
          const dirInfo = await FileSystem.getInfoAsync(dir);
          if (!dirInfo.exists) continue;

          const files = await FileSystem.readDirectoryAsync(dir);
          const now = Date.now();

          // Platforma özel yaş eşikleri
          const maxAge = Platform.OS === 'ios'
            ? 5 * 60 * 1000    // iOS: 5 dakika (agresif)
            : 60 * 60 * 1000;  // Android: 1 saat (nazik)

          const oldFiles = [];
          for (const file of files) {
            try {
              const fileInfo = await FileSystem.getInfoAsync(dir + file);
              if (fileInfo.exists && fileInfo.modificationTime) {
                const fileAge = now - (fileInfo.modificationTime * 1000);
                // Eğer dosya belirtilen yaştan büyükse VEYA temp/ImageManipulator gibi özel isimler içeriyorsa sil
                if (fileAge > maxAge || file.includes('temp') || file.includes('ImageManipulator')) {
                  oldFiles.push(file);
                }
              }
            } catch (error) {
              // Sorunlu dosyaları atla
              console.warn(`⚠️ [${Platform.OS}] Error getting file info for ${dir + file}:`, error);
            }
          }

          // Eski dosyaları sil
          await Promise.allSettled(oldFiles.map(file =>
            FileSystem.deleteAsync(dir + file, { idempotent: true })
              .catch(e => console.warn(`⚠️ [${Platform.OS}] Failed to delete ${dir + file}:`, e)) // Hataları yakala
          ));

          if (oldFiles.length > 0) {
            console.log(`🗑️ [${Platform.OS}] Cleaned ${oldFiles.length} files from ${dir}`);
          }

        } catch (dirError) {
          // Dizin erişim hatası, atla
          console.warn(`⚠️ [${Platform.OS}] Directory access warning for ${dir}:`, dirError);
        }
      }
    } catch (error) {
      console.warn(`⚠️ [${Platform.OS}] Temp cleanup warning (general):`, error);
    }
  }

  /**
   * ✅ Get Platform-Specific Memory Status
   * Mevcut bellek durumu hakkında platforma özel istatistikler döndürür.
   * @returns Mevcut bellek durumunu içeren bir nesne.
   */
  getMemoryStatus(): MemoryStatus {
    const availableMemory = Math.max(0, this.maxMemoryThreshold - this.currentMemoryUsage);
    const isLowMemory = this.currentMemoryUsage > this.lowMemoryThreshold;

    return {
      availableMemory,
      usedMemory: this.currentMemoryUsage,
      isLowMemory,
      operationsInQueue: this.operationQueue.length,
      platform: Platform.OS
    };
  }

  /**
   * ✅ Platform-Optimized Thumbnail Config
   * Platforma optimize edilmiş küçük resim yapılandırma ayarlarını döndürür.
   * @returns Küçük resim yapılandırma ayarları.
   */
  getThumbnailConfig() {
    return {
      width: this.thumbnailSize,
      height: this.thumbnailSize,
      format: Platform.OS === 'ios' ? 'jpeg' : 'png', // iOS: JPEG, Android: PNG OK
      quality: Platform.OS === 'ios' ? 0.8 : 0.9,      // iOS: daha düşük, Android: daha yüksek OK
    };
  }

  /**
   * ✅ Platform-Optimized Preview Config
   * Platforma optimize edilmiş önizleme yapılandırma ayarlarını döndürür.
   * @returns Önizleme yapılandırma ayarları.
   */
  getPreviewConfig() {
    return {
      width: Platform.OS === 'ios' ? 400 : 600,    // iOS: daha küçük, Android: daha büyük OK
      height: Platform.OS === 'ios' ? 400 : 600,   // iOS: daha küçük, Android: daha büyük OK
      format: Platform.OS === 'ios' ? 'jpeg' : 'png',
      quality: Platform.OS === 'ios' ? 0.85 : 0.95,
    };
  }

  /**
   * ✅ Utility: Platform-aware delay
   * Belirtilen milisaniye kadar gecikme sağlayan yardımcı fonksiyon.
   * @param ms Gecikme süresi (milisaniye).
   * @returns Promise<void>
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Kritik operasyonları kilitleme mekanizması ile yöneten sınıf.
 * Aynı anda sadece bir kritik operasyonun çalışmasını sağlar.
 */
class CriticalOperationManager {
  private static locks: Map<string, Promise<any>> = new Map(); // Devam eden kilitleri tutar

  /**
   * Bir işlemi bir kilitleme mekanizması ile sarar.
   * Aynı kilit anahtarına sahip birden fazla işlem, ilk işlem bitene kadar bekler.
   * @param key Kilidin benzersiz anahtarı.
   * @param operation Yürütülecek asenkron işlem.
   * @returns İşlemin sonucunu döndüren bir Promise.
   * @throws Kilit altında başka bir işlem çalışıyorsa.
   */
  static async withLock<T>(key: string, operation: () => Promise<T>): Promise<T> {
    // Eğer bu anahtarla zaten bir kilit varsa, mevcut Promise'ı bekle
    if (CriticalOperationManager.locks.has(key)) {
      console.warn(`🔒 [${Platform.OS}] Critical operation "${key}" already in progress. Waiting...`);
      return CriticalOperationManager.locks.get(key) as Promise<T>; // Mevcut işlemi döndür ve bekle
    }

    // Yeni bir Promise oluştur ve kilitle
    const promise = (async () => {
      try {
        console.log(`🔑 [${Platform.OS}] Acquiring lock for "${key}"`);
        const result = await operation(); // İşlemi çalıştır
        console.log(`🔓 [${Platform.OS}] Releasing lock for "${key}"`);
        return result;
      } finally {
        CriticalOperationManager.locks.delete(key); // İşlem bitince kilidi kaldır
      }
    })();

    CriticalOperationManager.locks.set(key, promise); // Kilit haritasına ekle
    return promise;
  }

  /**
   * Tüm aktif kritik operasyon kilitlerini temizler.
   * Acil durum kurtarmaları için kullanışlıdır.
   */
  static clearAllLocks(): void {
    console.warn(`🛑 [${Platform.OS}] Clearing all critical operation locks (${CriticalOperationManager.locks.size} active locks)`);
    CriticalOperationManager.locks.clear();
  }

  /**
   * Aktif kritik operasyonların sayısını döndürür.
   * @returns Aktif kritik operasyonların sayısı.
   */
  static getActiveCriticalOperations(): number {
    return CriticalOperationManager.locks.size;
  }

  /**
   * Kritik operasyon istatistiklerini döndürür.
   * @returns Kritik operasyon istatistiklerini içeren bir nesne.
   */
  static getStats(): { activeLocks: number; keys: string[] } {
    return {
      activeLocks: CriticalOperationManager.locks.size,
      keys: Array.from(CriticalOperationManager.locks.keys())
    };
  }
}

// MemoryManager sınıfının bir örneğini oluştur
export const memoryManager = new MemoryManager();
// CriticalOperationManager sınıfını dışa aktar (statik olduğu için doğrudan kullanılabilir)
export { CriticalOperationManager };
