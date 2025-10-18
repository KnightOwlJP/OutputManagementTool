# 工程表・フロー図・マニュアル管理システム - 実装ガイド

## 📋 概要

一つのプロジェクトに対して、複数の**工程表**、**フロー図グループ**、**マニュアルグループ**を作成・管理できるシステムです。

各グループは独立して管理でき、レベル別（大工程・中工程・小工程・詳細）に分類されます。

## 🏗️ アーキテクチャ変更

### 新しいエンティティ

#### ProcessTable（工程表）

```typescript
interface ProcessTable {
  id: string;
  projectId: string;
  name: string;                    // 工程表名（例: "営業部門 大工程表"）
  level: ProcessLevel;             // この工程表のレベル
  description?: string;
  parentProcessIds?: string[];     // この工程表が詳細化する上位工程のID（複数可）
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}
```

#### BpmnDiagramTable（フロー図グループ）✨

```typescript
interface BpmnDiagramTable {
  id: string;
  projectId: string;
  name: string;                    // フロー図グループ名（例: "営業部門 大工程フロー"）
  level: ProcessLevel;             // このフロー図グループのレベル
  description?: string;
  processTableId?: string;         // 紐付く工程表のID
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}
```

#### ManualTable（マニュアルグループ）✨

```typescript
interface ManualTable {
  id: string;
  projectId: string;
  name: string;                    // マニュアルグループ名（例: "営業部門 詳細手順書"）
  level: ProcessLevel;             // このマニュアルグループのレベル
  description?: string;
  processTableId?: string;         // 紐付く工程表のID
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### 子エンティティの変更

```typescript
interface Process {
  // ...existing fields...
  processTableId?: string;  // 所属する工程表のID（オプショナル＝後方互換性）
}

interface BpmnDiagram {
  // ...existing fields...
  bpmnDiagramTableId?: string;     // 所属するフロー図グループのID
  processTableId?: string;         // 旧形式との互換性
}

