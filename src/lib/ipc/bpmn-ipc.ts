/**
 * BPMN フロー図関連 IPC クライアント
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
type BpmnDiagramTableAPI = ElectronAPI['bpmnDiagramTable'];

// ==========================================
// BPMN IPC クライアント
// ==========================================

/**
 * プロジェクト内の全BPMNフロー図を取得
 */
export const getBpmnDiagramsByProject = createIPCMethod(
  api => api.bpmnDiagramTable.getByProject,
  'BPMNフロー図一覧の取得に失敗しました'
);

/**
 * 工程表に紐づくBPMNフロー図を取得
 */
export const getBpmnDiagramByProcessTable = createIPCMethod(
  api => api.bpmnDiagramTable.getByProcessTable,
  'BPMNフロー図の取得に失敗しました'
);

/**
 * BPMNフロー図を取得
 */
export const getBpmnDiagramById = createIPCMethod(
  api => api.bpmnDiagramTable.getById,
  'BPMNフロー図の取得に失敗しました'
);

/**
 * BPMNフロー図を更新
 */
export async function updateBpmnDiagram(
  id: string,
  data: Parameters<BpmnDiagramTableAPI['update']>[1]
): Promise<Result<Awaited<ReturnType<BpmnDiagramTableAPI['update']>>, IPCError>> {
  const apiResult = getElectronAPISafe();
  if (!apiResult.success) return apiResult;

  return ipcCall(
    () => apiResult.data!.bpmnDiagramTable.update(id, data),
    { errorMessage: 'BPMNフロー図の更新に失敗しました' }
  );
}

/**
 * BPMNフロー図を削除
 */
export const deleteBpmnDiagram = createIPCMethod(
  api => api.bpmnDiagramTable.delete,
  'BPMNフロー図の削除に失敗しました'
);

// ==========================================
// 名前空間エクスポート（互換性のため）
// ==========================================

export const bpmnIPC = {
  getByProject: getBpmnDiagramsByProject,
  getByProcessTable: getBpmnDiagramByProcessTable,
  getById: getBpmnDiagramById,
  update: updateBpmnDiagram,
  delete: deleteBpmnDiagram,
};
