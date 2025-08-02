// services/api.ts - Final Sürüm
import axios from 'axios';
import { config } from '@/config/config';
import AsyncStorage from '@react-native-async-storage/async-storage';

// --- TİP TANIMLARI ---
export interface EditorSettings {
  backgroundId: string;
  photoX?: number;
  photoY?: number;
  photoScale?: number;
  photoRotation?: number;
  product_exposure?: number;
  product_brightness?: number;
  product_contrast?: number;
  product_saturation?: number;
  product_vibrance?: number;
  product_warmth?: number;
  product_clarity?: number;
  product_vignette?: number;
  product_highlights?: number;
  product_shadows?: number;
  background_exposure?: number;
  background_brightness?: number;
  background_contrast?: number;
  background_saturation?: number;
  background_vibrance?: number;
  background_warmth?: number;
  background_clarity?: number;
  background_vignette?: number;
  background_highlights?: number;
  background_shadows?: number;
  background_blur?: number;
  shadow?: number;
  lighting?: number;
  cropAspectRatio?: string;
  cropX?: number;
  cropY?: number;
  cropWidth?: number;
  cropHeight?: number;
}
export interface ProductPhoto {
  id: string;
  productId: string;
  originalImageUrl: string;
  processedImageUrl?: string;
  thumbnailUrl?: string;
  status: 'processing' | 'completed' | 'failed';
  editorSettings?: EditorSettings;
  createdAt: string;
  updatedAt: string;
}
export interface Product {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  photoCount: number;
  coverThumbnailUrl?: string;
}
export interface ProductDetail extends Product {
  photos: ProductPhoto[];
}
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  subscriptionPlan: 'free' | 'pro';
}
export interface Background {
  id: string;
  name: string;
  thumbnailUrl: string;
  fullUrl: string;
}
export interface TokenResponse {
  user: User;
  access_token: string;
  token_type: string;
}
export interface BatchOperation {
  id: string;
  type: 'remove_background' | 'apply_filter' | 'resize' | 'export';
  photo_ids: string[];
  status: 'started' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  total: number;
  completed: number;
  failed: number;
  started_at: string;
  estimated_completion?: string;
}
export interface SecurityInfo {
  client_ip: string;
  rate_limits: Record<string, number>;
  max_file_size_mb: number;
  allowed_file_types: string[];
  security_features: string[];
}
export interface FileValidationResult {
  valid: boolean;
  message: string;
  file_info?: {
    filename: string;
    size: number;
    content_type: string;
  };
}

// --- API İSTEMCİSİ ---
const apiClient = axios.create({
  baseURL: config.api.baseUrl,
  timeout: 35000,
});

