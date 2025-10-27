'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Card, 
  CardBody, 
  CardHeader,
  Button as HeroButton,
  Input,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from '@heroui/react';
import { 
  BookOpenIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';
import { AppLayout, SkeletonCard } from '@/components';
import { Manual as ManualV2, Process } from '@/types/models';


export default function ManualEditorPage() {
  const params = useParams();
  const router = useRouter();

  // URLから実際のID を取得（静的エクスポート対応）
  const [manualId, setManualId] = useState<string>('');
  const [projectId, setProjectId] = useState<string>('');

  const [manual, setManual] = useState<ManualV2 | null>(null);
  const [processes, setProcesses] = useState<Process[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingContent, setEditingContent] = useState('');
  const [editingTitle, setEditingTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  // Phase 9: セクション機能は削除（未使用）
  // const [sections, setSections] = useState<ManualSection[]>([]);
  // const [selectedSection, setSelectedSection] = useState<ManualSection | null>(null);
  // const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  // const [isAddSectionModalOpen, setIsAddSectionModalOpen] = useState(false);
  // const [newSectionTitle, setNewSectionTitle] = useState('');
  // const [newSectionProcessId, setNewSectionProcessId] = useState<string>('');
  // const [newSectionParentId, setNewSectionParentId] = useState<string | null>(null);
  

  /**
   * URLからプロジェクトIDとマニュアルIDを抽出
   */
  useEffect(() => {
    const extractIds = () => {
      if (typeof window === 'undefined') return;
      
      const pathname = window.location.pathname;
      const match = pathname.match(/\/projects\/([^\/]+)\/manuals\/([^\/]+)/);
      const extractedProjectId = match ? match[1] : (params.id as string);
      const extractedManualId = match ? match[2] : (params.manualId as string);
      
      // placeholderの場合は待機（Electronのhistory.replaceStateを待つ）
      if (extractedProjectId === 'placeholder' || extractedManualId === 'placeholder') {
        setTimeout(extractIds, 100);
        return;
      }
      
      setProjectId(extractedProjectId);
      setManualId(extractedManualId);
    };

    extractIds();
  }, [params]);

  useEffect(() => {
    if (manualId && projectId) {
      loadManual();
    }
  }, [manualId, projectId]);

  const loadManual = async () => {
    setIsLoading(true);
    try {
      // Phase 9: マニュアルは工程表と1対1の関係
      // マニュアル情報を取得
      const currentManual = await window.electronAPI.manualTable.getById(manualId);
      
      if (!currentManual) {
        alert('マニュアルが見つかりません');
        router.push(`/projects/${projectId}/manuals`);
        return;
      }
      
      setManual(currentManual);
      
      // 工程表に紐づく工程を取得（コンテンツ生成用）
      if (currentManual.processTableId) {
        const { processIPC } = await import('@/lib/ipc-helpers');
        const { data: processesData } = await processIPC.getByProcessTable(currentManual.processTableId);
        setProcesses(processesData || []);
      } else {
        setProcesses([]);
      }
      
      // Phase 9: マニュアルはMarkdownコンテンツを直接編集
      setEditingTitle(currentManual.name);
      setEditingContent(currentManual.content || '');
      
    } catch (error) {
      console.error('[ManualEditor] Failed to load manual:', error);
      alert('マニュアルの読み込みに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSection = async () => {
    if (!manual) return;
    
    setIsSaving(true);
    try {
      // Phase 9: マニュアルのcontent（Markdown）を直接更新
      await window.electronAPI.manualTable.update(manual.id, {
        name: editingTitle,
        content: editingContent,
      });
      
      // ローカル状態を更新
      setManual({
        ...manual,
        name: editingTitle,
        content: editingContent,
      });
      
      alert('保存しました');
    } catch (error) {
      console.error('[ManualEditor] Failed to save manual:', error);
      alert('保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddSection = async () => {
    // TODO: Phase 9ではセクション機能は工程表から自動生成
    // 現在は未実装
    alert('セクション機能は今後実装予定です');
  };

  const handleDeleteSection = async (sectionId: string) => {
    // TODO: Phase 9ではセクション機能は工程表から自動生成
    // 現在は未実装
    alert('セクション機能は今後実装予定です');
  };

  const handleSyncWithProcesses = async () => {
    if (!manual) return;
    
    try {
      // Phase 9では工程表から自動生成
      alert('この機能は今後のアップデートで実装予定です。\n現在は手動でマニュアルを更新してください。');
      await loadManual();
    } catch (error) {
      console.error('[ManualEditor] Failed to sync:', error);
      alert('同期に失敗しました');
    }
  };

  const handleExport = async (format: 'markdown' | 'html' | 'pdf') => {
    if (!manual) return;
    
    try {
      // Markdownエクスポート
      if (format === 'markdown') {
        const content = `# ${manual.name}\n\n${manual.content || ''}`;
        const blob = new Blob([content], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${manual.name}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        alert('Markdown形式でエクスポートしました');
      } 
      // HTML/PDFエクスポート
      else if (format === 'html' || format === 'pdf') {
        // TODO: サーバーサイドでMarkdown→HTML変換が必要
        alert(`${format.toUpperCase()}形式のエクスポート機能は今後実装予定です`);
      }
    } catch (error) {
      console.error('[ManualEditor] Failed to export:', error);
      alert('エクスポートに失敗しました');
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <SkeletonCard />
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-3">
              <SkeletonCard />
            </div>
            <div className="col-span-9">
              <SkeletonCard />
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!manual) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-full">
          <p className="text-lg text-gray-500">マニュアルが見つかりません</p>
          <HeroButton
            color="primary"
            className="mt-4"
            onClick={() => router.push(`/projects/${projectId}/manuals`)}
          >
            マニュアル一覧に戻る
          </HeroButton>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* ヘッダー */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <HeroButton
              variant="light"
              onClick={() => router.push(`/projects/${projectId}/manuals`)}
              startContent={<span className="text-xl">←</span>}
            >
              マニュアル一覧に戻る
            </HeroButton>
            <div className="border-l border-gray-300 dark:border-gray-700 h-6 mx-2" />
            <BookOpenIcon className="w-8 h-8 text-blue-500" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">
                {manual.name}
              </h1>
            </div>
          </div>

          <div className="flex gap-2">
            <Dropdown>
              <DropdownTrigger>
                <HeroButton
                  variant="bordered"
                  startContent={<ArrowDownTrayIcon className="w-5 h-5" />}
                >
                  エクスポート
                </HeroButton>
              </DropdownTrigger>
              <DropdownMenu
                aria-label="エクスポート形式"
                onAction={(key) => handleExport(key as 'markdown' | 'html' | 'pdf')}
              >
                <DropdownItem key="markdown">Markdown</DropdownItem>
                <DropdownItem key="html">HTML</DropdownItem>
                <DropdownItem key="pdf">PDF</DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>
        </div>

        {/* メインコンテンツ - Phase 9: 単一マークダウンコンテンツエディタ */}
        <div>
          <Card className="shadow-sm">
            <CardHeader className="p-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                マニュアル編集
              </h3>
            </CardHeader>
            <CardBody className="p-4 space-y-4">
              <Input
                value={editingTitle}
                onChange={(e) => setEditingTitle(e.target.value)}
                placeholder="マニュアルタイトル"
                classNames={{
                  input: "text-lg font-semibold",
                  inputWrapper: "shadow-none",
                }}
              />
              <textarea
                value={editingContent}
                onChange={(e) => setEditingContent(e.target.value)}
                placeholder="Markdown形式で内容を入力してください"
                rows={25}
                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-50 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm"
              />
              
              <div className="flex justify-between items-center">
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  最終更新: {manual.updatedAt ? new Date(manual.updatedAt).toLocaleString('ja-JP') : '未保存'}
                </div>
                <HeroButton
                  color="primary"
                  onClick={handleSaveSection}
                  disabled={isSaving}
                >
                  {isSaving ? '保存中...' : '保存'}
                </HeroButton>
              </div>
            </CardBody>
          </Card>
        </div>

      </div>
    </AppLayout>
  );
}
