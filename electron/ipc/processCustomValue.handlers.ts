import { ipcMain } from 'electron';
import { getDatabase } from '../utils/database';

/**
 * プロセスカスタム値管理のIPCハンドラー
 */
export function registerProcessCustomValueHandlers() {
  console.log('[ProcessCustomValue] Registering IPC handlers...');

  // カスタム値を設定
  ipcMain.handle('processCustomValue:set', async (_, processId: string, customColumnId: string, value: string) => {
    const db = getDatabase();
    const now = Date.now();

    // 既存の値を確認
    const existing = db.prepare(`
      SELECT id FROM process_custom_values
      WHERE process_id = ? AND custom_column_id = ?
    `).get(processId, customColumnId) as { id: string } | undefined;

    if (existing) {
      // 更新
      db.prepare(`
        UPDATE process_custom_values
        SET value = ?, updated_at = ?
        WHERE id = ?
      `).run(value, now, existing.id);

      console.log(`[ProcessCustomValue] Updated value for process ${processId}, column ${customColumnId}`);
      return { id: existing.id, processId, customColumnId, value, updatedAt: now };
    } else {
      // 新規作成
      const id = `custom_val_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      db.prepare(`
        INSERT INTO process_custom_values (id, process_id, custom_column_id, value, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(id, processId, customColumnId, value, now, now);

      console.log(`[ProcessCustomValue] Created value for process ${processId}, column ${customColumnId}`);
      return { id, processId, customColumnId, value, createdAt: now, updatedAt: now };
    }
  });

  // カスタム値を取得
  ipcMain.handle('processCustomValue:get', async (_, processId: string, customColumnId: string) => {
    const db = getDatabase();
    const row = db.prepare(`
      SELECT id, process_id, custom_column_id, value, created_at, updated_at
      FROM process_custom_values
      WHERE process_id = ? AND custom_column_id = ?
    `).get(processId, customColumnId) as any;

    if (!row) return null;

    return {
      id: row.id,
      processId: row.process_id,
      customColumnId: row.custom_column_id,
      value: row.value,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  });

  // プロセスの全カスタム値を取得
  ipcMain.handle('processCustomValue:getByProcess', async (_, processId: string) => {
    const db = getDatabase();
    const rows = db.prepare(`
      SELECT
        pcv.id, pcv.process_id, pcv.custom_column_id, pcv.value,
        pcv.created_at, pcv.updated_at,
        cc.column_name, cc.column_type
      FROM process_custom_values pcv
      JOIN custom_columns cc ON pcv.custom_column_id = cc.id
      WHERE pcv.process_id = ?
      ORDER BY cc.display_order ASC
    `).all(processId) as any[];

    console.log(`[ProcessCustomValue] Retrieved ${rows.length} custom values for process ${processId}`);

    return rows.map(row => ({
      id: row.id,
      processId: row.process_id,
      customColumnId: row.custom_column_id,
      value: row.value,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      columnName: row.column_name,
      columnType: row.column_type,
    }));
  });

  // カスタム値を削除
  ipcMain.handle('processCustomValue:delete', async (_, processId: string, customColumnId: string) => {
    const db = getDatabase();
    db.prepare(`
      DELETE FROM process_custom_values
      WHERE process_id = ? AND custom_column_id = ?
    `).run(processId, customColumnId);

    console.log(`[ProcessCustomValue] Deleted value for process ${processId}, column ${customColumnId}`);
    return true;
  });

  console.log('[ProcessCustomValue] IPC handlers registered');
}
