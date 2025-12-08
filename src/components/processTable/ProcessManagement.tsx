/**
 * 工程管理コンポーネント
 * 工程の一覧表示・追加・編集・削除機能を提供（テーブル形式）
 */

'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Button,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Checkbox,
  Tooltip,
  Select,
  SelectItem,
} from '@heroui/react';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  FunnelIcon,
  ArrowPathIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';
import { Process, Swimlane, CustomColumn, DataObject, ProcessTable } from '@/types/models';
import { processIPC, processTableIPC } from '@/lib/ipc-helpers';
import { useToast } from '@/contexts/ToastContext';
import { ProcessFormModal } from './ProcessFormModal';
import { useDisclosure } from '@heroui/react';
import { exportProcessesToCSV, generateCSVFilename, type CharEncoding } from '@/utils/csvExport';
import { parseProcessesCsv } from '@/utils/csvImport';

interface ProcessManagementProps {
  projectId: string;
  processTableId: string;
  processTable: ProcessTable;
  swimlanes: Swimlane[];
  customColumns: CustomColumn[];
  dataObjects: DataObject[];
  onUpdate: () => void;
}

// タスクタイプの表示名とカラー
const TASK_TYPE_CONFIG: Record<string, { label: string; color: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'default'; icon: string }> = {
  userTask: { label: 'ユーザー', color: 'primary', icon: '👤' },
  serviceTask: { label: 'サービス', color: 'secondary', icon: '⚙️' },
  scriptTask: { label: 'スクリプト', color: 'success', icon: '📝' },
  sendTask: { label: '送信', color: 'warning', icon: '📤' },
  receiveTask: { label: '受信', color: 'danger', icon: '📥' },
  manualTask: { label: '手動', color: 'default', icon: '✋' },
  businessRuleTask: { label: 'ルール', color: 'secondary', icon: '📋' },
};

const IMPORT_LANE_COLORS = [
  '#3B82F6',
  '#10B981',
  '#F59E0B',
  '#EF4444',
  '#8B5CF6',
  '#EC4899',
  '#06B6D4',
  '#84CC16',
];

