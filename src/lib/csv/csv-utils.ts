/**
 * CSV ユーティリティ関数
 * CSV操作の共通機能を提供
 */

import Papa from 'papaparse';
import {
  toNumber,
  toBoolean,
  splitToArray,
  trimToUndefined,
  parseJsonArray as parseJsonArrayCommon,
  safeJsonStringify,
} from '@/lib/common';

// ==========================================
// 型定義
// ==========================================

export type CharEncoding = 'utf-8' | 'shift-jis';

export interface CsvParseOptions {
  /** ヘッダー行を使用 */
  header?: boolean;
  /** 空行をスキップ */
  skipEmptyLines?: boolean | 'greedy';
  /** 変換関数 */
  transform?: (value: string, field: string) => unknown;
}

export interface CsvExportOptions {
  /** 文字エンコーディング */
  encoding?: CharEncoding;
  /** ファイル名 */
  filename?: string;
  /** ヘッダーを含める */
  includeHeaders?: boolean;
}

export interface CsvValidationError {
  row: number;
  column?: string;
  message: string;
}

export interface CsvValidationWarning {
  row: number;
  column?: string;
  message: string;
}

// ==========================================
// パース
// ==========================================

/**
 * CSVテキストをパース
 */
export function parseCsv<T extends Record<string, string>>(
  text: string,
  options: CsvParseOptions = {}
): {
  data: T[];
  errors: CsvValidationError[];
} {
  const {
    header = true,
    skipEmptyLines = 'greedy',
    transform,
  } = options;

  const errors: CsvValidationError[] = [];

  const result = Papa.parse<T>(text, {
    header,
    skipEmptyLines,
    transform,
  });

  if (result.errors.length > 0) {
    errors.push(
      ...result.errors.map(e => ({
        row: e.row ?? 0,
        message: `CSV parse error: ${e.message}`,
      }))
    );
  }

  return { data: result.data, errors };
}

/**
 * CSVファイルをパース
 */
export async function parseCsvFile<T extends Record<string, string>>(
  file: File,
  options: CsvParseOptions = {}
): Promise<{ data: T[]; errors: CsvValidationError[] }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        resolve(parseCsv<T>(text, options));
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error('ファイルの読み込みに失敗しました'));
    reader.readAsText(file);
  });
}

// ==========================================
// 生成
// ==========================================

/**
 * データをCSV文字列に変換
 */
export function generateCsv(
  data: Record<string, unknown>[],
  fields?: string[]
): string {
  return Papa.unparse({
    fields: fields ?? Object.keys(data[0] ?? {}),
    data,
  });
}

/**
 * データをCSVファイルとしてダウンロード
 */
export function downloadCsv(
  data: Record<string, unknown>[],
  options: CsvExportOptions = {}
): void {
  const {
    encoding = 'utf-8',
    filename = 'export.csv',
  } = options;

  const csvContent = generateCsv(data);

  // UTF-8 BOM を追加
  const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
  const content = new TextEncoder().encode(csvContent);
  const blob = new Blob([bom, content], { type: 'text/csv;charset=utf-8;' });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ==========================================
// 値の変換
// ==========================================

/**
 * CSV値を数値に変換
 */
export function csvToNumber(value: string | undefined): number | undefined {
  return toNumber(value);
}

/**
 * CSV値をbooleanに変換
 */
export function csvToBoolean(value: string | undefined): boolean | undefined {
  return toBoolean(value);
}

/**
 * CSV値を配列に変換（カンマ区切り）
 */
export function csvToArray(value: string | undefined): string[] {
  return splitToArray(value);
}

/**
 * CSV値をJSON配列として変換
 */
export function csvToJsonArray<T>(value: string | undefined): T[] | undefined {
  if (!value || value.trim() === '') return undefined;
  return parseJsonArrayCommon<T>(value);
}

/**
 * 数値をCSV用にフォーマット
 */
export function numberToCsv(value: number | undefined | null): string {
  return value === undefined || value === null ? '' : String(value);
}

/**
 * booleanをCSV用にフォーマット
 */
export function booleanToCsv(value: boolean | undefined | null): string {
  return value === undefined || value === null ? '' : value ? 'true' : 'false';
}

/**
 * 配列をCSV用にフォーマット
 */
export function arrayToCsv(values: string[] | undefined | null): string {
  return values?.join(',') ?? '';
}

/**
 * オブジェクトをJSON文字列としてCSV用にフォーマット
 */
export function objectToCsv(value: unknown): string {
  if (value === undefined || value === null) return '';
  if (Array.isArray(value) && value.length === 0) return '';
  return safeJsonStringify(value);
}

// ==========================================
// ファイル名生成
// ==========================================

/**
 * CSVファイル名を生成
 */
export function generateCsvFilename(
  baseName: string,
  timestamp = true
): string {
  if (timestamp) {
    const now = new Date();
    const ts = now.toISOString().replace(/[:.]/g, '-').slice(0, -5);
    return `${baseName}_${ts}.csv`;
  }
  return `${baseName}.csv`;
}

// ==========================================
// バリデーション
// ==========================================

/**
 * 必須フィールドのバリデーション
 */
export function validateCsvRequired(
  value: string | undefined,
  fieldName: string,
  row: number
): CsvValidationError | null {
  if (!value || value.trim() === '') {
    return {
      row,
      column: fieldName,
      message: `${fieldName}が空です`,
    };
  }
  return null;
}

/**
 * 重複チェック
 */
export function validateCsvUnique<T>(
  data: T[],
  getValue: (item: T) => string | number | undefined,
  fieldName: string
): CsvValidationError[] {
  const errors: CsvValidationError[] = [];
  const seen = new Map<string | number, number>();

  data.forEach((item, index) => {
    const value = getValue(item);
    if (value !== undefined && value !== '') {
      const prevRow = seen.get(value);
      if (prevRow !== undefined) {
        errors.push({
          row: index + 2, // ヘッダー + 1-indexed
          column: fieldName,
          message: `${fieldName}「${value}」が重複しています（行${prevRow}と）`,
        });
      } else {
        seen.set(value, index + 2);
      }
    }
  });

  return errors;
}

/**
 * 参照の存在チェック
 */
export function validateCsvReference(
  value: string | undefined,
  validValues: Set<string>,
  fieldName: string,
  row: number
): CsvValidationWarning | null {
  if (!value) return null;

  if (!validValues.has(value)) {
    return {
      row,
      column: fieldName,
      message: `${fieldName}「${value}」が存在しません`,
    };
  }
  return null;
}

/**
 * 複数参照の存在チェック
 */
export function validateCsvReferences(
  values: string[] | undefined,
  validValues: Set<string>,
  fieldName: string,
  row: number
): CsvValidationWarning[] {
  if (!values || values.length === 0) return [];

  const warnings: CsvValidationWarning[] = [];

  values.forEach(value => {
    if (!validValues.has(value)) {
      warnings.push({
        row,
        column: fieldName,
        message: `${fieldName}に指定された「${value}」が存在しません`,
      });
    }
  });

  return warnings;
}
