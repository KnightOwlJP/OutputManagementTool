/**
 * ファイル操作関連 IPC クライアント
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
type FileAPI = ElectronAPI['file'];

// ==========================================
// ファイル IPC クライアント
// ==========================================

/**
 * Excelファイルをインポート
 */
export async function importExcel(
  projectId: string,
  filePath: string
): Promise<Result<Awaited<ReturnType<FileAPI['importExcel']>>, IPCError>> {
  const apiResult = getElectronAPISafe();
  if (!apiResult.success) return apiResult;

  return ipcCall(
    () => apiResult.data!.file.importExcel(projectId, filePath),
    { errorMessage: 'Excelファイルのインポートに失敗しました' }
  );
}

/**
 * Excelファイルをエクスポート
 */
export async function exportExcel(
  projectId: string,
  fileName: string
): Promise<Result<Awaited<ReturnType<FileAPI['exportExcel']>>, IPCError>> {
  const apiResult = getElectronAPISafe();
  if (!apiResult.success) return apiResult;

  return ipcCall(
    () => apiResult.data!.file.exportExcel(projectId, fileName),
    { errorMessage: 'Excelファイルのエクスポートに失敗しました' }
  );
}

/**
 * ファイルダイアログを開く
 */
export async function openFileDialog(
  options?: Parameters<FileAPI['openFileDialog']>[0]
): Promise<Result<Awaited<ReturnType<FileAPI['openFileDialog']>>, IPCError>> {
  const apiResult = getElectronAPISafe();
  if (!apiResult.success) return apiResult;

  return ipcCall(
    () => apiResult.data!.file.openFileDialog(options),
    { errorMessage: 'ファイルダイアログのオープンに失敗しました' }
  );
}

/**
 * 保存ダイアログを開く
 */
export async function saveFileDialog(
  options?: Parameters<FileAPI['saveFileDialog']>[0]
): Promise<Result<Awaited<ReturnType<FileAPI['saveFileDialog']>>, IPCError>> {
  const apiResult = getElectronAPISafe();
  if (!apiResult.success) return apiResult;

  return ipcCall(
    () => apiResult.data!.file.saveFileDialog(options),
    { errorMessage: '保存ダイアログのオープンに失敗しました' }
  );
}

// ==========================================
// 名前空間エクスポート（互換性のため）
// ==========================================

export const fileIPC = {
  importExcel,
  exportExcel,
  openFileDialog,
  saveFileDialog,
};
