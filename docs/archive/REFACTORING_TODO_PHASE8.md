# アーキテクチャ修正 ToDo リスト

**作成日**: 2025年10月20日  
**目的**: 正しいアーキテクチャ（4段階固定階層、1対1対応）を実装するための改修タスク

---

## ⚠️ CRITICAL 優先度

### Todo 4: 工程表⇔BPMNフロー1対1対応の実装

**ファイル**: `electron/ipc/process.handlers.ts`, `bpmn.handlers.ts`

**現状の問題**:
- `processes`テーブルに`bpmn_diagram_id`カラムが存在しない（`bpmn_element_id`のみ）
- 工程作成時にBPMNフローを自動生成する仕組みがない
- 工程削除時にBPMNフローを自動削除する仕組みがない

**必要な修正**:
1. マイグレーション: `processes`テーブルに`bpmn_diagram_id`カラム追加
2. `process:create`ハンドラー: BPMN自動生成ロジック追加
3. `process:delete`ハンドラー: BPMN自動削除ロジック追加
4. `process:update`ハンドラー: BPMN同期更新ロジック追加
5. `bpmn:create`ハンドラー: Process自動生成ロジック追加
6. `bpmn:delete`ハンドラー: Process自動削除ロジック追加

**優先度**: CRITICAL - 正しいアーキテクチャの根幹ルール

**依存関係**: Todo 7（DBスキーマ修正）を先に実施

---

### Todo 7: データベーススキーマの修正

**ファイル**: `electron/utils/database.ts`

**必要な変更**:
1. `processes`テーブルに`bpmn_diagram_id TEXT`列追加
2. `FOREIGN KEY (bpmn_diagram_id) REFERENCES bpmn_diagrams(id) ON DELETE SET NULL`制約追加
3. マイグレーション番号: 007を作成
4. 既存データへの影響: `bpmn_diagram_id`はNULL許容なので既存レコードは影響なし

**実装例**:
```sql
-- Migration 007: Add bpmn_diagram_id to processes table
ALTER TABLE processes ADD COLUMN bpmn_diagram_id TEXT;
CREATE INDEX IF NOT EXISTS idx_processes_bpmn_diagram_id ON processes(bpmn_diagram_id);
```

**優先度**: CRITICAL - Todo 4の前提条件

---

## 🔴 HIGH 優先度

### Todo 1: 詳細工程のレベルマッピングを修正（detail→null）

**ファイル**: `electron/ipc/process.handlers.ts`  
**行数**: 657

**現在の実装**:
```typescript
const levelMap: Record<ProcessLevel, ProcessLevel> = {
  large: 'medium',
  medium: 'small',
  small: 'detail',
  detail: 'detail', // ❌ 詳細工程の下にさらに詳細工程を作成可能
};
```

**修正後**:
```typescript
const levelMap: Record<ProcessLevel, ProcessLevel | null> = {
  large: 'medium',
  medium: 'small',
  small: 'detail',
  detail: null, // ✅ 詳細工程の下には作成不可
};

// バリデーション追加
if (entity.level === 'detail') {
  throw new Error('詳細工程の下には詳細表を作成できません（4段階固定階層）');
}
```

**優先度**: HIGH - 4段階固定階層の根幹ルール違反

**影響範囲**: `createDetailTable`ハンドラー全体の動作

---

### Todo 2: BPMN詳細表作成のレベルマッピング確認

**ファイル**: `electron/ipc/bpmn.handlers.ts`  
**行数**: 357～430

**確認事項**:
- BPMNダイアグラムにもレベル概念があるか？
- なければ工程表とのレベル同期方法を設計

**現状**: レベル管理が見当たらない

**必要な対応**:
- 工程表のレベルに対応するBPMNダイアグラムのレベル管理
- または、工程⇔BPMNタスクの1対1対応で間接的にレベルを管理

**優先度**: HIGH

---

### Todo 3: Manual詳細表作成のレベルマッピング確認

**ファイル**: `electron/ipc/manual.handlers.ts`  
**行数**: 150～250

**確認事項**: Manualにもレベル管理が必要か確認

**優先度**: HIGH

---

### Todo 5: 工程⇔BPMNタスク1対1対応の実装

**ファイル**: `electron/ipc/process.handlers.ts`

**現状**: `bpmn_element_id`で関連付けのみ（自動生成なし）

