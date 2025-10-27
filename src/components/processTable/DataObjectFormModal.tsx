/**
 * データオブジェクト作成・編集モーダル
 * BPMN 2.0のデータオブジェクトを管理するためのフォーム
 */

'use client';

import { useState, useEffect } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Textarea,
  Select,
  SelectItem,
} from '@heroui/react';
import { DataObject } from '@/types/models';

interface DataObjectFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  dataObject: DataObject | null;
  onSubmit: (data: {
    name: string;
    type: 'input' | 'output' | 'both';
    description?: string;
  }) => Promise<void>;
}

const DATA_OBJECT_TYPES = [
  { key: 'input', label: '入力' },
  { key: 'output', label: '出力' },
  { key: 'both', label: '入出力' },
];

export function DataObjectFormModal({
  isOpen,
  onClose,
  dataObject,
  onSubmit,
}: DataObjectFormModalProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<'input' | 'output' | 'both'>('input');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 編集時はデータオブジェクト情報をセット
  useEffect(() => {
    if (dataObject) {
      setName(dataObject.name);
      setType(dataObject.type);
      setDescription(dataObject.description || '');
    } else {
      // 新規作成時はリセット
      setName('');
      setType('input');
      setDescription('');
    }
    setError(null);
  }, [dataObject, isOpen]);

  const handleSubmit = async () => {
    // バリデーション
    if (!name.trim()) {
      setError('名前を入力してください');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit({
        name: name.trim(),
        type,
        description: description.trim() || undefined,
      });
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : '保存に失敗しました';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="2xl"
      scrollBehavior="inside"
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          {dataObject ? 'データオブジェクトを編集' : '新しいデータオブジェクトを追加'}
        </ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            {/* エラー表示 */}
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {/* 名前 */}
            <Input
              label="名前"
              placeholder="例: 注文データ"
              value={name}
              onValueChange={setName}
              isRequired
              isDisabled={isSubmitting}
              description="データオブジェクトの名前を入力してください"
            />

            {/* タイプ */}
            <Select
              label="タイプ"
              placeholder="タイプを選択"
              selectedKeys={[type]}
              onSelectionChange={(keys) => {
                const value = Array.from(keys)[0] as 'input' | 'output' | 'both';
                setType(value || 'input');
              }}
              isRequired
              isDisabled={isSubmitting}
              description="データオブジェクトの入出力タイプを選択してください"
            >
              {DATA_OBJECT_TYPES.map((item) => (
                <SelectItem key={item.key}>
                  {item.label}
                </SelectItem>
              ))}
            </Select>

            {/* 説明 */}
            <Textarea
              label="説明"
              placeholder="このデータオブジェクトの説明を入力..."
              value={description}
              onValueChange={setDescription}
              isDisabled={isSubmitting}
              minRows={3}
              maxRows={6}
              description="データオブジェクトの詳細や用途を記述してください（任意）"
            />
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            color="danger"
            variant="light"
            onPress={handleClose}
            isDisabled={isSubmitting}
          >
            キャンセル
          </Button>
          <Button
            color="primary"
            onPress={handleSubmit}
            isLoading={isSubmitting}
          >
            {dataObject ? '更新' : '作成'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
