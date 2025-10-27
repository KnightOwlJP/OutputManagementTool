'use client';

import React, { useState } from 'react';
import { Card, CardBody, Button, Chip } from '@heroui/react';
import {
  PlusIcon,
  BookOpenIcon,
  TrashIcon,
  PencilIcon,
} from '@heroicons/react/24/outline';
import { Manual, ProcessLevel } from '@/types/models';
import { useToast } from '@/contexts/ToastContext';

interface ManualTableListProps {
  projectId: string;
  manualTables: Manual[];
  onCreateTable: (level: ProcessLevel) => void;
  onSelectTable: (tableId: string) => void;
  onDeleteTable: (tableId: string) => void;
  onEditTable: (table: Manual) => void;
}

const levelNames: Record<ProcessLevel, string> = {
  large: '大工程マニュアル',
  medium: '中工程マニュアル',
  small: '小工程マニュアル',
  detail: '詳細マニュアル',
};

const levelColors: Record<ProcessLevel, 'primary' | 'success' | 'warning' | 'secondary'> = {
  large: 'primary',
  medium: 'success',
  small: 'warning',
  detail: 'secondary',
};

export function ManualTableList({
  projectId,
  manualTables,
  onCreateTable,
  onSelectTable,
  onDeleteTable,
  onEditTable,
}: ManualTableListProps) {
  const { showToast } = useToast();
  const [selectedLevel, setSelectedLevel] = useState<ProcessLevel>('detail');

  const handleDelete = async (table: Manual) => {
    if (!confirm(`「${table.name}」を削除しますか？関連するマニュアルもすべて削除されます。`)) {
      return;
    }
    onDeleteTable(table.id);
  };

  // レベル別にグループ化
  const tablesByLevel = manualTables.reduce((acc, table) => {
    if (!acc[table.level]) {
      acc[table.level] = [];
    }
    acc[table.level].push(table);
    return acc;
  }, {} as Record<ProcessLevel, Manual[]>);

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">マニュアルグループ一覧</h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            プロジェクトのマニュアルグループを作成・管理します
          </p>
        </div>
        <div className="flex gap-2">
          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value as ProcessLevel)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="large">大工程マニュアル</option>
            <option value="medium">中工程マニュアル</option>
            <option value="small">小工程マニュアル</option>
            <option value="detail">詳細マニュアル</option>
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

      {/* マニュアルグループリスト */}
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
                    <BookOpenIcon className="w-12 h-12 mx-auto text-gray-400 mb-2" />
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

      {manualTables.length === 0 && (
        <Card className="border-2 border-dashed border-gray-300 dark:border-gray-700">
          <CardBody className="text-center py-12">
            <BookOpenIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              マニュアルグループがありません
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              まずはマニュアルグループを作成して、マニュアルを管理しましょう
            </p>
            <Button
              color="primary"
              startContent={<PlusIcon className="w-5 h-5" />}
              onPress={() => onCreateTable('detail')}
            >
              最初のマニュアルグループを作成
            </Button>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
