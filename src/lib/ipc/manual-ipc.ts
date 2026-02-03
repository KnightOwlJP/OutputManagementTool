/**
 * マニュアル関連 IPC クライアント
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
type ManualTableAPI = ElectronAPI['manualTable'];

// ==========================================
// マニュアル IPC クライアント
// ==========================================

/**
 * プロジェクト内の全マニュアルを取得
 */
export const getManualsByProject = createIPCMethod(
  api => api.manualTable.getByProject,
  'マニュアル一覧の取得に失敗しました'
);

/**
 * 工程表に紐づくマニュアルを取得
 */
export const getManualByProcessTable = createIPCMethod(
  api => api.manualTable.getByProcessTable,
  'マニュアルの取得に失敗しました'
);

/**
 * マニュアルをIDで取得
 */
export const getManualById = createIPCMethod(
  api => api.manualTable.getById,
  'マニュアルの取得に失敗しました'
);

/**
 * マニュアルを更新
 */
export async function updateManual(
  id: string,
  data: Parameters<ManualTableAPI['update']>[1]
): Promise<Result<Awaited<ReturnType<ManualTableAPI['update']>>, IPCError>> {
  const apiResult = getElectronAPISafe();
  if (!apiResult.success) return apiResult;

  return ipcCall(
    () => apiResult.data!.manualTable.update(id, data),
    { errorMessage: 'マニュアルの更新に失敗しました' }
  );
}

/**
 * マニュアルを削除
 */
export const deleteManual = createIPCMethod(
  api => api.manualTable.delete,
  'マニュアルの削除に失敗しました'
);

// ==========================================
// 名前空間エクスポート（互換性のため）
// ==========================================

export const manualIPC = {
  getByProject: getManualsByProject,
  getByProcessTable: getManualByProcessTable,
  getById: getManualById,
  update: updateManual,
  delete: deleteManual,
};
