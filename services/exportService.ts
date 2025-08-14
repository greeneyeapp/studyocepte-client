// services/exportService.ts

import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { ExportPreset, ShareOption } from '@/features/editor/config/exportTools';

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
      throw new Error('Dosya oluşturulamadı');
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
      preset: preset.name,
      dimensions: preset.dimensions,
      format: preset.format
    });

    try {
      fileUri = await this.writeBase64ToFile(base64Data, filename);

      // `quick_custom` tipi kaldırıldığı için sadece 'gallery' tipi kontrol edildi.
      if (shareOption.type === 'gallery') {
        // Galeri izni iste
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status !== 'granted') {
          throw new Error('Galeri izni gerekli. Lütfen ayarlardan izin verin.');
        }

        // Galeriye kaydet
        const asset = await MediaLibrary.createAssetAsync(fileUri);
        console.log('📱 Saved to gallery:', asset.id);

      } else { // Artık sadece 'generic' paylaşım kalıyor
        // Generic paylaşım
        const isAvailable = await Sharing.isAvailableAsync();
        if (!isAvailable) {
          throw new Error('Paylaşım özelliği bu cihazda kullanılamıyor.');
        }

        await Sharing.shareAsync(fileUri, {
          mimeType: preset.format === 'png' ? 'image/png' : 'image/jpeg',
          dialogTitle: `${preset.name} Paylaş`,
        });
        console.log('📤 Shared successfully');
      }
    } catch (error) {
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
   * `quickExport` fonksiyonu tamamen kaldırıldı.
   */
}