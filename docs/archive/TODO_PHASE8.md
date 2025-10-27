# Output Management Tool - 開発TODO

**作成日**: 2025年10月13日  
**最終更新**: 2025年10月19日  
**バージョン**: 2.2  

---

## 📊 全体進捗サマリー

| フェーズ | 進捗 | ステータス |
|---------|------|-----------|
| Phase 0: 環境準備 | 8/8 | ✅ 完了 |
| Phase 1: 基盤構築 | 12/12 | ✅ 完了 |
| Phase 2: コア機能実装 | 15/15 | ✅ 完了 |
| Phase 3: 階層管理 | 10/10 | ✅ 完了 |
| Phase 4: バージョン管理・UI最適化 | 16/16 | ✅ 完了 |
| Phase 5: 最適化・テスト | 6/7 | 🟡 進行中 |
| Phase 6: 三位一体同期（構造） | 11/11 | ✅ 完了 |
| **Phase 7: 生成AI連携（詳細）** | **0/8** | **� 将来実装** |
| **Phase 8: 階層構造の簡素化** | **10/10** | **✅ 完了** |
| **合計** | **88/97** | **91%** |

---

## 🎉 Phase 8: 階層構造の簡素化 ✅ 完了

**完了日**: 2025年10月19日  
**成果**: 実務要件に基づく階層構造の抜本的な改善

### 主要変更
- ❌ **廃止**: ProcessTable, BpmnDiagramTable, ManualTable（グループテーブル）
- ✅ **統合**: すべてのエンティティが階層構造を直接保持
- 🎯 **実現**: 1エンティティ → 1詳細表の関係

### 実装タスク（10/10完了）

#### 1. ドキュメント作成 ✅
- [x] 要件定義書（REQUIREMENTS_HIERARCHICAL_STRUCTURE.md → ARCHITECTURE.mdに統合）
- [x] 技術仕様書（TECHNICAL_SPEC_HIERARCHICAL_STRUCTURE.md → ARCHITECTURE.mdに統合）
- [x] 実装ガイド（PHASE8_IMPLEMENTATION_GUIDE.md）
- [x] テスト計画（PHASE8_TEST_PLAN.md）
- [x] 完了レポート（PHASE8_COMPLETION_REPORT.md）

#### 2. データベースマイグレーション ✅
- [x] Migration 006作成（006_hierarchical_refactoring.sql）
- [x] detail_table_id, parent_entity_id カラム追加
- [x] インデックス作成
- [x] マイグレーション登録（database.ts）

#### 3. 型定義更新 ✅
- [x] HierarchicalEntity 基底インターフェース追加
- [x] DetailTable<T> ジェネリック型追加
- [x] 非推奨フィールドマーク（後方互換性）
- [x] ユーティリティ関数追加

#### 4. Electron API実装 ✅
- [x] process:createDetailTable 実装
- [x] process:getDetailTable 実装
- [x] process:getParentEntity 実装
- [x] bpmn, manual 同様のハンドラー実装
- [x] 旧ハンドラーファイル削除

#### 5. API削除 ✅
- [x] processTable.handlers.ts 削除
- [x] bpmnDiagramTable.handlers.ts 削除
- [x] manualTable.handlers.ts 削除
- [x] preload.ts から旧API削除

#### 6. 旧UI削除 ✅
- [x] process-tables/ ディレクトリ削除

#### 7. hierarchy/page.tsx 拡張 ✅
- [x] URLパラメータ処理（?detail=）
- [x] 詳細表データ管理
- [x] パンくずリスト追加
- [x] 詳細表作成・ナビゲーションボタン

#### 8. コンポーネント更新 ✅
- [x] HierarchyTree に詳細表ボタン追加
- [x] IntegratedProcessTable に詳細表ボタン追加

#### 9. 統合表示の更新 ✅
- [x] trinity/page.tsx に詳細表カウント表示
- [x] projects/[id]/page.tsx に詳細表情報カード

#### 10. テストと検証 ✅
- [x] テスト計画作成（71項目）
- [x] アプリケーションビルド確認
- [x] 起動確認

**Phase 8完了レポート**: `docs/PHASE8_COMPLETION_REPORT.md`

---

## 🔄 Phase 6: 三位一体同期 ✅ 完了

**完了日**: 2025年10月15日  
**タスク**: 11/11完了

