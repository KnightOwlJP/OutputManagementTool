/**
 * バージョン管理関連 IPC クライアント
 */

import { createIPCMethod } from './ipc-client';

// ==========================================
// バージョン IPC クライアント
// ==========================================

/**
 * プロジェクトのバージョン履歴を取得
 */
export const getVersionsByProject = createIPCMethod(
  api => api.version.getByProject,
  'バージョン履歴の取得に失敗しました'
);

/**
 * バージョンを作成
 */
export const createVersion = createIPCMethod(
  api => api.version.create,
  'バージョンの作成に失敗しました'
);

/**
 * バージョンを復元
 */
export const restoreVersion = createIPCMethod(
  api => api.version.restore,
  'バージョンの復元に失敗しました'
);

// ==========================================
// 名前空間エクスポート（互換性のため）
// ==========================================

export const versionIPC = {
  getByProject: getVersionsByProject,
  create: createVersion,
  restore: restoreVersion,
};
