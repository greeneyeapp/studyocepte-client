// kodlar/components/Dialog/InputDialogService.ts
import { InputDialogRef } from './InputDialog';

interface InputDialogOptions {
  title: string;
  message?: string;
  initialValue?: string;
  placeholder?: string;
  onConfirm: (text: string) => void;
  onCancel?: () => void;
}

let serviceRef: InputDialogRef | null = null;

export const InputDialogService = {
  setRef: (ref: InputDialogRef | null) => {
    serviceRef = ref;
  },
  show: (options: InputDialogOptions) => {
    if (serviceRef) {
      serviceRef.show(options);
    } else {
      console.warn('InputDialogRef is not set. Cannot display input dialog.');
    }
  },
  hide: () => {
    if (serviceRef) {
      serviceRef.hide();
    }
  },
};