マニュアルUI、Trinity Dashboard、同期システム完全実装。
工程表 ⇔ BPMN ⇔ マニュアルの自動連携システム完成。

---

## 📦 Phase 5: 最適化・テスト 🟡 6/7完了

**進捗**: 86%

残りタスク:
- [ ] 包括的なE2Eテスト実装

---

## ⚙️ Phase 0-4: 基盤機能 ✅ 完了

- Phase 0: 環境準備 (8/8)
- Phase 1: 基盤構築 (12/12)
- Phase 2: コア機能実装 (15/15)
- Phase 3: 階層管理 (10/10)
- Phase 4: バージョン管理・UI最適化 (16/16)

---

## 🔮 Phase 7: 生成AI連携（将来実装）

**ステータス**: 計画段階（0/8）

計画タスク:
- AI自動工程生成
- AIマニュアル生成
- AI BPMN生成
- インテリジェント提案機能

---

## 📝 優先度別タスク

### 🔥 最高優先度（今すぐ）
なし - Phase 8完了

### 🚀 高優先度（次のスプリント）
- [ ] Phase 5: E2Eテスト実装
- [ ] ドキュメント整理完了
- [ ] Phase 9計画
  - 詳細表遷移ボタン追加
  - 上位エンティティへ戻るボタン追加

### 🔧 中優先度（必要に応じて）
- [ ] カスタム列の高度な機能追加
- [ ] BPMN XMLパーサーの改善
- [ ] パフォーマンス最適化

### 📚 低優先度（時間があれば）
- [ ] ユーザーマニュアルの拡充
- [ ] 動画チュートリアル作成
- [ ] 多言語対応

---

## 📌 メモ

### Phase 8成果物
- 新規ファイル: 8ファイル
- 削除ファイル: 13ファイル
- 更新ファイル: 15ファイル
- 新規コード: ~800行
- ドキュメント: ~2,000行

### 技術的負債
- 非推奨フィールド（processTableId等）: Phase 9で削除予定
- E2Eテストカバレッジ: 現在0%、目標80%

### 今後の方向性
1. Phase 5完了（E2Eテスト）
2. Phase 9計画（非推奨フィールド削除、パフォーマンス改善）
3. Phase 10検討（AI連携の具体化）

---

**最終更新**: 2025年10月19日  
**次回更新予定**: Phase 9開始時
  - `bpmnElement:getByBpmnDiagram` - 図の全要素取得 ✅
  - `bpmnElement:getById` - 要素単体取得 ✅
  - `bpmnElement:update` - 要素更新 ✅
  - `bpmnElement:delete` - 要素削除 ✅
  - `bpmnElement:syncFromBpmn` - BPMN XMLから同期（TODO: パーサー実装予定）⏳
  - 200行、CRUD完全実装完了

- [x] **IPC統合 (main.ts, preload.ts)** ✅
  - electron/main.ts に3つのハンドラー登録完了 ✅
  - electron/preload.ts でAPI公開完了 ✅
  - TypeScriptビルド成功（エラーなし）✅

##### 4. フロントエンド実装 🔄 実装中
- [x] **カスタム列管理UI（優先度1）** ✅ 完了 (2025-10-19)
  - 各プロジェクト詳細ページ内に個別設定画面を追加 ✅
  - プロジェクト設定タブ (/projects/[id]/project-settings) 作成 ✅
  - カスタム列管理セクション追加 ✅
  - カスタム列の追加・編集・削除機能 ✅
  - ドラッグ&ドロップで列順序変更 ✅
  - データ型選択（text, number, date, select, checkbox, textarea） ✅
  - 表示/非表示トグル ✅
  - 必須フラグ設定 ✅
  - デフォルト値設定 ✅
  - コンポーネント: src/components/customColumn/CustomColumnManager.tsx ✅
  - ページ: src/app/projects/[id]/project-settings/page.tsx ✅
  - プロジェクト詳細ページにリンク追加 ✅

- [x] **動的工程表表示（優先度2）** ✅ 完了 (2025-10-19)
  - カスタム列を含む工程表の動的レンダリング ✅
  - カスタム列値のインライン編集機能 ✅
  - 7種類のデータ型に対応した入力UI ✅
  - 列の表示/非表示切り替え（設定ページへのリンク） ✅
  - 工程名・部門・担当者での検索機能 ✅
  - 表示中のカスタム列数の表示 ✅
  - コンポーネント: src/components/process/ProcessTableDynamic.tsx ✅
  - 410行、完全実装完了 ✅
  - 型エラー修正完了（HeroUI Table動的列対応） ✅
  - 階層管理ページに統合完了（3つの表示モード：ツリー/標準/カスタム列） ✅

