// services/exportService.ts
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { captureRef } from 'react-native-view-shot';
import { Linking, Platform, Alert } from 'react-native';
import { ExportPreset, ShareOption } from '@/features/editor/config/exportTools';

export interface ExportOptions {
  preset: ExportPreset;
  viewRef: any; // View reference for capturing
  filename?: string;
}

export interface ShareOptions extends ExportOptions {
  shareOption: ShareOption;
}

export class ExportService {

  /**
   * View'i yakalayıp belirtilen preset'e göre export eder
   */
  static async captureAndExport(options: ExportOptions): Promise<string> {
    const { preset, viewRef, filename } = options;

    if (!viewRef) {
      throw new Error('View referansı bulunamadı');
    }

    try {
      // View'i yakala
      const uri = await captureRef(viewRef, {
        format: preset.format,
        quality: preset.quality,
        width: preset.dimensions.width,
        height: preset.dimensions.height,
      });

      // Dosya adını oluştur
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const finalFilename = filename || `export-${preset.id}-${timestamp}.${preset.format}`;

      // Geçici dizine kaydet
      const fileUri = `${FileSystem.documentDirectory}${finalFilename}`;
      await FileSystem.moveAsync({
        from: uri,
        to: fileUri,
      });

      return fileUri;
    } catch (error) {
      console.error('Export hatası:', error);
      throw new Error('Fotoğraf export edilemedi: ' + (error as Error).message);
    }
  }

  /**
   * Fotoğrafı cihaz galerisine kaydet
   */
  static async saveToGallery(fileUri: string): Promise<void> {
    try {
      // Galeri izinlerini kontrol et
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Galeri izni gerekli');
      }

      // Galeriye kaydet
      const asset = await MediaLibrary.createAssetAsync(fileUri);
      await MediaLibrary.createAlbumAsync('Stüdyo Cepte', asset, false);

    } catch (error) {
      console.error('Galeri kaydetme hatası:', error);
      throw new Error('Galeriye kaydedilemedi: ' + (error as Error).message);
    }
  }

  /**
   * WhatsApp ile paylaş
   */
  static async shareToWhatsApp(fileUri: string): Promise<void> {
    try {
      const whatsappUrl = Platform.select({
        ios: 'whatsapp://send',
        android: 'whatsapp://send',
      });

      if (!whatsappUrl) {
        throw new Error('WhatsApp paylaşımı desteklenmiyor');
      }

      // WhatsApp yüklü mü kontrol et
      const canOpen = await Linking.canOpenURL(whatsappUrl);
      if (!canOpen) {
        throw new Error('WhatsApp yüklü değil');
      }

      // Paylaş
      await Sharing.shareAsync(fileUri, {
        mimeType: 'image/jpeg',
        dialogTitle: 'WhatsApp ile paylaş',
      });

    } catch (error) {
      console.error('WhatsApp paylaşım hatası:', error);
      throw new Error('WhatsApp ile paylaşılamadı: ' + (error as Error).message);
    }
  }

  /**
   * Instagram ile paylaş
   */
  static async shareToInstagram(fileUri: string): Promise<void> {
    try {
      const instagramUrl = Platform.select({
        ios: 'instagram://app',
        android: 'https://www.instagram.com',
      });

      if (!instagramUrl) {
        throw new Error('Instagram paylaşımı desteklenmiyor');
      }

      // Instagram Stories için özel paylaşım
      if (Platform.OS === 'ios') {
        const canOpen = await Linking.canOpenURL('instagram-stories://share');
        if (canOpen) {
          // iOS Instagram Stories paylaşımı
          await Sharing.shareAsync(fileUri, {
            mimeType: 'image/jpeg',
          });
          return;
        }
      }

      // Genel paylaşım
      await Sharing.shareAsync(fileUri, {
        mimeType: 'image/jpeg',
        dialogTitle: 'Instagram ile paylaş',
      });

    } catch (error) {
      console.error('Instagram paylaşım hatası:', error);
      throw new Error('Instagram ile paylaşılamadı: ' + (error as Error).message);
    }
  }

  /**
   * E-posta ile paylaş
   */
  static async shareViaEmail(fileUri: string, preset: ExportPreset): Promise<void> {
    try {
      await Sharing.shareAsync(fileUri, {
        mimeType: preset.format === 'png' ? 'image/png' : 'image/jpeg',
        dialogTitle: 'E-posta ile gönder',
        UTI: preset.format === 'png' ? 'public.png' : 'public.jpeg',
      });
    } catch (error) {
      console.error('E-posta paylaşım hatası:', error);
      throw new Error('E-posta ile gönderilemedi: ' + (error as Error).message);
    }
  }

  /**
   * Genel sistem paylaşımı
   */
  static async shareGeneric(fileUri: string, preset: ExportPreset): Promise<void> {
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        throw new Error('Paylaşım özelliği bu cihazda kullanılamıyor.');
      }

      await Sharing.shareAsync(fileUri, {
        mimeType: preset.format === 'png' ? 'image/png' : 'image/jpeg',
        dialogTitle: 'Paylaş', // Bu başlık bazı Android cihazlarda görünebilir
      });
    } catch (error) {
      console.error('Genel paylaşım hatası:', error);
      throw new Error('Paylaşılamadı: ' + (error as Error).message);
    }
  }

  /**
   * Ana paylaşım fonksiyonu - tüm paylaşım türlerini yönetir
   */
  static async shareWithOption(options: ShareOptions): Promise<void> {
    const { shareOption, preset, viewRef, filename } = options;

    try {
      const fileUri = await this.captureAndExport({ preset, viewRef, filename });

      // --- DÜZELTME ---
      // Mantık, yeni ve sade SHARE_OPTIONS yapısına göre güncellendi.
      switch (shareOption.type) {
        case 'gallery':
          await this.saveToGallery(fileUri);
          break;

        case 'generic':
        default:
          await this.shareGeneric(fileUri, preset);
          break;
      }

      // Geçici dosya, işlem ne olursa olsun her zaman silinir.
      try {
        await FileSystem.deleteAsync(fileUri, { idempotent: true });
      } catch (cleanupError) {
        console.warn('Geçici dosya temizlenemedi:', cleanupError);
      }

    } catch (error) {
      console.error('Paylaşım hatası:', error);
      throw error;
    }
  }

  /**
   * Çoklu export - birden fazla preset'i aynı anda export eder
   */
  static async batchExport(
    viewRef: any,
    presets: ExportPreset[],
    onProgress?: (current: number, total: number) => void
  ): Promise<string[]> {
    const results: string[] = [];

    for (let i = 0; i < presets.length; i++) {
      const preset = presets[i];
      onProgress?.(i + 1, presets.length);

      try {
        const fileUri = await this.captureAndExport({
          preset,
          viewRef,
          filename: `batch-export-${preset.id}-${Date.now()}.${preset.format}`
        });
        results.push(fileUri);
      } catch (error) {
        console.error(`Preset ${preset.name} export edilemedi:`, error);
        // Hata durumunda bile devam et
      }
    }

    return results;
  }

  /**
   * Export önizlemesi oluşturur (küçük boyutlu)
   */
  static async createPreview(viewRef: any, maxSize: number = 200): Promise<string> {
    if (!viewRef) {
      throw new Error('View referansı bulunamadı');
    }

    try {
      const uri = await captureRef(viewRef, {
        format: 'jpg',
        quality: 0.7,
        width: maxSize,
        height: maxSize,
      });

      return uri;
    } catch (error) {
      console.error('Önizleme oluşturma hatası:', error);
      throw new Error('Önizleme oluşturulamadı');
    }
  }
}