'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Card, CardBody, CardHeader, Spinner } from '@heroui/react';
import { 
  ArrowLeftIcon, 
  PencilIcon, 
  FolderIcon,
  DocumentTextIcon,
  ChartBarIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import { AppLayout, Button, Modal, SkeletonCard, SkeletonText } from '@/components';
import { ProcessForm, ProcessFormData } from '@/components/process/ProcessForm';
import { useProjectStore } from '@/stores/projectStore';
import { useProcessStore } from '@/stores/processStore';
import { projectIPC, processIPC } from '@/lib/ipc-helpers';
import { Project, Process } from '@/types/project.types';

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  
  // URLから実際のプロジェクトIDを取得（静的エクスポート対応）
  const [projectId, setProjectId] = useState<string>('');

  useEffect(() => {
    const extractProjectId = () => {
      if (typeof window === 'undefined') return;
      
      const pathname = window.location.pathname;
      const match = pathname.match(/\/projects\/([^\/]+)$/);
      const id = match ? match[1] : (params.id as string);
      
      console.log('[ProjectDetail] Extracting project ID');
      console.log('[ProjectDetail] pathname:', pathname);
      console.log('[ProjectDetail] params:', params);
      console.log('[ProjectDetail] extracted projectId:', id);
      
      // placeholderの場合は待機（Electronのhistory.replaceStateを待つ）
      if (id === 'placeholder') {
        console.log('[ProjectDetail] Placeholder detected, waiting for URL update...');
        // 100ms後に再試行
        setTimeout(extractProjectId, 100);
        return;
      }
      
      // 同じIDの場合でも再設定（戻るボタン対応）
      setProjectId(id);
    };

    extractProjectId();
    
    // Electronからのurlchangedイベントをリッスン
    const handleUrlChanged = (event: CustomEvent) => {
      console.log('[ProjectDetail] URL changed event received:', event.detail);
      extractProjectId();
      // 強制的に再読み込みをトリガー
      setReloadTrigger(prev => prev + 1);
    };
    
    // popstateイベント（戻る/進むボタン）をリッスン
    const handlePopState = () => {
      console.log('[ProjectDetail] PopState event detected (browser back/forward)');
      // 少し待ってからIDを抽出（URLが更新されるのを待つ）
      setTimeout(() => {
        extractProjectId();
        // 強制的に再読み込みをトリガー
        setReloadTrigger(prev => prev + 1);
      }, 50);
    };
    
    if (typeof window !== 'undefined') {
      window.addEventListener('urlchanged', handleUrlChanged as EventListener);
      window.addEventListener('popstate', handlePopState);
      
      return () => {
        window.removeEventListener('urlchanged', handleUrlChanged as EventListener);
        window.removeEventListener('popstate', handlePopState);
      };
    }
  }, [params]);

  const { currentProject, setCurrentProject, updateProject } = useProjectStore();
  const { processes, setProcesses } = useProcessStore();

  const [isLoading, setIsLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProcessFormOpen, setIsProcessFormOpen] = useState(false);
  const [reloadTrigger, setReloadTrigger] = useState(0);

  // プロジェクトとプロセスデータを読み込み
  useEffect(() => {
    // projectIdが設定されてから読み込み
    if (projectId) {
      loadProjectData();
    }
  }, [projectId, reloadTrigger]);

  const loadProjectData = async () => {
    // projectIdが未設定またはplaceholderの場合はスキップ
    if (!projectId || projectId === 'placeholder') {
      console.log('[ProjectDetail] Skipping load - invalid projectId:', projectId);
      return;
    }
    
    console.log('[ProjectDetail] Loading project data for:', projectId);
    setIsLoading(true);

    // プロジェクト情報を取得
    const { data: projectData, error: projectError } = await projectIPC.getById(projectId);
    if (projectError) {
      console.error('[ProjectDetail] Failed to load project:', projectError);
      console.error('[ProjectDetail] Project ID:', projectId);
      setIsLoading(false);
      alert(`プロジェクトの読み込みに失敗しました。\n\nプロジェクトID: ${projectId}\nエラー: ${projectError}\n\nプロジェクト一覧に戻ります。`);
      router.push('/projects/');
      return;
    }

    if (!projectData) {
      console.error('[ProjectDetail] Project not found:', projectId);
      setIsLoading(false);
      alert(`プロジェクトが見つかりませんでした。\n\nプロジェクトID: ${projectId}\n\nプロジェクト一覧に戻ります。`);
      router.push('/projects/');
      return;
    }

    console.log('[ProjectDetail] Project loaded successfully:', projectData);
    setCurrentProject(projectData);
    setEditName(projectData.name);
    setEditDescription(projectData.description || '');

    // プロセス一覧を取得
    const { data: processData, error: processError } = await processIPC.getByProject(projectId);
    if (processError) {
      console.error('[ProjectDetail] Failed to load processes:', processError);
    } else if (processData) {
      setProcesses(processData);
    }

    setIsLoading(false);
  };

  // プロジェクト情報更新
  const handleUpdateProject = async () => {
    if (!editName.trim()) {
      alert('プロジェクト名を入力してください');
      return;
    }

    setIsSubmitting(true);
    const { data, error } = await projectIPC.update(projectId, {
      name: editName.trim(),
      description: editDescription.trim() || undefined,
    });

    if (error) {
      alert(`プロジェクトの更新に失敗しました: ${error}`);
      console.error('[ProjectDetail] Failed to update project:', error);
    } else if (data) {
      setCurrentProject(data);
      updateProject(projectId, data);
      setIsEditModalOpen(false);
    }

    setIsSubmitting(false);
  };

  // 工程作成
  const handleCreateProcess = async (data: ProcessFormData) => {
    try {
      const { data: newProcess, error } = await processIPC.create({
        projectId,
        name: data.name,
        level: data.level,
        parentId: data.parentId,
        department: data.department,
        assignee: data.assignee,
        documentType: data.documentType,
        description: data.description,
      });

      if (error) {
        alert(`工程の作成に失敗しました: ${error}`);
      } else if (newProcess) {
        await loadProjectData();
        setIsProcessFormOpen(false);
        alert('工程を作成しました');
      }
    } catch (err) {
      alert(`エラーが発生しました: ${err}`);
    }
  };

  // 工程レベル別の集計
  const processStats = {
    large: processes.filter(p => p.level === 'large').length,
    medium: processes.filter(p => p.level === 'medium').length,
    small: processes.filter(p => p.level === 'small').length,
    detail: processes.filter(p => p.level === 'detail').length,
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="container mx-auto p-8 space-y-6">
          <div className="space-y-2">
            <div className="h-10 w-64 bg-gray-200 animate-pulse rounded" />
            <SkeletonText lines={1} className="w-96" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </AppLayout>
    );
  }

  if (!currentProject) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-full">
          <p className="text-lg text-gray-500">プロジェクトが見つかりません</p>
          <Button
            color="primary"
            className="mt-4"
            onPress={() => router.push('/projects/')}
          >
            プロジェクト一覧に戻る
          </Button>
        </div>
      </AppLayout>
    );
  }

  // projectIdが未設定の場合はローディング
  if (!projectId) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center min-h-[400px]">
          <Spinner size="lg" label="プロジェクトを読み込み中..." />
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
              onClick={() => router.push('/projects/')}
              className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="プロジェクト一覧に戻る"
            >
              <ArrowLeftIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">{currentProject.name}</h1>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
                更新: {new Date(currentProject.updatedAt).toLocaleDateString('ja-JP')}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              color="default"
              size="md"
              variant="flat"
              className="font-semibold whitespace-nowrap border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
              startContent={<PencilIcon className="w-5 h-5" />}
              onPress={() => setIsEditModalOpen(true)}
            >
              編集
            </Button>
            <Button
              color="primary"
              size="md"
              className="font-semibold shadow-md hover:shadow-lg transition-shadow whitespace-nowrap bg-blue-600 hover:bg-blue-700 text-white"
              startContent={<PlusIcon className="w-5 h-5" />}
              onPress={() => setIsProcessFormOpen(true)}
            >
              工程を追加
            </Button>
          </div>
        </div>

        {/* 説明 */}
        {currentProject.description && (
          <Card className="shadow-sm">
            <CardBody className="p-4">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {currentProject.description}
              </p>
            </CardBody>
          </Card>
        )}

        {/* 統計情報 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="shadow-sm">
            <CardBody className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">大工程</p>
                  <p className="text-2xl font-bold mt-1 text-gray-900 dark:text-gray-50">{processStats.large}</p>
                </div>
                <div className="bg-blue-500 bg-opacity-10 p-2 rounded-lg">
                  <ChartBarIcon className="w-6 h-6 text-blue-500" />
                </div>
              </div>
            </CardBody>
          </Card>
          <Card className="shadow-sm">
            <CardBody className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">中工程</p>
                  <p className="text-2xl font-bold mt-1 text-gray-900 dark:text-gray-50">{processStats.medium}</p>
                </div>
                <div className="bg-green-500 bg-opacity-10 p-2 rounded-lg">
                  <ChartBarIcon className="w-6 h-6 text-green-500" />
                </div>
              </div>
            </CardBody>
          </Card>
          <Card className="shadow-sm">
            <CardBody className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">小工程</p>
                  <p className="text-2xl font-bold mt-1 text-gray-900 dark:text-gray-50">{processStats.small}</p>
                </div>
                <div className="bg-purple-500 bg-opacity-10 p-2 rounded-lg">
                  <ChartBarIcon className="w-6 h-6 text-purple-500" />
                </div>
              </div>
            </CardBody>
          </Card>
          <Card className="shadow-sm">
            <CardBody className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">詳細工程</p>
                  <p className="text-2xl font-bold mt-1 text-gray-900 dark:text-gray-50">{processStats.detail}</p>
                </div>
                <div className="bg-orange-500 bg-opacity-10 p-2 rounded-lg">
                  <ChartBarIcon className="w-6 h-6 text-orange-500" />
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* クイックアクション */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <button
            onClick={() => router.push(`/projects/${projectId}/hierarchy/`)}
            className="flex flex-col items-start p-5 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950 rounded-lg transition-all shadow-sm"
          >
            <div className="bg-blue-500 bg-opacity-10 p-2 rounded-lg mb-3">
              <ChartBarIcon className="w-6 h-6 text-blue-500" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-50 mb-1">階層管理</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">4段階の階層を構築</p>
          </button>

          <button
            onClick={() => router.push(`/projects/${projectId}/bpmn/`)}
            className="flex flex-col items-start p-5 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-purple-500 dark:hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-950 rounded-lg transition-all shadow-sm"
          >
            <div className="bg-purple-500 bg-opacity-10 p-2 rounded-lg mb-3">
              <DocumentTextIcon className="w-6 h-6 text-purple-500" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-50 mb-1">BPMNエディタ</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">プロセスフローを編集</p>
          </button>

          <button
            onClick={() => router.push(`/projects/${projectId}/manuals/`)}
            className="flex flex-col items-start p-5 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-indigo-500 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950 rounded-lg transition-all shadow-sm"
          >
            <div className="bg-indigo-500 bg-opacity-10 p-2 rounded-lg mb-3">
              <FolderIcon className="w-6 h-6 text-indigo-500" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-50 mb-1">マニュアル</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">手順書を作成・管理</p>
          </button>

          <button
            onClick={() => router.push(`/projects/${projectId}/versions/`)}
            className="flex flex-col items-start p-5 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-green-500 dark:hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-950 rounded-lg transition-all shadow-sm"
          >
            <div className="bg-green-500 bg-opacity-10 p-2 rounded-lg mb-3">
              <DocumentTextIcon className="w-6 h-6 text-green-500" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-50 mb-1">バージョン管理</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">スナップショットを管理</p>
          </button>
        </div>

        {/* 三位一体同期バナー */}
        <button
          onClick={() => router.push(`/projects/${projectId}/trinity/`)}
          className="w-full flex items-center justify-between p-6 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 rounded-lg transition-all shadow-md hover:shadow-lg"
        >
          <div className="flex items-center gap-4">
            <div className="bg-white bg-opacity-20 p-3 rounded-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <div className="text-left">
              <h3 className="text-xl font-bold text-white mb-1">三位一体同期ダッシュボード</h3>
              <p className="text-sm text-purple-100">BPMN・工程表・マニュアルを一括管理・同期</p>
            </div>
          </div>
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

      </div>

      {/* 編集モーダル */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditName(currentProject.name);
          setEditDescription(currentProject.description || '');
        }}
        title="プロジェクト情報を編集"
        size="md"
        showConfirmButton
        confirmText="保存"
        onConfirm={handleUpdateProject}
        isConfirmDisabled={!editName.trim() || isSubmitting}
        isConfirmLoading={isSubmitting}
      >
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              プロジェクト名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="プロジェクト名を入力"
              autoFocus
              className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-50 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              説明（任意）
            </label>
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              placeholder="プロジェクトの説明を入力"
              rows={3}
              className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-50 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>
        </div>
      </Modal>

      {/* 工程作成モーダル */}
      <ProcessForm
        isOpen={isProcessFormOpen}
        onClose={() => setIsProcessFormOpen(false)}
        onSubmit={handleCreateProcess}
        projectId={projectId}
        defaultLevel="large"
      />
    </AppLayout>
  );
}
