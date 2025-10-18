'use client';

import React, { useMemo, useState, useRef } from 'react';
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Button,
  Input,
  Select,
  SelectItem,
  Tooltip,
  Textarea,
} from '@heroui/react';
import {
  PencilIcon,
  TrashIcon,
  PlusCircleIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  CheckIcon,
  XMarkIcon,
  Bars3Icon,
  ChevronRightIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
import { Process, ProcessLevel } from '@/types/project.types';
import { useToast } from '@/contexts/ToastContext';

interface IntegratedProcessTableProps {
  processes: Process[];
  onProcessUpdate?: (processId: string, data: Partial<Process>) => Promise<void>;
  onProcessDelete?: (processId: string) => void;
  onProcessCreate?: (parentId: string | null, level?: ProcessLevel) => void;
  onProcessReorder?: (processId: string, newOrder: number) => Promise<void>;
  onProcessMove?: (processId: string, newParentId: string | null) => Promise<void>;
  isLoading?: boolean;
}

interface TreeNode extends Process {
  children: TreeNode[];
  depth: number;
}

export function IntegratedProcessTable({
  processes,
  onProcessUpdate,
  onProcessDelete,
  onProcessCreate,
  onProcessReorder,
  onProcessMove,
  isLoading = false,
}: IntegratedProcessTableProps) {
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<ProcessLevel | 'all'>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<Partial<Process>>({});
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // ツリー構造を構築
  const buildTree = (processes: Process[]): TreeNode[] => {
    const map = new Map<string, TreeNode>();
    const roots: TreeNode[] = [];

    // 初期化
    processes.forEach((process) => {
      map.set(process.id, { ...process, children: [], depth: 0 });
    });

    // ツリー構築
    processes.forEach((process) => {
      const node = map.get(process.id)!;
      if (process.parentId && map.has(process.parentId)) {
        const parent = map.get(process.parentId)!;
        node.depth = parent.depth + 1;
        parent.children.push(node);
      } else {
        roots.push(node);
      }
    });

    // 子要素を displayOrder でソート
    const sortChildren = (node: TreeNode) => {
      node.children.sort((a, b) => a.displayOrder - b.displayOrder);
      node.children.forEach(sortChildren);
    };
    roots.forEach(sortChildren);
    roots.sort((a, b) => a.displayOrder - b.displayOrder);

    return roots;
  };

  // ツリーをフラット配列に変換（表示用）
  const flattenTree = (nodes: TreeNode[], expanded: Set<string>): TreeNode[] => {
    const result: TreeNode[] = [];
    
    const traverse = (node: TreeNode) => {
      result.push(node);
      if (expanded.has(node.id) && node.children.length > 0) {
        node.children.forEach(traverse);
      }
    };

    nodes.forEach(traverse);
    return result;
  };

  // フィルタリング
  const filteredProcesses = useMemo(() => {
    let filtered = [...processes];

    if (levelFilter !== 'all') {
      filtered = filtered.filter((p) => p.level === levelFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.description?.toLowerCase().includes(query) ||
          p.department?.toLowerCase().includes(query) ||
          p.assignee?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [processes, levelFilter, searchQuery]);

  // 表示用データ
  const displayData = useMemo(() => {
    const tree = buildTree(filteredProcesses);
    return flattenTree(tree, expandedNodes);
  }, [filteredProcesses, expandedNodes]);

  // レベル情報
  const getLevelLabel = (level: ProcessLevel): string => {
    const labels: Record<ProcessLevel, string> = {
      large: '大工程',
      medium: '中工程',
      small: '小工程',
      detail: '詳細工程',
    };
    return labels[level];
  };

  const getLevelColor = (level: ProcessLevel) => {
    const colors: Record<ProcessLevel, 'primary' | 'success' | 'warning' | 'secondary'> = {
      large: 'primary',
      medium: 'success',
      small: 'warning',
      detail: 'secondary',
    };
    return colors[level];
  };

  // 日付フォーマット
  const formatDate = (date?: Date | string): string => {
    if (!date) return '';
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '';
    return d.toISOString().split('T')[0];
  };

  // 展開/折りたたみ
  const toggleExpand = (nodeId: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  // 編集開始
  const startEdit = (process: Process, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(process.id);
    setEditingData({
      name: process.name,
      department: process.department,
      assignee: process.assignee,
      documentType: process.documentType,
      description: process.description,
      startDate: process.startDate,
      endDate: process.endDate,
    });
  };

  // 編集保存
  const saveEdit = async () => {
    if (!editingId || !onProcessUpdate) return;

    setIsSaving(true);
    try {
      await onProcessUpdate(editingId, editingData);
      setEditingId(null);
      setEditingData({});
      showToast('success', '工程を更新しました');
    } catch (error) {
      console.error('Failed to update process:', error);
      showToast('error', '更新に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  // 編集キャンセル
  const cancelEdit = () => {
    setEditingId(null);
    setEditingData({});
  };

  // ドラッグ開始
  const handleDragStart = (processId: string, e: React.DragEvent) => {
    e.stopPropagation();
    setDraggedId(processId);
    e.dataTransfer.effectAllowed = 'move';
  };

  // ドラッグオーバー
  const handleDragOver = (processId: string, e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedId && draggedId !== processId) {
      setDropTargetId(processId);
      e.dataTransfer.dropEffect = 'move';
    }
  };

  // ドロップ
  const handleDrop = async (targetId: string, e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!draggedId || !onProcessMove || draggedId === targetId) {
      setDraggedId(null);
      setDropTargetId(null);
      return;
    }

    // 循環参照チェック
    const isDescendant = (nodeId: string, ancestorId: string): boolean => {
      const node = processes.find((p) => p.id === nodeId);
      if (!node || !node.parentId) return false;
      if (node.parentId === ancestorId) return true;
      return isDescendant(node.parentId, ancestorId);
    };

    if (isDescendant(targetId, draggedId)) {
      showToast('warning', '子孫ノードを親にすることはできません');
      setDraggedId(null);
      setDropTargetId(null);
      return;
    }

    try {
      await onProcessMove(draggedId, targetId);
      showToast('success', '工程を移動しました');
    } catch (error) {
      console.error('Failed to move process:', error);
      showToast('error', '移動に失敗しました');
    }

    setDraggedId(null);
    setDropTargetId(null);
  };

  // ドラッグ終了
  const handleDragEnd = () => {
    setDraggedId(null);
    setDropTargetId(null);
  };

  // 通常セルのレンダリング
  const renderCell = (process: TreeNode, columnKey: string) => {
    const isEditing = editingId === process.id;

    switch (columnKey) {
      case 'name':
        return (
          <div className="flex items-center gap-2" style={{ paddingLeft: `${process.depth * 24}px` }}>
            {/* 展開/折りたたみボタン */}
            {process.children.length > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpand(process.id);
                }}
                className="flex-shrink-0 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
              >
                {expandedNodes.has(process.id) ? (
                  <ChevronDownIcon className="w-4 h-4" />
                ) : (
                  <ChevronRightIcon className="w-4 h-4" />
                )}
              </button>
            )}
            {/* ドラッグハンドル */}
            <div
              draggable
              onDragStart={(e) => handleDragStart(process.id, e)}
              onDragEnd={handleDragEnd}
              className="flex-shrink-0 cursor-move p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
            >
              <Bars3Icon className="w-4 h-4 text-gray-400" />
            </div>
            {/* 名前 */}
            {isEditing ? (
              <Input
                size="sm"
                value={editingData.name || ''}
                onValueChange={(value) => setEditingData({ ...editingData, name: value })}
                className="flex-1"
                autoFocus
              />
            ) : (
              <div className="flex flex-col flex-1 min-w-0">
                <span className="font-medium text-sm truncate">{process.name}</span>
                {process.description && (
                  <span className="text-xs text-gray-500 truncate">{process.description}</span>
                )}
              </div>
            )}
          </div>
        );

      case 'level':
        return (
          <Chip size="sm" color={getLevelColor(process.level)} variant="flat">
            {getLevelLabel(process.level)}
          </Chip>
        );

      case 'department':
        return isEditing ? (
          <Input
            size="sm"
            value={editingData.department || ''}
            onValueChange={(value) => setEditingData({ ...editingData, department: value })}
          />
        ) : (
          <span className="text-sm">{process.department || '-'}</span>
        );

      case 'assignee':
        return isEditing ? (
          <Input
            size="sm"
            value={editingData.assignee || ''}
            onValueChange={(value) => setEditingData({ ...editingData, assignee: value })}
          />
        ) : (
          <span className="text-sm">{process.assignee || '-'}</span>
        );

      case 'documentType':
        return isEditing ? (
          <Input
            size="sm"
            value={editingData.documentType || ''}
            onValueChange={(value) => setEditingData({ ...editingData, documentType: value })}
          />
        ) : (
          <span className="text-sm">{process.documentType || '-'}</span>
        );

      case 'startDate':
        return isEditing ? (
          <Input
            type="date"
            size="sm"
            value={formatDate(editingData.startDate)}
            onChange={(e) => setEditingData({ ...editingData, startDate: e.target.value ? new Date(e.target.value) : undefined })}
          />
        ) : (
          <span className="text-sm">{formatDate(process.startDate) || '-'}</span>
        );

      case 'endDate':
        return isEditing ? (
          <Input
            type="date"
            size="sm"
            value={formatDate(editingData.endDate)}
            onChange={(e) => setEditingData({ ...editingData, endDate: e.target.value ? new Date(e.target.value) : undefined })}
          />
        ) : (
          <span className="text-sm">{formatDate(process.endDate) || '-'}</span>
        );

      case 'actions':
        return isEditing ? (
          <div className="flex items-center justify-center gap-1">
            <Tooltip content="保存">
              <Button
                isIconOnly
                size="sm"
                color="success"
                variant="flat"
                onPress={saveEdit}
                isLoading={isSaving}
              >
                <CheckIcon className="w-4 h-4" />
              </Button>
            </Tooltip>
            <Tooltip content="キャンセル">
              <Button
                isIconOnly
                size="sm"
                color="default"
                variant="flat"
                onPress={cancelEdit}
                isDisabled={isSaving}
              >
                <XMarkIcon className="w-4 h-4" />
              </Button>
            </Tooltip>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-1">
            <Tooltip content="編集">
              <Button
                isIconOnly
                size="sm"
                variant="light"
                color="default"
                onPress={(e) => startEdit(process, e as any)}
              >
                <PencilIcon className="w-4 h-4" />
              </Button>
            </Tooltip>
            {onProcessCreate && (
              <Tooltip content="子工程追加">
                <Button
                  isIconOnly
                  size="sm"
                  variant="light"
                  color="primary"
                  onPress={(e) => {
                    (e as any).stopPropagation();
                    onProcessCreate(process.id);
                  }}
                >
                  <PlusCircleIcon className="w-4 h-4" />
                </Button>
              </Tooltip>
            )}
            {onProcessDelete && (
              <Tooltip content="削除">
                <Button
                  isIconOnly
                  size="sm"
                  variant="light"
                  color="danger"
                  onPress={(e) => {
                    (e as any).stopPropagation();
                    onProcessDelete(process.id);
                  }}
                >
                  <TrashIcon className="w-4 h-4" />
                </Button>
              </Tooltip>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* ツールバー */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          placeholder="工程名、説明、部署、担当者で検索..."
          value={searchQuery}
          onValueChange={setSearchQuery}
          className="flex-1"
          startContent={<MagnifyingGlassIcon className="w-4 h-4 text-gray-400" />}
          isClearable
          size="sm"
        />

        <Select
          placeholder="レベルで絞り込み"
          selectedKeys={[levelFilter]}
          onSelectionChange={(keys) => {
            const value = Array.from(keys)[0] as ProcessLevel | 'all';
            setLevelFilter(value);
          }}
          className="w-full sm:w-48"
          startContent={<FunnelIcon className="w-4 h-4 text-gray-400" />}
          size="sm"
        >
          <SelectItem key="all">すべて</SelectItem>
          <SelectItem key="large">大工程</SelectItem>
          <SelectItem key="medium">中工程</SelectItem>
          <SelectItem key="small">小工程</SelectItem>
          <SelectItem key="detail">詳細工程</SelectItem>
        </Select>

        {onProcessCreate && (
          <Button
            color="primary"
            size="sm"
            startContent={<PlusCircleIcon className="w-4 h-4" />}
            onPress={() => onProcessCreate(null)}
          >
            工程追加
          </Button>
        )}

        <Button
          size="sm"
          variant="flat"
          onPress={() => {
            if (expandedNodes.size === 0) {
              // すべて展開
              const allIds = new Set(processes.map((p) => p.id));
              setExpandedNodes(allIds);
            } else {
              // すべて折りたたむ
              setExpandedNodes(new Set());
            }
          }}
        >
          {expandedNodes.size === 0 ? 'すべて展開' : 'すべて折りたたむ'}
        </Button>
      </div>

      {/* テーブル */}
      <div className="border rounded-lg overflow-hidden">
        <Table
          aria-label="統合工程表"
          isStriped
          removeWrapper
          className="min-w-full"
          isHeaderSticky
        >
          <TableHeader>
            <TableColumn key="name" className="w-[30%]">
              工程名
            </TableColumn>
            <TableColumn key="level" className="w-[10%]">
              レベル
            </TableColumn>
            <TableColumn key="department" className="w-[12%]">
              部署
            </TableColumn>
            <TableColumn key="assignee" className="w-[12%]">
              担当者
            </TableColumn>
            <TableColumn key="documentType" className="w-[12%]">
              帳票種類
            </TableColumn>
            <TableColumn key="startDate" className="w-[10%]">
              開始日
            </TableColumn>
            <TableColumn key="endDate" className="w-[10%]">
              終了日
            </TableColumn>
            <TableColumn key="actions" align="center" className="w-[4%]">
              操作
            </TableColumn>
          </TableHeader>
          <TableBody
            items={displayData}
            isLoading={isLoading}
            emptyContent={
              <div className="text-center py-8 text-gray-500">
                {searchQuery || levelFilter !== 'all'
                  ? '条件に一致する工程が見つかりません'
                  : '工程がまだありません'}
              </div>
            }
          >
            {(process) => (
              <TableRow
                key={process.id}
                className={`
                  hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors
                  ${draggedId === process.id ? 'opacity-50' : ''}
                  ${dropTargetId === process.id ? 'bg-blue-50 dark:bg-blue-900' : ''}
                `}
                onDragOver={(e) => handleDragOver(process.id, e as any)}
                onDrop={(e) => handleDrop(process.id, e as any)}
              >
                <TableCell>{renderCell(process, 'name')}</TableCell>
                <TableCell>{renderCell(process, 'level')}</TableCell>
                <TableCell>{renderCell(process, 'department')}</TableCell>
                <TableCell>{renderCell(process, 'assignee')}</TableCell>
                <TableCell>{renderCell(process, 'documentType')}</TableCell>
                <TableCell>{renderCell(process, 'startDate')}</TableCell>
                <TableCell>{renderCell(process, 'endDate')}</TableCell>
                <TableCell>{renderCell(process, 'actions')}</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* 統計情報 */}
      <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
        <div>全{processes.length}件を表示</div>
        <div className="flex gap-4">
          <span>大工程: {processes.filter((p) => p.level === 'large').length}</span>
          <span>中工程: {processes.filter((p) => p.level === 'medium').length}</span>
          <span>小工程: {processes.filter((p) => p.level === 'small').length}</span>
          <span>詳細工程: {processes.filter((p) => p.level === 'detail').length}</span>
        </div>
      </div>

      {/* ヘルプ */}
      <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
        <p className="text-sm text-blue-900 dark:text-blue-100 font-semibold mb-2">💡 使い方</p>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 ml-4 list-disc">
          <li><strong>編集</strong>: 鉛筆アイコンをクリックしてインライン編集</li>
          <li><strong>並び替え</strong>: ☰アイコンをドラッグして順序変更</li>
          <li><strong>階層移動</strong>: 工程を別の工程にドロップして親子関係を変更</li>
          <li><strong>展開/折りたたみ</strong>: 矢印アイコンで子工程の表示切り替え</li>
        </ul>
      </div>
    </div>
  );
}
