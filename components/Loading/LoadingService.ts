// client/components/Loading/LoadingService.ts - TEMİZLENMİŞ VERSİYON
import { AppLoadingRef } from './AppLoading';

let appLoadingRef: AppLoadingRef | null = null;

export const LoadingService = {
  setRef: (ref: AppLoadingRef | null) => {
    appLoadingRef = ref;
  },
  
  show: () => {
    if (appLoadingRef) {
      appLoadingRef.show();
    }
  },
  
  hide: () => {
    if (appLoadingRef) {
      appLoadingRef.hide();
    }
  },
};