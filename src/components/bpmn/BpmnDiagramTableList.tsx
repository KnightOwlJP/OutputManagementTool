'use client';

import React, { useState } from 'react';
import { Card, CardBody, Button, Chip } from '@heroui/react';
import {
  PlusIcon,
  DocumentChartBarIcon,
  TrashIcon,
  PencilIcon,
} from '@heroicons/react/24/outline';
import { BpmnDiagramTable, ProcessLevel } from '@/types/project.types';
import { useToast } from '@/contexts/ToastContext';

interface BpmnDiagramTableListProps {
  projectId: string;
  bpmnDiagramTables: BpmnDiagramTable[];
  onCreateTable: (level: ProcessLevel) => void;
  onSelectTable: (tableId: string) => void;
  onDeleteTable: (tableId: string) => void;
  onEditTable: (table: BpmnDiagramTable) => void;
}

const levelNames: Record<ProcessLevel, string> = {
  large: '大工程フロー',
  medium: '中工程フロー',
  small: '小工程フロー',
  detail: '詳細フロー',
};

const levelColors: Record<ProcessLevel, 'primary' | 'success' | 'warning' | 'secondary'> = {
  large: 'primary',
  medium: 'success',
  small: 'warning',
  detail: 'secondary',
};

export function BpmnDiagramTableList({
  projectId,
  bpmnDiagramTables,
  onCreateTable,
  onSelectTable,
  onDeleteTable,
  onEditTable,
}: BpmnDiagramTableListProps) {
  const { showToast } = useToast();
  const [selectedLevel, setSelectedLevel] = useState<ProcessLevel>('large');

  const handleDelete = async (table: BpmnDiagramTable) => {
    if (!confirm(`「${table.name}」を削除しますか？関連するフロー図もすべて削除されます。`)) {
      return;
    }
    onDeleteTable(table.id);
  };

  // レベル別にグループ化
  const tablesByLevel = bpmnDiagramTables.reduce((acc, table) => {
    if (!acc[table.level]) {
      acc[table.level] = [];
    }
    acc[table.level].push(table);
    return acc;
  }, {} as Record<ProcessLevel, BpmnDiagramTable[]>);

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">フロー図グループ一覧</h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            プロジェクトのフロー図グループを作成・管理します
          </p>
        </div>
        <div className="flex gap-2">
          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value as ProcessLevel)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="large">大工程フロー</option>
            <option value="medium">中工程フロー</option>
            <option value="small">小工程フロー</option>
            <option value="detail">詳細フロー</option>
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

      {/* フロー図グループリスト */}
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
                    <DocumentChartBarIcon className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {levelNames[level]}がありません
                    </p>
                    <Button
                      size="sm"
                      color="primary"
                      variant="flat"
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
                    <CardBody className="gap-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {table.name}
                          </h3>
                          {table.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {table.description}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            onPress={() => onEditTable(table)}
                          >
                            <PencilIcon className="w-4 h-4" />
                          </Button>
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            color="danger"
                            onPress={() => handleDelete(table)}
                          >
                            <TrashIcon className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-2">
                        {table.processTableId && (
                          <span className="flex items-center gap-1">
                            📋 工程表と連携
                          </span>
                        )}
                        <span>順序: {table.displayOrder}</span>
                        <span>
                          {new Date(table.createdAt).toLocaleDateString('ja-JP')}
                        </span>
                      </div>
                    </CardBody>
                  </Card>
                ))
              )}
            </div>
          );
        })}
      </div>

      {bpmnDiagramTables.length === 0 && (
        <Card className="border-2 border-dashed border-gray-300 dark:border-gray-700">
          <CardBody className="text-center py-12">
            <DocumentChartBarIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              フロー図グループがありません
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              まずはフロー図グループを作成して、フロー図を管理しましょう
            </p>
            <Button
              color="primary"
              startContent={<PlusIcon className="w-5 h-5" />}
              onPress={() => onCreateTable('large')}
            >
              最初のフロー図グループを作成
            </Button>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
