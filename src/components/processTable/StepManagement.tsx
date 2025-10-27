/**
 * ステップ管理コンポーネント
 * ステップの追加・編集・削除・並び替え機能を提供
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
  useDisclosure,
} from '@heroui/react';
import { PlusIcon, PencilIcon, TrashIcon, Bars3Icon } from '@heroicons/react/24/outline';
import { Step } from '@/types/models';
import { processTableIPC } from '@/lib/ipc-helpers';
import { useToast } from '@/contexts/ToastContext';

interface StepManagementProps {
  processTableId: string;
  steps: Step[];
  onUpdate: () => void;
}

export function StepManagement({ processTableId, steps, onUpdate }: StepManagementProps) {
  const { showToast } = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // モーダルを開く
  const openModal = (step?: Step) => {
    if (step) {
      setEditingId(step.id);
      setName(step.name);
    } else {
      setEditingId(null);
      setName('');
    }
    onOpen();
  };

  // モーダルを閉じる
  const closeModal = () => {
    setEditingId(null);
    setName('');
    onClose();
  };

  // 保存
  const handleSave = async () => {
    if (!name.trim()) {
      showToast('warning', 'ステップ名を入力してください');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingId) {
        // 更新
        const { error } = await processTableIPC.updateStep(editingId, {
          name: name.trim(),
        });
        if (error) {
          showToast('error', `更新に失敗しました: ${error}`);
          return;
        }
        showToast('success', 'ステップを更新しました');
      } else {
        // 新規作成
        const { error } = await processTableIPC.createStep(processTableId, {
          name: name.trim(),
          displayOrder: steps.length,
        });
        if (error) {
          showToast('error', `作成に失敗しました: ${error}`);
          return;
        }
        showToast('success', 'ステップを作成しました');
      }
      closeModal();
      onUpdate();
    } catch (error) {
      console.error('Failed to save step:', error);
      showToast('error', '保存に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 削除
  const handleDelete = async (id: string, stepName: string) => {
    if (!confirm(`ステップ「${stepName}」を削除してもよろしいですか？\n\n関連する工程も削除されます。`)) {
      return;
    }

    try {
      const { error } = await processTableIPC.deleteStep(id);
      if (error) {
        showToast('error', `削除に失敗しました: ${error}`);
        return;
      }
      showToast('success', 'ステップを削除しました');
      onUpdate();
    } catch (error) {
      console.error('Failed to delete step:', error);
      showToast('error', '削除に失敗しました');
    }
  };

  // ドラッグ開始
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  // ドラッグオーバー
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newSteps = [...steps];
    const draggedItem = newSteps[draggedIndex];
    newSteps.splice(draggedIndex, 1);
    newSteps.splice(index, 0, draggedItem);

    setDraggedIndex(index);
  };

  // ドロップ
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    if (draggedIndex === null) return;

    try {
      // 新しい順序でIDの配列を作成
      const orderedIds = steps.map((s) => s.id);
      const { error } = await processTableIPC.reorderSteps(processTableId, orderedIds);
      if (error) {
        showToast('error', `並び替えに失敗しました: ${error}`);
        return;
      }
      showToast('success', 'ステップの順序を変更しました');
      onUpdate();
    } catch (error) {
      console.error('Failed to reorder steps:', error);
      showToast('error', '並び替えに失敗しました');
    } finally {
      setDraggedIndex(null);
    }
  };

  return (
    <>
      {/* ヘッダー */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">ステップ管理</h3>
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
      {steps.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>ステップがありません</p>
          <p className="text-sm mt-2">「追加」ボタンから作成してください</p>
        </div>
      ) : (
        <div className="space-y-2">
          {steps.map((step, index) => (
            <div
              key={step.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={handleDrop}
              className={`
                flex items-center justify-between p-4 border rounded-lg
                hover:bg-gray-50 dark:hover:bg-gray-800
                cursor-move transition-all
                ${draggedIndex === index ? 'opacity-50' : ''}
              `}
            >
              <div className="flex items-center gap-3 flex-1">
                <Bars3Icon className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-500 font-mono w-8">#{index + 1}</span>
                <span className="font-medium">{step.name}</span>
                <span className="text-xs text-gray-500">（順序: {step.displayOrder + 1}）</span>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="light"
                  isIconOnly
                  onPress={() => openModal(step)}
                >
                  <PencilIcon className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="light"
                  color="danger"
                  isIconOnly
                  onPress={() => handleDelete(step.id, step.name)}
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
          <ModalHeader>{editingId ? 'ステップ編集' : 'ステップ追加'}</ModalHeader>
          <ModalBody>
            <Input
              label="ステップ名"
              placeholder="例: 計画、実行、確認、改善"
              value={name}
              onValueChange={setName}
              isRequired
              autoFocus
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={closeModal}>
              キャンセル
            </Button>
            <Button
              color="primary"
              onPress={handleSave}
              isLoading={isSubmitting}
              isDisabled={!name.trim()}
            >
              {editingId ? '更新' : '作成'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
