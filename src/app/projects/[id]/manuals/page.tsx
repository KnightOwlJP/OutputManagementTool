'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Button,
  Input,
  Textarea,
  Select,
  SelectItem,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Spinner,
  useDisclosure,
} from '@heroui/react';
import { 
  ArrowLeftIcon,
  BookOpenIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import { AppLayout } from '@/components';
import { ManualTableList } from '@/components/manual/ManualTableList';
import { useToast } from '@/contexts/ToastContext';
import { ManualTable, ProcessTable, ProcessLevel } from '@/types/project.types';

export default function ManualsPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  // URLから実際のプロジェクトIDを取得（静的エクスポート対応）
  const [projectId, setProjectId] = useState<string>('');
  const [manualTables, setManualTables] = useState<ManualTable[]>([]);
  const [processTables, setProcessTables] = useState<ProcessTable[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTable, setSelectedTable] = useState<ManualTable | null>(null);
  
  // フォーム状態
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    level: 'large' as ProcessLevel,
    processTableId: '',
  });

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

  useEffect(() => {
    if (projectId) {
      loadData();
    }
  }, [projectId]);

  /**
   * データ読み込み
   */
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [tables, processes] = await Promise.all([
        window.electronAPI.manualTable.getByProject(projectId),
        window.electronAPI.processTable.getByProject(projectId),
      ]);
      setManualTables(tables);
      setProcessTables(processes);
    } catch (error) {
      console.error('Failed to load data:', error);
      showToast('error', `データの読み込みに失敗しました: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * テーブル作成ハンドラ
   */
  const handleCreateTable = (level?: ProcessLevel) => {
    setSelectedTable(null);
    setFormData({
      name: '',
      description: '',
      level: level || 'large',
      processTableId: '',
    });
    onOpen();
  };

  /**
   * テーブル編集ハンドラ
   */
  const handleEditTable = (table: ManualTable) => {
    setSelectedTable(table);
    setFormData({
      name: table.name,
      description: table.description || '',
      level: table.level,
      processTableId: table.processTableId || '',
    });
    onOpen();
  };

  /**
   * テーブル選択ハンドラ
   */
  const handleSelectTable = (tableId: string) => {
    router.push(`/projects/${projectId}/manuals/${tableId}`);
  };

  /**
   * テーブル削除ハンドラ
   */
  const handleDeleteTable = async (tableId: string) => {
    const table = manualTables.find(t => t.id === tableId);
    if (!table) return;

    if (!confirm(`「${table.name}」を削除しますか？\n関連するマニュアルもすべて削除されます。`)) {
      return;
    }

    try {
      await window.electronAPI.manualTable.delete(tableId);
      await loadData();
      showToast('success', 'マニュアルグループを削除しました');
    } catch (error) {
      console.error('Failed to delete manual table:', error);
      showToast('error', `削除に失敗しました: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  /**
   * フォーム送信ハンドラ
   */
  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      showToast('warning', 'グループ名を入力してください');
      return;
    }

    try {
      if (selectedTable) {
        // 更新
        await window.electronAPI.manualTable.update({
          id: selectedTable.id,
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          processTableId: formData.processTableId || undefined,
        });
        showToast('success', 'マニュアルグループを更新しました');
      } else {
        // 新規作成
        await window.electronAPI.manualTable.create({
          projectId,
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          level: formData.level,
          processTableId: formData.processTableId || undefined,
        });
        showToast('success', 'マニュアルグループを作成しました');
      }
      
      onClose();
      await loadData();
    } catch (error) {
      console.error('Failed to save manual table:', error);
      showToast('error', `保存に失敗しました: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  /**
   * 並び順変更ハンドラ
   */
  const handleReorder = async (tableId: string, newOrder: number) => {
    try {
      await window.electronAPI.manualTable.reorder({
        id: tableId,
        displayOrder: newOrder,
      });
      await loadData();
      showToast('success', '表示順を更新しました');
    } catch (error) {
      console.error('Failed to reorder manual table:', error);
      showToast('error', `並び順の変更に失敗しました: ${error instanceof Error ? error.message : String(error)}`);
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
        <div className="flex items-center justify-between">
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
                <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
                  <BookOpenIcon className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-50 dark:to-gray-300 bg-clip-text text-transparent">
                  マニュアルグループ管理
                </h1>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 ml-11">
                階層ごとのマニュアルグループを管理できます
              </p>
            </div>
          </div>
          <Button
            color="primary"
            size="lg"
            className="font-semibold shadow-lg"
            startContent={<PlusIcon className="w-5 h-5" />}
            onPress={() => handleCreateTable()}
          >
            グループ作成
          </Button>
        </div>

        {/* マニュアルテーブル一覧 */}
        <ManualTableList
          projectId={projectId}
          manualTables={manualTables}
          onCreateTable={handleCreateTable}
          onSelectTable={handleSelectTable}
          onDeleteTable={handleDeleteTable}
          onEditTable={handleEditTable}
        />
      </div>

      {/* マニュアルテーブル作成・編集モーダル */}
      <Modal isOpen={isOpen} onClose={onClose} size="2xl">
        <ModalContent>
          <ModalHeader>
            {selectedTable ? 'マニュアルグループ編集' : 'マニュアルグループ作成'}
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Input
                label="グループ名"
                placeholder="例: 大規模プロジェクトマニュアル"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                isRequired
                variant="bordered"
                labelPlacement="outside"
              />

              <Textarea
                label="説明（任意）"
                placeholder="このマニュアルグループの説明を入力"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                variant="bordered"
                labelPlacement="outside"
                minRows={3}
              />

              {!selectedTable && (
                <Select
                  label="階層レベル"
                  placeholder="階層を選択"
                  selectedKeys={[formData.level]}
                  onChange={(e) => setFormData({ ...formData, level: e.target.value as ProcessLevel })}
                  isRequired
                  variant="bordered"
                  labelPlacement="outside"
                >
                  <SelectItem key="large">大工程</SelectItem>
                  <SelectItem key="medium">中工程</SelectItem>
                  <SelectItem key="small">小工程</SelectItem>
                  <SelectItem key="detail">詳細工程</SelectItem>
                </Select>
              )}

              <Select
                label="連携する工程表グループ（任意）"
                placeholder="工程表グループを選択"
                selectedKeys={formData.processTableId ? [formData.processTableId] : []}
                onChange={(e) => setFormData({ ...formData, processTableId: e.target.value })}
                variant="bordered"
                labelPlacement="outside"
              >
                {processTables.map((table) => (
                  <SelectItem key={table.id}>
                    {table.name}
                  </SelectItem>
                ))}
              </Select>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="light"
              onPress={onClose}
            >
              キャンセル
            </Button>
            <Button
              color="primary"
              onPress={handleSubmit}
            >
              {selectedTable ? '更新' : '作成'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </AppLayout>
  );
}
