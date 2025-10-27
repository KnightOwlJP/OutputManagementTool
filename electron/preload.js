"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
// V2: Type-safe IPC API
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
    // V2: 工程表操作（新規）
    processTable: {
        create: (data) => electron_1.ipcRenderer.invoke('processTable:create', data),
        getByProject: (projectId) => electron_1.ipcRenderer.invoke('processTable:getByProject', projectId),
        getById: (processTableId) => electron_1.ipcRenderer.invoke('processTable:getById', processTableId),
        update: (processTableId, data) => electron_1.ipcRenderer.invoke('processTable:update', processTableId, data),
        delete: (processTableId) => electron_1.ipcRenderer.invoke('processTable:delete', processTableId),
        // スイムレーン管理
        createSwimlane: (processTableId, data) => electron_1.ipcRenderer.invoke('processTable:createSwimlane', processTableId, data),
        getSwimlanes: (processTableId) => electron_1.ipcRenderer.invoke('processTable:getSwimlanes', processTableId),
        updateSwimlane: (swimlaneId, data) => electron_1.ipcRenderer.invoke('processTable:updateSwimlane', swimlaneId, data),
        deleteSwimlane: (swimlaneId) => electron_1.ipcRenderer.invoke('processTable:deleteSwimlane', swimlaneId),
        reorderSwimlanes: (processTableId, swimlaneIds) => electron_1.ipcRenderer.invoke('processTable:reorderSwimlanes', processTableId, swimlaneIds),
        // カスタム列管理
        createCustomColumn: (processTableId, data) => electron_1.ipcRenderer.invoke('processTable:createCustomColumn', processTableId, data),
        getCustomColumns: (processTableId) => electron_1.ipcRenderer.invoke('processTable:getCustomColumns', processTableId),
        updateCustomColumn: (columnId, data) => electron_1.ipcRenderer.invoke('processTable:updateCustomColumn', columnId, data),
        deleteCustomColumn: (columnId) => electron_1.ipcRenderer.invoke('processTable:deleteCustomColumn', columnId),
        reorderCustomColumns: (processTableId, columnIds) => electron_1.ipcRenderer.invoke('processTable:reorderCustomColumns', processTableId, columnIds),
    },
    // V2: 工程操作（BPMN 2.0完全統合）
    process: {
        create: (data) => electron_1.ipcRenderer.invoke('process:create', data),
        getByProcessTable: (processTableId) => electron_1.ipcRenderer.invoke('process:getByProcessTable', processTableId),
        getById: (processId) => electron_1.ipcRenderer.invoke('process:getById', processId),
        update: (processId, data) => electron_1.ipcRenderer.invoke('process:update', processId, data),
        delete: (processId) => electron_1.ipcRenderer.invoke('process:delete', processId),
        reorder: (processId, newDisplayOrder) => electron_1.ipcRenderer.invoke('process:reorder', processId, newDisplayOrder),
        // BPMN関連操作
        updateBeforeProcessIds: (processId, beforeProcessIds) => electron_1.ipcRenderer.invoke('process:updateBeforeProcessIds', processId, beforeProcessIds),
        calculateNextProcessIds: (processTableId) => electron_1.ipcRenderer.invoke('process:calculateNextProcessIds', processTableId),
        // カスタム列値操作
        setCustomValue: (processId, columnName, value) => electron_1.ipcRenderer.invoke('process:setCustomValue', processId, columnName, value),
        getCustomValue: (processId, columnName) => electron_1.ipcRenderer.invoke('process:getCustomValue', processId, columnName),
    },
    // Phase 9: BPMNフロー図管理（工程表から自動生成、読み取り専用）
    bpmnDiagramTable: {
        getByProject: (projectId) => electron_1.ipcRenderer.invoke('bpmnDiagramTable:getByProject', projectId),
        getById: (bpmnId) => electron_1.ipcRenderer.invoke('bpmnDiagramTable:getById', bpmnId),
        getByProcessTable: (processTableId) => electron_1.ipcRenderer.invoke('bpmnDiagramTable:getByProcessTable', processTableId),
        update: (bpmnId, data) => electron_1.ipcRenderer.invoke('bpmnDiagramTable:update', bpmnId, data),
        delete: (bpmnId) => electron_1.ipcRenderer.invoke('bpmnDiagramTable:delete', bpmnId),
    },
    // Phase 9: マニュアル管理（工程表から自動生成、読み取り専用）
    manualTable: {
        getByProject: (projectId) => electron_1.ipcRenderer.invoke('manualTable:getByProject', projectId),
        getById: (manualId) => electron_1.ipcRenderer.invoke('manualTable:getById', manualId),
        getByProcessTable: (processTableId) => electron_1.ipcRenderer.invoke('manualTable:getByProcessTable', processTableId),
        update: (manualId, data) => electron_1.ipcRenderer.invoke('manualTable:update', manualId, data),
        delete: (manualId) => electron_1.ipcRenderer.invoke('manualTable:delete', manualId),
    },
    // バージョン管理
    version: {
        create: (data) => electron_1.ipcRenderer.invoke('version:create', data),
        getByProject: (projectId) => electron_1.ipcRenderer.invoke('version:getByProject', projectId),
        getById: (versionId) => electron_1.ipcRenderer.invoke('version:getById', versionId),
        restore: (versionId) => electron_1.ipcRenderer.invoke('version:restore', versionId),
        delete: (versionId) => electron_1.ipcRenderer.invoke('version:delete', versionId),
    },
    // バックアップ管理
    backup: {
        create: (customPath, isAutomatic) => electron_1.ipcRenderer.invoke('backup:create', customPath, isAutomatic),
        list: (customPath) => electron_1.ipcRenderer.invoke('backup:list', customPath),
        restore: (backupPath) => electron_1.ipcRenderer.invoke('backup:restore', backupPath),
        delete: (backupPath) => electron_1.ipcRenderer.invoke('backup:delete', backupPath),
        cleanup: (maxBackups, customPath) => electron_1.ipcRenderer.invoke('backup:cleanup', maxBackups, customPath),
        selectDirectory: () => electron_1.ipcRenderer.invoke('backup:selectDirectory'),
        // スケジューラー
        startScheduler: (intervalHours, maxBackups, customPath) => electron_1.ipcRenderer.invoke('backup-scheduler:start', intervalHours, maxBackups, customPath),
        stopScheduler: () => electron_1.ipcRenderer.invoke('backup-scheduler:stop'),
        getSchedulerStatus: () => electron_1.ipcRenderer.invoke('backup-scheduler:status'),
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
