'use client';

import { useEffect, useState } from 'react';
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Select,
  SelectItem,
  Checkbox,
  Textarea,
  useDisclosure,
  Chip,
  Tooltip,
} from '@heroui/react';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  EyeIcon,
  EyeSlashIcon,
} from '@heroicons/react/24/outline';
import { CustomColumn, CustomColumnType } from '@/types/models';

interface CustomColumnManagerProps {
  projectId: string;
}

// Phase 9のCustomColumnTypeは 'TEXT' | 'NUMBER' | 'DATE' | 'SELECT' | 'CHECKBOX'
const COLUMN_TYPES: { value: CustomColumnType; label: string; description: string }[] = [
  { value: 'TEXT', label: 'テキスト', description: '短いテキスト（1行）' },
  { value: 'NUMBER', label: '数値', description: '数値データ' },
  { value: 'DATE', label: '日付', description: '日付データ' },
  { value: 'SELECT', label: '選択肢', description: 'ドロップダウンリスト' },
  { value: 'CHECKBOX', label: 'チェックボックス', description: 'はい/いいえ' },
];

export function CustomColumnManager({ projectId }: CustomColumnManagerProps) {
  const [columns, setColumns] = useState<CustomColumn[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingColumn, setEditingColumn] = useState<CustomColumn | null>(null);
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  // フォーム状態
  const [formData, setFormData] = useState({
    name: '',
    type: 'TEXT' as CustomColumnType,
    required: false,
    options: [] as string[],
    optionInput: '',
  });

  useEffect(() => {
    loadColumns();
  }, [projectId]);

  const loadColumns = async () => {
    setIsLoading(true);
    try {
      const result = await window.electronAPI.customColumn.getByProject(projectId);
      if (result) {
        setColumns(result);
      }
    } catch (error) {
      console.error('Failed to load custom columns:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingColumn(null);
    setFormData({
      name: '',
      type: 'TEXT',
      required: false,
      options: [],
      optionInput: '',
    });
    onOpen();
  };

  const handleOpenEdit = (column: CustomColumn) => {
    setEditingColumn(column);
    setFormData({
      name: column.name,
      type: column.type,
      required: column.required,
      options: column.options || [],
      optionInput: '',
    });
    onOpen();
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert('列名を入力してください');
      return;
    }

    // SELECT型の場合、選択肢が必要
    if (formData.type === 'SELECT' && formData.options.length === 0) {
      alert('選択肢を少なくとも1つ追加してください');
      return;
    }

    try {
      if (editingColumn) {
        // 更新
        await window.electronAPI.customColumn.update(editingColumn.id, {
          name: formData.name.trim(),
          type: formData.type,
          required: formData.required,
          options: formData.type === 'SELECT' ? formData.options : undefined,
        });
      } else {
        // 新規作成
        // Phase 9ではprocessTableIdが必要だが、プロジェクト全体のカスタム列として
        // projectIdをprocessTableId代わりに使用（暫定対応）
        await window.electronAPI.customColumn.create({
          processTableId: projectId, // 暫定: projectIdを使用
          name: formData.name.trim(),
          type: formData.type,
          required: formData.required,
          options: formData.type === 'SELECT' ? formData.options : undefined,
        });
      }
      await loadColumns();
      onOpenChange();
    } catch (error) {
      console.error('Failed to save custom column:', error);
      alert('カスタム列の保存に失敗しました');
    }
  };

  const handleDelete = async (columnId: string) => {
    if (!confirm('この列を削除しますか？関連するすべてのデータも削除されます。')) {
      return;
    }

    try {
      await window.electronAPI.customColumn.delete(columnId);
      await loadColumns();
    } catch (error) {
      console.error('Failed to delete custom column:', error);
      alert('カスタム列の削除に失敗しました');
    }
  };

  // Phase 9のCustomColumnにはisVisibleがないため、この機能は削除
  // const handleToggleVisibility = async (column: CustomColumn) => { ... };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const newColumns = [...columns];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= newColumns.length) return;

    [newColumns[index], newColumns[targetIndex]] = [newColumns[targetIndex], newColumns[index]];

    try {
      const updates = newColumns.map((c, i) => ({ id: c.id, displayOrder: i }));
      await window.electronAPI.customColumn.reorder(updates);
      setColumns(newColumns);
    } catch (error) {
      console.error('Failed to reorder columns:', error);
      alert('列の並び替えに失敗しました');
    }
  };

  const handleAddSelectOption = () => {
    const option = formData.optionInput.trim();
    if (!option) return;
    if (formData.options.includes(option)) {
      alert('この選択肢は既に存在します');
      return;
    }
    setFormData({
      ...formData,
      options: [...formData.options, option],
      optionInput: '',
    });
  };

  const handleRemoveSelectOption = (index: number) => {
    setFormData({
      ...formData,
      options: formData.options.filter((_, i) => i !== index),
    });
  };

  const getColumnTypeLabel = (type: CustomColumnType) => {
    return COLUMN_TYPES.find(t => t.value === type)?.label || type;
  };

  // 最大30列の制限チェック
  const canAddColumn = columns.length < 30;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold">カスタム列設定</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              工程表に独自の列を追加できます（最大30列）
            </p>
          </div>
          <Button
            color="primary"
            startContent={<PlusIcon className="w-4 h-4" />}
            onPress={handleOpenCreate}
            isDisabled={!canAddColumn}
          >
            列を追加
          </Button>
        </CardHeader>
        <CardBody>
          {isLoading ? (
            <div className="text-center py-8">読み込み中...</div>
          ) : columns.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              カスタム列がまだありません。「列を追加」ボタンから作成してください。
            </div>
          ) : (
            <Table aria-label="カスタム列一覧">
              <TableHeader>
                <TableColumn>列名</TableColumn>
                <TableColumn>データ型</TableColumn>
                <TableColumn>必須</TableColumn>
                <TableColumn>操作</TableColumn>
              </TableHeader>
              <TableBody>
                {columns.map((column, index) => (
                  <TableRow key={column.id}>
                    <TableCell>
                      <div className="font-medium">{column.name}</div>
                    </TableCell>
                    <TableCell>
                      <Chip size="sm" variant="flat">
                        {getColumnTypeLabel(column.type)}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      {column.required ? (
                        <Chip size="sm" color="danger" variant="flat">必須</Chip>
                      ) : (
                        <span className="text-gray-400">任意</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Tooltip content="上に移動">
                          <Button
                            size="sm"
                            variant="light"
                            isIconOnly
                            onPress={() => handleMove(index, 'up')}
                            isDisabled={index === 0}
                          >
                            <ArrowUpIcon className="w-4 h-4" />
                          </Button>
                        </Tooltip>
                        <Tooltip content="下に移動">
                          <Button
                            size="sm"
                            variant="light"
                            isIconOnly
                            onPress={() => handleMove(index, 'down')}
                            isDisabled={index === columns.length - 1}
                          >
                            <ArrowDownIcon className="w-4 h-4" />
                          </Button>
                        </Tooltip>
                        <Tooltip content="編集">
                          <Button
                            size="sm"
                            variant="light"
                            isIconOnly
                            onPress={() => handleOpenEdit(column)}
                          >
                            <PencilIcon className="w-4 h-4" />
                          </Button>
                        </Tooltip>
                        <Tooltip content="削除">
                          <Button
                            size="sm"
                            variant="light"
                            color="danger"
                            isIconOnly
                            onPress={() => handleDelete(column.id)}
                          >
                            <TrashIcon className="w-4 h-4" />
                          </Button>
                        </Tooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {!canAddColumn && (
            <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                ⚠️ カスタム列の上限（30列）に達しました。新しい列を追加するには、既存の列を削除してください。
              </p>
            </div>
          )}
        </CardBody>
      </Card>

      {/* 編集・作成モーダル */}
      <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="2xl">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>
                {editingColumn ? 'カスタム列を編集' : 'カスタム列を追加'}
              </ModalHeader>
              <ModalBody>
                <div className="space-y-4">
                  <Input
                    label="列名"
                    placeholder="例: 担当者、優先度、進捗率など"
                    value={formData.name}
                    onValueChange={(value) => setFormData({ ...formData, name: value })}
                    isRequired
                  />

                  <Select
                    label="データ型"
                    selectedKeys={[formData.type]}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as CustomColumnType })}
                    isRequired
                  >
                    {COLUMN_TYPES.map((type) => (
                      <SelectItem key={type.value}>
                        {type.label} - {type.description}
                      </SelectItem>
                    ))}
                  </Select>

                  {formData.type === 'SELECT' && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">選択肢</label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="選択肢を入力"
                          value={formData.optionInput}
                          onValueChange={(value) => setFormData({ ...formData, optionInput: value })}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddSelectOption();
                            }
                          }}
                        />
                        <Button onPress={handleAddSelectOption} color="primary">
                          追加
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {formData.options.map((option, index) => (
                          <Chip
                            key={index}
                            onClose={() => handleRemoveSelectOption(index)}
                            variant="flat"
                          >
                            {option}
                          </Chip>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Checkbox
                      isSelected={formData.required}
                      onValueChange={(checked) => setFormData({ ...formData, required: checked })}
                    >
                      必須フィールドにする
                    </Checkbox>
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onOpenChange}>
                  キャンセル
                </Button>
                <Button color="primary" onPress={handleSave}>
                  {editingColumn ? '更新' : '作成'}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
