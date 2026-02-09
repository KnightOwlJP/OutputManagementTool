/**
 * 統合エクスポートサービス
 * 全てのエクスポート形式を統一的に扱う
 */

import * as XLSX from 'xlsx';
import type {
  ExportFormat,
  ExportOptions,
  ExportData,
  ExportResult,
  FlowExportOptions,
} from './types';
import {
  EXPORT_FORMAT_EXTENSIONS,
  DEFAULT_EXPORT_OPTIONS,
  DEFAULT_FLOW_OPTIONS,
} from './types';
import { generateTimestamp, fromSeconds } from '@/lib/common';

// ==========================================
// メインエクスポート関数
// ==========================================

/**
 * データをエクスポート
 */
export async function exportData(
  data: ExportData,
  options: Partial<ExportOptions> = {}
): Promise<ExportResult> {
  const opts: ExportOptions = { ...DEFAULT_EXPORT_OPTIONS, ...options };
  const filename = generateFilename(data.processTable.name, opts);

  try {
    let exportedData: ArrayBuffer | string;

    switch (opts.format) {
      case 'excel':
        exportedData = exportToExcel(data, opts);
        break;
      case 'excel-flow':
        exportedData = exportToExcelWithFlow(data, opts);
        break;
      case 'csv':
        exportedData = exportToCsv(data, opts);
        break;
      case 'bpmn-xml':
        exportedData = await exportToBpmnXml(data);
        break;
      case 'json':
        exportedData = exportToJson(data, opts);
        break;
      default:
        throw new Error(`Unsupported export format: ${opts.format}`);
    }

    return {
      success: true,
      filename,
      format: opts.format,
      data: exportedData,
    };
  } catch (error) {
    return {
      success: false,
      filename,
      format: opts.format,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * エクスポートしてダウンロード
 */
export async function exportAndDownload(
  data: ExportData,
  options: Partial<ExportOptions> = {}
): Promise<ExportResult> {
  const result = await exportData(data, options);

  if (result.success && result.data) {
    downloadFile(result.data, result.filename, result.format);
  }

  return result;
}

// ==========================================
// Excel エクスポート（データ形式）
// ==========================================

function exportToExcel(data: ExportData, options: ExportOptions): ArrayBuffer {
  const workbook = XLSX.utils.book_new();

  // 1. 工程表情報シート
  addInfoSheet(workbook, data);

  // 2. レーンシート
  addLanesSheet(workbook, data);

  // 3. カスタム列定義シート
  if (options.includeCustomColumns && data.customColumns.length > 0) {
    addCustomColumnsSheet(workbook, data);
  }

  // 4. 工程データシート
  addProcessesSheet(workbook, data, options);

  // 5. メタデータシート
  if (options.includeMetadata) {
    addMetadataSheet(workbook, data);
  }

  return XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
}

// ==========================================
// Excel エクスポート（フロー図付き）
// ==========================================

function exportToExcelWithFlow(
  data: ExportData,
  options: ExportOptions
): ArrayBuffer {
  const workbook = XLSX.utils.book_new();

  // 1. フロー図シート（メインシートとして最初に）
  addFlowDiagramSheet(workbook, data, options.flowOptions);

  // 2. 工程表情報シート
  addInfoSheet(workbook, data);

  // 3. レーンシート
  addLanesSheet(workbook, data);

  // 4. カスタム列定義シート
  if (options.includeCustomColumns && data.customColumns.length > 0) {
    addCustomColumnsSheet(workbook, data);
  }

  // 5. 工程データシート
  addProcessesSheet(workbook, data, options);

  return XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
}

// ==========================================
// フロー図シート
// ==========================================

function addFlowDiagramSheet(
  workbook: XLSX.WorkBook,
  data: ExportData,
  flowOptions?: FlowExportOptions
): void {
  const opts = { ...DEFAULT_FLOW_OPTIONS, ...flowOptions };
  const { processes, swimlanes } = data;

  // スイムレーンをソート
  const sortedLanes = [...swimlanes].sort((a, b) => a.order - b.order);

  // 工程をレーンごとにグループ化
  const processesByLane = new Map<string, typeof processes>();
  for (const lane of sortedLanes) {
    processesByLane.set(lane.id, []);
  }
  for (const process of processes) {
    const laneProcesses = processesByLane.get(process.laneId);
    if (laneProcesses) {
      laneProcesses.push(process);
    }
  }

  // 各レーン内の工程をdisplayOrderでソート
  for (const laneProcesses of processesByLane.values()) {
    laneProcesses.sort((a, b) => a.displayOrder - b.displayOrder);
  }

  // 最大ステップ数を計算
  let maxSteps = 0;
  for (const laneProcesses of processesByLane.values()) {
    maxSteps = Math.max(maxSteps, laneProcesses.length);
  }

  // グリッドを作成
  const rows: (string | number)[][] = [];

  // ヘッダー行（ステップ番号）
  const headerRow: (string | number)[] = ['レーン'];
  for (let i = 1; i <= maxSteps; i++) {
    headerRow.push(`ステップ${i}`);
    if (opts.showConnections && i < maxSteps) {
      headerRow.push(''); // 接続用の列
    }
  }
  rows.push(headerRow);

  // 各レーンの行を追加
  for (const lane of sortedLanes) {
    const laneProcesses = processesByLane.get(lane.id) || [];
    const row: (string | number)[] = [lane.name];

    for (let i = 0; i < maxSteps; i++) {
      const process = laneProcesses[i];
      if (process) {
        // 工程情報を構築
        let cellContent = process.name;
        if (opts.showWorkHours && process.workSeconds) {
          const hours = fromSeconds(process.workSeconds, 'hours');
          cellContent += `\n[工数: ${hours?.toFixed(1)}h]`;
        }
        if (opts.showLeadTime && process.leadTimeSeconds) {
          const hours = fromSeconds(process.leadTimeSeconds, 'hours');
          cellContent += `\n[LT: ${hours?.toFixed(1)}h]`;
        }
        row.push(cellContent);
      } else {
        row.push('');
      }

      // 接続矢印
      if (opts.showConnections && i < maxSteps - 1) {
        const hasNextInLane = laneProcesses[i + 1] !== undefined;
        row.push(hasNextInLane ? '→' : '');
      }
    }

    rows.push(row);

    // レーン間の接続を示す行（オプション）
    // 次のレーンへの接続がある場合は↓を表示
    const connectionRow: (string | number)[] = [''];
    for (let i = 0; i < maxSteps; i++) {
      const process = laneProcesses[i];
      let hasDownConnection = false;

      if (process && process.nextProcessIds) {
        for (const nextId of process.nextProcessIds) {
          const nextProcess = processes.find((p) => p.id === nextId);
          if (nextProcess && nextProcess.laneId !== lane.id) {
            hasDownConnection = true;
            break;
          }
        }
      }

      connectionRow.push(hasDownConnection ? '↓' : '');
      if (opts.showConnections && i < maxSteps - 1) {
        connectionRow.push('');
      }
    }

    // 接続行に何か内容があれば追加
    if (connectionRow.some((cell, idx) => idx > 0 && cell !== '')) {
      rows.push(connectionRow);
    }
  }

  // シートを作成
  const sheet = XLSX.utils.aoa_to_sheet(rows);

  // 列幅を設定
  const colWidths: XLSX.ColInfo[] = [{ wch: 15 }]; // レーン列
  for (let i = 0; i < maxSteps; i++) {
    colWidths.push({ wch: 25 }); // 工程列
    if (opts.showConnections && i < maxSteps - 1) {
      colWidths.push({ wch: 3 }); // 接続列
    }
  }
  sheet['!cols'] = colWidths;

  // 行高さを設定（セルに複数行ある場合用）
  const rowHeights: XLSX.RowInfo[] = [];
  for (let i = 0; i < rows.length; i++) {
    rowHeights.push({ hpt: i === 0 ? 20 : 50 });
  }
  sheet['!rows'] = rowHeights;

  XLSX.utils.book_append_sheet(workbook, sheet, 'フロー図');
}

// ==========================================
// 共通シート追加関数
// ==========================================

function addInfoSheet(workbook: XLSX.WorkBook, data: ExportData): void {
  const { processTable } = data;
  const levelLabels: Record<string, string> = {
    large: '大工程',
    medium: '中工程',
    small: '小工程',
    detail: '詳細工程',
  };

  const rows = [
    ['工程表情報'],
    [],
    ['項目', '値'],
    ['工程表ID', processTable.id],
    ['工程表名', processTable.name],
    ['階層レベル', levelLabels[processTable.level] || processTable.level],
    ['説明', processTable.description || ''],
    ['表示順', processTable.displayOrder],
  ];

  const sheet = XLSX.utils.aoa_to_sheet(rows);
  sheet['!cols'] = [{ wch: 15 }, { wch: 50 }];
  XLSX.utils.book_append_sheet(workbook, sheet, '工程表情報');
}

function addLanesSheet(workbook: XLSX.WorkBook, data: ExportData): void {
  const headers = ['レーンID', 'レーン名', '色', '順序'];
  const rows = data.swimlanes
    .sort((a, b) => a.order - b.order)
    .map((lane) => [lane.id, lane.name, lane.color, lane.order]);

  const sheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  sheet['!cols'] = [{ wch: 30 }, { wch: 25 }, { wch: 10 }, { wch: 8 }];
  XLSX.utils.book_append_sheet(workbook, sheet, 'レーン');
}

function addCustomColumnsSheet(
  workbook: XLSX.WorkBook,
  data: ExportData
): void {
  const headers = ['列ID', '列名', 'データ型', '選択肢', '必須', '順序'];
  const rows = data.customColumns
    .sort((a, b) => a.order - b.order)
    .map((col) => [
      col.id,
      col.name,
      col.type,
      col.options?.join(', ') || '',
      col.required ? '○' : '',
      col.order,
    ]);

  const sheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  sheet['!cols'] = [
    { wch: 30 },
    { wch: 20 },
    { wch: 12 },
    { wch: 30 },
    { wch: 6 },
    { wch: 8 },
  ];
  XLSX.utils.book_append_sheet(workbook, sheet, 'カスタム列定義');
}

function addProcessesSheet(
  workbook: XLSX.WorkBook,
  data: ExportData,
  options: ExportOptions
): void {
  const laneMap = new Map(data.swimlanes.map((l) => [l.id, l.name]));

  const headers = [
    '順序',
    '工程ID',
    '工程名',
    '大工程名',
    '中工程名',
    '小工程名',
    '詳細工程名',
    'レーンID',
    'レーン名',
    'BPMN要素',
    'タスク種類',
    '前工程ID',
    '次工程ID',
    '工数(時間)',
    'LT(時間)',
  ];

  if (options.includeBpmnDetails) {
    headers.push(
      'ドキュメント',
      'ゲートウェイ種類',
      'イベント種類',
      'データオブジェクト（入力）',
      'データオブジェクト（出力）'
    );
  }

  // カスタム列ヘッダー
  const sortedCustomCols = options.includeCustomColumns
    ? [...data.customColumns].sort((a, b) => a.order - b.order)
    : [];
  sortedCustomCols.forEach((col) => headers.push(col.name));

  const rows = data.processes
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map((p) => {
      const row: (string | number)[] = [
        p.displayOrder,
        p.id,
        p.name,
        p.largeName || '',
        p.mediumName || '',
        p.smallName || '',
        p.detailName || '',
        p.laneId,
        laneMap.get(p.laneId) || '',
        p.bpmnElement || '',
        p.taskType || '',
        p.beforeProcessIds?.join(', ') || '',
        p.nextProcessIds?.join(', ') || '',
        p.workSeconds ? (p.workSeconds / 3600).toFixed(2) : '',
        p.leadTimeSeconds ? (p.leadTimeSeconds / 3600).toFixed(2) : '',
      ];

      if (options.includeBpmnDetails) {
        row.push(
          p.documentation || '',
          p.gatewayType || '',
          p.eventType || '',
          p.inputDataObjects?.join(', ') || '',
          p.outputDataObjects?.join(', ') || ''
        );
      }

      // カスタム列値
      sortedCustomCols.forEach((col) => {
        const value = p.customColumns?.[col.id];
        row.push(value !== undefined && value !== null ? String(value) : '');
      });

      return row;
    });

  const sheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  XLSX.utils.book_append_sheet(workbook, sheet, '工程データ');
}

function addMetadataSheet(workbook: XLSX.WorkBook, data: ExportData): void {
  const now = new Date();
  const rows = [
    ['メタデータ'],
    [],
    ['エクスポート日時', now.toLocaleString('ja-JP')],
    ['工程数', data.processes.length],
    ['レーン数', data.swimlanes.length],
    ['カスタム列数', data.customColumns.length],
    ['バージョン', '2.0'],
  ];

  const sheet = XLSX.utils.aoa_to_sheet(rows);
  sheet['!cols'] = [{ wch: 20 }, { wch: 30 }];
  XLSX.utils.book_append_sheet(workbook, sheet, 'メタデータ');
}

// ==========================================
// CSV エクスポート
// ==========================================

function exportToCsv(data: ExportData, options: ExportOptions): ArrayBuffer {
  const laneMap = new Map(data.swimlanes.map((l) => [l.id, l.name]));

  const headers = [
    'displayOrder',
    'id',
    'name',
    'largeName',
    'mediumName',
    'smallName',
    'detailName',
    'laneId',
    'laneName',
    'bpmnElement',
    'taskType',
    'beforeProcessIds',
    'nextProcessIds',
    'workHours',
    'leadTimeHours',
  ];

  const sortedCustomCols = options.includeCustomColumns
    ? [...data.customColumns].sort((a, b) => a.order - b.order)
    : [];
  sortedCustomCols.forEach((col) => headers.push(col.name));

  const rows = data.processes
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map((p) => {
      const row: string[] = [
        String(p.displayOrder),
        p.id,
        p.name,
        p.largeName || '',
        p.mediumName || '',
        p.smallName || '',
        p.detailName || '',
        p.laneId,
        laneMap.get(p.laneId) || '',
        p.bpmnElement || '',
        p.taskType || '',
        p.beforeProcessIds?.join(';') || '',
        p.nextProcessIds?.join(';') || '',
        p.workSeconds ? (p.workSeconds / 3600).toFixed(2) : '',
        p.leadTimeSeconds ? (p.leadTimeSeconds / 3600).toFixed(2) : '',
      ];

      sortedCustomCols.forEach((col) => {
        const value = p.customColumns?.[col.id];
        row.push(value !== undefined && value !== null ? String(value) : '');
      });

      return row;
    });

  // CSV文字列を生成
  const csvContent = [headers, ...rows]
    .map((row) =>
      row
        .map((cell) => {
          // ダブルクォートが含まれる場合はエスケープ
          const escaped = String(cell).replace(/"/g, '""');
          // カンマ、改行、ダブルクォートが含まれる場合はクォートで囲む
          return /[,\n"]/.test(escaped) ? `"${escaped}"` : escaped;
        })
        .join(',')
    )
    .join('\n');

  // BOM付きUTF-8
  const bom = new Uint8Array([0xef, 0xbb, 0xbf]);
  const content = new TextEncoder().encode(csvContent);
  const result = new Uint8Array(bom.length + content.length);
  result.set(bom);
  result.set(content, bom.length);

  return result.buffer;
}

// ==========================================
// BPMN XML エクスポート
// ==========================================

async function exportToBpmnXml(data: ExportData): Promise<ArrayBuffer> {
  // bpmn-xml-exporterを動的インポート
  const { exportProcessTableToBpmnXml } = await import('@/lib/bpmn-xml-exporter');

  const result = await exportProcessTableToBpmnXml({
    processTable: data.processTable,
    processes: data.processes,
    swimlanes: data.swimlanes,
    autoLayout: true,
  });

  return new TextEncoder().encode(result.xml).buffer;
}

// ==========================================
// JSON エクスポート
// ==========================================

function exportToJson(data: ExportData, options: ExportOptions): ArrayBuffer {
  const exportObj = {
    version: '2.0',
    exportedAt: new Date().toISOString(),
    processTable: data.processTable,
    swimlanes: data.swimlanes,
    customColumns: options.includeCustomColumns ? data.customColumns : [],
    processes: data.processes,
    dataObjects: data.dataObjects || [],
  };

  const jsonString = JSON.stringify(exportObj, null, 2);
  return new TextEncoder().encode(jsonString).buffer;
}

// ==========================================
// ユーティリティ
// ==========================================

function generateFilename(baseName: string, options: ExportOptions): string {
  const name = options.filename || baseName;
  const timestamp = generateTimestamp();
  const extension = EXPORT_FORMAT_EXTENSIONS[options.format];
  return `${name}_${timestamp}${extension}`;
}

function downloadFile(
  data: ArrayBuffer | string,
  filename: string,
  format: ExportFormat
): void {
  const mimeTypes: Record<ExportFormat, string> = {
    excel: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'excel-flow':
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    csv: 'text/csv;charset=utf-8',
    'bpmn-xml': 'application/xml',
    json: 'application/json',
  };

  const blob = new Blob(
    [typeof data === 'string' ? data : new Uint8Array(data)],
    { type: mimeTypes[format] }
  );
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}
