/**
 * Excel パーサー（統合版）
 * Excelファイルからデータをインポートするための統一インターフェース
 */

import * as XLSX from 'xlsx';
import {
  readWorkbook,
  hasSheet,
  getSheet,
  sheetToJson,
  getCellString,
  getCellNumber,
  getCellArray,
  parseCustomColumnValue,
  validateRequired,
  validateUnique,
  type ValidationError,
  type ValidationWarning,
} from './excel-utils';
import {
  type ProcessTable,
  type Swimlane,
  type CustomColumn,
  type Process,
  type ProcessLevel,
  type CustomColumnType,
  type BpmnElementType,
  type BpmnTaskType,
  type GatewayType,
  type EventType,
} from '@/types/models';
import { trimToUndefined } from '@/lib/common';

// ==========================================
// 型定義
// ==========================================

export interface ParseResult<T> {
  data: T;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ParsedProcessTableData {
  processTable?: Partial<ProcessTable>;
  swimlanes: Partial<Swimlane>[];
  customColumns: Partial<CustomColumn>[];
  processes: Partial<Process>[];
}

// ==========================================
// 工程表インポート（Phase 9 フォーマット）
// ==========================================

/**
 * Excelから工程表データをインポート
 */
export function parseProcessTableExcel(
  buffer: ArrayBuffer
): ParseResult<ParsedProcessTableData> {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  const data: ParsedProcessTableData = {
    swimlanes: [],
    customColumns: [],
    processes: [],
  };

  try {
    const workbook = readWorkbook(buffer);

    // 必須シートの確認
    const requiredSheets = ['レーン', '工程データ'];
    const missingSheets = requiredSheets.filter(name => !hasSheet(workbook, name));

    if (missingSheets.length > 0) {
      errors.push({
        row: 0,
        message: `必須シートが見つかりません: ${missingSheets.join(', ')}`,
      });
      return { data, errors, warnings };
    }

    // 工程表情報（オプション）
    if (hasSheet(workbook, '工程表情報')) {
      const sheet = getSheet(workbook, '工程表情報')!;
      data.processTable = parseProcessTableInfoSheet(sheet, warnings);
    }

    // レーン
    const laneSheet = getSheet(workbook, 'レーン')!;
    data.swimlanes = parseSwimlanesSheet(laneSheet, errors);

    // カスタム列定義（オプション）
    if (hasSheet(workbook, 'カスタム列定義')) {
      const customColumnSheet = getSheet(workbook, 'カスタム列定義')!;
      data.customColumns = parseCustomColumnsSheet(customColumnSheet, warnings);
    }

    // 工程データ
    const processSheet = getSheet(workbook, '工程データ')!;
    data.processes = parseProcessesSheet(
      processSheet,
      data.swimlanes,
      data.customColumns,
      errors,
      warnings
    );

    // バリデーション
    validateParsedData(data, errors, warnings);

  } catch (error) {
    errors.push({
      row: 0,
      message: `Excelファイルの読み込みに失敗しました: ${
        error instanceof Error ? error.message : String(error)
      }`,
    });
  }

  return { data, errors, warnings };
}

// ==========================================
// シートパーサー
// ==========================================

/**
 * 工程表情報シートをパース
 */
function parseProcessTableInfoSheet(
  sheet: XLSX.WorkSheet,
  warnings: ValidationWarning[]
): Partial<ProcessTable> | undefined {
  try {
    const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1 });
    const info: Partial<ProcessTable> = {};

    for (let i = 3; i < rows.length; i++) {
      const row = rows[i] as unknown[];
      if (!row || row.length < 2) continue;

      const key = getCellString(row[0]);
      const value = row[1];

      switch (key) {
        case '工程表名':
          info.name = getCellString(value);
          break;
        case '階層レベル':
          info.level = parseLevelFromLabel(getCellString(value));
          break;
        case '説明':
          info.description = trimToUndefined(getCellString(value));
          break;
        case '表示順':
          info.displayOrder = getCellNumber(value) ?? 0;
          break;
      }
    }

    return info.name ? info : undefined;
  } catch (error) {
    warnings.push({
      row: 0,
      message: `工程表情報の読み取りに失敗しました: ${
        error instanceof Error ? error.message : String(error)
      }`,
    });
    return undefined;
  }
}

/**
 * レーンシートをパース
 */
function parseSwimlanesSheet(
  sheet: XLSX.WorkSheet,
  errors: ValidationError[]
): Partial<Swimlane>[] {
  const swimlanes: Partial<Swimlane>[] = [];

  try {
    const rows = sheetToJson<Record<string, unknown>>(sheet);

    rows.forEach((row, index) => {
      const rowNum = index + 2;

      const id = getCellString(row['レーンID']);
      const name = getCellString(row['レーン名']);

      // バリデーション
      if (!id) {
        errors.push({ row: rowNum, column: 'レーンID', message: 'レーンIDが空です' });
        return;
      }
      if (!name) {
        errors.push({ row: rowNum, column: 'レーン名', message: 'レーン名が空です' });
        return;
      }

      swimlanes.push({
        id,
        name,
        color: getCellString(row['色']) || '#3B82F6',
        order: getCellNumber(row['順序']) ?? swimlanes.length + 1,
      });
    });

    if (swimlanes.length === 0) {
      errors.push({ row: 0, message: 'レーンが1つも定義されていません' });
    }

  } catch (error) {
    errors.push({
      row: 0,
      message: `レーンシートの読み取りに失敗しました: ${
        error instanceof Error ? error.message : String(error)
      }`,
    });
  }

  return swimlanes;
}

