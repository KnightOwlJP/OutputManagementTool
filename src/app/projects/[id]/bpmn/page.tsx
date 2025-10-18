'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Card,
  CardBody,
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Textarea,
  Select,
  SelectItem,
  useDisclosure,
} from '@heroui/react';
import { ArrowLeftIcon, PlusIcon } from '@heroicons/react/24/outline';
import { BpmnDiagramTableList } from '@/components/bpmn/BpmnDiagramTableList';
import { useToast } from '@/contexts/ToastContext';
import type { BpmnDiagramTable, ProcessTable, ProcessLevel } from '@/types/project.types';

export default function BpmnPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const { showToast } = useToast();

  const [bpmnDiagramTables, setBpmnDiagramTables] = useState<BpmnDiagramTable[]>([]);
  const [processTables, setProcessTables] = useState<ProcessTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTable, setSelectedTable] = useState<BpmnDiagramTable | null>(null);

  const { isOpen, onOpen, onClose, onOpenChange } = useDisclosure();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    level: 'large' as ProcessLevel,
    processTableId: '',
  });

  useEffect(() => {
    loadData();
  }, [projectId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [tables, processes] = await Promise.all([
        window.electronAPI.bpmnDiagramTable.getByProject(projectId),
        window.electronAPI.processTable.getByProject(projectId),
      ]);
      setBpmnDiagramTables(tables);
      setProcessTables(processes);
    } catch (error) {
      console.error('Failed to load data:', error);
      showToast('error', 'データの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTable = (level?: ProcessLevel) => {
    setSelectedTable(null);
    setFormData({
      name: '',
      description: '',
      level: level || 'large',
      processTableId: '',
    });
    onOpen();
  };

  const handleEditTable = (table: BpmnDiagramTable) => {
    setSelectedTable(table);
    setFormData({
      name: table.name,
      description: table.description || '',
      level: table.level,
      processTableId: table.processTableId?.toString() || '',
    });
    onOpen();
  };

  const handleSelectTable = (table: BpmnDiagramTable) => {
    router.push(`/projects/${projectId}/bpmn/${table.id}`);
  };

  const handleDeleteTable = async (table: BpmnDiagramTable) => {
    if (!confirm(`「${table.name}」を削除してもよろしいですか？\n関連するフロー図もすべて削除されます。`)) {
      return;
    }

    try {
      await window.electronAPI.bpmnDiagramTable.delete(table.id);
      await loadData();
      showToast('success', 'フロー図グループを削除しました');
    } catch (error) {
      console.error('Failed to delete table:', error);
      showToast('error', 'フロー図グループの削除に失敗しました');
    }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      showToast('error', 'グループ名を入力してください');
      return;
    }

    try {
      const tableData = {
        name: formData.name,
        description: formData.description || null,
        level: formData.level,
        projectId,
        processTableId: formData.processTableId ? Number(formData.processTableId) : null,
      };

      if (selectedTable) {
        await window.electronAPI.bpmnDiagramTable.update({
          ...tableData,
          id: selectedTable.id,
        });
        showToast('success', 'フロー図グループを更新しました');
      } else {
        await window.electronAPI.bpmnDiagramTable.create(tableData);
        showToast('success', 'フロー図グループを作成しました');
      }

      await loadData();
      onClose();
    } catch (error) {
      console.error('Failed to save table:', error);
      showToast(
        'error',
        selectedTable
          ? 'フロー図グループの更新に失敗しました'
          : 'フロー図グループの作成に失敗しました'
      );
    }
  };

  const handleReorder = async (reorderedTables: BpmnDiagramTable[]) => {
    try {
      const updates = reorderedTables.map((table, index) => ({
        id: table.id,
        displayOrder: index,
      }));
      await window.electronAPI.bpmnDiagramTable.reorder(updates);
      setBpmnDiagramTables(reorderedTables);
      showToast('success', '表示順序を更新しました');
    } catch (error) {
      console.error('Failed to reorder tables:', error);
      showToast('error', '表示順序の更新に失敗しました');
      await loadData();
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            isIconOnly
            variant="light"
            onClick={() => router.push(`/projects/${projectId}`)}
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold">フロー図グループ管理</h1>
        </div>
        <Button color="primary" startContent={<PlusIcon className="h-5 w-5" />} onClick={() => handleCreateTable()}>
          新規グループ作成
        </Button>
      </div>

      {loading ? (
        <Card>
          <CardBody>
            <p className="text-center text-default-500">読み込み中...</p>
          </CardBody>
        </Card>
      ) : (
        <BpmnDiagramTableList
          projectId={projectId}
          bpmnDiagramTables={bpmnDiagramTables}
          onCreateTable={handleCreateTable}
          onSelectTable={(tableId) => router.push(`/projects/${projectId}/bpmn/${tableId}`)}
          onDeleteTable={(tableId) => {
            const table = bpmnDiagramTables.find((t) => t.id === tableId);
            if (table) handleDeleteTable(table);
          }}
          onEditTable={handleEditTable}
        />
      )}

      <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="2xl">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>
                {selectedTable ? 'フロー図グループを編集' : '新規フロー図グループ作成'}
              </ModalHeader>
              <ModalBody>
                <div className="space-y-4">
                  <Input
                    label="グループ名"
                    placeholder="例: 基本フロー"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    isRequired
                  />
                  <Textarea
                    label="説明"
                    placeholder="このグループの説明を入力してください"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    minRows={3}
                  />
                  <Select
                    label="レベル"
                    placeholder="レベルを選択"
                    selectedKeys={[formData.level]}
                    onChange={(e) => setFormData({ ...formData, level: e.target.value as ProcessLevel })}
                  >
                    <SelectItem key="large">大工程</SelectItem>
                    <SelectItem key="medium">中工程</SelectItem>
                    <SelectItem key="small">小工程</SelectItem>
                    <SelectItem key="detail">詳細</SelectItem>
                  </Select>
                  <Select
                    label="関連工程表（任意）"
                    placeholder="工程表を選択"
                    selectedKeys={formData.processTableId ? [formData.processTableId] : []}
                    onChange={(e) => setFormData({ ...formData, processTableId: e.target.value })}
                  >
                    {processTables.map((pt) => (
                      <SelectItem key={pt.id.toString()}>
                        {pt.name}
                      </SelectItem>
                    ))}
                  </Select>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  キャンセル
                </Button>
                <Button color="primary" onPress={handleSubmit}>
                  {selectedTable ? '更新' : '作成'}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