**必要な修正**:
1. 工程作成時にBPMNタスク（`bpmn_elements`）を自動生成
2. 工程削除時にBPMNタスクを自動削除
3. 工程名変更時にBPMNタスク名も自動更新
4. 相互参照の整合性チェック

**優先度**: HIGH

---

### Todo 8: 型定義の更新（Process型にbpmnDiagramId追加）

**ファイル**: 
- `src/types/project.types.ts` (line 59で既に`bpmnDiagramId`定義あり)
- `electron/ipc/process.handlers.ts` (inline type定義)

**現状確認**: `project.types.ts`には既に`bpmnDiagramId?: string;`が存在

**必要な修正**: `electron/ipc/process.handlers.ts`内のインライン型定義にも追加

```typescript
interface Process {
  id: string;
  projectId: string;
  processTableId?: string;
  name: string;
  level: ProcessLevel;
  parentId?: string;
  department?: string;
  assignee?: string;
  documentType?: string;
  startDate?: Date;
  endDate?: Date;
  status?: string;
  description?: string;
  bpmnElementId?: string;
  bpmnDiagramId?: string;  // ✅ 追加
  hasManual?: boolean;
  manualId?: string;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}
```

**優先度**: HIGH - Todo 4の実装時に必要

---

## 🟡 MEDIUM 優先度

### Todo 6: 詳細表の0-or-1制約バリデーション強化

**ファイル**: 
- `electron/ipc/process.handlers.ts` (line 653)
- `electron/ipc/bpmn.handlers.ts` (line 370)
- `electron/ipc/manual.handlers.ts`

**現状**: 既に`detail_table_id`が存在する場合はエラーを返す実装あり
```typescript
if (entity.detail_table_id) {
  throw new Error('Detail table already exists');
}
```

**確認事項**: 3ハンドラー全てで同じバリデーションが実装されているか確認

**優先度**: MEDIUM - 既に一部実装済みだが全体の一貫性確認が必要

---

### Todo 9: フロントエンドUIでの1対1対応表示

**ファイル**: 
- `src/app/projects/[id]/hierarchy/page.tsx`
- `src/components/process/IntegratedProcessTable.tsx`

**必要な修正**:
1. 工程作成UI: 「BPMN自動生成」チェックボックス（デフォルトON）
2. 工程一覧: 対応するBPMNフロー名を表示
3. 工程削除UI: 「関連BPMNも削除されます」警告表示
4. BPMN未作成工程の警告アイコン表示

**優先度**: MEDIUM - バックエンド実装後に対応

---

## 🟢 LOW 優先度

### Todo 10: ドキュメント更新（実装仕様の反映）

**ファイル**: 
- `docs/ARCHITECTURE.md`
- `docs/CORRECT_ARCHITECTURE.md`

**必要な修正**:
1. 実装詳細セクションに自動生成ロジックのフロー図追加
2. エラーハンドリング仕様の明記
3. マイグレーション007の説明追加

**優先度**: LOW - 実装完了後に更新

---

## 実装順序の推奨

1. **Phase 1**: スキーマ修正とレベルマッピング修正
   - [ ] Todo 7: データベーススキーマの修正
   - [ ] Todo 8: 型定義の更新
   - [ ] Todo 1: 詳細工程のレベルマッピング修正

2. **Phase 2**: 1対1対応の実装
   - [ ] Todo 4: 工程表⇔BPMNフロー1対1対応の実装
   - [ ] Todo 5: 工程⇔BPMNタスク1対1対応の実装

3. **Phase 3**: レベル管理の確認と修正
   - [ ] Todo 2: BPMN詳細表作成のレベルマッピング確認
   - [ ] Todo 3: Manual詳細表作成のレベルマッピング確認
   - [ ] Todo 6: 詳細表の0-or-1制約バリデーション強化

4. **Phase 4**: UI対応とドキュメント更新
   - [ ] Todo 9: フロントエンドUIでの1対1対応表示
   - [ ] Todo 10: ドキュメント更新

---

## 参照ドキュメント

- [CORRECT_ARCHITECTURE.md](./CORRECT_ARCHITECTURE.md) - 正しいアーキテクチャの定義
- [ARCHITECTURE.md](./ARCHITECTURE.md) - システムアーキテクチャ全体
- [DEVELOPMENT.md](./DEVELOPMENT.md) - 開発ガイド
