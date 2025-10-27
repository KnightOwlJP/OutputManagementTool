import { ipcMain } from 'electron';
import { getDatabase } from '../utils/database';
import { getLogger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

const logger = getLogger();

// V2: Process型定義（フラット構造、BPMN 2.0完全統合）
type BpmnElementType = 'task' | 'event' | 'gateway';
type BpmnTaskType = 'userTask' | 'serviceTask' | 'manualTask' | 'scriptTask' | 'businessRuleTask' | 'sendTask' | 'receiveTask';
type GatewayType = 'exclusive' | 'parallel' | 'inclusive';
type EventType = 'start' | 'end' | 'intermediate';
type IntermediateEventType = 'timer' | 'message' | 'error' | 'signal' | 'conditional';

interface Process {
  id: string;
  processTableId: string;
  name: string;
  laneId: string;
  bpmnElement: BpmnElementType;
  taskType: BpmnTaskType;
  beforeProcessIds?: string[];
  nextProcessIds?: string[];
  documentation?: string;
  gatewayType?: GatewayType;
  conditionalFlows?: Array<{ condition: string; targetProcessId: string }>;
  eventType?: EventType;
  intermediateEventType?: IntermediateEventType;
  eventDetails?: string;
  inputDataObjects?: string[];
  outputDataObjects?: string[];
  messageFlows?: Array<{ source: string; target: string; message?: string }>;
  artifacts?: Array<{ type: string; content: string }>;
  customColumns?: Record<string, any>;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

interface CreateProcessDto {
  processTableId: string;
  name: string;
  laneId: string;
  bpmnElement?: BpmnElementType;
  taskType?: BpmnTaskType;
  beforeProcessIds?: string[];
  documentation?: string;
  gatewayType?: GatewayType;
  conditionalFlows?: Array<{ condition: string; targetProcessId: string }>;
  eventType?: EventType;
  intermediateEventType?: IntermediateEventType;
  eventDetails?: string;
  inputDataObjects?: string[];
  outputDataObjects?: string[];
  messageFlows?: Array<{ source: string; target: string; message?: string }>;
  artifacts?: Array<{ type: string; content: string }>;
  customColumns?: Record<string, any>;
  displayOrder?: number;
}

interface UpdateProcessDto {
  name?: string;
  laneId?: string;
  bpmnElement?: BpmnElementType;
  taskType?: BpmnTaskType;
  beforeProcessIds?: string[];
  documentation?: string;
  gatewayType?: GatewayType;
  conditionalFlows?: Array<{ condition: string; targetProcessId: string }>;
  eventType?: EventType;
  intermediateEventType?: IntermediateEventType;
  eventDetails?: string;
  inputDataObjects?: string[];
  outputDataObjects?: string[];
  messageFlows?: Array<{ source: string; target: string; message?: string }>;
  artifacts?: Array<{ type: string; content: string }>;
  customColumns?: Record<string, any>;
  displayOrder?: number;
}

interface CreateProcessResult {
  process: Process;
  nextProcessIdsUpdated: boolean;
}

interface UpdateProcessResult {
  process: Process;
  nextProcessIdsUpdated: boolean;
}

interface DeleteProcessResult {
  success: boolean;
  nextProcessIdsUpdated: boolean;
}

/**
 * DB行をProcessオブジェクトに変換
 */
function rowToProcess(row: any): Process {
  return {
    id: row.id,
    processTableId: row.process_table_id,
    name: row.name,
    laneId: row.lane_id,
    bpmnElement: row.bpmn_element as BpmnElementType,
    taskType: row.task_type as BpmnTaskType,
    beforeProcessIds: row.before_process_ids ? JSON.parse(row.before_process_ids) : undefined,
    nextProcessIds: row.next_process_ids ? JSON.parse(row.next_process_ids) : undefined,
    documentation: row.documentation || undefined,
    gatewayType: row.gateway_type as GatewayType | undefined,
    conditionalFlows: row.conditional_flows ? JSON.parse(row.conditional_flows) : undefined,
    eventType: row.event_type as EventType | undefined,
    intermediateEventType: row.intermediate_event_type as IntermediateEventType | undefined,
    eventDetails: row.event_details || undefined,
    inputDataObjects: row.input_data_objects ? JSON.parse(row.input_data_objects) : undefined,
    outputDataObjects: row.output_data_objects ? JSON.parse(row.output_data_objects) : undefined,
    messageFlows: row.message_flows ? JSON.parse(row.message_flows) : undefined,
    artifacts: row.artifacts ? JSON.parse(row.artifacts) : undefined,
    customColumns: row.custom_columns ? JSON.parse(row.custom_columns) : undefined,
    displayOrder: row.display_order,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

/**
 * nextProcessIdsを自動計算
 * beforeProcessIdsを見て逆方向の参照を構築
 */
function calculateNextProcessIds(db: any, processTableId: string): void {
  // 1. 全工程のnextProcessIdsをクリア
  db.prepare('UPDATE processes SET next_process_ids = NULL WHERE process_table_id = ?').run(processTableId);

  // 2. 全工程を取得
  const processes = db.prepare('SELECT id, before_process_ids FROM processes WHERE process_table_id = ?').all(processTableId) as Array<{
    id: string;
    before_process_ids: string | null;
  }>;

  // 3. nextProcessIdsを計算
  const nextProcessIdsMap = new Map<string, Set<string>>();

  processes.forEach(process => {
    if (process.before_process_ids) {
      const beforeIds: string[] = JSON.parse(process.before_process_ids);
      beforeIds.forEach(beforeId => {
        if (!nextProcessIdsMap.has(beforeId)) {
          nextProcessIdsMap.set(beforeId, new Set());
        }
        nextProcessIdsMap.get(beforeId)!.add(process.id);
      });
    }
  });

  // 4. 更新
  nextProcessIdsMap.forEach((nextIds, processId) => {
    const nextIdsArray = Array.from(nextIds);
    db.prepare('UPDATE processes SET next_process_ids = ? WHERE id = ?').run(JSON.stringify(nextIdsArray), processId);
  });

  logger.info('Process', `nextProcessIds calculated for processTable: ${processTableId}`);
}

/**
 * 工程関連のIPCハンドラーを登録（V2版）
 */
export function registerProcessHandlers(): void {
  // 工程作成
  ipcMain.handle('process:create', async (_, data: CreateProcessDto): Promise<CreateProcessResult> => {
    try {
      const db = getDatabase();
      const now = Date.now();
      const processId = uuidv4();

      // displayOrderが指定されていない場合、同じ工程表内の最大値+1を取得
      let displayOrder = data.displayOrder ?? 0;
      if (data.displayOrder === undefined) {
        const maxOrder = db.prepare('SELECT COALESCE(MAX(display_order), -1) + 1 as next_order FROM processes WHERE process_table_id = ?')
          .get(data.processTableId) as { next_order: number };
        displayOrder = maxOrder.next_order;
      }

      // 工程作成
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
        processId,
        data.processTableId,
        data.name,
        data.laneId,
        data.bpmnElement || 'task',
        data.taskType || 'userTask',
        data.beforeProcessIds ? JSON.stringify(data.beforeProcessIds) : null,
        data.documentation || null,
        data.gatewayType || null,
        data.conditionalFlows ? JSON.stringify(data.conditionalFlows) : null,
        data.eventType || null,
        data.intermediateEventType || null,
        data.eventDetails || null,
        data.inputDataObjects ? JSON.stringify(data.inputDataObjects) : null,
        data.outputDataObjects ? JSON.stringify(data.outputDataObjects) : null,
        data.messageFlows ? JSON.stringify(data.messageFlows) : null,
        data.artifacts ? JSON.stringify(data.artifacts) : null,
        data.customColumns ? JSON.stringify(data.customColumns) : null,
        displayOrder,
        now,
        now
      );

      // nextProcessIdsを自動計算
      calculateNextProcessIds(db, data.processTableId);

      const created = db.prepare('SELECT * FROM processes WHERE id = ?').get(processId);

      logger.info('Process', `Process created: ${processId}`);
      return {
        process: rowToProcess(created),
        nextProcessIdsUpdated: true,
      };
    } catch (error) {
      logger.error('Process', 'Error creating process', error as Error);
      throw error;
    }
  });

  // 工程表内の全工程取得
  ipcMain.handle('process:getByProcessTable', async (_, processTableId: string): Promise<Process[]> => {
    try {
      const db = getDatabase();
      const rows = db.prepare(`
        SELECT * FROM processes
        WHERE process_table_id = ?
        ORDER BY display_order ASC
      `).all(processTableId);

      return rows.map(rowToProcess);
    } catch (error) {
      logger.error('Process', 'Error getting processes by processTable', error as Error);
      throw error;
    }
  });

  // 工程取得（ID指定）
  ipcMain.handle('process:getById', async (_, processId: string): Promise<Process | null> => {
    try {
      const db = getDatabase();
      const row = db.prepare('SELECT * FROM processes WHERE id = ?').get(processId);

      if (!row) return null;

      return rowToProcess(row);
    } catch (error) {
      logger.error('Process', 'Error getting process by id', error as Error);
      throw error;
    }
  });

  // 工程更新
  ipcMain.handle('process:update', async (_, processId: string, data: UpdateProcessDto): Promise<UpdateProcessResult> => {
    try {
      const db = getDatabase();
      const now = Date.now();

      const updates: string[] = [];
      const values: any[] = [];

      if (data.name !== undefined) {
        updates.push('name = ?');
        values.push(data.name);
      }
      if (data.laneId !== undefined) {
        updates.push('lane_id = ?');
        values.push(data.laneId);
      }
      if (data.bpmnElement !== undefined) {
        updates.push('bpmn_element = ?');
        values.push(data.bpmnElement);
      }
      if (data.taskType !== undefined) {
        updates.push('task_type = ?');
        values.push(data.taskType);
      }
      if (data.beforeProcessIds !== undefined) {
        updates.push('before_process_ids = ?');
        values.push(data.beforeProcessIds ? JSON.stringify(data.beforeProcessIds) : null);
      }
      if (data.documentation !== undefined) {
        updates.push('documentation = ?');
        values.push(data.documentation || null);
      }
      if (data.gatewayType !== undefined) {
        updates.push('gateway_type = ?');
        values.push(data.gatewayType || null);
      }
      if (data.conditionalFlows !== undefined) {
        updates.push('conditional_flows = ?');
        values.push(data.conditionalFlows ? JSON.stringify(data.conditionalFlows) : null);
      }
      if (data.eventType !== undefined) {
        updates.push('event_type = ?');
        values.push(data.eventType || null);
      }
      if (data.intermediateEventType !== undefined) {
        updates.push('intermediate_event_type = ?');
        values.push(data.intermediateEventType || null);
      }
      if (data.eventDetails !== undefined) {
        updates.push('event_details = ?');
        values.push(data.eventDetails || null);
      }
      if (data.inputDataObjects !== undefined) {
        updates.push('input_data_objects = ?');
        values.push(data.inputDataObjects ? JSON.stringify(data.inputDataObjects) : null);
      }
      if (data.outputDataObjects !== undefined) {
        updates.push('output_data_objects = ?');
        values.push(data.outputDataObjects ? JSON.stringify(data.outputDataObjects) : null);
      }
      if (data.messageFlows !== undefined) {
        updates.push('message_flows = ?');
        values.push(data.messageFlows ? JSON.stringify(data.messageFlows) : null);
      }
      if (data.artifacts !== undefined) {
        updates.push('artifacts = ?');
        values.push(data.artifacts ? JSON.stringify(data.artifacts) : null);
      }
      if (data.customColumns !== undefined) {
        updates.push('custom_columns = ?');
        values.push(data.customColumns ? JSON.stringify(data.customColumns) : null);
      }
      if (data.displayOrder !== undefined) {
        updates.push('display_order = ?');
        values.push(data.displayOrder);
      }

      if (updates.length === 0) {
        throw new Error('No fields to update');
      }

      updates.push('updated_at = ?');
      values.push(now);
      values.push(processId);

      db.prepare(`
        UPDATE processes
        SET ${updates.join(', ')}
        WHERE id = ?
      `).run(...values);

      // beforeProcessIdsが更新された場合、nextProcessIdsを再計算
      let nextProcessIdsUpdated = false;
      if (data.beforeProcessIds !== undefined) {
        const process = db.prepare('SELECT process_table_id FROM processes WHERE id = ?').get(processId) as { process_table_id: string };
        calculateNextProcessIds(db, process.process_table_id);
        nextProcessIdsUpdated = true;
      }

      const updated = db.prepare('SELECT * FROM processes WHERE id = ?').get(processId);

      logger.info('Process', `Process updated: ${processId}`);
      return {
        process: rowToProcess(updated),
        nextProcessIdsUpdated,
      };
    } catch (error) {
      logger.error('Process', 'Error updating process', error as Error);
      throw error;
    }
  });

  // 工程削除
  ipcMain.handle('process:delete', async (_, processId: string): Promise<DeleteProcessResult> => {
    try {
      const db = getDatabase();

      // 削除前に工程表IDを取得
      const process = db.prepare('SELECT process_table_id FROM processes WHERE id = ?').get(processId) as { process_table_id: string } | undefined;

      if (!process) {
        logger.warn('Process', `Process not found: ${processId}`);
        return { success: false, nextProcessIdsUpdated: false };
      }

      const result = db.prepare('DELETE FROM processes WHERE id = ?').run(processId);

      // nextProcessIdsを再計算
      calculateNextProcessIds(db, process.process_table_id);

      logger.info('Process', `Process deleted: ${processId}`);
      return {
        success: result.changes > 0,
        nextProcessIdsUpdated: true,
      };
    } catch (error) {
      logger.error('Process', 'Error deleting process', error as Error);
      throw error;
    }
  });

  // beforeProcessIds更新
  ipcMain.handle('process:updateBeforeProcessIds', async (_, processId: string, beforeProcessIds: string[]): Promise<Process> => {
    try {
      const db = getDatabase();
      const now = Date.now();

      db.prepare(`
        UPDATE processes
        SET before_process_ids = ?, updated_at = ?
        WHERE id = ?
      `).run(JSON.stringify(beforeProcessIds), now, processId);

      // nextProcessIdsを再計算
      const process = db.prepare('SELECT process_table_id FROM processes WHERE id = ?').get(processId) as { process_table_id: string };
      calculateNextProcessIds(db, process.process_table_id);

      const updated = db.prepare('SELECT * FROM processes WHERE id = ?').get(processId);

      logger.info('Process', `beforeProcessIds updated: ${processId}`);
      return rowToProcess(updated);
    } catch (error) {
      logger.error('Process', 'Error updating beforeProcessIds', error as Error);
      throw error;
    }
  });

  // nextProcessIds自動計算（手動トリガー）
  ipcMain.handle('process:calculateNextProcessIds', async (_, processTableId: string): Promise<void> => {
    try {
      const db = getDatabase();
      calculateNextProcessIds(db, processTableId);
      logger.info('Process', `nextProcessIds recalculated for processTable: ${processTableId}`);
    } catch (error) {
      logger.error('Process', 'Error calculating nextProcessIds', error as Error);
      throw error;
    }
  });

  // カスタム列値設定
  ipcMain.handle('process:setCustomValue', async (_, processId: string, columnName: string, value: any): Promise<Process> => {
    try {
      const db = getDatabase();
      const now = Date.now();

      const process = db.prepare('SELECT custom_columns FROM processes WHERE id = ?').get(processId) as { custom_columns: string | null } | undefined;

      if (!process) {
        throw new Error(`Process not found: ${processId}`);
      }

      const customColumns = process.custom_columns ? JSON.parse(process.custom_columns) : {};
      customColumns[columnName] = value;

      db.prepare(`
        UPDATE processes
        SET custom_columns = ?, updated_at = ?
        WHERE id = ?
      `).run(JSON.stringify(customColumns), now, processId);

      const updated = db.prepare('SELECT * FROM processes WHERE id = ?').get(processId);

      logger.info('Process', `Custom value set: ${processId}.${columnName}`);
      return rowToProcess(updated);
    } catch (error) {
      logger.error('Process', 'Error setting custom value', error as Error);
      throw error;
    }
  });

  // カスタム列値取得
  ipcMain.handle('process:getCustomValue', async (_, processId: string, columnName: string): Promise<any> => {
    try {
      const db = getDatabase();

      const process = db.prepare('SELECT custom_columns FROM processes WHERE id = ?').get(processId) as { custom_columns: string | null } | undefined;

      if (!process) {
        throw new Error(`Process not found: ${processId}`);
      }

      const customColumns = process.custom_columns ? JSON.parse(process.custom_columns) : {};
      return customColumns[columnName];
    } catch (error) {
      logger.error('Process', 'Error getting custom value', error as Error);
      throw error;
    }
  });

  // 工程の表示順序を変更
  ipcMain.handle('process:reorder', async (_, processId: string, newDisplayOrder: number): Promise<void> => {
    try {
      const db = getDatabase();
      const now = Date.now();

      // 工程の存在確認
      const process = db.prepare('SELECT id FROM processes WHERE id = ?').get(processId) as { id: string } | undefined;

      if (!process) {
        throw new Error(`Process not found: ${processId}`);
      }

      // displayOrderを更新
      db.prepare(`
        UPDATE processes
        SET display_order = ?, updated_at = ?
        WHERE id = ?
      `).run(newDisplayOrder, now, processId);

      logger.info('Process', `Process reordered: ${processId} -> order ${newDisplayOrder}`);
    } catch (error) {
      logger.error('Process', 'Error reordering process', error as Error);
      throw error;
    }
  });

  logger.info('Process', 'Process handlers registered (V2)');
}

