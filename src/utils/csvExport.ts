/**
 * CSVエクスポートユーティリティ
 */

import Papa from 'papaparse';
import { Process, Swimlane, CustomColumn, DataObject } from '@/types/models';

export type CharEncoding = 'utf-8' | 'shift-jis';

interface ExportOptions {
  processes: Process[];
  swimlanes: Swimlane[];
  customColumns: CustomColumn[];
  dataObjects?: DataObject[];
  encoding?: CharEncoding;
  filename?: string;
}

/**
 * タスクタイプの表示名取得
 */
const getTaskTypeLabel = (type: string | null | undefined): string => {
  if (!type) return '-';
  const taskTypes: Record<string, string> = {
    'user': 'ユーザータスク',
    'manual': 'マニュアルタスク',
    'service': 'サービスタスク',
    'script': 'スクリプトタスク',
    'send': '送信タスク',
    'receive': '受信タスク',
    'business-rule': 'ビジネスルールタスク',
    'call-activity': 'コールアクティビティ',
    'sub-process': 'サブプロセス',
  };
  return taskTypes[type] || type;
};

/**
 * BPMN要素タイプの表示名取得
 */
const getBpmnElementLabel = (type: string | null | undefined): string => {
  if (!type) return '-';
  const bpmnTypes: Record<string, string> = {
    'task': 'タスク',
    'gateway': 'ゲートウェイ',
    'event': 'イベント',
    'data-object': 'データオブジェクト',
  };
  return bpmnTypes[type] || type;
};

/**
 * スイムレーン名を取得
 */
const getSwimlaneName = (laneId: string | null | undefined, swimlanes: Swimlane[]): string => {
  if (!laneId) return '-';
  const lane = swimlanes.find(l => l.id === laneId);
  return lane?.name || '-';
};

/**
 * 工程データをCSV形式にエクスポート
 */
