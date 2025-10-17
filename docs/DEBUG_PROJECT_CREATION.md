# プロジェクト作成機能 診断レポート

**診断日時**: 2025年10月16日  
**状態**: 🔴 機能不全  
**優先度**: CRITICAL

---

## 🐛 発見した問題

### 1. IPC APIの名前不一致 ❌

**問題箇所**: `electron/preload.ts`

#### 修正前:
```typescript
project: {
  create: (data: any) => ipcRenderer.invoke('project:create', data),
  open: (projectId: string) => ipcRenderer.invoke('project:open', projectId),
  list: () => ipcRenderer.invoke('project:list'),  // ← 間違い
  update: (projectId: string, data: any) => ipcRenderer.invoke('project:update', projectId, data),
  delete: (projectId: string) => ipcRenderer.invoke('project:delete', projectId),
}
```

#### 修正後:
```typescript
project: {
  create: (data: any) => ipcRenderer.invoke('project:create', data),
  getAll: () => ipcRenderer.invoke('project:getAll'),  // ← 修正
  getById: (projectId: string) => ipcRenderer.invoke('project:getById', projectId),  // ← 追加
  update: (projectId: string, data: any) => ipcRenderer.invoke('project:update', projectId, data),
  delete: (projectId: string) => ipcRenderer.invoke('project:delete', projectId),
}
```

**影響**:
- フロントエンド (`ipc-helpers.ts`) は `api.project.getAll()` を呼び出す
- しかし preload.ts は `project.list` しか提供していなかった
- 結果: `window.electron.project.getAll is not a function` エラー

---

### 2. Process APIの不一致 ❌

#### 修正前:
```typescript
process: {
  create: (data: any) => ipcRenderer.invoke('process:create', data),
  update: (processId: string, data: any) => ipcRenderer.invoke('process:update', processId, data),
  delete: (processId: string) => ipcRenderer.invoke('process:delete', processId),
  list: (projectId: string) => ipcRenderer.invoke('process:list', projectId),  // ← 間違い
  getByLevel: (projectId: string, level: string) => ipcRenderer.invoke('process:getByLevel', projectId, level),
}
```

#### 修正後:
```typescript
process: {
  create: (data: any) => ipcRenderer.invoke('process:create', data),
  getByProject: (projectId: string) => ipcRenderer.invoke('process:getByProject', projectId),  // ← 修正
  getById: (processId: string) => ipcRenderer.invoke('process:getById', processId),  // ← 追加
  update: (processId: string, data: any) => ipcRenderer.invoke('process:update', processId, data),
  delete: (processId: string) => ipcRenderer.invoke('process:delete', processId),
}
```

---

### 3. BPMN APIの不完全 ❌

#### 修正前:
```typescript
bpmn: {
  create: (data: any) => ipcRenderer.invoke('bpmn:create', data),
  update: (bpmnId: string, xmlContent: string) => ipcRenderer.invoke('bpmn:update', bpmnId, xmlContent),
  load: (bpmnId: string) => ipcRenderer.invoke('bpmn:load', bpmnId),
  export: (bpmnId: string, format: string) => ipcRenderer.invoke('bpmn:export', bpmnId, format),
}
```

#### 修正後:
```typescript
bpmn: {
  create: (data: any) => ipcRenderer.invoke('bpmn:create', data),
  getByProject: (projectId: string) => ipcRenderer.invoke('bpmn:getByProject', projectId),  // ← 追加
  getById: (bpmnId: string) => ipcRenderer.invoke('bpmn:getById', bpmnId),  // ← 追加
  update: (bpmnId: string, data: any) => ipcRenderer.invoke('bpmn:update', bpmnId, data),  // ← 修正
  delete: (bpmnId: string) => ipcRenderer.invoke('bpmn:delete', bpmnId),  // ← 追加
  export: (bpmnId: string, format: string) => ipcRenderer.invoke('bpmn:export', bpmnId, format),
}
```

---

### 4. Manual APIの不一致 ❌

