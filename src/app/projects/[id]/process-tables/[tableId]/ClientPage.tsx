/**
 * ProcessTable詳細ページ（V2対応） - Client Component
 * Swimlane×Stepのマトリクス形式でProcessを表示・管理
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardBody, CardHeader, Button, Spinner, Tabs, Tab, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from '@heroui/react';
import { 
  ArrowLeftIcon, 
  Cog6ToothIcon, 
  ArrowDownTrayIcon,
  SparklesIcon,
  PencilIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProcessTable, Swimlane, CustomColumn, Process } from '@/types/models';
import { processTableIPC, processIPC } from '@/lib/ipc-helpers';
import { useToast } from '@/contexts/ToastContext';
import { exportProcessTableToBpmnXml, downloadBpmnXml } from '@/lib/bpmn-xml-exporter';
import { 
  SwimlaneManagement, 
  CustomColumnManagement,
  ProcessManagement,
  DataObjectManagement 
} from '@/components/processTable';
import { BpmnViewer } from '@/components/process/BpmnViewer';
import { BpmnEditor } from '@/components/bpmn/BpmnEditor';

export function ProcessTableDetailClientPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();

  const [processTableId, setProcessTableId] = useState<string>('');
  const [projectId, setProjectId] = useState<string>('');
  const [processTable, setProcessTable] = useState<ProcessTable | null>(null);
  const [swimlanes, setSwimlanes] = useState<Swimlane[]>([]);
  const [customColumns, setCustomColumns] = useState<CustomColumn[]>([]);
  const [processes, setProcesses] = useState<Process[]>([]); // BPMN表示・エクスポート用
  const [dataObjectCount, setDataObjectCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('processes');
  const [bpmnEditMode, setBpmnEditMode] = useState<boolean>(false); // Phase 9.1: 編集モード切り替え
  const [bpmnXml, setBpmnXml] = useState<string | undefined>(); // Phase 9.1: BPMN XML状態

  // URLからIDを抽出
  useEffect(() => {
    const extractIds = () => {
      if (typeof window === 'undefined') return false;

      const pathname = window.location.pathname;
      console.log('[ProcessTableDetail] Current pathname:', pathname);
      
      // /projects/[projectId]/process-tables/[tableId]/ のパターン
      const match = pathname.match(/\/projects\/([^\/]+)\/process-tables\/([^\/]+)/);

      if (match) {
        const [, projId, tableId] = match;
        console.log('[ProcessTableDetail] Extracted IDs:', { projId, tableId });

        // UUIDの形式を簡易チェック（ハイフンを含む文字列）
        if (projId && tableId && projId.includes('-') && tableId.includes('-')) {
          setProjectId(projId);
          setProcessTableId(tableId);
          return true;
        } else {
          console.log('[ProcessTableDetail] Invalid ID format, retrying...');
        }
      } else {
        console.log('[ProcessTableDetail] Pattern match failed, retrying...');
      }
      return false;
    };

    // 初回実行
    if (!extractIds()) {
      // 失敗した場合はリトライ（最大10回、100msごと）
      let retryCount = 0;
      const retryInterval = setInterval(() => {
        retryCount++;
        console.log(`[ProcessTableDetail] Retry ${retryCount}/10`);
        
        if (extractIds() || retryCount >= 10) {
          clearInterval(retryInterval);
          if (retryCount >= 10) {
            console.error('[ProcessTableDetail] Failed to extract IDs after 10 retries');
            showToast('error', 'ページの読み込みに失敗しました');
          }
        }
      }, 100);

      return () => clearInterval(retryInterval);
    }
  }, [params, showToast]);

  // データ読み込み
  const loadData = useCallback(async () => {
    if (!processTableId || !projectId) {
      console.log('[ProcessTableDetail] Skipping load - missing IDs:', { processTableId, projectId });
      return;
    }

    console.log('[ProcessTableDetail] Loading data for:', { processTableId, projectId });
    setIsLoading(true);

    try {
      // ProcessTable基本情報を取得
      const { data: tableData, error: tableError } = await processTableIPC.getById(processTableId);
      if (tableError || !tableData) {
        console.error('[ProcessTableDetail] Failed to load process table:', tableError);
        showToast('error', `工程表の読み込みに失敗しました: ${tableError}`);
        // エラー時はプロジェクトページに戻る（projectIdが有効な場合のみ）
        if (projectId && projectId.includes('-')) {
          router.push(`/projects/${projectId}/`);
        }
        return;
      }
      setProcessTable(tableData);

      // Swimlane一覧を取得
      const { data: swimlaneData, error: swimlaneError } = await processTableIPC.getSwimlanes(processTableId);
      if (!swimlaneError && swimlaneData) {
        setSwimlanes(swimlaneData);
      }

      // CustomColumn一覧を取得
      const { data: columnData, error: columnError } = await processTableIPC.getCustomColumns(processTableId);
      if (!columnError && columnData) {
        setCustomColumns(columnData);
      }

      // 工程データを取得（BPMNビューア表示用）
      const { data: allProcesses, error: processError } = await processIPC.getByProcessTable(processTableId);
      if (!processError && allProcesses) {
        setProcesses(allProcesses);
      }

      // データオブジェクト数を取得
      const { dataObjectIPC } = await import('@/lib/ipc-helpers');
      const { data: dataObjectData, error: dataObjectError } = await dataObjectIPC.getByProcessTable(processTableId);
      if (!dataObjectError && dataObjectData) {
        setDataObjectCount(dataObjectData.length);
      }

      // Phase 9.1: BPMN同期状態を取得（編集モード用）
      try {
        const syncState = await window.electronAPI.bpmnSync.getSyncState(processTableId);
        if (syncState && syncState.bpmnXml) {
          setBpmnXml(syncState.bpmnXml);
        } else {
          // 同期状態がない場合は工程データから自動生成
          if (allProcesses && allProcesses.length > 0) {
            console.log('[ProcessTableDetail] Auto-generating BPMN XML from processes');
            const { exportProcessTableToBpmnXml } = await import('@/lib/bpmn-xml-exporter');
            const result = await exportProcessTableToBpmnXml({
              processTable: tableData,
              processes: allProcesses,
              swimlanes: swimlaneData || [],
              autoLayout: true,
            });
            setBpmnXml(result.xml);
          }
        }
      } catch (error) {
        console.log('[ProcessTableDetail] No BPMN sync state found, auto-generating from processes');
        // エラー時も工程データから自動生成を試みる
        if (allProcesses && allProcesses.length > 0) {
          try {
            const { exportProcessTableToBpmnXml } = await import('@/lib/bpmn-xml-exporter');
            const result = await exportProcessTableToBpmnXml({
              processTable: tableData,
              processes: allProcesses,
              swimlanes: swimlaneData || [],
              autoLayout: true,
            });
            setBpmnXml(result.xml);
          } catch (genError) {
            console.error('[ProcessTableDetail] Failed to auto-generate BPMN:', genError);
          }
        }
      }

    } catch (error) {
      console.error('[ProcessTableDetail] Failed to load data:', error);
      showToast('error', 'データの読み込みに失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, [processTableId, projectId, showToast, router]);

  // BPMN XMLエクスポート（ELK自動レイアウト適用）
  const handleExportBpmnXml = async (autoLayout: boolean = true) => {
    if (!processTable) {
      showToast('error', '工程表データが読み込まれていません');
      return;
    }

    try {
      showToast('info', 'BPMN XMLを生成中...');

      // 工程データを取得
      const { data: processesData, error } = await processIPC.getByProcessTable(processTableId);
      
      if (error || !processesData) {
        showToast('error', `工程データの取得に失敗しました: ${error}`);
        return;
      }

      // BPMN XMLを生成（ELK自動レイアウト適用）
      const result = await exportProcessTableToBpmnXml({
        processTable,
        processes: processesData,
        swimlanes,
        autoLayout, // ELK自動レイアウトフラグ
      });

      // ファイル名を生成
      const fileName = `${processTable.name}_${new Date().toISOString().split('T')[0]}`;

      // XMLをダウンロード
      downloadBpmnXml(result.xml, fileName);

      const layoutMsg = autoLayout ? '（ELK自動レイアウト適用）' : '（簡易レイアウト）';
      showToast(
        'success',
        `BPMN XMLをエクスポートしました${layoutMsg}（工程: ${result.processCount}個、レーン: ${result.laneCount}個）`
      );
    } catch (error) {
      console.error('[BPMN Export] Failed:', error);
      showToast('error', `BPMN XMLのエクスポートに失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
    }
  };

  useEffect(() => {
    if (processTableId && projectId) {
      loadData();
    }
  }, [processTableId, projectId, loadData]);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center min-h-[400px]">
          <Spinner size="lg" label="工程表を読み込み中..." />
        </div>
      </AppLayout>
    );
  }

  if (!processTable) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <p className="text-lg text-gray-500">工程表が見つかりません</p>
          <Button
            color="primary"
            className="mt-4"
            onPress={() => router.push(`/projects/${projectId}/`)}
          >
            プロジェクトに戻る
          </Button>
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
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">
                {processTable.name}
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
                更新: {new Date(processTable.updatedAt).toLocaleDateString('ja-JP')}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {/* BPMN XMLエクスポート（ドロップダウン） */}
            <Dropdown>
              <DropdownTrigger>
                <Button
                  color="primary"
                  size="md"
                  variant="flat"
                  startContent={<ArrowDownTrayIcon className="w-5 h-5" />}
                >
                  BPMN XMLエクスポート
                </Button>
              </DropdownTrigger>
              <DropdownMenu 
                aria-label="BPMN XML Export Options"
                onAction={(key) => {
                  if (key === 'auto-layout') {
                    handleExportBpmnXml(true);
                  } else if (key === 'simple-layout') {
                    handleExportBpmnXml(false);
                  }
                }}
              >
                <DropdownItem
                  key="auto-layout"
                  description="ELKで自動計算された座標を使用"
                  startContent={<SparklesIcon className="w-5 h-5" />}
                >
                  自動レイアウト（推奨）
                </DropdownItem>
                <DropdownItem
                  key="simple-layout"
                  description="シンプルな固定レイアウト"
                >
                  簡易レイアウト
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>

            <Button
              color="default"
              size="md"
              variant="flat"
              startContent={<Cog6ToothIcon className="w-5 h-5" />}
            >
              設定
            </Button>
          </div>
        </div>

        {/* 説明 */}
        {processTable.description && (
          <Card className="shadow-sm">
            <CardBody className="p-4">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {processTable.description}
              </p>
            </CardBody>
          </Card>
        )}

        {/* 統計情報 */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="shadow-sm">
            <CardBody className="p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">スイムレーン</p>
              <p className="text-2xl font-bold mt-1 text-gray-900 dark:text-gray-50">
                {swimlanes.length}
              </p>
            </CardBody>
          </Card>
          <Card className="shadow-sm">
            <CardBody className="p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">カスタム列</p>
              <p className="text-2xl font-bold mt-1 text-gray-900 dark:text-gray-50">
                {customColumns.length}
              </p>
            </CardBody>
          </Card>
          <Card className="shadow-sm">
            <CardBody className="p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">データオブジェクト</p>
              <p className="text-2xl font-bold mt-1 text-gray-900 dark:text-gray-50">
                {dataObjectCount}
              </p>
            </CardBody>
          </Card>
        </div>

        {/* タブ切り替え */}
        <Card className="shadow-sm">
          <CardBody className="p-0">
            <Tabs
              aria-label="工程表管理タブ"
              selectedKey={activeTab}
              onSelectionChange={(key) => setActiveTab(key as string)}
              classNames={{
                tabList: "w-full relative rounded-none p-0 border-b border-divider",
                cursor: "w-full bg-primary",
                tab: "max-w-fit px-6 h-12",
                tabContent: "group-data-[selected=true]:text-primary"
              }}
            >
              <Tab key="processes" title="工程一覧">
                <div className="p-6">
                  <ProcessManagement
                    projectId={projectId}
                    processTableId={processTableId}
                    swimlanes={swimlanes}
                    customColumns={customColumns}
                    onUpdate={loadData}
                  />
                </div>
              </Tab>
              <Tab key="swimlanes" title="スイムレーン">
                <div className="p-6">
                  <SwimlaneManagement
                    processTableId={processTableId}
                    swimlanes={swimlanes}
                    onUpdate={loadData}
                  />
                </div>
              </Tab>
              <Tab key="columns" title="カスタム列">
                <div className="p-6">
                  <CustomColumnManagement
                    processTableId={processTableId}
                    customColumns={customColumns}
                    onUpdate={loadData}
                  />
                </div>
              </Tab>
              <Tab key="dataObjects" title="データオブジェクト">
                <div className="p-6">
                  <DataObjectManagement
                    processTableId={processTableId}
                    onUpdate={loadData}
                  />
                </div>
              </Tab>
              <Tab key="bpmn" title="BPMNフロー図">
                <div className="p-6">
                  {/* Phase 9.1: 表示/編集モード切り替え */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      {!bpmnEditMode ? (
                        <Button
                          color="primary"
                          size="sm"
                          startContent={<PencilIcon className="w-4 h-4" />}
                          onPress={() => setBpmnEditMode(true)}
                        >
                          編集モードに切り替え
                        </Button>
                      ) : (
                        <Button
                          color="default"
                          size="sm"
                          startContent={<EyeIcon className="w-4 h-4" />}
                          onPress={() => setBpmnEditMode(false)}
                        >
                          表示モードに切り替え
                        </Button>
                      )}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {bpmnEditMode ? (
                        <span className="flex items-center gap-2">
                          <PencilIcon className="w-4 h-4" />
                          編集モード: BPMN図を直接編集できます
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <EyeIcon className="w-4 h-4" />
                          表示モード: 工程表から自動生成
                        </span>
                      )}
                    </div>
                  </div>

                  {/* BPMNビューアまたはエディタ */}
                  {!bpmnEditMode ? (
                    <BpmnViewer
                      processes={processes}
                      projectId={projectId}
                      height="700px"
                      onElementClick={(elementId) => {
                        console.log('[BPMN] Element clicked:', elementId);
                        // 工程をクリックした際の処理（オプショナル）
                        // 例: 該当工程の詳細を表示、編集モーダルを開く等
                      }}
                    />
                  ) : (
                    <BpmnEditor
                      projectId={projectId}
                      diagramId={processTableId}
                      initialXml={bpmnXml}
                      onSave={async (xml) => {
                        try {
                          showToast('info', 'BPMN変更を工程表に同期中...');
                          
                          // Phase 9.1: BPMN同期状態を取得
                          const syncState = await window.electronAPI.bpmnSync.getSyncState(processTableId);
                          const currentVersion = syncState?.version || 0;
                          
                          // Phase 9.1: BPMN XMLを保存し、工程表に同期
                          const syncResult = await window.electronAPI.bpmnSync.syncToProcessTable({
                            processTableId: processTableId,
                            bpmnXml: xml,
                            version: currentVersion,
                          });
                          
                          if (!syncResult.success) {
                            if (syncResult.conflicts && syncResult.conflicts.length > 0) {
                              const conflict = syncResult.conflicts[0];
                              showToast('error', `競合が検出されました: ${conflict.message}`);
                              // 最新の状態を再読み込み
                              await loadData();
                              return;
                            }
                            throw new Error('同期に失敗しました');
                          }
                          
                          // 成功時はローカル状態を更新
                          setBpmnXml(xml);
                          
                          // 工程データを再読み込み（BPMN→工程表の変更を反映）
                          await loadData();
                          
                          showToast('success', `BPMNを保存し、工程表に同期しました（${syncResult.updatedProcesses?.length || 0}件の工程を更新）`);
                        } catch (error) {
                          console.error('[BPMN Editor] Save error:', error);
                          showToast('error', `BPMN保存に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
                        }
                      }}
                      onError={(error) => {
                        console.error('[BPMN Editor] Error:', error);
                        showToast('error', `BPMNエディタエラー: ${error.message}`);
                      }}
                    />
                  )}
                </div>
              </Tab>
            </Tabs>
          </CardBody>
        </Card>
      </div>
    </AppLayout>
  );
}
