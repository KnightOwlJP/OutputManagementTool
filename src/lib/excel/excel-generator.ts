/**
 * Excel ジェネレーター（統合版）
 * データをExcelファイルにエクスポートするための統一インターフェース
 */

import * as XLSX from 'xlsx';
import {
  writeWorkbook,
  jsonToSheet,
  aoaToSheet,
  setColumnWidths,
  applyStyleToRange,
  applyStyle,
  HEADER_STYLE,
  TITLE_STYLE,
  formatCustomColumnValue,
  downloadExcel,
  generateExcelFileName,
} from './excel-utils';
import {
  type ProcessTable,
  type Swimlane,
  type CustomColumn,
  type Process,
  type ProcessLevel,
} from '@/types/models';
import { formatDateTimeJP, formatDateISO } from '@/lib/common';

// ==========================================
// 型定義
// ==========================================

export interface ExcelExportOptions {
  /** ヘッダーを含める */
  includeHeaders?: boolean;
  /** カスタム列を含める */
  includeCustomColumns?: boolean;
  /** BPMN詳細情報を含める */
  includeBpmnDetails?: boolean;
  /** メタデータを含める */
  includeMetadata?: boolean;
  /** シート名 */
  sheetName?: string;
}

// ==========================================
// 工程表エクスポート（Phase 9 フォーマット）
// ==========================================

/**
 * 工程表データをExcelにエクスポート
 */
export function generateProcessTableExcel(
  processTable: ProcessTable,
  swimlanes: Swimlane[],
  processes: Process[],
  customColumns: CustomColumn[],
  options: ExcelExportOptions = {}
): ArrayBuffer {
  const workbook = XLSX.utils.book_new();

  // 1. 工程表情報シート
  addProcessTableInfoSheet(workbook, processTable);

  // 2. レーンシート
  addSwimlanesSheet(workbook, swimlanes);

  // 3. カスタム列定義シート（存在する場合）
  if (customColumns.length > 0) {
    addCustomColumnsSheet(workbook, customColumns);
  }

  // 4. 工程データシート
  addProcessesSheet(workbook, processes, swimlanes, customColumns, options);

  return writeWorkbook(workbook);
}

/**
 * 工程表情報シートを追加
 */
function addProcessTableInfoSheet(
  workbook: XLSX.WorkBook,
  processTable: ProcessTable
): void {
  const data = [
    ['工程表情報'],
    [],
    ['項目', '値'],
    ['工程表ID', processTable.id],
    ['プロジェクトID', processTable.projectId],
    ['工程表名', processTable.name],
    ['階層レベル', getLevelLabel(processTable.level)],
    ['説明', processTable.description || ''],
    ['表示順', processTable.displayOrder],
    ['作成日時', formatDateTimeJP(processTable.createdAt)],
    ['更新日時', formatDateTimeJP(processTable.updatedAt)],
  ];

  const sheet = aoaToSheet(data);
  setColumnWidths(sheet, [20, 50]);
  applyStyle(sheet, 'A1', TITLE_STYLE);
  applyStyleToRange(sheet, 'A3:B3', HEADER_STYLE);

  XLSX.utils.book_append_sheet(workbook, sheet, '工程表情報');
}

/**
 * レーンシートを追加
 */
function addSwimlanesSheet(
  workbook: XLSX.WorkBook,
  swimlanes: Swimlane[]
): void {
  const headers = ['レーンID', 'レーン名', '色', '順序'];
  const rows = swimlanes
    .sort((a, b) => a.order - b.order)
    .map(lane => [lane.id, lane.name, lane.color, lane.order]);

  const data = [headers, ...rows];
  const sheet = aoaToSheet(data);
  setColumnWidths(sheet, [25, 30, 10, 8]);
  applyStyleToRange(sheet, 'A1:D1', HEADER_STYLE);

  XLSX.utils.book_append_sheet(workbook, sheet, 'レーン');
}

/**
 * カスタム列定義シートを追加
 */
function addCustomColumnsSheet(
  workbook: XLSX.WorkBook,
  customColumns: CustomColumn[]
): void {
  const headers = ['列ID', '列名', 'データ型', '選択肢', '必須', '順序'];
  const rows = customColumns
    .sort((a, b) => a.order - b.order)
    .map(col => [
      col.id,
      col.name,
      col.type,
      col.options?.join(', ') || '',
      col.required ? '○' : '',
      col.order,
    ]);

  const data = [headers, ...rows];
  const sheet = aoaToSheet(data);
  setColumnWidths(sheet, [25, 30, 12, 40, 6, 8]);
  applyStyleToRange(sheet, 'A1:F1', HEADER_STYLE);

  XLSX.utils.book_append_sheet(workbook, sheet, 'カスタム列定義');
}

