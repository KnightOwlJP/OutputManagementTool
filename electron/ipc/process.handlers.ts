import { ipcMain } from 'electron';
import { getDatabase } from '../utils/database';
import { getLogger } from '../utils/logger';
import { loadBpmnExporter } from '../utils/loadBpmnExporter';
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
  largeName?: string;
  mediumName?: string;
  smallName?: string;
  detailName?: string;
  laneId: string;
  displayId: number;
  workSeconds?: number;
  workUnitPref?: string;
  skillLevel?: '-' | 'L' | 'M' | 'H';
  systemName?: string;
  parallelAllowed?: boolean;
  parentProcessId?: string;
  bpmnElement: BpmnElementType;
  taskType: BpmnTaskType;
  beforeProcessIds?: string[];
  nextProcessIds?: string[];
  issueDetail?: string;
  issueCategory?: string;
  countermeasurePolicy?: string;
  issueWorkSeconds?: number;
  timeReductionSeconds?: number;
  rateReductionPercent?: number;
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
  largeName?: string;
  mediumName?: string;
  smallName?: string;
  detailName?: string;
  laneId: string;
  displayId?: number;
  workSeconds?: number;
  workUnitPref?: string;
  skillLevel?: '-' | 'L' | 'M' | 'H';
  systemName?: string;
  parallelAllowed?: boolean;
  parentProcessId?: string;
  bpmnElement?: BpmnElementType;
  taskType?: BpmnTaskType;
  beforeProcessIds?: string[];
  issueDetail?: string;
  issueCategory?: string;
  countermeasurePolicy?: string;
  issueWorkSeconds?: number;
  timeReductionSeconds?: number;
  rateReductionPercent?: number;
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
  largeName?: string;
  mediumName?: string;
  smallName?: string;
  detailName?: string;
  laneId?: string;
  displayId?: number;
  workSeconds?: number;
  workUnitPref?: string;
  skillLevel?: '-' | 'L' | 'M' | 'H';
  systemName?: string;
  parallelAllowed?: boolean;
  parentProcessId?: string;
  bpmnElement?: BpmnElementType;
  taskType?: BpmnTaskType;
  beforeProcessIds?: string[];
  issueDetail?: string;
  issueCategory?: string;
  countermeasurePolicy?: string;
  issueWorkSeconds?: number;
  timeReductionSeconds?: number;
  rateReductionPercent?: number;
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

interface ProcessTableMeta {
  id: string;
  level: 'large' | 'medium' | 'small' | 'detail';
  isInvestigation: boolean;
}

function validateRequiredFields(data: CreateProcessDto | UpdateProcessDto, tableMeta: ProcessTableMeta) {
  const requiredMessages: string[] = [];
  const isCreate = (data as CreateProcessDto).processTableId !== undefined;
  const hasValue = (v: any) => v !== undefined && v !== null && `${v}`.trim() !== '';
  const hasProvided = (key: keyof (CreateProcessDto & UpdateProcessDto)) =>
    Object.prototype.hasOwnProperty.call(data, key) && (data as any)[key] !== undefined;

  const fieldLabels: Record<'largeName' | 'mediumName' | 'smallName' | 'detailName', string> = {
    largeName: '大工程名は必須です',
    mediumName: '中工程名は必須です',
    smallName: '小工程名は必須です',
    detailName: '詳細工程名は必須です',
  };

  const levelRequirements: Record<ProcessTableMeta['level'], Array<keyof typeof fieldLabels>> = {
    large: ['largeName'],
    medium: ['largeName', 'mediumName'],
    small: ['largeName', 'mediumName', 'smallName'],
    detail: ['largeName', 'mediumName', 'smallName', 'detailName'],
  };

  const fieldValues: Record<keyof typeof fieldLabels, any> = {
    largeName: (data as any).largeName ?? (data as any).name,
    mediumName: (data as any).mediumName,
    smallName: (data as any).smallName,
    detailName: (data as any).detailName,
  };

  levelRequirements[tableMeta.level].forEach((key) => {
    const value = fieldValues[key];
    if (isCreate) {
      if (!hasValue(value)) requiredMessages.push(fieldLabels[key]);
    } else if (hasProvided(key) && !hasValue(value)) {
      requiredMessages.push(fieldLabels[key]);
    }
  });

  // Common required
  if (isCreate && !hasValue((data as CreateProcessDto).laneId)) requiredMessages.push('スイムレーンは必須です');

  // Investigation required
  if (tableMeta.isInvestigation) {
    const investigationFields: Array<{ key: keyof (CreateProcessDto & UpdateProcessDto); label: string }> = [
      { key: 'issueDetail', label: '課題事象は必須です' },
      { key: 'issueCategory', label: '課題分類は必須です' },
      { key: 'countermeasurePolicy', label: '対策方針は必須です' },
      { key: 'issueWorkSeconds', label: '課題工数は必須です' },
      { key: 'timeReductionSeconds', label: '時間削減しろは必須です' },
      { key: 'rateReductionPercent', label: '割合削減しろは必須です' },
    ];

    investigationFields.forEach(({ key, label }) => {
      const value = (data as any)[key];
      if (isCreate) {
        if (!hasValue(value)) requiredMessages.push(label);
      } else if (hasProvided(key) && !hasValue(value)) {
        requiredMessages.push(label);
      }
    });
  }

  if (requiredMessages.length > 0) {
    const err = new Error(requiredMessages.join('; '));
    (err as any).code = 'VALIDATION_ERROR';
    throw err;
  }
}

