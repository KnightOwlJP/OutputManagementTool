import { contextBridge, ipcRenderer } from 'electron';

// V2: Type definitions for IPC API
// Note: Full types are defined in ../src/types/phase9.types.ts
type CreateProcessTableDto = any;
type UpdateProcessTableDto = any;
type CreateProcessDto = any;
type UpdateProcessDto = any;
type CreateSwimlaneDto = any;
type UpdateSwimlaneDto = any;
type ProcessTable = any;
type Process = any;
type Swimlane = any;
type CustomColumn = any;
type DataObject = any;
type BpmnDiagram = any;
type Manual = any;
type ManualSection = any;
type CreateProcessTableResult = any;
type CreateProcessResult = any;
type UpdateProcessResult = any;
type DeleteProcessResult = any;
type SyncResult = any;

// V2: Type-safe IPC API
const api = {
  // プロジェクト操作
  project: {
    create: (data: any) => ipcRenderer.invoke('project:create', data),
    getAll: () => ipcRenderer.invoke('project:getAll'),
    getById: (projectId: string) => ipcRenderer.invoke('project:getById', projectId),
    update: (projectId: string, data: any) => ipcRenderer.invoke('project:update', projectId, data),
    delete: (projectId: string) => ipcRenderer.invoke('project:delete', projectId),
  },

  // ファイル操作
  file: {
    selectDirectory: () => ipcRenderer.invoke('file:selectDirectory'),
    selectExcel: () => ipcRenderer.invoke('file:selectExcel'),
    saveExcel: (data: any) => ipcRenderer.invoke('file:saveExcel', data),
  },

  // V2: 工程表操作（新規）
  processTable: {
    create: (data: CreateProcessTableDto): Promise<CreateProcessTableResult> => 
      ipcRenderer.invoke('processTable:create', data),
    getByProject: (projectId: string): Promise<ProcessTable[]> => 
      ipcRenderer.invoke('processTable:getByProject', projectId),
    getById: (processTableId: string): Promise<ProcessTable | null> => 
      ipcRenderer.invoke('processTable:getById', processTableId),
    update: (processTableId: string, data: UpdateProcessTableDto): Promise<ProcessTable> => 
      ipcRenderer.invoke('processTable:update', processTableId, data),
    delete: (processTableId: string): Promise<DeleteProcessResult> => 
      ipcRenderer.invoke('processTable:delete', processTableId),
    
    // スイムレーン管理
    createSwimlane: (processTableId: string, data: CreateSwimlaneDto): Promise<Swimlane> => 
      ipcRenderer.invoke('processTable:createSwimlane', processTableId, data),
    getSwimlanes: (processTableId: string): Promise<Swimlane[]> => 
      ipcRenderer.invoke('processTable:getSwimlanes', processTableId),
    updateSwimlane: (swimlaneId: string, data: UpdateSwimlaneDto): Promise<Swimlane> => 
      ipcRenderer.invoke('processTable:updateSwimlane', swimlaneId, data),
    deleteSwimlane: (swimlaneId: string): Promise<void> => 
      ipcRenderer.invoke('processTable:deleteSwimlane', swimlaneId),
    reorderSwimlanes: (processTableId: string, swimlaneIds: string[]): Promise<void> => 
      ipcRenderer.invoke('processTable:reorderSwimlanes', processTableId, swimlaneIds),
    
    // カスタム列管理
    createCustomColumn: (processTableId: string, data: any): Promise<CustomColumn> => 
      ipcRenderer.invoke('processTable:createCustomColumn', processTableId, data),
    getCustomColumns: (processTableId: string): Promise<CustomColumn[]> => 
      ipcRenderer.invoke('processTable:getCustomColumns', processTableId),
    updateCustomColumn: (columnId: string, data: any): Promise<CustomColumn> => 
      ipcRenderer.invoke('processTable:updateCustomColumn', columnId, data),
    deleteCustomColumn: (columnId: string): Promise<void> => 
      ipcRenderer.invoke('processTable:deleteCustomColumn', columnId),
    reorderCustomColumns: (processTableId: string, columnIds: string[]): Promise<void> => 
      ipcRenderer.invoke('processTable:reorderCustomColumns', processTableId, columnIds),
  },

  // V2: 工程操作（BPMN 2.0完全統合）
  process: {
    create: (data: CreateProcessDto): Promise<CreateProcessResult> => 
      ipcRenderer.invoke('process:create', data),
    getByProcessTable: (processTableId: string): Promise<Process[]> => 
      ipcRenderer.invoke('process:getByProcessTable', processTableId),
    getById: (processId: string): Promise<Process | null> => 
      ipcRenderer.invoke('process:getById', processId),
    update: (processId: string, data: UpdateProcessDto): Promise<UpdateProcessResult> => 
      ipcRenderer.invoke('process:update', processId, data),
    delete: (processId: string): Promise<DeleteProcessResult> => 
      ipcRenderer.invoke('process:delete', processId),
    reorder: (processId: string, newDisplayOrder: number): Promise<void> => 
      ipcRenderer.invoke('process:reorder', processId, newDisplayOrder),
    
    // BPMN関連操作
    updateBeforeProcessIds: (processId: string, beforeProcessIds: string[]): Promise<Process> => 
      ipcRenderer.invoke('process:updateBeforeProcessIds', processId, beforeProcessIds),
    calculateNextProcessIds: (processTableId: string): Promise<void> => 
      ipcRenderer.invoke('process:calculateNextProcessIds', processTableId),
    
    // カスタム列値操作
    setCustomValue: (processId: string, columnName: string, value: any): Promise<Process> => 
      ipcRenderer.invoke('process:setCustomValue', processId, columnName, value),
    getCustomValue: (processId: string, columnName: string): Promise<any> => 
      ipcRenderer.invoke('process:getCustomValue', processId, columnName),
  },

  // Phase 9: BPMNフロー図管理（工程表から自動生成、読み取り専用）
  bpmnDiagramTable: {
    getByProject: (projectId: string): Promise<BpmnDiagram[]> => 
      ipcRenderer.invoke('bpmnDiagramTable:getByProject', projectId),
    getById: (bpmnId: string): Promise<BpmnDiagram | null> => 
      ipcRenderer.invoke('bpmnDiagramTable:getById', bpmnId),
    getByProcessTable: (processTableId: string): Promise<BpmnDiagram | null> => 
      ipcRenderer.invoke('bpmnDiagramTable:getByProcessTable', processTableId),
    update: (bpmnId: string, data: any): Promise<BpmnDiagram> => 
      ipcRenderer.invoke('bpmnDiagramTable:update', bpmnId, data),
    delete: (bpmnId: string): Promise<void> => 
      ipcRenderer.invoke('bpmnDiagramTable:delete', bpmnId),
  },

  // Phase 9: マニュアル管理（工程表から自動生成、読み取り専用）
  manualTable: {
    getByProject: (projectId: string): Promise<Manual[]> => 
      ipcRenderer.invoke('manualTable:getByProject', projectId),
    getById: (manualId: string): Promise<Manual | null> => 
      ipcRenderer.invoke('manualTable:getById', manualId),
    getByProcessTable: (processTableId: string): Promise<Manual | null> => 
      ipcRenderer.invoke('manualTable:getByProcessTable', processTableId),
    update: (manualId: string, data: any): Promise<Manual> => 
      ipcRenderer.invoke('manualTable:update', manualId, data),
    delete: (manualId: string): Promise<void> => 
      ipcRenderer.invoke('manualTable:delete', manualId),
  },

  // バージョン管理
  version: {
    create: (data: any) => ipcRenderer.invoke('version:create', data),
    getByProject: (projectId: string) => ipcRenderer.invoke('version:getByProject', projectId),
    getById: (versionId: string) => ipcRenderer.invoke('version:getById', versionId),
    restore: (versionId: string) => ipcRenderer.invoke('version:restore', versionId),
    delete: (versionId: string) => ipcRenderer.invoke('version:delete', versionId),
  },

  // バックアップ管理
  backup: {
    create: (customPath?: string, isAutomatic?: boolean) => 
      ipcRenderer.invoke('backup:create', customPath, isAutomatic),
    list: (customPath?: string) => 
      ipcRenderer.invoke('backup:list', customPath),
    restore: (backupPath: string) => 
      ipcRenderer.invoke('backup:restore', backupPath),
    delete: (backupPath: string) => 
      ipcRenderer.invoke('backup:delete', backupPath),
    cleanup: (maxBackups: number, customPath?: string) => 
      ipcRenderer.invoke('backup:cleanup', maxBackups, customPath),
    selectDirectory: () => 
      ipcRenderer.invoke('backup:selectDirectory'),
    // スケジューラー
    startScheduler: (intervalHours: number, maxBackups: number, customPath?: string) =>
      ipcRenderer.invoke('backup-scheduler:start', intervalHours, maxBackups, customPath),
    stopScheduler: () =>
      ipcRenderer.invoke('backup-scheduler:stop'),
    getSchedulerStatus: () =>
      ipcRenderer.invoke('backup-scheduler:status'),
  },

  // システム情報
  system: {
    platform: process.platform,
    version: process.versions.electron,
  },
};

// Expose protected methods to the renderer process
// 互換性のため両方の名前で公開
contextBridge.exposeInMainWorld('electron', api);
contextBridge.exposeInMainWorld('electronAPI', api);

// Next.jsのルーティング用にbaseURLを設定
contextBridge.exposeInMainWorld('__NEXT_DATA__', {
  props: {
    pageProps: {},
  },
  page: '/',
  query: {},
  buildId: 'development',
  isFallback: false,
  dynamicIds: [],
});

// Type declaration for TypeScript
export type ElectronAPI = typeof api;
