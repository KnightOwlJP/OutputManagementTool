/**
 * Phase 9.1: BPMN-工程表 双方向同期 IPC Handlers
 */

import { ipcMain } from 'electron';
import { getDatabase } from '../utils/database';
import { getLogger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';
import { DOMParser } from '@xmldom/xmldom';

const logger = getLogger();

// ==========================================
// 型定義
// ==========================================

interface BpmnSyncState {
  id: string;
  processTableId: string;
  bpmnXml: string;
  lastSyncedAt: number;
  lastModifiedBy: 'process' | 'bpmn';
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

interface BpmnChange {
  type: 'create' | 'update' | 'delete' | 'move';
  elementType: 'task' | 'gateway' | 'event' | 'lane' | 'edge';
  elementId: string;
  data: Record<string, any>;
}

interface SyncResult {
  success: boolean;
  conflicts?: Conflict[];
  updatedProcesses?: any[];
  newVersion: number;
}

interface Conflict {
  type: 'version_mismatch' | 'concurrent_edit';
  message: string;
  expectedVersion: number;
  actualVersion: number;
}

interface SyncTransaction {
  id: string;
  processTableId: string;
  source: 'process' | 'bpmn';
  operation: 'create' | 'update' | 'delete' | 'reorder' | 'move';
  entityType: 'process' | 'lane' | 'gateway' | 'edge' | 'event';
  entityId?: string;
  changes: string;
  status: 'pending' | 'applied' | 'failed' | 'conflict';
  errorMessage?: string;
  createdAt: number;
  appliedAt?: number;
}

// ==========================================
// Phase 9.1: BPMN同期ハンドラー登録
// ==========================================

export function registerBpmnSyncHandlers(): void {
  logger.info('BpmnSync', 'Registering Phase 9.1 BPMN sync handlers...');

  // 同期状態取得
  ipcMain.handle('bpmn:getSyncState', async (_, processTableId: string): Promise<BpmnSyncState | null> => {
    try {
      const db = getDatabase();
      const row = db.prepare(`
        SELECT * FROM bpmn_sync_state WHERE process_table_id = ?
      `).get(processTableId) as any;

      if (!row) return null;

      return {
        id: row.id,
        processTableId: row.process_table_id,
        bpmnXml: row.bpmn_xml,
        lastSyncedAt: row.last_synced_at,
        lastModifiedBy: row.last_modified_by,
        version: row.version,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      };
    } catch (error) {
      logger.error('BpmnSync', 'Failed to get sync state', error as Error);
      throw error;
    }
  });

  // BPMN → 工程表 同期
  ipcMain.handle('bpmn:syncToProcessTable', async (_, params: {
    processTableId: string;
    bpmnXml: string;
    changes?: BpmnChange[];
    version: number;
  }): Promise<SyncResult> => {
    const db = getDatabase();
    const { processTableId, bpmnXml, changes = [], version: requestVersion } = params;

    try {
      logger.info('BpmnSync', 'Starting BPMN → ProcessTable sync', {
        processTableId,
        changesCount: changes.length,
        requestVersion,
      });

      // バージョンチェック（楽観的ロック）
      const currentState = db.prepare(`
        SELECT version FROM bpmn_sync_state WHERE process_table_id = ?
      `).get(processTableId) as { version: number } | undefined;

      if (currentState && currentState.version !== requestVersion) {
        logger.warn('BpmnSync', 'Version conflict detected', {
          expectedVersion: requestVersion,
          actualVersion: currentState.version,
        });

        return {
          success: false,
          conflicts: [{
            type: 'version_mismatch',
            message: '他のユーザーによって工程表が更新されています',
            expectedVersion: requestVersion,
            actualVersion: currentState.version,
          }],
          newVersion: currentState.version,
        };
      }

      // トランザクション内で同期処理
      const result = db.transaction(() => {
        const now = Date.now();
        const updatedProcesses: any[] = [];

        // 1. BPMN XMLをパースして変更を抽出
        const parsedChanges = parseBpmnXml(bpmnXml, processTableId);
        
        // 2. 変更を工程データに適用
        for (const change of parsedChanges) {
          const transactionId = uuidv4();
          
          try {
            // 変更を適用
            const updatedProcess = applyChangeToProcess(db, change);
            if (updatedProcess) {
              updatedProcesses.push(updatedProcess);
            }

            // トランザクションログ記録
            db.prepare(`
              INSERT INTO sync_transactions (
                id, process_table_id, source, operation, entity_type,
                entity_id, changes, status, created_at, applied_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).run(
              transactionId,
              processTableId,
              'bpmn',
              change.type,
              change.elementType,
              change.elementId,
              JSON.stringify(change.data),
              'applied',
              now,
              now
            );
          } catch (error) {
            logger.error('BpmnSync', `Failed to apply change ${change.elementId}`, error as Error);
            
            // エラーログ記録
            db.prepare(`
              INSERT INTO sync_transactions (
                id, process_table_id, source, operation, entity_type,
                entity_id, changes, status, error_message, created_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).run(
              transactionId,
              processTableId,
              'bpmn',
              change.type,
              change.elementType,
              change.elementId,
              JSON.stringify(change.data),
              'failed',
              (error as Error).message,
              now
            );
          }
        }

        // 3. sync_stateを更新
        const newVersion = (currentState?.version || 0) + 1;
        
        if (currentState) {
          db.prepare(`
            UPDATE bpmn_sync_state
            SET bpmn_xml = ?, last_synced_at = ?, last_modified_by = ?, version = ?, updated_at = ?
            WHERE process_table_id = ?
          `).run(bpmnXml, now, 'bpmn', newVersion, now, processTableId);
        } else {
          db.prepare(`
            INSERT INTO bpmn_sync_state (
              id, process_table_id, bpmn_xml, last_synced_at,
              last_modified_by, version, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            uuidv4(),
            processTableId,
            bpmnXml,
            now,
            'bpmn',
            newVersion,
            now,
            now
          );
        }

        return {
          success: true,
          updatedProcesses,
          newVersion,
        };
      })();

      logger.info('BpmnSync', 'BPMN → ProcessTable sync completed', {
        processTableId,
        updatedCount: result.updatedProcesses.length,
        newVersion: result.newVersion,
      });

      return result;
    } catch (error) {
      logger.error('BpmnSync', 'BPMN → ProcessTable sync failed', error as Error);
      throw error;
    }
  });

  // 工程表 → BPMN 同期（process:updateから呼ばれる）
  ipcMain.handle('process:syncToBpmn', async (_, processTableId: string): Promise<void> => {
    try {
      logger.info('BpmnSync', 'Starting ProcessTable → BPMN sync', { processTableId });

      const db = getDatabase();
      const now = Date.now();

      // 工程データからBPMN XMLを生成
      const processes = db.prepare(`
        SELECT * FROM processes WHERE process_table_id = ?
      `).all(processTableId);

      const swimlanes = db.prepare(`
        SELECT * FROM process_table_swimlanes WHERE process_table_id = ?
      `).all(processTableId);

      const bpmnXml = generateBpmnXmlFromProcesses(processes, swimlanes);

      // sync_stateを更新
      const currentState = db.prepare(`
        SELECT version FROM bpmn_sync_state WHERE process_table_id = ?
      `).get(processTableId) as { version: number } | undefined;

      const newVersion = (currentState?.version || 0) + 1;

      if (currentState) {
        db.prepare(`
          UPDATE bpmn_sync_state
          SET bpmn_xml = ?, last_synced_at = ?, last_modified_by = ?, version = ?, updated_at = ?
          WHERE process_table_id = ?
        `).run(bpmnXml, now, 'process', newVersion, now, processTableId);
      } else {
        db.prepare(`
          INSERT INTO bpmn_sync_state (
            id, process_table_id, bpmn_xml, last_synced_at,
            last_modified_by, version, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          uuidv4(),
          processTableId,
          bpmnXml,
          now,
          'process',
          newVersion,
          now,
          now
        );
      }

      logger.info('BpmnSync', 'ProcessTable → BPMN sync completed', {
        processTableId,
        newVersion,
      });
    } catch (error) {
      logger.error('BpmnSync', 'ProcessTable → BPMN sync failed', error as Error);
      throw error;
    }
  });

  logger.info('BpmnSync', 'Phase 9.1 BPMN sync handlers registered successfully');
}

// ==========================================
// ヘルパー関数
// ==========================================

/**
 * BPMN XMLをパースして変更リストを抽出
 */
function parseBpmnXml(xml: string, processTableId: string): BpmnChange[] {
  const changes: BpmnChange[] = [];
  
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, 'text/xml');

    // taskノードを抽出
    const tasks = doc.getElementsByTagName('bpmn:task');
    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];
      const taskId = task.getAttribute('id');
      const taskName = task.getAttribute('name');

      if (taskId && taskName) {
        changes.push({
          type: 'update',
          elementType: 'task',
          elementId: taskId,
          data: { name: taskName },
        });
      }
    }

    // TODO: lane, gateway, sequenceFlow等の解析を追加

  } catch (error) {
    logger.error('BpmnSync', 'Failed to parse BPMN XML', error as Error);
  }

  return changes;
}

/**
 * 変更を工程データに適用
 */
function applyChangeToProcess(db: any, change: BpmnChange): any {
  const now = Date.now();

  switch (change.type) {
    case 'update':
      if (change.elementType === 'task') {
        const result = db.prepare(`
          UPDATE processes
          SET name = ?, updated_at = ?
          WHERE id = ?
        `).run(change.data.name, now, change.elementId);

        if (result.changes > 0) {
          return db.prepare('SELECT * FROM processes WHERE id = ?').get(change.elementId);
        }
      }
      break;

    case 'create':
      // TODO: 新規工程作成ロジック
      break;

    case 'delete':
      // TODO: 工程削除ロジック
      break;
  }

  return null;
}

/**
 * 工程データからBPMN XMLを生成
 */
function generateBpmnXmlFromProcesses(processes: any[], swimlanes: any[]): string {
  // 簡易実装: 既存のexportProcessTableToBpmnXmlを使用すべき
  // TODO: src/lib/bpmn-xml-exporter.tsと統合
  
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
                  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
                  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
                  id="Definitions_1"
                  targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_1" isExecutable="false">
    <bpmn:startEvent id="StartEvent_1"/>
`;

  processes.forEach((p: any) => {
    xml += `    <bpmn:task id="${p.id}" name="${p.name}"/>\n`;
  });

  xml += `    <bpmn:endEvent id="EndEvent_1"/>
  </bpmn:process>
</bpmn:definitions>`;

  return xml;
}
