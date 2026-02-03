/**
 * Zustand ストアファクトリ
 * 共通のストアパターンを提供
 */

import { create, type StateCreator } from 'zustand';

// ==========================================
// 型定義
// ==========================================

/**
 * 基本的なエンティティの型
 */
export interface BaseEntity {
  id: string;
}

/**
 * 非同期操作の状態
 */
export interface AsyncState {
  isLoading: boolean;
  error: string | null;
}

/**
 * 選択状態
 */
export interface SelectionState {
  selectedIds: string[];
}

/**
 * 基本的なCRUD操作の型
 */
export interface CrudOperations<T extends BaseEntity> {
  setItems: (items: T[]) => void;
  addItem: (item: T) => void;
  updateItem: (id: string, updates: Partial<T>) => void;
  removeItem: (id: string) => void;
  clearItems: () => void;
  getById: (id: string) => T | undefined;
}

/**
 * 選択操作の型
 */
export interface SelectionOperations {
  select: (id: string) => void;
  deselect: (id: string) => void;
  selectMultiple: (ids: string[]) => void;
  clearSelection: () => void;
  isSelected: (id: string) => boolean;
}

/**
 * 非同期状態操作の型
 */
export interface AsyncOperations {
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

// ==========================================
// ストアファクトリ
// ==========================================

/**
 * エンティティストアの状態
 */
export interface EntityState<T extends BaseEntity>
  extends AsyncState,
    SelectionState {
  items: T[];
  currentItem: T | null;
}

/**
 * エンティティストアのアクション
 */
export interface EntityActions<T extends BaseEntity>
  extends CrudOperations<T>,
    SelectionOperations,
    AsyncOperations {
  setCurrentItem: (item: T | null) => void;
}

/**
 * エンティティストアの完全な型
 */
export type EntityStore<T extends BaseEntity> = EntityState<T> & EntityActions<T>;

/**
 * エンティティストアを作成
 */
export function createEntityStore<T extends BaseEntity>() {
  return create<EntityStore<T>>((set, get) => ({
    // 初期状態
    items: [],
    currentItem: null,
    selectedIds: [],
    isLoading: false,
    error: null,

    // CRUD操作
    setItems: (items) => set({ items }),

    addItem: (item) =>
      set((state) => ({
        items: [...state.items, item],
      })),

    updateItem: (id, updates) =>
      set((state) => ({
        items: state.items.map((item) =>
          item.id === id ? { ...item, ...updates } : item
        ),
        currentItem:
          state.currentItem?.id === id
            ? { ...state.currentItem, ...updates }
            : state.currentItem,
      })),

    removeItem: (id) =>
      set((state) => ({
        items: state.items.filter((item) => item.id !== id),
        currentItem: state.currentItem?.id === id ? null : state.currentItem,
        selectedIds: state.selectedIds.filter((sid) => sid !== id),
      })),

    clearItems: () =>
      set({
        items: [],
        currentItem: null,
        selectedIds: [],
      }),

    getById: (id) => get().items.find((item) => item.id === id),

    // カレント操作
    setCurrentItem: (item) => set({ currentItem: item }),

    // 選択操作
    select: (id) =>
      set((state) => ({
        selectedIds: state.selectedIds.includes(id)
          ? state.selectedIds
          : [...state.selectedIds, id],
      })),

    deselect: (id) =>
      set((state) => ({
        selectedIds: state.selectedIds.filter((sid) => sid !== id),
      })),

    selectMultiple: (ids) => set({ selectedIds: ids }),

    clearSelection: () => set({ selectedIds: [] }),

    isSelected: (id) => get().selectedIds.includes(id),

    // 非同期状態操作
    setLoading: (isLoading) => set({ isLoading }),

    setError: (error) => set({ error }),

    clearError: () => set({ error: null }),
  }));
}

// ==========================================
// ユーティリティ
// ==========================================

/**
 * 非同期操作をラップしてローディング・エラー状態を管理
 */
export async function withAsyncState<T>(
  store: AsyncOperations,
  fn: () => Promise<T>,
  errorMessage = 'エラーが発生しました'
): Promise<T | null> {
  store.setLoading(true);
  store.clearError();

  try {
    const result = await fn();
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : errorMessage;
    store.setError(message);
    return null;
  } finally {
    store.setLoading(false);
  }
}

/**
 * セレクタを作成するヘルパー
 */
export function createSelector<State, Result>(
  selector: (state: State) => Result
): (state: State) => Result {
  let lastArgs: State | undefined;
  let lastResult: Result | undefined;

  return (state: State): Result => {
    if (lastArgs === state) {
      return lastResult!;
    }
    lastArgs = state;
    lastResult = selector(state);
    return lastResult;
  };
}
