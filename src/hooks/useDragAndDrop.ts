/**
 * ドラッグ&ドロップ並び替えフック
 * リスト項目の並び替えをサポート
 */

'use client';

import { useState, useCallback, useRef, useMemo } from 'react';

// ==========================================
// 型定義
// ==========================================

export interface DragItem<T> {
  id: string;
  index: number;
  data: T;
}

export interface DropTarget {
  id: string;
  index: number;
  position: 'before' | 'after';
}

export interface DragState {
  isDragging: boolean;
  draggedId: string | null;
  draggedIndex: number | null;
  dropTargetId: string | null;
  dropPosition: 'before' | 'after' | null;
}

export interface UseDragAndDropOptions<T> {
  items: T[];
  getId: (item: T) => string;
  onReorder: (fromIndex: number, toIndex: number) => void | Promise<void>;
  /** ドラッグ可能かどうか */
  canDrag?: (item: T) => boolean;
  /** ドロップ可能かどうか */
  canDrop?: (draggedItem: T, targetItem: T) => boolean;
}

export interface UseDragAndDropResult<T> {
  /** ドラッグ状態 */
  state: DragState;
  /** ドラッグ開始ハンドラ */
  handleDragStart: (item: T, index: number) => void;
  /** ドラッグオーバーハンドラ */
  handleDragOver: (e: React.DragEvent, item: T, index: number) => void;
  /** ドラッグ終了ハンドラ */
  handleDragEnd: () => void;
  /** ドロップハンドラ */
  handleDrop: (e: React.DragEvent, targetItem: T, targetIndex: number) => void;
  /** ドラッグリーブハンドラ */
  handleDragLeave: () => void;
  /** 項目がドラッグ中かどうか */
  isDragged: (id: string) => boolean;
  /** 項目がドロップターゲットかどうか */
  isDropTarget: (id: string) => boolean;
  /** ドロップ位置を取得 */
  getDropPosition: (id: string) => 'before' | 'after' | null;
  /** ドラッグ可能かどうか */
  canDragItem: (item: T) => boolean;
}

// ==========================================
// フック実装
// ==========================================

/**
 * ドラッグ&ドロップ並び替えフック
 */
export function useDragAndDrop<T>({
  items,
  getId,
  onReorder,
  canDrag = () => true,
  canDrop = () => true,
}: UseDragAndDropOptions<T>): UseDragAndDropResult<T> {
  const [state, setState] = useState<DragState>({
    isDragging: false,
    draggedId: null,
    draggedIndex: null,
    dropTargetId: null,
    dropPosition: null,
  });

  const draggedItemRef = useRef<T | null>(null);

  // ドラッグ開始
  const handleDragStart = useCallback(
    (item: T, index: number) => {
      if (!canDrag(item)) return;

      draggedItemRef.current = item;
      setState({
        isDragging: true,
        draggedId: getId(item),
        draggedIndex: index,
        dropTargetId: null,
        dropPosition: null,
      });
    },
    [getId, canDrag]
  );

  // ドラッグオーバー
  const handleDragOver = useCallback(
    (e: React.DragEvent, item: T, index: number) => {
      e.preventDefault();
      e.stopPropagation();

      if (!draggedItemRef.current) return;
      
      const draggedItem = draggedItemRef.current;
      const targetId = getId(item);
      const draggedId = getId(draggedItem);

      // 自分自身の場合はスキップ
      if (targetId === draggedId) {
        setState((prev) => ({
          ...prev,
          dropTargetId: null,
          dropPosition: null,
        }));
        return;
      }

      // ドロップ可能かチェック
      if (!canDrop(draggedItem, item)) {
        return;
      }

      // マウス位置から上半分/下半分を判定
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const y = e.clientY - rect.top;
      const position: 'before' | 'after' = y < rect.height / 2 ? 'before' : 'after';

      setState((prev) => ({
        ...prev,
        dropTargetId: targetId,
        dropPosition: position,
      }));
    },
    [getId, canDrop]
  );

  // ドラッグ終了
  const handleDragEnd = useCallback(() => {
    draggedItemRef.current = null;
    setState({
      isDragging: false,
      draggedId: null,
      draggedIndex: null,
      dropTargetId: null,
      dropPosition: null,
    });
  }, []);

  // ドロップ
  const handleDrop = useCallback(
    async (e: React.DragEvent, targetItem: T, targetIndex: number) => {
      e.preventDefault();
      e.stopPropagation();

      const { draggedIndex, dropPosition } = state;
      
      if (draggedIndex === null || dropPosition === null) {
        handleDragEnd();
        return;
      }

      // 新しいインデックスを計算
      let newIndex = targetIndex;
      if (dropPosition === 'after') {
        newIndex = targetIndex + 1;
      }

      // ドラッグ元が移動先より前にある場合、インデックスを調整
      if (draggedIndex < newIndex) {
        newIndex -= 1;
      }

      // 同じ位置の場合はスキップ
      if (draggedIndex !== newIndex) {
        await onReorder(draggedIndex, newIndex);
      }

      handleDragEnd();
    },
    [state, onReorder, handleDragEnd]
  );

  // ドラッグリーブ
  const handleDragLeave = useCallback(() => {
    setState((prev) => ({
      ...prev,
      dropTargetId: null,
      dropPosition: null,
    }));
  }, []);

  // ユーティリティ関数
  const isDragged = useCallback(
    (id: string) => state.draggedId === id,
    [state.draggedId]
  );

  const isDropTarget = useCallback(
    (id: string) => state.dropTargetId === id,
    [state.dropTargetId]
  );

  const getDropPosition = useCallback(
    (id: string) => (state.dropTargetId === id ? state.dropPosition : null),
    [state.dropTargetId, state.dropPosition]
  );

  const canDragItem = useCallback(
    (item: T) => canDrag(item),
    [canDrag]
  );

  return {
    state,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDrop,
    handleDragLeave,
    isDragged,
    isDropTarget,
    getDropPosition,
    canDragItem,
  };
}

// ==========================================
// ドロップインジケーターコンポーネント用スタイル
// ==========================================

/**
 * ドロップ位置に応じたCSSクラスを取得
 */
export function getDropIndicatorClasses(
  position: 'before' | 'after' | null,
  isTarget: boolean
): string {
  if (!isTarget || !position) return '';

  const baseClasses = 'relative';
  const indicatorClasses =
    position === 'before'
      ? 'before:absolute before:left-0 before:right-0 before:top-0 before:h-0.5 before:bg-primary-500 before:z-10'
      : 'after:absolute after:left-0 after:right-0 after:bottom-0 after:h-0.5 after:bg-primary-500 after:z-10';

  return `${baseClasses} ${indicatorClasses}`;
}

/**
 * ドラッグ中のアイテムのスタイル
 */
export function getDraggedItemClasses(isDragged: boolean): string {
  return isDragged ? 'opacity-50 scale-95' : '';
}

export default useDragAndDrop;
