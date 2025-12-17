/**
 * CSVインポートユーティリティ
 * 工程表の工程をCSVから読み込み、アプリ側の形式に変換する
 */

import Papa from 'papaparse';
import { CustomColumn, DataObject } from '@/types/models';

export interface ParsedCsvProcessRow {
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
  conditionalFlows?: Array<{ targetDisplayId?: number; condition?: string; description?: string }>;
  messageFlows?: Array<{ targetDisplayId?: number; messageContent?: string; description?: string }>;
  artifacts?: Array<{ type?: string; content?: string }>;
  customColumns: Record<string, string>;
}

export interface CsvImportResult {
  rows: ParsedCsvProcessRow[];
  errors: string[];
  warnings: string[];
}

// 数値パースのヘルパー
const toNumber = (value: any): number | undefined => {
  if (value === null || value === undefined || value === '') return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
};

// booleanパース
const toBool = (value: any): boolean | undefined => {
  if (value === null || value === undefined || value === '') return undefined;
  const v = String(value).toLowerCase().trim();
  if (['true', '1', 'yes', 'y', 'on'].includes(v)) return true;
  if (['false', '0', 'no', 'n', 'off'].includes(v)) return false;
  return undefined;
};

const splitList = (value: string | undefined | null): string[] =>
  (value || '')
    .split(/[,、]/)
    .map((s) => s.trim())
    .filter(Boolean);

const parseJsonArray = <T>(value: string | undefined, label: string, line: number, errors: string[]): T[] | undefined => {
  if (!value || value.trim() === '') return undefined;
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed as T[];
    errors.push(`行${line}: ${label} はJSON配列で指定してください`);
    return undefined;
  } catch (e) {
    errors.push(`行${line}: ${label} のJSONパースに失敗しました: ${(e as Error).message}`);
    return undefined;
  }
};

