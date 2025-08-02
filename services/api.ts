// services/api.ts - Enhanced version with new endpoints
import axios from 'axios';
import { config } from '@/config/config';
import AsyncStorage from '@react-native-async-storage/async-storage';

// --- TİP TANIMLARI - API ile uyumlu ---
export interface EditorSettings {
  backgroundId: string;
  shadow: number;
  lighting: number;
  
  // Yeni katmanlı ayarlar
  product_exposure?: number;
  product_brightness?: number;
  product_contrast?: number;
  product_saturation?: number;
  product_warmth?: number;
  product_highlights?: number;
  product_shadows?: number;
  product_clarity?: number;
  product_vignette?: number;
  
  background_exposure?: number;
  background_brightness?: number;
  background_contrast?: number;
  background_saturation?: number;
  background_warmth?: number;
  background_highlights?: number;
  background_shadows?: number;
  background_clarity?: number;
  background_blur?: number;
  
  // Pozisyon ayarları
  photoX?: number;
  photoY?: number;
  photoScale?: number;
  photoRotation?: number;
  
  // Diğer ayarlar
  brightness?: number;
  contrast?: number;
  saturation?: number;
  hue?: number;
  sepia?: number;
}

export interface ProductPhoto {
  id: string;
  productId: string;
  originalImageUrl: string; // Client'da bu isim kullanılıyor
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

// Batch operations interfaces
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

// Security interfaces
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
    // API'den gelen rawImageUrl'yi originalImageUrl'ye çevir
    if (response.data) {
      if (Array.isArray(response.data)) {
        response.data = response.data.map(transformPhotoUrls);
      } else if (response.data.photos) {
        response.data.photos = response.data.photos.map(transformPhotoUrls);
      } else if (response.data.rawImageUrl) {
        response.data = transformPhotoUrls(response.data);
      }
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

// API'den gelen rawImageUrl'yi client'ın beklediği originalImageUrl'ye çevir
function transformPhotoUrls(item: any) {
  if (item && item.rawImageUrl) {
    return {
      ...item,
      originalImageUrl: item.rawImageUrl,
    };
  }
  return item;
}

// --- API FONKSİYONLARI ---
export const api = {
  // Auth endpoints
  login: async (email: string, password: string): Promise<TokenResponse> => {
    const response = await apiClient.post<TokenResponse>('/auth/login', {
      email: email,
      password: password,
    });
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

  // Product endpoints
  fetchProducts: async (): Promise<Product[]> => {
    const response = await apiClient.get<Product[]>('/products');
    return response.data;
  },

  // Enhanced product endpoints with caching and optimization
  fetchProductsOptimized: async (params?: {
    limit?: number;
    offset?: number;
    include_photos?: boolean;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
  }): Promise<Product[]> => {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    if (params?.include_photos) queryParams.append('include_photos', params.include_photos.toString());
    if (params?.sort_by) queryParams.append('sort_by', params.sort_by);
    if (params?.sort_order) queryParams.append('sort_order', params.sort_order);

    const response = await apiClient.get<Product[]>(`/api/v2/products?${queryParams.toString()}`);
    return response.data;
  },

  fetchProductById: async (productId: string): Promise<ProductDetail> => {
    const response = await apiClient.get<ProductDetail>(`/products/${productId}`);
    return response.data;
  },

  // Enhanced product photo summary
  fetchProductPhotoSummary: async (productId: string, params?: {
    include_thumbnails?: boolean;
    quality?: 'low' | 'medium' | 'high';
  }): Promise<{
    productId: string;
    totalCount: number;
    completedCount: number;
    processingCount: number;
    failedCount: number;
    photos: ProductPhoto[];
  }> => {
    const queryParams = new URLSearchParams();
    if (params?.include_thumbnails) queryParams.append('include_thumbnails', params.include_thumbnails.toString());
    if (params?.quality) queryParams.append('quality', params.quality);

    const response = await apiClient.get(`/api/v2/products/${productId}/photos/summary?${queryParams.toString()}`);
    return response.data;
  },

  createProduct: async (name: string): Promise<Product> => {
    const response = await apiClient.post<Product>('/products', { name });
    return response.data;
  },
  
  deleteProduct: async (productId: string): Promise<void> => {
    await apiClient.delete(`/products/${productId}`);
  },

  // Photo endpoints
  uploadPhoto: async (productId: string, imageUri: string): Promise<ProductPhoto> => {
    const formData = new FormData();
    const uriParts = imageUri.split('/');
    const fileName = uriParts.pop() || 'photo.jpg';
    let fileType = 'image/jpeg';
    if (fileName.endsWith('.png')) {
        fileType = 'image/png';
    }
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

  deletePhoto: async (photoId: string): Promise<void> => {
    await apiClient.delete(`/photos/${photoId}`);
  },

  // Background endpoints
  fetchBackgrounds: async (): Promise<Background[]> => {
    const response = await apiClient.get<Background[]>('/backgrounds');
    return response.data;
  },

  // Batch operations endpoints
  startBatchOperation: async (params: {
    operation_type: 'remove_background' | 'apply_filter' | 'resize' | 'export';
    photo_ids: string[];
    params?: Record<string, any>;
  }): Promise<{ batch_id: string; status: string; message: string }> => {
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

  // Security endpoints
  getSecurityInfo: async (): Promise<SecurityInfo> => {
    const response = await apiClient.get<SecurityInfo>('/security/security-info');
    return response.data;
  },

  validateFile: async (file: File | Blob, filename: string): Promise<FileValidationResult> => {
    const formData = new FormData();
    formData.append('file', file, filename);
    
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

  getRateLimitStatus: async (): Promise<{
    client_ip: string;
    rate_limits: Record<string, { limit: number; remaining: number; reset_time: number }>;
    blocked: boolean;
  }> => {
    const response = await apiClient.get('/security/rate-limit-status');
    return response.data;
  },

  // Cache management endpoints
  getCacheStats: async (): Promise<{
    enabled: boolean;
    connected_clients?: number;
    used_memory?: string;
    keyspace_hits?: number;
    keyspace_misses?: number;
    hit_ratio?: number;
  }> => {
    const response = await apiClient.get('/security/cache-stats');
    return response.data;
  },

  // Image processing endpoint
  removeBackground: async (imageUri: string): Promise<Blob> => {
    const formData = new FormData();
    const uriParts = imageUri.split('/');
    const fileName = uriParts.pop() || 'photo.jpg';
    let fileType = 'image/jpeg';
    if (fileName.endsWith('.png')) {
        fileType = 'image/png';
    }
    formData.append('file', { uri: imageUri, name: fileName, type: fileType } as any);
    
    const response = await apiClient.post('/image/remove-background', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      responseType: 'blob'
    });
    return response.data;
  },
};