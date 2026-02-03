/**
 * プロジェクトストア
 * プロジェクトデータの状態管理
 */

import { create } from 'zustand';
import type { Project } from '@/types/models';
import type { AsyncOperations } from './createStore';

// ==========================================
// 型定義
// ==========================================

interface ProjectState {
  /** プロジェクト一覧 */
  projects: Project[];
  /** 現在選択中のプロジェクト */
  currentProject: Project | null;
  /** ローディング状態 */
  isLoading: boolean;
  /** エラーメッセージ */
  error: string | null;
}

interface ProjectActions extends AsyncOperations {
  // CRUD
  setProjects: (projects: Project[]) => void;
  setCurrentProject: (project: Project | null) => void;
  addProject: (project: Project) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  removeProject: (id: string) => void;
  
  // ユーティリティ
  getProjectById: (id: string) => Project | undefined;
  getProjectByName: (name: string) => Project | undefined;
  getSortedProjects: () => Project[];
  
  // 状態リセット
  reset: () => void;
}

type ProjectStore = ProjectState & ProjectActions;

// ==========================================
// 初期状態
// ==========================================

const initialState: ProjectState = {
  projects: [],
  currentProject: null,
  isLoading: false,
  error: null,
};

// ==========================================
// ストア
// ==========================================

export const useProjectStore = create<ProjectStore>((set, get) => ({
  ...initialState,

  // CRUD
  setProjects: (projects) => set({ projects }),
  
  setCurrentProject: (project) => set({ currentProject: project }),
  
  addProject: (project) =>
    set((state) => ({
      projects: [...state.projects, project],
    })),
  
  updateProject: (id, updates) =>
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === id ? { ...p, ...updates } : p
      ),
      currentProject:
        state.currentProject?.id === id
          ? { ...state.currentProject, ...updates }
          : state.currentProject,
    })),
  
  removeProject: (id) =>
    set((state) => ({
      projects: state.projects.filter((p) => p.id !== id),
      currentProject: state.currentProject?.id === id ? null : state.currentProject,
    })),
  
  // ユーティリティ
  getProjectById: (id) => get().projects.find((p) => p.id === id),
  
  getProjectByName: (name) => get().projects.find((p) => p.name === name),
  
  getSortedProjects: () =>
    [...get().projects].sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    ),
  
  // 非同期状態管理
  setLoading: (isLoading) => set({ isLoading }),
  
  setError: (error) => set({ error }),
  
  clearError: () => set({ error: null }),
  
  // 状態リセット
  reset: () => set(initialState),
}));

// ==========================================
// セレクタ
// ==========================================

/**
 * プロジェクト数を取得
 */
export const selectProjectCount = (state: ProjectStore) => state.projects.length;

/**
 * 最近更新されたプロジェクトを取得
 */
export const selectRecentProjects = (state: ProjectStore, limit = 5) =>
  state.getSortedProjects().slice(0, limit);
