/**
 * ProcessTable関連 IPC クライアント
 */

import {
  createIPCMethod,
  getElectronAPISafe,
  ipcCall,
  type Result,
} from './ipc-client';
import { IPCError } from '@/lib/common';

// ==========================================
// 型定義
// ==========================================

type ElectronAPI = typeof window.electron;
type ProcessTableAPI = ElectronAPI['processTable'];

// ==========================================
// ProcessTable IPC クライアント
// ==========================================

/**
 * プロジェクト内のProcessTable一覧を取得
 */
export const getProcessTablesByProject = createIPCMethod(
  api => api.processTable.getByProject,
  'ProcessTable一覧の取得に失敗しました'
);

/**
 * ProcessTableを取得
 */
export const getProcessTableById = createIPCMethod(
  api => api.processTable.getById,
  'ProcessTableの取得に失敗しました'
);

/**
 * ProcessTableを作成
 */
export const createProcessTable = createIPCMethod(
  api => api.processTable.create,
  'ProcessTableの作成に失敗しました'
);

/**
 * ProcessTableを更新
 */
export async function updateProcessTable(
  id: string,
  data: Parameters<ProcessTableAPI['update']>[1]
): Promise<Result<Awaited<ReturnType<ProcessTableAPI['update']>>, IPCError>> {
  const apiResult = getElectronAPISafe();
  if (!apiResult.success) return apiResult;

  return ipcCall(
    () => apiResult.data!.processTable.update(id, data),
    { errorMessage: 'ProcessTableの更新に失敗しました' }
  );
}

/**
 * ProcessTableを削除
 */
export const deleteProcessTable = createIPCMethod(
  api => api.processTable.delete,
  'ProcessTableの削除に失敗しました'
);

// ==========================================
// Swimlane 関連
// ==========================================

/**
 * Swimlane一覧を取得
 */
export const getSwimlanes = createIPCMethod(
  api => api.processTable.getSwimlanes,
  'Swimlane一覧の取得に失敗しました'
);

/**
 * Swimlaneを作成
 */
export async function createSwimlane(
  processTableId: string,
  data: { name: string; color?: string; displayOrder: number }
): Promise<Result<unknown, IPCError>> {
  const apiResult = getElectronAPISafe();
  if (!apiResult.success) return apiResult;

  return ipcCall(
    () => apiResult.data!.processTable.createSwimlane(processTableId, data),
    { errorMessage: 'Swimlaneの作成に失敗しました' }
  );
}

/**
 * Swimlaneを更新
 */
export async function updateSwimlane(
  swimlaneId: string,
  data: { name?: string; color?: string; displayOrder?: number }
): Promise<Result<unknown, IPCError>> {
  const apiResult = getElectronAPISafe();
  if (!apiResult.success) return apiResult;

  return ipcCall(
    () => apiResult.data!.processTable.updateSwimlane(swimlaneId, data),
    { errorMessage: 'Swimlaneの更新に失敗しました' }
  );
}

/**
 * Swimlaneを削除
 */
export const deleteSwimlane = createIPCMethod(
  api => api.processTable.deleteSwimlane,
  'Swimlaneの削除に失敗しました'
);

/**
 * Swimlaneの順序を変更
 */
export async function reorderSwimlanes(
  processTableId: string,
  swimlaneIds: string[]
): Promise<Result<unknown, IPCError>> {
  const apiResult = getElectronAPISafe();
  if (!apiResult.success) return apiResult;

  return ipcCall(
    () => apiResult.data!.processTable.reorderSwimlanes(processTableId, swimlaneIds),
    { errorMessage: 'Swimlaneの並び替えに失敗しました' }
  );
}

// ==========================================
// CustomColumn 関連
// ==========================================

/**
 * CustomColumn一覧を取得
 */
export const getCustomColumns = createIPCMethod(
  api => api.processTable.getCustomColumns,
  'CustomColumn一覧の取得に失敗しました'
);

/**
 * CustomColumnを作成
 */
export async function createCustomColumn(
  processTableId: string,
  data: { name: string; columnType: string; displayOrder: number; options?: string }
): Promise<Result<unknown, IPCError>> {
  const apiResult = getElectronAPISafe();
  if (!apiResult.success) return apiResult;

  return ipcCall(
    () => apiResult.data!.processTable.createCustomColumn(processTableId, data),
    { errorMessage: 'CustomColumnの作成に失敗しました' }
  );
}

/**
 * CustomColumnを更新
 */
export async function updateCustomColumn(
  columnId: string,
  data: { name?: string; columnType?: string; displayOrder?: number; options?: string }
): Promise<Result<unknown, IPCError>> {
  const apiResult = getElectronAPISafe();
  if (!apiResult.success) return apiResult;

  return ipcCall(
    () => apiResult.data!.processTable.updateCustomColumn(columnId, data),
    { errorMessage: 'CustomColumnの更新に失敗しました' }
  );
}

/**
 * CustomColumnを削除
 */
export const deleteCustomColumn = createIPCMethod(
  api => api.processTable.deleteCustomColumn,
  'CustomColumnの削除に失敗しました'
);

// ==========================================
// Step 関連
// ==========================================

/**
 * Stepを作成
 */
export async function createStep(
  processTableId: string,
  data: { name: string; displayOrder: number }
): Promise<Result<unknown, IPCError>> {
  const apiResult = getElectronAPISafe();
  if (!apiResult.success) return apiResult;

  return ipcCall(
    () => apiResult.data!.processTable.createStep(processTableId, data),
    { errorMessage: 'Stepの作成に失敗しました' }
  );
}

/**
 * Stepを更新
 */
export async function updateStep(
  stepId: string,
  data: { name?: string; displayOrder?: number }
): Promise<Result<unknown, IPCError>> {
  const apiResult = getElectronAPISafe();
  if (!apiResult.success) return apiResult;

  return ipcCall(
    () => apiResult.data!.processTable.updateStep(stepId, data),
    { errorMessage: 'Stepの更新に失敗しました' }
  );
}

/**
 * Stepを削除
 */
export const deleteStep = createIPCMethod(
  api => api.processTable.deleteStep,
  'Stepの削除に失敗しました'
);

/**
 * Stepの順序を変更
 */
export async function reorderSteps(
  processTableId: string,
  stepIds: string[]
): Promise<Result<unknown, IPCError>> {
  const apiResult = getElectronAPISafe();
  if (!apiResult.success) return apiResult;

  return ipcCall(
    () => apiResult.data!.processTable.reorderSteps(processTableId, stepIds),
    { errorMessage: 'Stepの並び替えに失敗しました' }
  );
}

// ==========================================
// 名前空間エクスポート（互換性のため）
// ==========================================

export const processTableIPC = {
  getByProject: getProcessTablesByProject,
  getById: getProcessTableById,
  create: createProcessTable,
  update: updateProcessTable,
  delete: deleteProcessTable,
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
};
