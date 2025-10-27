/**
 * Excelパーサー V2
 * Phase 9フラット構造対応
 * Excelファイルから工程表データをインポートする
 */

import * as XLSX from 'xlsx';
import {
  ProcessTable,
  Swimlane,
  CustomColumn,
  Process,
  CustomColumnType,
  BpmnElementType,
  BpmnTaskType,
  GatewayType,
  EventType,
  ProcessLevel,
} from '@/types/models';

export interface ParsedProcessTableData {
  processTable?: Partial<ProcessTable>;
  swimlanes: Partial<Swimlane>[];
  customColumns: Partial<CustomColumn>[];
  processes: Partial<Process>[];
  errors: string[];
  warnings: string[];
}

/**
 * ExcelファイルからArrayBufferを取得
 */
function readExcelFile(arrayBuffer: ArrayBuffer): XLSX.WorkBook {
  return XLSX.read(arrayBuffer, { type: 'array' });
}

/**
 * Excelファイルから工程表データをインポート
 */
export function importProcessTableFromExcel(
  arrayBuffer: ArrayBuffer
): ParsedProcessTableData {
  const result: ParsedProcessTableData = {
    swimlanes: [],
    customColumns: [],
    processes: [],
    errors: [],
    warnings: [],
  };

  try {
    const workbook = readExcelFile(arrayBuffer);

    // シート存在確認
    const requiredSheets = ['レーン', '工程データ'];
    const missingSheets = requiredSheets.filter(
      name => !workbook.SheetNames.includes(name)
    );

    if (missingSheets.length > 0) {
      result.errors.push(
        `必須シートが見つかりません: ${missingSheets.join(', ')}`
      );
      return result;
    }

    // 1. 工程表情報の読み取り（オプション）
    if (workbook.SheetNames.includes('工程表情報')) {
      parseProcessTableInfo(workbook.Sheets['工程表情報'], result);
    }

    // 2. レーン（スイムレーン）の読み取り
    parseSwimlanesSheet(workbook.Sheets['レーン'], result);

    // 3. カスタム列定義の読み取り（オプション）
    if (workbook.SheetNames.includes('カスタム列定義')) {
      parseCustomColumnsSheet(workbook.Sheets['カスタム列定義'], result);
    }

    // 4. 工程データの読み取り
    parseProcessesSheet(workbook.Sheets['工程データ'], result);

    // バリデーション
    validateParsedData(result);

  } catch (error) {
    result.errors.push(
      `Excelファイルの読み込みに失敗しました: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  return result;
}

/**
 * 工程表情報シートをパース
 */
function parseProcessTableInfo(
  sheet: XLSX.WorkSheet,
  result: ParsedProcessTableData
): void {
  try {
    const data = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1 });
    
    // 項目=値のペアを探す（3行目以降）
    const info: any = {};
    for (let i = 3; i < data.length; i++) {
      const row = data[i];
      if (row && row.length >= 2) {
        const key = String(row[0]).trim();
        const value = row[1];
        
        switch (key) {
          case '工程表名':
            info.name = String(value);
            break;
          case '階層レベル':
            info.level = parseLevelFromLabel(String(value));
            break;
          case '説明':
            info.description = String(value);
            break;
          case '表示順':
            info.displayOrder = Number(value) || 0;
            break;
        }
      }
    }

    if (info.name) {
      result.processTable = info;
    }
  } catch (error) {
    result.warnings.push(
      `工程表情報の読み取りに失敗しました: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * レーンシートをパース
 */
function parseSwimlanesSheet(
  sheet: XLSX.WorkSheet,
  result: ParsedProcessTableData
): void {
  try {
    const data = XLSX.utils.sheet_to_json<any>(sheet);

    data.forEach((row, index) => {
      const rowNum = index + 2; // ヘッダー行を考慮

      const lane: Partial<Swimlane> = {
        id: String(row['レーンID'] || '').trim(),
        name: String(row['レーン名'] || '').trim(),
        color: String(row['色'] || '#3B82F6').trim(),
        order: Number(row['順序']) || result.swimlanes.length + 1,
      };

      // バリデーション
      if (!lane.id) {
        result.errors.push(`レーンシート ${rowNum}行目: レーンIDが空です`);
        return;
      }
      if (!lane.name) {
        result.errors.push(`レーンシート ${rowNum}行目: レーン名が空です`);
        return;
      }

      result.swimlanes.push(lane);
    });

    if (result.swimlanes.length === 0) {
      result.errors.push('レーンが1つも定義されていません');
    }
  } catch (error) {
    result.errors.push(
      `レーンシートの読み取りに失敗しました: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * カスタム列定義シートをパース
 */
function parseCustomColumnsSheet(
  sheet: XLSX.WorkSheet,
  result: ParsedProcessTableData
): void {
  try {
    const data = XLSX.utils.sheet_to_json<any>(sheet);

    data.forEach((row, index) => {
      const rowNum = index + 2;

      const column: Partial<CustomColumn> = {
        id: String(row['列ID'] || '').trim(),
        name: String(row['列名'] || '').trim(),
        type: String(row['データ型'] || 'TEXT').trim() as CustomColumnType,
        required: String(row['必須'] || '').trim() === '○',
        order: Number(row['順序']) || result.customColumns.length + 1,
      };

      // 選択肢のパース
      const optionsStr = String(row['選択肢'] || '').trim();
      if (optionsStr && column.type === 'SELECT') {
        column.options = optionsStr.split(',').map(s => s.trim()).filter(Boolean);
      }

      // バリデーション
      if (!column.id) {
        result.warnings.push(`カスタム列定義 ${rowNum}行目: 列IDが空です（スキップ）`);
        return;
      }
      if (!column.name) {
        result.warnings.push(`カスタム列定義 ${rowNum}行目: 列名が空です（スキップ）`);
        return;
      }

      result.customColumns.push(column);
    });
  } catch (error) {
    result.warnings.push(
      `カスタム列定義シートの読み取りに失敗しました: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * 工程データシートをパース
 */
function parseProcessesSheet(
  sheet: XLSX.WorkSheet,
  result: ParsedProcessTableData
): void {
  try {
    const data = XLSX.utils.sheet_to_json<any>(sheet);

    data.forEach((row, index) => {
      const rowNum = index + 2;

      const process: Partial<Process> = {
        id: String(row['工程ID'] || '').trim(),
        name: String(row['工程名'] || '').trim(),
        laneId: String(row['レーンID'] || '').trim(),
        bpmnElement: (String(row['BPMN要素'] || 'task').trim() as BpmnElementType),
        taskType: String(row['タスク種類'] || '').trim() as BpmnTaskType || undefined,
        displayOrder: Number(row['順序']) || result.processes.length + 1,
      };

      // 前工程ID・次工程IDのパース
      const beforeIds = String(row['前工程ID'] || '').trim();
      if (beforeIds) {
        process.beforeProcessIds = beforeIds.split(',').map(s => s.trim()).filter(Boolean);
      }

      const nextIds = String(row['次工程ID'] || '').trim();
      if (nextIds) {
        process.nextProcessIds = nextIds.split(',').map(s => s.trim()).filter(Boolean);
      }

      // BPMN詳細情報（オプション）
      if (row['ドキュメント']) {
        process.documentation = String(row['ドキュメント']).trim();
      }
      if (row['ゲートウェイ種類']) {
        process.gatewayType = String(row['ゲートウェイ種類']).trim() as GatewayType;
      }
      if (row['イベント種類']) {
        process.eventType = String(row['イベント種類']).trim() as EventType;
      }

      // データオブジェクト
      const inputData = String(row['データオブジェクト（入力）'] || '').trim();
      if (inputData) {
        process.inputDataObjects = inputData.split(',').map(s => s.trim()).filter(Boolean);
      }

      const outputData = String(row['データオブジェクト（出力）'] || '').trim();
      if (outputData) {
        process.outputDataObjects = outputData.split(',').map(s => s.trim()).filter(Boolean);
      }

      // カスタム列の値
      const customValues: Record<string, any> = {};
      result.customColumns.forEach(col => {
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

      // バリデーション
      if (!process.id) {
        result.errors.push(`工程データ ${rowNum}行目: 工程IDが空です`);
        return;
      }
      if (!process.name) {
        result.errors.push(`工程データ ${rowNum}行目: 工程名が空です`);
        return;
      }
      if (!process.laneId) {
        result.errors.push(`工程データ ${rowNum}行目: レーンIDが空です`);
        return;
      }

      // レーンIDの存在確認
      const laneExists = result.swimlanes.some(l => l.id === process.laneId);
      if (!laneExists) {
        result.errors.push(
          `工程データ ${rowNum}行目: レーンID「${process.laneId}」がレーンシートに存在しません`
        );
        return;
      }

      result.processes.push(process);
    });

    if (result.processes.length === 0) {
      result.errors.push('工程データが1つも定義されていません');
    }
  } catch (error) {
    result.errors.push(
      `工程データシートの読み取りに失敗しました: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * パースしたデータをバリデーション
 */
function validateParsedData(result: ParsedProcessTableData): void {
  // 工程ID の重複チェック
  const processIds = new Set<string>();
  result.processes.forEach((proc, index) => {
    if (processIds.has(proc.id!)) {
      result.errors.push(`工程ID「${proc.id}」が重複しています`);
    }
    processIds.add(proc.id!);
  });

  // レーンIDの重複チェック
  const laneIds = new Set<string>();
  result.swimlanes.forEach((lane, index) => {
    if (laneIds.has(lane.id!)) {
      result.errors.push(`レーンID「${lane.id}」が重複しています`);
    }
    laneIds.add(lane.id!);
  });

  // 前工程ID・次工程IDの存在確認
  result.processes.forEach(proc => {
    proc.beforeProcessIds?.forEach(beforeId => {
      if (!processIds.has(beforeId)) {
        result.warnings.push(
          `工程「${proc.name}」の前工程ID「${beforeId}」が存在しません`
        );
      }
    });

    proc.nextProcessIds?.forEach(nextId => {
      if (!processIds.has(nextId)) {
        result.warnings.push(
          `工程「${proc.name}」の次工程ID「${nextId}」が存在しません`
        );
      }
    });
  });
}

/**
 * カスタム列の値をパース
 */
function parseCustomColumnValue(value: any, type: CustomColumnType): any {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  switch (type) {
    case 'NUMBER':
      const num = Number(value);
      return isNaN(num) ? null : num;
    
    case 'DATE':
      // Excel日付シリアル値または文字列
      if (typeof value === 'number') {
        // Excelシリアル日付を変換
        const date = XLSX.SSF.parse_date_code(value);
        return new Date(date.y, date.m - 1, date.d);
      }
      const parsed = new Date(value);
      return isNaN(parsed.getTime()) ? null : parsed;
    
    case 'CHECKBOX':
      return value === '✓' || value === true || value === 'TRUE' || value === '1';
    
    case 'SELECT':
    case 'TEXT':
    default:
      return String(value);
  }
}

/**
 * ラベルからレベルに変換
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
