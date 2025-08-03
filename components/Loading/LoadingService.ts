// client/components/Loading/LoadingService.ts - GÜNCELLENDİ
import { AppLoadingRef } from './AppLoading';

let appLoadingRef: AppLoadingRef | null = null;

export const LoadingService = {
  setRef: (ref: AppLoadingRef | null) => {
    appLoadingRef = ref;
  },
  // show fonksiyonu artık opsiyonel bir metin alabilir
  show: (text?: string) => {
    if (appLoadingRef) {
      appLoadingRef.show(text);
    }
  },
  hide: () => {
    if (appLoadingRef) {
      appLoadingRef.hide();
    }
  },
};