/**
 * カスタム列定義シートをパース
 */
function parseCustomColumnsSheet(
  sheet: XLSX.WorkSheet,
  warnings: ValidationWarning[]
): Partial<CustomColumn>[] {
  const columns: Partial<CustomColumn>[] = [];

  try {
    const rows = sheetToJson<Record<string, unknown>>(sheet);

    rows.forEach((row, index) => {
      const rowNum = index + 2;

      const id = getCellString(row['列ID']);
      const name = getCellString(row['列名']);

      if (!id || !name) {
        warnings.push({
          row: rowNum,
          message: `カスタム列定義の列ID/列名が空です（スキップ）`,
        });
        return;
      }

      const typeStr = getCellString(row['データ型']) || 'TEXT';
      const optionsStr = getCellString(row['選択肢']);

      columns.push({
        id,
        name,
        type: typeStr as CustomColumnType,
        options: typeStr === 'SELECT' && optionsStr
          ? optionsStr.split(',').map(s => s.trim()).filter(Boolean)
          : undefined,
        required: getCellString(row['必須']) === '○',
        order: getCellNumber(row['順序']) ?? columns.length + 1,
      });
    });

  } catch (error) {
    warnings.push({
      row: 0,
      message: `カスタム列定義シートの読み取りに失敗しました: ${
        error instanceof Error ? error.message : String(error)
      }`,
    });
  }

  return columns;
}

/**
 * 工程データシートをパース
 */
function parseProcessesSheet(
  sheet: XLSX.WorkSheet,
  swimlanes: Partial<Swimlane>[],
  customColumns: Partial<CustomColumn>[],
  errors: ValidationError[],
  warnings: ValidationWarning[]
): Partial<Process>[] {
  const processes: Partial<Process>[] = [];
  const laneIds = new Set(swimlanes.map(l => l.id));

  try {
    const rows = sheetToJson<Record<string, unknown>>(sheet);

    rows.forEach((row, index) => {
      const rowNum = index + 2;

      const id = getCellString(row['工程ID']);
      const name = getCellString(row['工程名']);
      const laneId = getCellString(row['レーンID']);

      // 必須フィールドのバリデーション
      if (!id) {
        errors.push({ row: rowNum, column: '工程ID', message: '工程IDが空です' });
        return;
      }
      if (!name) {
        errors.push({ row: rowNum, column: '工程名', message: '工程名が空です' });
        return;
      }
      if (!laneId) {
        errors.push({ row: rowNum, column: 'レーンID', message: 'レーンIDが空です' });
        return;
      }

      // レーンIDの存在確認
      if (!laneIds.has(laneId)) {
        errors.push({
          row: rowNum,
          column: 'レーンID',
          message: `レーンID「${laneId}」がレーンシートに存在しません`,
        });
        return;
      }

      // 工数とLT
      const workHours = getCellNumber(row['工数(時間)']);
      const leadTimeHours = getCellNumber(row['LT(時間)']);

      const process: Partial<Process> = {
        id,
        name,
        laneId,
        largeName: trimToUndefined(getCellString(row['大工程名'])),
        mediumName: trimToUndefined(getCellString(row['中工程名'])),
        smallName: trimToUndefined(getCellString(row['小工程名'])),
        detailName: trimToUndefined(getCellString(row['詳細工程名'])),
        bpmnElement: (getCellString(row['BPMN要素']) || 'task') as BpmnElementType,
        taskType: trimToUndefined(getCellString(row['タスク種類'])) as BpmnTaskType | undefined,
        displayOrder: getCellNumber(row['順序']) ?? processes.length + 1,
        workSeconds: workHours !== undefined ? workHours * 3600 : undefined,
        leadTimeSeconds: leadTimeHours !== undefined ? leadTimeHours * 3600 : undefined,
      };

      // 前工程・次工程
      const beforeIds = getCellString(row['前工程ID']);
      if (beforeIds) {
        process.beforeProcessIds = getCellArray(beforeIds);
      }

      const nextIds = getCellString(row['次工程ID']);
      if (nextIds) {
        process.nextProcessIds = getCellArray(nextIds);
      }

      // BPMN詳細情報
      process.documentation = trimToUndefined(getCellString(row['ドキュメント']));
      process.gatewayType = trimToUndefined(getCellString(row['ゲートウェイ種類'])) as GatewayType | undefined;
      process.eventType = trimToUndefined(getCellString(row['イベント種類'])) as EventType | undefined;

      // データオブジェクト
      const inputData = getCellString(row['データオブジェクト（入力）']);
      if (inputData) {
        process.inputDataObjects = getCellArray(inputData);
      }

      const outputData = getCellString(row['データオブジェクト（出力）']);
      if (outputData) {
        process.outputDataObjects = getCellArray(outputData);
      }

      // カスタム列の値
      if (customColumns.length > 0) {
        const customValues: Record<string, unknown> = {};
        customColumns.forEach(col => {
          if (col.name && row[col.name] !== undefined) {
            customValues[col.id!] = parseCustomColumnValue(
              row[col.name],
              col.type!
            );
          }
        });
        if (Object.keys(customValues).length > 0) {
          process.customColumns = customValues;
        }
      }

      processes.push(process);
    });

    if (processes.length === 0) {
      errors.push({ row: 0, message: '工程データが1つも定義されていません' });
    }

  } catch (error) {
    errors.push({
      row: 0,
      message: `工程データシートの読み取りに失敗しました: ${
        error instanceof Error ? error.message : String(error)
      }`,
    });
  }

  return processes;
}

