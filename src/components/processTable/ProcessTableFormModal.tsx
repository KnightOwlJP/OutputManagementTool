/**
 * ProcessTable作成/編集モーダル（V2対応）
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
import { ProcessTable, ProcessLevel } from '@/types/models';

interface ProcessTableFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ProcessTableFormData) => Promise<void>;
  editData?: ProcessTable | null;
  projectId: string;
}

export interface ProcessTableFormData {
  name: string;
  level: ProcessLevel;
  description?: string;
}

const levelOptions = [
  { value: 'large' as ProcessLevel, label: '大工程' },
  { value: 'medium' as ProcessLevel, label: '中工程' },
  { value: 'small' as ProcessLevel, label: '小工程' },
  { value: 'detail' as ProcessLevel, label: '詳細' },
];

export function ProcessTableFormModal({
  isOpen,
  onClose,
  onSubmit,
  editData,
  projectId,
}: ProcessTableFormModalProps) {
  const [name, setName] = useState('');
  const [level, setLevel] = useState<ProcessLevel>('large');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ name?: string }>({});

  const isEditMode = !!editData;

  // 編集モードの場合、初期値をセット
  useEffect(() => {
    if (editData) {
      setName(editData.name);
      setLevel(editData.level);
      setDescription(editData.description || '');
    } else {
      setName('');
      setLevel('large');
      setDescription('');
    }
    setErrors({});
  }, [editData, isOpen]);

  const validate = (): boolean => {
    const newErrors: { name?: string } = {};

    if (!name.trim()) {
      newErrors.name = '工程表名を入力してください';
    } else if (name.length > 100) {
      newErrors.name = '工程表名は100文字以内で入力してください';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        level,
        description: description.trim() || undefined,
      });
      onClose();
    } catch (error) {
      console.error('Failed to submit:', error);
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
        <ModalHeader>
          {isEditMode ? '工程表を編集' : '新しい工程表を作成'}
        </ModalHeader>
        <ModalBody className="gap-4">
          <Input
            label="工程表名"
            placeholder="例: 営業プロセス"
            value={name}
            onValueChange={setName}
            isRequired
            isInvalid={!!errors.name}
            errorMessage={errors.name}
            isDisabled={isSubmitting}
          />

          <Select
            label="レベル"
            placeholder="レベルを選択"
            selectedKeys={[level]}
            onSelectionChange={(keys: 'all' | Set<React.Key>) => {
              if (keys !== 'all') {
                const selected = Array.from(keys)[0];
                setLevel(selected as ProcessLevel);
              }
            }}
            isRequired
            isDisabled={isSubmitting}
          >
            {levelOptions.map((option) => (
              <SelectItem key={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </Select>

          <Textarea
            label="説明"
            placeholder="工程表の説明を入力（任意）"
            value={description}
            onValueChange={setDescription}
            minRows={3}
            maxRows={8}
            isDisabled={isSubmitting}
          />

          <div className="text-sm text-gray-600">
            <p className="font-semibold mb-2">レベルの目安：</p>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>大工程</strong>: 部署・組織単位の大きな工程</li>
              <li><strong>中工程</strong>: プロセスグループ・フェーズ単位</li>
              <li><strong>小工程</strong>: 個別のプロセス・タスク単位</li>
              <li><strong>詳細</strong>: 詳細な手順・ステップ単位</li>
            </ul>
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
            {isEditMode ? '更新' : '作成'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
