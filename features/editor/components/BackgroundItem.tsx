// features/editor/components/BackgroundItem.tsx - TEMİZLENMİŞ VERSİYON

import React from 'react';
import { TouchableOpacity, Image, View, StyleSheet, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, BorderRadius, Spacing } from '@/constants';

interface Background {
  id: string;
  name: string;
  thumbnailUrl: string;
  fullUrl: string;
}

interface BackgroundItemProps {
  background: Background;
  isSelected: boolean;
  onPress: () => void;
}

export const BackgroundItem: React.FC<BackgroundItemProps> = ({
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
        {background.thumbnailUrl ? (
          <Image
            source={{ uri: background.thumbnailUrl }}
            style={styles.backgroundImage}
            onError={(e) => {
              console.warn(`❌ BackgroundItem Image Error for ${background.id}:`, e.nativeEvent.error);
            }}
            onLoad={() => {
              if (__DEV__) console.log(`✅ BackgroundItem Image Loaded for ${background.id}`);
            }}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholderContainer}>
            <Feather name="image" size={24} color={Colors.gray400} />
            <Text style={styles.placeholderText}>Yükleniyor...</Text>
          </View>
        )}
      </View>

      {/* Seçim göstergesi */}
      {isSelected && (
        <View style={styles.selectionIndicator}>
          <Feather name="check" size={12} color={Colors.card} />
        </View>
      )}
      
      {/* Seçim kenarlığı */}
      {isSelected && <View style={styles.selectionBorder} />}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    marginRight: Spacing.md,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
    backgroundColor: Colors.gray100,
  },
  
  containerSelected: {
    borderColor: Colors.primary,
    transform: [{ scale: 1.05 }],
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  
  imageContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  backgroundImage: {
    width: '100%',
    height: '100%',
  },
  
  placeholderContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.gray200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  placeholderText: {
    fontSize: 8,
    color: Colors.gray500,
    fontWeight: '500',
    marginTop: 2,
    textAlign: 'center',
  },
  
  selectionIndicator: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
    borderWidth: 2,
    borderColor: Colors.card,
  },
  
  selectionBorder: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: BorderRadius.md + 2,
    borderWidth: 2,
    borderColor: Colors.primary,
    backgroundColor: 'transparent',
  },
});