interface Manual {
  // ...existing fields...
  manualTableId?: string;          // 所属するマニュアルグループのID
  processTableId?: string;         // 旧形式との互換性
}
```

## 🗄️ データベース設計

### 新テーブル

#### process_tables（工程表）

```sql
CREATE TABLE process_tables (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  name TEXT NOT NULL,
  level TEXT NOT NULL CHECK(level IN ('large', 'medium', 'small', 'detail')),
  description TEXT,
  parent_process_ids TEXT,  -- JSON配列
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  metadata TEXT,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);
```

#### bpmn_diagram_tables（フロー図グループ）✨

```sql
CREATE TABLE bpmn_diagram_tables (
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
```

#### manual_tables（マニュアルグループ）✨

```sql
CREATE TABLE manual_tables (
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
```

### 子テーブルの変更

```sql
-- processes テーブル
ALTER TABLE processes ADD COLUMN process_table_id TEXT;
-- FOREIGN KEY (process_table_id) REFERENCES process_tables(id) ON DELETE CASCADE

-- bpmn_diagrams テーブル
ALTER TABLE bpmn_diagrams ADD COLUMN bpmn_diagram_table_id TEXT;
-- FOREIGN KEY (bpmn_diagram_table_id) REFERENCES bpmn_diagram_tables(id) ON DELETE CASCADE

-- manuals テーブル
ALTER TABLE manuals ADD COLUMN manual_table_id TEXT;
-- FOREIGN KEY (manual_table_id) REFERENCES manual_tables(id) ON DELETE CASCADE
```

## 🔄 ワークフロー

### 1. 工程表の作成

```
プロジェクト作成
  ↓
工程表を作成（例: "営業部門 大工程表"）
  ↓
工程表に工程を追加
  ↓
工程の並び替え
  ↓
フロー図・マニュアルの自動生成
```

### 2. 階層的な工程表

```
大工程表
  └─ 大工程1「受注業務」
  └─ 大工程2「出荷業務」
       ↓ これを詳細化
     中工程表「出荷業務詳細」
       └─ 中工程1「在庫確認」
       └─ 中工程2「梱包作業」
            ↓ さらに詳細化
          小工程表「梱包作業手順」
            └─ 小工程1「検品」
            └─ 小工程2「梱包」
```

## 📁 実装ファイル

### バックエンド

#### 工程表（ProcessTable）

1. **electron/ipc/processTable.handlers.ts** - 工程表CRUD操作
   - `processTable:create` - 工程表作成
   - `processTable:getByProject` - プロジェクトの工程表一覧
   - `processTable:getById` - 工程表取得
   - `processTable:update` - 工程表更新
   - `processTable:delete` - 工程表削除（カスケード）
   - `processTable:reorder` - 並び替え

#### フロー図グループ（BpmnDiagramTable）✨

2. **electron/ipc/bpmnDiagramTable.handlers.ts** - フロー図グループCRUD操作
   - `bpmnDiagramTable:create` - フロー図グループ作成
   - `bpmnDiagramTable:getByProject` - プロジェクトのフロー図グループ一覧
   - `bpmnDiagramTable:getById` - フロー図グループ取得
   - `bpmnDiagramTable:update` - フロー図グループ更新
   - `bpmnDiagramTable:delete` - フロー図グループ削除（カスケード）
   - `bpmnDiagramTable:reorder` - 並び替え

#### マニュアルグループ（ManualTable）✨

3. **electron/ipc/manualTable.handlers.ts** - マニュアルグループCRUD操作
   - `manualTable:create` - マニュアルグループ作成
   - `manualTable:getByProject` - プロジェクトのマニュアルグループ一覧
   - `manualTable:getById` - マニュアルグループ取得
   - `manualTable:update` - マニュアルグループ更新
   - `manualTable:delete` - マニュアルグループ削除（カスケード）
   - `manualTable:reorder` - 並び替え

#### データベース・同期

4. **electron/utils/database.ts** - データベーススキーマ
   - `process_tables` テーブル作成
   - `bpmn_diagram_tables` テーブル作成
   - `manual_tables` テーブル作成
   - 各子テーブルに対応するIDカラム追加

5. **electron/ipc/process.handlers.ts** - 既存Process APIの更新
   - `process:create` に `processTableId` パラメータ追加

6. **electron/ipc/bpmn.handlers.ts** - 既存BPMN APIの更新
   - `bpmn:create` に `bpmnDiagramTableId` パラメータ追加

7. **electron/services/ManualGenerator.ts** - マニュアル生成サービス更新
   - `GenerateOptions` に `manualTableId` 追加

### フロントエンド

#### 型定義

1. **src/types/project.types.ts** - 型定義
   - `ProcessTable` インターフェース
   - `BpmnDiagramTable` インターフェース
   - `ManualTable` インターフェース
   - 各子エンティティに対応するIDフィールド追加

2. **src/types/electron.d.ts** - Electron API型定義
   - `processTable` API定義
   - `bpmnDiagramTable` API定義
   - `manualTable` API定義
   - DTO型更新（processTableId, bpmnDiagramTableId, manualTableId）

#### コンポーネント

3. **src/components/processTable/ProcessTableList.tsx** - 工程表一覧UI
   - レベル別グループ表示
   - カード形式の一覧
   - 作成・編集・削除機能

4. **src/components/bpmn/BpmnDiagramTableList.tsx** - フロー図グループ一覧UI✨
   - レベル別グループ表示
   - カード形式の一覧
   - 作成・編集・削除機能

5. **src/components/manual/ManualTableList.tsx** - マニュアルグループ一覧UI✨
   - レベル別グループ表示
   - カード形式の一覧
   - 作成・編集・削除機能

#### ページ

6. **src/app/projects/[id]/bpmn/page.tsx** - フロー図管理ページ ✅ **完成**
   - **完全実装済み** - グループベース管理への完全移行完了
   - 主な機能:
     * BpmnDiagramTableListコンポーネント統合
     * グループ一覧表示（レベル別）
     * モーダルフォームによるCRUD操作
       - グループ名入力
       - 説明入力（Textarea）
       - レベル選択（大工程/中工程/小工程/詳細）
       - 関連工程表選択（任意）
     * グループクリックで詳細ページへ遷移
     * ToastContextによる成功/エラー通知
     * ローディング状態の表示
   - 技術詳細:
     * `ProcessLevel` 型を使用（'large' | 'medium' | 'small' | 'detail'）
     * HeroUI の Modal, Select, Input, Textarea コンポーネント
     * useDisclosure フックでモーダル制御
     * 非同期データ読み込みと状態管理

7. **src/app/projects/[id]/manuals/page.tsx** - マニュアル管理ページ（TODO）
   - ManualTableList統合予定
   - グループ作成・編集フォーム（BPMNページと同パターン）
   - 工程表との連携選択

#### 同期機能

8. **src/lib/document-sync.ts** - ドキュメント同期ユーティリティ✨
   - `autoSyncDocuments` 関数を更新
   - `processTableId`, `bpmnDiagramTableId`, `manualTableId` でフィルタリング
   - グループ単位での自動生成対応

## 🔍 実装詳細: BPMNページ

### ファイル構成

```
src/app/projects/[id]/bpmn/
└── page.tsx (260行) - フロー図グループ管理ページ
```

### コンポーネント構造

```typescript
BpmnPage
├── ヘッダー
│   ├── 戻るボタン (ArrowLeftIcon)
│   ├── タイトル「フロー図グループ管理」
│   └── 新規グループ作成ボタン (PlusIcon)
├── コンテンツエリア
│   ├── ローディング表示 (Card)
│   └── BpmnDiagramTableList
│       ├── レベル別グループ表示
│       ├── カード形式の一覧
│       └── 各グループのアクション
└── モーダルフォーム (Modal)
    ├── グループ名入力 (Input)
    ├── 説明入力 (Textarea)
    ├── レベル選択 (Select)
    └── 工程表選択 (Select)
```

### 状態管理

```typescript
// データ状態
const [bpmnDiagramTables, setBpmnDiagramTables] = useState<BpmnDiagramTable[]>([]);
const [processTables, setProcessTables] = useState<ProcessTable[]>([]);
const [loading, setLoading] = useState(true);
const [selectedTable, setSelectedTable] = useState<BpmnDiagramTable | null>(null);

// フォーム状態
const [formData, setFormData] = useState({
  name: '',
  description: '',
  level: 'large' as ProcessLevel,
  processTableId: '',
});

// モーダル状態
const { isOpen, onOpen, onClose, onOpenChange } = useDisclosure();
```

### 主要な関数

#### データ読み込み
```typescript
const loadData = async () => {
  const [tables, processes] = await Promise.all([
    window.electronAPI.bpmnDiagramTable.getByProject(projectId),
    window.electronAPI.processTable.getByProject(projectId),
  ]);
  setBpmnDiagramTables(tables);
  setProcessTables(processes);
};
```

#### グループ作成
```typescript
const handleCreateTable = (level?: ProcessLevel) => {
  setSelectedTable(null);
  setFormData({ name: '', description: '', level: level || 'large', processTableId: '' });
  onOpen();
};
```

#### グループ編集
```typescript
const handleEditTable = (table: BpmnDiagramTable) => {
  setSelectedTable(table);
  setFormData({
    name: table.name,
    description: table.description || '',
    level: table.level,
    processTableId: table.processTableId?.toString() || '',
  });
  onOpen();
};
```

#### フォーム送信
```typescript
const handleSubmit = async () => {
  const tableData = {
    name: formData.name,
    description: formData.description || null,
    level: formData.level,
    projectId,
    processTableId: formData.processTableId ? Number(formData.processTableId) : null,
  };
  
  if (selectedTable) {
    await window.electronAPI.bpmnDiagramTable.update({ ...tableData, id: selectedTable.id });
  } else {
    await window.electronAPI.bpmnDiagramTable.create(tableData);
  }
  
  await loadData();
  onClose();
};
```

### UI/UX の特徴

1. **レスポンシブデザイン**
   - コンテナ: `container mx-auto px-4 py-8`
   - フレックスレイアウトでヘッダー配置

2. **アクセシビリティ**
   - アイコンボタンに適切なサイズ指定
   - 必須フィールドに `isRequired` プロパティ
   - プレースホルダーで入力例を表示

3. **エラーハンドリング**
   - ToastContextによる通知
   - `showToast(type, message)` の統一されたインターフェース
   - try-catchによる例外処理

4. **ローディング状態**
   - データ読み込み中の表示
   - 非同期処理の適切な状態管理

### 型安全性

- `ProcessLevel` 型による厳密なレベル管理
- `BpmnDiagramTable` と `ProcessTable` の型定義活用
- TypeScriptの型推論とエラーチェック

### パフォーマンス最適化

- `Promise.all` による並列データ読み込み
- 必要最小限の再レンダリング
- useEffectの依存配列の適切な管理

## 🎯 次のステップ

### 1. マニュアルページの実装 🔥 **優先度：高**

BPMNページと同じパターンで実装:

```typescript
// src/app/projects/[id]/manuals/page.tsx

// 必要な変更点:
1. BpmnDiagramTable → ManualTable に型を変更
2. bpmnDiagramTable API → manualTable API に変更
3. BpmnDiagramTableList → ManualTableList に変更
4. 「フロー図グループ」→「マニュアルグループ」にテキスト変更

// 実装手順:
1. BPMNページのコードをコピー
2. 型とAPI呼び出しを一括置換
3. UIテキストを変更
4. エラーチェックとテスト
```

### 2. 工程表フォームの作成

```typescript
// ProcessTableForm.tsx
- 工程表名入力
- レベル選択
- 説明入力
- 親工程の選択（複数選択可能）
```

### 3. 工程表詳細ページ

```typescript
// [processTableId]/page.tsx
- 選択した工程表の工程一覧
- 工程の追加・編集・削除
- 並び替え
- フロー図・マニュアル生成
```

### 4. 階層ナビゲーション

```
プロジェクト
  └─ 大工程表一覧
       └─ [選択] 営業部門 大工程表
            ├─ 工程一覧（IntegratedProcessTable使用）
            ├─ フロー図生成
            └─ マニュアル生成
```

### 4. ドキュメント同期の更新

```typescript
// document-sync.ts
- autoSyncDocuments を工程表単位に変更
- processTableId を基準にBPMN・Manualを生成
```

## 🔧 使用方法（開発者向け）

### 工程表の作成

```typescript
const processTable = await window.electronAPI.processTable.create({
  projectId: 'project-123',
  name: '営業部門 大工程表',
  level: 'large',
  description: '営業部門の大まかな業務フロー',
});
```

### 工程の作成（工程表に紐付け）

```typescript
const process = await window.electronAPI.process.create({
  projectId: 'project-123',
  processTableId: processTable.id,  // 👈 工程表IDを指定
  name: '受注業務',
  level: 'large',
});
```

### 工程表一覧の取得

```typescript
const processTables = await window.electronAPI.processTable.getByProject('project-123');
```

## ⚠️ 注意事項

### 後方互換性

- `processTableId` はオプショナルフィールド
- 既存の工程データは `processTableId` が null
- 段階的に移行可能

### カスケード削除

- 工程表を削除すると、関連する以下も削除される:
  - 工程（processes）
  - BPMN図（bpmn_diagrams）
  - マニュアル（manuals）

### マイグレーション

既存データを新構造に移行する場合:

1. デフォルト工程表を各レベルごとに作成
2. 既存の工程を対応する工程表に紐付け
3. `processTableId` を更新

## 📊 データフロー

```
[ユーザー操作]
    ↓
[ProcessTableList] - 工程表一覧表示
    ↓
[工程表選択]
    ↓
[IntegratedProcessTable] - 工程の編集・並び替え
    ↓
[IPC: processTable/process APIs]
    ↓
[Database: process_tables, processes]
    ↓
[自動同期]
    ↓
[BPMN図・マニュアル生成]
```

## 🎨 UI設計

### ProcessTableList（工程表一覧）

- レベル別にカラム表示
- 各工程表をカード形式で表示
- 作成・編集・削除ボタン
- 工程表クリックで詳細ページへ遷移

### ProcessTableDetail（工程表詳細）

- 工程表情報表示
- IntegratedProcessTable で工程管理
- フロー図生成ボタン
- マニュアル生成ボタン
- Excel出力ボタン

## 📝 実装状況

### ✅ 完了

- [x] 型定義（ProcessTable, BpmnDiagramTable, ManualTable）
- [x] データベーススキーマ（3つの新テーブル + 子テーブル更新）
- [x] バックエンドAPI（18個のIPCハンドラー）
- [x] フロントエンドコンポーネント（3つのListコンポーネント）
- [x] 同期機能の更新（processTableId, bpmnDiagramTableId, manualTableId対応）
- [x] Electron API型定義（electron.d.ts）
- [x] **フロー図管理ページ（完全実装）** ✨
  - BpmnDiagramTableListコンポーネント統合
  - モーダルフォームによるグループ作成・編集
  - レベル選択（大工程・中工程・小工程・詳細）
  - 工程表との連携選択
  - グループ削除機能
  - ToastContextによる通知

### 🔄 進行中

- [ ] マニュアル管理ページ（ManualTableList統合）

### 📋 未実装（次のステップ）

#### フォームコンポーネント

- [ ] **ProcessTableForm.tsx** - 工程表作成・編集フォーム
- [x] ~~**BpmnDiagramTableForm.tsx**~~ - フロー図グループ作成・編集フォーム（BPMNページに組み込み済み） ✅
- [ ] **ManualTableForm.tsx** - マニュアルグループ作成・編集フォーム（マニュアルページに組み込み予定）

#### 詳細ページ

- [ ] **[processTableId]/page.tsx** - 工程表詳細ページ
  - IntegratedProcessTableで工程管理
  - フロー図・マニュアル生成ボタン
  
- [ ] **[bpmnDiagramTableId]/page.tsx** - フロー図グループ詳細ページ
  - BPMNエディタ統合
  - 個別フロー図管理
  
- [ ] **[manualTableId]/page.tsx** - マニュアルグループ詳細ページ
  - 個別マニュアル管理
  - 自動生成機能

#### その他

- [ ] 階層ナビゲーションUI
- [ ] Excel出力の工程表対応
- [ ] マイグレーションスクリプト（既存データ→新構造）
- [ ] テストケース作成

## 📊 アーキテクチャ概要

```
プロジェクト
 ├─ 工程表グループ（ProcessTable）
 │   └─ 工程（Process）
 ├─ フロー図グループ（BpmnDiagramTable）✨
 │   └─ フロー図（BpmnDiagram）
 └─ マニュアルグループ（ManualTable）✨
     └─ マニュアル（Manual）
```

各グループは：
- 独立して複数作成可能
- レベル別に分類（large/medium/small/detail）
- 工程表と連携可能（processTableId）
- displayOrderで並び替え可能

## 🔧 使用方法（開発者向け）

### フロー図グループの作成✨

```typescript
const bpmnDiagramTable = await window.electronAPI.bpmnDiagramTable.create({
  projectId: 'project-123',
  name: '営業部門 大工程フロー',
  level: 'large',
  description: '営業部門の業務フロー図',
  processTableId: 'process-table-456', // 任意：工程表と連携
});
```

### フロー図の作成（グループに紐付け）✨

```typescript
const bpmnDiagram = await window.electronAPI.bpmn.create({
  projectId: 'project-123',
  bpmnDiagramTableId: bpmnDiagramTable.id,  // 👈 フロー図グループIDを指定
  name: '受注プロセスフロー',
  xmlContent: '<?xml version="1.0"...', // BPMNのXML
});
```

### マニュアルグループの作成✨

```typescript
const manualTable = await window.electronAPI.manualTable.create({
  projectId: 'project-123',
  name: '営業部門 詳細手順書',
  level: 'detail',
  description: '詳細な作業手順',
  processTableId: 'process-table-456', // 任意：工程表と連携
});
```

### 同期機能の利用✨

```typescript
// 工程表単位でフロー図とマニュアルを自動生成
await autoSyncDocuments(projectId, 'process', {
  processTableId: 'process-table-456',
  bpmnDiagramTableId: 'bpmn-table-789',
  manualTableId: 'manual-table-012',
});
```

---

##  Phase 6 実装完了状況

###  完了した機能

#### 1. グループベース管理システム
-  ProcessTable（工程表グループ）の完全実装
-  BpmnDiagramTable（フロー図グループ）の完全実装
-  ManualTable（マニュアルグループ）の完全実装
-  階層レベル別（大中小詳細）管理

#### 2. UI/UXコンポーネント
-  ProcessTableList - 工程表グループ一覧表示
-  BpmnDiagramTableList - フロー図グループ一覧表示
-  ManualTableList - マニュアルグループ一覧表示
-  レベル別カラーコーディング
-  レスポンシブデザイン対応

#### 3. ページ実装
-  /projects/[id]/process-tables - 工程表グループ管理ページ
-  /projects/[id]/bpmn - フロー図グループ管理ページ（リニューアル）
-  /projects/[id]/manuals - マニュアルグループ管理ページ（リニューアル）
-  /projects/[id]/hierarchy - 階層管理ページに工程表グループへのリンク追加
-  /projects/[id]/trinity - 統合管理ダッシュボード（UI更新）
-  /projects/[id]/manuals/[manualId] - マニュアル詳細ページにグループ選択機能追加

#### 4. CRUD機能
-  グループの作成編集削除
-  グループ間の連携設定（processTableId）
-  表示順の管理
-  エラーハンドリングとバリデーション

#### 5. データベースAPI
-  3つの新テーブル（process_tables, bpmn_diagram_tables, manual_tables）
-  完全なCRUD API実装
-  外部キー制約とカスケード削除

###  現在の仕様（2025年10月18日時点）

#### グループ管理の特徴
1. **独立した管理**: 各グループは独立して作成管理
2. **階層別分類**: 4つの階層レベル（large, medium, small, detail）で整理
3. **柔軟な連携**: 工程表グループと他グループの任意連携
4. **一元管理**: Trinityダッシュボードで全体を俯瞰

#### UI/UXの統一パターン
- HeroUI（NextUI v2）ベースのモダンなデザイン
- グラデーションとシャドウによる視覚的階層
- レベル別カラー（青緑黄紫）
- レスポンシブ対応（モバイル～デスクトップ）
- ToastContextによる統一された通知システム

###  Phase 6 で実装されなかった機能

以下の機能は将来のPhaseで実装予定：

#### Phase 7以降
-  BPMN  工程表の自動同期機能
-  工程表  マニュアルの自動生成機能
-  リアルタイム同期とウォッチング
-  高度な検索フィルタリング
-  グループ間の依存関係可視化
-  AIベースのマニュアル生成

#### 理由
Phase 6の主眼は「グループベース管理の基盤構築」であり、以下を優先して実装しました：
1. データモデルの確立
2. CRUD操作の完全実装
3. UIコンポーネントの整備
4. ページ構造の整理

自動同期などの高度な機能は、この基盤の上に順次追加していきます。

###  ユーザー向け説明

**Phase 6（現状）の使い方:**
1. プロジェクトを作成
2. 階層管理で工程を追加
3. 「工程表グループ管理」で工程表をグループ化
4. 「BPMN」タブでフロー図グループを作成し、工程表グループと紐付け
5. 「マニュアル」タブでマニュアルグループを作成し、工程表グループと紐付け
6. Trinityダッシュボードで全体を確認

各グループは独立して管理できるため、部門別プロジェクトフェーズ別など、用途に応じて柔軟に整理できます。

---

##  参考情報

### 関連ドキュメント
- docs/API_GUIDE.md - API仕様書
- docs/DATABASE_SCHEMA.md - データベース設計書
- README.md - プロジェクト概要

### 実装例
- src/app/projects/[id]/bpmn/page.tsx - フロー図グループ管理の完全実装
- src/components/bpmn/BpmnDiagramTableList.tsx - リスト表示コンポーネント

### 型定義
- src/types/project.types.ts - ProcessTable, BpmnDiagramTable, ManualTable
- src/types/electron.d.ts - IPC API定義

---

## 📝 変更履歴（2025-10-18）

以下の重要な変更がリポジトリに追加されました。開発者/運用担当者は注意してください。

- 設定UIの追加
  - `src/app/settings/page.tsx` に設定ページを追加しました。ユーザーは以下を設定できます:
    - 同期設定（自動同期、方向別トグル、競合解決方法）
    - 工程レベル定義（名前、カラー、有効/無効）
    - 表示設定（テーマ: light/dark/system、デフォルトビュー、ページサイズ、アニメーション、コンパクトモード）
    - エクスポート設定（デフォルトフォーマット、ファイル名テンプレート、日付フォーマット、メタデータ含める）
    - バックアップ設定（自動バックアップトグル、間隔、保持数、保存先）
  - テーマ切替（ライト/ダーク/システム）は視覚的なセレクタとして実装され、変更は即時反映されます。

- グローバル設定プロバイダー
  - `src/contexts/SettingsContext.tsx` を追加し、`useSettings()` フックで全体設定へアクセスできるようにしました。
  - `src/app/layout.tsx` に `SettingsProvider` を追加し、アプリ全体で設定を利用可能にしました。

- データベース初期化の堅牢化とマイグレーション
  - `electron/utils/database.js` のDDL実行を `execSafe` ラッパーで保護し、古いスキーマで存在しないオプション列やインデックスの作成に失敗しても起動が継続するようにしました。
  - 新しいマイグレーション `004_ensure_process_table_id` を追加しました。`processes` テーブルに `process_table_id` カラムが無い場合に追加し、インデックス `idx_processes_process_table_id` を作成します（既存DBのアップグレード互換性向上）。

注意事項:
- `execSafe` は防御的な措置であり、DDLエラーをログに残して処理を継続します。重大なスキーマ不整合がある場合は手動での調査が必要です。
- マイグレーション `004_ensure_process_table_id` は非破壊的に実行されますが、念のためリリース前にバックアップを推奨します。

運用上の提案:
- リリース済みパッケージのアップグレード時は、インストーラーまたはアップグレード手順でこのマイグレーションを確実に適用することを推奨します。

