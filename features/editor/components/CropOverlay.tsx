// features/editor/components/CropOverlay.tsx - TAM VE EKSİKSİZ VERSİYON (DEBUG METNİ KALDIRILDI)

import React, { useMemo } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Colors, Typography } from '@/constants';
import { useTranslation } from 'react-i18next'; // useTranslation import edildi

interface CropOverlayProps {
  previewSize: { width: number; height: number };
  aspectRatioString: string;
  photoScale?: number;
  photoX?: number;
  photoY?: number;
}

const MASK_COLOR = 'rgba(0, 0, 0, 0.7)';
const FRAME_COLOR = '#FFD700';
const GRID_COLOR = 'rgba(255, 255, 255, 0.8)';

export const CropOverlay: React.FC<CropOverlayProps> = ({ 
  previewSize, 
  aspectRatioString,
  photoScale = 1,
  photoX = 0.5,
  photoY = 0.5 
}) => {
  const { t } = useTranslation();
  const cropFrame = useMemo(() => {
    console.log(t('editor.crop.calculatingFrameLog'), { previewSize, aspectRatioString });
    
    if (!previewSize || previewSize.width === 0 || previewSize.height === 0) {
      console.log(t('common.invalidSize'));
      return null;
    }

    let targetRatio: number;
    if (aspectRatioString === 'original' || !aspectRatioString) {
      targetRatio = previewSize.width / previewSize.height;
    } else {
      const [w, h] = aspectRatioString.split(':').map(Number);
      targetRatio = w && h ? w / h : previewSize.width / previewSize.height;
    }

    console.log(t('editor.crop.targetRatioLog'), targetRatio, t('editor.crop.from'), aspectRatioString);

    const maxWidth = previewSize.width * 0.8;
    const maxHeight = previewSize.height * 0.8;

    let frameWidth = maxWidth;
    let frameHeight = frameWidth / targetRatio;

    if (frameHeight > maxHeight) {
      frameHeight = maxHeight;
      frameWidth = frameHeight * targetRatio;
    }

    const frameLeft = (previewSize.width - frameWidth) / 2;
    const frameTop = (previewSize.height - frameHeight) / 2;

    const result = {
      left: frameLeft,
      top: frameTop,
      width: frameWidth,
      height: frameHeight,
      ratio: targetRatio
    };

    console.log(t('editor.crop.calculatedFrameLog'), result);
    return result;
  }, [previewSize, aspectRatioString, t]);

  if (!cropFrame) return null;

  return (
    <>
      <View style={[
        styles.mask, 
        { 
          top: 0, 
          left: 0, 
          right: 0, 
          height: cropFrame.top 
        }
      ]} />
      
      <View style={[
        styles.mask, 
        { 
          bottom: 0, 
          left: 0, 
          right: 0, 
          height: previewSize.height - cropFrame.top - cropFrame.height 
        }
      ]} />
      
      <View style={[
        styles.mask, 
        { 
          top: cropFrame.top, 
          left: 0, 
          width: cropFrame.left,
          height: cropFrame.height
        }
      ]} />
      
      <View style={[
        styles.mask, 
        { 
          top: cropFrame.top, 
          right: 0, 
          width: previewSize.width - cropFrame.left - cropFrame.width,
          height: cropFrame.height
        }
      ]} />

      <View style={[
        styles.cropFrame, 
        {
          left: cropFrame.left,
          top: cropFrame.top,
          width: cropFrame.width,
          height: cropFrame.height,
        }
      ]}>
        <View style={styles.gridContainer}>
          <View style={[styles.gridLineVertical, { left: cropFrame.width * 0.33 }]} />
          <View style={[styles.gridLineVertical, { left: cropFrame.width * 0.66 }]} />
          
          <View style={[styles.gridLineHorizontal, { top: cropFrame.height * 0.33 }]} />
          <View style={[styles.gridLineHorizontal, { top: cropFrame.height * 0.66 }]} />
        </View>

        <View style={[styles.corner, styles.topLeft]} />
        <View style={[styles.corner, styles.topRight]} />
        <View style={[styles.corner, styles.bottomLeft]} />
        <View style={[styles.corner, styles.bottomRight]} />
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  mask: {
    position: 'absolute',
    backgroundColor: MASK_COLOR,
  },
  cropFrame: {
    position: 'absolute',
    borderWidth: 3,
    borderColor: FRAME_COLOR,
    borderStyle: 'solid',
  },
  gridContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  gridLineVertical: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: GRID_COLOR,
  },
  gridLineHorizontal: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: GRID_COLOR,
  },
  corner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: FRAME_COLOR,
    borderWidth: 3,
  },
  topLeft: {
    top: -3,
    left: -3,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: -3,
    right: -3,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: -3,
    left: -3,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: -3,
    right: -3,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
});