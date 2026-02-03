/**
 * Excel ユーティリティ関数
 * Excel操作の共通機能を提供
 */

import * as XLSX from 'xlsx';
import {
  toNumber,
  toDate,
  toBoolean,
  splitToArray,
  trimToUndefined,
  parseJsonArray,
  formatDateISO,
} from '@/lib/common';
import type { CustomColumnType } from '@/types/models';

// ==========================================
// ワークブック操作
// ==========================================

/**
 * ArrayBufferからワークブックを読み込む
 */
export function readWorkbook(buffer: ArrayBuffer): XLSX.WorkBook {
  try {
    return XLSX.read(buffer, { type: 'array' });
  } catch (error) {
    throw new Error(
      `Excelファイルの読み込みに失敗しました: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * ワークブックをArrayBufferに変換
 */
export function writeWorkbook(workbook: XLSX.WorkBook): ArrayBuffer {
  return XLSX.write(workbook, {
    bookType: 'xlsx',
    type: 'array',
    cellStyles: true,
  });
}

/**
 * シートが存在するか確認
 */
export function hasSheet(workbook: XLSX.WorkBook, sheetName: string): boolean {
  return workbook.SheetNames.includes(sheetName);
}

/**
 * シートを取得（存在しない場合はundefined）
 */
export function getSheet(
  workbook: XLSX.WorkBook,
  sheetName: string
): XLSX.WorkSheet | undefined {
  return workbook.Sheets[sheetName];
}

/**
 * シートをJSONとしてパース
 */
export function sheetToJson<T = Record<string, unknown>>(
  sheet: XLSX.WorkSheet,
  options?: XLSX.Sheet2JSONOpts
): T[] {
  return XLSX.utils.sheet_to_json<T>(sheet, options);
}

/**
 * JSONからシートを作成
 */
export function jsonToSheet(
  data: unknown[],
  options?: XLSX.JSON2SheetOpts
): XLSX.WorkSheet {
  return XLSX.utils.json_to_sheet(data, options);
}

/**
 * 配列の配列からシートを作成
 */
export function aoaToSheet(data: unknown[][]): XLSX.WorkSheet {
  return XLSX.utils.aoa_to_sheet(data);
}

// ==========================================
// セル値の変換
// ==========================================

/**
 * セル値を安全に文字列として取得
 */
export function getCellString(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  return String(value).trim();
}

/**
 * セル値を数値として取得
 */
export function getCellNumber(value: unknown): number | undefined {
  return toNumber(value);
}

/**
 * セル値をbooleanとして取得
 */
export function getCellBoolean(value: unknown): boolean | undefined {
  return toBoolean(value);
}

/**
 * セル値を日付として取得
 */
export function getCellDate(value: unknown): Date | undefined {
  if (value === null || value === undefined || value === '') {
    return undefined;
  }

  // Excelシリアル日付の場合
  if (typeof value === 'number') {
    try {
      const parsed = XLSX.SSF.parse_date_code(value);
      if (parsed) {
        return new Date(parsed.y, parsed.m - 1, parsed.d);
      }
    } catch {
      // 通常の数値として処理
    }
  }

  return toDate(value);
}

/**
 * セル値を配列として取得（カンマ区切り）
 */
export function getCellArray(value: unknown): string[] {
  return splitToArray(getCellString(value));
}

/**
 * セル値をJSON配列として取得
 */
export function getCellJsonArray<T>(value: unknown): T[] | undefined {
  const str = getCellString(value);
  return parseJsonArray<T>(str);
}

// ==========================================
// カスタム列値の変換
// ==========================================

/**
 * カスタム列の値をパース
 */
export function parseCustomColumnValue(
  value: unknown,
  type: CustomColumnType
): unknown {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  switch (type) {
    case 'NUMBER':
      return getCellNumber(value);
    
    case 'DATE':
      return getCellDate(value);
    
    case 'CHECKBOX':
      const str = getCellString(value);
      return str === '✓' || str === 'TRUE' || str === '1' || str === 'true';
    
    case 'SELECT':
    case 'TEXT':
    default:
      return getCellString(value);
  }
}

/**
 * カスタム列の値をフォーマット（エクスポート用）
 */
export function formatCustomColumnValue(
  value: unknown,
  type: CustomColumnType
): string {
  if (value === null || value === undefined) {
    return '';
  }

  switch (type) {
    case 'DATE':
      return value instanceof Date ? formatDateISO(value) : String(value);
    
    case 'CHECKBOX':
      return value ? '✓' : '';
    
    case 'NUMBER':
    case 'SELECT':
    case 'TEXT':
    default:
      return String(value);
  }
}

// ==========================================
// スタイル適用
// ==========================================

export interface CellStyle {
  fill?: {
    patternType: string;
    fgColor: { rgb: string };
    bgColor?: { rgb: string };
  };
  font?: {
    bold?: boolean;
    sz?: number;
    color?: { rgb: string };
  };
  alignment?: {
    horizontal?: 'left' | 'center' | 'right';
    vertical?: 'top' | 'center' | 'bottom';
  };
  border?: {
    top?: { style: string; color: { rgb: string } };
    bottom?: { style: string; color: { rgb: string } };
    left?: { style: string; color: { rgb: string } };
    right?: { style: string; color: { rgb: string } };
  };
}

/**
 * ヘッダースタイル
 */
export const HEADER_STYLE: CellStyle = {
  fill: {
    patternType: 'solid',
    fgColor: { rgb: '4472C4' },
    bgColor: { rgb: '4472C4' },
  },
  font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 11 },
  alignment: { horizontal: 'center', vertical: 'center' },
  border: {
    top: { style: 'thin', color: { rgb: '000000' } },
    bottom: { style: 'thin', color: { rgb: '000000' } },
    left: { style: 'thin', color: { rgb: '000000' } },
    right: { style: 'thin', color: { rgb: '000000' } },
  },
};

/**
 * タイトルスタイル
 */
export const TITLE_STYLE: CellStyle = {
  font: { bold: true, sz: 14, color: { rgb: '1F4E78' } },
  alignment: { horizontal: 'left', vertical: 'center' },
};

/**
 * セルにスタイルを適用
 */
export function applyStyle(
  sheet: XLSX.WorkSheet,
  cellRef: string,
  style: CellStyle
): void {
  if (!sheet[cellRef]) return;
  (sheet[cellRef] as XLSX.CellObject).s = style;
}

/**
 * 範囲にスタイルを適用
 */
export function applyStyleToRange(
  sheet: XLSX.WorkSheet,
  range: string,
  style: CellStyle
): void {
  const decoded = XLSX.utils.decode_range(range);
  for (let col = decoded.s.c; col <= decoded.e.c; col++) {
    for (let row = decoded.s.r; row <= decoded.e.r; row++) {
      const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
      applyStyle(sheet, cellRef, style);
    }
  }
}

/**
 * 列幅を設定
 */
export function setColumnWidths(
  sheet: XLSX.WorkSheet,
  widths: number[]
): void {
  sheet['!cols'] = widths.map(wch => ({ wch }));
}

// ==========================================
// バリデーション
// ==========================================

export interface ValidationError {
  row: number;
  column?: string;
  message: string;
}

export interface ValidationWarning {
  row: number;
  column?: string;
  message: string;
}

/**
 * 必須フィールドのバリデーション
 */
export function validateRequired(
  value: unknown,
  fieldName: string,
  row: number
): ValidationError | null {
  const str = getCellString(value);
  if (!str) {
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
export function validateUnique<T>(
  values: T[],
  getValue: (item: T, index: number) => string | number | undefined,
  fieldName: string
): ValidationError[] {
  const errors: ValidationError[] = [];
  const seen = new Map<string | number, number>();

  values.forEach((item, index) => {
    const value = getValue(item, index);
    if (value !== undefined) {
      if (seen.has(value)) {
        errors.push({
          row: index + 2, // ヘッダー行 + 0-indexedの調整
          column: fieldName,
          message: `${fieldName}「${value}」が重複しています（行 ${seen.get(value)}と）`,
        });
      } else {
        seen.set(value, index + 2);
      }
    }
  });

  return errors;
}

// ==========================================
// ダウンロードユーティリティ
// ==========================================

/**
 * ArrayBufferをBlobに変換してダウンロード
 */
export function downloadExcel(
  arrayBuffer: ArrayBuffer,
  fileName: string
): void {
  const blob = new Blob([arrayBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * ファイル名を生成
 */
export function generateExcelFileName(baseName: string): string {
  const timestamp = new Date().toISOString().split('T')[0];
  return `${baseName}_${timestamp}.xlsx`;
}
