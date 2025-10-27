# Output Management Tool - 開発TODO

**作成日**: 2025年10月21日  
**最終更新**: 2025年10月23日  
**バージョン**: V2.0.0  
**Phase名**: フラット構造への大規模リアーキテクト  
**最新作業**: 工程管理画面のBPMN詳細UI実装完了確認

---

## 📊 全体進捗サマリー

| フェーズ | 進捗 | ステータス | 完了日 |
|---------|------|-----------|--------|
| **フェーズ0: 環境準備** | **8/8** | **✅ 完了** | 2025年10月13日 |
| **フェーズ1: データベース構築** | **14/14** | **✅ 完了** | 2025年10月21日 |
| **フェーズ2: バックエンドAPI実装** | **36/36** | **✅ 完了** | 2025年10月21日 |
| **フェーズ3: フロントエンド実装** | **24/28** | **🟡 進行中** | - |
| **フェーズ4: テスト・最適化** | **0/10** | **🔴 未着手** | - |
| **フェーズ5: リリース準備** | **0/8** | **🔴 未着手** | - |
| **合計** | **82/104** | **79%** | - |

---

## ✅ フェーズ0: 環境準備（8/8完了）

**完了日**: 2025年10月13日



### 実施内容| **ドキュメント整理** | **2/2** | **✅ 完了** || Phase 1: 基盤構築 | 12/12 | ✅ 完了 |



- [x] プロジェクト初期化（Next.js + Electron）| データベース再構築 | 0/2 | 🔴 未着手 || Phase 2: コア機能実装 | 15/15 | ✅ 完了 |

- [x] TypeScript設定

- [x] ESLint/Prettier設定| バックエンドAPI | 0/8 | 🔴 未着手 || Phase 3: 階層管理 | 10/10 | ✅ 完了 |

- [x] ディレクトリ構造作成

- [x] package.json依存関係設定| フロントエンドUI | 0/7 | 🔴 未着手 || Phase 4: バージョン管理・UI最適化 | 16/16 | ✅ 完了 |

- [x] 開発環境セットアップ

- [x] Git初期化| BPMN統合 | 0/3 | 🔴 未着手 || Phase 5: 最適化・テスト | 6/7 | 🟡 進行中 |

- [x] README作成

| マニュアル | 0/4 | 🔴 未着手 || Phase 6: 三位一体同期（構造） | 11/11 | ✅ 完了 |

### 成果物

| テスト・仕上げ | 0/5 | 🔴 未着手 || **Phase 7: 生成AI連携（詳細）** | **0/8** | **� 将来実装** |

- ✅ 完全な開発環境

- ✅ ビルドシステム構築完了| **合計** | **2/31** | **6%** || **Phase 8: 階層構造の簡素化** | **10/10** | **✅ 完了** |



---| **合計** | **88/97** | **91%** |



## ✅ フェーズ1: データベース構築（14/14完了）---



**完了日**: 2025年10月21日---



### V2アーキテクチャ特徴## 🎯 Phase 9: フラット構造への大規模リアーキテクト



- ❌ **削除**: 階層構造（parentId, level, 4段階固定階層）## 🎉 Phase 8: 階層構造の簡素化 ✅ 完了

- ✅ **採用**: フラット構造（工程表ベース）

- ✅ **統合**: BPMN 2.0全項目を工程テーブルに統合### Phase 9の目標

- ✅ **追加**: nextProcessIds自動計算

- ✅ **統合**: カスタム列をJSON形式で統合**完了日**: 2025年10月19日  



### 実装タスクPhase 8で実装した4段階固定階層を撤廃し、フラットな工程表構造に変更。BPMN 2.0の全情報を工程表に統合し、工程表・BPMN・マニュアルの完全な1対1対応を実現する。**成果**: 実務要件に基づく階層構造の抜本的な改善



#### 1. データベーススキーマ設計 ✅



- [x] 14テーブル設計完了### 主要変更点### 主要変更

  - projects

  - process_tables- ❌ **廃止**: ProcessTable, BpmnDiagramTable, ManualTable（グループテーブル）

  - swimlanes

  - steps| 項目 | Phase 8（旧） | Phase 9（新） |- ✅ **統合**: すべてのエンティティが階層構造を直接保持

  - custom_columns

  - processes|------|--------------|--------------|- 🎯 **実現**: 1エンティティ → 1詳細表の関係

  - bpmn_diagrams

  - manuals| 階層構造 | 4段階固定階層 | フラット構造（階層なし） |

  - manual_sections

  - manual_detail_steps| レベル | 構造的制約あり | ラベルのみ（表示用） |### 実装タスク（10/10完了）

  - manual_image_slots

  - data_objects| 工程表の数 | 暗黙的に1つ | 複数作成可能 |

  - versions

  - migration_history| 工程表⇔BPMN | 暗黙的な関連 | 明示的な1対1対応 |#### 1. ドキュメント作成 ✅



#### 2. マイグレーション実装 ✅| 工程表⇔マニュアル | 任意の関連 | 明示的な1対1対応 |- [x] 要件定義書（REQUIREMENTS_HIERARCHICAL_STRUCTURE.md → ARCHITECTURE.mdに統合）



- [x] v2_001_reset - 全テーブルDROP| BPMN情報 | 基本情報のみ | BPMN 2.0の全情報 |- [x] 技術仕様書（TECHNICAL_SPEC_HIERARCHICAL_STRUCTURE.md → ARCHITECTURE.mdに統合）

- [x] v2_002_initial_schema - 全テーブルCREATE

- [x] インデックス作成| スイムレーン | なし | 工程表・BPMNで管理 |- [x] 実装ガイド（PHASE8_IMPLEMENTATION_GUIDE.md）

- [x] マイグレーション履歴管理

| ステップ | なし | 時系列順序を管理 |- [x] テスト計画（PHASE8_TEST_PLAN.md）

#### 3. TypeScript型定義 ✅

| カスタム列 | 30列（レベル別） | 30列（工程表ごと） |- [x] 完了レポート（PHASE8_COMPLETION_REPORT.md）

- [x] `src/types/models.ts` (401行)

  - 11主要型定義

  - DTO型定義

  - Result型定義---#### 2. データベースマイグレーション ✅

  - BPMN型定義

- [x] Migration 006作成（006_hierarchical_refactoring.sql）

### 成果物

## ✅ フェーズ0: ドキュメント整理（2/2完了）

- ✅ `electron/utils/database.ts` (495行)

- ✅ `src/types/models.ts` (401行)- [x] detail_table_id, parent_entity_id カラム追加

- ✅ 検証レポート: `PHASE1_V2_DATABASE_VALIDATION.md`

- [x] インデックス作成

---

### 1. ドキュメント構造の整理 ✅- [x] マイグレーション登録（database.ts）

## ✅ フェーズ2: バックエンドAPI実装（36/36完了）

