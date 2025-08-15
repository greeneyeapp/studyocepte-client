import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';
// import Toast from 'react-native-toast-message'; // Bu artık buradan kaldırıldı
import i18n from '@/i18n';

// Global olarak tanımlanmış servisleri import et
import { ToastService as GlobalToastService } from '@/components/Toast/ToastService';
import { InputDialogService as GlobalInputDialogService } from '@/components/Dialog/InputDialogService';


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
          i18n.t('common.permissions.permissionRequiredTitle'),
          i18n.t('common.permissions.galleryMessage'),
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
    } catch (error: any) {
      console.error(i18n.t('common.errors.galleryPickFailed'), error);
      // Global ToastService kullanarak hata mesajını göster
      GlobalToastService.error(i18n.t('common.errors.galleryPickFailed') + (error.message || ''));
      return [];
    }
  },
};