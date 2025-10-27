# 設定項目の実装状況

最終更新: 2024年

## 概要

設定ページには20以上の設定項目がありますが、現在実装されているのは一部のみです。
このドキュメントでは各設定の実装状況を明確化します。

## ステータス凡例

- ✅ **Active**: 完全に実装済み、動作に反映されている
- 🔄 **Partial**: 部分的に実装済み
- ⏳ **Planned**: 実装予定（Phase 7-8）
- ❌ **Future**: 将来的な機能（Phase 9以降）

---

## 1. 同期設定 (Sync Settings)

### 1.1 自動同期
- **設定キー**: `settings.sync.autoSyncEnabled`
- **ステータス**: ⏳ **Planned**
- **説明**: 自動同期のON/OFF設定
- **現状**: UIは実装済み。同期ハンドラーは存在するが、この設定をチェックしていない
- **実装予定**: Phase 7

### 1.2 同期間隔
- **設定キー**: `settings.sync.syncInterval`
- **ステータス**: ⏳ **Planned**
- **説明**: 自動同期の間隔（分）
- **現状**: UIは実装済み。バックグラウンド同期機能が未実装
- **実装予定**: Phase 7

### 1.3 同期方向
- **設定キー**: `settings.sync.bpmnToProcessEnabled`, `processToBpmnEnabled`, `processToManualEnabled`
- **ステータス**: ⏳ **Planned**
- **説明**: 各方向の同期のON/OFF
- **現状**: UIは実装済み。同期ロジックで方向制御が未実装
- **実装予定**: Phase 7

### 1.4 競合解決
- **設定キー**: `settings.sync.conflictResolution`
- **ステータス**: ⏳ **Planned**
- **説明**: 競合時の処理方法（手動/BPMN優先/工程表優先）
- **現状**: UIは実装済み。競合検出・解決ロジックが未実装
- **実装予定**: Phase 8

---

## 2. 工程レベル定義 (Process Levels)

### 2.1 レベルの有効/無効
- **設定キー**: `settings.processLevels.{level}.enabled`
- **ステータス**: ✅ **Active**
- **説明**: 各レベル（大工程/中工程/小工程/詳細工程）の有効化制御
- **実装状況**:
  - ProcessForm.tsxで完全実装
  - 無効化されたレベルは選択肢から除外
  - カスタム名と説明も反映
  - リアルタイム反映

### 2.2 レベルのカスタマイズ
- **設定キー**: `settings.processLevels.{level}.name`, `description`, `color`
- **ステータス**: 🔄 **Partial**
- **説明**: 各レベルの名前、説明、色のカスタマイズ
- **実装状況**:
  - ProcessForm: カスタム名・説明を表示 ✅
  - 他のコンポーネント: カスタム色の反映は未実装 ⏳
- **実装計画**: ProcessCard、階層ページ等でカスタム色を反映
- **実装予定**: Phase 7-8

---

## 3. UI設定 (UI Settings)

### 3.1 テーマ
- **設定キー**: `settings.ui.theme`
- **ステータス**: ✅ **Active**
- **説明**: ライト/ダーク/システムテーマの切り替え
- **実装状況**:
  - SettingsContext.tsxで完全実装
  - document.documentElement.classListを操作
  - システムテーマの自動追従機能あり
  - リアルタイム反映

### 3.2 デフォルトビュー
- **設定キー**: `settings.ui.defaultView`
- **ステータス**: ✅ **Active**
- **説明**: 階層ページの初期表示モード（ツリー/テーブル）
- **実装状況**:
  - hierarchy/page.tsxで完全実装
  - 設定値をviewModeの初期値として使用
  - リアルタイム反映

### 3.3 ページあたりの表示数
- **設定キー**: `settings.ui.itemsPerPage`
- **ステータス**: ✅ **Active**
- **説明**: テーブルのページネーション設定
- **実装状況**:
  - ProcessTableDynamic、ProcessTableで完全実装
  - ページネーションコンポーネント追加
  - 設定値がテーブルのrowsPerPageとして使用される
  - リアルタイム反映

### 3.4 アニメーション
- **設定キー**: `settings.ui.animationsEnabled`
- **ステータス**: ✅ **Active**
- **説明**: UIアニメーションの有効/無効
- **実装状況**:
  - SettingsContextで完全実装
  - HTML要素にreduce-motionクラスを付与
  - globals.cssでアニメーション・トランジション無効化
  - リアルタイム反映

### 3.5 コンパクトモード
- **設定キー**: `settings.ui.compactMode`
- **ステータス**: ✅ **Active**
- **説明**: レイアウトの余白を削減して情報密度を向上
- **実装状況**:
  - AppLayoutで完全実装
  - padding: 6 → 3 に削減
  - より多くの情報を画面に表示可能
  - リアルタイム反映

---

## 4. エクスポート設定 (Export Settings)

