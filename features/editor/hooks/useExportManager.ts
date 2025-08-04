// features/editor/hooks/useExportManager.ts - NO SKIA VERSION
import { useState, createRef } from 'react';
import { View } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import { ExportService } from '@/services/exportService';
import { ExportPreset, ShareOption } from '../config/exportTools';
import { ToastService } from '@/components/Toast/ToastService';
import { LoadingService } from '@/components/Loading/LoadingService';
import { useEnhancedEditorStore } from '@/stores/useEnhancedEditorStore';

export const useExportManager = () => {
  const [isExporting, setIsExporting] = useState(false);
  const viewRef = createRef<View>();
  const settings = useEnhancedEditorStore(state => state.settings);

  const shareWithOption = async (shareOption: ShareOption, preset: ExportPreset) => {
    if (!preset) {
      ToastService.show({ type: 'error', text1: 'Hata', text2: 'Lütfen bir format seçin' });
      return;
    }
    if (!viewRef.current) {
      ToastService.show({ type: 'error', text1: 'Hata', text2: 'Önizleme hazır değil.' });
      return;
    }

    setIsExporting(true);
    LoadingService.show("Görüntü İşleniyor..."); 

    try {
      // React Native View Shot kullanarak capture et
      const uri = await captureRef(viewRef, {
        format: preset.format === 'png' ? 'png' : 'jpg', 
        quality: preset.quality,
        width: preset.dimensions.width,
        height: preset.dimensions.height,
        result: 'base64',
      });

      if (!uri) {
        throw new Error("Görüntü oluşturulamadı.");
      }
      
      await ExportService.shareWithOption({
        shareOption,
        preset,
        base64Data: uri,
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
    skiaViewRef: viewRef, // Eski isimlendirmeyi koruyalım compatibility için
    shareWithOption 
  };
};