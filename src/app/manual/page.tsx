'use client';

import React from 'react';
import { Card, CardBody, CardHeader, Accordion, AccordionItem, Divider, Chip, Code } from '@heroui/react';
import { AppLayout } from '@/components/layout/AppLayout';
import {
  BookOpenIcon,
  ChartBarIcon,
  DocumentTextIcon,
  FolderIcon,
  RocketLaunchIcon,
  TableCellsIcon,
  Cog6ToothIcon,
  CommandLineIcon,
  ExclamationTriangleIcon,
  QuestionMarkCircleIcon,
  SwatchIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

export default function ManualPage() {
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
            <Chip color="success" variant="flat">フラット構造対応</Chip>
            <Chip color="secondary" variant="flat">BPMN 2.0準拠</Chip>
          </div>
        </div>

        {/* マニュアル目次 */}
        <Card className="shadow-md bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
          <CardBody className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50 mb-6">📚 関連ドキュメント</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="shadow-sm border-2 border-blue-200 dark:border-blue-800">
                <CardBody className="p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <BookOpenIcon className="w-6 h-6 text-blue-500" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">基本ガイド</h3>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    このページ - ツールの使い方、機能説明、実践ガイド
                  </p>
                </CardBody>
              </Card>
              
              <a href="/manual/bpmn" className="block">
                <Card className="shadow-sm hover:shadow-md transition-shadow border-2 border-purple-200 dark:border-purple-800">
                  <CardBody className="p-5">
                    <div className="flex items-center gap-3 mb-2">
                      <DocumentTextIcon className="w-6 h-6 text-purple-500" />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">BPMN 2.0 完全ガイド</h3>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      BPMN 2.0の詳細解説、要素説明、ベストプラクティス
                    </p>
                  </CardBody>
                </Card>
              </a>
            </div>
          </CardBody>
        </Card>

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
              Output Management Toolは、業務プロセスを<strong>工程表（Process Table）</strong>で管理し、
              <strong>BPMN 2.0準拠</strong>のビジュアルエディタでプロセスフローを可視化できる
              統合プロセス管理ツールです。スイムレーン管理、カスタム列、データオブジェクト、
              Excel連携など、プロジェクトに必要な機能を包括的に提供します。
            </p>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 p-5 rounded-lg">
                <h3 className="text-lg font-semibold mb-3 text-blue-700 dark:text-blue-300 flex items-center gap-2">
                  <SwatchIcon className="w-5 h-5" />
                  主要機能
                </h3>
                <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                  <li>📊 <strong>工程表管理</strong> - 3段階レベル（L1/L2/L3）で整理</li>
                  <li>🏊 <strong>スイムレーン</strong> - 担当部門・役割ごとに工程を配置</li>
                  <li>🎨 <strong>BPMN要素</strong> - Task/Event/Gateway 7種類のタスクタイプ</li>
                  <li>📋 <strong>カスタム列</strong> - 工程表に独自項目を追加（最大30列）</li>
                </ul>
              </div>
              
              <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 p-5 rounded-lg">
                <h3 className="text-lg font-semibold mb-3 text-green-700 dark:text-green-300 flex items-center gap-2">
                  <ChartBarIcon className="w-5 h-5" />
                  データ管理
                </h3>
                <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                  <li>� <strong>データオブジェクト</strong> - 入出力データを明確化</li>
                  <li>� <strong>前工程・次工程</strong> - フロー制御を明確に</li>
                  <li>📋 <strong>Excel連携</strong> - インポート/エクスポート対応</li>
                  <li>💾 <strong>バージョン管理</strong> - スナップショット作成・復元</li>
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
                  <h4 className="font-bold text-lg text-gray-900 dark:text-gray-50 mb-1">工程表を作成</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    プロジェクト詳細画面から「工程表を作成」ボタンをクリック。
                    レベル（L1/L2/L3）を選択して工程表を作成します。
                  </p>
                  <Code className="text-xs">工程表名、レベル、説明を入力 → 作成</Code>
                </div>
              </li>
              
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg shadow-lg">3</span>
                <div className="flex-1">
                  <h4 className="font-bold text-lg text-gray-900 dark:text-gray-50 mb-1">スイムレーンを設定</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    工程表詳細画面の「スイムレーン」タブで担当部門や役割ごとにレーンを作成。
                    各工程は1つのレーンに所属します。
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    <Chip size="sm" color="primary" variant="flat">営業部</Chip>
                    <Chip size="sm" color="secondary" variant="flat">開発部</Chip>
                    <Chip size="sm" color="success" variant="flat">品質管理</Chip>
                  </div>
                </div>
              </li>
              
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg shadow-lg">4</span>
                <div className="flex-1">
                  <h4 className="font-bold text-lg text-gray-900 dark:text-gray-50 mb-1">工程を追加</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    「工程一覧」タブで「工程追加」ボタンをクリック。
                    工程名、スイムレーン、タスクタイプ、前工程を設定します。
                  </p>
                  <Code className="text-xs">工程一覧 → 工程追加 → 情報入力 → 保存</Code>
                </div>
              </li>
              
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg shadow-lg">5</span>
                <div className="flex-1">
                  <h4 className="font-bold text-lg text-gray-900 dark:text-gray-50 mb-1">BPMNフローを確認</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    「BPMNフロー図」タブで作成した工程がビジュアルに表示されます。
                    自動レイアウト機能でプロセスフローを整理できます。
                  </p>
                  <Code className="text-xs">BPMNフロー図 → 自動レイアウト</Code>
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

              {/* 工程表管理 */}
              <AccordionItem
                key="process-table"
                aria-label="工程表管理"
                title={
                  <div className="flex items-center gap-3">
                    <ChartBarIcon className="w-6 h-6 text-purple-500" />
                    <span className="font-bold text-lg">2. 工程表管理</span>
                  </div>
                }
              >
                <div className="space-y-4 pl-9">
                  <div>
                    <h4 className="font-semibold mb-2 text-gray-900 dark:text-gray-50">📊 工程表とは</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      <strong>工程表（Process Table）</strong>は、プロジェクト内のプロセスを管理する単位です。
                      3段階のレベル（L1/L2/L3）で整理し、各工程表にはスイムレーン、カスタム列、
                      データオブジェクトを設定できます。
                    </p>
                    <div className="space-y-2 text-sm">
                      <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 p-3 rounded">
                        <p className="font-semibold text-blue-700 dark:text-blue-300 mb-2">✨ 工程表の特徴:</p>
                        <ul className="space-y-1 text-gray-700 dark:text-gray-300">
                          <li>• <strong>3段階レベル</strong> - L1（大分類）、L2（中分類）、L3（小分類）</li>
                          <li>• <strong>スイムレーン管理</strong> - 担当部門・役割ごとに整理</li>
                          <li>• <strong>カスタム列</strong> - 工程表ごとに最大30列まで追加可能</li>
                          <li>• <strong>データオブジェクト</strong> - 入出力データを明確化</li>
                          <li>• <strong>BPMN 2.0準拠</strong> - 標準的なプロセス表現</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  
                  <Divider />
                  
                  <div>
                    <h4 className="font-semibold mb-2 text-gray-900 dark:text-gray-50">➕ 工程表の作成</h4>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
                      <li>プロジェクト詳細画面で「工程表を作成」ボタンをクリック</li>
                      <li>工程表名を入力（例：「受注プロセス」「製造プロセス」）</li>
                      <li>レベルを選択（L1/L2/L3）</li>
                      <li>説明を入力（任意）</li>
                      <li>「作成」ボタンをクリック</li>
                    </ol>
                    <div className="mt-2 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 p-3 rounded">
                      <p className="text-xs text-green-700 dark:text-green-300">
                        💡 ヒント: 作成時にスイムレーンやカスタム列を同時に設定できます
                      </p>
                    </div>
                  </div>
                  
                  <Divider />
                  
                  <div>
                    <h4 className="font-semibold mb-2 text-gray-900 dark:text-gray-50">🏊 スイムレーン管理</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      <strong>スイムレーン</strong>は担当部門や役割を表します。各工程は必ず1つのレーンに所属し、
                      BPMNフロー図でもレーンごとに視覚的に表示されます。
                    </p>
                    <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                      <li>• <strong>レーン作成</strong> - 工程表詳細の「スイムレーン」タブから追加</li>
                      <li>• <strong>レーン編集</strong> - 名前と色を変更可能</li>
                      <li>• <strong>並び替え</strong> - ドラッグ&ドロップで順序変更</li>
                      <li>• <strong>レーン削除</strong> - 所属する工程がない場合のみ削除可能</li>
                    </ul>
                  </div>
                  
                  <Divider />
                  
                  <div>
                    <h4 className="font-semibold mb-2 text-gray-900 dark:text-gray-50">📋 カスタム列</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      工程表に独自の列を追加できます（最大30列）。
                      担当者、工数、ステータス、期限など、プロジェクトに応じた情報を管理できます。
                    </p>
                    <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                      <li>• <strong>列タイプ</strong> - text, number, date, select, multiselect, checkbox, url</li>
                      <li>• <strong>必須設定</strong> - 入力を必須にできます</li>
                      <li>• <strong>選択肢</strong> - selectタイプでは選択肢を定義</li>
                      <li>• <strong>並び順</strong> - orderNumで表示順序を制御</li>
                    </ul>
                  </div>
                  
                  <Divider />
                  
                  <div>
                    <h4 className="font-semibold mb-2 text-gray-900 dark:text-gray-50">➕ 工程の追加</h4>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
                      <li>工程表詳細画面の「工程一覧」タブを選択</li>
                      <li>「工程追加」ボタンをクリック</li>
                      <li>工程名を入力</li>
                      <li>スイムレーンを選択（必須）</li>
                      <li>タスクタイプを選択（userTask, serviceTask等）</li>
                      <li>前工程を設定（任意、複数選択可能）</li>
                      <li>カスタム列の値を入力</li>
                      <li>「保存」をクリック</li>
                    </ol>
                  </div>
                  
                  <Divider />
                  
                  <div>
                    <h4 className="font-semibold mb-2 text-gray-900 dark:text-gray-50">📦 データオブジェクト</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      工程で使用される入出力データを管理します。「データオブジェクト」タブで作成し、
                      各工程に関連付けることで、データフローを明確化できます。
                    </p>
                  </div>
                </div>
              </AccordionItem>

              {/* BPMN */}
              <AccordionItem
                key="bpmn"
                aria-label="BPMNフロー図"
                title={
                  <div className="flex items-center gap-3">
                    <DocumentTextIcon className="w-6 h-6 text-indigo-500" />
                    <span className="font-bold text-lg">3. BPMNフロー図</span>
                  </div>
                }
              >
                <div className="space-y-4 pl-9">
                  <div>
                    <h4 className="font-semibold mb-2 text-gray-900 dark:text-gray-50">🎨 フロー図の表示</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      工程表詳細画面の「BPMNフロー図」タブで、登録した工程がビジュアルに表示されます。
                      工程間の接続関係（前工程・次工程）が自動的にフロー線で表現されます。
                    </p>
                    <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                      <li>• <strong>自動レイアウト</strong> - ELKjsによる階層的な自動配置</li>
                      <li>• <strong>スイムレーン表示</strong> - レーンごとに色分け表示</li>
                      <li>• <strong>タスクタイプアイコン</strong> - BPMN 2.0準拠のアイコン表示</li>
                      <li>• <strong>ズーム/パン</strong> - マウスホイールで拡大縮小、ドラッグで移動</li>
                    </ul>
                  </div>
                  
                  <Divider />
                  
                  <div>
                    <h4 className="font-semibold mb-2 text-gray-900 dark:text-gray-50">📦 BPMN 2.0 要素</h4>
                    <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-gray-50 mb-1">🏊 スイムレーン (Lane)</p>
                        <p>担当部門や役割を表します。工程は必ず1つのレーンに所属します。</p>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-gray-50 mb-1">📋 タスク (Task)</p>
                        <p>7種類のタスクタイプ: userTask（ユーザータスク）、serviceTask（サービスタスク）、
                        manualTask（手動タスク）、scriptTask（スクリプトタスク）、
                        businessRuleTask（ビジネスルールタスク）、sendTask（送信タスク）、receiveTask（受信タスク）</p>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-gray-50 mb-1">⭕ イベント (Event)</p>
                        <p>startEvent（開始）、endEvent（終了）、中間イベント（timer, message, error, signal, conditional）</p>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-gray-50 mb-1">💎 ゲートウェイ (Gateway)</p>
                        <p>exclusiveGateway（排他）、parallelGateway（並列）、inclusiveGateway（包含） - プロセスの分岐・統合</p>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-gray-50 mb-1">➡️ シーケンスフロー</p>
                        <p>工程の前工程設定に基づいて自動的にフロー線が描画されます。条件付きフローにも対応。</p>
                      </div>
                    </div>
                  </div>
                  
                  <Divider />
                  
                  <div>
                    <h4 className="font-semibold mb-2 text-gray-900 dark:text-gray-50">💾 エクスポート</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      BPMN XML形式でエクスポートできます。標準的なBPMN 2.0形式のため、
                      Camunda、Signavio、Bizagi等の他のBPMNツールとの互換性があります。
                    </p>
                    <Code className="text-xs">BPMNフロー図 → エクスポート → BPMN XML</Code>
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
                aria-label="スイムレーンが作成できない"
                title={
                  <div className="flex items-center gap-2">
                    <ExclamationTriangleIcon className="w-5 h-5 text-blue-500" />
                    <span className="font-semibold">スイムレーンが作成できない</span>
                  </div>
                }
              >
                <div className="space-y-3 pl-7 text-sm">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-50 mb-1">確認事項：</p>
                    <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                      <li>✓ 工程表詳細画面の「スイムレーン」タブを開いているか確認</li>
                      <li>✓ スイムレーン名が入力されているか確認</li>
                      <li>✓ 同じ名前のレーンが既に存在しないか確認</li>
                      <li>✓ ページをリロードして再試行</li>
                    </ul>
                  </div>
                </div>
              </AccordionItem>

              <AccordionItem
                key="ts4"
                aria-label="工程表が表示されない"
                title={
                  <div className="flex items-center gap-2">
                    <ExclamationTriangleIcon className="w-5 h-5 text-purple-500" />
                    <span className="font-semibold">工程表が表示されない</span>
                  </div>
                }
              >
                <div className="space-y-3 pl-7 text-sm">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-50 mb-1">対処法：</p>
                    <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                      <li>✓ プロジェクト詳細画面で工程表が作成されているか確認</li>
                      <li>✓ ページをリロード（F5またはCtrl+R）</li>
                      <li>✓ アプリを再起動してみる</li>
                      <li>✓ データベースファイルが破損していないか確認</li>
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
                      <li>✓ バージョン管理機能がある場合は過去のスナップショットを確認</li>
                      <li>✓ データベースファイルのバックアップがあれば復元</li>
                      <li>✓ 定期的にExcelエクスポートでバックアップを作成することを推奨</li>
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
                aria-label="工程表とは何ですか？"
                title="工程表とは何ですか？"
              >
                <div className="text-sm text-gray-600 dark:text-gray-400 pl-4 space-y-2">
                  <p>
                    <strong>工程表（Process Table）</strong>は、プロジェクト内のプロセスを管理する単位です。
                    3段階のレベル（L1/L2/L3）で整理し、各工程表にスイムレーン、カスタム列、
                    データオブジェクトを設定できます。
                  </p>
                  <p>
                    各工程は<strong>スイムレーン（担当部門・役割）</strong>に所属し、
                    前工程・次工程を設定することでフロー制御を明確にします。
                  </p>
                </div>
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
                aria-label="カスタム列とは何ですか？"
                title="カスタム列とは何ですか？"
              >
                <div className="text-sm text-gray-600 dark:text-gray-400 pl-4 space-y-2">
                  <p>
                    工程表に独自の項目を追加できる機能です。
                    担当者、工数、ステータス、期限など、プロジェクトに応じた情報を管理できます。
                  </p>
                  <ul className="space-y-1">
                    <li>• <strong>列タイプ</strong>: テキスト、数値、日付、選択肢、チェックボックス</li>
                    <li>• <strong>必須設定</strong>: 入力を必須にできます</li>
                    <li>• <strong>並び順</strong>: ドラッグ&ドロップで調整可能</li>
                  </ul>
                </div>
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
              <Chip color="success" variant="flat" size="lg">最終更新: 2025年10月24日</Chip>
              <Chip color="secondary" variant="flat" size="lg">BPMN 2.0準拠</Chip>
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

