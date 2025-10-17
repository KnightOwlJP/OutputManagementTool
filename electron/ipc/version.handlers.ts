import { ipcMain } from 'electron';
import { getDatabase } from '../utils/database';
import { v4 as uuidv4 } from 'uuid';

// Version型定義（インライン）
interface Version {
  id: string;
  projectId: string;
  timestamp: Date;
  author: string;
  message: string;
  tag?: string;
  parentVersionId?: string;
  snapshotData: VersionSnapshot;
  createdAt: Date;
}

interface VersionSnapshot {
  processes: any[];
  bpmnDiagrams: any[];
  manuals?: any[];
}

interface CreateVersionDto {
  projectId: string;
  message: string;
  tag?: string;
  author?: string;
}

/**
 * プロジェクトのスナップショットを作成
 */
async function createSnapshot(projectId: string): Promise<VersionSnapshot> {
  const db = getDatabase();

  // 工程データを取得
  const processes = db
    .prepare('SELECT * FROM processes WHERE project_id = ? ORDER BY display_order ASC')
    .all(projectId);

  // BPMNダイアグラムを取得
  const bpmnDiagrams = db
    .prepare('SELECT * FROM bpmn_diagrams WHERE project_id = ?')
    .all(projectId);

  return {
    processes,
    bpmnDiagrams,
    manuals: [], // 将来拡張用
  };
}

/**
 * バージョン管理関連のIPCハンドラーを登録
 */
