// client/services/memoryManager.ts

import * as FileSystem from 'expo-file-system';
import { Image } from 'react-native';
import { backgroundThumbnailManager } from './backgroundThumbnailManager';
import i18n from '@/i18n';

// global nesnesine 'gc' metodu ekle ve __DEV__ için tip tanımı yap
declare global {
  var gc: (() => void) | undefined;
  var __DEV__: boolean;
}

/**
 * Bellek temizliği ve optimizasyonu için yardımcı fonksiyonlar.
 * Native memory cache'lerini temizler ve garbage collection'ı tetikler (varsa).
 */
export const cleanupUtilities = {
  /**
   * React Native Image kütüphanesinin bellek ve disk önbelleklerini temizler.
   * Cihazdaki eski geçici dosyaları siler.
   */
  async performFullMemoryCleanup(): Promise<void> {
    console.log(i18n.t('memoryManager.fullCleanupStartedLog'));

    try {
      if (typeof Image.clearMemoryCache === 'function') {
        await Image.clearMemoryCache();
        console.log(i18n.t('memoryManager.memoryCacheClearedLog'));
      }
      if (typeof Image.clearDiskCache === 'function') {
        await Image.clearDiskCache();
        console.log(i18n.t('memoryManager.diskCacheClearedLog'));
      }

      // Expo FileSystem cache dizinindeki geçici dosyaları temizle
      const cacheDir = FileSystem.cacheDirectory;
      if (cacheDir) {
        const files = await FileSystem.readDirectoryAsync(cacheDir);
        const tempFiles = files.filter(file =>
          file.includes('ImageManipulator') ||
          file.startsWith('tmp-') || // Expo'nun geçici dosyaları
          file.startsWith('view-shot-') || // react-native-view-shot geçici dosyaları
          file.startsWith('bg_thumb_') // Kendi thumbnail'larımızdan kalmış olabilecekler
        );

        const deletePromises = tempFiles.map(file =>
          FileSystem.deleteAsync(cacheDir + file, { idempotent: true })
            .catch(error => console.warn(i18n.t('memoryManager.failedToDeleteCacheFileLog'), file, error.message))
        );
        await Promise.allSettled(deletePromises);
        console.log(i18n.t('memoryManager.tempCacheFilesCleanedLog', { count: tempFiles.length }));
      }

      // imageProcessor'ın kendi geçici dizinini temizle
      await require('./imageProcessor').imageProcessor.cleanupTempFiles();
      // Arka plan küçük resim yöneticisinin kendi optimizasyonunu tetikle
      await backgroundThumbnailManager.optimizeMemory();

    } catch (error: any) {
      console.warn(i18n.t('memoryManager.cleanupFailedLog'), error.message);
    }

    // React Native Herme motorunda veya diğer JS motorlarında global.gc() varsa tetikle
    if (__DEV__ && typeof global.gc === 'function') {
      try {
        global.gc();
        console.log(i18n.t('memoryManager.garbageCollectionTriggeredLog'));
      } catch (e) {
        console.warn(i18n.t('memoryManager.gcErrorLog'), e);
      }
    }
    console.log(i18n.t('memoryManager.fullCleanupCompletedLog'));
  },

  /**
   * Sadece React Native Image memory cache'ini temizler, daha hafif bir temizlik.
   */
  async clearImageMemoryCache(): Promise<void> {
    try {
      if (typeof Image.clearMemoryCache === 'function') {
        await Image.clearMemoryCache();
        console.log(i18n.t('memoryManager.memoryCacheClearedLightLog'));
      }
    } catch (error: any) {
      console.warn(i18n.t('memoryManager.memoryCacheClearFailedLightLog'), error.message);
    }
  }
};

/**
 * Bellek yoğun işlemleri sıraya koymak ve sequential olarak yürütmek için bir kuyruk yöneticisi.
 * Her işlem sonrası bellek temizliği yapar.
 */
class OperationQueueManager {
  private queue: Array<{ operation: () => Promise<void>; resolve: () => void; reject: (e: any) => void }> = [];
  private isProcessing = false;
  private currentOperationId: string | null = null;

