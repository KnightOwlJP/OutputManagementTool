import { ipcMain } from 'electron';
import { manualGenerator, GenerateOptions, ExportFormat } from '../services/ManualGenerator';
import { getDatabase } from '../utils/database';

/**
 * マニュアル機能のIPCハンドラ
 * Phase 6.2.3 実装
 */

// Manual型定義（インライン）
interface Manual {
  id: string;
  projectId: string;
  name: string;
  content: string;
  version: number;
  detail_table_id?: string | null;
  parent_entity_id?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export function registerManualHandlers(): void {
  /**
   * マニュアル作成
   */
  ipcMain.handle(
    'manual:create',
    async (_, projectId: string, title: string, options: GenerateOptions) => {
      try {
        console.log(`[IPC] manual:create - Project: ${projectId}, Title: ${title}`);
        const manual = await manualGenerator.generateFromProcesses(projectId, title, options);
        console.log(`[IPC] manual:create完了 - Manual ID: ${manual.id}`);
        return manual;
      } catch (error) {
        console.error('[IPC] manual:create エラー:', error);
        throw error;
      }
    }
  );

  /**
   * マニュアル更新
   */
  ipcMain.handle(
    'manual:update',
    async (_, manualId: string, data: Partial<Manual>) => {
      try {
        console.log(`[IPC] manual:update - Manual: ${manualId}`);
        const db = getDatabase();
        const now = Date.now();
        
        // 更新可能なフィールド
        const updates: string[] = [];
        const params: any[] = [];
        
        if (data.name !== undefined) {
          updates.push('name = ?');
          params.push(data.name);
        }
        if (data.content !== undefined) {
          updates.push('content = ?');
          params.push(data.content);
        }
        if (data.version !== undefined) {
          updates.push('version = ?');
          params.push(data.version);
        }
        
        if (updates.length === 0) {
          return { success: true, manual: null };
        }
        
        updates.push('updated_at = ?');
        params.push(now);
        params.push(manualId);
        
        db.prepare(`UPDATE manuals SET ${updates.join(', ')} WHERE id = ?`).run(...params);
        
        const updated = db.prepare('SELECT * FROM manuals WHERE id = ?').get(manualId) as Manual;
        console.log(`[IPC] manual:update完了`);
        return { success: true, manual: updated };
      } catch (error) {
        console.error('[IPC] manual:update エラー:', error);
        throw error;
      }
    }
  );

  /**
   * マニュアル削除
   */
  ipcMain.handle(
    'manual:delete',
    async (_, manualId: string) => {
      try {
        console.log(`[IPC] manual:delete - Manual: ${manualId}`);
        const db = getDatabase();
        
        // マニュアル削除（関連セクションもCASCADEで削除される想定）
        db.prepare('DELETE FROM manuals WHERE id = ?').run(manualId);
        
        console.log(`[IPC] manual:delete完了`);
        return { success: true };
      } catch (error) {
        console.error('[IPC] manual:delete エラー:', error);
        throw error;
      }
    }
  );

  /**
   * マニュアル一覧取得
   */
  ipcMain.handle(
    'manual:list',
    async (_, projectId: string) => {
      try {
        console.log(`[IPC] manual:list - Project: ${projectId}`);
        const db = getDatabase();
        
        const manuals = db.prepare('SELECT * FROM manuals WHERE project_id = ? ORDER BY created_at DESC')
          .all(projectId) as Manual[];
        
        console.log(`[IPC] manual:list完了 - ${manuals.length}件`);
        return manuals;
      } catch (error) {
        console.error('[IPC] manual:list エラー:', error);
        throw error;
      }
    }
  );

  // ===== セクション管理 =====

  /**
   * セクション作成
   */
  ipcMain.handle(
    'manual:createSection',
    async (_, sectionData: { manualId: string; processId: string; title: string; content?: string; orderNum: number; parentId?: string }) => {
      try {
        console.log(`[IPC] manual:createSection - Manual: ${sectionData.manualId}`);
        const db = getDatabase();
        const now = Date.now();
        const sectionId = `section_${now}_${Math.random().toString(36).substring(7)}`;
        
        db.prepare(`
          INSERT INTO manual_sections (id, manual_id, process_id, title, content, order_num, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          sectionId,
          sectionData.manualId,
          sectionData.processId,
          sectionData.title,
          sectionData.content || '',
          sectionData.orderNum,
          now,
          now
        );
        
        const row = db.prepare('SELECT * FROM manual_sections WHERE id = ?').get(sectionId) as any;
        const section = {
          id: row.id,
          manualId: row.manual_id,
          processId: row.process_id,
          title: row.title,
          content: row.content,
          orderNum: row.order_num,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        };
        
        console.log(`[IPC] manual:createSection完了 - Section ID: ${sectionId}`);
        return section;
      } catch (error) {
        console.error('[IPC] manual:createSection エラー:', error);
        throw error;
      }
    }
  );

  /**
   * セクション一覧取得
   */
  ipcMain.handle(
    'manual:getSections',
    async (_, manualId: string) => {
      try {
        console.log(`[IPC] manual:getSections - Manual: ${manualId}`);
        const db = getDatabase();
        
        const sections = db.prepare('SELECT * FROM manual_sections WHERE manual_id = ? ORDER BY order_num')
          .all(manualId)
          .map((row: any) => ({
            id: row.id,
            manualId: row.manual_id,
            processId: row.process_id,
            title: row.title,
            content: row.content,
            orderNum: row.order_num,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
          }));
        
        console.log(`[IPC] manual:getSections完了 - ${sections.length}件`);
        return sections;
      } catch (error) {
        console.error('[IPC] manual:getSections エラー:', error);
        throw error;
      }
    }
  );

  /**
   * セクション更新
   */
  ipcMain.handle(
    'manual:updateSection',
    async (_, sectionId: string, data: { title?: string; content?: string; orderNum?: number }) => {
      try {
        console.log(`[IPC] manual:updateSection - Section: ${sectionId}`);
        const db = getDatabase();
        const now = Date.now();
        
        const updates: string[] = [];
        const params: any[] = [];
        
        if (data.title !== undefined) {
          updates.push('title = ?');
          params.push(data.title);
        }
        if (data.content !== undefined) {
          updates.push('content = ?');
          params.push(data.content);
        }
        if (data.orderNum !== undefined) {
          updates.push('order_num = ?');
          params.push(data.orderNum);
        }
        
        if (updates.length === 0) {
          return { success: true };
        }
        
        updates.push('updated_at = ?');
        params.push(now);
        params.push(sectionId);
        
        db.prepare(`UPDATE manual_sections SET ${updates.join(', ')} WHERE id = ?`).run(...params);
        
        const row = db.prepare('SELECT * FROM manual_sections WHERE id = ?').get(sectionId) as any;
        const section = {
          id: row.id,
          manualId: row.manual_id,
          processId: row.process_id,
          title: row.title,
          content: row.content,
          orderNum: row.order_num,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        };
        
        console.log(`[IPC] manual:updateSection完了`);
        return section;
      } catch (error) {
        console.error('[IPC] manual:updateSection エラー:', error);
        throw error;
      }
    }
  );

  /**
   * セクション削除
   */
  ipcMain.handle(
    'manual:deleteSection',
    async (_, sectionId: string) => {
      try {
        console.log(`[IPC] manual:deleteSection - Section: ${sectionId}`);
        const db = getDatabase();
        
        db.prepare('DELETE FROM manual_sections WHERE id = ?').run(sectionId);
        
        console.log(`[IPC] manual:deleteSection完了`);
        return { success: true };
      } catch (error) {
        console.error('[IPC] manual:deleteSection エラー:', error);
        throw error;
      }
    }
  );

  // ===== Phase 6.2.3 実装 =====

  ipcMain.handle(
    'manual:generateFromProcesses',
    async (_, projectId: string, title: string, options: GenerateOptions) => {
      try {
        console.log(`[IPC] manual:generateFromProcesses - Project: ${projectId}`);
        const manual = await manualGenerator.generateFromProcesses(projectId, title, options);
        console.log(`[IPC] manual:generateFromProcesses完了 - ${manual.id}`);
        return manual;
      } catch (error) {
        console.error('[IPC] manual:generateFromProcesses エラー:', error);
        throw error;
      }
    }
  );

  /**
   * 工程からマニュアル同期
   */
  ipcMain.handle(
    'manual:syncFromProcesses',
    async (_, processId: string) => {
      try {
        console.log(`[IPC] manual:syncFromProcesses - Process: ${processId}`);
        const result = await manualGenerator.syncManualFromProcess(processId);
        console.log(`[IPC] manual:syncFromProcesses完了 - 更新数: ${result.updatedCount}`);
        return result;
      } catch (error) {
        console.error('[IPC] manual:syncFromProcesses エラー:', error);
        throw error;
      }
    }
  );

  /**
   * マニュアルエクスポート
   */
  ipcMain.handle(
    'manual:export',
    async (_, manualId: string, format: ExportFormat) => {
      try {
        console.log(`[IPC] manual:export - Manual: ${manualId}, Format: ${format}`);
        const content = await manualGenerator.exportManual(manualId, format);
        console.log(`[IPC] manual:export完了`);
        return content;
      } catch (error) {
        console.error('[IPC] manual:export エラー:', error);
        throw error;
      }
    }
  );

  // ===== ステップ管理 =====

  /**
   * ステップ作成
   */
  ipcMain.handle(
    'manual:createStep',
    async (_, stepData: { sectionId: string; title: string; content?: string; orderNum: number }) => {
      try {
        console.log(`[IPC] manual:createStep - Section: ${stepData.sectionId}`);
        const db = getDatabase();
        const now = Date.now();
        const stepId = `step_${now}_${Math.random().toString(36).substring(7)}`;
        
        db.prepare(`
          INSERT INTO manual_detail_steps (id, section_id, title, content, order_num, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
          stepId,
          stepData.sectionId,
          stepData.title,
          stepData.content || '',
          stepData.orderNum,
          now,
          now
        );
        
        const row = db.prepare('SELECT * FROM manual_detail_steps WHERE id = ?').get(stepId) as any;
        const step = {
          id: row.id,
          sectionId: row.section_id,
          title: row.title,
          content: row.content,
          orderNum: row.order_num,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        };
        
        console.log(`[IPC] manual:createStep完了 - Step ID: ${stepId}`);
        return step;
      } catch (error) {
        console.error('[IPC] manual:createStep エラー:', error);
        throw error;
      }
    }
  );

  /**
   * ステップ一覧取得
   */
  ipcMain.handle(
    'manual:getSteps',
    async (_, sectionId: string) => {
      try {
        console.log(`[IPC] manual:getSteps - Section: ${sectionId}`);
        const db = getDatabase();
        
        const steps = db.prepare('SELECT * FROM manual_detail_steps WHERE section_id = ? ORDER BY order_num')
          .all(sectionId)
          .map((row: any) => ({
            id: row.id,
            sectionId: row.section_id,
            title: row.title,
            content: row.content,
            orderNum: row.order_num,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
          }));
        
        console.log(`[IPC] manual:getSteps完了 - ${steps.length}件`);
        return steps;
      } catch (error) {
        console.error('[IPC] manual:getSteps エラー:', error);
        throw error;
      }
    }
  );

  /**
   * ステップ更新
   */
  ipcMain.handle(
    'manual:updateStep',
    async (_, stepId: string, data: { title?: string; content?: string; orderNum?: number }) => {
      try {
        console.log(`[IPC] manual:updateStep - Step: ${stepId}`);
        const db = getDatabase();
        const now = Date.now();
        
        const updates: string[] = [];
        const params: any[] = [];
        
        if (data.title !== undefined) {
          updates.push('title = ?');
          params.push(data.title);
        }
        if (data.content !== undefined) {
          updates.push('content = ?');
          params.push(data.content);
        }
        if (data.orderNum !== undefined) {
          updates.push('order_num = ?');
          params.push(data.orderNum);
        }
        
        if (updates.length === 0) {
          return { success: true };
        }
        
        updates.push('updated_at = ?');
        params.push(now);
        params.push(stepId);
        
        db.prepare(`UPDATE manual_detail_steps SET ${updates.join(', ')} WHERE id = ?`).run(...params);
        
        const row = db.prepare('SELECT * FROM manual_detail_steps WHERE id = ?').get(stepId) as any;
        const step = {
          id: row.id,
          sectionId: row.section_id,
          title: row.title,
          content: row.content,
          orderNum: row.order_num,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        };
        
        console.log(`[IPC] manual:updateStep完了`);
        return step;
      } catch (error) {
        console.error('[IPC] manual:updateStep エラー:', error);
        throw error;
      }
    }
  );

  /**
   * ステップ削除
   */
  ipcMain.handle(
    'manual:deleteStep',
    async (_, stepId: string) => {
      try {
        console.log(`[IPC] manual:deleteStep - Step: ${stepId}`);
        const db = getDatabase();
        
        db.prepare('DELETE FROM manual_detail_steps WHERE id = ?').run(stepId);
        
        console.log(`[IPC] manual:deleteStep完了`);
        return { success: true };
      } catch (error) {
        console.error('[IPC] manual:deleteStep エラー:', error);
        throw error;
      }
    }
  );

  // ===== Phase 6.2.3 実装 =====


  // 詳細表を作成
  ipcMain.handle('manual:createDetailTable', async (_, params: { entityId: string; syncProcess?: boolean; syncBpmn?: boolean }) => {
    try {
      const { entityId, syncProcess = true, syncBpmn = true } = params;
      const db = getDatabase();
      const now = Date.now();

      // 親エンティティの存在確認
      const parentEntity = db.prepare('SELECT * FROM manuals WHERE id = ?').get(entityId) as Manual | undefined;
      if (!parentEntity) {
        throw new Error('親マニュアルが見つかりません');
      }

      // 既に詳細表が存在する場合はエラー
      if (parentEntity.detail_table_id) {
        throw new Error('既に詳細表が作成されています');
      }

      // ルートエンティティを作成
      const rootId = `root_${now}_${Math.random().toString(36).substring(7)}`;

      // ルートマニュアルをデータベースに挿入
      db.prepare(`
        INSERT INTO manuals (
          id, project_id, name, content, version,
          parent_entity_id, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        rootId,
        parentEntity.projectId,
        `${parentEntity.name} - 詳細`,
        '', // 空のコンテンツ
        1,
        entityId,
        now,
        now
      );

      // 親エンティティの detail_table_id を更新
      db.prepare('UPDATE manuals SET detail_table_id = ?, updated_at = ? WHERE id = ?')
        .run(rootId, now, entityId);

      // TODO: Phase 8.2 - 工程表・BPMNとの同期
      if (syncProcess) {
        console.log('[Manual] Process sync not yet implemented');
      }
      if (syncBpmn) {
        console.log('[Manual] BPMN sync not yet implemented');
      }

      console.log('[IPC] Manual detail table created:', rootId, 'for entity:', entityId);
      return { manualDetailTable: { id: rootId } };
    } catch (error) {
      console.error('[IPC] Error creating manual detail table:', error);
      throw error;
    }
  });

  // 詳細表を取得
  ipcMain.handle('manual:getDetailTable', async (_, entityId: string) => {
    try {
      const db = getDatabase();

      // エンティティの detail_table_id を取得
      const entity = db.prepare('SELECT detail_table_id FROM manuals WHERE id = ?').get(entityId) as { detail_table_id: string | null } | undefined;
      if (!entity || !entity.detail_table_id) {
        return null;
      }

      const rootId = entity.detail_table_id;

      // ルートエンティティを取得
      const root = db.prepare('SELECT * FROM manuals WHERE id = ?').get(rootId) as any;
      if (!root) {
        return null;
      }

      // 詳細表内の全エンティティを取得
      const entities = db.prepare('SELECT * FROM manuals WHERE parent_entity_id = ? OR id = ?')
        .all(entityId, rootId) as any[];

      // 親エンティティを取得
      const parentEntity = root.parent_entity_id
        ? db.prepare('SELECT * FROM manuals WHERE id = ?').get(root.parent_entity_id)
        : null;

      // 日付フィールドをDateオブジェクトに変換
      const convertDates = (obj: any) => {
        if (obj.created_at) obj.created_at = new Date(obj.created_at);
        if (obj.updated_at) obj.updated_at = new Date(obj.updated_at);
        return obj;
      };

      console.log('[IPC] Manual detail table retrieved:', rootId);
      return {
        root: convertDates(root),
        entities: entities.map(convertDates),
        parentEntity: parentEntity ? convertDates(parentEntity) : null,
      };
    } catch (error) {
      console.error('[IPC] Error getting manual detail table:', error);
      throw error;
    }
  });

  // 親エンティティを取得
  ipcMain.handle('manual:getParentEntity', async (_, rootId: string) => {
    try {
      const db = getDatabase();

      // ルートエンティティを取得
      const root = db.prepare('SELECT parent_entity_id FROM manuals WHERE id = ?').get(rootId) as { parent_entity_id: string | null } | undefined;
      if (!root || !root.parent_entity_id) {
        return null;
      }

      // 親エンティティを取得
      const parentEntity = db.prepare('SELECT * FROM manuals WHERE id = ?').get(root.parent_entity_id) as any;
      if (!parentEntity) {
        return null;
      }

      // 日付フィールドをDateオブジェクトに変換
      if (parentEntity.created_at) parentEntity.created_at = new Date(parentEntity.created_at);
      if (parentEntity.updated_at) parentEntity.updated_at = new Date(parentEntity.updated_at);

      console.log('[IPC] Manual parent entity retrieved:', root.parent_entity_id);
      return parentEntity;
    } catch (error) {
      console.error('[IPC] Error getting manual parent entity:', error);
      throw error;
    }
  });

  console.log('[IPC] Manual handlers registered');
}
