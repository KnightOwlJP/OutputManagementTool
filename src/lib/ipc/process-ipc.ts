/**
 * 工程関連 IPC クライアント
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

// Process API の型を推論
type ProcessAPI = ElectronAPI['process'];
type ProcessCreateData = Parameters<ProcessAPI['create']>[0];
type ProcessUpdateData = Parameters<ProcessAPI['update']>[1];
type Process = Awaited<ReturnType<ProcessAPI['getById']>>;

// ==========================================
// 工程 IPC クライアント
// ==========================================

/**
 * 工程表内の全工程を取得
 */
export const getProcessesByProcessTable = createIPCMethod(
  api => api.process.getByProcessTable,
  '工程一覧の取得に失敗しました'
);

/**
 * 工程を取得
 */
export const getProcessById = createIPCMethod(
  api => api.process.getById,
  '工程の取得に失敗しました'
);

/**
 * 工程を作成
 */
export const createProcess = createIPCMethod(
  api => api.process.create,
  '工程の作成に失敗しました'
);

/**
 * 工程を更新
 */
export async function updateProcess(
  id: string,
  data: ProcessUpdateData
): Promise<Result<Process, IPCError>> {
  const apiResult = getElectronAPISafe();
  if (!apiResult.success) return apiResult;

  return ipcCall(
    () => apiResult.data!.process.update(id, data),
    { errorMessage: '工程の更新に失敗しました' }
  );
}

/**
 * 工程を削除
 */
export const deleteProcess = createIPCMethod(
  api => api.process.delete,
  '工程の削除に失敗しました'
);

/**
 * 工程の表示順序を変更
 */
export async function reorderProcess(
  id: string,
  newDisplayOrder: number
): Promise<Result<Process, IPCError>> {
  const apiResult = getElectronAPISafe();
  if (!apiResult.success) return apiResult;

  return ipcCall(
    () => apiResult.data!.process.reorder(id, newDisplayOrder),
    { errorMessage: '工程の並び替えに失敗しました' }
  );
}

// ==========================================
// 名前空間エクスポート（互換性のため）
// ==========================================

export const processIPC = {
  getByProcessTable: getProcessesByProcessTable,
  getById: getProcessById,
  create: createProcess,
  update: updateProcess,
  delete: deleteProcess,
  reorder: reorderProcess,
};
