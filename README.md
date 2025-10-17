# Output Management Tool

**バージョン**: 0.6.0 (Phase 6完了)  
**最終更新**: 2025年10月17日  
**本番準備度**: ✅ **Production Ready**

業務プロセスを4段階の階層（大工程・中工程・小工程・詳細工程）で管理し、BPMNダイアグラムとの連携、Excelインポート/エクスポート、バージョン管理、三位一体同期機能を提供するデスクトップアプリケーション。

---

## 🎉 はじめに

プロジェクトを作成したら、以下のステップで業務プロセスの管理を始めましょう:

### 📋 次のステップ

1. **工程を追加** - プロジェクト詳細画面の「工程を追加」ボタンから開始
2. **階層を構築** - 階層管理でドラッグ&ドロップで整理
3. **BPMNで可視化** - プロセスフローを図で表現
4. **マニュアル生成** - 工程表から自動的に手順書を作成
5. **三位一体同期** - BPMN・工程・マニュアルを自動連携

詳しい手順は **[はじめに (GETTING_STARTED.md)](docs/GETTING_STARTED.md)** をご覧ください。

---

## ✨ 主な機能

### コア機能
- **4段階階層管理**: 大工程（部署）→ 中工程（作業実行者）→ 小工程（帳票）→ 詳細工程
- **BPMNエディタ**: bpmn-jsを使用したビジュアルなプロセス設計
- **Excelインポート/エクスポート**: 既存のExcelシートから工程データをインポート・エクスポート
- **バージョン管理**: プロジェクト全体のスナップショット作成、復元、比較
- **ドラッグ&ドロップ**: 直感的な階層構造の編集
- **検索・フィルタ**: 工程名、説明、部署、担当者で絞り込み
- **パフォーマンス最適化**: React.memo、仮想スクロール（react-window）によるレンダリング最適化

### 🎉 NEW! 三位一体同期機能（Phase 6完了）
- **BPMN ⇔ 工程表**: 双方向自動同期、リアルタイム監視
- **工程表 → マニュアル**: アウトライン自動生成、階層構造の同期
- **統合ダッシュボード**: BPMN・工程表・マニュアルを一元管理
- **ワンクリック全体同期**: 3つの要素を一括同期
- **マニュアルエディタ**: Markdown形式、プレビュー機能、エクスポート対応

### 🔮 今後の予定（Phase 7）
- **生成AI連携**: マニュアル詳細コンテンツの自動生成
- **画像自動生成**: 手順書用の図解作成
- **用語解説**: 自動的な用語解説追加

## 🚀 クイックスタート

### インストール済みの場合

1. アプリケーションを起動
2. **新規プロジェクト** を作成
3. **工程を追加** ボタンから工程を作成
4. 詳しくは **[はじめに](docs/GETTING_STARTED.md)** を参照

### 開発環境のセットアップ

```bash
# 依存パッケージのインストール
npm install --legacy-peer-deps

# 開発サーバーの起動
npm run dev
```

### Electronアプリとして起動

```bash
# 開発モード (Next.js + Electron)
npm run dev

# 本番ビルド
npm run build:win    # Windows
npm run build:mac    # macOS
npm run build:linux  # Linux
```

## 📚 ドキュメント

- **[はじめに (GETTING_STARTED.md)](docs/GETTING_STARTED.md)**: プロジェクト作成後の次のステップ ⭐ **NEW!**
- **[クイックスタートガイド](docs/quick-start.md)**: 7ステップで始める
- **[ユーザーマニュアル](docs/user-manual.md)**: 完全な操作ガイド
- **[ビルドガイド](docs/BUILD_GUIDE.md)**: アプリケーションのビルド方法
- **[技術仕様](docs/specifications.md)**: 技術的な詳細

## 🛠️ 技術スタック

### フロントエンド
- **Next.js 14**: React フレームワーク (Electron互換版)
- **React 18**: UIライブラリ
- **TypeScript**: 型安全な開発
- **HeroUI**: UIコンポーネントライブラリ
- **Tailwind CSS 4**: ユーティリティファーストCSS
- **Zustand**: 状態管理
- **react-window**: 仮想スクロール

