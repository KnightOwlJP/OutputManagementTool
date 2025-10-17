import { ipcMain } from 'electron';
import { getDatabase } from '../utils/database';
import { getLogger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

const logger = getLogger();

// Process型定義（インライン）
type ProcessLevel = 'large' | 'medium' | 'small' | 'detail';

interface Process {
  id: string;
  projectId: string;
  name: string;
  level: ProcessLevel;
  parentId?: string;
  department?: string;
  assignee?: string;
  documentType?: string;
  startDate?: Date;
  endDate?: Date;
  status?: string;
  description?: string;
  bpmnElementId?: string;
  hasManual?: boolean;
  manualId?: string;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}

interface CreateProcessDto {
  projectId: string;
  name: string;
  level: ProcessLevel;
  parentId?: string;
  department?: string;
  assignee?: string;
  documentType?: string;
  startDate?: Date;
  endDate?: Date;
  description?: string;
  displayOrder?: number;
}

interface UpdateProcessDto {
  name?: string;
  department?: string;
  assignee?: string;
  documentType?: string;
  startDate?: Date;
  endDate?: Date;
  status?: string;
  description?: string;
  bpmnElementId?: string;
  displayOrder?: number;
}

/**
 * 工程関連のIPCハンドラーを登録
 */
export function registerProcessHandlers(): void {
  // 工程作成
  ipcMain.handle('process:create', async (_, data: CreateProcessDto): Promise<Process> => {
    try {
      const db = getDatabase();
      const now = Date.now();
      const processId = uuidv4();

      // 親IDが指定されている場合、親工程の存在を確認
      if (data.parentId) {
        const parent = db.prepare('SELECT id, level FROM processes WHERE id = ?').get(data.parentId) as { id: string; level: string } | undefined;
        if (!parent) {
          throw new Error('親工程が見つかりません');
        }

        // 階層の妥当性をチェック
        const levelOrder = { large: 0, medium: 1, small: 2, detail: 3 };
        const parentLevel = levelOrder[parent.level as ProcessLevel];
        const currentLevel = levelOrder[data.level];
        
        if (currentLevel <= parentLevel) {
          throw new Error('工程レベルの階層が不正です');
        }
      }

      // displayOrderが指定されていない場合、同じparentIdの最大値+1を取得
      let displayOrder = data.displayOrder ?? 0;
      if (data.displayOrder === undefined) {
        const maxOrder = db.prepare(`
          SELECT MAX(display_order) as max_order
          FROM processes
          WHERE project_id = ? AND ${data.parentId ? 'parent_id = ?' : 'parent_id IS NULL'}
        `).get(data.parentId ? [data.projectId, data.parentId] : [data.projectId]) as { max_order: number | null };
        
        displayOrder = (maxOrder.max_order ?? -1) + 1;
      }

      // データベースに保存
      const stmt = db.prepare(`
        INSERT INTO processes (
          id, project_id, name, level, parent_id, department, assignee, 
          document_type, start_date, end_date, description, display_order, 
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        processId,
        data.projectId,
        data.name,
        data.level,
        data.parentId || null,
        data.department || null,
        data.assignee || null,
        data.documentType || null,
        data.startDate ? data.startDate.getTime() : null,
        data.endDate ? data.endDate.getTime() : null,
        data.description || null,
        displayOrder,
        now,
        now
      );

      const process: Process = {
        id: processId,
        projectId: data.projectId,
        name: data.name,
        level: data.level,
        parentId: data.parentId,
        department: data.department,
        assignee: data.assignee,
        documentType: data.documentType,
        startDate: data.startDate,
        endDate: data.endDate,
        description: data.description,
        displayOrder,
        createdAt: new Date(now),
        updatedAt: new Date(now),
      };

      console.log('[IPC] Process created:', processId);
      return process;
    } catch (error) {
      console.error('[IPC] Error creating process:', error);
      throw error;
    }
  });

  // プロジェクト内の全工程を取得
  ipcMain.handle('process:getByProject', async (_, projectId: string): Promise<Process[]> => {
    try {
      const db = getDatabase();
      const stmt = db.prepare(`
        SELECT 
          id, project_id, name, level, parent_id, department, assignee,
          document_type, start_date, end_date, status, description,
          bpmn_element_id, has_manual, manual_id, display_order,
          created_at, updated_at, metadata
        FROM processes
        WHERE project_id = ?
        ORDER BY display_order ASC, created_at ASC
      `);

      const rows = stmt.all(projectId) as Array<{
        id: string;
        project_id: string;
        name: string;
        level: ProcessLevel;
        parent_id: string | null;
        department: string | null;
        assignee: string | null;
        document_type: string | null;
        start_date: number | null;
        end_date: number | null;
        status: string | null;
        description: string | null;
        bpmn_element_id: string | null;
        has_manual: number | null;
        manual_id: string | null;
        display_order: number;
        created_at: number;
        updated_at: number;
        metadata: string | null;
      }>;

      const processes: Process[] = rows.map((row) => ({
        id: row.id,
        projectId: row.project_id,
        name: row.name,
        level: row.level,
        parentId: row.parent_id || undefined,
        department: row.department || undefined,
        assignee: row.assignee || undefined,
        documentType: row.document_type || undefined,
        startDate: row.start_date ? new Date(row.start_date) : undefined,
        endDate: row.end_date ? new Date(row.end_date) : undefined,
        status: row.status || undefined,
        description: row.description || undefined,
        bpmnElementId: row.bpmn_element_id || undefined,
        hasManual: row.has_manual === 1,
        manualId: row.manual_id || undefined,
        displayOrder: row.display_order,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
        metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
      }));

      console.log('[IPC] Processes fetched:', processes.length);
      return processes;
    } catch (error) {
      console.error('[IPC] Error fetching processes:', error);
      throw error;
    }
  });

  // 工程をIDで取得
  ipcMain.handle('process:getById', async (_, processId: string): Promise<Process> => {
    try {
      const db = getDatabase();
      const stmt = db.prepare(`
        SELECT 
          id, project_id, name, level, parent_id, department, assignee,
          document_type, start_date, end_date, status, description,
          bpmn_element_id, has_manual, manual_id, display_order,
          created_at, updated_at, metadata
        FROM processes
        WHERE id = ?
      `);

      const row = stmt.get(processId) as {
        id: string;
        project_id: string;
        name: string;
        level: ProcessLevel;
        parent_id: string | null;
        department: string | null;
        assignee: string | null;
        document_type: string | null;
        start_date: number | null;
        end_date: number | null;
        status: string | null;
        description: string | null;
        bpmn_element_id: string | null;
        has_manual: number | null;
        manual_id: string | null;
        display_order: number;
        created_at: number;
        updated_at: number;
        metadata: string | null;
      } | undefined;

      if (!row) {
        throw new Error('工程が見つかりません');
      }

      const process: Process = {
        id: row.id,
        projectId: row.project_id,
        name: row.name,
        level: row.level,
        parentId: row.parent_id || undefined,
        department: row.department || undefined,
        assignee: row.assignee || undefined,
        documentType: row.document_type || undefined,
        startDate: row.start_date ? new Date(row.start_date) : undefined,
        endDate: row.end_date ? new Date(row.end_date) : undefined,
        status: row.status || undefined,
        description: row.description || undefined,
        bpmnElementId: row.bpmn_element_id || undefined,
        hasManual: row.has_manual === 1,
        manualId: row.manual_id || undefined,
        displayOrder: row.display_order,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
        metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
      };

      console.log('[IPC] Process fetched:', processId);
      return process;
    } catch (error) {
      console.error('[IPC] Error fetching process:', error);
      throw error;
    }
  });

  // 工程を更新
  ipcMain.handle('process:update', async (_, processId: string, data: UpdateProcessDto): Promise<Process> => {
    try {
      const db = getDatabase();
      const now = Date.now();

      // 既存の工程を取得
      const existing = db.prepare('SELECT * FROM processes WHERE id = ?').get(processId);
      if (!existing) {
        throw new Error('工程が見つかりません');
      }

      // 更新するフィールドを動的に構築
      const updates: string[] = [];
      const values: any[] = [];

      if (data.name !== undefined) {
        updates.push('name = ?');
        values.push(data.name);
      }
      if (data.department !== undefined) {
        updates.push('department = ?');
        values.push(data.department);
      }
      if (data.assignee !== undefined) {
        updates.push('assignee = ?');
        values.push(data.assignee);
      }
      if (data.documentType !== undefined) {
        updates.push('document_type = ?');
        values.push(data.documentType);
      }
      if (data.startDate !== undefined) {
        updates.push('start_date = ?');
        values.push(data.startDate ? data.startDate.getTime() : null);
      }
      if (data.endDate !== undefined) {
        updates.push('end_date = ?');
        values.push(data.endDate ? data.endDate.getTime() : null);
      }
      if (data.status !== undefined) {
        updates.push('status = ?');
        values.push(data.status);
      }
      if (data.description !== undefined) {
        updates.push('description = ?');
        values.push(data.description);
      }
      if (data.bpmnElementId !== undefined) {
        updates.push('bpmn_element_id = ?');
        values.push(data.bpmnElementId);
      }
      if (data.displayOrder !== undefined) {
        updates.push('display_order = ?');
        values.push(data.displayOrder);
      }

      updates.push('updated_at = ?');
      values.push(now);
      values.push(processId);

      // 更新実行
      const stmt = db.prepare(`
        UPDATE processes 
        SET ${updates.join(', ')}
        WHERE id = ?
      `);

      stmt.run(...values);

      // 更新後のデータを取得
      const updatedRow = db.prepare(`
        SELECT 
          id, project_id, name, level, parent_id, department, assignee,
          document_type, start_date, end_date, status, description,
          bpmn_element_id, has_manual, manual_id, display_order,
          created_at, updated_at, metadata
        FROM processes
        WHERE id = ?
      `).get(processId) as {
        id: string;
        project_id: string;
        name: string;
        level: ProcessLevel;
        parent_id: string | null;
        department: string | null;
        assignee: string | null;
        document_type: string | null;
        start_date: number | null;
        end_date: number | null;
        status: string | null;
        description: string | null;
        bpmn_element_id: string | null;
        has_manual: number | null;
        manual_id: string | null;
        display_order: number;
        created_at: number;
        updated_at: number;
        metadata: string | null;
      };

      const process: Process = {
        id: updatedRow.id,
        projectId: updatedRow.project_id,
        name: updatedRow.name,
        level: updatedRow.level,
        parentId: updatedRow.parent_id || undefined,
        department: updatedRow.department || undefined,
        assignee: updatedRow.assignee || undefined,
        documentType: updatedRow.document_type || undefined,
        startDate: updatedRow.start_date ? new Date(updatedRow.start_date) : undefined,
        endDate: updatedRow.end_date ? new Date(updatedRow.end_date) : undefined,
        status: updatedRow.status || undefined,
        description: updatedRow.description || undefined,
        bpmnElementId: updatedRow.bpmn_element_id || undefined,
        hasManual: updatedRow.has_manual === 1,
        manualId: updatedRow.manual_id || undefined,
        displayOrder: updatedRow.display_order,
        createdAt: new Date(updatedRow.created_at),
        updatedAt: new Date(updatedRow.updated_at),
        metadata: updatedRow.metadata ? JSON.parse(updatedRow.metadata) : undefined,
      };

      console.log('[IPC] Process updated:', processId);
      return process;
    } catch (error) {
      console.error('[IPC] Error updating process:', error);
      throw error;
    }
  });

  // 工程を削除
  ipcMain.handle('process:delete', async (_, processId: string): Promise<boolean> => {
    try {
      const db = getDatabase();

      // 子工程の存在チェック
      const children = db.prepare('SELECT COUNT(*) as count FROM processes WHERE parent_id = ?').get(processId) as { count: number };
      if (children.count > 0) {
        throw new Error('子工程が存在するため削除できません。先に子工程を削除してください。');
      }

      // トランザクション開始
      db.prepare('BEGIN TRANSACTION').run();

      try {
        // 関連するBPMN要素の紐付けを解除
        db.prepare('UPDATE processes SET bpmn_element_id = NULL WHERE bpmn_element_id IN (SELECT bpmn_element_id FROM processes WHERE id = ?)').run(processId);

        // 関連するマニュアル工程リレーションを削除
        db.prepare('DELETE FROM manual_process_relations WHERE process_id = ?').run(processId);

        // 工程を削除
        const result = db.prepare('DELETE FROM processes WHERE id = ?').run(processId);

        if (result.changes === 0) {
          throw new Error('工程が見つかりません');
        }

        // トランザクションコミット
        db.prepare('COMMIT').run();

        console.log('[IPC] Process deleted:', processId);
        return true;
      } catch (error) {
        // ロールバック
        db.prepare('ROLLBACK').run();
        throw error;
      }
    } catch (error) {
      console.error('[IPC] Error deleting process:', error);
      throw error;
    }
  });

  // 工程の階層移動
  ipcMain.handle(
    'process:move',
    async (_, processId: string, newParentId: string | null): Promise<Process> => {
      try {
        const db = getDatabase();
        const now = Date.now();

        // トランザクション開始
        db.prepare('BEGIN TRANSACTION').run();

        try {
          // 移動対象の工程を取得
          const process = db
            .prepare('SELECT * FROM processes WHERE id = ?')
            .get(processId) as any;

          if (!process) {
            throw new Error('移動対象の工程が見つかりません');
          }

          // 循環参照チェック
          if (newParentId) {
            let currentParentId: string | null = newParentId;
            while (currentParentId) {
              if (currentParentId === processId) {
                throw new Error('循環参照が発生します。子孫ノードを親にすることはできません');
              }
              const parent = db
                .prepare('SELECT parent_id FROM processes WHERE id = ?')
                .get(currentParentId) as { parent_id: string | null } | undefined;
              currentParentId = parent?.parent_id || null;
            }
          }

          // 新しい親が存在するか確認
          if (newParentId) {
            const newParent = db
              .prepare('SELECT id, level FROM processes WHERE id = ?')
              .get(newParentId) as { id: string; level: string } | undefined;

            if (!newParent) {
              throw new Error('移動先の親工程が見つかりません');
            }

            // レベルの妥当性チェック
            const levelOrder = ['large', 'medium', 'small', 'detail'];
            const parentLevelIndex = levelOrder.indexOf(newParent.level);
            const currentLevelIndex = levelOrder.indexOf(process.level);

            if (currentLevelIndex <= parentLevelIndex) {
              throw new Error(
                `${process.level}工程を${newParent.level}工程の子にすることはできません`
              );
            }
          }

          // 新しいdisplayOrderを計算
          const maxOrderRow = db
            .prepare(
              `SELECT MAX(display_order) as max_order 
               FROM processes 
               WHERE project_id = ? AND parent_id ${newParentId ? '= ?' : 'IS NULL'}`
            )
            .get(
              newParentId ? [process.project_id, newParentId] : [process.project_id]
            ) as { max_order: number | null };

          const newDisplayOrder = (maxOrderRow.max_order || 0) + 1;

          // 工程を更新
          const updateStmt = db.prepare(`
            UPDATE processes
            SET parent_id = ?,
                display_order = ?,
                updated_at = ?
            WHERE id = ?
          `);

          updateStmt.run(newParentId, newDisplayOrder, now, processId);

          // 更新後の工程を取得
          const updatedRow = db
            .prepare('SELECT * FROM processes WHERE id = ?')
            .get(processId) as any;

          const updatedProcess: Process = {
            id: updatedRow.id,
            projectId: updatedRow.project_id,
            name: updatedRow.name,
            level: updatedRow.level as ProcessLevel,
            parentId: updatedRow.parent_id || undefined,
            department: updatedRow.department || undefined,
            assignee: updatedRow.assignee || undefined,
            documentType: updatedRow.document_type || undefined,
            startDate: updatedRow.start_date ? new Date(updatedRow.start_date) : undefined,
            endDate: updatedRow.end_date ? new Date(updatedRow.end_date) : undefined,
            status: updatedRow.status || undefined,
            description: updatedRow.description || undefined,
            bpmnElementId: updatedRow.bpmn_element_id || undefined,
            hasManual: Boolean(updatedRow.has_manual),
            manualId: updatedRow.manual_id || undefined,
            displayOrder: updatedRow.display_order,
            createdAt: new Date(updatedRow.created_at),
            updatedAt: new Date(updatedRow.updated_at),
            metadata: updatedRow.metadata ? JSON.parse(updatedRow.metadata) : undefined,
          };

          // トランザクションコミット
          db.prepare('COMMIT').run();

          console.log('[IPC] Process moved:', processId, 'to parent:', newParentId);
          return updatedProcess;
        } catch (error) {
          // ロールバック
          db.prepare('ROLLBACK').run();
          throw error;
        }
      } catch (error) {
        console.error('[IPC] Error moving process:', error);
        throw error;
      }
    }
  );

  // 工程の並び順変更
  ipcMain.handle(
    'process:reorder',
    async (_, processId: string, newDisplayOrder: number): Promise<boolean> => {
      try {
        const db = getDatabase();
        const now = Date.now();

        // 工程を取得
        const process = db
          .prepare('SELECT * FROM processes WHERE id = ?')
          .get(processId) as any;

        if (!process) {
          throw new Error('工程が見つかりません');
        }

        // displayOrderを更新
        const updateStmt = db.prepare(`
          UPDATE processes
          SET display_order = ?,
              updated_at = ?
          WHERE id = ?
        `);

        updateStmt.run(newDisplayOrder, now, processId);

        console.log('[IPC] Process reordered:', processId, 'to order:', newDisplayOrder);
        return true;
      } catch (error) {
        console.error('[IPC] Error reordering process:', error);
        throw error;
      }
    }
  );

  console.log('[IPC] Process handlers registered');
}
