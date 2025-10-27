# Output Management Tool - システムアーキテクチャ仕様書

**バージョン**: 1.0.0  
**最終更新**: 2025年10月20日  
**Phase**: Phase 8完了（グループテーブル削除、4段階固定階層）

---

## 📖 目次

1. [概要](#概要)
2. [アーキテクチャ原則](#アーキテクチャ原則)
3. [システム構成](#システム構成)
4. [データモデル](#データモデル)
5. [階層構造システム（Phase 8）](#階層構造システムphase-8)
6. [三位一体同期システム（Phase 6）](#三位一体同期システムphase-6)
7. [技術スタック](#技術スタック)
8. [データベース設計](#データベース設計)
9. [API設計](#api設計)

---

## 概要

### プロジェクトの目的

工程表・BPMNフローチャート・マニュアルを三位一体で統合管理し、階層的な工程管理とバージョン管理を実現するデスクトップアプリケーション。

### コア価値

- **工程表 ⇔ BPMNフロー**: 1対1の完全同期
- **工程 ⇔ BPMNタスク**: 1対1の完全同期
- **工程表 → マニュアル**: 自動生成
- **三位一体管理**: 一箇所の変更が全体に波及し、常に整合性を保つ

---

## アーキテクチャ原則

### 1. 工程表とBPMNフローの1対1対応

```
工程表（Process Table） ⇔ BPMNフロー図（1対1）
工程（Process）       ⇔ BPMNタスク（1対1）
```

**ルール**:
- 1つの工程表に対して1つのBPMNフロー図が対応
- 1つの工程に対して1つのBPMNタスクが対応
- 完全同期：工程を編集するとBPMNが更新され、BPMNを編集すると工程が更新
- `processId` と `bpmnDiagramId` で相互参照

### 2. 4段階固定階層

```
Level 1: 大工程表（Large Process Table）
   ↓ 0または1つの下位工程表
Level 2: 中工程表（Medium Process Table）
   ↓ 0または1つの下位工程表
Level 3: 小工程表（Small Process Table）
   ↓ 0または1つの下位工程表
Level 4: 詳細工程表（Detail Process Table）
   ↓ これ以上分解不可（最大4階層）
```

**重要**:
- ❌ 「無制限ネスト階層」ではない
- ✅ 「4段階固定階層」が正しい
- 各工程は **0または1つ** の下位工程表を持つ（有限階層）

### 3. データの一貫性

- ACID特性を保証するSQLiteデータベース
- トランザクション管理による整合性保証
- 外部キー制約による参照整合性

### 4. 暗黙的グループ化（Phase 8）

従来の**3層アーキテクチャ**（エンティティ → グループテーブル → プロジェクト）を**2層アーキテクチャ**（エンティティ → プロジェクト）に簡素化。

**Phase 6まで**:
```
プロジェクト
 ├─ 工程表グループテーブル（ProcessTable）
 │   └─ 工程（Process）
 ├─ フロー図グループテーブル（BpmnDiagramTable）
 │   └─ BPMNダイアグラム（BpmnDiagram）
 └─ マニュアルグループテーブル（ManualTable）
     └─ マニュアル（Manual）
```

**Phase 8（現在）**:
```
プロジェクト
 ├─ 工程（Process）
 ├─ BPMNダイアグラム（BpmnDiagram）
 └─ マニュアル（Manual）
```

- グループテーブルを **削除**
- `parentEntityId` による **暗黙的なグループ化**
- 工程表 = 同じ `parentEntityId` を持つ工程の集合

---

## システム構成

### 全体アーキテクチャ

```
┌─────────────────────────────────────────────────────────┐
│              Electron (Main Process)                    │
│  - ウィンドウ管理                                        │
│  - ファイルシステムアクセス                               │
│  - IPC通信                                              │
│  - データベース操作（SQLite）                             │
└──────────────────┬──────────────────────────────────────┘
                   │ IPC
┌──────────────────┴──────────────────────────────────────┐
│              Next.js (Renderer Process)                 │
│  ┌─────────────────────────────────────────────────┐   │
│  │      React Components (NextUI v2.8)             │   │
│  └────────────────────┬────────────────────────────┘   │
│  ┌────────────────────┴────────────────────────────┐   │
│  │          State Management (Zustand)             │   │
│  └────────────────────┬────────────────────────────┘   │
│  ┌────────────────────┴────────────────────────────┐   │
│  │              Business Logic Layer               │   │
│  │  - Excel Handler (SheetJS)                      │   │
│  │  - BPMN Handler (bpmn-js)                       │   │
│  │  - Process Sync Engine (BPMN ⇔ 工程表)         │   │
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

### レイヤー責務

| レイヤー | 責務 | 技術 |
|---------|------|------|
| **Presentation Layer** | UIコンポーネント、ユーザー操作 | React, NextUI, Tailwind CSS |
| **State Management Layer** | 状態管理、データフロー | Zustand |
| **Business Logic Layer** | ビジネスロジック、データ変換 | TypeScript |
| **Data Access Layer** | データ永続化、ファイル操作 | better-sqlite3, fs/promises |
| **Desktop Layer** | デスクトップ機能、OS統合 | Electron |

---

## データモデル

### 核心エンティティ

#### Project（プロジェクト）

```typescript
interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

#### HierarchicalEntity（階層エンティティ基底型）

Phase 8で導入された基底インターフェース：

```typescript
interface HierarchicalEntity {
  id: string;
  projectId: string;
  name: string;
  level: ProcessLevel; // 'large' | 'medium' | 'small' | 'detail'
  
  // 同階層内の親子関係
  parentId?: string | null;
  
  // 詳細表システム（Phase 8）
  detailTableId?: string | null;      // この工程が持つ詳細表のルートID
  parentEntityId?: string | null;     // この工程が属する詳細表のルートID
  
  // 三位一体同期
  syncBpmn?: boolean;
  syncManual?: boolean;
  
  // メタデータ
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}
```

#### Process（工程）

```typescript
interface Process extends HierarchicalEntity {
  // BPMN連携（1対1対応）
  bpmnDiagramId?: string;           // 対応するBPMNダイアグラムのID
  bpmnElementId?: string;           // 対応するBPMNタスクのID
  
  // レベル固有フィールド
  departmentName?: string;          // large
  departmentCode?: string;          // large
  employeeName?: string;            // medium
  position?: string;                // medium
  formType?: string;                // small
  formNumber?: string;              // small
  requiredTime?: number;            // detail
  checkpoint?: string;              // detail
  
  // カスタム列
  customColumns?: Record<string, any>;
  
  // Manual連携
  hasManual?: boolean;
  manualId?: string;
  
  // その他
  department?: string;
  assignee?: string;
  documentType?: string;
  startDate?: Date;
  endDate?: Date;
  status?: string;
  description?: string;
}
```

#### BpmnDiagram（BPMNダイアグラム）

```typescript
interface BpmnDiagram extends HierarchicalEntity {
  // Process連携（1対1対応）
  processId?: string;               // 対応する工程のID
  
  // BPMN固有
  xmlContent: string;               // BPMN 2.0 XML
  version: number;
  filePath?: string;
  svgPreview?: string;              // プレビュー用SVG
}
```

#### Manual（マニュアル）

```typescript
interface Manual extends HierarchicalEntity {
  // Process連携
  processId?: string;               // 対応する工程のID
  
  // Manual固有
  content: string;                  // Markdown形式
  version: number;
  sections?: ManualSection[];
}

interface ManualSection {
  id: string;
  manualId: string;
  title: string;
  content: string;
  parentSectionId?: string;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 階層構造システム（Phase 8）

### 詳細表の概念

工程表は **暗黙的** に存在します：

```typescript
// 工程表 = 同じ parentEntityId を持つ工程の集合
type ProcessTable = {
  rootId: string;              // 詳細表のルートID（例: root_1729324800000_abc）
  level: ProcessLevel;         // large | medium | small | detail
  processes: Process[];        // この工程表に属する工程のリスト
  parentProcess?: Process;     // 親工程（存在する場合）
};
```

### 階層構造の例

```
大工程表: プロジェクトA
  ├─ 大工程1「設計」(detailTableId: root_abc)
  │   └─ 詳細表（中工程表 rootId: root_abc）
  │       ├─ 中工程1「要件定義」(parentEntityId: root_abc, detailTableId: root_def)
  │       │   └─ 詳細表（小工程表 rootId: root_def）
  │       │       ├─ 小工程1「ヒアリング」(parentEntityId: root_def, detailTableId: root_ghi)
  │       │       │   └─ 詳細表（詳細工程表 rootId: root_ghi）
  │       │       │       ├─ 詳細工程1「顧客訪問」(parentEntityId: root_ghi)
  │       │       │       └─ 詳細工程2「議事録作成」(parentEntityId: root_ghi)
  │       │       └─ 小工程2「要件書作成」(parentEntityId: root_def)
  │       └─ 中工程2「基本設計」(parentEntityId: root_abc)
  └─ 大工程2「開発」
```

### レベルマッピング（4段階固定）

詳細表作成時、親のレベルに応じて子のレベルが自動決定：

```typescript
const LEVEL_MAPPING = {
  large: 'medium',   // 大工程の詳細表 → 中工程表
  medium: 'small',   // 中工程の詳細表 → 小工程表
  small: 'detail',   // 小工程の詳細表 → 詳細工程表
  detail: null       // 詳細工程は詳細表を作成不可（最大4階層）
};
```

**重要**: 詳細工程（detail）は最下層のため、それ以上の詳細表は作成できません。

### データベーススキーマ（Migration 006）

```sql
-- 詳細表システム用カラム追加
ALTER TABLE processes ADD COLUMN detail_table_id TEXT;
ALTER TABLE processes ADD COLUMN parent_entity_id TEXT;

ALTER TABLE bpmn_diagrams ADD COLUMN detail_table_id TEXT;
ALTER TABLE bpmn_diagrams ADD COLUMN parent_entity_id TEXT;

ALTER TABLE manuals ADD COLUMN detail_table_id TEXT;
ALTER TABLE manuals ADD COLUMN parent_entity_id TEXT;

-- インデックス
CREATE INDEX idx_processes_detail_table_id ON processes(detail_table_id);
CREATE INDEX idx_processes_parent_entity_id ON processes(parent_entity_id);
CREATE INDEX idx_bpmn_diagrams_detail_table_id ON bpmn_diagrams(detail_table_id);
CREATE INDEX idx_bpmn_diagrams_parent_entity_id ON bpmn_diagrams(parent_entity_id);
CREATE INDEX idx_manuals_detail_table_id ON manuals(detail_table_id);
CREATE INDEX idx_manuals_parent_entity_id ON manuals(parent_entity_id);
```

---

## 三位一体同期システム（Phase 6）

### 概要

Process（工程）⇔ BpmnDiagram ⇔ Manual を自動連携する同期システム。

### 同期方向

| 同期方向 | 説明 | トリガー |
|---------|------|---------|
| **BPMN → Process** | BPMNタスクを工程に変換 | BPMNエディタでの編集 |
| **Process → BPMN** | 工程からBPMNを生成 | 工程表での編集 |
| **Process → Manual** | 工程からマニュアルを生成 | 工程表での編集 |
| **Full Sync** | 3つを一括同期 | 手動実行 |

### 同期のルール

1. **工程を追加** → 対応するBPMNタスクを自動生成
2. **工程を削除** → 対応するBPMNタスクを自動削除
3. **工程を更新** → 対応するBPMNタスクを自動更新
4. **BPMNタスクを追加** → 対応する工程を自動生成
5. **BPMNタスクを削除** → 対応する工程を自動削除
6. **BPMNタスクを更新** → 対応する工程を自動更新

### 同期アルゴリズム

#### BPMN → Process

```
1. BPMN XMLを解析
2. すべてのタスク要素を抽出
3. 既存の工程と bpmn_element_id でマッチング
4. 新規タスク → 新規工程作成
5. 削除されたタスク → 工程削除（オプション）
6. 更新されたタスク → 工程更新
```

#### Process → BPMN

```
1. 工程リストを取得
2. 各工程に対してBPMNタスクを生成
3. 工程の階層構造をBPMNシーケンスフローに変換
4. BPMN XMLを生成
5. 既存BPMNダイアグラムに反映
```

#### Process → Manual

```
1. 小工程・詳細工程を取得（level: small または detail）
2. 各工程をマニュアルセクションに変換
3. 階層構造を保持してMarkdown形式で出力
4. 図表・チェックリストを自動生成（オプション）
```

---

## 技術スタック

### フロントエンド

| カテゴリ | 技術 | バージョン | 用途 |
|---------|------|-----------|------|
| **フレームワーク** | Next.js | 14.2.18 | React SSG/SSR |
| **UI ライブラリ** | React | 18.3.1 | UI構築 |
| **UI コンポーネント** | NextUI | 2.8.5 | デザインシステム |
| **スタイリング** | Tailwind CSS | 3.4.15 | ユーティリティCSS |
| **アニメーション** | Framer Motion | 11.13.5 | アニメーション |
| **状態管理** | Zustand | 5.0.2 | グローバル状態 |
| **型チェック** | TypeScript | 5.7.2 | 型安全性 |

### バックエンド

| カテゴリ | 技術 | バージョン | 用途 |
|---------|------|-----------|------|
| **デスクトップ** | Electron | 33.2.0 | デスクトップアプリ |
| **データベース** | better-sqlite3 | 11.8.1 | SQLiteドライバ |
| **ファイル処理** | SheetJS (xlsx) | 0.18.5 | Excel読み書き |
| **BPMN** | bpmn-js | 17.12.0 | BPMNエディタ |

### 開発ツール

| カテゴリ | 技術 | バージョン | 用途 |
|---------|------|-----------|------|
| **ビルド** | electron-builder | 25.1.8 | アプリパッケージング |
| **リンター** | ESLint | 9.18.0 | コード品質 |
| **フォーマッター** | Prettier | （設定可能） | コードフォーマット |

---

## データベース設計

### ERD（Entity Relationship Diagram）

```
┌─────────────┐
│  projects   │
└──────┬──────┘
       │ 1
       │
       │ N
┌──────┴──────┐
│  processes  │←──┐
└──────┬──────┘   │ detail_table_id
       │          │
       │ 1:1      │
       │          │
┌──────┴──────────┐
│ bpmn_diagrams   │
└──────┬──────────┘
       │
       │ 1:N
       │
┌──────┴──────────┐
│ bpmn_elements   │
└─────────────────┘

       │
       │ 1:N
       │
┌──────┴──────┐
│   manuals   │
└──────┬──────┘
       │
       │ 1:N
       │
┌──────┴─────────────┐
│  manual_sections   │
└────────────────────┘
```

### 主要テーブル定義

#### projects

| カラム名 | 型 | 制約 | 説明 |
|---------|---|------|------|
| id | TEXT | PRIMARY KEY | プロジェクトID |
| name | TEXT | NOT NULL | プロジェクト名 |
| description | TEXT | | 説明 |
| created_at | INTEGER | NOT NULL | 作成日時（Unix timestamp） |
| updated_at | INTEGER | NOT NULL | 更新日時（Unix timestamp） |
| metadata | TEXT | | 追加メタデータ（JSON） |

#### processes

| カラム名 | 型 | 制約 | 説明 |
|---------|---|------|------|
| id | TEXT | PRIMARY KEY | 工程ID |
| project_id | TEXT | FK, NOT NULL | プロジェクトID |
| name | TEXT | NOT NULL | 工程名 |
| level | TEXT | CHECK | 'large', 'medium', 'small', 'detail' |
| parent_id | TEXT | FK | 同階層内の親工程ID |
| detail_table_id | TEXT | | 詳細表のルートID |
| parent_entity_id | TEXT | | 属する詳細表のルートID |
| bpmn_diagram_id | TEXT | FK | 対応するBPMNダイアグラムID |
| bpmn_element_id | TEXT | FK | 対応するBPMNタスクID |
| manual_id | TEXT | FK | 対応するマニュアルID |
| display_order | INTEGER | NOT NULL | 表示順序 |
| created_at | INTEGER | NOT NULL | 作成日時 |
| updated_at | INTEGER | NOT NULL | 更新日時 |
| metadata | TEXT | | 追加メタデータ（JSON） |

#### bpmn_diagrams

| カラム名 | 型 | 制約 | 説明 |
|---------|---|------|------|
| id | TEXT | PRIMARY KEY | BPMNダイアグラムID |
| project_id | TEXT | FK, NOT NULL | プロジェクトID |
| process_id | TEXT | FK | 対応する工程ID |
| name | TEXT | NOT NULL | ダイアグラム名 |
| xml_content | TEXT | NOT NULL | BPMN 2.0 XML |
| version | INTEGER | NOT NULL | バージョン番号 |
| file_path | TEXT | | ファイルパス |
| detail_table_id | TEXT | | 詳細表のルートID |
| parent_entity_id | TEXT | | 属する詳細表のルートID |
| created_at | INTEGER | NOT NULL | 作成日時 |
| updated_at | INTEGER | NOT NULL | 更新日時 |

#### manuals

| カラム名 | 型 | 制約 | 説明 |
|---------|---|------|------|
| id | TEXT | PRIMARY KEY | マニュアルID |
| project_id | TEXT | FK, NOT NULL | プロジェクトID |
| process_id | TEXT | FK | 対応する工程ID |
| name | TEXT | NOT NULL | マニュアル名 |
| content | TEXT | NOT NULL | Markdown形式の内容 |
| version | INTEGER | NOT NULL | バージョン番号 |
| detail_table_id | TEXT | | 詳細表のルートID |
| parent_entity_id | TEXT | | 属する詳細表のルートID |
| created_at | INTEGER | NOT NULL | 作成日時 |
| updated_at | INTEGER | NOT NULL | 更新日時 |

---

## API設計

### IPC通信（Electron）

#### Process API

```typescript
// 詳細表作成
window.electronAPI.process.createDetailTable({
  entityId: string,
  syncBpmn?: boolean,      // デフォルト: true
  syncManual?: boolean     // デフォルト: true
}): Promise<{ processDetailTable: { id: string } }>

// 詳細表取得
window.electronAPI.process.getDetailTable(
  entityId: string
): Promise<DetailTable<Process> | null>

// 親エンティティ取得
window.electronAPI.process.getParentEntity(
  rootId: string
): Promise<Process | null>

// 工程作成
window.electronAPI.process.create(
  data: CreateProcessDto
): Promise<Process>

// 工程更新
window.electronAPI.process.update(
  id: string,
  data: UpdateProcessDto
): Promise<Process>

// 工程削除
window.electronAPI.process.delete(
  id: string
): Promise<boolean>

// 工程一覧取得
window.electronAPI.process.getByProject(
  projectId: string
): Promise<Process[]>
```

#### BPMN API

```typescript
// BPMN作成
window.electronAPI.bpmn.create(
  data: CreateBpmnDto
): Promise<BpmnDiagram>

// BPMN更新
window.electronAPI.bpmn.update(
  id: string,
  data: UpdateBpmnDto
): Promise<BpmnDiagram>

// BPMN削除
window.electronAPI.bpmn.delete(
  id: string
): Promise<boolean>

// 詳細表作成
window.electronAPI.bpmn.createDetailTable({
  entityId: string,
  syncProcess?: boolean,
  syncManual?: boolean
}): Promise<{ bpmnDetailTable: { id: string } }>
```

#### Sync API

```typescript
// BPMN → Process 同期
window.electronAPI.sync.bpmnToProcesses(
  projectId: string,
  bpmnXml: string,
  options?: SyncOptions
): Promise<SyncResult>

// Process → BPMN 同期
window.electronAPI.sync.processesToBpmn(
  projectId: string,
  bpmnId: string,
  options?: SyncOptions
): Promise<SyncResult>

// 双方向同期
window.electronAPI.sync.bidirectional(
  projectId: string,
  bpmnId: string,
  bpmnXml: string,
  options?: SyncOptions
): Promise<SyncResult>

interface SyncResult {
  created: number;
  updated: number;
  deleted: number;
  errors: string[];
}
```

---

## 付録

### ProcessLevel定義

```typescript
type ProcessLevel = 'large' | 'medium' | 'small' | 'detail';
```

### DetailTable型

```typescript
type DetailTable<T> = {
  root: T;                // ルートエンティティ
  entities: T[];          // 詳細表に属するすべてのエンティティ
  parentEntity: T | null; // 親エンティティ（さらに上位の階層）
};
```

### ルートID形式

```
root_${timestamp}_${random}

例: root_1729324800000_abc123
```

---

## 参照ドキュメント

- [要件定義書](./REQUIREMENTS.md)
- [開発ガイド](./DEVELOPMENT.md)
- [リファクタリングToDo](./REFACTORING_TODO.md)
- [ユーザーガイド](./USER_GUIDE.md)
