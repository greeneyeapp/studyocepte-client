import React, { useEffect, useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet, // DÜZELTME: StyleStyleSheet -> StyleSheet
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Dimensions,
  Pressable,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Feather } from '@expo/vector-icons';
import { useEditorStore } from '@/stores/useEditorStore';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants';
import { ToastService } from '@/components/Toast/ToastService';
import { Layout } from '@/constants/Layout';

// react-native-gesture-handler ve react-native-reanimated importları
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  runOnJS,
} from 'react-native-reanimated';

// expo-gl importu
import { GLView } from 'expo-gl';
import { Asset } from 'expo-asset'; // Görüntüleri dokuya yüklemek için Asset kullanılır
import { GL } from 'expo-gl'; // GL sabitleri için

// Ekran boyutlarını al
const { width: SCREEN_WIDTH } = Dimensions.get('window');

// =================================================================
// Bileşen 1: AppleSlider (İnce ayarlar için) - GÜNCEL
// =================================================================
const AppleSlider = ({
  label, value, onValueChange, icon, min = -100, max = 100, onReset,
}) => {
  const [sliderWidth, setSliderWidth] = useState(0);

  const initialPosition = useMemo(() => {
    if (sliderWidth === 0) return 0;
    const percentage = (value - min) / (max - min);
    return percentage * sliderWidth;
  }, [value, sliderWidth, min, max]);

  const translateX = useSharedValue(initialPosition);
  const startX = useSharedValue(initialPosition);

  useEffect(() => {
    if (sliderWidth > 0) {
      const percentage = (value - min) / (max - min);
      translateX.value = percentage * sliderWidth;
      startX.value = percentage * sliderWidth;
    }
  }, [value, sliderWidth, min, max]);


  const panGesture = Gesture.Pan()
    .onStart(() => {
      startX.value = translateX.value;
    })
    .onUpdate((event) => {
      let newPosition = startX.value + event.translationX;
      
      newPosition = Math.max(0, Math.min(sliderWidth, newPosition));
      translateX.value = newPosition;

      const percentage = newPosition / sliderWidth;
      const newValue = min + percentage * (max - min);
      runOnJS(onValueChange)(Math.round(newValue));
    })
    .onEnd(() => {
      // Ayarlar doğrudan GLView'a shader'lar aracılığıyla iletildiği için
      // burada ek bir API çağrısı veya debouncing'e gerek yok.
    });

  const thumbAnimatedStyle = useAnimatedStyle(() => {
    return {
      left: translateX.value,
    };
  });

  const activeTrackAnimatedStyle = useAnimatedStyle(() => {
    const center = sliderWidth / 2;
    const currentPos = translateX.value;
    return {
      left: currentPos > center ? center : currentPos,
      width: Math.abs(currentPos - center),
    };
  });

  return (
    <View style={styles.sliderContainer}>
      <View style={styles.sliderHeader}>
        <View style={styles.sliderLabelContainer}>
          <Feather name={icon} size={18} color={Colors.textPrimary} />
          <Text style={styles.sliderLabel}>{label}</Text>
        </View>
        <View style={styles.sliderValueContainer}>
          <Text style={styles.sliderValue}>{value > 0 ? `+${value}` : value}</Text>
          {onReset && value !== 0 && (
            <TouchableOpacity onPress={onReset} style={styles.resetButton}>
              <Feather name="rotate-ccw" size={16} color={Colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>
      <GestureDetector gesture={panGesture}>
        <Animated.View
          style={styles.sliderTrackContainer}
          onLayout={(e) => setSliderWidth(e.nativeEvent.layout.width)}
        >
          <View style={styles.sliderTrack} />
          <View style={[styles.centerMark, { left: sliderWidth / 2 - 1 }]} />
          <Animated.View style={[styles.activeTrack, activeTrackAnimatedStyle]} />
          <Animated.View style={[styles.sliderThumb, thumbAnimatedStyle]} />
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

// =================================================================
// Ana Component - GÜNCEL VE GLVIEW İLE FİLTRELER UYGULANIYOR
// =================================================================
export default function ModernPhotoEditor() {
  const { t } = useTranslation();
  const { photoId } = useLocalSearchParams<{ photoId: string }>();
  const router = useRouter();
  
  const [currentTool, setCurrentTool] = useState<'adjust' | 'filters' | 'crop'>('adjust');
  const [showOriginal, setShowOriginal] = useState(false); // Bu state artık GLView içinde uniform olarak kullanılacak
  const [previewSize, setPreviewSize] = useState({ width: 0, height: 0 });
  const glRef = useRef(null); // GLView referansı
  const [glContext, setGlContext] = useState(null); // GL bağlamını tutmak için
  const [glProgram, setGlProgram] = useState(null); // GL programını tutmak için
  const [glTexture, setGlTexture] = useState(null); // GL dokusunu tutmak için

  const {
    activePhoto, backgrounds, isLoading, isSaving, settings,
    setActivePhotoById, fetchBackgrounds, updateSettings, saveChanges, clearStore, resetToDefaults,
  } = useEditorStore();

  // Reanimated Shared Values for photo transformations
  const photoX = useSharedValue(0);
  const photoY = useSharedValue(0);
  const photoScale = useSharedValue(1);
  const photoRotation = useSharedValue(0);

  // Başlangıç değerlerini tutmak için SharedValues
  const initialPhotoX = useSharedValue(0);
  const initialPhotoY = useSharedValue(0);
  const initialPhotoScale = useSharedValue(1);
  const initialPhotoRotation = useSharedValue(0);

  // Store'daki ayarlar değiştiğinde SharedValues'ı güncelle
  useEffect(() => {
    if (previewSize.width > 0 && previewSize.height > 0) {
      photoX.value = (settings.photoX - 0.5) * previewSize.width;
      photoY.value = (settings.photoY - 0.5) * previewSize.height;
    } else {
      photoX.value = 0;
      photoY.value = 0;
    }
    
    photoScale.value = settings.photoScale;
    photoRotation.value = settings.photoRotation;

    initialPhotoX.value = photoX.value;
    initialPhotoY.value = photoY.value;
    initialPhotoScale.value = photoScale.value;
    initialPhotoRotation.value = photoRotation.value;

  }, [settings.photoX, settings.photoY, settings.photoScale, settings.photoRotation, previewSize]);

  // Bileşen yüklendiğinde ve photoId değiştiğinde verileri getir
  useEffect(() => {
    console.log("setActivePhotoById useEffect tetiklendi.");
    if (photoId) {
      setActivePhotoById(photoId);
      fetchBackgrounds();
    }
    return () => {
      console.log("Component unmount, store temizleniyor.");
      clearStore();
    };
  }, [photoId, setActivePhotoById, fetchBackgrounds, clearStore]);

  // === GLSL Shader'lar ===
  // Vertex Shader: Görüntüyü ekrana yansıtmak için basit bir shader
  const vertexShaderSource = `
    attribute vec2 position;
    varying vec2 uv;
    void main() {
      gl_Position = vec4(position, 0.0, 1.0);
      uv = (position + 1.0) / 2.0; // 0-1 aralığında UV koordinatları
    }
  `;

  // Fragment Shader: Görüntüye filtreleri uygulayan shader
  const fragmentShaderSource = `
    precision highp float;
    varying vec2 uv;
    uniform sampler2D u_texture; // Görüntü dokusu
    uniform float u_brightness;  // Parlaklık (-1.0 to 1.0)
    uniform float u_contrast;    // Kontrast (0.0 to 2.0)
    uniform float u_saturation;  // Doygunluk (0.0 to 2.0)
    uniform float u_hue;         // Ton (derece cinsinden, -180 to 180)
    uniform float u_vignette;    // Vinyet yoğunluğu (0.0 to 1.0)
    uniform bool u_showOriginal; // Orijinal görüntüyü gösterip göstermeme bayrağı

    // RGB to HSV dönüşümü
    vec3 rgb2hsv(vec3 c) {
      vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
      vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
      vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));

      float d = q.x - min(q.w, q.y);
      float e = 1.0e-10;
      return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
    }

    // HSV to RGB dönüşümü
    vec3 hsv2rgb(vec3 c) {
      vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
      vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
      return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
    }

    void main() {
      vec4 color = texture2D(u_texture, uv);
      vec3 rgb = color.rgb;

      if (u_showOriginal) {
        gl_FragColor = color; // Eğer orijinal gösterilecekse, filtre uygulama
        return;
      }

      // Parlaklık
      rgb += u_brightness;

      // Kontrast
      rgb = ((rgb - 0.5) * u_contrast) + 0.5;

      // Doygunluk (RGB'den HSV'ye, S'yi ayarla, tekrar RGB'ye)
      vec3 hsv = rgb2hsv(rgb);
      hsv.y *= u_saturation; // Doygunluğu ayarla
      rgb = hsv2rgb(hsv);

      // Ton (Sıcaklık/Hue)
      hsv = rgb2hsv(rgb);
      hsv.x = mod(hsv.x + u_hue / 360.0, 1.0); // Hue'yi 0-1 aralığında kaydır
      rgb = hsv2rgb(hsv);

      // Vinyet
      float dist = distance(uv, vec2(0.5, 0.5)); // Merkezden uzaklık
      float vignette_intensity = 1.0 - dist * u_vignette * 2.0; // Vinyet yoğunluğunu ayarla
      vignette_intensity = clamp(vignette_intensity, 0.0, 1.0); // Değeri 0-1 aralığında tut
      rgb *= vignette_intensity; // Görüntüyü vinyet ile karart

      gl_FragColor = vec4(rgb, color.a);
    }
  `;

  // === GLView Render Mantığı ===
  const renderGlContent = async () => {
    if (!glContext || !activePhoto || typeof activePhoto.processedImageUrl !== 'string' || activePhoto.processedImageUrl.length === 0) {
      console.log("GL render edilemiyor: glContext, activePhoto veya geçerli processedImageUrl eksik.");
      if (activePhoto && (typeof activePhoto.processedImageUrl !== 'string' || activePhoto.processedImageUrl.length === 0)) {
        console.error("Geçersiz activePhoto.processedImageUrl:", activePhoto.processedImageUrl);
        ToastService.show({ type: 'error', text1: 'Hata', text2: 'Geçersiz işlenmiş görüntü URL\'si.' });
      }
      return;
    }

    const gl = glContext;

    // Eğer program henüz oluşturulmadıysa, oluştur
    if (!glProgram) {
      const program = gl.createProgram();
      const vertexShader = gl.createShader(gl.VERTEX_SHADER);
      gl.shaderSource(vertexShader, vertexShaderSource);
      gl.compileShader(vertexShader);
      gl.attachShader(program, vertexShader);

      const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
      gl.shaderSource(fragmentShader, fragmentShaderSource);
      gl.compileShader(fragmentShader);
      gl.attachShader(program, fragmentShader);

      gl.linkProgram(program);
      gl.useProgram(program);
      setGlProgram(program);

      // Vertex buffer'ı oluştur ve ayarla (sadece bir kez)
      const buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]), gl.STATIC_DRAW);

      const positionAttrib = gl.getAttribLocation(program, 'position');
      gl.enableVertexAttribArray(positionAttrib);
      gl.vertexAttribPointer(positionAttrib, 2, gl.FLOAT, false, 0, 0);

      // Doku birimini ayarla
      gl.uniform1i(gl.getUniformLocation(program, 'u_texture'), 0);
    } else {
      gl.useProgram(glProgram); // Mevcut programı kullan
    }

    // Görüntüyü dokuya yükle (URL değiştiğinde veya doku henüz yüklenmediyse yeniden yükle)
    if (!glTexture || glTexture.uri !== activePhoto.processedImageUrl) {
      console.log("Görüntü dokuya yükleniyor (processedImageUrl):", activePhoto.processedImageUrl);
      try {
        const asset = Asset.fromURI(activePhoto.processedImageUrl);
        await asset.downloadAsync();
        
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, asset);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        setGlTexture({ texture, uri: activePhoto.processedImageUrl });
      } catch (error) {
        console.error("Görüntü dokuya yüklenirken hata:", error);
        ToastService.show({ type: 'error', text1: 'Hata', text2: 'Görüntü yüklenemedi.' });
        return;
      }
    } else {
      gl.bindTexture(gl.TEXTURE_2D, glTexture.texture); // Mevcut dokuyu bağla
    }

    // Ayarları GLSL uniform'larına aktar
    // showOriginal durumunu uniform olarak shader'a geçir
    gl.uniform1i(gl.getUniformLocation(glProgram, 'u_showOriginal'), showOriginal ? 1 : 0);

    // Slider değerleri (-100 to 100) GLSL'nin beklediği aralıklara dönüştürülüyor
    gl.uniform1f(gl.getUniformLocation(glProgram, 'u_brightness'), settings.brightness / 100.0); // -1.0 to 1.0
    gl.uniform1f(gl.getUniformLocation(glProgram, 'u_contrast'), (settings.contrast + 100) / 100.0); // 0.0 to 2.0
    gl.uniform1f(gl.getUniformLocation(glProgram, 'u_saturation'), (settings.saturation + 100) / 100.0); // 0.0 to 2.0
    gl.uniform1f(gl.getUniformLocation(glProgram, 'u_hue'), settings.warmth); // -100 to 100, shader'da 360'a normalize edilecek
    gl.uniform1f(gl.getUniformLocation(glProgram, 'u_vignette'), Math.max(0, settings.vignette / 100.0)); // 0.0 to 1.0 (sadece karartma)

    // Çizim
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4); // Dörtgeni çiz
    gl.flush();
    gl.endFrameEXP(); // Çerçeveyi bitir
  };

  // GL bağlamı oluşturulduğunda ilk render'ı tetikle
  const onGlContextCreate = async (gl) => {
    setGlContext(gl);
    console.log("GL Context oluşturuldu.");
  };

  // Ayarlar değiştiğinde, fotoğraf değiştiğinde veya showOriginal değiştiğinde GLView'ı yeniden çiz
  useEffect(() => {
    console.log("GLContext, activePhoto, settings veya showOriginal değişti, yeniden çizim tetikleniyor.");
    // renderGlContent'ı sadece gerekli tüm veriler mevcutken çağır
    if (glContext && activePhoto && activePhoto.processedImageUrl && typeof activePhoto.processedImageUrl === 'string' && activePhoto.processedImageUrl.length > 0 && !isLoading) {
      console.log("GL render için tüm koşullar sağlandı. renderGlContent çağrılıyor.");
      renderGlContent();
    } else {
      console.log("GL render için hazır değil (koşullar sağlanmadı):", {
        glContext: !!glContext,
        activePhotoExists: !!activePhoto,
        processedImageUrl: activePhoto?.processedImageUrl, 
        isLoading: isLoading,
        isProcessedImageUrlValid: typeof activePhoto?.processedImageUrl === 'string' && activePhoto?.processedImageUrl.length > 0
      });
    }
  }, [glContext, activePhoto, settings, isLoading, showOriginal]); // showOriginal'ı bağımlılıklara ekle

  // Pan Gesture for moving the photo
  const panGesture = Gesture.Pan()
    .onStart(() => {
      initialPhotoX.value = photoX.value;
      initialPhotoY.value = photoY.value;
    })
    .onUpdate((event) => {
      photoX.value = initialPhotoX.value + event.translationX;
      photoY.value = initialPhotoY.value + event.translationY;
    })
    .onEnd(() => {
      runOnJS(updateSettings)({ 
        photoX: (photoX.value / previewSize.width) + 0.5, 
        photoY: (photoY.value / previewSize.height) + 0.5 
      });
    });

  // Pinch Gesture for scaling the photo
  const pinchGesture = Gesture.Pinch()
    .onStart(() => {
      initialPhotoScale.value = photoScale.value;
    })
    .onUpdate((event) => {
      const newScale = initialPhotoScale.value * event.scale;
      photoScale.value = Math.max(0.1, Math.min(5, newScale));
    })
    .onEnd(() => {
      runOnJS(updateSettings)({ photoScale: photoScale.value });
    });

  // Rotate Gesture for rotating the photo
  const rotateGesture = Gesture.Rotation()
    .onStart(() => {
      initialPhotoRotation.value = photoRotation.value;
    })
    .onUpdate((event) => {
      photoRotation.value = initialPhotoRotation.value + (event.rotation * 180 / Math.PI);
    })
    .onEnd(() => {
      runOnJS(updateSettings)({ photoRotation: photoRotation.value });
    });

  // Tüm jestleri aynı anda dinlemek için
  const combinedGesture = Gesture.Simultaneous(panGesture, pinchGesture, rotateGesture);

  // Hook kurallarına uygun olarak en üstte tanımlandı
  const animatedPhotoStyle = useAnimatedStyle(() => {
    return {
      position: 'absolute',
      width: '100%',
      height: '100%',
      transform: [
        { translateX: photoX.value },
        { translateY: photoY.value },
        { scale: photoScale.value },
        { rotate: `${photoRotation.value}deg` },
      ],
    };
  });

  const handleSave = async () => {
    try {
      // Nihai görüntüyü kaydetmek için:
      // 1. GLView'dan bir snapshot alın
      // const snapshot = await glRef.current.takeSnapshotAsync({ format: 'png', compress: 0.9 });
      // 2. Bu snapshot'ı backend'e yükleyin (yeni bir endpoint gerekebilir)
      // 3. Firestore'daki processedImageUrl'i güncelleyin (backend'in döndürdüğü URL ile)
      
      await saveChanges(); // Bu sadece ayarları backend'e kaydedecek
      ToastService.show({ type: 'success', text1: t('common.success'), text2: t('editor.saved', 'Değişiklikler kaydedildi.') });
      router.back();
    } catch (error: any) {
      ToastService.show({ type: 'error', text1: t('common.error'), text2: error.message || t('editor.saveFailed', 'Kaydetme başarısız oldu.') });
    }
  };

  const adjustments = useMemo(() => [
    { key: 'exposure', label: 'Pozlama', icon: 'sun' as const },
    { key: 'contrast', label: 'Kontrast', icon: 'bar-chart-2' as const },
    { key: 'brightness', label: 'Parlaklık', icon: 'circle' as const },
    { key: 'saturation', label: 'Doygunluk', icon: 'droplet' as const },
    { key: 'warmth', label: 'Sıcaklık', icon: 'thermometer' as const },
    { key: 'highlights', label: 'Vurgular', icon: 'trending-up' as const },
    { key: 'shadows', label: 'Gölgeler', icon: 'trending-down' as const },
    { key: 'vignette', label: 'Vinyet', icon: 'target' as const },
    { key: 'vibrance', label: 'Titreşim', icon: 'zap' as const },
    { key: 'tint', label: 'Ton', icon: 'droplet' as const },
    { key: 'clarity', label: 'Netlik', icon: 'aperture' as const },
    { key: 'noise', label: 'Gürültü', icon: 'cloud-off' as const },
  ], []);
  
  const selectedBackground = backgrounds.find(bg => bg.id === settings.backgroundId);

  // Yükleme durumu kontrolü
  if (isLoading || !activePhoto) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        {/* 1. Üst Bar */}
        <View style={styles.navigation}>
          <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.navText}>{t('common.cancel')}</Text>
          </TouchableOpacity>
          <Text style={styles.navTitle}>Düzenle</Text>
          <TouchableOpacity onPress={handleSave} disabled={isSaving}>
              <Text style={styles.navTextDone}>{isSaving ? t('common.saving') : t('common.done')}</Text>
          </TouchableOpacity>
        </View>

        {/* 2. Orta Alan (Önizleme) */}
        <View style={styles.previewContainer}>
          <Pressable
            style={{ flex: 1 }}
            onPressIn={() => setShowOriginal(true)}
            onPressOut={() => setShowOriginal(false)}
            onLayout={(e) => {
              setPreviewSize(e.nativeEvent.layout);
              photoX.value = (settings.photoX - 0.5) * previewSize.width;
              photoY.value = (settings.photoY - 0.5) * previewSize.height;
              initialPhotoX.value = photoX.value;
              initialPhotoY.value = photoY.value;
            }}
          >
            {previewSize.width > 0 && (
              <View style={styles.preview}>
                {selectedBackground && <Image source={{ uri: selectedBackground.fullUrl }} style={styles.backgroundImage} />}
                <GestureDetector gesture={combinedGesture}>
                  <Animated.View style={animatedPhotoStyle}>
                    {/* GLView her zaman render ediliyor */}
                    <GLView
                      ref={glRef}
                      style={styles.photoImageAdjusted}
                      onContextCreate={onGlContextCreate}
                    />
                  </Animated.View>
                </GestureDetector>
                {showOriginal && (
                  <View style={styles.originalOverlay}><Text style={styles.originalText}>Orijinal</Text></View>
                )}
              </View>
            )}
          </Pressable>
        </View>

        {/* 3. Alt Sekme Menüsü */}
        <View style={styles.toolTabs}>
            <TouchableOpacity style={styles.toolTab} onPress={() => setCurrentTool('adjust')}>
                <Feather name="sliders" size={24} color={currentTool === 'adjust' ? Colors.primary : Colors.textSecondary}/>
                <Text style={[styles.toolTabText, currentTool === 'adjust' && styles.toolTabTextActive]}>Ayarla</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.toolTab} onPress={() => setCurrentTool('filters')}>
                <Feather name="filter" size={24} color={currentTool === 'filters' ? Colors.primary : Colors.textSecondary}/>
                <Text style={[styles.toolTabText, currentTool === 'filters' && styles.toolTabTextActive]}>Filtreler</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.toolTab} onPress={() => setCurrentTool('crop')}>
                <Feather name="crop" size={24} color={currentTool === 'crop' ? Colors.primary : Colors.textSecondary}/>
                <Text style={[styles.toolTabText, currentTool === 'crop' && styles.toolTabTextActive]}>Kırp</Text>
            </TouchableOpacity>
        </View>

        {/* 4. Araç İçerikleri */}
        <View style={styles.toolContent}>
          {currentTool === 'adjust' && (
              <ScrollView showsVerticalScrollIndicator={false}>
                  {adjustments.map((adj) => (
                      <AppleSlider key={adj.key} label={adj.label} icon={adj.icon} value={settings[adj.key]} onValueChange={(v) => updateSettings({ [adj.key]: v })} onReset={() => updateSettings({ [adj.key]: 0 })} />
                  ))}
                  <TouchableOpacity onPress={resetToDefaults} style={styles.resetAllButton}>
                      <Text style={styles.resetAllButtonText}>Tüm Ayarları Sıfırla</Text>
                  </TouchableOpacity>
              </ScrollView>
          )}
          {currentTool === 'filters' && (
              <ScrollView>
                      <View style={styles.section}>
                          <Text style={styles.sectionTitle}>Arka Plan</Text>
                          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                              {backgrounds.map(bg => (
                                  <TouchableOpacity key={bg.id} onPress={() => updateSettings({ backgroundId: bg.id })} style={[styles.backgroundThumbnail, settings.backgroundId === bg.id && styles.backgroundThumbnailSelected]}>
                                      <Image source={{ uri: bg.thumbnailUrl }} style={styles.bgThumbnailImage} />
                                  </TouchableOpacity>
                              ))}
                          </ScrollView>
                      </View>
                      <View style={styles.section}>
                          <Text style={styles.sectionTitle}>Pozisyon</Text>
                          <AppleSlider label="Ölçek" icon="maximize" value={Math.round((settings.photoScale - 1) * 100)} onValueChange={(v) => updateSettings({ photoScale: 1 + v / 100 })} onReset={() => updateSettings({ photoScale: 1 })} />
                          <AppleSlider label="Döndürme" icon="rotate-cw" value={settings.photoRotation} min={-180} max={180} onValueChange={(v) => updateSettings({ photoRotation: v })} onReset={() => updateSettings({ photoRotation: 0 })} />
                      </View>
              </ScrollView>
          )}
          {currentTool === 'crop' && (
                <View style={styles.centeredMessage}>
                  <Feather name="tool" size={48} color={Colors.textSecondary} />
                  <Text style={styles.comingSoonText}>{t('common.comingSoon')}</Text>
              </View>
          )}
        </View>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}


