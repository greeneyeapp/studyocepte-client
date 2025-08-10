// hooks/useBatchOperations.ts - Düzeltilmiş
import { useState, useCallback, useRef, useEffect } from 'react';
import { api, BatchOperation } from '@/services/api';
import { ToastService } from '@/components/Toast/ToastService'; // HATA DÜZELTİLDİ: Eksik import eklendi

export const useBatchOperations = () => {
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
      
      // Start polling for status updates
      const intervalId = setInterval(async () => {
        try {
          const status = await api.getBatchStatus(result.batch_id);
          setOperations(prev => new Map(prev).set(result.batch_id, status));
          
          // Stop polling if operation is completed/failed/cancelled
          if (['completed', 'failed', 'cancelled'].includes(status.status)) {
            clearInterval(intervalId);
            pollIntervals.current.delete(result.batch_id);
          }
        } catch (error) {
          console.warn('Failed to fetch batch status:', error);
          // Hata durumunda da polling'i durdurabiliriz
          clearInterval(intervalId);
          pollIntervals.current.delete(result.batch_id);
        }
      }, 2000); // Poll every 2 seconds
      
      pollIntervals.current.set(result.batch_id, intervalId);
      
      return result;
    } catch (error: any) {
      ToastService.show(error.message);
      throw error;
    } finally {
      setIsStarting(false);
    }
  }, []);

  const cancelOperation = useCallback(async (batchId: string) => {
    try {
      await api.cancelBatchOperation(batchId);
      
      // Clear polling
      const intervalId = pollIntervals.current.get(batchId);
      if (intervalId) {
        clearInterval(intervalId);
        pollIntervals.current.delete(batchId);
      }
      
      // Update local state
      setOperations(prev => {
        const newMap = new Map(prev);
        const operation = newMap.get(batchId);
        if (operation) {
          newMap.set(batchId, { ...operation, status: 'cancelled' });
        }
        return newMap;
      });
      
      ToastService.show('Batch operation was cancelled successfully');
    } catch (error: any) {
      ToastService.show(error.message);
    }
  }, []);

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

  // Cleanup on unmount
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