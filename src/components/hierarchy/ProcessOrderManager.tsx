'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button, Card, CardBody, Input } from '@heroui/react';
import { Process } from '@/types/project.types';

interface ProcessOrderManagerProps {
  processes: Process[];
  onReorder: (processId: string, newOrder: number) => void;
  onClose: () => void;
}

export function ProcessOrderManager({
  processes,
  onReorder,
  onClose,
}: ProcessOrderManagerProps) {
  const [sortedProcesses, setSortedProcesses] = useState<Process[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    // 初期表示順でソート
    const sorted = [...processes].sort((a, b) => {
      // 親IDでグループ化
      if (a.parentId !== b.parentId) {
        return (a.parentId || '').localeCompare(b.parentId || '');
      }
      // 同じ親の中ではdisplayOrderでソート
      return (a.displayOrder || 0) - (b.displayOrder || 0);
    });
    setSortedProcesses(sorted);
  }, [processes]);

  /**
   * 並び順を変更
   */
  const handleOrderChange = (processId: string, newOrder: number) => {
    const updated = sortedProcesses.map((p) =>
      p.id === processId ? { ...p, displayOrder: newOrder } : p
    );

    // 同じ親を持つ工程を再ソート
    const process = updated.find((p) => p.id === processId);
    if (process) {
      const siblings = updated.filter((p) => p.parentId === process.parentId);
      siblings.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

      // 順番を正規化（1, 2, 3...）
      siblings.forEach((sibling, index) => {
        const idx = updated.findIndex((p) => p.id === sibling.id);
        if (idx !== -1) {
          updated[idx].displayOrder = index + 1;
        }
      });
    }

    setSortedProcesses(updated);
    setHasChanges(true);
  };

  /**
   * 上に移動
   */
  const moveUp = (process: Process) => {
    const siblings = sortedProcesses.filter(
      (p) => p.parentId === process.parentId
    );
    const currentIndex = siblings.findIndex((p) => p.id === process.id);

    if (currentIndex > 0) {
      const newOrder = siblings[currentIndex - 1].displayOrder || 0;
      handleOrderChange(process.id, newOrder - 0.5);
    }
  };

  /**
   * 下に移動
   */
  const moveDown = (process: Process) => {
    const siblings = sortedProcesses.filter(
      (p) => p.parentId === process.parentId
    );
    const currentIndex = siblings.findIndex((p) => p.id === process.id);

    if (currentIndex < siblings.length - 1) {
      const newOrder = siblings[currentIndex + 1].displayOrder || 0;
      handleOrderChange(process.id, newOrder + 0.5);
    }
  };

  /**
   * 変更を保存
   */
  const handleSave = () => {
    sortedProcesses.forEach((process) => {
      onReorder(process.id, process.displayOrder || 0);
    });
    onClose();
  };

  /**
   * 親ごとにグループ化
   */
  const groupedProcesses = sortedProcesses.reduce((acc, process) => {
    const parentId = process.parentId || 'root';
    if (!acc[parentId]) {
      acc[parentId] = [];
    }
    acc[parentId].push(process);
    return acc;
  }, {} as Record<string, Process[]>);

  return (
    <Card className="w-full">
      <CardBody className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold">表示順の変更</h3>
          <div className="flex gap-2">
            <Button variant="flat" onPress={onClose}>
              キャンセル
            </Button>
            <Button
              color="primary"
              onPress={handleSave}
              isDisabled={!hasChanges}
            >
              保存
            </Button>
          </div>
        </div>

        <div className="space-y-6 max-h-[600px] overflow-y-auto">
          {Object.entries(groupedProcesses).map(([parentId, group]) => (
            <div key={parentId} className="space-y-2">
              <h4 className="font-semibold text-sm text-gray-600">
                {parentId === 'root'
                  ? 'ルート工程'
                  : processes.find((p) => p.id === parentId)?.name || '不明'}
              </h4>
              {group.map((process, index) => (
                <div
                  key={process.id}
                  className="flex items-center gap-2 p-3 bg-gray-50 rounded"
                >
                  <div className="flex flex-col gap-1">
                    <Button
                      size="sm"
                      variant="flat"
                      onPress={() => moveUp(process)}
                      isDisabled={index === 0}
                    >
                      ↑
                    </Button>
                    <Button
                      size="sm"
                      variant="flat"
                      onPress={() => moveDown(process)}
                      isDisabled={index === group.length - 1}
                    >
                      ↓
                    </Button>
                  </div>

                  <div className="flex-1">
                    <p className="font-semibold">{process.name}</p>
                    <p className="text-sm text-gray-600">
                      レベル: {process.level} | 表示順: {process.displayOrder}
                    </p>
                  </div>

                  <Input
                    type="number"
                    value={String(process.displayOrder || 0)}
                    onValueChange={(value) =>
                      handleOrderChange(process.id, parseInt(value) || 0)
                    }
                    className="w-24"
                    size="sm"
                  />
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm font-semibold mb-2">💡 使い方</p>
          <ul className="text-xs space-y-1 text-gray-600">
            <li>• ↑/↓ ボタンで前後の工程と入れ替えます</li>
            <li>• 数値入力で直接表示順を指定できます</li>
            <li>• 同じ親を持つ工程内での並び順が変更されます</li>
          </ul>
        </div>
      </CardBody>
    </Card>
  );
}
