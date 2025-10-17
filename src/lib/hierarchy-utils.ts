import { Process, ProcessLevel } from '@/types/project.types';

interface TreeNode extends Process {
  children: TreeNode[];
}

/**
 * プロセスの配列から階層ツリーを構築
 */
export function buildHierarchy(processes: Process[]): TreeNode[] {
  const processMap = new Map<string, TreeNode>();
  const roots: TreeNode[] = [];

  // まずすべてのプロセスをMapに追加（childrenプロパティ付き）
  processes.forEach((process) => {
    processMap.set(process.id, { ...process, children: [] });
  });

  // 親子関係を構築
  processes.forEach((process) => {
    const node = processMap.get(process.id)!;

    if (process.parentId) {
      const parent = processMap.get(process.parentId);
      if (parent) {
        parent.children.push(node);
      } else {
        // 親が見つからない場合はルートとして扱う
        roots.push(node);
      }
    } else {
      // 親IDがない場合はルート
      roots.push(node);
    }
  });

  // 各レベルでdisplayOrderでソート
  const sortChildren = (nodes: TreeNode[]) => {
    nodes.sort((a, b) => a.displayOrder - b.displayOrder);
    nodes.forEach((node) => {
      if (node.children.length > 0) {
        sortChildren(node.children);
      }
    });
  };

  sortChildren(roots);

  return roots;
}

/**
 * 循環参照をチェック
 */
export function findCircularReference(
  processes: Process[],
  processId: string,
  targetParentId: string
): boolean {
  // 自己参照チェック
  if (processId === targetParentId) {
    return true;
  }

  // プロセスマップを作成
  const processMap = new Map<string, Process>();
  processes.forEach((p) => processMap.set(p.id, p));

  // targetParentIdから上方向に辿ってprocessIdが見つかるか確認
  let currentId: string | undefined = targetParentId;
  const visited = new Set<string>();

  while (currentId) {
    // すでに訪問済みの場合は循環参照
    if (visited.has(currentId)) {
      return true;
    }

    visited.add(currentId);

    // processIdと一致したら循環参照
    if (currentId === processId) {
      return true;
    }

    // 親を辿る
    const current = processMap.get(currentId);
    currentId = current?.parentId;
  }

  return false;
}

/**
 * 階層レベルの妥当性をチェック
 */
export function validateHierarchyLevel(
  parentLevel: ProcessLevel | null,
  childLevel: ProcessLevel
): boolean {
  // レベルの順序
  const levelOrder: ProcessLevel[] = ['large', 'medium', 'small', 'detail'];

  // 親がいない場合（ルート）はlargeのみ許可
  if (!parentLevel) {
    return childLevel === 'large';
  }

  const parentIndex = levelOrder.indexOf(parentLevel);
  const childIndex = levelOrder.indexOf(childLevel);

  // 子は親の次のレベルでなければならない
  return childIndex === parentIndex + 1;
}

/**
 * プロセスIDから深さを計算
 */
export function calculateDepth(processes: Process[], processId: string): number {
  const processMap = new Map<string, Process>();
  processes.forEach((p) => processMap.set(p.id, p));

  let depth = 0;
  let currentId: string | undefined = processId;

  while (currentId) {
    const process = processMap.get(currentId);
    if (!process) break;

    depth++;
    currentId = process.parentId;
  }

  return depth;
}

/**
 * プロセスの子孫を再帰的に取得
 */
export function getDescendants(processes: Process[], parentId: string): Process[] {
  const descendants: Process[] = [];
  const children = processes.filter((p) => p.parentId === parentId);

  children.forEach((child) => {
    descendants.push(child);
    descendants.push(...getDescendants(processes, child.id));
  });

  return descendants;
}

/**
 * プロセスの祖先を取得
 */
export function getAncestors(processes: Process[], processId: string): Process[] {
  const ancestors: Process[] = [];
  const processMap = new Map<string, Process>();
  processes.forEach((p) => processMap.set(p.id, p));

  let currentId: string | undefined = processId;

  while (currentId) {
    const process = processMap.get(currentId);
    if (!process) break;

    if (process.parentId) {
      const parent = processMap.get(process.parentId);
      if (parent) {
        ancestors.unshift(parent);
        currentId = parent.id;
      } else {
        break;
      }
    } else {
      break;
    }
  }

  return ancestors;
}