/**
 * 工程データシートを追加
 */
function addProcessesSheet(
  workbook: XLSX.WorkBook,
  processes: Process[],
  swimlanes: Swimlane[],
  customColumns: CustomColumn[],
  options: ExcelExportOptions
): void {
  const { includeBpmnDetails = false, includeCustomColumns = true } = options;

  // ヘッダー行
  const headers = [
    '順序',
    '工程ID',
    '工程名',
    '大工程名',
    '中工程名',
    '小工程名',
    '詳細工程名',
    'レーンID',
    'レーン名',
    'BPMN要素',
    'タスク種類',
    '前工程ID',
    '次工程ID',
  ];

  // 列幅
  const colWidths = [8, 25, 40, 20, 20, 20, 30, 25, 20, 12, 15, 30, 30];

  // BPMN詳細情報
  if (includeBpmnDetails) {
    headers.push(
      'ドキュメント',
      'ゲートウェイ種類',
      'イベント種類',
      'データオブジェクト（入力）',
      'データオブジェクト（出力）'
    );
    colWidths.push(40, 15, 15, 30, 30);
  }

  // カスタム列
  const sortedCustomColumns = includeCustomColumns
    ? [...customColumns].sort((a, b) => a.order - b.order)
    : [];

  sortedCustomColumns.forEach(col => {
    headers.push(col.name);
    colWidths.push(20);
  });

  // レーン名マップ
  const laneMap = new Map(swimlanes.map(l => [l.id, l.name]));

  // データ行
  const rows = processes
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map(process => {
      const row: unknown[] = [
        process.displayOrder,
        process.id,
        process.name,
        process.largeName || '',
        process.mediumName || '',
        process.smallName || '',
        process.detailName || '',
        process.laneId,
        laneMap.get(process.laneId) || '',
        process.bpmnElement,
        process.taskType || '',
        process.beforeProcessIds?.join(', ') || '',
        process.nextProcessIds?.join(', ') || '',
      ];

      // BPMN詳細情報
      if (includeBpmnDetails) {
        row.push(
          process.documentation || '',
          process.gatewayType || '',
          process.eventType || '',
          process.inputDataObjects?.join(', ') || '',
          process.outputDataObjects?.join(', ') || ''
        );
      }

      // カスタム列の値
      sortedCustomColumns.forEach(col => {
        const value = process.customColumns?.[col.id];
        row.push(formatCustomColumnValue(value, col.type));
      });

      return row;
    });

  const data = [headers, ...rows];
  const sheet = aoaToSheet(data);
  setColumnWidths(sheet, colWidths);

  // ヘッダースタイル
  const headerRange = `A1:${XLSX.utils.encode_col(headers.length - 1)}1`;
  applyStyleToRange(sheet, headerRange, HEADER_STYLE);

  XLSX.utils.book_append_sheet(workbook, sheet, '工程データ');
}

// ==========================================
// テンプレート生成
// ==========================================

/**
 * 工程表テンプレートを生成
 */
