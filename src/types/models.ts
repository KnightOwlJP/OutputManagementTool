/**
 * Phase 9: フラット構造への大規模リアーキテクト
 * 新しい型定義
 * 
 * @created 2025-10-21
 * @version 9.0.0
 */

// ==========================================
// 基本型
// ==========================================

export type ProcessLevel = 'large' | 'medium' | 'small' | 'detail';

export type CustomColumnType = 'TEXT' | 'NUMBER' | 'DATE' | 'SELECT' | 'CHECKBOX';

// ==========================================
// BPMN 2.0 型定義（拡張）
// ==========================================

export type BpmnElementType = 
  | 'task'            // タスク（デフォルト）
  | 'event'           // イベント
  | 'gateway';        // ゲートウェイ

export type BpmnTaskType = 
  | 'userTask'        // ユーザータスク（デフォルト）
  | 'serviceTask'     // サービスタスク
  | 'manualTask'      // 手動タスク
  | 'scriptTask'      // スクリプトタスク
  | 'businessRuleTask'// ビジネスルールタスク
  | 'sendTask'        // 送信タスク
  | 'receiveTask';    // 受信タスク

export type GatewayType = 
  | 'exclusive'       // 排他ゲートウェイ（デフォルト）
  | 'parallel'        // 並列ゲートウェイ
  | 'inclusive';      // 包含ゲートウェイ

export type EventType = 
  | 'start'           // 開始イベント（デフォルト）
  | 'end'             // 終了イベント
  | 'intermediate';   // 中間イベント

export type IntermediateEventType =
  | 'timer'           // タイマーイベント
  | 'message'         // メッセージイベント
  | 'error'           // エラーイベント
  | 'signal'          // シグナルイベント
  | 'conditional';    // 条件イベント

export interface ConditionalFlow {
  targetProcessId: string;
  condition: string;
  description?: string;
}

export interface MessageFlow {
  targetProcessId: string;
  messageContent: string;
  description?: string;
}

export interface Artifact {
  type: 'annotation' | 'group';
  content: string;
}

// ==========================================
// Phase 9: 工程表（ProcessTable）
// ==========================================

export interface ProcessTable {
  id: string;
  projectId: string;
  name: string;
  level: ProcessLevel;
  description?: string;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

// ==========================================
// Phase 9: スイムレーン（BPMN Lane）
// ==========================================

export interface Swimlane {
  id: string;
  processTableId: string;
  name: string;
  color: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

// ==========================================
// Phase 9: ステップ（工程表のステップ定義）
// ==========================================

export interface Step {
  id: string;
  processTableId: string;
  name: string;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

// ==========================================
// Phase 9: カスタム列定義
// ==========================================

export interface CustomColumn {
  id: string;
  processTableId: string;
  name: string;
  type: CustomColumnType;
  options?: string[];  // SELECT型の選択肢（JSON配列をパース）
  required: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

// ==========================================
// Phase 9: 工程（Process）
// ==========================================

export interface Process {
  id: string;
  processTableId: string;
  
  // 基本情報（必須）
  name: string;
  laneId: string;  // SwimlaneのID（BPMN Laneに対応）
  
  // BPMN要素タイプ
  bpmnElement: BpmnElementType;  // task, event, gateway
  taskType?: BpmnTaskType;       // taskの場合のサブタイプ
  
  // フロー制御
  beforeProcessIds?: string[];  // 前工程（ユーザー入力）
  nextProcessIds?: string[];    // 次工程（自動計算）
  
  // BPMN詳細情報（任意）
  documentation?: string;
  gatewayType?: GatewayType;
  conditionalFlows?: ConditionalFlow[];
  
  // イベント情報（任意）
  eventType?: EventType;
  intermediateEventType?: IntermediateEventType;
  eventDetails?: string;
  
  // データ連携（任意）
  inputDataObjects?: string[];   // DataObject IDの配列
  outputDataObjects?: string[];  // DataObject IDの配列
  
  // メッセージ・アーティファクト（任意）
  messageFlows?: MessageFlow[];
  artifacts?: Artifact[];
  
  // カスタム列の値（JSON）
  customColumns?: Record<string, any>;
  
