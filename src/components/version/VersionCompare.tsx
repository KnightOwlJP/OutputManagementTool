'use client';

import React from 'react';
import { Card, CardBody, CardHeader } from '@heroui/react';
import { Version } from '@/types/project.types';

interface VersionCompareProps {
  version1: Version;
  version2: Version;
}

interface DiffSummary {
  processesAdded: number;
  processesRemoved: number;
  processesModified: number;
  bpmnAdded: number;
  bpmnRemoved: number;
}

export function VersionCompare({ version1, version2 }: VersionCompareProps) {
  /**
   * 差分サマリーを計算
   */
  const calculateDiff = (): DiffSummary => {
    const v1Processes = new Set(version1.snapshotData.processes.map((p: any) => p.id));
    const v2Processes = new Set(version2.snapshotData.processes.map((p: any) => p.id));
    const v1Bpmn = new Set(version1.snapshotData.bpmnDiagrams.map((b: any) => b.id));
    const v2Bpmn = new Set(version2.snapshotData.bpmnDiagrams.map((b: any) => b.id));

    const processesAdded = version2.snapshotData.processes.filter(
      (p: any) => !v1Processes.has(p.id)
    ).length;

    const processesRemoved = version1.snapshotData.processes.filter(
      (p: any) => !v2Processes.has(p.id)
    ).length;

    // 同じIDを持つ工程の内容が変更されているか確認
    const processesModified = version2.snapshotData.processes.filter((p2: any) => {
      if (!v1Processes.has(p2.id)) return false;
      const p1 = version1.snapshotData.processes.find((p: any) => p.id === p2.id);
      if (!p1) return false;
      
      return (
        p1.name !== p2.name ||
        p1.description !== p2.description ||
        p1.parentId !== p2.parentId ||
        p1.displayOrder !== p2.displayOrder
      );
    }).length;

    const bpmnAdded = version2.snapshotData.bpmnDiagrams.filter(
      (b: any) => !v1Bpmn.has(b.id)
    ).length;

    const bpmnRemoved = version1.snapshotData.bpmnDiagrams.filter(
      (b: any) => !v2Bpmn.has(b.id)
    ).length;

    return {
      processesAdded,
      processesRemoved,
      processesModified,
      bpmnAdded,
      bpmnRemoved,
    };
  };

  const diff = calculateDiff();
  const hasChanges =
    diff.processesAdded > 0 ||
    diff.processesRemoved > 0 ||
    diff.processesModified > 0 ||
    diff.bpmnAdded > 0 ||
    diff.bpmnRemoved > 0;

  /**
   * 日時フォーマット
   */
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  /**
   * 詳細な工程差分を取得
   */
  const getProcessChanges = () => {
    const v1ProcessMap = new Map(
      version1.snapshotData.processes.map((p: any) => [p.id, p])
    );
    const v2ProcessMap = new Map(
      version2.snapshotData.processes.map((p: any) => [p.id, p])
    );

    const added = version2.snapshotData.processes
      .filter((p: any) => !v1ProcessMap.has(p.id))
      .map((p: any) => ({
        id: p.id,
        name: p.name,
        level: p.level,
        type: 'added' as const,
      }));

    const removed = version1.snapshotData.processes
      .filter((p: any) => !v2ProcessMap.has(p.id))
      .map((p: any) => ({
        id: p.id,
        name: p.name,
        level: p.level,
        type: 'removed' as const,
      }));

    const modified = version2.snapshotData.processes
      .filter((p2: any) => {
        if (!v1ProcessMap.has(p2.id)) return false;
        const p1 = v1ProcessMap.get(p2.id);
        return (
          p1.name !== p2.name ||
          p1.description !== p2.description ||
          p1.parentId !== p2.parentId
        );
      })
      .map((p: any) => ({
        id: p.id,
        name: p.name,
        level: p.level,
        type: 'modified' as const,
      }));

    return { added, removed, modified };
  };

  const processChanges = getProcessChanges();

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <Card>
        <CardHeader>
          <h3 className="text-xl font-semibold">バージョン比較</h3>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* バージョン1 */}
            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
              <p className="text-xs text-gray-600 mb-1">古いバージョン</p>
              <h4 className="font-semibold text-lg mb-2">{version1.message}</h4>
              <p className="text-sm text-gray-600">
                {formatDate(version1.timestamp)}
              </p>
              {version1.tag && (
                <p className="text-sm text-gray-600 mt-1">
                  タグ: {version1.tag}
                </p>
              )}
            </div>

            {/* バージョン2 */}
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="text-xs text-gray-600 mb-1">新しいバージョン</p>
              <h4 className="font-semibold text-lg mb-2">{version2.message}</h4>
              <p className="text-sm text-gray-600">
                {formatDate(version2.timestamp)}
              </p>
              {version2.tag && (
                <p className="text-sm text-gray-600 mt-1">
                  タグ: {version2.tag}
                </p>
              )}
            </div>
          </div>
        </CardBody>
      </Card>

      {/* 変更サマリー */}
      <Card>
        <CardHeader>
          <h4 className="font-semibold">変更サマリー</h4>
        </CardHeader>
        <CardBody>
          {!hasChanges ? (
            <p className="text-gray-600">変更はありません</p>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {/* 工程の変更 */}
              <div className="space-y-2">
                <h5 className="font-semibold text-sm">工程データ</h5>
                <div className="space-y-1 text-sm">
                  {diff.processesAdded > 0 && (
                    <div className="flex items-center gap-2 text-green-700">
                      <span className="text-xl">+</span>
                      <span>{diff.processesAdded}件の工程が追加されました</span>
                    </div>
                  )}
                  {diff.processesRemoved > 0 && (
                    <div className="flex items-center gap-2 text-red-700">
                      <span className="text-xl">-</span>
                      <span>{diff.processesRemoved}件の工程が削除されました</span>
                    </div>
                  )}
                  {diff.processesModified > 0 && (
                    <div className="flex items-center gap-2 text-blue-700">
                      <span className="text-xl">~</span>
                      <span>{diff.processesModified}件の工程が変更されました</span>
                    </div>
                  )}
                  {diff.processesAdded === 0 &&
                    diff.processesRemoved === 0 &&
                    diff.processesModified === 0 && (
                      <p className="text-gray-600">変更なし</p>
                    )}
                </div>
              </div>

              {/* BPMNの変更 */}
              <div className="space-y-2">
                <h5 className="font-semibold text-sm">BPMNダイアグラム</h5>
                <div className="space-y-1 text-sm">
                  {diff.bpmnAdded > 0 && (
                    <div className="flex items-center gap-2 text-green-700">
                      <span className="text-xl">+</span>
                      <span>{diff.bpmnAdded}件のダイアグラムが追加されました</span>
                    </div>
                  )}
                  {diff.bpmnRemoved > 0 && (
                    <div className="flex items-center gap-2 text-red-700">
                      <span className="text-xl">-</span>
                      <span>{diff.bpmnRemoved}件のダイアグラムが削除されました</span>
                    </div>
                  )}
                  {diff.bpmnAdded === 0 && diff.bpmnRemoved === 0 && (
                    <p className="text-gray-600">変更なし</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {/* 詳細な工程変更 */}
      {(processChanges.added.length > 0 ||
        processChanges.removed.length > 0 ||
        processChanges.modified.length > 0) && (
        <Card>
          <CardHeader>
            <h4 className="font-semibold">工程の詳細な変更</h4>
          </CardHeader>
          <CardBody className="space-y-4">
            {/* 追加された工程 */}
            {processChanges.added.length > 0 && (
              <div>
                <h5 className="font-semibold text-sm text-green-700 mb-2">
                  追加された工程 ({processChanges.added.length}件)
                </h5>
                <div className="space-y-1">
                  {processChanges.added.slice(0, 10).map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center gap-2 text-sm bg-green-50 p-2 rounded"
                    >
                      <span className="text-green-700">+</span>
                      <span className="font-semibold">{p.name}</span>
                      <span className="text-xs text-gray-600">({p.level})</span>
                    </div>
                  ))}
                  {processChanges.added.length > 10 && (
                    <p className="text-xs text-gray-600 mt-2">
                      ...他 {processChanges.added.length - 10}件
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* 削除された工程 */}
            {processChanges.removed.length > 0 && (
              <div>
                <h5 className="font-semibold text-sm text-red-700 mb-2">
                  削除された工程 ({processChanges.removed.length}件)
                </h5>
                <div className="space-y-1">
                  {processChanges.removed.slice(0, 10).map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center gap-2 text-sm bg-red-50 p-2 rounded"
                    >
                      <span className="text-red-700">-</span>
                      <span className="font-semibold line-through">{p.name}</span>
                      <span className="text-xs text-gray-600">({p.level})</span>
                    </div>
                  ))}
                  {processChanges.removed.length > 10 && (
                    <p className="text-xs text-gray-600 mt-2">
                      ...他 {processChanges.removed.length - 10}件
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* 変更された工程 */}
            {processChanges.modified.length > 0 && (
              <div>
                <h5 className="font-semibold text-sm text-blue-700 mb-2">
                  変更された工程 ({processChanges.modified.length}件)
                </h5>
                <div className="space-y-1">
                  {processChanges.modified.slice(0, 10).map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center gap-2 text-sm bg-blue-50 p-2 rounded"
                    >
                      <span className="text-blue-700">~</span>
                      <span className="font-semibold">{p.name}</span>
                      <span className="text-xs text-gray-600">({p.level})</span>
                    </div>
                  ))}
                  {processChanges.modified.length > 10 && (
                    <p className="text-xs text-gray-600 mt-2">
                      ...他 {processChanges.modified.length - 10}件
                    </p>
                  )}
                </div>
              </div>
            )}
          </CardBody>
        </Card>
      )}
    </div>
  );
}
