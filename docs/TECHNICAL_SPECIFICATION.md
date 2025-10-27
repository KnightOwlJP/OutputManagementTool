# Output Management Tool - 技術仕様書

**Version**: 1.0.0 (Phase 9)  
**作成日**: 2025年10月24日  
**最終更新**: 2025年10月24日

---

## 目次
1. [アーキテクチャ概要](#1-アーキテクチャ概要)
2. [技術スタック](#2-技術スタック)
3. [データベース設計](#3-データベース設計)
4. [API仕様](#4-api仕様)
5. [フロントエンド設計](#5-フロントエンド設計)
6. [ビルド・デプロイ](#6-ビルドデプロイ)
7. [セキュリティ](#7-セキュリティ)
8. [パフォーマンス最適化](#8-パフォーマンス最適化)

---

## 1. アーキテクチャ概要

### 1.1 Phase 9アーキテクチャの特徴

```
┌─────────────────────────────────────────────────────────┐
│                     Electron App                         │
├─────────────────────────────────────────────────────────┤
│  Main Process                    Renderer Process        │
│  ┌──────────────┐               ┌──────────────┐       │
│  │ IPC Handlers │◄─────────────►│  Next.js App │       │
│  │              │   IPC Bridge   │   (React)    │       │
│  │  - project   │               │              │       │
│  │  - process   │               │  Components  │       │
│  │  - bpmn      │               │  Pages       │       │
│  │  - manual    │               │  Hooks       │       │
│  │  - backup    │               └──────────────┘       │
│  └──────┬───────┘                                       │
│         │                                                │
│         ▼                                                │
│  ┌──────────────┐                                       │
│  │   SQLite DB  │                                       │
│  │              │                                       │
│  │  better-     │                                       │
│  │  sqlite3     │                                       │
│  └──────────────┘                                       │
└─────────────────────────────────────────────────────────┘
```

### 1.2 データフロー

**Phase 9の中心概念**: 工程表がすべての起点

```
┌────────────┐
│ ProcessTable│ 工程表作成
└──────┬─────┘
       │
       ├─ 自動生成 ──► ┌───────────────┐
       │              │ BpmnDiagramTable│ (読み取り専用)
       │              └───────────────┘
       │
       ├─ 自動生成 ──► ┌───────────────┐
       │              │  ManualTable    │ (読み取り専用)
       │              └───────────────┘
       │
       └─ 1対多 ─────► ┌───────────────┐
                       │   Processes    │ (工程)
                       └───────────────┘
```

**重要**: BPMNとマニュアルは工程表から自動生成され、手動作成は不可

---

## 2. 技術スタック

### 2.1 フロントエンド

| 技術 | バージョン | 用途 |
|------|-----------|------|
| **React** | 19.0.0 | UIフレームワーク |
| **Next.js** | 15.1.6 | フルスタックフレームワーク |
| **TypeScript** | 5.7.2 | 型安全な開発 |
| **HeroUI** | 2.9.1 | UIコンポーネントライブラリ |
| **Tailwind CSS** | 3.4.17 | CSSフレームワーク |
| **bpmn-js** | 17.12.1 | BPMNビューア |
| **elkjs** | 0.9.3 | グラフ自動レイアウト |

### 2.2 バックエンド（Electron）

| 技術 | バージョン | 用途 |
|------|-----------|------|
| **Electron** | 34.0.0 | デスクトップアプリ化 |
| **better-sqlite3** | 11.8.1 | SQLiteデータベース |
| **uuid** | 11.0.3 | 一意ID生成 |
| **electron-serve** | 2.3.0 | 静的ファイル配信 |

### 2.3 ビルドツール

| 技術 | バージョン | 用途 |
|------|-----------|------|
| **electron-builder** | 25.1.8 | インストーラー作成 |
| **cross-env** | 7.0.3 | 環境変数管理 |
| **webpack** | 5.x | モジュールバンドル |

---

## 3. データベース設計

### 3.1 ER図

```
┌───────────┐
│ projects  │
└─────┬─────┘
      │ 1
      │
      │ *
┌─────┴──────────┐
│ process_tables │
└─────┬──────────┘
      │ 1        ├─ 1:1 ──► ┌─────────────────┐
      │          │           │ bpmn_diagrams   │
      │          │           └─────────────────┘
      │          │
      │          └─ 1:1 ──► ┌─────────────────┐
      │                     │ manuals         │
      │                     └─────────────────┘
      │ *
┌─────┴──────┐
│ processes  │
└────────────┘
      │ *
      │
┌─────┴──────────┐
│ swimlanes      │
│ custom_columns │
│ data_objects   │
│ steps          │
└────────────────┘
```

### 3.2 主要テーブル定義

#### 3.2.1 projects（プロジェクト）

```sql
CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
```

#### 3.2.2 process_tables（工程表）

```sql
CREATE TABLE process_tables (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  name TEXT NOT NULL,
  level TEXT CHECK(level IN ('large', 'medium', 'small', 'detail')),
  description TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);
```

#### 3.2.3 processes（工程）

```sql
CREATE TABLE processes (
  id TEXT PRIMARY KEY,
  process_table_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  level TEXT CHECK(level IN ('large', 'medium', 'small', 'detail')),
  lane_id TEXT,                    -- スイムレーンID
  step_id TEXT,                    -- ステップID
  bpmn_element TEXT,               -- BPMN要素タイプ
  task_type TEXT,                  -- タスク種別
  gateway_type TEXT,               -- ゲートウェイ種別
  event_type TEXT,                 -- イベント種別
  before_process_ids TEXT,         -- 前工程ID（JSON配列）
  next_process_ids TEXT,           -- 次工程ID（JSON配列）
  conditional_flows TEXT,          -- 条件フロー（JSON）
  message_flows TEXT,              -- メッセージフロー（JSON）
  display_order INTEGER DEFAULT 0,
  custom_columns TEXT,             -- カスタム列値（JSON）
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (process_table_id) REFERENCES process_tables(id) ON DELETE CASCADE,
  FOREIGN KEY (lane_id) REFERENCES swimlanes(id) ON DELETE SET NULL,
  FOREIGN KEY (step_id) REFERENCES steps(id) ON DELETE SET NULL
);
```

#### 3.2.4 swimlanes（スイムレーン）

```sql
CREATE TABLE swimlanes (
  id TEXT PRIMARY KEY,
  process_table_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (process_table_id) REFERENCES process_tables(id) ON DELETE CASCADE
);
```

#### 3.2.5 custom_columns（カスタム列）

```sql
CREATE TABLE custom_columns (
  id TEXT PRIMARY KEY,
  process_table_id TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT CHECK(type IN ('text', 'number', 'date', 'select', 'checkbox')),
  options TEXT,                    -- 選択肢（JSON配列）
  required INTEGER DEFAULT 0,
  display_order INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (process_table_id) REFERENCES process_tables(id) ON DELETE CASCADE
);
```

#### 3.2.6 bpmn_diagrams（BPMNフロー図）

```sql
CREATE TABLE bpmn_diagrams (
  id TEXT PRIMARY KEY,
  process_table_id TEXT NOT NULL UNIQUE,  -- 1対1関係
  project_id TEXT NOT NULL,
  name TEXT NOT NULL,
  xml_content TEXT,                       -- BPMN 2.0 XML
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (process_table_id) REFERENCES process_tables(id) ON DELETE CASCADE,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);
```

#### 3.2.7 manuals（マニュアル）

```sql
CREATE TABLE manuals (
  id TEXT PRIMARY KEY,
  process_table_id TEXT NOT NULL UNIQUE,  -- 1対1関係
  project_id TEXT NOT NULL,
  name TEXT NOT NULL,
  content TEXT,                           -- Markdown形式
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (process_table_id) REFERENCES process_tables(id) ON DELETE CASCADE,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);
```

### 3.3 インデックス設計

```sql
-- パフォーマンス最適化用インデックス
CREATE INDEX idx_process_tables_project ON process_tables(project_id);
CREATE INDEX idx_processes_table ON processes(process_table_id);
CREATE INDEX idx_processes_lane ON processes(lane_id);
CREATE INDEX idx_processes_step ON processes(step_id);
CREATE INDEX idx_swimlanes_table ON swimlanes(process_table_id);
CREATE INDEX idx_custom_columns_table ON custom_columns(process_table_id);
CREATE INDEX idx_bpmn_diagrams_table ON bpmn_diagrams(process_table_id);
CREATE INDEX idx_manuals_table ON manuals(process_table_id);
```

---

## 4. API仕様

### 4.1 IPC通信プロトコル

ElectronのMain ProcessとRenderer Process間の通信にIPCを使用。

**基本形式**:
```typescript
ipcMain.handle('channel:method', async (_, ...args) => {
  // 処理
  return result;
});
```

**エラーハンドリング**:
```typescript
try {
  // 処理
} catch (error) {
  console.error('[IPC] Error:', error);
  throw error;  // Renderer側でキャッチ
}
```

### 4.2 主要API一覧

#### 4.2.1 プロジェクトAPI

| メソッド | チャネル | 説明 |
|---------|---------|------|
| create | `project:create` | プロジェクト作成 |
| getAll | `project:getAll` | 全プロジェクト取得 |
| getById | `project:getById` | ID指定で取得 |
| update | `project:update` | プロジェクト更新 |
| delete | `project:delete` | プロジェクト削除 |

#### 4.2.2 工程表API

| メソッド | チャネル | 説明 |
|---------|---------|------|
| create | `processTable:create` | 工程表作成（BPMN/Manual自動生成） |
| getByProject | `processTable:getByProject` | プロジェクト内の全工程表取得 |
| getById | `processTable:getById` | ID指定で取得 |
| update | `processTable:update` | 工程表更新 |
| delete | `processTable:delete` | 工程表削除（BPMN/Manualも削除） |
| createSwimlane | `processTable:createSwimlane` | スイムレーン作成 |
| getSwimlanes | `processTable:getSwimlanes` | スイムレーン一覧取得 |
| createCustomColumn | `processTable:createCustomColumn` | カスタム列作成 |
| getCustomColumns | `processTable:getCustomColumns` | カスタム列一覧取得 |

#### 4.2.3 工程API

| メソッド | チャネル | 説明 |
|---------|---------|------|
| create | `process:create` | 工程作成 |
| getByProcessTable | `process:getByProcessTable` | 工程表内の全工程取得 |
| getById | `process:getById` | ID指定で取得 |
| update | `process:update` | 工程更新 |
| delete | `process:delete` | 工程削除 |
| reorder | `process:reorder` | 工程並び替え |

#### 4.2.4 BPMNフロー図API（読み取り専用）

| メソッド | チャネル | 説明 |
|---------|---------|------|
| getByProject | `bpmnDiagramTable:getByProject` | プロジェクト内の全BPMN取得 |
| getById | `bpmnDiagramTable:getById` | ID指定で取得 |
| getByProcessTable | `bpmnDiagramTable:getByProcessTable` | 工程表に紐づくBPMN取得 |
| update | `bpmnDiagramTable:update` | XMLコンテンツ更新 |
| delete | `bpmnDiagramTable:delete` | BPMN削除 |

**重要**: `create`メソッドは存在しない（工程表作成時に自動生成）

#### 4.2.5 マニュアルAPI（読み取り専用）

| メソッド | チャネル | 説明 |
|---------|---------|------|
| getByProject | `manualTable:getByProject` | プロジェクト内の全マニュアル取得 |
| getById | `manualTable:getById` | ID指定で取得 |
| getByProcessTable | `manualTable:getByProcessTable` | 工程表に紐づくマニュアル取得 |
| update | `manualTable:update` | コンテンツ更新 |
| delete | `manualTable:delete` | マニュアル削除 |

**重要**: `create`メソッドは存在しない（工程表作成時に自動生成）

### 4.3 API使用例

#### プロジェクト作成からBPMN生成まで

```typescript
// 1. プロジェクト作成
const project = await window.electronAPI.project.create({
  name: '新規プロジェクト',
  description: 'プロジェクトの説明'
});

// 2. 工程表作成（BPMNとマニュアルが自動生成される）
const processTable = await window.electronAPI.processTable.create({
  projectId: project.id,
  name: '基本業務フロー',
  level: 'medium'
});

// 3. スイムレーン作成
const swimlane = await window.electronAPI.processTable.createSwimlane(
  processTable.id,
  { name: '営業部', description: '営業担当者' }
);

// 4. 工程作成
const process = await window.electronAPI.process.create({
  processTableId: processTable.id,
  name: '見積作成',
  laneId: swimlane.id,
  bpmnElement: 'task',
  taskType: 'user'
});

// 5. 自動生成されたBPMNを取得
const bpmn = await window.electronAPI.bpmnDiagramTable.getByProcessTable(
  processTable.id
);
```

---

## 5. フロントエンド設計

### 5.1 ディレクトリ構造

```
src/
├── app/                        # Next.js App Router
│   ├── page.tsx               # トップページ
│   ├── projects/              # プロジェクト関連
│   │   ├── page.tsx          # プロジェクト一覧
│   │   └── [id]/             # プロジェクト詳細
│   │       ├── page.tsx      # 工程表一覧
│   │       ├── process-tables/
│   │       │   └── [tableId]/
│   │       │       └── ClientPage.tsx  # 工程表詳細+BPMNビューア
│   │       ├── manuals/
│   │       │   ├── page.tsx          # マニュアル一覧
│   │       │   └── [manualId]/
│   │       │       └── page.tsx      # マニュアルエディタ
│   │       └── versions/
│   │           └── page.tsx          # バージョン管理
│   ├── settings/              # アプリ設定
│   │   └── page.tsx
│   └── manual/                # 使い方マニュアル
│       └── page.tsx
├── components/                # Reactコンポーネント
│   ├── common/               # 共通コンポーネント
│   │   ├── AppLayout.tsx    # レイアウト
│   │   ├── Button.tsx       # ボタン
│   │   └── Modal.tsx        # モーダル
│   ├── processTable/        # 工程表関連
│   │   ├── ProcessTableList.tsx
│   │   ├── ProcessManagement.tsx
│   │   ├── ProcessFormModal.tsx
│   │   └── DataObjectManagement.tsx
│   ├── bpmn/                # BPMN関連
│   │   └── BpmnViewer.tsx
│   └── version/             # バージョン管理
│       └── VersionList.tsx
├── lib/                      # ユーティリティ
│   ├── ipc-helpers.ts       # IPC通信ヘルパー
│   ├── bpmn-generator.ts    # BPMN XML生成
│   ├── elk-layout.ts        # ELK自動レイアウト
│   └── logger.ts            # ログ出力
├── stores/                   # 状態管理
│   ├── projectStore.ts
│   └── processStore.ts
├── contexts/                 # Reactコンテキスト
│   ├── ToastContext.tsx     # トースト通知
│   └── SettingsContext.tsx  # アプリ設定
└── types/                    # TypeScript型定義
    ├── electron.d.ts        # ElectronAPI型
    ├── models.ts            # データモデル型
    └── project.types.ts     # プロジェクト型
```

### 5.2 コンポーネント設計原則

#### 5.2.1 責務の分離
- **Page**: ルーティング、データ取得、状態管理
- **Component**: UI表示、ユーザー操作
- **Lib**: ビジネスロジック、ユーティリティ

#### 5.2.2 命名規則
- コンポーネント: PascalCase（例: `ProcessFormModal`）
- ファイル: PascalCase（例: `ProcessFormModal.tsx`）
- 関数/変数: camelCase（例: `handleSubmit`）
- 定数: UPPER_SNAKE_CASE（例: `MAX_PROCESSES`）

#### 5.2.3 Hooksの使用
```typescript
// データ取得
useEffect(() => {
  loadData();
}, [dependency]);

// 状態管理
const [state, setState] = useState<Type>(initialValue);

// コンテキスト
const { showToast } = useToast();
```

### 5.3 状態管理

#### 5.3.1 Zustandストア
```typescript
// stores/projectStore.ts
export const useProjectStore = create<ProjectStore>((set) => ({
  currentProject: null,
  setCurrentProject: (project) => set({ currentProject: project }),
  updateProject: (updates) => set((state) => ({
    currentProject: state.currentProject 
      ? { ...state.currentProject, ...updates }
      : null
  }))
}));
```

#### 5.3.2 Reactコンテキスト
```typescript
// contexts/ToastContext.tsx
export const ToastProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const showToast = (type: 'success' | 'error', message: string) => {
    // トースト表示ロジック
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
    </ToastContext.Provider>
  );
};
```

---

## 6. ビルド・デプロイ

### 6.1 開発環境

```bash
# 依存関係インストール
npm install

# 開発サーバー起動
npm run dev

# Electronアプリ起動
npm run electron:dev
```

### 6.2 本番ビルド

```bash
# Next.js静的ビルド
npm run build:next

# Electronバンドル（開発用）
npm run build:electron:dev

# Windows向けインストーラー作成
npm run build:win
```

### 6.3 electron-builder設定

```json
{
  "appId": "com.outputmanagement.tool",
  "productName": "Output Management Tool",
  "directories": {
    "output": "dist"
  },
  "files": [
    "out/**/*",
    "electron/**/*",
    "package.json"
  ],
  "win": {
    "target": ["nsis"],
    "icon": "public/icon.png"
  },
  "nsis": {
    "oneClick": false,
    "allowToChangeInstallationDirectory": true,
    "createDesktopShortcut": true,
    "createStartMenuShortcut": true
  }
}
```

### 6.4 静的エクスポート設定

```typescript
// next.config.ts
const nextConfig = {
  output: 'export',  // 静的HTML出力
  images: {
    unoptimized: true  // 画像最適化無効
  },
  trailingSlash: true  // URLに/を付与
};
```

---

## 7. セキュリティ

### 7.1 Electronセキュリティ設定

```typescript
// electron/main.ts
const mainWindow = new BrowserWindow({
  webPreferences: {
    preload: path.join(__dirname, 'preload.js'),
    nodeIntegration: false,     // Node.js APIを無効化
    contextIsolation: true,     // コンテキスト分離
    sandbox: false              // SQLite使用のため
  }
});
```

### 7.2 SQLインジェクション対策

```typescript
// プリペアドステートメントを使用
db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId);
db.prepare('INSERT INTO projects VALUES (?, ?, ?)').run(id, name, desc);
```

### 7.3 XSS対策

- Reactの自動エスケープを利用
- `dangerouslySetInnerHTML`は使用しない
- ユーザー入力は常にバリデーション

---

## 8. パフォーマンス最適化

### 8.1 データベース最適化

```sql
-- インデックス作成
CREATE INDEX idx_processes_table ON processes(process_table_id);

-- トランザクション使用
BEGIN TRANSACTION;
-- 複数のINSERT/UPDATE
COMMIT;

-- バッチ処理
const stmt = db.prepare('INSERT INTO processes VALUES (?, ?)');
const insertMany = db.transaction((processes) => {
  for (const p of processes) stmt.run(p.id, p.name);
});
insertMany(processArray);
```

### 8.2 フロントエンド最適化

```typescript
// メモ化
const MemoizedComponent = React.memo(MyComponent);

// useMemo
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(a, b);
}, [a, b]);

// useCallback
const handleClick = useCallback(() => {
  doSomething(id);
}, [id]);

// 遅延ロード
const BpmnViewer = dynamic(() => import('@/components/bpmn/BpmnViewer'), {
  ssr: false
});
```

### 8.3 BPMN描画最適化

```typescript
// ELKレイアウト計算の最適化
const elkOptions = {
  'elk.algorithm': 'layered',
  'elk.direction': 'RIGHT',
  'elk.spacing.nodeNode': '80',
  'elk.layered.spacing.nodeNodeBetweenLayers': '100'
};

// ビューポート最適化
bpmnViewer.get('canvas').zoom('fit-viewport', 'auto');
```

---

## 9. テスト戦略

### 9.1 単体テスト

```typescript
// IPC Handler テスト例
describe('project.handlers', () => {
  it('should create project', async () => {
    const result = await ipcMain.handle('project:create', {
      name: 'Test Project'
    });
    expect(result.name).toBe('Test Project');
  });
});
```

### 9.2 統合テスト

```typescript
// コンポーネント統合テスト例
import { render, screen, fireEvent } from '@testing-library/react';

test('ProcessFormModal submits data', async () => {
  render(<ProcessFormModal />);
  fireEvent.change(screen.getByLabelText('工程名'), {
    target: { value: 'テスト工程' }
  });
  fireEvent.click(screen.getByText('保存'));
  // アサーション
});
```

### 9.3 E2Eテスト

```typescript
// Spectron or Playwright使用
test('Create project flow', async () => {
  // アプリ起動
  // プロジェクト作成ボタンクリック
  // フォーム入力
  // 保存確認
});
```

---

## 10. ログ・モニタリング

### 10.1 ログレベル

```typescript
enum LogLevel {
  ERROR = 'ERROR',   // エラー
  WARN = 'WARN',     // 警告
  INFO = 'INFO',     // 情報
  DEBUG = 'DEBUG'    // デバッグ
}
```

### 10.2 ログ出力

```typescript
// electron/utils/logger.ts
export const logger = {
  error: (component: string, message: string, error?: Error) => {
    const logEntry = `[${new Date().toISOString()}] [ERROR] [${component}] ${message}`;
    console.error(logEntry, error);
    // ファイルに書き込み
  },
  info: (component: string, message: string) => {
    const logEntry = `[${new Date().toISOString()}] [INFO] [${component}] ${message}`;
    console.log(logEntry);
  }
};
```

### 10.3 ログローテーション

- 7日以上古いログは自動削除
- ログファイルサイズ上限: 10MB
- 保存先: `userData/logs/`

---

## 11. トラブルシューティング

### 11.1 よくある問題

| 問題 | 原因 | 解決方法 |
|------|------|----------|
| ビルドエラー | 型定義不一致 | `npm run type-check` |
| データベースロック | 同時アクセス | トランザクション使用 |
| BPMN表示されない | XMLフォーマットエラー | XMLバリデーション |
| 画面真っ白 | Reactエラー | DevToolsでエラー確認 |

### 11.2 デバッグ方法

```typescript
// Renderer Process
console.log('[Component] Debug info:', data);

// Main Process
console.log('[IPC] Request received:', args);

// SQLite クエリ
db.pragma('query_only = ON');  // 読み取り専用モード
```

---

## 12. 変更履歴

| Version | 日付 | 変更内容 |
|---------|------|----------|
| 1.0.0 | 2025-10-24 | 初版作成（Phase 9仕様） |

---

## 付録

### A. 環境変数

```env
NODE_ENV=production
NEXT_PUBLIC_KEEP_CONSOLE=1
```

### B. 推奨開発ツール

- **IDE**: Visual Studio Code
- **拡張機能**:
  - ESLint
  - Prettier
  - TypeScript Hero
  - GitLens

### C. 参考資料

- [BPMN 2.0 Specification](https://www.omg.org/spec/BPMN/2.0/)
- [Electron Documentation](https://www.electronjs.org/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Better SQLite3 API](https://github.com/WiseLibs/better-sqlite3/blob/master/docs/api.md)