  /**
   * Bir işlemi sıraya ekler ve işlem bittiğinde veya hata oluştuğunda Promise'ı çözer/reddeder.
   * @param operationId İşlemin benzersiz ID'si (debug için).
   * @param operation Gerçekleştirilecek asenkron fonksiyon.
   * @returns İşlemin tamamlanmasını bekleyen bir Promise.
   */
  async addOperation(operationId: string, operation: () => Promise<void>): Promise<void> {
    return new Promise((resolve, reject) => {
      this.queue.push({ operation: async () => {
        this.currentOperationId = operationId;
        try {
          await operation();
          resolve();
        } catch (e) {
          reject(e);
          throw e; // Hata zincirini devam ettir
        } finally {
          this.currentOperationId = null;
        }
      }, resolve, reject });
      this.processQueue();
    });
  }

  /**
   * Kuyruğu işlemeye başlar. Aynı anda sadece bir işlemin çalıştığından emin olur.
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing) {
      return;
    }
    this.isProcessing = true;

    while (this.queue.length > 0) {
      const { operation, resolve, reject } = this.queue.shift()!;
      try {
        await operation();
        console.log(i18n.t('memoryManager.operationCompletedLog', { operationId: this.currentOperationId }));
      } catch (e: any) {
        console.error(i18n.t('memoryManager.operationFailedLog', { operationId: this.currentOperationId }), e.message);
        // Hata durumunda kuyruğu durdurmak isteyebiliriz veya sadece bu işlemi atlayabiliriz.
        // Şimdilik, bu işlemi atlayıp kuyruğa devam ediyoruz.
      } finally {
        await cleanupUtilities.performFullMemoryCleanup(); // Her işlem sonrası tam bellek temizliği
      }
    }
    this.isProcessing = false;
    console.log(i18n.t('memoryManager.queueEmptyLog'));
  }

  /**
   * Mevcut durumda çalışan bir işlem olup olmadığını döndürür.
   */
  isIdle(): boolean {
    return !this.isProcessing && this.queue.length === 0;
  }

  /**
   * Belirli bir işlemin kuyrukta olup olmadığını kontrol eder.
   */
  isOperationQueued(operationId: string): boolean {
    return this.queue.some(item => item.operation.toString().includes(operationId)); // Basit kontrol
  }
}

/**
 * Kritik işlemleri tekil olarak çalıştırmak için kilit mekanizması.
 * Birden fazla aynı kritik işlemin aynı anda başlamasını engeller.
 */
class CriticalOperationManager {
  private static activeOperations = new Set<string>();

  /**
   * Bir kritik işlemi kilit altında çalıştırır.
   * @param operationId İşlemin benzersiz ID'si.
   * @param operation Çalıştırılacak asenkron fonksiyon.
   * @returns İşlemin sonucu.
   * @throws Eğer işlem zaten çalışıyorsa hata fırlatır.
   */
  static async withLock<T>(operationId: string, operation: () => Promise<T>): Promise<T> {
    if (CriticalOperationManager.activeOperations.has(operationId)) {
      console.warn(i18n.t('memoryManager.criticalOperationAlreadyRunningLog', { operationId }));
      throw new Error(i18n.t('memoryManager.operationAlreadyRunningError', { operationId }));
    }

    CriticalOperationManager.activeOperations.add(operationId);
    console.log(i18n.t('memoryManager.criticalOperationStartedLog', { operationId }));

    try {
      const result = await operation();
      console.log(i18n.t('memoryManager.criticalOperationCompletedLog', { operationId }));
      return result;
    } finally {
      CriticalOperationManager.activeOperations.delete(operationId);
      console.log(i18n.t('memoryManager.criticalOperationReleasedLog', { operationId }));
    }
  }

  /**
   * Belirli bir kritik işlemin şu anda aktif olup olmadığını kontrol eder.
   * @param operationId Kontrol edilecek işlem ID'si.
   */
  static isOperationActive(operationId: string): boolean {
    return CriticalOperationManager.activeOperations.has(operationId);
  }
}

export const memoryManager = {
  queue: new OperationQueueManager(),
  critical: CriticalOperationManager,
  cleanup: cleanupUtilities.performFullMemoryCleanup,
  clearImageCache: cleanupUtilities.clearImageMemoryCache, // Hafif cache temizliği
};