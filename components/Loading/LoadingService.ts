// kodlar/components/Loading/LoadingService.ts
import { AppLoadingRef } from './AppLoading';

let appLoadingRef: AppLoadingRef | null = null;

export function setAppLoadingRef(ref: AppLoadingRef | null) {
 appLoadingRef = ref;
}

function show() {
 if (appLoadingRef) {
   appLoadingRef.show();
 } else {
   console.warn('AppLoadingRef henüz ayarlanmadı. Loading gösterilemiyor.');
 }
}

function hide() {
 if (appLoadingRef) {
   appLoadingRef.hide();
 }
}

export const LoadingService = {
  setRef: (ref: AppLoadingRef | null) => {
    appLoadingRef = ref;
  },
  show: () => {
    if (appLoadingRef) {
      appLoadingRef.show();
    } else {
      console.warn('AppLoadingRef is not set. Cannot display loading.');
    }
  },
  hide: () => {
    if (appLoadingRef) {
      appLoadingRef.hide();
    }
  },
};