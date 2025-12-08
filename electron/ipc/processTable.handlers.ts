import { ipcMain } from 'electron';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../utils/database';

// V2: 型定義はmodels.tsと同期
interface ProcessTable {
  id: string;
  projectId: string;
  name: string;
  level: 'large' | 'medium' | 'small' | 'detail';
  description?: string;
  isInvestigation: boolean;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

interface Swimlane {
  id: string;
  processTableId: string;
  name: string;
  color?: string;
  orderNum: number;
  createdAt: Date;
  updatedAt: Date;
}

interface CustomColumn {
  id: string;
  processTableId: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'select' | 'multiselect' | 'checkbox' | 'url';
  options?: string[];
  required: boolean;
  orderNum: number;
  createdAt: Date;
  updatedAt: Date;
}

interface CreateProcessTableDto {
  projectId: string;
  name: string;
  level: 'large' | 'medium' | 'small' | 'detail';
  description?: string;
  isInvestigation?: boolean;
  swimlanes?: Array<{ name: string; color?: string }>;
  customColumns?: Array<{ name: string; type: string; options?: string[]; required?: boolean }>;
}

interface UpdateProcessTableDto {
  name?: string;
  level?: 'large' | 'medium' | 'small' | 'detail';
  description?: string;
  isInvestigation?: boolean;
}

interface CreateProcessTableResult {
  processTable: ProcessTable;
  swimlanes: Swimlane[];
  customColumns: CustomColumn[];
}

interface DeleteProcessResult {
  success: boolean;
  deletedCount: number;
}

/**
 * 工程表関連のIPCハンドラーを登録
 */
export function registerProcessTableHandlers(): void {
  // 工程表作成（スイムレーン、ステップ、カスタム列も同時作成）
  ipcMain.handle('processTable:create', async (_, data: CreateProcessTableDto): Promise<CreateProcessTableResult> => {
    try {
      const db = getDatabase();
      const now = Date.now();
      const processTableId = uuidv4();

      // トランザクション開始
      db.prepare('BEGIN').run();

      try {
        // 工程表作成
        const displayOrder = db.prepare('SELECT COALESCE(MAX(display_order), -1) + 1 as next_order FROM process_tables WHERE project_id = ?')
          .get(data.projectId) as { next_order: number };

        const isInvestigation = data.isInvestigation ? 1 : 0;

        db.prepare(`
          INSERT INTO process_tables (id, project_id, name, level, description, is_investigation, display_order, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(processTableId, data.projectId, data.name, data.level, data.description || null, isInvestigation, displayOrder.next_order, now, now);

        const processTable: ProcessTable = {
          id: processTableId,
          projectId: data.projectId,
          name: data.name,
          level: data.level,
          description: data.description,
          isInvestigation: !!data.isInvestigation,
          displayOrder: displayOrder.next_order,
          createdAt: new Date(now),
          updatedAt: new Date(now),
        };

        const swimlanes: Swimlane[] = [];
        const customColumns: CustomColumn[] = [];

        // デフォルトスイムレーン作成
        const defaultSwimlanes = data.swimlanes || [{ name: 'デフォルト', color: '#E3F2FD' }];
        defaultSwimlanes.forEach((swimlaneData, index) => {
          const swimlaneId = uuidv4();
          db.prepare(`
            INSERT INTO process_table_swimlanes (id, process_table_id, name, color, order_num, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `).run(swimlaneId, processTableId, swimlaneData.name, swimlaneData.color || null, index, now, now);

          swimlanes.push({
            id: swimlaneId,
            processTableId,
            name: swimlaneData.name,
            color: swimlaneData.color,
            orderNum: index,
            createdAt: new Date(now),
            updatedAt: new Date(now),
          });
        });

        // カスタム列作成（オプション）
        if (data.customColumns && data.customColumns.length > 0) {
          data.customColumns.forEach((columnData, index) => {
            const columnId = uuidv4();
            const optionsJson = columnData.options ? JSON.stringify(columnData.options) : null;
            
            db.prepare(`
              INSERT INTO process_table_custom_columns (id, process_table_id, name, type, options, required, order_num, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).run(columnId, processTableId, columnData.name, columnData.type, optionsJson, columnData.required ? 1 : 0, index, now, now);

            customColumns.push({
              id: columnId,
              processTableId,
              name: columnData.name,
              type: columnData.type as any,
              options: columnData.options,
              required: columnData.required || false,
              orderNum: index,
              createdAt: new Date(now),
              updatedAt: new Date(now),
            });
          });
        }

        db.prepare('COMMIT').run();

        console.log('[IPC] ProcessTable created:', processTableId);
        return {
          processTable,
          swimlanes,
          customColumns,
        };
      } catch (error) {
        db.prepare('ROLLBACK').run();
        throw error;
      }
    } catch (error) {
      console.error('[IPC] Error creating processTable:', error);
      throw error;
    }
  });

