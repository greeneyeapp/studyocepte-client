// services/exportService.ts - DÜZELTİLDİ

import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { ExportPreset, ShareOption } from '@/features/editor/config/exportTools';
import { ToastService } from '@/components/Toast/ToastService'; // ToastService import edildi
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

    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    if (!fileInfo.exists) {
      throw new Error(i18n.t('filesystem.fileSaveCheckFailed')); // Çeviri anahtarı kullanıldı
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
      preset: i18n.t(preset.name), // preset.name artık çeviri anahtarı
      dimensions: preset.dimensions,
      format: preset.format
    });

    try {
      fileUri = await this.writeBase64ToFile(base64Data, filename);

      if (shareOption.type === 'gallery') {
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status !== 'granted') {
          throw new Error(i18n.t('common.permissions.galleryMessage')); // Çeviri anahtarı kullanıldı
        }

        const asset = await MediaLibrary.createAssetAsync(fileUri);
        console.log('📱 Saved to gallery:', asset.id);

      } else {
        const isAvailable = await Sharing.isAvailableAsync();
        if (!isAvailable) {
          throw new Error(i18n.t('export.sharingNotAvailableError')); // Çeviri anahtarı kullanıldı
        }

        await Sharing.shareAsync(fileUri, {
          mimeType: preset.format === 'png' ? 'image/png' : 'image/jpeg',
          dialogTitle: i18n.t('export.shareDialogTitle', { presetName: i18n.t(preset.name) }), // preset.name artık çeviri anahtarı
        });
        console.log('📤 Shared successfully');
      }
    } catch (error) {
      console.error('❌ Export error:', error);
      throw error;
    } finally {
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
}