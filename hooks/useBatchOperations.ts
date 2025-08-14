// hooks/useBatchOperations.ts - Düzeltilmiş
import { useState, useCallback, useRef, useEffect } from 'react';
import { api, BatchOperation } from '@/services/api';
import { ToastService } from '@/components/Toast/ToastService';
import { useTranslation } from 'react-i18next'; // useTranslation import edildi

export const useBatchOperations = () => {
  const { t } = useTranslation();
  const [operations, setOperations] = useState<Map<string, BatchOperation>>(new Map());
  const [isStarting, setIsStarting] = useState(false);
  const pollIntervals = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const startOperation = useCallback(async (params: {
    operation_type: 'remove_background' | 'apply_filter' | 'resize' | 'export';
    photo_ids: string[];
    params?: Record<string, any>;
  }) => {
    setIsStarting(true);
    try {
      const result = await api.startBatchOperation(params);
      
      const intervalId = setInterval(async () => {
        try {
          const status = await api.getBatchStatus(result.batch_id);
          setOperations(prev => new Map(prev).set(result.batch_id, status));
          
          if (['completed', 'failed', 'cancelled'].includes(status.status)) {
            clearInterval(intervalId);
            pollIntervals.current.delete(result.batch_id);
          }
        } catch (error) {
          console.warn(t('batch.failedToFetchStatus'), error);
          clearInterval(intervalId);
          pollIntervals.current.delete(result.batch_id);
        }
      }, 2000);
      
      pollIntervals.current.set(result.batch_id, intervalId);
      
      return result;
    } catch (error: any) {
      ToastService.show(error.message);
      throw error;
    } finally {
      setIsStarting(false);
    }
  }, [t]);

  const cancelOperation = useCallback(async (batchId: string) => {
    try {
      await api.cancelBatchOperation(batchId);
      
      const intervalId = pollIntervals.current.get(batchId);
      if (intervalId) {
        clearInterval(intervalId);
        pollIntervals.current.delete(batchId);
      }
      
      setOperations(prev => {
        const newMap = new Map(prev);
        const operation = newMap.get(batchId);
        if (operation) {
          newMap.set(batchId, { ...operation, status: 'cancelled' });
        }
        return newMap;
      });
      
      ToastService.show(t('batch.operationCancelled'));
    } catch (error: any) {
      ToastService.show(error.message);
    }
  }, [t]);

  const getOperation = useCallback((batchId: string) => {
    return operations.get(batchId);
  }, [operations]);

  const clearCompletedOperations = useCallback(() => {
    setOperations(prev => {
      const newMap = new Map(prev);
      for (const [batchId, operation] of newMap.entries()) {
        if (['completed', 'failed', 'cancelled'].includes(operation.status)) {
          newMap.delete(batchId);
          const intervalId = pollIntervals.current.get(batchId);
          if (intervalId) {
            clearInterval(intervalId);
            pollIntervals.current.delete(batchId);
          }
        }
      }
      return newMap;
    });
  }, []);

  useEffect(() => {
    return () => {
      for (const intervalId of pollIntervals.current.values()) {
        clearInterval(intervalId);
      }
      pollIntervals.current.clear();
    };
  }, []);

  return {
    operations: Array.from(operations.values()),
    isStarting,
    startOperation,
    cancelOperation,
    getOperation,
    clearCompletedOperations
  };
};