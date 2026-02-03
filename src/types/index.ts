/**
 * 型定義のエクスポート
 * Phase 9: 統合された型定義
 */

// メインモデル型（Phase 9 フラット構造）
export type {
  // 基本型
  ProcessLevel,
  CustomColumnType,
  
  // BPMN 2.0 型
  BpmnElementType,
  BpmnTaskType,
  GatewayType,
  EventType,
  IntermediateEventType,
  ConditionalFlow,
  MessageFlow,
  Artifact,
  
  // エンティティ
  ProcessTable,
  Swimlane,
  Step,
  CustomColumn,
  Process,
  BpmnDiagram,
  Manual,
  ManualSection,
  ManualDetailStep,
  ManualImageSlot,
  DataObject,
  Project,
  Version,
  VersionSnapshot,
  
  // DTO
  CreateProcessTableDto,
  UpdateProcessTableDto,
  CreateProcessDto,
  UpdateProcessDto,
  CreateSwimlaneDto,
  UpdateSwimlaneDto,
  CreateCustomColumnDto,
  UpdateCustomColumnDto,
  CreateDataObjectDto,
  UpdateDataObjectDto,
  
  // API レスポンス
  CreateProcessTableResult,
  CreateProcessResult,
  UpdateProcessResult,
  DeleteProcessResult,
  SyncResult,
  
  // UI用拡張型
  ProcessWithDetails,
  ProcessTableWithDetails,
} from './models';

// 後方互換性のための再エクスポート
// project.types.ts の型で models.ts に存在しないもの
export type {
  // 階層構造関連（レガシー）
  HierarchicalEntity,
  ProcessTree,
  
  // カスタム列値
  ProcessCustomValue,
  
  // BPMN要素（拡張）
  BpmnElement,
  BpmnSyncStatus,
  ProcessWithSync,
  
  // マニュアルセクション（レガシー）
  ManualSection as LegacyManualSection,
} from './project.types';
