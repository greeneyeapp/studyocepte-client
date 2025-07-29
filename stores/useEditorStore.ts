// kodlar/stores/useEditorStore.ts
import { create } from 'zustand';
import { api, Project, Background, EditorSettings } from '@/services/api';

interface EditorState {
  activeProject: Project | null;
  backgrounds: Background[];
  settings: EditorSettings;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
}

interface EditorActions {
  setActiveProject: (project: Project) => void;
  fetchBackgrounds: () => Promise<void>;
  updateSettings: (newSettings: Partial<EditorSettings>) => void;
  saveProject: () => Promise<void>;
  resetSettings: () => void;
  clearError: () => void;
  clearStore: () => void;
}

const defaultSettings: EditorSettings = {
  backgroundId: 'bg1',
  shadow: 0.5,
  lighting: 0.7,
  brightness: 1,
  contrast: 1,
  saturation: 1,
  hue: 0,
  sepia: 0,
};

export const useEditorStore = create<EditorState & EditorActions>((set, get) => ({
  activeProject: null,
  backgrounds: [],
  settings: defaultSettings,
  isLoading: false,
  isSaving: false,
  error: null,

  setActiveProject: (project: Project) => {
    const loadedSettings = { ...defaultSettings, ...project.editorSettings };
    set({
      // DÜZELTME: Projenin bir kopyasını oluşturarak "donmuş nesne" hatasını engelle
      activeProject: { ...project },
      settings: loadedSettings,
    });
  },

  fetchBackgrounds: async () => {
    if (get().backgrounds.length > 0) return;
    set({ isLoading: true });
    try {
      const backgrounds = await api.fetchBackgrounds();
      set({ backgrounds });
    } catch (error: any) {
      set({ error: error.message || 'Arka planlar yüklenemedi.' });
    } finally {
      set({ isLoading: false });
    }
  },

  updateSettings: (newSettings: Partial<EditorSettings>) => {
    set(state => ({ settings: { ...state.settings, ...newSettings } }));
  },

  saveProject: async () => {
    const { activeProject, settings } = get();
    if (!activeProject) {
      const error = 'Kaydedilecek aktif proje bulunamadı.';
      set({ error });
      throw new Error(error);
    }

    set({ isSaving: true, error: null });
    try {
      await api.saveProject(activeProject.id, settings);
      // DÜZELTME: State'i güncellerken donmuş nesne sorununu engelle
      set(state => {
        if (!state.activeProject) return {};
        const updatedProject = { ...state.activeProject, editorSettings: settings };
        return { activeProject: updatedProject };
      });
    } catch (error: any) {
      const errorMessage = error.message || 'Proje kaydedilemedi.';
      set({ error: errorMessage });
      throw new Error(errorMessage);
    } finally {
      set({ isSaving: false });
    }
  },

  resetSettings: () => set({ settings: defaultSettings }),

  clearError: () => set({ error: null }),
  
  clearStore: () => {
    set({ activeProject: null, settings: defaultSettings });
  },
}));