### 4.1 デフォルトフォーマット
- **設定キー**: `settings.export.defaultFormat`
- **ステータス**: ⏳ **Planned** (優先度: 中)
- **説明**: エクスポート時のデフォルトファイル形式
- **現状**: UIは実装済み。エクスポート処理で未使用（JSONハードコード）
- **実装計画**: hierarchy/page.tsxのhandleExportLevel関数で設定を読み込み
- **実装予定**: Phase 7

### 4.2 ファイル名テンプレート
- **設定キー**: `settings.export.filenameTemplate`
- **ステータス**: ⏳ **Planned** (優先度: 低)
- **説明**: エクスポートファイル名のテンプレート
- **現状**: UIは実装済み。ファイル名生成で未使用
- **実装計画**: テンプレート変数を置換してファイル名を生成
- **実装予定**: Phase 8

### 4.3 メタデータの含有
- **設定キー**: `settings.export.includeMetadata`
- **ステータス**: ⏳ **Planned** (優先度: 低)
- **説明**: エクスポート時にメタデータを含めるか
- **現状**: UIは実装済み。エクスポートデータに反映されていない
- **実装予定**: Phase 8

### 4.4 日付フォーマット
- **設定キー**: `settings.export.dateFormat`
- **ステータス**: ⏳ **Planned** (優先度: 低)
- **説明**: エクスポート時の日付フォーマット
- **現状**: UIは実装済み。日付変換で未使用
- **実装予定**: Phase 8

---

## 5. バックアップ設定 (Backup Settings)

### 5.1 自動バックアップ
- **設定キー**: `settings.backup.autoBackupEnabled`
- **ステータス**: ❌ **Future**
- **説明**: 自動バックアップのON/OFF
- **現状**: UIは実装済み。バックアップ機能自体が未実装
- **実装予定**: Phase 9以降

### 5.2 バックアップ間隔
- **設定キー**: `settings.backup.backupInterval`
- **ステータス**: ❌ **Future**
- **説明**: 自動バックアップの間隔（時間）
- **現状**: UIは実装済み。バックアップ機能自体が未実装
- **実装予定**: Phase 9以降

### 5.3 保持するバックアップ数
- **設定キー**: `settings.backup.maxBackups`
- **ステータス**: ❌ **Future**
- **説明**: 保持するバックアップファイルの最大数
- **現状**: UIは実装済み。バックアップ機能自体が未実装
- **実装予定**: Phase 9以降

### 5.4 バックアップ先パス
- **設定キー**: `settings.backup.backupPath`
- **ステータス**: ❌ **Future**
- **説明**: バックアップファイルの保存先
- **現状**: UIは実装済み。バックアップ機能自体が未実装
- **実装予定**: Phase 9以降

---

## 実装ロードマップ

### Phase 7（今週中）- 優先度: 高
1. ✅ テーマ設定（既に完了）
2. ⏳ デフォルトビュー設定の適用
3. ⏳ ページあたりの表示数設定の適用
4. ⏳ 工程レベルの有効/無効設定の適用

### Phase 7-8（今月中）- 優先度: 中
5. ⏳ アニメーション設定の適用
6. ⏳ コンパクトモード設定の適用
7. ⏳ エクスポートフォーマット設定の適用
8. ⏳ 工程レベルのカスタマイズ反映

### Phase 8（来月）- 優先度: 低
9. ⏳ 同期設定の適用
10. ⏳ エクスポートファイル名テンプレート
11. ⏳ その他のエクスポート設定

### Phase 9以降（将来）
12. ❌ バックアップ機能の実装

---

## 技術的な実装メモ

### 設定の読み込み方法

```typescript
import { useSettings } from '@/contexts/SettingsContext';

function MyComponent() {
  const { settings } = useSettings();
  
  // 設定を使用
  const viewMode = settings.ui.defaultView;
  const itemsPerPage = settings.ui.itemsPerPage;
}
```

### 注意点

1. **設定変更の即座反映**: useSettings()フックはリアクティブなので、設定変更は自動的に反映される
2. **localStorage永続化**: 全ての設定変更は自動的にlocalStorageに保存される
3. **デフォルト値**: DEFAULT_SETTINGSを参照（types/settings.types.ts）

---

## 進捗状況サマリー

- **実装済み**: 6/20 設定 (30%)
  - ✅ テーマ設定
  - ✅ デフォルトビュー設定
  - ✅ ページあたりの表示数設定
  - ✅ アニメーション設定
  - ✅ コンパクトモード設定
  - ✅ 工程レベルの有効/無効設定

- **部分実装**: 1/20 設定 (5%)
  - 🔄 工程レベルのカスタマイズ（名前・説明は適用済み、色は未適用）

- **実装予定（Phase 7-8）**: 9/20 設定 (45%)
  - 同期設定、エクスポート設定等

- **将来機能**: 4/20 設定 (20%)
  - バックアップ設定

**合計進捗**: 30% (6/20設定が完全実装) + 5% (1/20設定が部分実装) = **35%**
**Phase 7目標達成**: 主要UI設定はすべて実装完了 ✅
