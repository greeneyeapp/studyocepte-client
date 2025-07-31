// kodlar/app/(tabs)/editor/hooks/useExportManager.ts
import { useState, useRef } from 'react';
import { ExportService } from '@/services/exportService';
import { ExportPreset, ShareOption } from '../config/exportTools';
import { ToastService } from '@/components/Toast/ToastService';
import { LoadingService } from '@/components/Loading/LoadingService';

export const useExportManager = () => {
  const [isExporting, setIsExporting] = useState(false);
  const previewRef = useRef<any>(null);

  const shareWithOption = async (shareOption: ShareOption, preset: ExportPreset) => {
    if (!preset) {
      ToastService.show({ type: 'error', text1: 'Hata', text2: 'Lütfen bir format seçin' });
      return;
    }
    if (!previewRef.current) {
      ToastService.show({ type: 'error', text1: 'Hata', text2: 'Önizleme hazır değil.' });
      return;
    }

    setIsExporting(true);
    LoadingService.show();

    try {
      await ExportService.shareWithOption({
        shareOption,
        preset,
        viewRef: previewRef.current,
        filename: `studyo-cepte-${preset.id}-${Date.now()}.${preset.format}`,
      });
      
      const successMessage = shareOption.type === 'gallery' ? 'Galeriye kaydedildi' : 'Paylaşım başarılı';
      ToastService.show({ type: 'success', text1: 'Başarılı', text2: successMessage });

    } catch (error: any) {
      ToastService.show({ type: 'error', text1: 'İşlem Başarısız', text2: error.message || 'Bilinmeyen bir hata oluştu' });
    } finally {
      setIsExporting(false);
      LoadingService.hide();
    }
  };

  return {
    isExporting,
    previewRef,
    shareWithOption,
  };
};