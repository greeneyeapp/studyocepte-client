// features/editor/components/FeatureButton.tsx - DÜZELTILMIŞ VERSİYON

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants';

interface FeatureButtonProps {
  icon: string;
  label: string;
  value: number;
  isActive: boolean;
  onPress: () => void;
  // Karışık durum için props
  hasMixedValues?: boolean;
  productValue?: number;
  backgroundValue?: number;
}

export const FeatureButton: React.FC<FeatureButtonProps> = ({
  icon,
  label,
  value,
  isActive,
  onPress,
  hasMixedValues = false,
  productValue = 0,
  backgroundValue = 0,
}) => {
  // ✅ DÜZELTILMIŞ handlePress
  const handlePress = () => {
    console.log('🔘 Feature button pressed:', label, 'Current value:', value, 'Active:', isActive);
    onPress();
  };

  // Doğru hasValue hesaplaması - aktif target'a göre
  const hasAnyValue = hasMixedValues 
    ? (productValue !== 0 || backgroundValue !== 0)
    : (value !== 0);
  
  // Karışık durumda farklı görsel
  const getContainerStyle = () => {
    if (isActive) return styles.containerActive;
    return styles.container;
  };

  const getIconContainerStyle = () => {
    // 1. Önce aktif durumu kontrol et (en yüksek öncelik)
    if (isActive) {
      // Aktifken normal aktif stili kullan, karışık durum göstergesi sadece kırmızı nokta ile
      return styles.iconContainerActive;
    }
    
    // 2. Aktif değilken karışık durum (sadece değer varsa)
    if (hasMixedValues && hasAnyValue) {
      return styles.iconContainerMixed;
    }
    
    // 3. Normal değer var durumu  
    if (hasAnyValue) {
      return styles.iconContainerWithValue;
    }
    
    // 4. Değer yok durumu
    return styles.iconContainer;
  };

  const getIconColor = () => {
    if (isActive || hasAnyValue) return Colors.card;
    return Colors.textPrimary;
  };

  const getLabelStyle = () => {
    if (isActive) return [styles.label, styles.labelActive];
    if (hasAnyValue) return [styles.label, styles.labelWithValue];
    return styles.label;
  };

  // Karışık durumda gösterilecek değer
  const getDisplayValue = () => {
    if (hasMixedValues) {
      // Karışık durumda sadece ± simgesi göster
      return '±';
    }
    // Normal durumda değeri göster
    return value > 0 ? `+${value}` : `${value}`;
  };

  return (
    <TouchableOpacity 
      style={getContainerStyle()} 
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={getIconContainerStyle()}>
        {hasAnyValue ? (
          <Text style={[
            styles.valueText, 
            hasMixedValues && styles.valueTextMixed,
            { color: getIconColor() }
          ]}>
            {getDisplayValue()}
          </Text>
        ) : (
          <Feather 
            name={icon as any} 
            size={18} 
            color={getIconColor()} 
          />
        )}
        
        {/* Karışık durum göstergesi - sadece aktif olmayan butonlarda */}
        {hasMixedValues && hasAnyValue && !isActive && (
          <View style={styles.mixedIndicator}>
            <View style={styles.mixedDot} />
          </View>
        )}
      </View>
      
      <Text style={getLabelStyle()}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    minWidth: 60,
    paddingHorizontal: Spacing.xs,
    position: 'relative',
  },
  containerActive: {
    alignItems: 'center',
    minWidth: 60,
    paddingHorizontal: Spacing.xs,
    position: 'relative',
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    position: 'relative',
  },
  iconContainerWithValue: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    position: 'relative',
  },
  iconContainerActive: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    position: 'relative',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
    borderWidth: 0,
    borderColor: 'transparent',
  },
  iconContainerMixed: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    position: 'relative',
    borderWidth: 2,
    borderColor: Colors.error,
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  valueText: {
    ...Typography.captionMedium,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.card,
    textAlign: 'center',
  },
  valueTextMixed: {
    fontSize: 14,
  },
  label: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
    maxWidth: 60,
  },
  labelActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  labelWithValue: {
    color: Colors.primary,
    fontWeight: '600',
  },
  
  // Karışık durum stilleri
  mixedIndicator: {
    position: 'absolute',
    top: -3,
    right: -3,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.card,
  },
  mixedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.card,
  },
});