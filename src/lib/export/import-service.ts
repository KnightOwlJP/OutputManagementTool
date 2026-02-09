/**
 * 統合インポートサービス
 * Excel/CSV/JSONからのインポートを統一的に扱う
 */

import * as XLSX from 'xlsx';
import type {
  ImportFormat,
  ImportOptions,
  ImportPreview,
  ImportResult,
  ImportError,
  ImportWarning,
  ImportSummary,
  ImportDiff,
  ExportData,
} from './types';
import { DEFAULT_IMPORT_OPTIONS } from './types';
import type {
  ProcessTable,
  Process,
  Swimlane,
  CustomColumn,
  ProcessLevel,
  BpmnElementType,
  BpmnTaskType,
} from '@/types/models';
import { trimToUndefined, hoursToSeconds } from '@/lib/common';

// ==========================================
// メインインポート関数
// ==========================================

/**
 * ファイルをプレビュー（実際のインポートは行わない）
 */
export async function previewImport(
  file: File,
  options: Partial<ImportOptions> = {},
  existingData?: Partial<ExportData>
): Promise<ImportPreview> {
  const opts: ImportOptions = { ...DEFAULT_IMPORT_OPTIONS, ...options };
  const format = opts.format || detectFormat(file.name);

  try {
    const buffer = await file.arrayBuffer();
    let parseResult: ParsedData;

    switch (format) {
      case 'excel':
        parseResult = parseExcel(buffer);
        break;
      case 'csv':
        parseResult = parseCsv(buffer, opts);
        break;
      case 'json':
        parseResult = parseJson(buffer);
        break;
      default:
        throw new Error(`Unsupported import format: ${format}`);
    }

    // 差分を計算（既存データがある場合）
    let diff: ImportDiff | undefined;
    if (existingData && opts.mergeWithExisting) {
      diff = calculateDiff(parseResult.data, existingData);
    }

    return {
      valid: parseResult.errors.length === 0,
      summary: {
        swimlaneCount: parseResult.data.swimlanes?.length || 0,
        processCount: parseResult.data.processes?.length || 0,
        customColumnCount: parseResult.data.customColumns?.length || 0,
        dataObjectCount: parseResult.data.dataObjects?.length || 0,
      },
      data: parseResult.data,
      errors: parseResult.errors,
      warnings: parseResult.warnings,
      diff,
    };
  } catch (error) {
    return {
      valid: false,
      summary: {
        swimlaneCount: 0,
        processCount: 0,
        customColumnCount: 0,
        dataObjectCount: 0,
      },
      data: {},
      errors: [
        {
          message: `ファイルの読み込みに失敗しました: ${
            error instanceof Error ? error.message : String(error)
          }`,
          suggestion: 'ファイル形式が正しいか確認してください。',
        },
      ],
      warnings: [],
    };
  }
}

/**
 * インポートを実行
 */
