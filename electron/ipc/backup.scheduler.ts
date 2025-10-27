import { ipcMain, app } from 'electron';
import { createBackup, cleanupOldBackups } from './backup.handlers';
import { getLogger } from '../utils/logger';

const logger = getLogger();

let backupIntervalId: NodeJS.Timeout | null = null;
let currentSettings = {
  enabled: false,
  intervalHours: 24,
  maxBackups: 10,
  customPath: '',
};

/**
 * バックアップスケジューラーを開始
 */
export function startBackupScheduler(
  intervalHours: number,
  maxBackups: number,
  customPath?: string
): void {
  // 既存のスケジューラーを停止
  stopBackupScheduler();

  currentSettings = {
    enabled: true,
    intervalHours,
    maxBackups,
    customPath: customPath || '',
  };

  // 自動バックアップを実行
  const runAutoBackup = async () => {
    try {
      logger.info('backup-scheduler', 'Starting automatic backup...');
      
      const result = await createBackup(customPath, true);
      
      if (result.success) {
        logger.info('backup-scheduler', `Automatic backup created: ${result.backupPath}`);
        
        // 古いバックアップをクリーンアップ
        await cleanupOldBackups(maxBackups, customPath);
        logger.info('backup-scheduler', 'Old backups cleaned up');
      } else {
        logger.error('backup-scheduler', `Automatic backup failed: ${result.error}`);
      }
    } catch (error) {
      logger.error('backup-scheduler', `Automatic backup error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // 即座に1回実行（起動時バックアップ）
  runAutoBackup();

  // 定期実行をスケジュール
  const intervalMs = intervalHours * 60 * 60 * 1000;
  backupIntervalId = setInterval(runAutoBackup, intervalMs);

  logger.info('backup-scheduler', `Backup scheduler started (interval: ${intervalHours}h, max: ${maxBackups})`);
}

/**
 * バックアップスケジューラーを停止
 */
export function stopBackupScheduler(): void {
  if (backupIntervalId) {
    clearInterval(backupIntervalId);
    backupIntervalId = null;
    currentSettings.enabled = false;
    logger.info('backup-scheduler', 'Backup scheduler stopped');
  }
}

/**
 * スケジューラーの状態を取得
 */
export function getSchedulerStatus(): {
  enabled: boolean;
  intervalHours: number;
  maxBackups: number;
  customPath: string;
} {
  return { ...currentSettings };
}

/**
 * IPCハンドラーを登録
 */
export function registerBackupSchedulerHandlers(): void {
  // スケジューラーを開始
  ipcMain.handle('backup-scheduler:start', async (_, intervalHours: number, maxBackups: number, customPath?: string) => {
    try {
      startBackupScheduler(intervalHours, maxBackups, customPath);
      return { success: true };
    } catch (error) {
      logger.error('backup-scheduler', `Failed to start scheduler: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to start backup scheduler' };
    }
  });

  // スケジューラーを停止
  ipcMain.handle('backup-scheduler:stop', async () => {
    try {
      stopBackupScheduler();
      return { success: true };
    } catch (error) {
      logger.error('backup-scheduler', `Failed to stop scheduler: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to stop backup scheduler' };
    }
  });

  // スケジューラーの状態を取得
  ipcMain.handle('backup-scheduler:status', async () => {
    try {
      return { success: true, status: getSchedulerStatus() };
    } catch (error) {
      logger.error('backup-scheduler', `Failed to get scheduler status: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to get scheduler status' };
    }
  });

  logger.info('backup-scheduler', 'Backup scheduler IPC handlers registered');
}

// アプリ終了時にスケジューラーをクリーンアップ
app.on('before-quit', () => {
  stopBackupScheduler();
});
