# アイコンファイル生成ガイド

このドキュメントでは、`public/icon.svg`から各プラットフォーム用のアイコンファイルを生成する方法を説明します。

## 📋 必要なファイル

Windows EXE build には以下が必要です：
- ✅ `public/icon.svg` - ソースファイル（作成済み）
- 🔨 `public/icon.ico` - Windows用（生成が必要）
- ⚪ `public/icon.png` - Linux用（オプション）
- ⚪ `public/icon.icns` - macOS用（オプション）

## 🚀 生成方法

### 方法1: 自動スクリプト（推奨）

```powershell
# スクリプトを実行
.\generate-icons.ps1
```

**必要なツール:**
- ImageMagick または Inkscape

**インストール方法:**

**Chocolatey経由（推奨）:**
```powershell
choco install imagemagick
```

**手動ダウンロード:**
- ImageMagick: https://imagemagick.org/script/download.php
- Inkscape: https://inkscape.org/release/

---

### 方法2: オンラインツール（最も簡単）

#### Windows用 ICO生成

1. **ブラウザで SVG を開く:**
   - `public/icon.svg` をChromeやEdgeで開く
   - 右クリック → 画像を保存（PNG形式）

2. **ICO変換サイトにアクセス:**
   - https://www.icoconverter.com/
   - https://convertico.com/
   - https://cloudconvert.com/svg-to-ico

3. **変換実行:**
   - PNG/SVGファイルをアップロード
   - サイズ: 256x256 または 512x512 を選択
   - 「Convert」をクリック

4. **ダウンロード:**
   - 生成された `icon.ico` をダウンロード
   - `public/` フォルダに保存

5. **確認:**
   ```powershell
   ls public/icon.ico
   ```

---

### 方法3: ImageMagick（コマンドライン）

#### PNG生成
```powershell
magick public/icon.svg -resize 512x512 public/icon.png
```

#### ICO生成（複数サイズ）
```powershell
magick public/icon.png -define icon:auto-resize=256,128,64,48,32,16 public/icon.ico
```

#### ICNS生成（macOS用、macOS環境で実行）
```bash
# 1. アイコンセット作成
mkdir public/icon.iconset

# 2. 各サイズのPNG生成
magick public/icon.png -resize 16x16 public/icon.iconset/icon_16x16.png
magick public/icon.png -resize 32x32 public/icon.iconset/icon_16x16@2x.png
magick public/icon.png -resize 32x32 public/icon.iconset/icon_32x32.png
magick public/icon.png -resize 64x64 public/icon.iconset/icon_32x32@2x.png
magick public/icon.png -resize 128x128 public/icon.iconset/icon_128x128.png
magick public/icon.png -resize 256x256 public/icon.iconset/icon_128x128@2x.png
magick public/icon.png -resize 256x256 public/icon.iconset/icon_256x256.png
magick public/icon.png -resize 512x512 public/icon.iconset/icon_256x256@2x.png
magick public/icon.png -resize 512x512 public/icon.iconset/icon_512x512.png
magick public/icon.png -resize 1024x1024 public/icon.iconset/icon_512x512@2x.png

# 3. ICNS生成（macOSのみ）
iconutil -c icns public/icon.iconset
```

---

### 方法4: Inkscape（GUIツール）

1. **Inkscapeを起動:**
   ```powershell
   inkscape public/icon.svg
   ```

2. **PNG エクスポート:**
   - `File` → `Export PNG Image`
   - Width/Height: `512` に設定
   - Filename: `public/icon.png`
   - `Export` をクリック

3. **ICO変換:**
   - オンラインツール（方法2）を使用
   - または ImageMagick で変換

---

## ✅ 確認手順

### 1. ファイルの存在確認
```powershell
ls public/icon.*
```

**期待される出力:**
```
Mode                 LastWriteTime         Length Name
----                 -------------         ------ ----
-a---          2025/01/22     10:30           xxxx icon.ico
-a---          2025/01/22     10:30           xxxx icon.png
-a---          2025/01/22     10:30           xxxx icon.svg
```

### 2. アイコンのプレビュー

**PNG:**
```powershell
# デフォルトアプリで開く
start public/icon.png
```

**ICO:**
```powershell
# エクスプローラーで確認
explorer public
```

