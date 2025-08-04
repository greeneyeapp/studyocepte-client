// client/features/editor/hooks/useExportManager.ts - TAM VE YENİLENMİŞ KOD
import { useState, createRef } from 'react';
import { View } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as FileSystem from 'expo-file-system';
import { ExportService } from '@/services/exportService';
import { ExportPreset, ShareOption } from '../config/exportTools';
import { ToastService } from '@/components/Toast/ToastService';
import { LoadingService } from '@/components/Loading/LoadingService';
import { useEnhancedEditorStore } from '@/stores/useEnhancedEditorStore';

export const useExportManager = () => {
  const [isExporting, setIsExporting] = useState(false);
  const viewRef = createRef<View>();
  const settings = useEnhancedEditorStore(state => state.settings);

  const shareWithOption = async (shareOption: ShareOption, preset?: ExportPreset) => {
    if (!preset && shareOption.type !== 'quick_custom') {
      ToastService.show({ type: 'error', text1: 'Hata', text2: 'Lütfen bir format seçin' });
      return;
    }

    if (!viewRef.current) {
      ToastService.show({ type: 'error', text1: 'Hata', text2: 'Önizleme hazır değil.' });
      return;
    }

    const exportPreset = preset || {
      id: 'quick_default', name: 'Hızlı Export', description: 'Varsayılan boyut',
      dimensions: { width: 1080, height: 1080 }, format: 'png' as const, quality: 0.95,
      category: 'custom' as const, icon: 'zap',
    };

    setIsExporting(true);
    LoadingService.show(`${exportPreset.name} formatında işleniyor...`);

    try {
      console.log('🖼️ Capturing view with settings:', {
        format: exportPreset.format,
        quality: exportPreset.quality,
        width: exportPreset.dimensions.width,
        height: exportPreset.dimensions.height,
      });

      // Önce geçici dosyaya render et
      const uri = await captureRef(viewRef, {
        format: exportPreset.format === 'png' ? 'png' : 'jpg',
        quality: exportPreset.quality,
        width: exportPreset.dimensions.width,
        height: exportPreset.dimensions.height,
        result: 'tmpfile', // base64 yerine tmpfile kullan
      });

      if (!uri) {
        throw new Error("Görüntü geçici dosyaya oluşturulamadı.");
      }

      // Geçici dosyayı base64 olarak oku
      const base64Data = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      console.log('✅ View captured to temp file and read as base64.');

      await ExportService.shareWithOption({
        shareOption,
        preset: exportPreset,
        base64Data,
        filename: `studyo-cepte-${exportPreset.id}-${Date.now()}.${exportPreset.format}`,
      });

      let successMessage = '';
      if (shareOption.type === 'gallery') {
        successMessage = `${exportPreset.name} formatında galeriye kaydedildi`;
      } else if (shareOption.type === 'quick_custom') {
        successMessage = `Özel boyutta görüntü galeriye kaydedildi`;
      } else {
        successMessage = `${exportPreset.name} formatında paylaşım başarılı`;
      }

      ToastService.show({ type: 'success', text1: 'Başarılı', text2: successMessage });

    } catch (error: any) {
      console.error('❌ Export failed:', error);
      ToastService.show({ type: 'error', text1: 'Export Başarısız', text2: error.message || 'Bilinmeyen bir hata oluştu' });
    } finally {
      setIsExporting(false);
      LoadingService.hide();
    }
  };

  return {
    isExporting,
    skiaViewRef: viewRef,
    shareWithOption
  };
};