// app/(tabs)/editor/components/MainToolbar.tsx

import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants';
import { ToolType, MAIN_TOOLS } from '../config/tools';

interface MainToolbarProps {
  activeTool: ToolType;
  onToolChange: (tool: ToolType) => void;
}

export const MainToolbar: React.FC<MainToolbarProps> = ({
  activeTool,
  onToolChange,
}) => {
  return (
    <View style={styles.container}>
      {MAIN_TOOLS.map((tool) => (
        <TouchableOpacity
          key={tool.key}
          style={[
            styles.toolButton,
            activeTool === tool.key && styles.toolButtonActive,
          ]}
          onPress={() => onToolChange(tool.key)}
          activeOpacity={0.7}
        >
          <Feather
            name={tool.icon as any}
            size={20}
            color={activeTool === tool.key ? Colors.primary : Colors.textSecondary}
          />
          <Text
            style={[
              styles.toolButtonText,
              activeTool === tool.key && styles.toolButtonTextActive,
            ]}
          >
            {tool.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    backgroundColor: Colors.card,
    borderTopWidth: 0.5,
    borderTopColor: Colors.border,
  },
  toolButton: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    minWidth: 60,
  },
  toolButtonActive: {
    backgroundColor: Colors.primary + '15',
  },
  toolButtonText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    fontWeight: '500',
  },
  toolButtonTextActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
});