// =================================================================
// Stil Tanımları
// =================================================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  navigation: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderBottomWidth: 1, borderColor: Colors.border, backgroundColor: Colors.card },
  navTitle: { ...Typography.h3, color: Colors.textPrimary },
  navText: { ...Typography.body, color: Colors.primary },
  navTextDone: { ...Typography.bodyMedium, color: Colors.primary, fontWeight: '600' },
  previewContainer: { flex: 1, backgroundColor: Colors.gray800 },
  preview: { flex: 1, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  backgroundImage: { ...StyleSheet.absoluteFillObject, resizeMode: 'cover' },
  photoImageAdjusted: { width: '100%', height: '100%', resizeMode: 'contain' },
  originalOverlay: { position: 'absolute', bottom: 20, alignSelf: 'center', backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15 },
  originalText: { color: 'white', fontWeight: 'bold' },
  toolTabs: { flexDirection: 'row', backgroundColor: Colors.card, borderTopWidth: 1, borderTopColor: Colors.border },
  toolTab: { flex: 1, alignItems: 'center', paddingVertical: Spacing.md },
  toolTabText: { ...Typography.caption, color: Colors.textSecondary, marginTop: 4 },
  toolTabTextActive: { color: Colors.primary, fontWeight: '600' },
  toolContent: { height: Layout.isTablet ? 400 : 320, backgroundColor: Colors.card, padding: Spacing.lg, paddingTop: Spacing.md },
  resetAllButton: { marginTop: Spacing.lg, padding: Spacing.md, alignItems: 'center', backgroundColor: Colors.gray100, borderRadius: BorderRadius.md },
  resetAllButtonText: { color: Colors.error, fontWeight: '600' },
  sliderContainer: { marginBottom: Spacing.sm },
  sliderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sliderLabelContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sliderLabel: { fontSize: 14, fontWeight: '500', color: Colors.textPrimary },
  sliderValueContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sliderValue: { fontSize: 14, color: Colors.textSecondary, fontWeight: '500', minWidth: 35, textAlign: 'right' },
  resetButton: { padding: 4 },
  sliderTrackContainer: { height: 20, justifyContent: 'center' },
  sliderTrack: { height: 4, backgroundColor: Colors.gray200, borderRadius: 2, width: '100%' },
  centerMark: { position: 'absolute', width: 2, height: 8, backgroundColor: Colors.textSecondary, borderRadius: 1 },
  activeTrack: { height: 4, borderRadius: 2, position: 'absolute', backgroundColor: Colors.primary },
  sliderThumb: { width: 22, height: 22, borderRadius: 11, backgroundColor: Colors.card, borderWidth: 3, borderColor: Colors.primary, position: 'absolute', marginLeft: -11, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2, elevation: 3 },
  section: { marginBottom: Spacing.lg },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary, marginBottom: Spacing.md },
  backgroundThumbnail: { width: 80, height: 80, borderRadius: 8, marginRight: Spacing.md, borderWidth: 3, borderColor: 'transparent', overflow: 'hidden' },
  backgroundThumbnailSelected: { borderColor: Colors.primary },
  bgThumbnailImage: { width: '100%', height: '100%' },
  centeredMessage: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 20 },
  comingSoonText: { ...Typography.body, color: Colors.textSecondary, marginTop: Spacing.md },
});
