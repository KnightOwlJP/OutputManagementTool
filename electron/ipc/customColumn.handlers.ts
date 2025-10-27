import { ipcMain } from 'electron';
import { getDatabase } from '../utils/database';

/**
 * カスタム列管理のIPCハンドラー
 */
export function registerCustomColumnHandlers() {
  console.log('[CustomColumn] Registering IPC handlers...');

  // カスタム列を作成
  ipcMain.handle('customColumn:create', async (_, data) => {
    const db = getDatabase();
    const id = `custom_col_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = Date.now();

    // 最大表示順序を取得
    const maxOrder = db.prepare(`
      SELECT COALESCE(MAX(display_order), -1) as max_order
      FROM custom_columns
      WHERE project_id = ?
    `).get(data.projectId) as { max_order: number };

    const stmt = db.prepare(`
      INSERT INTO custom_columns (
        id, project_id, column_name, column_type, is_required,
        default_value, select_options, display_order, is_visible,
        description, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      data.projectId,
      data.columnName,
      data.columnType,
      data.isRequired ? 1 : 0,
      data.defaultValue || null,
      data.selectOptions ? JSON.stringify(data.selectOptions) : null,
      maxOrder.max_order + 1,
      data.isVisible !== false ? 1 : 0,
      data.description || null,
      now,
      now
    );

    console.log(`[CustomColumn] Created custom column: ${id}`);
    return { id, ...data, displayOrder: maxOrder.max_order + 1, createdAt: now, updatedAt: now };
  });

  // プロジェクトのカスタム列一覧を取得
  ipcMain.handle('customColumn:getByProject', async (_, projectId: string) => {
    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT
        id, project_id, column_name, column_type, is_required,
        default_value, select_options, display_order, is_visible,
        description, created_at, updated_at
      FROM custom_columns
      WHERE project_id = ?
      ORDER BY display_order ASC
    `);

    const rows = stmt.all(projectId) as any[];
    console.log(`[CustomColumn] Retrieved ${rows.length} custom columns for project ${projectId}`);

    return rows.map(row => ({
      id: row.id,
      projectId: row.project_id,
      columnName: row.column_name,
      columnType: row.column_type,
      isRequired: Boolean(row.is_required),
      defaultValue: row.default_value,
      selectOptions: row.select_options ? JSON.parse(row.select_options) : null,
      displayOrder: row.display_order,
      isVisible: Boolean(row.is_visible),
      description: row.description,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    }));
  });

  // カスタム列を取得
  ipcMain.handle('customColumn:getById', async (_, id: string) => {
    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT
        id, project_id, column_name, column_type, is_required,
        default_value, select_options, display_order, is_visible,
        description, created_at, updated_at
      FROM custom_columns
      WHERE id = ?
    `);

    const row = stmt.get(id) as any;
    if (!row) return null;

    return {
      id: row.id,
      projectId: row.project_id,
      columnName: row.column_name,
      columnType: row.column_type,
      isRequired: Boolean(row.is_required),
      defaultValue: row.default_value,
      selectOptions: row.select_options ? JSON.parse(row.select_options) : null,
      displayOrder: row.display_order,
      isVisible: Boolean(row.is_visible),
      description: row.description,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  });

  // カスタム列を更新
  ipcMain.handle('customColumn:update', async (_, id: string, data: any) => {
    const db = getDatabase();
    const updates: string[] = [];
    const values: any[] = [];

    if (data.columnName !== undefined) {
      updates.push('column_name = ?');
      values.push(data.columnName);
    }
    if (data.columnType !== undefined) {
      updates.push('column_type = ?');
      values.push(data.columnType);
    }
    if (data.isRequired !== undefined) {
      updates.push('is_required = ?');
      values.push(data.isRequired ? 1 : 0);
    }
    if (data.defaultValue !== undefined) {
      updates.push('default_value = ?');
      values.push(data.defaultValue);
    }
    if (data.selectOptions !== undefined) {
      updates.push('select_options = ?');
      values.push(data.selectOptions ? JSON.stringify(data.selectOptions) : null);
    }
    if (data.isVisible !== undefined) {
      updates.push('is_visible = ?');
      values.push(data.isVisible ? 1 : 0);
    }
    if (data.description !== undefined) {
      updates.push('description = ?');
      values.push(data.description);
    }
    if (data.displayOrder !== undefined) {
      updates.push('display_order = ?');
      values.push(data.displayOrder);
    }

    updates.push('updated_at = ?');
    values.push(Date.now());

    values.push(id);

    const stmt = db.prepare(`
      UPDATE custom_columns
      SET ${updates.join(', ')}
      WHERE id = ?
    `);

    stmt.run(...values);
    console.log(`[CustomColumn] Updated custom column: ${id}`);

    // 更新後のデータを返す
    return ipcMain.emit('customColumn:getById', null, id);
  });

  // カスタム列を削除
  ipcMain.handle('customColumn:delete', async (_, id: string) => {
    const db = getDatabase();

    // 関連するカスタム値も削除
    db.prepare('DELETE FROM process_custom_values WHERE custom_column_id = ?').run(id);
    db.prepare('DELETE FROM custom_columns WHERE id = ?').run(id);

    console.log(`[CustomColumn] Deleted custom column: ${id}`);
    return true;
  });

  // カスタム列の並び替え
  ipcMain.handle('customColumn:reorder', async (_, projectId: string, columnIds: string[]) => {
    const db = getDatabase();
    const stmt = db.prepare(`
      UPDATE custom_columns
      SET display_order = ?, updated_at = ?
      WHERE id = ? AND project_id = ?
    `);

    const now = Date.now();
    db.transaction(() => {
      columnIds.forEach((id, index) => {
        stmt.run(index, now, id, projectId);
      });
    })();

    console.log(`[CustomColumn] Reordered ${columnIds.length} columns`);
    return true;
  });

  console.log('[CustomColumn] IPC handlers registered');
}
