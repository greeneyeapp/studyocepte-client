// components/LazyImage.tsx - Lazy Loading Image Component
import React, { useState, useEffect } from 'react';
import { Image, View, ActivityIndicator, StyleSheet, ImageStyle } from 'react-native';
import { Colors } from '@/constants';
import { imageCache } from '@/services/imageCache';

interface LazyImageProps {
  uri: string;
  style?: ImageStyle;
  placeholder?: React.ReactNode;
  priority?: 'low' | 'normal' | 'high';
  onLoad?: () => void;
  onError?: (error: any) => void;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'repeat' | 'center';
}

export const LazyImage: React.FC<LazyImageProps> = ({
  uri,
  style,
  placeholder,
  priority = 'normal',
  onLoad,
  onError,
  resizeMode = 'cover'
}) => {
  const [imageUri, setImageUri] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!uri) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    const loadImage = async () => {
      try {
        setIsLoading(true);
        setHasError(false);
        
        const cachedUri = await imageCache.getImage(uri, priority);
        
        if (isMounted) {
          setImageUri(cachedUri);
          setIsLoading(false);
          onLoad?.();
        }
      } catch (error) {
        if (isMounted) {
          setHasError(true);
          setIsLoading(false);
          onError?.(error);
        }
      }
    };

    loadImage();

    return () => {
      isMounted = false;
    };
  }, [uri, priority]);

  if (hasError) {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.errorContainer}>
          {placeholder || <View style={styles.errorPlaceholder} />}
        </View>
      </View>
    );
  }

  if (isLoading || !imageUri) {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.loadingContainer}>
          {placeholder || <ActivityIndicator color={Colors.primary} />}
        </View>
      </View>
    );
  }

  return (
    <Image
      source={{ uri: imageUri }}
      style={style}
      resizeMode={resizeMode}
      onLoad={onLoad}
      onError={onError}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.gray100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorPlaceholder: {
    width: '80%',
    height: '80%',
    backgroundColor: Colors.gray200,
    borderRadius: 8,
  },
});