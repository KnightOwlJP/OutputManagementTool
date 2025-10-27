-- Migration 006: 階層構造リファクタリング
-- 目的: ProcessTable/BpmnDiagramTable/ManualTableを廃止し、エンティティ自体に階層構造を統合
-- 作成日: 2025-10-19

-- ============================================================================
-- Phase 1: 新カラム追加
-- ============================================================================

-- processesテーブルに階層構造カラムを追加
ALTER TABLE processes ADD COLUMN detail_table_id TEXT;
ALTER TABLE processes ADD COLUMN parent_entity_id TEXT;

-- bpmn_diagramsテーブルに階層構造カラムを追加
ALTER TABLE bpmn_diagrams ADD COLUMN detail_table_id TEXT;
ALTER TABLE bpmn_diagrams ADD COLUMN parent_entity_id TEXT;

-- manualsテーブルに階層構造カラムを追加
ALTER TABLE manuals ADD COLUMN detail_table_id TEXT;
ALTER TABLE manuals ADD COLUMN parent_entity_id TEXT;

-- ============================================================================
-- Phase 2: データ移行 (process_tables → processes)
-- ============================================================================

-- Step 1: 各ProcessTableをルートProcessとして作成
INSERT INTO processes (
  id, 
  project_id, 
  name, 
  description, 
  level, 
  parent_entity_id,
  display_order,
  created_at,
  updated_at
)
SELECT 
  'root_pt_' || id as id,           -- ルートProcessのID（衝突回避）
  project_id,
  name || ' (ルート)' as name,      -- 名前にルート表記を追加
  description,
  level,
  NULL as parent_entity_id,         -- ルートProcessはparent_entity_idを持たない（初期値）
  display_order,
  created_at,
  updated_at
FROM process_tables
WHERE id IN (SELECT DISTINCT process_table_id FROM processes WHERE process_table_id IS NOT NULL);

-- Step 2: 既存のProcessをルートProcessに紐づける
UPDATE processes
SET parent_id = 'root_pt_' || process_table_id
WHERE process_table_id IS NOT NULL
  AND parent_id IS NULL;  -- トップレベルの工程のみ

-- Step 3: ProcessTableのparent_process_ids（詳細化関係）を反映
UPDATE processes
SET parent_entity_id = (
  SELECT json_extract(pt.parent_process_ids, '$[0]')
  FROM process_tables pt
  WHERE 'root_pt_' || pt.id = processes.id
)
WHERE id LIKE 'root_pt_%'
  AND EXISTS (
    SELECT 1 FROM process_tables pt
    WHERE 'root_pt_' || pt.id = processes.id
      AND pt.parent_process_ids IS NOT NULL
      AND pt.parent_process_ids != '[]'
  );

-- Step 4: 元の工程にdetail_table_idを設定
UPDATE processes
SET detail_table_id = (
  SELECT 'root_pt_' || pt.id
  FROM process_tables pt
  WHERE json_extract(pt.parent_process_ids, '$[0]') = processes.id
  LIMIT 1
)
WHERE EXISTS (
  SELECT 1 FROM process_tables pt
  WHERE json_extract(pt.parent_process_ids, '$[0]') = processes.id
);

-- ============================================================================
-- Phase 3: データ移行 (bpmn_diagram_tables → bpmn_diagrams)
-- ============================================================================

-- Step 1: 各BpmnDiagramTableをルートBpmnDiagramとして作成
INSERT INTO bpmn_diagrams (
  id,
  project_id,
  name,
  description,
  level,
  parent_entity_id,
  process_id,
  display_order,
  created_at,
  updated_at
)
SELECT 
  'root_bt_' || bdt.id as id,
  bdt.project_id,
  bdt.name || ' (ルート)' as name,
  bdt.description,
  bdt.level,
  NULL as parent_entity_id,
  (SELECT json_extract(bdt.parent_process_ids, '$[0]')) as process_id,  -- 対応する工程
  bdt.display_order,
  bdt.created_at,
  bdt.updated_at
FROM bpmn_diagram_tables bdt
WHERE bdt.id IN (SELECT DISTINCT bpmn_diagram_table_id FROM bpmn_diagrams WHERE bpmn_diagram_table_id IS NOT NULL);

