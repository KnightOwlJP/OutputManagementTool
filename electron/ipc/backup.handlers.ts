/**
 * バックアップ管理IPCハンドラー
 * 
 * 機能:
 * - データベースの自動バックアップ
 * - バックアップファイルの管理（作成、一覧、削除）
 * - バックアップからの復元
 */

import { ipcMain, dialog, app } from 'electron';
import * as fs from 'fs-extra';
import * as path from 'path';
import { getLogger } from '../utils/logger';

const logger = getLogger();

// データベースパスを取得
function getDatabasePath(): string {
  const userDataPath = app.getPath('userData');
  const dbDir = path.join(userDataPath, 'data');
  return path.join(dbDir, 'output-management.db');
}

interface BackupInfo {
  id: string;
  filename: string;
  filePath: string;
  size: number;
  createdAt: Date;
  isAutomatic: boolean;
}

interface BackupResult {
  success: boolean;
  backupPath?: string;
  error?: string;
}

interface BackupListResult {
  success: boolean;
  backups?: BackupInfo[];
  error?: string;
}

// バックアップディレクトリのパス
function getBackupDirectory(customPath?: string): string {
  if (customPath && customPath.trim()) {
    return customPath;
  }
  
  const dbPath = getDatabasePath();
  const dbDir = path.dirname(dbPath);
  return path.join(dbDir, 'backups');
}

// バックアップディレクトリの作成
async function ensureBackupDirectory(backupPath: string): Promise<void> {
  await fs.ensureDir(backupPath);
}

// バックアップファイル名の生成
function generateBackupFilename(isAutomatic: boolean = false): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const prefix = isAutomatic ? 'auto' : 'manual';
  return `${prefix}_backup_${timestamp}.db`;
}

/**
 * データベースのバックアップを作成
 */
export async function createBackup(
  customPath?: string,
  isAutomatic: boolean = false
): Promise<BackupResult> {
  try {
    const backupDir = getBackupDirectory(customPath);
    await ensureBackupDirectory(backupDir);
    
    const dbPath = getDatabasePath();
    const backupFilename = generateBackupFilename(isAutomatic);
    const backupPath = path.join(backupDir, backupFilename);
    
    // データベースファイルをコピー
    await fs.copy(dbPath, backupPath);
    
    logger.info('backup', `Backup created: ${backupPath}`);
    
    return {
      success: true,
      backupPath,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('backup', `Failed to create backup: ${message}`);
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * バックアップ一覧を取得
 */
async function listBackups(customPath?: string): Promise<BackupListResult> {
  try {
    const backupDir = getBackupDirectory(customPath);
    
    // ディレクトリが存在しない場合は空配列を返す
    if (!await fs.pathExists(backupDir)) {
      return {
        success: true,
        backups: [],
      };
    }
    
    const files = await fs.readdir(backupDir);
    const backupFiles = files.filter(f => f.endsWith('.db'));
    
    const backups: BackupInfo[] = await Promise.all(
      backupFiles.map(async (filename) => {
        const filePath = path.join(backupDir, filename);
        const stats = await fs.stat(filePath);
        const isAutomatic = filename.startsWith('auto_');
        
        return {
          id: filename,
          filename,
          filePath,
          size: stats.size,
          createdAt: stats.birthtime,
          isAutomatic,
        };
      })
    );
    
    // 作成日時でソート（新しい順）
    backups.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    return {
      success: true,
      backups,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('backup', `Failed to list backups: ${message}`);
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * バックアップから復元
 */
async function restoreBackup(backupPath: string): Promise<BackupResult> {
  try {
    // バックアップファイルの存在確認
    if (!await fs.pathExists(backupPath)) {
      throw new Error('Backup file not found');
    }
    
    const dbPath = getDatabasePath();
    
    // 現在のデータベースをバックアップ（念のため）
    const emergencyBackupPath = `${dbPath}.before-restore`;
    await fs.copy(dbPath, emergencyBackupPath);
    
    try {
      // バックアップから復元
      await fs.copy(backupPath, dbPath, { overwrite: true });
      
      logger.info('backup', `Database restored from: ${backupPath}`);
      
      // 緊急バックアップを削除
      await fs.remove(emergencyBackupPath);
      
      return {
        success: true,
      };
    } catch (error) {
      // 復元に失敗した場合、緊急バックアップから元に戻す
      await fs.copy(emergencyBackupPath, dbPath, { overwrite: true });
      await fs.remove(emergencyBackupPath);
      throw error;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('backup', `Failed to restore backup: ${message}`);
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * バックアップファイルを削除
 */
async function deleteBackup(backupPath: string): Promise<BackupResult> {
  try {
    await fs.remove(backupPath);
    logger.info('backup', `Backup deleted: ${backupPath}`);
    
    return {
      success: true,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('backup', `Failed to delete backup: ${message}`);
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * 古いバックアップを削除（最大数を超えた場合）
 */
export async function cleanupOldBackups(
  maxBackups: number,
  customPath?: string
): Promise<void> {
  try {
    const result = await listBackups(customPath);
    
    if (!result.success || !result.backups) {
      return;
    }
    
    const backups = result.backups;
    
    // 最大数を超えている場合、古いものから削除
    if (backups.length > maxBackups) {
      const toDelete = backups.slice(maxBackups);
      
      for (const backup of toDelete) {
        await deleteBackup(backup.filePath);
      }
      
      logger.info('backup', `Cleaned up ${toDelete.length} old backups`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('backup', `Failed to cleanup old backups: ${message}`);
  }
}

/**
 * バックアップディレクトリを選択
 */
async function selectBackupDirectory(): Promise<string | null> {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory', 'createDirectory'],
    title: 'バックアップ保存先を選択',
  });
  
  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }
  
  return result.filePaths[0];
}

/**
 * IPCハンドラーの登録
 */
export function registerBackupHandlers() {
  // バックアップ作成
  ipcMain.handle('backup:create', async (_event, customPath?: string, isAutomatic: boolean = false) => {
    return createBackup(customPath, isAutomatic);
  });
  
  // バックアップ一覧取得
  ipcMain.handle('backup:list', async (_event, customPath?: string) => {
    return listBackups(customPath);
  });
  
  // バックアップから復元
  ipcMain.handle('backup:restore', async (_event, backupPath: string) => {
    return restoreBackup(backupPath);
  });
  
  // バックアップ削除
  ipcMain.handle('backup:delete', async (_event, backupPath: string) => {
    return deleteBackup(backupPath);
  });
  
  // 古いバックアップのクリーンアップ
  ipcMain.handle('backup:cleanup', async (_event, maxBackups: number, customPath?: string) => {
    await cleanupOldBackups(maxBackups, customPath);
    return { success: true };
  });
  
  // バックアップディレクトリ選択
  ipcMain.handle('backup:selectDirectory', async () => {
    return selectBackupDirectory();
  });
  
  logger.info('backup', 'Backup handlers registered');
}
