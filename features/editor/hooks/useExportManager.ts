// client/features/editor/hooks/useExportManager.ts (TAM VE HATASIZ KOD)
import { useState, createRef } from 'react';
import { Skia, type SkiaView } from '@shopify/react-native-skia'; // ÇÖZÜM: SkiaView'ı 'type' olarak import et.
import { ExportService } from '@/services/exportService';
import { ExportPreset, ShareOption } from '../config/exportTools';
import { ToastService } from '@/components/Toast/ToastService'; // ÇÖZÜM: Eksik import eklendi.
import { useEnhancedEditorStore } from '@/stores/useEnhancedEditorStore';

export const useExportManager = () => {
  const [isExporting, setIsExporting] = useState(false);
  const skiaViewRef = createRef<SkiaView>();
  const settings = useEnhancedEditorStore(state => state.settings);

  const shareWithOption = async (shareOption: ShareOption, preset: ExportPreset) => {
    if (!preset) {
      ToastService.show({ type: 'error', text1: 'Hata', text2: 'Lütfen bir format seçin' });
      return;
    }
    if (!skiaViewRef.current) {
      ToastService.show({ type: 'error', text1: 'Hata', text2: 'Önizleme hazır değil.' });
      return;
    }

    setIsExporting(true);
    LoadingService.show("Görüntü İşleniyor..."); 

    try {
      const snapshot = await skiaViewRef.current.makeImageSnapshot({
        x: 0,
        y: 0,
        width: preset.dimensions.width,
        height: preset.dimensions.height,
      });

      if (!snapshot) throw new Error("Görüntü oluşturulamadı.");
      
      const base64 = snapshot.encodeToBase64(preset.format === 'png' ? 0 : 1, preset.quality * 100);

      if (!base64) throw new Error("Görüntü kodlanamadı.");
      
      await ExportService.shareWithOption({
        shareOption,
        preset,
        base64Data: base64,
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

  return { isExporting, skiaViewRef, shareWithOption };
};