export function generateProcessTableTemplate(): ArrayBuffer {
  const workbook = XLSX.utils.book_new();

  // 使い方シート
  const instructions = [
    ['工程表テンプレート'],
    [],
    ['このテンプレートを使用して新しい工程表を作成できます。'],
    ['各シートにサンプルデータが含まれています。'],
    [],
    ['使い方：'],
    ['1. 「レーン」シートでスイムレーンを定義'],
    ['2. 「カスタム列定義」シートで追加の列を定義（オプション）'],
    ['3. 「工程データ」シートで工程を入力'],
    ['4. ファイルを保存してインポート'],
  ];

  const instructionSheet = aoaToSheet(instructions);
  setColumnWidths(instructionSheet, [60]);
  XLSX.utils.book_append_sheet(workbook, instructionSheet, '使い方');

  // サンプルレーン
  const lanes = [
    ['レーンID', 'レーン名', '色', '順序'],
    ['lane-1', '営業部', '#3B82F6', 1],
    ['lane-2', '開発部', '#10B981', 2],
    ['lane-3', '品質管理部', '#F59E0B', 3],
  ];

  const laneSheet = aoaToSheet(lanes);
  setColumnWidths(laneSheet, [25, 30, 10, 8]);
  applyStyleToRange(laneSheet, 'A1:D1', HEADER_STYLE);
  XLSX.utils.book_append_sheet(workbook, laneSheet, 'レーン');

  // サンプルカスタム列
  const customCols = [
    ['列ID', '列名', 'データ型', '選択肢', '必須', '順序'],
    ['col-1', '優先度', 'SELECT', '高, 中, 低', '○', 1],
    ['col-2', '担当者', 'TEXT', '', '', 2],
    ['col-3', '完了予定日', 'DATE', '', '', 3],
  ];

  const customColSheet = aoaToSheet(customCols);
  setColumnWidths(customColSheet, [25, 30, 12, 40, 6, 8]);
  applyStyleToRange(customColSheet, 'A1:F1', HEADER_STYLE);
  XLSX.utils.book_append_sheet(workbook, customColSheet, 'カスタム列定義');

  // サンプル工程データ
  const processes = [
    [
      '順序',
      '工程ID',
      '工程名',
      '大工程名',
      '中工程名',
      '小工程名',
      '詳細工程名',
      'レーンID',
      'レーン名',
      'BPMN要素',
      'タスク種類',
      '前工程ID',
      '次工程ID',
    ],
    [1, 'proc-1', '要件ヒアリング', '', '', '', '', 'lane-1', '営業部', 'task', 'userTask', '', 'proc-2'],
    [2, 'proc-2', '要件定義書作成', '', '', '', '', 'lane-1', '営業部', 'task', 'manualTask', 'proc-1', 'proc-3'],
    [3, 'proc-3', '設計', '', '', '', '', 'lane-2', '開発部', 'task', 'userTask', 'proc-2', 'proc-4'],
    [4, 'proc-4', '実装', '', '', '', '', 'lane-2', '開発部', 'task', 'userTask', 'proc-3', 'proc-5'],
    [5, 'proc-5', 'テスト', '', '', '', '', 'lane-3', '品質管理部', 'task', 'userTask', 'proc-4', ''],
  ];

  const processSheet = aoaToSheet(processes);
  setColumnWidths(processSheet, [8, 25, 40, 20, 20, 20, 30, 25, 20, 12, 15, 30, 30]);
  applyStyleToRange(processSheet, 'A1:M1', HEADER_STYLE);
  XLSX.utils.book_append_sheet(workbook, processSheet, '工程データ');

  return writeWorkbook(workbook);
}

// ==========================================
// ダウンロードヘルパー
// ==========================================

/**
 * 工程表をダウンロード
 */
export function downloadProcessTableExcel(
  processTable: ProcessTable,
  swimlanes: Swimlane[],
  processes: Process[],
  customColumns: CustomColumn[],
  options: ExcelExportOptions = {}
): void {
  const arrayBuffer = generateProcessTableExcel(
    processTable,
    swimlanes,
    processes,
    customColumns,
    options
  );

  const fileName = generateExcelFileName(processTable.name);
  downloadExcel(arrayBuffer, fileName);
}

/**
 * テンプレートをダウンロード
 */
export function downloadProcessTableTemplate(): void {
  const arrayBuffer = generateProcessTableTemplate();
  const fileName = generateExcelFileName('工程表テンプレート');
  downloadExcel(arrayBuffer, fileName);
}

// ==========================================
// ユーティリティ
// ==========================================

/**
 * ProcessLevelを日本語ラベルに変換
 */
function getLevelLabel(level: ProcessLevel): string {
  const labels: Record<ProcessLevel, string> = {
    large: '大工程',
    medium: '中工程',
    small: '小工程',
    detail: '詳細工程',
  };
  return labels[level] || level;
}

// ==========================================
// レガシーエクスポート（後方互換性）
// ==========================================

/**
 * レガシー形式のExcelエクスポート
 * @deprecated 新しいgenerateProcessTableExcelを使用してください
 */
export function generateLegacyProcessExcel(
  processes: Process[],
  options: ExcelExportOptions = {}
): ArrayBuffer {
  const workbook = XLSX.utils.book_new();
  const { sheetName = '工程一覧', includeMetadata = true } = options;

  // 簡易的なデータ行
  const headers = [
    '大工程',
    '中工程',
    '小工程',
    '詳細工程',
    '説明',
    'ステータス',
  ];

  const rows = processes.map(p => [
    p.largeName || '',
    p.mediumName || '',
    p.smallName || '',
    p.name || '',
    p.documentation || '',
    '',
  ]);

  const data = [headers, ...rows];
  const sheet = aoaToSheet(data);
  setColumnWidths(sheet, [20, 20, 20, 30, 40, 12]);
  applyStyleToRange(sheet, 'A1:F1', HEADER_STYLE);

  XLSX.utils.book_append_sheet(workbook, sheet, sheetName);

  // メタデータシート
  if (includeMetadata) {
    const metadata = [
      ['エクスポート日時', formatDateTimeJP(new Date())],
      ['工程数', processes.length.toString()],
    ];

    const metaSheet = aoaToSheet(metadata);
    XLSX.utils.book_append_sheet(workbook, metaSheet, 'メタデータ');
  }

  return writeWorkbook(workbook);
}
