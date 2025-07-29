// kodlar/components/Dialog/DialogService.ts
import { AppDialogRef } from './AppDialog';

let appDialogRef: AppDialogRef | null = null;

// BU FONKSİYON ARTIK GÜVENİLİR DEĞİL, AMA GERİYE UYUMLULUK İÇİN KALABİLİR
// YENİ YAPI BUNU KULLANMAYACAK
export function setAppDialogRef(ref: AppDialogRef | null) {
  appDialogRef = ref;
}

interface DialogOptions {
  title: string;
  message: string;
  buttons: Array<{
    text: string;
    onPress?: () => void;
    style?: 'default' | 'cancel' | 'destructive';
  }>;
}

export const DialogService = {
  setRef: (ref: AppDialogRef | null) => {
    appDialogRef = ref;
  },
  show: (options: DialogOptions) => {
    if (appDialogRef) {
      appDialogRef.show(options);
    } else {
      console.warn('AppDialogRef is not set. Cannot display dialog.', options);
    }
  },
  hide: () => {
    if (appDialogRef) {
      appDialogRef.hide();
    }
  },
};