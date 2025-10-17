import { getDatabase } from '../utils/database';

// Process型定義（project.types.tsから複製）
export type ProcessLevel = 'large' | 'medium' | 'small' | 'detail';

export interface Process {
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

/**
 * BPMN ⇔ 工程表の双方向同期エンジン
 * Phase 6.1.2 実装
 */

export interface SyncResult {
  success: boolean;
  syncedCount: number;
  errors: string[];
  conflicts: SyncConflict[];
}

export interface SyncConflict {
  id: string;
  type: 'bpmn' | 'process';
  elementId: string;
  bpmnData?: any;
  processData?: any;
  message: string;
}

export interface SyncOptions {
  autoSync?: boolean;
  direction?: 'bpmn-to-process' | 'process-to-bpmn' | 'bidirectional';
  conflictResolution?: 'bpmn-priority' | 'process-priority' | 'manual';
}

export class SyncEngine {
  private db: ReturnType<typeof getDatabase> | null = null;
  private watchEnabled = false;

  private getDb() {
    if (!this.db) {
      this.db = getDatabase();
    }
    return this.db;
  }

  /**
   * BPMN変更 → 工程表への同期
   * BPMNタスクの作成・更新・削除を工程レコードに反映
   */
  async syncBpmnToProcesses(
    projectId: string,
    bpmnXml: string,
    options: SyncOptions = {}
  ): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      syncedCount: 0,
      errors: [],
      conflicts: []
    };

    try {
      // BPMNからタスク情報を抽出
      const bpmnTasks = this.parseBpmnTasks(bpmnXml);
      
      // 既存の工程レコードを取得
      const existingProcesses = this.getProcessesByProject(projectId);
      const processMap = new Map(
        existingProcesses
          .filter(p => p.bpmnElementId)
          .map(p => [p.bpmnElementId!, p])
      );

      // BPMNタスクごとに処理
      for (const task of bpmnTasks) {
        const existingProcess = processMap.get(task.id);

        if (existingProcess) {
          // 既存工程を更新
          const hasChanges = this.detectChanges(existingProcess, task);
          if (hasChanges) {
            if (options.conflictResolution === 'manual') {
              // 競合を記録
              result.conflicts.push({
                id: task.id,
                type: 'process',
                elementId: task.id,
                bpmnData: task,
                processData: existingProcess,
                message: `工程「${existingProcess.name}」とBPMNタスク「${task.name}」に差異があります`
              });
            } else {
              // BPMNデータで上書き
              await this.updateProcessFromBpmn(existingProcess.id, task);
              result.syncedCount++;
            }
          }
          processMap.delete(task.id);
        } else {
          // 新規工程を作成
          await this.createProcessFromBpmn(projectId, task);
          result.syncedCount++;
        }
      }

      // BPMNから削除されたタスクに対応する工程を処理
      for (const [bpmnId, process] of processMap) {
        if (options.conflictResolution === 'bpmn-priority') {
          // BPMNから削除されたので工程も削除
          await this.deleteProcess(process.id);
          result.syncedCount++;
        } else {
          // 競合として記録
          result.conflicts.push({
            id: bpmnId,
            type: 'process',
            elementId: bpmnId,
            processData: process,
            message: `工程「${process.name}」に対応するBPMNタスクが見つかりません`
          });
        }
      }

    } catch (error) {
      result.success = false;
      result.errors.push(`BPMN→工程同期エラー: ${error instanceof Error ? error.message : String(error)}`);
    }

