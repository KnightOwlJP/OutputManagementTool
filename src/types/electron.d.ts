// Electron API型定義
import type { 
  ProcessTable, 
  Swimlane, 
  CustomColumn, 
  Process, 
  Step, 
  DataObject,
  Manual,
  BpmnDiagram,
  ProcessLevel 
} from './models';

export interface ElectronAPI {
  project: {
    create: (data: CreateProjectDto) => Promise<Project>;
    getAll: () => Promise<Project[]>;
    getById: (projectId: string) => Promise<Project>;
    update: (projectId: string, data: UpdateProjectDto) => Promise<Project>;
    delete: (projectId: string) => Promise<boolean>;
  };
  file: {
    openFileDialog: (options?: any) => Promise<string | null>;
    saveFileDialog: (options?: any) => Promise<string | null>;
    selectDirectory: () => Promise<string | null>;
    importExcel: (projectId: string, filePath: string) => Promise<any>;
    exportExcel: (projectId: string, fileName: string) => Promise<string>;
  };
  // V2: ProcessTable API
  processTable: {
    create: (data: any) => Promise<ProcessTable>;
    getByProject: (projectId: string) => Promise<ProcessTable[]>;
    getById: (processTableId: string) => Promise<ProcessTable | null>;
    update: (processTableId: string, data: any) => Promise<ProcessTable>;
    delete: (processTableId: string) => Promise<any>;
    
    // スイムレーン管理
    createSwimlane: (processTableId: string, data: any) => Promise<Swimlane>;
    getSwimlanes: (processTableId: string) => Promise<Swimlane[]>;
    updateSwimlane: (swimlaneId: string, data: any) => Promise<Swimlane>;
    deleteSwimlane: (swimlaneId: string) => Promise<void>;
    reorderSwimlanes: (processTableId: string, swimlaneIds: string[]) => Promise<void>;
    
    // カスタム列管理
    createCustomColumn: (processTableId: string, data: any) => Promise<CustomColumn>;
    getCustomColumns: (processTableId: string) => Promise<CustomColumn[]>;
    updateCustomColumn: (columnId: string, data: any) => Promise<CustomColumn>;
    deleteCustomColumn: (columnId: string) => Promise<void>;
    reorderCustomColumns: (processTableId: string, columnIds: string[]) => Promise<void>;
    // Step management
    createStep: (processTableId: string, data: { name: string; displayOrder: number }) => Promise<Step>;
    updateStep: (stepId: string, data: { name?: string; displayOrder?: number }) => Promise<Step>;
    deleteStep: (stepId: string) => Promise<void>;
    reorderSteps: (processTableId: string, stepIds: string[]) => Promise<void>;
  };
  // Phase 9: データオブジェクト管理（BPMN要素としての入出力データ）
  dataObject: {
    create: (processTableId: string, data: CreateDataObjectDto) => Promise<DataObject>;
    getByProcessTable: (processTableId: string) => Promise<DataObject[]>;
    getById: (dataObjectId: string) => Promise<DataObject | null>;
    update: (dataObjectId: string, data: UpdateDataObjectDto) => Promise<DataObject>;
    delete: (dataObjectId: string) => Promise<void>;
    linkToProcess: (dataObjectId: string, processId: string, direction: 'input' | 'output') => Promise<void>;
    unlinkFromProcess: (dataObjectId: string, processId: string, direction: 'input' | 'output') => Promise<void>;
  };
  process: {
    create: (data: CreateProcessDto) => Promise<Process>;
    getById: (processId: string) => Promise<Process>;
    getByProcessTable: (processTableId: string) => Promise<Process[]>;
    update: (processId: string, data: UpdateProcessDto) => Promise<Process>;
    delete: (processId: string) => Promise<boolean>;
    reorder: (processId: string, newDisplayOrder: number) => Promise<void>;
  };
  version: {
    create: (data: CreateVersionDto) => Promise<Version>;
    getByProject: (projectId: string) => Promise<Version[]>;
    getById: (versionId: string) => Promise<Version>;
    restore: (versionId: string) => Promise<boolean>;
    delete: (versionId: string) => Promise<boolean>;
  };
  backup: {
    create: (customPath?: string, isAutomatic?: boolean) => Promise<{
      success: boolean;
      backupPath?: string;
      error?: string;
    }>;
    list: (customPath?: string) => Promise<{
      success: boolean;
      backups?: Array<{
        id: string;
        filename: string;
        filePath: string;
        size: number;
        createdAt: Date;
        isAutomatic: boolean;
      }>;
      error?: string;
    }>;
    restore: (backupPath: string) => Promise<{
      success: boolean;
      backupPath?: string;
      error?: string;
    }>;
    delete: (backupPath: string) => Promise<{
      success: boolean;
      error?: string;
    }>;
    cleanup: (maxBackups: number, customPath?: string) => Promise<{
      success: boolean;
      error?: string;
    }>;
    selectDirectory: () => Promise<string | null>;
    // スケジューラー
    startScheduler: (intervalHours: number, maxBackups: number, customPath?: string) => Promise<{
      success: boolean;
      error?: string;
    }>;
    stopScheduler: () => Promise<{
      success: boolean;
      error?: string;
    }>;
    getSchedulerStatus: () => Promise<{
      success: boolean;
      status?: {
        enabled: boolean;
        intervalHours: number;
        maxBackups: number;
        customPath: string;
      };
      error?: string;
    }>;
  };
  // カスタム列管理
  customColumn: {
    create: (data: any) => Promise<CustomColumn>;
    getByProject: (projectId: string) => Promise<CustomColumn[]>;
    update: (columnId: string, data: any) => Promise<CustomColumn>;
    delete: (columnId: string) => Promise<void>;
    reorder: (updates: Array<{ id: string; displayOrder: number }>) => Promise<void>;
  };
  // Phase 9: BPMNフロー図管理（工程表から自動生成、読み取り専用）
  bpmnDiagramTable: {
    getByProject: (projectId: string) => Promise<BpmnDiagram[]>;
    getById: (bpmnId: string) => Promise<BpmnDiagram>;
    getByProcessTable: (processTableId: string) => Promise<BpmnDiagram | null>;
    update: (bpmnId: string, data: { name?: string; xmlContent?: string }) => Promise<BpmnDiagram>;
    delete: (bpmnId: string) => Promise<void>;
  };
  // Phase 9.1: BPMN双方向同期API
  bpmnSync: {
    getSyncState: (processTableId: string) => Promise<BpmnSyncState | null>;
    syncToProcessTable: (params: {
      processTableId: string;
      bpmnXml: string;
      version: number;
    }) => Promise<SyncResult>;
    syncToBpmn: (processTableId: string) => Promise<void>;
    clearSyncState: (processTableId?: string) => Promise<void>;
  };
  // Phase 9: マニュアル管理（工程表から自動生成、読み取り専用）
  manualTable: {
    getByProject: (projectId: string) => Promise<Manual[]>;
    getById: (manualId: string) => Promise<Manual>;
    getByProcessTable: (processTableId: string) => Promise<Manual | null>;
    update: (manualId: string, data: { name?: string; content?: string }) => Promise<Manual>;
    delete: (manualId: string) => Promise<void>;
  };
  system: {
    platform: string;
    version: string;
  };
  // デバッグ用API
  invoke: (channel: string, ...args: any[]) => Promise<any>;
}

