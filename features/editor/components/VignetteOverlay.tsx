// features/editor/components/VignetteOverlay.tsx - YENİ DOSYA
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface VignetteOverlayProps {
  intensity: number; // 0-100 arası
}

export const VignetteOverlay: React.FC<VignetteOverlayProps> = ({ intensity }) => {
  if (intensity <= 0) return null;

  // Intensity'ye göre hesaplamalar
  const opacity = Math.min(0.7, intensity * 0.008); // 0-0.7 arası maksimum opacity
  const innerStop = Math.max(0.3, 0.8 - (intensity * 0.005)); // İç temiz alan
  const outerStop = Math.min(1.0, 0.9 + (intensity * 0.001)); // Dış karartma

  // Gradient renkleri - merkezden kenarlara
  const colors = [
    'rgba(0,0,0,0)', // Merkez: tamamen şeffaf
    `rgba(0,0,0,${opacity * 0.1})`, // Hafif başlangıç
    `rgba(0,0,0,${opacity * 0.3})`, // Orta geçiş
    `rgba(0,0,0,${opacity * 0.6})`, // Güçlü geçiş
    `rgba(0,0,0,${opacity})`, // Kenar: maksimum karartma
  ];

  const locations = [
    0, 
    innerStop * 0.7,
    innerStop * 0.85, 
    innerStop * 0.95,
    outerStop
  ];

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {/* Sol taraf gradyent */}
      <LinearGradient
        colors={[`rgba(0,0,0,${opacity})`, 'rgba(0,0,0,0)']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: innerStop, y: 0.5 }}
        style={[StyleSheet.absoluteFillObject, { right: '70%' }]}
      />
      
      {/* Sağ taraf gradyent */}
      <LinearGradient
        colors={['rgba(0,0,0,0)', `rgba(0,0,0,${opacity})`]}
        start={{ x: 1 - innerStop, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={[StyleSheet.absoluteFillObject, { left: '70%' }]}
      />
      
      {/* Üst taraf gradyent */}
      <LinearGradient
        colors={[`rgba(0,0,0,${opacity})`, 'rgba(0,0,0,0)']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: innerStop }}
        style={[StyleSheet.absoluteFillObject, { bottom: '70%' }]}
      />
      
      {/* Alt taraf gradyent */}
      <LinearGradient
        colors={['rgba(0,0,0,0)', `rgba(0,0,0,${opacity})`]}
        start={{ x: 0.5, y: 1 - innerStop }}
        end={{ x: 0.5, y: 1 }}
        style={[StyleSheet.absoluteFillObject, { top: '70%' }]}
      />
      
      {/* Köşe gradyentleri - daha yumuşak geçiş için */}
      {/* Sol üst köşe */}
      <LinearGradient
        colors={[
          `rgba(0,0,0,${opacity * 0.8})`,
          `rgba(0,0,0,${opacity * 0.4})`,
          'rgba(0,0,0,0)'
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: innerStop, y: innerStop }}
        style={[StyleSheet.absoluteFillObject, { 
          right: '70%', 
          bottom: '70%' 
        }]}
      />
      
      {/* Sağ üst köşe */}
      <LinearGradient
        colors={[
          `rgba(0,0,0,${opacity * 0.8})`,
          `rgba(0,0,0,${opacity * 0.4})`,
          'rgba(0,0,0,0)'
        ]}
        start={{ x: 1, y: 0 }}
        end={{ x: 1 - innerStop, y: innerStop }}
        style={[StyleSheet.absoluteFillObject, { 
          left: '70%', 
          bottom: '70%' 
        }]}
      />
      
      {/* Sol alt köşe */}
      <LinearGradient
        colors={[
          `rgba(0,0,0,${opacity * 0.8})`,
          `rgba(0,0,0,${opacity * 0.4})`,
          'rgba(0,0,0,0)'
        ]}
        start={{ x: 0, y: 1 }}
        end={{ x: innerStop, y: 1 - innerStop }}
        style={[StyleSheet.absoluteFillObject, { 
          right: '70%', 
          top: '70%' 
        }]}
      />
      
      {/* Sağ alt köşe */}
      <LinearGradient
        colors={[
          `rgba(0,0,0,${opacity * 0.8})`,
          `rgba(0,0,0,${opacity * 0.4})`,
          'rgba(0,0,0,0)'
        ]}
        start={{ x: 1, y: 1 }}
        end={{ x: 1 - innerStop, y: 1 - innerStop }}
        style={[StyleSheet.absoluteFillObject, { 
          left: '70%', 
          top: '70%' 
        }]}
      />
    </View>
  );
};

// Alternatif: Basit ama etkili vignette
export const SimpleVignetteOverlay: React.FC<VignetteOverlayProps> = ({ intensity }) => {
  if (intensity <= 0) return null;

  const opacity = Math.min(0.6, intensity * 0.006);
  const fadeDistance = Math.max(0.2, 0.5 - (intensity * 0.003));

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {/* 4 kenardan radial fade */}
      {['top', 'bottom', 'left', 'right'].map((direction, index) => {
        const isVertical = direction === 'top' || direction === 'bottom';
        const isStart = direction === 'top' || direction === 'left';
        
        return (
          <LinearGradient
            key={direction}
            colors={
              isStart 
                ? [`rgba(0,0,0,${opacity})`, 'rgba(0,0,0,0)']
                : ['rgba(0,0,0,0)', `rgba(0,0,0,${opacity})`]
            }
            start={
              isVertical 
                ? { x: 0.5, y: isStart ? 0 : 1 - fadeDistance }
                : { x: isStart ? 0 : 1 - fadeDistance, y: 0.5 }
            }
            end={
              isVertical 
                ? { x: 0.5, y: isStart ? fadeDistance : 1 }
                : { x: isStart ? fadeDistance : 1, y: 0.5 }
            }
            style={[
              StyleSheet.absoluteFillObject,
              isVertical 
                ? (isStart ? { bottom: '80%' } : { top: '80%' })
                : (isStart ? { right: '80%' } : { left: '80%' })
            ]}
          />
        );
      })}
    </View>
  );
};