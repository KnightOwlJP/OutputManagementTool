import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface HierarchyViewState {
  // 展開状態の保存
  expandedNodes: Record<string, Set<string>>; // projectId -> Set<processId>
  
  // 表示設定
  viewSettings: Record<string, {
    showLevels: ('large' | 'medium' | 'small' | 'detail')[];
    sortBy: 'displayOrder' | 'name' | 'createdAt';
    sortDirection: 'asc' | 'desc';
  }>;

  // アクション
  setExpandedNodes: (projectId: string, nodeIds: Set<string>) => void;
  toggleNode: (projectId: string, nodeId: string) => void;
  expandAll: (projectId: string, nodeIds: string[]) => void;
  collapseAll: (projectId: string) => void;
  
  setViewSettings: (
    projectId: string,
    settings: {
      showLevels?: ('large' | 'medium' | 'small' | 'detail')[];
      sortBy?: 'displayOrder' | 'name' | 'createdAt';
      sortDirection?: 'asc' | 'desc';
    }
  ) => void;
  
  getExpandedNodes: (projectId: string) => Set<string>;
  getViewSettings: (projectId: string) => {
    showLevels: ('large' | 'medium' | 'small' | 'detail')[];
    sortBy: 'displayOrder' | 'name' | 'createdAt';
    sortDirection: 'asc' | 'desc';
  };
}

export const useHierarchyViewStore = create<HierarchyViewState>()(
  persist(
    (set, get) => ({
      expandedNodes: {},
      viewSettings: {},

      setExpandedNodes: (projectId, nodeIds) => {
        set((state) => ({
          expandedNodes: {
            ...state.expandedNodes,
            [projectId]: nodeIds,
          },
        }));
      },

      toggleNode: (projectId, nodeId) => {
        set((state) => {
          const currentExpanded = state.expandedNodes[projectId] || new Set();
          const newExpanded = new Set(currentExpanded);
          
          if (newExpanded.has(nodeId)) {
            newExpanded.delete(nodeId);
          } else {
            newExpanded.add(nodeId);
          }

          return {
            expandedNodes: {
              ...state.expandedNodes,
              [projectId]: newExpanded,
            },
          };
        });
      },

      expandAll: (projectId, nodeIds) => {
        set((state) => ({
          expandedNodes: {
            ...state.expandedNodes,
            [projectId]: new Set(nodeIds),
          },
        }));
      },

      collapseAll: (projectId) => {
        set((state) => ({
          expandedNodes: {
            ...state.expandedNodes,
            [projectId]: new Set(),
          },
        }));
      },

      setViewSettings: (projectId, settings) => {
        set((state) => {
          const currentSettings = state.viewSettings[projectId] || {
            showLevels: ['large', 'medium', 'small', 'detail'],
            sortBy: 'displayOrder' as const,
            sortDirection: 'asc' as const,
          };

          return {
            viewSettings: {
              ...state.viewSettings,
              [projectId]: {
                ...currentSettings,
                ...settings,
              },
            },
          };
        });
      },

      getExpandedNodes: (projectId) => {
        return get().expandedNodes[projectId] || new Set();
      },

      getViewSettings: (projectId) => {
        return (
          get().viewSettings[projectId] || {
            showLevels: ['large', 'medium', 'small', 'detail'],
            sortBy: 'displayOrder' as const,
            sortDirection: 'asc' as const,
          }
        );
      },
    }),
    {
      name: 'hierarchy-view-storage',
      // Setオブジェクトをシリアライズ可能な配列に変換
      partialize: (state) => ({
        expandedNodes: Object.fromEntries(
          Object.entries(state.expandedNodes).map(([projectId, nodeSet]) => [
            projectId,
            Array.from(nodeSet),
          ])
        ),
        viewSettings: state.viewSettings,
      }),
      // デシリアライズ時に配列をSetに戻す
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.expandedNodes = Object.fromEntries(
            Object.entries(state.expandedNodes as any).map(([projectId, nodeArray]) => [
              projectId,
              new Set(nodeArray as string[]),
            ])
          );
        }
      },
    }
  )
);
