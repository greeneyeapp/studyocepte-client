import React, { useEffect } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, Image } from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { useEditorStore } from '@/stores/useEditorStore';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { Button, Text, TextInput } from 'react-native-paper';
import { ToastService } from '@/services/ui';

export default function EditorScreen() {
    const { photoId } = useLocalSearchParams<{ photoId: string }>();
    const router = useRouter();
    const { 
      activePhoto, settings, isLoading, isSaving, 
      setActivePhotoById, updateSettings, saveChanges, clearStore 
    } = useEditorStore();

    useEffect(() => {
        if(photoId) {
            setActivePhotoById(photoId);
        }
        return () => { clearStore(); }
    }, [photoId]);

    const handleSaveChanges = async () => {
      await saveChanges();
      ToastService.show("Değişiklikler kaydedildi!");
      router.back();
    }

    if (isLoading || !activePhoto) {
        return <ActivityIndicator size="large" style={styles.centered} />;
    }

    return (
        <ThemedView style={styles.container}>
            <Stack.Screen options={{ title: "Fotoğraf Düzenle" }} />
            <ScrollView>
              <View style={styles.previewContainer}>
                  <Image 
                    source={{ uri: activePhoto.processedImageUrl }} 
                    style={styles.previewImage}
                    resizeMode="contain"
                  />
              </View>

              <View style={styles.controlsContainer}>
                  <ThemedText type="subtitle">Ayarlar</ThemedText>
                  
                  {/* Örnek olarak birkaç ayar ekliyorum. Bunları slider'lar ile değiştirebilirsiniz. */}
                  <TextInput
                    label="Parlaklık"
                    value={String(settings.brightness)}
                    onChangeText={text => updateSettings({ brightness: parseFloat(text) || 1.0 })}
                    keyboardType="numeric"
                    style={styles.input}
                  />
                  <TextInput
                    label="Kontrast"
                    value={String(settings.contrast)}
                    onChangeText={text => updateSettings({ contrast: parseFloat(text) || 1.0 })}
                    keyboardType="numeric"
                    style={styles.input}
                  />
                 <Button 
                    mode="contained" 
                    onPress={handleSaveChanges}
                    loading={isSaving}
                    disabled={isSaving}
                    style={styles.button}
                  >
                    Değişiklikleri Kaydet
                  </Button>
              </View>
            </ScrollView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    previewContainer: {
        height: 300,
        backgroundColor: '#e0e0e0',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    previewImage: {
        width: '100%',
        height: '100%',
    },
    controlsContainer: {
        padding: 16
    },
    input: {
      marginBottom: 12,
    },
    button: {
      marginTop: 16,
    }
});