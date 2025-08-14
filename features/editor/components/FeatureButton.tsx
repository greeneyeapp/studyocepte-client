// features/editor/components/FeatureButton.tsx - DÜZELTİLDİ

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants';
import { useTranslation } from 'react-i18next';

interface FeatureButtonProps {
  icon: string;
  label: string; // label artık çeviri anahtarı olarak gelecek
  value: number;
  isActive: boolean;
  onPress: () => void;
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
  const { t } = useTranslation();
  const handlePress = () => {
    console.log(t('editor.featureButtonPressedLog'), t(label), t('editor.currentValueLog'), value, t('editor.activeLog'), isActive);
    onPress();
  };

  const hasAnyValue = hasMixedValues 
    ? (productValue !== 0 || backgroundValue !== 0)
    : (value !== 0);
  
  const hasDifferentValues = hasMixedValues && (productValue !== backgroundValue);
  
  const getContainerStyle = () => {
    return isActive ? styles.containerActive : styles.container;
  };

  const getIconContainerStyle = () => {
    if (isActive) {
      return styles.iconContainerActive;
    }
    
    if (hasMixedValues && hasAnyValue) {
      if (hasDifferentValues) {
        return styles.iconContainerMixed;
      } else {
        return styles.iconContainerWithValue;
      }
    }
    
    if (hasAnyValue) {
      return styles.iconContainerWithValue;
    }
    
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

  const getDisplayValue = () => {
    if (hasMixedValues && hasDifferentValues) {
      return '±';
    }
    
    if (hasMixedValues && !hasDifferentValues && hasAnyValue) {
      const commonValue = productValue || backgroundValue;
      return commonValue > 0 ? `+${commonValue}` : `${commonValue}`;
    }
    
    return value > 0 ? `+${value}` : `${value}`;
  };

  return (
    <TouchableOpacity 
      style={getContainerStyle()} 
      onPress={handlePress}
      activeOpacity={0.7}
      onLongPress={() => {
        if (__DEV__) {
          console.log(t('editor.featureDebugLog', { label: t(label), productValue, backgroundValue }));
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
        
        {hasMixedValues && hasDifferentValues && !isActive && (
          <View style={styles.mixedIndicator}>
            <View style={styles.mixedDot} />
          </View>
        )}
        
        {isActive && (
          <View style={styles.activeIndicator}>
            <Feather name="circle" size={6} color={Colors.card} />
          </View>
        )}
      </View>
      
      <Text 
        style={getLabelStyle()}
        numberOfLines={2}
        adjustsFontSizeToFit={true}
        minimumFontScale={0.75}
        textAlign="center"
      >
        {t(label)} {/* label artık çeviri anahtarı */}
      </Text>
      
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
    minWidth: 80,
    maxWidth: 100,
    paddingHorizontal: Spacing.sm,
    position: 'relative',
    flex: 1,
  },
  containerActive: {
    alignItems: 'center',
    minWidth: 80,
    maxWidth: 100,
    paddingHorizontal: Spacing.sm,
    position: 'relative',
    flex: 1,
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
    backgroundColor: Colors.warning,
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
    fontSize: 16,
    fontWeight: '800',
  },
  label: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
    width: '100%',
    minHeight: 24,
    lineHeight: 12,
  },
  labelActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  labelWithValue: {
    color: Colors.primary,
    fontWeight: '600',
  },
  
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
  
  debugText: {
    ...Typography.caption,
    fontSize: 8,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 2,
  },
});