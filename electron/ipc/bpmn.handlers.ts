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

  console.log('[IPC] BPMN handlers registered');
}
