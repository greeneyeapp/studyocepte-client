// features/editor/hooks/useExportManager.ts - AKILLI REF BEKLEME SİSTEMİ
import { useState, useRef, useCallback } from 'react';
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
  const viewRef = useRef<View>(null); // ✅ createRef yerine useRef kullan
  const settings = useEnhancedEditorStore(state => state.settings);

  /**
   * ✅ AKILLI REF BEKLEME: Ref'in hazır olmasını bekler ve retry mekanizması ile çalışır
   */
  const waitForViewRef = async (maxRetries: number = 50, retryInterval: number = 100): Promise<boolean> => {
    console.log('🔍 Akıllı ref bekleme başladı...', { maxRetries, retryInterval });
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      // ✅ DÜZELTME: Hem direkt ref'i hem de imperative handle'ı kontrol et
      const hasDirectRef = !!viewRef.current;
      
      // Test capture ile gerçek hazırlığı kontrol et
      if (hasDirectRef) {
        try {
          // Mini test capture - eğer bu başarılıysa ref kullanılabilir
          const testResult = await captureRef(viewRef, {
            format: 'png',
            quality: 0.5, // Test için düşük kalite yeterli
            width: 100,
            height: 100,
            result: 'tmpfile',
          });
          
          // Test dosyasını hemen sil
          try {
            await FileSystem.deleteAsync(testResult, { idempotent: true });
          } catch {}
          
          console.log(`✅ Ref hazır ve çalışıyor! Deneme: ${attempt}/${maxRetries}`);
          return true;
          
        } catch (captureError) {
          console.log(`⚠️ Ref mevcut ama capture başarısız (${attempt}/${maxRetries}):`, captureError.message);
        }
      } else {
        console.log(`🔍 Ref henüz mevcut değil (${attempt}/${maxRetries})`);
      }
      
      // Her 10 denemede bir progress logu
      if (attempt % 10 === 0) {
        console.log(`⏳ Ref bekleniyor... ${attempt}/${maxRetries} (${(attempt * retryInterval)}ms) - hasRef: ${hasDirectRef}`);
      }
      
      // Belirtilen süre kadar bekle
      await new Promise(resolve => setTimeout(resolve, retryInterval));
    }
    
    console.error(`❌ Ref ${maxRetries * retryInterval}ms sonra hala kullanılabilir değil`);
    return false;
  };

  /**
   * ✅ REF HAZIRLIK KONTROLÜ: Ref'in gerçekten kullanılabilir olup olmadığını test eder
   */
  const validateViewRef = async (): Promise<boolean> => {
    if (!viewRef.current) {
      console.error('❌ viewRef.current null');
      return false;
    }

    try {
      // Test capture ile ref'in çalışıp çalışmadığını kontrol et
      console.log('🧪 Ref test capture yapılıyor...');
      
      const testCapture = await captureRef(viewRef, {
        format: 'png',
        quality: 0.1, // Düşük kalite, sadece test amaçlı
        width: 100,
        height: 100,
        result: 'tmpfile',
      });

      console.log('✅ Test capture başarılı:', testCapture);
      
      // Test dosyasını hemen sil
      try {
        await FileSystem.deleteAsync(testCapture, { idempotent: true });
      } catch (cleanupError) {
        console.warn('⚠️ Test dosyası silinirken uyarı:', cleanupError);
      }
      
      return true;
      
    } catch (error) {
      console.error('❌ Ref validation başarısız:', error);
      return false;
    }
  };

  /**
   * ✅ RETRY MEKANİZMASI ile export fonksiyonu
   */
  const shareWithOption = async (shareOption: ShareOption, preset?: ExportPreset) => {
    if (!preset && shareOption.type !== 'quick_custom') {
      ToastService.show('Lütfen bir format seçin');
      return;
    }

    setIsExporting(true);
    LoadingService.show();

    try {
      // 1. Ref'in hazır olmasını bekle
      console.log('🔄 Export başlatılıyor, ref bekleniyor...');
      const refReady = await waitForViewRef(50, 100); // 5 saniye toplam, daha kısa ve etkili
      
      if (!refReady) {
        throw new Error('Önizleme görüntüsü hazır değil. Lütfen tekrar deneyin.');
      }

      // 2. ✅ DÜZELTME: Validation adımını atlayalım, zaten waitForViewRef'te test yapıyoruz
      console.log('✅ Ref doğrulandı, asıl capture başlatılıyor...');

      // 3. ✅ Son bir debug kontrolü
      console.log('🔍 Final ref check:', {
        refExists: !!viewRef.current,
        refType: viewRef.current?.constructor?.name || 'undefined',
        hasNativeProps: !!(viewRef.current as any)?.setNativeProps,
        canMeasure: !!(viewRef.current as any)?.measure,
      });
      const exportPreset = preset || {
        id: 'quick_default', 
        name: 'Hızlı Export', 
        description: 'Varsayılan boyut',
        dimensions: { width: 1080, height: 1080 }, 
        format: 'png' as const, 
        quality: 0.95,
        category: 'custom' as const, 
        icon: 'zap',
      };

      console.log('🖼️ Asıl capture başlatılıyor...', {
        format: exportPreset.format,
        quality: exportPreset.quality,
        dimensions: exportPreset.dimensions,
      });

      // 5. ✅ İKİ AŞAMALI YÜKSEK KALİTE CAPTURE
      console.log('🖼️ İki aşamalı yüksek kalite capture başlatılıyor...');
      
      // Aşama 1: Yüksek çözünürlükte PNG capture (kalite kaybı yok)
      const highResUri = await captureRef(viewRef, {
        format: 'png', // PNG = lossless
        quality: 1.0,   // Maximum kalite
        width: Math.max(2048, exportPreset.dimensions.width * 1.5), // %50 daha büyük
        height: Math.max(2048, exportPreset.dimensions.height * 1.5),
        result: 'tmpfile',
        snapshotContentContainer: false,
      });

      console.log('✅ Yüksek çözünürlük capture tamamlandı:', highResUri);

      // Aşama 2: Hedef boyuta scale et (manipulateAsync ile kaliteli)
      const { manipulateAsync, SaveFormat } = await import('expo-image-manipulator');
      
      const finalResult = await manipulateAsync(
        highResUri,
        [
          {
            resize: {
              width: exportPreset.dimensions.width,
              height: exportPreset.dimensions.height,
            }
          }
        ],
        {
          compress: Math.max(0.95, exportPreset.quality), // Minimum %95
          format: exportPreset.format === 'png' ? SaveFormat.PNG : SaveFormat.JPEG,
        }
      );

      console.log('✅ Final resize ve compression tamamlandı:', finalResult.uri);

      // Yüksek çözünürlük dosyasını temizle
      try {
        await FileSystem.deleteAsync(highResUri, { idempotent: true });
      } catch (cleanupError) {
        console.warn('⚠️ High-res dosya temizlik uyarısı:', cleanupError);
      }

      const uri = finalResult.uri;

      if (!uri) {
        throw new Error("Görüntü oluşturulamadı.");
      }

      console.log('✅ Asıl capture başarılı:', uri);

      // 6. Base64'e çevir
      const base64Data = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      console.log('✅ Base64 dönüşüm tamamlandı, boyut:', base64Data.length);

      // 7. Export servis ile paylaş
      await ExportService.shareWithOption({
        shareOption,
        preset: exportPreset,
        base64Data,
        filename: `studyo-cepte-${exportPreset.id}-${Date.now()}.${exportPreset.format}`,
      });

      // 8. Başarı mesajı
      let successMessage = '';
      if (shareOption.type === 'gallery') {
        successMessage = `${exportPreset.name} formatında galeriye kaydedildi`;
      } else if (shareOption.type === 'quick_custom') {
        successMessage = `Özel boyutta görüntü galeriye kaydedildi`;
      } else {
        successMessage = `${exportPreset.name} formatında paylaşım başarılı`;
      }

      ToastService.show(successMessage);
      console.log('🎉 Export işlemi başarıyla tamamlandı');

    } catch (error: any) {
      console.error('❌ Export başarısız:', error);
      
      // Kullanıcı dostu hata mesajları
      let userMessage = error.message;
      
      if (error.message.includes('timeout') || error.message.includes('null')) {
        userMessage = 'Görüntü hazırlanırken zaman aşımı. Lütfen tekrar deneyin.';
      } else if (error.message.includes('capture')) {
        userMessage = 'Görüntü yakalanırken hata oluştu. Editöre geri dönüp tekrar deneyin.';
      } else if (error.message.includes('permission')) {
        userMessage = 'Galeri izni gerekli. Ayarlardan izin verin.';
      }
      
      ToastService.show(userMessage);
      
    } finally {
      setIsExporting(false);
      LoadingService.hide();
    }
  };

  /**
   * ✅ DEBUG: Ref durumunu kontrol etmek için yardımcı fonksiyon
   */
  const debugRefStatus = useCallback(() => {
    console.log('🔍 Ref Debug Info:', {
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