- [x] Phase 8のドキュメントをアーカイブに移動

**完了日**: 2025年10月21日

  - TODO.md → archive/TODO_PHASE8.md#### 3. 型定義更新 ✅

### 実装API統計

  - REFACTORING_TODO.md → archive/REFACTORING_TODO_PHASE8.md- [x] HierarchicalEntity 基底インターフェース追加

- **総API数**: 73個

- **V2新規API**: 49個  - SYSTEM_ARCHITECTURE.md → archive/SYSTEM_ARCHITECTURE_PHASE8.md- [x] DetailTable<T> ジェネリック型追加

- **ハンドラー数**: 36個

  - DOCUMENTATION_INDEX.md → archive/DOCUMENTATION_INDEX_OLD.md- [x] 非推奨フィールドマーク（後方互換性）

### 実装タスク

  - README.md → archive/README_OLD.md- [x] ユーティリティ関数追加

#### 1. IPC API定義 ✅



- [x] `electron/preload.ts` (228行)

  - ProcessTable API (20個)### 2. 新しいドキュメントの作成 ✅#### 4. Electron API実装 ✅

  - Process API (9個)

  - DataObject API (7個)- [x] docs/README.md（ドキュメントガイド）作成- [x] process:createDetailTable 実装

  - BPMN API (8個)

  - Manual API (12個)- [x] docs/PHASE9_SPECIFICATION.md（Phase 9仕様書）作成- [x] process:getDetailTable 実装

  - その他 (17個)

- [x] docs/requirements.md の Phase 9対応更新- [x] process:getParentEntity 実装

#### 2. ProcessTableハンドラー ✅

- [x] docs/TODO.md（このファイル）作成- [x] bpmn, manual 同様のハンドラー実装

- [x] `electron/ipc/processTable.handlers.ts` (774行)

  - 工程表CRUD (5個)- [x] 旧ハンドラーファイル削除

  - スイムレーン管理 (5個)

  - ステップ管理 (5個)---

  - カスタム列管理 (5個)

#### 5. API削除 ✅

#### 3. Processハンドラー ✅

## 🔴 フェーズ1: データベース再構築（0/2）

- [x] `electron/ipc/process.handlers.ts` (437行)

  - 工程CRUD (5個)- [x] processTable.handlers.ts 削除

  - nextProcessIds管理 (2個)

  - カスタム値管理 (2個)- [x] bpmnDiagramTable.handlers.ts 削除



#### 4. DataObjectハンドラー ✅### 3. データベーススキーマ設計の詳細化 🔴



- [x] `electron/ipc/dataObject.handlers.ts` (286行)- [x] manualTable.handlers.ts 削除

  - データオブジェクトCRUD (5個)

  - 工程関連付け (2個)**ファイル**: `electron/utils/database.ts`- [x] preload.ts から旧API削除



#### 5. メインファイル更新 ✅



- [x] `electron/main.ts` (199行)**タスク**:#### 6. 旧UI削除 ✅

- [x] ハンドラー登録

- [x] V2呼称統一- [ ] Migration 007作成（全テーブルDROP & CREATE）- [x] process-tables/ ディレクトリ削除



### 成果物- [ ] 新テーブル定義:



- ✅ 実装コード: 2,820行  - process_tables（工程表）#### 7. hierarchy/page.tsx 拡張 ✅

- ✅ コンパイルエラー: 0個

- ✅ 検証レポート: `PHASE2_V2_API_VALIDATION.md`  - process_table_swimlanes（スイムレーン）- [x] URLパラメータ処理（?detail=）



---

## 🟡 フェーズ3: フロントエンド実装（17/28進行中）

**推定工数**: 80時間  
**開始日**: 2025年10月21日  
**最終更新**: 2025年10月23日  
**現在ステータス**: マニュアル編集画面実装完了（実データ接続、セクションCRUD、スネークケース⇔キャメルケース変換）

### 3.1 プロジェクト管理画面（3/3完了） ✅

**最終更新**: 2025年10月23日

- [x] プロジェクト一覧画面（既存完成、V2対応確認済み）
- [x] プロジェクト作成ダイアログ（保存先パス選択機能追加完了）
  - [x] 保存先パス選択ボタン追加（file:selectDirectory IPC使用）
  - [x] デフォルトパス表示機能
  - [x] CreateProjectDto.storagePath型定義追加
- [x] プロジェクト詳細画面（ProcessTable統合完了、UI改善完了）
  - [x] プロジェクト概要カード追加（工程表・工程・マニュアル統計）
  - [x] 工程レベル別統計カード改善（5列レイアウト、合計表示）
  - [x] クイックアクションボタン配置最適化

### 3.2 工程表管理画面（5/5完了） ✅

**最終更新**: 2025年10月22日（Step廃止完了）

- [x] 工程表一覧画面（ProcessTableListV2完成）
- [x] 工程表作成・編集モーダル（ProcessTableFormModal完成）
- [x] 工程表詳細画面（タブ切り替え形式、統計情報表示）
- [x] データベースマイグレーション修正（swimlaneカラムエラー解決）
- [x] スイムレーン管理UI（追加・編集・削除・並び替え・ドラッグ＆ドロップ対応）
- [x] カスタム列管理UI（追加・編集・削除・5種類の型対応）
- [x] **廃止されたコードの削除**
  - [x] Step interface削除（processTable.handlers.ts）
  - [x] Step関連ハンドラー削除（createStep, getSteps, updateStep, deleteStep, reorderSteps）
  - [x] CreateProcessTableDto.steps フィールド削除
  - [x] CreateProcessTableResult.steps フィールド削除
  - [x] Step作成ロジック削除（processTable:create内）
  - [x] process_table_stepsテーブル参照削除（コメントのみ）
  - ⚠️ **注**: process_table_stepsテーブル自体はDBマイグレーションで別途削除予定

### 3.3 工程管理画面（13/13完了） ✅

**UI構成**: タブ切替形式（工程一覧 → スイムレーン → カスタム列）  
**表示形式**: テーブル形式（1行1工程、フィルタ・ソート機能付き）  
**最終更新**: 2025年10月23日（カスタム列入力UI実装完了）

- [x] 工程一覧テーブル表示（フィルタ・全件表示）
  - [x] スイムレーン列表示（laneId → 名前解決）
  - [x] BPMN要素タイプ列表示（task/event/gateway）
  - [x] タスクタイプ列表示（条件付き - タスクのみ）
  - [x] 前工程(beforeProcessIds)列表示
  - [x] 次工程(nextProcessIds)列表示
  - [x] 説明(documentation)列表示
  - [x] 行選択機能（チェックボックス）
- [x] フィルタ機能（スイムレーン・タスクタイプ）
- [x] 工程削除機能（単一・一括削除）
- [x] 工程作成ダイアログ（モーダル形式、4タブ構成）
  - [x] BPMN要素タイプ選択（task/event/gateway）
  - [x] タスクタイプ選択（タスク選択時のみ表示）
  - [x] スイムレーン選択（laneId による外部キー参照）