#### 修正前:
```typescript
manual: {
  create: (projectId: string, title: string, options: any) =>  // ← 引数が違う
    ipcRenderer.invoke('manual:create', projectId, title, options),
  // ...
  list: (projectId: string) => ipcRenderer.invoke('manual:list', projectId),  // ← 間違い
}
```

#### 修正後:
```typescript
manual: {
  create: (data: any) =>  // ← 統一
    ipcRenderer.invoke('manual:create', data),
  getByProject: (projectId: string) =>  // ← 修正
    ipcRenderer.invoke('manual:getByProject', projectId),
  getById: (manualId: string) =>  // ← 追加
    ipcRenderer.invoke('manual:getById', manualId),
  // ...
}
```

---

## 🔍 根本原因分析

### なぜこの問題が起きたか？

1. **命名規則の不統一**
   - Backend handler: `project:getAll`, `process:getByProject`
   - Preload (旧): `project.list`, `process.list`
   - Frontend: `api.project.getAll()`, `api.process.getByProject()`
   
2. **レイヤー間の連携不足**
   - IPC handlers が正しく実装されている
   - Frontend が正しく呼び出している
   - しかし中間の preload.ts が間違った名前でマッピングしていた

3. **型定義の不足**
   - preload.ts の api オブジェクトに厳密な型定義がない
   - TypeScript がエラーを検出できなかった

---

## ✅ 実施した修正

### ファイル: `electron/preload.ts`

1. **Project API**
   - `list` → `getAll` に変更
   - `getById` を追加

2. **Process API**
   - `list` → `getByProject` に変更
   - `getById` を追加
   - `getByLevel` を削除（未実装のため）

3. **BPMN API**
   - `getByProject` を追加
   - `getById` を追加
   - `delete` を追加
   - `update` の引数を統一

4. **Manual API**
   - `create` の引数を統一
   - `list` → `getByProject` に変更
   - `getById` を追加
   - `generateFromProcesses` の引数を統一
   - `syncFromProcesses` を削除（未使用）

---

## 🧪 検証計画

### 1. ビルド後のテスト
- [ ] EXEを起動し DevTools でコンソール確認
- [ ] プロジェクト一覧が読み込まれるか確認
- [ ] 新規プロジェクト作成ボタンをクリック
- [ ] IPC通信のエラーがないか確認
- [ ] データベースに正常に保存されるか確認

### 2. 確認すべきエラー
- `window.electron.project.getAll is not a function` ← 修正されたはず
- `window.electron.project.create is not a function` ← これが残っていれば別の問題
- データベース接続エラー
- フォルダ作成エラー

---

## 📊 影響範囲

### 直接影響
- ✅ プロジェクト一覧の読み込み
- ✅ プロジェクトの作成
- ✅ プロジェクトの削除
- ✅ 工程一覧の読み込み
- ✅ BPMN一覧の読み込み
- ✅ マニュアル一覧の読み込み

### 間接影響
- ✅ すべての詳細ページ（プロジェクトIDベース）
- ✅ Trinity同期機能
- ✅ バージョン管理機能

---

## 🎯 次のステップ

1. **ビルド完了を待つ** (現在進行中)
2. **DevTools付きEXEを起動**
3. **コンソールエラーを確認**
4. **プロジェクト作成を実際に試す**
5. **成功すれば DevTools を無効化**
6. **最終本番ビルド**

---

## 📝 学んだこと

### 防止策
1. **型定義の強化**: preload.ts に厳密な型定義を追加
2. **自動テスト**: IPC通信の単体テストを追加
3. **命名規則の統一**: すべてのリソースで `getAll`, `getById`, `getByProject` を使用
4. **ドキュメント**: IPC APIのリファレンスドキュメントを作成

### ベストプラクティス
```typescript
// ✅ 良い例: 統一された命名
project.getAll()
project.getById(id)
process.getByProject(projectId)

// ❌ 悪い例: 一貫性のない命名
project.list()
project.open(id)
process.list(projectId)
```
