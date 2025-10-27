import { ipcMain, app, BrowserWindow } from 'electron';
import { getLogger } from '../utils/logger';
import { syncEngine, SyncOptions } from '../services/SyncEngine';

const logger = getLogger();

let syncIntervalId: NodeJS.Timeout | null = null;
let currentSettings = {
  enabled: false,
  intervalMinutes: 5,
  projectId: '',
  bpmnId: '',
  bpmnToProcessEnabled: true,
  processToBpmnEnabled: true,
  processToManualEnabled: true,
  conflictResolution: 'manual' as 'manual' | 'bpmn-priority' | 'process-priority',
};

/**
 * 同期スケジューラーを開始
 */
export function startSyncScheduler(
  projectId: string,
  bpmnId: string,
  intervalMinutes: number,
  options: {
    bpmnToProcessEnabled?: boolean;
    processToBpmnEnabled?: boolean;
    processToManualEnabled?: boolean;
    conflictResolution?: 'manual' | 'bpmn-priority' | 'process-priority';
  } = {}
): void {
  // 既存のスケジューラーを停止
  stopSyncScheduler();

  currentSettings = {
    enabled: true,
    intervalMinutes,
    projectId,
    bpmnId,
    bpmnToProcessEnabled: options.bpmnToProcessEnabled ?? true,
    processToBpmnEnabled: options.processToBpmnEnabled ?? true,
    processToManualEnabled: options.processToManualEnabled ?? true,
    conflictResolution: options.conflictResolution ?? 'manual',
  };

  // 自動同期を実行
  const runAutoSync = async () => {
    try {
      logger.info('sync-scheduler', `Starting automatic sync for project ${projectId}...`);
      
      const syncOptions: SyncOptions = {
        autoSync: true,
        direction: 'bidirectional',
        conflictResolution: currentSettings.conflictResolution,
      };

      let totalSynced = 0;
      let hasErrors = false;

      // BPMN → 工程表同期
      if (currentSettings.bpmnToProcessEnabled) {
        try {
          // BPMNのXMLコンテンツを取得（実装: データベースから取得）
          // 簡略化のため、ここではスキップ（実際はBPMN XMLを取得する必要がある）
          logger.info('sync-scheduler', 'BPMN → Process sync: Enabled but requires BPMN XML');
        } catch (error) {
          logger.error('sync-scheduler', `BPMN → Process sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
          hasErrors = true;
        }
      }

      // 工程表 → BPMN同期
      if (currentSettings.processToBpmnEnabled) {
        try {
          const result = await syncEngine.syncProcessesToBpmn(projectId, bpmnId, syncOptions);
          if (result.success) {
            totalSynced += result.syncedCount;
            logger.info('sync-scheduler', `Process → BPMN sync: ${result.syncedCount} items synced`);
          } else {
            logger.error('sync-scheduler', `Process → BPMN sync failed: ${result.errors.join(', ')}`);
            hasErrors = true;
          }
        } catch (error) {
          logger.error('sync-scheduler', `Process → BPMN sync error: ${error instanceof Error ? error.message : 'Unknown error'}`);
          hasErrors = true;
        }
      }

      // 工程表 → マニュアル同期
      if (currentSettings.processToManualEnabled) {
        try {
          // マニュアル同期の実装（Phase 7で実装予定）
          logger.info('sync-scheduler', 'Process → Manual sync: Feature pending implementation');
        } catch (error) {
          logger.error('sync-scheduler', `Process → Manual sync error: ${error instanceof Error ? error.message : 'Unknown error'}`);
          hasErrors = true;
        }
      }

      if (hasErrors) {
        logger.warn('sync-scheduler', 'Automatic sync completed with errors');
        notifyRenderer('sync-error', { projectId, message: '自動同期でエラーが発生しました' });
      } else {
        logger.info('sync-scheduler', `Automatic sync completed: ${totalSynced} items synced`);
        notifyRenderer('sync-success', { projectId, syncedCount: totalSynced });
      }
    } catch (error) {
      logger.error('sync-scheduler', `Automatic sync error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      notifyRenderer('sync-error', { projectId, message: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  // 即座に1回実行（起動時同期）
  runAutoSync();

  // 定期実行をスケジュール
  const intervalMs = intervalMinutes * 60 * 1000;
  syncIntervalId = setInterval(runAutoSync, intervalMs);

  logger.info('sync-scheduler', `Sync scheduler started (project: ${projectId}, interval: ${intervalMinutes}m)`);
}

/**
 * 同期スケジューラーを停止
 */
export function stopSyncScheduler(): void {
  if (syncIntervalId) {
    clearInterval(syncIntervalId);
    syncIntervalId = null;
    currentSettings.enabled = false;
    logger.info('sync-scheduler', 'Sync scheduler stopped');
  }
}

/**
 * スケジューラーの状態を取得
 */
export function getSchedulerStatus(): {
  enabled: boolean;
  intervalMinutes: number;
  projectId: string;
  bpmnId: string;
  bpmnToProcessEnabled: boolean;
  processToBpmnEnabled: boolean;
  processToManualEnabled: boolean;
  conflictResolution: string;
} {
  return { ...currentSettings };
}

/**
 * レンダラープロセスに通知を送信
 */
function notifyRenderer(channel: string, data: any): void {
  const windows = BrowserWindow.getAllWindows();
  windows.forEach(window => {
    window.webContents.send(channel, data);
  });
}

/**
 * IPCハンドラーを登録
 */
export function registerSyncSchedulerHandlers(): void {
  // スケジューラーを開始
  ipcMain.handle('sync-scheduler:start', async (
    _,
    projectId: string,
    bpmnId: string,
    intervalMinutes: number,
    options?: {
      bpmnToProcessEnabled?: boolean;
      processToBpmnEnabled?: boolean;
      processToManualEnabled?: boolean;
      conflictResolution?: 'manual' | 'bpmn-priority' | 'process-priority';
    }
  ) => {
    try {
      startSyncScheduler(projectId, bpmnId, intervalMinutes, options || {});
      return { success: true };
    } catch (error) {
      logger.error('sync-scheduler', `Failed to start scheduler: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to start sync scheduler' };
    }
  });

  // スケジューラーを停止
  ipcMain.handle('sync-scheduler:stop', async () => {
    try {
      stopSyncScheduler();
      return { success: true };
    } catch (error) {
      logger.error('sync-scheduler', `Failed to stop scheduler: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to stop sync scheduler' };
    }
  });

  // スケジューラーの状態を取得
  ipcMain.handle('sync-scheduler:status', async () => {
    try {
      return { success: true, status: getSchedulerStatus() };
    } catch (error) {
      logger.error('sync-scheduler', `Failed to get scheduler status: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to get scheduler status' };
    }
  });

  logger.info('sync-scheduler', 'Sync scheduler IPC handlers registered');
}

// アプリ終了時にスケジューラーをクリーンアップ
app.on('before-quit', () => {
  stopSyncScheduler();
});