export function parseProcessesCsv(text: string, customColumns: CustomColumn[], dataObjects: DataObject[]): CsvImportResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const rows: ParsedCsvProcessRow[] = [];
  const seenDisplayIds = new Set<number>();

  const { data, errors: parseErrors } = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: 'greedy',
  });

  if (parseErrors.length > 0) {
    errors.push(...parseErrors.map(e => `CSV parse error at row ${e.row ?? '-'}: ${e.message}`));
  }

  data.forEach((raw, index) => {
    const line = index + 2; // header + 1-index

    const displayId = toNumber(raw['displayId']);
    const displayOrder = toNumber(raw['displayOrder']);
    const name = (raw['name'] || '').trim();
    const laneName = (raw['lane'] || raw['laneName'] || '').trim();

    if (!name) {
      errors.push(`行${line}: name が空です`);
      return;
    }
    if (!laneName) {
      errors.push(`行${line}: lane が空です`);
      return;
    }

    if (displayId !== undefined) {
      if (seenDisplayIds.has(displayId)) {
        errors.push(`行${line}: displayId ${displayId} が重複しています`);
        return;
      }
      seenDisplayIds.add(displayId);
    } else if ((raw['beforeDisplayIds'] || '').trim()) {
      errors.push(`行${line}: beforeDisplayIds が指定されていますが displayId がありません`);
      return;
    }

    const beforeDisplayIds = splitList(raw['beforeDisplayIds'])
      .map(v => toNumber(v))
      .filter((v): v is number => v !== undefined);

    const nextDisplayIds = splitList(raw['nextDisplayIds'])
      .map(v => toNumber(v))
      .filter((v): v is number => v !== undefined);

    const parentDisplayId = toNumber(raw['parentDisplayId']);

    const customValues: Record<string, string> = {};
    customColumns.forEach(col => {
      const val = raw[col.name];
      if (val !== undefined) customValues[col.id] = String(val);
    });

    const workHours = toNumber(raw['workHours']);

    const issueWorkHours = toNumber(raw['issueWorkHours']);
    const timeReductionHours = toNumber(raw['timeReductionHours']);
    const rateReductionPercent = toNumber(raw['rateReductionPercent']);

    const inputDataObjectsNames = splitList(raw['inputDataObjects']);
    const outputDataObjectsNames = splitList(raw['outputDataObjects']);

    const inputDataObjects = inputDataObjectsNames
      .map((name) => {
        const found = dataObjects.find((d) => d.name === name);
        if (!found) {
          warnings.push(`行${line}: inputDataObjects に指定されたデータオブジェクト「${name}」が見つかりません`);
        }
        return found?.id;
      })
      .filter((v): v is string => Boolean(v));

    const outputDataObjects = outputDataObjectsNames
      .map((name) => {
        const found = dataObjects.find((d) => d.name === name);
        if (!found) {
          warnings.push(`行${line}: outputDataObjects に指定されたデータオブジェクト「${name}」が見つかりません`);
        }
        return found?.id;
      })
      .filter((v): v is string => Boolean(v));

    const conditionalFlowsRaw = parseJsonArray<any>(raw['conditionalFlows'], 'conditionalFlows', line, errors);
    const messageFlowsRaw = parseJsonArray<any>(raw['messageFlows'], 'messageFlows', line, errors);
    const artifactsRaw = parseJsonArray<any>(raw['artifacts'], 'artifacts', line, errors);

    rows.push({
      displayId,
      name,
      largeName: raw['largeName']?.trim() || undefined,
      mediumName: raw['mediumName']?.trim() || undefined,
      smallName: raw['smallName']?.trim() || undefined,
      detailName: raw['detailName']?.trim() || undefined,
      laneName,
      displayOrder,
      bpmnElement: raw['bpmnElement']?.trim() || undefined,
      taskType: raw['taskType']?.trim() || undefined,
      gatewayType: raw['gatewayType']?.trim() || undefined,
      eventType: raw['eventType']?.trim() || undefined,
      intermediateEventType: raw['intermediateEventType']?.trim() || undefined,
      parallelAllowed: toBool(raw['parallelAllowed']),
      beforeDisplayIds,
      nextDisplayIds: nextDisplayIds.length > 0 ? nextDisplayIds : undefined,
      workSeconds: workHours !== undefined ? workHours * 3600 : undefined,
      workUnitPref: raw['workUnitPref']?.trim() || undefined,
      skillLevel: (raw['skillLevel']?.trim() as any) || undefined,
      systemName: raw['systemName']?.trim() || undefined,
      parentDisplayId,
      documentation: raw['documentation']?.trim() || undefined,
      issueDetail: raw['issueDetail']?.trim() || undefined,
      issueCategory: raw['issueCategory']?.trim() || undefined,
      countermeasurePolicy: raw['countermeasurePolicy']?.trim() || undefined,
      issueWorkSeconds: issueWorkHours !== undefined ? issueWorkHours * 3600 : undefined,
      timeReductionSeconds: timeReductionHours !== undefined ? timeReductionHours * 3600 : undefined,
      rateReductionPercent: rateReductionPercent,
      eventDetails: raw['eventDetails']?.trim() || undefined,
      inputDataObjects: inputDataObjects.length > 0 ? inputDataObjects : undefined,
      outputDataObjects: outputDataObjects.length > 0 ? outputDataObjects : undefined,
      conditionalFlows: conditionalFlowsRaw?.map(cf => ({
        targetDisplayId: toNumber((cf as any).targetDisplayId ?? (cf as any).target),
        condition: (cf as any).condition,
        description: (cf as any).description,
      })),
      messageFlows: messageFlowsRaw?.map(mf => ({
        targetDisplayId: toNumber((mf as any).targetDisplayId ?? (mf as any).target),
        messageContent: (mf as any).messageContent ?? (mf as any).message,
        description: (mf as any).description,
      })),
      artifacts: artifactsRaw?.map(a => ({
        type: (a as any).type,
        content: (a as any).content,
      })),
      customColumns: customValues,
    });
  });

  return { rows, errors, warnings };
}
