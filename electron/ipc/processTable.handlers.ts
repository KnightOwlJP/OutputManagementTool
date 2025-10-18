import { ipcMain } from 'electron';
import { getDatabase } from '../utils/database';
import { getLogger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

const logger = getLogger();

// ProcessLevel型を再定義（electron側で型を共有）
type ProcessLevel = 'large' | 'medium' | 'small' | 'detail';

interface ProcessTable {
  id: string;
  projectId: string;
  name: string;
  level: ProcessLevel;
  description?: string;
  parentProcessIds?: string[];
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}

/**
 * 工程表（ProcessTable）関連のIPCハンドラーを登録
 */
export function registerProcessTableHandlers(): void {

// 工程表作成
ipcMain.handle('processTable:create', async (_, data: {
  projectId: string;
  name: string;
  level: ProcessLevel;
  description?: string;
  parentProcessIds?: string[];
  displayOrder?: number;
}) => {
  const db = getDatabase();
  const id = uuidv4();
  const now = Date.now();

  const stmt = db.prepare(`
    INSERT INTO process_tables (
      id, project_id, name, level, description, parent_process_ids,
      display_order, created_at, updated_at, metadata
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id,
    data.projectId,
    data.name,
    data.level,
    data.description || null,
    data.parentProcessIds ? JSON.stringify(data.parentProcessIds) : null,
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
    parentProcessIds: data.parentProcessIds,
    displayOrder: data.displayOrder ?? 0,
    createdAt: new Date(now),
    updatedAt: new Date(now),
  } as ProcessTable;
});

// プロジェクトの工程表一覧取得
ipcMain.handle('processTable:getByProject', async (_, projectId: string) => {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT * FROM process_tables
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
    parentProcessIds: row.parent_process_ids ? JSON.parse(row.parent_process_ids) : undefined,
    displayOrder: row.display_order,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
  })) as ProcessTable[];
});

// 工程表取得（ID指定）
ipcMain.handle('processTable:getById', async (_, id: string) => {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM process_tables WHERE id = ?');
  const row = stmt.get(id) as any;

  if (!row) {
    throw new Error(`ProcessTable not found: ${id}`);
  }

  return {
    id: row.id,
    projectId: row.project_id,
    name: row.name,
    level: row.level as ProcessLevel,
    description: row.description,
    parentProcessIds: row.parent_process_ids ? JSON.parse(row.parent_process_ids) : undefined,
    displayOrder: row.display_order,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
  } as ProcessTable;
});

// 工程表更新
ipcMain.handle('processTable:update', async (_, id: string, data: Partial<ProcessTable>) => {
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
    values.push(data.description);
  }
  if (data.parentProcessIds !== undefined) {
    updates.push('parent_process_ids = ?');
    values.push(data.parentProcessIds ? JSON.stringify(data.parentProcessIds) : null);
  }
  if (data.displayOrder !== undefined) {
    updates.push('display_order = ?');
    values.push(data.displayOrder);
  }

  if (updates.length === 0) {
    return;
  }

  updates.push('updated_at = ?');
  values.push(now);
  values.push(id);

  const stmt = db.prepare(`
    UPDATE process_tables
    SET ${updates.join(', ')}
    WHERE id = ?
  `);

  stmt.run(...values);
});

// 工程表削除
ipcMain.handle('processTable:delete', async (_, id: string) => {
  const db = getDatabase();

  // カスケード削除により、関連する processes, bpmn_diagrams, manuals も削除される
  const stmt = db.prepare('DELETE FROM process_tables WHERE id = ?');
  stmt.run(id);
});

// 工程表の並び替え
ipcMain.handle('processTable:reorder', async (_, id: string, newOrder: number) => {
  const db = getDatabase();
  const now = Date.now();

  const stmt = db.prepare(`
    UPDATE process_tables
    SET display_order = ?, updated_at = ?
    WHERE id = ?
  `);

  stmt.run(newOrder, now, id);
});

  logger.info('ProcessTable', 'ProcessTable IPC handlers registered');
}
