'use client';

import React, { useState } from 'react';
import { Card, CardBody, Button, Chip } from '@heroui/react';
import {
  PlusIcon,
  DocumentTextIcon,
  TableCellsIcon,
  TrashIcon,
  PencilIcon,
} from '@heroicons/react/24/outline';
import { ProcessTable, ProcessLevel } from '@/types/models';
import { useToast } from '@/contexts/ToastContext';

interface ProcessTableListProps {
  projectId: string;
  processTables: ProcessTable[];
  onCreateTable: (level: ProcessLevel) => void;
  onSelectTable: (tableId: string) => void;
  onDeleteTable: (tableId: string) => void;
  onEditTable: (table: ProcessTable) => void;
}

const levelNames: Record<ProcessLevel, string> = {
  large: '大工程表',
  medium: '中工程表',
  small: '小工程表',
  detail: '詳細工程表',
};

const levelColors: Record<ProcessLevel, 'primary' | 'success' | 'warning' | 'secondary'> = {
  large: 'primary',
  medium: 'success',
  small: 'warning',
  detail: 'secondary',
};

export function ProcessTableList({
  projectId,
  processTables,
  onCreateTable,
  onSelectTable,
  onDeleteTable,
  onEditTable,
}: ProcessTableListProps) {
  const { showToast } = useToast();
  const [selectedLevel, setSelectedLevel] = useState<ProcessLevel>('large');

  const handleDelete = async (table: ProcessTable) => {
    if (!confirm(`「${table.name}」を削除しますか？関連する工程、フロー、マニュアルもすべて削除されます。`)) {
      return;
    }
    onDeleteTable(table.id);
  };

  // レベル別にグループ化
  const tablesByLevel = processTables.reduce((acc, table) => {
    if (!acc[table.level]) {
      acc[table.level] = [];
    }
    acc[table.level].push(table);
    return acc;
  }, {} as Record<ProcessLevel, ProcessTable[]>);

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">工程表一覧</h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            プロジェクトの工程表を作成・管理します
          </p>
        </div>
        <div className="flex gap-2">
          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value as ProcessLevel)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="large">大工程表</option>
            <option value="medium">中工程表</option>
            <option value="small">小工程表</option>
            <option value="detail">詳細工程表</option>
          </select>
          <Button
            color="primary"
            startContent={<PlusIcon className="w-5 h-5" />}
            onPress={() => onCreateTable(selectedLevel)}
          >
            {levelNames[selectedLevel]}を作成
          </Button>
        </div>
      </div>

      {/* 工程表リスト */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {(['large', 'medium', 'small', 'detail'] as ProcessLevel[]).map((level) => {
          const tables = tablesByLevel[level] || [];
          
          return (
            <div key={level} className="space-y-3">
              <div className="flex items-center gap-2">
                <Chip color={levelColors[level]} variant="flat" size="sm">
                  {levelNames[level]}
                </Chip>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {tables.length}件
                </span>
              </div>

              {tables.length === 0 ? (
                <Card className="border-2 border-dashed border-gray-300 dark:border-gray-700">
                  <CardBody className="text-center py-8">
                    <DocumentTextIcon className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {levelNames[level]}がありません
                    </p>
                    <Button
                      size="sm"
                      variant="flat"
                      color={levelColors[level]}
                      className="mt-3"
                      startContent={<PlusIcon className="w-4 h-4" />}
                      onPress={() => onCreateTable(level)}
                    >
                      作成
                    </Button>
                  </CardBody>
                </Card>
              ) : (
                tables.map((table) => (
                  <Card
                    key={table.id}
                    isPressable
                    onPress={() => onSelectTable(table.id)}
                    className="hover:shadow-lg transition-shadow"
                  >
                    <CardBody className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <TableCellsIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
                            <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                              {table.name}
                            </h3>
                          </div>
                          {table.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                              {table.description}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-1 ml-2">
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            onPress={() => onEditTable(table)}
                            onClick={(e) => e.stopPropagation()}
                            title="編集"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </Button>
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            color="danger"
                            onPress={() => handleDelete(table)}
                            onClick={(e) => e.stopPropagation()}
                            title="削除"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                        <span>作成: {new Date(table.createdAt).toLocaleDateString('ja-JP')}</span>
                        <span>順序: {table.displayOrder}</span>
                      </div>
                    </CardBody>
                  </Card>
                ))
              )}
            </div>
          );
        })}
      </div>

      {processTables.length === 0 && (
        <Card className="border-2 border-dashed border-gray-300 dark:border-gray-700">
          <CardBody className="text-center py-12">
            <DocumentTextIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              工程表がありません
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              最初の工程表を作成して、プロジェクトの工程管理を始めましょう
            </p>
            <div className="flex gap-2 justify-center flex-wrap">
              <Button
                color="primary"
                startContent={<PlusIcon className="w-5 h-5" />}
                onPress={() => onCreateTable('large')}
              >
                大工程表を作成
              </Button>
              <Button
                color="success"
                variant="flat"
                startContent={<PlusIcon className="w-5 h-5" />}
                onPress={() => onCreateTable('medium')}
              >
                中工程表を作成
              </Button>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
