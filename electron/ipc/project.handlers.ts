import { ipcMain } from 'electron';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../utils/database';
import { createProjectFolder, deleteProjectFolder } from '../utils/file-system';

// 型定義
interface Project {
  id: string;
  name: string;
  description?: string;
  storagePath: string;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}

interface CreateProjectDto {
  name: string;
  description?: string;
}

interface UpdateProjectDto {
  name?: string;
  description?: string;
}

/**
 * プロジェクト関連のIPCハンドラーを登録
 */
export function registerProjectHandlers(): void {
  // プロジェクト作成
  ipcMain.handle('project:create', async (_, data: CreateProjectDto): Promise<Project> => {
    try {
      const db = getDatabase();
      const now = Date.now();
      const projectId = uuidv4();

      // プロジェクトフォルダを作成
      const storagePath = createProjectFolder(projectId);

      // データベースに保存
      const stmt = db.prepare(`
        INSERT INTO projects (id, name, description, storage_path, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      stmt.run(projectId, data.name, data.description || null, storagePath, now, now);

      const project: Project = {
        id: projectId,
        name: data.name,
        description: data.description,
        storagePath,
        createdAt: new Date(now),
        updatedAt: new Date(now),
      };

      console.log('[IPC] Project created:', projectId);
      return project;
    } catch (error) {
      console.error('[IPC] Error creating project:', error);
      throw error;
    }
  });

  // 全プロジェクト取得
  ipcMain.handle('project:getAll', async (): Promise<Project[]> => {
    try {
      const db = getDatabase();
      const stmt = db.prepare(`
        SELECT id, name, description, storage_path, created_at, updated_at, metadata
        FROM projects
        ORDER BY updated_at DESC
      `);

      const rows = stmt.all() as Array<{
        id: string;
        name: string;
        description: string | null;
        storage_path: string;
        created_at: number;
        updated_at: number;
        metadata: string | null;
      }>;

      const projects: Project[] = rows.map((row) => ({
        id: row.id,
        name: row.name,
        description: row.description || undefined,
        storagePath: row.storage_path,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
        metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
      }));

      console.log(`[IPC] Retrieved ${projects.length} projects`);
      return projects;
    } catch (error) {
      console.error('[IPC] Error getting projects:', error);
      throw error;
    }
  });

  // プロジェクト取得（ID指定）
  ipcMain.handle('project:getById', async (_, projectId: string): Promise<Project> => {
    try {
      const db = getDatabase();
      const stmt = db.prepare(`
        SELECT id, name, description, storage_path, created_at, updated_at, metadata
        FROM projects
        WHERE id = ?
      `);

      const row = stmt.get(projectId) as {
        id: string;
        name: string;
        description: string | null;
        storage_path: string;
        created_at: number;
        updated_at: number;
        metadata: string | null;
      } | undefined;

      if (!row) {
        throw new Error(`Project not found: ${projectId}`);
      }

      const project: Project = {
        id: row.id,
        name: row.name,
        description: row.description || undefined,
        storagePath: row.storage_path,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
        metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
      };

      console.log('[IPC] Retrieved project:', projectId);
      return project;
    } catch (error) {
      console.error('[IPC] Error getting project:', error);
      throw error;
    }
  });

  // プロジェクト更新
  ipcMain.handle('project:update', async (_, projectId: string, data: UpdateProjectDto): Promise<Project> => {
    try {
      const db = getDatabase();
      const now = Date.now();

      // 更新するフィールドを動的に構築
      const updates: string[] = [];
      const values: any[] = [];

      if (data.name !== undefined) {
        updates.push('name = ?');
        values.push(data.name);
      }

      if (data.description !== undefined) {
        updates.push('description = ?');
        values.push(data.description);
      }

      updates.push('updated_at = ?');
      values.push(now);

      values.push(projectId);

      const stmt = db.prepare(`
        UPDATE projects
        SET ${updates.join(', ')}
        WHERE id = ?
      `);

      const result = stmt.run(...values);

      if (result.changes === 0) {
        throw new Error(`Project not found: ${projectId}`);
      }

      // 更新後のプロジェクトを取得
      const getStmt = db.prepare(`
        SELECT id, name, description, storage_path, created_at, updated_at, metadata
        FROM projects
        WHERE id = ?
      `);

      const row = getStmt.get(projectId) as {
        id: string;
        name: string;
        description: string | null;
        storage_path: string;
        created_at: number;
        updated_at: number;
        metadata: string | null;
      };

      const project: Project = {
        id: row.id,
        name: row.name,
        description: row.description || undefined,
        storagePath: row.storage_path,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
        metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
      };

      console.log('[IPC] Project updated:', projectId);
      return project;
    } catch (error) {
      console.error('[IPC] Error updating project:', error);
      throw error;
    }
  });

  // プロジェクト削除
  ipcMain.handle('project:delete', async (_, projectId: string): Promise<boolean> => {
    try {
      const db = getDatabase();

      // トランザクション開始
      db.transaction(() => {
        // プロジェクトを削除（CASCADE制約により関連データも削除される）
        const stmt = db.prepare('DELETE FROM projects WHERE id = ?');
        const result = stmt.run(projectId);

        if (result.changes === 0) {
          throw new Error(`Project not found: ${projectId}`);
        }

        // プロジェクトフォルダを削除
        deleteProjectFolder(projectId);
      })();

      console.log('[IPC] Project deleted:', projectId);
      return true;
    } catch (error) {
      console.error('[IPC] Error deleting project:', error);
      throw error;
    }
  });

  console.log('[IPC] Project handlers registered');
}
