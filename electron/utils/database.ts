import Database from 'better-sqlite3';
import * as path from 'path';
import * as fs from 'fs';
import { app } from 'electron';

let db: Database.Database | null = null;

// プリペアドステートメントのキャッシュ
const statementCache = new Map<string, Database.Statement>();

/**
 * データベース接続を取得
 */
export function getDatabase(): Database.Database {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

/**
 * キャッシュされたプリペアドステートメントを取得
 */
export function getStatement(sql: string): Database.Statement {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }

  let statement = statementCache.get(sql);
  if (!statement) {
    statement = db.prepare(sql);
    statementCache.set(sql, statement);
  }

  return statement;
}

/**
 * ステートメントキャッシュをクリア
 */
export function clearStatementCache(): void {
  statementCache.clear();
}

/**
 * データベースを初期化
 */
export function initDatabase(): void {
  try {
    // データベースファイルのパスを設定
    const userDataPath = app.getPath('userData');
    const dbDir = path.join(userDataPath, 'data');
    
    // ディレクトリが存在しない場合は作成
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    const dbPath = path.join(dbDir, 'output-management.db');
    console.log('[Database] Initializing database at:', dbPath);

    // データベース接続を開く
    db = new Database(dbPath, {
      verbose: process.env.NODE_ENV === 'development' ? console.log : undefined
    });

    // WALモードを有効化（パフォーマンス向上）
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');

    // テーブルを作成
    createTables();

    // マイグレーションを実行
    runMigrations();

    console.log('[Database] Database initialized successfully');
  } catch (error) {
    console.error('[Database] Initialization error:', error);
    throw error;
  }
}

/**
 * データベーステーブルを作成
 */
