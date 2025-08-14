// hooks/useSecurityValidation.ts - Düzeltilmiş ve Çalışır Hali
import { useState, useCallback } from 'react';
import { api, SecurityInfo, FileValidationResult } from '@/services/api';
import { ToastService } from '@/components/Toast/ToastService';
import { useTranslation } from 'react-i18next'; // useTranslation import edildi

export const useSecurityValidation = () => {
  const { t } = useTranslation();
  const [securityInfo, setSecurityInfo] = useState<SecurityInfo | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [csrfToken, setCsrfToken] = useState<string | null>(null);

  const fetchSecurityInfo = useCallback(async () => {
    try {
      const info = await api.getSecurityInfo();
      setSecurityInfo(info);
      return info;
    } catch (error: any) {
      console.warn(t('security.fetchInfoFailed'), error);
      return null;
    }
  }, [t]);

  const validateFile = useCallback(async (imageUri: string): Promise<FileValidationResult | null> => {
    setIsValidating(true);
    try {
      const result = await api.validateFile(imageUri);
      return result;
    } catch (error: any) {
      ToastService.show(error.message);
      return null;
    } finally {
      setIsValidating(false);
    }
  }, []);

  const getCsrfToken = useCallback(async () => {
    try {
      const result = await api.getCsrfToken();
      setCsrfToken(result.csrf_token);
      return result.csrf_token;
    } catch (error: any) {
      console.warn(t('security.getCsrfTokenFailed'), error);
      return null;
    }
  }, [t]);

  const reportSecurityIssue = useCallback(async (description: string) => {
    try {
      const result = await api.reportSecurityIssue(description);
      ToastService.show(t('security.referenceId', { id: result.reference_id }));
      return result;
    } catch (error: any) {
      ToastService.show(error.message);
      throw error;
    }
  }, [t]);

  const checkRateLimit = useCallback(async () => {
    try {
      const status = await api.getRateLimitStatus();
      return status;
    } catch (error: any) {
      console.warn(t('security.checkRateLimitFailed'), error);
      return null;
    }
  }, [t]);

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