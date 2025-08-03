// client/features/editor/components/CropOverlay.tsx (TAM VE GÜNCELLENMİŞ KOD)
import React from 'react';
import { View, StyleSheet } from 'react-native';

interface CropOverlayProps {
  previewSize: { width: number; height: number };
  aspectRatioString: string;
}

export const CropOverlay: React.FC<CropOverlayProps> = ({ previewSize, aspectRatioString }) => {
  if (previewSize.width === 0 || previewSize.height === 0) return null;

  let aspectRatio = previewSize.width / previewSize.height;
  if (aspectRatioString !== 'original') {
    const [w, h] = aspectRatioString.split(':').map(Number);
    if (w && h) aspectRatio = w / h;
  }

  let frameWidth = previewSize.width;
  let frameHeight = frameWidth / aspectRatio;

  if (frameHeight > previewSize.height) {
    frameHeight = previewSize.height;
    frameWidth = frameHeight * aspectRatio;
  }

  const frameTop = (previewSize.height - frameHeight) / 2;
  const frameLeft = (previewSize.width - frameWidth) / 2;

  const frameStyle = { ...styles.cropFrame, top: frameTop, left: frameLeft, width: frameWidth, height: frameHeight, shadowColor: 'rgba(0, 0, 0, 0.6)' };

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={frameStyle}>
        <View style={styles.gridContainer}><View style={styles.gridLine} /><View style={styles.gridLine} /></View>
        <View style={[styles.gridContainer, { transform: [{ rotate: '90deg' }] }]}><View style={styles.gridLine} /><View style={styles.gridLine} /></View>
        <View style={[styles.handle, styles.topLeft]} /><View style={[styles.handle, styles.topRight]} />
        <View style={[styles.handle, styles.bottomLeft]} /><View style={[styles.handle, styles.bottomRight]} />
      </View>
    </View>
  );
};

const HANDLE_SIZE = 24, HANDLE_THICKNESS = 4, HANDLE_COLOR = 'rgba(255, 255, 255, 0.9)';
const styles = StyleSheet.create({
  cropFrame: { position: 'absolute', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.6)', elevation: 10, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 0 },
  gridContainer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, flexDirection: 'row', justifyContent: 'space-around' },
  gridLine: { width: StyleSheet.hairlineWidth, backgroundColor: 'rgba(255, 255, 255, 0.4)' },
  handle: { position: 'absolute', width: HANDLE_SIZE, height: HANDLE_SIZE },
  topLeft: { top: -HANDLE_THICKNESS, left: -HANDLE_THICKNESS, borderTopWidth: HANDLE_THICKNESS, borderLeftWidth: HANDLE_THICKNESS, borderColor: HANDLE_COLOR },
  topRight: { top: -HANDLE_THICKNESS, right: -HANDLE_THICKNESS, borderTopWidth: HANDLE_THICKNESS, borderRightWidth: HANDLE_THICKNESS, borderColor: HANDLE_COLOR },
  bottomLeft: { bottom: -HANDLE_THICKNESS, left: -HANDLE_THICKNESS, borderBottomWidth: HANDLE_THICKNESS, borderLeftWidth: HANDLE_THICKNESS, borderColor: HANDLE_COLOR },
  bottomRight: { bottom: -HANDLE_THICKNESS, right: -HANDLE_THICKNESS, borderBottomWidth: HANDLE_THICKNESS, borderRightWidth: HANDLE_THICKNESS, borderColor: HANDLE_COLOR },
});