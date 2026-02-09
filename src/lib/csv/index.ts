/**
 * CSV モジュール
 * CSV操作の統一インターフェース
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
  // パース
  parseCsv,
  parseCsvFile,
  
  // 生成
  generateCsv,
  downloadCsv,
  
  // 値変換
  csvToNumber,
  csvToBoolean,
  csvToArray,
  csvToJsonArray,
  numberToCsv,
  booleanToCsv,
  arrayToCsv,
  objectToCsv,
  
  // ファイル名
  generateCsvFilename,
  
  // バリデーション
  validateCsvRequired,
  validateCsvUnique,
  validateCsvReference,
  validateCsvReferences,
  
  // 型
  type CharEncoding,
  type CsvParseOptions,
  type CsvExportOptions,
  type CsvValidationError,
  type CsvValidationWarning,
} from './csv-utils';

// エクスポート
export {
  exportProcessesToCsv,
  type ProcessCsvExportOptions,
} from './csv-export';

// インポート
export {
  parseProcessCsv,
  type ParsedCsvProcess,
  type CsvImportResult,
  type CsvImportOptions,
} from './csv-import';
