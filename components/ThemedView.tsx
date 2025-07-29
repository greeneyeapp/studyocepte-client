import React from 'react';
import { View, type ViewProps } from 'react-native';

export function ThemedView({ style, ...otherProps }: ViewProps) {
  const backgroundColor = '#FFFFFF'; // Basit bir arka plan rengi
  return <View style={[{ backgroundColor }, style]} {...otherProps} />;
}