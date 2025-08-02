// hooks/useOptimizedApi.ts - Düzeltilmiş
import { useCallback, useRef, useEffect } from 'react';
import { ToastService } from '@/components/Toast/ToastService'; // Eksik import eklendi

interface RequestQueue {
  id: string;
  request: () => Promise<any>;
  priority: 'low' | 'normal' | 'high';
  timestamp: number;
}

export const useOptimizedApi = () => {
  const requestQueue = useRef<RequestQueue[]>([]);
  const activeRequests = useRef<Set<string>>(new Set());
  const processingQueue = useRef(false);

  const processQueue = useCallback(async () => {
    if (processingQueue.current || requestQueue.current.length === 0) {
      return;
    }

    processingQueue.current = true;

    while (requestQueue.current.length > 0) {
      const maxConcurrent = 3;
      const availableSlots = maxConcurrent - activeRequests.current.size;
      
      if (availableSlots <= 0) {
        break;
      }

      const requests = requestQueue.current.splice(0, availableSlots);
      
      requests.forEach(async ({ id, request }) => {
        if (activeRequests.current.has(id)) {
          return;
        }

        activeRequests.current.add(id);
        
        try {
          await request();
        } catch (error) {
          console.warn(`Request ${id} failed:`, error);
        } finally {
          activeRequests.current.delete(id);
          // Tekrar processQueue çağırmak yerine döngünün devam etmesini bekleyebiliriz.
          // Bu, potansiyel stack overflow hatalarını önler.
        }
      });
    }

    processingQueue.current = false;
    
    // Kuyrukta hala eleman varsa ve slot açıldıysa tekrar tetikle
    if (requestQueue.current.length > 0 && activeRequests.current.size < 3) {
        processQueue();
    }
  }, []);

  const addToQueue = useCallback((
    id: string,
    request: () => Promise<any>,
    priority: 'low' | 'normal' | 'high' = 'normal'
  ) => {
    requestQueue.current = requestQueue.current.filter(req => req.id !== id);
    
    requestQueue.current.push({
      id,
      request,
      priority,
      timestamp: Date.now()
    });

    requestQueue.current.sort((a, b) => {
      const priorityMap = { high: 3, normal: 2, low: 1 };
      const aPriority = priorityMap[a.priority];
      const bPriority = priorityMap[b.priority];
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }
      
      return a.timestamp - b.timestamp;
    });

    processQueue();
  }, [processQueue]);


  const cancelRequest = useCallback((id: string) => {
    requestQueue.current = requestQueue.current.filter(req => req.id !== id);
  }, []);

  const clearQueue = useCallback(() => {
    requestQueue.current = [];
  }, []);

  return {
    addToQueue,
    cancelRequest,
    clearQueue,
    getQueueLength: () => requestQueue.current.length,
    getActiveCount: () => activeRequests.current.size
  };
};