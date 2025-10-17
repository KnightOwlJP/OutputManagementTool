'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardBody, CardFooter, CardHeader, Input, Textarea, Spinner } from '@heroui/react';
import { MagnifyingGlassIcon, PlusIcon, TrashIcon, FolderIcon } from '@heroicons/react/24/outline';
import { AppLayout, Button, Modal, SkeletonCard } from '@/components';
import { useProjectStore } from '@/stores/projectStore';
import { projectIPC } from '@/lib/ipc-helpers';
import { Project } from '@/types/project.types';
import { useToast } from '@/contexts/ToastContext';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

export default function ProjectsPage() {
  console.log('[ProjectsPage] Component mounted');
  console.log('[ProjectsPage] Current URL:', typeof window !== 'undefined' ? window.location.href : 'SSR');
  
  const router = useRouter();
  const { projects, setProjects, setLoading, setError } = useProjectStore();
  const { showToast } = useToast();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nameError, setNameError] = useState('');

  const loadProjects = async () => {
    setLoading(true);
    
    const { data, error } = await projectIPC.getAll();
    
    if (error) {
      setError(error);
      showToast('error', `プロジェクトの読み込みに失敗しました: ${error}`);
      console.error('[Projects] Failed to load projects:', error);
    } else if (data) {
      setProjects(data);
    }
    
    setLoading(false);
  };

  // プロジェクト名のバリデーション
  const validateProjectName = (name: string): boolean => {
    if (!name.trim()) {
      setNameError('プロジェクト名を入力してください');
      return false;
    }
    if (name.length > 100) {
      setNameError('プロジェクト名は100文字以内で入力してください');
      return false;
    }
    setNameError('');
    return true;
  };

  // プロジェクト作成
  const handleCreateProject = async () => {
    if (!validateProjectName(newProjectName)) {
      showToast('warning', nameError);
      return;
    }

    setIsSubmitting(true);
    
    try {
      const { data, error } = await projectIPC.create({
        name: newProjectName.trim(),
        description: newProjectDescription.trim() || undefined,
      });

      if (error) {
        showToast('error', `プロジェクトの作成に失敗しました: ${error}`);
      } else if (data) {
        await loadProjects();
        setNewProjectName('');
        setNewProjectDescription('');
        setIsCreateModalOpen(false);
        showToast('success', 'プロジェクトを作成しました');
      }
    } catch (err) {
      showToast('error', `エラーが発生しました: ${err}`);
    }

    setIsSubmitting(false);
  };

  // プロジェクト削除
  const handleDeleteProject = async () => {
    if (!selectedProject) return;

    setIsSubmitting(true);
    const { data, error } = await projectIPC.delete(selectedProject.id);

    if (error) {
      showToast('error', `プロジェクトの削除に失敗しました: ${error}`);
    } else if (data) {
      await loadProjects();
      setIsDeleteModalOpen(false);
      setSelectedProject(null);
      showToast('success', 'プロジェクトを削除しました');
    }

    setIsSubmitting(false);
  };

  // プロジェクトをクリックして詳細画面へ
  const handleProjectClick = (projectId: string) => {
    console.log('[Projects] Navigating to project:', projectId);
    console.log('[Projects] Target path:', `/projects/${projectId}/`);
    console.log('[Projects] Current location:', window.location.href);
    
    // trailingSlash: true の設定に合わせてパスに / を追加
    const targetPath = `/projects/${projectId}/`;
    console.log('[Projects] Calling router.push with:', targetPath);
    
    router.push(targetPath);
    
    // 少し待ってから遷移後のURLを確認
    setTimeout(() => {
      console.log('[Projects] After navigation, location:', window.location.href);
    }, 100);
  };

  // 初期化時にプロジェクト一覧を読み込む
  useEffect(() => {
    loadProjects();
  }, []);

  // 検索フィルタリング
  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (project.description && project.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // キーボードショートカット
  useKeyboardShortcuts([
    {
      key: 'n',
      ctrl: true,
      callback: () => setIsCreateModalOpen(true),
      description: '新規プロジェクト作成',
    },
    {
      key: 'r',
      ctrl: true,
      callback: () => loadProjects(),
      description: 'プロジェクト一覧を更新',
    },
    {
      key: 'Escape',
      callback: () => {
        setIsCreateModalOpen(false);
        setIsDeleteModalOpen(false);
      },
      description: 'モーダルを閉じる',
    },
  ]);

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* ヘッダー */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">プロジェクト一覧</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">プロジェクトを作成・管理</p>
          </div>
          <Button
            color="primary"
            className="font-semibold shadow-md hover:shadow-lg transition-shadow whitespace-nowrap bg-blue-600 hover:bg-blue-700 text-white"
            startContent={<PlusIcon className="w-5 h-5" />}
            onPress={() => setIsCreateModalOpen(true)}
            size="md"
          >
            新規作成
          </Button>
        </div>

        {/* 検索バー */}
        <Input
          placeholder="プロジェクト名で検索..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          startContent={<MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />}
          variant="faded"
          size="lg"
          isClearable
          onClear={() => setSearchQuery('')}
        />

        {/* プロジェクトグリッド */}
        <div>
          {useProjectStore.getState().isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <FolderIcon className="w-16 h-16 mb-4" />
              <p className="text-base mb-2">
                {searchQuery ? '該当するプロジェクトがありません' : 'プロジェクトがありません'}
              </p>
              {!searchQuery && (
                <Button
                  color="primary"
                  variant="flat"
                  className="mt-4"
                  size="md"
                  onPress={() => setIsCreateModalOpen(true)}
                >
                  最初のプロジェクトを作成
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProjects.map((project) => (
                <Card
                  key={project.id}
                  isPressable
                  isHoverable
                  onPress={() => handleProjectClick(project.id)}
                  className="shadow-sm hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-700"
                >
                  <CardHeader className="flex flex-col items-start px-4 pt-4 pb-2">
                    <div className="flex items-start justify-between w-full">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="bg-blue-500 bg-opacity-10 p-2 rounded-lg flex-shrink-0">
                          <FolderIcon className="w-5 h-5 text-blue-500" />
                        </div>
                        <h3 className="text-base font-semibold line-clamp-1 text-gray-900 dark:text-gray-50">
                          {project.name}
                        </h3>
                      </div>
                      <button
                        className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-colors flex-shrink-0 ml-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedProject(project);
                          setIsDeleteModalOpen(true);
                        }}
                        title="削除"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </CardHeader>
                  <CardBody className="px-4 py-2">
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {project.description || '説明なし'}
                    </p>
                  </CardBody>
                  <CardFooter className="px-4 pb-3 pt-1">
                    <div className="text-xs text-gray-500 dark:text-gray-500">
                      更新: {new Date(project.updatedAt).toLocaleDateString('ja-JP')}
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 新規作成モーダル */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setNewProjectName('');
          setNewProjectDescription('');
          setNameError('');
        }}
        title="新しいプロジェクトを作成"
        size="2xl"
        showConfirmButton
        confirmText="作成"
        confirmColor="primary"
        onConfirm={handleCreateProject}
        isConfirmDisabled={!newProjectName.trim() || isSubmitting}
        isConfirmLoading={isSubmitting}
      >
        <div className="space-y-6">
          <Input
            label="プロジェクト名"
            placeholder="例: 業務改善プロジェクト"
            value={newProjectName}
            onChange={(e) => {
              setNewProjectName(e.target.value);
              validateProjectName(e.target.value);
            }}
            isRequired
            autoFocus
            isInvalid={!!nameError}
            errorMessage={nameError}
            variant="bordered"
            size="lg"
            labelPlacement="outside"
            isClearable
            maxLength={100}
          />
          
          <Textarea
            label="説明（任意）"
            placeholder="プロジェクトの概要を入力"
            value={newProjectDescription}
            onChange={(e) => setNewProjectDescription(e.target.value)}
            minRows={3}
            maxRows={6}
            variant="bordered"
            size="lg"
            labelPlacement="outside"
          />
          
          <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
              💡 ヒント
            </p>
            <p className="text-xs text-blue-800 dark:text-blue-200">
              プロジェクト名は後から変更できます。まずは気軽に作成してみましょう。
            </p>
          </div>
        </div>
      </Modal>

      {/* 削除確認モーダル */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedProject(null);
        }}
        title="プロジェクトを削除"
        size="md"
        showConfirmButton
        confirmText="削除"
        confirmColor="danger"
        onConfirm={handleDeleteProject}
        isConfirmLoading={isSubmitting}
      >
        <div className="space-y-3">
          <p className="text-gray-700 dark:text-gray-300">
            プロジェクト「<strong className="text-gray-900 dark:text-gray-50">{selectedProject?.name}</strong>」を削除してもよろしいですか？
          </p>
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
            <p className="text-sm text-red-700 dark:text-red-400">
              ⚠️ この操作は取り消せません。プロジェクトに関連する工程やBPMNデータもすべて削除されます。
            </p>
          </div>
        </div>
      </Modal>
    </AppLayout>
  );
}
