/**
 * Excel生成機能
 * 工程データをExcelファイルにエクスポートする
 */

import * as XLSX from 'xlsx';
import { Process, ProcessLevel } from '@/types/project.types';

export interface ExcelExportOptions {
  includeHeaders?: boolean;
  sheetName?: string;
  includeMetadata?: boolean;
}

interface ProcessRow {
  大工程: string;
  中工程: string;
  小工程: string;
  詳細工程: string;
  部署名: string;
  作業実行者: string;
  帳票種類: string;
  説明: string;
  開始日: string;
  終了日: string;
  ステータス: string;
}

/**
 * 工程データを階層的に整理
 */
function organizeProcessHierarchy(processes: Process[]): Map<string, Process[]> {
  const hierarchy = new Map<string, Process[]>();

  // レベルごとに分類
  processes.forEach(process => {
    const key = process.level;
    if (!hierarchy.has(key)) {
      hierarchy.set(key, []);
    }
    hierarchy.get(key)!.push(process);
  });

  return hierarchy;
}

/**
 * 工程ツリーを構築
 */
function buildProcessTree(processes: Process[]): Process[] {
  const processMap = new Map<string, Process>();
  const rootProcesses: Process[] = [];

  // マップに登録
  processes.forEach(process => {
    processMap.set(process.id, process);
  });

  // 親子関係を構築
  processes.forEach(process => {
    if (!process.parentId) {
      rootProcesses.push(process);
    }
  });

  return rootProcesses;
}

/**
 * 工程データを行データに変換（再帰的）
 */
function convertToRows(
  processes: Process[],
  largeProcess: string = '',
  mediumProcess: string = '',
  smallProcess: string = ''
): ProcessRow[] {
  const rows: ProcessRow[] = [];

  processes.forEach(process => {
    let currentLarge = largeProcess;
    let currentMedium = mediumProcess;
    let currentSmall = smallProcess;
    let currentDetail = '';

    switch (process.level) {
      case 'large':
        currentLarge = process.name;
        break;
      case 'medium':
        currentMedium = process.name;
        break;
      case 'small':
        currentSmall = process.name;
        break;
      case 'detail':
        currentDetail = process.name;
        break;
    }

    rows.push({
      大工程: currentLarge,
      中工程: currentMedium,
      小工程: currentSmall,
      詳細工程: currentDetail,
      部署名: process.department || '',
      作業実行者: process.assignee || '',
      帳票種類: process.documentType || '',
      説明: process.description || '',
      開始日: process.startDate ? process.startDate.toLocaleDateString('ja-JP') : '',
      終了日: process.endDate ? process.endDate.toLocaleDateString('ja-JP') : '',
      ステータス: process.status || '',
    });

    // 子工程を再帰的に処理
    const children = processes.filter(p => p.parentId === process.id);
    if (children.length > 0) {
      const childRows = convertToRows(children, currentLarge, currentMedium, currentSmall);
      rows.push(...childRows);
    }
  });

  return rows;
}

/**
 * 工程データをフラットな行データに変換（階層を展開）
 */
function flattenProcesses(processes: Process[]): ProcessRow[] {
  const rows: ProcessRow[] = [];
  const processMap = new Map<string, Process>();

  // プロセスマップを作成
  processes.forEach(p => processMap.set(p.id, p));

  // 各工程について階層を遡って情報を収集
  processes.forEach(process => {
    let large = '';
    let medium = '';
    let small = '';
    let detail = '';

    // 現在の工程レベルに応じて設定
    switch (process.level) {
      case 'detail':
        detail = process.name;
        // 親をたどる
        if (process.parentId) {
          const parent = processMap.get(process.parentId);
          if (parent?.level === 'small') {
            small = parent.name;
            if (parent.parentId) {
              const grandParent = processMap.get(parent.parentId);
              if (grandParent?.level === 'medium') {
                medium = grandParent.name;
                if (grandParent.parentId) {
                  const greatGrandParent = processMap.get(grandParent.parentId);
                  if (greatGrandParent?.level === 'large') {
                    large = greatGrandParent.name;
                  }
                }
              }
            }
          }
        }
        break;
      case 'small':
        small = process.name;
        if (process.parentId) {
          const parent = processMap.get(process.parentId);
          if (parent?.level === 'medium') {
            medium = parent.name;
            if (parent.parentId) {
              const grandParent = processMap.get(parent.parentId);
              if (grandParent?.level === 'large') {
                large = grandParent.name;
              }
            }
          }
        }
        break;
      case 'medium':
        medium = process.name;
        if (process.parentId) {
          const parent = processMap.get(process.parentId);
          if (parent?.level === 'large') {
            large = parent.name;
          }
        }
        break;
      case 'large':
        large = process.name;
        break;
    }

    rows.push({
      大工程: large,
      中工程: medium,
      小工程: small,
      詳細工程: detail,
      部署名: process.department || '',
      作業実行者: process.assignee || '',
      帳票種類: process.documentType || '',
      説明: process.description || '',
      開始日: process.startDate ? process.startDate.toLocaleDateString('ja-JP') : '',
      終了日: process.endDate ? process.endDate.toLocaleDateString('ja-JP') : '',
      ステータス: process.status || '',
    });
  });

  return rows;
}

/**
 * 工程データからExcelワークブックを生成
 */
