import * as ImageManipulator from 'expo-image-manipulator';

export const imageProcessor = {
  /**
   * Verilen bir görüntüden düşük kaliteli bir thumbnail oluşturur.
   * @param originalUri Orijinal resmin URI'si (file://)
   * @returns Thumbnail'in yeni URI'si (file://)
   */
  createThumbnail: async (originalUri: string): Promise<string> => {
    const result = await ImageManipulator.manipulateAsync(
      originalUri,
      [
        { resize: { width: 300 } } // Genişliği 300px yap, yükseklik oranı koru
      ],
      {
        compress: 0.6, // %60 kalitede sıkıştır
        format: ImageManipulator.SaveFormat.JPEG,
      }
    );
    return result.uri;
  },
};