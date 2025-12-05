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

type ParsedBpmnElement = {
  elementId: string;
  elementType: 'task' | 'gateway' | 'event';
  name?: string;
  laneId?: string | null;
  beforeProcessIds?: string[];
  bpmnElement?: 'task' | 'gateway' | 'event';
  taskType?: string;
  gatewayType?: string;
  eventType?: string;
};

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

  // デバッグ用: sync_stateをクリア
  ipcMain.handle('bpmn:clearSyncState', async (_, processTableId?: string): Promise<void> => {
    try {
      const db = getDatabase();
      if (processTableId) {
        const result = db.prepare('DELETE FROM bpmn_sync_state WHERE process_table_id = ?').run(processTableId);
        logger.info('BpmnSync', 'Cleared sync state for process table', { processTableId, deletedRows: result.changes });
      } else {
        const result = db.prepare('DELETE FROM bpmn_sync_state').run();
        logger.info('BpmnSync', 'Cleared all sync states', { deletedRows: result.changes });
      }
    } catch (error) {
      logger.error('BpmnSync', 'Failed to clear sync state', error as Error);
      throw error;
    }
  });

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

        // 現在の工程・スイムレーンを取得
        const existingProcesses = db.prepare(`
          SELECT * FROM processes WHERE process_table_id = ?
        `).all(processTableId) as any[];

        const swimlanes = db.prepare(`
          SELECT * FROM process_table_swimlanes WHERE process_table_id = ? ORDER BY order_num
        `).all(processTableId) as any[];

        // 1. BPMN XMLをパースして要素一覧を抽出
        const parsedElements = parseBpmnXml(bpmnXml);
        const parsedIds = new Set(parsedElements.map((el) => el.elementId));

        // 2. 変更リストを構築（更新/作成/削除）
        const changeQueue: BpmnChange[] = parsedElements.map((el) => ({
          type: existingProcesses.some((p) => p.id === el.elementId) ? 'update' : 'create',
          elementType: el.elementType,
          elementId: el.elementId,
          data: { ...el },
        }));

        // BPMN上に存在しない工程は削除対象にする
        existingProcesses.forEach((proc) => {
          if (!parsedIds.has(proc.id)) {
            changeQueue.push({
              type: 'delete',
              elementType: 'task',
              elementId: proc.id,
              data: { processTableId },
            });
          }
        });

        // 3. 変更を工程データに適用
        for (const change of changeQueue) {
          const transactionId = uuidv4();
          const entityTypeForLog = change.elementType === 'task' ? 'process' : change.elementType;
          
          try {
            // 変更を適用
            const updatedProcess = applyChangeToProcess(db, change, swimlanes, processTableId);
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
              entityTypeForLog,
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
              entityTypeForLog,
              change.elementId,
              JSON.stringify(change.data),
              'failed',
              (error as Error).message,
              now
            );
          }
        }

        // 4. next_process_idsを再計算（before_process_idsの更新に追従）
        recalculateNextProcessIds(db, processTableId);

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
  // 工程表 → BPMN 同期（完全実装）
  ipcMain.handle('process:syncToBpmn', async (_, processTableId: string): Promise<void> => {
    try {
      logger.info('BpmnSync', 'Starting ProcessTable → BPMN sync', { processTableId });

      const db = getDatabase();
      const now = Date.now();

      // 工程表データを取得
      const processTable = db.prepare(`
        SELECT * FROM process_tables WHERE id = ?
      `).get(processTableId) as any;

      if (!processTable) {
        throw new Error(`ProcessTable not found: ${processTableId}`);
      }

      // 工程データを取得
      const processes = db.prepare(`
        SELECT * FROM processes WHERE process_table_id = ? ORDER BY order_num
      `).all(processTableId) as any[];

      // スイムレーンデータを取得
      const swimlanes = db.prepare(`
        SELECT * FROM process_table_swimlanes WHERE process_table_id = ? ORDER BY order_num
      `).all(processTableId) as any[];

      logger.info('BpmnSync', 'Loaded process data', {
        processTableId,
        processCount: processes.length,
        swimlaneCount: swimlanes.length,
      });

      // BPMN XML生成（完全な実装を使用）
      // 注: Electronプロセスから直接src/libを参照するため、動的requireを使用
      const path = require('path');
      const bpmnExporterPath = path.join(__dirname, '../../src/lib/bpmn-xml-exporter');
      const { exportProcessTableToBpmnXml } = require(bpmnExporterPath);
      
      const result = await exportProcessTableToBpmnXml({
        processTable: {
          id: processTable.id,
          projectId: processTable.project_id,
          name: processTable.name,
          level: processTable.level,
          description: processTable.description,
          displayOrder: processTable.display_order,
          createdAt: new Date(processTable.created_at),
          updatedAt: new Date(processTable.updated_at),
        },
        processes: processes.map((p: any) => ({
          id: p.id,
          processTableId: p.process_table_id,
          laneId: p.lane_id,
          name: p.name,
          bpmnElement: (p.bpmn_element as 'task' | 'event' | 'gateway') || 'task',
          taskType: p.task_type || 'userTask',
          beforeProcessIds: p.before_process_ids ? JSON.parse(p.before_process_ids) : [],
          nextProcessIds: p.next_process_ids ? JSON.parse(p.next_process_ids) : [],
          gatewayType: p.gateway_type || undefined,
          conditionalFlows: p.conditional_flows ? JSON.parse(p.conditional_flows) : undefined,
          eventType: p.event_type || undefined,
          intermediateEventType: p.intermediate_event_type || undefined,
          eventDetails: p.event_details || undefined,
          documentation: p.documentation || undefined,
          customColumns: p.custom_columns ? JSON.parse(p.custom_columns) : undefined,
          displayOrder: p.order_num ?? p.display_order,
          createdAt: new Date(p.created_at),
          updatedAt: new Date(p.updated_at),
        })),
        swimlanes: swimlanes.map((s: any) => ({
          id: s.id,
          processTableId: s.process_table_id,
          name: s.name,
          color: s.color,
          order: s.order_num,
          createdAt: new Date(s.created_at),
          updatedAt: new Date(s.updated_at),
        })),
        autoLayout: true,
      });

      const bpmnXml = result.xml;
      
      logger.info('BpmnSync', 'Generated BPMN XML', {
        processTableId,
        xmlLength: bpmnXml.length,
        processCount: result.processCount,
        laneCount: result.laneCount,
      });

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
const TASK_TAGS = [
  'bpmn:task',
  'bpmn:userTask',
  'bpmn:manualTask',
  'bpmn:serviceTask',
  'bpmn:scriptTask',
  'bpmn:businessRuleTask',
  'bpmn:sendTask',
  'bpmn:receiveTask',
];

const GATEWAY_TAGS = [
  'bpmn:exclusiveGateway',
  'bpmn:parallelGateway',
  'bpmn:inclusiveGateway',
];

const EVENT_TAGS = [
  'bpmn:startEvent',
  'bpmn:endEvent',
  'bpmn:intermediateCatchEvent',
];

function normalizeProcessId(rawId: string | null): string | null {
  if (!rawId) return null;
  if (rawId.startsWith('Process_')) return rawId.replace(/^Process_/, '');
  return rawId;
}

function normalizeLaneId(rawId: string | null): string | null {
  if (!rawId) return null;
  if (rawId.startsWith('Lane_')) return rawId.replace(/^Lane_/, '');
  return rawId;
}

function getDefaultLaneId(swimlanes: any[]): string | null {
  if (!swimlanes || swimlanes.length === 0) return null;
  return swimlanes[0].id as string;
}

function recalculateNextProcessIds(db: any, processTableId: string): void {
  // 1. 次工程を一旦クリア
  db.prepare('UPDATE processes SET next_process_ids = NULL WHERE process_table_id = ?').run(processTableId);

  // 2. 現在のbefore_process_idsを取得
  const rows = db.prepare('SELECT id, before_process_ids FROM processes WHERE process_table_id = ?').all(processTableId) as Array<{
    id: string;
    before_process_ids: string | null;
  }>;

  const nextMap = new Map<string, Set<string>>();

  rows.forEach((row) => {
    if (!row.before_process_ids) return;
    const befores: string[] = JSON.parse(row.before_process_ids);
    befores.forEach((beforeId) => {
      if (!nextMap.has(beforeId)) {
        nextMap.set(beforeId, new Set());
      }
      nextMap.get(beforeId)!.add(row.id);
    });
  });

  // 3. next_process_idsを更新
  nextMap.forEach((targets, sourceId) => {
    db.prepare('UPDATE processes SET next_process_ids = ? WHERE id = ?')
      .run(JSON.stringify(Array.from(targets)), sourceId);
  });
}

/**
 * BPMN XMLをパースして要素情報を抽出
 */
function parseBpmnXml(xml: string): ParsedBpmnElement[] {
  const parsedElements: Map<string, ParsedBpmnElement> = new Map();
  const laneAssignments: Map<string, string> = new Map();
  const beforeMap: Map<string, string[]> = new Map();

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, 'text/xml');

    // レーンの割り当てを先に集計
    const lanes = doc.getElementsByTagName('bpmn:lane');
    for (let i = 0; i < lanes.length; i++) {
      const lane = lanes[i];
      const laneId = normalizeLaneId(lane.getAttribute('id'));
      const nodeRefs = lane.getElementsByTagName('bpmn:flowNodeRef');
      for (let j = 0; j < nodeRefs.length; j++) {
        const refText = nodeRefs[j].textContent?.trim() || null;
        const processId = normalizeProcessId(refText);
        if (processId && laneId) {
          laneAssignments.set(processId, laneId);
        }
      }
    }

    // タスク系ノード
    TASK_TAGS.forEach((tag) => {
      const nodes = doc.getElementsByTagName(tag);
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        const rawId = node.getAttribute('id');
        const elementId = normalizeProcessId(rawId);
        if (!elementId) continue;

        const derivedTaskType = tag === 'bpmn:task' ? 'userTask' : tag.replace('bpmn:', '');

        parsedElements.set(elementId, {
          elementId,
          elementType: 'task',
          bpmnElement: 'task',
          taskType: derivedTaskType || 'userTask',
          name: node.getAttribute('name') || undefined,
        });
      }
    });

    // ゲートウェイ
    GATEWAY_TAGS.forEach((tag) => {
      const nodes = doc.getElementsByTagName(tag);
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        const elementId = normalizeProcessId(node.getAttribute('id'));
        if (!elementId) continue;

        parsedElements.set(elementId, {
          elementId,
          elementType: 'gateway',
          bpmnElement: 'gateway',
          gatewayType: tag.includes('parallel') ? 'parallel' : tag.includes('inclusive') ? 'inclusive' : 'exclusive',
          name: node.getAttribute('name') || undefined,
        });
      }
    });

    // イベント
    EVENT_TAGS.forEach((tag) => {
      const nodes = doc.getElementsByTagName(tag);
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        const elementId = normalizeProcessId(node.getAttribute('id'));
        if (!elementId) continue;

        let eventType: 'start' | 'end' | 'intermediate' = 'start';
        if (tag.includes('endEvent')) eventType = 'end';
        if (tag.includes('intermediate')) eventType = 'intermediate';

        parsedElements.set(elementId, {
          elementId,
          elementType: 'event',
          bpmnElement: 'event',
          eventType,
          name: node.getAttribute('name') || undefined,
        });
      }
    });

    // シーケンスフローから前工程を集計（解析対象に存在するノードのみ）
    const sequenceFlows = doc.getElementsByTagName('bpmn:sequenceFlow');
    for (let i = 0; i < sequenceFlows.length; i++) {
      const flow = sequenceFlows[i];
      const sourceId = normalizeProcessId(flow.getAttribute('sourceRef'));
      const targetId = normalizeProcessId(flow.getAttribute('targetRef'));
      if (!sourceId || !targetId) continue;
      if (!parsedElements.has(sourceId) || !parsedElements.has(targetId)) continue;

      if (!beforeMap.has(targetId)) {
        beforeMap.set(targetId, []);
      }
      beforeMap.get(targetId)!.push(sourceId);
    }

    // lane/フロー情報を適用
    parsedElements.forEach((el, key) => {
      const laneId = laneAssignments.get(key) || el.laneId || null;
      const beforeList = beforeMap.get(key) || [];
      parsedElements.set(key, {
        ...el,
        laneId,
        beforeProcessIds: beforeList,
      });
    });
  } catch (error) {
    logger.error('BpmnSync', 'Failed to parse BPMN XML', error as Error);
  }

  return Array.from(parsedElements.values());
}