function createTables(): void {
  if (!db) throw new Error('Database not initialized');

  console.log('[Database] Creating tables...');

  // projectsテーブル
  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      storage_path TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      metadata TEXT
    );
  `);

  // process_tablesテーブル（工程表ドキュメント）
  db.exec(`
    CREATE TABLE IF NOT EXISTS process_tables (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      name TEXT NOT NULL,
      level TEXT NOT NULL CHECK(level IN ('large', 'medium', 'small', 'detail')),
      description TEXT,
      parent_process_ids TEXT,  -- JSON配列形式で複数の親工程IDを保存
      display_order INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      metadata TEXT,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_process_tables_project_id ON process_tables(project_id);
    CREATE INDEX IF NOT EXISTS idx_process_tables_level ON process_tables(level);
  `);

  // processesテーブル
  // 📝 注意: 列項目はユーザーからのフィードバックを受けて今後追加・変更される予定
  // metadata フィールドを使用して拡張可能な設計としています
  db.exec(`
    CREATE TABLE IF NOT EXISTS processes (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      process_table_id TEXT,
      name TEXT NOT NULL,
      level TEXT NOT NULL CHECK(level IN ('large', 'medium', 'small', 'detail')),
      parent_id TEXT,
      department TEXT,
      assignee TEXT,
      document_type TEXT,
      start_date INTEGER,
      end_date INTEGER,
      status TEXT,
      description TEXT,
      bpmn_element_id TEXT,
      has_manual INTEGER DEFAULT 0,
      manual_id TEXT,
      display_order INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      metadata TEXT,  -- 🔄 将来の列追加に対応（JSON形式で任意の追加項目を保存）
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (process_table_id) REFERENCES process_tables(id) ON DELETE CASCADE,
      FOREIGN KEY (parent_id) REFERENCES processes(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_processes_project_id ON processes(project_id);
    CREATE INDEX IF NOT EXISTS idx_processes_process_table_id ON processes(process_table_id);
    CREATE INDEX IF NOT EXISTS idx_processes_parent_id ON processes(parent_id);
    CREATE INDEX IF NOT EXISTS idx_processes_level ON processes(level);
  `);

  // bpmn_diagram_tablesテーブル
  db.exec(`
    CREATE TABLE IF NOT EXISTS bpmn_diagram_tables (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      name TEXT NOT NULL,
      level TEXT NOT NULL CHECK(level IN ('large', 'medium', 'small', 'detail')),
      description TEXT,
      process_table_id TEXT,
      display_order INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      metadata TEXT,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (process_table_id) REFERENCES process_tables(id) ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS idx_bpmn_diagram_tables_project_id ON bpmn_diagram_tables(project_id);
    CREATE INDEX IF NOT EXISTS idx_bpmn_diagram_tables_process_table_id ON bpmn_diagram_tables(process_table_id);
  `);

  // bpmn_diagramsテーブル
  db.exec(`
    CREATE TABLE IF NOT EXISTS bpmn_diagrams (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      bpmn_diagram_table_id TEXT,
      process_table_id TEXT,
      name TEXT NOT NULL,
      xml_content TEXT NOT NULL,
      process_id TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (bpmn_diagram_table_id) REFERENCES bpmn_diagram_tables(id) ON DELETE CASCADE,
      FOREIGN KEY (process_table_id) REFERENCES process_tables(id) ON DELETE SET NULL,
      FOREIGN KEY (process_id) REFERENCES processes(id) ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS idx_bpmn_diagrams_project_id ON bpmn_diagrams(project_id);
    CREATE INDEX IF NOT EXISTS idx_bpmn_diagrams_bpmn_diagram_table_id ON bpmn_diagrams(bpmn_diagram_table_id);
    CREATE INDEX IF NOT EXISTS idx_bpmn_diagrams_process_table_id ON bpmn_diagrams(process_table_id);
  `);

  // versionsテーブル
  db.exec(`
    CREATE TABLE IF NOT EXISTS versions (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      author TEXT NOT NULL,
      message TEXT NOT NULL,
      tag TEXT,
      parent_version_id TEXT,
      snapshot_data TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (parent_version_id) REFERENCES versions(id)
    );

    CREATE INDEX IF NOT EXISTS idx_versions_project_id ON versions(project_id);
    CREATE INDEX IF NOT EXISTS idx_versions_timestamp ON versions(timestamp);
  `);

  // manual_tablesテーブル
  db.exec(`
    CREATE TABLE IF NOT EXISTS manual_tables (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      name TEXT NOT NULL,
      level TEXT NOT NULL CHECK(level IN ('large', 'medium', 'small', 'detail')),
      description TEXT,
      process_table_id TEXT,
      display_order INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      metadata TEXT,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (process_table_id) REFERENCES process_tables(id) ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS idx_manual_tables_project_id ON manual_tables(project_id);
    CREATE INDEX IF NOT EXISTS idx_manual_tables_process_table_id ON manual_tables(process_table_id);
  `);

  // manualsテーブル（将来拡張）
  db.exec(`
    CREATE TABLE IF NOT EXISTS manuals (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      manual_table_id TEXT,
      process_table_id TEXT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      target_process_level TEXT DEFAULT 'detail',
      version TEXT NOT NULL,
      linked_flow_version TEXT,
      status TEXT NOT NULL CHECK(status IN ('draft', 'review', 'approved', 'outdated')),
      author TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      metadata TEXT,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (manual_table_id) REFERENCES manual_tables(id) ON DELETE CASCADE,
      FOREIGN KEY (process_table_id) REFERENCES process_tables(id) ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS idx_manuals_project_id ON manuals(project_id);
    CREATE INDEX IF NOT EXISTS idx_manuals_manual_table_id ON manuals(manual_table_id);
    CREATE INDEX IF NOT EXISTS idx_manuals_process_table_id ON manuals(process_table_id);
    CREATE INDEX IF NOT EXISTS idx_manuals_status ON manuals(status);
  `);

  // manual_sectionsテーブル（将来拡張）
  db.exec(`
    CREATE TABLE IF NOT EXISTS manual_sections (
      id TEXT PRIMARY KEY,
      manual_id TEXT NOT NULL,
      section_order INTEGER NOT NULL,
      level TEXT NOT NULL CHECK(level IN ('large', 'medium', 'small')),
      heading TEXT NOT NULL,
      content TEXT NOT NULL,
      process_id TEXT,
      process_level TEXT,
      bpmn_element_id TEXT,
      parent_section_id TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (manual_id) REFERENCES manuals(id) ON DELETE CASCADE,
      FOREIGN KEY (process_id) REFERENCES processes(id) ON DELETE SET NULL,
      FOREIGN KEY (parent_section_id) REFERENCES manual_sections(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_manual_sections_manual_id ON manual_sections(manual_id);
    CREATE INDEX IF NOT EXISTS idx_manual_sections_process_id ON manual_sections(process_id);
  `);

  // manual_process_relationsテーブル（将来拡張）
  db.exec(`
    CREATE TABLE IF NOT EXISTS manual_process_relations (
      id TEXT PRIMARY KEY,
      manual_id TEXT NOT NULL,
      process_id TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (manual_id) REFERENCES manuals(id) ON DELETE CASCADE,
      FOREIGN KEY (process_id) REFERENCES processes(id) ON DELETE CASCADE,
      UNIQUE(manual_id, process_id)
    );
  `);

  // migrationsテーブル（マイグレーション管理用）
  db.exec(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      version TEXT NOT NULL UNIQUE,
      applied_at INTEGER NOT NULL
    );
  `);

  console.log('[Database] Tables created successfully');
}

/**
 * マイグレーションを実行
 */
function runMigrations(): void {
  if (!db) throw new Error('Database not initialized');

  console.log('[Database] Checking migrations...');

  // 適用済みマイグレーションを取得
  const appliedMigrations = db
    .prepare('SELECT version FROM migrations ORDER BY applied_at')
    .all()
    .map((row: any) => row.version);

  // マイグレーション定義
  const migrations: Array<{ version: string; up: () => void }> = [
    {
      version: '001_initial_schema',
      up: () => {
        // 初期スキーマはcreateTablesで作成済みのため何もしない
        console.log('[Migration] 001_initial_schema: Already applied via createTables()');
      }
    },
    {
      version: '002_add_performance_indexes',
      up: () => {
        console.log('[Migration] 002_add_performance_indexes: Adding performance indexes...');
        db!.exec(`
          -- プロセスの複合インデックス（プロジェクト+レベル）
          CREATE INDEX IF NOT EXISTS idx_processes_project_level ON processes(project_id, level);
          
          -- プロセスの複合インデックス（プロジェクト+親+表示順）
          CREATE INDEX IF NOT EXISTS idx_processes_parent_order ON processes(parent_id, display_order);
          
          -- プロセスの名前検索用インデックス
          CREATE INDEX IF NOT EXISTS idx_processes_name ON processes(name);
          
          -- バージョンの複合インデックス（プロジェクト+タイムスタンプ降順）
          CREATE INDEX IF NOT EXISTS idx_versions_project_timestamp_desc ON versions(project_id, timestamp DESC);
          
          -- バージョンのタグインデックス
          CREATE INDEX IF NOT EXISTS idx_versions_tag ON versions(tag);
          
          -- プロジェクトの更新日時インデックス
          CREATE INDEX IF NOT EXISTS idx_projects_updated_at ON projects(updated_at DESC);
        `);
      }
    },
    {
      version: '003_phase6_manual_sync_fields',
      up: () => {
        console.log('[Migration] 003_phase6_manual_sync_fields: Adding Phase 6 sync fields...');
        db!.exec(`
          -- manualsテーブルに同期関連フィールドを追加
          ALTER TABLE manuals ADD COLUMN auto_generated INTEGER DEFAULT 1;
          ALTER TABLE manuals ADD COLUMN last_sync_at INTEGER;
          
          -- manual_sectionsテーブルに同期関連フィールドを追加
          ALTER TABLE manual_sections ADD COLUMN sync_status TEXT DEFAULT 'synced' CHECK(sync_status IN ('synced', 'outdated', 'conflict'));
          ALTER TABLE manual_sections ADD COLUMN auto_generated INTEGER DEFAULT 1;
          
          -- 同期ステータスのインデックスを追加
          CREATE INDEX IF NOT EXISTS idx_manuals_auto_generated ON manuals(auto_generated);
          CREATE INDEX IF NOT EXISTS idx_manual_sections_sync_status ON manual_sections(sync_status);
          
          -- manual_sectionsテーブルのprocess_idを必須に変更（既存データはNULLのまま）
          -- SQLiteではALTER TABLEでNOT NULL制約を追加できないため、将来の挿入時に検証する
        `);
      }
    },
  ];

  // 未適用のマイグレーションを実行
  const insertMigration = db.prepare(
    'INSERT INTO migrations (version, applied_at) VALUES (?, ?)'
  );

  migrations.forEach((migration) => {
    if (!appliedMigrations.includes(migration.version)) {
      console.log(`[Migration] Applying ${migration.version}...`);
      
      try {
        db!.transaction(() => {
          migration.up();
          insertMigration.run(migration.version, Date.now());
        })();
        
        console.log(`[Migration] ${migration.version} applied successfully`);
      } catch (error) {
        console.error(`[Migration] Failed to apply ${migration.version}:`, error);
        throw error;
      }
    }
  });

  console.log('[Database] Migrations completed');
}

/**
 * データベース接続を閉じる
 */
export function closeDatabase(): void {
  if (db) {
    console.log('[Database] Closing database connection');
    clearStatementCache();
    db.close();
    db = null;
  }
}

/**
 * データベースをリセット（開発用）
 */
export function resetDatabase(): void {
  if (!db) throw new Error('Database not initialized');

  console.log('[Database] Resetting database...');

  const tables = [
    'manual_process_relations',
    'manual_sections',
    'manuals',
    'versions',
    'bpmn_diagrams',
    'processes',
    'projects',
    'migrations'
  ];

  db.transaction(() => {
    tables.forEach((table) => {
      db!.exec(`DROP TABLE IF EXISTS ${table};`);
    });
    createTables();
  })();

  console.log('[Database] Database reset completed');
}

/**
 * データベースのバックアップを作成
 */
export function backupDatabase(destinationPath: string): void {
  if (!db) throw new Error('Database not initialized');

  try {
    console.log('[Database] Creating backup at:', destinationPath);
    
    // バックアップ先のディレクトリを作成
    const backupDir = path.dirname(destinationPath);
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // WALモードでチェックポイントを実行
    db.pragma('wal_checkpoint(TRUNCATE)');

    // データベースファイルをコピー
    const sourcePath = db.name;
    fs.copyFileSync(sourcePath, destinationPath);

    console.log('[Database] Backup created successfully');
  } catch (error) {
    console.error('[Database] Backup error:', error);
    throw error;
  }
}
