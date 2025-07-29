// kodlar/stores/useProjectStore.ts
import { create } from 'zustand';
import { api, Project } from '@/services/api';

interface ProjectState {
  projects: Project[];
  isLoading: boolean;
  error: string | null;
}

interface ProjectActions {
  fetchProjects: () => Promise<void>;
  createProject: (imageUri: string, name: string) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  refreshProjects: () => Promise<void>;
  getProjectById: (projectId: string) => Project | undefined; // EKSİK SATIR BURAYA EKLENDİ
  clearError: () => void;
}

export const useProjectStore = create<ProjectState & ProjectActions>((set, get) => ({
  projects: [],
  isLoading: true,
  error: null,

  fetchProjects: async () => {
    set({ isLoading: true, error: null });
    try {
      const projects = await api.fetchProjects();
      set({ projects, isLoading: false });
    } catch (error: any) {
      set({ 
        error: error.message || 'Projeler yüklenirken bir hata oluştu.',
        isLoading: false 
      });
    }
  },

  createProject: async (imageUri: string, name: string) => {
    try {
      await api.createProject(imageUri, name);
      await get().fetchProjects();
    } catch (error: any) {
      const errorMessage = error.message || 'Proje oluşturulamadı.';
      set({ error: errorMessage });
      throw new Error(errorMessage);
    }
  },

  deleteProject: async (projectId: string) => {
    try {
      await api.deleteProject(projectId);
      set((state) => ({
        projects: state.projects.filter(p => p.id !== projectId)
      }));
    } catch (error: any) {
      set({ error: error.message || 'Proje silinemedi.' });
      throw error;
    }
  },

  refreshProjects: async () => {
    try {
      const projects = await api.fetchProjects();
      set({ projects, error: null });
    } catch (error: any) {
      console.error("Proje yenileme hatası:", error);
    }
  },

  clearError: () => set({ error: null }),
  
  getProjectById: (projectId: string) => {
    return get().projects.find(p => p.id === projectId);
  },
}));