// kodlar/context/GlobalUIProvider.tsx - GÜNCELLENMİŞ HALİ
import React, { useCallback, ReactNode } from 'react';
import AppToast, { AppToastRef } from '@/components/Toast/AppToast';
import AppDialog, { AppDialogRef } from '@/components/Dialog/AppDialog';
import AppLoading from '@/components/Loading/AppLoading'; // AppLoadingRef buradan kaldırıldı
import AppBottomSheet, { AppBottomSheetRef } from '@/components/BottomSheet/AppBottomSheet';
import InputDialog, { InputDialogRef } from '@/components/Dialog/InputDialog';

import { DialogService } from '@/components/Dialog/DialogService';
import { ToastService } from '@/components/Toast/ToastService';
import { LoadingService, AppLoadingRef } from '@/components/Loading/LoadingService'; // AppLoadingRef buradan import ediliyor
import { BottomSheetService } from '@/components/BottomSheet/BottomSheetService';
import { InputDialogService } from '@/components/Dialog/InputDialogService';

export const GlobalUIProvider = ({ children }: { children: ReactNode }) => {
  // Her bir global bileşen için ref callback'i oluşturuluyor
  const toastRefCallback = useCallback((node: AppToastRef | null) => { if (node) ToastService.setRef(node); }, []);
  const dialogRefCallback = useCallback((node: AppDialogRef | null) => { if (node) DialogService.setRef(node); }, []);
  const bottomSheetRefCallback = useCallback((node: AppBottomSheetRef | null) => { if (node) BottomSheetService.setRef(node); }, []);
  const inputDialogRefCallback = useCallback((node: InputDialogRef | null) => { if (node) InputDialogService.setRef(node); }, []);
  
  // Loading servisi için ref callback'i
  const loadingRefCallback = useCallback((node: AppLoadingRef | null) => {
    // Bu callback, AppLoading bileşeni render edildiğinde çalışır ve ref'i LoadingService'e atar.
    if (node) {
      LoadingService.setRef(node);
    }
  }, []);

  return (
    <>
      {children}

      {/* Global UI Bileşenleri */}
      <AppToast ref={toastRefCallback} />
      <AppDialog ref={dialogRefCallback} />
      <AppBottomSheet ref={bottomSheetRefCallback} />
      <InputDialog ref={inputDialogRefCallback} />

      {/* AppLoading bileşeni ref ile birlikte burada render edilir. */}
      <AppLoading ref={loadingRefCallback} />
    </>
  );
};