- [x] 工程編集ダイアログ（モーダル形式、工程作成と共通化）
- [x] BPMN詳細項目入力UI（完全実装済み）
  - [x] ゲートウェイ設定（gatewayType選択、3種類対応）
  - [x] イベント設定（eventType, intermediateEventType選択）
  - [x] イベント詳細（タイマー、メッセージ、エラー等の詳細情報）
  - [x] データオブジェクト関連付け（UI実装済み、将来機能）
  - [x] 条件付きフロー設定（conditionalFlows、動的追加・削除）
  - [x] メッセージフロー設定（messageFlows、動的追加・削除）
- [x] beforeProcessIds選択UI（チェックボックス形式、複数選択対応）
- [x] カスタム列値入力UI（型に応じた入力フォーム実装完了）
  - [x] CustomColumnInputコンポーネント作成（5種類対応）
  - [x] ProcessFormModalにカスタム項目タブ追加
- [ ] カスタム列値テーブル表示（HeroUI制限、将来実装）
- [ ] 工程並び替え機能（ドラッグ＆ドロップ）
- [ ] CSVエクスポート機能

### 3.4 BPMNビジュアルエディタ（5/5 ✅ Phase 1完了）

**調査完了**: 2025年10月23日  
**Phase 1実装完了**: 2025年10月23日  
**調査レポート**: `docs/BPMN_VISUAL_EDITOR_INVESTIGATION.md`  
**ライブラリ状況**: bpmn-js (^18.7.0) と elkjs (^0.11.0) 既にインストール済み  
**総工数見積もり**: 9-13日（Phase 1: 2-3日 ✅完了、Phase 2: 2-3日、Phase 3: 5-7日）

**実装推奨**:
- ✅ **Phase 1（基本表示）: 完了** - BpmnViewer + 自動レイアウト実装完了
- ⏳ Phase 2（高度なレイアウト）: Phase 10で実装
- ⏳ Phase 3（編集機能）: Phase 10で実装（既存工程管理UIで代替可能）

- [x] **Phase 1: BPMN基本表示機能（完了、2025年10月23日）**
  - [x] BpmnViewer.tsx コンポーネント作成（bpmn-js統合、ズーム・SVGエクスポート機能付き）
  - [x] processToBpmn.ts - Process → BPMN XML変換（ゲートウェイ、イベント、条件フロー対応）
  - [x] ELK自動レイアウト統合（calculateBpmnLayout関数）
  - [x] 工程管理画面にBPMNフロー図タブ追加（ClientPage.tsx）
  - [x] エラーハンドリング・ローディング状態実装（空データ時のプレースホルダー含む）
- [ ] Phase 2: 高度なレイアウトオプション（Phase 10推奨）
  - [ ] レイアウトアルゴリズム選択機能（layered/stress/mrtree）
  - [ ] スイムレーン表示対応
  - [ ] レイアウト設定の永続化
- [ ] Phase 3: BPMN編集機能（5-7日、Phase 10推奨）
  - [ ] BpmnModeler.tsx - 編集可能エディタ
  - [ ] BpmnToProcessConverter.ts - BPMN XML → Process逆変換
  - [ ] 双方向同期ロジック
  - [ ] ドラッグ&ドロップでのBPMN要素配置
  - [ ] 編集履歴管理

### 3.5 データオブジェクト管理（0/2）

**調査完了**: 2025年10月23日  
**バックエンド状況**: 完全実装済み（electron/ipc/dataObject.handlers.ts）  
**フロントエンド状況**: ProcessFormModalにプレースホルダーUI実装済み  
**実装優先度**: LOW（BPMN詳細機能の一部、現状でも工程作成可能）

**実装済みバックエンドAPI**:
- ✅ dataObject:create - データオブジェクト作成
- ✅ dataObject:getByProcessTable - 工程表内の全データオブジェクト取得
- ✅ dataObject:getById - ID指定で取得
- ✅ dataObject:update - データオブジェクト更新
- ✅ dataObject:delete - データオブジェクト削除

**判断**: 
- Process作成時にinputDataObjects/outputDataObjectsは既に保存可能
- データオブジェクトの一覧・編集UIは「あると便利」だが必須ではない
- Phase 10で実装、またはユーザー要望に応じて実装

- [ ] データオブジェクト一覧画面
- [ ] データオブジェクト作成・編集ダイアログ

### 3.6 マニュアル編集画面（14/14） ✅

**実装完了**: 2025年10月23日  
**バックエンドAPI**: 完全実装  
**フロントエンドUI**: 実データ接続完了

#### バックエンド実装（完了）
- [x] マニュアル更新API (`manual:update`)
- [x] マニュアル削除API (`manual:delete`)
- [x] マニュアル一覧API (`manual:list`)
- [x] セクション作成API (`manual:createSection`) - スネークケース→キャメルケース変換実装
- [x] セクション一覧取得API (`manual:getSections`) - スネークケース→キャメルケース変換実装
- [x] セクション更新API (`manual:updateSection`) - スネークケース→キャメルケース変換実装
- [x] セクション削除API (`manual:deleteSection`)
- [x] ステップ作成API (`manual:createStep`) - スネークケース→キャメルケース変換実装
- [x] ステップ一覧取得API (`manual:getSteps`) - スネークケース→キャメルケース変換実装
- [x] ステップ更新API (`manual:updateStep`) - スネークケース→キャメルケース変換実装
- [x] ステップ削除API (`manual:deleteStep`)

#### フロントエンド実装（完了）
- [x] マニュアルエディタページの実データ接続
- [x] セクション管理UI完成（追加・編集・削除）
- [x] 工程選択機能（セクション作成時）

#### 型定義・API登録（完了）
- [x] ManualSection型定義更新（orderNum, processId必須化）
- [x] ManualStep型定義追加
- [x] electron.d.ts API定義更新
- [x] preload.ts ステップAPI登録

**実装詳細**:
- データベースのスネークケース（manual_id, process_id, order_num）をJavaScriptのキャメルケース（manualId, processId, orderNum）に変換
- セクション一覧表示、選択、編集、削除機能
- Textarea での Markdown コンテンツ編集
- 工程との紐づけ（セクション作成時に必須）
- 実データベース連携で完全動作

**今後の拡張**:
- プレビュー機能（react-markdown導入）
- リッチテキストエディタ統合
- セクション並び替え（ドラッグ&ドロップ）
- ステップ管理UI（セクション内の詳細ステップ）

### 3.7 アプリケーション設定画面（8/8 ✅ 完全実装）

