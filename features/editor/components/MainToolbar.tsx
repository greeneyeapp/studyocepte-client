// features/editor/components/MainToolbar.tsx - DÜZELTİLDİ

import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants';
import { ToolType, MAIN_TOOLS } from '../config/tools';
import { useTranslation } from 'react-i18next';

interface MainToolbarProps {
  activeTool: ToolType;
  onToolChange: (tool: ToolType) => void;
}

export const MainToolbar: React.FC<MainToolbarProps> = ({
  activeTool,
  onToolChange,
}) => {
  const { t } = useTranslation();
  return (
    <View style={styles.container}>
      {MAIN_TOOLS.map((tool, index) => {
        const isActive = activeTool === tool.key;
        
        return (
          <TouchableOpacity
            key={tool.key}
            style={styles.toolButton}
            onPress={() => onToolChange(tool.key)}
            activeOpacity={0.7}
          >
            <View style={[
              styles.iconContainer,
              isActive && styles.iconContainerActive
            ]}>
              <Feather
                name={tool.icon as any}
                size={20}
                color={isActive ? Colors.card : Colors.textSecondary}
              />
            </View>
            
            <Text
              style={[
                styles.toolButtonText,
                isActive && styles.toolButtonTextActive,
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit={true}
              minimumFontScale={0.8}
            >
              {t(tool.label)} {/* tool.label artık çeviri anahtarı */}
            </Text>
            
            {isActive && <View style={styles.activeIndicator} />}
          </TouchableOpacity>
        );
      })}
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
    minHeight: 80,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 5,
  },
  
  toolButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    borderRadius: BorderRadius.lg,
    minWidth: 60,
    flex: 1,
    maxWidth: 80,
    position: 'relative',
    marginHorizontal: 2,
    backgroundColor: 'transparent',
  },
  
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xs,
    backgroundColor: Colors.gray100,
  },
  
  iconContainerActive: {
    backgroundColor: Colors.primary,
  },
  
  toolButtonText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: '500',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 13,
  },
  
  toolButtonTextActive: {
    color: Colors.primary,
    fontWeight: '700',
    fontSize: 12,
  },
  
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    left: '25%',
    right: '25%',
    height: 3,
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
});