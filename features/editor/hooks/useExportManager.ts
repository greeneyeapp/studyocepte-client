// client/features/editor/hooks/useExportManager.ts - DÜZELTİLMİŞ VE ROBUST REF KONTROLÜ EKLENDİ
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
  const viewRef = createRef<View>(); // Bu ref, EditorPreview'ın root Animated.View'ine atanacak.
  const settings = useEnhancedEditorStore(state => state.settings);

  const shareWithOption = async (shareOption: ShareOption, preset?: ExportPreset) => {
    if (!preset && shareOption.type !== 'quick_custom') {
      ToastService.show('Lütfen bir format seçin');
      return;
    }

    setIsExporting(true);
    LoadingService.show(); // Yükleme animasyonunu göster

    try {
      // YENİ ROBUST REF BEKLEME MEKANİZMASI
      let retries = 0;
      const maxRetries = 100; // Yaklaşık 5 saniye (50ms * 100)
      const retryInterval = 50; // Her 50ms'de bir kontrol et

      console.log('🔍 Waiting for viewRef.current to be available...');
      while (!viewRef.current && retries < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, retryInterval));
        retries++;
      }

      // viewRef.current'in hala null olup olmadığını tekrar kontrol et
      if (!viewRef.current) {
        console.error('❌ Error: viewRef.current is still null after waiting.');
        ToastService.show('Önizleme hazır değil. Lütfen tekrar deneyin.');
        throw new Error('Preview view reference is null.'); // Hata fırlat ki finally bloğu çalışsın
      } else {
        console.log(`✅ viewRef.current is available after ${retries * retryInterval}ms.`);
      }

      const exportPreset = preset || {
        id: 'quick_default', name: 'Hızlı Export', description: 'Varsayılan boyut',
        dimensions: { width: 1080, height: 1080 }, format: 'png' as const, quality: 0.95,
        category: 'custom' as const, icon: 'zap',
      };

      console.log('🖼️ Capturing view with settings:', {
        format: exportPreset.format,
        quality: exportPreset.quality,
        width: exportPreset.dimensions.width,
        height: exportPreset.dimensions.height,
      });

      // Görüntüyü yakala
      const uri = await captureRef(viewRef, {
        format: exportPreset.format === 'png' ? 'png' : 'jpg',
        quality: exportPreset.quality,
        width: exportPreset.dimensions.width,
        height: exportPreset.dimensions.height,
        result: 'tmpfile',
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

      ToastService.show(successMessage);

    } catch (error: any) {
      console.error('❌ Export failed:', error);
      // Hata zaten yukarıda `throw` edildiği için `ToastService.show` çağrısı sadece bir kez yapılır
      if (error.message !== 'Preview view reference is null.') { // Aynı hatayı tekrar göstermemek için
        ToastService.show(error.message || 'Bilinmeyen bir hata oluştu');
      }
    } finally {
      setIsExporting(false);
      LoadingService.hide(); // Yükleme animasyonunu gizle
    }
  };

  return {
    isExporting,
    skiaViewRef: viewRef, // Bu ref, EditorPreview'ın root Animated.View'ine atanır.
    shareWithOption
  };
};