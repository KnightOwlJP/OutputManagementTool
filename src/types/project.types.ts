// プロジェクト関連の型定義

export interface Project {
  id: string;
  name: string;
  description?: string;
  storagePath: string;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}

export type ProcessLevel = 'large' | 'medium' | 'small' | 'detail';

// ============================================
// 階層構造を持つエンティティの基底インターフェース
// ============================================

/**
 * 階層構造を持つエンティティの基底インターフェース
 * Process, BpmnDiagram, Manual が継承します
 * Phase 9: detailTableId, parentEntityId, parentId は削除されました
 */
export interface HierarchicalEntity {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  level: ProcessLevel;
  
  // メタデータ
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}

// ============================================
// 工程 (Process)
// ============================================

export interface Process extends HierarchicalEntity {
  // 三位一体の連携
  bpmnDiagramId?: string;
  manualId?: string;
  
  // 工程固有のフィールド
  department?: string;      // 大工程: 部署名
  assignee?: string;        // 中工程: 作業実行者
  documentType?: string;    // 小工程: 帳票種類
  startDate?: Date;
  endDate?: Date;
  duration?: number;
  status: 'not-started' | 'in-progress' | 'completed' | 'on-hold';
  
  // BPMN同期関連
  bpmnElementId?: string;
  hasManual?: boolean;
}

// ============================================
// BPMNダイアグラム
// ============================================

export interface BpmnDiagram extends HierarchicalEntity {
  // 三位一体の連携
  processId?: string;        // 対応する工程（オプショナル）
  manualId?: string;
  
  // BPMN固有のフィールド
  xmlContent?: string;
  version?: number;
}

// ============================================
// マニュアル
// ============================================

export interface Manual extends HierarchicalEntity {
  // 三位一体の連携
  processId?: string;        // 対応する工程（オプショナル）
  bpmnDiagramId?: string;
  
  // マニュアル固有のフィールド
  title?: string;            // タイトル（nameと別に持つ場合）
  content?: string;
  filePath?: string;
  targetProcessLevel?: 'detail';
  processIds?: string[];
  bpmnElementIds?: string[];
  version?: string;
  linkedFlowVersion?: string;
  status?: 'draft' | 'review' | 'approved' | 'outdated';
  tags?: string[];
  author?: string;
  reviewers?: string[];
}

export interface Version {
  id: string;
  projectId: string;
  timestamp: Date;
  author: string;
  message: string;
  tag?: string;
  parentVersionId?: string;
  snapshotData: VersionSnapshot;
  createdAt: Date;
}

export interface VersionSnapshot {
  processes: Process[];
  bpmnDiagrams: BpmnDiagram[];
  manuals: Manual[];
}

export interface ManualSection {
  id: string;
  manualId: string;
  order: number;
  level: 'large' | 'medium' | 'small';
  heading: string;
  content: string;
  processId?: string;
  processLevel?: ProcessLevel;
  bpmnElementId?: string;
  parentSectionId?: string;
  images?: string[];
  createdAt: Date;
  updatedAt: Date;
}

// ツリー構造用
export interface ProcessTree {
  process: Process;
  children: ProcessTree[];
}

// ============================================
// カスタム列機能
// ============================================

export type CustomColumnType = 'text' | 'number' | 'date' | 'select' | 'checkbox' | 'textarea';

export interface CustomColumn {
  id: string;
  projectId: string;
  columnName: string;              // 列名（例: "承認者"、"予算"）
  columnType: CustomColumnType;    // データ型
  isRequired: boolean;             // 必須フィールドかどうか
  defaultValue?: string;           // デフォルト値
  selectOptions?: string[];        // select型の場合の選択肢（JSON配列）
  displayOrder: number;            // 表示順序
  isVisible: boolean;              // UI上での表示/非表示
  description?: string;            // 列の説明
  createdAt: Date;
  updatedAt: Date;
}

export interface ProcessCustomValue {
  id: string;
  processId: string;
  customColumnId: string;
  value: string;                   // すべてJSON文字列として保存
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// BPMN要素（プロセス以外の要素）
// ============================================

export type BpmnElementType = 
  | 'dataObject'          // データオブジェクト（帳票など）
  | 'dataStore'           // データストア（DB、ファイルシステムなど）
  | 'message'             // メッセージ
  | 'signal'              // シグナル
  | 'error'               // エラー
  | 'escalation'          // エスカレーション
  | 'timer'               // タイマー
  | 'conditional'         // 条件
  | 'link'                // リンク
  | 'textAnnotation'      // テキスト注釈
  | 'group';              // グループ

export type BpmnSyncStatus = 'synced' | 'outdated' | 'conflict' | 'manual';

export interface BpmnElement {
  id: string;
  projectId: string;
  processTableId?: string;         // 関連する工程表
  bpmnDiagramId?: string;          // 関連するBPMN図
  elementType: BpmnElementType;    // 要素タイプ
  name: string;                    // 要素名
  bpmnElementId: string;           // BPMN XML内でのID
  properties?: Record<string, any>; // 要素固有のプロパティ（JSON）
  linkedProcessIds?: string[];     // 関連する工程のID（複数可）
  displayOrder: number;
  syncStatus: BpmnSyncStatus;      // 同期ステータス
  lastSyncAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}

// Processインターフェースの拡張（BPMN同期用）
export interface ProcessWithSync extends Process {
  bpmnElementType?: BpmnElementType;  // このプロセスに対応するBPMN要素タイプ
  syncStatus?: BpmnSyncStatus;        // 同期ステータス
  lastSyncAt?: Date;                  // 最終同期日時
  customValues?: ProcessCustomValue[]; // カスタム列の値
}

// ============================================
// ユーティリティ関数
// ============================================
// Phase 9: 階層構造関連のユーティリティ関数は削除されました