export async function executeImport(
  preview: ImportPreview,
  processTableId: string,
  onProgress?: (progress: number, message: string) => void
): Promise<ImportResult> {
  if (!preview.valid) {
    return {
      success: false,
      summary: preview.summary,
      errors: preview.errors,
      warnings: preview.warnings,
    };
  }

  const errors: ImportError[] = [];
  const warnings: ImportWarning[] = [...preview.warnings];
  let swimlanesCreated = 0;
  let processesCreated = 0;
  let customColumnsCreated = 0;

  try {
    onProgress?.(10, 'レーンを作成中...');

    // 1. スイムレーンを作成
    for (const lane of preview.data.swimlanes || []) {
      try {
        await window.electronAPI.swimlane.create({
          processTableId,
          name: lane.name!,
          color: lane.color,
        });
        swimlanesCreated++;
      } catch (error) {
        errors.push({
          message: `レーン「${lane.name}」の作成に失敗しました`,
          suggestion: '同名のレーンが既に存在する可能性があります。',
        });
      }
    }

    onProgress?.(30, 'カスタム列を作成中...');

    // 2. カスタム列を作成
    for (const col of preview.data.customColumns || []) {
      try {
        await window.electronAPI.customColumn.create({
          processTableId,
          name: col.name!,
          type: col.type!,
          options: col.options,
          required: col.required,
        });
        customColumnsCreated++;
      } catch (error) {
        warnings.push({
          message: `カスタム列「${col.name}」の作成に失敗しました`,
        });
      }
    }

    onProgress?.(50, '工程を作成中...');

    // 3. レーンIDのマッピングを取得
    const { data: actualLanes } = await window.electronAPI.swimlane.getByProcessTable(processTableId);
    const laneNameToId = new Map<string, string>();
    for (const lane of actualLanes || []) {
      laneNameToId.set(lane.name, lane.id);
    }

    // 4. 工程を作成
    const totalProcesses = preview.data.processes?.length || 0;
    for (let i = 0; i < totalProcesses; i++) {
      const process = preview.data.processes![i];
      const progress = 50 + Math.floor((i / totalProcesses) * 45);
      onProgress?.(progress, `工程を作成中... (${i + 1}/${totalProcesses})`);

      try {
        // レーン名からIDを解決
        let laneId = process.laneId;
        if (!laneId && (process as any).laneName) {
          laneId = laneNameToId.get((process as any).laneName);
        }

        if (!laneId) {
          errors.push({
            message: `工程「${process.name}」のレーンが見つかりません`,
            suggestion: 'レーンが正しく設定されているか確認してください。',
          });
          continue;
        }

        await window.electronAPI.process.create({
          processTableId,
          name: process.name!,
          laneId,
          displayOrder: process.displayOrder ?? i + 1,
          largeName: process.largeName,
          mediumName: process.mediumName,
          smallName: process.smallName,
          detailName: process.detailName,
          bpmnElement: process.bpmnElement,
          taskType: process.taskType,
          workSeconds: process.workSeconds,
          leadTimeSeconds: process.leadTimeSeconds,
          documentation: process.documentation,
        });
        processesCreated++;
      } catch (error) {
        errors.push({
          message: `工程「${process.name}」の作成に失敗しました`,
          suggestion: error instanceof Error ? error.message : undefined,
        });
      }
    }

    onProgress?.(100, 'インポート完了');

    return {
      success: errors.length === 0,
      summary: {
        swimlaneCount: swimlanesCreated,
        processCount: processesCreated,
        customColumnCount: customColumnsCreated,
        dataObjectCount: 0,
      },
      errors,
      warnings,
    };
  } catch (error) {
    return {
      success: false,
      summary: {
        swimlaneCount: swimlanesCreated,
        processCount: processesCreated,
        customColumnCount: customColumnsCreated,
        dataObjectCount: 0,
      },
      errors: [
        {
          message: `インポート中にエラーが発生しました: ${
            error instanceof Error ? error.message : String(error)
          }`,
        },
      ],
      warnings,
    };
  }
}

// ==========================================
// パース関数
// ==========================================

interface ParsedData {
  data: Partial<ExportData>;
  errors: ImportError[];
  warnings: ImportWarning[];
}