export function registerVersionHandlers(): void {
  // バージョン作成
  ipcMain.handle('version:create', async (_, data: CreateVersionDto): Promise<Version> => {
    try {
      const db = getDatabase();
      const now = Date.now();
      const versionId = uuidv4();

      // プロジェクトの存在確認
      const project = db
        .prepare('SELECT id FROM projects WHERE id = ?')
        .get(data.projectId) as { id: string } | undefined;

      if (!project) {
        throw new Error('プロジェクトが見つかりません');
      }

      // スナップショットを作成
      const snapshot = await createSnapshot(data.projectId);

      // 最新バージョンを取得（親バージョンとして使用）
      const latestVersion = db
        .prepare(
          'SELECT id FROM versions WHERE project_id = ? ORDER BY created_at DESC LIMIT 1'
        )
        .get(data.projectId) as { id: string } | undefined;

      // バージョンを保存
      const stmt = db.prepare(`
        INSERT INTO versions (
          id, project_id, author, message, tag, parent_version_id,
          snapshot_data, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        versionId,
        data.projectId,
        data.author || 'システム',
        data.message,
        data.tag || null,
        latestVersion?.id || null,
        JSON.stringify(snapshot),
        now
      );

      const version: Version = {
        id: versionId,
        projectId: data.projectId,
        timestamp: new Date(now),
        author: data.author || 'システム',
        message: data.message,
        tag: data.tag,
        parentVersionId: latestVersion?.id,
        snapshotData: snapshot,
        createdAt: new Date(now),
      };

      console.log('[IPC] Version created:', versionId);
      return version;
    } catch (error) {
      console.error('[IPC] Error creating version:', error);
      throw error;
    }
  });

  // プロジェクトのバージョン履歴を取得
  ipcMain.handle('version:getByProject', async (_, projectId: string): Promise<Version[]> => {
    try {
      const db = getDatabase();

      const rows = db
        .prepare('SELECT * FROM versions WHERE project_id = ? ORDER BY created_at DESC')
        .all(projectId) as any[];

      const versions: Version[] = rows.map((row) => ({
        id: row.id,
        projectId: row.project_id,
        timestamp: new Date(row.created_at),
        author: row.author,
        message: row.message,
        tag: row.tag || undefined,
        parentVersionId: row.parent_version_id || undefined,
        snapshotData: JSON.parse(row.snapshot_data),
        createdAt: new Date(row.created_at),
      }));

      console.log('[IPC] Versions retrieved for project:', projectId, '- Count:', versions.length);
      return versions;
    } catch (error) {
      console.error('[IPC] Error retrieving versions:', error);
      throw error;
    }
  });

  // バージョンの詳細を取得
  ipcMain.handle('version:getById', async (_, versionId: string): Promise<Version> => {
    try {
      const db = getDatabase();

      const row = db
        .prepare('SELECT * FROM versions WHERE id = ?')
        .get(versionId) as any;

      if (!row) {
        throw new Error('バージョンが見つかりません');
      }

      const version: Version = {
        id: row.id,
        projectId: row.project_id,
        timestamp: new Date(row.created_at),
        author: row.author,
        message: row.message,
        tag: row.tag || undefined,
        parentVersionId: row.parent_version_id || undefined,
        snapshotData: JSON.parse(row.snapshot_data),
        createdAt: new Date(row.created_at),
      };

      console.log('[IPC] Version retrieved:', versionId);
      return version;
    } catch (error) {
      console.error('[IPC] Error retrieving version:', error);
      throw error;
    }
  });

  // バージョンを復元
  ipcMain.handle('version:restore', async (_, versionId: string): Promise<boolean> => {
    try {
      const db = getDatabase();

      // トランザクション開始
      db.prepare('BEGIN TRANSACTION').run();

      try {
        // バージョンを取得
        const version = db
          .prepare('SELECT * FROM versions WHERE id = ?')
          .get(versionId) as any;

        if (!version) {
          throw new Error('バージョンが見つかりません');
        }

        const snapshot: VersionSnapshot = JSON.parse(version.snapshot_data);
        const projectId = version.project_id;

        // 既存データを削除
        db.prepare('DELETE FROM processes WHERE project_id = ?').run(projectId);
        db.prepare('DELETE FROM bpmn_diagrams WHERE project_id = ?').run(projectId);

        // 工程データを復元
        const processStmt = db.prepare(`
          INSERT INTO processes (
            id, project_id, name, level, parent_id, department, assignee,
            document_type, start_date, end_date, status, description,
            bpmn_element_id, has_manual, manual_id, display_order,
            created_at, updated_at, metadata
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        snapshot.processes.forEach((process: any) => {
          processStmt.run(
            process.id,
            process.project_id,
            process.name,
            process.level,
            process.parent_id || null,
            process.department || null,
            process.assignee || null,
            process.document_type || null,
            process.start_date || null,
            process.end_date || null,
            process.status || null,
            process.description || null,
            process.bpmn_element_id || null,
            process.has_manual ? 1 : 0,
            process.manual_id || null,
            process.display_order,
            process.created_at,
            process.updated_at,
            process.metadata || null
          );
        });

        // BPMNダイアグラムを復元
        const bpmnStmt = db.prepare(`
          INSERT INTO bpmn_diagrams (
            id, project_id, name, file_path, version, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `);

        snapshot.bpmnDiagrams.forEach((bpmn: any) => {
          bpmnStmt.run(
            bpmn.id,
            bpmn.project_id,
            bpmn.name,
            bpmn.file_path,
            bpmn.version,
            bpmn.created_at,
            bpmn.updated_at
          );
        });

        // トランザクションコミット
        db.prepare('COMMIT').run();

        console.log('[IPC] Version restored:', versionId);
        return true;
      } catch (error) {
        // ロールバック
        db.prepare('ROLLBACK').run();
        throw error;
      }
    } catch (error) {
      console.error('[IPC] Error restoring version:', error);
      throw error;
    }
  });

  // バージョンを削除
  ipcMain.handle('version:delete', async (_, versionId: string): Promise<boolean> => {
    try {
      const db = getDatabase();

      const result = db
        .prepare('DELETE FROM versions WHERE id = ?')
        .run(versionId);

      if (result.changes === 0) {
        throw new Error('バージョンが見つかりません');
      }

      console.log('[IPC] Version deleted:', versionId);
      return true;
    } catch (error) {
      console.error('[IPC] Error deleting version:', error);
      throw error;
    }
  });

  console.log('[IPC] Version handlers registered');
}