### バックエンド
- **Electron 38**: デスクトップアプリケーション化
- **electron-serve**: 静的ファイル配信 (Next.js互換性対応)
- **better-sqlite3**: SQLiteデータベース
- **bpmn-js**: BPMNエディタ
- **xlsx**: Excelファイル処理

### 開発ツール
- **Jest**: ユニットテスト
- **Testing Library**: コンポーネントテスト
- **ESLint**: コード品質チェック

## 🧪 テスト

```bash
# ユニットテストの実行
npm test

# テストカバレッジ
npm run test:coverage

# ウォッチモード
npm run test:watch
```

## 📦 ビルド

### Windows EXE ビルド（推奨）

```bash
# アイコン生成（初回のみ）
.\generate-icons.ps1

# 自動ビルド（クリーン → Next.js → Electron → パッケージング）
.\build-exe.ps1

# または手動ビルド
npm run build:win
```

### その他のプラットフォーム

```bash
# Next.jsビルド
npm run build

# Electronアプリビルド（macOS/Linux）
npm run electron:build
```

ビルドされたアプリケーションは `dist/` フォルダに出力されます。

**ビルドドキュメント:**
- **[Windows EXE ビルドガイド](docs/BUILD_GUIDE.md)**: 詳細な手順とクイックスタート
- **[アイコン生成ガイド](docs/ICON_README.md)**: アイコンファイルの準備

## 📊 プロジェクト進捗

- **Phase 0**: 環境準備 ✅ 完了 (8/8)
- **Phase 1**: 基盤構築 ✅ 完了 (12/12)
- **Phase 2**: コア機能実装 ✅ 完了 (15/15)
- **Phase 3**: 階層管理 ✅ 完了 (10/10)
- **Phase 4**: バージョン管理・UI最適化 ✅ 完了 (16/16)
- **Phase 5**: 最適化・テスト 🟡 進行中 (6/7)
- **Phase 6**: 三位一体同期機能 🎉 **完了** (11/11) ⭐ 新規追加
- **Phase 7**: 生成AI連携 🔮 計画中 (0/8)

**全体進捗**: 78/87タスク (90%)  
**プロダクションレディ度**: **95%** ✅

### 🎉 Phase 6完了ハイライト
- **BPMN ⇔ 工程表**: 双方向自動同期実装完了
- **工程表 → マニュアル**: アウトライン自動生成実装完了
- **統合ダッシュボード**: 三位一体管理画面実装完了
- **合計実装量**: 3,094行の新規コード追加

## 📚 ドキュメント

> 📖 **[完全なドキュメントインデックス](docs/DOCUMENTATION_INDEX.md)** - すべてのドキュメントの構成と読み順ガイド

### 開発ドキュメント
- **[開発TODO](docs/development-todo.md)**: フェーズ別タスク管理（97%完了）
- **[要件定義書](docs/requirements.md)**: システム要件と機能仕様
- **[技術仕様書](docs/specifications.md)**: アーキテクチャと技術詳細
- **[実装状況レポート](docs/IMPLEMENTATION_STATUS.md)**: 最新の実装状況（95%完成）
- **[UI/UX改善レポート](docs/IMPROVEMENT_REPORT.md)**: UI/UXとエラーハンドリングの改善内容

### ビルド・運用ドキュメント
- **[ビルドガイド](docs/BUILD_GUIDE.md)**: Windows EXEビルド手順
- **[本番準備チェックリスト](docs/READINESS_CHECKLIST.md)**: デプロイ前確認事項
- **[セキュリティノート](docs/security-notes.md)**: セキュリティ上の注意事項
- **[アイコン生成ガイド](docs/ICON_README.md)**: アイコンファイル生成手順

### ユーザードキュメント
- **[クイックスタートガイド](docs/quick-start.md)**: 5分で始める使い方
- **[ユーザーマニュアル](docs/user-manual.md)**: 詳細な操作マニュアル

## 🔒 セキュリティ

セキュリティ上の懸念事項については [security-notes.md](docs/security-notes.md) を参照してください。

## 📝 ライセンス

MIT License

## 🤝 コントリビューション

プルリクエストやIssueの報告を歓迎します！

## 📞 サポート

- **GitHubでIssueを報告**: https://github.com/your-org/output-management-tool/issues
- **メールでお問い合わせ**: support@example.com

---

**Output Management Tool v1.0**  
© 2025 All Rights Reserved.