// Window型拡張
declare global {
  interface Window {
    electron: ElectronAPI;
    electronAPI: ElectronAPI; // 互換性のため両方保持
  }
}

// DTO型定義
export interface CreateProjectDto {
  name: string;
  description?: string;
  storagePath?: string;
}

export interface UpdateProjectDto {
  name?: string;
  description?: string;
}

export interface CreateProcessDto {
  processTableId: string;
  name: string;
  laneId: string;
  bpmnElement?: 'task' | 'event' | 'gateway';
  taskType?: 'userTask' | 'serviceTask' | 'manualTask' | 'scriptTask' | 'businessRuleTask' | 'sendTask' | 'receiveTask';
  beforeProcessIds?: string[];
  documentation?: string;
  gatewayType?: 'exclusive' | 'parallel' | 'inclusive';
  conditionalFlows?: Array<{ condition: string; targetProcessId: string; description?: string }>;
  eventType?: 'start' | 'end' | 'intermediate';
  intermediateEventType?: 'timer' | 'message' | 'error' | 'signal' | 'conditional';
  eventDetails?: string;
  inputDataObjects?: string[];
  outputDataObjects?: string[];
  messageFlows?: Array<{ targetProcessId: string; messageContent: string; description?: string }>;
  artifacts?: Array<{ type: string; content: string }>;
  customColumns?: Record<string, any>;
  displayOrder?: number;
}

export interface UpdateProcessDto {
  name?: string;
  laneId?: string;
  bpmnElement?: 'task' | 'event' | 'gateway';
  taskType?: 'userTask' | 'serviceTask' | 'manualTask' | 'scriptTask' | 'businessRuleTask' | 'sendTask' | 'receiveTask';
  beforeProcessIds?: string[];
  documentation?: string;
  gatewayType?: 'exclusive' | 'parallel' | 'inclusive';
  conditionalFlows?: Array<{ condition: string; targetProcessId: string; description?: string }>;
  eventType?: 'start' | 'end' | 'intermediate';
  intermediateEventType?: 'timer' | 'message' | 'error' | 'signal' | 'conditional';
  eventDetails?: string;
  inputDataObjects?: string[];
  outputDataObjects?: string[];
  messageFlows?: Array<{ targetProcessId: string; messageContent: string; description?: string }>;
  artifacts?: Array<{ type: string; content: string }>;
  customColumns?: Record<string, any>;
  displayOrder?: number;
}

export interface CreateVersionDto {
  projectId: string;
  message: string;
  tag?: string;
  author?: string;
}

export interface ExcelData {
  processes: Process[];
  metadata?: Record<string, any>;
}

export interface VersionDiff {
  added: Process[];
  modified: Process[];
  deleted: Process[];
  bpmnChanges?: any;
}

// カスタム列関連のDTO (Phase 9: processTable APIに統合)
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

// データオブジェクト関連のDTO (Phase 9)
export interface CreateDataObjectDto {
  name: string;
  type: 'input' | 'output' | 'both';
  description?: string;
}

export interface UpdateDataObjectDto {
  name?: string;
  type?: 'input' | 'output' | 'both';
  description?: string;
}

// Phase 9.1: BPMN同期関連の型定義
export interface BpmnSyncState {
  id: string;
  processTableId: string;
  bpmnXml: string;
  lastSyncedAt: number;
  lastModifiedBy: 'process' | 'bpmn';
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SyncResult {
  success: boolean;
  conflicts?: Array<{
    type: 'version_mismatch' | 'concurrent_edit';
    message: string;
    expectedVersion: number;
    actualVersion: number;
  }>;
  updatedProcesses?: any[];
  newVersion: number;
}

// 他の型定義のインポート（models.tsから取得）
export type { 
  Project, 
  ProcessLevel, 
  Version,
  CustomColumnType
} from './project.types';
