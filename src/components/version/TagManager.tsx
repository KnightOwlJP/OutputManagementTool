'use client';

import React, { useState } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Chip,
} from '@heroui/react';

interface TagManagerProps {
  isOpen: boolean;
  onClose: () => void;
  availableTags: string[];
  onCreateTag: (tag: string) => void;
  onDeleteTag: (tag: string) => void;
}

export function TagManager({
  isOpen,
  onClose,
  availableTags,
  onCreateTag,
  onDeleteTag,
}: TagManagerProps) {
  const [newTag, setNewTag] = useState('');
  const [error, setError] = useState('');

  /**
   * タグ作成
   */
  const handleCreate = () => {
    const tag = newTag.trim();

    if (!tag) {
      setError('タグ名を入力してください');
      return;
    }

    if (availableTags.includes(tag)) {
      setError('このタグは既に存在します');
      return;
    }

    onCreateTag(tag);
    setNewTag('');
    setError('');
  };

  /**
   * タグ削除確認
   */
  const handleDelete = (tag: string) => {
    const confirmed = confirm(
      `タグ「${tag}」を削除しますか？\n\n` +
      `このタグを使用しているバージョンからも削除されます。`
    );

    if (confirmed) {
      onDeleteTag(tag);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl">
      <ModalContent>
        <ModalHeader>
          <h3 className="text-xl font-semibold">タグ管理</h3>
        </ModalHeader>
        <ModalBody className="space-y-4">
          {/* 新規タグ作成 */}
          <div>
            <h4 className="font-semibold mb-2">新しいタグを作成</h4>
            <div className="flex gap-2">
              <Input
                placeholder="タグ名（例: v1.0, release, stable）"
                value={newTag}
                onChange={(e) => {
                  setNewTag(e.target.value);
                  setError('');
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleCreate();
                  }
                }}
                isInvalid={!!error}
                errorMessage={error}
              />
              <Button color="primary" onPress={handleCreate}>
                作成
              </Button>
            </div>
          </div>

          {/* 既存タグ一覧 */}
          <div>
            <h4 className="font-semibold mb-2">既存のタグ</h4>
            {availableTags.length === 0 ? (
              <p className="text-gray-600">タグがまだ作成されていません</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {availableTags.map((tag) => (
                  <Chip
                    key={tag}
                    onClose={() => handleDelete(tag)}
                    variant="flat"
                    color="primary"
                  >
                    {tag}
                  </Chip>
                ))}
              </div>
            )}
          </div>

          {/* 使用方法 */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h5 className="font-semibold text-sm mb-2">タグの使い方</h5>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• バージョン作成時にタグを選択できます</li>
              <li>• タグでバージョンをフィルタリングできます</li>
              <li>• よく使うタグ例: v1.0, v2.0, release, hotfix, stable</li>
            </ul>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onClose}>
            閉じる
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
