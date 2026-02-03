/**
 * データオブジェクト関連 IPC クライアント
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
type DataObjectAPI = ElectronAPI['dataObject'];

type DataObjectCreateData = {
  name: string;
  type: 'input' | 'output' | 'both';
  description?: string;
};

type DataObjectUpdateData = {
  name?: string;
  type?: 'input' | 'output' | 'both';
  description?: string;
};

// ==========================================
// データオブジェクト IPC クライアント
// ==========================================

/**
 * データオブジェクトを作成
 */
export async function createDataObject(
  processTableId: string,
  data: DataObjectCreateData
): Promise<Result<Awaited<ReturnType<DataObjectAPI['create']>>, IPCError>> {
  const apiResult = getElectronAPISafe();
  if (!apiResult.success) return apiResult;

  return ipcCall(
    () => apiResult.data!.dataObject.create(processTableId, data),
    { errorMessage: 'データオブジェクトの作成に失敗しました' }
  );
}

/**
 * 工程表内の全データオブジェクトを取得
 */
export const getDataObjectsByProcessTable = createIPCMethod(
  api => api.dataObject.getByProcessTable,
  'データオブジェクト一覧の取得に失敗しました'
);

/**
 * データオブジェクトを取得
 */
export const getDataObjectById = createIPCMethod(
  api => api.dataObject.getById,
  'データオブジェクトの取得に失敗しました'
);

/**
 * データオブジェクトを更新
 */
export async function updateDataObject(
  id: string,
  data: DataObjectUpdateData
): Promise<Result<Awaited<ReturnType<DataObjectAPI['update']>>, IPCError>> {
  const apiResult = getElectronAPISafe();
  if (!apiResult.success) return apiResult;

  return ipcCall(
    () => apiResult.data!.dataObject.update(id, data),
    { errorMessage: 'データオブジェクトの更新に失敗しました' }
  );
}

/**
 * データオブジェクトを削除
 */
export const deleteDataObject = createIPCMethod(
  api => api.dataObject.delete,
  'データオブジェクトの削除に失敗しました'
);

/**
 * データオブジェクトを工程に関連付け
 */
export async function linkDataObjectToProcess(
  dataObjectId: string,
  processId: string,
  direction: 'input' | 'output'
): Promise<Result<Awaited<ReturnType<DataObjectAPI['linkToProcess']>>, IPCError>> {
  const apiResult = getElectronAPISafe();
  if (!apiResult.success) return apiResult;

  return ipcCall(
    () => apiResult.data!.dataObject.linkToProcess(dataObjectId, processId, direction),
    { errorMessage: 'データオブジェクトの関連付けに失敗しました' }
  );
}

/**
 * データオブジェクトの関連付けを解除
 */
export async function unlinkDataObjectFromProcess(
  dataObjectId: string,
  processId: string,
  direction: 'input' | 'output'
): Promise<Result<Awaited<ReturnType<DataObjectAPI['unlinkFromProcess']>>, IPCError>> {
  const apiResult = getElectronAPISafe();
  if (!apiResult.success) return apiResult;

  return ipcCall(
    () => apiResult.data!.dataObject.unlinkFromProcess(dataObjectId, processId, direction),
    { errorMessage: 'データオブジェクトの関連付け解除に失敗しました' }
  );
}

// ==========================================
// 名前空間エクスポート（互換性のため）
// ==========================================

export const dataObjectIPC = {
  create: createDataObject,
  getByProcessTable: getDataObjectsByProcessTable,
  getById: getDataObjectById,
  update: updateDataObject,
  delete: deleteDataObject,
  linkToProcess: linkDataObjectToProcess,
  unlinkFromProcess: unlinkDataObjectFromProcess,
};
