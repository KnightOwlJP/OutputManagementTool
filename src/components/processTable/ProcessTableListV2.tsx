/**
 * ProcessTable一覧コンポーネント（V2対応）
 * プロジェクト詳細ページ内でProcessTableのリストを表示
 */

'use client';

import { Card, CardBody, CardHeader, Button, Chip } from '@heroui/react';
import { PlusIcon, TableCellsIcon, TrashIcon, PencilIcon } from '@heroicons/react/24/outline';
import { ProcessTable } from '@/types/models';

interface ProcessTableListProps {
  projectId: string;
  processTables: ProcessTable[];
  onCreateTable: () => void;
  onEditTable: (table: ProcessTable) => void;
  onDeleteTable: (table: ProcessTable) => void;
  onViewTable: (table: ProcessTable) => void;
}

export function ProcessTableListV2({
  projectId,
  processTables,
  onCreateTable,
  onEditTable,
  onDeleteTable,
  onViewTable,
}: ProcessTableListProps) {
  const getLevelLabel = (level: string) => {
    const labels = {
      large: '大工程',
      medium: '中工程',
      small: '小工程',
      detail: '詳細',
    };
    return labels[level as keyof typeof labels] || level;
  };

  const getLevelColor = (level: string) => {
    const colors = {
      large: 'primary',
      medium: 'secondary',
      small: 'success',
      detail: 'warning',
    };
    return colors[level as keyof typeof colors] || 'default';
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <TableCellsIcon className="w-6 h-6 text-primary" />
          <h3 className="text-xl font-semibold">工程表</h3>
          <Chip size="sm" variant="flat">
            {processTables.length}件
          </Chip>
        </div>
        <Button
          color="primary"
          startContent={<PlusIcon className="w-5 h-5" />}
          onPress={onCreateTable}
        >
          新規作成
        </Button>
      </CardHeader>
      <CardBody className="gap-4">
        {processTables.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <TableCellsIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>工程表がありません</p>
            <p className="text-sm mt-2">「新規作成」ボタンから工程表を作成してください</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {processTables.map((table) => (
              <Card
                key={table.id}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                isPressable
                onPress={() => onViewTable(table)}
              >
                <CardBody className="gap-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold mb-2">{table.name}</h4>
                      <Chip
                        size="sm"
                        color={getLevelColor(table.level) as any}
                        variant="flat"
                      >
                        {getLevelLabel(table.level)}
                      </Chip>
                    </div>
                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
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
                        onPress={() => onDeleteTable(table)}
                      >
                        <TrashIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  {table.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {table.description}
                    </p>
                  )}
                  <div className="text-xs text-gray-500">
                    作成日: {new Date(table.createdAt).toLocaleDateString('ja-JP')}
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
