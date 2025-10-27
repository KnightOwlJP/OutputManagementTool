# Output Management Tool - 開発引き継ぎ資料

**作成日**: 2025年10月24日  
**対象者**: 後任開発者・保守担当者

---

## 目次
1. [プロジェクト概要](#1-プロジェクト概要)
2. [開発環境セットアップ](#2-開発環境セットアップ)
3. [アーキテクチャ理解](#3-アーキテクチャ理解)
4. [開発ワークフロー](#4-開発ワークフロー)
5. [重要な設計判断](#5-重要な設計判断)
6. [トラブルシューティング](#6-トラブルシューティング)
7. [今後の開発方針](#7-今後の開発方針)

---

## 1. プロジェクト概要

### 1.1 プロジェクトの目的

**工程表を中心とした業務プロセス管理ツール**

- 工程表からBPMNフロー図とマニュアルを自動生成
- BPMN 2.0準拠のフロー図をXMLエクスポート
- Markdownベースのマニュアル編集

### 1.2 Phase 9の重要な変更点

**Phase 8からPhase 9への大きな変更**:

| 項目 | Phase 8（旧） | Phase 9（現在） |
|------|--------------|----------------|
| アーキテクチャ | Trinity Sync（3者同期） | ProcessTable中心（自動生成） |
| 工程表構造 | 階層構造 | フラット構造 |
| BPMN作成 | 手動作成可能 | 工程表から自動生成のみ |
| マニュアル作成 | セクション管理あり | 単一Markdownコンテンツ |
| 同期機能 | 双方向同期 | 一方向（工程表→BPMN/Manual） |

**なぜPhase 9に変更したのか**:
- Trinity Syncの複雑性によるバグが多発
- 3者間の整合性維持が困難
- シンプルな「工程表中心」アーキテクチャで保守性向上

---

## 2. 開発環境セットアップ

### 2.1 必要なツール

```bash
# Node.js（LTS推奨）
node --version  # v20.x以上

# npm
npm --version   # 10.x以上

# Git
git --version
```

### 2.2 初回セットアップ

```bash
# リポジトリクローン
git clone <repository-url>
cd output-management-tool

# 依存関係インストール
npm install

# 開発サーバー起動（確認用）
npm run dev
```

### 2.3 開発用コマンド

```bash
# Next.js開発サーバー（ブラウザ確認用）
npm run dev

# Electron開発モード（実機確認用）
npm run electron:dev

# 型チェック
npm run type-check

# ビルド（Next.js静的出力）
npm run build:next

# Windowsインストーラー作成
npm run build:win
```

### 2.4 推奨VS Code拡張機能

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-typescript-next",
    "eamodio.gitlens",
    "orta.vscode-jest"
  ]
}
```

---

## 3. アーキテクチャ理解

### 3.1 プロジェクト構造

```
output-management-tool/
├── electron/              # Electronメインプロセス
│   ├── main.ts           # エントリーポイント
│   ├── preload.ts        # IPCブリッジ
│   ├── ipc/              # IPCハンドラー
│   │   ├── project.handlers.ts
│   │   ├── processTable.handlers.ts
│   │   ├── process.handlers.ts
│   │   ├── bpmn.handlers.ts
│   │   └── manual.handlers.ts
│   └── utils/
│       ├── database.ts   # SQLite初期化
│       └── logger.ts     # ログ管理
├── src/                  # Next.jsアプリ
│   ├── app/             # ページ（App Router）
│   ├── components/      # Reactコンポーネント
│   ├── lib/             # ユーティリティ
│   ├── stores/          # Zustand状態管理
│   ├── contexts/        # Reactコンテキスト
│   └── types/           # TypeScript型定義
├── docs/                # ドキュメント
├── public/              # 静的ファイル
└── out/                 # ビルド出力（静的HTML）
```

### 3.2 データフロー

```
┌─────────────────┐
│ ユーザー操作     │
│ (React UI)      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ IPC通信          │
│ (preload.ts)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ IPC Handlers    │
│ (*.handlers.ts) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ SQLite DB       │
│ (better-sqlite3)│
└─────────────────┘
```

### 3.3 重要なファイル

#### 3.3.1 electron/main.ts
- Electronアプリのエントリーポイント
- BrowserWindow作成
- IPCハンドラー登録
- データベース初期化

#### 3.3.2 electron/preload.ts
- RendererプロセスにAPIを公開
- `window.electronAPI`として利用可能
- contextBridgeでセキュアに公開

#### 3.3.3 src/lib/ipc-helpers.ts
- IPC呼び出しをラップ
- エラーハンドリングを統一
- 型安全な関数を提供

#### 3.3.4 src/types/electron.d.ts
- ElectronAPIの型定義
- Window拡張の型定義
- DTO（Data Transfer Object）の型定義

---

## 4. 開発ワークフロー

### 4.1 新機能追加の流れ

#### ステップ1: 型定義
```typescript
// src/types/electron.d.ts
export interface ElectronAPI {
  newFeature: {
    create: (data: CreateNewFeatureDto) => Promise<NewFeature>;
    getAll: () => Promise<NewFeature[]>;
  };
}

export interface CreateNewFeatureDto {
  name: string;
  description?: string;
}
```

#### ステップ2: データベースマイグレーション
```typescript
// electron/utils/database.ts
db.exec(`
  CREATE TABLE IF NOT EXISTS new_features (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_at INTEGER NOT NULL
  )
`);
```

#### ステップ3: IPCハンドラー実装
```typescript
// electron/ipc/newFeature.handlers.ts
import { ipcMain } from 'electron';
import { getDatabase } from '../utils/database';

export function registerNewFeatureHandlers() {
  ipcMain.handle('newFeature:create', async (_, data) => {
    const db = getDatabase();
    const id = uuidv4();
    const now = Date.now();
    
    db.prepare(`
      INSERT INTO new_features (id, name, description, created_at)
      VALUES (?, ?, ?, ?)
    `).run(id, data.name, data.description, now);
    
    return { id, ...data, createdAt: now };
  });
}
```

#### ステップ4: preload.ts登録
```typescript
// electron/preload.ts
const api = {
  // ... 既存のAPI
  newFeature: {
    create: (data: any) => ipcRenderer.invoke('newFeature:create', data),
    getAll: () => ipcRenderer.invoke('newFeature:getAll'),
  },
};
```

#### ステップ5: main.ts登録
```typescript
// electron/main.ts
import { registerNewFeatureHandlers } from './ipc/newFeature.handlers';

app.whenReady().then(() => {
  // ... 既存の登録
  registerNewFeatureHandlers();
});
```

#### ステップ6: IPCヘルパー作成
```typescript
// src/lib/ipc-helpers.ts
export const newFeatureIPC = {
  async create(data: CreateNewFeatureDto) {
    const api = getElectronAPI();
    return safeIpcCall(
      () => api.newFeature.create(data),
      '新機能の作成に失敗しました'
    );
  },
};
```

#### ステップ7: UIコンポーネント実装
```typescript
// src/components/newFeature/NewFeatureForm.tsx
import { newFeatureIPC } from '@/lib/ipc-helpers';

export function NewFeatureForm() {
  const handleSubmit = async (data) => {
    const { data: result, error } = await newFeatureIPC.create(data);
    if (error) {
      showToast('error', error);
    } else {
      showToast('success', '作成しました');
    }
  };
  
  return <form onSubmit={handleSubmit}>...</form>;
}
```

### 4.2 バグ修正の流れ

1. **再現手順を確認**
   - ユーザーからの報告を詳細に記録
   - 開発環境で再現

2. **ログを確認**
   - `userData/logs/`ディレクトリ
   - Console出力（DevTools）

3. **デバッグ**
   ```typescript
   // Main Process
   console.log('[IPC] Debug:', data);
   
   // Renderer Process
   console.log('[Component] State:', state);
   ```

4. **修正＆テスト**
   - 単体テスト追加
   - 手動テスト実施

5. **リリース**
   - バージョン番号更新（package.json）
   - CHANGELOGに記載
   - ビルド＆配布

### 4.3 コードレビューのポイント

- [ ] 型安全性（any型の使用を避ける）
- [ ] エラーハンドリング（try-catchとtoast表示）
- [ ] SQLインジェクション対策（プリペアドステートメント）
- [ ] パフォーマンス（不要な再レンダリング）
- [ ] メモリリーク（useEffectのクリーンアップ）
- [ ] ログ出力（重要な操作は記録）

---

## 5. 重要な設計判断

### 5.1 なぜNext.jsを使うのか？

**理由**:
- Reactエコシステムの活用
- TypeScriptとの統合
- 静的エクスポート機能（Electronに最適）
- ファイルベースルーティング

**制約**:
- SSR/ISRは使用不可（静的エクスポート）
- API Routesは使用不可（Electronで代替）

### 5.2 なぜbetter-sqlite3を選んだのか？

**理由**:
- 同期APIで扱いやすい
- トランザクション性能が高い
- Node.jsネイティブバインディング
- Electronとの相性が良い

**代替案との比較**:
- ❌ sqlite3: 非同期のみで複雑
- ❌ TypeORM: オーバースペック
- ✅ better-sqlite3: シンプルで高速

### 5.3 なぜBPMNとマニュアルを自動生成にしたのか？

**Phase 8の問題点**:
- BPMN↔工程表↔マニュアルの3者同期が複雑
- 整合性が崩れるバグが頻発
- 保守コストが高い

**Phase 9の解決策**:
- 工程表が唯一のデータソース
- BPMNとマニュアルは読み取り専用ビュー
- シンプルで整合性が保証される

### 5.4 なぜスイムレーンとステップを分けたのか？

**設計意図**:
- **スイムレーン**: 責任部署（誰が）
- **ステップ**: 時系列の区切り（いつ）

**BPMN表示**:
```
┌──────────────────────────────────┐
│ スイムレーン: 営業部               │
├──────────────────────────────────┤
│ [ステップ1] 受注 → 見積 → 契約    │
│ [ステップ2] 納品準備              │
└──────────────────────────────────┘
┌──────────────────────────────────┐
│ スイムレーン: 経理部               │
├──────────────────────────────────┤
│ [ステップ1] 請求書発行            │
│ [ステップ2] 入金確認              │
└──────────────────────────────────┘
```

---

## 6. トラブルシューティング

### 6.1 よくある問題と解決法

#### 問題1: ビルドエラー「Module not found」

**原因**: 型定義ファイルの不整合

**解決法**:
```bash
# node_modules削除
rm -rf node_modules package-lock.json

# 再インストール
npm install

# 型チェック
npm run type-check
```

#### 問題2: Electronアプリが起動しない

**原因**: データベース初期化エラー

**解決法**:
```bash
# userData削除（Mac/Linux）
rm -rf ~/Library/Application\ Support/output-management-tool

# userData削除（Windows）
rmdir /s %APPDATA%\output-management-tool

# 再起動
npm run electron:dev
```

#### 問題3: BPMNが表示されない

**原因**: XMLフォーマットエラー

**デバッグ**:
```typescript
// src/lib/bpmn-generator.ts
console.log('[BPMN] Generated XML:', xmlContent);

// XMLバリデーション
const parser = new DOMParser();
const doc = parser.parseFromString(xmlContent, 'text/xml');
const errors = doc.getElementsByTagName('parsererror');
if (errors.length > 0) {
  console.error('[BPMN] XML Parse Error:', errors[0].textContent);
}
```

#### 問題4: IPC通信がタイムアウト

**原因**: 長時間処理のブロッキング

**解決法**:
```typescript
// 非同期処理に変更
ipcMain.handle('heavy:operation', async (_, data) => {
  // 長時間処理
  const result = await processHeavyTask(data);
  return result;
});

// プログレス通知
ipcMain.handle('heavy:operation', async (event, data) => {
  for (let i = 0; i < 100; i++) {
    event.sender.send('progress', i);
    await processChunk(i);
  }
});
```

### 6.2 デバッグツール

#### Chrome DevTools（Renderer Process）
```typescript
// main.ts
if (isDev) {
  mainWindow.webContents.openDevTools();
}
```

#### Main Processのデバッグ
```bash
# VSCode launch.json
{
  "type": "node",
  "request": "launch",
  "name": "Electron Main",
  "runtimeExecutable": "${workspaceFolder}/node_modules/.bin/electron",
  "program": "${workspaceFolder}/electron/main.js",
  "skipFiles": ["<node_internals>/**"]
}
```

#### SQLiteデバッグ
```bash
# DB Browser for SQLiteを使用
# ファイル: %APPDATA%/output-management-tool/database.db
```

---

## 7. 今後の開発方針

### 7.1 短期（3ヶ月）

#### 優先度: 高
- [ ] マニュアルのHTML/PDFエクスポート
- [ ] バージョン比較機能の実装
- [ ] Excel一括インポート機能

#### 優先度: 中
- [ ] 工程のコピー&ペースト
- [ ] 検索・フィルタ機能の強化
- [ ] ダークモード対応

### 7.2 中期（6ヶ月）

- [ ] カスタムレポート機能
- [ ] データ分析ダッシュボード
- [ ] プロジェクトテンプレート機能
- [ ] 複数プロジェクト間のデータコピー

### 7.3 長期（1年）

- [ ] マルチユーザー対応（クラウド同期）
- [ ] Web版の提供
- [ ] モバイルアプリ（閲覧のみ）
- [ ] AI支援機能（工程提案、マニュアル自動生成）

### 7.4 技術的負債

#### 現在の負債
1. **CustomColumnManagerコンポーネント**
   - インポートパスエラーが残っている
   - `@/types/models`の整理が必要

2. **project-settings/page.tsx**
   - 型定義の不整合
   - リファクタリングが必要

3. **document-sync.ts**
   - Phase 8の遺物
   - 完全に削除すべき（現在はコメントアウト）

#### 対応計画
```typescript
// TODO: Phase 9.1で対応
// - CustomColumnManager リファクタリング
// - project-settings 型定義修正
// - document-sync.ts 完全削除
```

---

## 8. チーム体制と連絡先

### 8.1 推奨チーム構成

- **テックリード**: アーキテクチャ決定、コードレビュー
- **バックエンド開発**: IPC Handlers、データベース設計
- **フロントエンド開発**: Reactコンポーネント、UI/UX
- **QA**: テスト計画、バグ検証

### 8.2 ドキュメント

- 要件定義書: `docs/REQUIREMENTS.md`
- 技術仕様書: `docs/TECHNICAL_SPECIFICATION.md`
- API仕様: `docs/V2_SPECIFICATION.md`
- Phase変更履歴: `docs/CHANGE_SUMMARY_*.md`

### 8.3 開発ルール

#### コミットメッセージ
```
[種類] 概要

詳細説明

種類:
- feat: 新機能
- fix: バグ修正
- refactor: リファクタリング
- docs: ドキュメント
- test: テスト追加
- chore: その他

例:
[feat] マニュアルPDFエクスポート機能を追加

- puppeteerを使用してPDF生成
- ページ区切りを自動調整
- 目次を自動生成
```

#### ブランチ戦略
```
main        - 本番リリース
develop     - 開発ブランチ
feature/*   - 新機能開発
bugfix/*    - バグ修正
hotfix/*    - 緊急修正
```

---

## 9. よくある質問（FAQ）

### Q1: Phase 8のコードは完全に削除していいか？

**A**: 基本的には削除推奨だが、以下は残す:
- `docs/archive/`のドキュメント（参考用）
- `document-sync.ts`（コメントアウト状態で一時保管）

### Q2: 新しいBPMN要素タイプを追加するには？

**A**: 以下の3箇所を更新:
1. `src/types/electron.d.ts` - 型定義
2. `src/lib/bpmn-generator.ts` - XML生成ロジック
3. `src/components/processTable/ProcessFormModal.tsx` - UI選択肢

### Q3: データベーススキーマを変更するには？

**A**: マイグレーション機能は未実装のため、手動対応:
1. `electron/utils/database.ts`でテーブル定義更新
2. 既存データの変換SQLを実行
3. バージョン番号を更新
4. CHANGELOGに記載

### Q4: パフォーマンスが悪い場合は？

**A**: チェックリスト:
- [ ] SQLインデックスは適切か？
- [ ] React.memo/useMemoは使用しているか？
- [ ] 不要な再レンダリングはないか？
- [ ] データベーストランザクションは使用しているか？
- [ ] BPMN描画のビューポート最適化は有効か？

---

## 10. 最後に

### 開発を引き継ぐ方へ

このツールは**Phase 9アーキテクチャ**で大幅にシンプル化されました。

**覚えておくべき3つのポイント**:

1. **工程表が中心**: すべてはProcessTableから始まる
2. **自動生成**: BPMNとマニュアルは手動作成不可
3. **型安全性**: TypeScriptを最大限活用

**困ったときは**:
- `docs/`のドキュメントを読む
- ログファイルを確認する
- 既存コードをパターンとして参考にする

良い開発を！🚀

---

**更新履歴**:
- 2025-10-24: 初版作成（Phase 9対応）