function parseExcel(buffer: ArrayBuffer): ParsedData {
  const errors: ImportError[] = [];
  const warnings: ImportWarning[] = [];
  const data: Partial<ExportData> = {
    swimlanes: [],
    customColumns: [],
    processes: [],
  };

  try {
    const workbook = XLSX.read(buffer, { type: 'array' });

    // 必須シートのチェック
    const requiredSheets = ['レーン', '工程データ'];
    const missingSheets = requiredSheets.filter(
      (name) => !workbook.SheetNames.includes(name)
    );

    if (missingSheets.length > 0) {
      errors.push({
        message: `必須シートが見つかりません: ${missingSheets.join(', ')}`,
        suggestion:
          '正しいテンプレートを使用しているか確認してください。「レーン」と「工程データ」シートが必要です。',
      });
      return { data, errors, warnings };
    }

    // 工程表情報を読み込み
    if (workbook.SheetNames.includes('工程表情報')) {
      const infoSheet = workbook.Sheets['工程表情報'];
      const infoRows = XLSX.utils.sheet_to_json<any>(infoSheet, { header: 1 });
      const info: Partial<ProcessTable> = {};

      for (let i = 3; i < infoRows.length; i++) {
        const row = infoRows[i];
        if (!row || row.length < 2) continue;

        const key = String(row[0] || '');
        const value = row[1];

        switch (key) {
          case '工程表名':
            info.name = String(value || '');
            break;
          case '階層レベル':
            info.level = parseLevelLabel(String(value || ''));
            break;
          case '説明':
            info.description = trimToUndefined(String(value || ''));
            break;
        }
      }

      if (info.name) {
        data.processTable = info as ProcessTable;
      }
    }

    // レーンを読み込み
    const laneSheet = workbook.Sheets['レーン'];
    const laneRows = XLSX.utils.sheet_to_json<any>(laneSheet);

    for (let i = 0; i < laneRows.length; i++) {
      const row = laneRows[i];
      const rowNum = i + 2;

      const id = String(row['レーンID'] || row['id'] || '');
      const name = String(row['レーン名'] || row['name'] || '');

      if (!id) {
        errors.push({
          row: rowNum,
          column: 'レーンID',
          message: 'レーンIDが空です',
          suggestion: 'レーンIDは必須です。一意の識別子を入力してください。',
        });
        continue;
      }

      if (!name) {
        errors.push({
          row: rowNum,
          column: 'レーン名',
          message: 'レーン名が空です',
          suggestion: 'レーン名は必須です。',
        });
        continue;
      }

      data.swimlanes!.push({
        id,
        name,
        color: String(row['色'] || row['color'] || '#3B82F6'),
        order: Number(row['順序'] || row['order'] || i + 1),
      } as Swimlane);
    }

    // カスタム列を読み込み（オプション）
    if (workbook.SheetNames.includes('カスタム列定義')) {
      const colSheet = workbook.Sheets['カスタム列定義'];
      const colRows = XLSX.utils.sheet_to_json<any>(colSheet);

      for (let i = 0; i < colRows.length; i++) {
        const row = colRows[i];
        const id = String(row['列ID'] || row['id'] || '');
        const name = String(row['列名'] || row['name'] || '');

        if (!id || !name) {
          warnings.push({
            row: i + 2,
            message: 'カスタム列定義の列ID/列名が空です（スキップ）',
          });
          continue;
        }

        const typeStr = String(row['データ型'] || row['type'] || 'TEXT');
        const optionsStr = String(row['選択肢'] || row['options'] || '');

        data.customColumns!.push({
          id,
          name,
          type: typeStr as any,
          options:
            typeStr === 'SELECT' && optionsStr
              ? optionsStr.split(',').map((s) => s.trim()).filter(Boolean)
              : undefined,
          required: String(row['必須'] || '') === '○',
          order: Number(row['順序'] || row['order'] || i + 1),
        } as CustomColumn);
      }
    }

    // 工程データを読み込み
    const processSheet = workbook.Sheets['工程データ'];
    const processRows = XLSX.utils.sheet_to_json<any>(processSheet);
    const laneIds = new Set(data.swimlanes!.map((l) => l.id));

    for (let i = 0; i < processRows.length; i++) {
      const row = processRows[i];
      const rowNum = i + 2;

      const id = String(row['工程ID'] || row['id'] || '');
      const name = String(row['工程名'] || row['name'] || '');
      const laneId = String(row['レーンID'] || row['laneId'] || '');

      if (!id) {
        errors.push({
          row: rowNum,
          column: '工程ID',
          message: '工程IDが空です',
          suggestion: '工程IDは必須です。一意の識別子を入力してください。',
        });
        continue;
      }

      if (!name) {
        errors.push({
          row: rowNum,
          column: '工程名',
          message: '工程名が空です',
          suggestion: '工程名は必須です。',
        });
        continue;
      }

      if (!laneId) {
        errors.push({
          row: rowNum,
          column: 'レーンID',
          message: 'レーンIDが空です',
          suggestion: 'レーンシートに定義されているレーンIDを指定してください。',
        });
        continue;
      }

      if (!laneIds.has(laneId)) {
        errors.push({
          row: rowNum,
          column: 'レーンID',
          message: `レーンID「${laneId}」がレーンシートに存在しません`,
          suggestion: `利用可能なレーンID: ${Array.from(laneIds).join(', ')}`,
        });
        continue;
      }

      const workHours = parseFloat(row['工数(時間)'] || row['workHours'] || '');
      const ltHours = parseFloat(row['LT(時間)'] || row['leadTimeHours'] || '');

      data.processes!.push({
        id,
        name,
        laneId,
        displayOrder: Number(row['順序'] || row['displayOrder'] || i + 1),
        largeName: trimToUndefined(String(row['大工程名'] || row['largeName'] || '')),
        mediumName: trimToUndefined(String(row['中工程名'] || row['mediumName'] || '')),
        smallName: trimToUndefined(String(row['小工程名'] || row['smallName'] || '')),
        detailName: trimToUndefined(String(row['詳細工程名'] || row['detailName'] || '')),
        bpmnElement: (String(row['BPMN要素'] || row['bpmnElement'] || 'task')) as BpmnElementType,
        taskType: trimToUndefined(String(row['タスク種類'] || row['taskType'] || '')) as BpmnTaskType | undefined,
        workSeconds: !isNaN(workHours) ? hoursToSeconds(workHours) : undefined,
        leadTimeSeconds: !isNaN(ltHours) ? hoursToSeconds(ltHours) : undefined,
        documentation: trimToUndefined(String(row['ドキュメント'] || row['documentation'] || '')),
      } as Process);
    }

    if (data.processes!.length === 0) {
      errors.push({
        message: '工程データが1件も見つかりません',
        suggestion: '工程データシートに少なくとも1件のデータを入力してください。',
      });
    }
  } catch (error) {
    errors.push({
      message: `Excelファイルの解析に失敗しました: ${
        error instanceof Error ? error.message : String(error)
      }`,
      suggestion: 'ファイルが破損していないか確認してください。',
    });
  }

  return { data, errors, warnings };
}

