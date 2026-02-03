/**
 * CSV インポート機能
 * CSVファイルから工程データをインポート
 */

import {
  parseCsv,
  csvToNumber,
  csvToBoolean,
  csvToArray,
  csvToJsonArray,
  validateCsvRequired,
  validateCsvUnique,
  validateCsvReferences,
  type CsvValidationError,
  type CsvValidationWarning,
} from './csv-utils';
import { hoursToSeconds } from '@/lib/common';
import type { CustomColumn, DataObject } from '@/types/models';

// ==========================================
// 型定義
// ==========================================

export interface ParsedCsvProcess {
  displayId?: number;
  name: string;
  largeName?: string;
  mediumName?: string;
  smallName?: string;
  detailName?: string;
  laneName: string;
  displayOrder?: number;
  bpmnElement?: string;
  taskType?: string;
  gatewayType?: string;
  eventType?: string;
  intermediateEventType?: string;
  parallelAllowed?: boolean;
  beforeDisplayIds: number[];
  nextDisplayIds?: number[];
  workSeconds?: number;
  workUnitPref?: string;
  leadTimeSeconds?: number;
  leadTimeUnit?: string;
  skillLevel?: '-' | 'L' | 'M' | 'H';
  systemName?: string;
  parentDisplayId?: number;
  documentation?: string;
  issueDetail?: string;
  issueCategory?: string;
  countermeasurePolicy?: string;
  issueWorkSeconds?: number;
  timeReductionSeconds?: number;
  rateReductionPercent?: number;
  eventDetails?: string;
  inputDataObjects?: string[];
  outputDataObjects?: string[];
  conditionalFlows?: Array<{
    targetDisplayId?: number;
    condition?: string;
    description?: string;
  }>;
  messageFlows?: Array<{
    targetDisplayId?: number;
    messageContent?: string;
    description?: string;
  }>;
  artifacts?: Array<{ type?: string; content?: string }>;
  customColumns: Record<string, string>;
}

export interface CsvImportResult {
  rows: ParsedCsvProcess[];
  errors: CsvValidationError[];
  warnings: CsvValidationWarning[];
}

export interface CsvImportOptions {
  /** カスタム列定義 */
  customColumns: CustomColumn[];
  /** データオブジェクト */
  dataObjects: DataObject[];
}

// ==========================================
// インポート関数
// ==========================================

/**
 * CSVテキストから工程データをパース
 */
