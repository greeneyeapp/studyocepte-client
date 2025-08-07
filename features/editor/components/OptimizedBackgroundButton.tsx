// features/editor/components/OptimizedBackgroundButton.tsx - DÜZELTİLMİŞ VERSİYON
import React, { useState, useEffect, useRef } from 'react';
import { TouchableOpacity, Image, View, StyleSheet, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, BorderRadius, Spacing } from '@/constants';
import { backgroundThumbnailManager } from '@/services/backgroundThumbnailManager';

interface Background {
  id: string;
  name: string;
  thumbnailUrl: string;
  fullUrl: string;
}

interface OptimizedBackgroundButtonProps {
  background: Background;
  isSelected: boolean;
  onPress: () => void;
}

/**
 * Optimize edilmiş background button - HATA DİRENÇLİ VERSİYON
 */
export const OptimizedBackgroundButton: React.FC<OptimizedBackgroundButtonProps> = ({
  background,
  isSelected,
  onPress,
}) => {
  const [thumbnailUri, setThumbnailUri] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const mountedRef = useRef(true);
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Component unmount cleanup
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Load thumbnail with comprehensive error handling
  useEffect(() => {
    let isCancelled = false;

    const loadThumbnail = async () => {
      if (!mountedRef.current) return;

      try {
        setIsLoading(true);
        setHasError(false);

        console.log('🖼️ Loading thumbnail for background:', background.id);

        // Timeout için promise wrapper
        const timeoutPromise = new Promise<string | null>((_, reject) => {
          timeoutRef.current = setTimeout(() => {
            reject(new Error('Thumbnail load timeout'));
          }, 8000); // 8 saniye timeout
        });

        // Cache'lenmiş thumbnail'i al
        const thumbnailPromise = backgroundThumbnailManager.getThumbnail(
          background.id,
          background.fullUrl
        );

        const cachedUri = await Promise.race([thumbnailPromise, timeoutPromise]);

        // Clear timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = undefined;
        }

        if (isCancelled || !mountedRef.current) return;

        if (cachedUri) {
          setThumbnailUri(cachedUri);
          console.log('✅ Thumbnail loaded for:', background.id);
        } else {
          throw new Error('Cache returned null');
        }

      } catch (error) {
        console.warn('⚠️ Background thumbnail load error:', background.id, error);
        
        if (!isCancelled && mountedRef.current) {
          // Retry logic - maksimum 2 kez dene
          if (retryCount < 2) {
            console.log('🔄 Retrying thumbnail load for:', background.id, 'attempt:', retryCount + 1);
            setRetryCount(prev => prev + 1);
            
            // Exponential backoff ile retry
            const retryDelay = Math.min(2000 * Math.pow(2, retryCount), 8000);
            timeoutRef.current = setTimeout(() => {
              if (mountedRef.current && !isCancelled) {
                loadThumbnail();
              }
            }, retryDelay);
            return;
          } else {
            // Max retry'a ulaşılmış, fallback'e geç
            console.log('❌ Max retries reached for:', background.id, 'using fallback');
            setThumbnailUri(background.thumbnailUrl);
            setHasError(true);
          }
        }
      } finally {
        if (mountedRef.current && !isCancelled) {
          setIsLoading(false);
        }
      }
    };

    // İlk yükleme
    loadThumbnail();

    return () => {
      isCancelled = true;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [background.id, background.fullUrl, background.thumbnailUrl, retryCount]);

  const handleImageError = () => {
    console.warn('🖼️ Image render error for:', background.id);
    if (mountedRef.current && !hasError) {
      setHasError(true);
      // Fallback olarak orijinal thumbnail URL'ini kullan
      if (thumbnailUri !== background.thumbnailUrl) {
        setThumbnailUri(background.thumbnailUrl);
      }
    }
  };

  const handleImageLoad = () => {
    if (mountedRef.current) {
      console.log('✅ Image successfully rendered for:', background.id);
    }
  };

  // Render loading state
  if (isLoading && !thumbnailUri) {
    return (
      <TouchableOpacity 
        style={[
          styles.container, 
          isSelected && styles.containerSelected
        ]} 
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={Colors.primary} />
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity 
      style={[
        styles.container, 
        isSelected && styles.containerSelected
      ]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.imageContainer}>
        {thumbnailUri ? (
          <Image 
            source={{ uri: thumbnailUri }} 
            style={styles.backgroundImage}
            onError={handleImageError}
            onLoad={handleImageLoad}
            // Cache control
            cache="force-cache"
          />
        ) : (
          <View style={styles.errorContainer}>
            <Feather name="image" size={20} color={Colors.gray400} />
          </View>
        )}
      </View>
      
      {/* Selection indicator */}
      {isSelected && (
        <View style={styles.selectionIndicator}>
          <Feather name="check" size={12} color={Colors.card} />
        </View>
      )}

      {/* Error indicator */}
      {hasError && !isLoading && (
        <View style={styles.errorIndicator}>
          <Feather name="alert-triangle" size={8} color={Colors.error} />
        </View>
      )}

      {/* Cache indicator (sadece development'ta) */}
      {__DEV__ && thumbnailUri && thumbnailUri.includes('bg_thumbnails') && (
        <View style={styles.cacheIndicator}>
          <Feather name="database" size={8} color={Colors.success} />
        </View>
      )}

      {/* Loading overlay for retry states */}
      {isLoading && thumbnailUri && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color={Colors.card} />
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    marginRight: Spacing.lg,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  containerSelected: {
    borderColor: Colors.primary,
    transform: [{ scale: 1.05 }],
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  imageContainer: {
    width: '100%',
    height: '100%',
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  loadingContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.gray100,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  errorContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.gray200,
    borderWidth: 1,
    borderColor: Colors.error + '30',
    borderStyle: 'dashed',
  },
  selectionIndicator: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  errorIndicator: {
    position: 'absolute',
    top: 2,
    left: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.card,
  },
  cacheIndicator: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.success + '90',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.card,
  },
});