// kodlar/context/GlobalUIProvider.tsx
import React, { createContext, useCallback, ReactNode, useRef } from 'react';
import AppToast, { AppToastRef } from '@/components/Toast/AppToast';
import AppDialog, { AppDialogRef } from '@/components/Dialog/AppDialog';
import AppLoading, { AppLoadingRef } from '@/components/Loading/AppLoading';
import AppBottomSheet, { AppBottomSheetRef } from '@/components/BottomSheet/AppBottomSheet';
import InputDialog, { InputDialogRef } from '@/components/Dialog/InputDialog';
import { DialogService } from '@/components/Dialog/DialogService';
import { ToastService } from '@/components/Toast/ToastService';
import { LoadingService } from '@/components/Loading/LoadingService';
import { BottomSheetService } from '@/components/BottomSheet/BottomSheetService';
import { InputDialogService } from '@/components/Dialog/InputDialogService';

interface GlobalUIRefs {
  toast: AppToastRef | null;
  dialog: AppDialogRef | null;
  loading: AppLoadingRef | null;
  bottomSheet: AppBottomSheetRef | null;
  inputDialog: InputDialogRef | null;
}

export const GlobalUIProvider = ({ children }: { children: ReactNode }) => {
  const toastRefCallback = useCallback((node: AppToastRef | null) => { if (node) ToastService.setRef(node); }, []);
  const dialogRefCallback = useCallback((node: AppDialogRef | null) => { if (node) DialogService.setRef(node); }, []);
  const loadingRefCallback = useCallback((node: AppLoadingRef | null) => { if (node) LoadingService.setRef(node); }, []);
  const bottomSheetRefCallback = useCallback((node: AppBottomSheetRef | null) => { if (node) BottomSheetService.setRef(node); }, []);
  const inputDialogRefCallback = useCallback((node: InputDialogRef | null) => { if (node) InputDialogService.setRef(node); }, []);

  return (
    <>
      {children}
      <AppToast ref={toastRefCallback} />
      <AppDialog ref={dialogRefCallback} />
      <AppLoading ref={loadingRefCallback} />
      <AppBottomSheet ref={bottomSheetRefCallback} />
      <InputDialog ref={inputDialogRefCallback} />
    </>
  );
};