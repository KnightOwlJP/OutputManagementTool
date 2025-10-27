# Phase 9.1: BPMN-工程表 双方向同期設計仕様

**バージョン**: 1.0.0  
**作成日**: 2025年10月27日  
**ステータス**: 設計中

---

## 1. 概要

### 1.1 背景

**Phase 9の制約**:
- 工程表が唯一のデータソース（Single Source of Truth）
- BPMNとマニュアルは自動生成、読み取り専用
- 直感的なビジュアル編集ができない

**ユーザー要望**:
- BPMNフロー図を直接編集したい
- 工程表とBPMNをリアルタイムで双方向同期したい

### 1.2 Phase 9.1の目標

Phase 9の「工程表中心」設計を**拡張**し、以下を実現:

1. **BPMNビジュアル編集機能** - bpmn-js Modelerを使用
2. **双方向リアルタイム同期** - 工程表↔BPMNの自動同期
3. **競合解決メカニズム** - 同時編集時の整合性保証
4. **トランザクション管理** - 変更の原子性保証

---

## 2. アーキテクチャ設計

### 2.1 データフロー

```
┌──────────────────┐          ┌──────────────────┐
│   工程表編集     │◄────────►│   BPMN編集       │
│ (ProcessTable)   │  双方向  │ (BpmnEditor)     │
└────────┬─────────┘  同期    └────────┬─────────┘
         │                              │
         │                              │
         ▼                              ▼
┌─────────────────────────────────────────────────┐
│           同期エンジン (SyncEngine)              │
│  - 変更検出 (Change Detection)                  │
│  - 競合解決 (Conflict Resolution)               │
│  - トランザクション管理 (Transaction)            │
└────────┬────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────┐
│              SQLite Database                     │
│  - processes (工程データ)                        │
│  - bpmn_sync_state (同期状態)                   │
│  - sync_transactions (同期トランザクション)      │
└──────────────────────────────────────────────────┘
```

### 2.2 同期方式

**リアルタイム双方向同期**:

| 編集元 | 検出方法 | 同期先 | 更新内容 |
|--------|----------|--------|----------|
| 工程表 | IPC `process:update` | BPMN | XMLの再生成・再描画 |
| BPMN | bpmn-js `commandStack.changed` | 工程表 | 要素変更をProcessに変換 |

### 2.3 Phase 9との互換性

**Phase 9（現行）**:
```
工程表 ──生成──► BPMN (読み取り専用)
```

**Phase 9.1（新規）**:
```
工程表 ◄──同期──► BPMN (編集可能)
```

**移行戦略**:
- Phase 9のAPIは**すべて維持**
- 新しいAPIを追加（後方互換性あり）
- フラグで編集モード切り替え可能

---

## 3. データモデル

### 3.1 新規テーブル: bpmn_sync_state

```sql
CREATE TABLE bpmn_sync_state (
  id TEXT PRIMARY KEY,
  process_table_id TEXT NOT NULL,
  bpmn_xml TEXT NOT NULL,              -- 現在のBPMN XML
  last_synced_at INTEGER NOT NULL,     -- 最終同期時刻
  last_modified_by TEXT NOT NULL,      -- 'process' | 'bpmn'
  version INTEGER NOT NULL DEFAULT 1,  -- 楽観的ロック用
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (process_table_id) REFERENCES process_tables(id) ON DELETE CASCADE
);

CREATE INDEX idx_bpmn_sync_state_process_table 
  ON bpmn_sync_state(process_table_id);
```

### 3.2 新規テーブル: sync_transactions

```sql
CREATE TABLE sync_transactions (
  id TEXT PRIMARY KEY,
  process_table_id TEXT NOT NULL,
  source TEXT NOT NULL,                -- 'process' | 'bpmn'
  operation TEXT NOT NULL,              -- 'create' | 'update' | 'delete' | 'reorder'
  entity_type TEXT NOT NULL,            -- 'process' | 'lane' | 'gateway' | 'edge'
  entity_id TEXT,
  changes TEXT NOT NULL,                -- JSON: before/after
  status TEXT NOT NULL,                 -- 'pending' | 'applied' | 'failed' | 'conflict'
  error_message TEXT,
  created_at INTEGER NOT NULL,
  applied_at INTEGER,
  FOREIGN KEY (process_table_id) REFERENCES process_tables(id) ON DELETE CASCADE
);

CREATE INDEX idx_sync_transactions_process_table 
  ON sync_transactions(process_table_id);
CREATE INDEX idx_sync_transactions_status 
  ON sync_transactions(status);
```

