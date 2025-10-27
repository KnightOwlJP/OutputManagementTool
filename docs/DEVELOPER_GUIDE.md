# Output Management Tool - 開発者ガイド

**バージョン**: 2.0.0  
**最終更新**: 2025年10月21日  
**Phase**: V2.0.0（フェーズ2完了、バックエンドAPI実装完了）

---

## 📖 目次

1. [開発環境セットアップ](#開発環境セットアップ)
2. [プロジェクト構造](#プロジェクト構造)
3. [開発ワークフロー](#開発ワークフロー)
4. [ビルド手順](#ビルド手順)
5. [テストガイド](#テストガイド)
6. [デバッグ方法](#デバッグ方法)
7. [コーディング規約](#コーディング規約)
8. [リリースプロセス](#リリースプロセス)
9. [トラブルシューティング](#トラブルシューティング)

---

## 開発環境セットアップ

### 必要なツール

- **Node.js**: 18.x以上
- **npm**: 9.x以上
- **Git**: 2.x以上
- **Visual Studio Code**: 推奨エディタ
- **PowerShell**: Windows用ビルドスクリプト実行

### セットアップ手順

```bash
# 1. リポジトリをクローン
git clone https://github.com/KnightOwlJP/OutputManagementTool.git
cd OutputManagementTool

# 2. 依存パッケージをインストール
npm install

# 3. 開発サーバーを起動
npm run dev:electron

# 4. ビルド（Electronアプリ）
npm run build:electron

# 5. Windowsインストーラー作成
npm run build:win
```

### 開発用スクリプト

| コマンド | 説明 |
|---------|------|
| `npm run dev` | Next.js開発サーバー起動 |
| `npm run dev:electron` | Electron + Next.js開発モード |
| `npm run build` | Next.jsビルド |
| `npm run build:electron` | TypeScript → JavaScript（Electron） |
| `npm run build:win` | Windows EXEビルド |
| `npm run clean` | ビルド成果物の削除 |
| `npm run rebuild:sqlite` | SQLiteネイティブモジュールのリビルド |
| `npm run lint` | ESLintチェック |

---

## プロジェクト構造

```
output-management-tool/
├── electron/                # Electronメインプロセス
│   ├── main.ts             # エントリーポイント
│   ├── preload.ts          # プリロードスクリプト
│   ├── database/           # SQLiteデータベース
│   │   └── migrations/     # マイグレーションSQL
│   ├── ipc/                # IPCハンドラー
│   │   ├── project.handlers.ts    # プロジェクト管理
│   │   ├── process.handlers.ts    # 工程管理
│   │   ├── bpmn.handlers.ts       # BPMN管理
│   │   ├── manual.handlers.ts     # マニュアル管理
│   │   ├── trinity.handlers.ts    # 三位一体同期
│   │   └── sync.handlers.ts       # 同期処理
│   └── utils/              # ユーティリティ
│       ├── database.ts     # データベース操作
│       └── logger.ts       # ログ出力
├── src/                    # Next.jsフロントエンド
│   ├── app/                # App Router
│   │   ├── layout.tsx      # ルートレイアウト
│   │   ├── page.tsx        # ホームページ
│   │   ├── projects/       # プロジェクト関連ページ
│   │   │   └── [id]/       # 動的ルート
│   │   │       ├── hierarchy/     # 階層管理ページ
│   │   │       ├── trinity/       # 三位一体ページ
│   │   │       └── versions/      # バージョン管理
│   │   ├── settings/       # 設定ページ
│   │   └── manual/         # マニュアルページ
│   ├── components/         # Reactコンポーネント
│   │   ├── hierarchy/      # 階層管理コンポーネント
│   │   ├── process/        # 工程管理コンポーネント
│   │   ├── bpmn/           # BPMNエディタコンポーネント
│   │   ├── manual/         # マニュアルコンポーネント
│   │   └── ui/             # 共通UIコンポーネント
│   ├── lib/                # ライブラリ
│   │   └── ipc-helpers.ts  # IPC通信ヘルパー
│   └── types/              # TypeScript型定義
│       ├── project.types.ts       # プロジェクト型
│       └── electron.d.ts          # Electron API型
├── docs/                   # ドキュメント
│   ├── SYSTEM_ARCHITECTURE.md     # システムアーキテクチャ
│   ├── requirements.md            # 要件定義書
│   ├── DEVELOPER_GUIDE.md         # 開発者ガイド（本ファイル）
│   ├── USER_GUIDE.md              # ユーザーガイド
│   ├── REFACTORING_TODO.md        # リファクタリングToDo
│   └── TODO.md                    # 開発ToDo
├── public/                 # 静的ファイル
│   └── icons/              # アイコン
├── package.json            # パッケージ定義
├── tsconfig.json           # TypeScript設定
├── next.config.ts          # Next.js設定
├── electron-builder.yml    # ビルド設定
├── tailwind.config.ts      # Tailwind CSS設定
└── eslint.config.mjs       # ESLint設定
```

---

## 開発ワークフロー

### ブランチ戦略

```
main        # 本番リリース用
  └─ dev    # 開発用ブランチ
      ├─ feature/xxx  # 機能実装
      ├─ fix/xxx      # バグ修正
      ├─ docs/xxx     # ドキュメント更新
      └─ refactor/xxx # リファクタリング
```

### コミットメッセージ規約

```
feat: 新機能追加
fix: バグ修正
docs: ドキュメント更新
style: コードスタイル変更（機能変更なし）
refactor: リファクタリング
test: テスト追加・修正
chore: ビルド設定等の変更
perf: パフォーマンス改善
```

**例**:
```
feat: 詳細工程のレベルマッピング修正（detail→null）
fix: BPMN同期時のエラーハンドリング改善
docs: SYSTEM_ARCHITECTURE.mdに1対1対応ルール追加
refactor: process.handlers.tsのコード整理
```

### プルリクエストフロー

1. **Issue作成**: 作業内容を明確化
2. **ブランチ作成**: `feature/issue-123`形式
3. **実装・コミット**: 小さな単位でコミット
4. **プルリクエスト作成**: 変更内容の説明
5. **コードレビュー**: レビュアーによるチェック
6. **マージ**: `main`または`dev`にマージ

---

## ビルド手順

### クイックスタート

#### PowerShellスクリプト（最も簡単）

```powershell
# プロジェクトフォルダを開く
cd C:\Users\Knigh\dev\project\output-management-tool

# ビルドスクリプトを実行
.\build-exe.ps1
```

#### npmコマンド

```bash
npm run build:win
```

### 詳細なビルド手順

#### 1. 事前準備

```bash
# 依存関係のインストール（初回のみ）
npm install

# キャッシュのクリア（推奨）
npm cache clean --force
npm run clean
```

#### 2. ビルド実行

```bash
# 開発ビルド（デバッグ用）
npm run dev:electron

# 本番ビルド（配布用）
npm run build:win
```

**ビルドプロセス**:
1. Next.jsの静的エクスポート（`next build`）
2. Electronメインプロセスのコンパイル（TypeScript → JavaScript）
3. SQLiteネイティブモジュールのリビルド
4. Electron Builderによる.exe生成

#### 3. 出力ファイル

ビルドが完了すると、`dist/` フォルダに以下のファイルが生成されます：

```
dist/
├── Output Management Tool-0.1.0-x64.exe      # インストーラー（NSIS）
├── win-unpacked/                              # 実行可能ファイル（ポータブル版）
│   └── Output Management Tool.exe
└── builder-debug.yml                          # デバッグ情報
```

### ビルド最適化

#### 実装済みの最適化

1. **不要ファイルの除外**
   - README、CHANGELOG、テストファイル
   - TypeScript定義ファイル（.d.ts）
   - 開発用設定ファイル

2. **圧縮レベル最大化**
   - `compression: "maximum"`
   - ファイルサイズを最小化

3. **ネイティブモジュールの最適化**
   - better-sqlite3は必要に応じてasarから除外
   - nodeGypRebuild無効化

4. **不要なパッケージスクリプト削除**
   - `removePackageScripts: true`

#### サイズの目安

| コンポーネント | サイズ |
|---------------|--------|
| Electron本体 | ~80-100MB |
| Next.js静的ファイル | ~5-10MB |
| Node modules（必要なもののみ） | ~20-30MB |
| アプリケーションコード | ~2-5MB |
| **合計（圧縮後）** | **約60-80MB** |

### さらなる軽量化（オプション）

#### 方法1: 開発依存関係の除外

```bash
npm prune --production
npm run build:win
npm install  # 開発依存関係を再インストール
```

#### 方法2: asar圧縮の最適化

```json
{
  "asar": true,
  "asarUnpack": [
    "**/node_modules/better-sqlite3/**/*"
  ]
}
```

---

## テストガイド

### 実装状況

| テスト種別 | 進捗 | 状態 |
|-----------|------|------|
| 単体テスト | 70% | 🟡 部分実装 |
| 統合テスト | 50% | 🟡 部分実装 |
| E2Eテスト | 0% | ❌ 未実装 |
| 手動テスト | 100% | ✅ 完了 |

### 手動テスト

#### V2.0.0機能のテスト

**基本フロー**:

1. **プロジェクト作成**
   - 新規プロジェクト作成
   - プロジェクト情報編集
   - プロジェクト削除

2. **ProcessTable管理**
   - ProcessTable作成
   - Swimlane/Step追加
   - Process作成・編集
   - nextProcessIds設定

3. **BPMN統合**
   - BPMN XML生成
   - 工程表⇔BPMN同期
   - DataObject統合
   - カスタム列JSON統合

4. **BPMN編集**
   - BPMN要素配置
   - プロパティ編集
   - 保存・読み込み
   - 工程との同期確認

5. **三位一体同期**
   - Full Sync実行
   - Auto Sync有効化
   - 同期状態の確認
   - エラーハンドリング

#### マイグレーション実行確認

```bash
# 1. アプリケーションを起動
npm run dev:electron

# 2. コンソールログで確認:
[Database] Running migration 006_hierarchical_refactoring...
[Database] Migration 006 completed successfully

# 3. データベースファイルを確認 (SQLiteツール使用)
# ファイル: C:\Users\<User>\AppData\Roaming\output-management-tool\database.db
```

**確認項目**:
- [ ] `processes`テーブルに`detail_table_id`カラムが追加
- [ ] `processes`テーブルに`parent_entity_id`カラムが追加
- [ ] `bpmn_diagrams`テーブルに同様のカラムが追加
- [ ] `manuals`テーブルに同様のカラムが追加
- [ ] インデックスが作成されている
- [ ] 既存データが保持されている

### 自動テスト（今後実装予定）

```bash
# 単体テスト
npm run test

# E2Eテスト
npm run test:e2e

# カバレッジ
npm run test:coverage
```

---

## デバッグ方法

### Electronメインプロセス

```typescript
// electron/main.ts or electron/ipc/*.handlers.ts
console.log('[Main] デバッグメッセージ');
```

コンソール出力はターミナルに表示されます。

### Electronレンダラープロセス

開発者ツールを開く:
- Windows/Linux: `Ctrl + Shift + I`
- macOS: `Cmd + Option + I`

```typescript
// src/components/xxx.tsx
console.log('[Renderer] デバッグメッセージ');
```

### IPC通信デバッグ

```typescript
// electron/ipc/process.handlers.ts
ipcMain.handle('process:create', async (_, data: CreateProcessDto) => {
  console.log('[IPC] process:create called with:', data);
  try {
    const result = await createProcess(data);
    console.log('[IPC] process:create result:', result);
    return result;
  } catch (error) {
    console.error('[IPC] process:create error:', error);
    throw error;
  }
});
```

### データベースデバッグ

```typescript
// electron/utils/database.ts
const stmt = db.prepare('SELECT * FROM processes WHERE id = ?');
console.log('[DB] Query:', stmt.source);
const result = stmt.get(processId);
console.log('[DB] Result:', result);
```

### VSCode デバッグ設定

`.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Electron Main",
      "type": "node",
      "request": "launch",
      "cwd": "${workspaceFolder}",
      "runtimeExecutable": "${workspaceFolder}/node_modules/.bin/electron",
      "runtimeArgs": [".", "--remote-debugging-port=9223"],
      "outputCapture": "std"
    },
    {
      "name": "Next.js: debug server-side",
      "type": "node-terminal",
      "request": "launch",
      "command": "npm run dev"
    }
  ]
}
```

### パフォーマンス計測

```typescript
console.time('operation');
// ... 処理 ...
console.timeEnd('operation');
```

---

## コーディング規約

### TypeScript

- **strict mode**: 有効化必須
- **明示的な型注釈**: 推奨（型推論に頼りすぎない）
- **any型**: 極力避ける（unknownを使用）
- **null vs undefined**: 
  - `null`: 明示的な不在
  - `undefined`: デフォルト値・未初期化
- **Optional Chaining**: 積極的に使用（`?.`）
- **Nullish Coalescing**: 積極的に使用（`??`）

**例**:
```typescript
// Good
interface Process {
  id: string;
  name: string;
  parentId?: string | null;
}

function getProcess(id: string): Process | null {
  const result = db.prepare('SELECT * FROM processes WHERE id = ?').get(id);
  return result ?? null;
}

// Bad
function getProcess(id: any): any {
  return db.prepare('SELECT * FROM processes WHERE id = ?').get(id);
}
```

### React

- **関数コンポーネント**: 必須（クラスコンポーネント禁止）
- **Hooks**: useState, useEffect, useCallback等を適切に使用
- **React.memo**: 不要な再レンダリング防止に使用
- **useCallback/useMemo**: パフォーマンス最適化に使用
- **PropTypes**: 不要（TypeScriptで型定義）

**例**:
```typescript
// Good
interface ProcessCardProps {
  process: Process;
  onUpdate: (process: Process) => void;
}

export const ProcessCard = React.memo<ProcessCardProps>(({ process, onUpdate }) => {
  const handleUpdate = useCallback(() => {
    onUpdate(process);
  }, [process, onUpdate]);

  return <Card onClick={handleUpdate}>{process.name}</Card>;
});

// Bad
export function ProcessCard(props: any) {
  return <Card onClick={() => props.onUpdate(props.process)}>{props.process.name}</Card>;
}
```

### データベース

- **プリペアドステートメント**: 必須（SQL Injection対策）
- **トランザクション**: 複数操作は必ずトランザクション内で
- **インデックス**: 頻繁に検索するカラムに設定
- **エラーハンドリング**: try-catchで適切に処理

**例**:
```typescript
// Good
function createProcess(data: CreateProcessDto): Process {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO processes (id, project_id, name, level)
    VALUES (?, ?, ?, ?)
  `);
  
  const tx = db.transaction(() => {
    stmt.run(data.id, data.projectId, data.name, data.level);
    // その他の操作...
  });
  
  tx();
  return getProcess(data.id)!;
}

// Bad
function createProcess(data: any) {
  db.exec(`INSERT INTO processes VALUES ('${data.id}', '${data.name}')`);
}
```

### ファイル命名規則

- **コンポーネント**: PascalCase（`ProcessCard.tsx`）
- **ユーティリティ**: camelCase（`ipc-helpers.ts`）
- **型定義**: PascalCase + `.types.ts`（`project.types.ts`）
- **定数**: UPPER_SNAKE_CASE（`const MAX_LEVEL = 4`）

---

## リリースプロセス

### 1. バージョン更新

```bash
# package.json のバージョンを更新
npm version patch  # 0.6.0 → 0.6.1（バグ修正）
npm version minor  # 0.6.0 → 0.7.0（機能追加）
npm version major  # 0.6.0 → 1.0.0（破壊的変更）
```

### 2. ビルド

```bash
# クリーンビルド
npm run clean
npm run build:electron
npm run build
npm run build:win
```

### 3. テスト

- 手動テスト実施（全機能確認）
- E2Eテスト実施（実装後）
- パフォーマンステスト

### 4. リリースノート作成

`CHANGELOG.md`に記載:

```markdown
## [0.7.0] - 2025-10-20

### Added
- 詳細工程のレベルマッピング修正（detail→null）

### Fixed
- BPMN同期時のエラーハンドリング改善

### Changed
- SYSTEM_ARCHITECTURE.md統合

### Deprecated
- 旧アーキテクチャドキュメント
```

### 5. GitHub Release

1. タグ作成（`v0.7.0`）
2. リリースノート公開
3. インストーラーアップロード（`.exe`ファイル）

---

## トラブルシューティング

### ビルドエラー

#### TypeScriptエラー

```bash
# 型チェック
npm run build:electron

# エラー詳細
npx tsc -p electron/tsconfig.json --noEmit
```

#### Next.jsビルドエラー

```bash
# ビルドログ確認
npm run build -- --debug

# キャッシュクリア
npm run clean
rm -rf .next
```

#### SQLiteリビルドエラー

```bash
# 手動リビルド
npm run rebuild:sqlite

# node-gypの問題の場合
npm install --global node-gyp
npm rebuild better-sqlite3
```

### 実行時エラー

#### データベースエラー

- **データベースファイル**: `C:\Users\<User>\AppData\Roaming\output-management-tool\database.db`
- **確認方法**: SQLiteブラウザで確認
- **リセット**: データベースファイルを削除して再起動

#### IPC通信エラー

- `preload.ts`で関数が公開されているか確認
- `main.ts`でハンドラーが登録されているか確認
- 開発者ツールのConsoleでエラーメッセージ確認

#### BPMNエディタエラー

- `bpmn-js`のバージョン確認
- XMLフォーマットの妥当性確認
- ブラウザのコンソールでエラー詳細確認

### パフォーマンス問題

```typescript
// パフォーマンス計測
console.time('loadProcesses');
const processes = await window.electronAPI.process.getByProject(projectId);
console.timeEnd('loadProcesses');
```

**最適化ポイント**:
- データベースクエリの最適化（インデックス追加）
- 不要な再レンダリングの削減（React.memo）
- 大量データの仮想化（react-window）

---

## 実装状況

### 全体進捗: 91% (88/97タスク)

| Phase | 進捗 | ステータス |
|-------|------|-----------|
| Phase 0: 環境準備 | 8/8 | ✅ 完了 |
| Phase 1: 基盤構築 | 12/12 | ✅ 完了 |
| フェーズ0: 環境準備 | 8/8 | ✅ 完了 |
| フェーズ1: データベース構築 | 14/14 | ✅ 完了 |
| フェーズ2: バックエンドAPI実装 | 36/36 | ✅ 完了 |
| フェーズ3: フロントエンド実装 | 0/25 | ❌ 未着手 |
| フェーズ4: テスト・最適化 | 0/13 | ❌ 未着手 |
| フェーズ5: リリース準備 | 0/5 | ❌ 未着手 |

### プロダクションレディ度: 57%

| カテゴリ | スコア | 状態 |
|---------|--------|------|
| データベース | 100% | ✅ 完了 |
| バックエンドAPI | 100% | ✅ 完了 |
| フロントエンド | 0% | ❌ 未着手 |
| テスト | 0% | ❌ 未着手 |
| エラーハンドリング | 100% | ✅ 完了 |
| ドキュメント | 95% | ✅ ほぼ完了 |
| テスト | 70% | 🟡 部分完了 |

---

## 参考資料

### 内部ドキュメント

- [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md): システムアーキテクチャ仕様書
- [requirements.md](./requirements.md): 要件定義書
- [USER_GUIDE.md](./USER_GUIDE.md): ユーザー向け使い方ガイド
- [REFACTORING_TODO.md](./REFACTORING_TODO.md): アーキテクチャ修正ToDo
- [TODO.md](./TODO.md): 開発ToDoリスト

### 外部ドキュメント

- [Electron Documentation](https://www.electronjs.org/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [bpmn-js Documentation](https://bpmn.io/toolkit/bpmn-js/)
- [NextUI Documentation](https://nextui.org/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [better-sqlite3 Documentation](https://github.com/WiseLibs/better-sqlite3)

---

**文書履歴**:
- 2025-10-21: v2.0.0 - V2.0.0対応（フェーズ2完了版）
- 2025-10-20: v1.0.0 - DEVELOPMENT.md, BUILD_GUIDE.md, TESTING.mdを統合

