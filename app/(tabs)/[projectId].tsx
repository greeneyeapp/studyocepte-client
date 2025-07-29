// kodlar/app/(tabs)/[projectId].tsx
import React from 'react';
import { View, Text, ScrollView, StyleSheet, Image, TouchableOpacity, SafeAreaView, ActivityIndicator, PanResponder, Animated } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEditorStore } from '@/stores/useEditorStore';
import { useProjectStore } from '@/stores/useProductStore';
import { api, Project } from '@/services/api';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ToastService } from '@/components/Toast/ToastService';
import { Layout } from '@/constants/Layout';

// --- KENDİ SLIDER BİLEŞENİMİZ ---
const CustomSlider = ({ label, value, onValueChange, min = 0, max = 2 }: { label: string, value: number, onValueChange: (v: number) => void, min?: number, max?: number }) => {
    const [containerWidth, setContainerWidth] = React.useState(0);
    const position = React.useRef(new Animated.Value(0)).current;

    React.useEffect(() => {
        if (containerWidth > 0 && typeof value === 'number') {
            const newPosition = ((value - min) / (max - min)) * containerWidth;
            Animated.timing(position, {
                toValue: newPosition,
                duration: 100,
                useNativeDriver: false,
            }).start();
        }
    }, [value, containerWidth]);

    const panResponder = React.useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: (evt) => {
                const newPosition = Math.max(0, Math.min(containerWidth, evt.nativeEvent.locationX));
                const newValue = (newPosition / containerWidth) * (max - min) + min;
                onValueChange(newValue);
            },
            onPanResponderMove: (evt) => {
                const newPosition = Math.max(0, Math.min(containerWidth, evt.nativeEvent.locationX));
                const newValue = (newPosition / containerWidth) * (max - min) + min;
                onValueChange(newValue);
            },
        })
    ).current;

    const displayValue = (typeof value === 'number' ? value : 0).toFixed(2);

    return (
        <View style={styles.sliderContainer}>
            <View style={styles.sliderLabelContainer}>
                <Text style={styles.sliderLabel}>{label}</Text>
                <Text style={styles.sliderValue}>{displayValue}</Text>
            </View>
            <View style={styles.sliderTrackContainer} {...panResponder.panHandlers}>
                <View style={styles.sliderTrack} />
                <Animated.View style={[styles.sliderTrack, styles.sliderTrackFilled, { width: position }]} />
                <Animated.View style={[styles.sliderThumbWrapper, { transform: [{ translateX: position }] }]}>
                    <View style={styles.sliderThumb} />
                </Animated.View>
            </View>
        </View>
    );
};
// --- SLIDER BİLEŞENİ SONU ---

const ToolTab = ({ icon, label, onPress, isActive }: { icon: keyof typeof Feather.glyphMap, label: string, onPress: () => void, isActive: boolean }) => (
    <TouchableOpacity onPress={onPress} style={[styles.toolTab, isActive && styles.toolTabActive]}>
        <Feather name={icon} size={20} color={isActive ? Colors.primary : Colors.textSecondary} />
        <Text style={[styles.toolTabText, isActive && styles.toolTabTextActive]}>{label}</Text>
    </TouchableOpacity>
);

