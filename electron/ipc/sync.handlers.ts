import { ipcMain } from 'electron';
import { syncEngine, SyncOptions, SyncResult } from '../services/SyncEngine';

/**
 * BPMN ⇔ 工程表 同期機能のIPCハンドラ
 * Phase 6.1.2 実装
 */

export function registerSyncHandlers(): void {
  /**
   * BPMN → 工程表への同期
   */
  ipcMain.handle(
    'sync:bpmnToProcesses',
    async (
      _,
      projectId: string,
      bpmnXml: string,
      options?: SyncOptions
    ): Promise<SyncResult> => {
      try {
        console.log(`[IPC] sync:bpmnToProcesses - Project: ${projectId}`);
        const result = await syncEngine.syncBpmnToProcesses(projectId, bpmnXml, options);
        console.log(`[IPC] sync:bpmnToProcesses完了 - 同期数: ${result.syncedCount}`);
        return result;
      } catch (error) {
        console.error('[IPC] sync:bpmnToProcesses エラー:', error);
        return {
          success: false,
          syncedCount: 0,
          errors: [error instanceof Error ? error.message : String(error)],
          conflicts: []
        };
      }
    }
  );

  /**
   * 工程表 → BPMNへの同期
   */
  ipcMain.handle(
    'sync:processesToBpmn',
    async (
      _,
      projectId: string,
      bpmnId: string,
      options?: SyncOptions
    ): Promise<SyncResult> => {
      try {
        console.log(`[IPC] sync:processesToBpmn - Project: ${projectId}, BPMN: ${bpmnId}`);
        const result = await syncEngine.syncProcessesToBpmn(projectId, bpmnId, options);
        console.log(`[IPC] sync:processesToBpmn完了 - 同期数: ${result.syncedCount}`);
        return result;
      } catch (error) {
        console.error('[IPC] sync:processesToBpmn エラー:', error);
        return {
          success: false,
          syncedCount: 0,
          errors: [error instanceof Error ? error.message : String(error)],
          conflicts: []
        };
      }
    }
  );

  /**
   * 双方向同期
   */
  ipcMain.handle(
    'sync:bidirectional',
    async (
      _,
      projectId: string,
      bpmnId: string,
      bpmnXml: string,
      options?: SyncOptions
    ): Promise<{ bpmnToProcess: SyncResult; processToBpmn: SyncResult }> => {
      try {
        console.log(`[IPC] sync:bidirectional - Project: ${projectId}`);
        
        // BPMN → 工程
        const bpmnToProcess = await syncEngine.syncBpmnToProcesses(
          projectId,
          bpmnXml,
          { ...options, direction: 'bpmn-to-process' }
        );
        
        // 工程 → BPMN
        const processToBpmn = await syncEngine.syncProcessesToBpmn(
          projectId,
          bpmnId,
          { ...options, direction: 'process-to-bpmn' }
        );
        
        console.log('[IPC] sync:bidirectional完了');
        return { bpmnToProcess, processToBpmn };
      } catch (error) {
        console.error('[IPC] sync:bidirectional エラー:', error);
        const errorResult: SyncResult = {
          success: false,
          syncedCount: 0,
          errors: [error instanceof Error ? error.message : String(error)],
          conflicts: []
        };
        return { bpmnToProcess: errorResult, processToBpmn: errorResult };
      }
    }
  );

  /**
   * BPMN Element IDで工程を検索
   */
  ipcMain.handle(
    'sync:getProcessByBpmnElementId',
    async (_, bpmnElementId: string) => {
      try {
        console.log(`[IPC] sync:getProcessByBpmnElementId - Element: ${bpmnElementId}`);
        const process = syncEngine.getProcessByBpmnElementId(bpmnElementId);
        return process;
      } catch (error) {
        console.error('[IPC] sync:getProcessByBpmnElementId エラー:', error);
        return null;
      }
    }
  );

  /**
   * 競合解決
   */
  ipcMain.handle(
    'sync:resolveConflict',
    async (_, conflict: any, resolution: 'use-bpmn' | 'use-process' | 'merge'): Promise<boolean> => {
      try {
        console.log(`[IPC] sync:resolveConflict - Resolution: ${resolution}`);
        const success = await syncEngine.resolveConflict(conflict, resolution);
        return success;
      } catch (error) {
        console.error('[IPC] sync:resolveConflict エラー:', error);
        return false;
      }
    }
  );

  /**
   * リアルタイム監視開始
   */
  ipcMain.handle(
    'sync:startWatch',
    async (_, projectId: string) => {
      try {
        console.log(`[IPC] sync:startWatch - Project: ${projectId}`);
        await syncEngine.watchChanges(projectId, (changes) => {
          // 変更を通知（実装: webContentsを使用してレンダラーに送信）
          console.log('[SyncEngine] 変更検出:', changes);
        });
        return { success: true };
      } catch (error) {
        console.error('[IPC] sync:startWatch エラー:', error);
        return { success: false, error: error instanceof Error ? error.message : String(error) };
      }
    }
  );

  /**
   * リアルタイム監視停止
   */
  ipcMain.handle('sync:stopWatch', async () => {
    try {
      console.log('[IPC] sync:stopWatch');
      syncEngine.stopWatching();
      return { success: true };
    } catch (error) {
      console.error('[IPC] sync:stopWatch エラー:', error);
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  });

  console.log('[IPC] Sync handlers registered');
}
