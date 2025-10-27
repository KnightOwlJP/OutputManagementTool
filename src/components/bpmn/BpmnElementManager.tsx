'use client';

import { useEffect, useState } from 'react';
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Chip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Select,
  SelectItem,
  Textarea,
  useDisclosure,
  Tooltip,
} from '@heroui/react';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  LinkIcon,
  ArrowPathIcon,
  InboxStackIcon,
  CircleStackIcon,
  EnvelopeIcon,
  BellAlertIcon,
  ExclamationTriangleIcon,
  ChevronDoubleUpIcon,
  ClockIcon,
  QuestionMarkCircleIcon,
  ArrowTopRightOnSquareIcon,
  RectangleGroupIcon,
  ChatBubbleLeftIcon,
} from '@heroicons/react/24/outline';
import { BpmnElement, BpmnElementType, BpmnSyncStatus } from '@/types/project.types';

interface BpmnElementManagerProps {
  projectId: string;
  bpmnDiagramId?: string;
}

const ELEMENT_TYPES: { value: BpmnElementType; label: string; icon: any; color: string }[] = [
  { value: 'dataObject', label: 'データオブジェクト', icon: InboxStackIcon, color: 'primary' },
  { value: 'dataStore', label: 'データストア', icon: CircleStackIcon, color: 'secondary' },
  { value: 'message', label: 'メッセージ', icon: EnvelopeIcon, color: 'success' },
  { value: 'signal', label: 'シグナル', icon: BellAlertIcon, color: 'warning' },
  { value: 'error', label: 'エラー', icon: ExclamationTriangleIcon, color: 'danger' },
  { value: 'escalation', label: 'エスカレーション', icon: ChevronDoubleUpIcon, color: 'danger' },
  { value: 'timer', label: 'タイマー', icon: ClockIcon, color: 'default' },
  { value: 'conditional', label: '条件', icon: QuestionMarkCircleIcon, color: 'default' },
  { value: 'link', label: 'リンク', icon: ArrowTopRightOnSquareIcon, color: 'default' },
  { value: 'textAnnotation', label: 'テキスト注釈', icon: ChatBubbleLeftIcon, color: 'default' },
  { value: 'group', label: 'グループ', icon: RectangleGroupIcon, color: 'default' },
];

const SYNC_STATUS_CONFIG: Record<BpmnSyncStatus, { label: string; color: 'success' | 'warning' | 'danger' | 'default' }> = {
  synced: { label: '同期済み', color: 'success' },
  outdated: { label: '更新あり', color: 'warning' },
  conflict: { label: '競合', color: 'danger' },
  manual: { label: '手動', color: 'default' },
};