function parseCsv(buffer: ArrayBuffer, options: ImportOptions): ParsedData {
  const errors: ImportError[] = [];
  const warnings: ImportWarning[] = [];
  const data: Partial<ExportData> = {
    swimlanes: [],
    customColumns: [],
    processes: [],
  };

  try {
    const decoder = new TextDecoder(options.csvEncoding === 'shift-jis' ? 'shift-jis' : 'utf-8');
    const text = decoder.decode(buffer);

    // BOMを除去
    const cleanText = text.replace(/^\uFEFF/, '');

    // CSVをパース
    const lines = cleanText.split(/\r?\n/);
    if (lines.length < 2) {
      errors.push({
        message: 'CSVファイルにデータがありません',
        suggestion: 'ヘッダー行と少なくとも1行のデータが必要です。',
      });
      return { data, errors, warnings };
    }

    const headers = parseCSVLine(lines[0]);
    const nameIndex = headers.findIndex((h) => h === 'name' || h === '工程名');
    const laneIndex = headers.findIndex((h) => h === 'laneName' || h === 'lane' || h === 'レーン名');

    if (nameIndex === -1) {
      errors.push({
        message: '「name」または「工程名」列が見つかりません',
        suggestion: 'CSVの1行目にヘッダーを含めてください。',
      });
      return { data, errors, warnings };
    }

    // レーンを収集
    const laneNames = new Set<string>();

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;

      const values = parseCSVLine(lines[i]);
      const laneName = laneIndex !== -1 ? values[laneIndex]?.trim() : '';
      if (laneName) {
        laneNames.add(laneName);
      }
    }

    // レーンを作成
    let laneOrder = 1;
    for (const laneName of laneNames) {
      data.swimlanes!.push({
        id: `lane-${laneOrder}`,
        name: laneName,
        color: getDefaultLaneColor(laneOrder),
        order: laneOrder,
      } as Swimlane);
      laneOrder++;
    }

    const laneNameToId = new Map(data.swimlanes!.map((l) => [l.name, l.id]));

    // 工程をパース
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;

      const rowNum = i + 1;
      const values = parseCSVLine(lines[i]);
      const name = values[nameIndex]?.trim();

      if (!name) {
        warnings.push({
          row: rowNum,
          message: '工程名が空のためスキップしました',
        });
        continue;
      }

      const laneName = laneIndex !== -1 ? values[laneIndex]?.trim() : '';
      const laneId = laneNameToId.get(laneName) || data.swimlanes![0]?.id;

      if (!laneId) {
        errors.push({
          row: rowNum,
          message: 'レーンが見つかりません',
          suggestion: 'レーン名を正しく入力してください。',
        });
        continue;
      }

      data.processes!.push({
        id: `process-${i}`,
        name,
        laneId,
        displayOrder: i,
      } as Process);
    }
  } catch (error) {
    errors.push({
      message: `CSVファイルの解析に失敗しました: ${
        error instanceof Error ? error.message : String(error)
      }`,
    });
  }

  return { data, errors, warnings };
}