---

## 4. API設計

### 4.1 新規IPC API

#### 4.1.1 BPMN → 工程表 同期

```typescript
// BPMN編集内容を工程表に反映
ipcMain.handle('bpmn:syncToProcessTable', async (_, params: {
  processTableId: string;
  bpmnXml: string;
  changes: BpmnChange[];
  version: number;  // 楽観的ロック
}): Promise<SyncResult> => {
  // 1. バージョンチェック（競合検出）
  // 2. BPMN XMLをパース
  // 3. 変更をProcessテーブルに反映
  // 4. トランザクションログ記録
  // 5. sync_stateを更新
});

interface BpmnChange {
  type: 'create' | 'update' | 'delete' | 'move';
  elementType: 'task' | 'gateway' | 'event' | 'lane' | 'edge';
  elementId: string;
  data: Record<string, any>;
}

interface SyncResult {
  success: boolean;
  conflicts?: Conflict[];
  updatedProcesses?: Process[];
  newVersion: number;
}
```

#### 4.1.2 工程表 → BPMN 同期

```typescript
// 工程表編集内容をBPMNに反映（自動）
// process:update ハンドラーを拡張

ipcMain.handle('process:update', async (_, processId: string, data: UpdateProcessDto) => {
  const db = getDatabase();
  const tx = db.transaction(() => {
    // 1. 工程データを更新
    const updatedProcess = updateProcess(processId, data);
    
    // 2. 関連するBPMN sync_stateを取得
    const syncState = getSyncState(updatedProcess.processTableId);
    
    // 3. BPMN XMLを再生成
    const newBpmnXml = regenerateBpmnXml(updatedProcess.processTableId);
    
    // 4. sync_stateを更新
    updateSyncState(syncState.id, {
      bpmnXml: newBpmnXml,
      lastModifiedBy: 'process',
      version: syncState.version + 1,
    });
    
    // 5. トランザクションログ
    logSyncTransaction({
      source: 'process',
      operation: 'update',
      entityId: processId,
      changes: { before: oldData, after: data },
    });
    
    return updatedProcess;
  });
  
  tx();
});
```

#### 4.1.3 同期状態取得

```typescript
// 現在の同期状態を取得
ipcMain.handle('bpmn:getSyncState', async (_, processTableId: string) => {
  const db = getDatabase();
  const state = db.prepare(`
    SELECT * FROM bpmn_sync_state WHERE process_table_id = ?
  `).get(processTableId);
  
  return state;
});
```

---

## 5. BPMN要素と工程表のマッピング

### 5.1 要素対応表

| BPMN要素 | 工程表カラム | 同期方向 | 備考 |
|----------|-------------|----------|------|
| `bpmn:task` | `processes.name` | ✅ 双方向 | タスク名 |
| `bpmn:task@id` | `processes.id` | ✅ 双方向 | UUID |
| `bpmn:lane` | `swimlanes.name` | ✅ 双方向 | スイムレーン |
| `bpmn:sequenceFlow` | `processes.next_process_ids` | ✅ 双方向 | 接続関係 |
| `bpmn:startEvent` | - | ⚠️ BPMN生成時 | 自動生成 |
| `bpmn:endEvent` | - | ⚠️ BPMN生成時 | 自動生成 |
| `bpmn:exclusiveGateway` | `processes.type='gateway'` | ✅ 双方向 | 分岐・合流 |
| `dc:Bounds` | `processes.bpmn_position` | ⚠️ BPMN→工程 | 位置情報 |

### 5.2 新規カラム追加

**processesテーブル拡張**:

```sql
ALTER TABLE processes ADD COLUMN bpmn_position TEXT;  -- JSON: {x, y, width, height}
ALTER TABLE processes ADD COLUMN bpmn_element_type TEXT;  -- 'task' | 'gateway' | 'event'
```

---

## 6. 競合解決戦略

### 6.1 競合検出

**楽観的ロック方式**:

