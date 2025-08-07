// features/editor/components/BackgroundButton.tsx - BASİT VERSİYON (OPTİMİZASYONSUZ)
import React from 'react';
import { TouchableOpacity, Image, View, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, BorderRadius, Spacing } from '@/constants';

interface Background {
  id: string;
  name: string;
  thumbnailUrl: string;
  fullUrl: string;
}

interface BackgroundButtonProps {
  background: Background;
  isSelected: boolean;
  onPress: () => void;
}

/**
 * Basit background button - optimizasyon olmadan direkt thumbnail URL kullanıyor
 * Loading sorunlarını önlemek için cache/preload sistemleri devre dışı
 */
export const BackgroundButton: React.FC<BackgroundButtonProps> = ({
  background,
  isSelected,
  onPress,
}) => {
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
          source={{ uri: background.thumbnailUrl }} 
          style={styles.backgroundImage}
          onError={(error) => {
            console.warn('Background image load error:', background.id, error);
          }}
          onLoad={() => {
            console.log('Background image loaded:', background.id);
          }}
          // Basit cache ayarları
          cache="default"
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
    resizeMode: 'cover',
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