export function BpmnElementManager({ projectId, bpmnDiagramId }: BpmnElementManagerProps) {
  const [elements, setElements] = useState<BpmnElement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingElement, setEditingElement] = useState<BpmnElement | null>(null);
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  // フォーム状態
  const [formData, setFormData] = useState({
    name: '',
    elementType: 'dataObject' as BpmnElementType,
    bpmnElementId: '',
    description: '',
    properties: {} as Record<string, any>,
    linkedProcessIds: [] as string[],
  });

  useEffect(() => {
    loadElements();
  }, [projectId, bpmnDiagramId]);

  const loadElements = async () => {
    setIsLoading(true);
    try {
      const result = bpmnDiagramId
        ? await window.electronAPI.bpmnElement.getByBpmnDiagram(bpmnDiagramId)
        : await window.electronAPI.bpmnElement.getByProject(projectId);
      
      if (result) {
        setElements(result);
      }
    } catch (error) {
      console.error('Failed to load BPMN elements:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingElement(null);
    setFormData({
      name: '',
      elementType: 'dataObject',
      bpmnElementId: '',
      description: '',
      properties: {},
      linkedProcessIds: [],
    });
    onOpen();
  };

  const handleOpenEdit = (element: BpmnElement) => {
    setEditingElement(element);
    setFormData({
      name: element.name,
      elementType: element.elementType,
      bpmnElementId: element.bpmnElementId || '',
      description: element.metadata?.description || '',
      properties: element.properties || {},
      linkedProcessIds: element.linkedProcessIds || [],
    });
    onOpen();
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert('要素名を入力してください');
      return;
    }

    try {
      if (editingElement) {
        // 更新
        await window.electronAPI.bpmnElement.update(editingElement.id, {
          name: formData.name.trim(),
          elementType: formData.elementType,
          properties: formData.properties,
          linkedProcessIds: formData.linkedProcessIds,
        });
      } else {
        // 新規作成
        await window.electronAPI.bpmnElement.create({
          projectId,
          bpmnDiagramId: bpmnDiagramId || undefined,
          elementType: formData.elementType,
          name: formData.name.trim(),
          bpmnElementId: formData.bpmnElementId || `${formData.elementType}_${Date.now()}`,
          properties: formData.properties,
          linkedProcessIds: formData.linkedProcessIds,
        });
      }
      await loadElements();
      onOpenChange();
    } catch (error) {
      console.error('Failed to save BPMN element:', error);
      alert('BPMN要素の保存に失敗しました');
    }
  };

  const handleDelete = async (elementId: string) => {
    if (!confirm('この要素を削除しますか？')) {
      return;
    }

    try {
      await window.electronAPI.bpmnElement.delete(elementId);
      await loadElements();
    } catch (error) {
      console.error('Failed to delete BPMN element:', error);
      alert('BPMN要素の削除に失敗しました');
    }
  };

  const handleSync = async () => {
    if (!bpmnDiagramId) {
      alert('BPMN図が選択されていません');
      return;
    }

    try {
      // TODO: BPMN XMLパーサー実装後に有効化
      alert('BPMN同期機能は現在開発中です');
      // await window.electronAPI.bpmnElement.syncFromBpmn(bpmnDiagramId, bpmnXml);
      // await loadElements();
    } catch (error) {
      console.error('Failed to sync BPMN elements:', error);
      alert('BPMN同期に失敗しました');
    }
  };

  const getElementTypeConfig = (type: BpmnElementType) => {
    return ELEMENT_TYPES.find(t => t.value === type) || ELEMENT_TYPES[0];
  };

  const getSyncStatusConfig = (status?: BpmnSyncStatus) => {
    return SYNC_STATUS_CONFIG[status || 'manual'];
  };

  // 要素タイプ別にグループ化
  const groupedElements = elements.reduce((acc, element) => {
    const type = element.elementType;
    if (!acc[type]) acc[type] = [];
    acc[type].push(element);
    return acc;
  }, {} as Record<BpmnElementType, BpmnElement[]>);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold">BPMN要素管理</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              データオブジェクト、シグナルなどの非プロセス要素を管理
            </p>
          </div>
          <div className="flex gap-2">
            {bpmnDiagramId && (
              <Button
                color="secondary"
                variant="flat"
                startContent={<ArrowPathIcon className="w-4 h-4" />}
                onPress={handleSync}
              >
                BPMN同期
              </Button>
            )}
            <Button
              color="primary"
              startContent={<PlusIcon className="w-4 h-4" />}
              onPress={handleOpenCreate}
            >
              要素を追加
            </Button>
          </div>
        </CardHeader>
        <CardBody>
          {isLoading ? (
            <div className="text-center py-8">読み込み中...</div>
          ) : elements.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              BPMN要素がまだありません。「要素を追加」ボタンから作成してください。
            </div>
          ) : (
            <div className="space-y-6">
              {ELEMENT_TYPES.map((typeConfig) => {
                const typeElements = groupedElements[typeConfig.value] || [];
                if (typeElements.length === 0) return null;

                const Icon = typeConfig.icon;

                return (
                  <div key={typeConfig.value} className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Icon className={`w-5 h-5 text-${typeConfig.color}-500`} />
                      <h4 className="font-semibold text-gray-900 dark:text-gray-50">
                        {typeConfig.label}
                      </h4>
                      <Chip size="sm" variant="flat" color={typeConfig.color as any}>
                        {typeElements.length}件
                      </Chip>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {typeElements.map((element) => (
                        <Card key={element.id} className="shadow-sm hover:shadow-md transition-shadow">
                          <CardBody className="p-4">
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex-1">
                                <h5 className="font-medium text-gray-900 dark:text-gray-50">
                                  {element.name}
                                </h5>
                                {element.bpmnElementId && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    ID: {element.bpmnElementId}
                                  </p>
                                )}
                              </div>
                              <Chip
                                size="sm"
                                variant="dot"
                                color={getSyncStatusConfig(element.syncStatus).color}
                              >
                                {getSyncStatusConfig(element.syncStatus).label}
                              </Chip>
                            </div>

                            {element.metadata?.description && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                {element.metadata.description}
                              </p>
                            )}

                            {element.linkedProcessIds && element.linkedProcessIds.length > 0 && (
                              <div className="flex items-center gap-2 mb-3">
                                <LinkIcon className="w-4 h-4 text-gray-400" />
                                <span className="text-xs text-gray-500">
                                  {element.linkedProcessIds.length}個の工程にリンク
                                </span>
                              </div>
                            )}

                            <div className="flex gap-1 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                              <Tooltip content="編集">
                                <Button
                                  size="sm"
                                  variant="light"
                                  isIconOnly
                                  onPress={() => handleOpenEdit(element)}
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
                                  onPress={() => handleDelete(element.id)}
                                >
                                  <TrashIcon className="w-4 h-4" />
                                </Button>
                              </Tooltip>
                            </div>
                          </CardBody>
                        </Card>
                      ))}
                    </div>
                  </div>
                );
              })}
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
                {editingElement ? 'BPMN要素を編集' : 'BPMN要素を追加'}
              </ModalHeader>
              <ModalBody>
                <div className="space-y-4">
                  <Input
                    label="要素名"
                    placeholder="例: 顧客データ、承認通知など"
                    value={formData.name}
                    onValueChange={(value) => setFormData({ ...formData, name: value })}
                    isRequired
                  />

                  <Select
                    label="要素タイプ"
                    selectedKeys={[formData.elementType]}
                    onChange={(e) => setFormData({ ...formData, elementType: e.target.value as BpmnElementType })}
                    isRequired
                  >
                    {ELEMENT_TYPES.map((type) => (
                      <SelectItem key={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </Select>

                  <Input
                    label="BPMN要素ID（任意）"
                    placeholder="BPMN XML内のID"
                    value={formData.bpmnElementId}
                    onValueChange={(value) => setFormData({ ...formData, bpmnElementId: value })}
                  />

                  <Textarea
                    label="説明（任意）"
                    placeholder="この要素の用途や注意事項など"
                    value={formData.description}
                    onValueChange={(value) => setFormData({ ...formData, description: value })}
                    minRows={2}
                  />

                  {/* TODO: 工程との関連付けUI */}
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      💡 工程との関連付け機能は今後実装予定です
                    </p>
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  キャンセル
                </Button>
                <Button color="primary" onPress={handleSave}>
                  {editingElement ? '更新' : '作成'}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
