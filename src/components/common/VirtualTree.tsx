import React, { useMemo, CSSProperties } from 'react';
// @ts-ignore - react-window型定義の問題を回避
import { FixedSizeList } from 'react-window';
import { Process } from '@/types/project.types';

interface VirtualTreeProps {
  processes: Process[];
  expandedNodes: Set<string>;
  selectedNodes: Set<string>;
  height?: number;
  itemHeight?: number;
  renderNode: (process: Process, depth: number) => React.ReactNode;
  onToggle?: (processId: string) => void;
}

interface FlatNode {
  process: Process;
  depth: number;
}

interface RowProps {
  index: number;
  style: CSSProperties;
}

/**
 * 階層構造を平坦化して仮想スクロール対応にするユーティリティ
 */
function flattenTree(
  processes: Process[],
  expandedNodes: Set<string>,
  parentId: string | null = null,
  depth: number = 0
): FlatNode[] {
  const result: FlatNode[] = [];
  const children = processes.filter((p) => p.parentId === parentId);

  // display_orderでソート
  children.sort((a, b) => a.displayOrder - b.displayOrder);

  for (const process of children) {
    result.push({ process, depth });

    // ノードが展開されている場合、子ノードを追加
    if (expandedNodes.has(process.id)) {
      const childNodes = flattenTree(processes, expandedNodes, process.id, depth + 1);
      result.push(...childNodes);
    }
  }

  return result;
}

/**
 * 仮想スクロール対応階層ツリーコンポーネント
 */
export const VirtualTree: React.FC<VirtualTreeProps> = React.memo(
  ({ processes, expandedNodes, selectedNodes, height = 600, itemHeight = 60, renderNode }) => {
    // 平坦化されたノードリストを計算
    const flatNodes = useMemo(
      () => flattenTree(processes, expandedNodes),
      [processes, expandedNodes]
    );

    const Row = ({ index, style }: RowProps) => {
      const { process, depth } = flatNodes[index];
      return (
        <div style={style} className="virtual-tree-row">
          {renderNode(process, depth)}
        </div>
      );
    };

    return (
      <div className="virtual-tree">
        <FixedSizeList
          height={height}
          itemCount={flatNodes.length}
          itemSize={itemHeight}
          width="100%"
          overscanCount={5}
        >
          {Row}
        </FixedSizeList>
      </div>
    );
  }
);

VirtualTree.displayName = 'VirtualTree';

export default VirtualTree;
