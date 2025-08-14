import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';
import Toast from 'react-native-toast-message';

// Arka plan animasyonu ile çakışmaması için Toast'un otomatik gizlenme süresi artırıldı
const TOAST_TIMEOUT = 3500;

export const ImagePickerService = {
  /**
   * Galeriden birden fazla fotoğraf seçmek için kullanılır.
   * @returns Seçilen fotoğrafların URI'lerinden oluşan bir dizi veya boş dizi.
   */
  pickImagesFromGallery: async (): Promise<string[]> => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert(
          "İzin Gerekli",
          "Fotoğraf seçebilmek için galeri izni vermelisiniz.",
        );
        return [];
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        allowsMultipleSelection: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets) {
        return result.assets.map(asset => asset.uri);
      }
      return [];
    } catch (error) {
      console.error('Galeri fotoğrafı seçilirken bir hata oluştu:', error);
      return [];
    }
  },
};

export const ToastService = {
  /**
   * Kullanıcıya bildirim göstermek için kullanılır.
   * @param options.text1 Başlık metni
   * @param options.text2 Açıklama metni (isteğe bağlı)
   * @param options.type 'success', 'error' veya 'info' olabilir.
   */
  show: (options: { text1: string; text2?: string; type: 'success' | 'error' | 'info' }) => {
    Toast.show({
      type: options.type,
      text1: options.text1,
      text2: options.text2,
      position: 'bottom',
      visibilityTime: TOAST_TIMEOUT,
    });
  },
};

interface InputDialogOptions {
  title: string;
  placeholder?: string;
}

export const InputDialogService = {
  /**
   * Kullanıcıdan metin girişi almak için Promise tabanlı bir Alert gösterir.
   * @param options.title Başlık metni
   * @param options.placeholder Input alanı için yer tutucu (isteğe bağlı)
   * @returns Kullanıcının girdiği metni veya işlem iptal edilirse null döner.
   */
  show: (options: InputDialogOptions): Promise<string | null> => {
    return new Promise((resolve) => {
      Alert.prompt(
        options.title,
        '',
        [
          {
            text: 'İptal',
            onPress: () => resolve(null),
            style: 'cancel',
          },
          {
            text: 'Tamam',
            onPress: (text) => resolve(text),
          },
        ],
        'plain-text',
        options.placeholder
      );
    });
  },
};