/**
 * DB行をProcessオブジェクトに変換
 */
function rowToProcess(row: any): Process {
  return {
    id: row.id,
    processTableId: row.process_table_id,
    name: row.name,
    largeName: row.large_name || undefined,
    mediumName: row.medium_name || undefined,
    smallName: row.small_name || undefined,
    detailName: row.detail_name || undefined,
    laneId: row.lane_id,
    displayId: row.display_id,
    workSeconds: row.work_seconds ?? undefined,
    workUnitPref: row.work_unit_pref || undefined,
    skillLevel: row.skill_level || undefined,
    systemName: row.system_name || undefined,
    parallelAllowed: !!row.parallel_allowed,
    parentProcessId: row.parent_process_id || undefined,
    bpmnElement: row.bpmn_element as BpmnElementType,
    taskType: row.task_type as BpmnTaskType,
    beforeProcessIds: row.before_process_ids ? JSON.parse(row.before_process_ids) : undefined,
    nextProcessIds: row.next_process_ids ? JSON.parse(row.next_process_ids) : undefined,
    issueDetail: row.issue_detail || undefined,
    issueCategory: row.issue_category || undefined,
    countermeasurePolicy: row.countermeasure_policy || undefined,
    issueWorkSeconds: row.issue_work_seconds ?? undefined,
    timeReductionSeconds: row.time_reduction_seconds ?? undefined,
    rateReductionPercent: row.rate_reduction_percent ?? undefined,
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

      // processTable metadata
      const table = db.prepare('SELECT id, level, is_investigation FROM process_tables WHERE id = ?').get(data.processTableId) as ProcessTableMeta | undefined;
      if (!table) throw new Error('ProcessTable not found');

      validateRequiredFields(data, table);

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
          id, process_table_id,
          name, large_name, medium_name, small_name, detail_name,
          lane_id, bpmn_element, task_type, bpmn_position, bpmn_element_type,
          display_id, work_seconds, work_unit_pref, skill_level, system_name, parallel_allowed, parent_process_id,
          issue_detail, issue_category, countermeasure_policy, issue_work_seconds, time_reduction_seconds, rate_reduction_percent,
          before_process_ids, documentation,
          gateway_type, conditional_flows,
          event_type, intermediate_event_type, event_details,
          input_data_objects, output_data_objects,
          message_flows, artifacts,
          custom_columns, display_order, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        processId,
        data.processTableId,
        data.name,
        data.largeName || null,
        data.mediumName || null,
        data.smallName || null,
        data.detailName || null,
        data.laneId,
        data.bpmnElement || 'task',
        data.taskType || 'userTask',
        null,
        null,
        data.displayId ?? displayOrder,
        data.workSeconds ?? null,
        data.workUnitPref || null,
        data.skillLevel || null,
        data.systemName || null,
        data.parallelAllowed ? 1 : 0,
        data.parentProcessId || null,
        data.issueDetail || null,
        data.issueCategory || null,
        data.countermeasurePolicy || null,
        data.issueWorkSeconds ?? null,
        data.timeReductionSeconds ?? null,
        data.rateReductionPercent ?? null,
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

      // 工程表 → BPMN 同期
      try {
        await syncProcessTableToBpmn(data.processTableId);
      } catch (syncErr) {
        logger.warn('Process', 'Failed to sync BPMN after create', syncErr as Error);
      }

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

      const table = db.prepare(`SELECT pt.id, pt.level, pt.is_investigation FROM process_tables pt JOIN processes p ON p.process_table_id = pt.id WHERE p.id = ?`).get(processId) as ProcessTableMeta | undefined;
      if (!table) throw new Error('ProcessTable not found for process');

      validateRequiredFields(data, table);

      const updates: string[] = [];
      const values: any[] = [];

      if (data.name !== undefined) {
        updates.push('name = ?');
        values.push(data.name);
      }
      if (data.largeName !== undefined) {
        updates.push('large_name = ?');
        values.push(data.largeName || null);
      }
      if (data.mediumName !== undefined) {
        updates.push('medium_name = ?');
        values.push(data.mediumName || null);
      }
      if (data.smallName !== undefined) {
        updates.push('small_name = ?');
        values.push(data.smallName || null);
      }
      if (data.detailName !== undefined) {
        updates.push('detail_name = ?');
        values.push(data.detailName || null);
      }
      if (data.laneId !== undefined) {
        updates.push('lane_id = ?');
        values.push(data.laneId);
      }
      if (data.displayId !== undefined) {
        updates.push('display_id = ?');
        values.push(data.displayId);
      }
      if (data.workSeconds !== undefined) {
        updates.push('work_seconds = ?');
        values.push(data.workSeconds ?? null);
      }
      if (data.workUnitPref !== undefined) {
        updates.push('work_unit_pref = ?');
        values.push(data.workUnitPref || null);
      }
      if (data.skillLevel !== undefined) {
        updates.push('skill_level = ?');
        values.push(data.skillLevel || null);
      }
      if (data.systemName !== undefined) {
        updates.push('system_name = ?');
        values.push(data.systemName || null);
      }
      if (data.parallelAllowed !== undefined) {
        updates.push('parallel_allowed = ?');
        values.push(data.parallelAllowed ? 1 : 0);
      }
      if (data.parentProcessId !== undefined) {
        updates.push('parent_process_id = ?');
        values.push(data.parentProcessId || null);
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
      if (data.issueDetail !== undefined) {
        updates.push('issue_detail = ?');
        values.push(data.issueDetail || null);
      }
      if (data.issueCategory !== undefined) {
        updates.push('issue_category = ?');
        values.push(data.issueCategory || null);
      }
      if (data.countermeasurePolicy !== undefined) {
        updates.push('countermeasure_policy = ?');
        values.push(data.countermeasurePolicy || null);
      }
      if (data.issueWorkSeconds !== undefined) {
        updates.push('issue_work_seconds = ?');
        values.push(data.issueWorkSeconds ?? null);
      }
      if (data.timeReductionSeconds !== undefined) {
        updates.push('time_reduction_seconds = ?');
        values.push(data.timeReductionSeconds ?? null);
      }
      if (data.rateReductionPercent !== undefined) {
        updates.push('rate_reduction_percent = ?');
        values.push(data.rateReductionPercent ?? null);
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
      let processTableIdForSync: string | undefined;
      if (data.beforeProcessIds !== undefined) {
        const process = db.prepare('SELECT process_table_id FROM processes WHERE id = ?').get(processId) as { process_table_id: string };
        calculateNextProcessIds(db, process.process_table_id);
        nextProcessIdsUpdated = true;
        processTableIdForSync = process.process_table_id;
      } else {
        const process = db.prepare('SELECT process_table_id FROM processes WHERE id = ?').get(processId) as { process_table_id: string };
        processTableIdForSync = process?.process_table_id;
      }

      const updated = db.prepare('SELECT * FROM processes WHERE id = ?').get(processId);

      logger.info('Process', `Process updated: ${processId}`);

      // 工程表 → BPMN 同期
      if (processTableIdForSync) {
        try {
          await syncProcessTableToBpmn(processTableIdForSync);
        } catch (syncErr) {
          logger.warn('Process', 'Failed to sync BPMN after update', syncErr as Error);
        }
      }

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

      // 工程表 → BPMN 同期
      try {
        await syncProcessTableToBpmn(process.process_table_id);
      } catch (syncErr) {
        logger.warn('Process', 'Failed to sync BPMN after delete', syncErr as Error);
      }

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

      // 工程表 → BPMN 同期
      try {
        await syncProcessTableToBpmn(process.process_table_id);
      } catch (syncErr) {
        logger.warn('Process', 'Failed to sync BPMN after updateBeforeProcessIds', syncErr as Error);
      }

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

      // 工程表 → BPMN 同期
      const proc = db.prepare('SELECT process_table_id FROM processes WHERE id = ?').get(processId) as { process_table_id: string } | undefined;
      if (proc?.process_table_id) {
        try {
          await syncProcessTableToBpmn(proc.process_table_id);
        } catch (syncErr) {
          logger.warn('Process', 'Failed to sync BPMN after reorder', syncErr as Error);
        }
      }
    } catch (error) {
      logger.error('Process', 'Error reordering process', error as Error);
      throw error;
    }
  });

  logger.info('Process', 'Process handlers registered (V2)');
}