### 3. ファイルサイズ確認
```powershell
Get-Item public/icon.* | Select-Object Name, @{Name="Size(KB)";Expression={[math]::Round($_.Length/1KB, 2)}}
```

**適切なサイズ:**
- `icon.svg`: ~4-5 KB（シンプルデザイン）
- `icon.png`: ~15-30 KB
- `icon.ico`: ~30-150 KB（複数サイズ含む）
- `icon.icns`: ~150-400 KB

---

## 🎨 アイコンデザイン仕様

**現在のデザイン:**
- サイズ: 512x512 px
- 背景: 2色グラデーション（青 → 紫）
- メイン要素: 
  - **プロセスフロー（上部）**: 3ステップのシンプルなフロー図、青色
  - **テーブル（右下）**: データグリッド、紫色
  - **マニュアル（左下）**: ドキュメント/ブック、ピンク色
- 配置: 正三角形配置（120度間隔）
- 連携表現: 点線の循環パス、3つの矢印による循環フロー
- 中央ハブ: 3要素を繋ぐ接続ポイント
- テキスト: **なし**（アイコンのみで表現）
- スタイル: ミニマル、シンプル、洗練されたデザイン

**デザインコンセプト:**
プロセス定義 → データ管理 → マニュアル作成 → プロセス改善の循環サイクルを視覚化。
アプリケーションの核心である「プロセス・テーブル・マニュアルの連動管理」を
シンプルな循環図として表現しています。

**3要素の意味:**
- 🔵 **プロセスフロー**: ワークフローの定義と管理
- 🟣 **テーブル**: データの蓄積と集計
- 🌸 **マニュアル**: ドキュメント化と知識共有

**カスタマイズ方法:**
1. `public/icon.svg` をテキストエディタまたはInkscapeで開く
2. グラデーションID（bgGrad, arrowGrad）の色を編集
3. 各要素の色を変更（fill="#3b82f6" など）
4. 配置を調整（transform="translate(...)" 属性）
5. 保存後、再度アイコン生成スクリプトを実行

---

## 🐛 トラブルシューティング

### 問題1: 「magick コマンドが見つかりません」

**解決策:**
```powershell
# ImageMagickをインストール
choco install imagemagick

# パスを確認
$env:PATH += ";C:\Program Files\ImageMagick-7.1.0-Q16-HDRI"

# 再起動後に確認
magick -version
```

### 問題2: ICOファイルが正しく表示されない

**原因:** 複数サイズが含まれていない

**解決策:**
```powershell
# 複数サイズを明示的に指定
magick public/icon.png `
  \( -clone 0 -resize 256x256 \) `
  \( -clone 0 -resize 128x128 \) `
  \( -clone 0 -resize 64x64 \) `
  \( -clone 0 -resize 48x48 \) `
  \( -clone 0 -resize 32x32 \) `
  \( -clone 0 -resize 16x16 \) `
  -delete 0 -colors 256 public/icon.ico
```

### 問題3: Electron buildで「アイコンが見つかりません」エラー

**確認事項:**
1. ファイル名が正確か: `icon.ico`（小文字）
2. 配置場所: `public/` フォルダ直下
3. electron-builder.json の設定:
   ```json
   {
     "win": {
       "icon": "public/icon.ico"
     }
   }
   ```

---

## 📦 次のステップ

アイコン生成完了後、以下を実行：

```powershell
# 1. ビルド実行
.\build-exe.ps1

# または
npm run build:win
```

**ビルド時間:** 初回 10-15分、2回目以降 3-5分

**成果物:** `dist/` フォルダに Windows EXE が生成されます

---

## 📚 参考リンク

- **ImageMagick:** https://imagemagick.org/
- **Inkscape:** https://inkscape.org/
- **ICO Converter:** https://www.icoconverter.com/
- **electron-builder Icons:** https://www.electron.build/icons
- **Chocolatey:** https://chocolatey.org/

---

## 💡 ヒント

1. **品質優先:** 最低 256x256 サイズの ICO を使用
2. **透過背景:** 必要に応じて SVG の背景を透過に変更可能
3. **テスト:** ビルド前に Windows エクスプローラーでプレビュー
4. **バックアップ:** オリジナルの SVG は必ず保存しておく