```typescript
// 同期実行時にバージョンチェック
const currentVersion = getSyncState(processTableId).version;
if (currentVersion !== requestVersion) {
  throw new ConflictError('データが他のユーザーにより更新されています');
}
```

### 6.2 競合解決フロー

```
1. ユーザーがBPMN編集開始
   ├─ 現在のversion取得（例: v5）
   └─ ローカルで編集

2. 保存時にversion送信
   ├─ サーバー側のversionチェック
   │  ├─ v5 → OK（変更なし）
   │  └─ v6 → Conflict!
   │
3. Conflict発生時
   ├─ 最新データを取得
   ├─ ユーザーに通知
   │  「他の編集があります。最新版を取得しますか？」
   └─ 選択肢:
      ├─ 最新版を取得（編集破棄）
      ├─ マージ（差分適用）
      └─ 強制上書き（要確認）
```

### 6.3 自動マージ可能な変更

**非競合変更（自動マージ）**:
- 異なる工程の名前変更
- 異なるレーンの追加・削除
- 位置情報のみの変更

**競合変更（手動解決必要）**:
- 同一工程の名前変更
- 同一工程の接続関係変更
- 同一工程の削除

---

## 7. UI/UX設計

### 7.1 編集モード切り替え

**工程表詳細ページ > BPMNタブ**:

```tsx
<Tabs>
  <Tab key="bpmn-view" title="フロー図（表示）">
    <BpmnViewer processes={processes} />
  </Tab>
  <Tab key="bpmn-edit" title="フロー図（編集）">
    <BpmnEditor 
      processTableId={processTableId}
      onSave={handleBpmnSave}
      onConflict={handleConflict}
    />
  </Tab>
</Tabs>
```

### 7.2 同期インジケーター

```tsx
<div className="sync-indicator">
  {syncStatus === 'synced' && (
    <Chip color="success" size="sm">
      <CheckIcon /> 同期済み
    </Chip>
  )}
  {syncStatus === 'syncing' && (
    <Chip color="warning" size="sm">
      <ArrowPathIcon className="animate-spin" /> 同期中...
    </Chip>
  )}
  {syncStatus === 'conflict' && (
    <Chip color="danger" size="sm">
      <ExclamationTriangleIcon /> 競合あり
    </Chip>
  )}
</div>
```

### 7.3 競合解決ダイアログ

```tsx
<Modal isOpen={hasConflict}>
  <ModalHeader>編集競合が発生しました</ModalHeader>
  <ModalBody>
    <p>他のユーザーが工程表を更新しました。</p>
    <div className="conflict-details">
      <h4>あなたの変更:</h4>
      <pre>{JSON.stringify(yourChanges, null, 2)}</pre>
      
      <h4>他のユーザーの変更:</h4>
      <pre>{JSON.stringify(theirChanges, null, 2)}</pre>
    </div>
  </ModalBody>
  <ModalFooter>
    <Button onClick={refreshAndDiscard}>最新版を取得</Button>
    <Button onClick={attemptMerge}>マージを試行</Button>
    <Button onClick={forceOverwrite} color="danger">強制上書き</Button>
  </ModalFooter>
</Modal>
```

---

## 8. 実装フェーズ

### Phase 1: 基盤構築（Week 1-2）

- [x] 設計仕様策定
- [ ] データベーステーブル追加
- [ ] 基本的な同期エンジン実装
- [ ] IPC APIの骨格作成

### Phase 2: BPMN編集統合（Week 3-4）

- [ ] BpmnEditorコンポーネント統合
- [ ] BPMN → 工程表 同期実装
- [ ] 基本的な要素マッピング実装

### Phase 3: 双方向同期（Week 5-6）

- [ ] 工程表 → BPMN 自動更新実装
- [ ] リアルタイム同期機能
- [ ] WebSocket/Polling検討

### Phase 4: 競合解決（Week 7-8）

- [ ] 楽観的ロック実装
- [ ] 競合検出ロジック
- [ ] 自動マージ機能
- [ ] UI通知機能

### Phase 5: テスト・最適化（Week 9-10）

- [ ] 統合テスト
- [ ] パフォーマンス最適化
- [ ] エラーハンドリング強化
- [ ] ドキュメント整備

---

## 9. リスクと対策

### 9.1 技術的リスク