// ==========================================
// ヘルパー: 工程表 → BPMN 同期
// ==========================================
async function syncProcessTableToBpmn(processTableId: string): Promise<void> {
  const db = getDatabase();
  const now = Date.now();

  // 工程表データを取得
  const processTable = db.prepare(`
    SELECT * FROM process_tables WHERE id = ?
  `).get(processTableId) as any;

  if (!processTable) {
    logger.warn('Process', `ProcessTable not found for BPMN sync: ${processTableId}`);
    return;
  }

  // 工程データを取得
  const processes = db.prepare(`
    SELECT * FROM processes WHERE process_table_id = ? ORDER BY display_order
  `).all(processTableId) as any[];

  // スイムレーンデータを取得
  const swimlanes = db.prepare(`
    SELECT * FROM process_table_swimlanes WHERE process_table_id = ? ORDER BY order_num
  `).all(processTableId) as any[];

  // BPMN XML生成
  const { exportProcessTableToBpmnXml } = loadBpmnExporter();
  let bpmnXml = '';
  let exportSummary: { processCount: number; laneCount: number } | null = null;
  try {
    const result = await exportProcessTableToBpmnXml({
      processTable: {
        id: processTable.id,
        projectId: processTable.project_id,
        name: processTable.name,
        level: processTable.level,
        description: processTable.description,
        isInvestigation: !!processTable.is_investigation,
        displayOrder: processTable.display_order,
        createdAt: new Date(processTable.created_at),
        updatedAt: new Date(processTable.updated_at),
      },
      processes: processes.map((p: any) => ({
        id: p.id,
        processTableId: p.process_table_id,
        laneId: p.lane_id,
        name: p.name,
        displayId: p.display_id,
        workSeconds: p.work_seconds ?? undefined,
        workUnitPref: p.work_unit_pref ?? undefined,
        skillLevel: p.skill_level ?? undefined,
        systemName: p.system_name ?? undefined,
        parallelAllowed: !!p.parallel_allowed,
        parentProcessId: p.parent_process_id ?? undefined,
        issueDetail: p.issue_detail ?? undefined,
        issueCategory: p.issue_category ?? undefined,
        countermeasurePolicy: p.countermeasure_policy ?? undefined,
        issueWorkSeconds: p.issue_work_seconds ?? undefined,
        timeReductionSeconds: p.time_reduction_seconds ?? undefined,
        rateReductionPercent: p.rate_reduction_percent ?? undefined,
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
        displayOrder: p.display_order,
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

    bpmnXml = result.xml;
    exportSummary = { processCount: result.processCount, laneCount: result.laneCount };
  } catch (err) {
    logger.error('Process', `Failed to export BPMN XML for processTable ${processTableId}`, err as Error);
    // BPMN生成が失敗しても工程作成/更新は続行する
    return;
  }

  // sync_state更新
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

  logger.info('Process', 'ProcessTable → BPMN sync done (internal)', {
    processTableId,
    processCount: exportSummary?.processCount,
    laneCount: exportSummary?.laneCount,
    newVersion,
  });
}

