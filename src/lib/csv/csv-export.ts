/**
 * CSV エクスポート機能
 * 工程データをCSVファイルにエクスポート
 */

import {
  downloadCsv,
  generateCsvFilename,
  numberToCsv,
  booleanToCsv,
  arrayToCsv,
  objectToCsv,
  type CsvExportOptions,
} from './csv-utils';
import {
  createIdMap,
  secondsToHours,
} from '@/lib/common';
import type {
  Process,
  Swimlane,
  CustomColumn,
  DataObject,
} from '@/types/models';

// ==========================================
// 型定義
// ==========================================

export interface ProcessCsvExportOptions extends CsvExportOptions {
  /** 工程データ */
  processes: Process[];
  /** スイムレーン */
  swimlanes: Swimlane[];
  /** カスタム列 */
  customColumns: CustomColumn[];
  /** データオブジェクト */
  dataObjects?: DataObject[];
  /** プロジェクト名（ファイル名用） */
  projectName?: string;
}

// ==========================================
// ラベル変換マップ
// ==========================================

const TASK_TYPE_LABELS: Record<string, string> = {
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

const BPMN_ELEMENT_LABELS: Record<string, string> = {
  'task': 'タスク',
  'gateway': 'ゲートウェイ',
  'event': 'イベント',
  'data-object': 'データオブジェクト',
};

// ==========================================
// エクスポート関数
// ==========================================

/**
 * 工程データをCSVとしてエクスポート
 */
export function exportProcessesToCsv(options: ProcessCsvExportOptions): void {
  const {
    processes,
    swimlanes,
    customColumns,
    dataObjects = [],
    projectName,
    filename,
    encoding = 'utf-8',
  } = options;

  // マップ作成
  const displayIdMap = createDisplayIdMap(processes);
  const dataObjectNameMap = createDataObjectNameMap(dataObjects);
  const swimlaneNameMap = createSwimlaneNameMap(swimlanes);

  // ヘッダー
  const headers = buildHeaders(customColumns);

  // データ行
  const rows = processes.map(process =>
    buildProcessRow(
      process,
      displayIdMap,
      dataObjectNameMap,
      swimlaneNameMap,
      customColumns
    )
  );

  // CSVダウンロード
  const csvFilename = filename ?? generateCsvFilename(
    projectName ? `${projectName}_processes` : 'processes'
  );

  downloadCsv(
    rows.map(row => {
      const obj: Record<string, string> = {};
      headers.forEach((header, i) => {
        obj[header] = row[i] ?? '';
      });
      return obj;
    }),
    { encoding, filename: csvFilename }
  );
}

// ==========================================
// ヘルパー関数
// ==========================================

/**
 * displayId -> processId マップを作成
 */
function createDisplayIdMap(processes: Process[]): Map<string, number> {
  const map = new Map<string, number>();
  processes.forEach(p => {
    if (p.displayId !== undefined) {
      map.set(p.id, p.displayId);
    }
  });
  return map;
}

/**
 * dataObject id -> name マップを作成
 */
function createDataObjectNameMap(dataObjects: DataObject[]): Map<string, string> {
  return new Map(dataObjects.map(d => [d.id, d.name]));
}

/**
 * swimlane id -> name マップを作成
 */
function createSwimlaneNameMap(swimlanes: Swimlane[]): Map<string, string> {
  return new Map(swimlanes.map(s => [s.id, s.name]));
}

/**
 * CSVヘッダーを構築
 */
function buildHeaders(customColumns: CustomColumn[]): string[] {
  const baseHeaders = [
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
    'leadTimeHours',
    'leadTimeUnit',
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
  ];

  // カスタム列を追加
  const customHeaders = customColumns.map(col => col.name);

  return [...baseHeaders, ...customHeaders];
}

/**
 * 工程データをCSV行に変換
 */
function buildProcessRow(
  process: Process,
  displayIdMap: Map<string, number>,
  dataObjectNameMap: Map<string, string>,
  swimlaneNameMap: Map<string, string>,
  customColumns: CustomColumn[]
): string[] {
  // displayId -> processId 変換用ヘルパー
  const toDisplayIdList = (ids?: string[]): string =>
    (ids || [])
      .map(id => displayIdMap.get(id))
      .filter((v): v is number => v !== undefined)
      .join(',');

  // 時間をフォーマット
  const formatHours = (seconds?: number | null): string =>
    seconds === undefined || seconds === null
      ? ''
      : String(secondsToHours(seconds));

  // データオブジェクト名を取得
  const formatDataObjects = (ids?: string[]): string =>
    (ids || [])
      .map(id => dataObjectNameMap.get(id))
      .filter((v): v is string => Boolean(v))
      .join(',');

  // 条件付きフローをフォーマット
  const formatConditionalFlows = (flows?: Process['conditionalFlows']): string => {
    if (!flows || flows.length === 0) return '';
    return objectToCsv(
      flows.map(flow => ({
        targetDisplayId: flow.targetProcessId
          ? displayIdMap.get(flow.targetProcessId)
          : undefined,
        condition: flow.condition,
        description: flow.description,
      }))
    );
  };

  // メッセージフローをフォーマット
  const formatMessageFlows = (flows?: Process['messageFlows']): string => {
    if (!flows || flows.length === 0) return '';
    return objectToCsv(
      flows.map(flow => ({
        targetDisplayId: flow.targetProcessId
          ? displayIdMap.get(flow.targetProcessId)
          : undefined,
        messageContent: flow.messageContent,
        description: flow.description,
      }))
    );
  };

  // 基本データ
  const baseRow = [
    numberToCsv(process.displayId),
    numberToCsv(process.displayOrder),
    process.name || '',
    process.largeName || '',
    process.mediumName || '',
    process.smallName || '',
    process.detailName || '',
    swimlaneNameMap.get(process.laneId) || '',
    process.bpmnElement || '',
    process.taskType || '',
    process.gatewayType || '',
    process.eventType || '',
    process.intermediateEventType || '',
    booleanToCsv(process.parallelAllowed),
    toDisplayIdList(process.beforeProcessIds),
    toDisplayIdList(process.nextProcessIds),
    process.parentProcessId
      ? numberToCsv(displayIdMap.get(process.parentProcessId))
      : '',
    formatHours(process.workSeconds),
    process.workUnitPref || '',
    formatHours(process.leadTimeSeconds),
    process.leadTimeUnit || '',
    process.skillLevel || '',
    process.systemName || '',
    process.issueDetail || '',
    process.issueCategory || '',
    process.countermeasurePolicy || '',
    formatHours(process.issueWorkSeconds),
    formatHours(process.timeReductionSeconds),
    numberToCsv(process.rateReductionPercent),
    process.eventDetails || '',
    formatDataObjects(process.inputDataObjects),
    formatDataObjects(process.outputDataObjects),
    formatConditionalFlows(process.conditionalFlows),
    formatMessageFlows(process.messageFlows),
    objectToCsv(process.artifacts),
    process.documentation || '',
  ];

  // カスタム列データ
  const customData = customColumns.map(col => {
    const value = process.customColumns?.[col.id];
    if (value === null || value === undefined) return '';
    return String(value);
  });

  return [...baseRow, ...customData];
}