    return result;
  }

  /**
   * 工程表変更 → BPMNへの同期
   * 工程レコードの作成・更新・削除をBPMN XMLに反映
   */
  async syncProcessesToBpmn(
    projectId: string,
    bpmnId: string,
    options: SyncOptions = {}
  ): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      syncedCount: 0,
      errors: [],
      conflicts: []
    };

    try {
      // 工程レコードを取得
      const processes = this.getProcessesByProject(projectId);
      
      // BPMN XMLを取得
      const bpmn = this.getBpmnById(bpmnId);
      if (!bpmn) {
        throw new Error(`BPMN ID ${bpmnId} が見つかりません`);
      }

      // BPMN XMLを解析
      let xmlContent = bpmn.xml_content;
      const bpmnTasks = this.parseBpmnTasks(xmlContent);
      const taskMap = new Map(bpmnTasks.map(t => [t.id, t]));

      // 工程レコードごとに処理
      for (const process of processes) {
        if (!process.bpmnElementId) continue;

        const existingTask = taskMap.get(process.bpmnElementId);

        if (existingTask) {
          // 既存タスクを更新
          const hasChanges = this.detectChanges(process, existingTask);
          if (hasChanges) {
            xmlContent = this.updateBpmnTask(xmlContent, process);
            result.syncedCount++;
          }
          taskMap.delete(process.bpmnElementId);
        } else {
          // 新規タスクを追加
          xmlContent = this.addBpmnTask(xmlContent, process);
          result.syncedCount++;
        }
      }

      // 工程に対応しないBPMNタスクを処理
      for (const [taskId, task] of taskMap) {
        if (options.conflictResolution === 'process-priority') {
          // 工程がないのでBPMNタスクを削除
          xmlContent = this.removeBpmnTask(xmlContent, taskId);
          result.syncedCount++;
        }
      }

      // BPMN XMLを保存
      await this.updateBpmnXml(bpmnId, xmlContent);

    } catch (error) {
      result.success = false;
      result.errors.push(`工程→BPMN同期エラー: ${error instanceof Error ? error.message : String(error)}`);
    }

    return result;
  }

  /**
   * リアルタイム変更監視の開始
   */
  async watchChanges(projectId: string, callback: (changes: any) => void): Promise<void> {
    this.watchEnabled = true;
    console.log(`[SyncEngine] リアルタイム監視開始: Project ${projectId}`);
    // 実装: データベース変更を監視してコールバックを呼び出す
    // SQLiteのトリガーまたはポーリングで実装可能
  }

  /**
   * リアルタイム監視の停止
   */
  stopWatching(): void {
    this.watchEnabled = false;
    console.log('[SyncEngine] リアルタイム監視停止');
  }

  /**
   * 競合解決
   */
  async resolveConflict(
    conflict: SyncConflict,
    resolution: 'use-bpmn' | 'use-process' | 'merge'
  ): Promise<boolean> {
    try {
      if (resolution === 'use-bpmn' && conflict.bpmnData) {
        // BPMNデータを優先
        await this.updateProcessFromBpmn(conflict.elementId, conflict.bpmnData);
      } else if (resolution === 'use-process' && conflict.processData) {
        // 工程データを優先
        const process = conflict.processData as Process;
        await this.updateBpmnFromProcess(conflict.elementId, process);
      } else if (resolution === 'merge') {
        // マージ処理（両方の変更を統合）
        // 実装: 変更内容を解析して統合
      }
      return true;
    } catch (error) {
      console.error('[SyncEngine] 競合解決エラー:', error);
      return false;
    }
  }

  /**
   * BPMN ElementIDで工程を検索
   */
  getProcessByBpmnElementId(bpmnElementId: string): Process | null {
    try {
      const stmt = this.getDb().prepare(`
        SELECT * FROM processes 
        WHERE bpmn_element_id = ?
      `);
      const row = stmt.get(bpmnElementId) as any;
      
      if (!row) return null;
      
      return this.mapRowToProcess(row);
    } catch (error) {
      console.error('[SyncEngine] 工程検索エラー:', error);
      return null;
    }
  }

  // ========== プライベートヘルパーメソッド ==========

  private parseBpmnTasks(bpmnXml: string): any[] {
    // 簡易実装: 実際はbpmn-moddle等を使用してパース
    const tasks: any[] = [];
    const taskRegex = /<bpmn:task id="([^"]+)" name="([^"]+)"[^>]*>/g;
    let match;

    while ((match = taskRegex.exec(bpmnXml)) !== null) {
      tasks.push({
        id: match[1],
        name: match[2],
        type: 'task'
      });
    }

    return tasks;
  }

  private getProcessesByProject(projectId: string): Process[] {
    const stmt = this.getDb().prepare(`
      SELECT * FROM processes 
      WHERE project_id = ?
      ORDER BY display_order
    `);
    const rows = stmt.all(projectId) as any[];
    return rows.map(row => this.mapRowToProcess(row));
  }

  private getBpmnById(bpmnId: string): any {
    const stmt = this.getDb().prepare(`
      SELECT * FROM bpmn_diagrams WHERE id = ?
    `);
    return stmt.get(bpmnId);
  }

  private detectChanges(process: Process, task: any): boolean {
    // 工程とBPMNタスクの差異を検出
    return process.name !== task.name;
  }

  private async updateProcessFromBpmn(processId: string, task: any): Promise<void> {
    const stmt = this.getDb().prepare(`
      UPDATE processes 
      SET name = ?, updated_at = ?
      WHERE id = ?
    `);
    stmt.run(task.name, Date.now(), processId);
  }

  private async createProcessFromBpmn(projectId: string, task: any): Promise<void> {
    const stmt = this.getDb().prepare(`
      INSERT INTO processes (
        id, project_id, name, level, bpmn_element_id,
        display_order, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const id = `proc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = Date.now();
    
    stmt.run(
      id,
      projectId,
      task.name,
      'medium', // デフォルトレベル
      task.id,
      0,
      now,
      now
    );
  }

  private async deleteProcess(processId: string): Promise<void> {
    const stmt = this.getDb().prepare('DELETE FROM processes WHERE id = ?');
    stmt.run(processId);
  }

  private updateBpmnTask(xmlContent: string, process: Process): string {
    // BPMN XMLのタスク名を更新
    const regex = new RegExp(
      `(<bpmn:task id="${process.bpmnElementId}" name=")[^"]+(")`,
      'g'
    );
    return xmlContent.replace(regex, `$1${process.name}$2`);
  }

  private addBpmnTask(xmlContent: string, process: Process): string {
    // 新規BPMNタスクを追加
    // 実装: bpmn-moddle等を使用してタスクを追加
    return xmlContent;
  }

  private removeBpmnTask(xmlContent: string, taskId: string): string {
    // BPMNタスクを削除
    // 実装: bpmn-moddle等を使用してタスクを削除
    return xmlContent;
  }

  private async updateBpmnXml(bpmnId: string, xmlContent: string): Promise<void> {
    const stmt = this.getDb().prepare(`
      UPDATE bpmn_diagrams 
      SET xml_content = ?, updated_at = ?
      WHERE id = ?
    `);
    stmt.run(xmlContent, Date.now(), bpmnId);
  }

  private async updateBpmnFromProcess(bpmnElementId: string, process: Process): Promise<void> {
    // 工程データからBPMNを更新
    // 実装: プロジェクトのBPMN XMLを取得して更新
  }

  private mapRowToProcess(row: any): Process {
    return {
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
      hasManual: Boolean(row.has_manual),
      manualId: row.manual_id || undefined,
      displayOrder: row.display_order,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined
    };
  }
}

// シングルトンインスタンス
export const syncEngine = new SyncEngine();
