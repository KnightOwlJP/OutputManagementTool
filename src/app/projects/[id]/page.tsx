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
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import { AppLayout, Button, Modal, SkeletonCard, SkeletonText } from '@/components';
import { ProcessTableListV2 } from '@/components/processTable/ProcessTableListV2';
import { ProcessTableFormModal, ProcessTableFormData } from '@/components/processTable/ProcessTableFormModal';
import { useProjectStore } from '@/stores/projectStore';
import { useProcessStore } from '@/stores/processStore';
import { projectIPC, processIPC, processTableIPC } from '@/lib/ipc-helpers';
import { Project, Process } from '@/types/project.types';
import { ProcessTable } from '@/types/models';
import { useToast } from '@/contexts/ToastContext';

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
  const { showToast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProcessFormOpen, setIsProcessFormOpen] = useState(false);
  const [reloadTrigger, setReloadTrigger] = useState(0);

  // V2: ProcessTable関連
  const [processTables, setProcessTables] = useState<ProcessTable[]>([]);
  const [isProcessTableFormOpen, setIsProcessTableFormOpen] = useState(false);
  const [editingProcessTable, setEditingProcessTable] = useState<ProcessTable | null>(null);
  const [deletingProcessTable, setDeletingProcessTable] = useState<ProcessTable | null>(null);

  // Phase 9: Manual関連
  const [manuals, setManuals] = useState<any[]>([]);

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

    // V2: ProcessTable一覧を取得
    const { data: processTableData, error: processTableError } = await processTableIPC.getByProject(projectId);
    if (processTableError) {
      console.error('[ProjectDetail] Failed to load process tables:', processTableError);
      showToast('error', `工程表の読み込みに失敗しました: ${processTableError}`);
    } else if (processTableData) {
      setProcessTables(processTableData);
    }

    // Phase 9: マニュアル一覧を取得
    const { manualIPC } = await import('@/lib/ipc-helpers');
    const { data: manualData, error: manualError } = await manualIPC.getByProject(projectId);
    if (!manualError && manualData) {
      setManuals(manualData);
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

  // V2: ProcessTable作成/編集
  const handleProcessTableSubmit = async (data: ProcessTableFormData) => {
    if (editingProcessTable) {
      // 編集
      const { data: updated, error } = await processTableIPC.update(editingProcessTable.id, data);
      if (error) {
        showToast('error', `工程表の更新に失敗しました: ${error}`);
      } else if (updated) {
        await loadProjectData();
        setIsProcessTableFormOpen(false);
        setEditingProcessTable(null);
        showToast('success', '工程表を更新しました');
      }
    } else {
      // 新規作成
      const { data: created, error } = await processTableIPC.create({
        projectId,
        ...data,
      });
      if (error) {
        showToast('error', `工程表の作成に失敗しました: ${error}`);
      } else if (created) {
        await loadProjectData();
        setIsProcessTableFormOpen(false);
        showToast('success', '工程表を作成しました');
      }
    }
  };

  // V2: ProcessTable削除
  const handleDeleteProcessTable = async (table: ProcessTable) => {
    if (!confirm(`工程表「${table.name}」を削除しますか？\n\n※関連するSwimlane、Step、Process、BPMN、Manualも削除されます。`)) {
      return;
    }

    const { error } = await processTableIPC.delete(table.id);
    if (error) {
      showToast('error', `工程表の削除に失敗しました: ${error}`);
    } else {
      await loadProjectData();
      showToast('success', '工程表を削除しました');
    }
  };

  // V2: ProcessTable表示（詳細ページへ遷移）
  const handleViewProcessTable = (table: ProcessTable) => {
    router.push(`/projects/${projectId}/process-tables/${table.id}/`);
  };

  // 工程レベル別の集計
  const processStats = {
    large: processes.filter(p => p.level === 'large').length,
    medium: processes.filter(p => p.level === 'medium').length,
    small: processes.filter(p => p.level === 'small').length,
    detail: processes.filter(p => p.level === 'detail').length,
    detailTables: processes.filter(p => p.detailTableId != null).length, // Phase 8: 詳細表の数
    total: processes.length,
  };

  const projectStats = {
    processTables: processTables.length,
    processes: processes.length,
    manuals: manuals.length,
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

        {/* 統計情報 - コンパクト版 */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="shadow-sm">
            <CardBody className="p-3">
              <div className="flex items-center gap-2">
                <div className="bg-blue-500 bg-opacity-10 p-2 rounded">
                  <FolderIcon className="w-4 h-4 text-blue-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">工程表</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-gray-50">
                    {projectStats.processTables}
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
          <Card className="shadow-sm">
            <CardBody className="p-3">
              <div className="flex items-center gap-2">
                <div className="bg-green-500 bg-opacity-10 p-2 rounded">
                  <ChartBarIcon className="w-4 h-4 text-green-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">工程</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-gray-50">
                    {projectStats.processes}
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
          <Card className="shadow-sm">
            <CardBody className="p-3">
              <div className="flex items-center gap-2">
                <div className="bg-purple-500 bg-opacity-10 p-2 rounded">
                  <DocumentTextIcon className="w-4 h-4 text-purple-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">マニュアル</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-gray-50">
                    {projectStats.manuals}
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* V2: ProcessTable一覧 */}
        <ProcessTableListV2
          projectId={projectId}
          processTables={processTables}
          onCreateTable={() => {
            setEditingProcessTable(null);
            setIsProcessTableFormOpen(true);
          }}
          onEditTable={(table) => {
            setEditingProcessTable(table);
            setIsProcessTableFormOpen(true);
          }}
          onDeleteTable={handleDeleteProcessTable}
          onViewTable={handleViewProcessTable}
        />

        {/* クイックアクション */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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

      {/* V2: ProcessTable作成/編集モーダル */}
      <ProcessTableFormModal
        isOpen={isProcessTableFormOpen}
        onClose={() => {
          setIsProcessTableFormOpen(false);
          setEditingProcessTable(null);
        }}
        onSubmit={handleProcessTableSubmit}
        editData={editingProcessTable}
        projectId={projectId}
      />
    </AppLayout>
  );
}
