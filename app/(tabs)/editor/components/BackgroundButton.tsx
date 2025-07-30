// app/(tabs)/editor/components/BackgroundButton.tsx

import React from 'react';
import { TouchableOpacity, Image, View, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, BorderRadius, Spacing } from '@/constants';
import { Background } from '@/services/api';

interface BackgroundButtonProps {
  background: Background;
  isSelected: boolean;
  onPress: () => void;
}

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
      <Image 
        source={{ uri: background.thumbnailUrl }} 
        style={styles.backgroundImage}
      />
      
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
  },
});