  // プロジェクト内の全工程表取得
  ipcMain.handle('processTable:getByProject', async (_, projectId: string): Promise<ProcessTable[]> => {
    try {
      const db = getDatabase();
      const rows = db.prepare(`
        SELECT id, project_id, name, level, description, is_investigation, display_order, created_at, updated_at
        FROM process_tables
        WHERE project_id = ?
        ORDER BY display_order ASC
      `).all(projectId) as Array<{
        id: string;
        project_id: string;
        name: string;
        level: string;
        description: string | null;
        is_investigation: number;
        display_order: number;
        created_at: number;
        updated_at: number;
      }>;

      return rows.map(row => ({
        id: row.id,
        projectId: row.project_id,
        name: row.name,
        level: row.level as ProcessTable['level'],
        description: row.description || undefined,
        isInvestigation: !!row.is_investigation,
        displayOrder: row.display_order,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      }));
    } catch (error) {
      console.error('[IPC] Error getting processTables by project:', error);
      throw error;
    }
  });

  // 工程表取得（ID指定）
  ipcMain.handle('processTable:getById', async (_, processTableId: string): Promise<ProcessTable | null> => {
    try {
      const db = getDatabase();
      const row = db.prepare(`
        SELECT id, project_id, name, level, description, is_investigation, display_order, created_at, updated_at
        FROM process_tables
        WHERE id = ?
      `).get(processTableId) as {
        id: string;
        project_id: string;
        name: string;
        level: string;
        description: string | null;
        is_investigation: number;
        display_order: number;
        created_at: number;
        updated_at: number;
      } | undefined;

      if (!row) return null;

      return {
        id: row.id,
        projectId: row.project_id,
        name: row.name,
        level: row.level as ProcessTable['level'],
        description: row.description || undefined,
        isInvestigation: !!row.is_investigation,
        displayOrder: row.display_order,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      };
    } catch (error) {
      console.error('[IPC] Error getting processTable by id:', error);
      throw error;
    }
  });

  // 工程表更新
  ipcMain.handle('processTable:update', async (_, processTableId: string, data: UpdateProcessTableDto): Promise<ProcessTable> => {
    try {
      const db = getDatabase();
      const now = Date.now();

      const updates: string[] = [];
      const values: any[] = [];

      if (data.name !== undefined) {
        updates.push('name = ?');
        values.push(data.name);
      }
      if (data.level !== undefined) {
        updates.push('level = ?');
        values.push(data.level);
      }
      if (data.description !== undefined) {
        updates.push('description = ?');
        values.push(data.description || null);
      }
      if (data.isInvestigation !== undefined) {
        updates.push('is_investigation = ?');
        values.push(data.isInvestigation ? 1 : 0);
      }

      if (updates.length === 0) {
        throw new Error('No fields to update');
      }

      updates.push('updated_at = ?');
      values.push(now);
      values.push(processTableId);

      db.prepare(`
        UPDATE process_tables
        SET ${updates.join(', ')}
        WHERE id = ?
      `).run(...values);

      const updated = db.prepare(`
        SELECT id, project_id, name, level, description, is_investigation, display_order, created_at, updated_at
        FROM process_tables
        WHERE id = ?
      `).get(processTableId) as {
        id: string;
        project_id: string;
        name: string;
        level: string;
        description: string | null;
        is_investigation: number;
        display_order: number;
        created_at: number;
        updated_at: number;
      };

      console.log('[IPC] ProcessTable updated:', processTableId);
      return {
        id: updated.id,
        projectId: updated.project_id,
        name: updated.name,
        level: updated.level as ProcessTable['level'],
        description: updated.description || undefined,
        isInvestigation: !!updated.is_investigation,
        displayOrder: updated.display_order,
        createdAt: new Date(updated.created_at),
        updatedAt: new Date(updated.updated_at),
      };
    } catch (error) {
      console.error('[IPC] Error updating processTable:', error);
      throw error;
    }
  });