/**
 * 変更を工程データに適用
 */
function applyChangeToProcess(db: any, change: BpmnChange, swimlanes: any[], processTableId: string): any {
  const now = Date.now();

  const hasLane = (laneId: string | null | undefined) => {
    if (!laneId) return false;
    return swimlanes.some((s) => s.id === laneId);
  };

  switch (change.type) {
    case 'update': {
      const existing = db.prepare('SELECT * FROM processes WHERE id = ?').get(change.elementId) as any | undefined;
      if (!existing) {
        // 存在しない場合は作成にフォールバック
        return applyChangeToProcess(db, { ...change, type: 'create' }, swimlanes, processTableId);
      }

      let laneId = change.data.laneId || existing.lane_id || getDefaultLaneId(swimlanes);
      if (!hasLane(laneId)) {
        laneId = getDefaultLaneId(swimlanes);
      }
      const beforeProcessIds = Array.isArray(change.data.beforeProcessIds)
        ? change.data.beforeProcessIds
        : existing.before_process_ids
          ? JSON.parse(existing.before_process_ids)
          : [];

      db.prepare(`
        UPDATE processes
        SET name = COALESCE(?, name),
            lane_id = COALESCE(?, lane_id),
            bpmn_element = COALESCE(?, bpmn_element),
            task_type = COALESCE(?, task_type),
            gateway_type = COALESCE(?, gateway_type),
            event_type = COALESCE(?, event_type),
            before_process_ids = ?,
            updated_at = ?
        WHERE id = ?
      `).run(
        change.data.name ?? existing.name,
        laneId,
        change.data.bpmnElement ?? existing.bpmn_element ?? 'task',
        change.data.taskType ?? existing.task_type ?? 'userTask',
        change.data.gatewayType ?? existing.gateway_type ?? null,
        change.data.eventType ?? existing.event_type ?? null,
        JSON.stringify(beforeProcessIds || []),
        now,
        change.elementId
      );

      return db.prepare('SELECT * FROM processes WHERE id = ?').get(change.elementId);
    }

    case 'create': {
      let laneId = change.data.laneId || getDefaultLaneId(swimlanes);
      if (!hasLane(laneId)) {
        laneId = getDefaultLaneId(swimlanes);
      }
      if (!laneId) {
        throw new Error('No swimlane available to assign the new process');
      }

      const beforeProcessIds = Array.isArray(change.data.beforeProcessIds)
        ? change.data.beforeProcessIds
        : [];

      const nextDisplayOrder = db.prepare('SELECT COALESCE(MAX(display_order), -1) + 1 as next_order FROM processes WHERE process_table_id = ?')
        .get(processTableId) as { next_order: number };

      db.prepare(`
        INSERT INTO processes (
          id, process_table_id, name, lane_id, bpmn_element, task_type,
          before_process_ids, documentation,
          gateway_type, conditional_flows,
          event_type, intermediate_event_type, event_details,
          input_data_objects, output_data_objects,
          message_flows, artifacts,
          custom_columns, display_order, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        change.elementId,
        processTableId,
        change.data.name || '新しい工程',
        laneId,
        change.data.bpmnElement || change.elementType || 'task',
        change.data.taskType || 'userTask',
        JSON.stringify(beforeProcessIds || []),
        null,
        change.data.gatewayType || null,
        null,
        change.data.eventType || null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        nextDisplayOrder.next_order,
        now,
        now
      );

      return db.prepare('SELECT * FROM processes WHERE id = ?').get(change.elementId);
    }

    case 'delete': {
      db.prepare('DELETE FROM processes WHERE id = ?').run(change.elementId);

      // 他の工程のbefore_process_idsから削除対象を除外
      const rows = db.prepare('SELECT id, before_process_ids FROM processes WHERE process_table_id = ?').all(processTableId) as any[];
      rows.forEach((row) => {
        const beforeIds = row.before_process_ids ? JSON.parse(row.before_process_ids) : [];
        const filtered = beforeIds.filter((id: string) => id !== change.elementId);
        if (filtered.length !== beforeIds.length) {
          db.prepare('UPDATE processes SET before_process_ids = ?, updated_at = ? WHERE id = ?')
            .run(JSON.stringify(filtered), now, row.id);
        }
      });

      return null;
    }
  }

  return null;
}