**実装完了**: 2025年10月23日（Phase 9対応完了）  
**バックアップ機能実装完了**: 2025年10月23日  
**同期設定実装完了**: 2025年10月23日  
**ELK設定実装完了**: 2025年10月23日  
**優先度**: HIGH（実用機能の実装が必要）  
**バックエンド**: SettingsContextで実装済み（LocalStorage保存）

#### 完了済み（全8タスク）
- [x] 設定ページUI実装（タブ切替形式）
- [x] Phase 9対応（工程レベル定義削除、BPMN設定追加）
- [x] BPMN設定タブ実装（デフォルト要素、エディタ設定、エクスポート設定）
- [x] UI設定タブ実装（テーマ、アニメーション、コンパクトモード）
- [x] エクスポート設定タブ実装（フォーマット、ファイル名テンプレート）
- [x] **バックアップ設定の実装** ✅
  - [x] バックアップハンドラー（backup.handlers.ts - 304行）
  - [x] バックアップAPI（6メソッド: create, list, restore, delete, cleanup, selectDirectory）
  - [x] 自動バックアップスケジューラー（backup.scheduler.ts - 130行）
  - [x] BackupManagerコンポーネント（バックアップ一覧、作成、復元、削除UI）
  - [x] スケジューラー状態表示（実行中ステータス表示）
  - [x] 型定義追加（electron.d.ts）
  - [x] Main/Preload統合完了
- [x] **同期設定の実装** ✅
  - [x] 同期スケジューラー（sync.scheduler.ts - 220行）
  - [x] 自動同期機能（バックグラウンド実行）
  - [x] 同期方向設定（BPMN→工程表、工程表→BPMN、工程表→マニュアル）
  - [x] 競合解決設定（手動/BPMN優先/工程表優先）
  - [x] スケジューラー状態表示
  - [x] 型定義追加（electron.d.ts）
  - [x] Main/Preload統合完了
- [x] **ELK自動レイアウト設定の統合** ✅
  - [x] レイアウトアルゴリズム選択（layered/stress/mrtree/force）
  - [x] ノード間スペース調整（20-200px）
  - [x] レイヤー間スペース調整（50-300px）
  - [x] エッジルーティング設定（orthogonal/polyline/splines）
  - [x] 設定の永続化（LocalStorage）
  - [x] 型定義追加（settings.types.ts）

**設定項目統計**:
| カテゴリ | 項目数 | 即座に有効 | 実装率 |
|---------|--------|-----------|-------|
| 同期設定 | 6 | ✅ | 100% |
| BPMN設定 | 11 | ✅ | 100% |
| UI設定 | 6 | ✅ | 100% |
| エクスポート | 4 | ✅ | 100% |
| バックアップ | 4 | ✅ | 100% |
| **合計** | **31** | **✅** | **100%** |

**バックアップ機能詳細**:
- **自動バックアップ**: 設定間隔（1-168時間）で自動実行、起動時にも1回実行
- **手動バックアップ**: BackupManagerから即座に作成可能
- **バックアップ管理**: 一覧表示、ファイルサイズ、作成日時、種類（自動/手動）
- **復元機能**: 緊急バックアップ作成後に復元（ロールバック可能）
- **自動クリーンアップ**: 最大保存数を超えた古いバックアップを自動削除
- **カスタムパス**: デフォルト（userData/data/backups）またはカスタムディレクトリ

**同期機能詳細**:
- **自動同期**: 設定間隔（1-60分）でバックグラウンド自動実行
- **三位一体同期**: BPMN ⇔ 工程表 ⇔ マニュアルの双方向同期（Phase 6完了）
- **同期方向制御**: 各方向を個別にON/OFF可能
- **競合解決**: 手動解決/BPMN優先/工程表優先から選択
- **スケジューラー**: プロジェクト単位で自動同期を実行
- **レンダラー通知**: 同期成功/エラーをUIに通知

**ELK自動レイアウト機能詳細**:
- **レイアウトアルゴリズム**: Layered（階層型）、Stress（応力型）、MrTree（ツリー型）、Force（力学型）
- **ノード間スペース**: 20-200px（デフォルト: 50px）
- **レイヤー間スペース**: 50-300px（デフォルト: 100px）
- **エッジルーティング**: Orthogonal（直交）、Polyline（折れ線）、Splines（曲線）
- **Eclipse Layout Kernel**: 業界標準の自動レイアウトエンジン統合
- **BPMN最適化**: 複雑なプロセスフローを自動的に最適配置

---

## 🔴 フェーズ4: テスト・最適化（0/10未着手）

**推定工数**: 40時間

- [ ] ManualSection型---

### 4.1 ユニットテスト（0/4）

- [ ] DetailStep型

- [ ] データベースハンドラーテスト

- [ ] ProcessTableハンドラーテスト- [ ] ImageSlot型## 📦 Phase 5: 最適化・テスト 🟡 6/7完了

- [ ] Processハンドラーテスト

- [ ] DataObjectハンドラーテスト- [ ] DataObject型



### 4.2 統合テスト（0/3）- [ ] BPMN列挙型（BpmnTaskType, GatewayType, EventType等）**進捗**: 86%



- [ ] IPC通信テスト

- [ ] CRUD操作テスト

- [ ] nextProcessIds自動計算テスト**優先度**: CRITICAL残りタスク:



### 4.3 パフォーマンス最適化（0/3）- [ ] 包括的なE2Eテスト実装



- [ ] データベースクエリ最適化**見積もり**: 0.5日

- [ ] インデックス最適化

- [ ] レンダリング最適化---



------



## 🔴 フェーズ5: リリース準備（0/8未着手）## ⚙️ Phase 0-4: 基盤機能 ✅ 完了



**推定工数**: 20時間## 🔴 フェーズ2: バックエンドAPI実装（0/8）



### 5.1 ドキュメント整備（0/4）- Phase 0: 環境準備 (8/8)



- [ ] ユーザーガイド更新### 5. IPC API定義の作成 🔴- Phase 1: 基盤構築 (12/12)

- [ ] 開発者ガイド更新

- [ ] API仕様書作成**ファイル**: `electron/preload.ts`- Phase 2: コア機能実装 (15/15)

- [ ] リリースノート作成

- Phase 3: 階層管理 (10/10)

### 5.2 ビルド・パッケージング（0/4）

**タスク**:- Phase 4: バージョン管理・UI最適化 (16/16)

- [ ] Windows向けビルド

- [ ] macOS向けビルド（オプション）- [ ] ProcessTableAPI定義

- [ ] インストーラー作成

- [ ] リリース版テスト- [ ] ProcessAPI拡張（BPMN項目）---



---- [ ] DataObjectAPI定義



## 📋 技術的負債・改善項目- [ ] BpmnAPI拡張（autoLayout）## 🔮 Phase 7: 生成AI連携（将来実装）



### 高優先度- [ ] ManualAPI拡張（画像管理）



