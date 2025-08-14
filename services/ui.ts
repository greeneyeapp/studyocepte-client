import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';
// import Toast from 'react-native-toast-message'; // Artık kendi ToastService'imiz var
import i18n from '@/i18n'; // i18n import edildi

// const TOAST_TIMEOUT = 3500; // Artık ToastService tarafından yönetiliyor

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
          i18n.t('permissions.permissionRequired'), // Lokalize edildi
          i18n.t('permissions.galleryAccessMessage'), // Lokalize edildi
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