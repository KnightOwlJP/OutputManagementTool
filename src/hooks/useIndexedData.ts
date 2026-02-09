/**
 * インデックス付きデータ管理フック
 * O(1)での高速検索を実現するためのユーティリティ
 */

'use client';

import { useMemo, useCallback } from 'react';
import type { Process, Swimlane, CustomColumn } from '@/types/models';

// ==========================================
// 型定義
// ==========================================

export interface IndexedProcesses {
  /** 全プロセスの配列 */
  all: Process[];
  /** IDからプロセスへのマップ (O(1)検索) */
  byId: Map<string, Process>;
  /** レーンIDからプロセス配列へのマップ */
  byLaneId: Map<string, Process[]>;
  /** 親プロセスIDから子プロセス配列へのマップ */
  byParentId: Map<string, Process[]>;
  /** displayOrderでソート済みの配列 */
  sorted: Process[];
  /** ルートプロセス（親なし）の配列 */
  roots: Process[];
  /** 統計情報 */
  stats: {
    total: number;
    byLane: Record<string, number>;
    byTaskType: Record<string, number>;
  };
}

export interface IndexedSwimlanes {
  /** 全スイムレーンの配列 */
  all: Swimlane[];
  /** IDからスイムレーンへのマップ */
  byId: Map<string, Swimlane>;
  /** orderでソート済みの配列 */
  sorted: Swimlane[];
}

export interface ProcessTreeNode {
  process: Process;
  children: ProcessTreeNode[];
  depth: number;
  isExpanded?: boolean;
}

// ==========================================
// インデックス構築関数
// ==========================================

/**
 * プロセス配列からインデックス付きデータを構築
 */
export function buildProcessIndex(processes: Process[]): IndexedProcesses {
  const byId = new Map<string, Process>();
  const byLaneId = new Map<string, Process[]>();
  const byParentId = new Map<string, Process[]>();
  const byLane: Record<string, number> = {};
  const byTaskType: Record<string, number> = {};
  const roots: Process[] = [];

  for (const process of processes) {
    // IDインデックス
    byId.set(process.id, process);

    // レーンIDインデックス
    const laneProcesses = byLaneId.get(process.laneId) || [];
    laneProcesses.push(process);
    byLaneId.set(process.laneId, laneProcesses);

    // 親IDインデックス
    if (process.parentProcessId) {
      const children = byParentId.get(process.parentProcessId) || [];
      children.push(process);
      byParentId.set(process.parentProcessId, children);
    } else {
      roots.push(process);
    }

    // 統計情報
    byLane[process.laneId] = (byLane[process.laneId] || 0) + 1;
    if (process.taskType) {
      byTaskType[process.taskType] = (byTaskType[process.taskType] || 0) + 1;
    }
  }

  // ソート済み配列
  const sorted = [...processes].sort((a, b) => a.displayOrder - b.displayOrder);

  return {
    all: processes,
    byId,
    byLaneId,
    byParentId,
    sorted,
    roots: roots.sort((a, b) => a.displayOrder - b.displayOrder),
    stats: {
      total: processes.length,
      byLane,
      byTaskType,
    },
  };
}

/**
 * スイムレーン配列からインデックス付きデータを構築
 */
export function buildSwimlaneIndex(swimlanes: Swimlane[]): IndexedSwimlanes {
  const byId = new Map<string, Swimlane>();

  for (const swimlane of swimlanes) {
    byId.set(swimlane.id, swimlane);
  }

  const sorted = [...swimlanes].sort((a, b) => a.order - b.order);

  return {
    all: swimlanes,
    byId,
    sorted,
  };
}

/**
 * プロセスツリーを構築
 */
export function buildProcessTree(
  indexed: IndexedProcesses,
  expandedIds?: Set<string>
): ProcessTreeNode[] {
  const buildNodes = (parentId: string | null, depth: number): ProcessTreeNode[] => {
    const children = parentId
      ? indexed.byParentId.get(parentId) || []
      : indexed.roots;

    return children
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map((process) => ({
        process,
        children: buildNodes(process.id, depth + 1),
        depth,
        isExpanded: expandedIds?.has(process.id) ?? true,
      }));
  };

  return buildNodes(null, 0);
}

