'use client';

import { Card, CardBody, Button } from '@heroui/react';
import { AppLayout } from '@/components/layout/AppLayout';
import Link from 'next/link';
import {
  PlusIcon,
  BookOpenIcon,
  DocumentTextIcon,
  SwatchIcon,
  TableCellsIcon,
} from '@heroicons/react/24/outline';

export default function Home() {
  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto p-6 space-y-10">
        {/* ヘッダー */}
        <div className="text-center space-y-4 pt-8">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-gray-50">
            Output Management Tool
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            業務プロセスを工程表で管理し、BPMN 2.0でビジュアル化
          </p>
          <div className="flex gap-4 justify-center pt-4">
            <Button
              as={Link}
              href="/projects"
              color="primary"
              size="lg"
              startContent={<PlusIcon className="w-5 h-5" />}
            >
              プロジェクトを作成
            </Button>
            <Button
              as={Link}
              href="/manual"
              variant="bordered"
              size="lg"
              startContent={<BookOpenIcon className="w-5 h-5" />}
            >
              マニュアルを見る
            </Button>
          </div>
        </div>

        {/* PRポイント */}
        <Card className="shadow-sm bg-linear-to-br from-emerald-50 to-cyan-50 dark:from-emerald-950 dark:to-cyan-950 border-l-4 border-emerald-500">
          <CardBody className="p-6 space-y-3">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50">PRポイント</h2>
            <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300 space-y-1">
              <li>工程表からBPMN 2.0工程フローを自動生成・自動レイアウト</li>
              <li>プロセスフローの編集がリアルタイムに工程表へ同期反映（双方向更新）</li>
              <li>全フィールド対応のCSVインポート・エクスポートで大量登録が簡単</li>
              <li>スイムレーン・工程を一元管理し、差分なくUIで確認</li>
              {/* <li>完全ローカル動作でオフラインでも安心、スナップショットで復元も可能</li> */}
            </ul>
          </CardBody>
        </Card>

        {/* 主な機能 */}
        <div>
          <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-50">
            主な機能
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="shadow-sm">
              <CardBody className="p-5">
                <div className="flex items-start gap-3">
                  <div className="bg-blue-500 bg-opacity-10 p-2 rounded-lg shrink-0">
                    <TableCellsIcon className="w-6 h-6 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1 text-gray-900 dark:text-gray-50">
                      工程表管理
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      工程レベル、スイムレーン、カスタム列で柔軟な管理
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card className="shadow-sm">
              <CardBody className="p-5">
                <div className="flex items-start gap-3">
                  <div className="bg-purple-500 bg-opacity-10 p-2 rounded-lg shrink-0">
                    <DocumentTextIcon className="w-6 h-6 text-purple-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1 text-gray-900 dark:text-gray-50">
                      BPMNフロー図
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      工程表から自動生成、ビジュアルで確認
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card className="shadow-sm">
              <CardBody className="p-5">
                <div className="flex items-start gap-3">
                  <div className="bg-green-500 bg-opacity-10 p-2 rounded-lg shrink-0">
                    <DocumentTextIcon className="w-6 h-6 text-green-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1 text-gray-900 dark:text-gray-50">
                      Excel連携
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Excelからインポート・エクスポートで効率化
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card className="shadow-sm">
              <CardBody className="p-5">
                <div className="flex items-start gap-3">
                  <div className="bg-amber-500 bg-opacity-10 p-2 rounded-lg shrink-0">
                    <SwatchIcon className="w-6 h-6 text-amber-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1 text-gray-900 dark:text-gray-50">
                      データオブジェクト
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      工程に紐付く成果物や関連データの管理
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>

        {/* 近日追加予定 */}
        <Card className="shadow-sm bg-linear-to-br from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950 border-l-4 border-amber-500">
          <CardBody className="p-6 space-y-3">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50">近日追加予定</h2>
            <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300 space-y-1">
              <li>共同編集機能（オンライン保存）</li>
              <li>アクセス制限とアクセス権管理</li>
              <li>BPMNフローのExcel出力（オブジェクト描画付き）</li>
              <li>工程表の成形済みExcel/xlsm出力（CSV以外での帳票化）</li>
              <li>マニュアルテンプレートの自動作成</li>
              <li>生成AIによるマニュアルたたき台の自動作成</li>
              <li>データオブジェクト等の各種BPMNオブジェクト対応を拡充</li>
              <li>ほか改善・自動化を順次追加予定</li>
            </ul>
          </CardBody>
        </Card>

        {/* クイックガイド */}
        <Card className="shadow-sm bg-linear-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-l-4 border-blue-500">
          <CardBody className="p-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-50">
              使い方
            </h2>
            <ol className="space-y-3 text-sm">
              <li className="flex gap-3">
                <span className="font-bold text-blue-600 dark:text-blue-400 shrink-0 text-lg">1.</span>
                <span className="text-gray-700 dark:text-gray-300">
                  プロジェクトを作成
                </span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-blue-600 dark:text-blue-400 shrink-0 text-lg">2.</span>
                <span className="text-gray-700 dark:text-gray-300">
                  工程表を作成（工程レベルを選択）
                </span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-blue-600 dark:text-blue-400 shrink-0 text-lg">3.</span>
                <span className="text-gray-700 dark:text-gray-300">
                  スイムレーンを設定（担当者や部門など）
                </span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-blue-600 dark:text-blue-400 shrink-0 text-lg">4.</span>
                <span className="text-gray-700 dark:text-gray-300">
                  工程を追加（手動入力またはExcelインポート）
                </span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-blue-600 dark:text-blue-400 shrink-0 text-lg">5.</span>
                <span className="text-gray-700 dark:text-gray-300">
                  BPMNフロー図でプロセスを視覚的に確認
                </span>
              </li>
            </ol>
            <div className="mt-6 flex gap-3">
              <Button
                as={Link}
                href="/projects"
                color="primary"
                size="lg"
                startContent={<PlusIcon className="w-5 h-5" />}
              >
                今すぐ始める
              </Button>
              <Button
                as={Link}
                href="/manual"
                variant="bordered"
                size="lg"
                startContent={<BookOpenIcon className="w-5 h-5" />}
              >
                詳しく見る
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    </AppLayout>
  );
}
