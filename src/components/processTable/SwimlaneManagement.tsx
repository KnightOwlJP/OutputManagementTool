/**
 * スイムレーン管理コンポーネント
 * スイムレーンの追加・編集・削除・並び替え機能を提供
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
import { Swimlane } from '@/types/models';
import { processTableIPC } from '@/lib/ipc-helpers';
import { useToast } from '@/contexts/ToastContext';

interface SwimlaneManagementProps {
  processTableId: string;
  swimlanes: Swimlane[];
  onUpdate: () => void;
}

const DEFAULT_COLORS = [
  '#3B82F6', // blue
  '#10B981', // green
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#06B6D4', // cyan
  '#84CC16', // lime
];

export function SwimlaneManagement({ processTableId, swimlanes, onUpdate }: SwimlaneManagementProps) {
  const { showToast } = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [color, setColor] = useState(DEFAULT_COLORS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // モーダルを開く
  const openModal = (swimlane?: Swimlane) => {
    if (swimlane) {
      setEditingId(swimlane.id);
      setName(swimlane.name);
      setColor(swimlane.color || DEFAULT_COLORS[0]);
    } else {
      setEditingId(null);
      setName('');
      setColor(DEFAULT_COLORS[swimlanes.length % DEFAULT_COLORS.length]);
    }
    onOpen();
  };

  // モーダルを閉じる
  const closeModal = () => {
    setEditingId(null);
    setName('');
    setColor(DEFAULT_COLORS[0]);
    onClose();
  };

  // 保存
  const handleSave = async () => {
    if (!name.trim()) {
      showToast('warning', 'スイムレーン名を入力してください');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingId) {
        // 更新
        const { error } = await processTableIPC.updateSwimlane(editingId, {
          name: name.trim(),
          color,
        });
        if (error) {
          showToast('error', `更新に失敗しました: ${error}`);
          return;
        }
        showToast('success', 'スイムレーンを更新しました');
      } else {
        // 新規作成
        const { error } = await processTableIPC.createSwimlane(processTableId, {
          name: name.trim(),
          color,
          displayOrder: swimlanes.length,
        });
        if (error) {
          showToast('error', `作成に失敗しました: ${error}`);
          return;
        }
        showToast('success', 'スイムレーンを作成しました');
      }
      closeModal();
      onUpdate();
    } catch (error) {
      console.error('Failed to save swimlane:', error);
      showToast('error', '保存に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 削除
  const handleDelete = async (id: string, swimlaneName: string) => {
    if (!confirm(`スイムレーン「${swimlaneName}」を削除してもよろしいですか？\n\n関連する工程も削除されます。`)) {
      return;
    }

    try {
      const { error } = await processTableIPC.deleteSwimlane(id);
      if (error) {
        showToast('error', `削除に失敗しました: ${error}`);
        return;
      }
      showToast('success', 'スイムレーンを削除しました');
      onUpdate();
    } catch (error) {
      console.error('Failed to delete swimlane:', error);
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

    const newSwimlanes = [...swimlanes];
    const draggedItem = newSwimlanes[draggedIndex];
    newSwimlanes.splice(draggedIndex, 1);
    newSwimlanes.splice(index, 0, draggedItem);

    setDraggedIndex(index);
  };

  // ドロップ
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    if (draggedIndex === null) return;

    try {
      // 新しい順序でIDの配列を作成
      const orderedIds = swimlanes.map((s) => s.id);
      const { error } = await processTableIPC.reorderSwimlanes(processTableId, orderedIds);
      if (error) {
        showToast('error', `並び替えに失敗しました: ${error}`);
        return;
      }
      showToast('success', 'スイムレーンの順序を変更しました');
      onUpdate();
    } catch (error) {
      console.error('Failed to reorder swimlanes:', error);
      showToast('error', '並び替えに失敗しました');
    } finally {
      setDraggedIndex(null);
    }
  };

  return (
    <>
      {/* ヘッダー */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">スイムレーン管理</h3>
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
      {swimlanes.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>スイムレーンがありません</p>
          <p className="text-sm mt-2">「追加」ボタンから作成してください</p>
        </div>
      ) : (
        <div className="space-y-2">
          {swimlanes.map((swimlane, index) => (
            <div
              key={swimlane.id}
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
                <div
                  className="w-6 h-6 rounded"
                  style={{ backgroundColor: swimlane.color }}
                />
                <span className="font-medium">{swimlane.name}</span>
                <span className="text-xs text-gray-500">（順序: {swimlane.order + 1}）</span>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="light"
                  isIconOnly
                  onPress={() => openModal(swimlane)}
                >
                  <PencilIcon className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="light"
                  color="danger"
                  isIconOnly
                  onPress={() => handleDelete(swimlane.id, swimlane.name)}
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
          <ModalHeader>{editingId ? 'スイムレーン編集' : 'スイムレーン追加'}</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Input
                label="スイムレーン名"
                placeholder="例: 企画部門、開発部門"
                value={name}
                onValueChange={setName}
                isRequired
                autoFocus
              />
              <div>
                <label className="text-sm font-medium mb-2 block">色</label>
                <div className="flex gap-2 flex-wrap">
                  {DEFAULT_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setColor(c)}
                      className={`
                        w-10 h-10 rounded-lg border-2 transition-all
                        ${color === c ? 'border-gray-900 dark:border-white scale-110' : 'border-transparent'}
                      `}
                      style={{ backgroundColor: c }}
                      title={c}
                    />
                  ))}
                </div>
              </div>
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