export function parseProcessCsv(
  text: string,
  options: CsvImportOptions
): CsvImportResult {
  const { customColumns, dataObjects } = options;
  const errors: CsvValidationError[] = [];
  const warnings: CsvValidationWarning[] = [];
  const rows: ParsedCsvProcess[] = [];

  // CSVパース
  const { data, errors: parseErrors } = parseCsv<Record<string, string>>(text);
  errors.push(...parseErrors);

  // displayIdの重複チェック用
  const seenDisplayIds = new Set<number>();

  // データオブジェクト名→IDマップ
  const dataObjectIdMap = new Map(dataObjects.map(d => [d.name, d.id]));

  // 各行をパース
  data.forEach((raw, index) => {
    const line = index + 2; // header + 1-indexed

    // 必須フィールドのバリデーション
    const nameError = validateCsvRequired(raw['name'], 'name', line);
    if (nameError) {
      errors.push(nameError);
      return;
    }

    const laneError = validateCsvRequired(
      raw['lane'] || raw['laneName'],
      'lane',
      line
    );
    if (laneError) {
      errors.push(laneError);
      return;
    }

    // displayIdの重複チェック
    const displayId = csvToNumber(raw['displayId']);
    if (displayId !== undefined) {
      if (seenDisplayIds.has(displayId)) {
        errors.push({
          row: line,
          column: 'displayId',
          message: `displayId ${displayId} が重複しています`,
        });
        return;
      }
      seenDisplayIds.add(displayId);
    } else if (raw['beforeDisplayIds']?.trim()) {
      errors.push({
        row: line,
        column: 'displayId',
        message: 'beforeDisplayIds が指定されていますが displayId がありません',
      });
      return;
    }

    // 前工程・次工程のdisplayId
    const beforeDisplayIds = csvToArray(raw['beforeDisplayIds'])
      .map(v => csvToNumber(v))
      .filter((v): v is number => v !== undefined);

    const nextDisplayIds = csvToArray(raw['nextDisplayIds'])
      .map(v => csvToNumber(v))
      .filter((v): v is number => v !== undefined);

    // カスタム列の値
    const customValues: Record<string, string> = {};
    customColumns.forEach(col => {
      const val = raw[col.name];
      if (val !== undefined) {
        customValues[col.id] = String(val);
      }
    });

    // 時間の変換（時間→秒）
    const workHours = csvToNumber(raw['workHours']);
    const leadTimeHours = csvToNumber(raw['leadTimeHours']);
    const issueWorkHours = csvToNumber(raw['issueWorkHours']);
    const timeReductionHours = csvToNumber(raw['timeReductionHours']);

    // データオブジェクトの変換（名前→ID）
    const inputDataObjectNames = csvToArray(raw['inputDataObjects']);
    const outputDataObjectNames = csvToArray(raw['outputDataObjects']);

    const inputDataObjects = inputDataObjectNames
      .map(name => {
        const id = dataObjectIdMap.get(name);
        if (!id) {
          warnings.push({
            row: line,
            column: 'inputDataObjects',
            message: `データオブジェクト「${name}」が見つかりません`,
          });
        }
        return id;
      })
      .filter((v): v is string => Boolean(v));

    const outputDataObjects = outputDataObjectNames
      .map(name => {
        const id = dataObjectIdMap.get(name);
        if (!id) {
          warnings.push({
            row: line,
            column: 'outputDataObjects',
            message: `データオブジェクト「${name}」が見つかりません`,
          });
        }
        return id;
      })
      .filter((v): v is string => Boolean(v));

    // 複雑なフィールドのパース
    const conditionalFlows = csvToJsonArray<any>(raw['conditionalFlows'])?.map(cf => ({
      targetDisplayId: csvToNumber(cf.targetDisplayId ?? cf.target),
      condition: cf.condition,
      description: cf.description,
    }));

    const messageFlows = csvToJsonArray<any>(raw['messageFlows'])?.map(mf => ({
      targetDisplayId: csvToNumber(mf.targetDisplayId ?? mf.target),
      messageContent: mf.messageContent ?? mf.message,
      description: mf.description,
    }));

    const artifacts = csvToJsonArray<any>(raw['artifacts'])?.map(a => ({
      type: a.type,
      content: a.content,
    }));

    // パース結果を追加
    rows.push({
      displayId,
      name: raw['name'].trim(),
      largeName: raw['largeName']?.trim() || undefined,
      mediumName: raw['mediumName']?.trim() || undefined,
      smallName: raw['smallName']?.trim() || undefined,
      detailName: raw['detailName']?.trim() || undefined,
      laneName: (raw['lane'] || raw['laneName']).trim(),
      displayOrder: csvToNumber(raw['displayOrder']),
      bpmnElement: raw['bpmnElement']?.trim() || undefined,
      taskType: raw['taskType']?.trim() || undefined,
      gatewayType: raw['gatewayType']?.trim() || undefined,
      eventType: raw['eventType']?.trim() || undefined,
      intermediateEventType: raw['intermediateEventType']?.trim() || undefined,
      parallelAllowed: csvToBoolean(raw['parallelAllowed']),
      beforeDisplayIds,
      nextDisplayIds: nextDisplayIds.length > 0 ? nextDisplayIds : undefined,
      workSeconds: workHours !== undefined ? hoursToSeconds(workHours) : undefined,
      workUnitPref: raw['workUnitPref']?.trim() || undefined,
      leadTimeSeconds: leadTimeHours !== undefined ? hoursToSeconds(leadTimeHours) : undefined,
      leadTimeUnit: raw['leadTimeUnit']?.trim() || undefined,
      skillLevel: (raw['skillLevel']?.trim() as any) || undefined,
      systemName: raw['systemName']?.trim() || undefined,
      parentDisplayId: csvToNumber(raw['parentDisplayId']),
      documentation: raw['documentation']?.trim() || undefined,
      issueDetail: raw['issueDetail']?.trim() || undefined,
      issueCategory: raw['issueCategory']?.trim() || undefined,
      countermeasurePolicy: raw['countermeasurePolicy']?.trim() || undefined,
      issueWorkSeconds:
        issueWorkHours !== undefined ? hoursToSeconds(issueWorkHours) : undefined,
      timeReductionSeconds:
        timeReductionHours !== undefined
          ? hoursToSeconds(timeReductionHours)
          : undefined,
      rateReductionPercent: csvToNumber(raw['rateReductionPercent']),
      eventDetails: raw['eventDetails']?.trim() || undefined,
      inputDataObjects: inputDataObjects.length > 0 ? inputDataObjects : undefined,
      outputDataObjects: outputDataObjects.length > 0 ? outputDataObjects : undefined,
      conditionalFlows,
      messageFlows,
      artifacts,
      customColumns: customValues,
    });
  });

  return { rows, errors, warnings };
}
