// features/editor/components/OptimizedBackgroundButton.tsx - CACHE'Lİ BACKGROUND BUTTON
import React, { useState, useEffect } from 'react';
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
 * Optimize edilmiş background button - cache'lenmiş thumbnail kullanır
 * Performance artışı için background image'ları cache'ler ve optimize eder
 */
export const OptimizedBackgroundButton: React.FC<OptimizedBackgroundButtonProps> = ({
  background,
  isSelected,
  onPress,
}) => {
  const [thumbnailUri, setThumbnailUri] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadThumbnail = async () => {
      try {
        setIsLoading(true);
        setHasError(false);

        // Cache'lenmiş thumbnail'i al
        const cachedUri = await backgroundThumbnailManager.getThumbnail(
          background.id,
          background.fullUrl
        );

        if (mounted) {
          if (cachedUri) {
            setThumbnailUri(cachedUri);
            console.log('💾 Using cached thumbnail for:', background.id);
          } else {
            // Fallback: orijinal thumbnail URL'ini kullan
            console.log('⚠️ Using fallback thumbnail for:', background.id);
            setThumbnailUri(background.thumbnailUrl);
          }
          setIsLoading(false);
        }
      } catch (error) {
        console.error('❌ Background thumbnail load error:', error);
        if (mounted) {
          setHasError(true);
          setIsLoading(false);
          // Fallback: orijinal thumbnail URL'ini kullan
          setThumbnailUri(background.thumbnailUrl);
        }
      }
    };

    loadThumbnail();

    return () => {
      mounted = false;
    };
  }, [background.id, background.fullUrl, background.thumbnailUrl]);

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
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={Colors.primary} />
          </View>
        ) : thumbnailUri ? (
          <Image 
            source={{ uri: thumbnailUri }} 
            style={styles.backgroundImage}
            onError={() => {
              console.warn('⚠️ Image load error for:', background.id);
              setHasError(true);
            }}
            onLoad={() => {
              console.log('✅ Image loaded successfully for:', background.id);
            }}
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