// services/exportService.ts - HIZLI EXPORT DESTEKLİ VERSİYON

import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { ExportPreset, ShareOption } from '@/features/editor/config/exportTools';
import i18n from '@/i18n'; // i18n import edildi

interface SharePayload {
  shareOption: ShareOption;
  preset: ExportPreset;
  base64Data: string;
  filename: string;
}

export class ExportService {
  /**
   * Base64 verisini geçici bir dosyaya yazar ve URI'sini döndürür.
   */
  private static async writeBase64ToFile(base64Data: string, filename: string): Promise<string> {
    const fileUri = FileSystem.cacheDirectory + filename;
    
    console.log('💾 Writing file:', filename, 'Size:', base64Data.length);
    
    await FileSystem.writeAsStringAsync(fileUri, base64Data, {
      encoding: FileSystem.EncodingType.Base64,
    });
    
    // Dosyanın gerçekten oluştuğunu kontrol et
    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    if (!fileInfo.exists) {
      throw new Error(i18n.t('imageProcessing.moveToPermanentFailed')); // Lokalize edildi
    }
    
    console.log('✅ File created successfully:', fileInfo.size, 'bytes');
    return fileUri;
  }

  /**
   * Ana paylaşım fonksiyonu - tüm paylaşım türlerini yönetir
   */
  static async shareWithOption(options: SharePayload): Promise<void> {
    const { shareOption, preset, base64Data, filename } = options;
    let fileUri: string | null = null;

    console.log('🚀 Starting export:', {
      shareType: shareOption.type,
      preset: preset.nameKey, // nameKey kullanıldı
      dimensions: preset.dimensions,
      format: preset.format
    });

    try {
      fileUri = await this.writeBase64ToFile(base64Data, filename);

      if (shareOption.type === 'gallery') { // quick_custom kaldırıldı
        // Galeri izni iste
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status !== 'granted') {
          throw new Error(i18n.t('permissions.galleryMessage')); // Lokalize edildi
        }
        
        // Galeriye kaydet
        const asset = await MediaLibrary.createAssetAsync(fileUri);
        console.log('📱 Saved to gallery:', asset.id);
        
      } else {
        // Generic paylaşım
        const isAvailable = await Sharing.isAvailableAsync();
        if (!isAvailable) {
          throw new Error(i18n.t('common.sharingNotAvailable')); // Lokalize edildi
        }

        await Sharing.shareAsync(fileUri, {
          mimeType: preset.format === 'png' ? 'image/png' : 'image/jpeg',
          dialogTitle: i18n.t('common.shareTitle', { presetName: i18n.t(preset.nameKey) }), // Lokalize edildi
        });
        console.log('📤 Shared successfully');
      }
    } catch (error: any) { // error type any eklendi
      console.error('❌ Export error:', error);
      throw error;
    } finally {
      // Geçici dosyayı her zaman sil
      if (fileUri) {
        try {
          await FileSystem.deleteAsync(fileUri, { idempotent: true });
          console.log('🗑️ Temporary file cleaned up');
        } catch (cleanupError) {
          console.warn('⚠️ Failed to cleanup temp file:', cleanupError);
        }
      }
    }
  }

  /**
   * Hızlı export için özel fonksiyon (Kaldırıldı)
   * static async quickExport(
   *   base64Data: string, 
   *   width: number, 
   *   height: number
   * ): Promise<void> {
   *   // Bu fonksiyon artık kullanılmıyor ve kaldırıldı.
   *   // İlgili çağıran yerlerin de güncellenmesi gerekmektedir.
   * }
   */
}