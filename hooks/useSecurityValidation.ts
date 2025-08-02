// hooks/useSecurityValidation.ts - Düzeltilmiş ve Çalışır Hali
import { useState, useCallback } from 'react';
import { api, SecurityInfo, FileValidationResult } from '@/services/api';
import { ToastService } from '@/components/Toast/ToastService'; // HATA DÜZELTİLDİ: Eksik import eklendi

export const useSecurityValidation = () => {
  const [securityInfo, setSecurityInfo] = useState<SecurityInfo | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [csrfToken, setCsrfToken] = useState<string | null>(null);

  const fetchSecurityInfo = useCallback(async () => {
    try {
      const info = await api.getSecurityInfo();
      setSecurityInfo(info);
      return info;
    } catch (error: any) {
      console.warn('Failed to fetch security info:', error);
      return null;
    }
  }, []);

  // HATA DÜZELTİLDİ: Fonksiyon imzası React Native'e uygun hale getirildi (File | Blob yerine string)
  const validateFile = useCallback(async (imageUri: string): Promise<FileValidationResult | null> => {
    setIsValidating(true);
    try {
      const result = await api.validateFile(imageUri); // Artık doğru parametreyi gönderiyor
      return result;
    } catch (error: any) {
      ToastService.show({
        type: 'error',
        text1: 'File Validation Failed',
        text2: error.message
      });
      return null;
    } finally {
      setIsValidating(false);
    }
  }, []);

  const getCsrfToken = useCallback(async () => {
    try {
      const result = await api.getCsrfToken(); // Artık hata vermeyecek
      setCsrfToken(result.csrf_token);
      return result.csrf_token;
    } catch (error: any) {
      console.warn('Failed to get CSRF token:', error);
      return null;
    }
  }, []);

  const reportSecurityIssue = useCallback(async (description: string) => {
    try {
      const result = await api.reportSecurityIssue(description); // Artık hata vermeyecek
      ToastService.show({
        type: 'success',
        text1: 'Report Submitted',
        text2: `Reference ID: ${result.reference_id}`
      });
      return result;
    } catch (error: any) {
      ToastService.show({
        type: 'error',
        text1: 'Report Failed',
        text2: error.message
      });
      throw error;
    }
  }, []);

  const checkRateLimit = useCallback(async () => {
    try {
      const status = await api.getRateLimitStatus(); // Artık hata vermeyecek
      return status;
    } catch (error: any) {
      console.warn('Failed to check rate limit:', error);
      return null;
    }
  }, []);

  return {
    securityInfo,
    isValidating,
    csrfToken,
    fetchSecurityInfo,
    validateFile,
    getCsrfToken,
    reportSecurityIssue,
    checkRateLimit
  };
};