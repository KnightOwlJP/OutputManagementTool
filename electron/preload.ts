import { contextBridge, ipcRenderer } from 'electron';

// Type-safe IPC API
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

  // 工程表（ProcessTable）操作
  processTable: {
    create: (data: any) => ipcRenderer.invoke('processTable:create', data),
    getByProject: (projectId: string) => ipcRenderer.invoke('processTable:getByProject', projectId),
    getById: (id: string) => ipcRenderer.invoke('processTable:getById', id),
    update: (id: string, data: any) => ipcRenderer.invoke('processTable:update', id, data),
    delete: (id: string) => ipcRenderer.invoke('processTable:delete', id),
    reorder: (id: string, newOrder: number) => ipcRenderer.invoke('processTable:reorder', id, newOrder),
  },

  // フロー図グループ（BpmnDiagramTable）操作
  bpmnDiagramTable: {
    create: (data: any) => ipcRenderer.invoke('bpmnDiagramTable:create', data),
    getByProject: (projectId: string) => ipcRenderer.invoke('bpmnDiagramTable:getByProject', projectId),
    getById: (id: string) => ipcRenderer.invoke('bpmnDiagramTable:getById', id),
    update: (data: any) => ipcRenderer.invoke('bpmnDiagramTable:update', data),
    delete: (id: string) => ipcRenderer.invoke('bpmnDiagramTable:delete', id),
    reorder: (data: any) => ipcRenderer.invoke('bpmnDiagramTable:reorder', data),
  },

  // マニュアルグループ（ManualTable）操作
  manualTable: {
    create: (data: any) => ipcRenderer.invoke('manualTable:create', data),
    getByProject: (projectId: string) => ipcRenderer.invoke('manualTable:getByProject', projectId),
    getById: (id: string) => ipcRenderer.invoke('manualTable:getById', id),
    update: (data: any) => ipcRenderer.invoke('manualTable:update', data),
    delete: (id: string) => ipcRenderer.invoke('manualTable:delete', id),
    reorder: (data: any) => ipcRenderer.invoke('manualTable:reorder', data),
  },

  // 工程操作
  process: {
    create: (data: any) => ipcRenderer.invoke('process:create', data),
    getByProject: (projectId: string) => ipcRenderer.invoke('process:getByProject', projectId),
    getById: (processId: string) => ipcRenderer.invoke('process:getById', processId),
    update: (processId: string, data: any) => ipcRenderer.invoke('process:update', processId, data),
    delete: (processId: string) => ipcRenderer.invoke('process:delete', processId),
  },

  // BPMN操作
  bpmn: {
    create: (data: any) => ipcRenderer.invoke('bpmn:create', data),
    getByProject: (projectId: string) => ipcRenderer.invoke('bpmn:getByProject', projectId),
    getById: (bpmnId: string) => ipcRenderer.invoke('bpmn:getById', bpmnId),
    update: (bpmnId: string, data: any) => ipcRenderer.invoke('bpmn:update', bpmnId, data),
    delete: (bpmnId: string) => ipcRenderer.invoke('bpmn:delete', bpmnId),
    export: (bpmnId: string, format: string) => ipcRenderer.invoke('bpmn:export', bpmnId, format),
  },

  // バージョン管理
  version: {
    create: (data: any) => ipcRenderer.invoke('version:create', data),
    getByProject: (projectId: string) => ipcRenderer.invoke('version:getByProject', projectId),
    getById: (versionId: string) => ipcRenderer.invoke('version:getById', versionId),
    restore: (versionId: string) => ipcRenderer.invoke('version:restore', versionId),
    delete: (versionId: string) => ipcRenderer.invoke('version:delete', versionId),
  },

  // BPMN ⇔ 工程表 同期 (Phase 6.1.2)
  sync: {
    bpmnToProcesses: (projectId: string, bpmnXml: string, options?: any) => 
      ipcRenderer.invoke('sync:bpmnToProcesses', projectId, bpmnXml, options),
    processesToBpmn: (projectId: string, bpmnId: string, options?: any) => 
      ipcRenderer.invoke('sync:processesToBpmn', projectId, bpmnId, options),
    bidirectional: (projectId: string, bpmnId: string, bpmnXml: string, options?: any) => 
      ipcRenderer.invoke('sync:bidirectional', projectId, bpmnId, bpmnXml, options),
    getProcessByBpmnElementId: (bpmnElementId: string) => 
      ipcRenderer.invoke('sync:getProcessByBpmnElementId', bpmnElementId),
    resolveConflict: (conflict: any, resolution: 'use-bpmn' | 'use-process' | 'merge') => 
      ipcRenderer.invoke('sync:resolveConflict', conflict, resolution),
    startWatch: (projectId: string) => 
      ipcRenderer.invoke('sync:startWatch', projectId),
    stopWatch: () => 
      ipcRenderer.invoke('sync:stopWatch'),
  },

  // マニュアル管理 (Phase 6.2.3)
  manual: {
    create: (data: any) => 
      ipcRenderer.invoke('manual:create', data),
    getByProject: (projectId: string) => 
      ipcRenderer.invoke('manual:getByProject', projectId),
    getById: (manualId: string) => 
      ipcRenderer.invoke('manual:getById', manualId),
    update: (manualId: string, data: any) => 
      ipcRenderer.invoke('manual:update', manualId, data),
    delete: (manualId: string) => 
      ipcRenderer.invoke('manual:delete', manualId),
    generateFromProcesses: (data: any) => 
      ipcRenderer.invoke('manual:generateFromProcesses', data),
    export: (manualId: string, format: 'pdf' | 'html' | 'markdown' | 'docx') => 
      ipcRenderer.invoke('manual:export', manualId, format),
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
