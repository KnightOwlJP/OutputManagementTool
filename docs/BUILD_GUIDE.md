# Windows用実行ファイルビルドガイド

## � クイックスタート

### 最も簡単な方法（PowerShellスクリプト）

```powershell
# プロジェクトフォルダを開く
cd C:\Users\Knigh\dev\project\output-management-tool

# ビルドスクリプトを実行
.\build-exe.ps1
```

### npmコマンド

```bash
npm run build:win
```

### 手動ビルド

```bash
# 1. クリーンアップ
npm run clean

# 2. Next.jsビルド
npm run build:next

# 3. Electronビルド
npm run build:electron

# 4. SQLiteリビルド
npm run rebuild:sqlite

# 5. .exe生成
npx electron-builder --win --x64
```

---

## �📦 詳細なビルド手順

### 1. 事前準備

```bash
# 依存関係のインストール（初回のみ）
npm install

# キャッシュのクリア（推奨）
npm cache clean --force
rm -rf .next
rm -rf out
rm -rf dist
```

### 2. ビルド実行

#### Windows用実行ファイル（.exe）

```bash
npm run build:win
```

このコマンドは以下を実行します：
1. Next.jsの静的エクスポート（`next build`）
2. Electronメインプロセスのコンパイル（TypeScript → JavaScript）
3. Electron Builderによる.exe生成

### 3. 出力ファイル

ビルドが完了すると、`dist/` フォルダに以下のファイルが生成されます：

```
dist/
├── Output Management Tool-0.1.0-x64.exe      # インストーラー（NSIS）
├── win-unpacked/                              # 実行可能ファイル（ポータブル版）
│   └── Output Management Tool.exe
└── builder-debug.yml                          # デバッグ情報
```

## 🎯 軽量化の最適化

### 実装済みの最適化

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

### サイズの目安

| コンポーネント | サイズ |
|---------------|--------|
| Electron本体 | ~80-100MB |
| Next.js静的ファイル | ~5-10MB |
| Node modules（必要なもののみ） | ~20-30MB |
| アプリケーションコード | ~2-5MB |
| **合計（圧縮後）** | **約60-80MB** |

インストーラー（.exe）は圧縮されているため、さらに小さくなります。

## 🚀 さらなる軽量化（オプション）

### 方法1: 開発依存関係の除外

本番ビルド前に開発依存関係を削除：

```bash
npm prune --production
npm run build:win
npm install  # 開発依存関係を再インストール
```

### 方法2: Electron本体のカスタマイズ

electron-builderの設定で不要な機能を除外：

```json
{
  "electronDownload": {
    "mirror": "https://npmmirror.com/mirrors/electron/"
  }
}
```

### 方法3: asar圧縮の有効化

デフォルトで有効ですが、明示的に設定：

```json
{
  "asar": true,
  "asarUnpack": [
    "**/node_modules/better-sqlite3/**/*"
  ]
}
```

## 🔧 トラブルシューティング

### ビルドが失敗する場合

1. **Node.jsバージョンを確認**
   ```bash
   node --version  # v18以上推奨
   ```

2. **ビルドツールのインストール（Windows）**
   ```bash
   npm install --global windows-build-tools
   ```

3. **キャッシュクリア**
   ```bash
   npm cache clean --force
   rm -rf node_modules
   npm install
   ```

### better-sqlite3のビルドエラー

```bash
npm rebuild better-sqlite3
```

### アイコンが表示されない

`public/` フォルダに `icon.ico` を配置してください。
詳細は `public/ICON_README.md` を参照。

## 📊 ビルド結果の確認

### インストーラーのテスト

```bash
# インストーラーを実行
dist/"Output Management Tool-0.1.0-x64.exe"
```

### ポータブル版のテスト

```bash
# 実行ファイルを直接起動
dist/win-unpacked/"Output Management Tool.exe"
```

## 🎉 配布

### インストーラー版（推奨）

`dist/Output Management Tool-0.1.0-x64.exe` をユーザーに配布

**メリット**:
- インストール・アンインストールが簡単
- スタートメニュー・デスクトップにショートカット作成
- レジストリ登録

### ポータブル版

`dist/win-unpacked/` フォルダ全体をZIP圧縮して配布

**メリット**:
- インストール不要
- USBメモリなどで持ち運び可能
- 複数バージョンの共存が可能

## ⚡ ビルド時間とファイルサイズ

### ビルド時間

- **初回ビルド**: 約10-15分（Electronダウンロード含む）
- **2回目以降**: 約5-10分
  - Next.jsビルド: ~2-5分
  - Electronビルド: ~1-2分
  - 実行ファイル生成: ~2-3分

### ファイルサイズ

- **インストーラー**: 約60-80MB（圧縮済み）
- **ポータブル版**: 約150-200MB（展開済み）
- **ビルド中の一時ファイル**: 約500MB

## 📝 注意事項

1. **アイコン**: `public/icon.svg` が作成済みです
   - ICO形式が必要な場合: `.\generate-icons.ps1` を実行
   - または `docs/ICON_README.md` を参照

2. **ディスク容量**: 約500MBの空き容量が必要

3. **初回ビルド**: Electronのダウンロードで時間がかかります（10-15分）

4. **アイコンデザイン**: プロセス・テーブル・マニュアルの循環型デザイン

5. **署名（オプション）**
   - コード署名により、Windows Defenderの警告を回避可能
   - 証明書の取得が必要（DigiCert、Comodoなど）

## 🔒 コード署名（上級者向け）

```json
{
  "win": {
    "certificateFile": "path/to/certificate.pfx",
    "certificatePassword": "your-password",
    "signingHashAlgorithms": ["sha256"],
    "signDlls": true
  }
}
```

---

**ビルド完了後、`dist/` フォルダ内のファイルを配布してください！** 🎊
