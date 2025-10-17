'use client';

import React, { useState } from 'react';
import { Card, CardBody, CardHeader, Button, Chip } from '@heroui/react';
import { Version } from '@/types/project.types';

interface VersionHistoryProps {
  versions: Version[];
  onRestore?: (versionId: string) => void;
  onDelete?: (versionId: string) => void;
  onCompare?: (versionIds: string[]) => void;
  isLoading?: boolean;
}

export function VersionHistory({
  versions,
  onRestore,
  onDelete,
  onCompare,
  isLoading = false,
}: VersionHistoryProps) {
  const [selectedVersions, setSelectedVersions] = useState<Set<string>>(new Set());
  const [expandedVersionId, setExpandedVersionId] = useState<string | null>(null);

  /**
   * バージョン選択トグル
   */
  const toggleVersionSelection = (versionId: string) => {
    const newSelection = new Set(selectedVersions);
    if (newSelection.has(versionId)) {
      newSelection.delete(versionId);
    } else {
      // 最大2つまで選択可能
      if (newSelection.size >= 2) {
        newSelection.clear();
      }
      newSelection.add(versionId);
    }
    setSelectedVersions(newSelection);
  };

  /**
   * 詳細表示トグル
   */
  const toggleExpanded = (versionId: string) => {
    setExpandedVersionId(expandedVersionId === versionId ? null : versionId);
  };

  /**
   * 復元確認
   */
  const handleRestore = (version: Version) => {
    if (!onRestore) return;

    const confirmed = confirm(
      `「${version.message}」の状態に復元しますか？\n\n` +
      `現在のデータは失われます。この操作は元に戻せません。\n\n` +
      `復元前に現在の状態のバージョンを作成することをお勧めします。`
    );

    if (confirmed) {
      onRestore(version.id);
    }
  };

  /**
   * 削除確認
   */
  const handleDelete = (version: Version) => {
    if (!onDelete) return;

    const confirmed = confirm(
      `バージョン「${version.message}」を削除しますか？\n\n` +
      `この操作は元に戻せません。`
    );

    if (confirmed) {
      onDelete(version.id);
    }
  };

  /**
   * 比較実行
   */
  const handleCompare = () => {
    if (!onCompare || selectedVersions.size !== 2) return;

    const versionIds = Array.from(selectedVersions);
    onCompare(versionIds);
  };

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
   * 相対時間フォーマット
   */
  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'たった今';
    if (minutes < 60) return `${minutes}分前`;
    if (hours < 24) return `${hours}時間前`;
    if (days < 7) return `${days}日前`;
    return formatDate(date);
  };

  if (isLoading) {
    return (
      <Card>
        <CardBody className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-gray-600">バージョン履歴を読み込んでいます...</p>
        </CardBody>
      </Card>
    );
  }

  if (versions.length === 0) {
    return (
      <Card>
        <CardBody className="flex flex-col items-center justify-center py-12">
          <p className="text-gray-600 mb-2">バージョン履歴がありません</p>
          <p className="text-sm text-gray-500">
            最初のバージョンを作成して、プロジェクトの状態を保存しましょう
          </p>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* 比較ツールバー */}
      {onCompare && selectedVersions.size === 2 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardBody>
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-blue-800">
                2つのバージョンが選択されています
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="flat"
                  onPress={() => setSelectedVersions(new Set())}
                >
                  選択解除
                </Button>
                <Button
                  size="sm"
                  color="primary"
                  onPress={handleCompare}
                >
                  比較する
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* タイムライン */}
      <div className="relative">
        {/* タイムライン線 */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />

        {/* バージョンリスト */}
        <div className="space-y-4">
          {versions.map((version, index) => {
            const isExpanded = expandedVersionId === version.id;
            const isSelected = selectedVersions.has(version.id);
            const isLatest = index === 0;

            return (
              <div key={version.id} className="relative pl-16">
                {/* タイムラインドット */}
                <div
                  className={`absolute left-4 w-4 h-4 rounded-full border-2 ${
                    isLatest
                      ? 'bg-primary border-primary'
                      : 'bg-white border-gray-300'
                  }`}
                  style={{ top: '1.5rem' }}
                />

                <Card className={isSelected ? 'ring-2 ring-primary' : ''}>
                  <CardHeader>
                    <div className="flex items-start justify-between w-full">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-lg">
                            {version.message}
                          </h4>
                          {isLatest && (
                            <Chip size="sm" color="primary">
                              最新
                            </Chip>
                          )}
                          {version.tag && (
                            <Chip size="sm" color="secondary" variant="flat">
                              {version.tag}
                            </Chip>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>{formatRelativeTime(version.timestamp)}</span>
                          <span>•</span>
                          <span>作成者: {version.author}</span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        {onCompare && (
                          <Button
                            size="sm"
                            variant="flat"
                            color={isSelected ? 'primary' : 'default'}
                            onPress={() => toggleVersionSelection(version.id)}
                          >
                            {isSelected ? '選択解除' : '比較選択'}
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="flat"
                          onPress={() => toggleExpanded(version.id)}
                        >
                          {isExpanded ? '閉じる' : '詳細'}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  {isExpanded && (
                    <CardBody className="pt-0 space-y-4">
                      {/* スナップショット情報 */}
                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-blue-50 rounded-lg p-3">
                          <p className="text-xs text-gray-600 mb-1">工程数</p>
                          <p className="text-2xl font-semibold">
                            {version.snapshotData.processes.length}
                          </p>
                        </div>
                        <div className="bg-green-50 rounded-lg p-3">
                          <p className="text-xs text-gray-600 mb-1">BPMNダイアグラム</p>
                          <p className="text-2xl font-semibold">
                            {version.snapshotData.bpmnDiagrams.length}
                          </p>
                        </div>
                        <div className="bg-purple-50 rounded-lg p-3">
                          <p className="text-xs text-gray-600 mb-1">作成日時</p>
                          <p className="text-sm font-semibold">
                            {formatDate(version.createdAt)}
                          </p>
                        </div>
                      </div>

                      {/* アクションボタン */}
                      <div className="flex gap-2 pt-2 border-t">
                        {onRestore && !isLatest && (
                          <Button
                            size="sm"
                            color="primary"
                            onPress={() => handleRestore(version)}
                          >
                            このバージョンに復元
                          </Button>
                        )}
                        {onDelete && !isLatest && (
                          <Button
                            size="sm"
                            color="danger"
                            variant="flat"
                            onPress={() => handleDelete(version)}
                          >
                            削除
                          </Button>
                        )}
                      </div>
                    </CardBody>
                  )}
                </Card>
              </div>
            );
          })}
        </div>
      </div>

      {/* ヘルプ */}
      <Card className="bg-gray-50">
        <CardBody>
          <h4 className="text-sm font-semibold mb-2">💡 バージョン管理のヒント</h4>
          <ul className="text-xs space-y-1 text-gray-600">
            <li>• 「復元」を実行すると、選択したバージョンの状態に戻ります</li>
            <li>• 復元前に現在の状態を保存することをお勧めします</li>
            <li>• 2つのバージョンを選択して比較できます</li>
            <li>• 最新バージョンは削除や復元ができません</li>
          </ul>
        </CardBody>
      </Card>
    </div>
  );
}
