# 工程表デフォルト列再定義と開発タスクリスト

## 1. デフォルト列リスト（共通）
番号は要件の通し番号に対応。名称はUI/DB/Excelのデフォルトラベルとする。

1. ID（工程表内表示順。整数。必須）
2. 大工程名
3. 中工程名
4. 小工程名
5. 詳細工程名
6. 工数（内部秒保持。表示は時間。集計用）
7. スイムレーン（担当。BPMN Laneに対応。必須）
8. スキルレベル（-, L, M, H から選択）
9. 仕様システム（工程実行時に利用するシステム名）
10. 前工程（ユーザー入力。工程ID参照）
11. 後工程（前工程から自動計算）
12. INPUT（インプット帳票。BPMN DataObject: input）
13. OUTPUT（アウトプット帳票。BPMN DataObject: output）
14. 備考（メモ。BPMN annotationへマップ）
15. 並列実行可否（bool）

### 調査モード工程表のみの列
16. 課題事象
17. 課題分類
18. 対策方針
19. 課題工数（内部秒保持）
20. 時間削減しろ（時間単位。計算可）
21. 割合削減しろ（% 単位。計算可）

## 2. レベル定義と必須条件
### 粒度定義（必ずこの定義で運用すること）
- 大工程: 部署間の切れ目で分解した工程
- 中工程: 大工程を帳票の切れ目で分解した工程
- 小工程: 中工程のアウトプット帳票を作成するためのステップに分解した工程
- 詳細工程: 小工程をさらに細かく分解し、判断・選択的判断・作業のに分類した工程

### レベル別必須条件
- 大工程表: 1,2,7 必須。
- 中工程表: 1,3,7 必須。
- 小工程表: 1,4,7 必須。
- 詳細工程表: 1,5,7 必須。

## 3. データモデル/DB 更新方針
- DB (electron/utils/database.ts + 新マイグレーション v2_006 予定):
  - processes テーブルに以下を追加/確認:
    - level-specific names: `large_name`, `medium_name`, `small_name`, `detail_name` (TEXT)
    - `display_id` を列1として再利用（NOT NULL DEFAULT 0）
    - `work_seconds`, `work_unit_pref`
    - `lane_id` 既存を列7に対応
    - `skill_level` (CHECK '-', 'L','M','H')
    - `system_name` (TEXT)
    - `before_process_ids` / `next_process_ids` JSON
    - `input_data_objects`, `output_data_objects` JSON
    - `documentation` for 備考
    - `parallel_allowed` INTEGER NOT NULL DEFAULT 0
    - 調査モード: `issue_detail`, `issue_category`, `countermeasure_policy`, `issue_work_seconds`, `time_reduction_seconds`, `rate_reduction_percent`
  - process_tables に `is_investigation` 既存。調査モード判定に利用。
  - Migration steps: add missing columns with defaults; backfill next_process_ids from before_process_ids.
- TypeScript models (`src/types/models.ts`):
  - Process: add level-specific name fields; ensure all columns above are present and typed.
  - DTOs (create/update) to carry level-specific names and investigation fields.
- IPC (electron/ipc/*.handlers.ts):
  - processTable handlers: enforce level + isInvestigation flag propagation.
  - process handlers: validation per level; persist new columns; compute next_process_ids.
- Renderer IPC types (`src/types/electron.d.ts`) to match DTOs.

## 4. UI/UX 更新方針
- プロジェクト>工程表一覧: 表示ラベルにレベル別名称と調査モードバッジ。
- 工程表フォーム: 調査モード toggle 維持。レベル選択によって必須項目の説明表示。
- 工程作成/編集フォーム:
  - レベルに応じて必須項目を動的バリデーション。
  - 入力フィールド: 大/中/小/詳細工程名、工数(単位選択)、スイムレーン、スキル、仕様システム、前工程、INPUT/OUTPUT選択、備考、並列可否、調査フィールド群。
  - 自動計算: 後工程 = beforeProcessIds から nextProcessIds を再計算。
- 表示/一覧: 列ヘッダーを上記デフォルトに合わせる（ProcessTableDetail grids, Excel import/export）。

## 5. BPMN/マニュアル対応
- スイムレーン -> BPMN Lane
- INPUT/OUTPUT -> BPMN DataObject (input/output association)
- 備考 -> BPMN documentation/annotation
- 並列実行可否 -> BPMN gateway/flow rule (UI側で制御、XMLには専用属性として拡張可)
- 調査モードフィールド -> BPMN 拡張属性として保存（未既存なら extensionElements を追加）

## 6. Excel インポート/エクスポート
- シート列を上記デフォルトに揃える。
- レベル別必須チェックを行い、欠損はエラー返却。
- 調査モード時は 16-21 を必須扱い。

## 7. 開発タスク分割
1. 仕様反映ドキュメント作成（本ファイル）
2. DBマイグレーション v2_006 で必要カラム追加 & 既存データの初期値設定
3. TypeScriptモデル/DTO整合 (models.ts, electron.d.ts)
4. IPC: processTable/process handlers のバリデーションと保存対応
5. UIフォーム: 工程作成/編集のフィールド・バリデーション更新、調査モード切替
6. 一覧/表示: 列ラベル・表示値更新、調査モードバッジ
7. BPMN/マニュアル: exporter/importerで新属性を extensionElements 等にシリアライズ
8. Excel I/O: 列レイアウト変更と必須チェック
9. テスト: migration + IPC + UI単体/結合 + BPMN/Excel I/O

## 8. 未確定・要確認事項
- BPMN拡張属性のキー命名（issue_* フィールドなど）
- Excel列順とシート名の確定
- 既存データのレベル別名称の初期値（既存 name をどの列にコピーするか）

以降の開発は本ドキュメントに従うこと。必要に応じて更新する。