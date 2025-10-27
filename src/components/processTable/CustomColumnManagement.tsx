/**
 * カスタム列管理コンポーネント
 * カスタム列の追加・編集・削除機能を提供
 */

'use client';

import { useState } from 'react';
import {
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Select,
  SelectItem,
  Textarea,
  Chip,
  useDisclosure,
} from '@heroui/react';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { CustomColumn } from '@/types/models';
import { processTableIPC } from '@/lib/ipc-helpers';
import { useToast } from '@/contexts/ToastContext';

interface CustomColumnManagementProps {
  processTableId: string;
  customColumns: CustomColumn[];
  onUpdate: () => void;
}

const COLUMN_TYPES = [
  { key: 'TEXT', label: 'テキスト' },
  { key: 'NUMBER', label: '数値' },
  { key: 'DATE', label: '日付' },
  { key: 'SELECT', label: '選択肢' },
  { key: 'CHECKBOX', label: 'チェックボックス' },
];

export function CustomColumnManagement({ processTableId, customColumns, onUpdate }: CustomColumnManagementProps) {
  const { showToast } = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [columnType, setColumnType] = useState('TEXT');
  const [options, setOptions] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // モーダルを開く
  const openModal = (column?: CustomColumn) => {
    if (column) {
      setEditingId(column.id);
      setName(column.name);
      setColumnType(column.type);
      setOptions(column.options?.join(',') || '');
    } else {
      setEditingId(null);
      setName('');
      setColumnType('TEXT');
      setOptions('');
    }
    onOpen();
  };

  // モーダルを閉じる
  const closeModal = () => {
    setEditingId(null);
    setName('');
    setColumnType('TEXT');
    setOptions('');
    onClose();
  };

  // 保存
  const handleSave = async () => {
    if (!name.trim()) {
      showToast('warning', '列名を入力してください');
      return;
    }

    if (columnType === 'SELECT' && !options.trim()) {
      showToast('warning', '選択肢を入力してください');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingId) {
        // 更新
        const { error } = await processTableIPC.updateCustomColumn(editingId, {
          name: name.trim(),
          columnType,
          options: columnType === 'SELECT' ? options.trim() : undefined,
        });
        if (error) {
          showToast('error', `更新に失敗しました: ${error}`);
          return;
        }
        showToast('success', 'カスタム列を更新しました');
      } else {
        // 新規作成
        const { error } = await processTableIPC.createCustomColumn(processTableId, {
          name: name.trim(),
          columnType,
          displayOrder: customColumns.length,
          options: columnType === 'SELECT' ? options.trim() : undefined,
        });
        if (error) {
          showToast('error', `作成に失敗しました: ${error}`);
          return;
        }
        showToast('success', 'カスタム列を作成しました');
      }
      closeModal();
      onUpdate();
    } catch (error) {
      console.error('Failed to save custom column:', error);
      showToast('error', '保存に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 削除
  const handleDelete = async (id: string, columnName: string) => {
    if (!confirm(`カスタム列「${columnName}」を削除してもよろしいですか？\n\n関連するデータも削除されます。`)) {
      return;
    }

    try {
      const { error } = await processTableIPC.deleteCustomColumn(id);
      if (error) {
        showToast('error', `削除に失敗しました: ${error}`);
        return;
      }
      showToast('success', 'カスタム列を削除しました');
      onUpdate();
    } catch (error) {
      console.error('Failed to delete custom column:', error);
      showToast('error', '削除に失敗しました');
    }
  };

  // 列タイプのラベル取得
  const getTypeLabel = (type: string) => {
    return COLUMN_TYPES.find((t) => t.key === type)?.label || type;
  };

  // 列タイプの色取得
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'TEXT':
        return 'default';
      case 'NUMBER':
        return 'primary';
      case 'DATE':
        return 'secondary';
      case 'SELECT':
        return 'success';
      case 'CHECKBOX':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <>
      {/* ヘッダー */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">カスタム列管理</h3>
        <Button
          color="primary"
          size="sm"
          startContent={<PlusIcon className="w-4 h-4" />}
          onPress={() => openModal()}
        >
          追加
        </Button>
      </div>

      {/* リスト */}
      {customColumns.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>カスタム列がありません</p>
          <p className="text-sm mt-2">「追加」ボタンから作成してください</p>
        </div>
      ) : (
        <div className="space-y-2">
          {customColumns.map((column) => (
            <div
              key={column.id}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <div className="flex items-center gap-3 flex-1">
                <Chip
                  size="sm"
                  color={getTypeColor(column.type) as any}
                  variant="flat"
                >
                  {getTypeLabel(column.type)}
                </Chip>
                <span className="font-medium">{column.name}</span>
                {column.options && column.options.length > 0 && (
                  <span className="text-xs text-gray-500">
                    （選択肢: {column.options.join(', ')}）
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="light"
                  isIconOnly
                  onPress={() => openModal(column)}
                >
                  <PencilIcon className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="light"
                  color="danger"
                  isIconOnly
                  onPress={() => handleDelete(column.id, column.name)}
                >
                  <TrashIcon className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 作成・編集モーダル */}
      <Modal isOpen={isOpen} onClose={closeModal} size="md">
        <ModalContent>
          <ModalHeader>{editingId ? 'カスタム列編集' : 'カスタム列追加'}</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Input
                label="列名"
                placeholder="例: 優先度、ステータス、担当者"
                value={name}
                onValueChange={setName}
                isRequired
                autoFocus
              />
              <Select
                label="データ型"
                placeholder="データ型を選択"
                selectedKeys={[columnType]}
                onSelectionChange={(keys) => {
                  const value = Array.from(keys)[0] as string;
                  setColumnType(value);
                  if (value !== 'SELECT') {
                    setOptions('');
                  }
                }}
                isRequired
              >
                {COLUMN_TYPES.map((type) => (
                  <SelectItem key={type.key}>{type.label}</SelectItem>
                ))}
              </Select>
              {columnType === 'SELECT' && (
                <Textarea
                  label="選択肢"
                  placeholder="カンマ区切りで入力（例: 高,中,低）"
                  value={options}
                  onValueChange={setOptions}
                  isRequired
                  description="カンマ（,）で区切って複数の選択肢を入力してください"
                />
              )}
              {columnType === 'NUMBER' && (
                <div className="text-xs text-gray-500 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  💡 数値型の列には数字のみ入力できます
                </div>
              )}
              {columnType === 'DATE' && (
                <div className="text-xs text-gray-500 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  💡 日付型の列には日付ピッカーが表示されます
                </div>
              )}
              {columnType === 'CHECKBOX' && (
                <div className="text-xs text-gray-500 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  💡 チェックボックス型の列にはON/OFFを設定できます
                </div>
              )}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={closeModal}>
              キャンセル
            </Button>
            <Button
              color="primary"
              onPress={handleSave}
              isLoading={isSubmitting}
              isDisabled={!name.trim() || (columnType === 'SELECT' && !options.trim())}
            >
              {editingId ? '更新' : '作成'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
