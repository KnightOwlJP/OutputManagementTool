'use client';

import React, { useState, useMemo, useEffect, memo, useCallback } from 'react';
import { Card, CardBody, Button, Input, Select, SelectItem } from '@heroui/react';
import { 
  PencilIcon, 
  TrashIcon, 
  PlusCircleIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import { Process, ProcessLevel } from '@/types/project.types';
import { useHierarchyViewStore } from '@/stores/hierarchyViewStore';
import { useToast } from '@/contexts/ToastContext';

interface HierarchyTreeProps {
  projectId: string;
  processes: Process[];
  onProcessSelect?: (process: Process) => void;
  onProcessMove?: (processId: string, newParentId: string | null) => void;
  onProcessDelete?: (processId: string) => void;
  onProcessEdit?: (process: Process) => void;
  onProcessCreate?: (parentId: string | null) => void;
}

interface TreeNode extends Process {
  children: TreeNode[];
  level: ProcessLevel;
}

export const HierarchyTree = memo(function HierarchyTree({
  projectId,
  processes,
  onProcessSelect,
  onProcessMove,
  onProcessDelete,
  onProcessEdit,
  onProcessCreate,
}: HierarchyTreeProps) {
  const { showToast } = useToast();
  const {
    getExpandedNodes,
    toggleNode: toggleNodeInStore,
    expandAll: expandAllInStore,
    collapseAll: collapseAllInStore,
  } = useHierarchyViewStore();

  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<ProcessLevel | 'all'>('all');
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [dragOverNodeId, setDragOverNodeId] = useState<string | null>(null);

  // 保存された展開状態を復元
  useEffect(() => {
    const saved = getExpandedNodes(projectId);
    setExpandedNodes(saved);
  }, [projectId, getExpandedNodes]);

  /**
   * ツリー構造の構築
   */
  const processTree = useMemo(() => {
    const buildTree = (parentId: string | null = null): TreeNode[] => {
      return processes
        .filter((p) => p.parentId === parentId)
        .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
        .map((process) => ({
          ...process,
          children: buildTree(process.id),
        }));
    };

    return buildTree();
  }, [processes]);

  /**
   * フィルタリングされたツリー
   */
  const filteredTree = useMemo(() => {
    const filterNode = (node: TreeNode): TreeNode | null => {
      // レベルフィルタ
      if (levelFilter !== 'all' && node.level !== levelFilter) {
        // 子ノードをチェック
        const filteredChildren = node.children
          .map(filterNode)
          .filter((n): n is TreeNode => n !== null);
        
        if (filteredChildren.length > 0) {
          return { ...node, children: filteredChildren };
        }
        return null;
      }

      // 検索クエリフィルタ
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          node.name.toLowerCase().includes(query) ||
          (node.description?.toLowerCase().includes(query)) ||
          (node.department?.toLowerCase().includes(query)) ||
          (node.assignee?.toLowerCase().includes(query));

        if (!matchesSearch) {
          // 子ノードをチェック
          const filteredChildren = node.children
            .map(filterNode)
            .filter((n): n is TreeNode => n !== null);
          
          if (filteredChildren.length > 0) {
            return { ...node, children: filteredChildren };
          }
          return null;
        }
      }

      // 子ノードをフィルタリング
      const filteredChildren = node.children
        .map(filterNode)
        .filter((n): n is TreeNode => n !== null);

      return { ...node, children: filteredChildren };
    };

    return processTree.map(filterNode).filter((n): n is TreeNode => n !== null);
  }, [processTree, searchQuery, levelFilter]);

  /**
   * ノードの展開・折りたたみ
   */
  const toggleNode = useCallback((nodeId: string) => {
    toggleNodeInStore(projectId, nodeId);
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  }, [projectId, expandedNodes, toggleNodeInStore]);

  /**
   * 全展開・全折りたたみ
   */
  const expandAll = useCallback(() => {
    const allIds = processes.map((p) => p.id);
    expandAllInStore(projectId, allIds);
    setExpandedNodes(new Set(allIds));
  }, [projectId, processes, expandAllInStore]);

  const collapseAll = useCallback(() => {
    collapseAllInStore(projectId);
    setExpandedNodes(new Set());
  }, [projectId, collapseAllInStore]);

  /**
   * ノード選択
   */
  const handleNodeSelect = useCallback((node: TreeNode) => {
    setSelectedNodeId(node.id);
    if (onProcessSelect) {
      onProcessSelect(node);
    }
  }, [onProcessSelect]);

  /**
   * ドラッグ&ドロップハンドラ
   */
  const handleDragStart = useCallback((e: React.DragEvent, nodeId: string) => {
    e.stopPropagation();
    setDraggedNodeId(nodeId);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, nodeId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverNodeId(nodeId);
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.stopPropagation();
    setDragOverNodeId(null);
  }, []);

  const handleDrop = (e: React.DragEvent, targetNodeId: string | null) => {
    e.preventDefault();
    e.stopPropagation();

    if (!draggedNodeId || draggedNodeId === targetNodeId) {
      setDraggedNodeId(null);
      setDragOverNodeId(null);
      return;
    }

    // 循環参照チェック
    if (targetNodeId) {
      const isDescendant = (nodeId: string, ancestorId: string): boolean => {
        const node = processes.find((p) => p.id === nodeId);
        if (!node || !node.parentId) return false;
        if (node.parentId === ancestorId) return true;
        return isDescendant(node.parentId, ancestorId);
      };

      if (isDescendant(targetNodeId, draggedNodeId)) {
        showToast('warning', '子孫ノードを親にすることはできません');
        setDraggedNodeId(null);
        setDragOverNodeId(null);
        return;
      }
    }

    // 移動実行
    if (onProcessMove) {
      onProcessMove(draggedNodeId, targetNodeId);
    }

    setDraggedNodeId(null);
    setDragOverNodeId(null);
  };

  /**
   * レベル別のカラー
   */
  const getLevelColor = (level: ProcessLevel): string => {
    switch (level) {
      case 'large':
        return 'bg-blue-100 border-blue-300 text-blue-800';
      case 'medium':
        return 'bg-green-100 border-green-300 text-green-800';
      case 'small':
        return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      case 'detail':
        return 'bg-orange-100 border-orange-300 text-orange-800';
    }
  };

  const getLevelLabel = (level: ProcessLevel): string => {
    switch (level) {
      case 'large':
        return '大工程';
      case 'medium':
        return '中工程';
      case 'small':
        return '小工程';
      case 'detail':
        return '詳細工程';
    }
  };

  /**
   * ツリーノードのレンダリング
   */
  const renderNode = (node: TreeNode, depth: number = 0): React.ReactNode => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children.length > 0;
    const isSelected = selectedNodeId === node.id;
    const isDragging = draggedNodeId === node.id;
    const isDragOver = dragOverNodeId === node.id;

    return (
      <div key={node.id} className="select-none">
        <div
          draggable
          onDragStart={(e) => handleDragStart(e, node.id)}
          onDragOver={(e) => handleDragOver(e, node.id)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, node.id)}
          className={`
            flex items-center gap-2 p-2 rounded border mb-1
            cursor-move transition-all
            ${getLevelColor(node.level)}
            ${isSelected ? 'ring-2 ring-primary' : ''}
            ${isDragging ? 'opacity-50' : ''}
            ${isDragOver ? 'ring-2 ring-blue-500 scale-105' : ''}
          `}
          style={{ marginLeft: `${depth * 24}px` }}
          onClick={() => handleNodeSelect(node)}
        >
          {/* 展開/折りたたみボタン */}
          {hasChildren ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleNode(node.id);
              }}
              className="w-6 h-6 flex items-center justify-center hover:bg-gray-200 rounded"
            >
              {isExpanded ? '▼' : '▶'}
            </button>
          ) : (
            <div className="w-6" />
          )}

          {/* ノード情報 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold truncate">{node.name}</span>
              <span className="text-xs px-2 py-0.5 rounded bg-white/50">
                {getLevelLabel(node.level)}
              </span>
            </div>
            {node.description && (
              <p className="text-xs opacity-75 truncate">{node.description}</p>
            )}
            <div className="flex gap-2 text-xs mt-1">
              {node.department && (
                <span className="px-2 py-0.5 rounded bg-white/50">
                  部署: {node.department}
                </span>
              )}
              {node.assignee && (
                <span className="px-2 py-0.5 rounded bg-white/50">
                  担当: {node.assignee}
                </span>
              )}
              {node.documentType && (
                <span className="px-2 py-0.5 rounded bg-white/50">
                  帳票: {node.documentType}
                </span>
              )}
            </div>
          </div>

          {/* アクションボタン */}
          <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
            {onProcessCreate && (
              <Button
                size="sm"
                variant="flat"
                color="primary"
                onPress={() => onProcessCreate(node.id)}
                startContent={<PlusCircleIcon className="w-4 h-4" />}
                title="子工程を追加"
              >
                追加
              </Button>
            )}
            {onProcessEdit && (
              <Button
                size="sm"
                variant="flat"
                color="default"
                onPress={() => onProcessEdit(node)}
                startContent={<PencilIcon className="w-4 h-4" />}
                title="工程を編集"
              >
                編集
              </Button>
            )}
            {onProcessDelete && (
              <Button
                size="sm"
                variant="flat"
                color="danger"
                onPress={() => onProcessDelete(node.id)}
                startContent={<TrashIcon className="w-4 h-4" />}
                title="工程を削除"
              >
                削除
              </Button>
            )}
          </div>
        </div>

        {/* 子ノード */}
        {isExpanded && hasChildren && (
          <div>{node.children.map((child) => renderNode(child, depth + 1))}</div>
        )}
      </div>
    );
  };

  /**
   * ルートへのドロップエリア
   */
  const renderRootDropZone = () => (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragOverNodeId('root');
      }}
      onDragLeave={() => setDragOverNodeId(null)}
      onDrop={(e) => handleDrop(e, null)}
      className={`
        p-4 mb-4 border-2 border-dashed rounded-lg text-center
        ${dragOverNodeId === 'root' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
      `}
    >
      <p className="text-sm text-gray-600">
        ここにドロップしてルート階層に移動
      </p>
    </div>
  );

  return (
    <Card className="w-full">
      <CardBody className="space-y-4">
        {/* コントロールパネル */}
        <div className="space-y-3">
          {/* 検索とフィルタ */}
          <div className="flex gap-2">
            <Input
              placeholder="工程名、説明、部署、担当者で検索..."
              value={searchQuery}
              onValueChange={setSearchQuery}
              className="flex-1"
              startContent={<MagnifyingGlassIcon className="w-4 h-4 text-gray-400" />}
              isClearable
            />
            <Select
              placeholder="レベルで絞り込み"
              selectedKeys={[levelFilter]}
              onSelectionChange={(keys) => {
                const value = Array.from(keys)[0] as ProcessLevel | 'all';
                setLevelFilter(value);
              }}
              className="w-48"
              startContent={<FunnelIcon className="w-4 h-4 text-gray-400" />}
            >
              <SelectItem key="all">すべて</SelectItem>
              <SelectItem key="large">大工程</SelectItem>
              <SelectItem key="medium">中工程</SelectItem>
              <SelectItem key="small">小工程</SelectItem>
              <SelectItem key="detail">詳細工程</SelectItem>
            </Select>
          </div>

          {/* ツールバー */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button size="sm" variant="flat" onPress={expandAll}>
                すべて展開
              </Button>
              <Button size="sm" variant="flat" onPress={collapseAll}>
                すべて折りたたむ
              </Button>
            </div>
            {onProcessCreate && (
              <Button 
                size="sm" 
                color="primary" 
                variant="flat"
                startContent={<PlusCircleIcon className="w-4 h-4" />}
                onPress={() => onProcessCreate(null)}
              >
                ルート工程を追加
              </Button>
            )}
          </div>

          {/* 統計情報 */}
          <div className="grid grid-cols-4 gap-2 text-sm">
            <div className="p-2 bg-blue-50 rounded text-center">
              <p className="font-semibold">大工程</p>
              <p className="text-xl">
                {processes.filter((p) => p.level === 'large').length}
              </p>
            </div>
            <div className="p-2 bg-green-50 rounded text-center">
              <p className="font-semibold">中工程</p>
              <p className="text-xl">
                {processes.filter((p) => p.level === 'medium').length}
              </p>
            </div>
            <div className="p-2 bg-yellow-50 rounded text-center">
              <p className="font-semibold">小工程</p>
              <p className="text-xl">
                {processes.filter((p) => p.level === 'small').length}
              </p>
            </div>
            <div className="p-2 bg-orange-50 rounded text-center">
              <p className="font-semibold">詳細工程</p>
              <p className="text-xl">
                {processes.filter((p) => p.level === 'detail').length}
              </p>
            </div>
          </div>
        </div>

        {/* ドラッグ中のルートドロップゾーン */}
        {draggedNodeId && renderRootDropZone()}

        {/* ツリー表示 */}
        <div className="space-y-1 max-h-[600px] overflow-y-auto">
          {filteredTree.length > 0 ? (
            filteredTree.map((node) => renderNode(node))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>工程が見つかりません</p>
              {(searchQuery || levelFilter !== 'all') && (
                <p className="text-sm mt-2">検索条件を変更してください</p>
              )}
            </div>
          )}
        </div>

        {/* 使い方ガイド */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <p className="text-sm font-semibold mb-2">💡 使い方</p>
          <ul className="text-xs space-y-1 text-gray-600">
            <li>• ノードをドラッグ&ドロップして階層を変更できます</li>
            <li>• ▶/▼ ボタンで子工程の表示/非表示を切り替えます</li>
            <li>• ノードをクリックして選択できます</li>
            <li>• 検索ボックスで工程を絞り込めます</li>
          </ul>
        </div>
      </CardBody>
    </Card>
  );
});