/**
 * ツリーをフラット化（展開状態を考慮）
 */
export function flattenProcessTree(
  nodes: ProcessTreeNode[],
  respectExpanded = true
): ProcessTreeNode[] {
  const result: ProcessTreeNode[] = [];

  const traverse = (nodeList: ProcessTreeNode[]) => {
    for (const node of nodeList) {
      result.push(node);
      if (!respectExpanded || node.isExpanded) {
        traverse(node.children);
      }
    }
  };

  traverse(nodes);
  return result;
}

// ==========================================
// カスタムフック
// ==========================================

/**
 * インデックス付きプロセスデータを提供するフック
 */
export function useIndexedProcesses(processes: Process[]): IndexedProcesses {
  return useMemo(() => buildProcessIndex(processes), [processes]);
}

/**
 * インデックス付きスイムレーンデータを提供するフック
 */
export function useIndexedSwimlanes(swimlanes: Swimlane[]): IndexedSwimlanes {
  return useMemo(() => buildSwimlaneIndex(swimlanes), [swimlanes]);
}

/**
 * プロセスツリーを提供するフック
 */
export function useProcessTree(
  processes: Process[],
  expandedIds?: Set<string>
): {
  indexed: IndexedProcesses;
  tree: ProcessTreeNode[];
  flatTree: ProcessTreeNode[];
} {
  const indexed = useIndexedProcesses(processes);

  const tree = useMemo(
    () => buildProcessTree(indexed, expandedIds),
    [indexed, expandedIds]
  );

  const flatTree = useMemo(
    () => flattenProcessTree(tree, true),
    [tree]
  );

  return { indexed, tree, flatTree };
}

/**
 * フィルタリングされたプロセスを提供するフック
 */
export function useFilteredProcesses(
  indexed: IndexedProcesses,
  filters: {
    laneId?: string;
    taskType?: string;
    searchText?: string;
  }
): Process[] {
  return useMemo(() => {
    let result = indexed.sorted;

    if (filters.laneId && filters.laneId !== 'all') {
      result = indexed.byLaneId.get(filters.laneId) || [];
    }

    if (filters.taskType && filters.taskType !== 'all') {
      result = result.filter((p) => p.taskType === filters.taskType);
    }

    if (filters.searchText) {
      const searchLower = filters.searchText.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(searchLower) ||
          p.largeName?.toLowerCase().includes(searchLower) ||
          p.mediumName?.toLowerCase().includes(searchLower) ||
          p.smallName?.toLowerCase().includes(searchLower) ||
          p.documentation?.toLowerCase().includes(searchLower)
      );
    }

    return result;
  }, [indexed, filters.laneId, filters.taskType, filters.searchText]);
}

/**
 * プロセスの前工程・次工程を解決するフック
 */
export function useProcessRelations(
  process: Process | null,
  indexed: IndexedProcesses
): {
  beforeProcesses: Process[];
  nextProcesses: Process[];
  parentProcess: Process | null;
  childProcesses: Process[];
} {
  return useMemo(() => {
    if (!process) {
      return {
        beforeProcesses: [],
        nextProcesses: [],
        parentProcess: null,
        childProcesses: [],
      };
    }

    const beforeProcesses = (process.beforeProcessIds || [])
      .map((id) => indexed.byId.get(id))
      .filter((p): p is Process => p !== undefined);

    const nextProcesses = (process.nextProcessIds || [])
      .map((id) => indexed.byId.get(id))
      .filter((p): p is Process => p !== undefined);

    const parentProcess = process.parentProcessId
      ? indexed.byId.get(process.parentProcessId) || null
      : null;

    const childProcesses = indexed.byParentId.get(process.id) || [];

    return {
      beforeProcesses,
      nextProcesses,
      parentProcess,
      childProcesses,
    };
  }, [process, indexed]);
}
