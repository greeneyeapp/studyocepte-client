// kodlar/app/(tabs)/home.tsx
import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  SectionList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import * as ImagePicker from 'expo-image-picker';
import { useProjectStore } from '@/stores/useProductStore';
import { useEditorStore } from '@/stores/useEditorStore';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants';
import { Card } from '@/components/Card';
import { Project } from '@/services/api';
import { ToastService } from '@/components/Toast/ToastService';
import { LoadingService } from '@/components/Loading/LoadingService';
import { Layout } from '@/constants/Layout';
import { BottomSheetService } from '@/components/BottomSheet/BottomSheetService';
import { InputDialogService } from '@/components/Dialog/InputDialogService';

const numColumns = Layout.isTablet ? 4 : 3;

// SAAT DİLİMİNDEN ETKİLENMEYEN, KESİN TARİH GRUPLAMA FONKSİYONU
const groupProjectsByDate = (projects: Project[], t: (key: string) => string, language: string) => {
  if (!projects.length) return [];
  const sortedProjects = [...projects].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const groups: { [key: string]: Project[] } = {};

  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const isSameDay = (d1: Date, d2: Date) => d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();

  sortedProjects.forEach(project => {
    const projectDate = new Date(project.createdAt); // UTC tarihini yerel saate çevirir
    let key = '';
    if (isSameDay(projectDate, today)) key = t('home.today');
    else if (isSameDay(projectDate, yesterday)) key = t('home.yesterday');
    else key = projectDate.toLocaleDateString(language, { day: 'numeric', month: 'long', year: 'numeric' });
    if (!groups[key]) groups[key] = [];
    groups[key].push(project);
  });

  // SectionList'in her bir satırını bir item olarak görmesi için veriyi yeniden yapılandırıyoruz
  return Object.keys(groups).map(key => {
    const chunkedData = [];
    const projects = groups[key];
    for (let i = 0; i < projects.length; i += numColumns) {
      chunkedData.push(projects.slice(i, i + numColumns));
    }
    return { title: key, data: chunkedData };
  });
};