1. **エラーハンドリングの強化****ステータス**: 計画段階（0/8）

   - データベースエラーの詳細なハンドリング

   - ユーザーフレンドリーなエラーメッセージ**優先度**: HIGH



2. **バリデーションの追加**計画タスク:

   - 入力値の厳密なバリデーション

   - データ整合性チェック**見積もり**: 0.5日- AI自動工程生成



3. **トランザクション管理**- AIマニュアル生成

   - 複雑な操作のトランザクション化

   - ロールバック機構の強化---- AI BPMN生成



### 中優先度- インテリジェント提案機能



4. **ログ機能の拡充**### 6. ProcessTable管理ロジック実装 🔴

   - 操作履歴の記録

   - デバッグログの充実**ファイル**: `electron/ipc/processTable.handlers.ts`（新規）---



5. **パフォーマンス監視**

   - クエリ実行時間の計測

   - ボトルネックの特定**タスク**:## 📝 優先度別タスク



### 低優先度- [ ] create（工程表作成、BPMN+Manual自動生成）



6. **コード整理**- [ ] update（名前・レベル・説明変更、同期）### 🔥 最高優先度（今すぐ）

   - リファクタリング

   - コメント充実化- [ ] delete（BPMN+Manual連鎖削除）なし - Phase 8完了



7. **国際化対応（i18n）**- [ ] getById

   - 多言語対応準備（将来実装）

- [ ] getByProject### 🚀 高優先度（次のスプリント）

---

- [ ] addSwimlane / updateSwimlane / deleteSwimlane- [ ] Phase 5: E2Eテスト実装

## 🔮 Phase 10: 高度な可視化・AI連携（将来実装）

**ステータス**: 計画段階（0/12）  
**優先度**: MEDIUM-LOW  
**実施タイミング**: Phase 9完了後、ユーザー要望に応じて

### 実装予定機能

#### 1. BPMN図形のExcel描画機能 ⏳
**見積もり**: 2-3日

**目的**: BPMNダイアグラムをExcelワークシート上に視覚的に描画

**技術要件**:
- ExcelJSライブラリの導入（現在xlsx使用）
- Excel Shape APIの活用
- ELKレイアウトアルゴリズムとの連携

**実装タスク**:
- [ ] ExcelJSライブラリの評価・導入
- [ ] BPMN図形の描画関数実装
  - [ ] Task図形（矩形）
  - [ ] Gateway図形（菱形）
  - [ ] Event図形（円形）
- [ ] 接続線（SequenceFlow）の描画
- [ ] 自動レイアウトロジック
- [ ] `generateBpmnExcelVisualization()`関数実装
- [ ] ImportExportPanelV2への統合

**備考**: 現在のXML/SVG出力で代替可能。ユーザー要望が強い場合に実装。

#### 2. AI自動工程生成 🤖
**見積もり**: 3-5日

#### 3. AIマニュアル生成 📝
**見積もり**: 2-3日

#### 4. インテリジェント提案機能 💡
**見積もり**: 2-3日

#### 5. 高度なレポート機能 📊
**見積もり**: 2-3日

**合計見積もり**: 11-17日

---

## 🎯 将来の拡張機能（検討中）

- [ ] addStep / updateStep / deleteStep- [ ] ドキュメント整理完了

### フェーズ6: 高度な機能（未計画）

- [ ] addCustomColumn / updateCustomColumn / deleteCustomColumn- [ ] Phase 9計画

1. **Excel連携強化**

   - インポート/エクスポート機能  - 詳細表遷移ボタン追加

   - テンプレート機能

**優先度**: CRITICAL  - 上位エンティティへ戻るボタン追加

2. **レポート機能**

   - 工程表レポート生成

   - 統計情報表示

**見積もり**: 2日### 🔧 中優先度（必要に応じて）

3. **協業機能**

   - 複数ユーザー対応- [ ] カスタム列の高度な機能追加

   - 変更履歴追跡

---- [ ] BPMN XMLパーサーの改善

4. **AI統合**

   - 工程表自動生成- [ ] パフォーマンス最適化

   - BPMN自動レイアウト

### 7. Process管理ロジック更新 🔴

---

**ファイル**: `electron/ipc/process.handlers.ts`### 📚 低優先度（時間があれば）

## 📊 進捗詳細

- [ ] ユーザーマニュアルの拡充

### 完了済み（58タスク）

**タスク**:- [ ] 動画チュートリアル作成

| カテゴリ | 完了数 |

|---------|--------|- [ ] BPMN項目の追加（taskType, gatewayType, eventType等）- [ ] 多言語対応

| フェーズ0: 環境準備 | 8 |

| フェーズ1: データベース構築 | 14 |- [ ] beforeProcessIds入力処理

| フェーズ2: バックエンドAPI実装 | 36 |

| **合計** | **58** |- [ ] nextProcessIds自動計算ロジック---



### 残タスク（43タスク）- [ ] create時のBPMN同期



| カテゴリ | 残数 |- [ ] update時のBPMN同期## 📌 メモ

|---------|------|

| フェーズ3: フロントエンド実装 | 25 |- [ ] delete時のBPMN同期、他工程のbeforeProcessIds/nextProcessIds更新

| フェーズ4: テスト・最適化 | 10 |

| フェーズ5: リリース準備 | 8 |### Phase 8成果物

| **合計** | **43** |

**優先度**: CRITICAL- 新規ファイル: 8ファイル

---

- 削除ファイル: 13ファイル

## 🗓️ マイルストーン

**見積もり**: 2日- 更新ファイル: 15ファイル

| マイルストーン | 目標日 | ステータス |

|---------------|--------|-----------|- 新規コード: ~800行

| フェーズ0完了 | 2025年10月13日 | ✅ 完了 |

| フェーズ1完了 | 2025年10月21日 | ✅ 完了 |---- ドキュメント: ~2,000行

| フェーズ2完了 | 2025年10月21日 | ✅ 完了 |

| フェーズ3完了 | 未定 | 🔴 未着手 |

| フェーズ4完了 | 未定 | 🔴 未着手 |

| フェーズ5完了 | 未定 | 🔴 未着手 |### 8. DataObject管理ロジック実装 🔴### 技術的負債

| **V2.0.0リリース** | **未定** | **🔴 未定** |

**ファイル**: `electron/ipc/dataObject.handlers.ts`（新規）- 非推奨フィールド（processTableId等）: Phase 9で削除予定

---

- E2Eテストカバレッジ: 現在0%、目標80%

## 📝 変更履歴

### 2025年10月23日

- ✅ **プロジェクト管理画面完了（3.1完了 3/3タスク）**
  - プロジェクト作成ダイアログ改善
    * 保存先パス選択機能追加（file:selectDirectory IPC使用）
    * FolderIconボタンでディレクトリ選択ダイアログ表示
    * デフォルトパスとカスタムパスの切り替え対応
    * CreateProjectDto.storagePath型定義追加
  - プロジェクト詳細ページUI改善
    * プロジェクト概要カード追加（3列統計: 工程表・工程・マニュアル）
    * 工程レベル別統計を5列レイアウトに変更（合計列追加）
    * カード配色・アイコン統一（視認性向上）
    * 設定ボタン追加（project-settings/へのリンク）
