// hooks/useOptimizedApi.ts - API Optimization Hook
import { useCallback, useRef, useEffect } from 'react';
import { ToastService } from '@/components/Toast/ToastService';

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

  const addToQueue = useCallback((
    id: string,
    request: () => Promise<any>,
    priority: 'low' | 'normal' | 'high' = 'normal'
  ) => {
    // Remove duplicate requests
    requestQueue.current = requestQueue.current.filter(req => req.id !== id);
    
    // Add new request
    requestQueue.current.push({
      id,
      request,
      priority,
      timestamp: Date.now()
    });

    // Sort by priority and timestamp
    requestQueue.current.sort((a, b) => {
      const priorityMap = { high: 3, normal: 2, low: 1 };
      const aPriority = priorityMap[a.priority];
      const bPriority = priorityMap[b.priority];
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority; // Higher priority first
      }
      
      return a.timestamp - b.timestamp; // Earlier timestamp first
    });

    processQueue();
  }, []);

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
          processQueue(); // Process next batch
        }
      });
    }

    processingQueue.current = false;
  }, []);

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

