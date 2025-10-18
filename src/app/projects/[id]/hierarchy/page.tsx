'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Button, 
  Card, 
  CardHeader, 
  CardBody, 
  Spinner,
  Chip,
  Divider,
  Tabs,
  Tab,
} from '@heroui/react';
import { 
  ArrowLeftIcon, 
  ArrowsUpDownIcon, 
  PlusIcon,
  ChartBarIcon,
  Squares2X2Icon,
  ArrowDownTrayIcon,
  TableCellsIcon,
  ListBulletIcon,
} from '@heroicons/react/24/outline';
import { AppLayout, Modal } from '@/components';
import { HierarchyTree } from '@/components/hierarchy/HierarchyTree';
import { ProcessOrderManager } from '@/components/hierarchy/ProcessOrderManager';
import { ProcessForm } from '@/components/process/ProcessForm';
import { ProcessTable } from '@/components/process/ProcessTable';
import { IntegratedProcessTable } from '@/components/process/IntegratedProcessTable';
import { Process, ProcessLevel } from '@/types/project.types';
import { useToast } from '@/contexts/ToastContext';

export default function HierarchyPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  
  // URLから実際のプロジェクトIDを取得（静的エクスポート対応）
  const [projectId, setProjectId] = useState<string>('');

  const [processes, setProcesses] = useState<Process[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [editingProcess, setEditingProcess] = useState<Process | null>(null);
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
  const [preselectedLevel, setPreselectedLevel] = useState<ProcessLevel | undefined>(undefined);
  const [viewMode, setViewMode] = useState<'tree' | 'table'>('tree');
  const [formKey, setFormKey] = useState(0); // フォームを強制再マウントするためのキー

  /**
   * URLからプロジェクトIDを抽出
   */
  useEffect(() => {
    const extractProjectId = () => {
      if (typeof window === 'undefined') return;
      
      const pathname = window.location.pathname;
      const match = pathname.match(/\/projects\/([^\/]+)/);
      const id = match ? match[1] : (params.id as string);
      
      if (id === 'placeholder') {
        setTimeout(extractProjectId, 100);
        return;
      }
      
      setProjectId(id);
    };

    extractProjectId();
  }, [params]);

  /**
   * データ読み込み
   */
  useEffect(() => {
    if (projectId) {
      loadProcesses();
    }
  }, [projectId]);

  const loadProcesses = async () => {
    setIsLoading(true);
    try {
      const processList = await window.electronAPI.process.getByProject(projectId);
      setProcesses(processList);
    } catch (error) {
      console.error('Failed to load processes:', error);
      showToast('error', `工程の読み込みに失敗しました: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 工程移動ハンドラ
   */
  const handleProcessMove = async (processId: string, newParentId: string | null) => {
    try {
      await window.electronAPI.process.move(processId, newParentId);
      await loadProcesses();
      showToast('success', '工程を移動しました');
    } catch (error) {
      console.error('Failed to move process:', error);
      showToast('error', `工程の移動に失敗しました: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  /**
   * 並び順変更ハンドラ
   */
  const handleProcessReorder = async (processId: string, newOrder: number) => {
    try {
      await window.electronAPI.process.reorder(processId, newOrder);
    } catch (error) {
      console.error('Failed to reorder process:', error);
      throw error;
    }
  };

  const handleReorderComplete = async () => {
    setIsOrderModalOpen(false);
    await loadProcesses();
    showToast('success', '表示順を更新しました');
  };

  /**
   * 工程削除ハンドラ
   */
  const handleProcessDelete = async (processId: string) => {
    const process = processes.find(p => p.id === processId);
    if (!process) return;

    // 子工程があるか確認
    const hasChildren = processes.some(p => p.parentId === processId);
    if (hasChildren) {
      showToast('warning', '子工程がある工程は削除できません。先に子工程を削除してください。');
      return;
    }

    if (!confirm(`「${process.name}」を削除しますか？`)) {
      return;
    }

    try {
      await window.electronAPI.process.delete(processId);
      await loadProcesses();
      showToast('success', '工程を削除しました');
    } catch (error) {
      console.error('Failed to delete process:', error);
      showToast('error', `工程の削除に失敗しました: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  /**
   * 工程編集ハンドラ
   */
  const handleProcessEdit = (process: Process) => {
    setEditingProcess(process);
    setIsFormModalOpen(true);
  };

  /**
   * 工程作成ハンドラ
   */
  const handleProcessCreate = (parentId: string | null, preselectedLevel?: ProcessLevel) => {
    setSelectedParentId(parentId);
    setEditingProcess(null);
    setPreselectedLevel(preselectedLevel);
    setFormKey(prev => prev + 1); // フォームを強制再マウント
    setIsFormModalOpen(true);
  };

  /**
   * レベル別エクスポートハンドラ
   */
  const handleExportLevel = async (level: ProcessLevel) => {
    const levelProcesses = processes.filter(p => p.level === level);
    if (levelProcesses.length === 0) {
      showToast('warning', 'エクスポートする工程がありません');
      return;
    }

    const levelNames: Record<ProcessLevel, string> = {
      large: '大工程',
      medium: '中工程',
      small: '小工程',
      detail: '詳細工程',
    };

    try {
      const dataStr = JSON.stringify(levelProcesses, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${levelNames[level]}_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('success', `${levelNames[level]}をエクスポートしました`);
    } catch (error) {
      console.error('Failed to export:', error);
      showToast('error', `エクスポートに失敗しました: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  /**
   * テンプレートダウンロードハンドラ
   */
  const handleDownloadTemplate = () => {
    try {
      import('@/lib/excel-utils').then(({ downloadProcessTemplate }) => {
        downloadProcessTemplate();
        showToast('success', 'テンプレートをダウンロードしました');
      });
    } catch (error) {
      console.error('Failed to download template:', error);
      showToast('error', `テンプレートのダウンロードに失敗しました: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  /**
   * XLSXエクスポートハンドラ
   */
  const handleDownloadXLSX = async () => {
    try {
      const { downloadProcessData } = await import('@/lib/excel-utils');
      
      // プロジェクト名を取得
      let projectName = 'プロジェクト';
      try {
        const project = await window.electronAPI.project.getById(projectId);
        projectName = project.name;
      } catch (error) {
        console.error('Failed to get project name:', error);
      }
      
      downloadProcessData(processes, projectName);
      showToast('success', '工程表をExcel形式でダウンロードしました');
    } catch (error) {
      console.error('Failed to download XLSX:', error);
      showToast('error', `Excelダウンロードに失敗しました: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  /**
   * フォーム送信ハンドラ
   */
  const handleFormSubmit = async (data: {
    name: string;
    level: ProcessLevel;
    parentId?: string;
    department?: string;
    assignee?: string;
    documentType?: string;
    description?: string;
  }) => {
    try {
      if (editingProcess) {
        // 更新
        await window.electronAPI.process.update(editingProcess.id, {
          name: data.name,
          department: data.department,
          assignee: data.assignee,
          documentType: data.documentType,
          description: data.description,
        });
        showToast('success', '工程を更新しました');
      } else {
        // 新規作成
        const isFirstProcess = processes.length === 0;
        
        await window.electronAPI.process.create({
          projectId,
          name: data.name,
          level: data.level,
          parentId: selectedParentId || undefined,
          department: data.department,
          assignee: data.assignee,
          documentType: data.documentType,
          description: data.description,
        });

        // 自動同期: 最初の工程作成時にドキュメントのたたきを生成
        if (isFirstProcess) {
          try {
            const { autoSyncDocuments } = await import('@/lib/document-sync');
            const syncResult = await autoSyncDocuments(projectId, 'process');
            
            const messages: string[] = ['工程を作成しました'];
            if (syncResult.bpmnCreated) {
              messages.push('BPMNのたたきを自動生成しました');
            }
            if (syncResult.manualCreated) {
              messages.push('マニュアルのたたきを自動生成しました');
            }
            
            showToast('success', messages.join('\n'), 5000);
          } catch (syncError) {
            console.error('Auto sync failed:', syncError);
            showToast('success', '工程を作成しました');
          }
        } else {
          showToast('success', '工程を作成しました');
        }
      }

      setIsFormModalOpen(false);
      setEditingProcess(null);
      setSelectedParentId(null);
      setPreselectedLevel(undefined);
      await loadProcesses();
    } catch (error) {
      console.error('Failed to save process:', error);
      showToast('error', `工程の保存に失敗しました: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  /**
   * インライン更新ハンドラ（統合テーブル用）
   */
  const handleProcessUpdate = async (processId: string, data: Partial<Process>) => {
    try {
      await window.electronAPI.process.update(processId, data);
      await loadProcesses();
    } catch (error) {
      console.error('Failed to update process:', error);
      throw error;
    }
  };

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
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => router.push(`/projects/${projectId}/`)}
              className="p-2 rounded-lg hover:bg-gradient-to-br hover:from-gray-100 hover:to-gray-50 dark:hover:from-gray-700 dark:hover:to-gray-800 transition-all duration-200"
              title="プロジェクトに戻る"
            >
              <ArrowLeftIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                  <Squares2X2Icon className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-50 dark:to-gray-300 bg-clip-text text-transparent">
                  階層管理
                </h1>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 ml-11">
                各階層ごとに工程を追加・管理できます
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              color="primary"
              size="md"
              variant="flat"
              className="font-semibold"
              onPress={() => router.push(`/projects/${projectId}/process-tables`)}
            >
              工程表グループ管理
            </Button>
            <Button
              color="default"
              size="md"
              variant="bordered"
              className="font-semibold border-2 hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
              startContent={<ArrowDownTrayIcon className="w-5 h-5" />}
              onPress={handleDownloadTemplate}
            >
              テンプレート
            </Button>
            <Button
              color="success"
              size="md"
              variant="bordered"
              className="font-semibold border-2"
              startContent={<ArrowDownTrayIcon className="w-5 h-5" />}
              onPress={handleDownloadXLSX}
              isDisabled={processes.length === 0}
            >
              Excel出力
            </Button>
            <Button
              color="default"
              size="md"
              variant="bordered"
              className="font-semibold border-2 hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
              startContent={<ArrowsUpDownIcon className="w-5 h-5" />}
              onPress={() => setIsOrderModalOpen(true)}
            >
              表示順を変更
            </Button>
          </div>
        </div>

        {/* 統計情報 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-none shadow-md">
            <CardBody className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs font-medium text-blue-700 dark:text-blue-300">大工程</p>
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-100 mt-1">
                    {processes.filter(p => p.level === 'large').length}
                  </p>
                </div>
                <div className="p-2 bg-blue-500 bg-opacity-20 rounded-lg">
                  <ChartBarIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  color="primary"
                  variant="flat"
                  className="flex-1 font-medium"
                  startContent={<PlusIcon className="w-4 h-4" />}
                  onPress={() => handleProcessCreate(null, 'large')}
                >
                  追加
                </Button>
                <Button
                  size="sm"
                  color="primary"
                  variant="bordered"
                  isIconOnly
                  onPress={() => handleExportLevel('large')}
                  title="大工程をエクスポート"
                >
                  <ArrowDownTrayIcon className="w-4 h-4" />
                </Button>
              </div>
            </CardBody>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-none shadow-md">
            <CardBody className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs font-medium text-green-700 dark:text-green-300">中工程</p>
                  <p className="text-2xl font-bold text-green-900 dark:text-green-100 mt-1">
                    {processes.filter(p => p.level === 'medium').length}
                  </p>
                </div>
                <div className="p-2 bg-green-500 bg-opacity-20 rounded-lg">
                  <ChartBarIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  color="success"
                  variant="flat"
                  className="flex-1 font-medium"
                  startContent={<PlusIcon className="w-4 h-4" />}
                  onPress={() => handleProcessCreate(null, 'medium')}
                >
                  追加
                </Button>
                <Button
                  size="sm"
                  color="success"
                  variant="bordered"
                  isIconOnly
                  onPress={() => handleExportLevel('medium')}
                  title="中工程をエクスポート"
                >
                  <ArrowDownTrayIcon className="w-4 h-4" />
                </Button>
              </div>
            </CardBody>
          </Card>

          <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900 border-none shadow-md">
            <CardBody className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs font-medium text-amber-700 dark:text-amber-300">小工程</p>
                  <p className="text-2xl font-bold text-amber-900 dark:text-amber-100 mt-1">
                    {processes.filter(p => p.level === 'small').length}
                  </p>
                </div>
                <div className="p-2 bg-amber-500 bg-opacity-20 rounded-lg">
                  <ChartBarIcon className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  color="warning"
                  variant="flat"
                  className="flex-1 font-medium"
                  startContent={<PlusIcon className="w-4 h-4" />}
                  onPress={() => handleProcessCreate(null, 'small')}
                >
                  追加
                </Button>
                <Button
                  size="sm"
                  color="warning"
                  variant="bordered"
                  isIconOnly
                  onPress={() => handleExportLevel('small')}
                  title="小工程をエクスポート"
                >
                  <ArrowDownTrayIcon className="w-4 h-4" />
                </Button>
              </div>
            </CardBody>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-none shadow-md">
            <CardBody className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs font-medium text-purple-700 dark:text-purple-300">詳細工程</p>
                  <p className="text-2xl font-bold text-purple-900 dark:text-purple-100 mt-1">
                    {processes.filter(p => p.level === 'detail').length}
                  </p>
                </div>
                <div className="p-2 bg-purple-500 bg-opacity-20 rounded-lg">
                  <ChartBarIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  color="secondary"
                  variant="flat"
                  className="flex-1 font-medium"
                  startContent={<PlusIcon className="w-4 h-4" />}
                  onPress={() => handleProcessCreate(null, 'detail')}
                >
                  追加
                </Button>
                <Button
                  size="sm"
                  color="secondary"
                  variant="bordered"
                  isIconOnly
                  onPress={() => handleExportLevel('detail')}
                  title="詳細工程をエクスポート"
                >
                  <ArrowDownTrayIcon className="w-4 h-4" />
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* 工程表ビュー */}
        <Card className="shadow-lg border border-gray-200 dark:border-gray-700">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between w-full">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">工程管理</h2>
              <div className="flex items-center gap-3">
                <Chip 
                  size="sm" 
                  variant="flat"
                  className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                >
                  全{processes.length}件
                </Chip>
                <Tabs 
                  selectedKey={viewMode}
                  onSelectionChange={(key) => setViewMode(key as 'tree' | 'table')}
                  size="sm"
                  color="primary"
                  variant="bordered"
                >
                  <Tab
                    key="tree"
                    title={
                      <div className="flex items-center gap-2">
                        <ListBulletIcon className="w-4 h-4" />
                        <span>ツリー</span>
                      </div>
                    }
                  />
                  <Tab
                    key="table"
                    title={
                      <div className="flex items-center gap-2">
                        <TableCellsIcon className="w-4 h-4" />
                        <span>テーブル</span>
                      </div>
                    }
                  />
                </Tabs>
              </div>
            </div>
          </CardHeader>
          <CardBody className="p-6">
            {processes.length === 0 ? (
              <div className="text-center py-12">
                <Squares2X2Icon className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400 mb-4">工程がまだありません</p>
                <Button
                  color="primary"
                  variant="flat"
                  startContent={<PlusIcon className="w-5 h-5" />}
                  onPress={() => handleProcessCreate(null)}
                >
                  最初の工程を追加
                </Button>
              </div>
            ) : viewMode === 'tree' ? (
              <HierarchyTree
                projectId={projectId}
                processes={processes}
                onProcessMove={handleProcessMove}
                onProcessDelete={handleProcessDelete}
                onProcessEdit={handleProcessEdit}
                onProcessCreate={handleProcessCreate}
              />
            ) : (
              <IntegratedProcessTable
                processes={processes}
                onProcessUpdate={handleProcessUpdate}
                onProcessDelete={handleProcessDelete}
                onProcessCreate={handleProcessCreate}
                onProcessReorder={handleProcessReorder}
                onProcessMove={handleProcessMove}
                isLoading={isLoading}
              />
            )}
          </CardBody>
        </Card>
      </div>

      {/* 表示順変更モーダル */}
      <Modal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        title="表示順を変更"
        size="3xl"
      >
        <ProcessOrderManager
          processes={processes}
          onReorder={handleProcessReorder}
          onClose={handleReorderComplete}
        />
      </Modal>

      {/* 工程フォームモーダル */}
      <ProcessForm
        key={formKey}
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingProcess(null);
          setSelectedParentId(null);
          setPreselectedLevel(undefined);
        }}
        onSubmit={handleFormSubmit}
        process={editingProcess || undefined}
        projectId={projectId}
        parentId={selectedParentId || undefined}
        defaultLevel={preselectedLevel}
      />
    </AppLayout>
  );
}