export default function HomeScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { projects, isLoading, fetchProjects, createProject, refreshProjects } = useProjectStore();
  const { setActiveProject } = useEditorStore();
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    const isProcessing = projects.some(p => p.status === 'processing');
    if (isProcessing) {
      const interval = setInterval(() => {
        refreshProjects();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [projects, refreshProjects]);

  const projectSections = useMemo(() => groupProjectsByDate(projects, t, i18n.language), [projects, t, i18n.language]);

  const handleCreateNewProject = () => {
    const d = new Date();
    const defaultName = `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')}.${d.getFullYear()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
    InputDialogService.show({
      title: t('projects.nameYourProject'),
      placeholder: t('projects.projectNamePlaceholder'),
      onConfirm: (name) => {
        askForImageSource(name.trim() || defaultName);
      },
    });
  };

  const askForImageSource = (projectName: string) => {
    BottomSheetService.show({
      title: t('projects.createProjectTitle'),
      actions: [
        { id: 'gallery', text: t('projects.selectFromGallery'), icon: 'image', onPress: () => pickImageFromGallery(projectName) },
        { id: 'camera', text: t('projects.takePhoto'), icon: 'camera', onPress: () => takePhoto(projectName) },
      ],
    });
  };

  const pickImageFromGallery = async (projectName: string) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { ToastService.show({ type: 'error', text1: t('common.permissions.galleryTitle'), text2: t('common.permissions.galleryMessage') }); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ allowsEditing: false, quality: 1 });
    if (!result.canceled && result.assets) {
      await createProjectWithImage(result.assets[0].uri, projectName);
    }
  };

  const takePhoto = async (projectName: string) => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') { ToastService.show({ type: 'error', text1: t('common.permissions.cameraTitle'), text2: t('common.permissions.cameraMessage') }); return; }
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: false, quality: 1 });
    if (!result.canceled && result.assets) {
      await createProjectWithImage(result.assets[0].uri, projectName);
    }
  };

  const createProjectWithImage = async (imageUri: string, projectName: string) => {
    setIsCreating(true);
    LoadingService.show();
    try {
      await createProject(imageUri, projectName);
      ToastService.show({ type: 'success', text1: t('common.success'), text2: t('projects.projectCreated') });
    } catch (e: any) {
      ToastService.show({ type: 'error', text1: t('common.error'), text2: e.message || t('common.errors.createProject') });
    } finally {
      setIsCreating(false);
      LoadingService.hide();
    }
  };

  const handleProjectPress = (project: Project) => {
    if (project.status !== 'completed') {
      ToastService.show({
        type: project.status === 'failed' ? 'error' : 'info',
        text1: project.status === 'failed' ? t('projects.failedProjectTitle') : t('projects.processingProjectTitle'),
        text2: project.status === 'failed' ? t('projects.failedProjectMessage') : t('projects.processingProjectMessage'),
      });
      return;
    }
    router.push({
      pathname: '/(tabs)/[projectId]',
      params: { projectId: project.id },
    });
  };

  const renderProjectRow = ({ item }: { item: Project[] }) => (
    <View style={styles.row}>
      {item.map((project) => (
        <View key={project.id} style={styles.cardWrapper}>
          <TouchableOpacity onPress={() => handleProjectPress(project)} activeOpacity={0.8}>
            <Card padding="none">
              <Image
                source={{ uri: project.thumbnailUrl || `https://via.placeholder.com/150?text=${t('projects.noImage')}` }}
                style={styles.projectImage}
              />
              {project.status !== 'completed' && (
                <View style={styles.statusOverlay}>
                  {project.status === 'processing' && <ActivityIndicator color={Colors.card} />}
                  {project.status === 'failed' && <Feather name="alert-triangle" size={24} color={Colors.card} />}
                </View>
              )}
            </Card>
          </TouchableOpacity>
        </View>
      ))}
      {/* Satırı doldurmak için boş view'lar ekle */}
      {Array.from({ length: numColumns - item.length }).map((_, index) => (
        <View key={`placeholder-${index}`} style={styles.cardWrapper} />
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('home.title')}</Text>
      </View>

      <SectionList
        sections={projectSections}
        keyExtractor={(item, index) => 'row-' + index}
        renderSectionHeader={({ section: { title } }) => <Text style={styles.sectionHeader}>{title}</Text>}
        renderItem={renderProjectRow}
        ListEmptyComponent={() => !isLoading && (
          <View style={styles.emptyContainer}>
            <Feather name="folder" size={48} color={Colors.textSecondary} />
            <Text style={styles.emptyText}>{t('projects.empty')}</Text>
            <Text style={styles.emptySubtext}>{t('projects.emptySubtitle')}</Text>
          </View>
        )}
        ListFooterComponent={isLoading && projects.length === 0 ? <ActivityIndicator style={{ margin: Spacing.lg }} /> : null}
        contentContainerStyle={styles.listContainer}
        onRefresh={fetchProjects}
        refreshing={isLoading}
      />
      <TouchableOpacity
        style={[styles.fab, isCreating && styles.fabDisabled]}
        onPress={handleCreateNewProject}
        activeOpacity={0.8}
        disabled={isCreating || isLoading}
      >
        {isCreating ? <ActivityIndicator size="small" color={Colors.card} /> : <Feather name="plus" size={28} color={Colors.card} />}
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.md },
  title: { ...Typography.h1, color: Colors.textPrimary },
  listContainer: { paddingHorizontal: Spacing.sm, paddingBottom: 100 },
  sectionHeader: { ...Typography.body, fontWeight: '600', color: Colors.textSecondary, marginBottom: Spacing.sm, marginTop: Spacing.lg, paddingHorizontal: Spacing.md },
  row: { flexDirection: 'row' },
  cardWrapper: { width: `${100 / numColumns}%`, padding: Spacing.sm },
  projectImage: { width: '100%', aspectRatio: 1, borderRadius: BorderRadius.lg, backgroundColor: Colors.gray100 },
  statusOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', borderRadius: BorderRadius.lg },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', height: Layout.screen.height * 0.6 },
  emptyText: { ...Typography.h2, color: Colors.textPrimary, marginTop: Spacing.md },
  emptySubtext: { ...Typography.body, color: Colors.textSecondary, marginTop: Spacing.sm, textAlign: 'center' },
  fab: { position: 'absolute', right: Spacing.lg, bottom: Spacing.lg, width: 60, height: 60, borderRadius: 30, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 8 },
  fabDisabled: { backgroundColor: Colors.textSecondary },
});