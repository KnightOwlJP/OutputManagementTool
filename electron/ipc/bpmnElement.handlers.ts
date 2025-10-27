import { ipcMain } from 'electron';
import { getDatabase } from '../utils/database';

/**
 * BPMN要素管理のIPCハンドラー
 */
export function registerBpmnElementHandlers() {
  console.log('[BpmnElement] Registering IPC handlers...');

  // BPMN要素を作成
  ipcMain.handle('bpmnElement:create', async (_, data) => {
    const db = getDatabase();
    const id = `bpmn_elem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = Date.now();

    // 最大表示順序を取得
    const maxOrder = db.prepare(`
      SELECT COALESCE(MAX(display_order), -1) as max_order
      FROM bpmn_elements
      WHERE project_id = ?
    `).get(data.projectId) as { max_order: number };

    const stmt = db.prepare(`
      INSERT INTO bpmn_elements (
        id, project_id, process_table_id, bpmn_diagram_id, element_type,
        name, bpmn_element_id, properties, linked_process_ids,
        display_order, sync_status, last_sync_at, created_at, updated_at, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      data.projectId,
      data.processTableId || null,
      data.bpmnDiagramId || null,
      data.elementType,
      data.name,
      data.bpmnElementId,
      data.properties ? JSON.stringify(data.properties) : null,
      data.linkedProcessIds ? JSON.stringify(data.linkedProcessIds) : null,
      maxOrder.max_order + 1,
      'synced',
      now,
      now,
      now,
      null
    );

    console.log(`[BpmnElement] Created BPMN element: ${id}`);
    return {
      id,
      ...data,
      displayOrder: maxOrder.max_order + 1,
      syncStatus: 'synced',
      lastSyncAt: new Date(now),
      createdAt: new Date(now),
      updatedAt: new Date(now),
    };
  });

  // プロジェクトのBPMN要素一覧を取得
  ipcMain.handle('bpmnElement:getByProject', async (_, projectId: string) => {
    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT
        id, project_id, process_table_id, bpmn_diagram_id, element_type,
        name, bpmn_element_id, properties, linked_process_ids,
        display_order, sync_status, last_sync_at, created_at, updated_at, metadata
      FROM bpmn_elements
      WHERE project_id = ?
      ORDER BY display_order ASC
    `);

    const rows = stmt.all(projectId) as any[];
    console.log(`[BpmnElement] Retrieved ${rows.length} BPMN elements for project ${projectId}`);

    return rows.map(mapBpmnElementRow);
  });

  // BPMN図のBPMN要素一覧を取得
  ipcMain.handle('bpmnElement:getByBpmnDiagram', async (_, bpmnDiagramId: string) => {
    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT
        id, project_id, process_table_id, bpmn_diagram_id, element_type,
        name, bpmn_element_id, properties, linked_process_ids,
        display_order, sync_status, last_sync_at, created_at, updated_at, metadata
      FROM bpmn_elements
      WHERE bpmn_diagram_id = ?
      ORDER BY display_order ASC
    `);

    const rows = stmt.all(bpmnDiagramId) as any[];
    console.log(`[BpmnElement] Retrieved ${rows.length} BPMN elements for diagram ${bpmnDiagramId}`);

    return rows.map(mapBpmnElementRow);
  });

  // BPMN要素を取得
  ipcMain.handle('bpmnElement:getById', async (_, id: string) => {
    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT
        id, project_id, process_table_id, bpmn_diagram_id, element_type,
        name, bpmn_element_id, properties, linked_process_ids,
        display_order, sync_status, last_sync_at, created_at, updated_at, metadata
      FROM bpmn_elements
      WHERE id = ?
    `);

    const row = stmt.get(id) as any;
    if (!row) return null;

    return mapBpmnElementRow(row);
  });

  // BPMN要素を更新
  ipcMain.handle('bpmnElement:update', async (_, id: string, data: any) => {
    const db = getDatabase();
    const updates: string[] = [];
    const values: any[] = [];

    if (data.name !== undefined) {
      updates.push('name = ?');
      values.push(data.name);
    }
    if (data.elementType !== undefined) {
      updates.push('element_type = ?');
      values.push(data.elementType);
    }
    if (data.properties !== undefined) {
      updates.push('properties = ?');
      values.push(data.properties ? JSON.stringify(data.properties) : null);
    }
    if (data.linkedProcessIds !== undefined) {
      updates.push('linked_process_ids = ?');
      values.push(data.linkedProcessIds ? JSON.stringify(data.linkedProcessIds) : null);
    }
    if (data.syncStatus !== undefined) {
      updates.push('sync_status = ?');
      values.push(data.syncStatus);
    }
    if (data.processTableId !== undefined) {
      updates.push('process_table_id = ?');
      values.push(data.processTableId);
    }
    if (data.bpmnDiagramId !== undefined) {
      updates.push('bpmn_diagram_id = ?');
      values.push(data.bpmnDiagramId);
    }

    updates.push('updated_at = ?');
    values.push(Date.now());

    values.push(id);

    const stmt = db.prepare(`
      UPDATE bpmn_elements
      SET ${updates.join(', ')}
      WHERE id = ?
    `);

    stmt.run(...values);
    console.log(`[BpmnElement] Updated BPMN element: ${id}`);

    // 更新後のデータを返す
    return ipcMain.emit('bpmnElement:getById', null, id);
  });

  // BPMN要素を削除
  ipcMain.handle('bpmnElement:delete', async (_, id: string) => {
    const db = getDatabase();
    db.prepare('DELETE FROM bpmn_elements WHERE id = ?').run(id);

    console.log(`[BpmnElement] Deleted BPMN element: ${id}`);
    return true;
  });

  // BPMNからBPMN要素を同期
  ipcMain.handle('bpmnElement:syncFromBpmn', async (_, bpmnDiagramId: string) => {
    // TODO: BPMNのXMLをパースして要素を抽出し、データベースに同期
    console.log(`[BpmnElement] Syncing elements from BPMN diagram: ${bpmnDiagramId}`);

    // プレースホルダー実装
    return {
      created: 0,
      updated: 0,
      deleted: 0,
    };
  });

  console.log('[BpmnElement] IPC handlers registered');
}

// ヘルパー関数: DB行をオブジェクトにマッピング
function mapBpmnElementRow(row: any) {
  return {
    id: row.id,
    projectId: row.project_id,
    processTableId: row.process_table_id,
    bpmnDiagramId: row.bpmn_diagram_id,
    elementType: row.element_type,
    name: row.name,
    bpmnElementId: row.bpmn_element_id,
    properties: row.properties ? JSON.parse(row.properties) : null,
    linkedProcessIds: row.linked_process_ids ? JSON.parse(row.linked_process_ids) : null,
    displayOrder: row.display_order,
    syncStatus: row.sync_status,
    lastSyncAt: row.last_sync_at ? new Date(row.last_sync_at) : null,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    metadata: row.metadata ? JSON.parse(row.metadata) : null,
  };
}