-- Step 2: 既存のBpmnDiagramをルートBpmnDiagramに紐づける
UPDATE bpmn_diagrams
SET parent_id = 'root_bt_' || bpmn_diagram_table_id
WHERE bpmn_diagram_table_id IS NOT NULL
  AND parent_id IS NULL;

-- Step 3: BpmnDiagramTableのparent_process_idsを反映
UPDATE bpmn_diagrams
SET parent_entity_id = (
  SELECT json_extract(bdt.parent_process_ids, '$[0]')
  FROM bpmn_diagram_tables bdt
  WHERE 'root_bt_' || bdt.id = bpmn_diagrams.id
)
WHERE id LIKE 'root_bt_%'
  AND EXISTS (
    SELECT 1 FROM bpmn_diagram_tables bdt
    WHERE 'root_bt_' || bdt.id = bpmn_diagrams.id
      AND bdt.parent_process_ids IS NOT NULL
      AND bdt.parent_process_ids != '[]'
  );

-- Step 4: 対応するProcessにdetail_table_idを設定（BPMN詳細表とのリンク）
UPDATE bpmn_diagrams AS bd
SET detail_table_id = (
  SELECT 'root_bt_' || bdt.id
  FROM bpmn_diagram_tables bdt
  WHERE bd.process_id IS NOT NULL
    AND json_extract(bdt.parent_process_ids, '$[0]') = (
      SELECT p.id FROM processes p WHERE p.bpmn_diagram_id = bd.id LIMIT 1
    )
  LIMIT 1
)
WHERE EXISTS (
  SELECT 1 FROM bpmn_diagram_tables bdt
  WHERE bd.process_id IS NOT NULL
);

-- ============================================================================
-- Phase 4: データ移行 (manual_tables → manuals)
-- ============================================================================

-- Step 1: 各ManualTableをルートManualとして作成
INSERT INTO manuals (
  id,
  project_id,
  name,
  description,
  level,
  parent_entity_id,
  process_id,
  display_order,
  created_at,
  updated_at
)
SELECT 
  'root_mt_' || mt.id as id,
  mt.project_id,
  mt.name || ' (ルート)' as name,
  mt.description,
  mt.level,
  NULL as parent_entity_id,
  (SELECT json_extract(mt.parent_process_ids, '$[0]')) as process_id,
  mt.display_order,
  mt.created_at,
  mt.updated_at
FROM manual_tables mt
WHERE mt.id IN (SELECT DISTINCT manual_table_id FROM manuals WHERE manual_table_id IS NOT NULL);

-- Step 2: 既存のManualをルートManualに紐づける
UPDATE manuals
SET parent_id = 'root_mt_' || manual_table_id
WHERE manual_table_id IS NOT NULL
  AND parent_id IS NULL;

-- Step 3: ManualTableのparent_process_idsを反映
UPDATE manuals
SET parent_entity_id = (
  SELECT json_extract(mt.parent_process_ids, '$[0]')
  FROM manual_tables mt
  WHERE 'root_mt_' || mt.id = manuals.id
)
WHERE id LIKE 'root_mt_%'
  AND EXISTS (
    SELECT 1 FROM manual_tables mt
    WHERE 'root_mt_' || mt.id = manuals.id
      AND mt.parent_process_ids IS NOT NULL
      AND mt.parent_process_ids != '[]'
  );

-- Step 4: 対応するProcessにdetail_table_idを設定（Manual詳細表とのリンク）
UPDATE manuals AS m
SET detail_table_id = (
  SELECT 'root_mt_' || mt.id
  FROM manual_tables mt
  WHERE m.process_id IS NOT NULL
    AND json_extract(mt.parent_process_ids, '$[0]') = (
      SELECT p.id FROM processes p WHERE p.manual_id = m.id LIMIT 1
    )
  LIMIT 1
)
WHERE EXISTS (
  SELECT 1 FROM manual_tables mt
  WHERE m.process_id IS NOT NULL
);

-- ============================================================================
-- Phase 5: インデックス作成
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_processes_detail_table ON processes(detail_table_id);
CREATE INDEX IF NOT EXISTS idx_processes_parent_entity ON processes(parent_entity_id);

