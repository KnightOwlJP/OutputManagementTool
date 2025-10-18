'use client';

import React, { useMemo, useState } from 'react';
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Input,
  Select,
  SelectItem,
  Tooltip,
} from '@heroui/react';
import {
  PencilIcon,
  TrashIcon,
  PlusCircleIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EllipsisVerticalIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { Process, ProcessLevel } from '@/types/project.types';

interface ProcessTableProps {
  processes: Process[];
  onProcessEdit?: (process: Process) => void;
  onProcessDelete?: (processId: string) => void;
  onProcessCreate?: (parentId: string | null, level?: ProcessLevel) => void;
  onProcessSelect?: (process: Process) => void;
  isLoading?: boolean;
}

export function ProcessTable({
  processes,
  onProcessEdit,
  onProcessDelete,
  onProcessCreate,
  onProcessSelect,
  isLoading = false,
}: ProcessTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<ProcessLevel | 'all'>('all');
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Process | null;
    direction: 'asc' | 'desc';
  }>({ key: null, direction: 'asc' });

  // レベル名を取得
  const getLevelLabel = (level: ProcessLevel): string => {
    const labels: Record<ProcessLevel, string> = {
      large: '大工程',
      medium: '中工程',
      small: '小工程',
      detail: '詳細工程',
    };
    return labels[level];
  };

  // レベル色を取得
  const getLevelColor = (level: ProcessLevel) => {
    const colors: Record<ProcessLevel, 'primary' | 'success' | 'warning' | 'secondary'> = {
      large: 'primary',
      medium: 'success',
      small: 'warning',
      detail: 'secondary',
    };
    return colors[level];
  };

  // ステータス色を取得
  const getStatusColor = (status?: string) => {
    if (!status) return 'default';
    switch (status.toLowerCase()) {
      case '完了':
      case 'completed':
        return 'success';
      case '進行中':
      case 'in_progress':
        return 'primary';
      case '未着手':
      case 'not_started':
        return 'default';
      case '保留':
      case 'on_hold':
        return 'warning';
      case '中止':
      case 'cancelled':
        return 'danger';
      default:
        return 'default';
    }
  };

  // ステータスアイコンを取得
  const getStatusIcon = (status?: string) => {
    if (!status) return null;
    switch (status.toLowerCase()) {
      case '完了':
      case 'completed':
        return <CheckCircleIcon className="w-4 h-4" />;
      case '進行中':
      case 'in_progress':
        return <ClockIcon className="w-4 h-4" />;
      case '中止':
      case 'cancelled':
        return <XCircleIcon className="w-4 h-4" />;
      default:
        return null;
    }
  };

  // 日付フォーマット
  const formatDate = (date?: Date | string): string => {
    if (!date) return '-';
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  // フィルタリングとソート
  const filteredAndSortedProcesses = useMemo(() => {
    let filtered = [...processes];

    // レベルフィルター
    if (levelFilter !== 'all') {
      filtered = filtered.filter((p) => p.level === levelFilter);
    }

    // 検索フィルター
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.description?.toLowerCase().includes(query) ||
          p.department?.toLowerCase().includes(query) ||
          p.assignee?.toLowerCase().includes(query) ||
          p.documentType?.toLowerCase().includes(query)
      );
    }

    // ソート
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        const aValue = a[sortConfig.key!];
        const bValue = b[sortConfig.key!];

        if (aValue === undefined || aValue === null) return 1;
        if (bValue === undefined || bValue === null) return -1;

        let comparison = 0;
        if (aValue < bValue) {
          comparison = -1;
        } else if (aValue > bValue) {
          comparison = 1;
        }

        return sortConfig.direction === 'asc' ? comparison : -comparison;
      });
    }

    return filtered;
  }, [processes, levelFilter, searchQuery, sortConfig]);

  // ソートハンドラ
  const handleSort = (key: keyof Process) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  // ソートアイコン
  const SortIcon = ({ columnKey }: { columnKey: keyof Process }) => {
    if (sortConfig.key !== columnKey) return null;
    return sortConfig.direction === 'asc' ? (
      <ArrowUpIcon className="w-4 h-4 inline ml-1" />
    ) : (
      <ArrowDownIcon className="w-4 h-4 inline ml-1" />
    );
  };

  // 親工程名を取得
  const getParentName = (parentId?: string): string => {
    if (!parentId) return '-';
    const parent = processes.find((p) => p.id === parentId);
    return parent ? parent.name : '-';
  };

  return (
    <div className="space-y-4">
      {/* ツールバー */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* 検索 */}
        <Input
          placeholder="工程名、説明、部署、担当者で検索..."
          value={searchQuery}
          onValueChange={setSearchQuery}
          className="flex-1"
          startContent={<MagnifyingGlassIcon className="w-4 h-4 text-gray-400" />}
          isClearable
          size="sm"
        />

        {/* レベルフィルター */}
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

        {/* 工程追加ボタン */}
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
      </div>

      {/* テーブル */}
      <div className="border rounded-lg overflow-hidden">
        <Table
          aria-label="工程表"
          isStriped
          removeWrapper
          className="min-w-full"
          isHeaderSticky
        >
          <TableHeader>
            <TableColumn
              key="displayOrder"
              onClick={() => handleSort('displayOrder')}
              className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              順序 <SortIcon columnKey="displayOrder" />
            </TableColumn>
            <TableColumn
              key="name"
              onClick={() => handleSort('name')}
              className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              工程名 <SortIcon columnKey="name" />
            </TableColumn>
            <TableColumn
              key="level"
              onClick={() => handleSort('level')}
              className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              レベル <SortIcon columnKey="level" />
            </TableColumn>
            <TableColumn key="parent">親工程</TableColumn>
            <TableColumn key="department">部署</TableColumn>
            <TableColumn key="assignee">担当者</TableColumn>
            <TableColumn key="documentType">帳票種類</TableColumn>
            <TableColumn
              key="startDate"
              onClick={() => handleSort('startDate')}
              className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              開始日 <SortIcon columnKey="startDate" />
            </TableColumn>
            <TableColumn
              key="endDate"
              onClick={() => handleSort('endDate')}
              className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              終了日 <SortIcon columnKey="endDate" />
            </TableColumn>
            <TableColumn key="status">ステータス</TableColumn>
            <TableColumn key="actions" align="center">
              アクション
            </TableColumn>
          </TableHeader>
          <TableBody
            items={filteredAndSortedProcesses}
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
                className="hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer transition-colors"
                onClick={() => onProcessSelect?.(process)}
              >
                <TableCell>
                  <span className="text-sm font-mono text-gray-600">
                    {process.displayOrder}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium text-sm">{process.name}</span>
                    {process.description && (
                      <span className="text-xs text-gray-500 line-clamp-1">
                        {process.description}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Chip size="sm" color={getLevelColor(process.level)} variant="flat">
                    {getLevelLabel(process.level)}
                  </Chip>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-gray-600">
                    {getParentName(process.parentId)}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-sm">{process.department || '-'}</span>
                </TableCell>
                <TableCell>
                  <span className="text-sm">{process.assignee || '-'}</span>
                </TableCell>
                <TableCell>
                  <span className="text-sm">{process.documentType || '-'}</span>
                </TableCell>
                <TableCell>
                  <span className="text-sm">{formatDate(process.startDate)}</span>
                </TableCell>
                <TableCell>
                  <span className="text-sm">{formatDate(process.endDate)}</span>
                </TableCell>
                <TableCell>
                  {process.status ? (
                    <Chip
                      size="sm"
                      color={getStatusColor(process.status) as any}
                      variant="flat"
                      startContent={getStatusIcon(process.status)}
                    >
                      {process.status}
                    </Chip>
                  ) : (
                    <span className="text-sm text-gray-400">-</span>
                  )}
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-center gap-1">
                    {onProcessEdit && (
                      <Tooltip content="編集">
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          color="default"
                          onPress={() => onProcessEdit(process)}
                        >
                          <PencilIcon className="w-4 h-4" />
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
                          onPress={() => onProcessDelete(process.id)}
                        >
                          <TrashIcon className="w-4 h-4" />
                        </Button>
                      </Tooltip>
                    )}
                    {onProcessCreate && (
                      <Tooltip content="子工程を追加">
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          color="primary"
                          onPress={() => onProcessCreate(process.id)}
                        >
                          <PlusCircleIcon className="w-4 h-4" />
                        </Button>
                      </Tooltip>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* 統計情報 */}
      <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
        <div>
          全{processes.length}件中 {filteredAndSortedProcesses.length}件を表示
        </div>
        <div className="flex gap-4">
          <span>大工程: {processes.filter((p) => p.level === 'large').length}</span>
          <span>中工程: {processes.filter((p) => p.level === 'medium').length}</span>
          <span>小工程: {processes.filter((p) => p.level === 'small').length}</span>
          <span>詳細工程: {processes.filter((p) => p.level === 'detail').length}</span>
        </div>
      </div>
    </div>
  );
}
