/**
 * プロジェクト関連 IPC クライアント
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

// Project API の型を推論
type ProjectAPI = ElectronAPI['project'];
type ProjectCreateData = Parameters<ProjectAPI['create']>[0];
type ProjectUpdateData = Parameters<ProjectAPI['update']>[1];
type Project = Awaited<ReturnType<ProjectAPI['getById']>>;

// ==========================================
// プロジェクト IPC クライアント
// ==========================================

/**
 * プロジェクト一覧を取得
 */
export const getAllProjects = createIPCMethod(
  api => api.project.getAll,
  'プロジェクト一覧の取得に失敗しました'
);

/**
 * プロジェクトを取得
 */
export const getProjectById = createIPCMethod(
  api => api.project.getById,
  'プロジェクトの取得に失敗しました'
);

/**
 * プロジェクトを作成
 */
export const createProject = createIPCMethod(
  api => api.project.create,
  'プロジェクトの作成に失敗しました'
);

/**
 * プロジェクトを更新
 */
export async function updateProject(
  id: string,
  data: ProjectUpdateData
): Promise<Result<Project, IPCError>> {
  const apiResult = getElectronAPISafe();
  if (!apiResult.success) return apiResult;

  return ipcCall(
    () => apiResult.data!.project.update(id, data),
    { errorMessage: 'プロジェクトの更新に失敗しました' }
  );
}

/**
 * プロジェクトを削除
 */
export const deleteProject = createIPCMethod(
  api => api.project.delete,
  'プロジェクトの削除に失敗しました'
);

// ==========================================
// 名前空間エクスポート（互換性のため）
// ==========================================

export const projectIPC = {
  getAll: getAllProjects,
  getById: getProjectById,
  create: createProject,
  update: updateProject,
  delete: deleteProject,
};
