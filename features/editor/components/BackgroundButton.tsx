import React from 'react';
import { OptimizedBackgroundButton } from './OptimizedBackgroundButton';

interface Background {
  id: string;
  name: string;
  thumbnailUrl: string;
  fullUrl: string;
}

interface BackgroundButtonProps {
  background: Background;
  isSelected: boolean;
  onPress: () => void;
}

/**
 * BackgroundButton artık optimize edilmiş versiyonu kullanır
 * Cache'li thumbnail loading ve memory optimization ile
 */
export const BackgroundButton: React.FC<BackgroundButtonProps> = (props) => {
  return <OptimizedBackgroundButton {...props} />;
};