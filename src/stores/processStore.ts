import { create } from 'zustand';
import { Process } from '@/types/project.types';

interface ProcessState {
  processes: Process[];
  currentProcess: Process | null;
  selectedProcesses: string[];
  expandedNodes: Set<string>;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setProcesses: (processes: Process[]) => void;
  setCurrentProcess: (process: Process | null) => void;
  addProcess: (process: Process) => void;
  updateProcess: (id: string, updates: Partial<Process>) => void;
  removeProcess: (id: string) => void;
  
  // 選択管理
  selectProcess: (id: string) => void;
  deselectProcess: (id: string) => void;
  clearSelection: () => void;
  selectMultiple: (ids: string[]) => void;
  
  // 展開状態管理
  toggleNode: (id: string) => void;
  expandNode: (id: string) => void;
  collapseNode: (id: string) => void;
  expandAll: () => void;
  collapseAll: () => void;
  
  // ユーティリティ
  getProcessById: (id: string) => Process | undefined;
  getChildProcesses: (parentId: string) => Process[];
  getProcessesByLevel: (level: Process['level']) => Process[];
  
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useProcessStore = create<ProcessState>((set, get) => ({
  processes: [],
  currentProcess: null,
  selectedProcesses: [],
  expandedNodes: new Set<string>(),
  isLoading: false,
  error: null,

  setProcesses: (processes) => set({ processes }),
  
  setCurrentProcess: (process) => set({ currentProcess: process }),
  
  addProcess: (process) =>
    set((state) => ({
      processes: [...state.processes, process],
    })),
  
  updateProcess: (id, updates) =>
    set((state) => ({
      processes: state.processes.map((p) =>
        p.id === id ? { ...p, ...updates } : p
      ),
      currentProcess:
        state.currentProcess?.id === id
          ? { ...state.currentProcess, ...updates }
          : state.currentProcess,
    })),
  
  removeProcess: (id) =>
    set((state) => ({
      processes: state.processes.filter((p) => p.id !== id),
      currentProcess: state.currentProcess?.id === id ? null : state.currentProcess,
      selectedProcesses: state.selectedProcesses.filter((pId) => pId !== id),
    })),
  
  // 選択管理
  selectProcess: (id) =>
    set((state) => ({
      selectedProcesses: [...state.selectedProcesses, id],
    })),
  
  deselectProcess: (id) =>
    set((state) => ({
      selectedProcesses: state.selectedProcesses.filter((pId) => pId !== id),
    })),
  
  clearSelection: () => set({ selectedProcesses: [] }),
  
  selectMultiple: (ids) => set({ selectedProcesses: ids }),
  
  // 展開状態管理
  toggleNode: (id) =>
    set((state) => {
      const newExpanded = new Set(state.expandedNodes);
      if (newExpanded.has(id)) {
        newExpanded.delete(id);
      } else {
        newExpanded.add(id);
      }
      return { expandedNodes: newExpanded };
    }),
  
  expandNode: (id) =>
    set((state) => ({
      expandedNodes: new Set([...state.expandedNodes, id]),
    })),
  
  collapseNode: (id) =>
    set((state) => {
      const newExpanded = new Set(state.expandedNodes);
      newExpanded.delete(id);
      return { expandedNodes: newExpanded };
    }),
  
  expandAll: () =>
    set((state) => ({
      expandedNodes: new Set(state.processes.map((p) => p.id)),
    })),
  
  collapseAll: () => set({ expandedNodes: new Set() }),
  
  // ユーティリティ
  getProcessById: (id) => {
    const { processes } = get();
    return processes.find((p) => p.id === id);
  },
  
  getChildProcesses: (parentId) => {
    const { processes } = get();
    return processes.filter((p) => p.parentId === parentId);
  },
  
  getProcessesByLevel: (level) => {
    const { processes } = get();
    return processes.filter((p) => p.level === level);
  },
  
  setLoading: (isLoading) => set({ isLoading }),
  
  setError: (error) => set({ error }),
  
  clearError: () => set({ error: null }),
}));
