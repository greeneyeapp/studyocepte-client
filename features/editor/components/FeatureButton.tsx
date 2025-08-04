// features/editor/components/FeatureButton.tsx - GELİŞMİŞ VERSİYON

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
  const handlePress = () => {
    console.log('🔘 Feature button pressed:', label, 'Current value:', value, 'Active:', isActive);
    onPress();
  };

  // Değer hesaplamaları
  const hasAnyValue = hasMixedValues 
    ? (productValue !== 0 || backgroundValue !== 0)
    : (value !== 0);
  
  const hasDifferentValues = hasMixedValues && (productValue !== backgroundValue);
  
  // Container stili
  const getContainerStyle = () => {
    return isActive ? styles.containerActive : styles.container;
  };

  // Icon container stili - daha akıllı
  const getIconContainerStyle = () => {
    if (isActive) {
      return styles.iconContainerActive;
    }
    
    if (hasMixedValues && hasAnyValue) {
      if (hasDifferentValues) {
        // Farklı değerler varsa kırmızı border
        return styles.iconContainerMixed;
      } else {
        // Aynı değerler varsa normal aktif stil
        return styles.iconContainerWithValue;
      }
    }
    
    if (hasAnyValue) {
      return styles.iconContainerWithValue;
    }
    
    return styles.iconContainer;
  };

  // Icon rengi
  const getIconColor = () => {
    if (isActive || hasAnyValue) return Colors.card;
    return Colors.textPrimary;
  };

  // Label stili
  const getLabelStyle = () => {
    if (isActive) return [styles.label, styles.labelActive];
    if (hasAnyValue) return [styles.label, styles.labelWithValue];
    return styles.label;
  };

  // Görüntülenecek değer - geliştirilmiş
  const getDisplayValue = () => {
    if (hasMixedValues && hasDifferentValues) {
      // Farklı değerler varsa kısa gösterim
      return '±';
    }
    
    if (hasMixedValues && !hasDifferentValues && hasAnyValue) {
      // Aynı değerler varsa o değeri göster
      const commonValue = productValue || backgroundValue;
      return commonValue > 0 ? `+${commonValue}` : `${commonValue}`;
    }
    
    // Normal durumda değeri göster
    return value > 0 ? `+${value}` : `${value}`;
  };

  // Tooltip metni (debug için)
  const getTooltipText = () => {
    if (hasMixedValues) {
      return `Ürün: ${productValue}, Arka Plan: ${backgroundValue}`;
    }
    return `Değer: ${value}`;
  };

  return (
    <TouchableOpacity 
      style={getContainerStyle()} 
      onPress={handlePress}
      activeOpacity={0.7}
      // Debug için uzun basma
      onLongPress={() => {
        if (__DEV__) {
          console.log(`📊 ${label} - ${getTooltipText()}`);
        }
      }}
    >
      <View style={getIconContainerStyle()}>
        {hasAnyValue ? (
          <Text style={[
            styles.valueText, 
            hasMixedValues && hasDifferentValues && styles.valueTextMixed,
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
        
        {/* Karışık durum göstergesi - sadece gerçekten farklı değerler olduğunda */}
        {hasMixedValues && hasDifferentValues && !isActive && (
          <View style={styles.mixedIndicator}>
            <View style={styles.mixedDot} />
          </View>
        )}
        
        {/* Aktif durum göstergesi */}
        {isActive && (
          <View style={styles.activeIndicator}>
            <Feather name="circle" size={6} color={Colors.card} />
          </View>
        )}
      </View>
      
      <Text style={getLabelStyle()}>
        {label}
      </Text>
      
      {/* Debug bilgisi - sadece geliştirme modunda */}
      {__DEV__ && hasMixedValues && (
        <Text style={styles.debugText}>
          {productValue}/{backgroundValue}
        </Text>
      )}
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
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 2,
    borderColor: Colors.card,
  },
  iconContainerMixed: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.warning, // Farklı renk karışık durum için
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    position: 'relative',
    borderWidth: 2,
    borderColor: Colors.error,
  },
  valueText: {
    ...Typography.captionMedium,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.card,
    textAlign: 'center',
  },
  valueTextMixed: {
    fontSize: 16, // Daha büyük ± işareti
    fontWeight: '800',
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
  
  // Göstergeler
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
  activeIndicator: {
    position: 'absolute',
    bottom: -3,
    alignSelf: 'center',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.card,
  },
  
  // Debug
  debugText: {
    ...Typography.caption,
    fontSize: 8,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 2,
  },
});