// ==========================================
// バリデーション
// ==========================================

/**
 * パースしたデータの全体バリデーション
 */
function validateParsedData(
  data: ParsedProcessTableData,
  errors: ValidationError[],
  warnings: ValidationWarning[]
): void {
  // 工程IDの重複チェック
  const processIdErrors = validateUnique(
    data.processes,
    (p, i) => p.id,
    '工程ID'
  );
  errors.push(...processIdErrors);

  // レーンIDの重複チェック
  const laneIdErrors = validateUnique(
    data.swimlanes,
    (l, i) => l.id,
    'レーンID'
  );
  errors.push(...laneIdErrors);

  // 前工程ID・次工程IDの参照チェック
  const processIds = new Set(data.processes.map(p => p.id));

  data.processes.forEach((process, index) => {
    const rowNum = index + 2;

    process.beforeProcessIds?.forEach(beforeId => {
      if (!processIds.has(beforeId)) {
        warnings.push({
          row: rowNum,
          column: '前工程ID',
          message: `工程「${process.name}」の前工程ID「${beforeId}」が存在しません`,
        });
      }
    });

    process.nextProcessIds?.forEach(nextId => {
      if (!processIds.has(nextId)) {
        warnings.push({
          row: rowNum,
          column: '次工程ID',
          message: `工程「${process.name}」の次工程ID「${nextId}」が存在しません`,
        });
      }
    });
  });
}

// ==========================================
// ユーティリティ
// ==========================================

/**
 * 日本語ラベルからProcessLevelに変換
 */
function parseLevelFromLabel(label: string): ProcessLevel | undefined {
  const map: Record<string, ProcessLevel> = {
    '大工程': 'large',
    '中工程': 'medium',
    '小工程': 'small',
    '詳細工程': 'detail',
  };
  return map[label];
}

// ==========================================
// レガシーパーサー（後方互換性）
// ==========================================

export interface LegacyProcessRow {
  largeProcess?: string;
  mediumProcess?: string;
  smallProcess?: string;
  detailProcess?: string;
  department?: string;
  assignee?: string;
  documentType?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
}

/**
 * レガシー形式のExcelパース（V1互換）
 * @deprecated 新しいparseProcessTableExcelを使用してください
 */
export function parseLegacyProcessExcel(
  buffer: ArrayBuffer,
  sheetName?: string
): ParseResult<Partial<Process>[]> {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  const processes: Partial<Process>[] = [];

  try {
    const workbook = readWorkbook(buffer);
    const targetSheetName = sheetName || workbook.SheetNames[0];
    const sheet = getSheet(workbook, targetSheetName);

    if (!sheet) {
      errors.push({
        row: 0,
        message: `シート "${targetSheetName}" が見つかりません`,
      });
      return { data: processes, errors, warnings };
    }

    const rows = sheetToJson<LegacyProcessRow>(sheet, {
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
      range: 1,
      defval: undefined,
    });

    if (rows.length === 0) {
      warnings.push({ row: 0, message: 'シートにデータが見つかりません' });
      return { data: processes, errors, warnings };
    }

    // レガシー形式をProcess形式に変換（簡易実装）
    rows.forEach((row, index) => {
      const rowNum = index + 2;

      if (row.detailProcess?.trim()) {
        processes.push({
          name: row.detailProcess.trim(),
          largeName: row.largeProcess?.trim(),
          mediumName: row.mediumProcess?.trim(),
          smallName: row.smallProcess?.trim(),
          detailName: row.detailProcess.trim(),
          documentation: row.description?.trim(),
          displayOrder: processes.length + 1,
        } as Partial<Process>);
      }
    });

    if (processes.length === 0) {
      warnings.push({ row: 0, message: '有効な工程データが見つかりませんでした' });
    }

  } catch (error) {
    errors.push({
      row: 0,
      message: error instanceof Error ? error.message : String(error),
    });
  }

  return { data: processes, errors, warnings };
}
