# 工程管理ツール 詳細仕様書

**作成日**: 2025年10月13日  
**最終更新**: 2025年10月14日（Phase 6完了）  
**バージョン**: 1.6  
**プロジェクト名**: Output Management Tool  
**参照**: requirements.md v1.6  
**実装状況**: Phase 6完了（三位一体同期機能実装完了）

---

## 目次

1. [アーキテクチャ設計](#1-アーキテクチャ設計)
2. [技術仕様](#2-技術仕様)
3. [データベース設計](#3-データベース設計)
4. [API設計](#4-api設計)
5. [UI/UXコンポーネント仕様](#5-uiuxコンポーネント仕様)
6. [ファイル構造](#6-ファイル構造)
7. [モジュール仕様](#7-モジュール仕様)
8. [セキュリティ仕様](#8-セキュリティ仕様)

---

## 1. アーキテクチャ設計

### 1.1 全体構成

```
┌─────────────────────────────────────────────────────────┐
│              Electron (Main Process)                    │
│  - ウィンドウ管理                                        │
│  - ファイルシステムアクセス                               │
│  - IPC通信                                              │
└──────────────────┬──────────────────────────────────────┘
                   │ IPC
┌──────────────────┴──────────────────────────────────────┐
│              Next.js (Renderer Process)                 │
│  ┌─────────────────────────────────────────────────┐   │
│  │            React Components (NextUI)            │   │
│  └────────────────────┬────────────────────────────┘   │
│  ┌────────────────────┴────────────────────────────┐   │
│  │          State Management (Zustand)             │   │
│  └────────────────────┬────────────────────────────┘   │
│  ┌────────────────────┴────────────────────────────┐   │
│  │              Business Logic Layer               │   │
│  │  - Excel Handler (SheetJS)                      │   │
│  │  - BPMN Handler (bpmn-js)                       │   │
│  │  - Process Sync Engine ⭐ (BPMN ⇔ 工程表)       │   │
│  │  - Manual Generator (工程表 → マニュアル)       │   │
│  │  - Version Control                              │   │
│  └────────────────────┬────────────────────────────┘   │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────┴──────────────────────────────────┐
│              Local Storage Layer                        │
│  - SQLite (メインデータベース)                            │
│  - File System (Excel, BPMN, Manuals)                   │
└─────────────────────────────────────────────────────────┘
```

### 1.2 レイヤー責務

| レイヤー | 責務 | 技術 |
|---------|------|------|
| **Presentation Layer** | UIコンポーネント、ユーザー操作 | React, HeroUI, Tailwind CSS |
| **State Management Layer** | 状態管理、データフロー | Zustand |
| **Business Logic Layer** | ビジネスロジック、データ変換 | TypeScript |
| **Data Access Layer** | データ永続化、ファイル操作 | better-sqlite3, fs/promises |
| **Desktop Layer** | デスクトップ機能、OS統合 | Electron |

---

## 2. 技術仕様

### 2.1 開発環境

```json
{
  "node": ">=20.0.0",
  "npm": ">=10.0.0",
  "typescript": "^5.0.0"
}
```

### 2.2 主要パッケージ

#### フロントエンド
```json
{
  "next": "15.5.4",
  "react": "19.1.0",
  "react-dom": "19.1.0",
  "@heroui/react": "^2.8.5",
  "framer-motion": "^12.0.0",
  "zustand": "^5.0.0",
  "tailwindcss": "^4.0.0"
}
```

#### Electron
```json
{
  "electron": "^28.0.0",
  "electron-builder": "^24.0.0",
  "electron-serve": "^1.3.0"
}
```

#### データ処理
```json
{
  "xlsx": "^0.18.5",
  "bpmn-js": "^17.0.0",
  "better-sqlite3": "^9.0.0"
}
```

#### ユーティリティ
```json
{
  "date-fns": "^3.0.0",
  "uuid": "^9.0.0",
  "zod": "^3.22.0"
}
```

### 2.3 ビルド設定

#### Next.js設定 (next.config.ts)
```typescript
const nextConfig = {
  output: 'export',
  distDir: 'out',
  images: {
    unoptimized: true
  },
  typescript: {
    ignoreBuildErrors: false
  }
}
```

#### Electron Builder設定 (electron-builder.json)
```json
{
  "appId": "com.outputmanagement.tool",
  "productName": "Output Management Tool",
  "directories": {
    "output": "dist"
  },
  "files": [
    "out/**/*",
    "electron/**/*"
  ],
  "win": {
    "target": ["nsis"],
    "icon": "public/icon.ico"
  },
  "mac": {
    "target": ["dmg"],
    "icon": "public/icon.icns"
  },
  "linux": {
    "target": ["AppImage"],
    "icon": "public/icon.png"
  }
}
```

---

## 3. データベース設計

### 3.1 テーブル定義

#### projects テーブル
```sql
CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  storage_path TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  metadata TEXT -- JSON
);
```

#### processes テーブル
```sql
-- 📝 注意: 列項目はユーザーからのフィードバックを受けて今後追加・変更される予定
-- metadata フィールドを使用して拡張可能な設計としています
CREATE TABLE processes (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  name TEXT NOT NULL,
  level TEXT NOT NULL CHECK(level IN ('large', 'medium', 'small', 'detail')),
  parent_id TEXT,
  department TEXT,        -- 大工程: 部署名
  assignee TEXT,          -- 中工程: 作業実行者
  document_type TEXT,     -- 小工程: 帳票種類
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
  metadata TEXT, -- 🔄 将来の列追加に対応（JSON形式で任意の追加項目を保存）
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES processes(id) ON DELETE CASCADE
);

CREATE INDEX idx_processes_project_id ON processes(project_id);
CREATE INDEX idx_processes_parent_id ON processes(parent_id);
CREATE INDEX idx_processes_level ON processes(level);
```

#### bpmn_diagrams テーブル
```sql
CREATE TABLE bpmn_diagrams (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  name TEXT NOT NULL,
  xml_content TEXT NOT NULL,
  process_id TEXT, -- 関連工程ID
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (process_id) REFERENCES processes(id) ON DELETE SET NULL
);

CREATE INDEX idx_bpmn_diagrams_project_id ON bpmn_diagrams(project_id);
```

#### versions テーブル
```sql
CREATE TABLE versions (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  timestamp INTEGER NOT NULL,
  author TEXT NOT NULL,
  message TEXT NOT NULL,
  tag TEXT,
  parent_version_id TEXT,
  snapshot_data TEXT NOT NULL, -- JSON snapshot
  created_at INTEGER NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_version_id) REFERENCES versions(id)
);

CREATE INDEX idx_versions_project_id ON versions(project_id);
CREATE INDEX idx_versions_timestamp ON versions(timestamp);
```

#### manuals テーブル ⭐ コア機能
```sql
CREATE TABLE manuals (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL, -- Markdown
  target_process_level TEXT DEFAULT 'small', -- 小工程・詳細工程対象
  version TEXT NOT NULL,
  linked_flow_version TEXT,
  status TEXT NOT NULL CHECK(status IN ('draft', 'review', 'approved', 'outdated')),
  author TEXT NOT NULL,
  auto_generated INTEGER DEFAULT 1, -- 自動生成フラグ
  last_sync_at INTEGER, -- 最終同期日時
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  metadata TEXT, -- JSON
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE INDEX idx_manuals_project_id ON manuals(project_id);
CREATE INDEX idx_manuals_status ON manuals(status);
CREATE INDEX idx_manuals_auto_generated ON manuals(auto_generated);
```

#### manual_sections テーブル ⭐ コア機能
```sql
CREATE TABLE manual_sections (
  id TEXT PRIMARY KEY,
  manual_id TEXT NOT NULL,
  section_order INTEGER NOT NULL,
  level TEXT NOT NULL CHECK(level IN ('large', 'medium', 'small', 'detail')),
  heading TEXT NOT NULL,
  content TEXT NOT NULL, -- Markdown
  process_id TEXT NOT NULL, -- 必須: 対応する工程ID
  process_level TEXT NOT NULL, -- 工程レベル（大・中・小・詳細）
  bpmn_element_id TEXT, -- オプション: BPMNタスクID
  parent_section_id TEXT,
  sync_status TEXT DEFAULT 'synced' CHECK(sync_status IN ('synced', 'outdated', 'conflict')),
  auto_generated INTEGER DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (manual_id) REFERENCES manuals(id) ON DELETE CASCADE,
  FOREIGN KEY (process_id) REFERENCES processes(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_section_id) REFERENCES manual_sections(id) ON DELETE CASCADE
);

CREATE INDEX idx_manual_sections_manual_id ON manual_sections(manual_id);
CREATE INDEX idx_manual_sections_process_id ON manual_sections(process_id);
CREATE INDEX idx_manual_sections_sync_status ON manual_sections(sync_status);
```

#### manual_process_relations テーブル ⭐ 新規追加（同期管理）
```sql
CREATE TABLE manual_process_relations (
  id TEXT PRIMARY KEY,
  manual_section_id TEXT NOT NULL,
  process_id TEXT NOT NULL,
  relation_type TEXT NOT NULL CHECK(relation_type IN ('source', 'reference', 'derived')),
  sync_direction TEXT NOT NULL CHECK(sync_direction IN ('process_to_manual', 'manual_to_process', 'bidirectional')),
  last_sync_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (manual_section_id) REFERENCES manual_sections(id) ON DELETE CASCADE,
  FOREIGN KEY (process_id) REFERENCES processes(id) ON DELETE CASCADE,
  UNIQUE(manual_section_id, process_id)
);

CREATE INDEX idx_manual_process_relations_section ON manual_process_relations(manual_section_id);
CREATE INDEX idx_manual_process_relations_process ON manual_process_relations(process_id);
```

#### manual_process_relations テーブル (将来拡張)
```sql
CREATE TABLE manual_process_relations (
  id TEXT PRIMARY KEY,
  manual_id TEXT NOT NULL,
  process_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (manual_id) REFERENCES manuals(id) ON DELETE CASCADE,
  FOREIGN KEY (process_id) REFERENCES processes(id) ON DELETE CASCADE,
  UNIQUE(manual_id, process_id)
);
```

### 3.2 データ型定義 (TypeScript)

```typescript
// プロジェクト
interface Project {
  id: string;
  name: string;
  description?: string;
  storagePath: string;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}

// 工程
interface Process {
  id: string;
  projectId: string;
  name: string;
  level: 'large' | 'medium' | 'small' | 'detail';
  parentId?: string;
  department?: string;      // 大工程
  assignee?: string;        // 中工程
  documentType?: string;    // 小工程
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
  metadata?: Record<string, any>; // 🔄 将来の列追加に対応（ユーザーFB反映用）
}

// 📝 注意: 工程表の列項目はユーザーからのフィードバックを受けて追加・変更予定
// metadata フィールドを使用して拡張可能な設計としています

// BPMNダイアグラム
interface BpmnDiagram {
  id: string;
  projectId: string;
  name: string;
  xmlContent: string;
  processId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// バージョン
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
  processes: Process[];
  bpmnDiagrams: BpmnDiagram[];
  manuals?: Manual[];
}
```

---

## 4. API設計

### 4.1 IPC通信 (Electron)

#### プロジェクト操作
```typescript
// Main Process → Renderer Process
ipcMain.handle('project:create', async (event, data: CreateProjectDto) => Project)
ipcMain.handle('project:open', async (event, projectId: string) => Project)
ipcMain.handle('project:list', async () => Project[])
ipcMain.handle('project:update', async (event, projectId: string, data: UpdateProjectDto) => Project)
ipcMain.handle('project:delete', async (event, projectId: string) => boolean)

// ファイル操作
ipcMain.handle('file:selectDirectory', async () => string | null)
ipcMain.handle('file:selectExcel', async () => string | null)
ipcMain.handle('file:saveExcel', async (event, data: ExcelData) => boolean)
```

#### 工程操作
```typescript
ipcMain.handle('process:create', async (event, data: CreateProcessDto) => Process)
ipcMain.handle('process:update', async (event, processId: string, data: UpdateProcessDto) => Process)
ipcMain.handle('process:delete', async (event, processId: string) => boolean)
ipcMain.handle('process:list', async (event, projectId: string) => Process[])
ipcMain.handle('process:getByLevel', async (event, projectId: string, level: ProcessLevel) => Process[])
```

#### BPMN操作
```typescript
ipcMain.handle('bpmn:create', async (event, data: CreateBpmnDto) => BpmnDiagram)
ipcMain.handle('bpmn:update', async (event, bpmnId: string, xmlContent: string) => BpmnDiagram)
ipcMain.handle('bpmn:load', async (event, bpmnId: string) => BpmnDiagram)
ipcMain.handle('bpmn:export', async (event, bpmnId: string, format: 'svg' | 'png') => string)
```

#### BPMN・工程表同期操作 ⭐ コア機能
```typescript
// BPMN → 工程表への同期
ipcMain.handle('sync:bpmnToProcesses', async (event, bpmnId: string) => SyncResult)
ipcMain.handle('sync:processToBpmn', async (event, processId: string) => SyncResult)

// 自動同期設定
ipcMain.handle('sync:setAutoSync', async (event, projectId: string, enabled: boolean) => boolean)
ipcMain.handle('sync:getAutoSyncStatus', async (event, projectId: string) => boolean)

// 同期状態の確認
ipcMain.handle('sync:checkStatus', async (event, projectId: string) => SyncStatus)

interface SyncResult {
  success: boolean;
  processesCreated: number;
  processesUpdated: number;
  processesDeleted: number;
  bpmnTasksCreated: number;
  bpmnTasksUpdated: number;
  bpmnTasksDeleted: number;
  errors: string[];
}

interface SyncStatus {
  bpmnToProcess: 'synced' | 'outdated' | 'conflict';
  processToManual: 'synced' | 'outdated' | 'conflict';
  lastSyncAt: Date;
  pendingChanges: number;
}
```

#### マニュアル操作 ⭐ コア機能
```typescript
// マニュアル基本操作
ipcMain.handle('manual:create', async (event, data: CreateManualDto) => Manual)
ipcMain.handle('manual:update', async (event, manualId: string, data: UpdateManualDto) => Manual)
ipcMain.handle('manual:delete', async (event, manualId: string) => boolean)
ipcMain.handle('manual:list', async (event, projectId: string) => Manual[])

// マニュアルセクション操作
ipcMain.handle('manual:section:create', async (event, data: CreateSectionDto) => ManualSection)
ipcMain.handle('manual:section:update', async (event, sectionId: string, data: UpdateSectionDto) => ManualSection)
ipcMain.handle('manual:section:delete', async (event, sectionId: string) => boolean)
ipcMain.handle('manual:section:reorder', async (event, sectionIds: string[]) => boolean)

// 工程表からマニュアル生成
ipcMain.handle('manual:generateFromProcesses', async (event, projectId: string, options: GenerateOptions) => Manual)
ipcMain.handle('manual:syncFromProcesses', async (event, manualId: string) => SyncResult)

// マニュアルエクスポート
ipcMain.handle('manual:export', async (event, manualId: string, format: 'pdf' | 'html' | 'md' | 'docx') => string)

interface CreateManualDto {
  projectId: string;
  title: string;
  targetProcessLevel: 'small' | 'detail';
}

interface GenerateOptions {
  includeLevels: ('large' | 'medium' | 'small' | 'detail')[];
  includeProcessIds?: string[];
  template?: string;
  autoSync?: boolean;
}

interface ManualSection {
  id: string;
  manualId: string;
  sectionOrder: number;
  level: 'large' | 'medium' | 'small' | 'detail';
  heading: string;
  content: string;
  processId: string;
  processLevel: string;
  bpmnElementId?: string;
  parentSectionId?: string;
  syncStatus: 'synced' | 'outdated' | 'conflict';
  autoGenerated: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

#### バージョン管理
```typescript
ipcMain.handle('version:create', async (event, data: CreateVersionDto) => Version)
ipcMain.handle('version:list', async (event, projectId: string) => Version[])
ipcMain.handle('version:restore', async (event, versionId: string) => boolean)
ipcMain.handle('version:compare', async (event, versionId1: string, versionId2: string) => VersionDiff)
```

### 4.2 内部API (ビジネスロジック層)

#### ExcelService
```typescript
class ExcelService {
  async readExcel(filePath: string): Promise<ExcelData>
  async writeExcel(data: ExcelData, filePath: string): Promise<void>
  async parseProcessSheet(sheet: WorkSheet): Promise<Process[]>
  async parseFlowSheet(sheet: WorkSheet): Promise<BpmnData>
  async exportToExcel(processes: Process[], filePath: string): Promise<void>
}
```

#### BpmnService
```typescript
class BpmnService {
  async createDiagram(): Promise<string> // Returns XML
  async loadDiagram(xml: string): Promise<BpmnJS>
  async exportSVG(xml: string): Promise<string>
  async exportPNG(xml: string): Promise<Buffer>
  async syncWithProcesses(xml: string, processes: Process[]): Promise<string>
}
```

#### VersionService
```typescript
class VersionService {
  async createSnapshot(projectId: string, message: string): Promise<Version>
  async listVersions(projectId: string): Promise<Version[]>
  async restoreVersion(versionId: string): Promise<void>
  async compareVersions(versionId1: string, versionId2: string): Promise<VersionDiff>
  async tagVersion(versionId: string, tag: string): Promise<void>
}
```

#### ProcessService
```typescript
class ProcessService {
  async createProcess(data: CreateProcessDto): Promise<Process>
  async updateProcess(id: string, data: UpdateProcessDto): Promise<Process>
  async deleteProcess(id: string): Promise<void>
  async getProcessTree(projectId: string): Promise<ProcessTree>
  async getProcessesByLevel(projectId: string, level: ProcessLevel): Promise<Process[]>
  async validateHierarchy(process: Process): Promise<ValidationResult>
}
```

#### SyncEngine ⭐ コア機能
```typescript
class SyncEngine {
  // BPMN → 工程表の同期
  async syncBpmnToProcesses(bpmnId: string): Promise<SyncResult> {
    // 1. BPMNXMLを解析
    // 2. タスク要素を抽出
    // 3. 各タスクに対応する工程レコードを作成/更新
    // 4. カスタムプロパティから工程ID・レベルを読み取り
    // 5. シーケンスフローから親子関係を推定
    // 6. トランザクション処理で一括更新
  }

  // 工程表 → BPMNの同期
  async syncProcessesToBpmn(projectId: string): Promise<SyncResult> {
    // 1. プロジェクトの全工程を取得
    // 2. BPMNダイアグラムを読み込み
    // 3. 各工程に対応するBPMNタスクを作成/更新
    // 4. 階層関係をシーケンスフローで表現
    // 5. カスタムプロパティに工程情報を埋め込み
    // 6. BPMNXMLを保存
  }

  // 自動同期の監視
  async watchChanges(projectId: string, callback: (event: SyncEvent) => void): void {
    // ファイル変更監視
    // 定期的な同期チェック
    // 競合検出と通知
  }

  // 競合解決
  async resolveConflict(conflictId: string, resolution: 'bpmn' | 'process' | 'merge'): Promise<void> {
    // BPMN優先、工程表優先、またはマージ
  }
}

interface SyncEvent {
  type: 'bpmn_changed' | 'process_changed' | 'conflict_detected';
  entityId: string;
  timestamp: Date;
  changes: Change[];
}

interface Change {
  field: string;
  oldValue: any;
  newValue: any;
  source: 'bpmn' | 'process';
}
```

#### ManualGenerator ⭐ コア機能
```typescript
class ManualGenerator {
  // 工程表からマニュアルを生成
  async generateFromProcesses(projectId: string, options: GenerateOptions): Promise<Manual> {
    // 1. 指定されたレベルの工程を取得（小工程・詳細工程）
    // 2. 階層構造を分析
    // 3. マニュアルセクションを自動生成
    //    - 大工程 → 章
    //    - 中工程 → 節
    //    - 小工程 → 項
    //    - 詳細工程 → 具体的な手順
    // 4. 工程説明からマニュアル本文を生成
    // 5. BPMNフロー情報を参照（オプション）
    // 6. マニュアルセクション間の関連を設定
    // 7. データベースに保存
  }

  // 工程更新時のマニュアル同期
  async syncManualFromProcess(processId: string): Promise<SyncResult> {
    // 1. 工程に関連するマニュアルセクションを検索
    // 2. セクション内容を工程データで更新
    // 3. 同期ステータスを更新
    // 4. 変更履歴を記録
  }

  // マニュアルセクションの自動生成
  async generateSection(process: Process, level: SectionLevel): Promise<ManualSection> {
    // 工程情報からセクションを生成
    // - heading: 工程名
    // - content: 工程説明 + BPMN情報
    // - level: 工程レベルに対応
  }

  // マニュアルエクスポート
  async exportManual(manualId: string, format: ExportFormat): Promise<string> {
    // PDF, HTML, Markdown, Wordへのエクスポート
  }
}

interface GenerateOptions {
  includeLevels: ('large' | 'medium' | 'small' | 'detail')[];
  includeProcessIds?: string[];
  template?: 'business' | 'operation' | 'flowchart' | 'custom';
  autoSync?: boolean;
  includeBpmnImages?: boolean; // 🔮 Phase 7実装予定
  useAI?: boolean; // 🔮 Phase 7実装予定（生成AI連携）
  aiProvider?: 'openai' | 'anthropic' | 'custom'; // 🔮 Phase 7実装予定
}

type SectionLevel = 'chapter' | 'section' | 'subsection' | 'step';
type ExportFormat = 'pdf' | 'html' | 'markdown' | 'docx';
```

#### RelationManager ⭐ コア機能（三位一体管理）
```typescript
class RelationManager {
  // 三位一体の関連を作成
  async createRelation(bpmnElementId: string, processId: string, manualSectionId: string): Promise<void> {
    // BPMN-工程-マニュアルの三角関係を確立
  }

  // 関連の取得
  async getRelations(entityId: string, entityType: 'bpmn' | 'process' | 'manual'): Promise<Relations> {
    // 指定エンティティに関連するすべての要素を取得
  }

  // 一括同期
  async syncAll(projectId: string): Promise<SyncResult> {
    // BPMN → 工程 → マニュアル の順に同期
  }

  // 同期状態の確認
  async checkSyncStatus(projectId: string): Promise<SyncStatus> {
    // 各エンティティ間の同期状態をチェック
  }
}

interface Relations {
  bpmnElements: BpmnElement[];
  processes: Process[];
  manualSections: ManualSection[];
}
```

---

## 5. UI/UXコンポーネント仕様

### 5.1 共通コンポーネント

#### Layout Components
```typescript
// AppLayout: メインレイアウト
interface AppLayoutProps {
  sidebar?: React.ReactNode;
  header?: React.ReactNode;
  children: React.ReactNode;
}

// Sidebar: サイドバー
interface SidebarProps {
  items: SidebarItem[];
  activeItem?: string;
  onItemClick: (itemId: string) => void;
}

// Header: ヘッダー
interface HeaderProps {
  title: string;
  breadcrumbs?: Breadcrumb[];
  actions?: React.ReactNode;
}
```

#### Data Display Components
```typescript
// ProcessTree: 工程ツリー
interface ProcessTreeProps {
  processes: Process[];
  selectedId?: string;
  onSelect: (process: Process) => void;
  onExpand: (processId: string) => void;
}

// ProcessTable: 工程テーブル
interface ProcessTableProps {
  processes: Process[];
  columns: Column[];
  onEdit: (process: Process) => void;
  onDelete: (processId: string) => void;
}

// BpmnViewer: BPMNビューア
interface BpmnViewerProps {
  xml: string;
  readonly?: boolean;
  onElementClick?: (element: BpmnElement) => void;
  onSave?: (xml: string) => void;
}
```

#### Form Components
```typescript
// ProcessForm: 工程編集フォーム
interface ProcessFormProps {
  initialData?: Partial<Process>;
  level: ProcessLevel;
  onSubmit: (data: ProcessFormData) => void;
  onCancel: () => void;
}

// ProjectForm: プロジェクト編集フォーム
interface ProjectFormProps {
  initialData?: Partial<Project>;
  onSubmit: (data: ProjectFormData) => void;
  onCancel: () => void;
}
```

### 5.2 ページコンポーネント

```typescript
// /app/page.tsx - プロジェクト選択画面
// /app/project/[id]/page.tsx - メイン編集画面
// /app/project/[id]/history/page.tsx - 履歴表示画面
// /app/project/[id]/settings/page.tsx - プロジェクト設定画面
// /app/settings/page.tsx - アプリケーション設定画面
```

---

## 6. ファイル構造

```
output-management-tool/
├── electron/                    # Electronメインプロセス
│   ├── main.ts                 # エントリーポイント
│   ├── preload.ts              # Preloadスクリプト
│   ├── ipc/                    # IPC handlers
│   │   ├── project.ts
│   │   ├── process.ts
│   │   ├── bpmn.ts
│   │   └── version.ts
│   └── utils/                  # ユーティリティ
│       ├── database.ts
│       └── file-system.ts
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── page.tsx           # プロジェクト一覧
│   │   ├── layout.tsx         # ルートレイアウト
│   │   ├── project/
│   │   │   └── [id]/
│   │   │       ├── page.tsx   # メイン編集画面
│   │   │       ├── history/
│   │   │       ├── manuals/   # (将来)
│   │   │       └── settings/
│   │   └── settings/
│   │       └── page.tsx       # アプリ設定
│   ├── components/            # Reactコンポーネント
│   │   ├── layout/
│   │   │   ├── AppLayout.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── Header.tsx
│   │   ├── process/
│   │   │   ├── ProcessTree.tsx
│   │   │   ├── ProcessTable.tsx
│   │   │   ├── ProcessForm.tsx
│   │   │   └── ProcessCard.tsx
│   │   ├── bpmn/
│   │   │   ├── BpmnEditor.tsx
│   │   │   ├── BpmnViewer.tsx
│   │   │   └── BpmnToolbar.tsx
│   │   ├── version/
│   │   │   ├── VersionList.tsx
│   │   │   ├── VersionCompare.tsx
│   │   │   └── VersionTimeline.tsx
│   │   └── common/
│   │       ├── Button.tsx
│   │       ├── Modal.tsx
│   │       └── ErrorBoundary.tsx
│   ├── lib/                   # ビジネスロジック
│   │   ├── services/
│   │   │   ├── excel.service.ts
│   │   │   ├── bpmn.service.ts
│   │   │   ├── version.service.ts
│   │   │   └── process.service.ts
│   │   ├── stores/            # Zustand stores
│   │   │   ├── project.store.ts
│   │   │   ├── process.store.ts
│   │   │   └── ui.store.ts
│   │   └── utils/
│   │       ├── validators.ts
│   │       ├── formatters.ts
│   │       └── constants.ts
│   ├── types/                 # 型定義
│   │   ├── project.types.ts
│   │   ├── process.types.ts
│   │   ├── bpmn.types.ts
│   │   ├── version.types.ts
│   │   └── ipc.types.ts
│   └── styles/               # グローバルスタイル
│       └── globals.css
├── public/                    # 静的ファイル
│   ├── icon.ico
│   ├── icon.icns
│   └── icon.png
├── doc/                       # ドキュメント
│   ├── requirements.md
│   ├── specifications.md
│   └── development-todo.md
├── package.json
├── tsconfig.json
├── next.config.ts
├── electron-builder.json
├── tailwind.config.ts
└── README.md
```

---

## 7. モジュール仕様

### 7.1 Excel処理モジュール

#### 入力フォーマット
```
【工程表シート】
| 工程ID | 工程名 | 階層レベル | 親工程ID | 部署 | 担当者 | 帳票種類 | 開始日 | 終了日 | 備考 |
|--------|--------|-----------|----------|------|--------|----------|--------|--------|------|

階層レベル: large(大), medium(中), small(小), detail(詳細)
```

#### 出力フォーマット
同上（編集内容を反映）

### 7.2 BPMN処理モジュール

#### カスタム拡張属性
```xml
<bpmn:task id="Task_1" name="見積書作成">
  <bpmn:extensionElements>
    <custom:processInfo>
      <custom:processId>proc-123</custom:processId>
      <custom:level>small</custom:level>
      <custom:department>営業部門</custom:department>
    </custom:processInfo>
  </bpmn:extensionElements>
</bpmn:task>
```

### 7.3 バージョン管理モジュール

#### スナップショット形式
```json
{
  "version": "1.0",
  "timestamp": 1697184000000,
  "processes": [...],
  "bpmnDiagrams": [...],
  "metadata": {
    "totalProcesses": 50,
    "levels": {
      "large": 5,
      "medium": 15,
      "small": 20,
      "detail": 10
    }
  }
}
```

---

## 8. セキュリティ仕様

### 8.1 データ保護
- ローカルストレージのみ使用（外部送信なし）
- SQLiteファイルの暗号化（オプション）
- ファイルアクセス権限の適切な設定

### 8.2 入力検証
- Zodスキーマによる入力検証
- XSS対策（React自動エスケープ）
- SQLインジェクション対策（プリペアドステートメント）

### 8.3 エラーハンドリング
```typescript
// グローバルエラーハンドラー
class ErrorHandler {
  static handle(error: Error, context: string): void {
    // エラーログ記録
    logger.error(error, { context });
    
    // ユーザーへの通知
    toast.error(`エラーが発生しました: ${error.message}`);
    
    // 回復処理
    // ...
  }
}
```

---

## 9. Phase 6実装詳細 ⭐ 三位一体同期機能

### 9.1 アーキテクチャ拡張

```
三位一体同期システム
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│     BPMN     │ ⇄   │   工程表      │  →   │  マニュアル   │
│  (XML形式)   │      │  (SQLite)    │      │  (SQLite)    │
└──────┬───────┘      └──────┬───────┘      └──────┬───────┘
       │                     │                     │
       └─────────┬───────────┴─────────┬───────────┘
                 │                     │
          ┌──────▼─────────────────────▼──────┐
          │     SyncEngine (双方向)            │
          │  - bpmnToProcesses()              │
          │  - processesToBpmn()              │
          │  - watchChanges()                 │
          └───────────────────────────────────┘
                         │
          ┌──────────────▼──────────────┐
          │   ManualGenerator            │
          │  - generateFromProcesses()   │
          │  - syncManualFromProcess()   │
          │  - exportManual()            │
          └──────────────────────────────┘
```

### 9.2 実装ファイル一覧

| ファイル | 行数 | 役割 |
|---------|------|------|
| `electron/services/SyncEngine.ts` | 450 | BPMN⇔工程双方向同期 |
| `electron/services/ManualGenerator.ts` | 650 | マニュアル生成 |
| `electron/ipc/sync.handlers.ts` | 170 | 同期IPC |
| `electron/ipc/manual.handlers.ts` | 120 | マニュアルIPC |
| `src/app/projects/[id]/manuals/page.tsx` | 484 | 一覧UI |
| `src/app/projects/[id]/manuals/[manualId]/page.tsx` | 620 | エディタUI |
| `src/app/projects/[id]/trinity/page.tsx` | 420 | 統合ダッシュボード |
| `src/components/manual/ManualPreview.tsx` | 180 | プレビュー |

**合計**: 3,094行の新規実装

### 9.3 データベース拡張

```sql
-- Migration 003: Phase 6同期フィールド
ALTER TABLE manuals ADD COLUMN auto_generated BOOLEAN DEFAULT 0;
ALTER TABLE manuals ADD COLUMN last_sync_at TEXT;
ALTER TABLE manual_sections ADD COLUMN sync_status TEXT;
ALTER TABLE manual_sections ADD COLUMN auto_generated BOOLEAN DEFAULT 0;
```

---

## 変更履歴

| バージョン | 日付 | 変更内容 |
|-----------|------|---------|
| 1.0 | 2025-10-13 | 初版作成 |
| 1.1 | 2025-10-13 | NextUI→HeroUIに変更 |
| 1.5 | 2025-10-14 | Phase 6実装内容追記 |
| 1.6 | 2025-10-14 | Phase 6完了、実装詳細追加 |

---

**文書末尾**
