# Output Management Tool - ドキュメントインデックス

**最終更新**: 2025年10月20日  
**バージョン**: 2.0.0  
**整理状況**: 統合・整理完了

---

## 📚 ドキュメント構成

ドキュメントは役割ごとに以下のように整理されています：

### 1. ユーザー向けドキュメント

#### [USER_GUIDE.md](./USER_GUIDE.md) 📖
- **対象**: エンドユーザー、プロジェクトマネージャー
- **内容**:
  - アプリケーションの使い方
  - 各機能の説明（工程表、BPMN、マニュアル）
  - 階層構造の理解
  - よくある質問（FAQ）
  - トラブルシューティング

---

### 2. 開発者向けドキュメント

#### [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md) 🛠️
- **対象**: 開発者、コントリビューター
- **内容**:
  - 開発環境セットアップ
  - プロジェクト構造
  - ビルド手順（Windows EXE作成）
  - テストガイド
  - デバッグ方法
  - コーディング規約
  - リリースプロセス
- **統合元**: DEVELOPMENT.md, BUILD_GUIDE.md, TESTING.md

---

### 3. アーキテクチャ・設計ドキュメント

#### [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md) 🏗️
- **対象**: アーキテクト、技術リード、開発者
- **内容**:
  - システムアーキテクチャ概要
  - アーキテクチャ原則（1対1対応、4段階固定階層）
  - データモデル定義
  - 階層構造システム（Phase 8）
  - 三位一体同期システム（Phase 6）
  - 技術スタック詳細
  - データベース設計（ERD、テーブル定義）
  - API設計（IPC通信）
- **統合元**: ARCHITECTURE.md, CORRECT_ARCHITECTURE.md, specifications.md

#### [requirements.md](./requirements.md) 📋
- **対象**: プロジェクトマネージャー、ビジネスアナリスト、開発者
- **内容**:
  - プロジェクト概要と目的
  - システム要件（動作環境、技術スタック）
  - 機能要件（Excel連携、BPMN編集、階層管理等）
  - 非機能要件（パフォーマンス、ユーザビリティ等）
  - UI/UX要件
  - データモデル
  - 開発計画（フェーズ1～8）
  - 将来の拡張性
- **注**: Phase 8まで実装完了、Phase 7（生成AI連携）は将来実装予定

---

### 4. タスク管理ドキュメント

#### [TODO.md](./TODO.md) ✅
- **対象**: 開発チーム
- **内容**:
  - フェーズごとの開発タスク
  - 実装進捗状況（91% 完了）
  - Phase 0～8の詳細タスクリスト
  - Phase 7（AI連携）の将来計画

#### [REFACTORING_TODO.md](./REFACTORING_TODO.md) 🔧
- **対象**: 開発者、テクニカルリード
- **内容**:
  - アーキテクチャ修正タスクリスト
  - 優先度別分類（CRITICAL / HIGH / MEDIUM / LOW）
  - 具体的な修正内容とコード例
  - 実装順序の推奨
  - 依存関係の明記
- **作成日**: 2025年10月20日
- **目的**: 正しいアーキテクチャ（4段階固定階層、1対1対応）の実装

---

### 5. その他ドキュメント

#### [ICON_README.md](./ICON_README.md) 🎨
- **対象**: デザイナー、開発者
- **内容**:
  - アプリケーションアイコンの説明
  - 各サイズのアイコン用途
  - アイコン変更方法

#### [security-notes.md](./security-notes.md) 🔒
- **対象**: セキュリティ担当者、開発者
- **内容**:
  - セキュリティ方針
  - データ保護
  - 脆弱性対策

---

### 6. アーカイブ（archive/）

過去のレポートや廃止されたドキュメントを保管：

- **PHASE8_COMPLETION_REPORT.md**: Phase 8完了レポート
- **CLEANUP_REPORT_2025-10-19.md**: ドキュメント整理レポート

---

## 🗺️ ドキュメント閲覧ガイド

### 初めて使う場合

1. **[USER_GUIDE.md](./USER_GUIDE.md)** - アプリの使い方を学ぶ

### 開発に参加する場合

1. **[SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md)** - システム全体を理解
2. **[requirements.md](./requirements.md)** - 要件と仕様を確認
3. **[DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md)** - 開発環境をセットアップ
4. **[TODO.md](./TODO.md)** または **[REFACTORING_TODO.md](./REFACTORING_TODO.md)** - タスクを選んで実装

### アーキテクチャを深く理解したい場合

1. **[SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md)** - アーキテクチャ原則と設計
2. **[requirements.md](./requirements.md)** - 機能要件の詳細
3. **[REFACTORING_TODO.md](./REFACTORING_TODO.md)** - 現在の課題と修正計画

---

## 📝 ドキュメント整理履歴

### 2025年10月20日 - メジャー整理（v2.0.0）

**統合されたドキュメント**:
1. ARCHITECTURE.md + CORRECT_ARCHITECTURE.md + specifications.md → **SYSTEM_ARCHITECTURE.md**
2. DEVELOPMENT.md + BUILD_GUIDE.md + TESTING.md → **DEVELOPER_GUIDE.md**
3. TODO.md + アーキテクチャ修正タスク → **TODO.md** + **REFACTORING_TODO.md**

**削除されたドキュメント**:
- ARCHITECTURE.md（SYSTEM_ARCHITECTURE.mdに統合）
- CORRECT_ARCHITECTURE.md（SYSTEM_ARCHITECTURE.mdに統合）
- specifications.md（SYSTEM_ARCHITECTURE.mdに統合）
- DEVELOPMENT.md（DEVELOPER_GUIDE.mdに統合）
- BUILD_GUIDE.md（DEVELOPER_GUIDE.mdに統合）
- TESTING.md（DEVELOPER_GUIDE.mdに統合）
- BUSINESS_REQUIREMENTS.md（空ファイルのため削除）

**アーカイブ化**:
- PHASE8_COMPLETION_REPORT.md → archive/
- CLEANUP_REPORT_2025-10-19.md → archive/

**結果**:
- **整理前**: 16ファイル
- **整理後**: 9ファイル（メイン） + 1フォルダ（archive）
- **削減率**: 44%

### 2025年10月19日 - 初回整理（v1.0.0）

- ドキュメント数を31ファイルから13ファイルに削減（58%削減）
- 重複・古いドキュメントを削除
- Phase 8完了に伴うアーキテクチャドキュメント更新

---

## 🎯 ドキュメント管理方針

### 原則

1. **DRY（Don't Repeat Yourself）**: 同じ情報を複数のドキュメントに記載しない
2. **Single Source of Truth**: 各情報は1つのドキュメントに集約
3. **役割別分類**: ユーザー向け / 開発者向け / アーキテクチャ / タスク管理
4. **定期的な整理**: 四半期ごとに見直し

### 更新ルール

- **機能追加時**: requirements.md と USER_GUIDE.md を更新
- **アーキテクチャ変更時**: SYSTEM_ARCHITECTURE.md を更新
- **実装完了時**: TODO.md または REFACTORING_TODO.md を更新
- **ビルド手順変更時**: DEVELOPER_GUIDE.md を更新

---

## 📞 お問い合わせ

ドキュメントに関する質問や改善提案は、GitHubのIssueで受け付けています。

- **リポジトリ**: [KnightOwlJP/OutputManagementTool](https://github.com/KnightOwlJP/OutputManagementTool)
- **Issue**: [新規Issue作成](https://github.com/KnightOwlJP/OutputManagementTool/issues/new)

---

**最終更新**: 2025年10月20日  
**整理担当**: GitHub Copilot