  // 工程表削除（CASCADE: 関連する全データを削除）
  ipcMain.handle('processTable:delete', async (_, processTableId: string): Promise<DeleteProcessResult> => {
    try {
      const db = getDatabase();

      // CASCADE制約により自動削除されるテーブル:
      // - process_table_swimlanes
      // - process_table_custom_columns
      // - processes
      // - bpmn_diagrams
      // - manuals (→ manual_sections, manual_detail_steps, manual_image_slots)

      const result = db.prepare('DELETE FROM process_tables WHERE id = ?').run(processTableId);

      console.log('[IPC] ProcessTable deleted:', processTableId, 'Changes:', result.changes);
      return {
        success: result.changes > 0,
        deletedCount: result.changes,
      };
    } catch (error) {
      console.error('[IPC] Error deleting processTable:', error);
      throw error;
    }
  });

  // ========== スイムレーン管理 ==========

  // スイムレーン作成
  ipcMain.handle('processTable:createSwimlane', async (_, processTableId: string, data: { name: string; color?: string }): Promise<Swimlane> => {
    try {
      const db = getDatabase();
      const now = Date.now();
      const swimlaneId = uuidv4();

      const orderNum = db.prepare('SELECT COALESCE(MAX(order_num), -1) + 1 as next_order FROM process_table_swimlanes WHERE process_table_id = ?')
        .get(processTableId) as { next_order: number };

      db.prepare(`
        INSERT INTO process_table_swimlanes (id, process_table_id, name, color, order_num, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(swimlaneId, processTableId, data.name, data.color || null, orderNum.next_order, now, now);

      console.log('[IPC] Swimlane created:', swimlaneId);
      return {
        id: swimlaneId,
        processTableId,
        name: data.name,
        color: data.color,
        orderNum: orderNum.next_order,
        createdAt: new Date(now),
        updatedAt: new Date(now),
      };
    } catch (error) {
      console.error('[IPC] Error creating swimlane:', error);
      throw error;
    }
  });

  // スイムレーン取得
  ipcMain.handle('processTable:getSwimlanes', async (_, processTableId: string): Promise<Swimlane[]> => {
    try {
      const db = getDatabase();
      const rows = db.prepare(`
        SELECT id, process_table_id, name, color, order_num, created_at, updated_at
        FROM process_table_swimlanes
        WHERE process_table_id = ?
        ORDER BY order_num ASC
      `).all(processTableId) as Array<{
        id: string;
        process_table_id: string;
        name: string;
        color: string | null;
        order_num: number;
        created_at: number;
        updated_at: number;
      }>;

      return rows.map(row => ({
        id: row.id,
        processTableId: row.process_table_id,
        name: row.name,
        color: row.color || undefined,
        orderNum: row.order_num,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      }));
    } catch (error) {
      console.error('[IPC] Error getting swimlanes:', error);
      throw error;
    }
  });

  // スイムレーン更新
  ipcMain.handle('processTable:updateSwimlane', async (_, swimlaneId: string, data: { name?: string; color?: string }): Promise<Swimlane> => {
    try {
      const db = getDatabase();
      const now = Date.now();

      const updates: string[] = [];
      const values: any[] = [];

      if (data.name !== undefined) {
        updates.push('name = ?');
        values.push(data.name);
      }
      if (data.color !== undefined) {
        updates.push('color = ?');
        values.push(data.color || null);
      }

      if (updates.length === 0) {
        throw new Error('No fields to update');
      }

      updates.push('updated_at = ?');
      values.push(now);
      values.push(swimlaneId);

      db.prepare(`
        UPDATE process_table_swimlanes
        SET ${updates.join(', ')}
        WHERE id = ?
      `).run(...values);

      const updated = db.prepare(`
        SELECT id, process_table_id, name, color, order_num, created_at, updated_at
        FROM process_table_swimlanes
        WHERE id = ?
      `).get(swimlaneId) as {
        id: string;
        process_table_id: string;
        name: string;
        color: string | null;
        order_num: number;
        created_at: number;
        updated_at: number;
      };

      console.log('[IPC] Swimlane updated:', swimlaneId);
      return {
        id: updated.id,
        processTableId: updated.process_table_id,
        name: updated.name,
        color: updated.color || undefined,
        orderNum: updated.order_num,
        createdAt: new Date(updated.created_at),
        updatedAt: new Date(updated.updated_at),
      };
    } catch (error) {
      console.error('[IPC] Error updating swimlane:', error);
      throw error;
    }
  });

  // スイムレーン削除
  ipcMain.handle('processTable:deleteSwimlane', async (_, swimlaneId: string): Promise<void> => {
    try {
      const db = getDatabase();
      db.prepare('DELETE FROM process_table_swimlanes WHERE id = ?').run(swimlaneId);
      console.log('[IPC] Swimlane deleted:', swimlaneId);
    } catch (error) {
      console.error('[IPC] Error deleting swimlane:', error);
      throw error;
    }
  });

  // スイムレーン並び替え
  ipcMain.handle('processTable:reorderSwimlanes', async (_, processTableId: string, swimlaneIds: string[]): Promise<void> => {
    try {
      const db = getDatabase();
      db.prepare('BEGIN').run();

      try {
        swimlaneIds.forEach((swimlaneId, index) => {
          db.prepare('UPDATE process_table_swimlanes SET order_num = ? WHERE id = ? AND process_table_id = ?')
            .run(index, swimlaneId, processTableId);
        });

        db.prepare('COMMIT').run();
        console.log('[IPC] Swimlanes reordered');
      } catch (error) {
        db.prepare('ROLLBACK').run();
        throw error;
      }
    } catch (error) {
      console.error('[IPC] Error reordering swimlanes:', error);
      throw error;
    }
  });

  // ========== カスタム列管理 ==========

  // カスタム列作成
  ipcMain.handle('processTable:createCustomColumn', async (_, processTableId: string, data: {
    name: string;
    type: 'text' | 'number' | 'date' | 'select' | 'multiselect' | 'checkbox' | 'url';
    options?: string[];
    required?: boolean;
  }): Promise<CustomColumn> => {
    try {
      const db = getDatabase();
      const now = Date.now();
      const columnId = uuidv4();

      const orderNum = db.prepare('SELECT COALESCE(MAX(order_num), -1) + 1 as next_order FROM process_table_custom_columns WHERE process_table_id = ?')
        .get(processTableId) as { next_order: number };

      const optionsJson = data.options ? JSON.stringify(data.options) : null;

      db.prepare(`
        INSERT INTO process_table_custom_columns (id, process_table_id, name, type, options, required, order_num, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(columnId, processTableId, data.name, data.type, optionsJson, data.required ? 1 : 0, orderNum.next_order, now, now);

      console.log('[IPC] CustomColumn created:', columnId);
      return {
        id: columnId,
        processTableId,
        name: data.name,
        type: data.type,
        options: data.options,
        required: data.required || false,
        orderNum: orderNum.next_order,
        createdAt: new Date(now),
        updatedAt: new Date(now),
      };
    } catch (error) {
      console.error('[IPC] Error creating custom column:', error);
      throw error;
    }
  });

  // カスタム列取得
  ipcMain.handle('processTable:getCustomColumns', async (_, processTableId: string): Promise<CustomColumn[]> => {
    try {
      const db = getDatabase();
      const rows = db.prepare(`
        SELECT id, process_table_id, name, type, options, required, order_num, created_at, updated_at
        FROM process_table_custom_columns
        WHERE process_table_id = ?
        ORDER BY order_num ASC
      `).all(processTableId) as Array<{
        id: string;
        process_table_id: string;
        name: string;
        type: string;
        options: string | null;
        required: number;
        order_num: number;
        created_at: number;
        updated_at: number;
      }>;

      return rows.map(row => ({
        id: row.id,
        processTableId: row.process_table_id,
        name: row.name,
        type: row.type as any,
        options: row.options ? JSON.parse(row.options) : undefined,
        required: row.required === 1,
        orderNum: row.order_num,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      }));
    } catch (error) {
      console.error('[IPC] Error getting custom columns:', error);
      throw error;
    }
  });

  // カスタム列更新
  ipcMain.handle('processTable:updateCustomColumn', async (_, columnId: string, data: {
    name?: string;
    type?: string;
    options?: string[];
    required?: boolean;
  }): Promise<CustomColumn> => {
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
      if (data.options !== undefined) {
        updates.push('options = ?');
        values.push(data.options ? JSON.stringify(data.options) : null);
      }
      if (data.required !== undefined) {
        updates.push('required = ?');
        values.push(data.required ? 1 : 0);
      }

      if (updates.length === 0) {
        throw new Error('No fields to update');
      }

      updates.push('updated_at = ?');
      values.push(now);
      values.push(columnId);

      db.prepare(`
        UPDATE process_table_custom_columns
        SET ${updates.join(', ')}
        WHERE id = ?
      `).run(...values);

      const updated = db.prepare(`
        SELECT id, process_table_id, name, type, options, required, order_num, created_at, updated_at
        FROM process_table_custom_columns
        WHERE id = ?
      `).get(columnId) as {
        id: string;
        process_table_id: string;
        name: string;
        type: string;
        options: string | null;
        required: number;
        order_num: number;
        created_at: number;
        updated_at: number;
      };

      console.log('[IPC] CustomColumn updated:', columnId);
      return {
        id: updated.id,
        processTableId: updated.process_table_id,
        name: updated.name,
        type: updated.type as any,
        options: updated.options ? JSON.parse(updated.options) : undefined,
        required: updated.required === 1,
        orderNum: updated.order_num,
        createdAt: new Date(updated.created_at),
        updatedAt: new Date(updated.updated_at),
      };
    } catch (error) {
      console.error('[IPC] Error updating custom column:', error);
      throw error;
    }
  });

  // カスタム列削除
  ipcMain.handle('processTable:deleteCustomColumn', async (_, columnId: string): Promise<void> => {
    try {
      const db = getDatabase();
      db.prepare('DELETE FROM process_table_custom_columns WHERE id = ?').run(columnId);
      console.log('[IPC] CustomColumn deleted:', columnId);
    } catch (error) {
      console.error('[IPC] Error deleting custom column:', error);
      throw error;
    }
  });

  // カスタム列並び替え
  ipcMain.handle('processTable:reorderCustomColumns', async (_, processTableId: string, columnIds: string[]): Promise<void> => {
    try {
      const db = getDatabase();
      db.prepare('BEGIN').run();

      try {
        columnIds.forEach((columnId, index) => {
          db.prepare('UPDATE process_table_custom_columns SET order_num = ? WHERE id = ? AND process_table_id = ?')
            .run(index, columnId, processTableId);
        });

        db.prepare('COMMIT').run();
        console.log('[IPC] CustomColumns reordered');
      } catch (error) {
        db.prepare('ROLLBACK').run();
        throw error;
      }
    } catch (error) {
      console.error('[IPC] Error reordering custom columns:', error);
      throw error;
    }
  });
}