export function generateProcessWorkbook(
  processes: Process[],
  options: ExcelExportOptions = {}
): XLSX.WorkBook {
  const {
    includeHeaders = true,
    sheetName = '工程一覧',
    includeMetadata = true,
  } = options;

  const workbook = XLSX.utils.book_new();

  // 工程データを行データに変換
  const rows = flattenProcesses(processes);

  // ワークシートを作成
  const worksheet = XLSX.utils.json_to_sheet(rows, {
    header: [
      '大工程',
      '中工程',
      '小工程',
      '詳細工程',
      '部署名',
      '作業実行者',
      '帳票種類',
      '説明',
      '開始日',
      '終了日',
      'ステータス',
    ],
  });

  // 列幅を設定
  worksheet['!cols'] = [
    { wch: 20 }, // 大工程
    { wch: 20 }, // 中工程
    { wch: 20 }, // 小工程
    { wch: 30 }, // 詳細工程
    { wch: 15 }, // 部署名
    { wch: 15 }, // 作業実行者
    { wch: 15 }, // 帳票種類
    { wch: 40 }, // 説明
    { wch: 12 }, // 開始日
    { wch: 12 }, // 終了日
    { wch: 12 }, // ステータス
  ];

  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // メタデータシートを追加
  if (includeMetadata) {
    const metadata = [
      ['エクスポート日時', new Date().toLocaleString('ja-JP')],
      ['工程数', processes.length.toString()],
      ['大工程数', processes.filter(p => p.level === 'large').length.toString()],
      ['中工程数', processes.filter(p => p.level === 'medium').length.toString()],
      ['小工程数', processes.filter(p => p.level === 'small').length.toString()],
      ['詳細工程数', processes.filter(p => p.level === 'detail').length.toString()],
    ];

    const metadataSheet = XLSX.utils.aoa_to_sheet(metadata);
    XLSX.utils.book_append_sheet(workbook, metadataSheet, 'メタデータ');
  }

  console.log(`[ExcelGenerator] Generated workbook with ${processes.length} processes`);
  return workbook;
}

/**
 * ワークブックをArrayBufferに変換
 */
export function workbookToArrayBuffer(workbook: XLSX.WorkBook): ArrayBuffer {
  return XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
}

/**
 * 工程データをExcelファイルにエクスポート（統合関数）
 */
export function exportProcessesToExcel(
  processes: Process[],
  options?: ExcelExportOptions
): ArrayBuffer {
  const workbook = generateProcessWorkbook(processes, options);
  return workbookToArrayBuffer(workbook);
}

/**
 * テンプレートExcelファイルを生成
 */
export function generateTemplateWorkbook(): XLSX.WorkBook {
  const workbook = XLSX.utils.book_new();

  // サンプルデータ
  const sampleData = [
    {
      大工程: '営業部',
      中工程: '営業担当者',
      小工程: '見積書',
      詳細工程: '見積書フォーマットに金額を入力',
      部署名: '営業部',
      作業実行者: '営業担当者',
      帳票種類: '見積書',
      説明: '顧客からの要望に基づいて見積書を作成する',
      開始日: '',
      終了日: '',
      ステータス: '',
    },
    {
      大工程: '営業部',
      中工程: '営業担当者',
      小工程: '見積書',
      詳細工程: '上司に承認を依頼',
      部署名: '営業部',
      作業実行者: '営業担当者',
      帳票種類: '見積書',
      説明: '作成した見積書を上司に確認してもらう',
      開始日: '',
      終了日: '',
      ステータス: '',
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  
  // 列幅を設定
  worksheet['!cols'] = [
    { wch: 20 },
    { wch: 20 },
    { wch: 20 },
    { wch: 30 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
    { wch: 40 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
  ];

  XLSX.utils.book_append_sheet(workbook, worksheet, '工程一覧テンプレート');

  // 説明シートを追加
  const instructions = [
    ['工程管理ツール - インポートテンプレート'],
    [''],
    ['使い方:'],
    ['1. このテンプレートの「工程一覧テンプレート」シートに工程データを入力してください'],
    ['2. 大工程・中工程・小工程・詳細工程の4段階で階層を表現します'],
    ['3. 必須項目: 大工程、中工程、小工程、詳細工程のいずれか'],
    ['4. 部署名・作業実行者・帳票種類は各レベルに応じて入力してください'],
    [''],
    ['列の説明:'],
    ['・大工程: 部署単位の工程（例: 営業部）'],
    ['・中工程: 作業実行者が行う工程（例: 営業担当者）'],
    ['・小工程: 帳票種類の工程（例: 見積書）'],
    ['・詳細工程: 具体的な作業ステップ（例: 見積書を作成）'],
    ['・部署名: 担当部署'],
    ['・作業実行者: 担当者の役割'],
    ['・帳票種類: 扱う帳票の種類'],
    ['・説明: 工程の詳細説明'],
  ];

  const instructionSheet = XLSX.utils.aoa_to_sheet(instructions);
  XLSX.utils.book_append_sheet(workbook, instructionSheet, '使い方');

  return workbook;
}

/**
 * テンプレートをArrayBufferとして生成
 */
export function generateTemplate(): ArrayBuffer {
  const workbook = generateTemplateWorkbook();
  return workbookToArrayBuffer(workbook);
}
