// features/editor/hooks/useExportManager.ts

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
  const { t } = useTranslation();
  const [isExporting, setIsExporting] = useState(false);
  const viewRef = useRef<View>(null);
  const settings = useEnhancedEditorStore(state => state.settings);

  /**
   * ⭐ YÜKSEK KALİTE: Ref'in hazır olmasını bekler ve retry mekanizması ile çalışır
   */
  const waitForViewRef = async (maxRetries: number = 60, retryInterval: number = 100): Promise<boolean> => {
    console.log(t('export.refWaitingStartedLog'), { maxRetries, retryInterval });

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const hasDirectRef = !!viewRef.current;

      if (hasDirectRef) {
        try {
          const testResult = await captureRef(viewRef, {
            format: 'png',
            quality: 1.0,
            width: 200,
            height: 200,
            result: 'tmpfile',
          });

          try {
            await FileSystem.deleteAsync(testResult, { idempotent: true });
          } catch {}

          console.log(t('export.refReadyLog', { attempt, maxRetries }));
          return true;

        } catch (captureError: any) {
          console.log(t('export.refExistsCaptureFailedLog', { attempt, maxRetries, message: captureError.message }));
        }
      } else {
        console.log(t('export.refNotAvailableLog', { attempt, maxRetries }));
      }

      if (attempt % 10 === 0) {
        console.log(t('export.refWaitingProgressLog', { attempt, maxRetries, ms: (attempt * retryInterval), hasRef: hasDirectRef }));
      }

      await new Promise(resolve => setTimeout(resolve, retryInterval));
    }

    console.error(t('export.refNotReadyFinalLog', { ms: maxRetries * retryInterval }));
    return false;
  };

  /**
   * ⭐ YÜKSEK KALİTE: RETRY MEKANİZMASI ile export fonksiyonu
   */
  const shareWithOption = async (shareOption: ShareOption, preset?: ExportPreset) => {
    if (!preset) {
      ToastService.show(t('export.selectFormatMessage'));
      return;
    }

    setIsExporting(true);
    LoadingService.show();

    try {
      console.log(t('export.exportStartingLog'));
      const refReady = await waitForViewRef(60, 100);

      if (!refReady) {
        throw new Error(t('export.previewNotReadyError'));
      }

      console.log(t('export.refValidatedLog'));

      console.log(t('export.finalRefCheckLog'), {
        refExists: !!viewRef.current,
        refType: viewRef.current?.constructor?.name || 'undefined',
        hasNativeProps: !!(viewRef.current as any)?.setNativeProps,
        canMeasure: !!(viewRef.current as any)?.measure,
      });

      const exportPreset = preset;

      console.log(t('export.captureStartingLog'), {
        format: exportPreset.format,
        quality: exportPreset.quality,
        dimensions: exportPreset.dimensions,
      });

      console.log(t('export.superHighQualityCaptureLog'));

      const ultraHighResWidth = Math.max(4096, exportPreset.dimensions.width * 2);
      const ultraHighResHeight = Math.max(4096, exportPreset.dimensions.height * 2);

      console.log(t('export.stage1CaptureLog'), { ultraHighResWidth, ultraHighResHeight });

      const ultraHighResUri = await captureRef(viewRef, {
        format: 'png',
        quality: 1.0,
        width: ultraHighResWidth,
        height: ultraHighResHeight,
        result: 'tmpfile',
        snapshotContentContainer: false,
      });

      console.log(t('export.ultraHighResCaptureCompletedLog'), ultraHighResUri);

      const { manipulateAsync, SaveFormat } = await import('expo-image-manipulator');

      const intermediateWidth = exportPreset.dimensions.width * 1.5;
      const intermediateHeight = exportPreset.dimensions.height * 1.5;

      console.log(t('export.stage2ResizeLog'), { intermediateWidth, intermediateHeight });

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
          compress: 1.0,
          format: SaveFormat.PNG,
        }
      );

      console.log(t('export.intermediateResizeCompletedLog'), intermediateResult.uri);

      console.log(t('export.stage3OptimizeResizeLog'));

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
          compress: Math.max(0.98, exportPreset.quality),
          format: exportPreset.format === 'png' ? SaveFormat.PNG : SaveFormat.JPEG,
        }
      );

      console.log(t('export.superHighQualityFinalResizeCompletedLog'), finalResult.uri);

      const cleanupFiles = [ultraHighResUri, intermediateResult.uri];
      for (const fileUri of cleanupFiles) {
        try {
          await FileSystem.deleteAsync(fileUri, { idempotent: true });
        } catch (cleanupError) {
          console.warn(t('common.cleanupWarning'), fileUri, cleanupError);
        }
      }

      const uri = finalResult.uri;

      if (!uri) {
        throw new Error(t('export.creationFailedError'));
      }

      console.log(t('export.superHighQualityCaptureCompletedLog'), uri);

      const base64Data = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      console.log(t('export.base64ConversionCompletedLog'), base64Data.length);

      await ExportService.shareWithOption({
        shareOption,
        preset: exportPreset,
        base64Data,
        filename: `studyo-cepte-hq-${exportPreset.id}-${Date.now()}.${exportPreset.format}`,
      });

      let successMessage = '';
      if (shareOption.type === 'gallery') {
        successMessage = t('export.saveSuccessGallery', { presetName: t(exportPreset.name) });
      } else {
        successMessage = t('export.shareSuccessGeneric', { presetName: t(exportPreset.name) });
      }

      ToastService.show(successMessage);
      console.log(t('export.processCompletedSuccessLog'));

    } catch (error: any) {
      console.error(t('common.errors.exportFailed'), error);

      let userMessage = error.message;

      if (error.message.includes('timeout')) {
        userMessage = t('export.timeoutError');
      } else if (error.message.includes('capture')) {
        userMessage = t('export.captureError');
      } else if (error.message.includes('permission')) {
        userMessage = t('common.permissions.galleryMessage');
      }

      ToastService.show(userMessage);

    } finally {
      setIsExporting(false);
      LoadingService.hide();
    }
  };

  const debugRefStatus = useCallback(() => {
    console.log(t('export.refDebugInfoLog'), {
      refExists: !!viewRef.current,
      refType: viewRef.current?.constructor?.name,
      timestamp: Date.now()
    });
  }, [viewRef, t]);

  return {
    isExporting,
    skiaViewRef: viewRef,
    shareWithOption,
    debugRefStatus,
    isRefReady: !!viewRef.current,
  };
};