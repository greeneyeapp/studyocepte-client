// features/editor/components/OptimizedBackgroundButton.tsx - BEYAZ EKRAN SORUNU DÜZELTİLMİŞ
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
 * ✅ BEYAZ EKRAN SORUNU DÜZELTİLMİŞ - Defensive programming ile
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

  // ✅ DÜZELTME: Hemen fallback URI'yi set et, async yükleme paralel çalışsın
  useEffect(() => {
    // Hemen fallback olarak normal thumbnailUrl'i kullan
    if (typeof background.thumbnailUrl === 'string') {
      setThumbnailUri(background.thumbnailUrl);
      setIsLoading(false);
    } else {
      // Eğer thumbnailUrl bir require() ise fallback göster
      setThumbnailUri(null);
      setIsLoading(true);
    }
  }, [background.id]);

  // ✅ DÜZELTME: Async yükleme için ayrı effect (non-blocking)
  useEffect(() => {
    let isCancelled = false;

    const loadOptimizedThumbnail = async () => {
      try {
        console.log('🖼️ Loading optimized thumbnail for background:', background.id);

        // ✅ DÜZELTME: Timeout koruması daha kısa
        const timeoutPromise = new Promise<string | null>((_, reject) => {
          timeoutRef.current = setTimeout(() => {
            reject(new Error('Thumbnail load timeout'));
          }, 3000); // 3 saniye (8'den düşürüldü)
        });

        const thumbnailPromise = backgroundThumbnailManager.getThumbnail(
          background.id,
          background.fullUrl
        );

        const optimizedUri = await Promise.race([thumbnailPromise, timeoutPromise]);

        // Clear timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = undefined;
        }

        if (isCancelled || !mountedRef.current) return;

        if (optimizedUri && optimizedUri !== thumbnailUri) {
          console.log('✅ Optimized thumbnail loaded:', background.id);
          setThumbnailUri(optimizedUri);
          setHasError(false);
        }

      } catch (error) {
        console.warn('⚠️ Optimized thumbnail failed (using fallback):', background.id, error);
        
        if (!isCancelled && mountedRef.current) {
          // ✅ DÜZELTME: Hata durumunda fallback kullan, hiç yoksa placeholder
          if (!thumbnailUri) {
            // Fallback olarak normal thumbnailUrl'i dene
            if (typeof background.thumbnailUrl === 'string') {
              setThumbnailUri(background.thumbnailUrl);
            } else {
              setHasError(true);
            }
          }
        }
      } finally {
        if (mountedRef.current && !isCancelled) {
          setIsLoading(false);
        }
      }
    };

    // ✅ DÜZELTME: Sadece thumbnailUrl string değilse optimize et
    if (typeof background.thumbnailUrl !== 'string') {
      loadOptimizedThumbnail();
    }

    return () => {
      isCancelled = true;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [background.id, background.fullUrl]);

  const handleImageError = () => {
    console.warn('🖼️ Image render error for:', background.id);
    if (mountedRef.current) {
      setHasError(true);
      
      // ✅ DÜZELTME: Fallback stratejisi
      if (typeof background.thumbnailUrl === 'string' && thumbnailUri !== background.thumbnailUrl) {
        setThumbnailUri(background.thumbnailUrl);
        setHasError(false);
      }
    }
  };

  const handleImageLoad = () => {
    if (mountedRef.current) {
      console.log('✅ Image successfully rendered for:', background.id);
      setHasError(false);
    }
  };

  // ✅ DÜZELTME: Error state için daha güvenli render
  if (hasError || (!thumbnailUri && !isLoading)) {
    return (
      <TouchableOpacity 
        style={[
          styles.container, 
          isSelected && styles.containerSelected
        ]} 
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={styles.errorContainer}>
          <Feather name="image" size={20} color={Colors.gray400} />
        </View>
        
        {isSelected && (
          <View style={styles.selectionIndicator}>
            <Feather name="check" size={12} color={Colors.card} />
          </View>
        )}
      </TouchableOpacity>
    );
  }

  // ✅ DÜZELTME: Loading state sadece gerçekten loading ise
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
        
        {isSelected && (
          <View style={styles.selectionIndicator}>
            <Feather name="check" size={12} color={Colors.card} />
          </View>
        )}
      </TouchableOpacity>
    );
  }

  // ✅ DÜZELTME: Normal render - thumbnailUri kesin var
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
        <Image 
          source={{ uri: thumbnailUri }} 
          style={styles.backgroundImage}
          onError={handleImageError}
          onLoad={handleImageLoad}
          cache="force-cache"
        />
      </View>
      
      {/* Selection indicator */}
      {isSelected && (
        <View style={styles.selectionIndicator}>
          <Feather name="check" size={12} color={Colors.card} />
        </View>
      )}

      {/* Loading overlay sadece optimize ederken */}
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
    position: 'absolute',
    top: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.gray200,
    borderWidth: 1,
    borderColor: Colors.border,
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
});