export const exportProcessesToCSV = async ({
  processes,
  swimlanes,
  customColumns,
  dataObjects = [],
  encoding = 'utf-8',
  filename = 'processes.csv',
}: ExportOptions): Promise<void> => {
  const displayIdByProcessId = new Map<string, number>();
  processes.forEach(p => {
    if (p.displayId !== undefined && p.displayId !== null) {
      displayIdByProcessId.set(p.id, p.displayId);
    }
  });

  const dataObjectNameById = new Map<string, string>();
  dataObjects.forEach(d => {
    dataObjectNameById.set(d.id, d.name);
  });

  const formatDisplayIdList = (ids?: string[]) =>
    (ids || [])
      .map(id => displayIdByProcessId.get(id))
      .filter((v): v is number => v !== undefined)
      .join(',');

  const formatHours = (seconds?: number | null) =>
    seconds === undefined || seconds === null ? '' : (seconds / 3600).toString();

  const formatDataObjects = (ids?: string[]) =>
    (ids || [])
      .map(id => dataObjectNameById.get(id))
      .filter((v): v is string => Boolean(v))
      .join(',');

  const formatConditionalFlows = (flows?: Process['conditionalFlows']) => {
    if (!flows || flows.length === 0) return '';
    const serialized = flows.map(flow => ({
      targetDisplayId: flow.targetProcessId ? displayIdByProcessId.get(flow.targetProcessId) : undefined,
      condition: flow.condition,
      description: flow.description,
    }));
    return JSON.stringify(serialized);
  };

  const formatMessageFlows = (flows?: Process['messageFlows']) => {
    if (!flows || flows.length === 0) return '';
    const serialized = flows.map(flow => ({
      targetDisplayId: (flow as any).targetProcessId ? displayIdByProcessId.get((flow as any).targetProcessId) : (flow as any).target ? displayIdByProcessId.get((flow as any).target) : undefined,
      messageContent: (flow as any).messageContent ?? (flow as any).message,
      description: (flow as any).description,
    }));
    return JSON.stringify(serialized);
  };

  const formatArtifacts = (artifacts?: Process['artifacts']) => {
    if (!artifacts || artifacts.length === 0) return '';
    return JSON.stringify(artifacts);
  };

  // ヘッダー行を作成
  const headers = [
    'displayId',
    'displayOrder',
    'name',
    'largeName',
    'mediumName',
    'smallName',
    'detailName',
    'lane',
    'bpmnElement',
    'taskType',
    'gatewayType',
    'eventType',
    'intermediateEventType',
    'parallelAllowed',
    'beforeDisplayIds',
    'nextDisplayIds',
    'parentDisplayId',
    'workHours',
    'workUnitPref',
    'skillLevel',
    'systemName',
    'issueDetail',
    'issueCategory',
    'countermeasurePolicy',
    'issueWorkHours',
    'timeReductionHours',
    'rateReductionPercent',
    'eventDetails',
    'inputDataObjects',
    'outputDataObjects',
    'conditionalFlows',
    'messageFlows',
    'artifacts',
    'documentation',
    ...customColumns.map(col => col.name),
  ];

  // データ行を作成
  const rows = processes.map(process => {
    const baseData = [
      process.displayId ?? '',
      process.displayOrder ?? '',
      process.name || '',
      process.largeName || '',
      process.mediumName || '',
      process.smallName || '',
      process.detailName || '',
      getSwimlaneName(process.laneId, swimlanes),
      process.bpmnElement || '',
      process.taskType || '',
      process.gatewayType || '',
      process.eventType || '',
      process.intermediateEventType || '',
      process.parallelAllowed ? 'true' : 'false',
      (process.beforeProcessIds || []).map(id => {
        const target = processes.find(p => p.id === id);
        return target?.displayId ?? '';
      }).filter(v => v !== '').join(','),
      formatDisplayIdList(process.nextProcessIds),
      process.parentProcessId ? displayIdByProcessId.get(process.parentProcessId) ?? '' : '',
      formatHours(process.workSeconds),
      process.workUnitPref || '',
      process.skillLevel || '',
      process.systemName || '',
      process.issueDetail || '',
      process.issueCategory || '',
      process.countermeasurePolicy || '',
      formatHours(process.issueWorkSeconds),
      formatHours(process.timeReductionSeconds),
      process.rateReductionPercent ?? '',
      process.eventDetails || '',
      formatDataObjects(process.inputDataObjects),
      formatDataObjects(process.outputDataObjects),
      formatConditionalFlows(process.conditionalFlows),
      formatMessageFlows(process.messageFlows),
      formatArtifacts(process.artifacts),
      process.documentation || '',
    ];

    // カスタム列のデータを追加
    const customData = customColumns.map(col => {
      const value = process.customColumns?.[col.id];
      if (value === null || value === undefined) return '';
      return String(value);
    });

    return [...baseData, ...customData];
  });

  // CSVデータを生成
  const csvContent = Papa.unparse({
    fields: headers,
    data: rows,
  });

  // 文字エンコーディングに応じてBlobを作成
  let blob: Blob;
  
  if (encoding === 'shift-jis') {
    // Shift-JISエンコーディング（ブラウザのTextEncoderはShift-JISをサポートしていないため、
    // 実際の本番環境では別のライブラリ（encoding-japaneseなど）が必要になる可能性があります）
    // ここではUTF-8にフォールバック
    console.warn('Shift-JIS encoding is not fully supported in browser. Falling back to UTF-8 with BOM.');
    const bom = new Uint8Array([0xEF, 0xBB, 0xBF]); // UTF-8 BOM
    const content = new TextEncoder().encode(csvContent);
    blob = new Blob([bom, content], { type: 'text/csv;charset=utf-8;' });
  } else {
    // UTF-8エンコーディング（BOM付き）
    const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
    const content = new TextEncoder().encode(csvContent);
    blob = new Blob([bom, content], { type: 'text/csv;charset=utf-8;' });
  }

  // ダウンロードを実行
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * ファイル名を生成（プロジェクト名と日時から）
 */
export const generateCSVFilename = (projectName?: string): string => {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const baseName = projectName ? `${projectName}_processes` : 'processes';
  return `${baseName}_${timestamp}.csv`;
};
