/**
 * Excel生成機能 V2
 * Phase 9フラット構造対応
 * 工程表データをExcelファイルにエクスポートする
 */

import * as XLSX from 'xlsx';
import {
  ProcessTable,
  Swimlane,
  CustomColumn,
  Process,
  BpmnElementType,
  BpmnTaskType,
  GatewayType,
  EventType,
} from '@/types/models';

export interface ExcelExportOptionsV2 {
  includeHeaders?: boolean;
  includeCustomColumns?: boolean;
  includeBpmnDetails?: boolean;
}

/**
 * 工程表データをExcel形式で生成
 */
export function generateProcessTableExcel(
  processTable: ProcessTable,
  swimlanes: Swimlane[],
  processes: Process[],
  customColumns: CustomColumn[],
  options: ExcelExportOptionsV2 = {}
): ArrayBuffer {
  const workbook = XLSX.utils.book_new();

  // 1. 工程表情報シート
  addProcessTableInfoSheet(workbook, processTable);

  // 2. レーン（スイムレーン）シート
  addSwimlanesSheet(workbook, swimlanes);

  // 3. カスタム列定義シート
  if (customColumns.length > 0) {
    addCustomColumnsSheet(workbook, customColumns);
  }

  // 4. 工程データシート（メイン）
  addProcessesSheet(workbook, processes, swimlanes, customColumns, options);

  // ArrayBufferに変換
  return workbookToArrayBuffer(workbook);
}

/**
 * 工程表情報シートを追加
 */
function addProcessTableInfoSheet(
  workbook: XLSX.WorkBook,
  processTable: ProcessTable
): void {
  const data = [
    ['工程表情報'],
    [],
    ['項目', '値'],
    ['工程表ID', processTable.id],
    ['プロジェクトID', processTable.projectId],
    ['工程表名', processTable.name],
    ['階層レベル', getLevelLabel(processTable.level)],
    ['説明', processTable.description || ''],
    ['表示順', processTable.displayOrder],
    ['作成日時', processTable.createdAt.toISOString()],
    ['更新日時', processTable.updatedAt.toISOString()],
  ];

  const ws = XLSX.utils.aoa_to_sheet(data);

  // 列幅設定
  ws['!cols'] = [{ wch: 20 }, { wch: 50 }];

  // スタイル設定
  applyHeaderStyle(ws, 'A1');
  applyTableHeaderStyle(ws, 'A3:B3');

  XLSX.utils.book_append_sheet(workbook, ws, '工程表情報');
}

/**
 * スイムレーンシートを追加
 */
