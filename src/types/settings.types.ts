/**
 * アプリケーション設定の型定義
 */

export interface AppSettings {
  // 同期設定
  sync: SyncSettings;
  
  // BPMN設定
  bpmn: BpmnSettings;
  
  // UI設定
  ui: UISettings;
  
  // エクスポート設定
  export: ExportSettings;
  
  // バックアップ設定
  backup: BackupSettings;
}

export interface SyncSettings {
  // 自動同期の有効化
  autoSyncEnabled: boolean;
  
  // 同期間隔（分）
  syncInterval: number;
  
  // BPMN→工程表同期
  bpmnToProcessEnabled: boolean;
  
  // 工程表→BPMN同期
  processToBpmnEnabled: boolean;
  
  // 工程表→マニュアル同期
  processToManualEnabled: boolean;
  
  // 競合時の動作
  conflictResolution: 'manual' | 'bpmn-priority' | 'process-priority';
}

export interface BpmnSettings {
  // デフォルトタスクタイプ
  defaultTaskType: 'userTask' | 'serviceTask' | 'manualTask' | 'scriptTask' | 'businessRuleTask' | 'sendTask' | 'receiveTask';
  
  // デフォルトゲートウェイタイプ
  defaultGatewayType: 'exclusive' | 'parallel' | 'inclusive';
  
  // グリッドスナップ
  gridSnap: boolean;
  
  // 自動レイアウト
  autoLayout: boolean;
  
  // グリッドサイズ（px）
  gridSize: number;
  
  // BPMN 2.0準拠エクスポート
  exportBpmn20Compliant: boolean;
  
  // ダイアグラム情報を含める
  includeDiagramInfo: boolean;
  
  // ELK自動レイアウト設定
  elkLayoutAlgorithm: 'layered' | 'stress' | 'mrtree' | 'force';
  
  // ELK: ノード間のスペース
  elkNodeSpacing: number;
  
  // ELK: レイヤー間のスペース
  elkLayerSpacing: number;
  
  // ELK: エッジルーティング
  elkEdgeRouting: 'orthogonal' | 'polyline' | 'splines';
}

export interface UISettings {
  // テーマ
  theme: 'light' | 'dark' | 'system';
  
  // 言語
  language: 'ja' | 'en';
  
  // デフォルトビュー
  defaultView: 'tree' | 'table';
  
  // ページあたりの表示数
  itemsPerPage: number;
  
  // アニメーション有効化
  animationsEnabled: boolean;
  
  // コンパクトモード
  compactMode: boolean;
}

export interface ExportSettings {
  // デフォルトフォーマット
  defaultFormat: 'xlsx' | 'csv' | 'json' | 'pdf';
  
  // ファイル名テンプレート
  filenameTemplate: string;
  
  // エクスポート時にメタデータを含める
  includeMetadata: boolean;
  
  // 日付フォーマット
  dateFormat: string;
}

export interface BackupSettings {
  // 自動バックアップ有効化
  autoBackupEnabled: boolean;
  
  // バックアップ間隔（時間）
  backupInterval: number;
  
  // 保持するバックアップ数
  maxBackups: number;
  
  // バックアップ先パス
  backupPath: string;
}

/**
 * デフォルト設定
 */
export const DEFAULT_SETTINGS: AppSettings = {
  sync: {
    autoSyncEnabled: false,
    syncInterval: 5,
    bpmnToProcessEnabled: true,
    processToBpmnEnabled: true,
    processToManualEnabled: true,
    conflictResolution: 'manual',
  },
  bpmn: {
    defaultTaskType: 'userTask',
    defaultGatewayType: 'exclusive',
    gridSnap: true,
    autoLayout: false,
    gridSize: 10,
    exportBpmn20Compliant: true,
    includeDiagramInfo: true,
    elkLayoutAlgorithm: 'layered',
    elkNodeSpacing: 50,
    elkLayerSpacing: 100,
    elkEdgeRouting: 'orthogonal',
  },
  ui: {
    theme: 'system',
    language: 'ja',
    defaultView: 'table',
    itemsPerPage: 20,
    animationsEnabled: true,
    compactMode: false,
  },
  export: {
    defaultFormat: 'xlsx',
    filenameTemplate: '{projectName}_{date}',
    includeMetadata: true,
    dateFormat: 'YYYY-MM-DD',
  },
  backup: {
    autoBackupEnabled: true,
    backupInterval: 24,
    maxBackups: 10,
    backupPath: '',
  },
};
