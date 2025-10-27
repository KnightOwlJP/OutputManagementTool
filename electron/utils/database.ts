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

    // マイグレーションテーブルを先に作成
    db.exec(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        version TEXT NOT NULL UNIQUE,
        applied_at INTEGER NOT NULL
      );
    `);

    // マイグレーションを実行（既存テーブル削除）
    runMigrations();

    // テーブルを作成
    createTables();

    console.log('[Database] Database initialized successfully');
  } catch (error) {
    console.error('[Database] Initialization error:', error);
    throw error;
  }
}

/**
 * データベーステーブルを作成
 * V2: フラット構造への大規模リアーキテクト
 */
function createTables(): void {
  if (!db) throw new Error('Database not initialized');

  console.log('[Database] Creating tables for V2...');

  // ==========================================
  // V2: 新テーブル構造
  // ==========================================

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

  // ==========================================
  // V2: 工程表（ProcessTable）
  // プロジェクト内に複数作成可能
  // ==========================================
  db.exec(`
    CREATE TABLE IF NOT EXISTS process_tables (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      name TEXT NOT NULL,
      level TEXT NOT NULL CHECK(level IN ('large', 'medium', 'small', 'detail')),
      description TEXT,
      display_order INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_process_tables_project_id ON process_tables(project_id);
    CREATE INDEX IF NOT EXISTS idx_process_tables_level ON process_tables(level);
  `);

  // ==========================================
  // V2: スイムレーン（工程表ごとに管理）
  // ==========================================
  db.exec(`
    CREATE TABLE IF NOT EXISTS process_table_swimlanes (
      id TEXT PRIMARY KEY,
      process_table_id TEXT NOT NULL,
      name TEXT NOT NULL,
      color TEXT NOT NULL DEFAULT '#3B82F6',
      order_num INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (process_table_id) REFERENCES process_tables(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_swimlanes_table_id ON process_table_swimlanes(process_table_id);
    CREATE INDEX IF NOT EXISTS idx_swimlanes_order ON process_table_swimlanes(process_table_id, order_num);
  `);

  // ==========================================
  // V2: カスタム列定義（工程表ごとに30列まで）
  // ==========================================
  db.exec(`
    CREATE TABLE IF NOT EXISTS process_table_custom_columns (
      id TEXT PRIMARY KEY,
      process_table_id TEXT NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('TEXT', 'NUMBER', 'DATE', 'SELECT', 'CHECKBOX')),
      options TEXT,
      required INTEGER NOT NULL DEFAULT 0,
      order_num INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (process_table_id) REFERENCES process_tables(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_custom_columns_table_id ON process_table_custom_columns(process_table_id);
    CREATE INDEX IF NOT EXISTS idx_custom_columns_order ON process_table_custom_columns(process_table_id, order_num);
  `);

  // ==========================================
  // V2: 工程（Process）- BPMN 2.0完全統合
  // ==========================================
  db.exec(`
    CREATE TABLE IF NOT EXISTS processes (
      id TEXT PRIMARY KEY,
      process_table_id TEXT NOT NULL,
      
      -- 基本情報（必須）
      name TEXT NOT NULL,
      lane_id TEXT NOT NULL,
      
      -- BPMN要素タイプ
      bpmn_element TEXT NOT NULL DEFAULT 'task',
      task_type TEXT,
      
      -- フロー制御
      before_process_ids TEXT,
      next_process_ids TEXT,
      
      -- BPMN詳細情報（任意）
      documentation TEXT,
      gateway_type TEXT,
      conditional_flows TEXT,
      
      -- イベント情報（任意）
      event_type TEXT,
      intermediate_event_type TEXT,
      event_details TEXT,
      
      -- データ連携（任意）
      input_data_objects TEXT,
      output_data_objects TEXT,
      
      -- メッセージ・アーティファクト（任意）
      message_flows TEXT,
      artifacts TEXT,
      
      -- カスタム列の値（JSON）
      custom_columns TEXT,
      
      -- メタデータ
      display_order INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      
      FOREIGN KEY (process_table_id) REFERENCES process_tables(id) ON DELETE CASCADE,
      FOREIGN KEY (lane_id) REFERENCES process_table_swimlanes(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_processes_table_id ON processes(process_table_id);
    CREATE INDEX IF NOT EXISTS idx_processes_lane ON processes(lane_id);
    CREATE INDEX IF NOT EXISTS idx_processes_bpmn_element ON processes(bpmn_element);
    CREATE INDEX IF NOT EXISTS idx_processes_task_type ON processes(task_type);
  `);

  // ==========================================
  // V2: BPMNダイアグラム（工程表と1対1）
  // ==========================================
  db.exec(`
    CREATE TABLE IF NOT EXISTS bpmn_diagrams (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      process_table_id TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      level TEXT NOT NULL,
      xml_content TEXT NOT NULL,
      version INTEGER NOT NULL DEFAULT 1,
      layout_algorithm TEXT DEFAULT 'auto',
      layout_metadata TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (process_table_id) REFERENCES process_tables(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_bpmn_diagrams_project_id ON bpmn_diagrams(project_id);
    CREATE INDEX IF NOT EXISTS idx_bpmn_diagrams_table_id ON bpmn_diagrams(process_table_id);
  `);

  // ==========================================
  // V2: マニュアル（工程表と1対1）
  // ==========================================
  db.exec(`
    CREATE TABLE IF NOT EXISTS manuals (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      process_table_id TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      level TEXT NOT NULL,
      content TEXT NOT NULL,
      version INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (process_table_id) REFERENCES process_tables(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_manuals_project_id ON manuals(project_id);
    CREATE INDEX IF NOT EXISTS idx_manuals_table_id ON manuals(process_table_id);
  `);

  // ==========================================
  // V2: マニュアルセクション
  // ==========================================
  db.exec(`
    CREATE TABLE IF NOT EXISTS manual_sections (
      id TEXT PRIMARY KEY,
      manual_id TEXT NOT NULL,
      process_id TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT,
      order_num INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (manual_id) REFERENCES manuals(id) ON DELETE CASCADE,
      FOREIGN KEY (process_id) REFERENCES processes(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_manual_sections_manual_id ON manual_sections(manual_id);
    CREATE INDEX IF NOT EXISTS idx_manual_sections_process_id ON manual_sections(process_id);
    CREATE INDEX IF NOT EXISTS idx_manual_sections_order ON manual_sections(manual_id, order_num);
  `);

  // ==========================================
  // V2: マニュアル詳細ステップ
  // ==========================================
  db.exec(`
    CREATE TABLE IF NOT EXISTS manual_detail_steps (
      id TEXT PRIMARY KEY,
      section_id TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT,
      order_num INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (section_id) REFERENCES manual_sections(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_detail_steps_section_id ON manual_detail_steps(section_id);
    CREATE INDEX IF NOT EXISTS idx_detail_steps_order ON manual_detail_steps(section_id, order_num);
  `);

  // ==========================================
  // V2: マニュアル画像スロット（Excel出力用）
  // ==========================================
  db.exec(`
    CREATE TABLE IF NOT EXISTS manual_image_slots (
      id TEXT PRIMARY KEY,
      section_id TEXT NOT NULL,
      caption TEXT NOT NULL,
      image_path TEXT,
      order_num INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (section_id) REFERENCES manual_sections(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_image_slots_section_id ON manual_image_slots(section_id);
    CREATE INDEX IF NOT EXISTS idx_image_slots_order ON manual_image_slots(section_id, order_num);
  `);

  // ==========================================
  // V2: データオブジェクト（プロジェクト全体で共有）
  // ==========================================
  db.exec(`
    CREATE TABLE IF NOT EXISTS data_objects (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      description TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_data_objects_project_id ON data_objects(project_id);
    CREATE INDEX IF NOT EXISTS idx_data_objects_type ON data_objects(type);
  `);

  // ==========================================
  // バージョン管理
  // ==========================================
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

  console.log('[Database] V2 tables created successfully');
}

/**
 * マイグレーションを実行
 * V2: 全テーブルを再構築
 */
function runMigrations(): void {
  if (!db) throw new Error('Database not initialized');

  console.log('[Database] Running V2 migrations...');

  // 適用済みマイグレーションを取得
  const appliedMigrations = db
    .prepare('SELECT version FROM migrations ORDER BY applied_at')
    .all()
    .map((row: any) => row.version);

  // ==========================================
  // V2: マイグレーション定義
  // 既存データは全破棄し、新しいスキーマで再構築
  // ==========================================
  const migrations: Array<{ version: string; up: () => void }> = [
    {
      version: 'v2_001_drop_old_tables',
      up: () => {
        console.log('[Migration] v2_001_drop_old_tables: Dropping Phase 8 tables...');
        
        // Phase 8以前の全テーブルを削除（データ破棄）
        db!.exec(`
          DROP TABLE IF EXISTS manual_process_relations;
          DROP TABLE IF EXISTS manual_sections;
          DROP TABLE IF EXISTS manuals;
          DROP TABLE IF EXISTS manual_tables;
          DROP TABLE IF EXISTS bpmn_diagrams;
          DROP TABLE IF EXISTS bpmn_diagram_tables;
          DROP TABLE IF EXISTS processes;
          DROP TABLE IF EXISTS process_tables;
          DROP TABLE IF EXISTS versions;
          DROP TABLE IF EXISTS projects;
        `);
        
        console.log('[Migration] v2_001_drop_old_tables: Old tables dropped successfully');
        console.log('[Migration] Note: V2 tables will be created by createTables()');
      }
    },
    {
      version: 'v2_002_initial_schema',
      up: () => {
        // V2のテーブルはcreateTablesで作成済み
        console.log('[Migration] v2_002_initial_schema: V2 schema created via createTables()');
      }
    },
    {
      version: 'v2_003_adjust_process_schema_for_bpmn',
      up: () => {
        console.log('[Migration] v2_003_adjust_process_schema_for_bpmn: Adjusting schema for BPMN 2.0...');
        
        db!.exec(`
          -- ステップテーブルを削除（存在する場合）
          DROP TABLE IF EXISTS process_table_steps;
          
          -- プールテーブルを削除（存在する場合）
          DROP TABLE IF EXISTS process_table_pools;
          
          -- processesテーブルをBPMN 2.0標準に調整
          -- swimlane文字列 → lane_id参照
          -- bpmn_elementを追加
          CREATE TABLE processes_new (
            id TEXT PRIMARY KEY,
            process_table_id TEXT NOT NULL,
            name TEXT NOT NULL,
            lane_id TEXT NOT NULL,
            bpmn_element TEXT NOT NULL DEFAULT 'task',
            task_type TEXT,
            before_process_ids TEXT,
            next_process_ids TEXT,
            documentation TEXT,
            gateway_type TEXT,
            conditional_flows TEXT,
            event_type TEXT,
            intermediate_event_type TEXT,
            event_details TEXT,
            input_data_objects TEXT,
            output_data_objects TEXT,
            message_flows TEXT,
            artifacts TEXT,
            custom_columns TEXT,
            display_order INTEGER NOT NULL,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL,
            FOREIGN KEY (process_table_id) REFERENCES process_tables(id) ON DELETE CASCADE,
            FOREIGN KEY (lane_id) REFERENCES process_table_swimlanes(id) ON DELETE CASCADE
          );
          
          -- 既存データを移行
          -- swimlane名からlane_idを取得
          INSERT INTO processes_new (
            id, process_table_id, name, lane_id, bpmn_element, task_type,
            before_process_ids, next_process_ids, documentation,
            gateway_type, conditional_flows, event_type,
            intermediate_event_type, event_details,
            input_data_objects, output_data_objects,
            message_flows, artifacts, custom_columns,
            display_order, created_at, updated_at
          )
          SELECT 
            p.id, p.process_table_id, p.name,
            COALESCE(
              (SELECT s.id FROM process_table_swimlanes s 
               WHERE s.process_table_id = p.process_table_id AND s.name = p.swimlane),
              (SELECT s.id FROM process_table_swimlanes s 
               WHERE s.process_table_id = p.process_table_id LIMIT 1)
            ) as lane_id,
            'task' as bpmn_element,
            COALESCE(p.task_type, 'userTask') as task_type,
            p.before_process_ids, p.next_process_ids, p.documentation,
            p.gateway_type, p.conditional_flows, p.event_type,
            p.intermediate_event_type, p.event_details,
            p.input_data_objects, p.output_data_objects,
            p.message_flows, p.artifacts, p.custom_columns,
            p.display_order, p.created_at, p.updated_at
          FROM processes p;
          
          -- 古いテーブルを削除し、新しいテーブルをリネーム
          DROP TABLE processes;
          ALTER TABLE processes_new RENAME TO processes;
          
          -- インデックスを再作成
          CREATE INDEX IF NOT EXISTS idx_processes_table_id ON processes(process_table_id);
          CREATE INDEX IF NOT EXISTS idx_processes_lane ON processes(lane_id);
          CREATE INDEX IF NOT EXISTS idx_processes_bpmn_element ON processes(bpmn_element);
          CREATE INDEX IF NOT EXISTS idx_processes_task_type ON processes(task_type);
        `);
        
        console.log('[Migration] v2_003_adjust_process_schema_for_bpmn: Migration completed successfully');
      }
    }
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
 * V2: 新テーブル構造に対応
 */
export function resetDatabase(): void {
  if (!db) throw new Error('Database not initialized');

  console.log('[Database] Resetting database for V2...');

  // V2のテーブルリスト
  const tables = [
    'manual_image_slots',
    'manual_detail_steps',
    'manual_sections',
    'manuals',
    'data_objects',
    'bpmn_diagrams',
    'processes',
    'process_table_custom_columns',
    'process_table_swimlanes',
    'process_tables',
    'versions',
    'projects',
    'migrations'
  ];

  db.transaction(() => {
    tables.forEach((table) => {
      db!.exec(`DROP TABLE IF EXISTS ${table};`);
    });
    createTables();
  })();

  console.log('[Database] Database reset completed for V2');
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
