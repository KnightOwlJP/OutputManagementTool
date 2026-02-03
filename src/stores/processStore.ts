/**
 * 工程ストア
 * 工程データの状態管理
 */

import { create } from 'zustand';
import type { Process } from '@/types/models';
import type { AsyncOperations, SelectionOperations } from './createStore';

// ==========================================
// 型定義
// ==========================================

interface ProcessState {
  /** 工程一覧 */
  processes: Process[];
  /** 現在選択中の工程 */
  currentProcess: Process | null;
  /** 選択された工程ID */
  selectedProcesses: string[];
  /** 展開されたノードID */
  expandedNodes: Set<string>;
  /** ローディング状態 */
  isLoading: boolean;
  /** エラーメッセージ */
  error: string | null;
}

interface ProcessActions extends AsyncOperations, Omit<SelectionOperations, 'isSelected'> {
  // CRUD
  setProcesses: (processes: Process[]) => void;
  setCurrentProcess: (process: Process | null) => void;
  addProcess: (process: Process) => void;
  updateProcess: (id: string, updates: Partial<Process>) => void;
  removeProcess: (id: string) => void;
  
  // 選択管理
  selectProcess: (id: string) => void;
  deselectProcess: (id: string) => void;
  isSelected: (id: string) => boolean;
  
  // 展開状態管理
  toggleNode: (id: string) => void;
  expandNode: (id: string) => void;
  collapseNode: (id: string) => void;
  expandAll: () => void;
  collapseAll: () => void;
  isExpanded: (id: string) => boolean;
  
  // ユーティリティ
  getProcessById: (id: string) => Process | undefined;
  getChildProcesses: (parentId: string) => Process[];
  getProcessesByLaneId: (laneId: string) => Process[];
  getRootProcesses: () => Process[];
  getSortedProcesses: () => Process[];
  
  // バルク操作
  addProcesses: (processes: Process[]) => void;
  removeProcesses: (ids: string[]) => void;
  
  // 状態リセット
  reset: () => void;
}

type ProcessStore = ProcessState & ProcessActions;

// ==========================================
// 初期状態
// ==========================================

const initialState: ProcessState = {
  processes: [],
  currentProcess: null,
  selectedProcesses: [],
  expandedNodes: new Set<string>(),
  isLoading: false,
  error: null,
};

// ==========================================
// ストア
// ==========================================

export const useProcessStore = create<ProcessStore>((set, get) => ({
  ...initialState,

  // CRUD
  setProcesses: (processes) => set({ processes }),
  
  setCurrentProcess: (process) => set({ currentProcess: process }),
  
  addProcess: (process) =>
    set((state) => ({
      processes: [...state.processes, process],
    })),
  
  addProcesses: (processes) =>
    set((state) => ({
      processes: [...state.processes, ...processes],
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
  
  removeProcesses: (ids) => {
    const idSet = new Set(ids);
    set((state) => ({
      processes: state.processes.filter((p) => !idSet.has(p.id)),
      currentProcess: state.currentProcess && idSet.has(state.currentProcess.id) 
        ? null 
        : state.currentProcess,
      selectedProcesses: state.selectedProcesses.filter((pId) => !idSet.has(pId)),
    }));
  },
  
  // 選択管理
  selectProcess: (id) =>
    set((state) => ({
      selectedProcesses: state.selectedProcesses.includes(id)
        ? state.selectedProcesses
        : [...state.selectedProcesses, id],
    })),
  
  deselectProcess: (id) =>
    set((state) => ({
      selectedProcesses: state.selectedProcesses.filter((pId) => pId !== id),
    })),
  
  select: (id) => get().selectProcess(id),
  
  deselect: (id) => get().deselectProcess(id),
  
  clearSelection: () => set({ selectedProcesses: [] }),
  
  selectMultiple: (ids) => set({ selectedProcesses: ids }),
  
  isSelected: (id) => get().selectedProcesses.includes(id),
  
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
  
  isExpanded: (id) => get().expandedNodes.has(id),
  
  // ユーティリティ
  getProcessById: (id) => get().processes.find((p) => p.id === id),
  
  getChildProcesses: (parentId) =>
    get().processes.filter((p) => p.parentProcessId === parentId),
  
  getProcessesByLaneId: (laneId) =>
    get().processes.filter((p) => p.laneId === laneId),
  
  getRootProcesses: () =>
    get().processes.filter((p) => !p.parentProcessId),
  
  getSortedProcesses: () =>
    [...get().processes].sort((a, b) => a.displayOrder - b.displayOrder),
  
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
 * 工程数を取得
 */
export const selectProcessCount = (state: ProcessStore) => state.processes.length;

/**
 * 選択中の工程を取得
 */
export const selectSelectedProcesses = (state: ProcessStore) =>
  state.processes.filter((p) => state.selectedProcesses.includes(p.id));

/**
 * レーンごとの工程数を取得
 */
export const selectProcessCountByLane = (state: ProcessStore) => {
  const counts: Record<string, number> = {};
  state.processes.forEach((p) => {
    counts[p.laneId] = (counts[p.laneId] || 0) + 1;
  });
  return counts;
};
