// kodlar/components/Card.tsx
import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle, Platform } from 'react-native';
import { Colors, BorderRadius, Spacing } from '@/constants';
import { Layout } from '@/constants/Layout';

interface CardProps {
  children: ReactNode;
  style?: ViewStyle;
  padding?: 'none' | 'small' | 'medium' | 'large';
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  padding = 'medium',
}) => {
  const paddingValue = () => {
    const scale = Layout.isTablet ? 1.5 : 1;
    switch (padding) {
      case 'small':
        return Spacing.md * scale;
      case 'medium':
        return Spacing.lg * scale;
      case 'large':
        return Spacing.xl * scale;
      case 'none':
      default:
        return 0;
    }
  };

  const cardStyles = [
    styles.card,
    { padding: paddingValue() },
    style,
  ];

  return <View style={cardStyles}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: Layout.isTablet ? BorderRadius.xl : BorderRadius.lg,
    ...Platform.select({
      ios: {
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 5,
        borderWidth: 1,
        borderColor: Colors.border,
        shadowColor: Colors.shadow,
      },
    }),
  },
});