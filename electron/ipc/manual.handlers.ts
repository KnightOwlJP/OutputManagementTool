import { ipcMain } from 'electron';
import { manualGenerator, GenerateOptions, ExportFormat } from '../services/ManualGenerator';

/**
 * マニュアル機能のIPCハンドラ
 * Phase 6.2.3 実装
 */

export function registerManualHandlers(): void {
  /**
   * マニュアル作成
   */
  ipcMain.handle(
    'manual:create',
    async (_, projectId: string, title: string, options: GenerateOptions) => {
      try {
        console.log(`[IPC] manual:create - Project: ${projectId}, Title: ${title}`);
        const manual = await manualGenerator.generateFromProcesses(projectId, title, options);
        console.log(`[IPC] manual:create完了 - Manual ID: ${manual.id}`);
        return manual;
      } catch (error) {
        console.error('[IPC] manual:create エラー:', error);
        throw error;
      }
    }
  );

  /**
   * マニュアル更新
   */
  ipcMain.handle(
    'manual:update',
    async (_, manualId: string, data: any) => {
      try {
        console.log(`[IPC] manual:update - Manual: ${manualId}`);
        // TODO: 実装
        return { success: true };
      } catch (error) {
        console.error('[IPC] manual:update エラー:', error);
        throw error;
      }
    }
  );

  /**
   * マニュアル削除
   */
  ipcMain.handle(
    'manual:delete',
    async (_, manualId: string) => {
      try {
        console.log(`[IPC] manual:delete - Manual: ${manualId}`);
        // TODO: 実装
        return { success: true };
      } catch (error) {
        console.error('[IPC] manual:delete エラー:', error);
        throw error;
      }
    }
  );

  /**
   * マニュアル一覧取得
   */
  ipcMain.handle(
    'manual:list',
    async (_, projectId: string) => {
      try {
        console.log(`[IPC] manual:list - Project: ${projectId}`);
        // TODO: 実装
        return [];
      } catch (error) {
        console.error('[IPC] manual:list エラー:', error);
        throw error;
      }
    }
  );

  /**
   * 工程からマニュアル自動生成
   */
  ipcMain.handle(
    'manual:generateFromProcesses',
    async (_, projectId: string, title: string, options: GenerateOptions) => {
      try {
        console.log(`[IPC] manual:generateFromProcesses - Project: ${projectId}`);
        const manual = await manualGenerator.generateFromProcesses(projectId, title, options);
        console.log(`[IPC] manual:generateFromProcesses完了 - ${manual.id}`);
        return manual;
      } catch (error) {
        console.error('[IPC] manual:generateFromProcesses エラー:', error);
        throw error;
      }
    }
  );

  /**
   * 工程からマニュアル同期
   */
  ipcMain.handle(
    'manual:syncFromProcesses',
    async (_, processId: string) => {
      try {
        console.log(`[IPC] manual:syncFromProcesses - Process: ${processId}`);
        const result = await manualGenerator.syncManualFromProcess(processId);
        console.log(`[IPC] manual:syncFromProcesses完了 - 更新数: ${result.updatedCount}`);
        return result;
      } catch (error) {
        console.error('[IPC] manual:syncFromProcesses エラー:', error);
        throw error;
      }
    }
  );

  /**
   * マニュアルエクスポート
   */
  ipcMain.handle(
    'manual:export',
    async (_, manualId: string, format: ExportFormat) => {
      try {
        console.log(`[IPC] manual:export - Manual: ${manualId}, Format: ${format}`);
        const content = await manualGenerator.exportManual(manualId, format);
        console.log(`[IPC] manual:export完了`);
        return content;
      } catch (error) {
        console.error('[IPC] manual:export エラー:', error);
        throw error;
      }
    }
  );

  console.log('[IPC] Manual handlers registered');
}
