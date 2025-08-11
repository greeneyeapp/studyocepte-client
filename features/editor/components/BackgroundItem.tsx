// client/features/editor/components/BackgroundItem.tsx - YENİ VE BASİTLEŞTİRİLMİŞ (Debug Kenarlıklı)
import React from 'react';
import { TouchableOpacity, Image, View, StyleSheet, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, BorderRadius, Spacing } from '@/constants';

interface Background {
  id: string;
  name: string;
  thumbnailUrl: string; // Artık doğrudan string URI bekliyoruz
  fullUrl: string;
}

interface BackgroundItemProps {
  background: Background;
  isSelected: boolean;
  onPress: () => void;
}

/**
 * ✅ YENİ: Basit arka plan öğesi butonu.
 *    Sadece verilen URI'yi göstermeye odaklanır.
 *    Hata ayıklama için geçici bir kenarlık içerir.
 */
export const BackgroundItem: React.FC<BackgroundItemProps> = ({
  background,
  isSelected,
  onPress,
}) => {
  // Debug logu
  if (__DEV__) {
    console.log(`🖼️ BackgroundItem Render: ${background.id}`, {
      thumbnailUri: background.thumbnailUrl ? background.thumbnailUrl.substring(0, 50) + '...' : 'yok',
      isSelected,
    });
  }

  return (
    <TouchableOpacity
      style={[
        styles.container,
        isSelected && styles.containerSelected
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: background.thumbnailUrl }}
          style={[
            styles.backgroundImage,
            // GEÇİCİ HATA AYIKLAMA KENARLIĞI: Görselin render edilip edilmediğini görmek için
            { borderWidth: 2, borderColor: 'purple', backgroundColor: Colors.gray200 }
          ]}
          onError={(e) => {
            console.warn(`❌ BackgroundItem Image Error for ${background.id}:`, e.nativeEvent.error);
            // Hata durumunda boş bir görünüm döndürebilirsiniz veya bir placeholder
          }}
          onLoad={() => {
            if (__DEV__) console.log(`✅ BackgroundItem Image Loaded for ${background.id}`);
          }}
          resizeMode="cover"
        />
        {/* Görsel yüklenmiyorsa veya yoksa göstermek için metin (sadece debug amaçlı) */}
        {!background.thumbnailUrl && (
          <View style={styles.noImageOverlay}>
            <Text style={styles.noImageText}>Görsel Yok</Text>
          </View>
        )}
      </View>

      {/* Seçim göstergesi */}
      {isSelected && (
        <View style={styles.selectionIndicator}>
          <Feather name="check" size={12} color={Colors.card} />
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    marginRight: Spacing.md, // <-- Spacing.lg yerine Spacing.md olarak değiştirildi
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  containerSelected: {
    borderColor: Colors.primary,
    transform: [{ scale: 1.05 }],
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  imageContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center', // Ortalamak için
    alignItems: 'center',    // Ortalamak için
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
  },
  selectionIndicator: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  noImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.gray400,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImageText: {
    fontSize: 8,
    color: Colors.card,
    fontWeight: 'bold',
  }
});