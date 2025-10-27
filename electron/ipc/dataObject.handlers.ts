import { ipcMain } from 'electron';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../utils/database';

// V2: データオブジェクト型定義
interface DataObject {
  id: string;
  processTableId: string;
  name: string;
  type: 'input' | 'output' | 'both';
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface CreateDataObjectDto {
  name: string;
  type: 'input' | 'output' | 'both';
  description?: string;
}

interface UpdateDataObjectDto {
  name?: string;
  type?: 'input' | 'output' | 'both';
  description?: string;
}

/**
 * データオブジェクト関連のIPCハンドラーを登録
 */
export function registerDataObjectHandlers(): void {
  // データオブジェクト作成
  ipcMain.handle('dataObject:create', async (_, processTableId: string, data: CreateDataObjectDto): Promise<DataObject> => {
    try {
      const db = getDatabase();
      const now = Date.now();
      const dataObjectId = uuidv4();

      db.prepare(`
        INSERT INTO data_objects (id, process_table_id, name, type, description, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(dataObjectId, processTableId, data.name, data.type, data.description || null, now, now);

      console.log('[IPC] DataObject created:', dataObjectId);
      return {
        id: dataObjectId,
        processTableId,
        name: data.name,
        type: data.type,
        description: data.description,
        createdAt: new Date(now),
        updatedAt: new Date(now),
      };
    } catch (error) {
      console.error('[IPC] Error creating dataObject:', error);
      throw error;
    }
  });

  // 工程表内の全データオブジェクト取得
  ipcMain.handle('dataObject:getByProcessTable', async (_, processTableId: string): Promise<DataObject[]> => {
    try {
      const db = getDatabase();
      const rows = db.prepare(`
        SELECT id, process_table_id, name, type, description, created_at, updated_at
        FROM data_objects
        WHERE process_table_id = ?
        ORDER BY name ASC
      `).all(processTableId) as Array<{
        id: string;
        process_table_id: string;
        name: string;
        type: string;
        description: string | null;
        created_at: number;
        updated_at: number;
      }>;

      return rows.map(row => ({
        id: row.id,
        processTableId: row.process_table_id,
        name: row.name,
        type: row.type as 'input' | 'output' | 'both',
        description: row.description || undefined,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      }));
    } catch (error) {
      console.error('[IPC] Error getting dataObjects by processTable:', error);
      throw error;
    }
  });

  // データオブジェクト取得（ID指定）
  ipcMain.handle('dataObject:getById', async (_, dataObjectId: string): Promise<DataObject | null> => {
    try {
      const db = getDatabase();
      const row = db.prepare(`
        SELECT id, process_table_id, name, type, description, created_at, updated_at
        FROM data_objects
        WHERE id = ?
      `).get(dataObjectId) as {
        id: string;
        process_table_id: string;
        name: string;
        type: string;
        description: string | null;
        created_at: number;
        updated_at: number;
      } | undefined;

      if (!row) return null;

      return {
        id: row.id,
        processTableId: row.process_table_id,
        name: row.name,
        type: row.type as 'input' | 'output' | 'both',
        description: row.description || undefined,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      };
    } catch (error) {
      console.error('[IPC] Error getting dataObject by id:', error);
      throw error;
    }
  });

  // データオブジェクト更新
  ipcMain.handle('dataObject:update', async (_, dataObjectId: string, data: UpdateDataObjectDto): Promise<DataObject> => {
    try {
      const db = getDatabase();
      const now = Date.now();

      const updates: string[] = [];
      const values: any[] = [];

      if (data.name !== undefined) {
        updates.push('name = ?');
        values.push(data.name);
      }
      if (data.type !== undefined) {
        updates.push('type = ?');
        values.push(data.type);
      }
      if (data.description !== undefined) {
        updates.push('description = ?');
        values.push(data.description || null);
      }

      if (updates.length === 0) {
        throw new Error('No fields to update');
      }

      updates.push('updated_at = ?');
      values.push(now);
      values.push(dataObjectId);

      db.prepare(`
        UPDATE data_objects
        SET ${updates.join(', ')}
        WHERE id = ?
      `).run(...values);

      const updated = db.prepare(`
        SELECT id, process_table_id, name, type, description, created_at, updated_at
        FROM data_objects
        WHERE id = ?
      `).get(dataObjectId) as {
        id: string;
        process_table_id: string;
        name: string;
        type: string;
        description: string | null;
        created_at: number;
        updated_at: number;
      };

      console.log('[IPC] DataObject updated:', dataObjectId);
      return {
        id: updated.id,
        processTableId: updated.process_table_id,
        name: updated.name,
        type: updated.type as 'input' | 'output' | 'both',
        description: updated.description || undefined,
        createdAt: new Date(updated.created_at),
        updatedAt: new Date(updated.updated_at),
      };
    } catch (error) {
      console.error('[IPC] Error updating dataObject:', error);
      throw error;
    }
  });

  // データオブジェクト削除
  ipcMain.handle('dataObject:delete', async (_, dataObjectId: string): Promise<void> => {
    try {
      const db = getDatabase();
      db.prepare('DELETE FROM data_objects WHERE id = ?').run(dataObjectId);
      console.log('[IPC] DataObject deleted:', dataObjectId);
    } catch (error) {
      console.error('[IPC] Error deleting dataObject:', error);
      throw error;
    }
  });

  // 工程との関連付け（input/output）
  ipcMain.handle('dataObject:linkToProcess', async (_, dataObjectId: string, processId: string, direction: 'input' | 'output'): Promise<void> => {
    try {
      const db = getDatabase();
      const now = Date.now();

      // 現在の工程データ取得
      const process = db.prepare(`
        SELECT input_data_objects, output_data_objects
        FROM processes
        WHERE id = ?
      `).get(processId) as {
        input_data_objects: string | null;
        output_data_objects: string | null;
      } | undefined;

      if (!process) {
        throw new Error(`Process not found: ${processId}`);
      }

      // 配列として扱う
      const inputIds: string[] = process.input_data_objects ? JSON.parse(process.input_data_objects) : [];
      const outputIds: string[] = process.output_data_objects ? JSON.parse(process.output_data_objects) : [];

      // 追加（重複チェック）
      if (direction === 'input') {
        if (!inputIds.includes(dataObjectId)) {
          inputIds.push(dataObjectId);
        }
      } else {
        if (!outputIds.includes(dataObjectId)) {
          outputIds.push(dataObjectId);
        }
      }

      // 更新
      db.prepare(`
        UPDATE processes
        SET input_data_objects = ?,
            output_data_objects = ?,
            updated_at = ?
        WHERE id = ?
      `).run(
        JSON.stringify(inputIds),
        JSON.stringify(outputIds),
        now,
        processId
      );

      console.log(`[IPC] DataObject ${dataObjectId} linked to process ${processId} as ${direction}`);
    } catch (error) {
      console.error('[IPC] Error linking dataObject to process:', error);
      throw error;
    }
  });

  // 工程との関連解除
  ipcMain.handle('dataObject:unlinkFromProcess', async (_, dataObjectId: string, processId: string, direction: 'input' | 'output'): Promise<void> => {
    try {
      const db = getDatabase();
      const now = Date.now();

      // 現在の工程データ取得
      const process = db.prepare(`
        SELECT input_data_objects, output_data_objects
        FROM processes
        WHERE id = ?
      `).get(processId) as {
        input_data_objects: string | null;
        output_data_objects: string | null;
      } | undefined;

      if (!process) {
        throw new Error(`Process not found: ${processId}`);
      }

      // 配列として扱う
      const inputIds: string[] = process.input_data_objects ? JSON.parse(process.input_data_objects) : [];
      const outputIds: string[] = process.output_data_objects ? JSON.parse(process.output_data_objects) : [];

      // 削除
      if (direction === 'input') {
        const index = inputIds.indexOf(dataObjectId);
        if (index !== -1) {
          inputIds.splice(index, 1);
        }
      } else {
        const index = outputIds.indexOf(dataObjectId);
        if (index !== -1) {
          outputIds.splice(index, 1);
        }
      }

      // 更新
      db.prepare(`
        UPDATE processes
        SET input_data_objects = ?,
            output_data_objects = ?,
            updated_at = ?
        WHERE id = ?
      `).run(
        JSON.stringify(inputIds),
        JSON.stringify(outputIds),
        now,
        processId
      );

      console.log(`[IPC] DataObject ${dataObjectId} unlinked from process ${processId} (${direction})`);
    } catch (error) {
      console.error('[IPC] Error unlinking dataObject from process:', error);
      throw error;
    }
  });
}
