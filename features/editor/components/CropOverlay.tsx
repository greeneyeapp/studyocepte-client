// client/features/editor/components/CropOverlay.tsx (TAM VE GÜNCELLENMİŞ KOD)
import React from 'react';
import { View, StyleSheet } from 'react-native';

interface CropOverlayProps {
  previewSize: { width: number; height: number };
  aspectRatioString: string;
}

const MASK_COLOR = 'rgba(0, 0, 0, 0.6)';
const HANDLE_COLOR = 'rgba(255, 255, 255, 0.9)';
const HANDLE_SIZE = 24;
const HANDLE_THICKNESS = 4;

export const CropOverlay: React.FC<CropOverlayProps> = ({ previewSize, aspectRatioString }) => {
  // Eğer önizleme boyutu henüz hesaplanmadıysa hiçbir şey çizme
  if (!previewSize || previewSize.width === 0 || previewSize.height === 0) {
    return null;
  }

  // 1. Hedef en-boy oranını (aspect ratio) hesapla.
  let targetRatio: number;
  if (aspectRatioString === 'original' || !aspectRatioString) {
    // 'Orijinal' seçiliyse, önizleme alanının kendi oranını kullan.
    targetRatio = previewSize.width / previewSize.height;
  } else {
    // '4:5' gibi bir string'i sayısal bir orana çevir.
    const [w, h] = aspectRatioString.split(':').map(Number);
    targetRatio = w && h ? w / h : previewSize.width / previewSize.height;
  }

  // 2. Kırpma çerçevesinin (frame) boyutlarını, önizleme alanına sığacak şekilde hesapla.
  let frameWidth = previewSize.width;
  let frameHeight = frameWidth / targetRatio;

  // Eğer hesaplanan yükseklik, önizleme alanının yüksekliğini aşıyorsa,
  // yüksekliği sabitleyip genişliği yeniden hesapla.
  if (frameHeight > previewSize.height) {
    frameHeight = previewSize.height;
    frameWidth = frameHeight * targetRatio;
  }

  // 3. Çerçevenin, önizleme alanı içinde ortalanması için gereken pozisyonu hesapla.
  const frameTop = (previewSize.height - frameHeight) / 2;
  const frameLeft = (previewSize.width - frameWidth) / 2;

  const frameStyle = {
    top: frameTop,
    left: frameLeft,
    width: frameWidth,
    height: frameHeight,
  };

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* KARARTMA MASKELERİ (Çerçevenin dışındaki alanlar) */}
      <View style={[styles.mask, { top: 0, left: 0, right: 0, height: frameTop }]} />
      <View style={[styles.mask, { bottom: 0, left: 0, right: 0, height: frameTop }]} />
      <View style={[styles.mask, { top: frameTop, left: 0, bottom: frameTop, width: frameLeft }]} />
      <View style={[styles.mask, { top: frameTop, right: 0, bottom: frameTop, width: frameLeft }]} />

      {/* KIRPMA ÇERÇEVESİ, KILAVUZ ÇİZGİLERİ VE KÖŞE TUTAMAÇLARI */}
      <View style={[styles.cropFrame, frameStyle]}>
        <View style={styles.gridContainer}>
          <View style={styles.gridLine} /><View style={styles.gridLine} />
        </View>
        <View style={[styles.gridContainer, { transform: [{ rotate: '90deg' }] }]}>
          <View style={styles.gridLine} /><View style={styles.gridLine} />
        </View>
        <View style={[styles.handle, styles.topLeft]} />
        <View style={[styles.handle, styles.topRight]} />
        <View style={[styles.handle, styles.bottomLeft]} />
        <View style={[styles.handle, styles.bottomRight]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  mask: { position: 'absolute', backgroundColor: MASK_COLOR },
  cropFrame: { position: 'absolute', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.7)' },
  gridContainer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, flexDirection: 'row', justifyContent: 'space-around' },
  gridLine: { width: StyleSheet.hairlineWidth, backgroundColor: 'rgba(255, 255, 255, 0.5)' },
  handle: { position: 'absolute', width: HANDLE_SIZE, height: HANDLE_SIZE, borderColor: HANDLE_COLOR },
  topLeft: { top: -HANDLE_THICKNESS, left: -HANDLE_THICKNESS, borderTopWidth: HANDLE_THICKNESS, borderLeftWidth: HANDLE_THICKNESS },
  topRight: { top: -HANDLE_THICKNESS, right: -HANDLE_THICKNESS, borderTopWidth: HANDLE_THICKNESS, borderRightWidth: HANDLE_THICKNESS },
  bottomLeft: { bottom: -HANDLE_THICKNESS, left: -HANDLE_THICKNESS, borderBottomWidth: HANDLE_THICKNESS, borderLeftWidth: HANDLE_THICKNESS },
  bottomRight: { bottom: -HANDLE_THICKNESS, right: -HANDLE_THICKNESS, borderBottomWidth: HANDLE_THICKNESS, borderRightWidth: HANDLE_THICKNESS },
});