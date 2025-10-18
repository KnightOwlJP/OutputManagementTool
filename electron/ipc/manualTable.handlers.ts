import { ipcMain } from 'electron';
import { getDatabase } from '../utils/database';
import { getLogger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

const logger = getLogger();

// ProcessLevel型を再定義（electron側で型を共有）
type ProcessLevel = 'large' | 'medium' | 'small' | 'detail';

interface ManualTable {
  id: string;
  projectId: string;
  name: string;
  level: ProcessLevel;
  description?: string;
  processTableId?: string;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}

/**
 * マニュアルグループ（ManualTable）関連のIPCハンドラーを登録
 */
export function registerManualTableHandlers(): void {

// マニュアルグループ作成
ipcMain.handle('manualTable:create', async (_, data: {
  projectId: string;
  name: string;
  level: ProcessLevel;
  description?: string;
  processTableId?: string;
  displayOrder?: number;
}) => {
  const db = getDatabase();
  const id = uuidv4();
  const now = Date.now();

  const stmt = db.prepare(`
    INSERT INTO manual_tables (
      id, project_id, name, level, description, process_table_id,
      display_order, created_at, updated_at, metadata
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id,
    data.projectId,
    data.name,
    data.level,
    data.description || null,
    data.processTableId || null,
    data.displayOrder ?? 0,
    now,
    now,
    null
  );

  return {
    id,
    projectId: data.projectId,
    name: data.name,
    level: data.level,
    description: data.description,
    processTableId: data.processTableId,
    displayOrder: data.displayOrder ?? 0,
    createdAt: new Date(now),
    updatedAt: new Date(now),
  } as ManualTable;
});

// プロジェクトのマニュアルグループ一覧取得
ipcMain.handle('manualTable:getByProject', async (_, projectId: string) => {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT * FROM manual_tables
    WHERE project_id = ?
    ORDER BY display_order ASC, created_at ASC
  `);

  const rows = stmt.all(projectId) as any[];

  return rows.map(row => ({
    id: row.id,
    projectId: row.project_id,
    name: row.name,
    level: row.level as ProcessLevel,
    description: row.description,
    processTableId: row.process_table_id || undefined,
    displayOrder: row.display_order,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
  })) as ManualTable[];
});

// マニュアルグループ取得（ID指定）
ipcMain.handle('manualTable:getById', async (_, id: string) => {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM manual_tables WHERE id = ?');
  const row = stmt.get(id) as any;

  if (!row) {
    throw new Error(`ManualTable not found: ${id}`);
  }

  return {
    id: row.id,
    projectId: row.project_id,
    name: row.name,
    level: row.level as ProcessLevel,
    description: row.description,
    processTableId: row.process_table_id || undefined,
    displayOrder: row.display_order,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
  } as ManualTable;
});

// マニュアルグループ更新
ipcMain.handle('manualTable:update', async (_, data: {
  id: string;
  name?: string;
  description?: string;
  processTableId?: string;
  displayOrder?: number;
}) => {
  const db = getDatabase();
  const now = Date.now();

  const updates: string[] = [];
  const values: any[] = [];

  if (data.name !== undefined) {
    updates.push('name = ?');
    values.push(data.name);
  }
  if (data.description !== undefined) {
    updates.push('description = ?');
    values.push(data.description || null);
  }
  if (data.processTableId !== undefined) {
    updates.push('process_table_id = ?');
    values.push(data.processTableId || null);
  }
  if (data.displayOrder !== undefined) {
    updates.push('display_order = ?');
    values.push(data.displayOrder);
  }

  if (updates.length === 0) {
    throw new Error('No fields to update');
  }

  updates.push('updated_at = ?');
  values.push(now);
  values.push(data.id);

  const stmt = db.prepare(`
    UPDATE manual_tables
    SET ${updates.join(', ')}
    WHERE id = ?
  `);

  stmt.run(...values);
});

// マニュアルグループ削除（カスケード削除: manuals も削除される）
ipcMain.handle('manualTable:delete', async (_, id: string) => {
  const db = getDatabase();
  const stmt = db.prepare('DELETE FROM manual_tables WHERE id = ?');
  stmt.run(id);
});

// マニュアルグループの並び替え
ipcMain.handle('manualTable:reorder', async (_, data: {
  id: string;
  displayOrder: number;
}) => {
  const db = getDatabase();
  const now = Date.now();

  const stmt = db.prepare(`
    UPDATE manual_tables
    SET display_order = ?, updated_at = ?
    WHERE id = ?
  `);

  stmt.run(data.displayOrder, now, data.id);
});

}
