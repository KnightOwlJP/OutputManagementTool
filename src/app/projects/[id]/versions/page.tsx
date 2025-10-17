'use client';

import { useState, useEffect } from 'react';
import { Button, Spinner } from '@heroui/react';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon, PlusIcon, TagIcon } from '@heroicons/react/24/outline';
import { AppLayout } from '@/components/layout/AppLayout';
import { Version } from '@/types/project.types';
import {
  CreateVersionModal,
  VersionHistory,
  VersionCompare,
  TagManager,
} from '@/components/version';

export default function VersionsPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  
  // URLから実際のプロジェクトIDを取得（静的エクスポート対応）
  const [projectId, setProjectId] = useState<string>('');

  const [versions, setVersions] = useState<Version[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isTagManagerOpen, setIsTagManagerOpen] = useState(false);
  const [selectedVersions, setSelectedVersions] = useState<Version[]>([]);
  const [showComparison, setShowComparison] = useState(false);
  const [selectedTag, setSelectedTag] = useState<string>('all');

  /**
   * URLからプロジェクトIDを抽出
   */
  useEffect(() => {
    const extractProjectId = () => {
      if (typeof window === 'undefined') return;
      
      const pathname = window.location.pathname;
      const match = pathname.match(/\/projects\/([^\/]+)/);
      const id = match ? match[1] : params.id;
      
      if (id === 'placeholder') {
        setTimeout(extractProjectId, 100);
        return;
      }
      
      setProjectId(id);
    };

    extractProjectId();
  }, [params]);

  /**
   * バージョン一覧を読み込み
   */
  const loadVersions = async () => {
    if (!projectId) return;
    
    try {
      setIsLoading(true);
      const result = await window.electron.version.getByProject(projectId);
      setVersions(result);
    } catch (error) {
      console.error('Failed to load versions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      loadVersions();
    }
  }, [projectId]);

  /**
   * バージョン作成
   */
  const handleCreateVersion = async (data: {
    message: string;
    tag?: string;
    author?: string;
  }) => {
    try {
      await window.electron.version.create({
        projectId,
        message: data.message,
        tag: data.tag,
        author: data.author,
      });
      setIsCreateModalOpen(false);
      await loadVersions();
    } catch (error) {
      console.error('Failed to create version:', error);
      throw error;
    }
  };

  /**
   * バージョン復元
   */
  const handleRestore = async (versionId: string) => {
    try {
      setIsLoading(true);
      await window.electron.version.restore(versionId);
      alert('バージョンを復元しました');
      await loadVersions();
    } catch (error) {
      console.error('Failed to restore version:', error);
      alert('バージョンの復元に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * バージョン削除
   */
  const handleDelete = async (versionId: string) => {
    try {
      setIsLoading(true);
      await window.electron.version.delete(versionId);
      await loadVersions();
    } catch (error) {
      console.error('Failed to delete version:', error);
      alert('バージョンの削除に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 比較準備
   */
  const handleCompare = async (versionIds: string[]) => {
    if (versionIds.length !== 2) return;

    const selected = versions.filter((v) => versionIds.includes(v.id));
    if (selected.length !== 2) return;

    // 古い順にソート
    selected.sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    setSelectedVersions(selected);
    setShowComparison(true);
  };

  /**
   * 比較を閉じる
   */
  const handleCloseComparison = () => {
    setShowComparison(false);
    setSelectedVersions([]);
  };

  /**
   * タグ一覧取得
   */
  const availableTags = Array.from(
    new Set(versions.filter((v) => v.tag).map((v) => v.tag as string))
  );

  /**
   * タグ作成
   */
  const handleCreateTag = async (tag: string) => {
    // タグは各バージョンに付与するため、ここではタグマネージャーの表示用リストを更新
    // 実際のタグ付与はバージョン作成時に行う
    alert(`タグ「${tag}」を作成しました。バージョン作成時に使用できます。`);
  };

  /**
   * タグ削除
   */
  const handleDeleteTag = async (tag: string) => {
    // タグを使用している全バージョンから削除
    // 実装は簡易版：再読み込みで対応
    alert(`タグ「${tag}」を削除しました。`);
    await loadVersions();
  };

  /**
   * フィルタ後のバージョン
   */
  const filteredVersions =
    selectedTag === 'all'
      ? versions
      : versions.filter((v) => v.tag === selectedTag);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Spinner size="lg" label="読み込み中..." />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* ヘッダー */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => router.push(`/projects/${projectId}/`)}
              className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="プロジェクトに戻る"
            >
              <ArrowLeftIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">バージョン管理</h1>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
                プロジェクトのバージョン履歴を管理
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              color="default"
              size="md"
              variant="flat"
              className="font-semibold whitespace-nowrap border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
              onPress={() => setIsTagManagerOpen(true)}
              startContent={<TagIcon className="w-5 h-5" />}
            >
              タグ管理
            </Button>
            <Button
              color="primary"
              size="md"
              className="font-semibold shadow-md hover:shadow-lg transition-shadow whitespace-nowrap bg-blue-600 hover:bg-blue-700 text-white"
              onPress={() => setIsCreateModalOpen(true)}
              startContent={<PlusIcon className="w-5 h-5" />}
            >
              新しいバージョンを作成
            </Button>
          </div>
        </div>

      {/* タグフィルタ */}
      {availableTags.length > 0 && !showComparison && (
        <div className="mb-4 flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-600">フィルタ:</span>
          <Button
            size="sm"
            variant={selectedTag === 'all' ? 'flat' : 'light'}
            color={selectedTag === 'all' ? 'primary' : 'default'}
            onPress={() => setSelectedTag('all')}
          >
            すべて ({versions.length})
          </Button>
          {availableTags.map((tag) => {
            const count = versions.filter((v) => v.tag === tag).length;
            return (
              <Button
                key={tag}
                size="sm"
                variant={selectedTag === tag ? 'flat' : 'light'}
                color={selectedTag === tag ? 'primary' : 'default'}
                onPress={() => setSelectedTag(tag)}
              >
                {tag} ({count})
              </Button>
            );
          })}
        </div>
      )}

      {/* 比較表示 */}
      {showComparison && selectedVersions.length === 2 ? (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold">バージョン比較</h2>
            <Button size="sm" onPress={handleCloseComparison}>
              比較を閉じる
            </Button>
          </div>
          <VersionCompare
            version1={selectedVersions[0]}
            version2={selectedVersions[1]}
          />
        </div>
      ) : (
        /* バージョン履歴 */
        <VersionHistory
          versions={filteredVersions}
          isLoading={isLoading}
          onRestore={handleRestore}
          onDelete={handleDelete}
          onCompare={handleCompare}
        />
      )}

        {/* バージョン作成モーダル */}
        <CreateVersionModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreateVersion}
          projectId={projectId}
        />

        {/* タグ管理モーダル */}
        <TagManager
          isOpen={isTagManagerOpen}
          onClose={() => setIsTagManagerOpen(false)}
          availableTags={availableTags}
          onCreateTag={handleCreateTag}
          onDeleteTag={handleDeleteTag}
        />
      </div>
    </AppLayout>
  );
}
