import { AppToastRef, ToastProps } from './AppToast';

let appToastRef: AppToastRef | null = null;

export const ToastService = {
  setRef: (ref: AppToastRef | null) => {
    appToastRef = ref;
  },

  show: (text: string, type: 'success' | 'error' | 'info' | 'warning' = 'info', duration?: number) => {
    if (appToastRef) {
      appToastRef.show({
        type,
        text,
        duration
      });
    } else {
      console.warn('AppToastRef is not set. Cannot display toast:', text);
    }
  },

  success: (text: string, duration?: number) => {
    ToastService.show(text, 'success', duration);
  },

  error: (text: string, duration?: number) => {
    ToastService.show(text, 'error', duration);
  },

  warning: (text: string, duration?: number) => {
    ToastService.show(text, 'warning', duration);
  },

  info: (text: string, duration?: number) => {
    ToastService.show(text, 'info', duration);
  },

  hide: () => {
    if (appToastRef) {
      appToastRef.hide();
    }
  },
};