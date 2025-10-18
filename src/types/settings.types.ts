/**
 * アプリケーション設定の型定義
 */

export interface AppSettings {
  // 同期設定
  sync: SyncSettings;
  
  // 工程レベル定義
  processLevels: ProcessLevelDefinitions;
  
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

export interface ProcessLevelDefinition {
  // レベルキー
  key: 'large' | 'medium' | 'small' | 'detail';
  
  // 表示名
  name: string;
  
  // 説明
  description: string;
  
  // カラーコード
  color: string;
  
  // アイコン（HeroIconsのアイコン名）
  icon: string;
  
  // 有効/無効
  enabled: boolean;
}

export interface ProcessLevelDefinitions {
  large: ProcessLevelDefinition;
  medium: ProcessLevelDefinition;
  small: ProcessLevelDefinition;
  detail: ProcessLevelDefinition;
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
  processLevels: {
    large: {
      key: 'large',
      name: '大工程',
      description: 'プロジェクト全体を大きく区切る工程',
      color: '#3B82F6',
      icon: 'ChartBarIcon',
      enabled: true,
    },
    medium: {
      key: 'medium',
      name: '中工程',
      description: '大工程を具体的な作業単位に分割',
      color: '#10B981',
      icon: 'ChartBarIcon',
      enabled: true,
    },
    small: {
      key: 'small',
      name: '小工程',
      description: '中工程をさらに細分化した工程',
      color: '#F59E0B',
      icon: 'ChartBarIcon',
      enabled: true,
    },
    detail: {
      key: 'detail',
      name: '詳細工程',
      description: '最も詳細な作業レベルの工程',
      color: '#8B5CF6',
      icon: 'ChartBarIcon',
      enabled: true,
    },
  },
  ui: {
    theme: 'system',
    language: 'ja',
    defaultView: 'tree',
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
    autoBackupEnabled: false,
    backupInterval: 24,
    maxBackups: 5,
    backupPath: '',
  },
};
