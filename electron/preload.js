"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
// Type-safe IPC API
const api = {
    // プロジェクト操作
    project: {
        create: (data) => electron_1.ipcRenderer.invoke('project:create', data),
        getAll: () => electron_1.ipcRenderer.invoke('project:getAll'),
        getById: (projectId) => electron_1.ipcRenderer.invoke('project:getById', projectId),
        update: (projectId, data) => electron_1.ipcRenderer.invoke('project:update', projectId, data),
        delete: (projectId) => electron_1.ipcRenderer.invoke('project:delete', projectId),
    },
    // ファイル操作
    file: {
        selectDirectory: () => electron_1.ipcRenderer.invoke('file:selectDirectory'),
        selectExcel: () => electron_1.ipcRenderer.invoke('file:selectExcel'),
        saveExcel: (data) => electron_1.ipcRenderer.invoke('file:saveExcel', data),
    },
    // 工程操作
    process: {
        create: (data) => electron_1.ipcRenderer.invoke('process:create', data),
        getByProject: (projectId) => electron_1.ipcRenderer.invoke('process:getByProject', projectId),
        getById: (processId) => electron_1.ipcRenderer.invoke('process:getById', processId),
        update: (processId, data) => electron_1.ipcRenderer.invoke('process:update', processId, data),
        delete: (processId) => electron_1.ipcRenderer.invoke('process:delete', processId),
    },
    // BPMN操作
    bpmn: {
        create: (data) => electron_1.ipcRenderer.invoke('bpmn:create', data),
        getByProject: (projectId) => electron_1.ipcRenderer.invoke('bpmn:getByProject', projectId),
        getById: (bpmnId) => electron_1.ipcRenderer.invoke('bpmn:getById', bpmnId),
        update: (bpmnId, data) => electron_1.ipcRenderer.invoke('bpmn:update', bpmnId, data),
        delete: (bpmnId) => electron_1.ipcRenderer.invoke('bpmn:delete', bpmnId),
        export: (bpmnId, format) => electron_1.ipcRenderer.invoke('bpmn:export', bpmnId, format),
    },
    // バージョン管理
    version: {
        create: (data) => electron_1.ipcRenderer.invoke('version:create', data),
        getByProject: (projectId) => electron_1.ipcRenderer.invoke('version:getByProject', projectId),
        getById: (versionId) => electron_1.ipcRenderer.invoke('version:getById', versionId),
        restore: (versionId) => electron_1.ipcRenderer.invoke('version:restore', versionId),
        delete: (versionId) => electron_1.ipcRenderer.invoke('version:delete', versionId),
    },
    // BPMN ⇔ 工程表 同期 (Phase 6.1.2)
    sync: {
        bpmnToProcesses: (projectId, bpmnXml, options) => electron_1.ipcRenderer.invoke('sync:bpmnToProcesses', projectId, bpmnXml, options),
        processesToBpmn: (projectId, bpmnId, options) => electron_1.ipcRenderer.invoke('sync:processesToBpmn', projectId, bpmnId, options),
        bidirectional: (projectId, bpmnId, bpmnXml, options) => electron_1.ipcRenderer.invoke('sync:bidirectional', projectId, bpmnId, bpmnXml, options),
        getProcessByBpmnElementId: (bpmnElementId) => electron_1.ipcRenderer.invoke('sync:getProcessByBpmnElementId', bpmnElementId),
        resolveConflict: (conflict, resolution) => electron_1.ipcRenderer.invoke('sync:resolveConflict', conflict, resolution),
        startWatch: (projectId) => electron_1.ipcRenderer.invoke('sync:startWatch', projectId),
        stopWatch: () => electron_1.ipcRenderer.invoke('sync:stopWatch'),
    },
    // マニュアル管理 (Phase 6.2.3)
    manual: {
        create: (data) => electron_1.ipcRenderer.invoke('manual:create', data),
        getByProject: (projectId) => electron_1.ipcRenderer.invoke('manual:getByProject', projectId),
        getById: (manualId) => electron_1.ipcRenderer.invoke('manual:getById', manualId),
        update: (manualId, data) => electron_1.ipcRenderer.invoke('manual:update', manualId, data),
        delete: (manualId) => electron_1.ipcRenderer.invoke('manual:delete', manualId),
        generateFromProcesses: (data) => electron_1.ipcRenderer.invoke('manual:generateFromProcesses', data),
        export: (manualId, format) => electron_1.ipcRenderer.invoke('manual:export', manualId, format),
    },
    // システム情報
    system: {
        platform: process.platform,
        version: process.versions.electron,
    },
};
// Expose protected methods to the renderer process
// 互換性のため両方の名前で公開
electron_1.contextBridge.exposeInMainWorld('electron', api);
electron_1.contextBridge.exposeInMainWorld('electronAPI', api);
// Next.jsのルーティング用にbaseURLを設定
electron_1.contextBridge.exposeInMainWorld('__NEXT_DATA__', {
    props: {
        pageProps: {},
    },
    page: '/',
    query: {},
    buildId: 'development',
    isFallback: false,
    dynamicIds: [],
});
