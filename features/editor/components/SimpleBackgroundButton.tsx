// features/editor/components/SimpleBackgroundButton.tsx - TEST VERSİYONU
import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, BorderRadius, Spacing } from '@/constants';

interface Background {
  id: string;
  name: string;
  thumbnailUrl: any;
  fullUrl: any;
}

interface SimpleBackgroundButtonProps {
  background: Background;
  isSelected: boolean;
  onPress: () => void;
}

/**
 * ✅ BASİT TEST VERSİYONU - Asset yükleme olmadan
 */
export const SimpleBackgroundButton: React.FC<SimpleBackgroundButtonProps> = ({
  background,
  isSelected,
  onPress,
}) => {
  console.log('🖼️ SimpleBackgroundButton rendering:', background.id, background.name);

  return (
    <TouchableOpacity 
      style={[
        styles.container, 
        isSelected && styles.containerSelected
      ]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.contentContainer}>
        {/* Icon yerine background adının ilk harfi */}
        <View style={styles.iconContainer}>
          <Text style={styles.iconText}>
            {background.name.charAt(0)}
          </Text>
        </View>
        
        {/* Background adı */}
        <Text style={styles.nameText} numberOfLines={2}>
          {background.name}
        </Text>
        
        {/* ID bilgisi */}
        <Text style={styles.idText}>
          {background.id}
        </Text>
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
    width: 80,
    height: 80,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.gray100,
    marginRight: Spacing.md,
    borderWidth: 2,
    borderColor: Colors.border,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  containerSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '20',
    transform: [{ scale: 1.05 }],
  },
  
  contentContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xs,
  },
  
  iconContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  
  iconText: {
    color: Colors.card,
    fontSize: 14,
    fontWeight: 'bold',
  },
  
  nameText: {
    fontSize: 10,
    color: Colors.textPrimary,
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 2,
  },
  
  idText: {
    fontSize: 8,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  
  selectionIndicator: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
});