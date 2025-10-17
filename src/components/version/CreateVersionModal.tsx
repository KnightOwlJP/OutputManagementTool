'use client';

import React, { useState } from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input, Textarea } from '@heroui/react';
import { Version } from '@/types/project.types';

interface CreateVersionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { message: string; tag?: string; author?: string }) => Promise<void>;
  projectId: string;
}

export function CreateVersionModal({
  isOpen,
  onClose,
  onSubmit,
  projectId,
}: CreateVersionModalProps) {
  const [message, setMessage] = useState('');
  const [tag, setTag] = useState('');
  const [author, setAuthor] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    // バリデーション
    if (!message.trim()) {
      setError('変更内容の説明を入力してください');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit({
        message: message.trim(),
        tag: tag.trim() || undefined,
        author: author.trim() || undefined,
      });

      // フォームをリセット
      setMessage('');
      setTag('');
      setAuthor('');
      onClose();
    } catch (err) {
      console.error('Failed to create version:', err);
      setError(err instanceof Error ? err.message : '予期しないエラーが発生しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setMessage('');
      setTag('');
      setAuthor('');
      setError(null);
      onClose();
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose}
      size="2xl"
    >
      <ModalContent>
        <ModalHeader>
          <h3 className="text-xl font-semibold">新しいバージョンを作成</h3>
        </ModalHeader>
        <ModalBody className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              現在のプロジェクト状態のスナップショットを作成します。
              バージョンを作成すると、工程データとBPMNダイアグラムが保存され、後で復元できます。
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <Textarea
            label="変更内容の説明"
            placeholder="例: 営業部門の工程を追加、BPMNダイアグラムを更新"
            value={message}
            onValueChange={setMessage}
            minRows={3}
            isRequired
            description="このバージョンで行った変更内容を説明してください"
          />

          <Input
            label="タグ（任意）"
            placeholder="例: v1.0, 初期版, レビュー用"
            value={tag}
            onValueChange={setTag}
            description="バージョンを識別しやすくするためのラベル"
          />

          <Input
            label="作成者（任意）"
            placeholder="例: 山田太郎"
            value={author}
            onValueChange={setAuthor}
            description="このバージョンを作成した人の名前"
          />

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <h4 className="text-sm font-semibold mb-2">📝 バージョン作成のヒント</h4>
            <ul className="text-xs space-y-1 text-gray-600">
              <li>• 重要な変更を行った後にバージョンを作成しましょう</li>
              <li>• 説明は具体的に記載すると、後で見返しやすくなります</li>
              <li>• タグを使って、マイルストーンやリリースバージョンを管理できます</li>
              <li>• バージョンは後から削除できますが、復元操作は元に戻せません</li>
            </ul>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            variant="flat"
            onPress={handleClose}
            isDisabled={isSubmitting}
          >
            キャンセル
          </Button>
          <Button
            color="primary"
            onPress={handleSubmit}
            isLoading={isSubmitting}
            isDisabled={!message.trim()}
          >
            {isSubmitting ? '作成中...' : 'バージョンを作成'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
