'use client';

import { useEffect, useState } from 'react';
import { Input, Textarea, Select, SelectItem } from '@heroui/react';
import { Process, ProcessLevel } from '@/types/project.types';
import { Button, Modal } from '@/components';

interface ProcessFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ProcessFormData) => void;
  process?: Process;
  projectId: string;
  parentId?: string;
  defaultLevel?: ProcessLevel;
  isLoading?: boolean;
}

export interface ProcessFormData {
  name: string;
  level: ProcessLevel;
  parentId?: string;
  department?: string;
  assignee?: string;
  documentType?: string;
  description?: string;
}

export function ProcessForm({
  isOpen,
  onClose,
  onSubmit,
  process,
  projectId,
  parentId,
  defaultLevel,
  isLoading = false,
}: ProcessFormProps) {
  const [formData, setFormData] = useState<ProcessFormData>({
    name: '',
    level: defaultLevel || 'large',
    parentId: parentId,
    department: '',
    assignee: '',
    documentType: '',
    description: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // プロセスデータが変更されたらフォームを更新
  useEffect(() => {
    if (process) {
      setFormData({
        name: process.name,
        level: process.level,
        parentId: process.parentId,
        department: process.department || '',
        assignee: process.assignee || '',
        documentType: process.documentType || '',
        description: process.description || '',
      });
    } else {
      setFormData({
        name: '',
        level: defaultLevel || 'large',
        parentId: parentId,
        department: '',
        assignee: '',
        documentType: '',
        description: '',
      });
    }
    setErrors({});
  }, [process, projectId, parentId, defaultLevel]);

  // バリデーション
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = '工程名は必須です';
    }

    // レベル別の必須フィールドチェック
    if (formData.level === 'large' && !formData.department?.trim()) {
      newErrors.department = '大工程には部署名が必須です';
    }

    if (formData.level === 'medium' && !formData.assignee?.trim()) {
      newErrors.assignee = '中工程には作業実行者が必須です';
    }

    if (formData.level === 'small' && !formData.documentType?.trim()) {
      newErrors.documentType = '小工程には帳票種類が必須です';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 送信処理
  const handleSubmit = () => {
    if (validate()) {
      onSubmit(formData);
    }
  };

  // レベル変更時にフィールドをリセット
  const handleLevelChange = (level: ProcessLevel) => {
    setFormData(prev => ({
      ...prev,
      level,
      // レベル固有のフィールドをクリア
      department: level === 'large' ? prev.department : '',
      assignee: level === 'medium' ? prev.assignee : '',
      documentType: level === 'small' ? prev.documentType : '',
    }));
  };

  const getLevelLabel = (level: ProcessLevel) => {
    switch (level) {
      case 'large': return '大工程（部署単位）';
      case 'medium': return '中工程（作業実行者単位）';
      case 'small': return '小工程（帳票種類単位）';
      case 'detail': return '詳細工程（作業ステップ）';
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={process ? '工程を編集' : '工程を追加'}
      size="2xl"
      showConfirmButton
      confirmText={process ? '更新' : '作成'}
      onConfirm={handleSubmit}
      isConfirmLoading={isLoading}
      isConfirmDisabled={isLoading}
      confirmColor="primary"
    >
      <div className="space-y-6">
        {/* 工程レベル選択 */}
        <Select
          label="工程レベル"
          placeholder="レベルを選択"
          selectedKeys={[formData.level]}
          onChange={(e) => handleLevelChange(e.target.value as ProcessLevel)}
          isDisabled={!!process || !!defaultLevel}
          isRequired
          variant="bordered"
          size="lg"
          labelPlacement="outside"
          description={
            formData.level === 'large' ? '複数の中工程をまとめる部署単位の工程' :
            formData.level === 'medium' ? '作業実行者が行う一連の作業' :
            formData.level === 'small' ? '特定の帳票に関する作業' :
            '具体的な作業ステップ'
          }
          classNames={{
            listbox: "bg-white dark:bg-gray-800",
            popoverContent: "bg-white dark:bg-gray-800",
          }}
        >
          <SelectItem key="large">{getLevelLabel('large')}</SelectItem>
          <SelectItem key="medium">{getLevelLabel('medium')}</SelectItem>
          <SelectItem key="small">{getLevelLabel('small')}</SelectItem>
          <SelectItem key="detail">{getLevelLabel('detail')}</SelectItem>
        </Select>

        {/* 工程名 */}
        <Input
          label="工程名"
          placeholder="工程名を入力"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          isRequired
          isInvalid={!!errors.name}
          errorMessage={errors.name}
          autoFocus
          variant="bordered"
          size="lg"
          labelPlacement="outside"
          isClearable
        />

        {/* レベル別フィールド */}
        {formData.level === 'large' && (
          <Input
            label="部署名"
            placeholder="部署名を入力"
            value={formData.department}
            onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
            isRequired
            isInvalid={!!errors.department}
            errorMessage={errors.department}
            variant="bordered"
            size="lg"
            labelPlacement="outside"
            isClearable
          />
        )}

        {formData.level === 'medium' && (
          <Input
            label="作業実行者"
            placeholder="作業実行者を入力"
            value={formData.assignee}
            onChange={(e) => setFormData(prev => ({ ...prev, assignee: e.target.value }))}
            isRequired
            isInvalid={!!errors.assignee}
            errorMessage={errors.assignee}
            description="この工程を実行する担当者の役割を入力してください"
            variant="bordered"
            size="lg"
            labelPlacement="outside"
            isClearable
          />
        )}

        {formData.level === 'small' && (
          <Input
            label="帳票種類"
            placeholder="帳票種類を入力"
            value={formData.documentType}
            onChange={(e) => setFormData(prev => ({ ...prev, documentType: e.target.value }))}
            isRequired
            isInvalid={!!errors.documentType}
            errorMessage={errors.documentType}
            description="この工程で扱う帳票の種類を入力してください"
            variant="bordered"
            size="lg"
            labelPlacement="outside"
            isClearable
          />
        )}

        {/* 説明 */}
        <Textarea
          label="説明"
          placeholder="工程の説明を入力"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          minRows={4}
          maxRows={8}
          description="この工程の目的や注意事項などを記載してください"
          variant="bordered"
          size="lg"
          labelPlacement="outside"
        />

        {/* ガイド（最後に配置して重ならないように） */}
        <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border-2 border-blue-200 dark:border-blue-800 mt-4">
          <p className="text-sm text-blue-900 dark:text-blue-100 font-semibold mb-3">💡 工程レベルについて</p>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-2 ml-4 list-disc">
            <li><strong>大工程</strong>: 部署単位でまとまった業務プロセス（例: 「営業部の受注業務」）</li>
            <li><strong>中工程</strong>: 作業実行者が行う一連の作業（例: 「営業担当者の見積作成」）</li>
            <li><strong>小工程</strong>: 特定の帳票を扱う作業（例: 「見積書の作成と送付」）</li>
            <li><strong>詳細工程</strong>: 具体的な作業ステップ（例: 「見積書フォーマットに金額を入力」）</li>
          </ul>
        </div>
      </div>
    </Modal>
  );
}
