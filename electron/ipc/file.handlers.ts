/**
 * ファイル操作関連のIPCハンドラー
 */

import { ipcMain, dialog, BrowserWindow } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

/**
 * ファイル操作IPCハンドラーを登録
 */
export function registerFileHandlers(): void {
  // ディレクトリ選択ダイアログ
  ipcMain.handle('file:selectDirectory', async () => {
    try {
      const mainWindow = BrowserWindow.getFocusedWindow();
      
      const result = await dialog.showOpenDialog(mainWindow || {}, {
        properties: ['openDirectory', 'createDirectory'],
        title: '保存先フォルダを選択',
        buttonLabel: '選択',
      });

      if (result.canceled || result.filePaths.length === 0) {
        return null;
      }

      const selectedPath = result.filePaths[0];
      
      // パスの存在確認
      if (!fs.existsSync(selectedPath)) {
        throw new Error('選択されたパスが存在しません');
      }

      // 書き込み権限の確認
      try {
        fs.accessSync(selectedPath, fs.constants.W_OK);
      } catch {
        throw new Error('選択されたフォルダに書き込み権限がありません');
      }

      return selectedPath;
    } catch (error) {
      console.error('[FileHandlers] selectDirectory error:', error);
      throw error;
    }
  });

  // ファイル選択ダイアログ
  ipcMain.handle('file:selectFile', async (_event, options?: {
    title?: string;
    filters?: { name: string; extensions: string[] }[];
    defaultPath?: string;
    multiSelections?: boolean;
  }) => {
    try {
      const mainWindow = BrowserWindow.getFocusedWindow();
      
      const result = await dialog.showOpenDialog(mainWindow || {}, {
        properties: options?.multiSelections 
          ? ['openFile', 'multiSelections'] 
          : ['openFile'],
        title: options?.title || 'ファイルを選択',
        buttonLabel: '選択',
        filters: options?.filters || [
          { name: 'すべてのファイル', extensions: ['*'] },
        ],
        defaultPath: options?.defaultPath,
      });

      if (result.canceled || result.filePaths.length === 0) {
        return null;
      }

      return options?.multiSelections ? result.filePaths : result.filePaths[0];
    } catch (error) {
      console.error('[FileHandlers] selectFile error:', error);
      throw error;
    }
  });

  // ファイル保存ダイアログ
  ipcMain.handle('file:saveDialog', async (_event, options?: {
    title?: string;
    defaultPath?: string;
    filters?: { name: string; extensions: string[] }[];
  }) => {
    try {
      const mainWindow = BrowserWindow.getFocusedWindow();
      
      const result = await dialog.showSaveDialog(mainWindow || {}, {
        title: options?.title || 'ファイルを保存',
        buttonLabel: '保存',
        defaultPath: options?.defaultPath,
        filters: options?.filters || [
          { name: 'すべてのファイル', extensions: ['*'] },
        ],
      });

      if (result.canceled || !result.filePath) {
        return null;
      }

      return result.filePath;
    } catch (error) {
      console.error('[FileHandlers] saveDialog error:', error);
      throw error;
    }
  });

  // パスの存在確認
  ipcMain.handle('file:exists', async (_event, filePath: string) => {
    try {
      return fs.existsSync(filePath);
    } catch (error) {
      console.error('[FileHandlers] exists error:', error);
      return false;
    }
  });

  // パスの正規化
  ipcMain.handle('file:normalizePath', async (_event, ...paths: string[]) => {
    try {
      return path.normalize(path.join(...paths));
    } catch (error) {
      console.error('[FileHandlers] normalizePath error:', error);
      throw error;
    }
  });

  // ディレクトリ作成
  ipcMain.handle('file:createDirectory', async (_event, dirPath: string) => {
    try {
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
      return true;
    } catch (error) {
      console.error('[FileHandlers] createDirectory error:', error);
      throw error;
    }
  });

  // ファイル読み込み
  ipcMain.handle('file:readFile', async (_event, filePath: string, encoding?: BufferEncoding) => {
    try {
      if (!fs.existsSync(filePath)) {
        throw new Error(`ファイルが存在しません: ${filePath}`);
      }
      return fs.readFileSync(filePath, encoding || 'utf-8');
    } catch (error) {
      console.error('[FileHandlers] readFile error:', error);
      throw error;
    }
  });

  // ファイル書き込み
  ipcMain.handle('file:writeFile', async (_event, filePath: string, data: string | Buffer, encoding?: BufferEncoding) => {
    try {
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(filePath, data, encoding || 'utf-8');
      return true;
    } catch (error) {
      console.error('[FileHandlers] writeFile error:', error);
      throw error;
    }
  });

  console.log('[FileHandlers] File handlers registered');
}
