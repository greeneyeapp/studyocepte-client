import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';
import Toast from 'react-native-toast-message';

export const ImagePickerService = {
  pickImageFromGallery: async (): Promise<string | null> => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert("İzin Gerekli!", "Fotoğraf seçebilmek için galeri izni vermelisiniz.");
      return null;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8,
    });
    if (!result.canceled) {
      return result.assets[0].uri;
    }
    return null;
  },
};

export const ToastService = {
  show: (text1: string, type: 'success' | 'error' | 'info' = 'success', text2?: string) => {
    Toast.show({ type, text1, text2, position: 'bottom' });
  },
};

interface InputDialogOptions {
  title: string;
  label?: string;
  onConfirm: (text: string) => void;
}

export const InputDialogService = {
  show: ({ title, label, onConfirm }: InputDialogOptions) => {
    Alert.prompt(title, label, (text: string) => onConfirm(text), 'plain-text');
  },
};