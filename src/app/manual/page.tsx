'use client';

import React, { useState } from 'react';
import { Card, CardBody, CardHeader, Accordion, AccordionItem, Divider, Chip, Code } from '@heroui/react';
import { AppLayout } from '@/components/layout/AppLayout';
import {
  BookOpenIcon,
  ChartBarIcon,
  DocumentTextIcon,
  ClockIcon,
  FolderIcon,
  RocketLaunchIcon,
  ArrowsRightLeftIcon,
  TableCellsIcon,
  DocumentDuplicateIcon,
  Cog6ToothIcon,
  CommandLineIcon,
  ExclamationTriangleIcon,
  QuestionMarkCircleIcon,
} from '@heroicons/react/24/outline';

export default function ManualPage() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-8 pb-12">
        {/* ヘッダー */}
        <div className="text-center space-y-4 pt-4">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-50">ユーザーマニュアル</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Output Management Tool の全機能を詳しく解説します
          </p>
          <div className="flex items-center justify-center gap-2">
            <Chip color="primary" variant="flat">Version 0.6.0</Chip>
            <Chip color="success" variant="flat">Phase 6 完了</Chip>
          </div>
        </div>

        {/* はじめに */}
        <Card className="shadow-md">
          <CardBody className="p-8 space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-blue-500 bg-opacity-10 p-3 rounded-lg">
                <BookOpenIcon className="w-8 h-8 text-blue-500" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-50">はじめに</h2>
            </div>
            
            <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
              Output Management Toolは、業務プロセスを<strong>4段階の階層</strong>で管理し、
              <strong>グループベース</strong>で工程表・フロー図・マニュアルを整理できます。
              <strong>BPMN 2.0</strong>標準に準拠したダイアグラム連携、Excel連携、バージョン管理を提供する
              統合プロセス管理ツールです。
            </p>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 p-5 rounded-lg">
                <h3 className="text-lg font-semibold mb-3 text-blue-700 dark:text-blue-300 flex items-center gap-2">
                  <DocumentTextIcon className="w-5 h-5" />
                  Phase 6 機能
                </h3>
                <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                  <li>� <strong>グループベース管理</strong></li>
                  <li>� <strong>階層別グループ分類</strong></li>
                  <li>🎯 <strong>工程表・フロー図・マニュアル連携</strong></li>
                  <li>⚡ <strong>一元管理ダッシュボード</strong></li>
                </ul>
              </div>
              
              <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 p-5 rounded-lg">
                <h3 className="text-lg font-semibold mb-3 text-green-700 dark:text-green-300 flex items-center gap-2">
                  <ChartBarIcon className="w-5 h-5" />
                  コア機能
                </h3>
                <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                  <li>📊 <strong>4段階階層管理</strong></li>
                  <li>📁 <strong>グループベース整理</strong></li>
                  <li>🎨 <strong>BPMNビジュアルエディタ</strong></li>
                  <li>📋 <strong>Excel連携</strong></li>
                  <li>💾 <strong>バージョン管理</strong></li>
                </ul>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* クイックスタート */}
        <Card className="shadow-md">
          <CardBody className="p-8 space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-green-500 bg-opacity-10 p-3 rounded-lg">
                <RocketLaunchIcon className="w-8 h-8 text-green-500" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-50">クイックスタート</h2>
            </div>
            
            <p className="text-gray-600 dark:text-gray-400">
              5分で始められる基本的なワークフローです
            </p>
            
            <ol className="space-y-5">
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg shadow-lg">1</span>
                <div className="flex-1">
                  <h4 className="font-bold text-lg text-gray-900 dark:text-gray-50 mb-1">プロジェクトを作成</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    左メニューから「プロジェクト」→「新規プロジェクト作成」ボタンをクリック
                  </p>
                  <Code className="text-xs">プロジェクト名と説明を入力 → 作成</Code>
                </div>
              </li>
              
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg shadow-lg">2</span>
                <div className="flex-1">
                  <h4 className="font-bold text-lg text-gray-900 dark:text-gray-50 mb-1">工程データを追加</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    <strong>方法A:</strong> Excelから一括インポート<br />
                    <strong>方法B:</strong> 階層管理画面で手動作成
                  </p>
                  <Code className="text-xs">プロジェクト詳細 → 階層管理 → 工程追加</Code>
                </div>
              </li>
              
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg shadow-lg">3</span>
                <div className="flex-1">
                  <h4 className="font-bold text-lg text-gray-900 dark:text-gray-50 mb-1">階層構造を整理</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    ドラッグ&ドロップで大工程→中工程→小工程→詳細工程の4段階構造を作成
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    <Chip size="sm" color="primary" variant="flat">大工程</Chip>
                    <span>→</span>
                    <Chip size="sm" color="secondary" variant="flat">中工程</Chip>
                    <span>→</span>
                    <Chip size="sm" color="success" variant="flat">小工程</Chip>
                    <span>→</span>
                    <Chip size="sm" color="warning" variant="flat">詳細工程</Chip>
                  </div>
                </div>
              </li>
              
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg shadow-lg">4</span>
                <div className="flex-1">
                  <h4 className="font-bold text-lg text-gray-900 dark:text-gray-50 mb-1">BPMNダイアグラム作成（任意）</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    BPMN画面でビジュアルなプロセスフローを設計。工程表と自動同期されます
                  </p>
                  <Code className="text-xs">BPMN → 要素追加 → 工程表と同期</Code>
                </div>
              </li>
              
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg shadow-lg">5</span>
                <div className="flex-1">
                  <h4 className="font-bold text-lg text-gray-900 dark:text-gray-50 mb-1">バージョンを保存</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    重要なマイルストーンでスナップショットを作成。いつでも復元可能
                  </p>
                  <Code className="text-xs">バージョン管理 → スナップショット作成</Code>
                </div>
              </li>
            </ol>
            
            <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950 border border-green-200 dark:border-green-800 p-4 rounded-lg">
              <p className="text-sm font-semibold text-green-700 dark:text-green-300">
                ✨ これで基本的な使い方は完了です！以下で各機能の詳細を確認してください。
              </p>
            </div>
          </CardBody>
        </Card>

        {/* 詳細機能ガイド */}
        <Card className="shadow-md">
          <CardHeader className="p-6 pb-0">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-50">機能詳細ガイド</h2>
          </CardHeader>
          <CardBody className="p-6">
            <Accordion variant="splitted" selectionMode="multiple">
              {/* プロジェクト管理 */}
              <AccordionItem
                key="project"
                aria-label="プロジェクト管理"
                title={
                  <div className="flex items-center gap-3">
                    <FolderIcon className="w-6 h-6 text-blue-500" />
                    <span className="font-bold text-lg">1. プロジェクト管理</span>
                  </div>
                }
              >
                <div className="space-y-4 pl-9">
                  <div>
                    <h4 className="font-semibold mb-2 text-gray-900 dark:text-gray-50">📌 新規プロジェクト作成</h4>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
                      <li>左メニューから「プロジェクト」をクリック</li>
                      <li>右上の「新規プロジェクト作成」ボタンをクリック</li>
                      <li>プロジェクト名を入力（必須）</li>
                      <li>説明を入力（任意、最大500文字）</li>
                      <li>「作成」ボタンをクリック</li>
                    </ol>
                  </div>
                  
                  <Divider />
                  
                  <div>
                    <h4 className="font-semibold mb-2 text-gray-900 dark:text-gray-50">✏️ プロジェクト編集</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      プロジェクトカードをクリックして詳細画面へ移動。名前や説明を編集できます。
                    </p>
                  </div>
                  
                  <Divider />
                  
                  <div>
                    <h4 className="font-semibold mb-2 text-gray-900 dark:text-gray-50">🗑️ プロジェクト削除</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      プロジェクトカードの削除ボタンをクリック。確認ダイアログで「削除」を選択。
                    </p>
                    <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 p-3 rounded">
                      <p className="text-xs text-red-700 dark:text-red-300">
                        <ExclamationTriangleIcon className="w-4 h-4 inline mr-1" />
                        警告: 削除したプロジェクトは復元できません
                      </p>
                    </div>
                  </div>
                </div>
              </AccordionItem>

              {/* 階層工程表 */}
              <AccordionItem
                key="hierarchy"
                aria-label="階層工程表管理"
                title={
                  <div className="flex items-center gap-3">
                    <ChartBarIcon className="w-6 h-6 text-purple-500" />
                    <span className="font-bold text-lg">2. 階層工程表管理</span>
                  </div>
                }
              >
                <div className="space-y-4 pl-9">
                  <div>
                    <h4 className="font-semibold mb-2 text-gray-900 dark:text-gray-50">🏗️ 4段階階層構造</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Chip size="sm" color="primary">Level 1</Chip>
                        <span className="text-gray-600 dark:text-gray-400">大工程 - プロジェクト全体の大きな区分</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Chip size="sm" color="secondary">Level 2</Chip>
                        <span className="text-gray-600 dark:text-gray-400">中工程 - 大工程を詳細化</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Chip size="sm" color="success">Level 3</Chip>
                        <span className="text-gray-600 dark:text-gray-400">小工程 - 具体的なタスク群</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Chip size="sm" color="warning">Level 4</Chip>
                        <span className="text-gray-600 dark:text-gray-400">詳細工程 - 最も細かい作業単位</span>
                      </div>
                    </div>
                  </div>
                  
                  <Divider />
                  
                  <div>
                    <h4 className="font-semibold mb-2 text-gray-900 dark:text-gray-50">➕ 工程の追加</h4>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
                      <li>プロジェクト詳細画面から「階層管理」タブを選択</li>
                      <li>「工程追加」ボタンをクリック</li>
                      <li>工程名、説明、レベル、親工程を入力</li>
                      <li>「保存」をクリック</li>
                    </ol>
                  </div>
                  
                  <Divider />
                  
                  <div>
                    <h4 className="font-semibold mb-2 text-gray-900 dark:text-gray-50">🎯 ドラッグ&ドロップ</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      工程をドラッグして別の親工程にドロップすることで、階層構造を簡単に変更できます。
                    </p>
                  </div>
                </div>
              </AccordionItem>

              {/* BPMN */}
              <AccordionItem
                key="bpmn"
                aria-label="BPMNエディタ"
                title={
                  <div className="flex items-center gap-3">
                    <DocumentTextIcon className="w-6 h-6 text-indigo-500" />
                    <span className="font-bold text-lg">3. BPMNエディタ</span>
                  </div>
                }
              >
                <div className="space-y-4 pl-9">
                  <div>
                    <h4 className="font-semibold mb-2 text-gray-900 dark:text-gray-50">🎨 ダイアグラム作成</h4>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
                      <li>プロジェクト詳細画面から「BPMN」タブを選択</li>
                      <li>左側のパレットから要素をドラッグ</li>
                      <li>キャンバスに配置してプロセスフローを作成</li>
                      <li>要素をクリックして名前や属性を編集</li>
                      <li>自動保存されます</li>
                    </ol>
                  </div>
                  
                  <Divider />
                  
                  <div>
                    <h4 className="font-semibold mb-2 text-gray-900 dark:text-gray-50">📦 主要な要素</h4>
                    <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                      <li>⭕ <strong>イベント</strong> - 開始、終了、中間イベント</li>
                      <li>📋 <strong>タスク</strong> - 作業の単位</li>
                      <li>💎 <strong>ゲートウェイ</strong> - 分岐・統合</li>
                      <li>➡️ <strong>シーケンスフロー</strong> - 処理の流れ</li>
                    </ul>
                  </div>
                  
                  <Divider />
                  
                  <div>
                    <h4 className="font-semibold mb-2 text-gray-900 dark:text-gray-50">💾 エクスポート</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      BPMN 2.0 XML形式、SVG画像、PNGで出力可能。他のツールとの互換性があります。
                    </p>
                  </div>
                </div>
              </AccordionItem>

              {/* Excel連携 */}
              <AccordionItem
                key="excel"
                aria-label="Excel連携"
                title={
                  <div className="flex items-center gap-3">
                    <TableCellsIcon className="w-6 h-6 text-green-500" />
                    <span className="font-bold text-lg">4. Excel連携</span>
                  </div>
                }
              >
                <div className="space-y-4 pl-9">
                  <div>
                    <h4 className="font-semibold mb-2 text-gray-900 dark:text-gray-50">📥 インポート</h4>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
                      <li>階層管理画面で「Excelインポート」ボタンをクリック</li>
                      <li>Excelファイル（.xlsx, .xls）を選択</li>
                      <li>必要な列をマッピング</li>
                      <li>プレビューで確認</li>
                      <li>「インポート実行」をクリック</li>
                    </ol>
                    <div className="mt-2 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 p-3 rounded">
                      <p className="text-xs text-blue-700 dark:text-blue-300">
                        💡 ヒント: 1行目がヘッダー行として自動認識されます
                      </p>
                    </div>
                  </div>
                  
                  <Divider />
                  
                  <div>
                    <h4 className="font-semibold mb-2 text-gray-900 dark:text-gray-50">📤 エクスポート</h4>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
                      <li>階層管理画面で「Excelエクスポート」ボタンをクリック</li>
                      <li>出力形式を選択（フラット/階層）</li>
                      <li>保存場所を指定</li>
                      <li>ダウンロード完了</li>
                    </ol>
                  </div>
                  
                  <Divider />
                  
                  <div>
                    <h4 className="font-semibold mb-2 text-gray-900 dark:text-gray-50">📋 推奨フォーマット</h4>
                    <Code className="text-xs block p-2">
                      工程名 | レベル | 親工程名 | 説明 | 担当者 | 工数
                    </Code>
                  </div>
                </div>
              </AccordionItem>

              {/* グループ管理 */}
              <AccordionItem
                key="trinity"
                aria-label="グループ管理"
                title={
                  <div className="flex items-center gap-3">
                    <ArrowsRightLeftIcon className="w-6 h-6 text-pink-500" />
                    <span className="font-bold text-lg">5. グループ管理 (Phase 6)</span>
                    <Chip size="sm" color="danger" variant="flat">NEW</Chip>
                  </div>
                }
              >
                <div className="space-y-4 pl-9">
                  <div className="bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-950 dark:to-purple-950 p-4 rounded-lg border border-pink-200 dark:border-pink-800">
                    <h4 className="font-semibold mb-2 text-pink-700 dark:text-pink-300">� グループベース管理とは？</h4>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      工程表、フロー図、マニュアルをグループ単位で管理する機能です。
                      階層レベル（大・中・小・詳細）ごとに整理し、関連性を明確にします。
                    </p>
                  </div>
                  
                  <Divider />
                  
                  <div>
                    <h4 className="font-semibold mb-2 text-gray-900 dark:text-gray-50">� 工程表グループ</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      複数の工程表を階層レベルごとにグループ化して管理します。
                    </p>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
                      <li>階層管理ページから「工程表グループ管理」へ</li>
                      <li>「グループ作成」で新規グループを作成</li>
                      <li>階層レベルを選択（大・中・小・詳細）</li>
                      <li>グループに工程を追加して整理</li>
                    </ol>
                  </div>
                  
                  <Divider />
                  
                  <div>
                    <h4 className="font-semibold mb-2 text-gray-900 dark:text-gray-50">� フロー図グループ</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      BPMNダイアグラムをグループ単位で管理します。
                    </p>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
                      <li>「BPMN」タブからグループ管理へ</li>
                      <li>階層レベルごとにフロー図グループを作成</li>
                      <li>工程表グループと紐付けて関連性を明確化</li>
                      <li>グループ内でフロー図を管理</li>
                    </ol>
                  </div>
                  
                  <Divider />
                  
                  <div>
                    <h4 className="font-semibold mb-2 text-gray-900 dark:text-gray-50">📄 マニュアルグループ</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      マニュアルをグループ単位で整理・管理します。
                    </p>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
                      <li>「マニュアル」タブを選択</li>
                      <li>「グループ作成」でマニュアルグループを作成</li>
                      <li>階層レベルと工程表グループを設定</li>
                      <li>グループ内でマニュアルを作成・編集</li>
                    </ol>
                  </div>
                  
                  <Divider />
                  
                  <div>
                    <h4 className="font-semibold mb-2 text-gray-900 dark:text-gray-50">🎯 統合管理ビュー</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      「Trinity」タブで3要素を一元管理できます。各グループの状況を一覧で確認し、素早くアクセスできます。
                    </p>
                  </div>
                </div>
              </AccordionItem>

              {/* マニュアル管理 */}
              <AccordionItem
                key="manual"
                aria-label="マニュアル管理"
                title={
                  <div className="flex items-center gap-3">
                    <DocumentDuplicateIcon className="w-6 h-6 text-cyan-500" />
                    <span className="font-bold text-lg">6. マニュアル管理</span>
                  </div>
                }
              >
                <div className="space-y-4 pl-9">
                  <div>
                    <h4 className="font-semibold mb-2 text-gray-900 dark:text-gray-50">📝 マニュアル作成</h4>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
                      <li>「マニュアル」タブを選択</li>
                      <li>「新規マニュアル作成」ボタンをクリック</li>
                      <li>タイトルと内容を入力</li>
                      <li>リッチテキストエディタで装飾</li>
                      <li>「保存」をクリック</li>
                    </ol>
                  </div>
                  
                  <Divider />
                  
                  <div>
                    <h4 className="font-semibold mb-2 text-gray-900 dark:text-gray-50">🤖 自動生成</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      工程表から自動的にマニュアルを生成できます：
                    </p>
                    <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                      <li>📋 <strong>標準テンプレート</strong> - 工程ごとの手順書</li>
                      <li>📊 <strong>詳細版</strong> - 担当者・工数も含む</li>
                      <li>📄 <strong>簡易版</strong> - 工程名と概要のみ</li>
                    </ul>
                  </div>
                  
                  <Divider />
                  
                  <div>
                    <h4 className="font-semibold mb-2 text-gray-900 dark:text-gray-50">💾 エクスポート</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      マニュアルをPDF、HTML、Markdown、DOCX形式で出力できます。
                    </p>
                  </div>
                </div>
              </AccordionItem>

              {/* バージョン管理 */}
              <AccordionItem
                key="version"
                aria-label="バージョン管理"
                title={
                  <div className="flex items-center gap-3">
                    <ClockIcon className="w-6 h-6 text-orange-500" />
                    <span className="font-bold text-lg">7. バージョン管理</span>
                  </div>
                }
              >
                <div className="space-y-4 pl-9">
                  <div>
                    <h4 className="font-semibold mb-2 text-gray-900 dark:text-gray-50">📸 スナップショット作成</h4>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
                      <li>「バージョン管理」タブを選択</li>
                      <li>「スナップショット作成」ボタンをクリック</li>
                      <li>バージョン名と説明を入力</li>
                      <li>「作成」をクリック</li>
                    </ol>
                    <div className="mt-2 bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 p-3 rounded">
                      <p className="text-xs text-orange-700 dark:text-orange-300">
                        💡 ヒント: 重要なマイルストーンごとに作成することをお勧めします
                      </p>
                    </div>
                  </div>
                  
                  <Divider />
                  
                  <div>
                    <h4 className="font-semibold mb-2 text-gray-900 dark:text-gray-50">⏮️ バージョン復元</h4>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
                      <li>バージョン一覧から復元したいバージョンを選択</li>
                      <li>「復元」ボタンをクリック</li>
                      <li>確認ダイアログで「復元」を選択</li>
                      <li>プロジェクトが選択したバージョンに戻ります</li>
                    </ol>
                  </div>
                  
                  <Divider />
                  
                  <div>
                    <h4 className="font-semibold mb-2 text-gray-900 dark:text-gray-50">🔍 差分表示</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      2つのバージョン間の変更点を視覚的に確認できます。
                    </p>
                  </div>
                </div>
              </AccordionItem>
            </Accordion>
          </CardBody>
        </Card>

        {/* トラブルシューティング */}
        <Card className="shadow-md">
          <CardHeader className="p-6 pb-0">
            <div className="flex items-center gap-3">
              <Cog6ToothIcon className="w-8 h-8 text-red-500" />
              <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-50">トラブルシューティング</h2>
            </div>
          </CardHeader>
          <CardBody className="p-6">
            <Accordion variant="splitted">
              <AccordionItem
                key="ts1"
                aria-label="プロジェクトが作成できない"
                title={
                  <div className="flex items-center gap-2">
                    <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
                    <span className="font-semibold">プロジェクトが作成できない</span>
                  </div>
                }
              >
                <div className="space-y-3 pl-7 text-sm">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-50 mb-1">原因と対処法：</p>
                    <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                      <li>✓ プロジェクト名が空欄になっていないか確認</li>
                      <li>✓ プロジェクト名が100文字を超えていないか確認</li>
                      <li>✓ アプリを再起動してみる</li>
                      <li>✓ データベースファイルが破損していないか確認（%APPDATA%\output-management-tool\data）</li>
                    </ul>
                  </div>
                </div>
              </AccordionItem>

              <AccordionItem
                key="ts2"
                aria-label="Excelインポートでエラーが出る"
                title={
                  <div className="flex items-center gap-2">
                    <ExclamationTriangleIcon className="w-5 h-5 text-orange-500" />
                    <span className="font-semibold">Excelインポートでエラーが出る</span>
                  </div>
                }
              >
                <div className="space-y-3 pl-7 text-sm">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-50 mb-1">確認事項：</p>
                    <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                      <li>✓ ファイル形式が .xlsx または .xls か確認</li>
                      <li>✓ 1行目にヘッダー行があるか確認</li>
                      <li>✓ 必須列（工程名、レベル）が含まれているか確認</li>
                      <li>✓ セルに特殊文字や制御文字が含まれていないか確認</li>
                      <li>✓ Excelファイルが他のプログラムで開かれていないか確認</li>
                    </ul>
                  </div>
                </div>
              </AccordionItem>

              <AccordionItem
                key="ts3"
                aria-label="BPMNエディタが表示されない"
                title={
                  <div className="flex items-center gap-2">
                    <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />
                    <span className="font-semibold">BPMNエディタが表示されない</span>
                  </div>
                }
              >
                <div className="space-y-3 pl-7 text-sm">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-50 mb-1">対処法：</p>
                    <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                      <li>✓ ページをリロード（Ctrl+R）</li>
                      <li>✓ ブラウザのキャッシュをクリア</li>
                      <li>✓ 別のプロジェクトで試してみる</li>
                      <li>✓ アプリを再起動</li>
                    </ul>
                  </div>
                </div>
              </AccordionItem>

              <AccordionItem
                key="ts4"
                aria-label="同期機能が動作しない"
                title={
                  <div className="flex items-center gap-2">
                    <ExclamationTriangleIcon className="w-5 h-5 text-blue-500" />
                    <span className="font-semibold">同期機能が動作しない</span>
                  </div>
                }
              >
                <div className="space-y-3 pl-7 text-sm">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-50 mb-1">確認事項：</p>
                    <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                      <li>✓ BPMNダイアグラムと工程表の両方が作成されているか</li>
                      <li>✓ 同期ボタンをクリックしたか</li>
                      <li>✓ エラーメッセージが表示されていないか確認</li>
                      <li>✓ Trinity統合ビューで同期状態を確認</li>
                    </ul>
                  </div>
                </div>
              </AccordionItem>

              <AccordionItem
                key="ts5"
                aria-label="データが消えた"
                title={
                  <div className="flex items-center gap-2">
                    <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
                    <span className="font-semibold">データが消えた</span>
                  </div>
                }
              >
                <div className="space-y-3 pl-7 text-sm">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-50 mb-1">復元方法：</p>
                    <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                      <li>✓ バージョン管理から過去のスナップショットを復元</li>
                      <li>✓ データベースバックアップから復元（%APPDATA%\output-management-tool\data\backups）</li>
                      <li>✓ 定期的にスナップショットを作成することを推奨</li>
                    </ul>
                  </div>
                </div>
              </AccordionItem>
            </Accordion>
          </CardBody>
        </Card>

        {/* FAQ */}
        <Card className="shadow-md">
          <CardHeader className="p-6 pb-0">
            <div className="flex items-center gap-3">
              <QuestionMarkCircleIcon className="w-8 h-8 text-blue-500" />
              <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-50">よくある質問（FAQ）</h2>
            </div>
          </CardHeader>
          <CardBody className="p-6">
            <Accordion variant="splitted">
              <AccordionItem
                key="faq1"
                aria-label="複数のプロジェクトを同時に管理できますか？"
                title="複数のプロジェクトを同時に管理できますか？"
              >
                <p className="text-sm text-gray-600 dark:text-gray-400 pl-4">
                  はい、プロジェクト数に制限はありません。プロジェクト一覧から複数のプロジェクトを作成・管理できます。
                </p>
              </AccordionItem>

              <AccordionItem
                key="faq2"
                aria-label="データはどこに保存されますか？"
                title="データはどこに保存されますか？"
              >
                <div className="text-sm text-gray-600 dark:text-gray-400 pl-4 space-y-2">
                  <p>すべてのデータはローカルPCに保存されます：</p>
                  <Code className="text-xs">%APPDATA%\output-management-tool\data\output-management.db</Code>
                  <p className="mt-2">クラウドにデータは送信されないため、セキュリティ面でも安心です。</p>
                </div>
              </AccordionItem>

              <AccordionItem
                key="faq3"
                aria-label="BPMNファイルを他のツールと共有できますか？"
                title="BPMNファイルを他のツールと共有できますか？"
              >
                <p className="text-sm text-gray-600 dark:text-gray-400 pl-4">
                  はい、標準的なBPMN 2.0 XML形式でエクスポートできるため、Camunda、Signavio、Bizagi等の
                  他のBPMNツールとも互換性があります。
                </p>
              </AccordionItem>

              <AccordionItem
                key="faq4"
                aria-label="オフラインでも使用できますか？"
                title="オフラインでも使用できますか？"
              >
                <p className="text-sm text-gray-600 dark:text-gray-400 pl-4">
                  はい、完全にオフラインで動作します。インターネット接続は不要です。
                </p>
              </AccordionItem>

              <AccordionItem
                key="faq5"
                aria-label="データのバックアップ方法は？"
                title="データのバックアップ方法は？"
              >
                <div className="text-sm text-gray-600 dark:text-gray-400 pl-4 space-y-2">
                  <p>2つの方法があります：</p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li><strong>バージョン管理</strong> - アプリ内でスナップショットを作成</li>
                    <li><strong>手動バックアップ</strong> - データベースファイルを直接コピー</li>
                  </ol>
                  <Code className="text-xs mt-2">%APPDATA%\output-management-tool\data\</Code>
                </div>
              </AccordionItem>

              <AccordionItem
                key="faq6"
                aria-label="階層の深さに制限はありますか？"
                title="階層の深さに制限はありますか？"
              >
                <p className="text-sm text-gray-600 dark:text-gray-400 pl-4">
                  現在は4段階（大工程→中工程→小工程→詳細工程）に固定されています。
                  これは業務プロセス管理のベストプラクティスに基づいています。
                </p>
              </AccordionItem>

              <AccordionItem
                key="faq7"
                aria-label="チームで共有できますか？"
                title="チームで共有できますか？"
              >
                <div className="text-sm text-gray-600 dark:text-gray-400 pl-4 space-y-2">
                  <p>現バージョンは単一ユーザー向けですが、以下の方法で共有できます：</p>
                  <ul className="space-y-1">
                    <li>• Excelエクスポート → メール/共有フォルダで配布</li>
                    <li>• BPMNエクスポート → 標準形式で共有</li>
                    <li>• データベースファイルのコピー（注意：同時編集は不可）</li>
                  </ul>
                </div>
              </AccordionItem>

              <AccordionItem
                key="faq8"
                aria-label="マニュアル生成のテンプレートをカスタマイズできますか？"
                title="マニュアル生成のテンプレートをカスタマイズできますか？"
              >
                <p className="text-sm text-gray-600 dark:text-gray-400 pl-4">
                  現バージョンでは標準、詳細、簡易の3つのテンプレートから選択できます。
                  生成後にリッチテキストエディタで自由に編集可能です。
                </p>
              </AccordionItem>
            </Accordion>
          </CardBody>
        </Card>

        {/* キーボードショートカット */}
        <Card className="shadow-md bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
          <CardHeader className="p-6 pb-0">
            <div className="flex items-center gap-3">
              <CommandLineIcon className="w-8 h-8 text-purple-500" />
              <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-50">キーボードショートカット</h2>
            </div>
          </CardHeader>
          <CardBody className="p-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-900 dark:text-gray-50 mb-3">一般</h4>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600 dark:text-gray-400">新規プロジェクト作成</span>
                  <Code size="sm">Ctrl+N</Code>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600 dark:text-gray-400">保存</span>
                  <Code size="sm">Ctrl+S</Code>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600 dark:text-gray-400">検索</span>
                  <Code size="sm">Ctrl+F</Code>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-900 dark:text-gray-50 mb-3">編集</h4>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600 dark:text-gray-400">元に戻す</span>
                  <Code size="sm">Ctrl+Z</Code>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600 dark:text-gray-400">やり直す</span>
                  <Code size="sm">Ctrl+Y</Code>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600 dark:text-gray-400">削除</span>
                  <Code size="sm">Delete</Code>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* サポート情報 */}
        <Card className="shadow-md bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
          <CardBody className="p-8 text-center">
            <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-50">さらにサポートが必要ですか？</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              このマニュアルで解決できない問題がある場合は、以下のリソースをご確認ください
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Chip color="primary" variant="flat" size="lg">バージョン: 0.6.0</Chip>
              <Chip color="success" variant="flat" size="lg">最終更新: 2025年10月16日</Chip>
              <Chip color="secondary" variant="flat" size="lg">Phase 6 完了</Chip>
            </div>
            <Divider className="my-6" />
            <p className="text-sm text-gray-500 dark:text-gray-500">
              © 2025 Output Management Tool. All rights reserved.
            </p>
          </CardBody>
        </Card>
      </div>
    </AppLayout>
  );
}