  // メタデータ
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

// ==========================================
// Phase 9: BPMNダイアグラム
// ==========================================

export interface BpmnDiagram {
  id: string;
  projectId: string;
  processTableId: string;  // UNIQUE制約（1対1）
  name: string;
  level: ProcessLevel;
  xmlContent: string;
  version: number;
  layoutAlgorithm?: 'auto' | 'manual';
  layoutMetadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// ==========================================
// Phase 9: マニュアル
// ==========================================

export interface Manual {
  id: string;
  projectId: string;
  processTableId: string;  // UNIQUE制約（1対1）
  name: string;
  level: ProcessLevel;
  content: string;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

// ==========================================
// Phase 9: マニュアルセクション
// ==========================================

export interface ManualSection {
  id: string;
  manualId: string;
  processId: string;
  title: string;           // 工程名から自動生成
  content?: string;        // 詳細手順（手動入力）
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

// ==========================================
// Phase 9: マニュアル詳細ステップ
// ==========================================

export interface ManualDetailStep {
  id: string;
  sectionId: string;
  title: string;
  content?: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

// ==========================================
// Phase 9: マニュアル画像スロット
// ==========================================

export interface ManualImageSlot {
  id: string;
  sectionId: string;
  caption: string;
  imagePath?: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

// ==========================================
// Phase 9: データオブジェクト
// ==========================================
// Phase 9: データオブジェクト（BPMN 2.0）
// ==========================================

export interface DataObject {
  id: string;
  processTableId: string;
  name: string;
  type: 'input' | 'output' | 'both';
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ==========================================
// プロジェクト（既存を継承）
// ==========================================

export interface Project {
  id: string;
  name: string;
  description?: string;
  storagePath: string;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}

// ==========================================
// バージョン管理（既存を継承）
// ==========================================

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
  processTables: ProcessTable[];
  processes: Process[];
  bpmnDiagrams: BpmnDiagram[];
  manuals: Manual[];
  dataObjects: DataObject[];
}

// ==========================================
// DTO（Data Transfer Object）
// ==========================================

export interface CreateProcessTableDto {
  projectId: string;
  name: string;
  level: ProcessLevel;
  description?: string;
  swimlanes?: Array<{ name: string; color?: string }>;
}

export interface UpdateProcessTableDto {
  name?: string;
  level?: ProcessLevel;
  description?: string;
}

export interface CreateProcessDto {
  processTableId: string;
  name: string;
  swimlane: string;
  stepOrder: number;
  taskType?: BpmnTaskType;
  documentation?: string;
  beforeProcessIds?: string[];
  gatewayType?: GatewayType;
  conditionalFlows?: ConditionalFlow[];
  eventType?: EventType;
  intermediateEventType?: IntermediateEventType;
  eventDetails?: string;
  inputDataObjects?: string[];
  outputDataObjects?: string[];
  messageFlows?: MessageFlow[];
  artifacts?: Artifact[];
  customColumns?: Record<string, any>;
}

export interface UpdateProcessDto {
  name?: string;
  swimlane?: string;
  stepOrder?: number;
  taskType?: BpmnTaskType;
  documentation?: string;
  beforeProcessIds?: string[];
  gatewayType?: GatewayType;
  conditionalFlows?: ConditionalFlow[];
  eventType?: EventType;
  intermediateEventType?: IntermediateEventType;
  eventDetails?: string;
  inputDataObjects?: string[];
  outputDataObjects?: string[];
  messageFlows?: MessageFlow[];
  artifacts?: Artifact[];
  customColumns?: Record<string, any>;
}

export interface CreateSwimlaneDto {
  processTableId: string;
  name: string;
  color?: string;
}

export interface UpdateSwimlaneDto {
  name?: string;
  color?: string;
  order?: number;
}

export interface CreateCustomColumnDto {
  processTableId: string;
  name: string;
  type: CustomColumnType;
  options?: string[];
  required?: boolean;
}

export interface UpdateCustomColumnDto {
  name?: string;
  type?: CustomColumnType;
  options?: string[];
  required?: boolean;
  order?: number;
}

export interface CreateDataObjectDto {
  projectId: string;
  name: string;
  type: string;
  description?: string;
}

export interface UpdateDataObjectDto {
  name?: string;
  type?: string;
  description?: string;
}

// ==========================================
// API レスポンス型
// ==========================================

export interface CreateProcessTableResult {
  processTable: ProcessTable;
  bpmnDiagram: BpmnDiagram;
  manual: Manual;
}

export interface CreateProcessResult {
  process: Process;
  bpmnUpdated: boolean;
  manualUpdated: boolean;
}

export interface UpdateProcessResult {
  process: Process;
  nextProcessIds: string[];  // 自動計算された結果
  bpmnUpdated: boolean;
  manualUpdated: boolean;
}

export interface DeleteProcessResult {
  success: boolean;
  affectedProcessIds: string[];  // beforeProcessIds/nextProcessIdsから削除された工程ID
  bpmnUpdated: boolean;
  manualUpdated: boolean;
}

export interface SyncResult {
  success: boolean;
  updatedCount: number;
  errors?: string[];
}

// ==========================================
// UI用の拡張型
// ==========================================

export interface ProcessWithDetails extends Process {
  swimlaneInfo?: Swimlane;
  beforeProcesses?: Process[];
  nextProcesses?: Process[];
  dataObjectsIn?: DataObject[];
  dataObjectsOut?: DataObject[];
}

export interface ProcessTableWithDetails extends ProcessTable {
  swimlanes: Swimlane[];
  customColumns: CustomColumn[];
  processCount: number;
  bpmnDiagram?: BpmnDiagram;
  manual?: Manual;
}