CREATE INDEX IF NOT EXISTS idx_bpmn_detail_table ON bpmn_diagrams(detail_table_id);
CREATE INDEX IF NOT EXISTS idx_bpmn_parent_entity ON bpmn_diagrams(parent_entity_id);

CREATE INDEX IF NOT EXISTS idx_manuals_detail_table ON manuals(detail_table_id);
CREATE INDEX IF NOT EXISTS idx_manuals_parent_entity ON manuals(parent_entity_id);

-- ============================================================================
-- Phase 6: 外部キー制約の追加（SQLiteでは制限あり、論理的な整合性チェック）
-- ============================================================================

-- SQLiteではALTER TABLEで外部キー制約を追加できないため、
-- アプリケーション層でチェックする必要がある
-- ここでは整合性確認のみ実施

-- 整合性チェック: detail_table_idが存在するIDを指しているか
SELECT COUNT(*) as invalid_detail_table_count
FROM processes p
WHERE p.detail_table_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM processes p2 WHERE p2.id = p.detail_table_id);

SELECT COUNT(*) as invalid_detail_table_count_bpmn
FROM bpmn_diagrams bd
WHERE bd.detail_table_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM bpmn_diagrams bd2 WHERE bd2.id = bd.detail_table_id);

SELECT COUNT(*) as invalid_detail_table_count_manual
FROM manuals m
WHERE m.detail_table_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM manuals m2 WHERE m2.id = m.detail_table_id);

-- ============================================================================
-- Phase 7: 旧カラムの削除（SQLiteではテーブル再作成が必要）
-- ============================================================================