| リスク | 影響度 | 対策 |
|--------|--------|------|
| 複雑性の増加 | 高 | モジュール分離、単体テスト徹底 |
| パフォーマンス低下 | 中 | 差分同期、デバウンス処理 |
| データ整合性喪失 | 高 | トランザクション、ロールバック機構 |
| 競合頻発 | 中 | 楽観的ロック、自動マージ |

### 9.2 運用リスク

| リスク | 影響度 | 対策 |
|--------|--------|------|
| Phase 9との互換性 | 高 | 後方互換性維持、段階的移行 |
| ユーザー混乱 | 中 | チュートリアル、ヘルプ整備 |
| バグ増加 | 中 | テストカバレッジ向上 |

---

## 10. パフォーマンス最適化

### 10.1 差分同期

```typescript
// 全体再生成ではなく、変更差分のみを同期
function syncBpmnChanges(changes: BpmnChange[]) {
  const affectedProcessIds = changes.map(c => c.elementId);
  const processes = getProcessesByIds(affectedProcessIds);
  
  // 変更された工程のみ更新
  updateProcesses(processes);
  
  // BPMN XMLは必要な部分のみ書き換え
  patchBpmnXml(changes);
}
```

### 10.2 デバウンス処理

```typescript
// 連続した編集をまとめて同期
const debouncedSync = debounce((changes: BpmnChange[]) => {
  syncToProcessTable(changes);
}, 500);  // 500ms待機
```

### 10.3 バッチ更新

```typescript
// 複数の変更を1つのトランザクションで処理
db.transaction(() => {
  changes.forEach(change => {
    applyChange(change);
  });
  updateSyncState();
});
```

---

## 11. セキュリティ考慮事項

### 11.1 入力検証

```typescript
// BPMN XMLのバリデーション
function validateBpmnXml(xml: string): ValidationResult {
  // 1. XML形式チェック
  const doc = new DOMParser().parseFromString(xml, 'text/xml');
  if (doc.getElementsByTagName('parsererror').length > 0) {
    return { valid: false, error: 'Invalid XML format' };
  }
  
  // 2. BPMN 2.0スキーマ検証
  // 3. SQLインジェクション対策（ID検証）
  // 4. サイズ制限チェック（10MB以下）
  
  return { valid: true };
}
```

### 11.2 権限チェック

```typescript
// ユーザーが編集権限を持つか確認
async function checkEditPermission(userId: string, processTableId: string): Promise<boolean> {
  // 将来のマルチユーザー対応時に実装
  return true;
}
```

---

## 12. モニタリング・ログ

### 12.1 同期ログ

```typescript
logger.info('BpmnSync', 'Sync started', {
  processTableId,
  source: 'bpmn',
  changesCount: changes.length,
});

logger.info('BpmnSync', 'Sync completed', {
  processTableId,
  duration: Date.now() - startTime,
  updatedProcesses: result.updatedProcesses.length,
});

logger.error('BpmnSync', 'Conflict detected', {
  processTableId,
  expectedVersion: requestVersion,
  actualVersion: currentVersion,
});
```

### 12.2 メトリクス

- 同期実行回数
- 平均同期時間
- 競合発生率
- エラー率

---

## 13. 今後の拡張

### 13.1 リアルタイム協調編集

- WebSocketによる複数ユーザー同時編集
- カーソル位置の共有
- リアルタイム競合通知

### 13.2 変更履歴

- すべての同期トランザクションを記録
- タイムトラベルデバッグ
- 変更のロールバック機能

### 13.3 AI支援

- BPMNレイアウトの自動最適化
- 工程名の自動提案
- 接続関係の推論

---

## 14. まとめ

### 14.1 Phase 9.1の意義

**Phase 9の制約を解消**:
- ✅ BPMNを直接編集可能に
- ✅ 双方向同期で整合性を自動保証
- ✅ ビジュアルとデータの両方から編集可能

**Phase 9の利点を維持**:
- ✅ 工程表中心の設計原則
- ✅ 後方互換性の保持
- ✅ データの一貫性保証

### 14.2 開発優先順位

1. **最優先**: Phase 1-2（基盤とBPMN編集）
2. **高優先**: Phase 3（双方向同期）
3. **中優先**: Phase 4（競合解決）
4. **低優先**: Phase 5（最適化）

---

**変更履歴**:
- 2025-10-27: 初版作成（Phase 9.1設計仕様）
