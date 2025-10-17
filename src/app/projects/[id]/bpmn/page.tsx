'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  Input,
  Select,
  SelectItem,
  Switch,
  Chip,
  Spinner,
} from '@heroui/react';
import { ArrowLeftIcon, ArrowPathIcon, CheckCircleIcon, ExclamationTriangleIcon, PlusIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { AppLayout, Modal } from '@/components';
import { BpmnEditor } from '@/components/bpmn/BpmnEditor';
import { BpmnDiagram, Process } from '@/types/project.types';

export default function BpmnPage() {
  const params = useParams();
  const router = useRouter();
  
  // URLから実際のプロジェクトIDを取得（静的エクスポート対応）
  const [projectId, setProjectId] = useState<string>('');

  const [diagrams, setDiagrams] = useState<BpmnDiagram[]>([]);
  const [selectedDiagram, setSelectedDiagram] = useState<BpmnDiagram | null>(null);
  const [processes, setProcesses] = useState<Process[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newDiagramName, setNewDiagramName] = useState('');
  
  // 同期機能の状態
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<{
    created: number;
    updated: number;
    deleted: number;
  } | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  /**
   * URLからプロジェクトIDを抽出
   */
  useEffect(() => {
    const extractProjectId = () => {
      if (typeof window === 'undefined') return;
      
      const pathname = window.location.pathname;
      const match = pathname.match(/\/projects\/([^\/]+)/);
      const id = match ? match[1] : (params.id as string);
      
      if (id === 'placeholder') {
        setTimeout(extractProjectId, 100);
        return;
      }
      
      setProjectId(id);
    };

    extractProjectId();
  }, [params]);

  /**
   * データ読み込み
   */
  useEffect(() => {
    if (projectId) {
      loadData();
    }
  }, [projectId]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // BPMNダイアグラム一覧を取得
      const diagramList = await window.electronAPI.bpmn.getByProject(projectId);
      setDiagrams(diagramList);

      // 工程一覧を取得
      const processList = await window.electronAPI.process.getByProject(projectId);
      setProcesses(processList);

      // 最初のダイアグラムを選択
      if (diagramList.length > 0 && !selectedDiagram) {
        await loadDiagram(diagramList[0].id);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      // データがない場合はエラーとして扱わない（新規プロジェクトの場合）
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * ダイアグラム読み込み
   */
  const loadDiagram = async (diagramId: string) => {
    try {
      const diagram = await window.electronAPI.bpmn.getById(diagramId);
      setSelectedDiagram(diagram);
    } catch (error) {
      console.error('Failed to load diagram:', error);
      // ダイアグラムが見つからない場合は静かに処理
    }
  };

  /**
   * 新規ダイアグラム作成
   */
  const handleCreateDiagram = async () => {
    if (!newDiagramName.trim()) {
      alert('ダイアグラム名を入力してください');
      return;
    }

    try {
      const newDiagram = await window.electronAPI.bpmn.create({
        projectId,
        name: newDiagramName,
      });

      setDiagrams([...diagrams, newDiagram]);
      setSelectedDiagram(newDiagram);
      setIsCreateModalOpen(false);
      setNewDiagramName('');
    } catch (error) {
      console.error('Failed to create diagram:', error);
      alert(`ダイアグラムの作成に失敗しました: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  /**
   * ダイアグラム保存
   */
  const handleSaveDiagram = async (xml: string) => {
    if (!selectedDiagram) return;

    try {
      await window.electronAPI.bpmn.update(selectedDiagram.id, {
        name: selectedDiagram.name,
        xmlContent: xml,
      });

      // 成功通知
      alert('保存しました');

      // リストを更新
      await loadData();
    } catch (error) {
      console.error('Failed to save diagram:', error);
      alert(`保存に失敗しました: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  /**
   * ダイアグラム削除
   */
  const handleDeleteDiagram = async () => {
    if (!selectedDiagram) return;

    if (!confirm(`「${selectedDiagram.name}」を削除しますか？`)) {
      return;
    }

    try {
      await window.electronAPI.bpmn.delete(selectedDiagram.id);
      setSelectedDiagram(null);
      await loadData();
    } catch (error) {
      console.error('Failed to delete diagram:', error);
      alert(`削除に失敗しました: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  /**
   * BPMN → 工程表 同期
   */
  const handleSyncBpmnToProcesses = async () => {
    if (!selectedDiagram) return;
    
    setIsSyncing(true);
    try {
      const result = await window.electronAPI.sync.bpmnToProcesses(projectId, selectedDiagram.id);
      setLastSyncResult(result);
      alert(`同期完了: ${result.created}件作成、${result.updated}件更新、${result.deleted}件削除`);
      
      // 工程一覧を再読み込み
      const processList = await window.electronAPI.process.getByProject(projectId);
      setProcesses(processList);
    } catch (error) {
      console.error('Failed to sync BPMN to processes:', error);
      alert(`同期に失敗しました: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsSyncing(false);
    }
  };

  /**
   * 工程表 → BPMN 同期
   */
  const handleSyncProcessesToBpmn = async () => {
    if (!selectedDiagram) return;
    
    setIsSyncing(true);
    try {
      await window.electronAPI.sync.processesToBpmn(projectId, selectedDiagram.id);
      alert('工程表の変更をBPMNに反映しました');
      
      // ダイアグラムを再読み込み
      await loadDiagram(selectedDiagram.id);
    } catch (error) {
      console.error('Failed to sync processes to BPMN:', error);
      alert(`同期に失敗しました: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsSyncing(false);
    }
  };

  /**
   * 双方向同期
   */
  const handleBidirectionalSync = async () => {
    if (!selectedDiagram) return;
    
    setIsSyncing(true);
    try {
      const result = await window.electronAPI.sync.bidirectional(projectId, selectedDiagram.id);
      setLastSyncResult(result.bpmnToProcesses);
      alert(`双方向同期完了！\nBPMN→工程: ${result.bpmnToProcesses.created}件作成、${result.bpmnToProcesses.updated}件更新`);
      
      // データを再読み込み
      const processList = await window.electronAPI.process.getByProject(projectId);
      setProcesses(processList);
      await loadDiagram(selectedDiagram.id);
    } catch (error) {
      console.error('Failed to bidirectional sync:', error);
      alert(`同期に失敗しました: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsSyncing(false);
    }
  };

  /**
   * 自動同期トグル
   */
  const handleAutoSyncToggle = async (enabled: boolean) => {
    try {
      if (enabled) {
        await window.electronAPI.sync.startWatch(projectId);
      } else {
        await window.electronAPI.sync.stopWatch(projectId);
      }
      setAutoSyncEnabled(enabled);
    } catch (error) {
      console.error('Failed to toggle auto sync:', error);
      alert(`自動同期の切り替えに失敗しました: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  /**
   * エラーハンドラ
   */
  const handleError = (error: Error) => {
    console.error('BPMN Editor error:', error);
    alert(`エラーが発生しました: ${error.message}`);
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Spinner size="lg" label="読み込み中..." />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* ヘッダー */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => router.push(`/projects/${projectId}/`)}
              className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="プロジェクトに戻る"
            >
              <ArrowLeftIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">BPMNエディタ</h1>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
                業務プロセスを可視化します
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              color="primary"
              size="md"
              className="font-semibold shadow-md hover:shadow-lg transition-shadow whitespace-nowrap bg-blue-600 hover:bg-blue-700 text-white"
              startContent={<PlusIcon className="w-5 h-5" />}
              onPress={() => setIsCreateModalOpen(true)}
            >
              新規ダイアグラム
            </Button>
          </div>
        </div>

        {/* ダイアグラム選択・管理 */}
        {diagrams.length > 0 && (
          <Card className="shadow-sm">
            <CardBody className="p-4">
              <div className="flex items-center gap-4">
                <Select
                label="ダイアグラム選択"
                placeholder="ダイアグラムを選択"
                selectedKeys={selectedDiagram ? [selectedDiagram.id] : []}
                onSelectionChange={(keys) => {
                  const selectedId = Array.from(keys)[0] as string;
                  if (selectedId) {
                    loadDiagram(selectedId);
                  }
                }}
                className="flex-1"
                classNames={{
                  base: "w-full",
                  trigger: "min-h-[48px] px-4 py-3 border-2",
                  listbox: "bg-white dark:bg-gray-800",
                  popoverContent: "bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600",
                }}
              >
                {diagrams.map((diagram) => (
                  <SelectItem key={diagram.id}>
                    {diagram.name} (v{diagram.version})
                  </SelectItem>
                ))}
              </Select>

              {selectedDiagram && (
                <Button 
                  color="danger" 
                  variant="flat" 
                  onPress={handleDeleteDiagram}
                  className="font-semibold whitespace-nowrap"
                >
                  削除
                </Button>
              )}
            </div>
          </CardBody>
        </Card>
        )}

        {/* 同期機能パネル */}
        {selectedDiagram && (
          <Card className="mt-4 shadow-sm">
            <CardHeader className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">工程表との同期</h3>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <Switch
                  isSelected={autoSyncEnabled}
                  onValueChange={handleAutoSyncToggle}
                  size="sm"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">自動同期</span>
              </div>
            </CardHeader>
            <CardBody>
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                <Button
                  color="default"
                  variant="flat"
                  size="md"
                  className="font-semibold whitespace-nowrap border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                  onPress={handleSyncBpmnToProcesses}
                  disabled={isSyncing}
                  startContent={<ArrowPathIcon className="w-5 h-5" />}
                >
                  BPMN → 工程表
                </Button>
                <Button
                  color="default"
                  variant="flat"
                  size="md"
                  className="font-semibold whitespace-nowrap border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                  onPress={handleSyncProcessesToBpmn}
                  disabled={isSyncing}
                  startContent={<ArrowPathIcon className="w-5 h-5" />}
                >
                  工程表 → BPMN
                </Button>
                <Button
                  color="primary"
                  size="md"
                  className="font-semibold shadow-md hover:shadow-lg transition-shadow whitespace-nowrap bg-blue-600 hover:bg-blue-700 text-white"
                  onPress={handleBidirectionalSync}
                  disabled={isSyncing}
                  startContent={<ArrowPathIcon className={`w-5 h-5 ${isSyncing ? 'animate-spin' : ''}`} />}
                >
                  双方向同期
                </Button>
                
                {isSyncing && (
                  <Chip color="warning" variant="flat" startContent={<ArrowPathIcon className="w-4 h-4 animate-spin" />}>
                    同期中...
                  </Chip>
                )}
              </div>
              
              {lastSyncResult && (
                <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircleIcon className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-semibold text-green-800 dark:text-green-200">
                      最後の同期結果
                    </span>
                  </div>
                  <div className="text-xs text-green-700 dark:text-green-300 space-y-1">
                    <div>作成: {lastSyncResult.created}件</div>
                    <div>更新: {lastSyncResult.updated}件</div>
                    <div>削除: {lastSyncResult.deleted}件</div>
                  </div>
                </div>
              )}
              
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                💡 ヒント: 双方向同期は両方向の変更を自動で調整します
              </p>
            </CardBody>
          </Card>
        )}

        {/* BPMNエディタ */}
        {selectedDiagram ? (
          <Card className="shadow-sm">
            <CardBody className="p-0" style={{ minHeight: '500px' }}>
              <BpmnEditor
                key={selectedDiagram.id}
                projectId={projectId}
                diagramId={selectedDiagram.id}
                initialXml={selectedDiagram.xmlContent}
                onSave={handleSaveDiagram}
                onError={handleError}
              />
            </CardBody>
          </Card>
        ) : (
          <Card className="shadow-sm">
            <CardBody className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <DocumentTextIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 dark:text-gray-400 mb-4">ダイアグラムが選択されていません</p>
                <Button
                  color="primary"
                  startContent={<PlusIcon className="w-4 h-4" />}
                  onPress={() => setIsCreateModalOpen(true)}
                >
                  新規ダイアグラムを作成
                </Button>
              </div>
            </CardBody>
          </Card>
        )}

        {/* 工程連携パネル */}
        {selectedDiagram && processes.length > 0 && (
          <Card className="shadow-sm">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">工程連携</h3>
            </CardHeader>
            <CardBody>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                このプロジェクトには{processes.length}件の工程が登録されています
              </p>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="shadow-sm bg-blue-50 dark:bg-blue-950">
                  <CardBody className="p-4 text-center">
                    <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">大工程</p>
                    <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">
                      {processes.filter(p => p.level === 'large').length}
                    </p>
                  </CardBody>
                </Card>
                <Card className="shadow-sm bg-green-50 dark:bg-green-950">
                  <CardBody className="p-4 text-center">
                    <p className="text-sm font-semibold text-green-900 dark:text-green-100">中工程</p>
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">
                      {processes.filter(p => p.level === 'medium').length}
                    </p>
                  </CardBody>
                </Card>
                <Card className="shadow-sm bg-yellow-50 dark:bg-yellow-950">
                  <CardBody className="p-4 text-center">
                    <p className="text-sm font-semibold text-yellow-900 dark:text-yellow-100">小工程</p>
                    <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mt-2">
                      {processes.filter(p => p.level === 'small').length}
                    </p>
                  </CardBody>
                </Card>
                <Card className="shadow-sm bg-orange-50 dark:bg-orange-950">
                  <CardBody className="p-4 text-center">
                    <p className="text-sm font-semibold text-orange-900 dark:text-orange-100">詳細工程</p>
                    <p className="text-3xl font-bold text-orange-600 dark:text-orange-400 mt-2">
                      {processes.filter(p => p.level === 'detail').length}
                    </p>
                  </CardBody>
                </Card>
              </div>
            </CardBody>
          </Card>
        )}
      </div>

        {/* 新規作成モーダル */}
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => {
            setIsCreateModalOpen(false);
            setNewDiagramName('');
          }}
          title="新規ダイアグラム作成"
          size="2xl"
          showConfirmButton
          confirmText="作成"
          onConfirm={handleCreateDiagram}
          isConfirmDisabled={!newDiagramName.trim()}
          confirmColor="primary"
        >
          <div className="space-y-6">
            <Input
              label="ダイアグラム名"
              placeholder="例: 営業プロセス"
              value={newDiagramName}
              onChange={(e) => setNewDiagramName(e.target.value)}
              isRequired
              autoFocus
              variant="bordered"
              size="lg"
              labelPlacement="outside"
              isClearable
              description="プロセスの種類や部署名を含めると管理しやすくなります"
            />
            
            <div className="p-4 bg-blue-50 dark:bg-blue-950 border-2 border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
                💡 ヒント
              </p>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <li>• 例: 「営業部_受注プロセス」「経理部_請求書処理」</li>
                <li>• 工程表と連携して業務フローを可視化できます</li>
              </ul>
            </div>
          </div>
        </Modal>
      </AppLayout>
    );
  }
