/**
 * Excel モジュール
 * Excel操作の統一インターフェース
 * 
 * @deprecated このモジュールは非推奨です。
 * 新しい統合エクスポート/インポート機能を使用してください:
 * - エクスポート: import { exportData, exportAndDownload } from '@/lib/export';
 * - インポート: import { previewImport, executeImport } from '@/lib/export';
 * - UIコンポーネント: import { ExportDialog, ImportDialog } from '@/components/export';
 * 
 * このモジュールは後方互換性のために維持されていますが、将来のバージョンで削除される予定です。
 */

// ユーティリティ
export {
  // ワークブック操作
  readWorkbook,
  writeWorkbook,
  hasSheet,
  getSheet,
  sheetToJson,
  jsonToSheet,
  aoaToSheet,
  
  // セル値変換
  getCellString,
  getCellNumber,
  getCellBoolean,
  getCellDate,
  getCellArray,
  getCellJsonArray,
  
  // カスタム列
  parseCustomColumnValue,
  formatCustomColumnValue,
  
  // スタイル
  HEADER_STYLE,
  TITLE_STYLE,
  applyStyle,
  applyStyleToRange,
  setColumnWidths,
  type CellStyle,
  
  // バリデーション
  validateRequired,
  validateUnique,
  type ValidationError,
  type ValidationWarning,
  
  // ダウンロード
  downloadExcel,
  generateExcelFileName,
} from './excel-utils';

// パーサー
export {
  parseProcessTableExcel,
  parseLegacyProcessExcel,
  type ParseResult,
  type ParsedProcessTableData,
  type LegacyProcessRow,
} from './excel-parser';

// ジェネレーター
export {
  generateProcessTableExcel,
  generateProcessTableTemplate,
  generateLegacyProcessExcel,
  downloadProcessTableExcel,
  downloadProcessTableTemplate,
  type ExcelExportOptions,
} from './excel-generator';
