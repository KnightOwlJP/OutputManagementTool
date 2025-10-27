# Phase 9: フラット構造への大規模リアーキテクト - 仕様書

**作成日**: 2025年10月21日  
**バージョン**: 9.0.0  
**プロジェクト名**: Output Management Tool  
**Phase**: Phase 9 - 階層構造撤廃とBPMN完全統合

---

## 📋 目次

1. [変更概要](#変更概要)
2. [Phase 8からの主な変更点](#phase-8からの主な変更点)
3. [新データモデル](#新データモデル)
4. [機能仕様](#機能仕様)
5. [UI/UX要件](#uiux要件)
6. [技術仕様](#技術仕様)
7. [マイグレーション計画](#マイグレーション計画)

---

## 変更概要

### Phase 9の目的

Phase 8で実装した4段階固定階層を撤廃し、フラットな工程表構造に変更。BPMN 2.0の全情報を工程表に統合し、工程表・BPMN・マニュアルの完全な1対1対応を実現する。

### コア変更

| 項目 | Phase 8（旧） | Phase 9（新） |
|------|--------------|--------------|
| **階層構造** | 4段階固定階層（大→中→小→詳細） | フラット構造（階層なし） |
| **レベル** | 構造的制約あり | ラベルのみ（表示用） |
| **工程表の数** | プロジェクト内に暗黙的に1つ | 複数作成可能 |
| **工程表⇔BPMN** | 暗黙的な関連 | 明示的な1対1対応 |
| **工程表⇔マニュアル** | 任意の関連 | 明示的な1対1対応 |
| **BPMN情報** | 基本情報のみ | BPMN 2.0の全情報 |
| **スイムレーン** | なし | 工程表・BPMNで管理 |
| **ステップ** | なし | 時系列順序を管理 |
| **カスタム列** | 30列（レベル別） | 30列（工程表ごと） |

---

## Phase 8からの主な変更点

### 削除される機能

- ❌ 詳細表システム（`detailTableId`, `parentEntityId`）
- ❌ 階層ナビゲーション（パンくずリスト、上位工程に戻る）
- ❌ レベル別のカスタム列定義
- ❌ `createDetailTable`, `getDetailTable`, `getParentEntity` API
- ❌ ProcessTable, BpmnDiagramTable, ManualTableのグループテーブル

### 追加される機能

- ✅ 工程表の複数作成・管理
- ✅ 工程表とBPMNダイアグラムの明示的な1対1対応
- ✅ 工程表とマニュアルの明示的な1対1対応
- ✅ スイムレーン管理（名前・色・順序）
- ✅ ステップ管理（時系列の順序）
- ✅ BPMN 2.0の全項目を工程に保存
- ✅ `beforeProcessIds`による上流工程参照
- ✅ データオブジェクト管理（プロジェクト全体で共有）
- ✅ BPMN自動レイアウトアルゴリズム
- ✅ マニュアルのアウトライン自動生成
- ✅ Excel出力時の画像挿入欄

### 保持される機能

- ✅ 工程のCRUD操作
- ✅ BPMNエディタ（bpmn-js）統合
- ✅ 三位一体同期の概念（工程表⇔BPMN⇔マニュアル）
- ✅ バージョン管理
- ✅ Excel連携（インポート・エクスポート）
- ✅ カスタム列（30列、工程表ごとに定義）
- ✅ 検索・フィルタ機能

---

## 新データモデル

### 全体構成

```
Project（プロジェクト）
 │
 ├─ ProcessTable[] (工程表：複数作成可能)
 │   ├─ id: string
 │   ├─ name: string (例: "見積もり発行")
 │   ├─ level: 'large' | 'medium' | 'small' | 'detail' (ラベル)
 │   ├─ swimlanes: Swimlane[] (スイムレーン定義)
 │   ├─ steps: Step[] (ステップ定義)
 │   ├─ customColumns: CustomColumn[] (30列まで)
 │   └─ processes: Process[] (工程リスト)
 │
 ├─ BpmnDiagram[] (BPMNダイアグラム：工程表と1対1)
 │   ├─ processTableId: string (外部キー)
 │   └─ xmlContent: string (BPMN 2.0 XML)
 │
 ├─ Manual[] (マニュアル：工程表と1対1)
 │   ├─ processTableId: string (外部キー)
 │   ├─ sections: ManualSection[] (セクション)
 │   └─ imageSlots: ImageSlot[] (Excel出力用)
 │
 └─ DataObject[] (データオブジェクト：プロジェクト全体で共有)
     ├─ id: string
     ├─ name: string (例: "見積書")
     ├─ type: string (例: "Document")
     └─ description: string
```

### 詳細型定義

#### ProcessTable（工程表）

```typescript
interface ProcessTable {
  id: string;
  projectId: string;
  name: string;                    // 例: "見積もり発行"
  level: ProcessLevel;             // ラベル（必須、変更可能）
  description?: string;
  
  // スイムレーン定義（工程表作成時に定義、後から編集可能）
  swimlanes: Swimlane[];
  
  // ステップ定義（工程表ごとに管理）
  steps: Step[];
  
  // カスタム列定義（30列まで）
  customColumns: CustomColumn[];
  
  // メタデータ
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

type ProcessLevel = 'large' | 'medium' | 'small' | 'detail';

interface Swimlane {
  id: string;
  name: string;                    // 例: "営業部"
  color: string;                   // デフォルト値あり（#3B82F6等）
  order: number;                   // 表示順序
}

interface Step {
  id: string;
  name: string;                    // 例: "ステップ1", "初期段階"
  order: number;                   // 時系列順序
}

interface CustomColumn {
  id: string;
  name: string;
  type: 'TEXT' | 'NUMBER' | 'DATE' | 'SELECT' | 'CHECKBOX';
  options?: string[];              // SELECT型の場合の選択肢
  required: boolean;
  order: number;
}
```

#### Process（工程）

```typescript
interface Process {
  id: string;
  processTableId: string;          // 所属する工程表
  
  // 基本情報（必須）
  name: string;                    // タスク名
  swimlane: string;                // スイムレーン名（必須）
  step: number;                    // ステップ順序（必須）
  taskType: BpmnTaskType;          // タスクタイプ（必須、デフォルト値あり）
  
  // フロー制御（編集効率化）
  beforeProcessIds: string[];      // 前工程（ユーザー入力）
  nextProcessIds: string[];        // 次工程（自動計算）
  
  // BPMN詳細情報（任意）
  documentation?: string;          // 説明
  gatewayType?: GatewayType;       // ゲートウェイタイプ（デフォルト値あり）
  conditionalFlows?: ConditionalFlow[];  // 条件式
  
  // イベント情報（任意）
  eventType?: EventType;           // イベントタイプ（デフォルト値あり）
  intermediateEventType?: IntermediateEventType;
  eventDetails?: string;
  
  // データ連携（任意）
  inputDataObjects?: string[];     // インプット（DataObject IDの配列）
  outputDataObjects?: string[];    // アウトプット（DataObject IDの配列）
  
  // メッセージフロー（任意）
  messageFlows?: MessageFlow[];
  
  // アーティファクト（任意）
  artifacts?: Artifact[];
  
  // カスタム列の値
  customColumns?: Record<string, any>;
  
  // メタデータ
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

// BPMN型定義
type BpmnTaskType = 
  | 'userTask'        // デフォルト
  | 'serviceTask'
  | 'manualTask'
  | 'scriptTask'
  | 'businessRuleTask'
  | 'sendTask'
  | 'receiveTask';

type GatewayType = 
  | 'exclusive'       // デフォルト（排他）
  | 'parallel'        // 並列
  | 'inclusive';      // 包含

type EventType = 
  | 'start'           // デフォルト
  | 'end'
  | 'intermediate';

type IntermediateEventType =
  | 'timer'
  | 'message'
  | 'error'
  | 'signal'
  | 'conditional';

interface ConditionalFlow {
  targetProcessId: string;
  condition: string;           // 条件式（自由記述）
  description?: string;
}

interface MessageFlow {
  targetProcessId: string;
  messageContent: string;      // メッセージ内容（自由記述）
  description?: string;
}

interface Artifact {
  type: 'annotation' | 'group';
  content: string;             // 注釈内容
}
```

#### BpmnDiagram（BPMNダイアグラム）

```typescript
interface BpmnDiagram {
  id: string;
  projectId: string;
  processTableId: string;      // 工程表と1対1対応（外部キー、UNIQUE制約）
  
  name: string;                // 工程表名と同期
  level: ProcessLevel;         // 工程表のレベルと同期
  xmlContent: string;          // BPMN 2.0 XML
  version: number;
  
  // 自動レイアウト用のメタデータ
  layoutAlgorithm?: 'auto' | 'manual';
  layoutMetadata?: Record<string, any>;
  
  createdAt: Date;
  updatedAt: Date;
}
```

#### Manual（マニュアル）

```typescript
interface Manual {
  id: string;
  projectId: string;
  processTableId: string;      // 工程表と1対1対応（外部キー、UNIQUE制約）
  
  name: string;                // 工程表名と同期
  level: ProcessLevel;         // 工程表のレベルと同期
  content: string;             // Markdown形式
  version: number;
  
  // セクション構造（アウトライン自動生成）
  sections: ManualSection[];
  
  // Excel出力用の画像挿入欄
  imageSlots: ImageSlot[];
  
  createdAt: Date;
  updatedAt: Date;
}

interface ManualSection {
  id: string;
  manualId: string;
  processId: string;           // 工程と紐付け
  
  title: string;               // 工程名から自動生成
  content: string;             // 詳細手順（手動入力）
  order: number;
  
  // 詳細ステップ（ネストは浅い）
  detailSteps: DetailStep[];
  
  createdAt: Date;
  updatedAt: Date;
}

interface DetailStep {
  id: string;
  sectionId: string;
  title: string;
  content: string;
  order: number;
}

interface ImageSlot {
  id: string;
  sectionId: string;
  caption: string;
  imagePath?: string;          // 画像ファイルパス（オプション）
  order: number;
}
```

#### DataObject（データオブジェクト）

```typescript
interface DataObject {
  id: string;
  projectId: string;           // プロジェクト全体で共有
  
  name: string;                // 例: "見積書", "発注書"
  type: string;                // 例: "Document", "Data", "Message"
  description?: string;
  
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 機能仕様

### 1. 工程表管理

#### 1.1 工程表の新規作成

**画面フロー:**
1. プロジェクト詳細ページで「新規工程表作成」ボタンをクリック
2. モーダルダイアログ表示
   - 名前入力（必須）: 例「見積もり発行」
   - レベル選択（必須）: 大工程表/中工程表/小工程表/詳細工程表
   - スイムレーン定義（任意、後から編集可能）
     - 名前入力
     - 色選択（デフォルト値あり）
     - 追加・削除・並び替え
3. 「作成」ボタンクリック
4. 自動処理:
   - ProcessTable作成
   - BpmnDiagram作成（processTableIdで紐付け）
   - Manual作成（processTableIdで紐付け）

**API:**
```typescript
window.electronAPI.processTable.create({
  projectId: string,
  name: string,
  level: ProcessLevel,
  swimlanes: Array<{ name: string, color?: string }>,
  description?: string
}): Promise<{
  processTable: ProcessTable,
  bpmnDiagram: BpmnDiagram,
  manual: Manual
}>
```

#### 1.2 工程表の編集

**編集可能項目:**
- 名前
- レベル（変更可能）
- 説明
- スイムレーン（追加・削除・名前変更・色変更・並び替え）
- ステップ（追加・削除・名前変更・並び替え）
- カスタム列定義（30列まで）

**同期処理:**
- 名前変更 → BPMN、マニュアルの名前も自動更新
- レベル変更 → BPMN、マニュアルのレベルも自動更新
- スイムレーン変更 → BPMN XMLを再生成

#### 1.3 工程表の削除

**削除フロー:**
1. 確認ダイアログ表示
   - 「この工程表を削除すると、関連するBPMNダイアグラムとマニュアルも削除されます。」
2. ユーザー確認
3. 一括削除:
   - ProcessTable削除
   - BpmnDiagram削除（CASCADE）
   - Manual削除（CASCADE）
   - 関連するProcess削除（CASCADE）

### 2. 工程管理

#### 2.1 工程の新規作成

**工程表編集画面:**
1. 「新規工程追加」ボタンをクリック
2. 工程編集フォーム表示

**必須項目:**
- タスク名
- スイムレーン（選択）
- ステップ（選択）
- タスクタイプ（選択、デフォルト: userTask）

**任意項目（タブ切り替え）:**
- 基本情報タブ:
  - 説明（documentation）
  - 前工程（beforeProcessIds）選択
- フロー制御タブ:
  - ゲートウェイタイプ（デフォルト: exclusive）
  - 条件式（conditionalFlows）
- イベントタブ:
  - イベントタイプ（デフォルト: start）
  - 中間イベントタイプ
  - イベント詳細
- データタブ:
  - インプット（DataObject選択）
  - アウトプット（DataObject選択）
- メッセージタブ:
  - メッセージフロー（対象工程、内容）
- アーティファクトタブ:
  - 注釈
- カスタム列タブ:
  - 工程表で定義した30列の値入力

**自動処理:**
- `nextProcessIds`を`beforeProcessIds`から自動計算
- BPMNタスクをXMLに追加
- マニュアルセクションを自動生成（タイトルのみ）

**API:**
```typescript
window.electronAPI.process.create(data: CreateProcessDto): Promise<{
  process: Process,
  bpmnUpdated: boolean,
  manualUpdated: boolean
}>
```

#### 2.2 工程の編集

**編集フロー:**
- 全項目が編集可能
- `beforeProcessIds`変更 → `nextProcessIds`を自動再計算
- 変更内容をBPMN XMLに反映
- マニュアルセクションのタイトルを更新

#### 2.3 工程の削除

**削除フロー:**
1. 確認ダイアログ
2. 削除処理:
   - Process削除
   - 他の工程の`beforeProcessIds`、`nextProcessIds`から削除
   - BPMN XMLからタスク削除
   - マニュアルセクション削除

### 3. BPMNエディタ統合

#### 3.1 BPMNエディタでの編集

**編集可能操作:**
- タスクの配置（スイムレーン、位置）
- タスクの接続（シーケンスフロー）
- ゲートウェイの配置
- イベントの配置
- プロパティパネルでの編集

**自動同期:**
- BPMNで変更 → 工程表に反映
- タスク追加 → Process作成
- タスク削除 → Process削除
- タスク移動 → swimlane、step更新
- 接続変更 → nextProcessIds、beforeProcessIds更新

#### 3.2 自動レイアウトアルゴリズム

**アルゴリズム:**
1. スイムレーンとステップからグリッド配置を計算
2. 同じスイムレーン・ステップに複数工程がある場合:
   - サブグリッドに配置（垂直方向にオフセット）
   - 各工程の幅を計算して重ならないように配置
3. シーケンスフローを描画
   - 直線または曲線で接続
   - 交差を最小化するパス計算

**実装方針:**
- dagre.jsやelkjsなどのグラフレイアウトライブラリを検討
- bpmn-jsの自動レイアウト機能と統合

**配置例:**
```
ステップ1        ステップ2        ステップ3
┌──────────────┬──────────────┬──────────────┐
│営業部        │              │              │
│ [タスクA]    │ [タスクC]    │              │
│              │ [タスクD]    │              │ ← 同じ位置に2つ
├──────────────┼──────────────┼──────────────┤
│経理部        │              │              │
│              │ [タスクB]    │ [タスクE]    │
└──────────────┴──────────────┴──────────────┘
```

### 4. マニュアル管理

#### 4.1 アウトライン自動生成

**生成タイミング:**
- 工程表作成時: 空のマニュアル作成
- 工程追加時: セクション自動生成

**セクション構造:**
```markdown
# 見積もり発行マニュアル

## 1. タスクA（工程名から自動生成）
### 1.1 詳細手順（手動入力欄）
<!-- 画像挿入欄 -->

## 2. タスクB
### 2.1 詳細手順
<!-- 画像挿入欄 -->
```

**API:**
```typescript
window.electronAPI.manual.updateSection(
  sectionId: string,
  content: string
): Promise<ManualSection>
```

#### 4.2 Excel出力

**出力形式:**
- 各セクションを1ページに配置
- 工程名（見出し）
- 詳細手順（テキスト）
- 画像挿入欄（空白または画像）

**画像管理:**
```typescript
interface ImageSlot {
  id: string;
  sectionId: string;
  caption: string;
  imagePath?: string;
  order: number;
}

window.electronAPI.manual.addImage(
  sectionId: string,
  imagePath: string,
  caption: string
): Promise<ImageSlot>
```

### 5. データオブジェクト管理

#### 5.1 データオブジェクトの作成

**作成画面:**
- プロジェクト設定 → データオブジェクト管理
- 「新規作成」ボタン
- 名前、タイプ、説明を入力

**API:**
```typescript
window.electronAPI.dataObject.create({
  projectId: string,
  name: string,
  type: string,
  description?: string
}): Promise<DataObject>
```

#### 5.2 工程での利用

**選択UI:**
- 工程編集フォームの「データ」タブ
- インプット: DataObjectを複数選択
- アウトプット: DataObjectを複数選択

**BPMN表示:**
- DataObjectをBPMN図に表示
- DataAssociationで工程と接続

---

## UI/UX要件

### 1. プロジェクト詳細ページ

**レイアウト:**
```
┌─────────────────────────────────────────┐
│ プロジェクト: XXX                        │
├─────────────────────────────────────────┤
│ [新規工程表作成] [データオブジェクト管理] │
│                                         │
│ 工程表一覧:                              │
│ ┌───────────────────────────────┐      │
│ │ 見積もり発行（小工程表）        │      │
│ │ 作成日: 2025-10-21              │      │
│ │ 工程数: 10                      │      │
│ │ [開く] [編集] [削除]           │      │
│ └───────────────────────────────┘      │
│ ┌───────────────────────────────┐      │
│ │ 製造フロー（大工程表）          │      │
│ │ ...                             │      │
│ └───────────────────────────────┘      │
└─────────────────────────────────────────┘
```

### 2. 工程表編集ページ

**UI構成**: タブ切替形式（既存の設定UI（スイムレーン・ステップ・カスタム列）と統一）

**レイアウト:**
```
┌─────────────────────────────────────────────────────────────────┐
│ 見積もり発行（小工程表）                                          │
│ [戻る] [BPMN図を開く] [マニュアルを開く]                         │
├─────────────────────────────────────────────────────────────────┤
│  [工程一覧] [スイムレーン] [ステップ] [カスタム列]  ← タブ       │
└─────────────────────────────────────────────────────────────────┘

【工程一覧タブ】（初期表示、先頭タブ）

🔍 フィルタ: [全スイムレーン▼] [全ステップ▼] [全タスクタイプ▼] 
   [検索: ___________] 🔄更新 [➕ 新しい工程を追加]

┌───┬─────────┬────────┬────────┬──────────┬────────┬──────────┬────┐
│選択│工程名    │スイムレーン│ステップ│タスクタイプ│前工程  │カスタム列│操作│
├───┼─────────┼────────┼────────┼──────────┼────────┼──────────┼────┤
│☐ │見積作成  │営業部   │要件定義│👤UserTask│-       │担当:山田 │✏️📋🗑️│
│☐ │金額確認  │営業部   │要件定義│👤UserTask│見積作成│担当:佐藤 │✏️📋🗑️│
│☐ │承認処理  │経理部   │承認    │👤UserTask│金額確認│担当:鈴木 │✏️📋🗑️│
│☐ │発行      │営業部   │実行    │👤UserTask│承認処理│担当:田中 │✏️📋🗑️│
└───┴─────────┴────────┴────────┴──────────┴────────┴──────────┴────┘

[選択した工程を削除] [CSVエクスポート]

表示件数: 4件 / 全4件  [< 1 >]

---

【スイムレーンタブ】
（既存実装: SwimlaneManagement.tsx）
- スイムレーン一覧（ドラッグ＆ドロップで並び替え）
- 追加・編集・削除機能
- カラーピッカー

【ステップタブ】
（既存実装: StepManagement.tsx）
- ステップ一覧（ドラッグ＆ドロップで並び替え）
- 追加・編集・削除機能
- 順序自動管理

【カスタム列タブ】
（既存実装: CustomColumnManagement.tsx）
- カスタム列定義一覧
- 5つの型対応（TEXT/NUMBER/DATE/SELECT/CHECKBOX）
- 追加・編集・削除機能
```

**工程一覧テーブルの機能:**
- ✅ ソート（各列クリックで昇順・降順切替）
- ✅ フィルタリング（スイムレーン・ステップ・タスクタイプ）
- ✅ 検索（工程名での絞り込み）
- ✅ 複数選択（チェックボックス）
- ✅ 一括削除
- ✅ ページネーション（大量データ対応）
- ✅ インライン編集（セルクリックで直接編集、検討中）
- ✅ CSVエクスポート
- ✅ 行ドラッグ＆ドロップ（並び替え）

### 3. 工程編集フォーム

**タブ構成:**
```
┌─────────────────────────────────────────┐
│ 工程編集                                 │
├─────────────────────────────────────────┤
│ [基本情報] [フロー] [イベント] [データ]  │
│ [メッセージ] [アーティファクト] [カスタム]│
├─────────────────────────────────────────┤
│ 基本情報タブ:                            │
│ タスク名: [____________] ※必須           │
│ スイムレーン: [営業部 ▼] ※必須          │
│ ステップ: [1 ▼] ※必須                   │
│ タスクタイプ: [User Task ▼]             │
│ 説明: [________________________]        │
│ 前工程: [☐ 工程A] [☐ 工程B]            │
├─────────────────────────────────────────┤
│ [キャンセル] [保存]                      │
└─────────────────────────────────────────┘
```

### 4. BPMNエディタ統合

**表示:**
- 既存のbpmn-jsエディタを使用
- 左パレット: BPMN要素
- 右プロパティパネル: 工程表のデータと連動
- 自動レイアウトボタン

### 5. マニュアルエディタ

**表示:**
```
┌─────────────────────────────────────────┐
│ マニュアル: 見積もり発行                 │
├─────────────────────────────────────────┤
│ [Excel出力] [プレビュー]                 │
├─────────────────────────────────────────┤
│ セクション一覧:                          │
│ ┌───────────────────────────────┐      │
│ │ 1. 見積作成 (工程名から自動生成)│      │
│ │ 詳細手順:                        │      │
│ │ [_______________________]       │      │
│ │ 画像: [画像を追加]              │      │
│ └───────────────────────────────┘      │
│ ┌───────────────────────────────┐      │
│ │ 2. 承認                         │      │
│ │ ...                             │      │
│ └───────────────────────────────┘      │
└─────────────────────────────────────────┘
```

---

## 技術仕様

### 1. データベーススキーマ

**全テーブルをDROP & CREATE:**

```sql
-- 既存テーブルを全て削除
DROP TABLE IF EXISTS manual_sections;
DROP TABLE IF EXISTS manuals;
DROP TABLE IF EXISTS bpmn_diagrams;
DROP TABLE IF EXISTS processes;
DROP TABLE IF EXISTS process_table_swimlanes;
DROP TABLE IF EXISTS process_table_steps;
DROP TABLE IF EXISTS process_table_custom_columns;
DROP TABLE IF EXISTS process_tables;
DROP TABLE IF EXISTS data_objects;
DROP TABLE IF EXISTS versions;
DROP TABLE IF EXISTS projects;

-- 新規テーブル作成
CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  metadata TEXT
);

CREATE TABLE process_tables (
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

CREATE TABLE process_table_swimlanes (
  id TEXT PRIMARY KEY,
  process_table_id TEXT NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3B82F6',
  order_num INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (process_table_id) REFERENCES process_tables(id) ON DELETE CASCADE
);

CREATE TABLE process_table_steps (
  id TEXT PRIMARY KEY,
  process_table_id TEXT NOT NULL,
  name TEXT NOT NULL,
  order_num INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (process_table_id) REFERENCES process_tables(id) ON DELETE CASCADE
);

CREATE TABLE process_table_custom_columns (
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

CREATE TABLE processes (
  id TEXT PRIMARY KEY,
  process_table_id TEXT NOT NULL,
  name TEXT NOT NULL,
  swimlane TEXT NOT NULL,
  step_order INTEGER NOT NULL,
  task_type TEXT NOT NULL DEFAULT 'userTask',
  
  -- フロー制御
  before_process_ids TEXT,  -- JSON配列
  next_process_ids TEXT,    -- JSON配列（自動計算）
  
  -- BPMN詳細
  documentation TEXT,
  gateway_type TEXT,
  conditional_flows TEXT,   -- JSON配列
  
  -- イベント
  event_type TEXT,
  intermediate_event_type TEXT,
  event_details TEXT,
  
  -- データ
  input_data_objects TEXT,  -- JSON配列
  output_data_objects TEXT, -- JSON配列
  
  -- メッセージ・アーティファクト
  message_flows TEXT,       -- JSON配列
  artifacts TEXT,           -- JSON配列
  
  -- カスタム列
  custom_columns TEXT,      -- JSON
  
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (process_table_id) REFERENCES process_tables(id) ON DELETE CASCADE
);

CREATE TABLE bpmn_diagrams (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  process_table_id TEXT NOT NULL UNIQUE,  -- 1対1対応
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

CREATE TABLE manuals (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  process_table_id TEXT NOT NULL UNIQUE,  -- 1対1対応
  name TEXT NOT NULL,
  level TEXT NOT NULL,
  content TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (process_table_id) REFERENCES process_tables(id) ON DELETE CASCADE
);

CREATE TABLE manual_sections (
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

CREATE TABLE manual_detail_steps (
  id TEXT PRIMARY KEY,
  section_id TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  order_num INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (section_id) REFERENCES manual_sections(id) ON DELETE CASCADE
);

CREATE TABLE manual_image_slots (
  id TEXT PRIMARY KEY,
  section_id TEXT NOT NULL,
  caption TEXT NOT NULL,
  image_path TEXT,
  order_num INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (section_id) REFERENCES manual_sections(id) ON DELETE CASCADE
);

CREATE TABLE data_objects (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  description TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE versions (
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

-- インデックス作成
CREATE INDEX idx_process_tables_project_id ON process_tables(project_id);
CREATE INDEX idx_swimlanes_table_id ON process_table_swimlanes(process_table_id);
CREATE INDEX idx_steps_table_id ON process_table_steps(process_table_id);
CREATE INDEX idx_custom_columns_table_id ON process_table_custom_columns(process_table_id);
CREATE INDEX idx_processes_table_id ON processes(process_table_id);
CREATE INDEX idx_bpmn_diagrams_table_id ON bpmn_diagrams(process_table_id);
CREATE INDEX idx_manuals_table_id ON manuals(process_table_id);
CREATE INDEX idx_manual_sections_manual_id ON manual_sections(manual_id);
CREATE INDEX idx_manual_sections_process_id ON manual_sections(process_id);
CREATE INDEX idx_detail_steps_section_id ON manual_detail_steps(section_id);
CREATE INDEX idx_image_slots_section_id ON manual_image_slots(section_id);
CREATE INDEX idx_data_objects_project_id ON data_objects(project_id);
```

### 2. API設計

**IPC通信（Electron）:**

```typescript
// ProcessTable API
interface ProcessTableAPI {
  create(data: CreateProcessTableDto): Promise<CreateProcessTableResult>;
  update(id: string, data: UpdateProcessTableDto): Promise<ProcessTable>;
  delete(id: string): Promise<boolean>;
  getById(id: string): Promise<ProcessTable>;
  getByProject(projectId: string): Promise<ProcessTable[]>;
  
  // スイムレーン管理
  addSwimlane(tableId: string, data: AddSwimlaneDto): Promise<Swimlane>;
  updateSwimlane(id: string, data: UpdateSwimlaneDto): Promise<Swimlane>;
  deleteSwimlane(id: string): Promise<boolean>;
  
  // ステップ管理
  addStep(tableId: string, data: AddStepDto): Promise<Step>;
  updateStep(id: string, data: UpdateStepDto): Promise<Step>;
  deleteStep(id: string): Promise<boolean>;
  
  // カスタム列管理
  addCustomColumn(tableId: string, data: AddCustomColumnDto): Promise<CustomColumn>;
  updateCustomColumn(id: string, data: UpdateCustomColumnDto): Promise<CustomColumn>;
  deleteCustomColumn(id: string): Promise<boolean>;
}

// Process API
interface ProcessAPI {
  create(data: CreateProcessDto): Promise<CreateProcessResult>;
  update(id: string, data: UpdateProcessDto): Promise<UpdateProcessResult>;
  delete(id: string): Promise<DeleteProcessResult>;
  getById(id: string): Promise<Process>;
  getByProcessTable(tableId: string): Promise<Process[]>;
  
  // nextProcessIds自動計算
  calculateNextProcessIds(processId: string): Promise<string[]>;
}

// DataObject API
interface DataObjectAPI {
  create(data: CreateDataObjectDto): Promise<DataObject>;
  update(id: string, data: UpdateDataObjectDto): Promise<DataObject>;
  delete(id: string): Promise<boolean>;
  getById(id: string): Promise<DataObject>;
  getByProject(projectId: string): Promise<DataObject[]>;
}

// BPMN API（既存に追加）
interface BpmnAPI {
  // 自動レイアウト
  autoLayout(diagramId: string): Promise<BpmnDiagram>;
  
  // 双方向同期
  syncFromProcessTable(tableId: string): Promise<SyncResult>;
  syncToProcessTable(diagramId: string): Promise<SyncResult>;
}

// Manual API（既存に追加）
interface ManualAPI {
  // セクション管理
  updateSection(id: string, content: string): Promise<ManualSection>;
  addDetailStep(sectionId: string, data: AddDetailStepDto): Promise<DetailStep>;
  
  // 画像管理
  addImageSlot(sectionId: string, data: AddImageSlotDto): Promise<ImageSlot>;
  uploadImage(slotId: string, imagePath: string): Promise<ImageSlot>;
  
  // Excel出力
  exportToExcel(manualId: string, outputPath: string): Promise<boolean>;
}
```

### 3. インストール・アンインストール処理

**インストール時:**
```typescript
// electron/main.ts
app.on('ready', () => {
  const dbPath = path.join(app.getPath('userData'), 'database.db');
  
  if (!fs.existsSync(dbPath)) {
    // 新規DB作成
    initializeDatabase(dbPath);
  } else {
    // 既存DBのバージョンチェック
    const version = getDatabaseVersion(dbPath);
    if (version < CURRENT_VERSION) {
      // マイグレーション実行
      runMigrations(dbPath, version);
    }
  }
});
```

**アンインストール時:**
```javascript
// electron-builder.yml
nsis:
  oneClick: false
  allowToChangeInstallationDirectory: true
  deleteAppDataOnUninstall: true  // AppDataフォルダを削除
```

または、カスタムアンインストーラースクリプト:
```nsis
; installer.nsi
Function un.onUninstSuccess
  RMDir /r "$APPDATA\output-management-tool"
FunctionEnd
```

---

## マイグレーション計画

### フェーズ1: データベース再構築

**目標**: 新しいスキーマでデータベースを再構築

**タスク:**
1. Migration 007作成（全テーブルDROP & CREATE）
2. データベース初期化処理の更新
3. インストーラーでのDB作成処理
4. アンインストーラーでのDB削除処理

**期間**: 1日

### フェーズ2: バックエンドAPI実装

**目標**: 新しいデータモデルに対応するAPI実装

**タスク:**
1. ProcessTable IPC handlers
2. Process IPC handlers（BPMN項目追加）
3. DataObject IPC handlers
4. Swimlane, Step, CustomColumn管理
5. nextProcessIds自動計算ロジック
6. BPMN同期ロジック更新
7. Manual同期ロジック更新

**期間**: 3-4日

### フェーズ3: フロントエンド実装

**目標**: 新しいUIの実装

**タスク:**
1. プロジェクト詳細ページ更新
2. 工程表一覧表示
3. 工程表作成・編集フォーム
4. 工程編集フォーム（タブUI）
5. データオブジェクト管理画面
6. マニュアルエディタ更新

**期間**: 4-5日

### フェーズ4: BPMN統合

**目標**: BPMNエディタとの完全統合

**タスク:**
1. BPMN自動レイアウトアルゴリズム実装
2. スイムレーン表示
3. 双方向同期の改善
4. プロパティパネルの拡張

**期間**: 3-4日

### フェーズ5: テスト・調整

**目標**: 動作確認とバグ修正

**タスク:**
1. 単体テスト
2. 統合テスト
3. UI/UX調整
4. パフォーマンス最適化
5. ドキュメント更新

**期間**: 2-3日

---

## 合計期間: 13-17日（約2.5-3.5週間）

---

**作成日**: 2025年10月21日  
**バージョン**: 9.0.0  
**承認**: 要確認