export default function EditorScreen() {
    const { t } = useTranslation();
    const router = useRouter();
    const { projectId } = useLocalSearchParams<{ projectId: string }>(); 
    const [activeTool, setActiveTool] = React.useState<'Adjust' | 'Backgrounds'>('Adjust');
    const [project, setProject] = React.useState<Project | null>(null);
    const [isLoading, setIsLoading] = React.useState(true);
  
    const { settings, isSaving, backgrounds, fetchBackgrounds, updateSettings, saveProject, setActiveProject, clearStore, resetSettings } = useEditorStore();
    const { getProjectById, refreshProjects } = useProjectStore();

    React.useEffect(() => {
        if (!projectId) {
            ToastService.show({ type: 'error', text1: t('common.error'), text2: "Proje ID'si bulunamadı." });
            router.back();
            return;
        }

        const loadProjectDetails = async () => {
          setIsLoading(true);
          try {
            const projectDetails = await api.fetchProjectById(projectId);
            setProject(projectDetails);
            setActiveProject(projectDetails);
            await fetchBackgrounds();
          } catch (error: any) {
            ToastService.show({ type: 'error', text1: t('common.error'), text2: error.message || t('editor.projectNotFound') });
            router.back();
          } finally {
            setIsLoading(false);
          }
        };
        
        loadProjectDetails();
        return () => { clearStore(); };
    }, [projectId]);

    const handleSave = async () => {
        if (!project) return;
        try {
          await saveProject();
          await refreshProjects();
          ToastService.show({ type: 'success', text1: t('common.success'), text2: t('editor.saved') });
        } catch (e: any) {
          ToastService.show({ type: 'error', text1: t('common.error'), text2: e.message || t('editor.saveFailed') });
        }
    };
    
    const selectedBackground = backgrounds.find(bg => bg.id === settings.backgroundId);
  
    if (isLoading || !project) {
        return (
          <SafeAreaView style={styles.container}>
            <ActivityIndicator style={{ flex: 1 }} size="large" color={Colors.primary} />
          </SafeAreaView>
        );
    }
  
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
                    <Feather name="arrow-left" size={24} color={Colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.title} numberOfLines={1}>{project.name}</Text>
                <Button title={t('editor.save')} onPress={handleSave} disabled={isSaving} loading={isSaving} size="small" style={styles.headerButton} />
            </View>

            <View style={styles.content}>
                <View style={styles.canvasContainer}>
                    <Card padding="none" style={styles.canvasCard}>
                        {selectedBackground && <Image source={{ uri: selectedBackground.fullUrl }} style={styles.backgroundImage} />}
                        {/* DEĞİŞİKLİK: 'processedImageUrl' kullanılıyor */}
                        {project.processedImageUrl ? (
                            <Image source={{ uri: project.processedImageUrl }} style={styles.projectImage} resizeMode="contain" />
                        ) : (
                            <View style={styles.placeholderImage}>
                                <Feather name="image" size={48} color={Colors.textSecondary} />
                                <Text style={styles.placeholderText}>{t('editor.noOriginalImage')}</Text>
                            </View>
                        )}
                    </Card>
                </View>

                <View style={styles.controlsContainer}>
                    <View style={styles.toolTabsContainer}>
                        <ToolTab icon="sliders" label={t('editor.adjust')} isActive={activeTool === 'Adjust'} onPress={() => setActiveTool('Adjust')} />
                        <ToolTab icon="image" label={t('editor.backgrounds')} isActive={activeTool === 'Backgrounds'} onPress={() => setActiveTool('Backgrounds')} />
                    </View>

                    <ScrollView contentContainerStyle={styles.toolContent}>
                        {activeTool === 'Adjust' && (
                        <>
                            <CustomSlider label={t('editor.brightness')} value={settings.brightness ?? 1} onValueChange={(v) => updateSettings({ brightness: v })} />
                            <CustomSlider label={t('editor.contrast')} value={settings.contrast ?? 1} onValueChange={(v) => updateSettings({ contrast: v })} />
                            <CustomSlider label={t('editor.saturation')} value={settings.saturation ?? 1} onValueChange={(v) => updateSettings({ saturation: v })} />
                            <Button title={t('editor.resetSettings')} onPress={resetSettings} variant="ghost" style={{ marginTop: Spacing.md }} />
                        </>
                        )}
                        {activeTool === 'Backgrounds' && (
                        <View style={styles.backgroundGrid}>
                            {backgrounds.map((bg) => (
                                <TouchableOpacity key={bg.id} onPress={() => updateSettings({ backgroundId: bg.id })} style={styles.backgroundItem}>
                                    <Image source={{ uri: bg.thumbnailUrl }} style={styles.backgroundThumbnail} />
                                    {settings.backgroundId === bg.id && <View style={styles.selectedBackground} />}
                                </TouchableOpacity>
                            ))}
                        </View>
                        )}
                    </ScrollView>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border },
    headerButton: { minWidth: 80, alignItems: 'center', padding: Spacing.sm },
    title: { ...Typography.h3, color: Colors.textPrimary, flex: 1, textAlign: 'center', marginHorizontal: Spacing.sm },
    content: { flex: 1, flexDirection: Layout.isTablet ? 'row' : 'column' },
    canvasContainer: { flex: 3, padding: Spacing.md },
    canvasCard: { flex: 1, backgroundColor: Colors.gray200, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
    backgroundImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
    projectImage: { width: '90%', height: '90%' },
    placeholderImage: { justifyContent: 'center', alignItems: 'center', gap: Spacing.md },
    placeholderText: { ...Typography.body, color: Colors.textSecondary },
    controlsContainer: { flex: 2, backgroundColor: Colors.card, borderTopWidth: Layout.isTablet ? 0 : 1, borderLeftWidth: Layout.isTablet ? 1 : 0, borderColor: Colors.border },
    toolTabsContainer: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: Colors.border },
    toolTab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.md, gap: Spacing.sm },
    toolTabActive: { borderBottomWidth: 2, borderBottomColor: Colors.primary },
    toolTabText: { ...Typography.bodyMedium, color: Colors.textSecondary },
    toolTabTextActive: { color: Colors.primary },
    toolContent: { padding: Spacing.md },
    backgroundGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
    backgroundItem: { width: Layout.isTablet ? 90 : 70, height: Layout.isTablet ? 90 : 70, borderRadius: BorderRadius.md, overflow: 'hidden' },
    backgroundThumbnail: { width: '100%', height: '100%' },
    selectedBackground: { ...StyleSheet.absoluteFillObject, borderRadius: BorderRadius.md, borderWidth: 3, borderColor: Colors.primary },
    sliderContainer: { marginBottom: Spacing.lg },
    sliderLabelContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
    sliderLabel: { ...Typography.body, color: Colors.textPrimary },
    sliderValue: { ...Typography.caption, color: Colors.textSecondary },
    sliderTrackContainer: { height: 30, justifyContent: 'center' },
    sliderTrack: { height: 4, backgroundColor: Colors.border, borderRadius: 2, position: 'absolute', width: '100%' },
    sliderTrackFilled: { backgroundColor: Colors.primary },
    sliderThumbWrapper: { position: 'absolute', height: 30, width: 30, alignItems: 'center', justifyContent: 'center', marginLeft: -15 },
    sliderThumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: Colors.card, borderWidth: 3, borderColor: Colors.primary },
});