function parseJson(buffer: ArrayBuffer): ParsedData {
  const errors: ImportError[] = [];
  const warnings: ImportWarning[] = [];
  const data: Partial<ExportData> = {};

  try {
    const text = new TextDecoder().decode(buffer);
    const parsed = JSON.parse(text);

    if (parsed.version && parsed.processTable) {
      // 新形式
      data.processTable = parsed.processTable;
      data.swimlanes = parsed.swimlanes || [];
      data.customColumns = parsed.customColumns || [];
      data.processes = parsed.processes || [];
      data.dataObjects = parsed.dataObjects || [];
    } else if (Array.isArray(parsed)) {
      // 配列形式（工程のみ）
      data.processes = parsed;
    } else {
      errors.push({
        message: 'JSONの形式が正しくありません',
        suggestion: 'エクスポートしたJSONファイルを使用してください。',
      });
    }
  } catch (error) {
    errors.push({
      message: `JSONファイルの解析に失敗しました: ${
        error instanceof Error ? error.message : String(error)
      }`,
      suggestion: 'JSONの構文が正しいか確認してください。',
    });
  }

  return { data, errors, warnings };
}

// ==========================================
// ユーティリティ
// ==========================================

function detectFormat(filename: string): ImportFormat {
  const ext = filename.toLowerCase().split('.').pop();
  switch (ext) {
    case 'xlsx':
    case 'xls':
      return 'excel';
    case 'csv':
      return 'csv';
    case 'json':
      return 'json';
    default:
      return 'excel';
  }
}

function parseLevelLabel(label: string): ProcessLevel | undefined {
  const map: Record<string, ProcessLevel> = {
    '大工程': 'large',
    '中工程': 'medium',
    '小工程': 'small',
    '詳細工程': 'detail',
    large: 'large',
    medium: 'medium',
    small: 'small',
    detail: 'detail',
  };
  return map[label];
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
}

function getDefaultLaneColor(index: number): string {
  const colors = [
    '#3B82F6',
    '#10B981',
    '#F59E0B',
    '#EF4444',
    '#8B5CF6',
    '#EC4899',
    '#06B6D4',
    '#84CC16',
  ];
  return colors[(index - 1) % colors.length];
}

function calculateDiff(
  newData: Partial<ExportData>,
  existingData: Partial<ExportData>
): ImportDiff {
  const existingLaneIds = new Set(existingData.swimlanes?.map((l) => l.id) || []);
  const existingProcessIds = new Set(existingData.processes?.map((p) => p.id) || []);
  const existingColIds = new Set(existingData.customColumns?.map((c) => c.id) || []);

  const newLaneIds = new Set(newData.swimlanes?.map((l) => l.id) || []);
  const newProcessIds = new Set(newData.processes?.map((p) => p.id) || []);
  const newColIds = new Set(newData.customColumns?.map((c) => c.id) || []);

  return {
    added: {
      swimlanes: [...newLaneIds].filter((id) => !existingLaneIds.has(id)),
      processes: [...newProcessIds].filter((id) => !existingProcessIds.has(id)),
      customColumns: [...newColIds].filter((id) => !existingColIds.has(id)),
    },
    modified: {
      swimlanes: [...newLaneIds].filter((id) => existingLaneIds.has(id)),
      processes: [...newProcessIds].filter((id) => existingProcessIds.has(id)),
      customColumns: [...newColIds].filter((id) => existingColIds.has(id)),
    },
    removed: {
      swimlanes: [...existingLaneIds].filter((id) => !newLaneIds.has(id)),
      processes: [...existingProcessIds].filter((id) => !newProcessIds.has(id)),
      customColumns: [...existingColIds].filter((id) => !newColIds.has(id)),
    },
  };
}
