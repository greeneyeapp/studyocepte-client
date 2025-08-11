// features/editor/components/OptimizedBackgroundButton.tsx - SORUNLAR DÜZELTİLMİŞ
import React, { useState, useEffect, useRef } from 'react';
import { TouchableOpacity, Image, View, StyleSheet, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, BorderRadius, Spacing } from '@/constants';

interface Background {
  id: string;
  name: string;
  thumbnailUrl: any; // require() için any type
  fullUrl: any;
}

interface OptimizedBackgroundButtonProps {
  background: Background;
  isSelected: boolean;
  onPress: () => void;
}

/**
 * ✅ SORUNLAR DÜZELTİLMİŞ: Daha basit ve güvenilir background button
 */
export const OptimizedBackgroundButton: React.FC<OptimizedBackgroundButtonProps> = ({
  background,
  isSelected,
  onPress,
}) => {
  const [thumbnailUri, setThumbnailUri] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const mountedRef = useRef(true);

  // Component unmount cleanup
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // ✅ DÜZELTİLMİŞ: Daha basit asset resolving
  useEffect(() => {
    let isCancelled = false;

    const resolveAsset = async () => {
      try {
        setIsLoading(true);
        setHasError(false);

        // Eğer thumbnailUrl zaten string ise direkt kullan
        if (typeof background.thumbnailUrl === 'string') {
          if (!isCancelled && mountedRef.current) {
            setThumbnailUri(background.thumbnailUrl);
            setIsLoading(false);
          }
          return;
        }

        // Asset ise resolve et
        if (typeof background.thumbnailUrl === 'number') {
          try {
            // Dynamic import ile Asset'i yükle
            const { Asset } = await import('expo-asset');
            const asset = Asset.fromModule(background.thumbnailUrl);
            
            // Asset'i download et
            await asset.downloadAsync();
            
            const resolvedUri = asset.localUri || asset.uri;
            
            if (!isCancelled && mountedRef.current) {
              if (resolvedUri) {
                setThumbnailUri(resolvedUri);
                setIsLoading(false);
                console.log('✅ Asset resolved:', background.id, resolvedUri);
              } else {
                throw new Error('Asset URI could not be resolved');
              }
            }
          } catch (assetError) {
            console.warn('⚠️ Asset resolution failed:', background.id, assetError);
            if (!isCancelled && mountedRef.current) {
              setHasError(true);
              setIsLoading(false);
            }
          }
        } else {
          // Diğer durumlar için hata
          if (!isCancelled && mountedRef.current) {
            setHasError(true);
            setIsLoading(false);
          }
        }
      } catch (error) {
        console.error('❌ Background asset resolution failed:', background.id, error);
        if (!isCancelled && mountedRef.current) {
          setHasError(true);
          setIsLoading(false);
        }
      }
    };

    resolveAsset();

    return () => {
      isCancelled = true;
    };
  }, [background.id, background.thumbnailUrl]);

  const handleImageError = () => {
    console.warn('🖼️ Image render error for:', background.id);
    if (mountedRef.current) {
      setHasError(true);
      setIsLoading(false);
    }
  };

  const handleImageLoad = () => {
    if (mountedRef.current) {
      console.log('✅ Image successfully rendered for:', background.id);
      setIsLoading(false);
      setHasError(false);
    }
  };

  // ✅ DÜZELTİLMİŞ: Error state için placeholder
  if (hasError) {
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

  // ✅ DÜZELTİLMİŞ: Loading state
  if (isLoading || !thumbnailUri) {
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

  // ✅ DÜZELTİLMİŞ: Normal render
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
          resizeMode="cover"
        />
      </View>
      
      {/* Selection indicator */}
      {isSelected && (
        <View style={styles.selectionIndicator}>
          <Feather name="check" size={12} color={Colors.card} />
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