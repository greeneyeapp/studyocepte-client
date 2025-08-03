// client/services/exportService.ts (TAM VE GÜNCELLENMİŞ KOD)
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
    await FileSystem.writeAsStringAsync(fileUri, base64Data, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return fileUri;
  }

  /**
   * Ana paylaşım fonksiyonu - tüm paylaşım türlerini yönetir
   */
  static async shareWithOption(options: SharePayload): Promise<void> {
    const { shareOption, preset, base64Data, filename } = options;
    let fileUri: string | null = null;

    try {
      fileUri = await this.writeBase64ToFile(base64Data, filename);

      if (shareOption.type === 'gallery') {
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status !== 'granted') throw new Error('Galeri izni gerekli');
        
        await MediaLibrary.createAssetAsync(fileUri);
      } else {
        const isAvailable = await Sharing.isAvailableAsync();
        if (!isAvailable) throw new Error('Paylaşım özelliği bu cihazda kullanılamıyor.');

        await Sharing.shareAsync(fileUri, {
          mimeType: preset.format === 'png' ? 'image/png' : 'image/jpeg',
          dialogTitle: 'Paylaş',
        });
      }
    } catch (error) {
      console.error('Paylaşım hatası:', error);
      throw error;
    } finally {
      // Geçici dosyayı her zaman sil
      if (fileUri) {
        await FileSystem.deleteAsync(fileUri, { idempotent: true });
      }
    }
  }
}