- [x] **BPMN要素管理UI（優先度3）** ✅ 完了 (2025-10-19)
  - BPMN要素管理画面作成 ✅
  - 11種類の要素タイプに対応（データオブジェクト、シグナル、タイマーなど） ✅
  - 要素タイプ別グループ化・カード表示 ✅
  - 要素の追加・編集・削除機能 ✅
  - 同期ステータス表示（synced/outdated/conflict/manual） ✅
  - 工程とのリンク情報表示 ✅
  - BPMN同期トリガーボタン（パーサー実装待ち） ✅
  - コンポーネント: src/components/bpmn/BpmnElementManager.tsx ✅
  - 440行、完全実装完了 ✅
  - プロジェクト設定ページに統合完了（4つのタブ：カスタム列/基本/BPMN要素/同期） ✅

- [ ] **BPMN エディタ統合（優先度4）** ⏳ 次のタスク
  - bpmn.js との統合強化
  - 工程表との双方向同期UI
  - 変更検知と同期ステータス表示

- [ ] **同期管理UI（優先度5）**
  - 同期ステータスダッシュボード
  - 手動同期トリガーボタン
  - 競合解決UI
  - 同期履歴表示

##### 5. マイグレーション ✅ 完了 (2025-10-19)
- [x] **005_custom_columns_and_bpmn_elements** ✅
  - custom_columns テーブル作成 ✅
  - process_custom_values テーブル作成 ✅
  - bpmn_elements テーブル作成 ✅
  - processes テーブル拡張 ✅
  - インデックス作成完了 ✅
  - 開発サーバーで検証済み ✅
  - process_custom_values テーブル作成
  - bpmn_elements テーブル作成
  - processes テーブルに同期関連フィールド追加

##### 6. ドキュメント更新
- [ ] **仕様書更新**
  - SYNC_ARCHITECTURE.md 作成（同期システムの詳細仕様）
  - CUSTOM_COLUMNS_GUIDE.md 作成（カスタム列機能のガイド）
  - PROCESS_TABLE_ARCHITECTURE.md 更新（Phase 7の内容追加）

- [ ] **API ドキュメント更新**
  - 新規API のエンドポイント追加
  - リクエスト/レスポンス例追加

#### 📋 優先度：中（計画中）

##### 7. パフォーマンス最適化
- [ ] カスタム列値の効率的な取得（JOIN最適化）
- [ ] 大量データの仮想スクロール対応
- [ ] 同期処理のバッチ化・並列化

##### 8. テスト
- [ ] カスタム列APIのユニットテスト
- [ ] 同期ロジックの統合テスト
- [ ] UI自動テスト（E2E）

#### 🔮 優先度：低（将来対応）

##### 9. 高度な機能
- [ ] カスタム列の計算式サポート
- [ ] 列の検証ルール設定
- [ ] カスタムビュー保存機能
- [ ] 列グループ化機能

---

## 完了したタスク ✅

### Phase 6: グループベース管理システム (2025-10-18完了)
- ✅ ProcessTable, BpmnDiagramTable, ManualTable の実装
- ✅ グループ管理UI の実装
- ✅ 設定ページとテーマ切替機能
- ✅ データベース初期化の堅牢化
- ✅ マイグレーション 004_ensure_process_table_id

---

## 注意事項

### 実装方針
1. **段階的な実装**: 各機能を独立して実装し、段階的にリリース
2. **後方互換性の維持**: 既存データへの影響を最小限に
3. **パフォーマンス重視**: 大量データでも快適に動作する設計
4. **ユーザビリティ**: 直感的で使いやすいUI/UX

### データ設計の考慮点
- カスタム列は EAV（Entity-Attribute-Value）パターンで実装
- BPMN要素は JSON でプロパティを柔軟に保存
- 同期ステータスで整合性を常に監視

### 技術的制約
- SQLite のカラム数制限を考慮（EAV パターン採用）
- Electron のメモリ使用量に注意
- bpmn.js のバージョン互換性確保
