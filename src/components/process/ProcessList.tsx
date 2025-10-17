'use client';

import { useMemo, useState, memo, useCallback } from 'react';
import { Card, CardBody, Input, Select, SelectItem } from '@heroui/react';
import { 
  MagnifyingGlassIcon, 
  ChevronRightIcon, 
  ChevronDownIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { Process, ProcessLevel } from '@/types/project.types';
import { Button } from '../common/Button';

interface ProcessListProps {
  processes: Process[];
  onSelect?: (process: Process) => void;
  onEdit?: (process: Process) => void;
  onDelete?: (process: Process) => void;
  onCreate?: (parentId?: string, level?: ProcessLevel) => void;
  selectedId?: string;
  showActions?: boolean;
}

export const ProcessList = memo(function ProcessList({
  processes,
  onSelect,
  onEdit,
  onDelete,
  onCreate,
  selectedId,
  showActions = true,
}: ProcessListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLevel, setFilterLevel] = useState<ProcessLevel | 'all'>('all');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // 階層ツリーを構築
  const processTree = useMemo(() => {
    // ルートプロセス(親なし)を取得
    const roots = processes.filter(p => !p.parentId);
    
    // 子プロセスを再帰的に取得
    const buildTree = (parentId: string): Process[] => {
      return processes
        .filter(p => p.parentId === parentId)
        .sort((a, b) => a.displayOrder - b.displayOrder);
    };

    const addChildren = (process: Process): Process & { children: Process[] } => {
      const children = buildTree(process.id).map(addChildren);
      return { ...process, children };
    };

    return roots.sort((a, b) => a.displayOrder - b.displayOrder).map(addChildren);
  }, [processes]);

  // フィルタリングされたツリー
  const filteredTree = useMemo(() => {
    const filterTree = (nodes: any[]): any[] => {
      return nodes.filter(node => {
        // レベルフィルタ
        if (filterLevel !== 'all' && node.level !== filterLevel) {
          return false;
        }
        
        // 検索クエリ
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          const matchesName = node.name.toLowerCase().includes(query);
          const matchesDescription = node.description?.toLowerCase().includes(query);
          const matchesDepartment = node.department?.toLowerCase().includes(query);
          const matchesAssignee = node.assignee?.toLowerCase().includes(query);
          
          if (!matchesName && !matchesDescription && !matchesDepartment && !matchesAssignee) {
            return false;
          }
        }
        
        // 子要素をフィルタ
        if (node.children) {
          node.children = filterTree(node.children);
        }
        
        return true;
      });
    };

    return filterTree(JSON.parse(JSON.stringify(processTree)));
  }, [processTree, searchQuery, filterLevel]);

  // ノードの展開/折りたたみ
  const toggleNode = useCallback((id: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  // 全て展開
  const expandAll = useCallback(() => {
    const allIds = new Set<string>();
    const addIds = (nodes: any[]) => {
      nodes.forEach(node => {
        if (node.children && node.children.length > 0) {
          allIds.add(node.id);
          addIds(node.children);
        }
      });
    };
    addIds(processTree);
    setExpandedNodes(allIds);
  }, [processTree]);

  // 全て折りたたむ
  const collapseAll = useCallback(() => {
    setExpandedNodes(new Set());
  }, []);

  // レベル別のスタイル
  const getLevelStyle = (level: ProcessLevel) => {
    switch (level) {
      case 'large':
        return 'bg-primary-100 text-primary border-primary-200';
      case 'medium':
        return 'bg-secondary-100 text-secondary border-secondary-200';
      case 'small':
        return 'bg-success-100 text-success border-success-200';
      case 'detail':
        return 'bg-warning-100 text-warning border-warning-200';
    }
  };

  const getLevelLabel = (level: ProcessLevel) => {
    switch (level) {
      case 'large': return '大';
      case 'medium': return '中';
      case 'small': return '小';
      case 'detail': return '詳';
    }
  };

  // プロセスノードのレンダリング
  const renderProcessNode = (process: any, depth: number = 0) => {
    const hasChildren = process.children && process.children.length > 0;
    const isExpanded = expandedNodes.has(process.id);
    const isSelected = selectedId === process.id;

    return (
      <div key={process.id} className="select-none">
        <div
          className={`
            flex items-center gap-2 p-2 rounded-lg border transition-all
            ${isSelected ? 'bg-primary-50 border-primary-300 shadow-sm' : 'border-gray-200 hover:bg-gray-50'}
            ${depth > 0 ? `ml-${Math.min(depth * 6, 24)}` : ''}
          `}
          style={{ marginLeft: depth > 0 ? `${depth * 1.5}rem` : '0' }}
        >
          {/* 展開/折りたたみボタン */}
          <button
            onClick={() => hasChildren && toggleNode(process.id)}
            className={`flex-shrink-0 p-1 rounded hover:bg-gray-200 transition-colors ${!hasChildren && 'invisible'}`}
          >
            {hasChildren && (
              isExpanded ? (
                <ChevronDownIcon className="w-4 h-4 text-gray-600" />
              ) : (
                <ChevronRightIcon className="w-4 h-4 text-gray-600" />
              )
            )}
          </button>

          {/* レベルバッジ */}
          <div className={`px-2 py-1 rounded text-xs font-medium border ${getLevelStyle(process.level)}`}>
            {getLevelLabel(process.level)}
          </div>

          {/* プロセス情報 */}
          <div
            className="flex-1 min-w-0 cursor-pointer"
            onClick={() => onSelect?.(process)}
          >
            <div className="flex items-center gap-2">
              <span className="font-medium truncate">{process.name}</span>
              {process.hasManual && (
                <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded">
                  マニュアル
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
              {process.department && (
                <span className="truncate">部署: {process.department}</span>
              )}
              {process.assignee && (
                <span className="truncate">担当: {process.assignee}</span>
              )}
              {process.documentType && (
                <span className="truncate">帳票: {process.documentType}</span>
              )}
            </div>
          </div>

          {/* アクションボタン */}
          {showActions && (
            <div className="flex items-center gap-1 flex-shrink-0">
              {onCreate && process.level !== 'detail' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const nextLevel: ProcessLevel = 
                      process.level === 'large' ? 'medium' :
                      process.level === 'medium' ? 'small' : 'detail';
                    onCreate(process.id, nextLevel);
                  }}
                  className="p-1.5 rounded hover:bg-green-100 text-green-600 transition-colors"
                  title="子工程を追加"
                >
                  <PlusIcon className="w-4 h-4" />
                </button>
              )}
              {onEdit && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(process);
                  }}
                  className="p-1.5 rounded hover:bg-blue-100 text-blue-600 transition-colors"
                  title="編集"
                >
                  <PencilIcon className="w-4 h-4" />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(process);
                  }}
                  className="p-1.5 rounded hover:bg-red-100 text-red-600 transition-colors"
                  title="削除"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* 子要素を再帰的にレンダリング */}
        {hasChildren && isExpanded && (
          <div className="mt-1 space-y-1">
            {process.children.map((child: any) => renderProcessNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="h-full">
      <CardBody className="flex flex-col h-full p-4 space-y-4">
        {/* ヘッダーとフィルター */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">工程一覧</h3>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="light" onPress={expandAll}>
                全て展開
              </Button>
              <Button size="sm" variant="light" onPress={collapseAll}>
                全て折りたたむ
              </Button>
              {onCreate && (
                <Button 
                  size="sm" 
                  color="primary" 
                  startContent={<PlusIcon className="w-4 h-4" />}
                  onPress={() => onCreate(undefined, 'large')}
                >
                  大工程追加
                </Button>
              )}
            </div>
          </div>

          {/* 検索バー */}
          <Input
            placeholder="工程を検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            startContent={<MagnifyingGlassIcon className="w-4 h-4 text-gray-400" />}
            size="sm"
            classNames={{
              inputWrapper: 'h-10',
            }}
          />

          {/* レベルフィルター */}
          <Select
            label="レベルフィルター"
            placeholder="全てのレベル"
            selectedKeys={[filterLevel]}
            onChange={(e) => setFilterLevel(e.target.value as ProcessLevel | 'all')}
            size="sm"
            classNames={{
              trigger: 'h-10',
            }}
          >
            <SelectItem key="all">全てのレベル</SelectItem>
            <SelectItem key="large">大工程</SelectItem>
            <SelectItem key="medium">中工程</SelectItem>
            <SelectItem key="small">小工程</SelectItem>
            <SelectItem key="detail">詳細工程</SelectItem>
          </Select>
        </div>

        {/* 工程ツリー */}
        <div className="flex-1 overflow-y-auto space-y-1">
          {filteredTree.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <p className="text-sm">
                {searchQuery || filterLevel !== 'all' 
                  ? '該当する工程がありません' 
                  : '工程がまだ登録されていません'}
              </p>
            </div>
          ) : (
            filteredTree.map(process => renderProcessNode(process, 0))
          )}
        </div>

        {/* 統計情報 */}
        <div className="pt-3 border-t border-gray-200">
          <div className="grid grid-cols-4 gap-2 text-center text-xs">
            <div>
              <div className="font-semibold text-primary">{processes.filter(p => p.level === 'large').length}</div>
              <div className="text-gray-500">大工程</div>
            </div>
            <div>
              <div className="font-semibold text-secondary">{processes.filter(p => p.level === 'medium').length}</div>
              <div className="text-gray-500">中工程</div>
            </div>
            <div>
              <div className="font-semibold text-success">{processes.filter(p => p.level === 'small').length}</div>
              <div className="text-gray-500">小工程</div>
            </div>
            <div>
              <div className="font-semibold text-warning">{processes.filter(p => p.level === 'detail').length}</div>
              <div className="text-gray-500">詳細工程</div>
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
});
