/**
 * CSVインポートユーティリティ
 * 工程表の工程をCSVから読み込み、アプリ側の形式に変換する
 */

import Papa from 'papaparse';
import { CustomColumn } from '@/types/models';

export interface ParsedCsvProcessRow {
  displayId?: number;
  name: string;
  largeName?: string;
  mediumName?: string;
  smallName?: string;
  detailName?: string;
  laneName: string;
  bpmnElement?: string;
  taskType?: string;
  gatewayType?: string;
  eventType?: string;
  parallelAllowed?: boolean;
  beforeDisplayIds: number[];
  workSeconds?: number;
  skillLevel?: '-' | 'L' | 'M' | 'H';
  systemName?: string;
  documentation?: string;
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

export function parseProcessesCsv(text: string, customColumns: CustomColumn[]): CsvImportResult {
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

    const beforeRaw = raw['beforeDisplayIds'] || '';
    const beforeDisplayIds = beforeRaw
      .split(/[,、]/)
      .map(s => s.trim())
      .filter(Boolean)
      .map(v => toNumber(v))
      .filter((v): v is number => v !== undefined);

    const customValues: Record<string, string> = {};
    customColumns.forEach(col => {
      const val = raw[col.name];
      if (val !== undefined) customValues[col.id] = String(val);
    });

    const workHours = toNumber(raw['workHours']);

    rows.push({
      displayId,
      name,
      largeName: raw['largeName']?.trim() || undefined,
      mediumName: raw['mediumName']?.trim() || undefined,
      smallName: raw['smallName']?.trim() || undefined,
      detailName: raw['detailName']?.trim() || undefined,
      laneName,
      bpmnElement: raw['bpmnElement']?.trim() || undefined,
      taskType: raw['taskType']?.trim() || undefined,
      gatewayType: raw['gatewayType']?.trim() || undefined,
      eventType: raw['eventType']?.trim() || undefined,
      parallelAllowed: toBool(raw['parallelAllowed']),
      beforeDisplayIds,
      workSeconds: workHours !== undefined ? workHours * 3600 : undefined,
      skillLevel: (raw['skillLevel']?.trim() as any) || undefined,
      systemName: raw['systemName']?.trim() || undefined,
      documentation: raw['documentation']?.trim() || undefined,
      customColumns: customValues,
    });
  });

  return { rows, errors, warnings };
}
