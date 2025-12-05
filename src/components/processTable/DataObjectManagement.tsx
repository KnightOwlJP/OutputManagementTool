/**
 * データオブジェクト管理コンポーネント
 * データオブジェクトの一覧表示・追加・編集・削除機能を提供
 */

'use client';

import { useState, useEffect } from 'react';
import {
  Button,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Tooltip,
} from '@heroui/react';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { DataObject } from '@/types/models';
import { dataObjectIPC } from '@/lib/ipc-helpers';
import { useToast } from '@/contexts/ToastContext';
import { DataObjectFormModal } from './DataObjectFormModal';
import { useDisclosure } from '@heroui/react';

interface DataObjectManagementProps {
  processTableId: string;
  onUpdate: () => void;
}

// データタイプの表示名とカラー
const TYPE_CONFIG: Record<string, { label: string; color: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' }> = {
  input: { label: '入力', color: 'primary' },
  output: { label: '出力', color: 'success' },
  both: { label: '入出力', color: 'secondary' },
};

export function DataObjectManagement({
  processTableId,
  onUpdate,
}: DataObjectManagementProps) {
  const { showToast } = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [dataObjects, setDataObjects] = useState<DataObject[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingDataObject, setEditingDataObject] = useState<DataObject | null>(null);

  // データオブジェクト一覧を読み込む
  const loadDataObjects = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await dataObjectIPC.getByProcessTable(processTableId);
      if (error) {
        console.error('[DataObjectManagement] Failed to load data objects:', error);
        // データが存在しない場合は空配列を設定（新規工程表の場合は正常なのでエラー表示しない）
        setDataObjects([]);
        return;
      }
      // データが存在しない場合は空配列を設定（新規工程表の場合は正常）
      setDataObjects(data || []);
    } catch (error) {
      console.error('[DataObjectManagement] Failed to load data objects:', error);
      // 読み込み失敗時のみエラーを表示
      showToast('error', 'データオブジェクトの読み込み中にエラーが発生しました');
      setDataObjects([]);
    } finally {
      setIsLoading(false);
    }
  };

  // 初回読み込み
  useEffect(() => {
    loadDataObjects();
  }, [processTableId]);

  // 新規作成
  const handleCreate = () => {
    setEditingDataObject(null);
    onOpen();
  };

  // 編集
  const handleEdit = (dataObject: DataObject) => {
    setEditingDataObject(dataObject);
    onOpen();
  };

  // データオブジェクト作成・更新処理
  const handleSubmit = async (data: { name: string; type: 'input' | 'output' | 'both'; description?: string }) => {
    try {
      if (editingDataObject) {
        // 更新
        const { error } = await dataObjectIPC.update(editingDataObject.id, data);
        if (error) {
          throw new Error(error);
        }
        showToast('success', 'データオブジェクトを更新しました');
      } else {
        // 作成
        const { error } = await dataObjectIPC.create(processTableId, data);
        if (error) {
          throw new Error(error);
        }
        showToast('success', 'データオブジェクトを作成しました');
      }

      loadDataObjects();
      onUpdate();
    } catch (error) {
      throw error; // モーダル側でエラーハンドリング
    }
  };

  // データオブジェクト削除
  const handleDelete = async (dataObjectId: string) => {
    if (!confirm('このデータオブジェクトを削除してもよろしいですか?')) return;

    try {
      const { error } = await dataObjectIPC.delete(dataObjectId);
      if (error) {
        showToast('error', `データオブジェクトの削除に失敗しました: ${error}`);
        return;
      }

      showToast('success', 'データオブジェクトを削除しました');
      loadDataObjects();
      onUpdate();
    } catch (error) {
      console.error('[DataObjectManagement] Failed to delete data object:', error);
      showToast('error', 'データオブジェクトの削除中にエラーが発生しました');
    }
  };

  return (
    <div className="space-y-4">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-50">
            データオブジェクト管理
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            BPMNで使用するデータオブジェクトを管理します
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            color="default"
            size="sm"
            startContent={<ArrowPathIcon className="w-4 h-4" />}
            onPress={loadDataObjects}
            isLoading={isLoading}
          >
            更新
          </Button>
          <Button
            color="primary"
            size="sm"
            startContent={<PlusIcon className="w-4 h-4" />}
            onPress={handleCreate}
          >
            新しいデータオブジェクトを追加
          </Button>
        </div>
      </div>

      {/* データオブジェクト一覧テーブル */}
      <Table
        aria-label="データオブジェクト一覧"
        classNames={{
          wrapper: "min-h-[300px]",
        }}
      >
        <TableHeader>
          <TableColumn>名前</TableColumn>
          <TableColumn>タイプ</TableColumn>
          <TableColumn>説明</TableColumn>
          <TableColumn width={100}>操作</TableColumn>
        </TableHeader>
        <TableBody
          items={dataObjects}
          isLoading={isLoading}
          emptyContent={
            <div className="text-center py-8">
              <p className="text-gray-500">データオブジェクトがありません</p>
              <Button
                color="primary"
                size="sm"
                className="mt-4"
                startContent={<PlusIcon className="w-4 h-4" />}
                onPress={handleCreate}
              >
                最初のデータオブジェクトを追加
              </Button>
            </div>
          }
        >
          {(item) => (
            <TableRow key={item.id}>
              <TableCell>
                <div className="font-medium text-gray-900 dark:text-gray-50">
                  {item.name}
                </div>
              </TableCell>
              <TableCell>
                <Chip
                  color={TYPE_CONFIG[item.type]?.color || 'default'}
                  size="sm"
                  variant="flat"
                >
                  {TYPE_CONFIG[item.type]?.label || item.type}
                </Chip>
              </TableCell>
              <TableCell>
                <div className="text-sm text-gray-600 dark:text-gray-400 max-w-md truncate">
                  {item.description || '-'}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Tooltip content="編集">
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      onPress={() => handleEdit(item)}
                    >
                      <PencilIcon className="w-4 h-4" />
                    </Button>
                  </Tooltip>
                  <Tooltip content="削除" color="danger">
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      color="danger"
                      onPress={() => handleDelete(item.id)}
                    >
                      <TrashIcon className="w-4 h-4" />
                    </Button>
                  </Tooltip>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* データオブジェクト作成・編集モーダル */}
      <DataObjectFormModal
        isOpen={isOpen}
        onClose={onClose}
        dataObject={editingDataObject}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
