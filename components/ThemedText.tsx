import React from 'react';
import { Text, type TextProps, StyleSheet } from 'react-native';

export type ThemedTextProps = TextProps & {
  type?: 'default' | 'title' | 'subtitle';
};

export function ThemedText({ style, type = 'default', ...rest }: ThemedTextProps) {
  const color = '#000000';
  return (
    <Text
      style={[
        { color },
        type === 'default' ? styles.default : undefined,
        type === 'title' ? styles.title : undefined,
        type === 'subtitle' ? styles.subtitle : undefined,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: { fontSize: 16, lineHeight: 24 },
  title: { fontSize: 32, fontWeight: 'bold' },
  subtitle: { fontSize: 20, fontWeight: 'bold' },
});