function addSwimlanesSheet(
  workbook: XLSX.WorkBook,
  swimlanes: Swimlane[]
): void {
  const headers = ['レーンID', 'レーン名', '色', '順序'];
  const rows = swimlanes
    .sort((a, b) => a.order - b.order)
    .map(lane => [
      lane.id,
      lane.name,
      lane.color,
      lane.order,
    ]);

  const data = [headers, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(data);

  // 列幅設定
  ws['!cols'] = [
    { wch: 25 }, // レーンID
    { wch: 30 }, // レーン名
    { wch: 10 }, // 色
    { wch: 8 },  // 順序
  ];

  // ヘッダースタイル
  applyTableHeaderStyle(ws, 'A1:D1');

  XLSX.utils.book_append_sheet(workbook, ws, 'レーン');
}

/**
 * カスタム列定義シートを追加
 */
function addCustomColumnsSheet(
  workbook: XLSX.WorkBook,
  customColumns: CustomColumn[]
): void {
  const headers = ['列ID', '列名', 'データ型', '選択肢', '必須', '順序'];
  const rows = customColumns
    .sort((a, b) => a.order - b.order)
    .map(col => [
      col.id,
      col.name,
      col.type,
      col.options?.join(', ') || '',
      col.required ? '○' : '',
      col.order,
    ]);

  const data = [headers, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(data);

  // 列幅設定
  ws['!cols'] = [
    { wch: 25 }, // 列ID
    { wch: 30 }, // 列名
    { wch: 12 }, // データ型
    { wch: 40 }, // 選択肢
    { wch: 6 },  // 必須
    { wch: 8 },  // 順序
  ];

  // ヘッダースタイル
  applyTableHeaderStyle(ws, 'A1:F1');

  XLSX.utils.book_append_sheet(workbook, ws, 'カスタム列定義');
}

/**
 * 工程データシートを追加
 */
function addProcessesSheet(
  workbook: XLSX.WorkBook,
  processes: Process[],
  swimlanes: Swimlane[],
  customColumns: CustomColumn[],
  options: ExcelExportOptionsV2
): void {
  // ヘッダー行
  const headers = [
    '順序',
    '工程ID',
    '工程名',
    'レーンID',
    'レーン名',
    'BPMN要素',
    'タスク種類',
    '前工程ID',
    '次工程ID',
  ];

  // オプション: BPMN詳細情報
  if (options.includeBpmnDetails) {
    headers.push(
      'ドキュメント',
      'ゲートウェイ種類',
      'イベント種類',
      'データオブジェクト（入力）',
      'データオブジェクト（出力）'
    );
  }

  // オプション: カスタム列
  if (options.includeCustomColumns && customColumns.length > 0) {
    customColumns
      .sort((a, b) => a.order - b.order)
      .forEach(col => headers.push(col.name));
  }

  // レーン名マップ
  const laneMap = new Map(swimlanes.map(l => [l.id, l.name]));

  // データ行
  const rows = processes
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map(process => {
      const row = [
        process.displayOrder,
        process.id,
        process.name,
        process.laneId,
        laneMap.get(process.laneId) || '',
        process.bpmnElement,
        process.taskType || '',
        process.beforeProcessIds?.join(', ') || '',
        process.nextProcessIds?.join(', ') || '',
      ];

      // BPMN詳細情報
      if (options.includeBpmnDetails) {
        row.push(
          process.documentation || '',
          process.gatewayType || '',
          process.eventType || '',
          process.inputDataObjects?.join(', ') || '',
          process.outputDataObjects?.join(', ') || ''
        );
      }

      // カスタム列の値
      if (options.includeCustomColumns && customColumns.length > 0) {
        customColumns
          .sort((a, b) => a.order - b.order)
          .forEach(col => {
            const value = process.customColumns?.[col.id];
            row.push(formatCustomColumnValue(value, col.type));
          });
      }

      return row;
    });

  const data = [headers, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(data);

  // 列幅設定
  const colWidths = [
    { wch: 8 },  // 順序
    { wch: 25 }, // 工程ID
    { wch: 40 }, // 工程名
    { wch: 25 }, // レーンID
    { wch: 20 }, // レーン名
    { wch: 12 }, // BPMN要素
    { wch: 15 }, // タスク種類
    { wch: 30 }, // 前工程ID
    { wch: 30 }, // 次工程ID
  ];

  if (options.includeBpmnDetails) {
    colWidths.push(
      { wch: 40 }, // ドキュメント
      { wch: 15 }, // ゲートウェイ種類
      { wch: 15 }, // イベント種類
      { wch: 30 }, // データオブジェクト（入力）
      { wch: 30 }  // データオブジェクト（出力）
    );
  }

  if (options.includeCustomColumns && customColumns.length > 0) {
    customColumns.forEach(() => colWidths.push({ wch: 20 }));
  }

  ws['!cols'] = colWidths;

  // ヘッダースタイル
  const headerRange = `A1:${XLSX.utils.encode_col(headers.length - 1)}1`;
  applyTableHeaderStyle(ws, headerRange);

  XLSX.utils.book_append_sheet(workbook, ws, '工程データ');
}

/**
 * テンプレートExcelを生成（新規作成用）
 */
export function generateProcessTableTemplate(): ArrayBuffer {
  const workbook = XLSX.utils.book_new();

  // サンプル工程表情報
  const tableInfo = [
    ['工程表テンプレート'],
    [],
    ['このテンプレートを使用して新しい工程表を作成できます。'],
    ['各シートにサンプルデータが含まれています。'],
    [],
    ['使い方：'],
    ['1. 「レーン」シートでスイムレーンを定義'],
    ['2. 「カスタム列定義」シートで追加の列を定義（オプション）'],
    ['3. 「工程データ」シートで工程を入力'],
    ['4. ファイルを保存してインポート'],
  ];

  const wsInfo = XLSX.utils.aoa_to_sheet(tableInfo);
  wsInfo['!cols'] = [{ wch: 60 }];
  XLSX.utils.book_append_sheet(workbook, wsInfo, '使い方');

  // サンプルレーン
  const lanes = [
    ['レーンID', 'レーン名', '色', '順序'],
    ['lane-1', '営業部', '#3B82F6', 1],
    ['lane-2', '開発部', '#10B981', 2],
    ['lane-3', '品質管理部', '#F59E0B', 3],
  ];

  const wsLanes = XLSX.utils.aoa_to_sheet(lanes);
  wsLanes['!cols'] = [{ wch: 25 }, { wch: 30 }, { wch: 10 }, { wch: 8 }];
  applyTableHeaderStyle(wsLanes, 'A1:D1');
  XLSX.utils.book_append_sheet(workbook, wsLanes, 'レーン');

  // サンプルカスタム列
  const customCols = [
    ['列ID', '列名', 'データ型', '選択肢', '必須', '順序'],
    ['col-1', '優先度', 'SELECT', '高, 中, 低', '○', 1],
    ['col-2', '担当者', 'TEXT', '', '', 2],
    ['col-3', '完了予定日', 'DATE', '', '', 3],
  ];

  const wsCols = XLSX.utils.aoa_to_sheet(customCols);
  wsCols['!cols'] = [{ wch: 25 }, { wch: 30 }, { wch: 12 }, { wch: 40 }, { wch: 6 }, { wch: 8 }];
  applyTableHeaderStyle(wsCols, 'A1:F1');
  XLSX.utils.book_append_sheet(workbook, wsCols, 'カスタム列定義');

  // サンプル工程データ
  const processes = [
    ['順序', '工程ID', '工程名', 'レーンID', 'レーン名', 'BPMN要素', 'タスク種類', '前工程ID', '次工程ID'],
    [1, 'proc-1', '要件ヒアリング', 'lane-1', '営業部', 'task', 'userTask', '', 'proc-2'],
    [2, 'proc-2', '要件定義書作成', 'lane-1', '営業部', 'task', 'manualTask', 'proc-1', 'proc-3'],
    [3, 'proc-3', '設計', 'lane-2', '開発部', 'task', 'userTask', 'proc-2', 'proc-4'],
    [4, 'proc-4', '実装', 'lane-2', '開発部', 'task', 'userTask', 'proc-3', 'proc-5'],
    [5, 'proc-5', 'テスト', 'lane-3', '品質管理部', 'task', 'userTask', 'proc-4', ''],
  ];

  const wsProc = XLSX.utils.aoa_to_sheet(processes);
  wsProc['!cols'] = [
    { wch: 8 }, { wch: 25 }, { wch: 40 }, { wch: 25 },
    { wch: 20 }, { wch: 12 }, { wch: 15 }, { wch: 30 }, { wch: 30 }
  ];
  applyTableHeaderStyle(wsProc, 'A1:I1');
  XLSX.utils.book_append_sheet(workbook, wsProc, '工程データ');

  return workbookToArrayBuffer(workbook);
}

/**
 * WorkbookをArrayBufferに変換
 */
function workbookToArrayBuffer(workbook: XLSX.WorkBook): ArrayBuffer {
  const wbout = XLSX.write(workbook, {
    bookType: 'xlsx',
    type: 'array',
    cellStyles: true,
  });
  return wbout;
}

/**
 * ヘッダースタイルを適用
 */
function applyHeaderStyle(ws: XLSX.WorkSheet, cellRef: string): void {
  if (!ws[cellRef]) return;
  ws[cellRef].s = {
    font: { bold: true, sz: 14, color: { rgb: '1F4E78' } },
    alignment: { horizontal: 'left', vertical: 'center' }
  };
}

/**
 * テーブルヘッダースタイルを適用
 */
function applyTableHeaderStyle(ws: XLSX.WorkSheet, range: string): void {
  const decoded = XLSX.utils.decode_range(range);
  for (let col = decoded.s.c; col <= decoded.e.c; col++) {
    for (let row = decoded.s.r; row <= decoded.e.r; row++) {
      const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
      if (!ws[cellRef]) continue;
      ws[cellRef].s = {
        fill: {
          patternType: 'solid',
          fgColor: { rgb: '4472C4' },
          bgColor: { rgb: '4472C4' }
        },
        font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 11 },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: {
          top: { style: 'thin', color: { rgb: '000000' } },
          bottom: { style: 'thin', color: { rgb: '000000' } },
          left: { style: 'thin', color: { rgb: '000000' } },
          right: { style: 'thin', color: { rgb: '000000' } }
        }
      };
    }
  }
}

/**
 * カスタム列の値をフォーマット
 */
function formatCustomColumnValue(value: any, type: string): string {
  if (value === null || value === undefined) return '';
  
  switch (type) {
    case 'DATE':
      return value instanceof Date ? value.toISOString().split('T')[0] : String(value);
    case 'CHECKBOX':
      return value ? '✓' : '';
    case 'SELECT':
    case 'TEXT':
    case 'NUMBER':
    default:
      return String(value);
  }
}

/**
 * レベルのラベルを取得
 */
function getLevelLabel(level: string): string {
  const labels: Record<string, string> = {
    large: '大工程',
    medium: '中工程',
    small: '小工程',
    detail: '詳細工程',
  };
  return labels[level] || level;
}

/**
 * Blob形式で工程表をダウンロード
 */
export function downloadProcessTableExcel(
  processTable: ProcessTable,
  swimlanes: Swimlane[],
  processes: Process[],
  customColumns: CustomColumn[],
  options: ExcelExportOptionsV2 = {}
): void {
  const arrayBuffer = generateProcessTableExcel(
    processTable,
    swimlanes,
    processes,
    customColumns,
    options
  );

  const blob = new Blob([arrayBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${processTable.name}_${new Date().toISOString().split('T')[0]}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * テンプレートをダウンロード
 */
export function downloadProcessTableTemplate(): void {
  const arrayBuffer = generateProcessTableTemplate();

  const blob = new Blob([arrayBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `工程表テンプレート_${new Date().toISOString().split('T')[0]}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
