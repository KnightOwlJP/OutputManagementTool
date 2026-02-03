/**
 * IPC モジュールのエクスポート
 * 全てのIPC関連機能を統一的にエクスポート
 */

// IPC クライアント基盤
export {
  isElectronAvailable,
  getElectronAPI,
  getElectronAPISafe,
  ipcCall,
  ipcCallWithRetry,
  createIPCMethod,
  createIPCMethodWithRetry,
  createCRUDClient,
  batchIPCCalls,
  sequentialIPCCalls,
  // 旧API互換
  safeIpcCall,
  toLegacyResult,
  type IPCCallOptions,
  type RetryOptions,
  type CRUDClient,
  type CRUDConfig,
  type LegacyResult,
} from './ipc-client';

// プロジェクト
export {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  projectIPC,
} from './project-ipc';

// 工程
export {
  getProcessesByProcessTable,
  getProcessById,
  createProcess,
  updateProcess,
  deleteProcess,
  reorderProcess,
  processIPC,
} from './process-ipc';

// 工程表
export {
  getProcessTablesByProject,
  getProcessTableById,
  createProcessTable,
  updateProcessTable,
  deleteProcessTable,
  getSwimlanes,
  createSwimlane,
  updateSwimlane,
  deleteSwimlane,
  reorderSwimlanes,
  getCustomColumns,
  createCustomColumn,
  updateCustomColumn,
  deleteCustomColumn,
  createStep,
  updateStep,
  deleteStep,
  reorderSteps,
  processTableIPC,
} from './process-table-ipc';

// BPMN
export {
  getBpmnDiagramsByProject,
  getBpmnDiagramByProcessTable,
  getBpmnDiagramById,
  updateBpmnDiagram,
  deleteBpmnDiagram,
  bpmnIPC,
} from './bpmn-ipc';

// マニュアル
export {
  getManualsByProject,
  getManualByProcessTable,
  getManualById,
  updateManual,
  deleteManual,
  manualIPC,
} from './manual-ipc';

// バージョン
export {
  getVersionsByProject,
  createVersion,
  restoreVersion,
  versionIPC,
} from './version-ipc';

// ファイル
export {
  importExcel,
  exportExcel,
  openFileDialog,
  saveFileDialog,
  fileIPC,
} from './file-ipc';

// データオブジェクト
export {
  createDataObject,
  getDataObjectsByProcessTable,
  getDataObjectById,
  updateDataObject,
  deleteDataObject,
  linkDataObjectToProcess,
  unlinkDataObjectFromProcess,
  dataObjectIPC,
} from './data-object-ipc';
