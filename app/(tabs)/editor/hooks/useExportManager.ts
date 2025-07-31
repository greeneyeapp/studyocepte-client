// app/(tabs)/editor/hooks/useExportManager.ts
import { useState, useRef } from 'react';
import { ExportService } from '@/services/exportService';
import { ExportPreset, ShareOption, EXPORT_PRESETS } from '../config/exportTools';
import { ToastService } from '@/components/Toast/ToastService';
import { LoadingService } from '@/components/Loading/LoadingService';

interface ExportState {
  selectedPreset: ExportPreset | null;
  isExporting: boolean;
  exportProgress: number;
  lastExportedFile: string | null;
}

export const useExportManager = () => {
  const [state, setState] = useState<ExportState>({
    selectedPreset: EXPORT_PRESETS[0], // Instagram Square varsayılan
    isExporting: false,
    exportProgress: 0,
    lastExportedFile: null,
  });

  const previewRef = useRef<any>(null);

  const setSelectedPreset = (preset: ExportPreset) => {
    setState(prev => ({
      ...prev,
      selectedPreset: preset,
    }));
  };

  const exportWithPreset = async (preset: ExportPreset, filename?: string) => {
    if (!previewRef.current) {
      ToastService.show({
        type: 'error',
        text1: 'Hata',
        text2: 'Önizleme hazır değil. Lütfen bekleyin.',
      });
      return null;
    }

    setState(prev => ({ ...prev, isExporting: true, exportProgress: 0 }));
    LoadingService.show();

    try {
      const fileUri = await ExportService.captureAndExport({
        preset,
        viewRef: previewRef.current,
        filename,
      });

      setState(prev => ({
        ...prev,
        lastExportedFile: fileUri,
        isExporting: false,
        exportProgress: 100,
      }));

      LoadingService.hide();
      
      ToastService.show({
        type: 'success',
        text1: 'Export Başarılı',
        text2: `${preset.name} formatında export edildi`,
      });

      return fileUri;
    } catch (error: any) {
      setState(prev => ({ ...prev, isExporting: false, exportProgress: 0 }));
      LoadingService.hide();
      
      ToastService.show({
        type: 'error',
        text1: 'Export Başarısız',
        text2: error.message || 'Bilinmeyen bir hata oluştu',
      });

      throw error;
    }
  };

  const shareWithOption = async (shareOption: ShareOption, preset?: ExportPreset) => {
    const targetPreset = preset || state.selectedPreset;
    
    if (!targetPreset) {
      ToastService.show({
        type: 'error',
        text1: 'Hata',
        text2: 'Lütfen bir format seçin',
      });
      return;
    }

    if (!previewRef.current) {
      ToastService.show({
        type: 'error',
        text1: 'Hata',
        text2: 'Önizleme hazır değil. Lütfen bekleyin.',
      });
      return;
    }

    setState(prev => ({ ...prev, isExporting: true }));
    LoadingService.show();

    try {
      await ExportService.shareWithOption({
        shareOption,
        preset: targetPreset,
        viewRef: previewRef.current,
        filename: `studyo-cepte-${targetPreset.id}-${Date.now()}.${targetPreset.format}`,
      });

      setState(prev => ({ ...prev, isExporting: false }));
      LoadingService.hide();

      // Paylaşım türüne göre farklı mesajlar
      const successMessage = shareOption.type === 'gallery' 
        ? 'Galeriye kaydedildi' 
        : `${shareOption.name} ile paylaşıldı`;

      ToastService.show({
        type: 'success',
        text1: 'Başarılı',
        text2: successMessage,
      });

    } catch (error: any) {
      setState(prev => ({ ...prev, isExporting: false }));
      LoadingService.hide();

      ToastService.show({
        type: 'error',
        text1: 'Paylaşım Başarısız',
        text2: error.message || 'Bilinmeyen bir hata oluştu',
      });
    }
  };

  const batchExport = async (presets: ExportPreset[]) => {
    if (!previewRef.current) {
      ToastService.show({
        type: 'error',
        text1: 'Hata',
        text2: 'Önizleme hazır değil. Lütfen bekleyin.',
      });
      return [];
    }

    setState(prev => ({ ...prev, isExporting: true, exportProgress: 0 }));
    LoadingService.show();

    try {
      const results = await ExportService.batchExport(
        previewRef.current,
        presets,
        (current, total) => {
          const progress = (current / total) * 100;
          setState(prev => ({ ...prev, exportProgress: progress }));
        }
      );

      setState(prev => ({ ...prev, isExporting: false, exportProgress: 100 }));
      LoadingService.hide();

      ToastService.show({
        type: 'success',
        text1: 'Toplu Export Başarılı',
        text2: `${results.length} dosya export edildi`,
      });

      return results;
    } catch (error: any) {
      setState(prev => ({ ...prev, isExporting: false, exportProgress: 0 }));
      LoadingService.hide();

      ToastService.show({
        type: 'error',
        text1: 'Toplu Export Başarısız',
        text2: error.message || 'Bilinmeyen bir hata oluştu',
      });

      return [];
    }
  };

  const createPreview = async () => {
    if (!previewRef.current) return null;

    try {
      return await ExportService.createPreview(previewRef.current);
    } catch (error) {
      console.error('Önizleme oluşturulamadı:', error);
      return null;
    }
  };

  return {
    // State
    selectedPreset: state.selectedPreset,
    isExporting: state.isExporting,
    exportProgress: state.exportProgress,
    lastExportedFile: state.lastExportedFile,
    
    // Refs
    previewRef,
    
    // Actions
    setSelectedPreset,
    exportWithPreset,
    shareWithOption,
    batchExport,
    createPreview,
  };
};