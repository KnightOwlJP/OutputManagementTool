/**
 * Excelパーサー
 * Excelファイルから工程データを読み込み、アプリケーション形式に変換する
 */

import * as XLSX from 'xlsx';
import { Process, ProcessLevel } from '@/types/project.types';

export interface ExcelProcessRow {
  largeProcess?: string;      // 大工程（部署名）
  mediumProcess?: string;     // 中工程（作業実行者）
  smallProcess?: string;      // 小工程（帳票種類）
  detailProcess?: string;     // 詳細工程（作業ステップ）
  department?: string;        // 部署名
  assignee?: string;          // 担当者
  documentType?: string;      // 帳票種類
  description?: string;       // 説明
  startDate?: string;         // 開始日
  endDate?: string;           // 終了日
  status?: string;            // ステータス
}

export interface ParsedProcessData {
  processes: Partial<Process>[];
  errors: string[];
  warnings: string[];
}

/**
 * Excelファイルを読み込む
 */
export function readExcelFile(buffer: ArrayBuffer): XLSX.WorkBook {
  try {
    const workbook = XLSX.read(buffer, { type: 'array' });
    return workbook;
  } catch (error) {
    throw new Error(`Excelファイルの読み込みに失敗しました: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * ワークシートから工程データを抽出
 */
export function parseProcessSheet(
  workbook: XLSX.WorkBook,
  sheetName?: string
): ParsedProcessData {
  const errors: string[] = [];
  const warnings: string[] = [];
  const processes: Partial<Process>[] = [];

  try {
    // シート名が指定されていない場合は最初のシートを使用
    const targetSheetName = sheetName || workbook.SheetNames[0];
    const worksheet = workbook.Sheets[targetSheetName];

    if (!worksheet) {
      errors.push(`シート "${targetSheetName}" が見つかりません`);
      return { processes, errors, warnings };
    }

    // シートをJSONに変換
    const rows = XLSX.utils.sheet_to_json<ExcelProcessRow>(worksheet, {
      header: [
        'largeProcess',
        'mediumProcess',
        'smallProcess',
        'detailProcess',
        'department',
        'assignee',
        'documentType',
        'description',
        'startDate',
        'endDate',
        'status',
      ],
      range: 1, // ヘッダー行をスキップ
      defval: undefined,
    });

    if (rows.length === 0) {
      warnings.push('シートにデータが見つかりません');
      return { processes, errors, warnings };
    }

    // 階層構造を構築
    const processMap = new Map<string, Partial<Process>>();
    let displayOrder = 0;

    rows.forEach((row, index) => {
      const rowNumber = index + 2; // ヘッダー + 0-indexedの調整

      try {
        // 大工程
        if (row.largeProcess && row.largeProcess.trim()) {
          const key = `large-${row.largeProcess}`;
          if (!processMap.has(key)) {
            processMap.set(key, {
              name: row.largeProcess.trim(),
              level: 'large',
              department: row.department?.trim() || row.largeProcess.trim(),
              description: row.description?.trim(),
              displayOrder: displayOrder++,
            });
          }
        }

        // 中工程
        if (row.mediumProcess && row.mediumProcess.trim()) {
          const key = `medium-${row.largeProcess}-${row.mediumProcess}`;
          if (!processMap.has(key)) {
            processMap.set(key, {
              name: row.mediumProcess.trim(),
              level: 'medium',
              assignee: row.assignee?.trim() || row.mediumProcess.trim(),
              department: row.department?.trim(),
              description: row.description?.trim(),
              displayOrder: displayOrder++,
            });
          }
        }

        // 小工程
        if (row.smallProcess && row.smallProcess.trim()) {
          const key = `small-${row.largeProcess}-${row.mediumProcess}-${row.smallProcess}`;
          if (!processMap.has(key)) {
            processMap.set(key, {
              name: row.smallProcess.trim(),
              level: 'small',
              documentType: row.documentType?.trim() || row.smallProcess.trim(),
              assignee: row.assignee?.trim(),
              description: row.description?.trim(),
              displayOrder: displayOrder++,
            });
          }
        }

        // 詳細工程
        if (row.detailProcess && row.detailProcess.trim()) {
          const key = `detail-${row.largeProcess}-${row.mediumProcess}-${row.smallProcess}-${row.detailProcess}`;
          if (!processMap.has(key)) {
            const rawStatus = row.status?.trim();
            const validStatuses = ['not-started', 'in-progress', 'completed', 'on-hold'] as const;
            const status = validStatuses.includes(rawStatus as any) ? rawStatus as 'not-started' | 'in-progress' | 'completed' | 'on-hold' : undefined;
            
            processMap.set(key, {
              name: row.detailProcess.trim(),
              level: 'detail',
              description: row.description?.trim(),
              status,
              displayOrder: displayOrder++,
            });
          }
        }
      } catch (error) {
        errors.push(`行 ${rowNumber}: データの解析に失敗しました - ${error instanceof Error ? error.message : String(error)}`);
      }
    });

    processes.push(...Array.from(processMap.values()));

    if (processes.length === 0) {
      warnings.push('有効な工程データが見つかりませんでした');
    }

    console.log(`[ExcelParser] Parsed ${processes.length} processes from Excel`);
    return { processes, errors, warnings };
  } catch (error) {
    errors.push(`シートの解析中にエラーが発生しました: ${error instanceof Error ? error.message : String(error)}`);
    return { processes, errors, warnings };
  }
}

/**
 * Excelファイルのシート一覧を取得
 */
export function getSheetNames(workbook: XLSX.WorkBook): string[] {
  return workbook.SheetNames;
}

/**
 * Excelファイルから工程データをインポート（統合関数）
 */
export function importProcessesFromExcel(
  buffer: ArrayBuffer,
  sheetName?: string
): ParsedProcessData {
  try {
    const workbook = readExcelFile(buffer);
    return parseProcessSheet(workbook, sheetName);
  } catch (error) {
    return {
      processes: [],
      errors: [error instanceof Error ? error.message : String(error)],
      warnings: [],
    };
  }
}

/**
 * 日付文字列をDateオブジェクトに変換
 */
export function parseExcelDate(value: any): Date | undefined {
  if (!value) return undefined;

  // Excel日付シリアル値の場合
  if (typeof value === 'number') {
    return XLSX.SSF.parse_date_code(value);
  }

  // 文字列の場合
  if (typeof value === 'string') {
    const date = new Date(value);
    return isNaN(date.getTime()) ? undefined : date;
  }

  return undefined;
}
