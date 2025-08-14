// features/editor/hooks/useExportManager.ts - YÜKSEK KALİTE EXPORT SİSTEMİ
import { useState, useRef, useCallback } from 'react';
import { View } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as FileSystem from 'expo-file-system';
import { ExportService } from '@/services/exportService';
import { ExportPreset, ShareOption } from '../config/exportTools';
import { ToastService } from '@/components/Toast/ToastService';
import { LoadingService } from '@/components/Loading/LoadingService';
import { useEnhancedEditorStore } from '@/stores/useEnhancedEditorStore';
import { useTranslation } from 'react-i18next'; // useTranslation import edildi

export const useExportManager = () => {
  const { t } = useTranslation(); // t hook'u kullanıldı
  const [isExporting, setIsExporting] = useState(false);
  const viewRef = useRef<View>(null);
  const settings = useEnhancedEditorStore(state => state.settings);

  /**
   * ⭐ YÜKSEK KALİTE: Ref'in hazır olmasını bekler ve retry mekanizması ile çalışır
   */
  const waitForViewRef = async (maxRetries: number = 60, retryInterval: number = 100): Promise<boolean> => {
    console.log('🔍 HIGH QUALITY ref waiting started...', { maxRetries, retryInterval });
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const hasDirectRef = !!viewRef.current;
      
      // Test capture ile gerçek hazırlığı kontrol et
      if (hasDirectRef) {
        try {
          // ⭐ YÜKSEK KALİTE: Test capture boyutu artırıldı
          const testResult = await captureRef(viewRef, {
            format: 'png',
            quality: 1.0, // 0.5 → 1.0 (yüksek kalite test)
            width: 200,   // 100 → 200 (daha büyük test boyutu)
            height: 200,  // 100 → 200
            result: 'tmpfile',
          });
          
          // Test dosyasını hemen sil
          try {
            await FileSystem.deleteAsync(testResult, { idempotent: true });
          } catch {}
          
          console.log(`✅ HIGH QUALITY ref ready and working! Attempt: ${attempt}/${maxRetries}`);
          return true;
          
        } catch (captureError) {
          console.log(`⚠️ Ref exists but capture failed (${attempt}/${maxRetries}):`, captureError.message);
        }
      } else {
        console.log(`🔍 Ref not available yet (${attempt}/${maxRetries})`);
      }
      
      // Her 10 denemede bir progress logu
      if (attempt % 10 === 0) {
        console.log(`⏳ HIGH QUALITY ref waiting... ${attempt}/${maxRetries} (${(attempt * retryInterval)}ms) - hasRef: ${hasDirectRef}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, retryInterval));
    }
    
    console.error(`❌ HIGH QUALITY ref not ready after ${maxRetries * retryInterval}ms`);
    return false;
  };

  /**
   * ⭐ YÜKSEK KALİTE: RETRY MEKANİZMASI ile export fonksiyonu
   */
  const shareWithOption = async (shareOption: ShareOption, preset?: ExportPreset) => {
    // preset artık her zaman zorunlu. quick_custom kaldırıldığı için artık null olamaz.
    if (!preset) {
      ToastService.show(t('editor.noSelection')); // Lokalize edildi
      return;
    }

    setIsExporting(true);
    LoadingService.show();

    try {
      // 1. Ref'in hazır olmasını bekle - daha uzun süre
      console.log('🔄 HIGH QUALITY export starting, waiting for ref...');
      const refReady = await waitForViewRef(60, 100); // 6 saniye toplam
      
      if (!refReady) {
        throw new Error(t('editor.refNotReady')); // Lokalize edildi
      }

      console.log('✅ HIGH QUALITY ref validated, starting capture...');

      // 2. Debug bilgisi
      console.log('🔍 HIGH QUALITY final ref check:', {
        refExists: !!viewRef.current,
        refType: viewRef.current?.constructor?.name || 'undefined',
        hasNativeProps: !!(viewRef.current as any)?.setNativeProps,
        canMeasure: !!(viewRef.current as any)?.measure,
      });

      // preset artık doğrudan kullanılıyor, varsayılan (quick_default) kaldırıldı
      const exportPreset = preset;

      console.log('🖼️ HIGH QUALITY capture starting...', {
        format: exportPreset.format,
        quality: exportPreset.quality,
        dimensions: exportPreset.dimensions,
      });

      // 3. ⭐ SÜPER YÜKSEK KALİTE: ÜÇ AŞAMALI CAPTURE SİSTEMİ
      console.log('🖼️ Starting SUPER HIGH QUALITY three-stage capture system...');
      
      // Aşama 1: ULTRA yüksek çözünürlükte PNG capture (kayıpsız)
      const ultraHighResWidth = Math.max(4096, exportPreset.dimensions.width * 2); // 2x büyük
      const ultraHighResHeight = Math.max(4096, exportPreset.dimensions.height * 2);
      
      console.log('📸 Stage 1: ULTRA HIGH RES capture...', { ultraHighResWidth, ultraHighResHeight });
      
      const ultraHighResUri = await captureRef(viewRef, {
        format: 'png', // PNG = lossless
        quality: 1.0,   // Maksimum kalite
        width: ultraHighResWidth,
        height: ultraHighResHeight,
        result: 'tmpfile',
        snapshotContentContainer: false,
      });

      console.log('✅ ULTRA HIGH RES capture completed:', ultraHighResUri);

      // Aşama 2: Yüksek kalite ara resize (1.5x hedef boyut)
      const { manipulateAsync, SaveFormat } = await import('expo-image-manipulator');
      
      const intermediateWidth = exportPreset.dimensions.width * 1.5; // 1.5x hedef boyut
      const intermediateHeight = exportPreset.dimensions.height * 1.5;
      
      console.log('📸 Stage 2: Intermediate resize...', { intermediateWidth, intermediateHeight });
      
      const intermediateResult = await manipulateAsync(
        ultraHighResUri,
        [
          {
            resize: {
              width: intermediateWidth,
              height: intermediateHeight,
            }
          }
        ],
        {
          compress: 1.0, // Maksimum kalite
          format: SaveFormat.PNG, // PNG for best quality
        }
      );

      console.log('✅ Intermediate resize completed:', intermediateResult.uri);

      // Aşama 3: Final hedef boyuta optimize resize
      console.log('📸 Stage 3: Final optimize resize...');
      
      const finalResult = await manipulateAsync(
        intermediateResult.uri,
        [
          {
            resize: {
              width: exportPreset.dimensions.width,
              height: exportPreset.dimensions.height,
            }
          }
        ],
        {
          compress: Math.max(0.98, exportPreset.quality), // Minimum %98 kalite
          format: exportPreset.format === 'png' ? SaveFormat.PNG : SaveFormat.JPEG,
        }
      );

      console.log('✅ SUPER HIGH QUALITY final resize completed:', finalResult.uri);

      // Geçici dosyaları temizle
      const cleanupFiles = [ultraHighResUri, intermediateResult.uri];
      for (const fileUri of cleanupFiles) {
        try {
          await FileSystem.deleteAsync(fileUri, { idempotent: true });
        } catch (cleanupError) {
          console.warn('⚠️ Cleanup warning for:', fileUri, cleanupError);
        }
      }

      const uri = finalResult.uri;

      if (!uri) {
        throw new Error(t('editor.imageNotCreated')); // Lokalize edildi
      }

      console.log('✅ SUPER HIGH QUALITY capture completed:', uri);

      // 4. Base64'e çevir
      const base64Data = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      console.log('✅ HIGH QUALITY base64 conversion completed, size:', base64Data.length);

      // 5. Export servis ile paylaş
      await ExportService.shareWithOption({
        shareOption,
        preset: exportPreset,
        base64Data,
        filename: `studyo-cepte-hq-${exportPreset.id}-${Date.now()}.${exportPreset.format}`,
      });

      // 6. Başarı mesajı
      let successMessage = '';
      if (shareOption.type === 'gallery') {
        successMessage = t('editor.exportSuccessGallery'); // Lokalize edildi
      } else { // quick_custom kaldırıldığı için artık sadece generic kaldı
        successMessage = t('editor.exportSuccessShare'); // Lokalize edildi
      }

      ToastService.show(successMessage);
      console.log('🎉 SUPER HIGH QUALITY export process completed successfully');

    } catch (error: any) { // error type any eklendi
      console.error('❌ HIGH QUALITY export failed:', error);
      
      // Kullanıcı dostu hata mesajları
      let userMessage = error.message;
      
      if (userMessage.includes('timeout')) {
        userMessage = t('editor.exportFailedTimeout'); // Lokalize edildi
      } else if (userMessage.includes('capture') || userMessage.includes('preview')) {
        userMessage = t('editor.exportFailedCapture'); // Lokalize edildi
      } else if (userMessage.includes('permission') || userMessage.includes('Gallery access')) {
        userMessage = t('editor.exportFailedPermission'); // Lokalize edildi
      } else if (userMessage.includes('image not created')) {
        userMessage = t('editor.imageNotCreated'); // Lokalize edildi
      } else {
        userMessage = t('editor.exportFailed'); // Genel hata mesajı
      }
      
      ToastService.show(userMessage);
      
    } finally {
      setIsExporting(false);
      LoadingService.hide();
    }
  };

  /**
   * ⭐ DEBUG: Ref durumunu kontrol etmek için yardımcı fonksiyon
   */
  const debugRefStatus = useCallback(() => {
    console.log('🔍 HIGH QUALITY ref debug info:', {
      refExists: !!viewRef.current,
      refType: viewRef.current?.constructor?.name,
      timestamp: Date.now()
    });
  }, [viewRef]);

  return {
    isExporting,
    skiaViewRef: viewRef, // EditorPreview'da kullanılacak
    shareWithOption,
    debugRefStatus, // Development için
    
    // Export durumu kontrolü
    isRefReady: !!viewRef.current,
  };
};