- ✅ **BPMNビジュアルエディタ Phase 1実装完了（3.4完了 5/5タスク）**
  - BpmnViewer.tsx コンポーネント作成（bpmn-js統合）
  - processToBpmn.ts - Process → BPMN XML変換ロジック
  - ELK自動レイアウト統合（calculateBpmnLayout関数）
  - 工程管理画面にBPMNフロー図タブ追加（4タブ構成）
  - ズーム機能（拡大・縮小・フィット）実装
  - SVGエクスポート機能実装
  - エラーハンドリング・ローディング状態実装
  - 空データ時のプレースホルダー表示
  - ゲートウェイ・中間イベント・条件付きフロー対応
- ✅ マニュアル編集画面実装完了（3.6完了 14/14タスク）
  - manual:update/delete/list API実装（TODOから実装へ）
  - セクションCRUD API実装（create/getSections/update/delete）
  - ステップCRUD API実装（create/getSteps/update/delete）
  - DBスネークケース→JSキャメルケース変換実装（manual_id→manualId等）
  - ManualSection型定義更新（orderNum, processId必須化）
  - ManualStep型定義追加
  - フロントエンド実データ接続完了（デモデータ削除）
  - セクション作成UI実装（工程選択機能付き）
  - セクション編集・削除UI実装
  - プレビュータブ削除（ManualPreview型不一致のため一時無効化）
- ✅ Step関連コード完全削除
  - Step interface削除（processTable.handlers.ts）
  - Step CRUDハンドラー削除（createStep, getSteps, updateStep, deleteStep, reorderSteps）
  - CreateProcessTableDto.steps フィールド削除
  - CreateProcessTableResult.steps フィールド削除
  - process_table_stepsテーブル参照削除
- ✅ BPMN詳細UI実装確認
  - ゲートウェイ設定UI（3種類: exclusive/parallel/inclusive）
  - イベント設定UI（start/end/intermediate + 5種類の中間イベント）
  - 条件付きフロー設定UI（動的追加・削除対応）
  - メッセージフロー設定UI（動的追加・削除対応）
  - beforeProcessIds選択UI（チェックボックス複数選択）
- ✅ カスタム列値入力UI実装完了
  - CustomColumnInputコンポーネント作成（TEXT/NUMBER/DATE/SELECT/CHECKBOX）
  - CustomColumnInputGroupコンポーネント作成
  - ProcessFormModalにカスタム項目タブ追加（4タブ構成）
  - customColumnValues状態管理実装
  - ProcessManagementからcustomColumns props渡し
- ✅ 工程管理画面（3.3）完全実装完了（13/13タスク）
- ✅ TODO.md進捗更新（フェーズ3: 24/28完了、全体79%）

### 2025年10月22日

- ✅ Pool削除・BPMN 2.0準拠構造への調整
- ✅ Excel V2実装完了（ProcessTable構造対応）

**タスク**:

### 2025年10月21日

- [ ] create### 今後の方向性

- ✅ フェーズ2完了（バックエンドAPI実装）

- ✅ V2呼称統一完了- [ ] update1. Phase 5完了（E2Eテスト）

- ✅ Process handlers V2版実装完了

- ✅ 不要ファイル削除完了- [ ] delete2. Phase 9計画（非推奨フィールド削除、パフォーマンス改善）

- ✅ ドキュメント再整理完了

- 📝 TODO.md完全書き換え- [ ] getById3. Phase 10検討（AI連携の具体化）



### 2025年10月21日（早朝）- [ ] getByProject



- ✅ フェーズ1完了（データベース構築）---

- ✅ V2アーキテクチャ移行完了

- ✅ 14テーブル実装完了**優先度**: MEDIUM




**タスク**:

- [ ] 工程一覧テーブル表示## 注意事項

- [ ] フィルタ（スイムレーン、ステップ）

- [ ] 新規工程ボタン### 実装方針

- [ ] BPMNエディタ・マニュアルへのリンク1. **段階的な実装**: 各機能を独立して実装し、段階的にリリース

- [ ] 工程表設定ボタン2. **後方互換性の維持**: 既存データへの影響を最小限に

3. **パフォーマンス重視**: 大量データでも快適に動作する設計

**優先度**: HIGH4. **ユーザビリティ**: 直感的で使いやすいUI/UX



**見積もり**: 1.5日### データ設計の考慮点

- カスタム列は EAV（Entity-Attribute-Value）パターンで実装

---- BPMN要素は JSON でプロパティを柔軟に保存

- 同期ステータスで整合性を常に監視

### 17. 工程編集フォームUI実装（タブUI） 🔴

**ファイル**: `src/components/ProcessEditForm.tsx`（新規）### 技術的制約

- SQLite のカラム数制限を考慮（EAV パターン採用）

**タスク**:- Electron のメモリ使用量に注意

- [ ] 基本情報タブ（名前、スイムレーン、ステップ、タスクタイプ、説明、前工程）- bpmn.js のバージョン互換性確保

- [ ] フロー制御タブ（ゲートウェイタイプ、条件式）
- [ ] イベントタブ（イベントタイプ、中間イベントタイプ、詳細）
- [ ] データタブ（インプット、アウトプット）
- [ ] メッセージタブ（メッセージフロー）
- [ ] アーティファクトタブ（注釈）
- [ ] カスタム列タブ（工程表定義の30列）
- [ ] バリデーション、デフォルト値

**優先度**: CRITICAL

**見積もり**: 2日

---

### 18. データオブジェクト管理UI実装 🔴
**ファイル**: `src/components/DataObjectManager.tsx`（新規）

**タスク**:
- [ ] データオブジェクト一覧表示
- [ ] 新規作成モーダル
- [ ] 編集・削除機能
- [ ] 使用箇所の表示

**優先度**: MEDIUM

**見積もり**: 1日

---

### 19. カスタム列UI実装 🔴
**ファイル**: `src/components/CustomColumnManager.tsx`（新規）

**タスク**:
- [ ] 工程表設定での30列定義
- [ ] 名前、型、必須/任意、SELECT選択肢の設定
- [ ] 追加・削除・並び替え
- [ ] 工程編集フォームでの値入力

**優先度**: MEDIUM

**見積もり**: 1日

---

### 20. 階層ナビゲーションの削除 🔴
**ファイル**: `src/app/projects/[id]/hierarchy/page.tsx`, 関連コンポーネント

**タスク**:
- [ ] 階層管理UIの削除またはリダイレクト処理
- [ ] パンくずリストコンポーネントの削除
- [ ] 上位工程に戻るナビゲーションの削除