export function ProcessManagement({
  projectId,
  processTableId,
  processTable,
  swimlanes,
  customColumns,
  dataObjects,
  onUpdate,
}: ProcessManagementProps) {
  const { showToast } = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [processes, setProcesses] = useState<Process[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [editingProcess, setEditingProcess] = useState<Process | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  
  // フィルタ状態
  const [filterSwimlane, setFilterSwimlane] = useState<string>('all');
  const [filterTaskType, setFilterTaskType] = useState<string>('all');
  
  // CSVエクスポート設定
  const [csvEncoding, setCsvEncoding] = useState<CharEncoding>('utf-8');

  // 工程データを読み込む
  const loadProcesses = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await processIPC.getByProcessTable(processTableId);
      if (error) {
        showToast('error', `工程の読み込みに失敗しました: ${error}`);
        return;
      }

      // データが存在しない場合は空配列
      setProcesses(data || []);
    } catch (error) {
      console.error('[ProcessManagement] Failed to load processes:', error);
      showToast('error', '工程の読み込み中にエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  // 初回読み込み
  useEffect(() => {
    loadProcesses();
  }, []);

  // フィルタリングされた工程リスト
  const filteredProcesses = useMemo(() => {
    return processes.filter((process) => {
      if (filterSwimlane !== 'all' && process.laneId !== filterSwimlane) {
        return false;
      }
      if (filterTaskType !== 'all' && process.taskType !== filterTaskType) {
        return false;
      }
      return true;
    });
  }, [processes, filterSwimlane, filterTaskType]);

  // LaneIDからスイムレーン名を取得
  const getSwimlaneName = (laneId: string) => {
    const swimlane = swimlanes.find((s) => s.id === laneId);
    return swimlane ? swimlane.name : '-';
  };

  // 前工程の名前を取得
  const getBeforeProcessNames = (beforeProcessIds?: string[]) => {
    if (!beforeProcessIds || beforeProcessIds.length === 0) return '-';
    return beforeProcessIds
      .map((id) => {
        const process = processes.find((p) => p.id === id);
        return process ? process.name : id;
      })
      .join(', ');
  };

  // 次工程の名前を取得
  const getNextProcessNames = (nextProcessIds?: string[]) => {
    if (!nextProcessIds || nextProcessIds.length === 0) return '-';
    return nextProcessIds
      .map((id) => {
        const process = processes.find((p) => p.id === id);
        return process ? process.name : id;
      })
      .join(', ');
  };

  // カスタム列の値をフォーマット
  const formatCustomColumnValue = (column: typeof customColumns[0], value: any): string => {
    if (value === null || value === undefined) return '-';
    
    switch (column.type) {
      case 'CHECKBOX':
        return value ? '✓' : '-';
      case 'DATE':
        return value || '-';
      case 'NUMBER':
        return value?.toString() || '-';
      case 'SELECT':
      case 'TEXT':
      default:
        return value || '-';
    }
  };

  // モーダルを開く（新規作成）
  const handleCreate = () => {
    setEditingProcess(null);
    onOpen();
  };

  // モーダルを開く（編集）
  const handleEdit = (process: Process) => {
    setEditingProcess(process);
    onOpen();
  };

  // 工程作成・更新
  const handleSubmit = async (data: Partial<Process>) => {
    try {
      if (editingProcess) {
        // 更新
        const { error } = await processIPC.update(editingProcess.id, data);
        if (error) {
          throw new Error(error);
        }
      } else {
        // 新規作成
        const nextOrder = processes.length + 1;
        const createData: any = {
          processTableId,
          name: data.name!,
          largeName: data.largeName || data.name,
          mediumName: data.mediumName,
          smallName: data.smallName,
          detailName: data.detailName,
          laneId: data.laneId!,
          displayId: nextOrder,
          workSeconds: data.workSeconds ?? 0,
          workUnitPref: data.workUnitPref,
          skillLevel: data.skillLevel,
          systemName: data.systemName,
          parallelAllowed: data.parallelAllowed,
          bpmnElement: data.bpmnElement || 'task',
          taskType: data.taskType,
          gatewayType: data.gatewayType,
          eventType: data.eventType,
          intermediateEventType: data.intermediateEventType,
          eventDetails: data.eventDetails,
          beforeProcessIds: data.beforeProcessIds,
          documentation: data.documentation,
          conditionalFlows: data.conditionalFlows,
          messageFlows: data.messageFlows,
          inputDataObjects: data.inputDataObjects,
          outputDataObjects: data.outputDataObjects,
          customColumns: data.customColumns,
          issueDetail: data.issueDetail,
          issueCategory: data.issueCategory,
          countermeasurePolicy: data.countermeasurePolicy,
          issueWorkSeconds: data.issueWorkSeconds,
          timeReductionSeconds: data.timeReductionSeconds,
          rateReductionPercent: data.rateReductionPercent,
          displayOrder: nextOrder,
        };
        const { error } = await processIPC.create(createData);
        if (error) {
          throw new Error(error);
        }
      }

      loadProcesses();
      onUpdate();
    } catch (error) {
      throw error; // モーダル側でエラーハンドリング
    }
  };

  // 工程削除
  const handleDelete = async (processId: string) => {
    if (!confirm('この工程を削除してもよろしいですか?')) return;

    try {
      const { error } = await processIPC.delete(processId);
      if (error) {
        showToast('error', `工程の削除に失敗しました: ${error}`);
        return;
      }

      showToast('success', '工程を削除しました');
      loadProcesses();
      onUpdate();
    } catch (error) {
      console.error('[ProcessManagement] Failed to delete process:', error);
      showToast('error', '工程の削除中にエラーが発生しました');
    }
  };

  // 一括削除
  const handleBulkDelete = async () => {
    if (selectedKeys.size === 0) {
      showToast('warning', '削除する工程を選択してください');
      return;
    }

    if (!confirm(`選択した${selectedKeys.size}件の工程を削除してもよろしいですか?`)) return;

    try {
      for (const id of Array.from(selectedKeys)) {
        await processIPC.delete(id);
      }

      showToast('success', `${selectedKeys.size}件の工程を削除しました`);
      setSelectedKeys(new Set());
      loadProcesses();
      onUpdate();
    } catch (error) {
      console.error('[ProcessManagement] Failed to bulk delete:', error);
      showToast('error', '一括削除中にエラーが発生しました');
    }
  };

  // 工程を上に移動
  const handleMoveUp = async (process: Process) => {
    try {
      // 同じレーン内の工程を取得してソート
      const sameLayneProcesses = filteredProcesses
        .filter(p => p.laneId === process.laneId)
        .sort((a, b) => a.displayOrder - b.displayOrder);

      const currentIndex = sameLayneProcesses.findIndex(p => p.id === process.id);
      
      if (currentIndex <= 0) {
        showToast('warning', 'これ以上上に移動できません');
        return;
      }

      const prevProcess = sameLayneProcesses[currentIndex - 1];
      
      // displayOrderを入れ替え
      await processIPC.reorder(process.id, prevProcess.displayOrder);
      await processIPC.reorder(prevProcess.id, process.displayOrder);

      showToast('success', '工程を上に移動しました');
      loadProcesses();
      onUpdate();
    } catch (error) {
      console.error('[ProcessManagement] Failed to move up:', error);
      showToast('error', '工程の移動に失敗しました');
    }
  };

  // 工程を下に移動
  const handleMoveDown = async (process: Process) => {
    try {
      // 同じレーン内の工程を取得してソート
      const sameLayneProcesses = filteredProcesses
        .filter(p => p.laneId === process.laneId)
        .sort((a, b) => a.displayOrder - b.displayOrder);

      const currentIndex = sameLayneProcesses.findIndex(p => p.id === process.id);
      
      if (currentIndex >= sameLayneProcesses.length - 1) {
        showToast('warning', 'これ以上下に移動できません');
        return;
      }

      const nextProcess = sameLayneProcesses[currentIndex + 1];
      
      // displayOrderを入れ替え
      await processIPC.reorder(process.id, nextProcess.displayOrder);
      await processIPC.reorder(nextProcess.id, process.displayOrder);

      showToast('success', '工程を下に移動しました');
      loadProcesses();
      onUpdate();
    } catch (error) {
      console.error('[ProcessManagement] Failed to move down:', error);
      showToast('error', '工程の移動に失敗しました');
    }
  };

  // CSVエクスポート
  const handleExportCSV = async () => {
    try {
      if (filteredProcesses.length === 0) {
        showToast('warning', 'エクスポートする工程がありません');
        return;
      }

      const filename = generateCSVFilename(processTableId);
      
      await exportProcessesToCSV({
        processes: filteredProcesses,
        swimlanes,
        customColumns,
        encoding: csvEncoding,
        filename,
      });

      showToast('success', 'CSVエクスポートが完了しました');
    } catch (error) {
      console.error('[ProcessManagement] Failed to export CSV:', error);
      showToast('error', 'CSVエクスポートに失敗しました');
    }
  };

  const handleImportCSVClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportCSVFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsImporting(true);
    try {
      const text = await file.text();
      const parsed = parseProcessesCsv(text, customColumns);

      if (parsed.errors.length > 0) {
        showToast('error', parsed.errors.join('\n'));
        return;
      }

      if (parsed.warnings.length > 0) {
        showToast('warning', parsed.warnings.join('\n'));
      }

      // 最新の工程一覧を取得してマップの欠損を防ぐ（画面状態が古い場合に備える）
      const currentProcResult = await processIPC.getByProcessTable(processTableId);
      if (currentProcResult.error) {
        showToast('error', `工程の取得に失敗しました: ${currentProcResult.error}`);
        return;
      }
      const currentProcesses = currentProcResult.data || [];

      // スイムレーン確保（存在しなければ作成）
      let laneList = [...swimlanes];
      const laneMap = new Map(laneList.map((l) => [l.name, l]));
      let nextLaneOrder = laneList.length;

      const ensureLane = async (laneName: string) => {
        const existing = laneMap.get(laneName);
        if (existing) return existing;
        const color = IMPORT_LANE_COLORS[nextLaneOrder % IMPORT_LANE_COLORS.length];
        const { data, error } = await processTableIPC.createSwimlane(processTableId, {
          name: laneName,
          color,
          displayOrder: nextLaneOrder,
        });
        if (error || !data) {
          throw new Error(error || `スイムレーン「${laneName}」の作成に失敗しました`);
        }
        const lane = {
          id: data.id,
          processTableId: processTableId,
          name: laneName,
          color,
          order: data.orderNum ?? nextLaneOrder,
          createdAt: data.createdAt ?? new Date(),
          updatedAt: data.updatedAt ?? new Date(),
        } as Swimlane;
        laneMap.set(laneName, lane);
        laneList = [...laneList, lane];
        nextLaneOrder += 1;
        return lane;
      };

      // displayId採番用
      let displayIdCounter = currentProcesses.reduce((max, p) => Math.max(max, p.displayId ?? 0), 0);

      // 事前に displayId を全行へ確定させる（欠損は採番）
      parsed.rows.forEach((row) => {
        if (row.displayId === undefined) {
          row.displayId = ++displayIdCounter;
        }
      });

      // 既存工程も含めた displayId -> id マップを先に用意する
      const idByDisplayId = new Map<number, string>();
      currentProcesses.forEach(p => {
        if (p.displayId !== undefined && p.displayId !== null) {
          idByDisplayId.set(p.displayId, p.id);
        }
      });
      const importedRows: Array<{ displayId: number; beforeDisplayIds: number[] }> = [];

      // 1st pass: create/update without beforeProcessIds
      for (const row of parsed.rows) {
        const lane = await ensureLane(row.laneName);
        const displayId = row.displayId!;
        const basePayload = {
          name: row.name,
          largeName: row.largeName || row.name,
          mediumName: row.mediumName,
          smallName: row.smallName,
          detailName: row.detailName,
          laneId: lane.id,
          displayId,
          bpmnElement: (row.bpmnElement as Process['bpmnElement']) || 'task',
          taskType: row.taskType as Process['taskType'],
          gatewayType: row.gatewayType as Process['gatewayType'],
          eventType: row.eventType as Process['eventType'],
          parallelAllowed: row.parallelAllowed ?? false,
          workSeconds: row.workSeconds,
          skillLevel: row.skillLevel,
          systemName: row.systemName,
          documentation: row.documentation,
          customColumns: Object.keys(row.customColumns).length > 0 ? row.customColumns : undefined,
        };

        const existing = currentProcesses.find((p) => p.displayId === displayId);
        if (existing) {
          const { error } = await processIPC.update(existing.id, basePayload);
          if (error) throw new Error(`displayId ${displayId}: 更新に失敗しました - ${error}`);
          idByDisplayId.set(displayId, existing.id);
        } else {
          const { data, error } = await processIPC.create({
            processTableId,
            ...basePayload,
            beforeProcessIds: [],
          });
          if (error || !data) throw new Error(`displayId ${displayId}: 作成に失敗しました - ${error || 'unknown'}`);
          idByDisplayId.set(displayId, data.id);
        }

        importedRows.push({ displayId, beforeDisplayIds: row.beforeDisplayIds });
      }

      // 2nd pass: 最新データを再取得してから前工程を反映
      const refreshed = await processIPC.getByProcessTable(processTableId);
      if (refreshed.error) {
        showToast('error', `工程の再取得に失敗しました: ${refreshed.error}`);
        return;
      }
      const refreshedProcs = refreshed.data || [];
      const displayIdMap = new Map<number, string>();
      refreshedProcs.forEach(p => {
        if (p.displayId !== undefined && p.displayId !== null) displayIdMap.set(p.displayId, p.id);
      });

      const unresolvedBefore: Array<{ displayId: number; missing: number[] }> = [];

      for (const item of importedRows) {
        const targetId = displayIdMap.get(item.displayId);
        if (!targetId) continue;
        const missingRefs: number[] = [];
        const beforeIds = item.beforeDisplayIds
          .map((d) => {
            const resolved = displayIdMap.get(d);
            if (!resolved) missingRefs.push(d);
            return resolved;
          })
          .filter((v): v is string => Boolean(v));
        const { error } = await processIPC.update(targetId, { beforeProcessIds: beforeIds });
        if (error) throw new Error(`displayId ${item.displayId}: 前工程の設定に失敗しました - ${error}`);
        if (missingRefs.length > 0) {
          unresolvedBefore.push({ displayId: item.displayId, missing: missingRefs });
        }
      }

      if (unresolvedBefore.length > 0) {
        const message = unresolvedBefore
          .slice(0, 5)
          .map((u) => `displayId ${u.displayId}: ${u.missing.join(', ')}`)
          .join('\n');
        const suffix = unresolvedBefore.length > 5 ? `\n...ほか${unresolvedBefore.length - 5}件` : '';
        showToast('warning', `前工程に該当するdisplayIdが見つかりませんでした:\n${message}${suffix}`);
      }

      showToast('success', 'CSVインポートが完了しました');
      loadProcesses();
      onUpdate();
    } catch (error) {
      console.error('[ProcessManagement] CSV import failed:', error);
      showToast('error', `CSVインポートに失敗しました: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsImporting(false);
      event.target.value = '';
    }
  };

  // フィルタリセット
  const handleResetFilters = () => {
    setFilterSwimlane('all');
    setFilterTaskType('all');
  };

  return (
    <div className="space-y-4">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
            工程一覧
          </h2>
          <Chip size="sm" variant="flat" color="default">
            {filteredProcesses.length}件
          </Chip>
        </div>
        <div className="flex items-center space-x-2">
          {selectedKeys.size > 0 && (
            <Button
              color="danger"
              variant="flat"
              size="sm"
              startContent={<TrashIcon className="w-4 h-4" />}
              onPress={handleBulkDelete}
            >
              選択した{selectedKeys.size}件を削除
            </Button>
          )}
          <Button
            color="default"
            variant="flat"
            size="sm"
            startContent={<ArrowPathIcon className="w-4 h-4" />}
            onPress={loadProcesses}
            isLoading={isLoading}
          >
            更新
          </Button>
          <Button
            color="primary"
            size="sm"
            startContent={<PlusIcon className="w-4 h-4" />}
            onPress={handleCreate}
          >
            新しい工程を追加
          </Button>
          <div className="flex items-center gap-2">
            <Select
              label="CSV文字コード"
              size="sm"
              selectedKeys={[csvEncoding]}
              onSelectionChange={(keys) => {
                const value = Array.from(keys)[0] as CharEncoding;
                setCsvEncoding(value || 'utf-8');
              }}
              className="w-40"
            >
              <SelectItem key="utf-8">UTF-8</SelectItem>
              <SelectItem key="shift-jis">Shift-JIS</SelectItem>
            </Select>
            <Button
              color="success"
              size="sm"
              startContent={<ArrowDownTrayIcon className="w-4 h-4" />}
              onPress={handleExportCSV}
            >
              CSVエクスポート
            </Button>
            <Button
              color="secondary"
              size="sm"
              variant="flat"
              onPress={handleImportCSVClick}
              isLoading={isImporting}
            >
              CSVインポート
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={handleImportCSVFile}
            />
          </div>
        </div>
      </div>

      {/* フィルタ */}
      <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <FunnelIcon className="w-5 h-5 text-gray-500" />
        <Select
          label="スイムレーン"
          size="sm"
          selectedKeys={[filterSwimlane]}
          onSelectionChange={(keys) => {
            const value = Array.from(keys)[0] as string;
            setFilterSwimlane(value || 'all');
          }}
          className="max-w-xs"
        >
          {[{ key: 'all', label: 'すべて' }, ...swimlanes.map(s => ({ key: s.id, label: s.name }))].map(item => (
            <SelectItem key={item.key}>
              {item.label}
            </SelectItem>
          ))}
        </Select>

        <Select
          label="タスクタイプ"
          size="sm"
          selectedKeys={[filterTaskType]}
          onSelectionChange={(keys) => {
            const value = Array.from(keys)[0] as string;
            setFilterTaskType(value || 'all');
          }}
          className="max-w-xs"
        >
          {[{ key: 'all', label: 'すべて' }, ...Object.keys(TASK_TYPE_CONFIG).map(type => ({ 
            key: type, 
            label: `${TASK_TYPE_CONFIG[type].icon} ${TASK_TYPE_CONFIG[type].label}` 
          }))].map(item => (
            <SelectItem key={item.key}>
              {item.label}
            </SelectItem>
          ))}
        </Select>

        <Button
          size="sm"
          variant="light"
          onPress={handleResetFilters}
        >
          リセット
        </Button>
      </div>

      {/* テーブル */}
      <Table
        aria-label="工程一覧テーブル"
        selectionMode="multiple"
        selectedKeys={selectedKeys}
        onSelectionChange={(keys) => setSelectedKeys(keys as Set<string>)}
        classNames={{
          wrapper: 'shadow-sm',
        }}
      >
        <TableHeader>
          <TableColumn>工程名</TableColumn>
          <TableColumn>スイムレーン</TableColumn>
          <TableColumn>BPMN要素</TableColumn>
          <TableColumn>タスクタイプ</TableColumn>
          <TableColumn>前工程</TableColumn>
          <TableColumn>次工程</TableColumn>
          {/* TODO: カスタム列の動的表示（HeroUI制限により将来実装） */}
          <TableColumn>説明</TableColumn>
          <TableColumn align="center">操作</TableColumn>
        </TableHeader>
        <TableBody
          items={filteredProcesses}
          emptyContent={
            <div className="text-center py-8 text-gray-500">
              {processes.length === 0
                ? '工程がまだ登録されていません'
                : 'フィルタ条件に一致する工程がありません'}
            </div>
          }
          isLoading={isLoading}
        >
          {(process) => (
            <TableRow key={process.id}>
              <TableCell>
                <div className="font-medium text-gray-900 dark:text-gray-50">
                  {process.name}
                </div>
              </TableCell>
              <TableCell>
                <Chip size="sm" variant="flat" color="primary">
                  {getSwimlaneName(process.laneId)}
                </Chip>
              </TableCell>
              <TableCell>
                <Chip size="sm" variant="flat" color="default">
                  {process.bpmnElement || 'task'}
                </Chip>
              </TableCell>
              <TableCell>
                <Chip
                  size="sm"
                  variant="flat"
                  color={process.taskType ? TASK_TYPE_CONFIG[process.taskType]?.color || 'default' : 'default'}
                  startContent={
                    <span>{process.taskType ? TASK_TYPE_CONFIG[process.taskType]?.icon || '📌' : '📌'}</span>
                  }
                >
                  {process.taskType ? TASK_TYPE_CONFIG[process.taskType]?.label || process.taskType : '-'}
                </Chip>
              </TableCell>
              <TableCell>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {getBeforeProcessNames(process.beforeProcessIds)}
                </div>
              </TableCell>
              <TableCell>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {getNextProcessNames(process.nextProcessIds)}
                </div>
              </TableCell>
              {/* TODO: カスタム列値の表示（HeroUI制限により将来実装） */}
              <TableCell>
                <div className="text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">
                  {process.documentation || '-'}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-center gap-1">
                  <Tooltip content="上に移動">
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      onPress={() => handleMoveUp(process)}
                    >
                      <ArrowUpIcon className="w-4 h-4" />
                    </Button>
                  </Tooltip>
                  <Tooltip content="下に移動">
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      onPress={() => handleMoveDown(process)}
                    >
                      <ArrowDownIcon className="w-4 h-4" />
                    </Button>
                  </Tooltip>
                  <Tooltip content="編集">
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      onPress={() => handleEdit(process)}
                    >
                      <PencilIcon className="w-4 h-4" />
                    </Button>
                  </Tooltip>
                  <Tooltip content="削除" color="danger">
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      color="danger"
                      onPress={() => handleDelete(process.id)}
                    >
                      <TrashIcon className="w-4 h-4" />
                    </Button>
                  </Tooltip>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* 工程作成・編集モーダル */}
      <ProcessFormModal
        isOpen={isOpen}
        onClose={onClose}
        onSubmit={handleSubmit}
        editingProcess={editingProcess}
        swimlanes={swimlanes}
        processes={processes}
        customColumns={customColumns}
        dataObjects={dataObjects}
        processTable={processTable}
      />
    </div>
  );
}
