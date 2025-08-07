// kodlar/components/Dialog/InputDialogService.ts
import { InputDialogRef } from './InputDialog';

interface InputDialogOptions {
  title: string;
  message?: string;
  initialValue?: string;
  placeholder?: string;
  // onConfirm ve onCancel artık doğrudan InputDialogService tarafından yönetilecek
  // ve Promise'ın resolve/reject'ini tetikleyecek.
}

let serviceRef: InputDialogRef | null = null;
let currentResolve: ((value: string | null) => void) | null = null;

export const InputDialogService = {
  setRef: (ref: InputDialogRef | null) => {
    serviceRef = ref;
  },
  /**
   * Bir giriş diyalogu gösterir ve kullanıcının girdiği değeri veya null'ı döndüren bir Promise bekler.
   * @param options Diyalog seçenekleri.
   * @returns Kullanıcının girdiği değeri (string) veya iptal edilirse null.
   */
  show: (options: InputDialogOptions): Promise<string | null> => {
    return new Promise((resolve) => {
      if (serviceRef) {
        currentResolve = resolve; // Promise'ı dışarıdan çözmek için resolve fonksiyonunu sakla
        serviceRef.show({
          ...options,
          onConfirm: (text: string) => {
            if (currentResolve) {
              currentResolve(text);
              currentResolve = null; // Bellek sızıntısını önlemek için sıfırla
            }
          },
          onCancel: () => {
            if (currentResolve) {
              currentResolve(null); // İptal durumunda null döndür
              currentResolve = null;
            }
          },
        });
      } else {
        console.warn('InputDialogRef is not set. Cannot display input dialog.');
        resolve(null); // Ref ayarlanmamışsa hemen null döndür
      }
    });
  },
  hide: () => {
    if (serviceRef) {
      serviceRef.hide();
      if (currentResolve) {
        currentResolve(null); // Diyalog dışarıdan gizlenirse Promise'ı null ile çöz
        currentResolve = null;
      }
    }
  },
};
