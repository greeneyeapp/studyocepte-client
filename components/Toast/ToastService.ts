// kodlar/components/Toast/ToastService.ts
import { AppToastRef, ToastProps } from './AppToast';

let appToastRef: AppToastRef | null = null;


export function setAppToastRef(ref: AppToastRef | null) {
  appToastRef = ref;
}

function show(props: { type: 'success' | 'error' | 'info' | 'warning'; text1: string; text2?: string; duration?: number; }) {
  if (appToastRef) {
    appToastRef.show(props);
  } else {
    console.warn('AppToastRef henüz ayarlanmadı. Toast mesajı gösterilemiyor.', props);
  }
}

export const ToastService = {
  setRef: (ref: AppToastRef | null) => {
    appToastRef = ref;
  },
  show: (props: ToastProps) => {
    if (appToastRef) {
      appToastRef.show(props);
    } else {
      console.warn('AppToastRef is not set. Cannot display toast.', props);
    }
  },
  hide: () => {
    if (appToastRef) {
      appToastRef.hide();
    }
  },
};