**優先度**: MEDIUM

**見積もり**: 0.5日

---

## 🔴 フェーズ4: BPMN統合（0/3）

### 21. BPMN自動レイアウトアルゴリズム実装 🔴
**ファイル**: `electron/utils/bpmnLayout.ts`（新規）

**タスク**:
- [ ] スイムレーン・ステップからグリッド配置計算
- [ ] 同一位置の複数工程対応（サブグリッド）
- [ ] シーケンスフロー描画
- [ ] dagre.jsまたはelkjsの統合検討

**優先度**: HIGH

**見積もり**: 2日

---

### 22. BPMNエディタのスイムレーン表示 🔴
**ファイル**: `src/components/BpmnEditor.tsx`

**タスク**:
- [ ] bpmn-jsでスイムレーン（Lane）表示
- [ ] 工程表のスイムレーン定義と同期
- [ ] プロパティパネルの拡張
- [ ] 自動レイアウトボタン

**優先度**: HIGH

**見積もり**: 1.5日

---

### 23. BPMN双方向同期の改善 🔴
**ファイル**: `src/components/BpmnEditor.tsx`

**タスク**:
- [ ] BPMN編集→工程表反映の強化
- [ ] タスク追加→Process作成
- [ ] タスク削除→Process削除
- [ ] タスク移動→swimlane, step更新
- [ ] 接続変更→nextProcessIds, beforeProcessIds更新

**優先度**: CRITICAL

**見積もり**: 2日

---

## 🔴 フェーズ5: マニュアル（0/4）

### 24. マニュアルエディタUI更新 🔴
**ファイル**: `src/app/projects/[id]/tables/[tableId]/manual/page.tsx`

**タスク**:
- [ ] セクション一覧表示
- [ ] 詳細手順入力欄（Markdown）
- [ ] 画像追加ボタン
- [ ] Excel出力ボタン

**優先度**: HIGH

**見積もり**: 1日

---

### 25. マニュアルExcel出力機能 🔴
**ファイル**: `electron/utils/excelExport.ts`

**タスク**:
- [ ] Manual情報からExcel生成
- [ ] 各セクションを1ページに配置
- [ ] 画像挿入欄の用意
- [ ] ExcelJSライブラリの使用

**優先度**: MEDIUM

**見積もり**: 1.5日

---

### 25-1. Excel入出力機能の完全実装 ✅
**ファイル**: `src/lib/excel-*.ts`, `src/components/excel/ImportExportPanel*.tsx`, `src/app/projects/[id]/hierarchy/page.tsx`

**実施完了日**: 2025年10月23日

**完了状況**:
- ✅ テンプレート生成完了（V1: `generateProcessTemplateXLSX`, V2: `generateProcessTableTemplate`）
- ✅ 工程表エクスポート完了（V1: `generateProcessDataXLSX`, V2: `generateProcessTableExcel`）
- ✅ Excelパーサー完了（V1: `importProcessesFromExcel`, V2: `importProcessTableFromExcel`）
- ✅ ImportExportPanelコンポーネント完成（V1: 旧Process型用、V2: Phase 9対応）
- ✅ UI統合完了（`hierarchy/page.tsx`に`ImportExportPanel`を統合）
- ✅ ProcessTable構造への移行完了（V2実装）
- ⏳ BPMN図形のExcel描画機能 → **Phase 10以降に延期**

**実装内容**:

1. **Excelインポート機能のUI統合** ✅
   - ✅ `ImportExportPanel`を`hierarchy/page.tsx`に統合
   - ✅ 既存の`handleDownloadTemplate`/`handleDownloadXLSX`を置き換え
   - ✅ ファイルアップロード → パース → 工程作成フロー実装
   - ✅ エラーハンドリングとユーザーフィードバック

2. **ProcessTable構造への移行（V2実装）** ✅
   - ✅ `excel-generator-v2.ts`を新規作成（ProcessTable、Swimlane、CustomColumn、Process対応）
   - ✅ `excel-parser-v2.ts`を新規作成（4シート形式の完全パース）
   - ✅ `ImportExportPanelV2.tsx`を新規作成（Phase 9対応UI）
   - ✅ 複数シート形式: 工程表情報、レーン、カスタム列定義、工程データ
   - ✅ BPMN 2.0要素の完全サポート（task/event/gateway）

3. **BPMNフローのExcel描画機能** ⏳（将来実装）
   - 実施タイミング: **Phase 10以降**（優先度: LOW）
   - 理由: 
     * ExcelJSライブラリの追加導入が必要（現在xlsx使用）
     * BPMN図形の正確な描画とレイアウトは複雑な実装（2-3日の工数）
     * 現在のXML/SVG出力で代替可能
     * ユーザー要望に応じて実装判断
   - 実装時の検討事項:
     * ExcelJSライブラリ導入
     * BPMN図形（Task, Gateway, Event）のShape描画
     * ELKレイアウトアルゴリズムとの連携
     * 接続線（SequenceFlow）の描画
     * `generateBpmnExcelVisualization()`関数実装

**成果物**:
- `src/lib/excel-generator-v2.ts` (約500行)
- `src/lib/excel-parser-v2.ts` (約400行)
- `src/components/excel/ImportExportPanelV2.tsx` (約400行)
- 既存: `src/lib/excel-generator.ts`, `excel-parser.ts`, `excel-utils.ts` (旧Process型用、後方互換)

**技術的詳細**:
- **エクスポート形式**: 
  * 工程表情報シート: 基本情報
  * レーンシート: スイムレーン一覧（ID、名前、色、順序）
  * カスタム列定義シート: 追加項目定義（type: TEXT/NUMBER/DATE/SELECT/CHECKBOX）
  * 工程データシート: 全工程詳細（BPMN要素、前後工程ID、カスタム列値）
- **インポート**: 4シート完全パース、バリデーション、エラー・警告表示
- **テンプレート**: サンプルデータ付き（3レーン、3カスタム列、5工程）

**優先度**: COMPLETED

---

### 26. セクション自動生成 🔴
**ファイル**: `electron/ipc/manual.handlers.ts`

**タスク**:
- [ ] 工程追加時のセクション自動生成
- [ ] タイトルの工程名からの自動設定
- [ ] 詳細手順の手動入力欄

**優先度**: HIGH

**見積もり**: 0.5日

---

### 27. 画像管理機能 🔴
**ファイル**: `electron/ipc/manual.handlers.ts`, UI

**タスク**:
- [ ] 画像アップロード
- [ ] 画像スロットの管理
- [ ] Excel出力時の画像埋め込み

**優先度**: MEDIUM

**見積もり**: 1日

---

## 🔴 フェーズ6: テスト・仕上げ（0/5）

### 28. 単体テスト作成（バックエンド） 🔴
**ファイル**: `electron/__tests__/`

