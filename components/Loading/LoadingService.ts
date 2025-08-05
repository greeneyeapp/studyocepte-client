// client/components/Loading/LoadingService.ts - TAM KOD
import { AppLoadingRef as IAppLoadingRef } from './AppLoading';

/**
 * AppLoading bileşeninin dışarıya açtığı fonksiyonları tanımlayan arayüz.
 * Bu, kodun daha güvenli ve öngörülebilir olmasını sağlar.
 * Yeni AppLoading bileşeni ile uyumlu olması için ismi değiştirildi.
 */
export type AppLoadingRef = IAppLoadingRef;

let appLoadingRef: AppLoadingRef | null = null;

export const LoadingService = {
  /**
   * GlobalUIProvider'dan gelen ref'i ayarlar.
   */
  setRef: (ref: AppLoadingRef | null) => {
    appLoadingRef = ref;
  },

  /**
   * Yükleme animasyonunu gösterir.
   */
  show: () => {
    if (appLoadingRef) {
      appLoadingRef.show();
    } else {
      console.warn('LoadingService: AppLoadingRef henüz ayarlanmadı. Gösterim yapılamıyor.');
    }
  },

  /**
   * Yükleme animasyonunu gizler.
   */
  hide: () => {
    if (appLoadingRef) {
      appLoadingRef.hide();
    } else {
      console.warn('LoadingService: AppLoadingRef henüz ayarlanmadı. Gizleme yapılamıyor.');
    }
  },
};