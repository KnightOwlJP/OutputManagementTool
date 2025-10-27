import { ipcMain } from 'electron';
import { getDatabase } from '../utils/database';
import { saveBpmnFile } from '../utils/file-system';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';

/**
 * BPMNファイルを読み込む
 */
async function loadBpmnFile(filePath: string): Promise<string> {
  try {
    const xmlContent = await fs.promises.readFile(filePath, 'utf-8');
    console.log('[BPMN] File loaded:', filePath);
    return xmlContent;
  } catch (error) {
    console.error('[BPMN] Error loading file:', error);
    throw new Error(`BPMNファイルの読み込みに失敗しました: ${filePath}`);
  }
}

// BpmnDiagram型定義（インライン）
interface BpmnDiagram {
  id: string;
  projectId: string;
  name: string;
  xmlContent: string;
  version: number;
  detail_table_id?: string | null;
  parent_entity_id?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface CreateBpmnDto {
  projectId: string;
  bpmnDiagramTableId?: string;
  name: string;
  xmlContent?: string;
}

interface UpdateBpmnDto {
  name?: string;
  xmlContent?: string;
}

// デフォルトBPMN XML
const DEFAULT_BPMN_XML = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
                  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
                  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
                  xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
                  id="Definitions_1"
                  targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_1" isExecutable="false">
    <bpmn:startEvent id="StartEvent_1"/>
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
      <bpmndi:BPMNShape id="_BPMNShape_StartEvent_2" bpmnElement="StartEvent_1">
        <dc:Bounds x="173" y="102" width="36" height="36"/>
      </bpmndi:BPMNShape>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;

/**
 * BPMN関連のIPCハンドラーを登録
 */
export function registerBpmnHandlers(): void {
  // BPMNダイアグラム作成
  ipcMain.handle('bpmn:create', async (_, data: CreateBpmnDto): Promise<BpmnDiagram> => {
    try {
      const db = getDatabase();
      const now = Date.now();
      const bpmnId = uuidv4();

      // プロジェクトの存在確認
      const project = db.prepare('SELECT id FROM projects WHERE id = ?').get(data.projectId) as { id: string } | undefined;
      if (!project) {
        throw new Error('プロジェクトが見つかりません');
      }

      // xmlContentが未指定の場合はデフォルトを使用
      const xmlContent = data.xmlContent || DEFAULT_BPMN_XML;

      // データベースに保存
      const stmt = db.prepare(`
        INSERT INTO bpmn_diagrams (
          id, project_id, bpmn_diagram_table_id, name, xml_content, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        bpmnId,
        data.projectId,
        data.bpmnDiagramTableId || null,
        data.name,
        xmlContent,
        now,
        now
      );

      const bpmnDiagram: BpmnDiagram = {
        id: bpmnId,
        projectId: data.projectId,
        name: data.name,
        xmlContent: xmlContent,
        version: 1,
        createdAt: new Date(now),
        updatedAt: new Date(now),
      };

      console.log('[IPC] BPMN diagram created:', bpmnId);
      return bpmnDiagram;
    } catch (error) {
      console.error('[IPC] Error creating BPMN diagram:', error);
      throw error;
    }
  });

  // プロジェクト内の全BPMNダイアグラムを取得
  ipcMain.handle('bpmn:getByProject', async (_, projectId: string): Promise<BpmnDiagram[]> => {
    try {
      const db = getDatabase();
      const stmt = db.prepare(`
        SELECT 
          id, project_id, name, file_path, version, created_at, updated_at
        FROM bpmn_diagrams
        WHERE project_id = ?
        ORDER BY updated_at DESC
      `);

      const rows = stmt.all(projectId) as Array<{
        id: string;
        project_id: string;
        name: string;
        file_path: string;
        version: number;
        created_at: number;
        updated_at: number;
      }>;

      const bpmnDiagrams: BpmnDiagram[] = await Promise.all(
        rows.map(async (row) => {
          // ファイルからXMLコンテンツを読み込み
          const xmlContent = await loadBpmnFile(row.file_path);
          
          return {
            id: row.id,
            projectId: row.project_id,
            name: row.name,
            xmlContent,
            version: row.version,
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at),
          };
        })
      );

      console.log('[IPC] BPMN diagrams fetched:', bpmnDiagrams.length);
      return bpmnDiagrams;
    } catch (error) {
      console.error('[IPC] Error fetching BPMN diagrams:', error);
      throw error;
    }
  });

  // BPMNダイアグラムをIDで取得
  ipcMain.handle('bpmn:getById', async (_, bpmnId: string): Promise<BpmnDiagram> => {
    try {
      const db = getDatabase();
      const stmt = db.prepare(`
        SELECT 
          id, project_id, name, file_path, version, created_at, updated_at
        FROM bpmn_diagrams
        WHERE id = ?
      `);

      const row = stmt.get(bpmnId) as {
        id: string;
        project_id: string;
        name: string;
        file_path: string;
        version: number;
        created_at: number;
        updated_at: number;
      } | undefined;

      if (!row) {
        throw new Error('BPMNダイアグラムが見つかりません');
      }

      // ファイルからXMLコンテンツを読み込み
      const xmlContent = await loadBpmnFile(row.file_path);

      const bpmnDiagram: BpmnDiagram = {
        id: row.id,
        projectId: row.project_id,
        name: row.name,
        xmlContent,
        version: row.version,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      };

      console.log('[IPC] BPMN diagram fetched:', bpmnId);
      return bpmnDiagram;
    } catch (error) {
      console.error('[IPC] Error fetching BPMN diagram:', error);
      throw error;
    }
  });

  // BPMNダイアグラムを更新
  ipcMain.handle('bpmn:update', async (_, bpmnId: string, data: UpdateBpmnDto): Promise<BpmnDiagram> => {
    try {
      const db = getDatabase();
      const now = Date.now();

      // 既存のBPMNダイアグラムを取得
      const existing = db.prepare('SELECT * FROM bpmn_diagrams WHERE id = ?').get(bpmnId) as {
        id: string;
        project_id: string;
        file_path: string;
        version: number;
      } | undefined;

      if (!existing) {
        throw new Error('BPMNダイアグラムが見つかりません');
      }

      // XMLコンテンツが更新された場合はファイルを保存
      if (data.xmlContent !== undefined) {
        await fs.promises.writeFile(existing.file_path, data.xmlContent, 'utf-8');
        console.log('[BPMN] File updated:', existing.file_path);
      }

      // 更新するフィールドを動的に構築
      const updates: string[] = [];
      const values: any[] = [];

      if (data.name !== undefined) {
        updates.push('name = ?');
        values.push(data.name);
      }

      if (data.xmlContent !== undefined) {
        // バージョンをインクリメント
        updates.push('version = version + 1');
      }

      updates.push('updated_at = ?');
      values.push(now);
      values.push(bpmnId);

      // 更新実行
      if (updates.length > 1) { // updated_at 以外の更新がある場合のみ
        const stmt = db.prepare(`
          UPDATE bpmn_diagrams 
          SET ${updates.join(', ')}
          WHERE id = ?
        `);
        stmt.run(...values);
      }

      // 更新後のデータを取得
      const updatedRow = db.prepare(`
        SELECT 
          id, project_id, name, file_path, version, created_at, updated_at
        FROM bpmn_diagrams
        WHERE id = ?
      `).get(bpmnId) as {
        id: string;
        project_id: string;
        name: string;
        file_path: string;
        version: number;
        created_at: number;
        updated_at: number;
      };

      // ファイルからXMLコンテンツを読み込み
      const xmlContent = await loadBpmnFile(updatedRow.file_path);

      const bpmnDiagram: BpmnDiagram = {
        id: updatedRow.id,
        projectId: updatedRow.project_id,
        name: updatedRow.name,
        xmlContent,
        version: updatedRow.version,
        createdAt: new Date(updatedRow.created_at),
        updatedAt: new Date(updatedRow.updated_at),
      };

      console.log('[IPC] BPMN diagram updated:', bpmnId);
      return bpmnDiagram;
    } catch (error) {
      console.error('[IPC] Error updating BPMN diagram:', error);
      throw error;
    }
  });

  // BPMNダイアグラムを削除
  ipcMain.handle('bpmn:delete', async (_, bpmnId: string): Promise<boolean> => {
    try {
      const db = getDatabase();

      // BPMNダイアグラムの情報を取得
      const bpmn = db.prepare('SELECT file_path FROM bpmn_diagrams WHERE id = ?').get(bpmnId) as { file_path: string } | undefined;
      if (!bpmn) {
        throw new Error('BPMNダイアグラムが見つかりません');
      }

      // トランザクション開始
      db.prepare('BEGIN TRANSACTION').run();

      try {
        // 工程との関連を解除
        db.prepare('UPDATE processes SET bpmn_element_id = NULL WHERE id IN (SELECT id FROM processes WHERE bpmn_element_id LIKE ?)')
          .run(`${bpmnId}%`);

        // BPMNダイアグラムを削除
        const result = db.prepare('DELETE FROM bpmn_diagrams WHERE id = ?').run(bpmnId);

        if (result.changes === 0) {
          throw new Error('BPMNダイアグラムが見つかりません');
        }

        // ファイルを削除
        const fs = require('fs').promises;
        try {
          await fs.unlink(bpmn.file_path);
        } catch (fileError) {
          console.warn('[IPC] Failed to delete BPMN file:', fileError);
          // ファイル削除失敗は警告のみ（データベースは削除済み）
        }

        // トランザクションコミット
        db.prepare('COMMIT').run();

        console.log('[IPC] BPMN diagram deleted:', bpmnId);
        return true;
      } catch (error) {
        // ロールバック
        db.prepare('ROLLBACK').run();
        throw error;
      }
    } catch (error) {
      console.error('[IPC] Error deleting BPMN diagram:', error);
      throw error;
    }
  });

  // ===== Phase 8: 階層構造管理 =====

  // 詳細表を作成
  ipcMain.handle('bpmn:createDetailTable', async (_, params: { entityId: string; syncProcess?: boolean; syncManual?: boolean }) => {
    try {
      const { entityId, syncProcess = true, syncManual = true } = params;
      const db = getDatabase();
      const now = Date.now();

      // 親エンティティの存在確認
      const parentEntity = db.prepare('SELECT * FROM bpmn_diagrams WHERE id = ?').get(entityId) as BpmnDiagram | undefined;
      if (!parentEntity) {
        throw new Error('親BPMNダイアグラムが見つかりません');
      }

      // 既に詳細表が存在する場合はエラー
      if (parentEntity.detail_table_id) {
        throw new Error('既に詳細表が作成されています');
      }

      // ルートエンティティを作成
      const rootId = `root_${now}_${Math.random().toString(36).substring(7)}`;
      
      // デフォルトBPMN XMLを生成
      const rootXml = DEFAULT_BPMN_XML.replace('Process_1', `Process_${rootId}`);

      // ルートBPMNダイアグラムをデータベースに挿入
      db.prepare(`
        INSERT INTO bpmn_diagrams (
          id, project_id, name, xml_content, version, file_path,
          parent_entity_id, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        rootId,
        parentEntity.projectId,
        `${parentEntity.name} - 詳細`,
        rootXml,
        1,
        `bpmn_${rootId}.bpmn`,
        entityId,
        now,
        now
      );

      // 親エンティティの detail_table_id を更新
      db.prepare('UPDATE bpmn_diagrams SET detail_table_id = ?, updated_at = ? WHERE id = ?')
        .run(rootId, now, entityId);

      // TODO: Phase 8.2 - 工程表・マニュアルとの同期
      if (syncProcess) {
        console.log('[BPMN] Process sync not yet implemented');
      }
      if (syncManual) {
        console.log('[BPMN] Manual sync not yet implemented');
      }

      console.log('[IPC] BPMN detail table created:', rootId, 'for entity:', entityId);
      return { bpmnDetailTable: { id: rootId } };
    } catch (error) {
      console.error('[IPC] Error creating BPMN detail table:', error);
      throw error;
    }
  });

  // 詳細表を取得
  ipcMain.handle('bpmn:getDetailTable', async (_, entityId: string) => {
    try {
      const db = getDatabase();

      // エンティティの detail_table_id を取得
      const entity = db.prepare('SELECT detail_table_id FROM bpmn_diagrams WHERE id = ?').get(entityId) as { detail_table_id: string | null } | undefined;
      if (!entity || !entity.detail_table_id) {
        return null;
      }

      const rootId = entity.detail_table_id;

      // ルートエンティティを取得
      const root = db.prepare('SELECT * FROM bpmn_diagrams WHERE id = ?').get(rootId) as any;
      if (!root) {
        return null;
      }

      // 詳細表内の全エンティティを取得
      const entities = db.prepare('SELECT * FROM bpmn_diagrams WHERE parent_entity_id = ? OR id = ?')
        .all(entityId, rootId) as any[];

      // 親エンティティを取得
      const parentEntity = root.parent_entity_id
        ? db.prepare('SELECT * FROM bpmn_diagrams WHERE id = ?').get(root.parent_entity_id)
        : null;

      // 日付フィールドをDateオブジェクトに変換
      const convertDates = (obj: any) => {
        if (obj.created_at) obj.created_at = new Date(obj.created_at);
        if (obj.updated_at) obj.updated_at = new Date(obj.updated_at);
        return obj;
      };

      console.log('[IPC] BPMN detail table retrieved:', rootId);
      return {
        root: convertDates(root),
        entities: entities.map(convertDates),
        parentEntity: parentEntity ? convertDates(parentEntity) : null,
      };
    } catch (error) {
      console.error('[IPC] Error getting BPMN detail table:', error);
      throw error;
    }
  });

  // 親エンティティを取得
  ipcMain.handle('bpmn:getParentEntity', async (_, rootId: string) => {
    try {
      const db = getDatabase();

      // ルートエンティティを取得
      const root = db.prepare('SELECT parent_entity_id FROM bpmn_diagrams WHERE id = ?').get(rootId) as { parent_entity_id: string | null } | undefined;
      if (!root || !root.parent_entity_id) {
        return null;
      }

      // 親エンティティを取得
      const parentEntity = db.prepare('SELECT * FROM bpmn_diagrams WHERE id = ?').get(root.parent_entity_id) as any;
      if (!parentEntity) {
        return null;
      }

      // 日付フィールドをDateオブジェクトに変換
      if (parentEntity.created_at) parentEntity.created_at = new Date(parentEntity.created_at);
      if (parentEntity.updated_at) parentEntity.updated_at = new Date(parentEntity.updated_at);

      console.log('[IPC] BPMN parent entity retrieved:', root.parent_entity_id);
      return parentEntity;
    } catch (error) {
      console.error('[IPC] Error getting BPMN parent entity:', error);
      throw error;
    }
  });

  console.log('[IPC] BPMN handlers registered');
}