**タスク**:
- [ ] ProcessTable handlers テスト
- [ ] Process handlers テスト
- [ ] DataObject handlers テスト
- [ ] BPMN handlers テスト
- [ ] Manual handlers テスト
- [ ] nextProcessIds自動計算ロジックのテスト

**優先度**: HIGH

**見積もり**: 2日

---

### 29. 統合テスト作成 🔴
**ファイル**: `tests/integration/`

**タスク**:
- [ ] 工程表作成→工程追加→BPMN生成→Manual生成フロー
- [ ] 双方向同期のテスト
- [ ] Excel出力のテスト

**優先度**: HIGH

**見積もり**: 1.5日

---

### 30. UI/UXテスト・調整 🔴
**タスク**:
- [ ] 実際の操作確認
- [ ] フォームバリデーション
- [ ] エラーハンドリング
- [ ] ローディング状態
- [ ] レスポンシブデザイン

**優先度**: MEDIUM

**見積もり**: 1日

---

### 31. パフォーマンス最適化 🔴
**タスク**:
- [ ] 大量工程（100件以上）での動作確認
- [ ] BPMN自動レイアウトの高速化
- [ ] データベースクエリの最適化

**優先度**: MEDIUM

**見積もり**: 1日

---

### 32. ドキュメント更新 🔴
**ファイル**: `docs/`

**タスク**:
- [ ] SYSTEM_ARCHITECTURE.md作成（Phase 9版）
- [ ] USER_GUIDE.md更新
- [ ] DEVELOPER_GUIDE.md更新
- [ ] README.md更新

**優先度**: MEDIUM

**見積もり**: 1日

---

### 33. 最終動作確認とリリース準備 🔴
**タスク**:
- [ ] 全機能の最終確認
- [ ] バグ修正
- [ ] インストーラーのビルド
- [ ] 配布準備
- [ ] Phase 9完了

**優先度**: HIGH

**見積もり**: 1日

---

## 📅 スケジュール

### 全体期間: 13-17日（約2.5-3.5週間）

| フェーズ | 期間 | 状態 |
|---------|------|------|
| フェーズ0: ドキュメント整理 | 0.5日 | ✅ 完了 |
| フェーズ1: データベース再構築 | 1日 | 🔴 未着手 |
| フェーズ2: バックエンドAPI | 3-4日 | 🔴 未着手 |
| フェーズ3: フロントエンドUI | 4-5日 | 🔴 未着手 |
| フェーズ4: BPMN統合 | 3-4日 | 🔴 未着手 |
| フェーズ5: マニュアル | 2-3日 | 🔴 未着手 |
| フェーズ6: テスト・仕上げ | 2-3日 | 🔴 未着手 |

---

## 🎯 次のアクション

1. **即座に着手**: フェーズ1（データベース再構築）
2. **重要確認**: `PHASE9_SPECIFICATION.md`の仕様を全員で確認
3. **並行作業**: TypeScript型定義とデータベースマイグレーション

---

**最終更新**: 2025年10月22日  
**次の更新予定**: フェーズ3動作確認完了時

---

## 📝 進捗履歴

### 2025年10月22日

#### Pool概念の削除とBPMN 2.0準拠構造への調整
- **背景**: 
  - Pool (bpmn:participant) は組織間/システム間の境界を表す高レベル概念
  - 本アプリケーションのスコープには不要
  - Lane (Swimlane) のみで十分な構造
- **主要変更**:
  1. **データモデル調整**:
     - `Pool` インターフェース削除
     - `Process.swimlane: string` → `Process.laneId: string` (外部キー参照)
     - `Process.poolId` 削除
     - `Process.bpmnElement: BpmnElementType` 追加 (task/event/gateway)
     - `Process.taskType` をオプショナル化（タスクのみ必要）
  2. **データベーススキーマ更新**:
     - `processes` テーブル: `lane_id` (FK), `bpmn_element`, `task_type` (nullable)
     - `process_table_pools` テーブル削除
     - マイグレーション `v2_003` でデータ変換（swimlane名 → lane_id）
  3. **バックエンド整理**:
     - `pool.handlers.ts` 削除（5 IPCハンドラ）
     - プリロード・IPC Helper からPool API削除
  4. **フロントエンド更新**:
     - `ClientPage.tsx`: Pool状態・タブ・統計カード削除
     - `ProcessManagement.tsx`: laneIdフィルタリング、BPMN要素列追加
     - `ProcessFormModal.tsx`: Pool選択削除、BPMN要素タイプ選択追加
     - `PoolManagement.tsx` コンポーネント削除
- **BPMN 2.0準拠性**:
  - ✅ Process (bpmn:process)
  - ✅ Lane (bpmn:lane) - 外部キー参照
  - ✅ FlowNode - Task (7種類), Event (3種類+5中間), Gateway (3種類)
  - ✅ SequenceFlow, ConditionalFlow
  - ✅ Documentation, DataObject, MessageFlow, Artifact
- **成果物**:
  - ✅ `docs/BPMN_XML_EXPORT_ANALYSIS.md` 分析レポート作成
  - ✅ 22/27のBPMN要素が完全実装、XML出力可能な構造

### 2025年10月21日

#### データベースマイグレーションエラー修正
- **問題**: `npm run dev` 実行時に `SqliteError: no such column: swimlane` エラー発生
- **原因**: 
  1. 既存データベースに旧スキーマの `processes` テーブルが残存
  2. マイグレーション実行順序の問題（`createTables()` が先に実行）
  3. `DROP TABLE IF NOT EXISTS` という誤った構文
  4. `migrations` テーブルの作成タイミング不適切
- **修正内容**:
  1. `initDatabase()` で `migrations` テーブルを最初に作成
  2. マイグレーション実行を `createTables()` の前に変更
  3. `DROP TABLE IF NOT EXISTS` → `DROP TABLE IF EXISTS` に修正
  4. `createTables()` 内の重複した `migrations` テーブル作成を削除
- **結果**: ✅ データベース初期化成功、V2テーブル全作成完了、Electron正常起動

#### フェーズ3.2 工程表管理UI実装
- **完了内容**:
  - ✅ `ProcessTableListV2` コンポーネント作成（134行）
  - ✅ `ProcessTableFormModal` コンポーネント作成（185行）
  - ✅ IPC Helper拡張（`processTableIPC` 追加）
  - ✅ `electron.d.ts` に `processTable` API型定義追加
  - ✅ プロジェクト詳細ページへの統合完了
  - ✅ ProcessTable詳細ページ作成（305行）
- **技術的課題と解決**:
  - HeroUIのイベントハンドリング: `onPress` + `onClick` 併用パターン採用
  - SelectItemの `value` プロパティ問題: `key` のみ使用に変更
  - 型定義の拡張: `models.ts` からインポート
- **次のステップ**: 手動テスト実施 → Swimlane管理UI実装

