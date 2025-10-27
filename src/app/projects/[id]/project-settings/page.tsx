'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardBody, CardHeader, Spinner, Divider } from '@heroui/react';
import { ArrowLeftIcon, Cog6ToothIcon, TableCellsIcon } from '@heroicons/react/24/outline';
import { AppLayout } from '@/components';
import { CustomColumnManager } from '@/components/customColumn/CustomColumnManager';
import { Project } from '@/types/project.types';

export default function ProjectSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const [projectId, setProjectId] = useState<string>('');
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const extractProjectId = () => {
      if (typeof window === 'undefined') return;
      
      const pathname = window.location.pathname;
      const match = pathname.match(/\/projects\/([^\/]+)\/project-settings/);
      const id = match ? match[1] : (params.id as string);
      
      if (id === 'placeholder') {
        setTimeout(extractProjectId, 100);
        return;
      }
      
      setProjectId(id);
    };

    extractProjectId();
  }, [params]);

  useEffect(() => {
    if (projectId && projectId !== 'placeholder') {
      loadProject();
    }
  }, [projectId]);

  const loadProject = async () => {
    setIsLoading(true);
    try {
      const result = await window.electronAPI.project.getById(projectId);
      if (result) {
        setProject(result);
      }
    } catch (error) {
      console.error('Failed to load project:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !projectId) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center min-h-[400px]">
          <Spinner size="lg" label="読み込み中..." />
        </div>
      </AppLayout>
    );
  }

  if (!project) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-full">
          <p className="text-lg text-gray-500">プロジェクトが見つかりません</p>
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
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50 flex items-center gap-2">
                <Cog6ToothIcon className="w-6 h-6" />
                プロジェクト設定
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {project.name}
              </p>
            </div>
          </div>
        </div>

        {/* プロジェクト情報 */}
        <Card>
          <CardHeader className="flex gap-3">
            <div className="flex flex-col">
              <p className="text-lg font-semibold">プロジェクト情報</p>
              <p className="text-small text-default-500">基本的なプロジェクト設定</p>
            </div>
          </CardHeader>
          <Divider />
          <CardBody className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">プロジェクト名</label>
              <p className="text-base text-gray-900 dark:text-gray-50 mt-1">{project.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">説明</label>
              <p className="text-base text-gray-900 dark:text-gray-50 mt-1">
                {project.description || '説明が設定されていません'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">作成日</label>
              <p className="text-base text-gray-900 dark:text-gray-50 mt-1">
                {new Date(project.createdAt).toLocaleString('ja-JP')}
              </p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                💡 プロジェクト名と説明の編集は、プロジェクト詳細ページから行えます。
              </p>
            </div>
          </CardBody>
        </Card>

        {/* カスタム列設定 */}
        <Card>
          <CardHeader className="flex gap-3">
            <TableCellsIcon className="w-6 h-6 text-primary" />
            <div className="flex flex-col">
              <p className="text-lg font-semibold">カスタム列設定</p>
              <p className="text-small text-default-500">工程表に独自の列を追加できます</p>
            </div>
          </CardHeader>
          <Divider />
          <CardBody>
            <CustomColumnManager projectId={projectId} />
          </CardBody>
        </Card>
      </div>
    </AppLayout>
  );
}
