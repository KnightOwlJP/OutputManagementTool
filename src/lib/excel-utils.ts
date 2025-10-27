/**
 * Excel (XLSX) エクスポート・インポート ユーティリティ
 */

import * as XLSX from 'xlsx';
import { Process, ProcessLevel } from '@/types/project.types';

/**
 * 工程表のテンプレートをXLSX形式で生成
 */
export function generateProcessTemplateXLSX(): Blob {
  // ワークブックを作成
  const wb = XLSX.utils.book_new();

  // テンプレートデータ
  const templateData = [
    [
      '順序',
      '工程名',
      'レベル',
      '親工程ID',
      '部署名',
      '担当者',
      '帳票種類',
      '開始日',
      '終了日',
      'ステータス',
      '説明',
    ],
    [
      '1',
      '要件定義',
      '大工程',
      '',
      '営業企画部',
      '',
      '',
      '2025-01-10',
      '2025-01-20',
      '未着手',
      '顧客要件のヒアリングと整理',
    ],
    [
      '2',
      'ヒアリング実施',
      '中工程',
      '',
      '',
      '営業担当者',
      '',
      '2025-01-10',
      '2025-01-15',
      '未着手',
      '顧客との打ち合わせ',
    ],
    [
      '3',
      '要件定義書作成',
      '小工程',
      '',
      '',
      '',
      '要件定義書',
      '2025-01-16',
      '2025-01-20',
      '未着手',
      '要件定義書の作成と承認',
    ],
    [
      '4',
      '設計',
      '大工程',
      '',
      '開発部',
      '',
      '',
      '2025-01-21',
      '2025-02-10',
      '未着手',
      'システム設計書の作成',
    ],
    [
      '5',
      '基本設計',
      '中工程',
      '',
      '',
      'システム設計者',
      '',
      '2025-01-21',
      '2025-01-31',
      '未着手',
      '基本設計書の作成',
    ],
  ];

  // ワークシートを作成
  const ws = XLSX.utils.aoa_to_sheet(templateData);

  // 列幅を設定
  ws['!cols'] = [
    { wch: 8 },  // 順序
    { wch: 30 }, // 工程名
    { wch: 12 }, // レベル
    { wch: 15 }, // 親工程ID
    { wch: 20 }, // 部署名
    { wch: 20 }, // 担当者
    { wch: 20 }, // 帳票種類
    { wch: 12 }, // 開始日
    { wch: 12 }, // 終了日
    { wch: 12 }, // ステータス
    { wch: 40 }, // 説明
  ];

  // 行の高さを設定
  ws['!rows'] = [
    { hpt: 30 }, // ヘッダー行
  ];

  // セルスタイルを適用
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:K6');
  
  // ヘッダー行のスタイル
  for (let col = range.s.c; col <= range.e.c; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
    if (!ws[cellAddress]) continue;
    
    ws[cellAddress].s = {
      fill: {
        patternType: 'solid',
        fgColor: { rgb: '4472C4' },
        bgColor: { rgb: '4472C4' }
      },
      font: {
        bold: true,
        color: { rgb: 'FFFFFF' },
        sz: 11,
        name: 'メイリオ'
      },
      alignment: {
        horizontal: 'center',
        vertical: 'center',
        wrapText: true
      },
      border: {
        top: { style: 'thin', color: { rgb: '000000' } },
        bottom: { style: 'thin', color: { rgb: '000000' } },
        left: { style: 'thin', color: { rgb: '000000' } },
        right: { style: 'thin', color: { rgb: '000000' } }
      }
    };
  }

  // データ行のスタイル
  for (let row = range.s.r + 1; row <= range.e.r; row++) {
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
      if (!ws[cellAddress]) {
        ws[cellAddress] = { t: 's', v: '' };
      }

      // 行ごとに背景色を交互に設定（ストライプ）
      const isEvenRow = row % 2 === 0;
      const bgColor = isEvenRow ? 'F2F2F2' : 'FFFFFF';

      ws[cellAddress].s = {
        fill: {
          patternType: 'solid',
          fgColor: { rgb: bgColor },
          bgColor: { rgb: bgColor }
        },
        font: {
          sz: 10,
          name: 'メイリオ'
        },
        alignment: {
          horizontal: col === 1 || col === 10 ? 'left' : 'center', // 工程名と説明は左揃え
          vertical: 'center',
          wrapText: col === 10 // 説明列は折り返し
        },
        border: {
          top: { style: 'thin', color: { rgb: 'D0D0D0' } },
          bottom: { style: 'thin', color: { rgb: 'D0D0D0' } },
          left: { style: 'thin', color: { rgb: 'D0D0D0' } },
          right: { style: 'thin', color: { rgb: 'D0D0D0' } }
        }
      };

      // 順序列は数値書式
      if (col === 0 && ws[cellAddress].v) {
        ws[cellAddress].t = 'n';
        ws[cellAddress].z = '0';
      }

      // 日付列は日付書式
      if ((col === 7 || col === 8) && ws[cellAddress].v) {
        ws[cellAddress].z = 'yyyy-mm-dd';
      }
    }
  }

  // ワークシートをワークブックに追加
  XLSX.utils.book_append_sheet(wb, ws, '工程表テンプレート');

  // 説明シートを追加
  const instructionData = [
    ['工程表テンプレート 使い方'],
    [''],
    ['📋 このテンプレートについて'],
    ['このテンプレートを使って工程表を簡単に作成できます。'],
    ['サンプル行を参考に、必要な工程を追加してください。'],
    [''],
    ['📝 各列の説明'],
    [''],
    ['列名', '説明', '入力例', '必須'],
    ['順序', '工程の表示順序（数値）', '1, 2, 3...', '○'],
    ['工程名', '工程の名称', '要件定義、設計、開発など', '○'],
    ['レベル', '工程の階層レベル', '大工程/中工程/小工程/詳細工程', '○'],
    ['親工程ID', '上位階層の工程ID（階層構造を作る場合）', '空欄またはID', ''],
    ['部署名', '担当部署（大工程で推奨）', '営業企画部、開発部など', ''],
    ['担当者', '作業実行者（中工程で推奨）', '営業担当者、開発者など', ''],
    ['帳票種類', '帳票の種類（小工程で推奨）', '要件定義書、設計書など', ''],
    ['開始日', '工程の開始予定日', '2025-01-10', ''],
    ['終了日', '工程の完了予定日', '2025-01-20', ''],
    ['ステータス', '工程の進捗状態', '未着手/進行中/完了/保留/中止', ''],
    ['説明', '工程の詳細説明', '任意のテキスト', ''],
    [''],
    ['⚠️ 注意事項'],
    [''],
    ['1. ヘッダー行（1行目）は変更しないでください'],
    ['2. レベルは以下のいずれかを正確に入力してください：'],
    ['   - 大工程：複数の中工程をまとめる部署単位'],
    ['   - 中工程：作業実行者が行う一連の作業'],
    ['   - 小工程：特定の帳票に関する作業'],
    ['   - 詳細工程：具体的な作業ステップ'],
    ['3. 日付は「YYYY-MM-DD」形式で統一してください（例: 2025-01-10）'],
    ['4. 順序は重複しても構いませんが、昇順を推奨します'],
    [''],
    ['💡 使い方のヒント'],
    [''],
    ['• まず大工程を作成し、その下に中工程、小工程を配置すると管理しやすくなります'],
    ['• 親工程IDを使うと階層構造が作れますが、空欄でもOKです'],
    ['• サンプル行は削除せず、参考にしながら新しい行を追加することをお勧めします'],
    ['• 完成したらアプリケーションでインポートしてください（※インポート機能は開発中）'],
  ];

  const instructionWs = XLSX.utils.aoa_to_sheet(instructionData);
  instructionWs['!cols'] = [{ wch: 15 }, { wch: 45 }, { wch: 25 }, { wch: 8 }];

  // 説明シートのスタイリング
  const instructionRange = XLSX.utils.decode_range(instructionWs['!ref'] || 'A1');
  
  // タイトル行
  if (instructionWs['A1']) {
    instructionWs['A1'].s = {
      font: { bold: true, sz: 16, color: { rgb: '1F4E78' }, name: 'メイリオ' },
      alignment: { horizontal: 'left', vertical: 'center' }
    };
  }

  // セクションヘッダー
  const sectionHeaders = [3, 7, 23, 35]; // 各セクションの開始行
  sectionHeaders.forEach(rowIndex => {
    const cellAddress = XLSX.utils.encode_cell({ r: rowIndex - 1, c: 0 });
    if (instructionWs[cellAddress]) {
      instructionWs[cellAddress].s = {
        font: { bold: true, sz: 12, color: { rgb: '2E75B5' }, name: 'メイリオ' },
        alignment: { horizontal: 'left', vertical: 'center' }
      };
    }
  });

  // テーブルヘッダー（9行目）
  for (let col = 0; col < 4; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: 8, c: col });
    if (instructionWs[cellAddress]) {
      instructionWs[cellAddress].s = {
        fill: {
          patternType: 'solid',
          fgColor: { rgb: 'D9E2F3' },
          bgColor: { rgb: 'D9E2F3' }
        },
        font: { bold: true, sz: 10, name: 'メイリオ' },
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

  // テーブルデータ行（10-20行目）
  for (let row = 9; row < 20; row++) {
    for (let col = 0; col < 4; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
      if (instructionWs[cellAddress]) {
        instructionWs[cellAddress].s = {
          font: { sz: 10, name: 'メイリオ' },
          alignment: { horizontal: 'left', vertical: 'center', wrapText: true },
          border: {
            top: { style: 'thin', color: { rgb: 'D0D0D0' } },
            bottom: { style: 'thin', color: { rgb: 'D0D0D0' } },
            left: { style: 'thin', color: { rgb: 'D0D0D0' } },
            right: { style: 'thin', color: { rgb: 'D0D0D0' } }
          }
        };
      }
    }
  }

  XLSX.utils.book_append_sheet(wb, instructionWs, '使い方');

  // BLOBに変換
  const wbout = XLSX.write(wb, { 
    bookType: 'xlsx', 
    type: 'array',
    cellStyles: true,
    bookSST: false
  });
  return new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

/**
 * 工程データをXLSX形式で生成
 */
export function generateProcessDataXLSX(processes: Process[], projectName?: string): Blob {
  // ワークブックを作成
  const wb = XLSX.utils.book_new();

  // プロセスをレベルごとに分類
  const largeProcesses = processes.filter((p) => p.level === 'large');
  const mediumProcesses = processes.filter((p) => p.level === 'medium');
  const smallProcesses = processes.filter((p) => p.level === 'small');
  const detailProcesses = processes.filter((p) => p.level === 'detail');

  // 日付フォーマット
  const formatDate = (date?: Date | string): string => {
    if (!date) return '';
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).replace(/\//g, '-');
  };

  // 親工程名を取得
  const getParentName = (parentId?: string): string => {
    if (!parentId) return '';
    const parent = processes.find((p) => p.id === parentId);
    return parent ? parent.name : '';
  };

  // レベル名を取得
  const getLevelLabel = (level: ProcessLevel): string => {
    const labels: Record<ProcessLevel, string> = {
      large: '大工程',
      medium: '中工程',
      small: '小工程',
      detail: '詳細工程',
    };
    return labels[level];
  };

  // シートにスタイルを適用する関数
  const applySheetStyle = (ws: any, hasIdColumn = false) => {
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    
    // 行の高さ設定
    ws['!rows'] = [{ hpt: 25 }]; // ヘッダー行

    // ヘッダー行のスタイル
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
      if (!ws[cellAddress]) continue;
      
      ws[cellAddress].s = {
        fill: {
          patternType: 'solid',
          fgColor: { rgb: '2E75B5' },
          bgColor: { rgb: '2E75B5' }
        },
        font: {
          bold: true,
          color: { rgb: 'FFFFFF' },
          sz: 11,
          name: 'メイリオ'
        },
        alignment: {
          horizontal: 'center',
          vertical: 'center',
          wrapText: true
        },
        border: {
          top: { style: 'medium', color: { rgb: '000000' } },
          bottom: { style: 'medium', color: { rgb: '000000' } },
          left: { style: 'thin', color: { rgb: '000000' } },
          right: { style: 'thin', color: { rgb: '000000' } }
        }
      };
    }

    // データ行のスタイル
    for (let row = range.s.r + 1; row <= range.e.r; row++) {
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
        if (!ws[cellAddress]) {
          ws[cellAddress] = { t: 's', v: '' };
        }

        // 行ごとに背景色を交互に設定（ストライプ）
        const isEvenRow = row % 2 === 0;
        const bgColor = isEvenRow ? 'F2F8FC' : 'FFFFFF';

        // レベル列（全工程シートの場合は4列目、それ以外はなし）
        const isLevelColumn = hasIdColumn && col === 3;
        const levelValue = isLevelColumn ? ws[cellAddress].v : '';

        // レベルに応じた背景色
        let cellBgColor = bgColor;
        if (isLevelColumn && levelValue) {
          switch (levelValue) {
            case '大工程':
              cellBgColor = 'D6E9F8';
              break;
            case '中工程':
              cellBgColor = 'E2F0D9';
              break;
            case '小工程':
              cellBgColor = 'FFF2CC';
              break;
            case '詳細工程':
              cellBgColor = 'F4E7F7';
              break;
          }
        }

        ws[cellAddress].s = {
          fill: {
            patternType: 'solid',
            fgColor: { rgb: cellBgColor },
            bgColor: { rgb: cellBgColor }
          },
          font: {
            sz: 10,
            name: 'メイリオ',
            bold: isLevelColumn && levelValue ? true : false
          },
          alignment: {
            horizontal: col === 2 || col > 10 ? 'left' : 'center', // 工程名と説明は左揃え
            vertical: 'center',
            wrapText: col > 10 // 説明列以降は折り返し
          },
          border: {
            top: { style: 'thin', color: { rgb: 'E0E0E0' } },
            bottom: { style: 'thin', color: { rgb: 'E0E0E0' } },
            left: { style: 'thin', color: { rgb: 'E0E0E0' } },
            right: { style: 'thin', color: { rgb: 'E0E0E0' } }
          }
        };

        // 順序列は数値書式
        if (col === 0 && ws[cellAddress].v) {
          ws[cellAddress].t = 'n';
          ws[cellAddress].z = '0';
        }

        // 日付列は日付書式
        const dateColumns = hasIdColumn ? [8, 9, 12, 13] : [6, 7];
        if (dateColumns.includes(col) && ws[cellAddress].v) {
          ws[cellAddress].z = 'yyyy-mm-dd';
        }
      }
    }
  };

  // 全工程シート
  const allProcessData = [
    [
      '順序',
      '工程ID',
      '工程名',
      'レベル',
      '親工程',
      '部署名',
      '担当者',
      '帳票種類',
      '開始日',
      '終了日',
      'ステータス',
      '説明',
      '作成日',
      '更新日',
    ],
    ...processes
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map((p) => [
        p.displayOrder,
        p.id,
        p.name,
        getLevelLabel(p.level),
        getParentName(p.parentId),
        p.department || '',
        p.assignee || '',
        p.documentType || '',
        formatDate(p.startDate),
        formatDate(p.endDate),
        p.status || '',
        p.description || '',
        formatDate(p.createdAt),
        formatDate(p.updatedAt),
      ]),
  ];

  const allWs = XLSX.utils.aoa_to_sheet(allProcessData);
  allWs['!cols'] = [
    { wch: 8 },  // 順序
    { wch: 20 }, // 工程ID
    { wch: 30 }, // 工程名
    { wch: 12 }, // レベル
    { wch: 25 }, // 親工程
    { wch: 20 }, // 部署名
    { wch: 20 }, // 担当者
    { wch: 20 }, // 帳票種類
    { wch: 12 }, // 開始日
    { wch: 12 }, // 終了日
    { wch: 12 }, // ステータス
    { wch: 40 }, // 説明
    { wch: 12 }, // 作成日
    { wch: 12 }, // 更新日
  ];

  // スタイルを適用
  applySheetStyle(allWs, true);

  XLSX.utils.book_append_sheet(wb, allWs, '全工程');

  // レベル別シート作成関数
  const createLevelSheet = (levelProcesses: Process[], sheetName: string) => {
    if (levelProcesses.length === 0) return;

    const data = [
      [
        '順序',
        '工程名',
        '親工程',
        '部署名',
        '担当者',
        '帳票種類',
        '開始日',
        '終了日',
        'ステータス',
        '説明',
      ],
      ...levelProcesses
        .sort((a, b) => a.displayOrder - b.displayOrder)
        .map((p) => [
          p.displayOrder,
          p.name,
          getParentName(p.parentId),
          p.department || '',
          p.assignee || '',
          p.documentType || '',
          formatDate(p.startDate),
          formatDate(p.endDate),
          p.status || '',
          p.description || '',
        ]),
    ];

    const ws = XLSX.utils.aoa_to_sheet(data);
    ws['!cols'] = [
      { wch: 8 },  // 順序
      { wch: 30 }, // 工程名
      { wch: 25 }, // 親工程
      { wch: 20 }, // 部署名
      { wch: 20 }, // 担当者
      { wch: 20 }, // 帳票種類
      { wch: 12 }, // 開始日
      { wch: 12 }, // 終了日
      { wch: 12 }, // ステータス
      { wch: 40 }, // 説明
    ];

    // スタイルを適用
    applySheetStyle(ws, false);

    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  };

  // レベル別シートを作成
  createLevelSheet(largeProcesses, '大工程');
  createLevelSheet(mediumProcesses, '中工程');
  createLevelSheet(smallProcesses, '小工程');
  createLevelSheet(detailProcesses, '詳細工程');

  // サマリーシート
  const summaryData = [
    [projectName ? `プロジェクト: ${projectName}` : '工程表サマリー'],
    [''],
    ['統計情報'],
    ['全工程数', processes.length],
    ['大工程', largeProcesses.length],
    ['中工程', mediumProcesses.length],
    ['小工程', smallProcesses.length],
    ['詳細工程', detailProcesses.length],
    [''],
    ['ステータス別'],
    ['完了', processes.filter((p) => p.status === 'completed').length],
    ['進行中', processes.filter((p) => p.status === 'in-progress').length],
    ['未着手', processes.filter((p) => p.status === 'not-started').length],
    ['保留', processes.filter((p) => p.status === 'on-hold').length],
    [''],
    ['エクスポート日時', new Date().toLocaleString('ja-JP')],
  ];

  const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
  summaryWs['!cols'] = [{ wch: 25 }, { wch: 15 }];
  
  // サマリーシートのスタイリング
  const summaryRange = XLSX.utils.decode_range(summaryWs['!ref'] || 'A1');
  
  // タイトル行
  if (summaryWs['A1']) {
    summaryWs['A1'].s = {
      font: { bold: true, sz: 16, color: { rgb: '1F4E78' }, name: 'メイリオ' },
      alignment: { horizontal: 'left', vertical: 'center' }
    };
  }

  // セクションヘッダー（統計情報、ステータス別）
  ['A3', 'A10'].forEach(cell => {
    if (summaryWs[cell]) {
      summaryWs[cell].s = {
        font: { bold: true, sz: 12, color: { rgb: '2E75B5' }, name: 'メイリオ' },
        alignment: { horizontal: 'left', vertical: 'center' }
      };
    }
  });

  // データ行
  for (let row = 3; row <= summaryRange.e.r; row++) {
    if (row === 2 || row === 8 || row === 9 || row === 15) continue; // ヘッダー行をスキップ
    
    for (let col = 0; col < 2; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
      if (summaryWs[cellAddress]) {
        summaryWs[cellAddress].s = {
          font: { sz: 10, name: 'メイリオ', bold: col === 0 },
          alignment: { horizontal: col === 0 ? 'left' : 'right', vertical: 'center' },
          fill: row === summaryRange.e.r ? {
            patternType: 'solid',
            fgColor: { rgb: 'F2F2F2' },
            bgColor: { rgb: 'F2F2F2' }
          } : undefined
        };
      }
    }
  }

  XLSX.utils.book_append_sheet(wb, summaryWs, 'サマリー');

  // BLOBに変換
  const wbout = XLSX.write(wb, { 
    bookType: 'xlsx', 
    type: 'array',
    cellStyles: true,
    bookSST: false
  });
  return new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

/**
 * XLSXファイルをダウンロード
 */
export function downloadXLSX(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * テンプレートをダウンロード
 */
export function downloadProcessTemplate() {
  const blob = generateProcessTemplateXLSX();
  const filename = `工程表テンプレート_${new Date().toISOString().split('T')[0]}.xlsx`;
  downloadXLSX(blob, filename);
}

/**
 * 工程データをダウンロード
 */
export function downloadProcessData(processes: Process[], projectName?: string) {
  const blob = generateProcessDataXLSX(processes, projectName);
  const filename = projectName
    ? `${projectName}_工程表_${new Date().toISOString().split('T')[0]}.xlsx`
    : `工程表_${new Date().toISOString().split('T')[0]}.xlsx`;
  downloadXLSX(blob, filename);
}

/**
 * XLSXファイルから工程データをインポート
 */
export function importProcessesFromXLSX(file: File): Promise<Partial<Process>[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        // 最初のシートを読み込む
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // JSONに変換
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

        // ヘッダー行をスキップ
        const processes: Partial<Process>[] = [];
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (!row || row.length === 0) continue;

          // レベルの変換
          const levelMap: Record<string, ProcessLevel> = {
            '大工程': 'large',
            '中工程': 'medium',
            '小工程': 'small',
            '詳細工程': 'detail',
          };

          const level = levelMap[row[2]] || 'large';

          // 日付のパース
          const parseDate = (dateStr: string): Date | undefined => {
            if (!dateStr) return undefined;
            const date = new Date(dateStr);
            return isNaN(date.getTime()) ? undefined : date;
          };

          processes.push({
            name: row[1] || '',
            level,
            department: row[4] || undefined,
            assignee: row[5] || undefined,
            documentType: row[6] || undefined,
            startDate: parseDate(row[7]),
            endDate: parseDate(row[8]),
            status: row[9] || undefined,
            description: row[10] || undefined,
            displayOrder: parseInt(row[0]) || processes.length + 1,
          });
        }

        resolve(processes);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error('ファイルの読み込みに失敗しました'));
    };

    reader.readAsArrayBuffer(file);
  });
}