-- processesテーブルの再作成（process_table_idを削除）
CREATE TABLE processes_new (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  level TEXT NOT NULL CHECK(level IN ('large', 'medium', 'small', 'detail')),
  parent_id TEXT,
  detail_table_id TEXT,
  parent_entity_id TEXT,
  bpmn_diagram_id TEXT,
  manual_id TEXT,
  bpmn_element_type TEXT CHECK(bpmn_element_type IN (
    'task', 'subprocess', 'gateway', 'event', 'pool', 'lane',
    'data-object', 'data-store', 'message', 'signal', 'timer', 'group'
  )),
  sync_status TEXT CHECK(sync_status IN ('synced', 'outdated', 'conflict', 'manual')),
  last_sync_at INTEGER,
  department TEXT,
  assignee TEXT,
  start_date INTEGER,
  end_date INTEGER,
  duration INTEGER,
  status TEXT DEFAULT 'not-started' CHECK(status IN ('not-started', 'in-progress', 'completed', 'on-hold')),
  display_order INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- データをコピー
INSERT INTO processes_new SELECT 
  id, project_id, name, description, level, parent_id, detail_table_id, parent_entity_id,
  bpmn_diagram_id, manual_id, bpmn_element_type, sync_status, last_sync_at,
  department, assignee, start_date, end_date, duration, status, display_order,
  created_at, updated_at
FROM processes;

-- 旧テーブルを削除
DROP TABLE processes;

-- 新テーブルをリネーム
ALTER TABLE processes_new RENAME TO processes;

-- インデックスを再作成
CREATE INDEX idx_processes_project ON processes(project_id);
CREATE INDEX idx_processes_parent ON processes(parent_id);
CREATE INDEX idx_processes_detail_table ON processes(detail_table_id);
CREATE INDEX idx_processes_parent_entity ON processes(parent_entity_id);
CREATE INDEX idx_processes_level ON processes(level);

-- bpmn_diagramsテーブルの再作成（bpmn_diagram_table_idを削除）
CREATE TABLE bpmn_diagrams_new (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  level TEXT NOT NULL CHECK(level IN ('large', 'medium', 'small', 'detail')),
  parent_id TEXT,
  detail_table_id TEXT,
  parent_entity_id TEXT,
  process_id TEXT,
  manual_id TEXT,
  xml_content TEXT,
  display_order INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (process_id) REFERENCES processes(id) ON DELETE CASCADE
);

-- データをコピー
INSERT INTO bpmn_diagrams_new SELECT 
  id, project_id, name, description, level, parent_id, detail_table_id, parent_entity_id,
  process_id, manual_id, xml_content, display_order, created_at, updated_at
FROM bpmn_diagrams;

-- 旧テーブルを削除
DROP TABLE bpmn_diagrams;

-- 新テーブルをリネーム
ALTER TABLE bpmn_diagrams_new RENAME TO bpmn_diagrams;

-- インデックスを再作成
CREATE INDEX idx_bpmn_project ON bpmn_diagrams(project_id);
CREATE INDEX idx_bpmn_parent ON bpmn_diagrams(parent_id);
CREATE INDEX idx_bpmn_detail_table ON bpmn_diagrams(detail_table_id);
CREATE INDEX idx_bpmn_parent_entity ON bpmn_diagrams(parent_entity_id);
CREATE INDEX idx_bpmn_process ON bpmn_diagrams(process_id);

-- manualsテーブルの再作成（manual_table_idを削除）
CREATE TABLE manuals_new (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  level TEXT NOT NULL CHECK(level IN ('large', 'medium', 'small', 'detail')),
  parent_id TEXT,
  detail_table_id TEXT,
  parent_entity_id TEXT,
  process_id TEXT,
  bpmn_diagram_id TEXT,
  content TEXT,
  file_path TEXT,
  display_order INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (process_id) REFERENCES processes(id) ON DELETE CASCADE
);

-- データをコピー
INSERT INTO manuals_new SELECT 
  id, project_id, name, description, level, parent_id, detail_table_id, parent_entity_id,
  process_id, bpmn_diagram_id, content, file_path, display_order, created_at, updated_at
FROM manuals;

-- 旧テーブルを削除
DROP TABLE manuals;

-- 新テーブルをリネーム
ALTER TABLE manuals_new RENAME TO manuals;

-- インデックスを再作成
CREATE INDEX idx_manuals_project ON manuals(project_id);
CREATE INDEX idx_manuals_parent ON manuals(parent_id);
CREATE INDEX idx_manuals_detail_table ON manuals(detail_table_id);
CREATE INDEX idx_manuals_parent_entity ON manuals(parent_entity_id);
CREATE INDEX idx_manuals_process ON manuals(process_id);

-- ============================================================================
-- Phase 8: 旧テーブルの削除
-- ============================================================================

DROP TABLE IF EXISTS process_tables;
DROP TABLE IF EXISTS bpmn_diagram_tables;
DROP TABLE IF EXISTS manual_tables;

-- ============================================================================
-- Phase 9: 最終整合性チェック
-- ============================================================================

-- 孤立したdetail_table_idのチェック
SELECT 'Orphaned detail_table_id in processes' as check_name, COUNT(*) as count
FROM processes p
WHERE p.detail_table_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM processes p2 WHERE p2.id = p.detail_table_id)
UNION ALL
SELECT 'Orphaned detail_table_id in bpmn_diagrams', COUNT(*)
FROM bpmn_diagrams bd
WHERE bd.detail_table_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM bpmn_diagrams bd2 WHERE bd2.id = bd.detail_table_id)
UNION ALL
SELECT 'Orphaned detail_table_id in manuals', COUNT(*)
FROM manuals m
WHERE m.detail_table_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM manuals m2 WHERE m2.id = m.detail_table_id);

-- 孤立したparent_entity_idのチェック
SELECT 'Orphaned parent_entity_id in processes' as check_name, COUNT(*) as count
FROM processes p
WHERE p.parent_entity_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM processes p2 WHERE p2.id = p.parent_entity_id)
UNION ALL
SELECT 'Orphaned parent_entity_id in bpmn_diagrams', COUNT(*)
FROM bpmn_diagrams bd
WHERE bd.parent_entity_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM bpmn_diagrams bd2 WHERE bd2.id = bd.parent_entity_id)
UNION ALL
SELECT 'Orphaned parent_entity_id in manuals', COUNT(*)
FROM manuals m
WHERE m.parent_entity_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM manuals m2 WHERE m2.id = m.parent_entity_id);

-- マイグレーション完了
SELECT 'Migration 006 completed successfully' as status;
