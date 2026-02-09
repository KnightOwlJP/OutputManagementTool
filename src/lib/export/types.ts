/**
 * エクスポート/インポート共通型定義
 */

import type {
  ProcessTable,
  Process,
  Swimlane,
  CustomColumn,
  DataObject,
} from '@/types/models';

// ==========================================
// エクスポート形式
// ==========================================

export type ExportFormat = 'excel' | 'excel-flow' | 'csv' | 'bpmn-xml' | 'json';

export const EXPORT_FORMAT_LABELS: Record<ExportFormat, string> = {
  'excel': 'Excel（データ形式）',
  'excel-flow': 'Excel（フロー図付き）',
  'csv': 'CSV',
  'bpmn-xml': 'BPMN 2.0 XML',
  'json': 'JSON',
};

export const EXPORT_FORMAT_DESCRIPTIONS: Record<ExportFormat, string> = {
  'excel': '工程データをExcelファイルとしてエクスポートします。再インポート可能な形式です。',
  'excel-flow': '工程データに加え、フロー図をExcelシートとして含みます。',
  'csv': 'CSVファイルとしてエクスポートします。他のツールとの連携に便利です。',
  'bpmn-xml': 'BPMN 2.0標準形式でエクスポートします。他のBPMNツールで開けます。',
  'json': 'JSON形式でエクスポートします。開発者向けです。',
};

export const EXPORT_FORMAT_EXTENSIONS: Record<ExportFormat, string> = {
  'excel': '.xlsx',
  'excel-flow': '.xlsx',
  'csv': '.csv',
  'bpmn-xml': '.bpmn',
  'json': '.json',
};

// ==========================================
// エクスポートオプション
// ==========================================

export interface ExportOptions {
  /** エクスポート形式 */
  format: ExportFormat;
  /** ファイル名（拡張子なし） */
  filename?: string;
  /** カスタム列を含める */
  includeCustomColumns?: boolean;
  /** BPMN詳細情報を含める */
  includeBpmnDetails?: boolean;
  /** メタデータを含める */
  includeMetadata?: boolean;
  /** CSVエンコーディング */
  csvEncoding?: 'utf-8' | 'shift-jis';
  /** フロー図オプション */
  flowOptions?: FlowExportOptions;
}

export interface FlowExportOptions {
  /** セル幅（ピクセル） */
  cellWidth?: number;
  /** セル高さ（ピクセル） */
  cellHeight?: number;
  /** レーンヘッダー幅 */
  laneHeaderWidth?: number;
  /** 接続線を表示 */
  showConnections?: boolean;
  /** 工数を表示 */
  showWorkHours?: boolean;
  /** リードタイムを表示 */
  showLeadTime?: boolean;
}

// ==========================================
// エクスポートデータ
// ==========================================

export interface ExportData {
  processTable: ProcessTable;
  processes: Process[];
  swimlanes: Swimlane[];
  customColumns: CustomColumn[];
  dataObjects?: DataObject[];
}

export interface ExportResult {
  success: boolean;
  filename: string;
  format: ExportFormat;
  data?: ArrayBuffer | string;
  error?: string;
}

// ==========================================
// インポート形式
// ==========================================

export type ImportFormat = 'excel' | 'csv' | 'json';

export const IMPORT_FORMAT_LABELS: Record<ImportFormat, string> = {
  'excel': 'Excel (.xlsx)',
  'csv': 'CSV (.csv)',
  'json': 'JSON (.json)',
};

// ==========================================
// インポートオプション
// ==========================================

export interface ImportOptions {
  /** インポート形式（自動検出の場合は未指定） */
  format?: ImportFormat;
  /** 既存データとマージするか */
  mergeWithExisting?: boolean;
  /** 重複時の動作 */
  onDuplicate?: 'skip' | 'overwrite' | 'error';
  /** CSVエンコーディング */
  csvEncoding?: 'utf-8' | 'shift-jis';
}

// ==========================================
// インポート結果
// ==========================================

export interface ImportPreview {
  /** パース成功かどうか */
  valid: boolean;
  /** インポートされるデータの概要 */
  summary: ImportSummary;
  /** パースされたデータ */
  data: Partial<ExportData>;
  /** エラー一覧 */
  errors: ImportError[];
  /** 警告一覧 */
  warnings: ImportWarning[];
  /** 既存データとの差分（マージモード時） */
  diff?: ImportDiff;
}

export interface ImportSummary {
  swimlaneCount: number;
  processCount: number;
  customColumnCount: number;
  dataObjectCount: number;
}

export interface ImportError {
  row?: number;
  column?: string;
  message: string;
  suggestion?: string;
}

export interface ImportWarning {
  row?: number;
  column?: string;
  message: string;
}

export interface ImportDiff {
  added: {
    swimlanes: string[];
    processes: string[];
    customColumns: string[];
  };
  modified: {
    swimlanes: string[];
    processes: string[];
    customColumns: string[];
  };
  removed: {
    swimlanes: string[];
    processes: string[];
    customColumns: string[];
  };
}

export interface ImportResult {
  success: boolean;
  summary: ImportSummary;
  errors: ImportError[];
  warnings: ImportWarning[];
}

// ==========================================
// デフォルト値
// ==========================================

export const DEFAULT_EXPORT_OPTIONS: ExportOptions = {
  format: 'excel',
  includeCustomColumns: true,
  includeBpmnDetails: false,
  includeMetadata: true,
  csvEncoding: 'utf-8',
};

export const DEFAULT_FLOW_OPTIONS: FlowExportOptions = {
  cellWidth: 120,
  cellHeight: 60,
  laneHeaderWidth: 100,
  showConnections: true,
  showWorkHours: true,
  showLeadTime: true,
};

export const DEFAULT_IMPORT_OPTIONS: ImportOptions = {
  mergeWithExisting: false,
  onDuplicate: 'error',
  csvEncoding: 'utf-8',
};
