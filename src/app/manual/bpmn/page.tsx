'use client';

import { Card, CardBody, CardHeader, Chip, Divider } from '@heroui/react';
import { AppLayout } from '@/components';
import {
  DocumentTextIcon,
  CubeIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  BeakerIcon,
} from '@heroicons/react/24/outline';

export default function BpmnManualPage() {
  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-8 pb-20">
        {/* ヘッダー */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
              <CubeIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-900 to-blue-700 dark:from-blue-50 dark:to-blue-300 bg-clip-text text-transparent">
                BPMN 2.0 完全ガイド
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                ビジネスプロセスモデリング表記の標準規格
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Chip size="sm" color="primary" variant="flat">バージョン 2.0</Chip>
            <Chip size="sm" color="success" variant="flat">OMG標準</Chip>
            <Chip size="sm" color="warning" variant="flat">ISO/IEC 19510</Chip>
          </div>
        </div>

        {/* 目次 */}
        <Card className="shadow-sm">
          <CardHeader className="p-6 pb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-50">目次</h2>
          </CardHeader>
          <CardBody className="p-6 pt-0">
            <nav className="space-y-2">
              <a href="#overview" className="block text-blue-600 dark:text-blue-400 hover:underline">1. BPMN 2.0とは</a>
              <a href="#elements" className="block text-blue-600 dark:text-blue-400 hover:underline ml-4">1.1 基本要素の種類</a>
              <a href="#flow-objects" className="block text-blue-600 dark:text-blue-400 hover:underline">2. フローオブジェクト</a>
              <a href="#events" className="block text-blue-600 dark:text-blue-400 hover:underline ml-4">2.1 イベント</a>
              <a href="#activities" className="block text-blue-600 dark:text-blue-400 hover:underline ml-4">2.2 アクティビティ</a>
              <a href="#gateways" className="block text-blue-600 dark:text-blue-400 hover:underline ml-4">2.3 ゲートウェイ</a>
              <a href="#connecting-objects" className="block text-blue-600 dark:text-blue-400 hover:underline">3. 接続オブジェクト</a>
              <a href="#swimlanes" className="block text-blue-600 dark:text-blue-400 hover:underline">4. スイムレーン</a>
              <a href="#artifacts" className="block text-blue-600 dark:text-blue-400 hover:underline">5. アーティファクト</a>
              <a href="#best-practices" className="block text-blue-600 dark:text-blue-400 hover:underline">6. ベストプラクティス</a>
              <a href="#compliance" className="block text-blue-600 dark:text-blue-400 hover:underline">7. 本ツールの準拠状況</a>
            </nav>
          </CardBody>
        </Card>

        {/* 1. BPMN 2.0とは */}
        <Card className="shadow-sm" id="overview">
          <CardHeader className="p-6 pb-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50">1. BPMN 2.0とは</h2>
          </CardHeader>
          <CardBody className="p-6 pt-0 space-y-4">
            <p className="text-gray-700 dark:text-gray-300">
              <strong>BPMN (Business Process Model and Notation)</strong>は、ビジネスプロセスを視覚的に表現するための標準的な記法です。
              Object Management Group (OMG)によって策定され、ISO/IEC 19510として国際標準化されています。
            </p>

            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">BPMN 2.0の主な目的</h3>
              <ul className="list-disc list-inside space-y-1 text-blue-800 dark:text-blue-200">
                <li>ビジネスプロセスの標準化された視覚表現</li>
                <li>技術者と非技術者間の共通言語の提供</li>
                <li>プロセスの自動実行可能な定義</li>
                <li>異なるツール間での相互運用性</li>
              </ul>
            </div>

            <div id="elements">
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-50 mb-3">1.1 基本要素の種類</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="shadow-sm">
                  <CardBody className="p-4">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-50 mb-2">フローオブジェクト</h4>
                    <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                      <li>• イベント（Event）</li>
                      <li>• アクティビティ（Activity）</li>
                      <li>• ゲートウェイ（Gateway）</li>
                    </ul>
                  </CardBody>
                </Card>

                <Card className="shadow-sm">
                  <CardBody className="p-4">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-50 mb-2">接続オブジェクト</h4>
                    <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                      <li>• シーケンスフロー</li>
                      <li>• メッセージフロー</li>
                      <li>• アソシエーション</li>
                    </ul>
                  </CardBody>
                </Card>

                <Card className="shadow-sm">
                  <CardBody className="p-4">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-50 mb-2">スイムレーン</h4>
                    <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                      <li>• プール（Pool）</li>
                      <li>• レーン（Lane）</li>
                    </ul>
                  </CardBody>
                </Card>

                <Card className="shadow-sm">
                  <CardBody className="p-4">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-50 mb-2">アーティファクト</h4>
                    <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                      <li>• データオブジェクト</li>
                      <li>• グループ</li>
                      <li>• アノテーション（注釈）</li>
                    </ul>
                  </CardBody>
                </Card>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* 2. フローオブジェクト */}
        <Card className="shadow-sm" id="flow-objects">
          <CardHeader className="p-6 pb-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50">2. フローオブジェクト</h2>
          </CardHeader>
          <CardBody className="p-6 pt-0 space-y-6">
            {/* 2.1 イベント */}
            <div id="events">
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-50 mb-3">2.1 イベント（Events）</h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                イベントは、プロセスの実行中に発生する「何か」を表します。プロセスの開始、途中、終了時に発生します。
              </p>

              <div className="space-y-4">
                <Card className="shadow-sm bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
                  <CardBody className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full border-2 border-green-600 flex items-center justify-center flex-shrink-0">
                        <div className="w-2 h-2 rounded-full bg-green-600"></div>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">開始イベント（Start Event）</h4>
                        <p className="text-sm text-green-800 dark:text-green-200 mb-2">
                          プロセスインスタンスの開始を示します。細い円で表現されます。
                        </p>
                        <div className="text-sm text-green-800 dark:text-green-200">
                          <strong>種類:</strong>
                          <ul className="list-disc list-inside ml-2 mt-1">
                            <li>None（無印）: トリガーなしで開始</li>
                            <li>Message: メッセージ受信で開始</li>
                            <li>Timer: 時間ベースで開始</li>
                            <li>Conditional: 条件満足で開始</li>
                            <li>Signal: シグナル受信で開始</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </CardBody>
                </Card>

                <Card className="shadow-sm bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800">
                  <CardBody className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full border-2 border-yellow-600 flex items-center justify-center flex-shrink-0">
                        <div className="w-4 h-4 rounded-full border border-yellow-600"></div>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">中間イベント（Intermediate Event）</h4>
                        <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-2">
                          プロセスの実行中に発生するイベント。二重円で表現されます。
                        </p>
                        <div className="text-sm text-yellow-800 dark:text-yellow-200">
                          <strong>キャッチング（Catching）:</strong> イベントの発生を待つ
                          <ul className="list-disc list-inside ml-2 mt-1">
                            <li>Message: メッセージ待機</li>
                            <li>Timer: タイマー待機</li>
                            <li>Conditional: 条件待機</li>
                            <li>Signal: シグナル待機</li>
                            <li>Link: リンク接続先</li>
                          </ul>
                          <strong className="block mt-2">スローイング（Throwing）:</strong> イベントを発生させる
                          <ul className="list-disc list-inside ml-2 mt-1">
                            <li>Message: メッセージ送信</li>
                            <li>Signal: シグナル送信</li>
                            <li>Link: リンク接続元</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </CardBody>
                </Card>

                <Card className="shadow-sm bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800">
                  <CardBody className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full border-4 border-red-600 flex items-center justify-center flex-shrink-0">
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-red-900 dark:text-red-100 mb-2">終了イベント（End Event）</h4>
                        <p className="text-sm text-red-800 dark:text-red-200 mb-2">
                          プロセスインスタンスの終了を示します。太い円で表現されます。
                        </p>
                        <div className="text-sm text-red-800 dark:text-red-200">
                          <strong>種類:</strong>
                          <ul className="list-disc list-inside ml-2 mt-1">
                            <li>None（無印）: 正常終了</li>
                            <li>Message: メッセージ送信して終了</li>
                            <li>Error: エラー送出して終了</li>
                            <li>Terminate: すべてのアクティビティを強制終了</li>
                            <li>Signal: シグナル送信して終了</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </div>
            </div>

            <Divider />

            {/* 2.2 アクティビティ */}
            <div id="activities">
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-50 mb-3">2.2 アクティビティ（Activities）</h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                アクティビティは、組織が実行する作業を表します。角丸長方形で表現されます。
              </p>

              <div className="space-y-4">
                <Card className="shadow-sm">
                  <CardBody className="p-4">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-50 mb-2">タスク（Task）</h4>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                      最小単位の作業。プロセスエンジンによって追跡される原子的なアクティビティ。
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div>
                        <strong className="text-gray-900 dark:text-gray-50">User Task（ユーザータスク）</strong>
                        <p className="text-gray-600 dark:text-gray-400">人間が実行する作業</p>
                      </div>
                      <div>
                        <strong className="text-gray-900 dark:text-gray-50">Service Task（サービスタスク）</strong>
                        <p className="text-gray-600 dark:text-gray-400">自動化されたサービス呼び出し</p>
                      </div>
                      <div>
                        <strong className="text-gray-900 dark:text-gray-50">Script Task（スクリプトタスク）</strong>
                        <p className="text-gray-600 dark:text-gray-400">スクリプト実行</p>
                      </div>
                      <div>
                        <strong className="text-gray-900 dark:text-gray-50">Manual Task（手動タスク）</strong>
                        <p className="text-gray-600 dark:text-gray-400">システム外で実行される作業</p>
                      </div>
                      <div>
                        <strong className="text-gray-900 dark:text-gray-50">Business Rule Task</strong>
                        <p className="text-gray-600 dark:text-gray-400">ビジネスルールエンジン呼び出し</p>
                      </div>
                      <div>
                        <strong className="text-gray-900 dark:text-gray-50">Send Task（送信タスク）</strong>
                        <p className="text-gray-600 dark:text-gray-400">メッセージ送信</p>
                      </div>
                      <div>
                        <strong className="text-gray-900 dark:text-gray-50">Receive Task（受信タスク）</strong>
                        <p className="text-gray-600 dark:text-gray-400">メッセージ待機</p>
                      </div>
                    </div>
                  </CardBody>
                </Card>

                <Card className="shadow-sm">
                  <CardBody className="p-4">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-50 mb-2">サブプロセス（Sub-Process）</h4>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      複数のアクティビティを含む複合アクティビティ。プラス記号で識別されます。
                    </p>
                  </CardBody>
                </Card>

                <Card className="shadow-sm">
                  <CardBody className="p-4">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-50 mb-2">コールアクティビティ（Call Activity）</h4>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      別のプロセスを呼び出す再利用可能なアクティビティ。太い枠線で表現されます。
                    </p>
                  </CardBody>
                </Card>
              </div>
            </div>

            <Divider />

            {/* 2.3 ゲートウェイ */}
            <div id="gateways">
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-50 mb-3">2.3 ゲートウェイ（Gateways）</h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                ゲートウェイは、プロセスフロー内の分岐と合流を制御します。ひし形で表現されます。
              </p>

              <div className="space-y-4">
                <Card className="shadow-sm bg-purple-50 dark:bg-purple-950 border border-purple-200 dark:border-purple-800">
                  <CardBody className="p-4">
                    <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">
                      排他ゲートウェイ（Exclusive Gateway）- XOR
                    </h4>
                    <p className="text-sm text-purple-800 dark:text-purple-200 mb-2">
                      条件に基づいて1つのパスのみを選択します。最も一般的なゲートウェイです。
                    </p>
                    <div className="text-sm text-purple-800 dark:text-purple-200">
                      <strong>記号:</strong> ×マーク（または空）<br/>
                      <strong>分岐:</strong> 条件を評価し、最初に真となるパスを選択<br/>
                      <strong>合流:</strong> いずれか1つのパスが到達すれば続行<br/>
                      <strong>用途:</strong> 「もし～ならば、そうでなければ」の判断
                    </div>
                  </CardBody>
                </Card>

                <Card className="shadow-sm bg-indigo-50 dark:bg-indigo-950 border border-indigo-200 dark:border-indigo-800">
                  <CardBody className="p-4">
                    <h4 className="font-semibold text-indigo-900 dark:text-indigo-100 mb-2">
                      並列ゲートウェイ（Parallel Gateway）- AND
                    </h4>
                    <p className="text-sm text-indigo-800 dark:text-indigo-200 mb-2">
                      すべてのパスを同時に実行します。
                    </p>
                    <div className="text-sm text-indigo-800 dark:text-indigo-200">
                      <strong>記号:</strong> +マーク<br/>
                      <strong>分岐:</strong> すべてのパスを同時に開始<br/>
                      <strong>合流:</strong> すべてのパスが到達するまで待機<br/>
                      <strong>用途:</strong> 並行作業の実行
                    </div>
                  </CardBody>
                </Card>

                <Card className="shadow-sm bg-cyan-50 dark:bg-cyan-950 border border-cyan-200 dark:border-cyan-800">
                  <CardBody className="p-4">
                    <h4 className="font-semibold text-cyan-900 dark:text-cyan-100 mb-2">
                      包含ゲートウェイ（Inclusive Gateway）- OR
                    </h4>
                    <p className="text-sm text-cyan-800 dark:text-cyan-200 mb-2">
                      条件が真の複数のパスを実行します。
                    </p>
                    <div className="text-sm text-cyan-800 dark:text-cyan-200">
                      <strong>記号:</strong> ○マーク<br/>
                      <strong>分岐:</strong> 条件が真のすべてのパスを開始<br/>
                      <strong>合流:</strong> 開始されたすべてのパスが到達するまで待機<br/>
                      <strong>用途:</strong> 複数の条件が同時に成立する場合
                    </div>
                  </CardBody>
                </Card>

                <Card className="shadow-sm">
                  <CardBody className="p-4">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-50 mb-2">
                      イベントベースゲートウェイ（Event-Based Gateway）
                    </h4>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      複数のイベントのうち、最初に発生したイベントに基づいてパスを選択します。
                    </p>
                  </CardBody>
                </Card>

                <Card className="shadow-sm">
                  <CardBody className="p-4">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-50 mb-2">
                      複合ゲートウェイ（Complex Gateway）
                    </h4>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      複雑な分岐/合流ロジックに使用します。*マークで表現されます。
                    </p>
                  </CardBody>
                </Card>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* 3. 接続オブジェクト */}
        <Card className="shadow-sm" id="connecting-objects">
          <CardHeader className="p-6 pb-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50">3. 接続オブジェクト</h2>
          </CardHeader>
          <CardBody className="p-6 pt-0 space-y-4">
            <div className="space-y-4">
              <Card className="shadow-sm">
                <CardBody className="p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-50 mb-2">
                    シーケンスフロー（Sequence Flow）
                  </h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                    アクティビティの実行順序を定義します。実線の矢印で表現されます。
                  </p>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <strong>種類:</strong>
                    <ul className="list-disc list-inside ml-2 mt-1">
                      <li>Normal Flow: 通常のフロー</li>
                      <li>Conditional Flow: 条件付きフロー（ゲートウェイからの出力）</li>
                      <li>Default Flow: デフォルトフロー（他の条件が満たされない場合）</li>
                    </ul>
                  </div>
                </CardBody>
              </Card>

              <Card className="shadow-sm">
                <CardBody className="p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-50 mb-2">
                    メッセージフロー（Message Flow）
                  </h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    異なるプール間のメッセージ交換を表します。破線の矢印で表現されます。
                  </p>
                </CardBody>
              </Card>

              <Card className="shadow-sm">
                <CardBody className="p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-50 mb-2">
                    アソシエーション（Association）
                  </h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    アーティファクトとフローオブジェクトを関連付けます。点線で表現されます。
                  </p>
                </CardBody>
              </Card>
            </div>
          </CardBody>
        </Card>

        {/* 4. スイムレーン */}
        <Card className="shadow-sm" id="swimlanes">
          <CardHeader className="p-6 pb-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50">4. スイムレーン</h2>
          </CardHeader>
          <CardBody className="p-6 pt-0 space-y-4">
            <p className="text-gray-700 dark:text-gray-300">
              スイムレーンは、プロセス内の責任範囲を視覚的に整理するために使用します。
            </p>

            <div className="space-y-4">
              <Card className="shadow-sm bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
                <CardBody className="p-4">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">プール（Pool）</h4>
                  <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
                    組織またはプロセス参加者を表す最上位のコンテナです。
                  </p>
                  <div className="text-sm text-blue-800 dark:text-blue-200">
                    <ul className="list-disc list-inside ml-2">
                      <li>異なるプール間ではメッセージフローのみ使用可能</li>
                      <li>各プールは独立したプロセスを表す</li>
                      <li>プール名は参加者を識別する</li>
                    </ul>
                  </div>
                </CardBody>
              </Card>

              <Card className="shadow-sm bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
                <CardBody className="p-4">
                  <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">レーン（Lane）</h4>
                  <p className="text-sm text-green-800 dark:text-green-200 mb-2">
                    プール内の役割や部門を表すサブパーティションです。
                  </p>
                  <div className="text-sm text-green-800 dark:text-green-200">
                    <ul className="list-disc list-inside ml-2">
                      <li>同じプール内の異なる責任範囲を整理</li>
                      <li>レーン間ではシーケンスフローが使用可能</li>
                      <li>各アクティビティは1つのレーンに配置</li>
                    </ul>
                  </div>
                </CardBody>
              </Card>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <h4 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
                本ツールでのスイムレーン管理
              </h4>
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                工程表の「スイムレーン」列で各工程の所属レーンを指定できます。
                BPMNエクスポート時に自動的にレーン構造が生成されます。
              </p>
            </div>
          </CardBody>
        </Card>

        {/* 5. アーティファクト */}
        <Card className="shadow-sm" id="artifacts">
          <CardHeader className="p-6 pb-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50">5. アーティファクト</h2>
          </CardHeader>
          <CardBody className="p-6 pt-0 space-y-4">
            <p className="text-gray-700 dark:text-gray-300">
              アーティファクトは、プロセスに関する追加情報を提供します。
            </p>

            <div className="space-y-4">
              <Card className="shadow-sm">
                <CardBody className="p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-50 mb-2">データオブジェクト（Data Object）</h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    アクティビティで使用または生成されるデータを表します。ドキュメントアイコンで表現されます。
                  </p>
                </CardBody>
              </Card>

              <Card className="shadow-sm">
                <CardBody className="p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-50 mb-2">グループ（Group）</h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    関連する要素を視覚的にグループ化します。点線の角丸長方形で表現されます。
                  </p>
                </CardBody>
              </Card>

              <Card className="shadow-sm">
                <CardBody className="p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-50 mb-2">アノテーション（Annotation）</h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    要素に対する追加のテキスト情報を提供します。
                  </p>
                </CardBody>
              </Card>
            </div>
          </CardBody>
        </Card>

        {/* 6. ベストプラクティス */}
        <Card className="shadow-sm" id="best-practices">
          <CardHeader className="p-6 pb-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50">6. ベストプラクティス</h2>
          </CardHeader>
          <CardBody className="p-6 pt-0 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="shadow-sm bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
                <CardBody className="p-4">
                  <div className="flex items-start gap-2">
                    <CheckCircleIcon className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-green-900 dark:text-green-100 mb-1">推奨事項</h4>
                      <ul className="text-sm text-green-800 dark:text-green-200 space-y-1">
                        <li>• 開始イベントと終了イベントを必ず配置</li>
                        <li>• アクティビティ名は動詞で開始</li>
                        <li>• 適切なゲートウェイタイプを選択</li>
                        <li>• スイムレーンで責任を明確化</li>
                        <li>• シーケンスフローに条件を明記</li>
                      </ul>
                    </div>
                  </div>
                </CardBody>
              </Card>

              <Card className="shadow-sm bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800">
                <CardBody className="p-4">
                  <div className="flex items-start gap-2">
                    <XCircleIcon className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-red-900 dark:text-red-100 mb-1">避けるべき事項</h4>
                      <ul className="text-sm text-red-800 dark:text-red-200 space-y-1">
                        <li>• 複数の開始/終了イベントの乱用</li>
                        <li>• 過度に複雑なフロー</li>
                        <li>• 不明確なゲートウェイ条件</li>
                        <li>• クロスレーンのシーケンスフロー</li>
                        <li>• 不要なサブプロセス</li>
                      </ul>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </div>

            <Card className="shadow-sm bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
              <CardBody className="p-4">
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">モデリングのコツ</h4>
                <div className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
                  <p><strong>1. 段階的な詳細化:</strong> まず高レベルのフローを作成し、段階的に詳細化します。</p>
                  <p><strong>2. 一貫性の維持:</strong> 命名規則や表記方法を統一します。</p>
                  <p><strong>3. レイアウトの最適化:</strong> 左から右、上から下の読みやすいレイアウトを心がけます。</p>
                  <p><strong>4. ドキュメント化:</strong> 重要な判断基準やビジネスルールを注釈で補足します。</p>
                  <p><strong>5. 検証とレビュー:</strong> 関係者とレビューし、実際のプロセスとの整合性を確認します。</p>
                </div>
              </CardBody>
            </Card>
          </CardBody>
        </Card>

        {/* 7. 本ツールの準拠状況 */}
        <Card className="shadow-sm" id="compliance">
          <CardHeader className="p-6 pb-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50">7. 本ツールのBPMN 2.0準拠状況</h2>
          </CardHeader>
          <CardBody className="p-6 pt-0 space-y-4">
            <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircleIcon className="w-6 h-6 text-green-600" />
                <h3 className="font-semibold text-green-900 dark:text-green-100">完全準拠</h3>
              </div>
              <p className="text-sm text-green-800 dark:text-green-200 mb-3">
                本ツールはBPMN 2.0標準に準拠しており、標準仕様のXML形式でエクスポートできます。
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-50 mb-2 flex items-center gap-2">
                  <CheckCircleIcon className="w-5 h-5 text-green-600" />
                  対応済み要素
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <div>✅ 開始/中間/終了イベント（5種類）</div>
                  <div>✅ タスク（7種類）</div>
                  <div>✅ ゲートウェイ（3種類：排他/並列/包含）</div>
                  <div>✅ スイムレーン（Pool/Lane）</div>
                  <div>✅ シーケンスフロー</div>
                  <div>✅ データオブジェクト</div>
                  <div>✅ アノテーション</div>
                  <div>✅ カスタム列統合</div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-50 mb-2 flex items-center gap-2">
                  <BeakerIcon className="w-5 h-5 text-blue-600" />
                  高度な機能
                </h4>
                <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                  <div>🔧 ELK自動レイアウト（4つのアルゴリズム）</div>
                  <div>🔧 bpmn-js統合（視覚的編集）</div>
                  <div>🔧 三位一体同期（BPMN ⇔ 工程表 ⇔ マニュアル）</div>
                  <div>🔧 XMLエクスポート/インポート</div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-50 mb-2">互換性</h4>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  エクスポートされたBPMN XMLファイルは、以下のツールと互換性があります：
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Chip size="sm" variant="flat">Camunda</Chip>
                  <Chip size="sm" variant="flat">Signavio</Chip>
                  <Chip size="sm" variant="flat">Bizagi</Chip>
                  <Chip size="sm" variant="flat">Activiti</Chip>
                  <Chip size="sm" variant="flat">jBPM</Chip>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">さらに詳しく</h4>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                BPMN 2.0の完全な仕様については、OMGの公式ドキュメントを参照してください：<br/>
                <a 
                  href="https://www.omg.org/spec/BPMN/2.0/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="underline hover:text-blue-600 dark:hover:text-blue-400"
                >
                  https://www.omg.org/spec/BPMN/2.0/
                </a>
              </p>
            </div>
          </CardBody>
        </Card>

        {/* フッター */}
        <div className="text-center text-sm text-gray-500 dark:text-gray-400 pt-8 border-t border-gray-200 dark:border-gray-700">
          <p>最終更新: 2025年10月23日</p>
          <p className="mt-2">本ドキュメントはBPMN 2.0仕様に基づいて作成されています。</p>
        </div>
      </div>
    </AppLayout>
  );
}