apiClient.interceptors.request.use(
  async (config) => {
    const userJson = await AsyncStorage.getItem('user');
    if (userJson) {
      const storedData = JSON.parse(userJson);
      if (storedData.access_token) {
        config.headers.Authorization = `Bearer ${storedData.access_token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => {
    const transformData = (data: any) => {
        if (Array.isArray(data)) {
            return data.map(transformPhotoUrlsInObject);
        } else {
            return transformPhotoUrlsInObject(data);
        }
    };
    if (response.data) {
        response.data = transformData(response.data);
    }
    return response;
  },
  async (error) => {
    if (axios.isAxiosError(error) && error.response) {
      if (error.response.status === 401) {
        console.warn('API hatası: Yetkilendirme başarısız (401). Oturum sonlandırılıyor.');
        await AsyncStorage.removeItem('user');
      }
      const errorMessage = error.response.data.detail || error.response.data.message || 'Bir sunucu hatası oluştu.';
      throw new Error(errorMessage);
    }
    throw new Error('Bir ağ hatası oluştu veya sunucuya ulaşılamıyor.');
  }
);

function transformPhotoUrlsInObject(obj: any) {
  if (!obj) return obj;
  if (obj.photos && Array.isArray(obj.photos)) {
    obj.photos = obj.photos.map(transformSinglePhoto);
  }
  return transformSinglePhoto(obj);
}

function transformSinglePhoto(photo: any) {
  if (photo && photo.rawImageUrl) {
    photo.originalImageUrl = photo.rawImageUrl;
    delete photo.rawImageUrl;
  }
  return photo;
}

// --- API FONKSİYONLARI ---
export const api = {
  // Auth
  login: async (email: string, password: string): Promise<TokenResponse> => {
    const response = await apiClient.post<TokenResponse>('/auth/login', { email, password });
    return response.data;
  },
  register: async (name: string, email: string, password: string): Promise<TokenResponse> => {
    const response = await apiClient.post<TokenResponse>('/auth/register', { name, email, password });
    return response.data;
  },
  logout: async (): Promise<void> => {
    console.log("Client tarafında çıkış işlemi başlatıldı.");
  },
  updateProfile: async (userData: Partial<User>): Promise<User> => {
    const response = await apiClient.put<User>('/auth/profile', userData);
    return response.data;
  },

  // Products
  fetchProductsOptimized: async (params?: any): Promise<Product[]> => {
    const response = await apiClient.get<Product[]>('/api/v2/products', { params });
    return response.data;
  },
  fetchProductById: async (productId: string): Promise<ProductDetail> => {
    const response = await apiClient.get<ProductDetail>(`/products/${productId}`);
    return response.data;
  },
  createProduct: async (name: string): Promise<Product> => {
    const response = await apiClient.post<Product>('/products', { name });
    return response.data;
  },
  
  // Photos
  uploadPhoto: async (productId: string, imageUri: string): Promise<ProductPhoto> => {
    const formData = new FormData();
    const uriParts = imageUri.split('/');
    const fileName = uriParts.pop() || 'photo.jpg';
    const fileType = fileName.endsWith('.png') ? 'image/png' : 'image/jpeg';
    formData.append('file', { uri: imageUri, name: fileName, type: fileType } as any);
    const response = await apiClient.post<ProductPhoto>(`/products/${productId}/photos`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
  fetchPhotoById: async (photoId: string): Promise<ProductPhoto> => {
    const response = await apiClient.get<ProductPhoto>(`/photos/${photoId}`);
    return response.data;
  },
  savePhotoSettings: async (photoId: string, settings: EditorSettings): Promise<void> => {
    await apiClient.put(`/photos/${photoId}/settings`, settings);
  },

  // Backgrounds
  fetchBackgrounds: async (): Promise<Background[]> => {
    const response = await apiClient.get<Background[]>('/backgrounds');
    return response.data;
  },
  
  // Batch operations
  startBatchOperation: async (params: any): Promise<{ batch_id: string; status: string; message: string }> => {
    const response = await apiClient.post('/batch/start', params);
    return response.data;
  },
  getBatchStatus: async (batchId: string): Promise<BatchOperation> => {
    const response = await apiClient.get<BatchOperation>(`/batch/${batchId}/status`);
    return response.data;
  },
  cancelBatchOperation: async (batchId: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.delete(`/batch/${batchId}`);
    return response.data;
  },

  // Security
  getSecurityInfo: async (): Promise<SecurityInfo> => {
    const response = await apiClient.get<SecurityInfo>('/security/security-info');
    return response.data;
  },
  validateFile: async (imageUri: string): Promise<FileValidationResult> => {
    const formData = new FormData();
    const uriParts = imageUri.split('/');
    const fileName = uriParts.pop() || 'photo.jpg';
    const fileType = fileName.endsWith('.png') ? 'image/png' : 'image/jpeg';
    formData.append('file', { uri: imageUri, name: fileName, type: fileType } as any);
    const response = await apiClient.post<FileValidationResult>('/security/validate-file', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
  getCsrfToken: async (): Promise<{ csrf_token: string }> => {
    const response = await apiClient.post('/security/csrf-token');
    return response.data;
  },
  reportSecurityIssue: async (description: string): Promise<{ message: string; reference_id: string }> => {
    const response = await apiClient.post('/security/report-security-issue', { issue_description: description });
    return response.data;
  },
  getRateLimitStatus: async (): Promise<any> => {
    const response = await apiClient.get('/security/rate-limit-status');
    return response.data;
  },
  
  // Image processing
  removeBackground: async (imageUri: string): Promise<Blob> => {
    const formData = new FormData();
    const uriParts = imageUri.split('/');
    const fileName = uriParts.pop() || 'photo.jpg';
    const fileType = fileName.endsWith('.png') ? 'image/png' : 'image/jpeg';
    formData.append('file', { uri: imageUri, name: fileName, type: fileType } as any);
    const response = await apiClient.post('/image/remove-background', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      responseType: 'blob'
    });
    return response.data;
  },
  
  // Cache management
  getCacheStats: async (): Promise<any> => {
    const response = await apiClient.get('/security/cache-stats');
    return response.data;
  },
};