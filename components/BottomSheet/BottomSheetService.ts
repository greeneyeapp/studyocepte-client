// kodlar/components/BottomSheet/BottomSheetService.ts
import { AppBottomSheetRef, BottomSheetOptions } from './AppBottomSheet';

let serviceRef: AppBottomSheetRef | null = null;

export const BottomSheetService = {
  setRef: (ref: AppBottomSheetRef | null) => {
    serviceRef = ref;
  },
  show: (options: BottomSheetOptions) => {
    if (serviceRef) {
      serviceRef.show(options);
    } else {
      console.warn('AppBottomSheetRef is not set. Cannot display bottom sheet.');
    }
  },
  hide: () => {
    if (serviceRef) {
      serviceRef.hide();
    }
  },
};